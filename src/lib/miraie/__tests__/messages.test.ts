import { applyCommand } from '../apply-command';
import {
  buildCommandMessage,
  buildDisplayMessage,
  buildFanMessage,
  buildHorizontalSwingMessage,
  buildModeMessage,
  buildPowerchillMessage,
  buildPowerMessage,
  buildPowerPlanMessage,
  buildPresetMessage,
  buildTemperatureMessage,
  buildVerticalSwingMessage,
  connectionStatusTopic,
  controlTopic,
  statusTopic,
} from '../messages';
import { parseStatus } from '../status';
import type { AcCommand, AcStatus } from '../types';

// Expected strings are the reference's own output: broker.py's `_build_*_message` methods run under
// python3 (paho stubbed out) on 2026-10-16. json.dumps puts a space after ':' and ',' and writes the
// eco temperature as the float 26.0 — we match it byte for byte.
const B = '{"ki": 1, "cnt": "an", "sid": "1", ';

describe('control message builders', () => {
  it.each([
    ['power on', () => buildPowerMessage(true), `${B}"ps": "on"}`],
    ['power off', () => buildPowerMessage(false), `${B}"ps": "off"}`],
    ['temp 24', () => buildTemperatureMessage(24), `${B}"actmp": "24.0"}`],
    ['temp 16', () => buildTemperatureMessage(16), `${B}"actmp": "16.0"}`],
    ['temp 30', () => buildTemperatureMessage(30), `${B}"actmp": "30.0"}`],
    ['temp 23.5', () => buildTemperatureMessage(23.5), `${B}"actmp": "23.5"}`],
    ['mode cool', () => buildModeMessage('cool'), `${B}"acmd": "cool"}`],
    ['mode auto', () => buildModeMessage('auto'), `${B}"acmd": "auto"}`],
    ['mode dry', () => buildModeMessage('dry'), `${B}"acmd": "dry"}`],
    ['mode fan', () => buildModeMessage('fan'), `${B}"acmd": "fan"}`],
    ['mode heat', () => buildModeMessage('heat'), `${B}"acmd": "heat"}`],
    ['fan auto', () => buildFanMessage('auto'), `${B}"acfs": "auto"}`],
    ['fan quiet', () => buildFanMessage('quiet'), `${B}"acfs": "quiet"}`],
    ['fan low', () => buildFanMessage('low'), `${B}"acfs": "low"}`],
    ['fan medium', () => buildFanMessage('medium'), `${B}"acfs": "medium"}`],
    ['fan high', () => buildFanMessage('high'), `${B}"acfs": "high"}`],
    ['preset none', () => buildPresetMessage('none'), `${B}"acem": "off", "acpm": "off"}`],
    [
      'preset eco',
      () => buildPresetMessage('eco'),
      `${B}"acem": "on", "acpm": "off", "actmp": 26.0}`,
    ],
    ['preset boost', () => buildPresetMessage('boost'), `${B}"acem": "off", "acpm": "on"}`],
    ['swingV 0', () => buildVerticalSwingMessage(0), `${B}"acvs": 0}`],
    ['swingV 1', () => buildVerticalSwingMessage(1), `${B}"acvs": 1}`],
    ['swingV 2', () => buildVerticalSwingMessage(2), `${B}"acvs": 2}`],
    ['swingV 3', () => buildVerticalSwingMessage(3), `${B}"acvs": 3}`],
    ['swingV 4', () => buildVerticalSwingMessage(4), `${B}"acvs": 4}`],
    ['swingV 5', () => buildVerticalSwingMessage(5), `${B}"acvs": 5}`],
    ['swingH 0', () => buildHorizontalSwingMessage(0), `${B}"achs": 0}`],
    ['swingH 1', () => buildHorizontalSwingMessage(1), `${B}"achs": 1}`],
    ['swingH 2', () => buildHorizontalSwingMessage(2), `${B}"achs": 2}`],
    ['swingH 3', () => buildHorizontalSwingMessage(3), `${B}"achs": 3}`],
    ['swingH 4', () => buildHorizontalSwingMessage(4), `${B}"achs": 4}`],
    ['swingH 5', () => buildHorizontalSwingMessage(5), `${B}"achs": 5}`],
    ['display on', () => buildDisplayMessage(true), `${B}"acdc": "on"}`],
    ['display off', () => buildDisplayMessage(false), `${B}"acdc": "off"}`],
    ['plan eco', () => buildPowerPlanMessage('eco'), `${B}"acem": "on", "acpm": "off"}`],
    ['plan normal', () => buildPowerPlanMessage('normal'), `${B}"acem": "off"}`],
    ['powerchill on', () => buildPowerchillMessage(true), `${B}"acpm": "on", "acem": "off"}`],
    ['powerchill off', () => buildPowerchillMessage(false), `${B}"acpm": "off"}`],
  ])(
    'AC-5: given %s, when the builder runs, then the JSON equals the reference',
    (_, build, expected) => {
      expect(build()).toBe(expected);
    },
  );

  it('AC-5: given every message, when parsed as JSON, then it starts with the reference base', () => {
    expect(JSON.parse(buildPresetMessage('eco'))).toEqual({
      ki: 1,
      cnt: 'an',
      sid: '1',
      acem: 'on',
      acpm: 'off',
      actmp: 26,
    });
  });

  it.each([15, 31, Number.NaN, Number.POSITIVE_INFINITY])(
    'given temperature %p outside 16–30, when built, then it throws instead of sending it',
    (value) => {
      expect(() => buildTemperatureMessage(value)).toThrow(RangeError);
    },
  );

  it.each<[AcCommand, string]>([
    [{ kind: 'power', on: false }, `${B}"ps": "off"}`],
    [{ kind: 'temperature', value: 21 }, `${B}"actmp": "21.0"}`],
    [{ kind: 'mode', mode: 'dry' }, `${B}"acmd": "dry"}`],
    [{ kind: 'fan', speed: 'high' }, `${B}"acfs": "high"}`],
    [{ kind: 'preset', preset: 'boost' }, `${B}"acem": "off", "acpm": "on"}`],
    [{ kind: 'swingV', position: 5 }, `${B}"acvs": 5}`],
    [{ kind: 'swingH', position: 0 }, `${B}"achs": 0}`],
    [{ kind: 'display', on: true }, `${B}"acdc": "on"}`],
  ])('given command %j, when built, then the matching builder output is used', (command, json) => {
    expect(buildCommandMessage(command)).toBe(json);
  });

  it('given a base topic, then control/status/connectionStatus topics hang off it', () => {
    expect(controlTopic('abc/def')).toBe('abc/def/control');
    expect(statusTopic('abc/def')).toBe('abc/def/status');
    expect(connectionStatusTopic('abc/def')).toBe('abc/def/connectionStatus');
  });
});

describe('applyCommand', () => {
  const on: AcStatus = parseStatus({
    onlineStatus: 'true',
    ps: 'on',
    actmp: '24.0',
    rmtmp: '27.0',
    acmd: 'cool',
    acfs: 'auto',
    acdc: 'on',
    acpm: 'off',
    acem: 'off',
    acvs: 3,
    achs: 0,
  });

  it.each<[AcCommand, Partial<AcStatus>]>([
    [{ kind: 'power', on: false }, { power: false }],
    [{ kind: 'temperature', value: 21 }, { targetTemp: 21 }],
    [{ kind: 'mode', mode: 'fan' }, { mode: 'fan' }],
    [{ kind: 'fan', speed: 'quiet' }, { fan: 'quiet' }],
    [
      { kind: 'preset', preset: 'eco' },
      { preset: 'eco', targetTemp: 26 },
    ],
    [{ kind: 'preset', preset: 'boost' }, { preset: 'boost' }],
    [{ kind: 'swingV', position: 1 }, { swingV: 1 }],
    [{ kind: 'swingH', position: 4 }, { swingH: 4 }],
    [{ kind: 'display', on: false }, { display: false }],
  ])('given %j, when applied, then only the expected fields change', (command, changed) => {
    expect(applyCommand(on, command)).toEqual({ ...on, ...changed });
  });

  it('given eco on, when the preset is set to none, then the temperature stays where eco left it', () => {
    const eco = applyCommand(on, { kind: 'preset', preset: 'eco' });
    expect(applyCommand(eco, { kind: 'preset', preset: 'none' })).toMatchObject({
      preset: 'none',
      targetTemp: 26,
    });
  });

  it('given a status, when a command is applied, then the original is not mutated', () => {
    const before = { ...on };
    applyCommand(on, { kind: 'power', on: false });
    expect(on).toEqual(before);
  });
});
