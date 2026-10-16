# CHILL-006 — Climate (one AC: temperature, mode, fan, power, energy)

Status: draft (Q1–Q5 open) · Design: `design/boards/Climate.dc.html`, `docs/design/screens/climate.md`
· Depends on: CHILL-002, CHILL-003, CHILL-005 (routes)

## Assumptions (correct these now, or the work goes ahead on them)

- Route `device/[id]/climate`; header: back button ("Back to <room>"), title "Air conditioner",
  subtitle the room, "More options" button (Q1).
- Temperature 16–30 °C in steps of 1 (board), via the vertical tick slider (drag) or the −/+ buttons.
  While dragging, the big number follows the finger; the command is sent once the finger lifts, and
  −/+ taps are batched for 400 ms, so the AC isn't flooded.
- Label above the number: "Cooling to" / "Heating to" / "Drying at" / "Fan only" / "Auto at" while on,
  "Set to" while off (board).
- Fan-only mode locks the temperature: number shows "—", slider and −/+ are disabled, the display
  shows "FAN" (board).
- Modes cool, dry, fan, heat, auto in the right column; one tap sends the mode (board).
- Fan speed: Auto, Quiet, Low, Med ("Medium" for VoiceOver), High; subtitle shows the full name.
  The fan icon spins at the board's speed for that fan.
- Power card: "Power" + "Running · <Mode>" / "Standby" with the power pill.
- Energy card: Eco "Holds 26°" and Powerchill "Fast cooling" toggles. Turning Eco on sets 26° and turns
  Powerchill off; turning Powerchill on turns Eco off; turning either off returns to no preset — the
  same rules as the reference library (CHILL-002 AC-5).
- The unit at the top mirrors every setting on its dead-front display (mode icon, preset icon,
  temp or FAN, fan bars) and fades in on change; air particles fall behind the cards at fan speed;
  with power off the display is blank and particles stop.
- "Inside 27°" is the room temperature from the status (`rmtmp`).

## Goal

Everything you set on the AC's remote, on one calm screen, with the AC illustration showing what the
real unit will do.

## Acceptance criteria

| ID    | Given                                         | When                                           | Then                                                                                                                                                |
| ----- | --------------------------------------------- | ---------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------- |
| AC-1  | Bedroom on, cool, 24°, fan auto               | Climate opens                                  | the board's layout shows: "Cooling to", "24°", "Inside 27°", Cool selected, fan "Auto" selected, "Running · Cool", display "24°" with the snowflake |
| AC-2  | 24°                                           | the person taps + twice quickly                | the number shows 26° at once and one temperature command (26) is sent after 400 ms                                                                  |
| AC-3  | 24°                                           | the person drags the slider to 21° and lets go | the fill and marker follow the drag; one command (21) is sent on release                                                                            |
| AC-4  | any temp                                      | − at 16° or + at 30°                           | nothing happens and the button reads as disabled at the limit                                                                                       |
| AC-5  | mode cool                                     | the person taps Fan only                       | mode command sent; number "—", slider and −/+ disabled, display "FAN"                                                                               |
| AC-6  | fan auto                                      | the person taps High                           | fan command sent; indicator slides to High; subtitle "High"; icon spins faster; display shows 4 bars                                                |
| AC-7  | Eco off                                       | Eco is turned on                               | eco preset sent (acem on, acpm off, 26°); number shows 26°; Powerchill turns off; display shows the leaf                                            |
| AC-8  | Powerchill off and Eco on                     | Powerchill is turned on                        | boost preset sent; Eco turns off; display shows the lightning bolt                                                                                  |
| AC-9  | power on                                      | the power pill is turned off                   | power-off sent; label "Set to"; "Standby"; display blank; particles stop                                                                            |
| AC-10 | a status push changes the mode on the real AC | it arrives                                     | the screen and the display update without a reload                                                                                                  |
| AC-11 | VoiceOver                                     | on the slider                                  | it is adjustable ("Temperature, 24 degrees"), swipes up/down change by 1; modes read as selected buttons; toggles as switches                       |

## Out of scope

- Timers and schedules (CHILL-009). Display light and other "More options" items until Q1 is answered.

## Open questions

| #   | Who decides | Question                                                                                                                                                                                                        | Answer (with date) |
| --- | ----------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------ |
| Q1  | Owner       | The "More options" (…) button has no design. Proposed: a sheet with "Display light" on/off (`acdc`) and the AC's model and firmware. Or drop the button?                                                        |                    |
| Q2  | Owner       | Offline AC on this screen isn't designed. Proposed: all controls disabled, subtitle "Offline", the unit greyed (LED off).                                                                                       |                    |
| Q3  | Owner       | Should Heat be hidden? Many MirAIe ACs in India are cooling-only and we can't read the model's capabilities from the API. Proposed: show it; if the AC ignores it, the status push snaps back to the real mode. |                    |
| Q4  | Owner       | Half degrees: the reference sends floats, the board steps by 1. Keep whole degrees?                                                                                                                             |                    |
| Q5  | Owner       | The board uses the full 844 pt height, so it can't fit an iPhone SE / mini without change. Proposed: below 780 pt the slider shrinks from 280 to 220 pt and the unit to the md size; nothing scrolls.           |                    |
