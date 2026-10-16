// The tiny socket surface the MQTT session needs, so the same session runs over
// react-native-tcp-socket TLS on the phone (socket.native.ts) and Node net/tls in tests and the
// spike (socket.node.ts) (CHILL-002).

export interface SocketHandlers {
  /** The connection (and TLS handshake, when TLS) is up. */
  onConnect(): void;
  onData(bytes: Uint8Array): void;
  /** Called once, after an error or when either side closes. */
  onClose(): void;
  onError(error: Error): void;
}

export interface MqttSocket {
  write(bytes: Uint8Array): void;
  destroy(): void;
}

export type SocketFactory = (
  target: { host: string; port: number },
  handlers: SocketHandlers,
) => MqttSocket;
