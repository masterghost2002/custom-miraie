---
description: Final go/no-go — code, security and test reviewers in parallel, with a rollback plan.
argument-hint: [CHILL-NNN]
---

Decide whether the current branch can ship ($ARGUMENTS).

1. Preconditions — stop with NO-GO if any fails:
   - every task in the ticket's `tasks.md` is ticked and every open question is answered
   - `pnpm typecheck`, `pnpm lint`, `pnpm test -- --coverage` pass (coverage at or above the
     thresholds in `jest.config.js`)
   - `pnpm gates` passes, including `check:review` (planned in CHILL-001; until it exists, say so)
2. In ONE message, start three agents in parallel on `git diff $(git merge-base origin/main HEAD)`:
   - `code-reviewer` — correctness, clarity, structure, performance, design fidelity
   - `security-auditor` — credentials, TLS, what leaves the phone, secrets in the bundle
   - `test-engineer` — honest tests, AC coverage, coverage numbers

   Helper agents never call other helper agents; you merge their results.

3. Verdict:
   - **NO-GO** if any agent reports a critical or important finding. List them.
   - **GO** otherwise, with the suggestions listed for later.
4. Always include a rollback plan for this change:
   - JS-only change: revert commit(s) `<hashes>`, rebuild/redistribute; if shipped with
     `eas update`, republish the previous update.
   - Native change (new module, app.json/config plugin, permissions): reinstall the previous
     dev/EAS build; name which build that is.
   - Anything that changed stored data (SecureStore keys, persisted zustand shape): how the old
     build reads the new data, or how to clear it.
5. Reply: GO or NO-GO, the merged findings, and the rollback plan.
