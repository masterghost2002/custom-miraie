// The ONLY place MQTT control payloads are built (miraie-protocol skill). Each builder mirrors
// broker.py's `_build_*_message` in the reference library, down to the bytes: Python's
// json.dumps puts a space after ':' and ',' and prints floats with a decimal point, so we
// serialise by hand instead of JSON.stringify (CHILL-002 AC-5).

import { ECO_TEMP, MAX_TEMP, MIN_TEMP } from './constants';
import type { AcCommand, AcMode, FanSpeed, Preset, SwingPosition } from './types';

/** A float that must print like Python's `repr(float)`, e.g. 26 → `26.0`. */
class PyFloat {
  constructor(readonly value: number) {}
}

type Value = string | number | PyFloat;
type Entry = readonly [key: string, value: Value];

/** Python's str(float): whole numbers keep one decimal. */
function pyFloatString(n: number): string {
  return Number.isInteger(n) ? n.toFixed(1) : String(n);
}

function dumps(entries: readonly Entry[]): string {
  const body = entries
    .map(([key, value]) => {
      const json =
        value instanceof PyFloat
          ? pyFloatString(value.value)
          : typeof value === 'string'
            ? JSON.stringify(value)
            : String(value);
      return `${JSON.stringify(key)}: ${json}`;
    })
    .join(', ');
  return `{${body}}`;
}

/** `{ki: 1, cnt: "an", sid: "1"}` starts every control message. */
function message(...entries: Entry[]): string {
  return dumps([['ki', 1], ['cnt', 'an'], ['sid', '1'], ...entries]);
}

const onOff = (on: boolean) => (on ? 'on' : 'off');

export const controlTopic = (topic: string) => `${topic}/control`;
export const statusTopic = (topic: string) => `${topic}/status`;
export const connectionStatusTopic = (topic: string) => `${topic}/connectionStatus`;

export function buildPowerMessage(on: boolean): string {
  return message(['ps', onOff(on)]);
}

/** `actmp` goes as a string with one decimal, like the reference's `str(temp)`. */
export function buildTemperatureMessage(value: number): string {
  if (!Number.isFinite(value) || value < MIN_TEMP || value > MAX_TEMP) {
    throw new RangeError(`Temperature must be ${MIN_TEMP}–${MAX_TEMP} °C`);
  }
  return message(['actmp', pyFloatString(value)]);
}

export function buildModeMessage(mode: AcMode): string {
  return message(['acmd', mode]);
}

export function buildFanMessage(speed: FanSpeed): string {
  return message(['acfs', speed]);
}

/** Eco also sets 26° (as a number, not a string — reference behaviour). */
export function buildPresetMessage(preset: Preset): string {
  switch (preset) {
    case 'none':
      return message(['acem', 'off'], ['acpm', 'off']);
    case 'eco':
      return message(['acem', 'on'], ['acpm', 'off'], ['actmp', new PyFloat(ECO_TEMP)]);
    case 'boost':
      return message(['acem', 'off'], ['acpm', 'on']);
  }
}

export function buildVerticalSwingMessage(position: SwingPosition): string {
  return message(['acvs', position]);
}

export function buildHorizontalSwingMessage(position: SwingPosition): string {
  return message(['achs', position]);
}

export function buildDisplayMessage(on: boolean): string {
  return message(['acdc', onOff(on)]);
}

/** Reference `set_power_plan`: eco turns powerchill off; normal only turns eco off. */
export function buildPowerPlanMessage(plan: 'eco' | 'normal'): string {
  return plan === 'eco' ? message(['acem', 'on'], ['acpm', 'off']) : message(['acem', 'off']);
}

/** Reference `set_powerchill_mode`: powerchill on turns eco off. */
export function buildPowerchillMessage(enabled: boolean): string {
  return enabled ? message(['acpm', 'on'], ['acem', 'off']) : message(['acpm', 'off']);
}

export function buildCommandMessage(command: AcCommand): string {
  switch (command.kind) {
    case 'power':
      return buildPowerMessage(command.on);
    case 'temperature':
      return buildTemperatureMessage(command.value);
    case 'mode':
      return buildModeMessage(command.mode);
    case 'fan':
      return buildFanMessage(command.speed);
    case 'preset':
      return buildPresetMessage(command.preset);
    case 'swingV':
      return buildVerticalSwingMessage(command.position);
    case 'swingH':
      return buildHorizontalSwingMessage(command.position);
    case 'display':
      return buildDisplayMessage(command.on);
  }
}
