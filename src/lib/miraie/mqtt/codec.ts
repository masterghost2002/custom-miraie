// MQTT 3.1 packets the MirAIe session needs: CONNECT, CONNACK, SUBSCRIBE, SUBACK, PUBLISH,
// PUBACK, PINGREQ, PINGRESP, DISCONNECT. Hand-written because mqtt.js can't open a raw TLS
// socket in React Native and mqtt-packet pulls in Node's stream stack (CHILL-002). Tested
// against mqtt-packet as an oracle.

import { utf8Decode, utf8Encode } from './utf8';

export type QoS = 0 | 1;

export type Packet =
  | {
      cmd: 'connect';
      clientId: string;
      clean: boolean;
      keepalive: number;
      username?: string;
      password?: string;
    }
  | { cmd: 'connack'; returnCode: number; sessionPresent: boolean }
  | { cmd: 'subscribe'; messageId: number; subscriptions: { topic: string; qos: QoS }[] }
  | { cmd: 'suback'; messageId: number; granted: number[] }
  | {
      cmd: 'publish';
      topic: string;
      payload: Uint8Array;
      qos: QoS;
      messageId?: number;
      dup?: boolean;
      retain?: boolean;
    }
  | { cmd: 'puback'; messageId: number }
  | { cmd: 'pingreq' }
  | { cmd: 'pingresp' }
  | { cmd: 'disconnect' }
  /** A packet type we never expect from MirAIe; decoded only far enough to skip it. */
  | { cmd: 'unknown'; type: number };

/** What a client sends; the broker-only packets are decoded but never encoded. */
export type OutgoingPacket = Extract<
  Packet,
  { cmd: 'connect' | 'subscribe' | 'publish' | 'puback' | 'pingreq' | 'disconnect' }
>;

export class MqttProtocolError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'MqttProtocolError';
  }
}

const TYPE = {
  connect: 1,
  connack: 2,
  publish: 3,
  puback: 4,
  subscribe: 8,
  suback: 9,
  pingreq: 12,
  pingresp: 13,
  disconnect: 14,
} as const;

// ── encode ────────────────────────────────────────────────────────────────────────────────

function u16(n: number): number[] {
  return [(n >> 8) & 0xff, n & 0xff];
}

function str(s: string): number[] {
  const bytes = utf8Encode(s);
  return [...u16(bytes.length), ...bytes];
}

function remainingLength(n: number): number[] {
  const out: number[] = [];
  do {
    let byte = n % 128;
    n = Math.floor(n / 128);
    if (n > 0) byte |= 0x80;
    out.push(byte);
  } while (n > 0);
  return out;
}

function frame(firstByte: number, body: ArrayLike<number>): Uint8Array {
  const header = [firstByte, ...remainingLength(body.length)];
  const out = new Uint8Array(header.length + body.length);
  out.set(header, 0);
  out.set(body as ArrayLike<number>, header.length);
  return out;
}

export function encode(packet: OutgoingPacket): Uint8Array {
  switch (packet.cmd) {
    case 'connect': {
      let flags = 0;
      if (packet.username !== undefined) flags |= 0x80;
      if (packet.password !== undefined) flags |= 0x40;
      if (packet.clean) flags |= 0x02;
      const body = [
        ...str('MQIsdp'),
        3,
        flags,
        ...u16(packet.keepalive),
        ...str(packet.clientId),
        ...(packet.username !== undefined ? str(packet.username) : []),
        ...(packet.password !== undefined ? str(packet.password) : []),
      ];
      return frame(TYPE.connect << 4, body);
    }
    case 'subscribe': {
      const body = [
        ...u16(packet.messageId),
        ...packet.subscriptions.flatMap((s) => [...str(s.topic), s.qos]),
      ];
      return frame((TYPE.subscribe << 4) | 0x02, body);
    }
    case 'publish': {
      const first =
        (TYPE.publish << 4) |
        (packet.dup ? 0x08 : 0) |
        (packet.qos << 1) |
        (packet.retain ? 0x01 : 0);
      const head = [...str(packet.topic), ...(packet.qos > 0 ? u16(packet.messageId ?? 0) : [])];
      const body = new Uint8Array(head.length + packet.payload.length);
      body.set(head, 0);
      body.set(packet.payload, head.length);
      return frame(first, body);
    }
    case 'puback':
      return frame(TYPE.puback << 4, u16(packet.messageId));
    case 'pingreq':
      return frame(TYPE.pingreq << 4, []);
    case 'disconnect':
      return frame(TYPE.disconnect << 4, []);
  }
}

// ── decode ────────────────────────────────────────────────────────────────────────────────

function readU16(b: Uint8Array, at: number): number {
  return ((b[at] as number) << 8) | (b[at + 1] as number);
}

function readStr(b: Uint8Array, at: number): [string, number] {
  const len = readU16(b, at);
  return [utf8Decode(b.subarray(at + 2, at + 2 + len)), at + 2 + len];
}

function decodeBody(first: number, body: Uint8Array): Packet {
  const type = first >> 4;
  switch (type) {
    case TYPE.connack:
      return {
        cmd: 'connack',
        sessionPresent: ((body[0] ?? 0) & 0x01) === 1,
        returnCode: body[1] ?? 0,
      };
    case TYPE.suback:
      return { cmd: 'suback', messageId: readU16(body, 0), granted: Array.from(body.subarray(2)) };
    case TYPE.publish: {
      const qos = ((first >> 1) & 0x03) as QoS;
      const [topic, next] = readStr(body, 0);
      const messageId = qos > 0 ? readU16(body, next) : undefined;
      const payload = body.slice(qos > 0 ? next + 2 : next);
      return {
        cmd: 'publish',
        topic,
        payload,
        qos,
        ...(messageId !== undefined ? { messageId } : {}),
        dup: (first & 0x08) !== 0,
        retain: (first & 0x01) !== 0,
      };
    }
    case TYPE.puback:
      return { cmd: 'puback', messageId: readU16(body, 0) };
    case TYPE.pingreq:
      return { cmd: 'pingreq' };
    case TYPE.pingresp:
      return { cmd: 'pingresp' };
    case TYPE.disconnect:
      return { cmd: 'disconnect' };
    default:
      return { cmd: 'unknown', type };
  }
}

/** MirAIe status pushes are a few hundred bytes; anything near this is not from a real AC. */
export const MAX_PACKET_BYTES = 1024 * 1024;

/** Streaming decoder: feed it socket chunks; it returns every complete packet so far. */
export class Decoder {
  private buffer = new Uint8Array(0);
  private readonly maxPacketBytes: number;

  constructor({ maxPacketBytes = MAX_PACKET_BYTES }: { maxPacketBytes?: number } = {}) {
    this.maxPacketBytes = maxPacketBytes;
  }

  push(chunk: Uint8Array): Packet[] {
    const joined = new Uint8Array(this.buffer.length + chunk.length);
    joined.set(this.buffer, 0);
    joined.set(chunk, this.buffer.length);
    this.buffer = joined;

    const packets: Packet[] = [];
    for (;;) {
      const header = this.readHeader();
      if (!header) break;
      const { first, length, headerSize } = header;
      if (this.buffer.length < headerSize + length) break;
      const body = this.buffer.subarray(headerSize, headerSize + length);
      packets.push(decodeBody(first, body));
      this.buffer = this.buffer.slice(headerSize + length);
    }
    return packets;
  }

  private readHeader(): { first: number; length: number; headerSize: number } | null {
    const b = this.buffer;
    if (b.length < 2) return null;
    let length = 0;
    let multiplier = 1;
    for (let i = 1; i <= 4; i++) {
      if (i >= b.length) return null;
      const byte = b[i] as number;
      length += (byte & 0x7f) * multiplier;
      if ((byte & 0x80) === 0) {
        // Refuse before buffering: a hostile length would otherwise grow memory without bound.
        if (length > this.maxPacketBytes) throw new MqttProtocolError('Packet too large');
        return { first: b[0] as number, length, headerSize: i + 1 };
      }
      multiplier *= 128;
    }
    throw new MqttProtocolError('Malformed remaining length');
  }
}
