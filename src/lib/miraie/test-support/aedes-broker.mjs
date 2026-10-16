// A real MQTT broker (aedes) for the session tests, run as its own Node process: aedes is ESM and
// babel-jest's transform breaks its async checks, so the tests talk to it over localhost and
// read what it saw as JSON lines on stdout (CHILL-002 AC-7, AC-8). Test-only; never bundled.
//
// argv[2]: JSON array of accepted passwords ([] = accept any).
// stdin commands (one JSON per line): {cmd:"publish", topic, payload, qos?}, {cmd:"passwords",
// passwords}, {cmd:"kick"}.
import { Buffer } from 'node:buffer';
import net from 'node:net';
import readline from 'node:readline';

import { Aedes } from 'aedes';

const emit = (event) => process.stdout.write(`${JSON.stringify(event)}\n`);

let passwords = new Set(JSON.parse(process.argv[2] ?? '[]'));

const broker = await Aedes.createBroker({
  preConnect(client, packet, callback) {
    emit({
      event: 'connect',
      protocolId: packet.protocolId,
      protocolVersion: packet.protocolVersion,
      clean: packet.clean,
      keepalive: packet.keepalive,
      clientId: packet.clientId,
      username: packet.username,
    });
    callback(null, true);
  },
  authenticate(client, username, password, done) {
    const given = password ? password.toString() : '';
    if (passwords.size === 0 || passwords.has(given)) return done(null, true);
    const error = new Error('Bad username or password');
    error.returnCode = 4;
    return done(error, null);
  },
});

broker.on('subscribe', (subscriptions) =>
  emit({
    event: 'subscribe',
    subscriptions: subscriptions.map(({ topic, qos }) => ({ topic, qos })),
  }),
);
broker.on('publish', (packet, client) => {
  if (client) {
    emit({
      event: 'publish',
      topic: packet.topic,
      payload: packet.payload.toString(),
      qos: packet.qos,
    });
  }
});
broker.on('ack', (packet) => emit({ event: 'ack', topic: packet?.topic }));
broker.on('ping', () => emit({ event: 'ping' }));
broker.on('clientDisconnect', () => emit({ event: 'clientDisconnect' }));

const server = net.createServer(broker.handle);
server.listen(0, '127.0.0.1', () => emit({ event: 'listening', port: server.address().port }));

readline.createInterface({ input: process.stdin }).on('line', (line) => {
  const command = JSON.parse(line);
  if (command.cmd === 'publish') {
    broker.publish(
      {
        cmd: 'publish',
        topic: command.topic,
        payload: Buffer.from(command.payload),
        qos: command.qos ?? 1,
        retain: false,
        dup: false,
      },
      () => emit({ event: 'published', topic: command.topic }),
    );
  } else if (command.cmd === 'passwords') {
    passwords = new Set(command.passwords);
    emit({ event: 'passwords' });
  } else if (command.cmd === 'kick') {
    for (const client of Object.values(broker.clients)) client.conn.destroy();
    emit({ event: 'kicked' });
  }
});

process.stdin.on('end', () => {
  server.close();
  broker.close(() => process.exit(0));
});
