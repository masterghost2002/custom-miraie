// MirAIe status JSON (REST `…/mobile/status` and MQTT `{topic}/status` pushes) → AcStatus.
// Mirrors the reference's DeviceStatus parsing (api.py `_get_device_status`), except that
// unknown values become 'unknown' / null instead of throwing (CHILL-002 AC-4).

import type { AcMode, AcStatus, FanSpeed, Preset, SwingPosition } from './types';

const MODES: readonly AcMode[] = ['cool', 'auto', 'dry', 'fan', 'heat'];
const FAN_SPEEDS: readonly FanSpeed[] = ['auto', 'quiet', 'low', 'medium', 'high'];
const SWING_POSITIONS: readonly SwingPosition[] = [0, 1, 2, 3, 4, 5];

type Json = Record<string, unknown>;

function isObject(value: unknown): value is Json {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function onOff(value: unknown): boolean {
  return value === 'on' || value === true;
}

function toTemp(value: unknown): number | null {
  if (typeof value === 'number') return Number.isFinite(value) ? value : null;
  if (typeof value !== 'string' || value.trim() === '') return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

function toMode(value: unknown): AcMode | 'unknown' {
  return MODES.find((m) => m === value) ?? 'unknown';
}

function toFan(value: unknown): FanSpeed | 'unknown' {
  return FAN_SPEEDS.find((f) => f === value) ?? 'unknown';
}

function toSwing(value: unknown): SwingPosition | 'unknown' {
  const n = typeof value === 'string' && value.trim() !== '' ? Number(value) : value;
  return SWING_POSITIONS.find((p) => p === n) ?? 'unknown';
}

function toOnline(value: unknown): boolean {
  return value === 'true' || value === true;
}

/** Reference rule: boost if acpm is on, else eco if acem is on, else none. */
function toPreset(acpm: unknown, acem: unknown): Preset {
  if (onOff(acpm)) return 'boost';
  if (onOff(acem)) return 'eco';
  return 'none';
}

/** A complete status. Missing keys fall back to off / unknown. */
export function parseStatus(json: unknown): AcStatus {
  const s = isObject(json) ? json : {};
  return {
    online: toOnline(s.onlineStatus),
    power: onOff(s.ps),
    mode: toMode(s.acmd),
    targetTemp: toTemp(s.actmp),
    roomTemp: toTemp(s.rmtmp),
    fan: toFan(s.acfs),
    display: onOff(s.acdc),
    preset: toPreset(s.acpm, s.acem),
    swingV: toSwing(s.acvs),
    swingH: toSwing(s.achs),
  };
}

/**
 * Only the fields a (possibly partial) push carries, to merge into a cached status.
 * The preset is included only when the keys present decide it.
 */
export function parseStatusPatch(json: unknown): Partial<AcStatus> {
  if (!isObject(json)) return {};
  const patch: Partial<AcStatus> = {};
  if ('onlineStatus' in json) patch.online = toOnline(json.onlineStatus);
  if ('ps' in json) patch.power = onOff(json.ps);
  if ('acmd' in json) patch.mode = toMode(json.acmd);
  if ('actmp' in json) patch.targetTemp = toTemp(json.actmp);
  if ('rmtmp' in json) patch.roomTemp = toTemp(json.rmtmp);
  if ('acfs' in json) patch.fan = toFan(json.acfs);
  if ('acdc' in json) patch.display = onOff(json.acdc);

  const hasPm = 'acpm' in json;
  const hasEm = 'acem' in json;
  if (hasPm && onOff(json.acpm)) patch.preset = 'boost';
  else if (hasEm && onOff(json.acem)) patch.preset = 'eco';
  else if (hasPm && hasEm) patch.preset = 'none';

  if ('acvs' in json) patch.swingV = toSwing(json.acvs);
  if ('achs' in json) patch.swingH = toSwing(json.achs);
  return patch;
}
