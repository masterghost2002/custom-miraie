import { gitIn, tempRepo } from './test-git.mjs';

// Tests for the shared gate helpers (CHILL-001).
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdtempSync, mkdirSync, symlinkSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { test } from 'node:test';
import { fileURLToPath, pathToFileURL } from 'node:url';

import {
  GateSetupError,
  applyIgnores,
  formatReport,
  formatSetupError,
  isMain,
  isTestFile,
  lineOf,
  listFiles,
  readFiles,
  stagedFiles,
} from './gate.mjs';

test('listFiles returns tracked and new files but not ignored ones', () => {
  const dir = tempRepo();
  writeFileSync(path.join(dir, '.gitignore'), 'ignored.txt\n');
  writeFileSync(path.join(dir, 'tracked.ts'), 'a');
  writeFileSync(path.join(dir, 'ignored.txt'), 'b');
  gitIn(dir, 'add', 'tracked.ts');
  mkdirSync(path.join(dir, 'src'));
  writeFileSync(path.join(dir, 'src', 'new.tsx'), 'c');

  const files = listFiles({ cwd: dir }).sort();
  assert.deepEqual(files, ['.gitignore', 'src/new.tsx', 'tracked.ts']);
});

test('stagedFiles lists only staged files', () => {
  const dir = tempRepo();
  writeFileSync(path.join(dir, 'a.ts'), 'a');
  writeFileSync(path.join(dir, 'b.ts'), 'b');
  gitIn(dir, 'add', 'a.ts');
  assert.deepEqual(stagedFiles({ cwd: dir }), ['a.ts']);
});

test('AC-16: broken setup: git outside a repository throws GateSetupError', () => {
  const dir = mkdtempSync(path.join(tmpdir(), 'nogit-'));
  assert.throws(() => listFiles({ cwd: dir }), GateSetupError);
});

test('AC-16: broken setup: an unreadable file throws GateSetupError', () => {
  const dir = mkdtempSync(path.join(tmpdir(), 'read-'));
  assert.throws(() => readFiles(['missing.ts'], { cwd: dir }), GateSetupError);
});

test('isTestFile recognises __tests__ folders and .test files', () => {
  assert.equal(isTestFile('src/ui/__tests__/glass.test.tsx'), true);
  assert.equal(isTestFile('scripts/check-x.test.mjs'), true);
  assert.equal(isTestFile('src/ui/glass.tsx'), false);
});

test('lineOf counts lines from 1', () => {
  assert.equal(lineOf('a\nb\nc', 0), 1);
  assert.equal(lineOf('a\nb\nc', 4), 3);
});

test('applyIgnores drops the next line when a reason is given', () => {
  const file = { path: 'a.ts', text: 'x\n// demo-ignore-next-line: fixture colour\nbad\nbad' };
  const kept = applyIgnores('demo', file, [
    { path: 'a.ts', line: 3, message: 'm', fix: 'f' },
    { path: 'a.ts', line: 4, message: 'm', fix: 'f' },
  ]);
  assert.deepEqual(
    kept.map((v) => v.line),
    [4],
  );
});

test('applyIgnores supports JSX comments', () => {
  const file = { path: 'a.tsx', text: '{/* demo-ignore-next-line: reason */}\nbad' };
  assert.deepEqual(
    applyIgnores('demo', file, [{ path: 'a.tsx', line: 2, message: 'm', fix: 'f' }]),
    [],
  );
});

test('applyIgnores reports an ignore comment without a reason', () => {
  const file = { path: 'a.ts', text: '// demo-ignore-next-line\nbad' };
  const result = applyIgnores('demo', file, [{ path: 'a.ts', line: 2, message: 'm', fix: 'f' }]);
  assert.equal(result.length, 2);
  assert.match(result[1].message, /has no reason/);
});

test('formatReport prints the shared format and fails on errors', () => {
  const { output, exitCode } = formatReport('demo', [
    { path: 'src/a.ts', line: 3, message: 'raw colour', fix: 'use a token' },
  ]);
  assert.equal(exitCode, 1);
  assert.equal(
    output,
    '✖ check:demo\n  src/a.ts:3\n  raw colour — use a token\ncheck:demo: 1 error',
  );
});

test('formatReport passes quietly and warns without failing', () => {
  assert.deepEqual(formatReport('demo', []), { output: '✓ check:demo', exitCode: 0 });
  const warn = formatReport('demo', [{ path: 'a', message: 'm', fix: 'f' }], { severity: 'warn' });
  assert.equal(warn.exitCode, 0);
  assert.match(warn.output, /^⚠ check:demo/);
  assert.match(warn.output, /1 warning$/);
});

test('formatSetupError always fails', () => {
  const { output, exitCode } = formatSetupError('demo', new Error('no git'));
  assert.equal(exitCode, 1);
  assert.match(output, /setup broken: no git/);
});

test('isMain is true when the script was started through a symlink', () => {
  const real = fileURLToPath(new URL('./gate.mjs', import.meta.url));
  const link = path.join(mkdtempSync(path.join(tmpdir(), 'link-')), 'gate-link.mjs');
  symlinkSync(real, link);
  assert.equal(isMain(pathToFileURL(real).href, link), true);
  assert.equal(isMain(pathToFileURL(real).href, path.join(tmpdir(), 'other.mjs')), false);
  assert.equal(isMain(pathToFileURL(real).href, undefined), false);
});

test('a gate started through a symlinked path still runs and reports', () => {
  const real = fileURLToPath(new URL('../check-handbook-size.mjs', import.meta.url));
  const link = path.join(mkdtempSync(path.join(tmpdir(), 'link-')), 'check.mjs');
  symlinkSync(real, link);
  const result = spawnSync(process.execPath, [link], { encoding: 'utf8' });
  assert.equal(result.status, 0);
  assert.match(result.stdout, /✓ check:handbook-size/);
});
