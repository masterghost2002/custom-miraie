# CHILL-008 — All devices

Status: draft (Q1 open) · Design: `design/boards/Rooms.dc.html`, `docs/design/screens/all-devices.md`
· Depends on: CHILL-002, CHILL-003, CHILL-005 (tabs)

## Assumptions (correct these now, or the work goes ahead on them)

- Tab "All devices". Header: "<n> air conditioners · <m> on" over the title "All devices".
- One row per AC: unit icon (vent slot + LED, drips while on), room name, subtitle
  "<Cooling|Drying|…> to 24°" when on, "Standby · Inside 27°" when off, "Offline" when offline;
  a round power button (accent when on, disabled when offline). Offline rows at 55 % opacity.
- Tapping the row's text opens Home with that AC featured (the board links rows to Home).
- "Turn everything off" sends power-off to every online AC that is on, with no confirmation (board);
  disabled when none are on.
- Mode words for heat/fan/auto follow CHILL-005 Q1.

## Goal

See every AC in the home at once and switch any — or all — of them off.

## Acceptance criteria

| ID   | Given                                                        | When                            | Then                                                                                                     |
| ---- | ------------------------------------------------------------ | ------------------------------- | -------------------------------------------------------------------------------------------------------- |
| AC-1 | Bedroom on (cool 24), Living room on (dry 25), Study offline | the tab opens                   | "3 air conditioners · 2 on", three rows with the board's subtitles, Study dimmed and its button disabled |
| AC-2 | Living room on                                               | its power button is tapped      | it turns off at once (optimistic), subtitle "Standby · Inside 29°", header "· 1 on"                      |
| AC-3 | two ACs on                                                   | "Turn everything off" is tapped | power-off is sent to both; both rows show Standby; the button becomes disabled                           |
| AC-4 | no AC on                                                     | rendered                        | "Turn everything off" is disabled and reads as disabled                                                  |
| AC-5 | a row                                                        | its name is tapped              | Home opens with that AC featured                                                                         |
| AC-6 | one command fails                                            | during "Turn everything off"    | the others still turn off; the failed row returns to its real state (status refetch)                     |

## Out of scope

- Grouping by floor, renaming, reordering, adding devices.

## Open questions

| #   | Who decides | Question                                                                                                            | Answer (with date) |
| --- | ----------- | ------------------------------------------------------------------------------------------------------------------- | ------------------ |
| Q1  | Owner       | Should a row tap open Climate for that AC instead of Home (board: Home)? Climate is one tap closer to the controls. |                    |
