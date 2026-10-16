// TanStack Query keys for MirAIe data. One status query per AC, so a push for one AC re-renders
// only the components that read that AC (CHILL-002).

import type { QueryClient } from '@tanstack/react-query';

export const queryKeys = {
  all: ['miraie'] as const,
  home: ['miraie', 'home'] as const,
  statuses: ['miraie', 'ac'] as const,
  status: (deviceId: string) => ['miraie', 'ac', deviceId, 'status'] as const,
};

/**
 * Forget every MirAIe query when the account or backend changes. `resetQueries` (not
 * `removeQueries`): it empties the data and refetches what is on screen from the current backend,
 * while removed queries would leave mounted screens holding the old data.
 */
export function clearMiraieCache(client: QueryClient) {
  return client.resetQueries({ queryKey: queryKeys.all });
}
