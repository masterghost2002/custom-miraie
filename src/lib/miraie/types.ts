// The shapes the app sees. Wire formats (MirAIe JSON) are parsed into these in status.ts and
// rest.ts; payloads going out are built only in messages.ts (CHILL-002).

export type AcMode = 'cool' | 'dry' | 'fan' | 'heat' | 'auto';
export type FanSpeed = 'auto' | 'quiet' | 'low' | 'medium' | 'high';
/** `boost` is MirAIe's "powerchill". Eco and boost are never on together. */
export type Preset = 'none' | 'eco' | 'boost';
/** 0 = swinging (auto); 1–5 = fixed louvre positions. */
export type SwingPosition = 0 | 1 | 2 | 3 | 4 | 5;

export interface AcStatus {
  online: boolean;
  power: boolean;
  mode: AcMode | 'unknown';
  /** °C; null when MirAIe sent something we can't read. */
  targetTemp: number | null;
  roomTemp: number | null;
  fan: FanSpeed | 'unknown';
  /** The indoor unit's display light. */
  display: boolean;
  preset: Preset;
  swingV: SwingPosition | 'unknown';
  swingH: SwingPosition | 'unknown';
}

export interface AcModel {
  modelName?: string;
  modelNumber?: string;
  firmwareVersion?: string;
  brand?: string;
}

export interface AcDevice {
  id: string;
  /** MirAIe device name, e.g. "Bedroom AC". */
  name: string;
  /** MirAIe space (room) name, e.g. "Bedroom". */
  room: string;
  /** MQTT base topic; `/control`, `/status`, `/connectionStatus` hang off it. */
  topic: string;
  model: AcModel;
}

/** The home's ACs. Its MirAIe home id (the MQTT username) stays inside the client. */
export interface Home {
  devices: AcDevice[];
  /** Status of each AC when the home was loaded, by device id. Read live status with `useAcStatus`. */
  statuses: Record<string, AcStatus>;
}

export type AcCommand =
  | { kind: 'power'; on: boolean }
  | { kind: 'temperature'; value: number }
  | { kind: 'mode'; mode: AcMode }
  | { kind: 'fan'; speed: FanSpeed }
  | { kind: 'preset'; preset: Preset }
  | { kind: 'swingV'; position: SwingPosition }
  | { kind: 'swingH'; position: SwingPosition }
  | { kind: 'display'; on: boolean };

/** What the app keeps in secure storage so it can sign in again by itself (CHILL-002 Q1). */
export interface StoredCredentials {
  loginId: string;
  password: string;
  accessToken: string;
  refreshToken: string;
  userId: string;
  expiresIn: number;
}

export interface CredentialStore {
  load(): Promise<StoredCredentials | null>;
  save(credentials: StoredCredentials): Promise<void>;
  clear(): Promise<void>;
}

export type ConnectionState = 'connecting' | 'connected' | 'disconnected';

export type BackendEvent =
  | { type: 'status'; deviceId: string; status: Partial<AcStatus> }
  | { type: 'signed-out' }
  | { type: 'connection'; state: ConnectionState };
