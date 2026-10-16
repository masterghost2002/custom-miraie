# CHILL-003 — Design system primitives (`src/ui`)

Status: ready (all questions answered) · Design: `design/boards/Style.dc.html` + the shared CSS
of every board, `docs/design/language.md`, `docs/design-map.md` · Depends on: CHILL-001

## Assumptions (correct these now, or the work goes ahead on them)

- Dark is the default theme; light is available from Settings (CHILL-010). Both are built now.
- Glass: `GlassView` from expo-glass-effect when `isLiquidGlassAvailable() && isGlassEffectAPIAvailable()`
  (iOS 26+), `glassEffectStyle="regular"`, `colorScheme` from our theme, no tint (Q1). Otherwise the
  canvas's frosted fill: `bg-glass`, 1 px `border-glass-line`, the glass shadow. Liquid glass won't
  match the canvas pixel for pixel; accepted by the owner (2026-10-16).
- Icons are lucide-react-native where the boards use Lucide shapes (power, house, layout-grid, clock,
  settings, snowflake, droplet, fan, sun, wind, moon, leaf, zap, thermometer, arrow-up-right, arrow-left,
  plus, minus, ellipsis, user, lock). The "auto" mode glyph (circle + A) is not in Lucide and is drawn
  with react-native-svg from the board's path.
- Motion uses react-native-reanimated 4 with the board timings (`docs/design/language.md`). Particles
  follow the boards' cubic paths, evaluated on the UI thread. All ambient motion stops when
  `useReducedMotion()` is true.
- The missing tokens listed in `docs/design-map.md` (beam, swatch line, blade, flap, dark toggle knob)
  are added to `src/theme/tokens.ts` in this ticket.
- Instead of Storybook (see CHILL-001 Q1), a dev-only route `src/app/_gallery.tsx` renders every
  primitive in every state and both themes on the web preview.

## Goal

Every screen is assembled from a small set of tested primitives that already look and move like the
canvas, so screens never restyle buttons, glass or text themselves.

## Primitives

| Primitive                                                                                             | From the board                                                            | States                                                                                               |
| ----------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------- |
| `Text` (variants reading, reading-sm, hero, title, header, card, body, chip, support, caption, micro) | Style type scale                                                          | muted / ink                                                                                          |
| `Glass`                                                                                               | `.glass`                                                                  | liquid / fallback                                                                                    |
| `Screen`                                                                                              | page root: ground, safe area, `Breeze`, optional air layer, 20 pt gutters | —                                                                                                    |
| `Breeze`                                                                                              | `.breeze` two drifting wave layers (70 s / 110 s)                         | reduced motion: still                                                                                |
| `IconButton` (48 glass circle)                                                                        | header back/more/+, −/+                                                   | pressed, disabled                                                                                    |
| `ModeButton`                                                                                          | Climate mode column                                                       | selected = mode-sel fill + 2 pt accent ring + accent icon                                            |
| `SegmentedPill` (n options)                                                                           | fan speed, timer, swing                                                   | sliding ink indicator, selected option                                                               |
| `Toggle` (48×28)                                                                                      | eco, powerchill, schedules                                                | on (ink), off (track); knob spring                                                                   |
| `PowerPill` (120/140×52)                                                                              | Home card, Climate power card                                             | on (accent knob right, "On"), off ("Off"), disabled                                                  |
| `PowerButton` (44/48 round)                                                                           | small cards, device list                                                  | on (accent), off (pill), disabled                                                                    |
| `PrimaryButton` (56)                                                                                  | Sign in, Turn everything off                                              | disabled                                                                                             |
| `Chip` (44)                                                                                           | Home room pills                                                           | selected (ink)                                                                                       |
| `TabBar`                                                                                              | glass dock, 4 × 56 round buttons                                          | current (ink)                                                                                        |
| `AcUnit` (sizes lg 310×92, md 250×76, sm 150×48, xs 104×32, icon 44×15)                               | the white unit                                                            | on / off (slot narrows, LED grey)                                                                    |
| `AcDisplay`                                                                                           | dead-front orange display                                                 | mode icon, preset icon, temp or FAN, 4 fan bars (wave when auto), blank when off, fades in on change |
| `AirParticles`                                                                                        | `.pt` along offset paths                                                  | speed by fan (quiet 6 s … high 1.7 s), hidden when off                                               |
| `FanIcon`                                                                                             | spinning fan                                                              | speed by fan, still when off                                                                         |

## Acceptance criteria

| ID    | Given                                                   | When                        | Then                                                                                                              |
| ----- | ------------------------------------------------------- | --------------------------- | ----------------------------------------------------------------------------------------------------------------- |
| AC-1  | any primitive                                           | rendered in dark and light  | it uses only token classes / `useTheme()` values (style-policy passes)                                            |
| AC-2  | iOS 26 with liquid glass available                      | `Glass` renders             | it renders `GlassView`; otherwise the frosted fallback with the same radius and padding                           |
| AC-3  | `SegmentedPill` with 5 options                          | the person taps "Low"       | `onChange("low")` fires, "Low" has `selected` state, the indicator slides there in 0.45 s                         |
| AC-4  | `Toggle` off                                            | tapped                      | `onChange(true)`; role `switch`, `checked` true; knob springs right                                               |
| AC-5  | `PowerPill` on                                          | rendered                    | label "On" visible, knob on the right in accent; tapping calls `onChange(false)`; disabled when the AC is offline |
| AC-6  | `ModeButton` selected                                   | rendered                    | accessible as a selected button with its label (Cool, Dry, Fan only, Heat, Auto)                                  |
| AC-7  | `AcDisplay` with mode cool, 24°, fan medium, preset eco | rendered                    | snowflake + leaf icons, "24°", bars 1–3 lit; with power off nothing shows                                         |
| AC-8  | reduced motion on                                       | any screen                  | breeze, particles, sweeps and spins are still                                                                     |
| AC-9  | `TabBar`                                                | the person taps "Schedules" | navigation goes to the Schedules tab; current tab has `selected` state and ink fill                               |
| AC-10 | every interactive primitive                             | inspected                   | touch target ≥ 44 pt and an accessibility label                                                                   |
| AC-11 | `src/app/_gallery.tsx` in dev                           | opened on the web preview   | every primitive appears in every state above, in both themes                                                      |

## Out of scope

- Screens (CHILL-004…010). App icon and splash artwork (no design — CHILL-011 Q2).

## Open questions

| #   | Who decides | Question                                                                                                                                                                                                                                                                                                                                                                                                       | Answer (with date)                       |
| --- | ----------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------- |
| Q1  | Owner       | Liquid glass tint: untinted `regular` (default, most native), or tinted with the canvas glass colour to look closer to the boards?                                                                                                                                                                                                                                                                             | Untinted `regular` (owner, 2026-10-16)   |
| Q2  | Owner       | The boards disagree on a few values (details in `docs/design-map.md` › Missing from tokens). Proposed: particle opacity .45 light / .5 dark everywhere; guide lines .06 (Climate) and .10 (Airflow) kept as two tokens; dark pill .10 everywhere (Sign in's .08 dropped); the AC display stays #E8701F in both themes while the dark accent is #F07A2A; one press scale .94 (.97 for the wide primary button). | Accepted as proposed (owner, 2026-10-16) |
