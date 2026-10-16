// Tests for the review stamp and check:review (CHILL-001 AC-10).
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { appendFileSync, mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { test } from 'node:test';

import { checkReview, collect } from './check-review.mjs';
import { GateSetupError } from './lib/gate.mjs';
import { currentReviewId, reviewIdOf } from './lib/review.mjs';
import { parseStampArgs, writeStamp } from './review-stamp.mjs';

const run = (dir, ...args) => execFileSync('git', args, { cwd: dir, stdio: 'pipe' });

/** A repo whose origin/main is its first commit, with one change on a branch. */
function repo({ withOrigin = true } = {}) {
  const dir = mkdtempSync(path.join(tmpdir(), 'review-'));
  run(dir, 'init', '-q', '-b', 'main');
  run(dir, 'config', 'user.email', 't@example.com');
  run(dir, 'config', 'user.name', 'T');
  writeFileSync(path.join(dir, '.gitignore'), '.review/\n');
  writeFileSync(path.join(dir, 'a.ts'), 'one\n');
  run(dir, 'add', '.');
  run(dir, 'commit', '-q', '-m', 'init');
  if (withOrigin) run(dir, 'update-ref', 'refs/remotes/origin/main', 'HEAD');
  run(dir, 'checkout', '-q', '-b', 'feat/x');
  appendFileSync(path.join(dir, 'a.ts'), 'two\n');
  run(dir, 'commit', '-q', '-am', 'change');
  return dir;
}

const pass = { verdict: 'pass', findings: { critical: 0, important: 0, suggestion: 2 } };

test('AC-10: a stamp for this exact change passes', () => {
  const dir = repo();
  const stamp = writeStamp(pass, { cwd: dir });
  assert.equal(stamp.model, 'claude-opus-5-5');
  assert.equal(stamp.effort, 'xhigh');
  assert.match(stamp.reviewId, /^[0-9a-f]{16}$/);
  assert.deepEqual(collect({ cwd: dir }), []);
});

test('AC-10: one more changed line after the review blocks: "Code changed after review. Run /review."', () => {
  const dir = repo();
  writeStamp(pass, { cwd: dir });
  appendFileSync(path.join(dir, 'a.ts'), 'three\n');
  const [v] = collect({ cwd: dir });
  assert.equal(`${v.message} ${v.fix}`, 'Code changed after review. Run /review.');
});

test('a new untracked file and a new commit both break the stamp', () => {
  const dir = repo();
  writeStamp(pass, { cwd: dir });
  writeFileSync(path.join(dir, 'new.ts'), 'x');
  assert.equal(collect({ cwd: dir }).length, 1);
  run(dir, 'add', 'new.ts');
  run(dir, 'commit', '-q', '-m', 'more');
  assert.equal(collect({ cwd: dir }).length, 1);
});

test('no stamp, a failed verdict or recorded findings fail', () => {
  const reviewId = reviewIdOf('diff');
  assert.match(checkReview({ stamp: null, reviewId })[0].message, /no review stamp/);
  assert.equal(checkReview({ stamp: { ...pass, verdict: 'fail', reviewId }, reviewId }).length, 1);
  assert.equal(
    checkReview({ stamp: { ...pass, findings: { critical: 0, important: 1 }, reviewId }, reviewId })
      .length,
    1,
  );
});

test('nothing to push (no change since origin/main) passes', () => {
  const dir = repo();
  run(dir, 'update-ref', 'refs/remotes/origin/main', 'HEAD');
  assert.equal(currentReviewId({ cwd: dir }).empty, true);
  assert.deepEqual(collect({ cwd: dir }), []);
});

test('broken setup: no origin/main fails loudly', () => {
  const dir = repo({ withOrigin: false });
  assert.throws(() => collect({ cwd: dir }), GateSetupError);
});

test('broken setup: a corrupt stamp file fails', () => {
  const dir = repo();
  writeStamp(pass, { cwd: dir });
  writeFileSync(path.join(dir, '.review', 'stamp.json'), '{nope');
  assert.throws(() => collect({ cwd: dir }), GateSetupError);
});

test('review:stamp validates its arguments', () => {
  assert.deepEqual(
    parseStampArgs([
      '--verdict',
      'pass',
      '--critical',
      '0',
      '--important',
      '0',
      '--suggestion',
      '3',
    ]),
    { verdict: 'pass', findings: { critical: 0, important: 0, suggestion: 3 } },
  );
  assert.throws(() => parseStampArgs(['--verdict', 'pass']), /usage/);
  assert.throws(
    () =>
      parseStampArgs([
        '--verdict',
        'pass',
        '--critical',
        '1',
        '--important',
        '0',
        '--suggestion',
        '0',
      ]),
    /cannot pass/,
  );
});
