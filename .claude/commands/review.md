---
description: Review the branch with the code-reviewer agent; on a pass, write the review stamp.
argument-hint: [CHILL-NNN]
---

Review the current branch ($ARGUMENTS).

1. Collect the change:
   - `git fetch origin main` (if it fails, say so — never review against a stale base silently)
   - `BASE=$(git merge-base origin/main HEAD)`; the change = `git diff $BASE` (committed AND
     uncommitted work)
   - the ticket's `specs/CHILL-NNN-*/spec.md` and `tasks.md`
2. Delegate to the `code-reviewer` agent (Task tool, subagent `code-reviewer`). Give it the base
   commit, the ticket path and the list of changed files. It reviews:
   1. correctness — every AC in the spec is met and tested
   2. clarity
   3. fits the project structure (`docs/feature-layout.md`, `CLAUDE.md` rules)
   4. security (credentials, TLS, logging, what leaves the phone)
   5. performance (re-renders, MQTT churn, animations on the JS thread)
   6. design fidelity against the board in `design/boards/`
   7. test honesty (`honest-tests` skill)
3. Verdict: FAIL if there is any critical or important finding. Fix them (one commit per fix,
   with the ticket ID), then run `/review` again. Suggestions don't block.
4. On PASS write the stamp:
   `pnpm review:stamp --verdict pass --critical 0 --important 0 --suggestion <n>`, then confirm with
   `pnpm check:review`. If the stamp can't be written (e.g. no `origin/main`), say so plainly.
   The stamp (`.review/stamp.json`, gitignored) records model `claude-opus-5-5`, effort
   `xhigh` and a `reviewId` fingerprint of the exact diff; any later commit makes it stale.
5. Reply with the findings (critical → suggestion, each with file:line) and the verdict.
