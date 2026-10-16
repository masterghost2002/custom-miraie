import './lib/test-git.mjs';

// Tests for check:ui-mock-policy (CHILL-001 AC-5).
import assert from 'node:assert/strict';
import { mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { test } from 'node:test';

import { checkMockPolicy, collect } from './check-ui-mock-policy.mjs';
import { GateSetupError } from './lib/gate.mjs';

const file = (p, text) => ({ path: p, text });

test("AC-5: jest.mock('@/…'), ('./…') and ('../…') in a test fail and point to createDemoBackend()", () => {
  const violations = checkMockPolicy([
    file(
      'src/features/home/__tests__/screen.test.tsx',
      "jest.mock('@/ui/power-pill', () => ({}));\njest.mock('./hooks');\njest.mock(\"../copy\");",
    ),
  ]);
  assert.equal(violations.length, 3);
  assert.match(violations[0].message, /'@\/ui\/power-pill'/);
  assert.match(violations[0].fix, /createDemoBackend\(\)/);
  assert.deepEqual(
    violations.map((v) => v.line),
    [1, 2, 3],
  );
});

test('jest.doMock and src/ paths fail too', () => {
  const violations = checkMockPolicy([
    file('src/ui/__tests__/x.test.tsx', "jest.doMock('src/lib/miraie/rest');"),
  ]);
  assert.equal(violations.length, 1);
});

test('jest.setup.ts may mock third-party native modules, not ours', () => {
  assert.deepEqual(
    checkMockPolicy([file('jest.setup.ts', "jest.mock('expo-secure-store', () => ({}));")]),
    [],
  );
  assert.equal(checkMockPolicy([file('jest.setup.ts', "jest.mock('@/state/session');")]).length, 1);
});

test('mocking third-party modules in a test is not this rule’s business', () => {
  assert.deepEqual(
    checkMockPolicy([file('src/ui/__tests__/x.test.tsx', "jest.mock('expo-haptics');")]),
    [],
  );
});

test('AC-16: broken setup: outside a git repository the gate fails', () => {
  const dir = mkdtempSync(path.join(tmpdir(), 'mock-'));
  assert.throws(() => collect({ cwd: dir }), GateSetupError);
});

// The scan itself is `pnpm gates`; here we only prove the gate can read the real repo.
test('the gate runs on the real repo without a setup error', () => {
  assert.ok(Array.isArray(collect()));
});
