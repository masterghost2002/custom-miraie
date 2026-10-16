# All devices

Board: `design/boards/Rooms.dc.html` (board title "All devices") · Route: `src/app/(tabs)/devices.tsx` · Spec: CHILL-008

The second tab: every AC in one list, each with its own power button, and one button to turn
everything off.

## Layout (top to bottom)

Root: `--bg` + breeze background. Content inside the safe area: padding 20 top, 20 left/right,
28 bottom; flex column.

1. **Header** — column, gap 4:
   - Summary 14 / 400 `--muted`: "<n> air conditioners · <k> on" (board: "3 air conditioners · 2 on").
   - Title 30 / 700, −0.03em, line height 1.15: "All devices".
2. **List** — margin-top 24, column, gap 12, one card per AC. Card: `.glass`, radius 28, padding 14,
   row, gap 14, centred:
   - **Icon tile** (decorative): 68 × 68, radius 22, `--pill`. Inside, the 44 × 15 list unit at
     (12, 20) with LED, and three drips below it (language §7 "44 × 15").
   - **Text** (flex 1, min height 48, centred vertically, gap 3): name 16 / 600 `--ink`, sub
     13 / 400 `--muted`, single line (no wrap, truncate). On the board the text block links to
     Home (OPEN: should select that AC on Home, or open its Climate).
   - **Power circle**: 48 × 48, radius 24 (language §9), power icon 20 stroke 2.2,
     `accessibilityState.selected` (`aria-pressed`) = on, `accessibilityLabel="<name> power"`,
     disabled when offline.
3. **Turn everything off** — margin-top auto (pinned above the tab bar), primary button 56 tall,
   radius 28, full width, row gap 10: power icon 18 (stroke 2.2) + "Turn everything off"
   16 / 600. Disabled (opacity .35) when no AC is on.
4. **Tab bar** — margin-top 16, centred, All devices current.

The list scrolls when it is taller than the space between the header and the button.

## States the board supports

Demo data (board script):

| id     | Name        | Verb    | Set | Inside | Online | Power (initial) |
| ------ | ----------- | ------- | --- | ------ | ------ | --------------- |
| bed    | Bedroom     | Cooling | 24  | 27     | yes    | on              |
| living | Living room | Drying  | 25  | 29     | yes    | on              |
| study  | Study       | Cooling | 24  | 31     | **no** | off             |

Sub line per state:

| State                 | Sub                                                    | Card        | Icon tile                                        | Power circle                           |
| --------------------- | ------------------------------------------------------ | ----------- | ------------------------------------------------ | -------------------------------------- |
| On                    | "<Verb> to <set>°" ("Cooling to 24°", "Drying to 25°") | normal      | LED accent with glow, slot 4 tall, drips falling | accent fill, white icon, accent shadow |
| Standby (online, off) | "Standby · Inside <inside>°"                           | normal      | LED `#C9C5C0`, slot 2 tall, no drips             | `--pill`                               |
| Offline               | "Offline"                                              | opacity .55 | as standby                                       | disabled, opacity .4                   |

Summary counts every AC and the ones that are on. Turn everything off sets every AC's power off.

## Interactions

- Power circle → toggle that AC.
- Turn everything off → power off every online AC that is on.
- Text block → OPEN (see above).

## Motion

Breeze; drips 1.6 s; LED/slot transitions .3–.4 s; power circle .3 s, press .92; primary press
.97; offline dim .3 s.

## Accessibility

Power circles are toggle buttons with `selected`; primary is a button with `disabled`; icon tiles
hidden. Targets ≥ 44 pt.

## States the design does not show — OPEN

| State                                             | Notes / proposal (not approved)                                             |
| ------------------------------------------------- | --------------------------------------------------------------------------- |
| Loading                                           | Skeleton cards built from the real card in a loading state                  |
| Error loading devices                             | Message + retry                                                             |
| No ACs                                            | Empty-state copy needed                                                     |
| Turn-everything-off in progress / partial failure | Which ACs failed, and how is that shown?                                    |
| Confirm before turning everything off?            | Board has no confirmation                                                   |
| Verb for Heat / Fan / Auto                        | Propose "Heating to 24°", "Fan only", "Auto at 24°" (from Climate's labels) |
| Singular                                          | "1 air conditioner · 1 on"                                                  |
