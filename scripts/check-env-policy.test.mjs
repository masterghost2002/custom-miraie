// Tests for check:env-policy (CHILL-001 AC-6).
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { test } from 'node:test';

import { checkEnvPolicy, collect, declaredNames } from './check-env-policy.mjs';
import { GateSetupError } from './lib/gate.mjs';

const example = '# comment\nEXPO_PUBLIC_MIRAIE_DEMO=0\nMIRAIE_LOGIN_ID=\n';
const file = (p, text) => ({ path: p, text });

test('AC-6: reading EXPO_PUBLIC_FOO that .env.example lacks fails', () => {
  const [v] = checkEnvPolicy(
    [file('src/lib/config.ts', 'const a = 1;\nconst foo = process.env.EXPO_PUBLIC_FOO;')],
    example,
  );
  assert.equal(v.line, 2);
  assert.match(v.message, /EXPO_PUBLIC_FOO is read here but not listed in \.env\.example/);
});

test('bracket access is checked too', () => {
  const violations = checkEnvPolicy([file('src/a.ts', "process.env['EXPO_PUBLIC_BAR']")], example);
  assert.equal(violations.length, 1);
});

test('declared variables pass', () => {
  assert.deepEqual(
    checkEnvPolicy([file('src/a.ts', "process.env.EXPO_PUBLIC_MIRAIE_DEMO === '1'")], example),
    [],
  );
});

test('declaredNames reads NAME= lines and skips comments', () => {
  assert.deepEqual([...declaredNames(example)].sort(), [
    'EXPO_PUBLIC_MIRAIE_DEMO',
    'MIRAIE_LOGIN_ID',
  ]);
});

test('broken setup: no .env.example fails', () => {
  const dir = mkdtempSync(path.join(tmpdir(), 'env-'));
  execFileSync('git', ['init', '-q'], { cwd: dir });
  assert.throws(() => collect({ cwd: dir }), GateSetupError);
});

// The scan itself is `pnpm gates`; here we only prove the gate can read the real repo.
test('the gate runs on the real repo without a setup error', () => {
  assert.ok(Array.isArray(collect()));
});
