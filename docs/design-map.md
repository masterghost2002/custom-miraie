# Design map: canvas → token → class

Look up every value from a board here before writing it in code. If a value is not in this table,
it is not a token yet: stop and add it (CHILL-003) instead of typing a raw value.

- **Token** = key in `src/theme/tokens.ts` (`themes.light.*` / `themes.dark.*`, or `display.*`).
  Read raw values in code with `useTheme().tokens.<key>` (SVG strokes, shadows, animated colours).
- **Class** = NativeWind class from `tailwind.config.js`. Colour classes resolve to CSS variables
  that `<ThemeProvider>` sets from the active theme, so one class works in both themes.
- Full design context: `docs/design/language.md`; per screen: `docs/design/screens/`.

## Colour

| Canvas                         | Light                   | Dark                    | Token            | Class (examples)                                      |
| ------------------------------ | ----------------------- | ----------------------- | ---------------- | ----------------------------------------------------- |
| `--bg`                         | `#E7E5E2`               | `#151413`               | `bg`             | `bg-ground`                                           |
| `--ink`                        | `#141210`               | `#F3F1EE`               | `ink`            | `text-ink`, `bg-ink`                                  |
| `--muted`                      | `#5E5A56`               | `#A39E98`               | `muted`          | `text-muted`                                          |
| `--tick`                       | `rgba(20,18,16,.22)`    | `rgba(255,255,255,.22)` | `tick`           | `bg-tick`, `border-tick`                              |
| `--track`                      | `rgba(20,18,16,.07)`    | `rgba(255,255,255,.08)` | `track`          | `bg-track`                                            |
| `--glass`                      | `rgba(255,255,255,.58)` | `rgba(48,46,44,.55)`    | `glass`          | `bg-glass`                                            |
| `--glass-line`                 | `rgba(255,255,255,.85)` | `rgba(255,255,255,.08)` | `glassLine`      | `border-glass-line`                                   |
| `--glass-shadow` colour        | `rgba(60,40,20,.07)`    | `rgba(0,0,0,.3)`        | `glassShadow`    | none — the glass primitive's `boxShadow: 0 10px 30px` |
| `--pill`                       | `#FFFFFF`               | `rgba(255,255,255,.10)` | `pill`           | `bg-pill`                                             |
| `--field-line`                 | `rgba(20,18,16,.08)`    | `rgba(255,255,255,.10)` | `fieldLine`      | `border-field-line`                                   |
| `--sel-bg`                     | `#141210`               | `#F3F1EE`               | `selBg`          | `bg-sel-bg`                                           |
| `--sel-ink`                    | `#FFFFFF`               | `#151413`               | `selInk`         | `text-sel-ink`                                        |
| `--accent`                     | `#E8701F`               | `#F07A2A`               | `accent`         | `bg-accent`, `text-accent`, `border-accent`           |
| white on accent                | `#FFFFFF`               | `#FFFFFF`               | `onAccent`       | `text-on-accent`                                      |
| selected mode fill (`.mb.sel`) | `#FFFFFF`               | `#2A2826`               | `modeSel`        | `bg-mode-sel`                                         |
| `--unit`                       | `#F7F6F4`               | `#F2F1EF`               | `unit`           | `bg-unit`                                             |
| `--slot`                       | `#1C1A18`               | `#1C1A18`               | `slot`           | `bg-slot`                                             |
| `--particle`                   | `rgba(20,18,16,.45)`    | `rgba(255,255,255,.5)`  | `particle`       | none (animated views/SVG)                             |
| `--guide`                      | `rgba(20,18,16,.06)`    | `rgba(255,255,255,.06)` | `guide`          | none (SVG stroke)                                     |
| `--wave`                       | `rgba(20,18,16,.09)`    | `rgba(255,255,255,.07)` | `wave`           | none (breeze SVG stroke)                              |
| display digits/icons/lit bars  | `#E8701F`               | `#E8701F`               | `display.glow`   | none                                                  |
| unlit fan bar                  | `rgba(232,112,31,.2)`   | same                    | `display.dim`    | none                                                  |
| large-unit vent slot           | `#2B2825`               | same                    | `display.vent`   | none                                                  |
| LED off                        | `#C9C5C0`               | same                    | `display.ledOff` | none                                                  |

Toggle knob note: the "on" knob is `#FFFFFF` in light and `#151413` in dark, which equals
`selInk` in both themes — use `selInk` for the on knob. The "off" knob is `fixed.white`.

## Type

Families (`fontFamily`): `font-light` 300, `font-regular` 400, `font-medium` 500,
`font-semibold` 600, `font-bold` 700 (Plus Jakarta Sans; native needs one family per weight, so
never use `fontWeight` with these).

| Canvas role                                                | Size / weight   | Class                        |
| ---------------------------------------------------------- | --------------- | ---------------------------- |
| Micro (time label, day letters, footer)                    | 11 / 400–600    | `text-micro` + weight        |
| Caption ("Holds 26°", notes, tile subs)                    | 12 / 400        | `text-caption font-regular`  |
| Supporting (subs, segmented labels at 600)                 | 13 / 400–600    | `text-support` + weight      |
| Chip, eyebrow, Inside temp                                 | 14 / 400 or 600 | `text-chip` + weight         |
| Body, room pill, temp label, small card title, power label | 15 / 400–600    | `text-body` + weight         |
| Card title, field text, primary button                     | 16 / 600        | `text-card font-semibold`    |
| Header title, featured name, schedule time                 | 17 / 600        | `text-header font-semibold`  |
| Screen title                                               | 30 / 700        | `text-title font-bold`       |
| Sign-in hero                                               | 40 / 400        | `text-hero font-regular`     |
| Reading degree                                             | 40 / 300        | `text-degree font-light`     |
| Card degree                                                | 28 / 300        | `text-degree-sm font-light`  |
| Card reading                                               | 64 / 300        | `text-reading-sm font-light` |
| Reading                                                    | 96 / 300        | `text-reading font-light`    |

Line heights and letter spacing are baked into each size (see `tailwind.config.js`). The Sign-in
body (1.5) is `text-intro`, the secure-storage note (1.45) is `text-note`, display digits are
`text-display-sm|md|lg` (0.01em on the large one) and every reading and display digit uses tabular
numerals (the `Text` primitive adds them). The hero's 1.12 is 45 px (≈ 1.125); the −0.01em on the
17 px header/time is in `text-header`.

## Spacing and size

Tailwind defaults (px): `0.5`=2, `1`=4, `1.5`=6, `2`=8, `2.5`=10, `3`=12, `3.5`=14, `4`=16, `5`=20,
`6`=24, `7`=28, `8`=32, `9`=36, `10`=40, `11`=44, `12`=48, `14`=56, `16`=64, `20`=80, `24`=96,
`28`=112, `32`=128, `60`=240. Project extras: `13`=52, `15`=60, `17`=68, `18`=72, `19`=76,
`21`=84, `30`=120, `42`=168, `59`=236, plus `4.5`=18, `5.5`=22, `6.5`=26, `47.5`=190, `70`=280.

| Board value                                   | Class                                                                       |
| --------------------------------------------- | --------------------------------------------------------------------------- |
| Screen padding 20 / bottom 28 / detail top 16 | `px-5 pt-5 pb-7` / `pt-4`                                                   |
| Sign-in padding 44 / 24 / 24                  | `pt-11 px-6 pb-6`                                                           |
| Card padding 16 / list card 14                | `p-4` / `p-3.5`                                                             |
| Gaps 2 / 4 / 6 / 8 / 10 / 12 / 14             | `gap-0.5` / `gap-1` / `gap-1.5` / `gap-2` / `gap-2.5` / `gap-3` / `gap-3.5` |
| Circle 40 / 44 / 48 / 52 / 56                 | `size-10` / `size-11` / `size-12` / `size-13` / `size-14`                   |
| Pill heights 44 / 52 / 56                     | `h-11` / `h-13` / `h-14`                                                    |
| Power pill 120 × 52                           | `w-30 h-13`                                                                 |
| Room icon tile 68                             | `size-17`                                                                   |
| Shortcut tile height 76                       | `h-19`                                                                      |
| Schedule time box 84 × 52                     | `w-21 h-13`                                                                 |
| Small device card height 168                  | `h-42`                                                                      |
| Featured card height 236                      | `h-59`                                                                      |
| Climate power/energy card height 128          | `h-32`                                                                      |
| Airflow up/down illustration 240              | `h-60`                                                                      |

## Radius

| Board                                                              | Class           |
| ------------------------------------------------------------------ | --------------- |
| 18 (time box)                                                      | `rounded-chip`  |
| 26 (shortcut tiles, segmented track)                               | `rounded-tile`  |
| 28 (cards)                                                         | `rounded-card`  |
| 30 (featured card, Airflow cards, sign-in form)                    | `rounded-panel` |
| 34 (tab bar)                                                       | `rounded-dock`  |
| Height ÷ 2 (all circles and pills: 11, 13, 14, 20, 22, 24, 26, 28) | `rounded-full`  |

## Added in CHILL-003

The values the boards used without a token now have one (owner answers, CHILL-003 Q2, 2026-10-16).
Particles stay `.45` light / `.5` dark everywhere; dark `--pill` is `.10` everywhere; the AC display
stays `#E8701F` in both themes; every press scales to `.94` (`.97` for the wide primary button).

| Board value                                                         | Where                                       | Token / class                                                     |
| ------------------------------------------------------------------- | ------------------------------------------- | ----------------------------------------------------------------- |
| `--beam` `rgba(20,18,16,.07)` / `rgba(255,255,255,.07)`             | Airflow cone and wedge                      | `beam`                                                            |
| `--guide` Airflow `.10`                                             | Airflow stream lines                        | `guideStrong` (Climate keeps `guide`)                             |
| `#FFFFFF` fixed                                                     | Toggle knob off, slider marker, unit inset  | `fixed.white`                                                     |
| `#8C857E`                                                           | Climate vent blade                          | `display.blade`                                                   |
| `#D8D4CE`                                                           | Airflow swing flap                          | `display.flap`                                                    |
| `rgba(232,112,31,.35)`                                              | Power-on shadow (0 6 16)                    | `fixed.powerShadow`                                               |
| `rgba(232,112,31,.22)`                                              | Selected mode shadow (0 8 20)               | `fixed.modeShadow`                                                |
| `rgba(232,112,31,.3)`                                               | Display digit glow (0 0 8)                  | `display.glowShadow`                                              |
| `rgba(0,0,0,.25)` / `.15`                                           | Toggle knob / slider marker shadow          | `fixed.knobShadow`, `fixed.markerShadow`                          |
| `rgba(0,0,0,.05–.06)`                                               | Unit inset shading, seam line               | `fixed.insetSoft`, `fixed.seam`                                   |
| Unit drop shadows `rgba(0,0,0,.28/.22/.12)`, warm `.16/.14/.12/.08` | AC unit sizes (language §7)                 | `fixed.unitShadow*`, `fixed.warmShadow*` (size table in `AcUnit`) |
| Radius 22 on a non-circle                                           | All-devices icon tile 68 × 68               | `rounded-tile-sm`                                                 |
| Spacing 18 / 22 / 26                                                | Mode chip padding / slider inset / day dots | `4.5` / `5.5` / `6.5`                                             |
| Size 280 / 190                                                      | Climate slider / Airflow top-view height    | `70` / `47.5`                                                     |
| Display digits 11 / 15 / 17 (line height 1)                         | Home / Sign in / Climate units              | `text-display-sm` / `text-display-md` / `text-display-lg`         |
| Sign-in body 15 / 1.5, secure note 12 / 1.45                        | Sign in                                     | `text-intro`, `text-note`                                         |
| `backdrop-filter: blur(22px) saturate(140%)`                        | Glass fallback on the web preview           | `web:backdrop-glass` (`web:backdrop-pill` without saturate)       |
| Unit body radii and sizes (150, 250, 310, 104 × 32, 44 × 15)        | AC unit drawings                            | size table inside `src/ui/ac-unit.tsx`                            |
| Segmented indicator width / step                                    | Segmented pill                              | computed from the measured width — never a constant               |
