// The one interface the app talks to. Two implementations: live MirAIe (live-backend.ts) and the
// in-memory demo (demo/demo-backend.ts), so every screen can be built and tested without the
// account (CHILL-002). Errors thrown are the classes in errors.ts.

import type {
  AcCommand,
  AcStatus,
  BackendEvent,
  ConnectionState,
  CredentialStore,
  Home,
  StoredCredentials,
} from './types';

export interface MiraieBackend {
  readonly kind: 'live' | 'demo';
  /** Throws WrongCredentialsError / NotRegisteredError / MiraieNetworkError. */
  signIn(loginId: string, password: string): Promise<void>;
  /** Signs in from stored credentials without a network call. True when there were some. */
  restore(): Promise<boolean>;
  /** Deletes the stored credentials and closes the live connection. */
  signOut(): Promise<void>;
  getLoginId(): string | null;
  /** The first home and its ACs; also opens the live connection. */
  getHome(): Promise<Home>;
  getStatus(deviceId: string): Promise<AcStatus>;
  /** Resolves once the command has left the phone. Offline AC → DeviceOfflineError. */
  send(deviceId: string, command: AcCommand): Promise<void>;
  /** The live connection right now (events report changes). */
  getConnectionState(): ConnectionState;
  /** Status pushes, connection changes and `signed-out`. Returns the unsubscribe function. */
  subscribe(listener: (event: BackendEvent) => void): () => void;
}

/** Keeps credentials in memory only — for the demo backend, tests and the spike. */
export function createMemoryCredentialStore(initial: StoredCredentials | null = null) {
  let stored = initial;
  const store: CredentialStore & { peek(): StoredCredentials | null } = {
    load: async () => stored,
    save: async (credentials) => {
      stored = credentials;
    },
    clear: async () => {
      stored = null;
    },
    peek: () => stored,
  };
  return store;
}

/** A small listener set shared by both backends. */
export function createEmitter() {
  const listeners = new Set<(event: BackendEvent) => void>();
  return {
    emit(event: BackendEvent) {
      for (const listener of [...listeners]) listener(event);
    },
    subscribe(listener: (event: BackendEvent) => void) {
      listeners.add(listener);
      return () => void listeners.delete(listener);
    },
  };
}
