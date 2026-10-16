# Airflow

Board: `design/boards/Airflow.dc.html` · Route: `src/app/device/[id]/airflow.tsx` · Spec: CHILL-007

Detail screen for one AC's louvres (no tab bar, back button). Two cards: up/down and left/right
swing, each with a small illustration and a 6-option segmented control.

## Layout (top to bottom)

Root: `--bg` + breeze background. Content inside the safe area: padding 16 top, 20 left/right,
28 bottom; flex column. Board content width 350.

1. **Header** — height 48, row `space-between`, centred:
   - Back: 48 × 48 `.glass` circle, arrow-left 20 (stroke 2), `accessibilityLabel="Back to Home"`.
   - Title column, centred, gap 2: "Airflow" (17 / 600, −0.01em) and the room name (13 / 400
     `--muted`, "Bedroom").
   - Mode chip: `.glass`, height 48, padding 0 16 0 14, radius 24, row gap 6: current mode icon 16
     (stroke 2) + mode name 14 / 600 ("Cool"); `accessibilityLabel="Mode: cool"` → Climate.
2. **Up and down card** — margin-top 16, `.glass`, radius 30, clips children, flex column,
   accessibility label "Up and down":
   - Header row: padding 16 16 0, height 40: "Up and down" 16 / 600, gap 2, status 13 / 400
     `--muted` (polite live region): "Swinging" (auto) or "Position <n>".
   - Illustration (decorative), height 240, width 350 (centre it in wider cards), side view of a
     bedroom — coordinates in the 350 × 240 box:

     | Element               | Position / size                                                                                               | Style                                                                                                                          |
     | --------------------- | ------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------ |
     | Floor line            | left 16, right 16, top 220, 1 tall                                                                            | `--tick`                                                                                                                       |
     | Headboard             | left 318, top 156, 12 × 64, radius 6                                                                          | `--pill`, 1px `--glass-line`                                                                                                   |
     | Bed                   | left 196, top 190, 124 × 30, radius 10                                                                        | `--pill`, 1px `--glass-line`                                                                                                   |
     | Pillow                | left 284, top 178, 28 × 13, radius 7                                                                          | `--track`                                                                                                                      |
     | Beam                  | box left 50, top 23, 300 × 150, pivot at its left-middle (50, 98); rotated by the angle below                 | Cone: polygon (0, 47%) (100%, 10%) (100%, 90%) (0, 53%), fill `--beam`                                                         |
     | Streams (in the beam) | 3 lines from (0, 74), 280 long, 1 tall, rotated −6°, 0°, +6° about their left end                             | `--guide`; 2 particles each (5 × 5 `--particle`) flying 0 → 270 px in 2.4 s; delays (−0.2, −1.4), (−0.8, −2.0), (−0.5, −1.7) s |
     | Unit (side view)      | left 0, top 50, 58 × 52                                                                                       | language §7                                                                                                                    |
     | Flap                  | left 30, top 95, 26 × 3, radius 2, pivot at its left end, same rotation as the beam                           | `#D8D4CE`, shadow 0 1 2 `rgba(0,0,0,.3)`                                                                                       |
     | Position dots         | 8 × 8 radius 4 at p1 (135.5, 103.4), p2 (133.3, 115.8), p3 (129.4, 127.7), p4 (123.9, 139), p5 (114.9, 151.9) | Default `--tick`; selected: `#FFFFFF` + 3 px `--accent` ring, scale 1.25; auto: all `--accent`, blinking (1.6 s)               |

     Beam/flap angle by position: p1 **6°** (highest), p2 **14°**, p3 **22°**, p4 **30°**,
     p5 **40°** (lowest). Auto: sweeps 6° ↔ 40° (3.4 s ease-in-out, alternate). Fixed positions
     animate to the angle over .8 s cubic-bezier(.2,.8,.2,1).

   - Segmented pill (language §9): margin 0 12 12, 6 options, accessibility group
     "Up-down position":

     | Label  | `accessibilityLabel`  | MirAIe `acvs` |
     | ------ | --------------------- | ------------- |
     | "Auto" | "Swing up and down"   | 0             |
     | "1"    | "Position 1, highest" | 1             |
     | "2"    | "Position 2"          | 2             |
     | "3"    | "Position 3"          | 3             |
     | "4"    | "Position 4"          | 4             |
     | "5"    | "Position 5, lowest"  | 5             |
3. **Left and right card** — margin-top 12, same card shell, accessibility label "Left and right":
   - Header row: "Left and right" 16 / 600 + status 13 / 400 `--muted` (live region): "Swinging"
     or the position name (table below).
   - Illustration (decorative), height 190, width 350, top view of the room:

     | Element                | Position / size                                                                                           | Style                                                                                                                         |
     | ---------------------- | --------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------- |
     | Room outline           | left 16, right 16, top 30, bottom 10, radius 18                                                           | 1px dashed `--tick`                                                                                                           |
     | Bed                    | left 210, top 118, 70 × 54, radius 10                                                                     | `--pill`, 1px `--glass-line`                                                                                                  |
     | Pillow                 | left 218, top 124, 54 × 10, radius 5                                                                      | `--track`                                                                                                                     |
     | Wedge                  | box left 25, top 38, 300 × 140, pivot at its top-centre (175, 38), rotated by the angle below             | Triangle polygon (50%, 0) (35%, 100%) (65%, 100%), fill `--beam`                                                              |
     | Columns (in the wedge) | 3 copies of the 300 × 140 box rotated −6°, 0°, +6° about the top-centre; each has a 1 × 130 line at x 150 | `--guide`; 2 drops each (5 × 5 `--particle`) falling 0 → 125 px in 2.2 s; delays (−0.3, −1.4), (−0.8, −1.9), (−0.55, −1.65) s |
     | Unit (top view)        | left 115, top 24, 120 × 14                                                                                | language §7                                                                                                                   |
     | Position dots          | p1 (86.7, 104.7), p2 (124.5, 133.7), p3 (171, 144), p4 (217.5, 133.7), p5 (255.3, 104.7)                  | as above                                                                                                                      |

     Wedge angle: p1 **50°** (far left), p2 **25°**, p3 **0°**, p4 **−25°**, p5 **−50°** (far right).
     Auto sweeps 50° ↔ −50° (3.8 s ease-in-out, alternate).

   - Segmented pill: margin 0 12 12, 6 options, group "Left-right position":

     | Label  | `accessibilityLabel`    | Status text | MirAIe `achs` |
     | ------ | ----------------------- | ----------- | ------------- |
     | "Auto" | "Swing left and right"  | "Swinging"  | 0             |
     | "1"    | "Position 1, far left"  | "Far left"  | 1             |
     | "2"    | "Position 2, left"      | "Left"      | 2             |
     | "3"    | "Position 3, centre"    | "Centre"    | 3             |
     | "4"    | "Position 4, right"     | "Right"     | 4             |
     | "5"    | "Position 5, far right" | "Far right" | 5             |

No tab bar on this screen; the rest of the height is empty ground with the breeze.

## States the board supports

Board defaults: up/down **p3**, left/right **auto**. Each axis is independent: auto (sweeping,
blinking dots, "Swinging") or one fixed position (rotated, one ringed dot, position text). The board
does not change with power or mode.

## Interactions

| Control              | Changes                       |
| -------------------- | ----------------------------- |
| Up-down segmented    | Vertical swing (`acvs` 0–5)   |
| Left-right segmented | Horizontal swing (`achs` 0–5) |
| Mode chip            | Opens Climate                 |
| Back                 | Previous screen               |

## Motion

Breeze; sliding indicators .45 s; beam/wedge/flap rotation .8 s; sweeps 3.4 s / 3.8 s; particles
2.4 s / 2.2 s; auto dot blink 1.6 s; presses .94. All ambient loops off with Reduce Motion.

## Accessibility

Options are buttons with `selected`; statuses are polite live regions; illustrations hidden.
Targets ≥ 44 pt (segments 44 tall).

## States the design does not show — OPEN

| State                          | Notes / proposal (not approved)                                            |
| ------------------------------ | -------------------------------------------------------------------------- |
| AC off                         | Allow setting swing while off? dim the illustration? stop particles?       |
| AC offline                     | Disable both controls?                                                     |
| Model without horizontal swing | Hide the left/right card?                                                  |
| Command in flight / failed     | Optimistic + revert with message?                                          |
| Home tile summary              | Home shows "Swing · Centre": define the summary text for every combination |
