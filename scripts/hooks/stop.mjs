// Stop hook — when the agent is about to stop with unreviewed changes in src/, ask once for
// /review. It respects stop_hook_active, so it never loops (CHILL-001 AC-13).
import { existsSync } from 'node:fs';

import { checkReview, readStamp } from '../check-review.mjs';
import { REPO_ROOT, git, isMain } from '../lib/gate.mjs';
import { currentReviewId } from '../lib/review.mjs';
import { runHook } from './lib.mjs';

export const REASON =
  'There are unreviewed changes in src/. Run /review (it writes the stamp check:review needs) before you finish, or say why not.';

/** Pure decision. `unreviewedSrc()` says whether src/ has changes the stamp doesn't cover. */
export function decideStop(event, { unreviewedSrc }) {
  if (event.stop_hook_active) return { exitCode: 0 };
  if (!unreviewedSrc()) return { exitCode: 0 };
  return { exitCode: 0, stdout: `${JSON.stringify({ decision: 'block', reason: REASON })}\n` };
}

/** True when the change since origin/main touches src/ and the review stamp doesn't match it. */
export function hasUnreviewedSrc({ cwd = REPO_ROOT } = {}) {
  // The hook may start in a subfolder; the diff, the stamp and src/ are all at the top level.
  const root = git(['rev-parse', '--show-toplevel'], { cwd }).trim();
  const { base, reviewId, empty } = currentReviewId({ cwd: root });
  if (empty) return false;
  const changed = [
    ...git(['diff', '--name-only', base], { cwd: root }).split('\n'),
    ...git(['ls-files', '--others', '--exclude-standard'], { cwd: root }).split('\n'),
  ];
  if (!changed.some((f) => f.startsWith('src/'))) return false;
  return checkReview({ stamp: readStamp({ cwd: root }), reviewId }).length > 0;
}

if (isMain(import.meta.url)) {
  await runHook('stop', (event) => {
    const cwd = event.cwd && existsSync(event.cwd) ? event.cwd : REPO_ROOT;
    return decideStop(event, { unreviewedSrc: () => hasUnreviewedSrc({ cwd }) });
  });
}
