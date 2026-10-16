import './lib/test-git.mjs';

// Pins the commit/push/CI wiring the gates depend on: hook order and the CI job (CHILL-001 AC-7,
// AC-9, AC-11, AC-12, AC-16). AC-12 itself is proven on the first PR; this is its stand-in.
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { test } from 'node:test';

import { REPO_ROOT } from './lib/gate.mjs';
import { PUSH_GATES } from './run-push-gates.mjs';

const read = (file) => readFileSync(path.join(REPO_ROOT, file), 'utf8');
/** Command lines of a shell hook, comments dropped. */
const commands = (text) =>
  text
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line && !line.startsWith('#'));
const scripts = JSON.parse(read('package.json')).scripts;

test('AC-16: pre-push runs every gate’s own tests before the gates, in a scrubbed git env', () => {
  const lines = commands(read('.husky/pre-push'));
  const testsAt = lines.findIndex((l) => /pnpm gates:test$/.test(l));
  const gatesAt = lines.findIndex((l) => /^pnpm gates:push$/.test(l));
  assert.ok(testsAt >= 0 && gatesAt > testsAt, lines.join('\n'));
  assert.match(lines[testsAt], /^env -u GIT_DIR -u GIT_WORK_TREE -u GIT_INDEX_FILE /);
});

test('AC-11: pre-push gates include check:review; pnpm gates does not', () => {
  assert.equal(scripts['gates:push'], 'node scripts/run-push-gates.mjs --push');
  assert.equal(scripts.gates, 'node scripts/run-push-gates.mjs');
  assert.ok(PUSH_GATES.includes('review'));
});

test('AC-7, AC-9: pre-commit checks staged secrets; commit-msg checks the message file', () => {
  assert.ok(
    commands(read('.husky/pre-commit')).includes('node scripts/check-secrets.mjs --staged'),
  );
  assert.deepEqual(commands(read('.husky/commit-msg')), ['node scripts/check-commit-msg.mjs "$1"']);
});

test('AC-12 stand-in: CI has one "CI passed" job running gate tests, gates, typecheck, lint and coverage', () => {
  const ci = read('.github/workflows/ci.yml');
  assert.match(ci, /pull_request:\s*\n\s*branches: \[main\]/);
  assert.equal((ci.match(/^\s{4}name: /gm) ?? []).length, 1, 'exactly one job');
  assert.match(ci, /^\s{4}name: CI passed$/m);
  const runs = [...ci.matchAll(/^\s+(?:- )?run: (.+)$/gm)].map((m) => m[1].trim());
  const order = [
    'pnpm install --frozen-lockfile',
    'pnpm gates:test',
    'pnpm gates',
    'pnpm typecheck',
    'pnpm lint',
    'pnpm test:coverage',
  ];
  const positions = order.map((step) => runs.indexOf(step));
  assert.ok(
    positions.every((p) => p >= 0),
    `missing steps: ${order.filter((_, i) => positions[i] < 0)}`,
  );
  assert.deepEqual(
    [...positions].sort((a, b) => a - b),
    positions,
    'steps out of order',
  );
  assert.equal(scripts['test:coverage'], 'jest --coverage');
  assert.equal(scripts['gates:test'], 'node --test "scripts/**/*.test.mjs"');
});
