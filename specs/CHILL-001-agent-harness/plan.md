# CHILL-001 — Plan

## Order

1. Gate framework first (`scripts/lib/gate.mjs`: file walking, git helpers, the shared output format,
   exit codes) — every gate and hook reuses it, so they always agree.
2. The source gates (style-policy, design-source, feature, testid, ui-mock-policy, env-policy), each
   with its `node:test` file and fixtures in `scripts/__fixtures__/`.
3. Repo gates (secrets, handbook-size, agent-rules, commit-msg).
4. Runner `scripts/run-push-gates.mjs` (parallel, timings, non-zero on any failure).
5. Review stamp: `scripts/review-stamp.mjs` (write) + `check:review` (compare), `.review/` ignored.
6. Git hooks with husky: pre-commit (lint-staged, secrets), commit-msg, pre-push (`pnpm gates:test && pnpm gates`).
7. Claude Code hooks in `.claude/settings.json`, importing the gate functions.
8. CI workflow.
9. Put the `check:*`, `gates`, `gates:test`, `review:stamp` scripts back in `package.json`, and drop
   "(planned)" from CLAUDE.md, AGENTS.md and docs/engineering-rules.md.

## Files

- `scripts/lib/gate.mjs`, `scripts/check-<rule>.mjs`, `scripts/check-<rule>.test.mjs`, `scripts/__fixtures__/**`
- `scripts/run-push-gates.mjs`, `scripts/review-stamp.mjs`
- `scripts/hooks/pre-tool-use.mjs`, `scripts/hooks/post-tool-use.mjs`, `scripts/hooks/stop.mjs`
- `.husky/pre-commit`, `.husky/commit-msg`, `.husky/pre-push`
- `.claude/settings.json` (hooks + allowed commands), `.github/workflows/ci.yml`
- `package.json` scripts; `CLAUDE.md`, `AGENTS.md`, `docs/engineering-rules.md` wording

## Risks

| Risk                                                   | What we do about it                                                                                       |
| ------------------------------------------------------ | --------------------------------------------------------------------------------------------------------- |
| A regex gate gives false positives (e.g. `#` in a URL) | Each gate has fixture tests for the tricky cases; one-line opt-out `// <rule>-ignore-next-line: <reason>` |
| The Stop hook loops forever                            | Respect `stop_hook_active`; test it                                                                       |
| A broken hook locks the agent out                      | Hooks catch their own errors and exit 0; the gates at pre-push are the safety net                         |
| pnpm + husky install order                             | `prepare: husky` already in package.json; CI uses `pnpm install --frozen-lockfile`                        |

## How we will know it works

- Automated: `pnpm gates:test` covers AC-1…AC-10, AC-16; a hook test feeds sample hook JSON to each
  hook script (AC-13…AC-15).
- Manual: push a deliberately broken branch and watch pre-push and CI stop it (AC-11, AC-12).
