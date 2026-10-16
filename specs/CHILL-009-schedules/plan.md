# CHILL-009 — Plan

Draft — the order depends on Q1.

## Order (option A)

1. Owner records the official app's traffic while creating, toggling and deleting a schedule and a
   sleep timer; we write the findings into `learn/miraie-protocol.md` (no credentials in the file).
2. Add schedule/timer calls to `MiraieBackend` (live + demo) with tests (CHILL-002 style).
3. UI from the board against the demo backend: timer card, schedule cards, toggles.
4. Editor (after Q2).

## Files

- `src/lib/miraie/{schedules.ts,backend.ts,live-backend.ts,demo/demo-backend.ts}`
- `src/app/(tabs)/schedules.tsx`
- `src/features/schedules/{screen.tsx,copy.ts,hooks/use-schedules.ts}`
- `src/features/schedules/components/{sleep-timer-card,schedule-card,day-dots}.tsx`

## Risks

| Risk                                                       | What we do about it                                                          |
| ---------------------------------------------------------- | ---------------------------------------------------------------------------- |
| The official API is signed or pinned and can't be recorded | Fall back to option B or C (back to the owner)                               |
| Time zones                                                 | Store and show device-local 24 h time; the cloud's zone is checked in step 1 |

## How we will know it works

- Automated: AC-1…AC-3, AC-5 with the demo backend.
- Manual: AC-4 — a schedule fires with the phone switched off.
