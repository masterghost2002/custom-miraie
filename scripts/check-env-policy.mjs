// check:env-policy — every EXPO_PUBLIC_* variable the app reads is listed in .env.example, so a
// fresh clone knows what to set and nobody slips a secret into the bundle unnoticed (CHILL-001).
import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';

import {
  GateSetupError,
  REPO_ROOT,
  applyIgnores,
  isMain,
  lineOf,
  listFiles,
  readFiles,
  runGate,
} from './lib/gate.mjs';

export const RULE = 'env-policy';
export const SEVERITY = 'error';
export const EXAMPLE_FILE = '.env.example';

const READ =
  /process\.env(?:\.(EXPO_PUBLIC_[A-Z0-9_]+)|\[\s*(['"])(EXPO_PUBLIC_[A-Z0-9_]+)\2\s*\])/g;

export function appliesTo(file) {
  return file.startsWith('src/') && /\.(ts|tsx|js|jsx)$/.test(file);
}

/** Variable names declared in .env.example (`NAME=` lines, comments ignored). */
export function declaredNames(exampleText) {
  return new Set(
    exampleText
      .split('\n')
      .map((line) => line.match(/^\s*(?:export\s+)?([A-Z][A-Z0-9_]*)\s*=/))
      .filter(Boolean)
      .map((m) => m[1]),
  );
}

/** Pure check: `files` = [{ path, text }], `exampleText` = contents of .env.example. */
export function checkEnvPolicy(files, exampleText) {
  const declared = declaredNames(exampleText);
  const violations = [];
  for (const file of files) {
    if (!appliesTo(file.path)) continue;
    const found = [];
    for (const match of file.text.matchAll(READ)) {
      const name = match[1] ?? match[3];
      if (declared.has(name)) continue;
      found.push({
        path: file.path,
        line: lineOf(file.text, match.index),
        message: `${name} is read here but not listed in ${EXAMPLE_FILE}`,
        fix: `add \`${name}=\` with a comment to ${EXAMPLE_FILE} (EXPO_PUBLIC_* values ship in the bundle — never a secret)`,
      });
    }
    violations.push(...applyIgnores(RULE, file, found));
  }
  return violations;
}

export function collect({ cwd = REPO_ROOT } = {}) {
  const examplePath = path.join(cwd, EXAMPLE_FILE);
  if (!existsSync(examplePath)) throw new GateSetupError(`${EXAMPLE_FILE} not found`);
  const files = listFiles({ cwd }).filter(appliesTo);
  return checkEnvPolicy(readFiles(files, { cwd }), readFileSync(examplePath, 'utf8'));
}

if (isMain(import.meta.url)) await runGate(RULE, () => collect(), { severity: SEVERITY });
