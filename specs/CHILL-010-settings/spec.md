# CHILL-010 — Settings

Status: **blocked** (Q1: there is no Settings board) · Design: none yet — the tab icon exists on every
board's tab bar · Depends on: CHILL-003, CHILL-004

## Assumptions (correct these now, or the work goes ahead on them)

- Proposed content, top to bottom, in glass cards built from existing primitives:
  1. **Account** — the signed-in ID, masked (`98•••••210` / `ra•••@gmail.com`), and "Sign out".
  2. **Appearance** — Dark (default) / Light, a `SegmentedPill`; remembered (zustand `persist`).
  3. **AC display light** — one `Toggle` per AC (`acdc` on/off), unless it moves to Climate's
     "More options" (CHILL-006 Q1).
  4. **About** — app version, "Unofficial app · not affiliated with Panasonic", link to the source repo.
- Sign out deletes everything in secure storage, clears the query cache and the preferences store, and
  returns to Sign in (CHILL-004 AC-8).

## Goal

The few things you set once: who you are signed in as, how the app looks, and a way out.

## Acceptance criteria

| ID   | Given                   | When                      | Then                                                                              |
| ---- | ----------------------- | ------------------------- | --------------------------------------------------------------------------------- |
| AC-1 | signed in as 9876543210 | Settings opens            | "98•••••210" and "Sign out" show; the full ID is never on screen                  |
| AC-2 | Dark                    | the person picks Light    | the whole app switches to the light tokens at once and stays light after relaunch |
| AC-3 | "Sign out"              | tapped and confirmed (Q2) | credentials, cache and preferences are cleared; Sign in shows                     |
| AC-4 | a display-light toggle  | turned off                | the display command is sent for that AC                                           |

## Out of scope

- Notifications, units (°F), language.

## Open questions

| #   | Who decides | Question                                                                                                                                         | Answer (with date) |
| --- | ----------- | ------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------ |
| Q1  | Owner       | Settings has no board. Add one on the canvas, or approve the proposed list above built from existing primitives (with a `// Design: none` note)? |                    |
| Q2  | Owner       | Confirm before signing out? Proposed: an iOS action sheet "Sign out of MirAIe on this iPhone?" with "Sign out" (destructive) / "Cancel".         |                    |
| Q3  | Owner       | Display light here, in Climate's "More options", or both?                                                                                        |                    |
