// check:review — a push is blocked unless /review passed on exactly this change; the stamp's
// fingerprint must match the current diff (CHILL-001).
import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';

import { GateSetupError, REPO_ROOT, isMain, runGate } from './lib/gate.mjs';
import { STAMP_FILE, currentReviewId } from './lib/review.mjs';

export const RULE = 'review';
export const SEVERITY = 'error';

/** Pure check: `stamp` (parsed JSON or null) against the current `reviewId`. */
export function checkReview({ stamp, reviewId, empty = false }) {
  if (empty) return [];
  const fail = (message, fix = 'Run /review.') => [{ path: STAMP_FILE, message, fix }];
  if (!stamp) return fail('no review stamp for this change');
  if (stamp.verdict !== 'pass') return fail(`the last review's verdict was "${stamp.verdict}"`);
  if ((stamp.findings?.critical ?? 1) > 0 || (stamp.findings?.important ?? 1) > 0) {
    return fail('the stamp records critical or important findings');
  }
  if (stamp.reviewId !== reviewId) return fail('Code changed after review.');
  return [];
}

export function readStamp({ cwd = REPO_ROOT } = {}) {
  const file = path.join(cwd, STAMP_FILE);
  if (!existsSync(file)) return null;
  try {
    return JSON.parse(readFileSync(file, 'utf8'));
  } catch (error) {
    throw new GateSetupError(`${STAMP_FILE} is not valid JSON: ${error.message}`);
  }
}

export function collect({ cwd = REPO_ROOT } = {}) {
  const { reviewId, empty } = currentReviewId({ cwd });
  return checkReview({ stamp: readStamp({ cwd }), reviewId, empty });
}

if (isMain(import.meta.url)) await runGate(RULE, () => collect(), { severity: SEVERITY });
