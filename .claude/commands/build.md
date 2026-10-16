---
description: Do the next unchecked task of a spec — failing test first, then code, then one commit.
argument-hint: <CHILL-NNN>
---

Build the next task for ticket $ARGUMENTS.

1. Open `specs/$ARGUMENTS-*/tasks.md` and take the FIRST unchecked task that is not
   `BLOCKED by Qn` — unless that question now has an answer in spec.md, in which case remove the
   marker and build it. If only blocked tasks remain, list their questions and stop. If the task is
   "STOP and run /review", stop and tell the user to run `/review`.
   Make sure you're on `feat/$ARGUMENTS-<slug>` (branch off `main` if not).
2. Load the skills the task needs: `build-screen-from-design` and `ui-primitives` for any screen
   or `src/ui` component, `miraie-protocol` for `src/lib/miraie` or a device control,
   `honest-tests` for every test.
3. Test first. Write the test(s) for the task's AC IDs and run them; they must FAIL for the
   right reason. Name tests after the AC:
   `it('AC-2: given the Bedroom AC is offline, when Home loads, then its power button is disabled')`.
4. Implement the smallest change that makes them pass. Follow `CLAUDE.md`:
   - every colour/size from a token or a mapped class, never a raw value
   - new screen/component files start with the `// Design:` note
   - user-visible text lives in the feature's `copy.ts`
5. Run, and fix until clean:
   - `pnpm test -- <paths of the related tests>`
   - `pnpm typecheck`
   - `pnpm lint`
   - `pnpm gates` (all source and repo gates; `check:review` runs only before a push)
   - UI tasks: open the web preview at 390×844 (`pnpm start:demo`, press w) and compare it with
     the board
6. Tick the task in tasks.md (`- [x]`) and commit both the change and the tick:
   `type(scope): subject ($ARGUMENTS)` — e.g. `feat(climate): add fan speed pill ($ARGUMENTS)`.
   One commit per task. Never `--no-verify`.
7. Reply with: the task done, the commit hash, the test names that now pass, and the next task.
