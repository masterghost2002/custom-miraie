# CHILL-004 — Sign in

Status: draft (Q1–Q3 open) · Design: `design/boards/SignIn.dc.html`, `docs/design/screens/sign-in.md`
· Depends on: CHILL-002, CHILL-003

## Assumptions (correct these now, or the work goes ahead on them)

- One field takes a mobile number, an email or a username; the kind is detected from its shape
  (CHILL-002). It is sent exactly as typed — no country-code rewriting.
- The form uses react-hook-form + zod; both fields are required; the password is never trimmed.
- After a successful sign-in, the login ID, password and tokens go to `expo-secure-store`
  (CHILL-002 Q1), and the app opens Home. On the next launch a stored session skips this screen.
- The keyboard: login field `autoComplete="username"`, `textContentType="username"`, no
  auto-capitalise; password `secureTextEntry`, `textContentType="password"`; return key on the
  password submits. The layout scrolls above the keyboard.
- Copy comes from the board: "Your AC, made simple.", "Sign in with your Panasonic MirAIe account to
  control every air conditioner at home.", labels "Mobile number or email" and "Password",
  placeholder "Registered with MirAIe", button "Sign in", note "Your password stays in this phone's
  secure storage and is sent only to MirAIe.", footer "Unofficial app · not affiliated with Panasonic".
- The unit illustration (`AcUnit` md, display showing cool 24°) and the falling particles are decoration
  (`accessibilityElementsHidden`).

## Goal

The owner signs in once with their MirAIe account and lands on their ACs; the app keeps them signed in.

## Acceptance criteria

| ID   | Given                              | When                      | Then                                                                                                            |
| ---- | ---------------------------------- | ------------------------- | --------------------------------------------------------------------------------------------------------------- |
| AC-1 | the Sign in screen                 | it opens                  | the board's heading, intro, two labelled fields, "Sign in" button, secure-storage note and footer are visible   |
| AC-2 | an empty field                     | the person taps "Sign in" | no request is sent; the empty field shows an inline error (Q1)                                                  |
| AC-3 | a valid ID and password            | "Sign in" is tapped       | the button shows the busy state (Q2), the request is sent once, and on success Home opens with the person's ACs |
| AC-4 | a wrong password (401)             | sign-in fails             | the form stays filled (password cleared) and shows the wrong-password message (Q1)                              |
| AC-5 | an ID MirAIe doesn't know (412)    | sign-in fails             | the not-registered message shows (Q1)                                                                           |
| AC-6 | no network / server error          | sign-in fails             | the network message shows and the person can retry (Q1)                                                         |
| AC-7 | a stored session                   | the app launches          | Home opens without showing Sign in                                                                              |
| AC-8 | the person signs out from Settings | —                         | credentials are deleted from secure storage and Sign in shows with empty fields                                 |
| AC-9 | VoiceOver                          | moving through the screen | fields read their labels, the button its state, decoration is skipped                                           |

## Out of scope

- Creating a MirAIe account, password reset, OTP sign-in (the reference library uses password only).

## Open questions

| #   | Who decides | Question                                                                                                                                                                                                                                                                                                                                                                    | Answer (with date) |
| --- | ----------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------ |
| Q1  | Owner       | Error wording — the board shows none. Proposed: empty "Enter your mobile number or email." / "Enter your password."; 401 "That password doesn't match this account."; 412 "This number or email isn't registered with MirAIe."; network "Can't reach MirAIe. Check your connection and try again." Shown in muted-ink text under the form, accent only on the field border? |                    |
| Q2  | Owner       | Busy state — proposed: button label "Signing in…", button disabled, no spinner.                                                                                                                                                                                                                                                                                             |                    |
| Q3  | Owner       | The Home header's account button links to Sign in on the board. Once signed in, should it open Settings (proposed) or an account sheet?                                                                                                                                                                                                                                     |                    |
