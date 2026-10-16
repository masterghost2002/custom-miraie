// check:ui-mock-policy — tests never jest.mock this repo's own modules; a mocked component makes a
// test that passes while the real one is broken. Fake only the network and native modules
// (CHILL-001).
import {
  GateSetupError,
  REPO_ROOT,
  applyIgnores,
  isMain,
  isTestFile,
  lineOf,
  listFiles,
  readFiles,
  runGate,
} from './lib/gate.mjs';

export const RULE = 'ui-mock-policy';
export const SEVERITY = 'error';

const PATTERN =
  /\bjest\.(?:mock|doMock|unstable_mockModule|setMock)\(\s*(['"`])((?:@\/|\.\.?\/|src\/)[^'"`]*)\1/g;

/** Test files under src/, plus jest.setup.ts (which may mock only third-party native modules). */
export function appliesTo(file) {
  if (file === 'jest.setup.ts' || file === 'jest.setup.js') return true;
  return file.startsWith('src/') && isTestFile(file) && /\.(ts|tsx|js|jsx)$/.test(file);
}

/** Pure check: `files` = [{ path, text }]. */
export function checkMockPolicy(files) {
  const violations = [];
  for (const file of files) {
    if (!appliesTo(file.path)) continue;
    const found = [...file.text.matchAll(PATTERN)].map((match) => ({
      path: file.path,
      line: lineOf(file.text, match.index),
      message: `jest.mock of our own module '${match[2]}'`,
      fix: 'render the real code; fake the network with createDemoBackend() (or a small MiraieBackend) inside <BackendProvider>, and native modules once in jest.setup.ts',
    }));
    violations.push(...applyIgnores(RULE, file, found));
  }
  return violations;
}

export function collect({ cwd = REPO_ROOT } = {}) {
  const paths = listFiles({ cwd });
  if (!paths.includes('jest.setup.ts')) throw new GateSetupError('jest.setup.ts not found');
  return checkMockPolicy(readFiles(paths.filter(appliesTo), { cwd }));
}

if (isMain(import.meta.url)) await runGate(RULE, () => collect(), { severity: SEVERITY });
