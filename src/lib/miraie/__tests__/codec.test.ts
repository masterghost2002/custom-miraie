/** @jest-environment node */
// Our hand-written MQTT 3.1 codec, checked against mqtt-packet as an oracle (CHILL-002 AC-6).
import * as mqtt from 'mqtt-packet';

import {
  Decoder,
  encode,
  MqttProtocolError,
  type OutgoingPacket,
  type Packet,
} from '../mqtt/codec';
import { utf8Decode, utf8Encode } from '../mqtt/utf8';

/** Parse bytes with mqtt-packet and return every packet it found. */
function oracleParse(bytes: Uint8Array): mqtt.Packet[] {
  const parser = mqtt.parser({ protocolVersion: 3 });
  const packets: mqtt.Packet[] = [];
  parser.on('packet', (p) => packets.push(p));
  parser.on('error', (e) => {
    throw e;
  });
  parser.parse(Buffer.from(bytes));
  return packets;
}

const oracleBytes = (packet: mqtt.Packet) =>
  new Uint8Array(mqtt.generate(packet, { protocolVersion: 3 }));

describe('encode → mqtt-packet decodes the same fields', () => {
  it('AC-6: CONNECT is MQIsdp level 3 with clean session false, keep-alive, client id, username and password', () => {
    const [packet] = oracleParse(
      encode({
        cmd: 'connect',
        clientId: 'an12345678901234567890',
        clean: false,
        keepalive: 60,
        username: 'home-1',
        password: 'access-token-1',
      }),
    );
    expect(packet).toMatchObject({
      cmd: 'connect',
      protocolId: 'MQIsdp',
      protocolVersion: 3,
      clean: false,
      keepalive: 60,
      clientId: 'an12345678901234567890',
      username: 'home-1',
    });
    expect(String((packet as mqtt.IConnectPacket).password)).toBe('access-token-1');
  });

  it('AC-6: CONNECT without credentials has no username or password', () => {
    const [packet] = oracleParse(
      encode({ cmd: 'connect', clientId: 'an1', clean: true, keepalive: 30 }),
    );
    expect(packet).toMatchObject({ cmd: 'connect', clean: true, keepalive: 30, clientId: 'an1' });
    expect((packet as mqtt.IConnectPacket).username).toBeUndefined();
    expect((packet as mqtt.IConnectPacket).password).toBeUndefined();
  });

  it('AC-6: SUBSCRIBE carries the message id and every topic at its qos', () => {
    const [packet] = oracleParse(
      encode({
        cmd: 'subscribe',
        messageId: 7,
        subscriptions: [
          { topic: 't/bed/status', qos: 1 },
          { topic: 't/bed/connectionStatus', qos: 1 },
        ],
      }),
    );
    expect(packet).toMatchObject({
      cmd: 'subscribe',
      messageId: 7,
      subscriptions: [
        { topic: 't/bed/status', qos: 1 },
        { topic: 't/bed/connectionStatus', qos: 1 },
      ],
    });
  });

  it('AC-6: PUBLISH qos 0 carries topic and payload and no message id', () => {
    const payload = '{"ki": 1, "cnt": "an", "sid": "1", "ps": "on"}';
    const [packet] = oracleParse(
      encode({ cmd: 'publish', topic: 't/bed/control', payload: utf8Encode(payload), qos: 0 }),
    );
    expect(packet).toMatchObject({ cmd: 'publish', topic: 't/bed/control', qos: 0, retain: false });
    expect(String((packet as mqtt.IPublishPacket).payload)).toBe(payload);
  });

  it('AC-6: PUBLISH qos 1 carries its message id, dup and retain flags', () => {
    const [packet] = oracleParse(
      encode({
        cmd: 'publish',
        topic: 'a/b',
        payload: utf8Encode('x'),
        qos: 1,
        messageId: 300,
        dup: true,
        retain: true,
      }),
    );
    expect(packet).toMatchObject({
      cmd: 'publish',
      qos: 1,
      messageId: 300,
      dup: true,
      retain: true,
    });
  });

  it('AC-6: a PUBLISH longer than 16 KB uses a 3-byte remaining length', () => {
    const big = 'é'.repeat(9000); // 18 000 bytes in UTF-8
    const [packet] = oracleParse(
      encode({ cmd: 'publish', topic: 't', payload: utf8Encode(big), qos: 0 }),
    );
    expect(String((packet as mqtt.IPublishPacket).payload)).toBe(big);
  });

  it.each(['puback', 'pingreq', 'disconnect'] as const)('AC-6: %s round-trips', (cmd) => {
    const ours: OutgoingPacket = cmd === 'puback' ? { cmd, messageId: 42 } : { cmd };
    const [packet] = oracleParse(encode(ours));
    expect(packet).toMatchObject(ours);
  });
});

describe('mqtt-packet output → our decoder', () => {
  const decodeAll = (bytes: Uint8Array) => new Decoder().push(bytes);

  it.each([0, 4, 5])('AC-6: CONNACK with return code %i', (returnCode) => {
    expect(decodeAll(oracleBytes({ cmd: 'connack', returnCode, sessionPresent: false }))).toEqual([
      { cmd: 'connack', returnCode, sessionPresent: false },
    ]);
  });

  it('AC-6: SUBACK with granted qos list', () => {
    expect(decodeAll(oracleBytes({ cmd: 'suback', messageId: 9, granted: [1, 1, 128] }))).toEqual([
      { cmd: 'suback', messageId: 9, granted: [1, 1, 128] },
    ]);
  });

  it('AC-6: PUBLISH qos 1 from the broker', () => {
    const payload = '{"ps":"off","actmp":"23.0"}';
    const [packet] = decodeAll(
      oracleBytes({
        cmd: 'publish',
        topic: 't/bed/status',
        payload: Buffer.from(payload),
        qos: 1,
        messageId: 12,
        dup: false,
        retain: false,
      }),
    );
    expect(packet).toMatchObject({
      cmd: 'publish',
      topic: 't/bed/status',
      qos: 1,
      messageId: 12,
      dup: false,
      retain: false,
    });
    expect(utf8Decode((packet as Extract<Packet, { cmd: 'publish' }>).payload)).toBe(payload);
  });

  it.each(['pingresp', 'pingreq', 'disconnect'] as const)('AC-6: %s', (cmd) => {
    expect(decodeAll(oracleBytes({ cmd } as mqtt.Packet))).toEqual([{ cmd }]);
  });

  it('AC-6: PUBACK', () => {
    expect(decodeAll(oracleBytes({ cmd: 'puback', messageId: 5 }))).toEqual([
      { cmd: 'puback', messageId: 5 },
    ]);
  });

  it('AC-6: several packets in one chunk come out in order', () => {
    const chunk = Buffer.concat([
      mqtt.generate({ cmd: 'connack', returnCode: 0, sessionPresent: false }),
      mqtt.generate({ cmd: 'suback', messageId: 1, granted: [1, 1] }),
      mqtt.generate({
        cmd: 'publish',
        topic: 't/s',
        payload: Buffer.from('{}'),
        qos: 0,
        dup: false,
        retain: false,
      }),
      mqtt.generate({ cmd: 'pingresp' }),
    ]);
    expect(decodeAll(new Uint8Array(chunk)).map((p) => p.cmd)).toEqual([
      'connack',
      'suback',
      'publish',
      'pingresp',
    ]);
  });

  it('AC-6: one packet split across chunks (byte by byte) is decoded once it is complete', () => {
    const bytes = oracleBytes({
      cmd: 'publish',
      topic: 'home/ac/status',
      payload: Buffer.from('x'.repeat(200)), // 2-byte remaining length, split too
      qos: 1,
      messageId: 3,
      dup: false,
      retain: false,
    });
    const decoder = new Decoder();
    const out: Packet[] = [];
    for (const byte of bytes) out.push(...decoder.push(Uint8Array.of(byte)));
    expect(out).toHaveLength(1);
    expect(out[0]).toMatchObject({ cmd: 'publish', topic: 'home/ac/status', messageId: 3 });
  });

  it('AC-6: a chunk ending mid-packet keeps the tail for the next chunk', () => {
    const a = oracleBytes({ cmd: 'pingresp' });
    const b = oracleBytes({ cmd: 'suback', messageId: 2, granted: [1] });
    const decoder = new Decoder();
    const first = decoder.push(Uint8Array.from([...a, ...b.slice(0, 2)]));
    const second = decoder.push(b.slice(2));
    expect(first).toEqual([{ cmd: 'pingresp' }]);
    expect(second).toEqual([{ cmd: 'suback', messageId: 2, granted: [1] }]);
  });

  it('given a remaining length longer than 4 bytes, when decoded, then it throws MqttProtocolError', () => {
    expect(() => new Decoder().push(Uint8Array.of(0x30, 0xff, 0xff, 0xff, 0xff, 0x01))).toThrow(
      MqttProtocolError,
    );
  });

  it('given a packet type we never use, when decoded, then it is reported as unknown and skipped over', () => {
    const unsuback = Uint8Array.of(0xb0, 0x02, 0x00, 0x01);
    const pingresp = oracleBytes({ cmd: 'pingresp' });
    expect(new Decoder().push(Uint8Array.from([...unsuback, ...pingresp]))).toEqual([
      { cmd: 'unknown', type: 11 },
      { cmd: 'pingresp' },
    ]);
  });
});

describe('utf8', () => {
  it.each(['', 'plain', 'Bedroom · 24°', '漢字', '🙂 emoji'])('round-trips %p like Buffer', (s) => {
    expect(Array.from(utf8Encode(s))).toEqual(Array.from(Buffer.from(s, 'utf8')));
    expect(utf8Decode(new Uint8Array(Buffer.from(s, 'utf8')))).toBe(s);
  });

  it('replaces invalid bytes with U+FFFD instead of throwing', () => {
    expect(utf8Decode(Uint8Array.of(0x61, 0xff, 0x62))).toBe('a\uFFFDb');
    expect(utf8Decode(Uint8Array.of(0xe2, 0x82))).toBe('\uFFFD'); // cut short
    expect(utf8Decode(Uint8Array.of(0xc3, 0x41))).toBe('\uFFFDA'); // bad continuation byte
  });
});
