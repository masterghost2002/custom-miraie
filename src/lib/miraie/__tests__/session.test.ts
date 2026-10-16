/** @jest-environment node */
// The MQTT session against a real aedes broker on localhost (CHILL-002 AC-7).
import { createMqttSession, generateClientId, type CloseReason } from '../mqtt/session';
import type { SocketFactory, SocketHandlers } from '../mqtt/socket-types';
import { nodeTcpSocketFactory } from '../mqtt/socket.node';
import { startBroker, type TestBroker } from '../test-support/broker-process';

jest.setTimeout(15_000);

let broker: TestBroker;

function recordSession(overrides: { password?: string; keepalive?: number } = {}) {
  const messages: { topic: string; payload: string }[] = [];
  const states: string[] = [];
  const closes: CloseReason[] = [];
  const session = createMqttSession({
    socketFactory: nodeTcpSocketFactory,
    host: '127.0.0.1',
    port: broker.port,
    username: 'home-1',
    password: overrides.password ?? 'token-1',
    keepalive: overrides.keepalive ?? 60,
    topics: ['t/bed/status', 't/bed/connectionStatus'],
    onMessage: (topic, payload) => messages.push({ topic, payload }),
    onState: (state) => states.push(state),
    onClose: (reason) => closes.push(reason),
  });
  return { session, messages, states, closes };
}

const until = async (check: () => boolean, timeoutMs = 4000) => {
  const start = Date.now();
  while (!check()) {
    if (Date.now() - start > timeoutMs) throw new Error('Timed out');
    await new Promise((r) => setTimeout(r, 10));
  }
};

describe('generateClientId', () => {
  it('is "an" + 16 + 5 random digits — 23 characters, the MQTT 3.1 limit', () => {
    expect(generateClientId(() => 0)).toBe(`an${'0'.repeat(21)}`);
    expect(generateClientId()).toMatch(/^an\d{21}$/);
  });
});

describe('MQTT session', () => {
  beforeEach(async () => {
    broker = await startBroker(['token-1']);
  });

  afterEach(async () => {
    await broker.stop();
  });

  it('AC-7: given a local aedes broker, when the session connects, then the broker sees CONNECT as MQIsdp level 3, clean false, home id as username', async () => {
    const { session, states } = recordSession();
    session.connect();

    const connect = await broker.waitFor((e) => e.event === 'connect');
    expect(connect).toMatchObject({
      protocolId: 'MQIsdp',
      protocolVersion: 3,
      clean: false,
      keepalive: 60,
      username: 'home-1',
    });
    expect(connect.clientId).toMatch(/^an\d{21}$/);
    await until(() => states.includes('connected'));
    expect(states).toEqual(['connecting', 'connected']);
    session.close();
  });

  it('AC-7: given a connected session, then it subscribes to every topic at qos 1', async () => {
    const { session } = recordSession();
    session.connect();
    const subscribe = await broker.waitFor((e) => e.event === 'subscribe');
    expect(subscribe.subscriptions).toEqual([
      { topic: 't/bed/status', qos: 1 },
      { topic: 't/bed/connectionStatus', qos: 1 },
    ]);
    session.close();
  });

  it('AC-7: given a connected session, when a control is published, then the broker sees it at qos 0', async () => {
    const { session, states } = recordSession();
    session.connect();
    await until(() => states.includes('connected'));

    expect(
      session.publish('t/bed/control', '{"ki": 1, "cnt": "an", "sid": "1", "ps": "off"}'),
    ).toBe(true);

    const publish = await broker.waitFor((e) => e.event === 'publish');
    expect(publish).toEqual({
      event: 'publish',
      topic: 't/bed/control',
      payload: '{"ki": 1, "cnt": "an", "sid": "1", "ps": "off"}',
      qos: 0,
    });
    session.close();
  });

  it('AC-7: given a status published by the broker, then it reaches our callback and is acknowledged', async () => {
    const { session, messages } = recordSession();
    session.connect();
    await broker.waitFor((e) => e.event === 'subscribe');

    await broker.publish('t/bed/status', '{"ps":"off","actmp":"23.0"}', 1);

    await until(() => messages.length > 0);
    expect(messages).toEqual([{ topic: 't/bed/status', payload: '{"ps":"off","actmp":"23.0"}' }]);
    await broker.waitFor((e) => e.event === 'ack');
    session.close();
  });

  it('AC-7: given a 1 s keep-alive, then PINGREQ is sent', async () => {
    const { session } = recordSession({ keepalive: 1 });
    session.connect();
    await broker.waitFor((e) => e.event === 'ping', 3000);
    session.close();
  });

  it('given the broker refuses the token, when connecting, then onClose reports CONNACK 4', async () => {
    const { session, closes, states } = recordSession({ password: 'expired' });
    session.connect();
    await until(() => closes.length > 0);
    expect(closes).toEqual([{ kind: 'refused', returnCode: 4 }]);
    expect(states.at(-1)).toBe('disconnected');
    expect(session.publish('t/bed/control', '{}')).toBe(false);
  });

  it('given a refused token, when reconnecting with a new password, then it connects', async () => {
    const { session, closes, states } = recordSession({ password: 'expired' });
    session.connect();
    await until(() => closes.length > 0);

    session.connect({ username: 'home-1', password: 'token-1' });
    await until(() => states.at(-1) === 'connected');
    session.close();
  });

  it('given the broker drops the connection, then onClose reports a drop and the state is disconnected', async () => {
    const { session, closes, states } = recordSession();
    session.connect();
    await until(() => states.includes('connected'));

    await broker.kick();

    await until(() => closes.length > 0);
    expect(closes).toEqual([{ kind: 'dropped' }]);
    expect(states.at(-1)).toBe('disconnected');
  });

  it('given a connected session, when it is closed, then DISCONNECT is sent and onClose reports closed', async () => {
    const { session, closes, states } = recordSession();
    session.connect();
    await until(() => states.includes('connected'));

    session.close();

    await broker.waitFor((e) => e.event === 'clientDisconnect');
    expect(closes).toEqual([{ kind: 'closed' }]);
    expect(states.at(-1)).toBe('disconnected');
  });

  it('given nothing listens on the port, when connecting, then onClose reports a drop', async () => {
    const closes: CloseReason[] = [];
    const session = createMqttSession({
      socketFactory: nodeTcpSocketFactory,
      host: '127.0.0.1',
      port: 1, // nothing listens here
      username: 'home-1',
      password: 'token-1',
      topics: [],
      onMessage: () => {},
      onState: () => {},
      onClose: (reason) => closes.push(reason),
    });
    session.connect();
    await until(() => closes.length > 0);
    expect(closes).toEqual([{ kind: 'dropped' }]);
  });
});

describe('MQTT session timers and errors (fake socket, fake clock)', () => {
  // A socket we control: records what the session writes and lets the test play the broker.
  function fakeSocket() {
    const written: number[][] = [];
    const state = { destroyed: false, handlers: null as SocketHandlers | null };
    const factory: SocketFactory = (_target, handlers) => {
      state.handlers = handlers;
      return {
        write: (bytes) => void written.push(Array.from(bytes)),
        destroy: () => void (state.destroyed = true),
      };
    };
    return { factory, written, state };
  }

  function start(socket: ReturnType<typeof fakeSocket>, keepalive = 60) {
    const closes: CloseReason[] = [];
    const session = createMqttSession({
      socketFactory: socket.factory,
      username: 'home-1',
      password: 'token-1',
      topics: [],
      keepalive,
      connectTimeoutMs: 10_000,
      onMessage: () => {},
      onState: () => {},
      onClose: (reason) => closes.push(reason),
    });
    session.connect();
    return { session, closes };
  }

  const CONNACK_OK = Uint8Array.of(0x20, 0x02, 0x00, 0x00);
  const PINGREQ = [0xc0, 0x00];
  const PINGRESP = Uint8Array.of(0xd0, 0x00);
  const DISCONNECT = [0xe0, 0x00];

  beforeEach(() => jest.useFakeTimers());
  afterEach(() => jest.useRealTimers());

  it('given no CONNACK within the connect timeout, then the connection is dropped', () => {
    const socket = fakeSocket();
    const { closes } = start(socket);
    socket.state.handlers?.onConnect();
    jest.advanceTimersByTime(10_000);
    expect(closes).toEqual([{ kind: 'dropped' }]);
    expect(socket.state.destroyed).toBe(true);
  });

  it('given PINGREQ goes unanswered for a keep-alive period, then the connection is dropped', () => {
    const socket = fakeSocket();
    const { closes } = start(socket, 60);
    socket.state.handlers?.onConnect();
    socket.state.handlers?.onData(CONNACK_OK);

    jest.advanceTimersByTime(60_000);
    expect(socket.written.at(-1)).toEqual(PINGREQ);
    jest.advanceTimersByTime(60_000);
    expect(closes).toEqual([{ kind: 'dropped' }]);
  });

  it('given every PINGREQ is answered, then the connection stays up', () => {
    const socket = fakeSocket();
    const { closes, session } = start(socket, 60);
    socket.state.handlers?.onConnect();
    socket.state.handlers?.onData(CONNACK_OK);
    for (let i = 0; i < 5; i++) {
      jest.advanceTimersByTime(60_000);
      socket.state.handlers?.onData(PINGRESP);
    }
    expect(closes).toEqual([]);
    expect(session.state).toBe('connected');
  });

  it('given bytes that are not MQTT, then the connection is dropped', () => {
    const socket = fakeSocket();
    const { closes } = start(socket);
    socket.state.handlers?.onData(Uint8Array.of(0x30, 0xff, 0xff, 0xff, 0xff, 0x01));
    expect(closes).toEqual([{ kind: 'dropped' }]);
  });

  it('given a packet announcing more than 1 MiB, then the connection is dropped', () => {
    const socket = fakeSocket();
    const { closes } = start(socket);
    socket.state.handlers?.onConnect();
    socket.state.handlers?.onData(CONNACK_OK);
    socket.state.handlers?.onData(Uint8Array.of(0x30, 0x81, 0x80, 0x40));
    expect(closes).toEqual([{ kind: 'dropped' }]);
    expect(socket.state.destroyed).toBe(true);
  });

  it('given handling a packet throws, then the connection is dropped instead of crashing the socket callback', () => {
    const socket = fakeSocket();
    const closes: CloseReason[] = [];
    const session = createMqttSession({
      socketFactory: socket.factory,
      username: 'home-1',
      password: 'token-1',
      topics: [],
      onMessage: () => {
        throw new Error('listener bug');
      },
      onState: () => {},
      onClose: (reason) => closes.push(reason),
    });
    session.connect();
    socket.state.handlers?.onConnect();
    socket.state.handlers?.onData(CONNACK_OK);
    // PUBLISH qos 0, topic "t", payload "{}"
    expect(() =>
      socket.state.handlers?.onData(Uint8Array.of(0x30, 0x05, 0x00, 0x01, 0x74, 0x7b, 0x7d)),
    ).not.toThrow();
    expect(closes).toEqual([{ kind: 'dropped' }]);
  });

  it('given a connected session, when closed, then the last bytes written are DISCONNECT', () => {
    const socket = fakeSocket();
    const { session } = start(socket);
    socket.state.handlers?.onConnect();
    socket.state.handlers?.onData(CONNACK_OK);
    session.close();
    expect(socket.written.at(-1)).toEqual(DISCONNECT);
    expect(socket.state.destroyed).toBe(true);
  });

  it('given the socket fails while it is being created, then it is destroyed and the drop is reported once', () => {
    let destroyed = 0;
    const closes: CloseReason[] = [];
    const session = createMqttSession({
      socketFactory: (_t, handlers) => {
        handlers.onError(new Error('ENETUNREACH'));
        handlers.onClose();
        return { write: () => {}, destroy: () => void destroyed++ };
      },
      username: 'u',
      password: 'p',
      topics: [],
      onMessage: () => {},
      onState: () => {},
      onClose: (reason) => closes.push(reason),
    });
    session.connect();
    expect(closes).toEqual([{ kind: 'dropped' }]);
    expect(destroyed).toBe(1);
  });
});
