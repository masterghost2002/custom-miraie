# CHILL-007 — Plan

## Order

1. `useAirflow(id)` — derived labels/angles from status, commands.
2. Side-view illustration (beam cone, streams, flap, dots) and top-view (wedge, columns, dots) as SVG +
   reanimated rotations; sweep loops.
3. The two cards with `SegmentedPill` (6 options).
4. Header chip; Q1/Q2 states.

## Files

- `src/app/device/[id]/airflow.tsx`
- `src/features/airflow/{screen.tsx,copy.ts,hooks/use-airflow.ts}`
- `src/features/airflow/components/{vertical-card,horizontal-card,side-view,top-view}.tsx`
- `src/features/airflow/__tests__/*`

## Risks

| Risk                                        | What we do about it                                          |
| ------------------------------------------- | ------------------------------------------------------------ |
| Position numbering differs from the real AC | Owner check CHILL-002 O3; mapping lives in one table         |
| CSS clip-path cones                         | Draw the cone and wedge as SVG polygons with the same points |

## How we will know it works

- Automated: AC-1…AC-6 (demo backend).
- Manual: compare with Airflow.dc.html; watch the real louvres move (O3).
