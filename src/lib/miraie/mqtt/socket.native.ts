// The phone's raw TLS socket to mqtt.miraie.in:8883, through react-native-tcp-socket (there is no
// MQTT-over-WebSocket endpoint). The native module exists only in a development build, so the
// library is required lazily: in Expo Go or on web `createNativeTlsSocketFactory()` returns null
// and the app stays on the demo backend (CHILL-002 Task 8, CHILL-011 AC-4).
//
// Certificates are verified by iOS against the system trust store with the host as peer name
// (the library's default when no `ca` is given). Never pass rejectUnauthorized: false.

import { NativeModules } from 'react-native';

import type { SocketFactory } from './socket-types';

type TlsSocket = {
  on(event: 'data', listener: (data: Uint8Array | string) => void): void;
  on(event: 'error', listener: (error: Error) => void): void;
  on(event: 'close', listener: () => void): void;
  write(bytes: Uint8Array): boolean;
  destroy(): void;
};

type TcpSocketModule = {
  connectTLS(options: { host: string; port: number }, callback: () => void): TlsSocket;
};

/** Null when the native module isn't in this build (Expo Go, web). */
export function createNativeTlsSocketFactory(): SocketFactory | null {
  if (!NativeModules.TcpSockets) return null;
  let TcpSocket: TcpSocketModule;
  try {
    // Lazy on purpose: importing react-native-tcp-socket without its native module throws.
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    TcpSocket = require('react-native-tcp-socket').default as TcpSocketModule;
  } catch {
    return null;
  }

  return ({ host, port }, handlers) => {
    const socket = TcpSocket.connectTLS({ host, port }, () => handlers.onConnect());
    socket.on('data', (data) => {
      // The library's Buffer is a Uint8Array subclass; copy so later reads can't be overwritten.
      handlers.onData(
        typeof data === 'string'
          ? Uint8Array.from(data, (c) => c.charCodeAt(0))
          : new Uint8Array(data),
      );
    });
    socket.on('error', (error) => handlers.onError(error));
    socket.on('close', () => handlers.onClose());
    return {
      write: (bytes) => void socket.write(bytes),
      destroy: () => socket.destroy(),
    };
  };
}
