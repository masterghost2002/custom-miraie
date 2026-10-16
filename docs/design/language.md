# Chill design language

Source: `design/boards/Style.dc.html` plus the shared `<style>` block repeated in every board.
Tagline on the board: "Design language · light and dark · frosted glass, one accent, no gradients".
Dark is the default theme; light is optional. Units are CSS px = iOS points.

## 1. Colour

### Theme tokens

| Canvas variable  | Light                                                            | Dark                                                | Used for                                                                             |
| ---------------- | ---------------------------------------------------------------- | --------------------------------------------------- | ------------------------------------------------------------------------------------ |
| `--bg` (Ground)  | `#E7E5E2`                                                        | `#151413`                                           | Screen background                                                                    |
| `--ink`          | `#141210`                                                        | `#F3F1EE`                                           | Primary text and icons                                                               |
| `--muted`        | `#5E5A56`                                                        | `#A39E98`                                           | Secondary text, unselected icons                                                     |
| `--tick`         | `rgba(20,18,16,.22)`                                             | `rgba(255,255,255,.22)`                             | Slider ticks, position dots, floor/room lines                                        |
| `--track`        | `rgba(20,18,16,.07)`                                             | `rgba(255,255,255,.08)`                             | Segmented track, toggle off, slider track, dividers, power-knob off, day-off circles |
| `--glass`        | `rgba(255,255,255,.58)` (swatch "White 58%", `#F4F3F1` on solid) | `rgba(48,46,44,.55)` (swatch "Warm 55%", `#282624`) | Glass card fill                                                                      |
| `--glass-line`   | `rgba(255,255,255,.85)`                                          | `rgba(255,255,255,.08)`                             | 1px glass card border                                                                |
| `--glass-shadow` | `0 10px 30px rgba(60,40,20,.07)`                                 | `0 10px 30px rgba(0,0,0,.3)`                        | Glass card shadow                                                                    |
| `--pill`         | `#FFFFFF`                                                        | `rgba(255,255,255,.10)` (Sign in board: `.08`)      | Raised controls inside cards, input fields                                           |
| `--field-line`   | `rgba(20,18,16,.08)`                                             | `rgba(255,255,255,.10)`                             | 1px input border (Sign in only)                                                      |
| `--sel-bg`       | `#141210`                                                        | `#F3F1EE`                                           | Selected pill, primary button, toggle on, current tab                                |
| `--sel-ink`      | `#FFFFFF`                                                        | `#151413`                                           | Text/icon on `--sel-bg`                                                              |
| `--accent`       | `#E8701F`                                                        | `#F07A2A`                                           | Power on, slider fill, selected mode ring, set sleep timer moon                      |
| `--unit`         | `#F7F6F4`                                                        | `#F2F1EF`                                           | AC unit body (white in both themes)                                                  |
| `--slot`         | `#1C1A18`                                                        | `#1C1A18`                                           | Vent slot on small unit drawings                                                     |
| `--particle`     | `rgba(20,18,16,.45)` (Rooms, Airflow: `.5`)                      | `rgba(255,255,255,.5)` (Rooms, Airflow: `.55`)      | Air particles                                                                        |
| `--guide`        | `rgba(20,18,16,.06)` (Airflow: `.10`)                            | `rgba(255,255,255,.06)` (Airflow: `.10`)            | Air guide curves (Climate), airflow stream lines (Airflow)                           |
| `--beam`         | `rgba(20,18,16,.07)`                                             | `rgba(255,255,255,.07)`                             | Airflow cone/wedge fill (Airflow only)                                               |
| `--wave`         | `rgba(20,18,16,.09)`                                             | `rgba(255,255,255,.07)`                             | Breeze background lines                                                              |

### Fixed colours (same in both themes)

| Value                  | Used for                                                                                                                                  |
| ---------------------- | ----------------------------------------------------------------------------------------------------------------------------------------- |
| `#E8701F`              | AC dead-front display digits, icons and lit fan bars (both themes, even though dark `--accent` is `#F07A2A`)                              |
| `rgba(232,112,31,.2)`  | Unlit fan bars                                                                                                                            |
| `rgba(232,112,31,.3)`  | Display digit glow: `text-shadow 0 0 8px`                                                                                                 |
| `rgba(232,112,31,.35)` | Shadow under an "on" power knob/button: `0 6px 16px`                                                                                      |
| `rgba(232,112,31,.22)` | Selected mode button outer shadow: `0 8px 20px`                                                                                           |
| `#2B2825`              | Vent slot on the large unit drawings (Sign in, Home card, Climate)                                                                        |
| `#8C857E`              | Vent blade inside the Climate unit                                                                                                        |
| `#D8D4CE`              | Swing flap (Airflow side view)                                                                                                            |
| `#C9C5C0`              | Status LED when off (All devices icon)                                                                                                    |
| `#FFFFFF`              | Text/icon on accent; toggle knob (off, and on in light); slider marker; unit top highlight; position dot "on"; selected mode fill (light) |
| `#2A2826`              | Selected mode button fill (dark)                                                                                                          |
| `#151413`              | Toggle knob when on (dark)                                                                                                                |

## 2. Type — Plus Jakarta Sans

Weights loaded: 300, 400, 500, 600, 700. Numbers are big and light; titles are bold.

| Role                          | Size | Weight           | Letter spacing | Line height            | Example                          |
| ----------------------------- | ---- | ---------------- | -------------- | ---------------------- | -------------------------------- |
| Reading (Climate)             | 96   | 300              | −0.05em (−4.8) | 1                      | "24"                             |
| Reading degree                | 40   | 300              | 0              | 1, offset +10 from top | "°"                              |
| Card reading (Home)           | 64   | 300              | −0.05em (−3.2) | 1                      | "24"                             |
| Card degree                   | 28   | 300              | 0              | 1, offset +6           | "°"                              |
| Sign-in hero                  | 40   | 400              | −0.04em (−1.6) | 1.12                   | "Your AC, made simple."          |
| Screen title                  | 30   | 700              | −0.03em (−0.9) | 1.15                   | "Good evening"                   |
| Detail header title           | 17   | 600              | −0.01em        | normal                 | "Air conditioner"                |
| Featured card name            | 17   | 600              | 0              | normal                 | "Bedroom"                        |
| Card title                    | 16   | 600              | 0              | normal                 | "Fan speed"                      |
| Small card title              | 15   | 600              | 0              | normal                 | "Living room", "Eco", "Airflow"  |
| Room pill                     | 15   | 500              | 0              | normal                 | "Bedroom"                        |
| Temperature label             | 15   | 500              | 0              | normal                 | "Cooling to"                     |
| Body (Sign in)                | 15   | 400              | 0              | 1.5                    | intro paragraph                  |
| Chip / mode chip              | 14   | 600              | 0              | normal                 | "Cool"                           |
| Screen eyebrow                | 14   | 400              | 0              | normal                 | "Thu, 16 October"                |
| Inside temp (Climate)         | 14   | 400              | 0              | normal                 | "Inside 27°"                     |
| Supporting                    | 13   | 400 (labels 500) | 0              | normal                 | "Cooling to 24°"                 |
| Segmented label               | 13   | 600              | 0              | normal                 | "Auto"                           |
| Caption                       | 12   | 400              | 0              | 1.45                   | "Holds 26°", secure-storage note |
| Micro                         | 11   | 400 / 600 (days) | 0              | normal                 | "Time", day letters, footer      |
| Schedule time                 | 17   | 600              | −0.01em        | normal                 | "22:30"                          |
| Display digits (Climate unit) | 17   | 500              | 0.01em         | 1, tabular             | "24°"                            |
| Display digits (Sign in unit) | 15   | 500              | 0              | 1                      | "24°"                            |
| Display digits (Home unit)    | 11   | 500              | 0              | 1, tabular             | "24°"                            |
| Primary button                | 16   | 600              | 0              | normal                 | "Turn everything off"            |
| Power pill label              | 15   | 600              | 0              | normal                 | "On" / "Off"                     |

Style board labels: Reading "300 · 96 / 64", Screen title "700 · 30", Card title "600 · 16",
Supporting "400–500 · 13".

## 3. Shape, spacing, elevation

### Radii

| Radius  | Where                                                                                                         |
| ------- | ------------------------------------------------------------------------------------------------------------- |
| 40      | Phone frame (canvas only)                                                                                     |
| 34      | Tab bar dock                                                                                                  |
| 30      | Featured Home card, Airflow cards, Sign-in form, Style board sections                                         |
| 28      | Standard glass cards (device cards, Fan speed, Power, Energy, Sleep timer, schedules); 56-tall primary button |
| 26      | Shortcut tiles (Home), segmented track, 52-tall pills/fields                                                  |
| 24      | 48 × 48 round buttons                                                                                         |
| 22      | 44-tall pills/segments/room pills; All-devices icon tile (68 × 68, not a circle)                              |
| 20      | 40 × 40 circles                                                                                               |
| 18      | Schedule time box (84 × 52)                                                                                   |
| 14 / 11 | Toggle track (48 × 28) / knob (22 × 22)                                                                       |
| 13      | Day circles (26 × 26)                                                                                         |

Rule of thumb: every control is a pill or circle (radius = height ÷ 2); cards are 26–30.

### Spacing

- Screen padding: 20 left/right, 20 top (16 on detail screens), 28 bottom. Sign in: 44 top, 24 sides, 24 bottom.
- Card inner padding: 16 (Home featured card positions children 20 in; device list cards 14).
- Gaps: 12 between cards, 8 between room pills, 6 inside the tab bar, 4 inside segmented tracks,
  10 between −/+ and between mode buttons, 2 between a title and its supporting line.
- Header → first content: 20 (Home pills), 24 (All devices list, Schedules timer), 16 (detail cards).

### Elevation

- Glass card: `0 10px 30px` shadow, colour `rgba(60,40,20,.07)` light / `rgba(0,0,0,.3)` dark.
  React Native: `shadowOffset {0,10}`, `shadowRadius 15`, `shadowOpacity` .07 / .3, `shadowColor`
  `rgb(60,40,20)` / `rgb(0,0,0)` (already in `tokens.ts` as `shadow` + `shadowOpacity`).
- Power on: `0 6px 16px rgba(232,112,31,.35)`.
- Toggle knob: `0 1px 3px rgba(0,0,0,.25)`. Slider marker: `0 3px 8px rgba(0,0,0,.15)`.
- AC unit shadows: see §7.

## 4. The four rules (verbatim from the Style board)

1. **Orange marks only power and the active choice**: the slider fill, the selected mode ring, a
   running power button. (Also the AC display, and the moon when a sleep timer is set.)
2. **Selection is solid ink**: black in light, near-white in dark. Pills slide to the new choice.
3. **Cards are frosted glass with large radii.** Air particles flow behind them, so the blur has
   something to show.
4. **Flat colour only.** The background is slow drifting breeze lines, never a gradient fill, wash or
   glowing blob. (The user rejected gradients and colour orbs outright.)

## 5. iOS glass

The app is iOS only. Every surface the boards mark `.glass` (cards, round header buttons, −/+,
mode buttons, unselected room pills, tab bar, sign-in form) uses **expo-glass-effect `GlassView`**
(liquid glass, iOS 26+) when `isLiquidGlassAvailable() && isGlassEffectAPIAvailable()`.

Otherwise (older iOS, and the web preview) it falls back to the canvas's frosted fill:
background `glass` token, 1px `glass-line` border, the glass shadow from §3 (and on web,
`backdrop-filter: blur(22px) saturate(140%)`).

Liquid glass refracts and will not match the canvas pixel-for-pixel. That difference is accepted
(user's choice, 2026-10-16). Keep the radius, size, padding and content identical either way.

## 6. Motion catalogue

All timings are from the boards' CSS. **Reduced motion**
(`prefers-reduced-motion` / iOS Reduce Motion): every _ambient_ loop below is switched off — breeze,
particles, drips, fan spin, swing sweeps, auto dot blink, fan-bar wave. State transitions (sliding
pill, knob, fades) may stay.

| Motion                      | Spec                                                                                                                                                                                                                                                                                                                                                            |
| --------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Breeze background           | Two SVG layers of thin wavy lines (1px, `--wave`), each 2× screen width. Layer 1: 6 lines at y 52, 200, 348, 496, 644, 792, wave length 97.5, amplitude ≈ 6–12. Layer 2: 5 lines at y 126, 274, 422, 570, 718, wave length 65, amplitude ≈ 5–12. Both translate X 0 → −390 linearly, forever: layer 1 over **70 s**, layer 2 over **110 s**. Behind everything. |
| Press                       | `transform: scale(.94)` over **.15 s** (most buttons). Climate buttons and power circles: **.92**. Room pills: **.95**. Primary button: **.97**.                                                                                                                                                                                                                |
| Sliding selection indicator | Solid `--sel-bg` pill under the segmented options moves with `translateX` over **.45 s cubic-bezier(.2,.8,.2,1)**. Option label colour `--muted` → `--sel-ink` over .3 s.                                                                                                                                                                                       |
| Power knob                  | 44 × 44 knob slides from left 4 to `100% − 48` over **.45 s cubic-bezier(.3,1.3,.5,1)** (slight overshoot); background `--track` → `--accent`, icon `--ink` → white, .3 s; "On"/"Off" labels cross-fade .3 s.                                                                                                                                                   |
| Toggle knob                 | left 3 → 23 over **.35 s cubic-bezier(.3,1.3,.5,1)**; track `--track` → `--sel-bg` over .3 s.                                                                                                                                                                                                                                                                   |
| Power circle (.pw)          | background/colour/shadow transition .3 s; press .92.                                                                                                                                                                                                                                                                                                            |
| Particles (Home card)       | 4 × 4 dots on 3 curves under the unit, **2.4 s** linear loop, opacity 0 → 1 by 12%, 1 until 75%, → 0 at 100%.                                                                                                                                                                                                                                                   |
| Particles (Climate)         | 5 × 5 dots, 2 per curve on 5 curves, **3.6 s** default (fan auto). By fan speed: quiet **6 s**, low **4.6 s**, medium **2.8 s**, high **1.7 s**. Opacity 0 → 1 by 8%, until 80%.                                                                                                                                                                                |
| Particles (Sign in)         | 5 × 5 dots, 2 per curve on 3 curves, **3.2 s**, opacity in by 10%, out after 75%.                                                                                                                                                                                                                                                                               |
| Particles (Airflow)         | 5 × 5 dots fly 270 px along each stream (side view) in **2.4 s**; top view drops 125 px in **2.2 s**. Opacity in by 12%, out after 80%.                                                                                                                                                                                                                         |
| Drips (All devices icon)    | 3 × 3 dots fall 18 px in **1.6 s**, opacity 0 → 1 by 20% → 0. Hidden when off.                                                                                                                                                                                                                                                                                  |
| Flow fade                   | Particle layer fades out when the unit is off: Home **.6 s**, Climate **.7 s**.                                                                                                                                                                                                                                                                                 |
| Fan icon spin               | 360° linear loop, **2 s** default; Climate by speed: quiet **3.6 s**, low **2.6 s**, medium **1.3 s**, high **.6 s**. Stops when off.                                                                                                                                                                                                                           |
| AC display                  | Digits/icons/bars fade **.4 s** (blank when off). On any setting change the whole display re-runs a **.6 s ease-out** fade from opacity .15 → 1 ("pulse").                                                                                                                                                                                                      |
| Fan-bar wave (auto)         | Each bar animates `rgba(232,112,31,.2)` → `#E8701F` → back over **1.4 s ease-in-out**, staggered 0, .15, .3, .45 s.                                                                                                                                                                                                                                             |
| Vent slot                   | Height change on power over **.5 s cubic-bezier(.2,.8,.2,1)** (Home 5 → 2, Climate 9 → 3); list icon 4 → 2 over .4 s.                                                                                                                                                                                                                                           |
| Swing sweep                 | Up/down: rotate 6° ↔ 40°, **3.4 s ease-in-out**, alternate, infinite. Left/right: 50° ↔ −50°, **3.8 s**. Fixed positions animate rotation over **.8 s cubic-bezier(.2,.8,.2,1)**.                                                                                                                                                                               |
| Auto position dots          | Accent dots blink to opacity .3 at 50%, **1.6 s** ease-in-out loop. Selected dot: white with 3 px accent ring, scale 1.25 over .3 s.                                                                                                                                                                                                                            |
| Slider fill / marker        | Height and top over **.45 s cubic-bezier(.2,.8,.2,1)**.                                                                                                                                                                                                                                                                                                         |
| Card dim                    | Offline cards fade to opacity .55 (devices) / disabled schedules .6, over .3 s.                                                                                                                                                                                                                                                                                 |
| Mode button                 | Background/colour/shadow over .3 s.                                                                                                                                                                                                                                                                                                                             |

## 7. The AC unit illustration

A minimal white body with a slim dark vent. Body colour `--unit`. It never uses a gradient; the
volume comes from inset shadows only.

| Size           | Where                                                                       | Body     | Radius (top / bottom corners)       | Shadows                                                                                                         | Vent                                                                                                                                                  | Extras                                                                                                                                                                                   |
| -------------- | --------------------------------------------------------------------------- | -------- | ----------------------------------- | --------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 250 × 76       | Sign in, centred                                                            | `--unit` | 20 / 28                             | inset 0 3 0 `#FFF`; inset 0 −14 20 `rgba(0,0,0,.06)`; 0 26 44 `rgba(60,40,20,.16)`; 0 6 12 `rgba(60,40,20,.08)` | inset 30 left/right, 11 from bottom, 7 tall, radius 4, `#2B2825`                                                                                      | Seam line 1px `rgba(0,0,0,.06)` at y 50, inset 16. Display at right 26, top 20 (snowflake 11 + "24°" 15/500).                                                                            |
| 310 × 92       | Climate, 40 from screen sides, top 92                                       | `--unit` | 26 / 36                             | inset 0 3 0 `#FFF`; inset 0 −16 22 `rgba(0,0,0,.05)`; 0 30 50 `rgba(0,0,0,.28)`; 0 6 14 `rgba(0,0,0,.12)`       | inset 34, 13 from bottom, **9 tall (3 when off)**, radius 5, `#2B2825`, clips a blade: inset 8, 2 tall, centred, radius 1, `#8C857E`, hidden when off | Seam at y 60, inset 20. Full display at right 30, top 24 (§8).                                                                                                                           |
| 150 × 48       | Home featured card, 20 from card right, top 72                              | `--unit` | 15 / 20                             | inset 0 2 0 `#FFF`; inset 0 −10 14 `rgba(0,0,0,.05)`; 0 14 26 `rgba(0,0,0,.22)`                                 | inset 18, 6 from bottom, **5 tall (2 when off)**, radius 3, `#2B2825`                                                                                 | Seam at y 31, inset 10. Display at right 14, top 11, height 12: mode icon 9 + temp 11/500.                                                                                               |
| 104 × 32       | Home small device cards                                                     | `--unit` | 10 / 13                             | inset 0 2 0 `#FFF`; inset 0 −8 10 `rgba(0,0,0,.06)`; 0 10 18 `rgba(60,40,20,.12)`                               | inset 10, 5 from bottom, 4 tall, radius 2, `--slot`                                                                                                   | No display.                                                                                                                                                                              |
| 44 × 15        | All devices list icon, inside a 68 × 68 radius-22 `--pill` tile at (12, 20) | `--unit` | 6 / 8                               | inset 0 1 0 `#FFF`; 0 6 12 `rgba(60,40,20,.16)`                                                                 | inset 6, 3 from bottom, **4 tall (2 when off)**, radius 2, `--slot`                                                                                   | LED 3 × 3 radius 2 at right 6, top 4: `--accent` with `0 0 5px` accent glow; off `#C9C5C0`, no glow. 3 drips below at x 10/21/32 (delays −.2, −.9, −.5 s) inside a 44 × 22 area at y 38. |
| 58 × 52 (side) | Airflow up/down card                                                        | `--unit` | 0 18 22 0 (wall-mounted, flat left) | inset 0 2 0 `#FFF`; inset 0 −10 14 `rgba(0,0,0,.06)`; 0 12 24 `rgba(60,40,20,.14)`                              | 24 × 6 at right 6, bottom 6, radius 3, `--slot`                                                                                                       | Flap 26 × 3 radius 2 `#D8D4CE`, shadow 0 1 2 `rgba(0,0,0,.3)`, at (30, 95), rotates with the beam.                                                                                       |
| 120 × 14 (top) | Airflow left/right card, at (115, 24)                                       | `--unit` | 7                                   | inset 0 2 0 `#FFF`; 0 8 18 `rgba(60,40,20,.14)`                                                                 | —                                                                                                                                                     | —                                                                                                                                                                                        |

## 8. The AC "dead-front" display

Small orange digits and icons that glow straight on the white panel, mirroring every setting —
the user rejected an earlier black display box as clunky.

- Colour `#E8701F` in **both themes**; digits get `text-shadow 0 0 8px rgba(232,112,31,.3)` and
  tabular numerals.
- Content left → right, gap 7 (Climate; Home gap 4, Sign in gap 6), all vertically centred, row
  height 18 (Climate):
  1. **Preset icon** 10 × 10 (Climate only): leaf when Eco, lightning bolt when Powerchill, nothing
     otherwise (the slot keeps its 10 px width).
  2. **Mode icon** 12 × 12 (Home 9 × 9, Sign in 11): snowflake (cool), droplet (dry), fan (fan),
     sun (heat), circle-with-"A" (auto). Stroke 2.2.
  3. **Temperature** "24°", or **"FAN"** in fan-only mode.
  4. **Fan bars** (Climate only): 4 bars, 2 wide, heights 3 / 5 / 8 / 11, gap 1.5, radius 1,
     bottom-aligned in an 11-tall box. Level auto 0, quiet 1, low 2, medium 3, high 4; bar _n_ is
     lit (`#E8701F`) when level ≥ _n_, unlit `rgba(232,112,31,.2)`. Auto runs the bar wave (§6).
- **Off**: digits, icons and bars fade to opacity 0 over .4 s — the panel is blank.
- **On change** of any setting: .6 s ease-out pulse from opacity .15 → 1.
- The Style board example: snowflake 11 + "24°" 15/500 + bars 3/5/7/10 tall (third lit), on a
  200 × 60 unit (radius 18 / 24), vent inset 24, 9 from bottom, 6 tall.

## 9. Controls catalogue

| Control                         | Size                                                                                              | Spec                                                                                                                                                                                                                                                                                                                                                                                                                                   |
| ------------------------------- | ------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Segmented pill**              | track padding 4, radius 26, `--track`; options 44 tall, radius 22, 13/600, gap 4, equal columns   | Unselected label `--muted`; selected label `--sel-ink` over a sliding `--sel-bg` indicator (44 tall, radius 22, width = one column) at `translateX(index × (column + 4))`. Climate/Schedules (5 options, 350 wide card): indicator 58.8, step 62.8. Airflow (6 options): 49.7, step 53.7. Compute from measured width, do not hard-code. `accessibilityRole="button"` + `selected` state per option; group has an accessibility label. |
| **Icon button**                 | 48 × 48 circle, `.glass`, icon 20, stroke 1.9–2                                                   | Header back (arrow-left), more (3 dots r 1.8), account (user), new (plus), −/+ (icon 18). Disabled opacity .35.                                                                                                                                                                                                                                                                                                                        |
| **Mode button (selected ring)** | 48 × 48 circle, `.glass`, icon 20 stroke 1.9, `--muted`                                           | Selected: fill `#FFFFFF` (dark `#2A2826`), icon `--accent`, border transparent, `box-shadow 0 0 0 2px accent, 0 8px 20px rgba(232,112,31,.22)`.                                                                                                                                                                                                                                                                                        |
| **Toggle**                      | track 48 × 28 radius 14; knob 22 × 22 radius 11 at top 3                                          | Off: track `--track`, knob `#FFFFFF` at left 3, shadow 0 1 3 `rgba(0,0,0,.25)`. On: track `--sel-bg`, knob at left 23; knob `#FFFFFF` light / `#151413` dark. `accessibilityRole="switch"`, `checked`.                                                                                                                                                                                                                                 |
| **Power pill**                  | 120 × 52 (Home), full card width × 52 (Climate), 140 × 52 (Style board); radius 26, `--pill`      | Knob 44 × 44 radius 22 at top 4: off at left 4, `--track` bg, `--ink` power icon 18 stroke 2.2; on at right 4, `--accent` bg, white icon, shadow 0 6 16 `rgba(232,112,31,.35)`. Label "On" 15/600 at left 18 top 16 (visible when on); "Off" 15/600 `--muted` at right 18 (visible when off). Disabled opacity .4. `role="switch"`.                                                                                                    |
| **Power circle**                | 44 × 44 (Home small cards) or 48 × 48 (All devices)                                               | `--pill` bg, `--ink` power icon 18/20 stroke 2.2; on: `--accent` bg, white icon, accent shadow. Disabled .4. `aria-pressed`.                                                                                                                                                                                                                                                                                                           |
| **Primary button**              | 56 tall, radius 28, full width (220 on Style board)                                               | `--sel-bg` bg, `--sel-ink` 16/600; optional 18 px icon + gap 10. Disabled .35; press .97.                                                                                                                                                                                                                                                                                                                                              |
| **Room pill**                   | 44 tall, padding 0 20, radius 22, 15/500                                                          | Unselected: glass fill (blur 22, no saturate), 1px `--glass-line`, `--ink`. Selected: `--sel-bg`/`--sel-ink`, border transparent. Press .95.                                                                                                                                                                                                                                                                                           |
| **Chip**                        | 52 tall (Home mode chip, padding 0 18) or 48 (Airflow header, padding 0 16 0 14, icon 16 + gap 6) | Radius = height/2, 14/600.                                                                                                                                                                                                                                                                                                                                                                                                             |
| **Glass tab bar**               | `.glass` dock, padding 6, gap 6, radius 34, centred, 4 items                                      | Items 56 × 56 radius 28, icon 22 stroke 1.9. Current: `--sel-bg` fill, `--sel-ink` icon; others `--muted`. Icons: house (Home), 2×2 rounded squares rx 2 (All devices), clock (Schedules), gear (Settings). Labels via accessibility only: "Home", "All devices", "Schedules", "Settings"; current has `aria-current="page"`.                                                                                                          |
| **Text field** (Sign in)        | 52 tall, radius 26, padding 0 20, 16 px `--ink`                                                   | `--pill` bg, 1px `--field-line`; label above 13/500 `--muted`, padding-left 6, gap 6; placeholder `--muted`; focus outline 2px `--ink`, offset 2.                                                                                                                                                                                                                                                                                      |
| **Icon circle** (in cards)      | 40 × 40 (Fan speed, Sleep timer) / 44 × 44 (shortcut tiles) / 40 × 40 Home expand                 | `--pill` bg, icon 16–18.                                                                                                                                                                                                                                                                                                                                                                                                               |

Icons are Lucide (stroke icons): snowflake, droplet, fan, sun, circle-A (custom), leaf, zap,
power, house, layout-grid, clock, settings, wind, moon, thermometer, arrow-up-right, arrow-left,
plus, minus, ellipsis, user, lock. Use `lucide-react-native`. Never emoji.
