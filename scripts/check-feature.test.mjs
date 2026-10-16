// Tests for check:feature (CHILL-001 AC-2).
import assert from 'node:assert/strict';
import { mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { test } from 'node:test';

import { checkFeatureTests, collect } from './check-feature.mjs';
import { GateSetupError } from './lib/gate.mjs';

test('AC-2: a new src/ui/foo.tsx without a test fails, naming the missing test path', () => {
  const [v] = checkFeatureTests(['src/ui/foo.tsx']);
  assert.equal(v.path, 'src/ui/foo.tsx');
  assert.match(v.message, /expected src\/ui\/__tests__\/foo\.test\.tsx/);
});

test('a primitive with its test passes (.tsx or .ts)', () => {
  assert.deepEqual(
    checkFeatureTests([
      'src/ui/foo.tsx',
      'src/ui/__tests__/foo.test.tsx',
      'src/ui/icons/auto-mode.tsx',
      'src/ui/icons/__tests__/auto-mode.test.ts',
    ]),
    [],
  );
});

test('screens and components need tests; the feature __tests__ folder also counts', () => {
  const violations = checkFeatureTests([
    'src/features/home/screen.tsx',
    'src/features/home/components/featured-card.tsx',
    'src/features/home/components/ac-card.tsx',
    'src/features/home/__tests__/featured-card.test.tsx',
    'src/features/home/components/__tests__/ac-card.test.tsx',
  ]);
  assert.deepEqual(
    violations.map((v) => v.path),
    ['src/features/home/screen.tsx'],
  );
});

test('hooks, copy, lib code and declaration files are not required to have a test here', () => {
  assert.deepEqual(
    checkFeatureTests([
      'src/features/home/copy.ts',
      'src/features/home/hooks/use-home-view.ts',
      'src/lib/miraie/status.ts',
      'src/ui/types.d.ts',
    ]),
    [],
  );
});

test('an exemption skips a file only with a reason', () => {
  assert.deepEqual(
    checkFeatureTests(['src/ui/x.tsx'], { exempt: { 'src/ui/x.tsx': 'pure re-export' } }),
    [],
  );
  const [v] = checkFeatureTests(['src/ui/x.tsx'], { exempt: { 'src/ui/x.tsx': ' ' } });
  assert.match(v.message, /has no reason/);
});

test('broken setup: outside a git repository the gate fails', () => {
  const dir = mkdtempSync(path.join(tmpdir(), 'feature-'));
  assert.throws(() => collect({ cwd: dir }), GateSetupError);
});

test('the real repo passes', () => {
  assert.deepEqual(collect(), []);
});
