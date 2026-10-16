# Climate

Board: `design/boards/Climate.dc.html` · Route: `src/app/device/[id]/climate.tsx` · Spec: CHILL-006

Detail screen for one AC (no tab bar, back button). Everything you can set except airflow.

## Layout (top to bottom)

Root: `--bg` + breeze background; when the AC is off the root also carries the "off" state (§States).
On the 390 × 844 board everything is absolutely positioned; the vertical budget is exactly 844:
16 + 48 header + 28 + 92 unit + 38 + 280 control area + 38 + 276 bottom stack + 28. As a flex
layout inside the safe area:

1. **Header** — margin-top 16, height 48, left/right 20, row `space-between`, centred:
   - Back: 48 × 48 `.glass` circle, arrow-left 20 (stroke 2), `accessibilityLabel="Back to <room>"`
     ("Back to Bedroom").
   - Title column, centred, gap 2: "Air conditioner" (17 / 600, −0.01em) and the room name
     (13 / 400 `--muted`, "Bedroom").
   - More: 48 × 48 `.glass` circle, three dots (r 1.8, filled), `accessibilityLabel="More options"`.
2. **AC unit** — margin-top 28, 310 × 92 on the board = full width minus 40 each side (language §7),
   with the full dead-front display (language §8) at right 30, top 24. Decorative.
3. **Control area** — margin-top 38, height 280, row:
   - **Temperature slider** (left inset 22, width 44, height 280):
     - Ticks: a column 16 wide, 29 ticks, 1 tall, `--tick`, spread evenly top to bottom
       (`space-between`); widths alternate **16** (even index, starting at the top) and **9**.
     - Track: left 26, width 6, height 280, radius 3, `--track`.
     - Fill: left 26, width 6, from the bottom, height `round((temp − 16) / 14 × 280)` px, radius 3,
       `--accent`. Height 0 in fan-only mode.
     - Marker: left 21, 16 × 16, radius 8, `#FFFFFF` fill, 3 px `--accent` border, shadow
       0 3 8 `rgba(0,0,0,.15)`, top = `280 − fill − 8`.
     - Interaction surface: the whole 44 × 280 column is an adjustable control,
       min 16, max 30, step 1, drag vertically (bottom = 16). Disabled in fan-only mode.
       `accessibilityRole="adjustable"`, `accessibilityLabel="Temperature"`, value "<n> degrees",
       increment/decrement actions.
   - **Reading column** (starts 84 from the screen's left edge, i.e. 18 right of the slider; its
     top is 40 below the control area's top):
     - Label 15 / 500 `--muted` (see table below).
     - Margin-top 2, row height 100 (`accessibilityLiveRegion` polite): value 96 / 300 (−0.05em,
       lh 1) + "°" 40 / 300 offset 10 down. Fan-only shows "—" and no degree.
     - Margin-top 6, row gap 6: thermometer icon 14 (stroke 2) + "Inside <room temp>°"
       14 / 400 `--muted` (board: "Inside 27°").
     - Margin-top 18, row gap 10: two 48 × 48 `.glass` circles: minus 18
       (`accessibilityLabel="Lower temperature"`) and plus 18 (`"Raise temperature"`). Step 1,
       clamp 16–30. Disabled (opacity .35) in fan-only mode.
   - **Mode column** (right inset 22, top of the area), gap 10, 5 mode buttons 48 × 48 (language
     §9 "Mode button"), icons 20 stroke 1.9, accessibility group "Mode", each with
     `selected` state:

     | Order | Mode | Icon                                                                                       | `accessibilityLabel` |
     | ----- | ---- | ------------------------------------------------------------------------------------------ | -------------------- |
     | 1     | cool | snowflake                                                                                  | "Cool"               |
     | 2     | dry  | droplet                                                                                    | "Dry"                |
     | 3     | fan  | fan                                                                                        | "Fan only"           |
     | 4     | heat | sun                                                                                        | "Heat"               |
     | 5     | auto | circle with "A" (custom: circle r 9, "A" path `M8.5 16 12 7.5 15.5 16`, bar `M9.8 13h4.4`) | "Auto"               |

     Selected: fill `#FFFFFF` (dark `#2A2826`), icon `--accent`, 2 px accent ring + shadow
     0 8 20 `rgba(232,112,31,.22)`. Unselected: glass, icon `--muted`.
4. **Bottom stack** — left/right 20, bottom 28, gap 12 (pinned to the bottom; spacer above it):
   - **Fan speed card** — `.glass`, radius 28, padding 16:
     - Row height 40, `space-between`: column gap 2 — "Fan speed" 16 / 600 and the current speed
       name 13 / 400 `--muted` ("Auto", "Quiet", "Low", "Medium", "High"); right: 40 × 40 `--pill`
       circle with the fan icon 18 spinning at the speed's rate (decorative).
     - Margin-top 12: segmented pill, 5 options (language §9), accessibility group "Fan speed":
       "Auto", "Quiet", "Low", "Med" (`accessibilityLabel="Medium"`), "High".
   - **Row of two cards**, 2 equal columns, gap 12:
     - **Power card** — `.glass`, radius 28, padding 16, height 128, `space-between`: "Power"
       16 / 600, sub 13 / 400 `--muted` = "Running · <Mode>" when on ("Running · Cool"), "Standby"
       when off; power pill full card width × 52 (language §9), `role="switch"`,
       `accessibilityLabel="Power"`.
     - **Energy card** — `.glass`, radius 28, padding 16, height 128, `space-between`, accessibility
       label "Energy":
       - Row height 40: "Eco" 15 / 600 + "Holds 26°" 12 / 400 `--muted`; toggle (language §9),
         `role="switch"`, label "Eco".
       - Divider 1 px `--track`.
       - Row height 40: "Powerchill" 15 / 600 + "Fast cooling" 12 / 400 `--muted`; toggle, label
         "Powerchill".

### Air particle layer

Behind all controls (so the glass blurs it), from the unit's bottom area (board y 180) to the
screen bottom (664 tall), full width. Five guide curves stroked 1 px `--guide`, and 10 dots
(5 × 5, `--particle`), two per curve:

| Curve (layer coords, x on a 390 width) | Delays         |
| -------------------------------------- | -------------- |
| `M110 0 C110 160 84.5 420 59 664`      | −0.3 s, −2.1 s |
| `M150 0 C150 160 136.5 420 123 664`    | −1.2 s, −3.0 s |
| `M195 0 C195 160 195 420 195 664`      | −0.7 s, −2.5 s |
| `M240 0 C240 160 253.5 420 267 664`    | −1.6 s, −3.4 s |
| `M280 0 C280 160 305.5 420 331 664`    | −0.1 s, −1.9 s |

Loop duration by fan speed: auto 3.6 s, quiet 6 s, low 4.6 s, medium 2.8 s, high 1.7 s. The layer
fades out over .7 s when off. Scale x with screen width.

## States the board supports

Board defaults: on, mode cool, fan auto, temp 24, plan normal.

**Temperature label** (`tempLabel`):

|     | cool         | heat         | dry         | fan        | auto      |
| --- | ------------ | ------------ | ----------- | ---------- | --------- |
| On  | "Cooling to" | "Heating to" | "Drying at" | "Fan only" | "Auto at" |
| Off | "Set to"     | "Set to"     | "Set to"    | "Set to"   | "Set to"  |

- **Fan-only** (mode fan): temperature locked — value "—", no "°", slider fill 0 (marker at
  bottom), slider and −/+ disabled; display shows "FAN".
- **Off**: particle layer hidden, unit vent slot 9 → 3, blade hidden, display blank, fan icon stops,
  power pill knob left with "Off", Power card sub "Standby", label "Set to". Controls stay
  enabled (settings change what the AC will do when it turns on).
- **Energy plan** is one value: normal / eco / chill.
  - Eco toggle on → plan eco **and temperature set to 26** ("Holds 26°"); display shows the leaf.
  - Powerchill toggle on → plan chill (so Eco turns off); display shows the bolt.
  - Turning either off → plan normal. Eco and Powerchill are never on together.
- **Fan bars** on the display: level auto 0 (wave), quiet 1, low 2, medium 3, high 4.
- Any change re-runs the display pulse (.6 s).

## Interactions

| Control                    | Changes                              |
| -------------------------- | ------------------------------------ |
| Slider drag / adjust, −, + | Set temperature (16–30, step 1)      |
| Mode button                | HVAC mode                            |
| Fan segmented              | Fan speed                            |
| Power pill                 | Power on/off                         |
| Eco toggle                 | Eco preset (sets 26°)                |
| Powerchill toggle          | Powerchill preset                    |
| Back                       | Return to the previous screen (Home) |
| More options               | OPEN (not designed)                  |

## Motion

Breeze; particles (speed by fan); guide curves static; slider fill/marker .45 s; sliding fan
indicator .45 s; power knob .45 s overshoot; toggles .35 s; mode button fill .3 s; fan icon spin by
speed; display fade .4 s + pulse .6 s; vent slot .5 s; presses .92.

## Accessibility

Slider = adjustable; mode and fan options = buttons with `selected`; power and energy toggles =
switches; reading is a polite live region. Icon-only buttons labelled as above. Targets ≥ 44 pt
(slider column 44 wide).

## States the design does not show — OPEN

| State                               | Notes / proposal (not approved)                                            |
| ----------------------------------- | -------------------------------------------------------------------------- |
| AC offline                          | Controls disabled? banner? Board has none                                  |
| Command in flight / failed          | Optimistic change, revert + message on failure?                            |
| Status loading                      | Skeleton from the real layout                                              |
| "More options" content              | Propose: display light on/off (MirAIe `acdc`), device info. Needs a design |
| Short screens (iPhone SE, 667 tall) | The 844 budget does not fit: scroll, or shrink the unit/control area?      |
| Half degrees                        | MirAIe accepts floats; board uses whole degrees only                       |
| Heat on models without heat         | Hide or disable the Heat mode?                                             |
| Eco when temperature changes        | Does changing temp while Eco is on turn Eco off?                           |
