---
description: Fix a bug the honest way — a failing test that reproduces it, then the fix.
argument-hint: <bug description> [CHILL-NNN]
---

Fix this bug: $ARGUMENTS

1. Find the ticket. If no `CHILL-NNN` was given, look for the spec the broken behaviour belongs to.
   If there is none, stop and ask (no commit without a ticket).
2. Load the `honest-tests` skill. Reproduce the bug in a test BEFORE touching the code:
   - use the real components and the real `src/lib/miraie` code; fake only the network
     (a test backend through `<BackendProvider>`, or `createDemoBackend()` with the bad state)
   - query by role, label or visible text; no testID
   - name it after the behaviour: `it('given …, when …, then …')`, and reuse an AC ID if the bug
     breaks one
3. Run it and confirm it fails because of the bug (paste the failure line in your reply).
4. Fix the code, not the test. Run the test until it passes, then
   `pnpm test -- <related paths>`, `pnpm typecheck`, `pnpm lint` (and `pnpm gates` once it exists).
5. Commit: `fix(scope): subject (CHILL-NNN)`.
6. Reply with the root cause in one sentence, the failing → passing test name and the commit hash.
