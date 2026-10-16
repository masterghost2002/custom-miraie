# CHILL-001 — Agent harness: gates, hooks, review stamp, CI

Status: ready (all questions answered 2026-10-16) · Design: none (tooling) · Depends on: —

## Assumptions (correct these now, or the work goes ahead on them)

- This is a one-person project with no tracker: a ticket is a `specs/CHILL-NNN-*` folder.
- Gates are plain Node ESM scripts with no dependencies (`scripts/check-<rule>.mjs`), each with a
  `node:test` file, so they run in about a second each and need no build step.
- Pre-push runs every gate in parallel; target under 30 s on this Mac. Pre-commit only formats staged
  files (lint-staged) and runs `check:secrets` and `check:commit-msg`.
- CI is GitHub Actions on `ubuntu-latest` (gates, typecheck, lint, tests with coverage). iOS builds are
  not part of CI (see CHILL-011).
- New rules start as warnings only when existing code breaks them; today the codebase is small, so
  every gate starts as an error.

## Goal

Turn every rule in `CLAUDE.md` into a program that says no — at the moment the agent writes a file
(hooks), before code is uploaded (pre-push) and on every pull request (CI) — so a person only ever
sees work that already passed.

## Acceptance criteria

| ID    | Given                                                                                           | When                                              | Then                                                                                                                          |
| ----- | ----------------------------------------------------------------------------------------------- | ------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------- |
| AC-1  | `src/features/x/screen.tsx` contains `#E8701F` or `className="w-[52px]"`                        | `pnpm gates` runs                                 | `check:style-policy` fails with `file:line`, what is wrong and "use a token from src/theme/tokens.ts / a named Tailwind step" |
| AC-2  | a new `src/ui/foo.tsx` has no `src/ui/__tests__/foo.test.tsx`                                   | `pnpm gates`                                      | `check:feature` fails naming the missing test path                                                                            |
| AC-3  | a non-test file in `src/features/**` or `src/ui/**` whose first line is not a `// Design:` note | `pnpm gates`, or the agent Writes such a new file | `check:design-source` fails; the PreToolUse hook blocks the Write with the same message                                       |
| AC-4  | a test calls `getByTestId` or passes `testID`                                                   | `pnpm gates`                                      | `check:testid` fails                                                                                                          |
| AC-5  | a test calls `jest.mock('@/…')`, `jest.mock('./…')` or `jest.mock('../…')`                      | `pnpm gates`                                      | `check:ui-mock-policy` fails and points to `createDemoBackend()`                                                              |
| AC-6  | `src/` reads `process.env.EXPO_PUBLIC_FOO` and `.env.example` lacks `EXPO_PUBLIC_FOO`           | `pnpm gates`                                      | `check:env-policy` fails                                                                                                      |
| AC-7  | `.env.local` is staged                                                                          | `git commit`                                      | `check:secrets` blocks the commit                                                                                             |
| AC-8  | `CLAUDE.md` exceeds 10 KB, or the check list in `AGENTS.md` differs from `CLAUDE.md`            | `pnpm gates`                                      | `check:handbook-size` / `check:agent-rules` fails                                                                             |
| AC-9  | a commit message without `(CHILL-NNN)`, or with an ID that has no `specs/CHILL-NNN-*` folder    | `git commit`                                      | `check:commit-msg` rejects it and shows the expected format                                                                   |
| AC-10 | `/review` passed, then one more line of code changed                                            | `git push`                                        | `check:review` blocks: "Code changed after review. Run /review."                                                              |
| AC-11 | a clean branch                                                                                  | `git push`                                        | all gates run in parallel and pass in under 30 s; output shows each gate's time                                               |
| AC-12 | any pull request to `main`                                                                      | CI runs                                           | one job, "CI passed", runs gates + typecheck + lint + tests with coverage and is required to merge                            |
| AC-13 | the agent has unreviewed changes in `src/`                                                      | it tries to stop                                  | the Stop hook asks once for `/review` (it respects `stop_hook_active`, so it never loops)                                     |
| AC-14 | the agent tries to Write/Edit `.env*`, `ios/**`, `android/**` or `.review/stamp.json`           | PreToolUse hook                                   | the edit is blocked with the reason and the right alternative                                                                 |
| AC-15 | the agent edits a file                                                                          | PostToolUse hook                                  | Prettier formats that file; a hook that crashes lets the work continue (the gate is the safety net)                           |
| AC-16 | any gate                                                                                        | its setup is broken (no git, unreadable file)     | it fails, never passes quietly; `pnpm gates:test` runs every gate's own tests first                                           |

## Out of scope

- Storybook, Chromatic and visual snapshots (see Q1), end-to-end tests on a device (later ticket).
- Running `/review` on CI servers (see Q2).

## Open questions

| #   | Who decides | Question                                                                                                                                                                      | Answer (with date)                                          |
| --- | ----------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------- |
| Q1  | Owner       | Storybook for React Native now, or later? Recommended: later — one developer, and `src/app/_gallery.tsx` (CHILL-003) on the web preview shows every primitive in every state. | Later; `src/app/_gallery.tsx` covers it (owner, 2026-10-16) |
| Q2  | Owner       | Enforce the review on CI too (needs an Anthropic API key as a repo secret)? Recommended: no; the local stamp is enough for a personal project.                                | No; the local stamp is enough (owner, 2026-10-16)           |
