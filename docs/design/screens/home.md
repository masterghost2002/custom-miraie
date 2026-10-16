# Home

Board: `design/boards/Main.dc.html` (board title "Home") · Route: `src/app/(tabs)/index.tsx` · Spec: CHILL-005

The first tab. One AC is "featured" in a big card; the others sit in small cards below it.

## Layout (top to bottom)

Root: `--bg` + breeze background. Content inside the safe area: padding 20 top, 20 left/right,
28 bottom; flex column. On the 390 board the content width is 350.

1. **Header** — row, `space-between`, top-aligned.
   - Left column, gap 4: eyebrow (14 / 400 `--muted`) = today's date, format "Thu, 16 October"
     (weekday short, day, month long); title (30 / 700, −0.03em, line height 1.15, `--ink`) =
     greeting, "Good evening" on the board.
   - Right: **Account** button — 48 × 48 `.glass` circle, user icon 20 (stroke 1.9),
     `accessibilityLabel="Account"`. On the board it links to Sign in.
2. **Room pills** — margin-top 20, horizontal row, gap 8, one pill per AC, accessibility group
   "Rooms". Pill: 44 tall, padding 0 20, radius 22, 15 / 500. Unselected: glass fill + 1px
   `--glass-line`, `--ink`. Selected (the featured AC): `--sel-bg` / `--sel-ink`. Press .95.
   `accessibilityState.selected`. If pills overflow the width, the row scrolls horizontally
   (not on the board — 3 rooms fit).
3. **Featured card** — margin-top 16, height 236, radius 30, `.glass`, clips its children.
   Accessibility label "<room> air conditioner". Absolutely positioned children (card coords):
   - Name (17 / 600 `--ink`) at left 20, top 20; below it, gap 2, sub (13 / 400 `--muted`):
     "Air conditioner · <state>".
   - **Open climate controls** button at right 16, top 16: 40 × 40 circle, `--pill`, arrow-up-right
     icon 16 (stroke 2), `accessibilityLabel="Open climate controls"` → Climate.
   - **Reading** at left 20, top 74: row height 64: set temperature 64 / 300 (−0.05em, lh 1) and
     "°" 28 / 300 offset 6 down; then margin-top 6: "Inside <room temp>°" 13 / 400 `--muted`.
   - **AC unit** 150 × 48 at right 20, top 72 (language §7) with its display: mode icon 9 (cool
     snowflake / dry droplet) + "<temp>°" 11 / 500.
   - **Air particles** under the unit: area 150 × 70 at right 20, top 118; six 4 × 4 `--particle`
     dots on 3 curves, 2.4 s loop:

     | Curve (area coords)            | Delays         |
     | ------------------------------ | -------------- |
     | `M30 0 C30 25 22 50 14 70`     | −0.3 s, −1.5 s |
     | `M75 0 C75 25 75 50 75 70`     | −0.9 s, −2.1 s |
     | `M120 0 C120 25 128 50 136 70` | −0.6 s, −1.8 s |

     The whole layer fades to 0 over .6 s when the AC is off.

   - **Controls row** at left 16, bottom 16, gap 8, centred vertically:
     - Power pill 120 × 52 (language §9), `role="switch"`, `checked` = on,
       `accessibilityLabel="<room> power"`. Disabled when offline.
     - Mode chip: 52 tall, padding 0 18, radius 26, `--pill`, 14 / 600: mode name ("Cool", "Dry",
       …) → Climate.
     - Fan button: 52 × 52 circle, `--pill`, fan icon 20 (stroke 1.9) spinning 2 s (stopped when
       off), `accessibilityLabel="Fan speed auto"` (i.e. "Fan speed <speed>") → Climate.
4. **Other ACs** — margin-top 12, 2-column grid, gap 12 (every AC except the featured one).
   Card: height 168, radius 28, padding 16, `.glass`, flex column:
   - AC unit 104 × 32 (language §7), decorative.
   - Margin-top 16: a left-aligned button (makes this AC featured) holding name 15 / 600 and,
     gap 2, sub 13 / 400 `--muted`: "<state> · <temp>°", or "Offline".
   - Margin-top auto: power circle 44 × 44 (language §9), `aria-pressed` = on,
     `accessibilityLabel="<room> power"`, disabled when offline.
   - Offline card: opacity .55.
5. **Shortcut tiles** — margin-top 12, 2-column grid, gap 12. Tile: `.glass`, height 76, radius 26,
   padding 0 14, row, gap 10, centred:
   - Icon circle 44 × 44 `--pill` with icon 18 (stroke 1.9).
   - Text column, gap 2: title 15 / 600, sub 12 / 400 `--muted`.
   - Tile 1: wind icon, "Airflow", "Swing · Centre" → Airflow.
   - Tile 2: clock icon, "Schedules", "Next at 22:30" → Schedules.
6. **Tab bar** — margin-top auto, centred (language §9), Home current.

Content can exceed short screens (iPhone SE): the column scrolls; the tab bar floats above it.

## States the board supports

Demo data (board script):

| id     | Name        | Mode | Set | Inside | Online | Power |
| ------ | ----------- | ---- | --- | ------ | ------ | ----- |
| bed    | Bedroom     | Cool | 24  | 27     | yes    | on    |
| living | Living room | Dry  | 25  | 29     | yes    | off   |
| study  | Study       | Cool | 24  | 31     | **no** | off   |

State word (`stateOf`): offline → "Offline"; on + Cool → "Cooling"; on + Dry → "Drying";
online but off → "Standby". (Heat/Fan/Auto words are not on this board — Climate's labels suggest
"Heating", "Fan", "Auto"; see OPEN.)

- **Featured on**: knob right + accent, "On" label, particles flowing, vent slot 5 tall, display
  lit, fan spinning.
- **Featured off** (`is-off` on the card): particles fade out, vent slot 2 tall, display blank, fan
  icon still, knob left on `--track`, "Off" label, sub "Air conditioner · Standby".
- **Featured offline**: power pill disabled (opacity .4), sub "Air conditioner · Offline".
- **Small card on**: power circle accent. **Off**: `--pill`. **Offline**: card .55, circle
  disabled .4.

## Interactions

- Tap a room pill or a small card's name → that AC becomes featured; the unit display pulses
  (.6 s).
- Power pill / power circle → toggles that AC's power (and pulses the display).
- Arrow button, mode chip, fan button → Climate for the featured AC.
- Airflow tile → Airflow; Schedules tile → Schedules tab; Account → (OPEN, see below).

## Motion

Breeze; press scales (.94 buttons, .95 pills, .92 power circles); power knob slide; particles; fan
spin; vent slot height; display fade/pulse; offline dim.

## Accessibility

Room pills: buttons with `selected`. Power pill: switch. Power circles: buttons with `selected`
(pressed). Icon-only buttons carry the labels above. Decorative unit drawings and particles are
hidden. Targets ≥ 44 pt.

## States the design does not show — OPEN

| State                              | Notes / proposal (not approved)                                                                  |
| ---------------------------------- | ------------------------------------------------------------------------------------------------ |
| Loading the home on launch         | Skeleton built from the real chrome (pills, card, tiles) in a loading state, no layout shift     |
| Load error / MirAIe unreachable    | Inline message in the featured card area + retry                                                 |
| No ACs in the account              | Empty state copy needed                                                                          |
| One AC only                        | No "other ACs" grid? pills row with one pill?                                                    |
| More than 3 ACs                    | Pills scroll horizontally; grid grows (2 per row)                                                |
| Two ACs in the same room           | Pill label: room name alone is ambiguous — use device name?                                      |
| Live connection lost (MQTT down)   | Indicator? Controls disabled?                                                                    |
| Greeting text by time              | Board shows "Good evening"; propose Good morning (<12:00), Good afternoon (<17:00), Good evening |
| State words for Heat / Fan / Auto  | Propose "Heating", "Fan", "Auto"                                                                 |
| "Swing · Centre" / "Next at 22:30" | Should reflect real swing state / next enabled schedule; copy when no schedule?                  |
| Account button target              | Board links to Sign in; propose Settings or an account sheet                                     |
| A command failed to reach the AC   | Revert the control + message                                                                     |
