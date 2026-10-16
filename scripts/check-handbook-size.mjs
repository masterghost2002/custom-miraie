// check:handbook-size — CLAUDE.md stays under 10 KB, so every agent reads all of it on every
// turn; detail belongs in docs/ (CHILL-001).
import { existsSync, statSync } from 'node:fs';
import path from 'node:path';

import { GateSetupError, REPO_ROOT, isMain, runGate } from './lib/gate.mjs';

export const RULE = 'handbook-size';
export const SEVERITY = 'error';
export const HANDBOOK = 'CLAUDE.md';
export const LIMIT_BYTES = 10 * 1024;

/** Pure check on the handbook's size in bytes. */
export function checkHandbookSize(bytes, { limit = LIMIT_BYTES } = {}) {
  if (bytes < limit) return [];
  return [
    {
      path: HANDBOOK,
      message: `${HANDBOOK} is ${bytes} bytes; the limit is ${limit}`,
      fix: 'move detail into docs/ (or a skill) and link to it from the handbook',
    },
  ];
}

export function collect({ cwd = REPO_ROOT } = {}) {
  const file = path.join(cwd, HANDBOOK);
  if (!existsSync(file)) throw new GateSetupError(`${HANDBOOK} not found`);
  return checkHandbookSize(statSync(file).size);
}

if (isMain(import.meta.url)) await runGate(RULE, () => collect(), { severity: SEVERITY });
