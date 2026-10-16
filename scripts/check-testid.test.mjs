// Tests for check:testid (CHILL-001 AC-4).
import assert from 'node:assert/strict';
import { mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { test } from 'node:test';

import { checkTestIds, collect } from './check-testid.mjs';
import { GateSetupError } from './lib/gate.mjs';

const file = (p, text) => ({ path: p, text });

test('AC-4: a test calling getByTestId fails', () => {
  const [v] = checkTestIds([
    file('src/ui/__tests__/glass.test.tsx', "render(<Glass />);\nscreen.getByTestId('glass');"),
  ]);
  assert.equal(v.line, 2);
  assert.match(v.message, /getByTestId is banned/);
  assert.match(v.fix, /getByRole/);
});

test('AC-4: passing testID, in JSX or a props object, fails', () => {
  const violations = checkTestIds([
    file('src/ui/glass.tsx', '<View testID="glass" />'),
    file('src/ui/__tests__/x.test.tsx', "const props = { testID: 'x' };"),
  ]);
  assert.equal(violations.length, 2);
});

test('every *ByTestId variant fails', () => {
  const text = [
    'queryByTestId',
    'getAllByTestId',
    'queryAllByTestId',
    'findByTestId',
    'findAllByTestId',
  ]
    .map((q) => `screen.${q}('x');`)
    .join('\n');
  assert.equal(checkTestIds([file('src/a.test.tsx', text)]).length, 5);
});

test('role, label and text queries pass', () => {
  const text =
    "screen.getByRole('switch', { name: 'Power' });\nscreen.getByLabelText('Eco');\nscreen.getByText('On');";
  assert.deepEqual(checkTestIds([file('src/ui/__tests__/x.test.tsx', text)]), []);
});

test('broken setup: outside a git repository the gate fails', () => {
  const dir = mkdtempSync(path.join(tmpdir(), 'testid-'));
  assert.throws(() => collect({ cwd: dir }), GateSetupError);
});

// The scan itself is `pnpm gates`; here we only prove the gate can read the real repo.
test('the gate runs on the real repo without a setup error', () => {
  assert.ok(Array.isArray(collect()));
});
