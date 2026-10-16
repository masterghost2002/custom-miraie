# CHILL-008 — Plan

## Order

1. `useDeviceList()` — rows + counts from the home query.
2. `DeviceRow` (icon with drips, texts, power) and the screen with "Turn everything off".
3. Row navigation (after Q1).

## Files

- `src/app/(tabs)/devices.tsx`
- `src/features/devices/{screen.tsx,copy.ts,hooks/use-device-list.ts,components/device-row.tsx}`
- `src/features/devices/__tests__/*`

## Risks

| Risk                                | What we do about it                                                        |
| ----------------------------------- | -------------------------------------------------------------------------- |
| Partial failure in "everything off" | Commands in parallel with `Promise.allSettled`; failed ones refetch (AC-6) |

## How we will know it works

- Automated: AC-1…AC-6 (demo backend; the demo can be told to fail one command).
- Manual: compare with Rooms.dc.html; turn off two real ACs at once.
