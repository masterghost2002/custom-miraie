// What a command does to an AC's status, so the cache can change before the device confirms.
// Used for optimistic updates (react/use-ac-command.ts) and by the demo backend; the next status
// push from the real AC always wins (CHILL-002).

import { ECO_TEMP } from './constants';
import type { AcCommand, AcStatus } from './types';

export function applyCommand(status: AcStatus, command: AcCommand): AcStatus {
  switch (command.kind) {
    case 'power':
      return { ...status, power: command.on };
    case 'temperature':
      return { ...status, targetTemp: command.value };
    case 'mode':
      return { ...status, mode: command.mode };
    case 'fan':
      return { ...status, fan: command.speed };
    case 'preset':
      return command.preset === 'eco'
        ? { ...status, preset: 'eco', targetTemp: ECO_TEMP }
        : { ...status, preset: command.preset };
    case 'swingV':
      return { ...status, swingV: command.position };
    case 'swingH':
      return { ...status, swingH: command.position };
    case 'display':
      return { ...status, display: command.on };
  }
}
