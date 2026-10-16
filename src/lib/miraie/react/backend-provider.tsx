// Gives screens the MirAIe backend and a QueryClient, and writes every status push into the
// query cache (merged, never replaced) so all screens update live (CHILL-002 Task 10).

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
  type ReactNode,
} from 'react';

import type { MiraieBackend } from '../backend';
import type { AcStatus, BackendEvent, ConnectionState } from '../types';
import { queryKeys } from './query-keys';

const BackendContext = createContext<MiraieBackend | null>(null);

export function createQueryClient() {
  return new QueryClient({
    defaultOptions: { queries: { retry: 1, staleTime: 30_000 } },
  });
}

export function BackendProvider({
  backend,
  queryClient,
  children,
}: {
  backend: MiraieBackend;
  queryClient?: QueryClient;
  children: ReactNode;
}) {
  const [client] = useState(() => queryClient ?? createQueryClient());

  useEffect(() => {
    // Children's effects (the first getHome) run before ours, so start from the current state.
    let hasConnected = backend.getConnectionState() === 'connected';
    let dropped = false;
    return backend.subscribe((event) => {
      if (event.type === 'status') {
        const key = queryKeys.status(event.deviceId);
        const previous = client.getQueryData<AcStatus>(key);
        if (previous) client.setQueryData<AcStatus>(key, { ...previous, ...event.status });
        return;
      }
      if (event.type !== 'connection') return;
      if (event.state === 'disconnected' && hasConnected) dropped = true;
      if (event.state === 'connected') {
        // Pushes sent while we were away are lost: catch up from REST.
        if (dropped) void client.invalidateQueries({ queryKey: queryKeys.statuses });
        hasConnected = true;
        dropped = false;
      }
    });
  }, [backend, client]);

  return (
    <QueryClientProvider client={client}>
      <BackendContext.Provider value={backend}>{children}</BackendContext.Provider>
    </QueryClientProvider>
  );
}

export function useBackend(): MiraieBackend {
  const backend = useContext(BackendContext);
  if (!backend) throw new Error('useBackend must be used inside <BackendProvider>');
  return backend;
}

/** The live connection to MirAIe (the demo reports 'connected' once the home loads). */
export function useConnectionState(): ConnectionState {
  const backend = useBackend();
  const subscribe = useCallback(
    (onChange: () => void) =>
      backend.subscribe((event) => {
        if (event.type === 'connection') onChange();
      }),
    [backend],
  );
  return useSyncExternalStore(subscribe, backend.getConnectionState, backend.getConnectionState);
}

/** Listen to backend events, e.g. `signed-out`, without re-subscribing on every render. */
export function useBackendEvents(listener: (event: BackendEvent) => void): void {
  const backend = useBackend();
  const latest = useRef(listener);
  useEffect(() => {
    latest.current = listener;
  });
  useEffect(() => backend.subscribe((event) => latest.current(event)), [backend]);
}
