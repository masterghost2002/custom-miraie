# Sign in

Board: `design/boards/SignIn.dc.html` · Route: `src/app/sign-in.tsx` · Spec: CHILL-004

Full-screen, no tab bar. Shown when there is no saved session.

## Layout (top to bottom)

Root: `--bg`, breeze background (language §6) behind everything, plus the falling particle layer
(below). Content column inside the safe area: padding 44 top, 24 left/right, 24 bottom, flex column.

1. **Hero** — 40 / 400, letter spacing −0.04em (−1.6), line height 1.12, `--ink`:
   - Line 1: "Your AC,"
   - Line 2: an inline accent badge, then "made " then "simple." in `--muted`.
   - Badge: 40 × 40 circle, `--accent` fill, white snowflake icon 20 (stroke 2.2), right margin 8,
     baseline-aligned 6 below the text baseline (`vertical-align: −6px`). Decorative (hidden from
     accessibility). Accessible text of the heading: "Your AC, made simple."
2. **Intro** — margin-top 14, 15 / 400, line height 1.5 (22.5), `--muted`:
   "Sign in with your Panasonic MirAIe account to control every air conditioner at home."
3. **Unit stage** — `flex: 1`, centres the 250 × 76 AC unit (language §7) horizontally and
   vertically. The unit's display is on: snowflake 11 + "24°" 15/500, `#E8701F`, glow. Decorative.
4. **Form card** — `.glass`, radius 30, padding 16, gap 12, flex column:
   - Field 1: label "Mobile number or email" (13/500 `--muted`, padding-left 6), gap 6, text field
     (52 tall, radius 26, `--pill`, 1px `--field-line`, padding 0 20, 16 px `--ink`), placeholder
     "Registered with MirAIe" (`--muted`), `textContentType="username"` / `autoComplete="username"`,
     `autoCapitalize="none"`, `autoCorrect={false}`.
   - Field 2: label "Password", same field style, `secureTextEntry`,
     `textContentType="password"` / `autoComplete="current-password"`, no placeholder.
   - Primary button "Sign in": margin-top 4 (so 16 from the field), 56 tall, radius 28, `--sel-bg`,
     16/600 `--sel-ink`, full width. On the board it links to Home.
   - Note row: padding 0 6, gap 8, align top: lock icon 14 (stroke 2, margin-top 1, `--muted`,
     decorative) + text 12 / 400, line height 1.45, `--muted`:
     "Your password stays in this phone's secure storage and is sent only to MirAIe."
5. **Footer** — margin-top 16, centred, 11 / 400 `--muted`:
   "Unofficial app · not affiliated with Panasonic"

### Particle layer

Absolute, from y 392 (on the 844 board: roughly the unit's vertical position) to the bottom, full
width, behind the form (so the glass has something to blur). Six 5 × 5 `--particle` dots, two per
cubic curve, 3.2 s linear loop (opacity 0 → 1 by 10%, → 0 after 75%):

| Curve (board coords, origin at y 392) | Delays         |
| ------------------------------------- | -------------- |
| `M130 0 C130 110 108 270 86 452`      | −0.4 s, −2.0 s |
| `M195 0 C195 110 195 270 195 452`     | −1.1 s, −2.7 s |
| `M260 0 C260 110 282 270 304 452`     | −0.7 s, −2.3 s |

Scale x positions with screen width (195 = centre).

## States the board supports

Only the static form (the board's script holds only the theme). Dark default, light optional.

## Interactions

- Return key on field 1 moves to field 2; on field 2 submits.
- "Sign in" submits both fields. Keyboard must not cover the form (keyboard-avoiding layout); the
  hero may scroll off.

## Motion

Breeze background; falling particles; button press scale .97.

## Accessibility

- Labels are real labels for the inputs (`accessibilityLabel` = label text).
- "Sign in" is `accessibilityRole="button"`.
- Hero badge, unit and particles are hidden from VoiceOver.
- All targets ≥ 44 pt (fields 52, button 56).

## States the design does not show — OPEN

These need a decision from the user; nothing below is final copy.

| State                            | Proposed (not approved)                                                  |
| -------------------------------- | ------------------------------------------------------------------------ |
| Submitting (request in flight)   | Button shows a spinner / "Signing in…", fields disabled                  |
| Empty field on submit            | Inline message under the field, e.g. "Enter your mobile number or email" |
| Wrong credentials (HTTP 401)     | Message in the form, e.g. "That mobile number or password didn't work."  |
| Mobile not registered (HTTP 412) | e.g. "This number isn't registered with MirAIe."                         |
| Network / server error           | e.g. "Couldn't reach MirAIe. Check your connection and try again."       |
| Show/hide password control       | Not in the design; propose an eye icon inside the field                  |
| Session expired, re-sign-in      | Same screen with the login prefilled?                                    |
| Where errors render              | Inside the glass card above the button vs. a toast                       |
