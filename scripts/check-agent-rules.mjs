// check:agent-rules — AGENTS.md (read by Codex, Cursor, …) names exactly the same checks as
// CLAUDE.md, so no agent works to an older rule set (CHILL-001).
import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';

import { GateSetupError, REPO_ROOT, isMain, runGate } from './lib/gate.mjs';

export const RULE = 'agent-rules';
export const SEVERITY = 'error';

/** Every `check:<name>` mentioned in a text. */
export function checksIn(text) {
  return new Set([...text.matchAll(/\bcheck:([a-z][a-z0-9-]*)/g)].map((m) => m[1]));
}

/** Pure check: the two handbooks' texts. */
export function checkAgentRules({ claude, agents }) {
  const inClaude = checksIn(claude);
  const inAgents = checksIn(agents);
  const violations = [];
  for (const name of [...inClaude].filter((n) => !inAgents.has(n)).sort()) {
    violations.push({
      path: 'AGENTS.md',
      message: `check:${name} is in CLAUDE.md but not in AGENTS.md`,
      fix: 'add it to the check list in AGENTS.md (or remove it from CLAUDE.md)',
    });
  }
  for (const name of [...inAgents].filter((n) => !inClaude.has(n)).sort()) {
    violations.push({
      path: 'CLAUDE.md',
      message: `check:${name} is in AGENTS.md but not in CLAUDE.md`,
      fix: 'name it in CLAUDE.md next to its rule (or remove it from AGENTS.md)',
    });
  }
  return violations;
}

export function collect({ cwd = REPO_ROOT } = {}) {
  const read = (name) => {
    const file = path.join(cwd, name);
    if (!existsSync(file)) throw new GateSetupError(`${name} not found`);
    return readFileSync(file, 'utf8');
  };
  const claude = read('CLAUDE.md');
  const agents = read('AGENTS.md');
  if (checksIn(claude).size === 0) throw new GateSetupError('CLAUDE.md names no check:* gates');
  return checkAgentRules({ claude, agents });
}

if (isMain(import.meta.url)) await runGate(RULE, () => collect(), { severity: SEVERITY });
