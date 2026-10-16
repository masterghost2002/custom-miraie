# CHILL-005 — Plan

## Order

1. Tabs layout with the glass `TabBar` (Home, All devices, Schedules, Settings) and device routes.
2. Derived view model: `useHomeView()` turns `useHome()` + preferences into chips, featured, others.
3. Featured card, room chips, small cards, tiles — each a component with its own test.
4. Commands (power) through `useAcCommand`; optimistic update.
5. Loading/error/empty once Q3 is answered.

## Files

- `src/app/(tabs)/_layout.tsx`, `src/app/(tabs)/index.tsx`, `src/app/device/[id]/_layout.tsx`
- `src/state/preferences.ts` (featured AC, theme)
- `src/features/home/{screen.tsx,copy.ts,greeting.ts}`
- `src/features/home/components/{room-chips,featured-card,ac-card,feature-tile}.tsx`
- `src/features/home/hooks/use-home-view.ts`, `src/features/home/__tests__/*`

## Risks

| Risk                                    | What we do about it                                                       |
| --------------------------------------- | ------------------------------------------------------------------------- |
| Layout shift between loading and loaded | Skeleton uses the same components with empty values (CLAUDE.md done list) |
| Many re-renders from MQTT pushes        | Per-AC query keys; components subscribe to one AC each                    |
| Greeting changes while the app is open  | Recompute on focus                                                        |

## How we will know it works

- Automated: AC-1…AC-9 with the demo backend; greeting table test.
- Manual: compare with Main.dc.html at 390×844 and on the iPhone; real power toggle (O2 in CHILL-002).
