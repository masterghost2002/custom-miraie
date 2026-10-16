# CHILL-001 — Tasks

- [x] Task 1: Gate helpers — walk `src/`, read files, git staged/changed lists, report format, exit codes
      Check: `node --test scripts/lib/gate.test.mjs`
      Files: scripts/lib/gate.mjs, scripts/lib/gate.test.mjs
- [x] Task 2: check:style-policy (hex/rgb/hsl outside src/theme; arbitrary `[..px]` classes)
      Check: AC-1 fixtures pass/fail as expected
      Files: scripts/check-style-policy.mjs (+ .test.mjs), scripts/**fixtures**/style-policy/**
- [x] Task 3: check:design-source (first-line `// Design:` note in src/features/** and src/ui/**)
      Check: AC-3 fixtures
      Files: scripts/check-design-source.mjs (+ .test.mjs)
- [x] Task 4: check:feature (every non-test file in src/ui and src/features/**/{screen,components/*} has a test)
      Check: AC-2 fixtures
      Files: scripts/check-feature.mjs (+ .test.mjs)
- [x] Task 5: check:testid and check:ui-mock-policy
      Check: AC-4, AC-5 fixtures
      Files: scripts/check-testid.mjs, scripts/check-ui-mock-policy.mjs (+ tests)
- [x] Task 6: check:env-policy and check:secrets
      Check: AC-6, AC-7 fixtures
      Files: scripts/check-env-policy.mjs, scripts/check-secrets.mjs (+ tests)
- [x] Task 7: check:handbook-size, check:agent-rules, check:commit-msg
      Check: AC-8, AC-9 fixtures
      Files: scripts/check-handbook-size.mjs, scripts/check-agent-rules.mjs, scripts/check-commit-msg.mjs (+ tests)
- [x] Task 8: run-push-gates runner (parallel, per-gate timing, summary)
      Check: AC-11 — `pnpm gates` < 30 s on a clean tree
      Files: scripts/run-push-gates.mjs, package.json
- [x] Task 9: review stamp writer + check:review
      Check: AC-10 — stamp written, extra commit makes the check fail
      Files: scripts/review-stamp.mjs, scripts/check-review.mjs (+ tests)
- [x] Task 10: husky pre-commit, commit-msg, pre-push
      Check: AC-7, AC-9, AC-11 by hand on a scratch branch
      Files: .husky/*
- [ ] Task 11: Claude Code hooks (PreToolUse block list + design note on new files, PostToolUse prettier, Stop → /review once)
      Check: AC-13…AC-15 — `node --test scripts/hooks/*.test.mjs`
      Files: scripts/hooks/*, .claude/settings.json — the OWNER applies the settings change (an agent
      may not edit its own permissions). Proposed allow-list: `pnpm typecheck`, `pnpm lint`,
      `pnpm test*`, `pnpm format:check`, `pnpm gates*`, `pnpm check:*`, `git status|diff|log|show|merge-base`;
      deny: Read `.env`/`.env.local`, Edit `ios/**`/`android/**`.
- [ ] Task 12: CI workflow, single required "CI passed" job
      Check: AC-12 on the first PR
      Files: .github/workflows/ci.yml
- [ ] Task 13: Remove "(planned)" from CLAUDE.md, AGENTS.md, docs/engineering-rules.md; check:agent-rules passes
      Check: `pnpm gates`
      Files: CLAUDE.md, AGENTS.md, docs/engineering-rules.md
- [ ] Task 14: STOP and run /review
