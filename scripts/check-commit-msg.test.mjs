import './lib/test-git.mjs';

// Tests for check:commit-msg (CHILL-001 AC-9).
import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { test } from 'node:test';

import { checkCommitMessage, collect, subjectOf, ticketsIn } from './check-commit-msg.mjs';
import { GateSetupError } from './lib/gate.mjs';

const known = { ticketExists: (id) => id === 'CHILL-006' };

test('AC-9: a message without (CHILL-NNN) is rejected with the expected format', () => {
  const [v] = checkCommitMessage('add fan pill\n', known);
  assert.match(v.message, /does not match type\(scope\): subject \(CHILL-NNN\)/);
  assert.match(v.fix, /feat\(climate\): add fan speed pill \(CHILL-006\)/);
});

test('AC-9: a ticket with no spec folder is rejected', () => {
  const [v] = checkCommitMessage('feat(x): thing (CHILL-999)', known);
  assert.match(v.message, /CHILL-999 has no specs\/CHILL-999-\* folder/);
});

test('a well-formed message for a known ticket passes, with or without scope and body', () => {
  assert.deepEqual(checkCommitMessage('feat(climate): add fan speed pill (CHILL-006)', known), []);
  assert.deepEqual(checkCommitMessage('docs: note (CHILL-006)\n\nBody text.\n', known), []);
});

test('an unknown type or a missing space fails', () => {
  assert.equal(checkCommitMessage('feature(x): y (CHILL-006)', known).length, 1);
  assert.equal(checkCommitMessage('feat(x): y(CHILL-006)', known).length, 1);
});

test('git-generated merge, revert and fixup messages pass', () => {
  for (const msg of [
    "Merge branch 'feat/x'",
    'Revert "feat(x): y (CHILL-006)"',
    'fixup! feat(x): y',
  ]) {
    assert.deepEqual(checkCommitMessage(msg, known), []);
  }
});

test('comment lines from the editor are ignored', () => {
  assert.equal(
    subjectOf('# Please enter\n\nfix(a): b (CHILL-006)\n# end'),
    'fix(a): b (CHILL-006)',
  );
});

test('collect reads the message file and the specs folder', () => {
  const dir = mkdtempSync(path.join(tmpdir(), 'msg-'));
  mkdirSync(path.join(dir, 'specs', 'CHILL-006-climate'), { recursive: true });
  writeFileSync(path.join(dir, 'MSG'), 'feat(climate): add pill (CHILL-006)\n');
  assert.deepEqual(collect({ cwd: dir, messageFile: 'MSG' }), []);
  assert.deepEqual([...ticketsIn({ cwd: dir })], ['CHILL-006']);
});

test('AC-16: broken setup: no message file, or no specs folder, fails', () => {
  const dir = mkdtempSync(path.join(tmpdir(), 'msg-'));
  assert.throws(() => collect({ cwd: dir }), GateSetupError);
  writeFileSync(path.join(dir, 'MSG'), 'feat(a): b (CHILL-001)');
  assert.throws(() => collect({ cwd: dir, messageFile: 'MSG' }), GateSetupError);
});

test('the real repo knows its tickets', () => {
  assert.ok(ticketsIn().has('CHILL-001'));
});
