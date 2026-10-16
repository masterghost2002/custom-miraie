# CHILL-011 — iOS development build on the owner's iPhone

Status: **blocked** (Q1) · Design: none (build tooling; Q2 for icon/splash) · Depends on: CHILL-002
(the native socket is the reason this is needed)

## Assumptions (correct these now, or the work goes ahead on them)

- Expo Go is enough for every screen against the demo backend, but live control needs
  `react-native-tcp-socket` (raw TLS to `mqtt.miraie.in:8883`; no WebSocket endpoint exists), which
  Expo Go cannot load. So the app needs its own development build with `expo-dev-client`.
- Bundle identifier `com.masterghost2002.chill` (in `app.json`); iOS only; iPhone only.
- This Mac has no Xcode today (only Command Line Tools) and no Android SDK (not needed — iOS only).

## Goal

The owner opens Chill on their iPhone like any app, signs in with MirAIe, and controls the real ACs;
code changes still reload live from `pnpm start`.

## Acceptance criteria

| ID   | Given                          | When                            | Then                                                                         |
| ---- | ------------------------------ | ------------------------------- | ---------------------------------------------------------------------------- |
| AC-1 | the chosen build route (Q1)    | the build runs                  | a development build of Chill is installed on the iPhone                      |
| AC-2 | the dev build and `pnpm start` | the app opens                   | it connects to Metro and reloads on save                                     |
| AC-3 | real credentials               | the owner signs in on the phone | the ACs list; toggling power moves the real AC within 2 s (CHILL-002 O2)     |
| AC-4 | the dev build                  | the app runs on web or Expo Go  | the native socket is never imported there; those keep using the demo backend |
| AC-5 | a fresh clone                  | someone follows the README      | the build steps work as written                                              |

## Out of scope

- TestFlight/App Store release builds, OTA updates (`eas update`) — a later ticket.

## Open questions

| #   | Who decides | Question                                                                                                                                                                                                                                                                                                                               | Answer (with date) |
| --- | ----------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------ |
| Q1  | Owner       | Build route. **A:** install Xcode on this Mac and run `pnpm expo run:ios --device` — free Apple ID, but the app must be re-signed every 7 days. **B:** EAS Build `development` profile in the cloud — no Xcode needed, but installing on a device needs the paid Apple Developer Program ($99/year) and registering the iPhone's UDID. |                    |
| Q2  | Owner       | App icon and splash: the canvas has none (the template's Expo icon is still in `assets/`). Design one on the canvas, or use the AC unit illustration on the dark ground?                                                                                                                                                               |                    |
