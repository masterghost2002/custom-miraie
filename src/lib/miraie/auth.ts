// MirAIe sign-in (reference api.py `_login`). The password goes only to auth.miraie.in and is
// never logged; errors carry no credentials (CHILL-002 AC-1, AC-2).

import { z } from 'zod';

import { HTTP_CLIENT_ID, LOGIN_URL } from './constants';
import { errorName, MiraieNetworkError, NotRegisteredError, WrongCredentialsError } from './errors';

export type LoginKind = 'email' | 'mobile' | 'username';

export interface Session {
  accessToken: string;
  refreshToken: string;
  userId: string;
  expiresIn: number;
}

export interface AuthDeps {
  fetch?: typeof globalThis.fetch;
  /** Injected for deterministic tests; defaults to Math.random. */
  random?: () => number;
}

/** `@` → email; digits with an optional leading `+` → mobile; anything else → username. */
export function detectLoginKind(loginId: string): LoginKind {
  if (loginId.includes('@')) return 'email';
  if (/^\+?\d+$/.test(loginId)) return 'mobile';
  return 'username';
}

/** Reference `_get_scope`: "an" + floor(random × 10⁹). */
export function makeScope(random: () => number = Math.random): string {
  return `an${Math.floor(random() * 1_000_000_000)}`;
}

const sessionSchema = z.object({
  accessToken: z.string().min(1),
  refreshToken: z.string(),
  userId: z.union([z.string(), z.number()]).transform(String),
  expiresIn: z.coerce.number(),
});

export async function signIn(
  loginId: string,
  password: string,
  { fetch = globalThis.fetch, random }: AuthDeps = {},
): Promise<Session> {
  // Key order follows the reference: clientId, password, scope, then the login id.
  const body = {
    clientId: HTTP_CLIENT_ID,
    password,
    scope: makeScope(random),
    [detectLoginKind(loginId)]: loginId,
  };

  let response: Response;
  try {
    response = await fetch(LOGIN_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
  } catch (error) {
    throw new MiraieNetworkError(`Couldn't reach MirAIe (${errorName(error)})`);
  }

  if (response.status === 401) throw new WrongCredentialsError();
  if (response.status === 412) throw new NotRegisteredError();
  if (response.status !== 200) {
    throw new MiraieNetworkError('MirAIe sign-in failed', response.status);
  }

  const parsed = sessionSchema.safeParse(await response.json().catch(() => null));
  if (!parsed.success) {
    throw new MiraieNetworkError('MirAIe sent an unexpected sign-in reply', response.status);
  }
  return parsed.data;
}
