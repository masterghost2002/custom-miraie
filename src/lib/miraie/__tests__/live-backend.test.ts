/** @jest-environment node */
// The live backend end to end: a fake MirAIe REST (fetch is the network we don't own) and a real
// aedes broker on localhost that checks the access token (CHILL-002 AC-8, AC-9).
import { createMemoryCredentialStore, type MiraieBackend } from '../backend';
import { DEVICE_DETAILS_URL, HOMES_URL, LOGIN_URL, statusUrl } from '../constants';
import {
  DeviceNotFoundError,
  DeviceOfflineError,
  MiraieNetworkError,
  SignedOutError,
  WrongCredentialsError,
} from '../errors';
import { createLiveBackend } from '../live-backend';
import { nodeTcpSocketFactory } from '../mqtt/socket.node';
import { startBroker, type TestBroker } from '../test-support/broker-process';
import type { BackendEvent, StoredCredentials } from '../types';

jest.setTimeout(20_000);

const stored: StoredCredentials = {
  loginId: '9876543210',
  password: 'secret',
  accessToken: 'token-1',
  refreshToken: 'r-1',
  userId: 'u-1',
  expiresIn: 3600,
};

const bedStatus = {
  onlineStatus: 'true',
  ps: 'on',
  actmp: '24.0',
  rmtmp: '27.0',
  acmd: 'cool',
  acfs: 'auto',
  acdc: 'on',
  acpm: 'off',
  acem: 'off',
  acvs: 3,
  achs: 0,
};

/** Fake MirAIe REST. Each successful login issues the next token: token-2, token-3, … */
function fakeMiraie({ validTokens = ['token-1'], password = 'secret' } = {}) {
  const valid = new Set(validTokens);
  const log = { logins: [] as Record<string, unknown>[], statusGets: 0 };
  const json = (status: number, body: unknown) =>
    new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });

  const fetch = async (input: string | URL | Request, init?: RequestInit) => {
    const url = String(input);
    if (url === LOGIN_URL) {
      const body = JSON.parse(String(init?.body)) as Record<string, unknown>;
      log.logins.push(body);
      if (body.password !== password) return json(401, {});
      const accessToken = `token-${log.logins.length + 1}`;
      valid.add(accessToken);
      return json(200, { accessToken, refreshToken: 'r', userId: 'u-1', expiresIn: 3600 });
    }
    const auth = new Headers(init?.headers).get('Authorization') ?? '';
    if (!valid.has(auth.replace('Bearer ', ''))) return json(401, {});
    if (url === HOMES_URL) {
      return json(200, [
        {
          homeId: 'home-1',
          spaces: [
            {
              spaceName: 'Bedroom',
              devices: [{ deviceId: 'bed', deviceName: 'Bedroom AC', topic: ['t/bed'] }],
            },
            {
              spaceName: 'Study',
              devices: [{ deviceId: 'study', deviceName: 'Study AC', topic: ['t/study'] }],
            },
          ],
        },
      ]);
    }
    if (url.startsWith(DEVICE_DETAILS_URL)) return json(200, [{ category: 'AC', modelName: 'X' }]);
    if (url === statusUrl('bed')) {
      log.statusGets++;
      return json(200, bedStatus);
    }
    if (url === statusUrl('study'))
      return json(200, { ...bedStatus, onlineStatus: 'false', ps: 'off' });
    return json(404, {});
  };
  return { fetch: fetch as typeof globalThis.fetch, log, valid };
}

let broker: TestBroker;
let backend: MiraieBackend | null = null;

afterEach(async () => {
  await backend?.signOut();
  backend = null;
  await broker?.stop();
});

async function setup({
  brokerPasswords = ['token-1'],
  rest = fakeMiraie(),
  credentials = stored as StoredCredentials | null,
  commandConfirmTimeoutMs = 5000,
  port,
}: {
  brokerPasswords?: string[];
  rest?: ReturnType<typeof fakeMiraie>;
  credentials?: StoredCredentials | null;
  commandConfirmTimeoutMs?: number;
  port?: number;
} = {}) {
  broker = await startBroker(brokerPasswords);
  const store = createMemoryCredentialStore(credentials);
  const events: BackendEvent[] = [];
  backend = createLiveBackend({
    fetch: rest.fetch,
    socketFactory: nodeTcpSocketFactory,
    credentials: store,
    mqtt: { host: '127.0.0.1', port: port ?? broker.port },
    commandConfirmTimeoutMs,
    reconnectDelayMs: 20,
    connectWaitMs: 1500,
  });
  backend.subscribe((e) => events.push(e));
  await backend.restore();
  return { backend, store, events, rest };
}

const until = async (check: () => boolean, timeoutMs = 5000) => {
  const start = Date.now();
  while (!check()) {
    if (Date.now() - start > timeoutMs) throw new Error('Timed out');
    await new Promise((r) => setTimeout(r, 10));
  }
};

const connected = (events: BackendEvent[]) =>
  events.some((e) => e.type === 'connection' && e.state === 'connected');

describe('live backend — sign-in and session', () => {
  it('given stored credentials, when restored, then the login id is known without a network call', async () => {
    const { backend, rest } = await setup();
    expect(backend.getLoginId()).toBe('9876543210');
    expect(rest.log.logins).toHaveLength(0);
  });

  it('given nothing stored, when restored, then it is signed out and getHome rejects', async () => {
    const { backend } = await setup({ credentials: null });
    expect(backend.getLoginId()).toBeNull();
    await expect(backend.getHome()).rejects.toBeInstanceOf(SignedOutError);
    await expect(backend.send('bed', { kind: 'power', on: false })).rejects.toBeInstanceOf(
      SignedOutError,
    );
  });

  it('given a sign-in, when it succeeds, then the credentials and tokens are stored', async () => {
    const { backend, store } = await setup({ credentials: null });
    await backend.signIn('9876543210', 'secret');
    expect(store.peek()).toMatchObject({
      loginId: '9876543210',
      password: 'secret',
      accessToken: 'token-2',
    });
    expect(backend.getLoginId()).toBe('9876543210');
  });

  it('given a wrong password, when signing in, then WrongCredentialsError and nothing is stored', async () => {
    const { backend, store } = await setup({ credentials: null });
    await expect(backend.signIn('9876543210', 'nope')).rejects.toBeInstanceOf(
      WrongCredentialsError,
    );
    expect(store.peek()).toBeNull();
  });

  it('given a signed-in backend, when signing out, then the stored credentials are deleted', async () => {
    const { backend, store } = await setup();
    await backend.getHome();
    await backend.signOut();
    expect(store.peek()).toBeNull();
    expect(backend.getLoginId()).toBeNull();
  });
});

describe('live backend — AC-8 re-login', () => {
  it('AC-8: given the broker refuses the stored token, when connecting, then it signs in again once and reconnects with the new token', async () => {
    const { backend, store, events, rest } = await setup({ brokerPasswords: ['token-2'] });

    await backend.getHome();

    await until(() => connected(events));
    expect(rest.log.logins).toEqual([
      expect.objectContaining({ mobile: '9876543210', password: 'secret' }),
    ]);
    expect(store.peek()?.accessToken).toBe('token-2');
    expect(broker.events.filter((e) => e.event === 'connect')).toHaveLength(2);
  });

  it('AC-8: given the broker refuses the new token too, then it emits signed-out and forgets the credentials', async () => {
    const { backend, store, events } = await setup({ brokerPasswords: ['never'] });

    await backend.getHome();

    await until(() => events.some((e) => e.type === 'signed-out'));
    expect(store.peek()).toBeNull();
    expect(backend.getLoginId()).toBeNull();
    await expect(backend.getHome()).rejects.toBeInstanceOf(SignedOutError);
  });

  it.each([2, 3])(
    'AC-8: given the broker answers CONNACK %i twice (not a token refusal), then it keeps retrying and never signs out',
    async (returnCode) => {
      const { backend, store, events } = await setup({
        brokerPasswords: ['token-1', 'token-2', 'token-3'],
      });
      await broker.refuseNext(returnCode, 2);

      await backend.getHome();

      await until(() => connected(events));
      expect(events).not.toContainEqual({ type: 'signed-out' });
      expect(store.peek()).not.toBeNull();
      expect(backend.getLoginId()).toBe('9876543210');
      expect(broker.events.filter((e) => e.event === 'connect')).toHaveLength(3);
    },
  );

  it('AC-8: given the broker drops the connection, then it signs in again and reconnects', async () => {
    const { backend, events, rest } = await setup({ brokerPasswords: ['token-1', 'token-2'] });
    await backend.getHome();
    await until(() => connected(events));

    await broker.kick();

    await until(() => broker.events.filter((e) => e.event === 'connect').length === 2);
    await until(
      () => events.filter((e) => e.type === 'connection' && e.state === 'connected').length === 2,
    );
    expect(rest.log.logins).toHaveLength(1);
  });

  it('AC-8: given REST answers 401, when getHome runs, then it signs in again once and retries', async () => {
    const rest = fakeMiraie({ validTokens: [] });
    const { backend } = await setup({ rest, brokerPasswords: ['token-2'] });

    const home = await backend.getHome();

    expect(home.devices.map((d) => d.id)).toEqual(['bed', 'study']);
    expect(rest.log.logins).toHaveLength(1);
  });

  it('AC-8: given the stored password no longer works, when the token expires, then it emits signed-out', async () => {
    const rest = fakeMiraie({ validTokens: [], password: 'changed' });
    const { backend, events, store } = await setup({ rest });

    await expect(backend.getHome()).rejects.toBeInstanceOf(SignedOutError);
    expect(events).toContainEqual({ type: 'signed-out' });
    expect(store.peek()).toBeNull();
  });

  it('AC-8: given REST still answers 401 after a fresh sign-in, then it gives up and emits signed-out', async () => {
    const rest = fakeMiraie({ validTokens: [] });
    const fetch: typeof globalThis.fetch = async (input, init) => {
      const response = await rest.fetch(input, init);
      return String(input) === LOGIN_URL ? response : new Response('{}', { status: 401 });
    };
    const { backend, events } = await setup({ rest: { ...rest, fetch } });

    await expect(backend.getHome()).rejects.toBeInstanceOf(SignedOutError);
    expect(rest.log.logins).toHaveLength(1);
    expect(events).toContainEqual({ type: 'signed-out' });
  });
});

describe('live backend — commands and pushes', () => {
  it('given a command, when sent, then the exact control payload reaches the broker', async () => {
    const { backend } = await setup();
    await backend.getHome();

    await backend.send('bed', { kind: 'temperature', value: 23 });

    const publish = await broker.waitFor((e) => e.event === 'publish');
    expect(publish).toMatchObject({
      topic: 't/bed/control',
      payload: '{"ki": 1, "cnt": "an", "sid": "1", "actmp": "23.0"}',
      qos: 0,
    });
  });

  it('given a partial status push, then a status event carries the merged status', async () => {
    const { backend, events } = await setup();
    await backend.getHome();
    await until(() => connected(events));
    await broker.waitFor((e) => e.event === 'subscribe');

    await broker.publish('t/bed/status', '{"actmp":"22.0","ps":"off"}');

    await until(() => events.some((e) => e.type === 'status'));
    expect(events.find((e) => e.type === 'status')).toEqual({
      type: 'status',
      deviceId: 'bed',
      status: expect.objectContaining({ targetTemp: 22, power: false, mode: 'cool', fan: 'auto' }),
    });
  });

  it('given a connectionStatus push, then the AC goes offline and commands to it are refused', async () => {
    const { backend, events } = await setup();
    await backend.getHome();
    await broker.waitFor((e) => e.event === 'subscribe');

    await broker.publish('t/bed/connectionStatus', '{"onlineStatus":"false"}');

    await until(() =>
      events.some((e) => e.type === 'status' && e.deviceId === 'bed' && e.status.online === false),
    );
    await expect(backend.send('bed', { kind: 'power', on: true })).rejects.toBeInstanceOf(
      DeviceOfflineError,
    );
  });

  it('given a push that is not JSON or for an unknown topic, then it is ignored', async () => {
    const { backend, events } = await setup();
    await backend.getHome();
    await broker.waitFor((e) => e.event === 'subscribe');

    await broker.publish('t/bed/status', 'not json');
    await broker.publish('t/bed/status', '[1,2]');
    await broker.publish('t/bed/status', '{"ps":"off"}');

    await until(() => events.some((e) => e.type === 'status'));
    expect(events.filter((e) => e.type === 'status')).toHaveLength(1);
  });

  it('given an offline AC, when a command is sent, then it rejects with DeviceOfflineError', async () => {
    const { backend } = await setup();
    await backend.getHome();
    await expect(backend.send('study', { kind: 'power', on: true })).rejects.toBeInstanceOf(
      DeviceOfflineError,
    );
  });

  it('given an unknown device, when a command is sent, then it rejects with DeviceNotFoundError', async () => {
    const { backend } = await setup();
    await backend.getHome();
    await expect(backend.send('nope', { kind: 'power', on: true })).rejects.toBeInstanceOf(
      DeviceNotFoundError,
    );
  });

  it('given the broker cannot be reached, when a command is sent, then it rejects with MiraieNetworkError', async () => {
    const { backend } = await setup({ port: 1 });
    await backend.getHome();
    await expect(backend.send('bed', { kind: 'power', on: true })).rejects.toBeInstanceOf(
      MiraieNetworkError,
    );
  });

  it('given sign out and sign in again, when a command is sent before getHome, then the home is loaded first and the command goes out', async () => {
    const { backend } = await setup({ brokerPasswords: ['token-2'] });
    await backend.getHome();
    await backend.signOut();
    await backend.signIn('9876543210', 'secret');

    await backend.send('bed', { kind: 'power', on: false });

    const publish = await broker.waitFor((e) => e.event === 'publish');
    expect(publish).toMatchObject({ topic: 't/bed/control' });
  });

  it('given a device id, when getStatus runs, then it reads the status over REST', async () => {
    const { backend } = await setup();
    await expect(backend.getStatus('bed')).resolves.toMatchObject({ power: true, targetTemp: 24 });
  });
});

describe('live backend — AC-9 confirmation', () => {
  it('AC-9: given a command and no status push within the timeout, then status is refetched over REST and emitted', async () => {
    const { backend, events, rest } = await setup({ commandConfirmTimeoutMs: 150 });
    await backend.getHome();
    const before = rest.log.statusGets;

    await backend.send('bed', { kind: 'power', on: false });

    await until(() => rest.log.statusGets > before);
    await until(() => events.some((e) => e.type === 'status'));
    // The device never turned off: the cache must follow the device, not the command.
    expect(events.find((e) => e.type === 'status')).toMatchObject({
      deviceId: 'bed',
      status: { power: true },
    });
  });

  it('AC-9: given a status push within the timeout, then nothing is refetched', async () => {
    const { backend, rest } = await setup({ commandConfirmTimeoutMs: 400 });
    await backend.getHome();
    await broker.waitFor((e) => e.event === 'subscribe');
    const before = rest.log.statusGets;

    await backend.send('bed', { kind: 'power', on: false });
    await broker.publish('t/bed/status', '{"ps":"off"}');
    await new Promise((r) => setTimeout(r, 600));

    expect(rest.log.statusGets).toBe(before);
  });
});

describe('live backend — account changes while a re-login is in flight', () => {
  /** Holds the first login request until `release()`, so a test can act in between. */
  function holdFirstLogin(rest: ReturnType<typeof fakeMiraie>) {
    let release = () => {};
    const gate = new Promise<void>((resolve) => (release = resolve));
    const state = { started: false, logins: 0 };
    const fetch: typeof globalThis.fetch = async (input, init) => {
      if (String(input) === LOGIN_URL && state.logins++ === 0) {
        state.started = true;
        await gate;
      }
      return rest.fetch(input, init);
    };
    return { rest: { ...rest, fetch }, release: () => release(), state };
  }

  it('given a re-login in flight, when the user signs out and the login then succeeds, then nothing is stored or restored', async () => {
    const held = holdFirstLogin(fakeMiraie({ validTokens: [] }));
    const { backend, store } = await setup({ rest: held.rest });

    const home = backend.getHome().catch((e: unknown) => e);
    await until(() => held.state.started);
    await backend.signOut();
    held.release();

    expect(await home).toBeInstanceOf(SignedOutError);
    expect(store.peek()).toBeNull();
    expect(backend.getLoginId()).toBeNull();
    expect(broker.events.filter((e) => e.event === 'connect')).toHaveLength(0);
  });

  it("given a re-login in flight for A, when B signs in and then A's login succeeds, then B stays signed in", async () => {
    const held = holdFirstLogin(fakeMiraie({ validTokens: [] }));
    const { backend, store } = await setup({ rest: held.rest });

    const home = backend.getHome().catch((e: unknown) => e);
    await until(() => held.state.started);
    await backend.signIn('b@example.com', 'secret');
    held.release();
    await home;

    expect(store.peek()?.loginId).toBe('b@example.com');
    expect(backend.getLoginId()).toBe('b@example.com');
  });

  it('given getHome in flight, when the user signs out, then the loaded home is not kept and no MQTT session opens', async () => {
    let release = () => {};
    const gate = new Promise<void>((resolve) => (release = resolve));
    const rest = fakeMiraie();
    let homesRequested = false;
    const fetch: typeof globalThis.fetch = async (input, init) => {
      if (String(input) === HOMES_URL) {
        homesRequested = true;
        await gate;
      }
      return rest.fetch(input, init);
    };
    const { backend } = await setup({ rest: { ...rest, fetch } });

    const home = backend.getHome().catch((e: unknown) => e);
    await until(() => homesRequested);
    await backend.signOut();
    release();

    expect(await home).toBeInstanceOf(SignedOutError);
    await new Promise((r) => setTimeout(r, 200));
    expect(broker.events.filter((e) => e.event === 'connect')).toHaveLength(0);
    expect(backend.getConnectionState()).toBe('disconnected');
  });

  it("given A's getHome in flight, when B signs in, then A's home is dropped and no MQTT session opens with B's token", async () => {
    let release = () => {};
    const gate = new Promise<void>((resolve) => (release = resolve));
    const rest = fakeMiraie();
    let homesRequested = 0;
    const fetch: typeof globalThis.fetch = async (input, init) => {
      if (String(input) === HOMES_URL && homesRequested++ === 0) await gate;
      return rest.fetch(input, init);
    };
    const { backend } = await setup({ rest: { ...rest, fetch }, brokerPasswords: ['token-2'] });

    const homeA = backend.getHome().catch((e: unknown) => e);
    await until(() => homesRequested === 1);
    await backend.signIn('b@example.com', 'secret');
    release();

    expect(await homeA).toBeInstanceOf(SignedOutError);
    await new Promise((r) => setTimeout(r, 200));
    expect(broker.events.filter((e) => e.event === 'connect')).toHaveLength(0);
    expect(backend.getLoginId()).toBe('b@example.com');
  });
});
