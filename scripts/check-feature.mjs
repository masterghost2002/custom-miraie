// check:feature — every primitive, screen and feature component ships with a test, so nothing
// visible to the owner is unproven (CHILL-001).
import { GateSetupError, REPO_ROOT, isMain, isTestFile, listFiles, runGate } from './lib/gate.mjs';

export const RULE = 'feature';
export const SEVERITY = 'error';

/** Files that may go without a test. Every entry needs a reason. */
export const EXEMPT = {
  // 'src/ui/example.tsx': 'why it has no test',
};

/** Files that must have a test. */
export function needsTest(file) {
  if (isTestFile(file) || file.endsWith('.d.ts')) return false;
  if (/^src\/ui\/.+\.tsx?$/.test(file)) return true;
  if (/^src\/features\/[^/]+\/screen\.tsx$/.test(file)) return true;
  return /^src\/features\/[^/]+\/components\/[^/]+\.tsx$/.test(file);
}

/** Where a test for `file` may live: `<dir>/__tests__/` or, for features, the feature's `__tests__/`. */
export function testPathsFor(file) {
  const slash = file.lastIndexOf('/');
  const dir = file.slice(0, slash);
  const base = file.slice(slash + 1).replace(/\.tsx?$/, '');
  const dirs = [`${dir}/__tests__`];
  const feature = file.match(/^(src\/features\/[^/]+)\//);
  if (feature && `${feature[1]}/__tests__` !== dirs[0]) dirs.push(`${feature[1]}/__tests__`);
  return dirs.flatMap((d) => [`${d}/${base}.test.tsx`, `${d}/${base}.test.ts`]);
}

/** Pure check: `paths` = every file in the repo. */
export function checkFeatureTests(paths, { exempt = EXEMPT } = {}) {
  const all = new Set(paths);
  const violations = [];
  for (const [file, reason] of Object.entries(exempt)) {
    if (!reason || !String(reason).trim()) {
      violations.push({
        path: 'scripts/check-feature.mjs',
        message: `exemption for ${file} has no reason`,
        fix: 'write why the file needs no test, or remove the exemption',
      });
    }
  }
  for (const file of paths) {
    if (!needsTest(file) || file in exempt) continue;
    const candidates = testPathsFor(file);
    if (candidates.some((c) => all.has(c))) continue;
    violations.push({
      path: file,
      message: `no test found (expected ${candidates[0]})`,
      fix: `add ${candidates[0]} that renders it like a person uses it (honest-tests skill)`,
    });
  }
  return violations;
}

export function collect({ cwd = REPO_ROOT } = {}) {
  const paths = listFiles({ cwd });
  if (!paths.some((p) => p.startsWith('src/'))) throw new GateSetupError('no files under src/');
  return checkFeatureTests(paths);
}

if (isMain(import.meta.url)) await runGate(RULE, () => collect(), { severity: SEVERITY });
