---
name: build-screen-from-design
description: Use when building or changing any Chill screen (src/features/*/screen.tsx, components) or any src/ui primitive from the Chill canvas boards. Forbids guessed values, raw colours or [..px] classes, files without the `// Design:` note, and inventing states the board doesn't show — stop and ask instead.
---

# Build a screen from the design

The design is the Chill canvas, copied verbatim into `design/boards/*.dc.html`
(Main = Home, Climate, Airflow, Rooms = All devices, Schedules, SignIn, Style = design language).
Each board is HTML + a `class Component extends DCLogic` script: the markup gives exact sizes, the
script's `renderVals()` gives every state and the copy for each state.

## Steps

1. **Read the design data, not a picture.**
   - `docs/design/screens/<screen>.md` — layout, components, states, copy, interactions
   - the raw board `design/boards/<Board>.dc.html` — the source of truth when the two disagree
     (then fix the doc in the same ticket)
   - `docs/design/language.md` — the rules (one orange accent, solid-ink selection, frosted glass,
     no gradients, breeze lines)
   - `docs/design-map.md` — board CSS variable / px value → token → NativeWind class
2. **Translate every value through the map.** `var(--muted)` → `text-muted`; `border-radius:28px`
   → `rounded-card`; `font-size:13px` → `text-support`. If a value has no token or class, STOP and
   ask; once agreed, add it to `src/theme/tokens.ts` / `tailwind.config.js` under CHILL-003 and
   to `docs/design-map.md`. Never write a raw hex/rgb or a `[..px]` class
   (`check:style-policy`, planned).
3. **Compose `src/ui` primitives** (`Glass`, `Text`, `IconButton`, `SegmentedPill`, `Toggle`,
   `PowerPill`, `PrimaryButton`, `TabBar`, `Breeze`, `AcUnit`, `AcDisplay`, `AirParticles`,
   `Screen`). Need a new primitive? It's a CHILL-003 task with its own test, not a one-off inside a
   feature. Load the `ui-primitives` skill.
4. **Write the Design note** as the first line of every new screen/component file:
   ```ts
   // Design: design/boards/Climate.dc.html — fan speed card and segmented pill
   ```
   or, when nothing on the canvas covers it:
   ```ts
   // Design: none — Settings has no board; layout reuses Rooms list cards (CHILL-010)
   ```
   `check:design-source` (planned) fails a file without it.
5. **Implement every state the board's script supports** — e.g. Climate: on/off (`is-off`),
   mode = fan locks the temperature (`—`), eco forces 26°, eco and powerchill are exclusive,
   fan speed drives particle and fan-icon speed. Copy comes from the script's strings, put in the
   feature's `copy.ts`.
6. **States the design doesn't show → stop and ask.** Loading, error, empty (no ACs), offline
   device, signed-out, MQTT disconnected: if the board has no answer and the spec has no answered
   open question, ask. Don't invent wording.
7. **Motion**: use reanimated 4 on the UI thread. Durations/easings come from the board's CSS
   (`.45s cubic-bezier(.2,.8,.2,1)` for sliding pills, `.35s cubic-bezier(.3,1.3,.5,1)` for toggle
   knobs). Respect reduced motion: particles, breeze and spins stop (`useReducedMotion()`).
8. **Compare with the board.** Run `pnpm start:demo`, open web, set the window to 390×844, and put
   the screen next to the board on the canvas
   (https://claude.ai/artifact/5WY2vCcKa1Fa5ee7DdKUbF). Check type, spacing, radii, colours in
   both themes. On device when possible (iOS 26 shows liquid glass; older iOS the frosted fill).
   List anything that still differs in your reply.
9. **Accessibility as drawn**: the board's `aria-label`, `aria-pressed`, `role="switch"` map to
   `accessibilityLabel`, `accessibilityState={{ selected | checked | disabled }}`,
   `accessibilityRole`. Touch targets ≥ 44pt.

## Don't

- Don't screenshot-match by eye and guess numbers; read them from the board.
- Don't copy the board's absolute pixel positions blindly: keep its sizes and spacing, but lay out
  with flex inside safe areas so it works on every iPhone height.
- Don't add gradients, glows or colour washes; the user rejected them.
