// An in-memory MirAIe for the web preview, `pnpm start:demo`, Expo Go and tests. It behaves like
// the live backend: same types and errors, a status push 300 ms after each command, offline ACs
// reject commands (CHILL-002 AC-10). Its default data is the boards' demo data.

import { applyCommand } from '../apply-command';
import { createEmitter, createMemoryCredentialStore, type MiraieBackend } from '../backend';
import {
  DeviceNotFoundError,
  DeviceOfflineError,
  MiraieNetworkError,
  NotRegisteredError,
  SignedOutError,
  WrongCredentialsError,
} from '../errors';
import { buildCommandMessage } from '../messages';
import type { AcDevice, AcStatus, ConnectionState, CredentialStore, Home } from '../types';

export interface DemoDevice {
  device: AcDevice;
  status: AcStatus;
}

export interface DemoSeed {
  devices?: DemoDevice[];
  /** Delay before the status push that follows a command. Default 300 ms. */
  latencyMs?: number;
  credentials?: CredentialStore;
  /** Commands to these AC ids fail with MiraieNetworkError. */
  failCommandsFor?: string[];
  /** Start signed in (default) or at the Sign in screen. */
  signedIn?: boolean;
  /** The signed-in ID when `signedIn` is true. Default "9876543210". */
  loginId?: string;
}

export interface DemoBackend extends MiraieBackend {
  readonly kind: 'demo';
  /** Test and preview controls: things the real AC or broker would do on its own. */
  simulate: {
    /** A status push, as if someone used the remote. */
    push(deviceId: string, patch: Partial<AcStatus>): void;
    /** The live connection going down or coming back. */
    connection(state: ConnectionState): void;
    /** MirAIe refusing the stored password: credentials are dropped and `signed-out` emitted. */
    expireSession(): Promise<void>;
  };
}

/** Sign-in IDs and passwords that make the demo fail, so every error state can be seen. */
export const DEMO_FAILURES = {
  wrongPassword: 'wrong',
  notRegisteredId: '0000000000',
  networkErrorId: 'offline',
} as const;

const onlineCoolStatus: AcStatus = {
  online: true,
  power: true,
  mode: 'cool',
  targetTemp: 24,
  roomTemp: 27,
  fan: 'auto',
  display: true,
  preset: 'none',
  swingV: 3,
  swingH: 0,
};

/** One demo AC: an online Bedroom-like unit unless overridden. */
export function demoDevice({
  id = 'ac',
  room = 'Room',
  name = `${room} AC`,
  topic = `demo/${id}`,
  model = { brand: 'Panasonic', modelName: 'Demo inverter AC' },
  status = {},
}: Partial<Omit<AcDevice, 'model'>> & {
  model?: AcDevice['model'];
  status?: Partial<AcStatus>;
} = {}): DemoDevice {
  return { device: { id, name, room, topic, model }, status: { ...onlineCoolStatus, ...status } };
}

/** The boards' demo data: Bedroom on, Living room standby, Study offline. */
export function defaultDemoDevices(): DemoDevice[] {
  return [
    demoDevice({ id: 'bed', room: 'Bedroom' }),
    demoDevice({
      id: 'living',
      room: 'Living room',
      status: { power: false, mode: 'dry', targetTemp: 25, roomTemp: 29 },
    }),
    demoDevice({
      id: 'study',
      room: 'Study',
      status: { online: false, power: false, mode: 'cool', targetTemp: 24, roomTemp: 31 },
    }),
  ];
}

export function createDemoBackend(seed: DemoSeed = {}): DemoBackend {
  const latencyMs = seed.latencyMs ?? 300;
  const credentials = seed.credentials ?? createMemoryCredentialStore();
  const failing = new Set(seed.failCommandsFor ?? []);
  const devices = (seed.devices ?? defaultDemoDevices()).map((d) => ({
    device: { ...d.device, model: { ...d.device.model } },
    status: { ...d.status },
  }));
  const events = createEmitter();
  const timers = new Set<ReturnType<typeof setTimeout>>();
  let loginId: string | null = seed.signedIn === false ? null : (seed.loginId ?? '9876543210');
  let connection: ConnectionState = 'disconnected';

  const setConnection = (state: ConnectionState) => {
    connection = state;
    events.emit({ type: 'connection', state });
  };

  const requireAccount = () => {
    if (loginId === null) throw new SignedOutError();
  };

  const find = (deviceId: string) => {
    const entry = devices.find((d) => d.device.id === deviceId);
    if (!entry) throw new DeviceNotFoundError(deviceId);
    return entry;
  };

  const push = (deviceId: string) => {
    const entry = find(deviceId);
    events.emit({ type: 'status', deviceId, status: { ...entry.status } });
  };

  const forget = async () => {
    loginId = null;
    connection = 'disconnected';
    for (const timer of timers) clearTimeout(timer);
    timers.clear();
    await credentials.clear();
  };

  return {
    kind: 'demo',

    async signIn(id, password) {
      if (password === DEMO_FAILURES.wrongPassword) throw new WrongCredentialsError();
      if (id === DEMO_FAILURES.notRegisteredId) throw new NotRegisteredError();
      if (id === DEMO_FAILURES.networkErrorId) {
        throw new MiraieNetworkError("Couldn't reach MirAIe");
      }
      loginId = id;
      await credentials.save({
        loginId: id,
        password,
        accessToken: 'demo-access-token',
        refreshToken: 'demo-refresh-token',
        userId: 'demo-user',
        expiresIn: 86_400,
      });
    },

    async restore() {
      if (loginId !== null) return true;
      const stored = await credentials.load();
      loginId = stored?.loginId ?? null;
      return loginId !== null;
    },

    signOut: forget,

    getLoginId: () => loginId,

    getConnectionState: () => connection,

    async getHome(): Promise<Home> {
      requireAccount();
      if (connection !== 'connected') setConnection('connected');
      return {
        devices: devices.map((d) => ({ ...d.device, model: { ...d.device.model } })),
        statuses: Object.fromEntries(devices.map((d) => [d.device.id, { ...d.status }])),
      };
    },

    async getStatus(deviceId) {
      requireAccount();
      return { ...find(deviceId).status };
    },

    async send(deviceId, command) {
      requireAccount();
      const entry = find(deviceId);
      if (!entry.status.online) throw new DeviceOfflineError(deviceId);
      buildCommandMessage(command); // same validation as the live payload (e.g. 16–30 °C)
      if (failing.has(deviceId)) throw new MiraieNetworkError("Couldn't reach MirAIe");
      const timer = setTimeout(() => {
        timers.delete(timer);
        entry.status = applyCommand(entry.status, command);
        push(deviceId);
      }, latencyMs);
      timers.add(timer);
    },

    subscribe: events.subscribe,

    simulate: {
      push(deviceId, patch) {
        const entry = find(deviceId);
        entry.status = { ...entry.status, ...patch };
        push(deviceId);
      },
      connection: setConnection,
      async expireSession() {
        if (loginId === null) return;
        await forget();
        events.emit({ type: 'signed-out' });
      },
    },
  };
}
