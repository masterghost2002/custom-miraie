import type { MiraieBackend } from '../backend';
import { createMemoryCredentialStore } from '../backend';
import { createDemoBackend, demoDevice } from '../demo/demo-backend';
import {
  DeviceNotFoundError,
  DeviceOfflineError,
  MiraieNetworkError,
  NotRegisteredError,
  SignedOutError,
  WrongCredentialsError,
} from '../errors';
import type { BackendEvent } from '../types';

function record(backend: MiraieBackend) {
  const events: BackendEvent[] = [];
  backend.subscribe((e) => events.push(e));
  return events;
}

beforeEach(() => jest.useFakeTimers());
afterEach(() => jest.useRealTimers());

describe('demo backend', () => {
  it("AC-10: given no seed, when the home loads, then it is the boards' Bedroom, Living room and Study", async () => {
    const home = await createDemoBackend().getHome();

    expect(home.devices.map((d) => [d.id, d.room])).toEqual([
      ['bed', 'Bedroom'],
      ['living', 'Living room'],
      ['study', 'Study'],
    ]);
    expect(home.statuses.bed).toMatchObject({
      online: true,
      power: true,
      mode: 'cool',
      targetTemp: 24,
      roomTemp: 27,
      fan: 'auto',
      swingV: 3,
      swingH: 0,
    });
    expect(home.statuses.living).toMatchObject({
      online: true,
      power: false,
      mode: 'dry',
      targetTemp: 25,
      roomTemp: 29,
    });
    expect(home.statuses.study).toMatchObject({
      online: false,
      mode: 'cool',
      targetTemp: 24,
      roomTemp: 31,
    });
  });

  it('AC-10: given a command, when sent, then the status push arrives 300 ms later, like the broker', async () => {
    const backend = createDemoBackend();
    const events = record(backend);
    await backend.getHome();

    await backend.send('bed', { kind: 'power', on: false });
    jest.advanceTimersByTime(299);
    expect(events.filter((e) => e.type === 'status')).toHaveLength(0);

    jest.advanceTimersByTime(1);
    expect(events.filter((e) => e.type === 'status')).toEqual([
      { type: 'status', deviceId: 'bed', status: expect.objectContaining({ power: false }) },
    ]);
    await expect(backend.getStatus('bed')).resolves.toMatchObject({ power: false });
  });

  it('AC-10: given eco, when sent, then the pushed status holds 26° with the eco preset', async () => {
    const backend = createDemoBackend();
    const events = record(backend);
    await backend.send('bed', { kind: 'preset', preset: 'eco' });
    jest.advanceTimersByTime(300);
    expect(events.at(-1)).toMatchObject({ status: { preset: 'eco', targetTemp: 26 } });
  });

  it('AC-10: given an offline AC, when a command is sent, then it rejects with DeviceOfflineError and nothing is pushed', async () => {
    const backend = createDemoBackend();
    const events = record(backend);
    await expect(backend.send('study', { kind: 'power', on: true })).rejects.toBeInstanceOf(
      DeviceOfflineError,
    );
    jest.advanceTimersByTime(1000);
    expect(events.filter((e) => e.type === 'status')).toHaveLength(0);
  });

  it('given failCommandsFor, when a command is sent to that AC, then it rejects with MiraieNetworkError', async () => {
    const backend = createDemoBackend({ failCommandsFor: ['living'] });
    await expect(backend.send('living', { kind: 'power', on: true })).rejects.toBeInstanceOf(
      MiraieNetworkError,
    );
    await expect(backend.send('bed', { kind: 'power', on: false })).resolves.toBeUndefined();
  });

  it('given an unknown AC or an out-of-range temperature, when sent, then it fails like the live backend', async () => {
    const backend = createDemoBackend();
    await expect(backend.send('nope', { kind: 'power', on: true })).rejects.toBeInstanceOf(
      DeviceNotFoundError,
    );
    await expect(backend.getStatus('nope')).rejects.toBeInstanceOf(DeviceNotFoundError);
    await expect(backend.send('bed', { kind: 'temperature', value: 40 })).rejects.toBeInstanceOf(
      RangeError,
    );
  });

  it('given seeded devices, when the home loads, then exactly those appear', async () => {
    const backend = createDemoBackend({
      devices: [demoDevice({ id: 'hall', room: 'Hall', status: { power: false, mode: 'heat' } })],
    });
    const home = await backend.getHome();
    expect(home.devices).toEqual([
      expect.objectContaining({ id: 'hall', room: 'Hall', name: 'Hall AC' }),
    ]);
    expect(home.statuses.hall).toMatchObject({ power: false, mode: 'heat', online: true });
  });

  it('given a custom latency, then pushes wait that long', async () => {
    const backend = createDemoBackend({ latencyMs: 50 });
    const events = record(backend);
    await backend.send('bed', { kind: 'fan', speed: 'high' });
    jest.advanceTimersByTime(50);
    expect(events.at(-1)).toMatchObject({ status: { fan: 'high' } });
  });

  it('given simulate.push, then a status event like an MQTT push is emitted and merged', async () => {
    const backend = createDemoBackend();
    const events = record(backend);
    backend.simulate.push('bed', { mode: 'dry' });
    expect(events).toEqual([
      {
        type: 'status',
        deviceId: 'bed',
        status: expect.objectContaining({ mode: 'dry', power: true }),
      },
    ]);
    await expect(backend.getStatus('bed')).resolves.toMatchObject({ mode: 'dry' });
  });

  it('given getHome, then the connection reports connected', async () => {
    const backend = createDemoBackend();
    const events = record(backend);
    await backend.getHome();
    expect(events).toContainEqual({ type: 'connection', state: 'connected' });
  });
});

describe('demo backend — accounts', () => {
  it('given signedIn false, then it starts signed out: restore is false and getHome rejects', async () => {
    const backend = createDemoBackend({ signedIn: false });
    await expect(backend.restore()).resolves.toBe(false);
    expect(backend.getLoginId()).toBeNull();
    await expect(backend.getHome()).rejects.toBeInstanceOf(SignedOutError);
    await expect(backend.send('bed', { kind: 'power', on: true })).rejects.toBeInstanceOf(
      SignedOutError,
    );
  });

  it('given any other ID and password, when signing in, then the session is stored like the live one', async () => {
    const credentials = createMemoryCredentialStore();
    const backend = createDemoBackend({ signedIn: false, credentials });
    await backend.signIn('ravi@example.com', 'demo');
    expect(backend.getLoginId()).toBe('ravi@example.com');
    expect(credentials.peek()).toMatchObject({ loginId: 'ravi@example.com', password: 'demo' });
    await expect(backend.getHome()).resolves.toMatchObject({ homeId: 'demo-home' });
  });

  it.each([
    ['9876543210', 'wrong', WrongCredentialsError],
    ['0000000000', 'x', NotRegisteredError],
    ['offline', 'x', MiraieNetworkError],
  ])('given %p / %p, when signing in, then it throws %p', async (id, password, ErrorClass) => {
    const backend = createDemoBackend({ signedIn: false });
    await expect(backend.signIn(id, password)).rejects.toBeInstanceOf(ErrorClass);
    expect(backend.getLoginId()).toBeNull();
  });

  it('given stored credentials, when restored, then it is signed in as that ID', async () => {
    const credentials = createMemoryCredentialStore({
      loginId: '9123456789',
      password: 'p',
      accessToken: 'a',
      refreshToken: 'r',
      userId: 'u',
      expiresIn: 1,
    });
    const backend = createDemoBackend({ signedIn: false, credentials });
    await expect(backend.restore()).resolves.toBe(true);
    expect(backend.getLoginId()).toBe('9123456789');
  });

  it('given the default seed, then it is signed in as 9876543210', async () => {
    const backend = createDemoBackend();
    await expect(backend.restore()).resolves.toBe(true);
    expect(backend.getLoginId()).toBe('9876543210');
  });

  it('given a pending push, when signing out, then the push never arrives and credentials are cleared', async () => {
    const credentials = createMemoryCredentialStore();
    const backend = createDemoBackend({ signedIn: false, credentials });
    await backend.signIn('9876543210', 'demo');
    const events = record(backend);
    await backend.send('bed', { kind: 'power', on: false });

    await backend.signOut();
    jest.advanceTimersByTime(1000);

    expect(events.filter((e) => e.type === 'status')).toHaveLength(0);
    expect(credentials.peek()).toBeNull();
    expect(backend.getLoginId()).toBeNull();
  });

  it('is a MiraieBackend of kind demo', () => {
    const backend: MiraieBackend = createDemoBackend();
    expect(backend.kind).toBe('demo');
  });
});
