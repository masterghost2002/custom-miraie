# CHILL-005 — Home

Status: draft (Q1–Q5 open) · Design: `design/boards/Main.dc.html`, `docs/design/screens/home.md`
· Depends on: CHILL-002, CHILL-003, CHILL-004

## Assumptions (correct these now, or the work goes ahead on them)

- Each AC is named by its MirAIe room (space) name — "Bedroom", "Living room", "Study" — with the
  device name as a fallback. If two ACs share a room, the chip reads "<room> · <device name>".
- One AC is **featured** in the big card; tapping a room chip or a small card's name features it.
  The featured AC is remembered across launches (zustand `persist`). Default: the first AC that is on,
  else the first AC.
- The header shows today's date ("Thu, 16 October", device locale) and a greeting by local time:
  before 12:00 "Good morning", before 17:00 "Good afternoon", else "Good evening" (board shows the
  evening one; Q2 confirms the others).
- Featured card subtitle "Air conditioner · <state>" where state is Cooling / Drying / Standby /
  Offline (board) — other modes in Q1. Temperature is the target temp; "Inside 27°" is the room temp.
- The unit on the card shows the dead-front display (mode icon + temp) and air particles only while on.
- The mode chip opens Climate; the fan button opens Climate; the ↗ button opens Climate.
- The two tiles: "Airflow" → Airflow for the featured AC; "Schedules" → Schedules tab.
- Live updates come from MQTT pushes through the query cache (CHILL-002); a power tap is optimistic.

## Goal

Open the app and, in one glance and one tap, see and switch the AC you care about — and every other
AC in the home.

## Acceptance criteria

| ID    | Given                                        | When                                | Then                                                                                                                                                                           |
| ----- | -------------------------------------------- | ----------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| AC-1  | three ACs (demo data)                        | Home opens                          | the date, greeting, three room chips with the featured one selected, the featured card, two small cards, the Airflow and Schedules tiles and the tab bar show, as on the board |
| AC-2  | the featured AC is on, cool, 24°, inside 27° | rendered                            | "Air conditioner · Cooling", "24°", "Inside 27°", power pill "On", mode chip "Cool", display "24°" with the snowflake, particles moving                                        |
| AC-3  | the featured AC is on                        | the person turns the power pill off | the pill slides to "Off" at once, the subtitle reads "Standby", the display and particles fade out, and a power-off command is sent                                            |
| AC-4  | an AC is offline                             | rendered                            | its card is at 55 % opacity, says "Offline", and its power control is disabled                                                                                                 |
| AC-5  | the person taps the "Living room" chip       | —                                   | Living room becomes featured (chip selected, big card updates) and stays featured after a relaunch                                                                             |
| AC-6  | a small card's power button                  | tapped                              | that AC toggles (optimistic) without changing the featured AC                                                                                                                  |
| AC-7  | the mode chip, fan button or ↗               | tapped                              | Climate opens for the featured AC                                                                                                                                              |
| AC-8  | the Airflow tile                             | tapped                              | Airflow opens for the featured AC; the tile's subtitle summarises its swing (Q4)                                                                                               |
| AC-9  | a status push from MQTT                      | it arrives                          | the card updates without a reload                                                                                                                                              |
| AC-10 | the home is loading                          | Home opens                          | a skeleton made of the real chrome holds the layout, with no layout shift when data arrives (Q3)                                                                               |

## Out of scope

- Adding/renaming ACs or rooms (done in the MirAIe app), multiple homes, weather/outside temperature.

## Open questions

| #   | Who decides | Question                                                                                                                                                                                                                                   | Answer (with date) |
| --- | ----------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------ |
| Q1  | Owner       | State words for modes the board doesn't show. Proposed: heat "Heating", fan "Fan only", auto "Auto".                                                                                                                                       |                    |
| Q2  | Owner       | Greeting times and words: "Good morning" < 12:00, "Good afternoon" < 17:00, "Good evening" otherwise?                                                                                                                                      |                    |
| Q3  | Owner       | Loading, error and empty states aren't on the board. Proposed: loading = real chrome with blank values; error = card text "Can't reach MirAIe" + "Try again"; no ACs = "No air conditioners in this home yet. Add them in the MirAIe app." |                    |
| Q4  | Owner       | Airflow tile subtitle (board: "Swing · Centre"). Proposed: both auto → "Swinging"; else "<up-down> · <left-right>", e.g. "Position 3 · Centre".                                                                                            |                    |
| Q5  | Owner       | With 1 AC the grid is empty; with 4+ it grows. Proposed: hide the room chips and grid with 1 AC; with 4+ the chips scroll sideways and the grid keeps 2 columns and the page scrolls.                                                      |                    |
