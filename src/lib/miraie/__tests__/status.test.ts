import { parseStatus, parseStatusPatch } from '../status';
import type { AcStatus } from '../types';

// A full status as MirAIe returns it over REST (learn/miraie-protocol.md › Payloads).
const bedroomJson = {
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
};

const bedroom: AcStatus = {
  online: true,
  power: true,
  mode: 'cool',
  targetTemp: 24,
  roomTemp: 27,
  fan: 'auto',
  display: true,
  preset: 'none',
  swingV: 3,
  swingH: 0,
};

describe('parseStatus', () => {
  it('AC-4: given a full status JSON, when parsed, then every field maps to AcStatus', () => {
    expect(parseStatus(bedroomJson)).toEqual(bedroom);
  });

  it.each([
    [{ acpm: 'on', acem: 'off' }, 'boost'],
    [{ acpm: 'off', acem: 'on' }, 'eco'],
    [{ acpm: 'off', acem: 'off' }, 'none'],
    // Never on together, but if both arrive the reference picks boost first.
    [{ acpm: 'on', acem: 'on' }, 'boost'],
  ] as const)('AC-4: given acpm/acem %j, when parsed, then preset is %s', (keys, preset) => {
    expect(parseStatus({ ...bedroomJson, ...keys }).preset).toBe(preset);
  });

  it.each(['cool', 'auto', 'dry', 'fan', 'heat'] as const)(
    'AC-4: given acmd "%s", when parsed, then mode is that mode',
    (mode) => {
      expect(parseStatus({ ...bedroomJson, acmd: mode }).mode).toBe(mode);
    },
  );

  it.each(['auto', 'quiet', 'low', 'medium', 'high'] as const)(
    'AC-4: given acfs "%s", when parsed, then fan is that speed',
    (fan) => {
      expect(parseStatus({ ...bedroomJson, acfs: fan }).fan).toBe(fan);
    },
  );

  it('AC-4: given unknown enum values, when parsed, then they become "unknown" instead of throwing', () => {
    const status = parseStatus({ ...bedroomJson, acmd: 'turbo', acfs: 'max', acvs: 9, achs: 'x' });
    expect(status.mode).toBe('unknown');
    expect(status.fan).toBe('unknown');
    expect(status.swingV).toBe('unknown');
    expect(status.swingH).toBe('unknown');
  });

  it('AC-4: given temperatures as numbers or unparsable strings, when parsed, then numbers survive and junk becomes null', () => {
    expect(parseStatus({ ...bedroomJson, actmp: 26, rmtmp: 'n/a' })).toMatchObject({
      targetTemp: 26,
      roomTemp: null,
    });
    expect(parseStatus({ ...bedroomJson, actmp: '24.5' }).targetTemp).toBe(24.5);
  });

  it('AC-4: given swing positions as strings, when parsed, then they become numbers', () => {
    expect(parseStatus({ ...bedroomJson, acvs: '5', achs: '1' })).toMatchObject({
      swingV: 5,
      swingH: 1,
    });
  });

  it('AC-4: given an offline AC that is off, when parsed, then online and power are false', () => {
    const status = parseStatus({ ...bedroomJson, onlineStatus: 'false', ps: 'off', acdc: 'off' });
    expect(status).toMatchObject({ online: false, power: false, display: false });
  });

  it('AC-4: given boolean onlineStatus, when parsed, then it is respected', () => {
    expect(parseStatus({ ...bedroomJson, onlineStatus: true }).online).toBe(true);
  });

  it('AC-4: given something that is not an object, when parsed, then it returns an unknown status', () => {
    expect(parseStatus(null)).toEqual({
      online: false,
      power: false,
      mode: 'unknown',
      targetTemp: null,
      roomTemp: null,
      fan: 'unknown',
      display: false,
      preset: 'none',
      swingV: 'unknown',
      swingH: 'unknown',
    });
  });
});

describe('parseStatusPatch', () => {
  it('given a push with only some keys, when parsed, then only those fields are returned', () => {
    expect(parseStatusPatch({ actmp: '23.0', ps: 'off' })).toEqual({
      targetTemp: 23,
      power: false,
    });
  });

  it('given a connectionStatus push, when parsed, then only online is returned', () => {
    expect(parseStatusPatch({ onlineStatus: 'false' })).toEqual({ online: false });
  });

  it.each([
    [{ acpm: 'on' }, { preset: 'boost' }],
    [{ acem: 'on' }, { preset: 'eco' }],
    [{ acem: 'on', acpm: 'off' }, { preset: 'eco' }],
    [{ acem: 'off', acpm: 'off' }, { preset: 'none' }],
    // One key "off" alone can't tell whether the other preset is still on.
    [{ acpm: 'off' }, {}],
    [{ acem: 'off' }, {}],
  ] as const)('given preset keys %j, when parsed, then the patch is %j', (json, patch) => {
    expect(parseStatusPatch(json)).toEqual(patch);
  });

  it('given every key, when parsed, then it equals parseStatus', () => {
    expect(parseStatusPatch(bedroomJson)).toEqual(bedroom);
  });

  it('given a non-object, when parsed, then the patch is empty', () => {
    expect(parseStatusPatch('nope')).toEqual({});
  });
});
