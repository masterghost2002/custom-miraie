# CHILL-010 — Plan

Draft — waits for Q1.

## Order

1. Theme preference in `src/state/preferences.ts`; root layout reads it (`ThemeProvider name`).
2. Account card + sign out (reuses the session store from CHILL-004).
3. Appearance card. 4. Display-light card (after Q3). 5. About card.

## Files

- `src/app/(tabs)/settings.tsx`
- `src/features/settings/{screen.tsx,copy.ts,mask-login-id.ts}`
- `src/features/settings/components/{account-card,appearance-card,display-light-card,about-card}.tsx`

## Risks

| Risk                                  | What we do about it                                         |
| ------------------------------------- | ----------------------------------------------------------- |
| Light theme exposes untested contrast | CHILL-003 gallery covers light; check text contrast ≥ 4.5:1 |

## How we will know it works

- Automated: AC-1…AC-4.
- Manual: switch theme and sign out on the iPhone.
