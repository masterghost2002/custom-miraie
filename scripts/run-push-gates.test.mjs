import './lib/test-git.mjs';

// Tests for the gate runner (CHILL-001 AC-11).
import assert from 'node:assert/strict';
import { existsSync, mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { test } from 'node:test';

import { GATES, PUSH_GATES, runGates } from './run-push-gates.mjs';

function scriptsDir(gates) {
  const dir = mkdtempSync(path.join(tmpdir(), 'runner-'));
  for (const [name, body] of Object.entries(gates))
    writeFileSync(path.join(dir, `check-${name}.mjs`), body);
  return dir;
}

test('AC-11: gates run in parallel and the report shows each gate with its time', async () => {
  const sleep = "await new Promise((r) => setTimeout(r, 400)); console.log('✓ check:x');";
  const dir = scriptsDir({ a: sleep, b: sleep, c: sleep });
  const { failed, seconds, report } = await runGates(['a', 'b', 'c'], {
    scriptsDir: dir,
    cwd: dir,
  });
  assert.equal(failed.length, 0);
  assert.ok(seconds < 1.1, `three 0.4 s gates took ${seconds}s — not parallel`);
  assert.match(report, /✓ check:a {2}0\.\d\ds/);
  assert.match(report, /gates: 3 passed, 0 failed in/);
});

test('one failing gate fails the run and its output is shown', async () => {
  const dir = scriptsDir({
    good: "console.log('✓ check:good')",
    bad: "console.error('✖ check:bad\\n  src/a.ts:1\\n  wrong — fix'); process.exit(1);",
  });
  const { failed, report } = await runGates(['good', 'bad'], { scriptsDir: dir, cwd: dir });
  assert.deepEqual(
    failed.map((r) => r.name),
    ['bad'],
  );
  assert.match(report, /✖ check:bad/);
  assert.match(report, /src\/a\.ts:1/);
  assert.match(report, /gates: 1 passed, 1 failed/);
});

test('a crashing gate fails', async () => {
  const dir = scriptsDir({ crash: "throw new Error('boom');" });
  const { failed } = await runGates(['crash'], { scriptsDir: dir, cwd: dir });
  assert.equal(failed.length, 1);
});

test('broken setup: a missing gate script fails', async () => {
  const dir = scriptsDir({});
  const { failed, report } = await runGates(['missing'], { scriptsDir: dir, cwd: dir });
  assert.equal(failed.length, 1);
  assert.match(report, /setup broken/);
});

test('every listed gate has a script; review runs only before a push', () => {
  const here = path.dirname(new URL(import.meta.url).pathname);
  for (const name of GATES) assert.ok(existsSync(path.join(here, `check-${name}.mjs`)), name);
  assert.equal(GATES.includes('review'), false);
  assert.equal(PUSH_GATES.at(-1), 'review');
});
