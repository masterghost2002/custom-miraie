# CHILL-007 — Airflow (swing up-down and left-right)

Status: draft (Q1, Q2 open; owner check CHILL-002 O3) · Design: `design/boards/Airflow.dc.html`,
`docs/design/screens/airflow.md` · Depends on: CHILL-002, CHILL-003, CHILL-005 (routes)

## Assumptions (correct these now, or the work goes ahead on them)

- Route `device/[id]/airflow`; header: back ("Back to Home"), title "Airflow", room subtitle, and a chip
  with the current mode icon + name that opens Climate.
- "Up and down": Auto + positions 1–5 → `acvs` 0–5; position 1 = highest, 5 = lowest (board).
  Subtitle "Swinging" for Auto, else "Position N".
- "Left and right": Auto + 1–5 → `achs` 0–5; 1 = far left … 5 = far right; subtitle "Swinging",
  "Far left", "Left", "Centre", "Right", "Far right" (board).
- Illustrations: the side view's beam rotates to 6/14/22/30/40° and the top view's wedge to
  50/25/0/−25/−50°, easing 0.8 s; Auto sweeps (3.4 s / 3.8 s, alternate). The dots mark the five
  positions, the chosen one ringed in accent, all blinking under Auto. Reduced motion stops the sweep.
- One tap sends the swing command (optimistic); the status push confirms.

## Goal

Point the air where you want it — or let it swing — and see the direction before the AC moves.

## Acceptance criteria

| ID   | Given                       | When                 | Then                                                                                       |
| ---- | --------------------------- | -------------------- | ------------------------------------------------------------------------------------------ |
| AC-1 | up-down 3, left-right Auto  | Airflow opens        | "Position 3" and "Swinging", beam at 22°, wedge sweeping, Auto selected in the second pill |
| AC-2 | up-down 3                   | the person taps 5    | vertical swing 5 is sent; indicator slides; beam eases to 40°; "Position 5"; dot 5 ringed  |
| AC-3 | left-right 2                | the person taps Auto | horizontal swing 0 is sent; the wedge starts sweeping; "Swinging"; dots blink              |
| AC-4 | the header chip             | tapped               | Climate opens; the chip shows the current mode                                             |
| AC-5 | VoiceOver                   | on the options       | each reads its label ("Position 1, highest", "Swing left and right") and selected state    |
| AC-6 | a status push changes swing | it arrives           | pills and illustrations follow                                                             |

## Out of scope

- Custom swing ranges, "3D airflow" modes the MirAIe app may have.

## Open questions

| #   | Who decides | Question                                                                                                                                                                                                             | Answer (with date) |
| --- | ----------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------ |
| Q1  | Owner       | The board has no power-off or offline state. Proposed: with power off, illustrations still show the chosen direction but no air particles, and options stay enabled; offline → options disabled, subtitle "Offline". |                    |
| Q2  | Owner       | Do your ACs support horizontal swing? If not, hide the "Left and right" card for those models (needs a model list — the API has no capability flag).                                                                 |                    |
