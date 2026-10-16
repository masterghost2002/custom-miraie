// The review fingerprint shared by the stamp writer and check:review: a hash of everything that
// would be pushed — committed and uncommitted changes since the merge-base with origin/main, plus
// new untracked files (CHILL-001).
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import path from 'node:path';

import { GateSetupError, REPO_ROOT, git } from './gate.mjs';

export const STAMP_FILE = '.review/stamp.json';
export const REVIEW_MODEL = 'claude-opus-5-5';
export const REVIEW_EFFORT = 'xhigh';

/** The merge-base with origin/main; missing origin/main is a broken setup, never a pass. */
export function reviewBase({ cwd = REPO_ROOT } = {}) {
  try {
    git(['rev-parse', '--verify', '--quiet', 'refs/remotes/origin/main'], { cwd });
  } catch {
    throw new GateSetupError('origin/main not found — run `git fetch origin main` first');
  }
  return git(['merge-base', 'origin/main', 'HEAD'], { cwd }).trim();
}

/** The exact change under review: `git diff <base>` plus untracked files. */
export function reviewDiff({ cwd = REPO_ROOT } = {}) {
  const base = reviewBase({ cwd });
  let diff = git(['diff', '--binary', base, '--', '.', ':(exclude).review'], { cwd });
  const untracked = git(['ls-files', '--others', '--exclude-standard'], { cwd })
    .split('\n')
    .filter(Boolean)
    .sort();
  for (const file of untracked) {
    diff += `\n--- untracked ${file}\n${readFileSync(path.join(cwd, file)).toString('base64')}`;
  }
  return { base, diff };
}

/** First 16 hex characters of the SHA-256 of the diff. */
export function reviewIdOf(diff) {
  return createHash('sha256').update(diff).digest('hex').slice(0, 16);
}

export function currentReviewId({ cwd = REPO_ROOT } = {}) {
  const { base, diff } = reviewDiff({ cwd });
  return { base, reviewId: reviewIdOf(diff), empty: diff.length === 0 };
}
