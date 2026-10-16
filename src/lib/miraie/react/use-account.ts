// Sign in and sign out from screens. Both clear every cached MirAIe query, so a new session
// never shows the previous account's ACs or skips loading its home (CHILL-002, CHILL-004 AC-8).

import { useMutation, useQueryClient } from '@tanstack/react-query';

import { useBackend } from './backend-provider';
import { clearMiraieCache } from './query-keys';

/** `mutateAsync({ loginId, password })`; rejects with the backend's sign-in errors. */
export function useSignIn() {
  const backend = useBackend();
  const client = useQueryClient();
  return useMutation<void, Error, { loginId: string; password: string }>({
    mutationFn: ({ loginId, password }) => backend.signIn(loginId, password),
    onSuccess: () => clearMiraieCache(client),
  });
}

/** Deletes the stored credentials, closes the connection and drops the cache. */
export function useSignOut() {
  const backend = useBackend();
  const client = useQueryClient();
  return useMutation<void, Error, void>({
    mutationFn: () => backend.signOut(),
    onSettled: () => clearMiraieCache(client),
  });
}
