// Node sockets for the session: plain TCP for the local aedes broker in tests, TLS (certificates
// verified, SNI = host) for `pnpm spike:miraie`. Never imported by the app (CHILL-002).
import net from 'node:net';
import tls from 'node:tls';

import type { MqttSocket, SocketFactory, SocketHandlers } from './socket';

function wire(socket: net.Socket, handlers: SocketHandlers, connectEvent: string): MqttSocket {
  socket.once(connectEvent, () => handlers.onConnect());
  socket.on('data', (chunk: Buffer) => handlers.onData(new Uint8Array(chunk)));
  socket.on('error', (error) => handlers.onError(error));
  socket.once('close', () => handlers.onClose());
  return {
    write: (bytes) => void socket.write(bytes),
    destroy: () => void socket.destroy(),
  };
}

export const nodeTcpSocketFactory: SocketFactory = ({ host, port }, handlers) =>
  wire(net.connect({ host, port }), handlers, 'connect');

export const nodeTlsSocketFactory: SocketFactory = ({ host, port }, handlers) =>
  wire(tls.connect({ host, port, servername: host }), handlers, 'secureConnect');
