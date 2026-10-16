// Commands with an optimistic cache update: the screen changes at once, the AC's status push
// confirms it, and a failed command rolls back and refetches the real state (CHILL-002).

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useCallback } from 'react';

import { applyCommand } from '../apply-command';
import type { AcCommand, AcStatus } from '../types';
import { useBackend } from './backend-provider';
import { queryKeys } from './query-keys';

type Variables = { deviceId: string; command: AcCommand };

function useCommandMutation() {
  const backend = useBackend();
  const client = useQueryClient();
  return useMutation<void, Error, Variables, { previous: AcStatus | undefined }>({
    mutationFn: ({ deviceId, command }) => backend.send(deviceId, command),
    onMutate: async ({ deviceId, command }) => {
      const key = queryKeys.status(deviceId);
      await client.cancelQueries({ queryKey: key });
      const previous = client.getQueryData<AcStatus>(key);
      if (previous) client.setQueryData<AcStatus>(key, applyCommand(previous, command));
      return { previous };
    },
    onError: (_error, { deviceId }, context) => {
      const key = queryKeys.status(deviceId);
      if (context?.previous) client.setQueryData<AcStatus>(key, context.previous);
      void client.invalidateQueries({ queryKey: key });
    },
  });
}

/** Send to any AC: `await send(id, command)` rejects with the backend's error. */
export function useSendCommand() {
  const { mutateAsync } = useCommandMutation();
  return useCallback(
    (deviceId: string, command: AcCommand) => mutateAsync({ deviceId, command }),
    [mutateAsync],
  );
}

/** Commands for one AC. `send` never throws; read `error` instead. */
export function useAcCommand(deviceId: string) {
  const { mutate, isPending, error } = useCommandMutation();
  const send = useCallback(
    (command: AcCommand) => mutate({ deviceId, command }),
    [mutate, deviceId],
  );
  return { send, isPending, error };
}
