import { DEVICE_DETAILS_URL, HOMES_URL, statusUrl } from '../constants';
import { MiraieNetworkError, UnauthorizedError } from '../errors';
import { fetchHome, fetchStatus } from '../rest';

type Route = { status?: number; body: unknown };

/** A fake MirAIe REST server: answers by URL and records every request. */
function fakeServer(routes: Record<string, Route>) {
  const calls: { url: string; auth: string | null }[] = [];
  const fetch = async (input: string | URL | Request, init?: RequestInit) => {
    const url = String(input);
    calls.push({ url, auth: new Headers(init?.headers).get('Authorization') });
    const route = routes[url];
    if (!route) return new Response('not found', { status: 404 });
    return new Response(JSON.stringify(route.body), { status: route.status ?? 200 });
  };
  return { fetch: fetch as typeof globalThis.fetch, calls };
}

const statusJson = (overrides: Record<string, unknown> = {}) => ({
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
  ...overrides,
});

const details = (category: string) => [
  {
    category,
    modelName: 'CS-KU12',
    macAddress: 'aa:bb',
    brand: 'Panasonic',
    firmwareVersion: '1.2.3',
    serialNumber: 's1',
    modelNumber: 'KU12ZKYF',
    productSerialNumber: 'p1',
  },
];

const homes = [
  {
    homeId: 'home-1',
    spaces: [
      {
        spaceName: 'Bedroom',
        devices: [{ deviceId: 'd-bed', deviceName: 'Bedroom AC', topic: ['t/bed'] }],
      },
      {
        spaceName: 'Living room',
        devices: [
          { deviceId: 'd-living', deviceName: 'Living AC', topic: ['t/living'] },
          { deviceId: 'd-plug', deviceName: 'Smart plug', topic: ['t/plug'] },
        ],
      },
    ],
  },
  // A second home: the reference uses the first only.
  {
    homeId: 'home-2',
    spaces: [
      { spaceName: 'Office', devices: [{ deviceId: 'd-x', deviceName: 'X', topic: ['t/x'] }] },
    ],
  },
];

function homeServer(overrides: Record<string, Route> = {}) {
  return fakeServer({
    [HOMES_URL]: { body: homes },
    [`${DEVICE_DETAILS_URL}/d-bed`]: { body: details('AC') },
    [`${DEVICE_DETAILS_URL}/d-living`]: { body: details('ac') },
    [`${DEVICE_DETAILS_URL}/d-plug`]: { body: details('PLUG') },
    [statusUrl('d-bed')]: { body: statusJson() },
    [statusUrl('d-living')]: { body: statusJson({ ps: 'off', acmd: 'dry', actmp: '25.0' }) },
    ...overrides,
  });
}

describe('fetchHome', () => {
  it('AC-3: given a signed-in session, when getHome runs, then it returns the first home with its ACs, rooms, topics, models and statuses', async () => {
    const server = homeServer();

    const { home, rawStatuses } = await fetchHome('token-1', { fetch: server.fetch });

    expect(home.homeId).toBe('home-1');
    expect(home.devices).toEqual([
      {
        id: 'd-bed',
        name: 'Bedroom AC',
        room: 'Bedroom',
        topic: 't/bed',
        model: {
          modelName: 'CS-KU12',
          modelNumber: 'KU12ZKYF',
          firmwareVersion: '1.2.3',
          brand: 'Panasonic',
        },
      },
      expect.objectContaining({ id: 'd-living', room: 'Living room', topic: 't/living' }),
    ]);
    expect(home.statuses['d-bed']).toMatchObject({ power: true, mode: 'cool', targetTemp: 24 });
    expect(home.statuses['d-living']).toMatchObject({ power: false, mode: 'dry', targetTemp: 25 });
    expect(rawStatuses['d-bed']).toEqual(statusJson());
  });

  it('AC-3: given a non-AC device, when getHome runs, then it is skipped and its status is never fetched', async () => {
    const server = homeServer();
    const { home } = await fetchHome('token-1', { fetch: server.fetch });
    expect(home.devices.map((d) => d.id)).not.toContain('d-plug');
    expect(server.calls.map((c) => c.url)).not.toContain(statusUrl('d-plug'));
    expect(server.calls.map((c) => c.url)).not.toContain(`${DEVICE_DETAILS_URL}/d-x`);
  });

  it('AC-3: given any REST call, when it is sent, then it carries the bearer token', async () => {
    const server = homeServer();
    await fetchHome('token-1', { fetch: server.fetch });
    expect(server.calls.length).toBeGreaterThan(0);
    expect(server.calls.every((c) => c.auth === 'Bearer token-1')).toBe(true);
  });

  it('given an account with no home, when getHome runs, then it returns an empty home', async () => {
    const server = fakeServer({ [HOMES_URL]: { body: [] } });
    const { home } = await fetchHome('token-1', { fetch: server.fetch });
    expect(home).toEqual({ homeId: '', devices: [], statuses: {} });
  });

  it('given a device without a topic, when getHome runs, then that device is skipped', async () => {
    const server = homeServer({
      [HOMES_URL]: {
        body: [
          {
            homeId: 'home-1',
            spaces: [
              {
                spaceName: 'Bedroom',
                devices: [
                  { deviceId: 'd-bed', deviceName: 'Bedroom AC', topic: ['t/bed'] },
                  { deviceId: 'd-broken', deviceName: 'Broken' },
                ],
              },
            ],
          },
        ],
      },
    });
    const { home } = await fetchHome('token-1', { fetch: server.fetch });
    expect(home.devices.map((d) => d.id)).toEqual(['d-bed']);
  });

  it('given homes that are not the expected shape, when getHome runs, then it throws MiraieNetworkError', async () => {
    const server = fakeServer({ [HOMES_URL]: { body: { error: 'nope' } } });
    await expect(fetchHome('token-1', { fetch: server.fetch })).rejects.toBeInstanceOf(
      MiraieNetworkError,
    );
  });

  it('given an expired token, when getHome runs, then it throws UnauthorizedError', async () => {
    const server = fakeServer({ [HOMES_URL]: { status: 401, body: {} } });
    await expect(fetchHome('old', { fetch: server.fetch })).rejects.toBeInstanceOf(
      UnauthorizedError,
    );
  });

  it('given a server error on a device, when getHome runs, then it throws MiraieNetworkError with the status', async () => {
    const server = homeServer({ [statusUrl('d-bed')]: { status: 503, body: {} } });
    const error = await fetchHome('token-1', { fetch: server.fetch }).catch((e: unknown) => e);
    expect(error).toBeInstanceOf(MiraieNetworkError);
    expect((error as MiraieNetworkError).status).toBe(503);
  });
});

describe('fetchStatus', () => {
  it('given a device id, when status is fetched, then it returns the parsed and raw status', async () => {
    const server = homeServer();
    const { status, raw } = await fetchStatus('token-1', 'd-living', { fetch: server.fetch });
    expect(status).toMatchObject({ power: false, mode: 'dry' });
    expect(raw).toEqual(statusJson({ ps: 'off', acmd: 'dry', actmp: '25.0' }));
  });

  it('given no network, when status is fetched, then it throws MiraieNetworkError', async () => {
    const fetch = (async () => {
      throw new TypeError('offline');
    }) as typeof globalThis.fetch;
    await expect(fetchStatus('t', 'd', { fetch })).rejects.toBeInstanceOf(MiraieNetworkError);
  });

  it('given a body that is not JSON, when status is fetched, then it throws MiraieNetworkError', async () => {
    const fetch = (async () => new Response('<html>', { status: 200 })) as typeof globalThis.fetch;
    await expect(fetchStatus('t', 'd', { fetch })).rejects.toBeInstanceOf(MiraieNetworkError);
  });
});
