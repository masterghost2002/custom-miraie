// Tests for check:handbook-size (CHILL-001 AC-8).
import assert from 'node:assert/strict';
import { mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { test } from 'node:test';

import { LIMIT_BYTES, checkHandbookSize, collect } from './check-handbook-size.mjs';
import { GateSetupError } from './lib/gate.mjs';

test('AC-8: CLAUDE.md over 10 KB fails', () => {
  const [v] = checkHandbookSize(LIMIT_BYTES + 1);
  assert.equal(v.path, 'CLAUDE.md');
  assert.match(v.message, /10241 bytes; the limit is 10240/);
});

test('a handbook under the limit passes', () => {
  assert.deepEqual(checkHandbookSize(LIMIT_BYTES - 1), []);
});

test('broken setup: no CLAUDE.md fails', () => {
  const dir = mkdtempSync(path.join(tmpdir(), 'handbook-'));
  assert.throws(() => collect({ cwd: dir }), GateSetupError);
});

test('the real repo passes', () => {
  assert.deepEqual(collect(), []);
});
