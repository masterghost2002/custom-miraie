# CHILL-003 — Plan

## Order

1. Tokens: add the missing values from `docs/design-map.md`; `Text` variants.
2. Surfaces: `Glass`, `Screen`, `Breeze`.
3. Controls without motion dependencies: `IconButton`, `PrimaryButton`, `Chip`, `PowerButton`.
4. Animated controls: `Toggle`, `PowerPill`, `SegmentedPill`, `ModeButton` (reanimated springs/timings).
5. The AC: `AcUnit`, `AcDisplay`, `AirParticles`, `FanIcon`.
6. `TabBar` (custom `tabBar` for Expo Router's JS `Tabs`, the stable API; `expo-router/ui` tabs are experimental).
7. `_gallery` route for the visual check.

## Files

- `src/theme/tokens.ts`, `tailwind.config.js` (any new named steps), `docs/design-map.md`
- `src/ui/{text,glass,screen,breeze,icon-button,mode-button,segmented-pill,toggle,power-pill,power-button,primary-button,chip,tab-bar,ac-unit,ac-display,air-particles,fan-icon}.tsx`
- `src/ui/icons/auto-mode.tsx`, `src/ui/__tests__/*.test.tsx`, `src/app/_gallery.tsx`

## Risks

| Risk                                              | What we do about it                                                     |
| ------------------------------------------------- | ----------------------------------------------------------------------- |
| CSS `offset-path` particles have no RN equivalent | Evaluate the cubic Bézier in a worklet; same paths and durations        |
| GlassView inside scroll views can be costly       | Use it for cards and the dock only; measure on device                   |
| Fonts: RN needs one family per weight             | `Text` maps weight → `font-light…bold` family; never `fontWeight` alone |
| Web preview ≠ device                              | Done needs the device compare too (CLAUDE.md)                           |

## How we will know it works

- Automated: AC-1…AC-10 in RNTL (roles, states, callbacks); style-policy and design-source gates.
- Manual: `_gallery` on web next to `Style.dc.html`; liquid glass on the iPhone (iOS 26).
