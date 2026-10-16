# CHILL-006 — Plan

## Order

1. `useClimate(id)`: current status + pending local edits (temp being dragged), command batching.
2. Temperature column: tick slider (gesture-handler pan + reanimated), big number, −/+.
3. Mode column, fan card, power card, energy card — each a component with tests.
4. Header + unit + display + particles layer.
5. Q1/Q2 states once answered.

## Files

- `src/app/device/[id]/climate.tsx`
- `src/features/climate/{screen.tsx,copy.ts,hooks/use-climate.ts}`
- `src/features/climate/components/{temperature-slider,temperature-readout,mode-column,fan-card,power-card,energy-card}.tsx`
- `src/features/climate/__tests__/*`

## Risks

| Risk                                               | What we do about it                                                                                   |
| -------------------------------------------------- | ----------------------------------------------------------------------------------------------------- |
| Slider gesture vs scroll                           | The screen does not scroll on iPhone heights ≥ 667; below that, the slider claims vertical pans first |
| Command floods while dragging                      | Send on release; batch −/+ for 400 ms (AC-2, AC-3)                                                    |
| Status push arrives mid-drag and fights the finger | Ignore pushed temperature while a drag is active; apply after release                                 |
| Eco/Powerchill states drift from the device        | The pushed status is the truth; toggles are derived from `preset`                                     |

## How we will know it works

- Automated: AC-1…AC-11 with the demo backend (fake timers for batching).
- Manual: compare with Climate.dc.html; on the real AC check modes, eco 26°, powerchill (O2).
