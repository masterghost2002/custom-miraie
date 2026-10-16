# CHILL-004 — Plan

## Order

1. Session store (zustand, hydrated from secure storage) and the auth gate in the root layout.
2. Form schema + `useSignIn` mutation (calls `backend.signIn`).
3. Screen from the board using `Screen`, `Text`, `Glass`, `PrimaryButton`, `AcUnit`, `AirParticles`.
4. Error and busy states once Q1/Q2 are answered.

## Files

- `src/state/session.ts`, `src/app/_layout.tsx` (redirect), `src/app/sign-in.tsx`
- `src/features/auth/{screen.tsx,schema.ts,copy.ts,hooks/use-sign-in.ts,components/sign-in-form.tsx}`
- `src/features/auth/__tests__/*`

## Risks

| Risk                                             | What we do about it                                                                 |
| ------------------------------------------------ | ----------------------------------------------------------------------------------- |
| Flash of Sign in before the stored session loads | Keep the splash screen up until the session store has hydrated                      |
| Keyboard covers the button on small iPhones      | KeyboardAvoidingView + scroll; check on iPhone SE size in the web preview (375×667) |
| Password autofill from iCloud Keychain           | Correct `textContentType`s; manual check on device                                  |

## How we will know it works

- Automated: AC-1…AC-8 with the demo backend (its sign-in accepts `demo`/`demo` and returns 401/412
  for fixed test IDs).
- Manual: owner signs in with the real account on the iPhone (dev build, CHILL-011).
