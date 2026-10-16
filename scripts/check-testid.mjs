// check:testid — tests find elements by role, label or visible text, like a person does; testID
// lets a test pass while the screen is unusable (CHILL-001).
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

export const RULE = 'testid';
export const SEVERITY = 'error';

const PATTERN = /\b(?:get|getAll|query|queryAll|find|findAll)ByTestId\b|\btestID\s*[=:]/g;

export function appliesTo(file) {
  return file.startsWith('src/') && /\.(ts|tsx|js|jsx)$/.test(file);
}

/** Pure check: `files` = [{ path, text }]. */
export function checkTestIds(files) {
  const violations = [];
  for (const file of files) {
    if (!appliesTo(file.path)) continue;
    const found = [...file.text.matchAll(PATTERN)].map((match) => ({
      path: file.path,
      line: lineOf(file.text, match.index),
      message: `${match[0].replace(/\s*[=:]$/, '')} is banned`,
      fix: 'query by role, label or visible text (getByRole, getByLabelText, getByText); add an accessibilityRole/accessibilityLabel if it can’t be found',
    }));
    violations.push(...applyIgnores(RULE, file, found));
  }
  return violations;
}

export function collect({ cwd = REPO_ROOT } = {}) {
  const files = listFiles({ cwd }).filter(appliesTo);
  if (files.length === 0) throw new GateSetupError('no source files under src/');
  return checkTestIds(readFiles(files, { cwd }));
}

if (isMain(import.meta.url)) await runGate(RULE, () => collect(), { severity: SEVERITY });
