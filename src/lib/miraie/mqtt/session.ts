// One MQTT 3.1 connection to the MirAIe broker: CONNECT (MQIsdp, clean false), SUBSCRIBE every
// topic at qos 1, PUBLISH controls at qos 0, PUBACK pushes, PINGREQ on keep-alive. It reports
// why a connection ended; re-login and reconnect policy live in live-backend.ts (CHILL-002).

import { MQTT_HOST, MQTT_KEEPALIVE, MQTT_PORT } from '../constants';
import type { ConnectionState } from '../types';
import { Decoder, encode, type OutgoingPacket, type Packet } from './codec';
import type { MqttSocket, SocketFactory } from './socket';
import { utf8Decode, utf8Encode } from './utf8';

export type CloseReason =
  /** CONNACK with a non-zero return code: 4 = bad username/password, 5 = not authorised. */
  | { kind: 'refused'; returnCode: number }
  /** The network or the broker ended the connection, or it stopped answering. */
  | { kind: 'dropped' }
  /** We called close(). */
  | { kind: 'closed' };

export interface SessionOptions {
  socketFactory: SocketFactory;
  host?: string;
  port?: number;
  username: string;
  password: string;
  topics: string[];
  /** Seconds. */
  keepalive?: number;
  clientId?: string;
  connectTimeoutMs?: number;
  onMessage(topic: string, payload: string): void;
  onState(state: ConnectionState): void;
  onClose(reason: CloseReason): void;
}

export interface MqttSession {
  /** Opens a connection (closing any open one quietly), optionally with new credentials. */
  connect(credentials?: { username: string; password: string }): void;
  /** Qos 0. Returns false when not connected. */
  publish(topic: string, payload: string): boolean;
  close(): void;
  readonly state: ConnectionState;
}

/** Reference broker.py: "an" + 16 random digits + 5 random digits. */
export function generateClientId(random: () => number = Math.random): string {
  const digits = (n: number) =>
    Array.from({ length: n }, () => Math.min(9, Math.floor(random() * 10))).join('');
  return `an${digits(16)}${digits(5)}`;
}

interface Connection {
  write(packet: OutgoingPacket): void;
  /** Ends the connection; reports `reason` unless `quiet`. */
  finish(reason: CloseReason, quiet?: boolean): void;
}

export function createMqttSession(options: SessionOptions): MqttSession {
  const host = options.host ?? MQTT_HOST;
  const port = options.port ?? MQTT_PORT;
  const keepaliveMs = (options.keepalive ?? MQTT_KEEPALIVE) * 1000;
  const connectTimeoutMs = options.connectTimeoutMs ?? 10_000;
  const clientId = options.clientId ?? generateClientId();
  let username = options.username;
  let password = options.password;
  let state: ConnectionState = 'disconnected';
  let current: Connection | null = null;
  let messageId = 0;

  const setState = (next: ConnectionState) => {
    if (state === next) return;
    state = next;
    options.onState(next);
  };

  const nextMessageId = () => {
    messageId = (messageId % 0xffff) + 1;
    return messageId;
  };

  function open(): Connection {
    const decoder = new Decoder();
    let socket: MqttSocket | null = null;
    let finished = false;
    let connected = false;
    let pingTimer: ReturnType<typeof setInterval> | undefined;
    let pongTimer: ReturnType<typeof setTimeout> | undefined;
    const connectTimer = setTimeout(() => connection.finish({ kind: 'dropped' }), connectTimeoutMs);

    const connection: Connection = {
      write(packet) {
        socket?.write(encode(packet));
      },
      finish(reason, quiet = false) {
        if (finished) return;
        finished = true;
        clearTimeout(connectTimer);
        clearInterval(pingTimer);
        clearTimeout(pongTimer);
        if (reason.kind === 'closed' && connected) connection.write({ cmd: 'disconnect' });
        socket?.destroy();
        if (current !== connection) return;
        current = null;
        setState('disconnected');
        if (!quiet) options.onClose(reason);
      },
    };

    const handle = (packet: Packet) => {
      switch (packet.cmd) {
        case 'connack':
          clearTimeout(connectTimer);
          if (packet.returnCode !== 0) {
            connection.finish({ kind: 'refused', returnCode: packet.returnCode });
            return;
          }
          connected = true;
          setState('connected');
          if (options.topics.length > 0) {
            connection.write({
              cmd: 'subscribe',
              messageId: nextMessageId(),
              subscriptions: options.topics.map((topic) => ({ topic, qos: 1 })),
            });
          }
          pingTimer = setInterval(() => {
            connection.write({ cmd: 'pingreq' });
            pongTimer ??= setTimeout(() => connection.finish({ kind: 'dropped' }), keepaliveMs);
          }, keepaliveMs);
          return;
        case 'publish':
          if (packet.qos === 1 && packet.messageId !== undefined) {
            connection.write({ cmd: 'puback', messageId: packet.messageId });
          }
          options.onMessage(packet.topic, utf8Decode(packet.payload));
          return;
        case 'pingresp':
          clearTimeout(pongTimer);
          pongTimer = undefined;
          return;
        default:
          return;
      }
    };

    current = connection;
    setState('connecting');
    const opened = options.socketFactory(
      { host, port },
      {
        onConnect: () =>
          connection.write({
            cmd: 'connect',
            clientId,
            clean: false,
            keepalive: keepaliveMs / 1000,
            username,
            password,
          }),
        onData: (bytes) => {
          let packets: Packet[];
          try {
            packets = decoder.push(bytes);
          } catch {
            connection.finish({ kind: 'dropped' });
            return;
          }
          for (const packet of packets) {
            if (finished) return;
            handle(packet);
          }
        },
        onError: () => connection.finish({ kind: 'dropped' }),
        onClose: () => connection.finish({ kind: 'dropped' }),
      },
    );
    socket = opened;
    if (finished) opened.destroy();
    return connection;
  }

  return {
    get state() {
      return state;
    },
    connect(credentials) {
      if (credentials) ({ username, password } = credentials);
      current?.finish({ kind: 'closed' }, true);
      open();
    },
    publish(topic, payload) {
      if (state !== 'connected' || !current) return false;
      current.write({ cmd: 'publish', topic, payload: utf8Encode(payload), qos: 0 });
      return true;
    },
    close() {
      current?.finish({ kind: 'closed' });
    },
  };
}
