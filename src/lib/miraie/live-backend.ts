// Live MirAIe: REST for sign-in, home and status; one MQTT session for commands and pushes.
// No refresh endpoint is known, so on a REST 401 or a refused/dropped MQTT connection the client
// signs in again once with the stored password; if MirAIe still refuses, it reports `signed-out`.
// A command with no status push within 5 s is followed by a REST status refetch (CHILL-002
// AC-8, AC-9).

import { signIn as login, type Session } from './auth';
import { createEmitter, type MiraieBackend } from './backend';
import { COMMAND_CONFIRM_TIMEOUT_MS } from './constants';
import {
  DeviceNotFoundError,
  DeviceOfflineError,
  MiraieNetworkError,
  NotRegisteredError,
  SignedOutError,
  UnauthorizedError,
  WrongCredentialsError,
} from './errors';
import { buildCommandMessage, connectionStatusTopic, controlTopic, statusTopic } from './messages';
import { createMqttSession, type CloseReason, type MqttSession } from './mqtt/session';
import type { SocketFactory } from './mqtt/socket-types';
import { fetchHome, fetchStatus, type RawStatus } from './rest';
import { parseStatus } from './status';
import type { AcDevice, ConnectionState, CredentialStore, StoredCredentials } from './types';

export interface LiveBackendOptions {
  fetch?: typeof globalThis.fetch;
  socketFactory: SocketFactory;
  credentials: CredentialStore;
  /** Override the broker (tests run against a local aedes). */
  mqtt?: { host?: string; port?: number; keepalive?: number };
  commandConfirmTimeoutMs?: number;
  /** First reconnect delay after a drop; doubles up to 30 s. */
  reconnectDelayMs?: number;
  /** How long `send` waits for the live connection before giving up. */
  connectWaitMs?: number;
}

const MAX_RECONNECT_DELAY_MS = 30_000;

const isRejection = (e: unknown) =>
  e instanceof WrongCredentialsError || e instanceof NotRegisteredError;

export function createLiveBackend(options: LiveBackendOptions): MiraieBackend {
  const fetch = options.fetch ?? globalThis.fetch;
  const confirmMs = options.commandConfirmTimeoutMs ?? COMMAND_CONFIRM_TIMEOUT_MS;
  const baseDelay = options.reconnectDelayMs ?? 1000;
  const connectWaitMs = options.connectWaitMs ?? 5000;
  const events = createEmitter();

  let credentials: StoredCredentials | null = null;
  /**
   * Bumped whenever the account changes (sign in, sign out, signed out by MirAIe). Work that
   * awaited the network checks it before touching state, so a re-login or home load that was in
   * flight can never bring old credentials or an old home back.
   */
  let epoch = 0;
  let homeId = '';
  let devices: AcDevice[] = [];
  type TopicTarget = { deviceId: string; kind: 'status' | 'connection' };
  let topics = new Map<string, TopicTarget>();
  let raw: Record<string, RawStatus> = {};
  let session: MqttSession | null = null;
  let relogin: Promise<string> | null = null;
  /** The token in use came from a re-login just now: another refusal means signed out. */
  let tokenIsFresh = false;
  let reconnectDelay = baseDelay;
  let reconnectTimer: ReturnType<typeof setTimeout> | undefined;
  let connectionWaiters: (() => void)[] = [];
  const confirmTimers = new Map<string, ReturnType<typeof setTimeout>>();

  // ── account ──────────────────────────────────────────────────────────────────────────

  async function adopt(loginId: string, password: string, s: Session) {
    credentials = { loginId, password, ...s };
    await options.credentials.save(credentials);
  }

  function teardown() {
    clearTimeout(reconnectTimer);
    for (const timer of confirmTimers.values()) clearTimeout(timer);
    confirmTimers.clear();
    const closing = session;
    session = null;
    closing?.close();
    homeId = '';
    devices = [];
    topics = new Map();
    raw = {};
    relogin = null;
    tokenIsFresh = false;
    for (const resolve of connectionWaiters) resolve();
    connectionWaiters = [];
  }

  async function signedOut() {
    if (!credentials) return;
    epoch++;
    credentials = null;
    teardown();
    await options.credentials.clear();
    events.emit({ type: 'signed-out' });
  }

  /** True while the account that started some work (at `started`) is still the current one. */
  const sameAccount = (started: number) => epoch === started && credentials !== null;

  /** One re-login at a time; MirAIe refusing the stored password signs the user out. */
  function renewToken(): Promise<string> {
    if (!credentials) return Promise.reject(new SignedOutError());
    if (relogin) return relogin;
    const { loginId, password } = credentials;
    const started = epoch;
    const attempt = login(loginId, password, { fetch })
      .then(async (s) => {
        if (!sameAccount(started)) throw new SignedOutError();
        await adopt(loginId, password, s);
        return s.accessToken;
      })
      .catch(async (error: unknown) => {
        if (isRejection(error)) {
          if (sameAccount(started)) await signedOut();
          throw new SignedOutError();
        }
        throw error;
      })
      .finally(() => {
        if (relogin === attempt) relogin = null;
      });
    relogin = attempt;
    return attempt;
  }

  /** Runs a REST call; on 401 renews the token once and retries; a second 401 signs out. */
  async function withToken<T>(call: (token: string) => Promise<T>): Promise<T> {
    if (!credentials) throw new SignedOutError();
    const started = epoch;
    const settle = (result: T) => {
      if (!sameAccount(started)) throw new SignedOutError();
      return result;
    };
    try {
      return settle(await call(credentials.accessToken));
    } catch (error) {
      if (!(error instanceof UnauthorizedError)) throw error;
    }
    const token = await renewToken();
    try {
      return settle(await call(token));
    } catch (error) {
      if (error instanceof UnauthorizedError) {
        if (sameAccount(started)) await signedOut();
        throw new SignedOutError();
      }
      throw error;
    }
  }

  // ── MQTT ─────────────────────────────────────────────────────────────────────────────

  function emitStatus(deviceId: string) {
    const current = raw[deviceId];
    if (current) events.emit({ type: 'status', deviceId, status: parseStatus(current) });
  }

  function onMessage(topic: string, payload: string) {
    const target = topics.get(topic);
    if (!target) return;
    let json: unknown;
    try {
      json = JSON.parse(payload);
    } catch {
      return;
    }
    if (typeof json !== 'object' || json === null || Array.isArray(json)) return;
    const push = json as RawStatus;
    const { deviceId } = target;
    // Pushes may be partial: merge into what we know, never replace it.
    raw[deviceId] =
      target.kind === 'status'
        ? { ...raw[deviceId], ...push }
        : {
            ...raw[deviceId],
            ...('onlineStatus' in push ? { onlineStatus: push.onlineStatus } : {}),
          };
    if (target.kind === 'status') {
      clearTimeout(confirmTimers.get(deviceId));
      confirmTimers.delete(deviceId);
    }
    emitStatus(deviceId);
  }

  function onState(state: ConnectionState) {
    if (state === 'connected') {
      tokenIsFresh = false;
      reconnectDelay = baseDelay;
      for (const resolve of connectionWaiters) resolve();
      connectionWaiters = [];
    }
    events.emit({ type: 'connection', state });
  }

  function reconnectWithNewToken() {
    renewToken()
      .then((token) => {
        if (!session || !credentials) return;
        tokenIsFresh = true;
        session.connect({ username: homeId, password: token });
      })
      .catch((error: unknown) => {
        if (error instanceof SignedOutError) return;
        scheduleReconnect(); // no network: try again later
      });
  }

  function scheduleReconnect() {
    clearTimeout(reconnectTimer);
    const delay = reconnectDelay;
    reconnectDelay = Math.min(reconnectDelay * 2, MAX_RECONNECT_DELAY_MS);
    reconnectTimer = setTimeout(() => {
      if (session && credentials) reconnectWithNewToken();
    }, delay);
  }

  function onClose(reason: CloseReason) {
    if (!session || !credentials) return;
    if (reason.kind === 'closed') return;
    // Only 4 (bad username or password) and 5 (not authorised) mean the token was refused;
    // 1–3 (protocol, client id, server unavailable) are retried like a dropped connection.
    if (reason.kind === 'refused' && (reason.returnCode === 4 || reason.returnCode === 5)) {
      if (tokenIsFresh) {
        void signedOut();
        return;
      }
      reconnectWithNewToken();
      return;
    }
    scheduleReconnect();
  }

  function ensureSession() {
    if (!credentials || devices.length === 0) return;
    const wanted = devices.flatMap((d) => [statusTopic(d.topic), connectionStatusTopic(d.topic)]);
    const same = session && wanted.length === topics.size && wanted.every((t) => topics.has(t));
    topics = new Map(
      devices.flatMap((d): [string, TopicTarget][] => [
        [statusTopic(d.topic), { deviceId: d.id, kind: 'status' }],
        [connectionStatusTopic(d.topic), { deviceId: d.id, kind: 'connection' }],
      ]),
    );
    if (same && session) {
      if (session.state === 'disconnected') {
        session.connect({ username: homeId, password: credentials.accessToken });
      }
      return;
    }
    const previous = session;
    session = null;
    previous?.close();
    session = createMqttSession({
      socketFactory: options.socketFactory,
      host: options.mqtt?.host,
      port: options.mqtt?.port,
      keepalive: options.mqtt?.keepalive,
      username: homeId,
      password: credentials.accessToken,
      topics: wanted,
      onMessage,
      onState,
      onClose,
    });
    session.connect();
  }

  function waitForConnection(): Promise<void> {
    if (session?.state === 'connected') return Promise.resolve();
    return new Promise<void>((resolve, reject) => {
      const timer = setTimeout(() => {
        connectionWaiters = connectionWaiters.filter((w) => w !== done);
        reject(new MiraieNetworkError('Not connected to MirAIe'));
      }, connectWaitMs);
      const done = () => {
        clearTimeout(timer);
        resolve();
      };
      connectionWaiters.push(done);
    });
  }

  /** AC-9: no status push within the timeout → refetch over REST so the cache follows the AC. */
  function expectConfirmation(deviceId: string) {
    clearTimeout(confirmTimers.get(deviceId));
    confirmTimers.set(
      deviceId,
      setTimeout(() => {
        confirmTimers.delete(deviceId);
        withToken((token) => fetchStatus(token, deviceId, { fetch }))
          .then(({ raw: fresh }) => {
            if (!credentials) return;
            raw[deviceId] = fresh;
            emitStatus(deviceId);
          })
          .catch(() => {
            // Still unreachable: the next push or reconnect brings the truth.
          });
      }, confirmMs),
    );
  }

  async function loadHome() {
    const started = epoch;
    const loaded = await withToken((token) => fetchHome(token, { fetch }));
    if (!sameAccount(started)) throw new SignedOutError();
    homeId = loaded.home.homeId;
    devices = loaded.home.devices;
    raw = { ...loaded.rawStatuses };
    ensureSession();
    return loaded.home;
  }

  // ── the interface ────────────────────────────────────────────────────────────────────

  return {
    kind: 'live',

    async signIn(loginId, password) {
      // Starting a sign-in already makes any re-login of the previous account stale.
      const started = ++epoch;
      const s = await login(loginId, password, { fetch });
      if (epoch !== started) throw new SignedOutError(); // signed out or superseded meanwhile
      teardown();
      await adopt(loginId, password, s);
    },

    async restore() {
      credentials = await options.credentials.load();
      return credentials !== null;
    },

    async signOut() {
      epoch++;
      credentials = null;
      teardown();
      await options.credentials.clear();
    },

    getLoginId: () => credentials?.loginId ?? null,

    getConnectionState: () => session?.state ?? 'disconnected',

    getHome: loadHome,

    async getStatus(deviceId) {
      const started = epoch;
      const { status, raw: fresh } = await withToken((token) =>
        fetchStatus(token, deviceId, { fetch }),
      );
      if (!sameAccount(started)) throw new SignedOutError();
      raw[deviceId] = fresh;
      return status;
    },

    async send(deviceId, command) {
      if (!credentials) throw new SignedOutError();
      // Signed in again since the home was loaded (or never loaded): load it, then send.
      if (devices.length === 0) await loadHome();
      const device = devices.find((d) => d.id === deviceId);
      if (!device) throw new DeviceNotFoundError(deviceId);
      const known = raw[deviceId];
      if (known && !parseStatus(known).online) throw new DeviceOfflineError(deviceId);
      const payload = buildCommandMessage(command);

      ensureSession();
      await waitForConnection();
      if (!session?.publish(controlTopic(device.topic), payload)) {
        throw new MiraieNetworkError('Not connected to MirAIe');
      }
      expectConfirmation(deviceId);
    },

    subscribe: events.subscribe,
  };
}
