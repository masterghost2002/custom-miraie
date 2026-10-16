import { gitIn, tempRepo } from './test-git.mjs';

// Regression test: the gate tests run inside git hooks, where git exports GIT_DIR and friends.
// Run every other gate test with those pointing at a sentinel repo; the sentinel must not change
// (CHILL-001, review finding: tests mutated the real repo from a worktree hook).
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { readFileSync, readdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';

import { REPO_ROOT } from './gate.mjs';

const scriptsDir = path.join(REPO_ROOT, 'scripts');
const self = fileURLToPath(import.meta.url);

function testFiles(dir = scriptsDir) {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) return entry.name === 'node_modules' ? [] : testFiles(full);
    return entry.name.endsWith('.test.mjs') ? [full] : [];
  });
}

function snapshot(dir) {
  const hash = (file) => createHash('sha256').update(readFileSync(file)).digest('hex');
  return {
    config: readFileSync(path.join(dir, '.git', 'config'), 'utf8'),
    refs: gitIn(dir, 'for-each-ref', '--format=%(refname) %(objectname)'),
    head: readFileSync(path.join(dir, '.git', 'HEAD'), 'utf8'),
    index: hash(path.join(dir, '.git', 'index')),
  };
}

test('every gate test imports test-git.mjs first, so it runs with a scrubbed git environment', () => {
  for (const file of testFiles()) {
    const first = readFileSync(file, 'utf8')
      .split('\n')
      .find((line) => line.startsWith('import '));
    assert.match(
      first ?? '',
      /test-git\.mjs['"];$/,
      `${path.relative(REPO_ROOT, file)} must start with import './…/test-git.mjs'`,
    );
  }
});

test('with GIT_DIR, GIT_WORK_TREE and GIT_INDEX_FILE pointing at another repo, the gate tests leave it untouched', () => {
  const sentinel = tempRepo('sentinel-');
  writeFileSync(path.join(sentinel, 'a.txt'), 'sentinel\n');
  gitIn(sentinel, 'add', 'a.txt');
  gitIn(sentinel, 'commit', '-q', '-m', 'sentinel');
  const before = snapshot(sentinel);

  const others = testFiles().filter((file) => file !== self);
  const env = {
    ...process.env,
    GIT_DIR: path.join(sentinel, '.git'),
    GIT_WORK_TREE: sentinel,
    GIT_INDEX_FILE: path.join(sentinel, '.git', 'index'),
  };
  // Inside `node --test`, NODE_TEST_CONTEXT makes a nested `node --test` run nothing.
  delete env.NODE_TEST_CONTEXT;
  const result = spawnSync(process.execPath, ['--test', ...others], {
    cwd: REPO_ROOT,
    encoding: 'utf8',
    env,
  });
  assert.equal(result.status, 0, result.stdout.slice(-3000) + result.stderr.slice(-2000));
  assert.match(result.stdout, /# pass [1-9]\d+/, 'the nested run must actually run the tests');
  assert.deepEqual(snapshot(sentinel), before);
});
