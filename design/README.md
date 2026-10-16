# Design source of truth

The live design is the claude.ai canvas **"Chill — AC app design"**:
<https://claude.ai/artifact/5WY2vCcKa1Fa5ee7DdKUbF>

It holds 6 interactive phone boards (390 × 844 CSS px, corner radius 40) and 1 design-language
board (1280 × 900). This folder is a verbatim copy of those boards so agents can read exact values
without opening the canvas.

| File               | What it is                                                   |
| ------------------ | ------------------------------------------------------------ |
| `canvas.json`      | The canvas index: board frames, order, titles. Copied as-is. |
| `boards/*.dc.html` | One file per board, copied byte-for-byte from the canvas.    |

## Board index

| Board file                 | Screen                                         | Route it becomes                  | Spec      |
| -------------------------- | ---------------------------------------------- | --------------------------------- | --------- |
| `boards/SignIn.dc.html`    | Sign in                                        | `src/app/sign-in.tsx`             | CHILL-004 |
| `boards/Main.dc.html`      | Home                                           | `src/app/(tabs)/index.tsx`        | CHILL-005 |
| `boards/Climate.dc.html`   | Climate (detail, back button)                  | `src/app/device/[id]/climate.tsx` | CHILL-006 |
| `boards/Airflow.dc.html`   | Airflow (detail, back button)                  | `src/app/device/[id]/airflow.tsx` | CHILL-007 |
| `boards/Rooms.dc.html`     | All devices                                    | `src/app/(tabs)/devices.tsx`      | CHILL-008 |
| `boards/Schedules.dc.html` | Schedules + sleep timer                        | `src/app/(tabs)/schedules.tsx`    | CHILL-009 |
| `boards/Style.dc.html`     | Design language: colour, type, rules, controls | primitives in `src/ui/`           | CHILL-003 |
| — (no board)               | Settings tab                                   | `src/app/(tabs)/settings.tsx`     | CHILL-010 |

The written, implementation-ready versions of these boards are:

- `docs/design/language.md` — tokens, type, radii, motion, controls, the AC unit and its display.
- `docs/design/screens/*.md` — one per phone board: layout, states, copy, interactions, motion,
  accessibility and the states the design does not show.
- `docs/design-map.md` — canvas name/value → token in `src/theme/tokens.ts` → NativeWind class.

## How to read a board

The boards are Design Component pages. They render only inside the canvas runtime (`support.js`),
so open them in an editor and read them as source; they will not render from this folder.

- **Theme tokens** are CSS custom properties on two classes in the `<helmet><style>` block:
  `.th-light{…}` and `.th-dark{…}`. The board root carries `class="th-{{theme}}"`; dark is the
  default (`data-props` → `theme.default: "dark"`).
- **`.glass`** is the frosted card: `background: var(--glass)`, `backdrop-filter: blur(22px)
saturate(140%)`, `1px solid var(--glass-line)`, `box-shadow: var(--glass-shadow)`.
- **`{{holes}}`** are values computed by the `renderVals()` method in the
  `<script type="text/x-dc" data-dc-script>` block at the bottom of each file. That script also
  holds the board's **demo data** (rooms, temperatures, schedules) and its **state logic** (what a
  tap changes), so it is the best reference for behaviour.
- **`<sc-for list="{{x}}" as="r">`** repeats its children once per item of `x`.
- **`onClick="{{fn}}"`** binds a handler returned by `renderVals()`; `this.setState(...)` re-renders.
- `aria-*` attributes are the intended accessibility labels and states; in React Native they become
  `accessibilityLabel`, `accessibilityRole` and `accessibilityState`.
- Inline `style="…"` holds the layout values. The boards are absolutely positioned for a fixed
  390 × 844 frame; `docs/design/screens/*.md` restates them as flex layouts for any iPhone width.

## Rule: change the design on the canvas first

1. Change the board on the canvas (or ask for it to be changed there).
2. In the same PR, re-copy the changed board(s) into `boards/` byte-for-byte, and `canvas.json` if
   boards were added, removed, moved or resized.
3. Update the matching `docs/design/` page and `docs/design-map.md` in that same PR.

Never edit a file in `boards/` by hand: it must always equal the canvas.
