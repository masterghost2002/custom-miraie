# Schedules

Board: `design/boards/Schedules.dc.html` · Route: `src/app/(tabs)/schedules.tsx` · Spec: CHILL-009

The third tab: a sleep timer for one AC and a list of recurring schedules.

## Layout (top to bottom)

Root: `--bg` + breeze background. Content inside the safe area: padding 20 top, 20 left/right,
28 bottom; flex column.

1. **Header** — row `space-between`, top-aligned:
   - Column gap 4: room name 14 / 400 `--muted` ("Bedroom"); title 30 / 700, −0.03em, line height
     1.15: "Schedules".
   - **New schedule** button: 48 × 48 `.glass` circle, plus icon 20 (stroke 2),
     `accessibilityLabel="New schedule"`.
2. **Sleep timer card** — margin-top 24, `.glass`, radius 28, padding 16, accessibility label
   "Sleep timer":
   - Row height 40, `space-between`: column gap 2 — "Sleep timer" 16 / 600 and the note
     13 / 400 `--muted` (polite live region, table below); right: 40 × 40 `--pill` circle with a
     moon icon 18 (stroke 2), colour `--muted` when not set and `--accent` when set (.3 s);
     decorative.
   - Margin-top 12: segmented pill (language §9), 5 options, accessibility group "Turn off after":

     | Label | `accessibilityLabel` | Note                   |
     | ----- | -------------------- | ---------------------- |
     | "Off" | — ("Off")            | "Not set"              |
     | "30m" | "30 minutes"         | "Turns off in 30 min"  |
     | "1h"  | "1 hour"             | "Turns off in 1 hour"  |
     | "2h"  | "2 hours"            | "Turns off in 2 hours" |
     | "4h"  | "4 hours"            | "Turns off in 4 hours" |
3. **Schedule cards** — margin-top 12, column, gap 12. Card: `.glass`, radius 28, padding 16:
   - Row height 40, `space-between`: column gap 2 — name 16 / 600 and action 13 / 400 `--muted`;
     right: toggle (language §9), `role="switch"`, `checked` = enabled,
     `accessibilityLabel="<name> at <time>"` ("Wind down at 22:30").
   - Margin-top 12, row gap 12, centred:
     - Time box: 84 × 52, radius 18, `--pill`, padding 0 14, column centred: "Time" 11 / 400
       `--muted`, then the time 17 / 600 (−0.01em), 24-hour "22:30".
     - Days: 7 circles 26 × 26, radius 13, gap 4, 11 / 600 letters "M T W T F S S" (Monday first).
       Active day: `--sel-bg` / `--sel-ink`; inactive: `--track` / `--muted`. The circles are
       hidden from accessibility; a visually-hidden label reads the days ("Monday to Friday",
       "Every day").
   - Disabled schedule: whole card opacity .6 (.3 s).
4. **Tab bar** — margin-top auto, centred, Schedules current.

The list scrolls when it is taller than the space above the tab bar.

## States the board supports

Sleep timer: one of off / 30m / 1h / 2h / 4h (board default off). Indicator slides .45 s.

Schedules (board demo data):

| id      | Time  | Name        | Action                 | Days                         | Enabled |
| ------- | ----- | ----------- | ---------------------- | ---------------------------- | ------- |
| wind    | 22:30 | Wind down   | "Cool 25° · Fan quiet" | Mon–Fri ("Monday to Friday") | yes     |
| morning | 07:00 | Morning off | "Turn off"             | every day ("Every day")      | yes     |
| precool | 18:30 | Pre-cool    | "Cool 24° · Fan auto"  | Mon–Fri                      | no      |

Action line format: "<Mode> <temp>° · Fan <speed>" for turn-on schedules, "Turn off" for
turn-off schedules.

## Interactions

| Control          | Changes                                                  |
| ---------------- | -------------------------------------------------------- |
| Timer segmented  | Sets a one-shot "turn off after" timer for the room's AC |
| Schedule toggle  | Enables / disables that schedule                         |
| New schedule (+) | OPEN — the create/edit flow is not designed              |

## Motion

Breeze; sliding indicator; toggle knob .35 s; moon colour .3 s; card dim .3 s; presses .94.

## Accessibility

Timer options are buttons with `selected`; toggles are switches labelled "<name> at <time>"; the
timer note is a live region; day circles hidden behind a spoken label. Targets ≥ 44 pt.

## States the design does not show — OPEN

| State                                         | Notes / proposal (not approved)                                                                                     |
| --------------------------------------------- | ------------------------------------------------------------------------------------------------------------------- |
| Which AC the timer/schedules belong to        | Header shows "Bedroom": how does the user switch rooms? Room pills like Home?                                       |
| Create / edit schedule flow                   | Not designed (time picker, days, action, mode/temp/fan)                                                             |
| Delete a schedule                             | Not designed (swipe? edit screen?)                                                                                  |
| No schedules                                  | Empty-state copy needed                                                                                             |
| Timer running countdown                       | Does the note update ("Turns off in 1h 12m")?                                                                       |
| Where schedules run                           | MirAIe's schedule API is unknown; schedules may need to run on the phone or a server — product decision (CHILL-009) |
| Schedule fails to run (phone asleep, offline) | How is that surfaced?                                                                                               |
