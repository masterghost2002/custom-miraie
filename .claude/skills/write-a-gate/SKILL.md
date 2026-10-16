---
name: write-a-gate
description: Use when adding or changing a gate (scripts/check-<rule>.mjs), its test, the push runner or a Claude hook that enforces a rule. Forbids more than one rule per file, gates without a node:test test, gates that pass when their setup is broken, and new rules that fail old code on day one.
---

# Write a gate

A gate is a small Node script that checks ONE rule across the repo and exits non-zero when it is
broken. The planned set (CHILL-001): style-policy, design-source, feature, testid,
ui-mock-policy, env-policy, secrets, handbook-size, agent-rules, review, commit-msg.

## Shape

```
scripts/check-<rule>.mjs        the gate: exports a pure check function + a CLI entry
scripts/check-<rule>.test.mjs   node:test tests for the check function
scripts/run-push-gates.mjs      runs every gate in parallel (pnpm gates)
```

```js
// check:testid — tests must find elements like a person does (CHILL-001)
export function findTestIdQueries(files /* [{ path, text }] */) {
  // returns [{ path, line, message, fix }]
}

if (import.meta.url === `file://${process.argv[1]}`) {
  // read files (git ls-files), call the function, print, exit 1 on errors
}
```

## Rules

1. **One rule per file.** The exported function is pure (input: file list/text; output:
   violations), so a Claude hook can import the same function and agree with the gate.
2. **Test it** with `node:test` + `node:assert/strict`: one passing input, one failing input per
   violation kind, and the broken-setup case. `pnpm gates:test` (planned, `node --test scripts/`) runs them before the scan.
3. **Output** — exactly this, so the agent can fix it alone:
   ```
   ✖ check:<rule>
     <file>:<line>
     <what is wrong> — <how to fix>
   ```
   End with a summary line (`check:<rule>: 2 errors, 1 warning`). Nothing printed on success
   except `✓ check:<rule>`.
4. **Fail when the setup is broken.** Can't run git, can't find `origin/main`, a config file is
   missing, zero files matched where some must exist → exit 1 with a message. Never pass quietly.
5. **Start soft.** A new rule first reports `⚠` warnings and exits 0 (a `SEVERITY = 'warn'`
   constant at the top). Switch to `'error'` once existing code is clean, in its own commit.
6. **Escape hatch, one line at a time**: `// <rule>-ignore-next-line: <reason>`; a missing reason
   is itself a violation.
7. **Ticket in a comment** at the top (`// check:<rule> — <why> (CHILL-NNN)`), so nobody deletes
   it without knowing why it exists.
8. **Fast**: no network, no installs; the whole `pnpm gates` run should stay under ~20 s.
9. Register it: add `check:<rule>` to `package.json` scripts, to `run-push-gates.mjs`, and to the
   gate list in `CLAUDE.md` and `AGENTS.md` (`check:agent-rules` compares the two lists).

## Hooks

If the rule also deserves an instant warning while the agent works, add a hook in
`.claude/settings.json` that imports the gate's function. If the hook itself crashes, let the
work continue (exit 0 with a warning on stderr) — the gate at push time is the safety net.
