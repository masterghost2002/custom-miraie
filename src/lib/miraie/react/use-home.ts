// The home and its ACs. Loading it also seeds each AC's status query, so screens read status
// with useAcStatus without another request (CHILL-002 Task 10).

import { useQuery, useQueryClient } from '@tanstack/react-query';

import type { AcStatus, Home } from '../types';
import { useBackend } from './backend-provider';
import { queryKeys } from './query-keys';

export function useHome() {
  const backend = useBackend();
  const client = useQueryClient();
  return useQuery<Home>({
    queryKey: queryKeys.home,
    queryFn: async () => {
      const home = await backend.getHome();
      for (const [deviceId, status] of Object.entries(home.statuses)) {
        client.setQueryData<AcStatus>(queryKeys.status(deviceId), status);
      }
      return home;
    },
    staleTime: 5 * 60_000,
  });
}
