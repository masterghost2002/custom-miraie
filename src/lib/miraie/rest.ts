// MirAIe REST reads (reference api.py `_get_home_details`, `_get_device_details`,
// `_get_device_status`). Replies are validated with zod; a reply we can't read becomes a
// MiraieNetworkError instead of a crash (CHILL-002 AC-3).

import { z } from 'zod';

import { DEVICE_DETAILS_URL, HOMES_URL, statusUrl } from './constants';
import { MiraieNetworkError, UnauthorizedError } from './errors';
import { parseStatus } from './status';
import type { AcDevice, AcStatus, Home } from './types';

export interface RestDeps {
  fetch?: typeof globalThis.fetch;
}

export type RawStatus = Record<string, unknown>;

export interface LoadedHome {
  home: Home;
  /** The status JSON as MirAIe sent it, so later partial pushes can be merged into it. */
  rawStatuses: Record<string, RawStatus>;
}

const id = z.union([z.string().min(1), z.number()]).transform(String);

const deviceSchema = z.object({
  deviceId: id,
  deviceName: z.string().catch(''),
  topic: z.array(z.string().min(1)).min(1),
});

const homesSchema = z.array(
  z.object({
    homeId: id,
    spaces: z
      .array(
        z.object({
          spaceName: z.string().catch(''),
          devices: z.array(z.unknown()).catch([]),
        }),
      )
      .catch([]),
  }),
);

const optionalText = z
  .union([z.string(), z.number()])
  .transform(String)
  .optional()
  .catch(undefined);

const detailsSchema = z
  .array(
    z.object({
      category: z.string(),
      modelName: optionalText,
      modelNumber: optionalText,
      firmwareVersion: optionalText,
      brand: optionalText,
    }),
  )
  .min(1);

const statusSchema = z.record(z.string(), z.unknown());

async function getJson(url: string, accessToken: string, fetch: typeof globalThis.fetch) {
  let response: Response;
  try {
    response = await fetch(url, {
      method: 'GET',
      headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
    });
  } catch (cause) {
    throw new MiraieNetworkError("Couldn't reach MirAIe", undefined, { cause });
  }
  if (response.status === 401) throw new UnauthorizedError();
  if (!response.ok) throw new MiraieNetworkError('MirAIe request failed', response.status);
  try {
    return (await response.json()) as unknown;
  } catch (cause) {
    throw new MiraieNetworkError('MirAIe sent a reply that is not JSON', response.status, {
      cause,
    });
  }
}

function parseOrThrow<T>(schema: z.ZodType<T>, value: unknown, what: string): T {
  const parsed = schema.safeParse(value);
  if (!parsed.success) throw new MiraieNetworkError(`MirAIe sent unexpected ${what}`);
  return parsed.data;
}

export async function fetchStatus(
  accessToken: string,
  deviceId: string,
  { fetch = globalThis.fetch }: RestDeps = {},
): Promise<{ status: AcStatus; raw: RawStatus }> {
  const json = await getJson(statusUrl(deviceId), accessToken, fetch);
  const raw = parseOrThrow(statusSchema, json, 'device status');
  return { status: parseStatus(raw), raw };
}

/** The first home and its air conditioners (non-AC devices are skipped, like the reference). */
export async function fetchHome(accessToken: string, deps: RestDeps = {}): Promise<LoadedHome> {
  const fetch = deps.fetch ?? globalThis.fetch;
  const homes = parseOrThrow(homesSchema, await getJson(HOMES_URL, accessToken, fetch), 'homes');
  const first = homes[0];
  if (!first) return { home: { homeId: '', devices: [], statuses: {} }, rawStatuses: {} };

  const candidates = first.spaces.flatMap((space) =>
    space.devices.flatMap((device) => {
      const parsed = deviceSchema.safeParse(device);
      return parsed.success ? [{ room: space.spaceName, ...parsed.data }] : [];
    }),
  );

  const loaded = await Promise.all(
    candidates.map(async (candidate) => {
      const detailsJson = await getJson(
        `${DEVICE_DETAILS_URL}/${encodeURIComponent(candidate.deviceId)}`,
        accessToken,
        fetch,
      );
      const [details] = parseOrThrow(detailsSchema, detailsJson, 'device details');
      if (!details || details.category.toLowerCase() !== 'ac') return null;

      const { status, raw } = await fetchStatus(accessToken, candidate.deviceId, deps);
      const device: AcDevice = {
        id: candidate.deviceId,
        name: candidate.deviceName,
        room: candidate.room,
        topic: candidate.topic[0] as string,
        model: {
          modelName: details.modelName,
          modelNumber: details.modelNumber,
          firmwareVersion: details.firmwareVersion,
          brand: details.brand,
        },
      };
      return { device, status, raw };
    }),
  );

  const acs = loaded.filter((x) => x !== null);
  return {
    home: {
      homeId: first.homeId,
      devices: acs.map((x) => x.device),
      statuses: Object.fromEntries(acs.map((x) => [x.device.id, x.status])),
    },
    rawStatuses: Object.fromEntries(acs.map((x) => [x.device.id, x.raw])),
  };
}
