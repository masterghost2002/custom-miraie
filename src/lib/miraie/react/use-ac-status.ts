// One AC's live status. Seeded by useHome and kept fresh by MQTT pushes (BackendProvider), so it
// never goes stale on its own; it is read over REST only when nothing seeded it (CHILL-002).

import { useQuery } from '@tanstack/react-query';

import type { AcStatus } from '../types';
import { useBackend } from './backend-provider';
import { queryKeys } from './query-keys';

/** The whole query (loading, error, refetch) for one AC's status. */
export function useAcStatusQuery(deviceId: string | undefined) {
  const backend = useBackend();
  return useQuery<AcStatus>({
    queryKey: queryKeys.status(deviceId ?? ''),
    queryFn: () => backend.getStatus(deviceId as string),
    enabled: deviceId !== undefined,
    staleTime: Infinity,
  });
}

export function useAcStatus(deviceId: string | undefined): AcStatus | undefined {
  return useAcStatusQuery(deviceId).data;
}
