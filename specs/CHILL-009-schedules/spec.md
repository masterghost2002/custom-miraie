# CHILL-009 — Schedules and sleep timer

Status: **blocked** (Q1 decides how schedules can work at all) · Design:
`design/boards/Schedules.dc.html`, `docs/design/screens/schedules.md` · Depends on: CHILL-002, CHILL-003

## Assumptions (correct these now, or the work goes ahead on them)

- Schedules belong to one AC; the screen shows the featured AC (header subtitle "Bedroom").
- Sleep timer: Off, 30m, 1h, 2h, 4h; subtitle "Not set" or "Turns off in 30 min / 1 hour / 2 hours /
  4 hours"; the moon turns accent while a timer is set (board).
- A schedule: name, action ("Cool 25° · Fan quiet", "Turn off"), time (24 h, "22:30"), days
  (M T W T F S S, read aloud as "Monday to Friday" / "Every day"), enabled toggle; disabled cards at
  60 % opacity (board).
- Home's "Schedules" tile shows "Next at <time>" of the next enabled schedule (CHILL-005).

## The problem

MirAIe's API, as far as we know it, has **no schedule or timer endpoint**: the reference MCP server
runs timers and schedules as in-memory tasks on the computer it runs on. A phone app can't do that
reliably — iOS suspends apps in the background and won't run code at an exact time. Q1 picks the way.

## Goal

Set the AC to turn on, change, or turn off on its own — at bedtime, in the morning, before you get
home — even when the phone is asleep.

## Acceptance criteria (written for option A of Q1; revised once Q1 is answered)

| ID   | Given                                    | When                     | Then                                                                                                                 |
| ---- | ---------------------------------------- | ------------------------ | -------------------------------------------------------------------------------------------------------------------- |
| AC-1 | Bedroom with the board's three schedules | the tab opens            | "Sleep timer" card and three schedule cards as on the board; Pre-cool dimmed (disabled)                              |
| AC-2 | timer Off                                | the person picks 1h      | the indicator slides to 1h, "Turns off in 1 hour", the moon turns accent, and the timer is saved on the MirAIe cloud |
| AC-3 | an enabled schedule                      | its toggle is turned off | the card dims and the schedule is disabled on the cloud                                                              |
| AC-4 | the phone is off                         | a schedule's time comes  | the AC still acts (the cloud runs it) — owner check                                                                  |
| AC-5 | the "+" button                           | tapped                   | the new-schedule editor opens (Q2)                                                                                   |

## Out of scope

- Geofencing ("pre-cool when I'm near home"), weather-based schedules.

## Open questions

| #   | Who decides | Question                                                                                                                                                                                                                                                                                                                                                                                                                                                                | Answer (with date) |
| --- | ----------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------ |
| Q1  | Owner       | How should schedules run? **A (recommended):** find the official MirAIe app's own schedule/timer API by recording its traffic once (e.g. Proxyman on the Mac with the iPhone as client) while you create a schedule, then call that API — schedules then run in the cloud like today. **B:** a small always-on helper at home (Raspberry Pi / NAS) that runs schedules over MQTT. **C:** phone-only reminders (a notification you tap to apply) — no automatic control. |                    |
| Q2  | Owner       | The new/edit schedule screen has no board. Add one on the canvas, or approve a sheet built from existing parts (name field, time wheel, day chips, action = mode + temp + fan)?                                                                                                                                                                                                                                                                                         |                    |
| Q3  | Owner       | Can a sleep timer and a schedule clash (timer turns off at 23:30, schedule turns on at 23:00)? Proposed: both run in time order; no warning.                                                                                                                                                                                                                                                                                                                            |                    |
