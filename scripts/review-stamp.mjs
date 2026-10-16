// pnpm review:stamp — writes .review/stamp.json after /review passes. The stamp holds a
// fingerprint of the exact diff, so any later change makes check:review fail (CHILL-001).
import { mkdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { parseArgs } from 'node:util';

import { REPO_ROOT, isMain } from './lib/gate.mjs';
import { REVIEW_EFFORT, REVIEW_MODEL, STAMP_FILE, currentReviewId } from './lib/review.mjs';

/** Validates CLI options; returns the stamp's findings or throws with a usage message. */
export function parseStampArgs(argv) {
  const { values } = parseArgs({
    args: argv,
    options: {
      verdict: { type: 'string' },
      critical: { type: 'string' },
      important: { type: 'string' },
      suggestion: { type: 'string' },
    },
    strict: true,
  });
  const usage =
    'usage: pnpm review:stamp --verdict pass --critical 0 --important 0 --suggestion <n>';
  if (values.verdict !== 'pass' && values.verdict !== 'fail') throw new Error(usage);
  const count = (name) => {
    const n = Number(values[name]);
    if (values[name] === undefined || !Number.isInteger(n) || n < 0) throw new Error(usage);
    return n;
  };
  const findings = {
    critical: count('critical'),
    important: count('important'),
    suggestion: count('suggestion'),
  };
  if (values.verdict === 'pass' && (findings.critical > 0 || findings.important > 0)) {
    throw new Error(
      'a review with critical or important findings cannot pass — fix them and run /review again',
    );
  }
  return { verdict: values.verdict, findings };
}

/** Writes the stamp for the current diff and returns it. */
export function writeStamp({ verdict, findings }, { cwd = REPO_ROOT, now = new Date() } = {}) {
  const { base, reviewId } = currentReviewId({ cwd });
  const stamp = {
    verdict,
    model: REVIEW_MODEL,
    effort: REVIEW_EFFORT,
    findings,
    reviewId,
    base,
    createdAt: now.toISOString(),
  };
  const file = path.join(cwd, STAMP_FILE);
  mkdirSync(path.dirname(file), { recursive: true });
  writeFileSync(file, `${JSON.stringify(stamp, null, 2)}\n`);
  return stamp;
}

if (isMain(import.meta.url)) {
  try {
    const stamp = writeStamp(parseStampArgs(process.argv.slice(2)));
    process.stdout.write(`✓ review stamp written: ${stamp.verdict}, reviewId ${stamp.reviewId}\n`);
  } catch (error) {
    process.stderr.write(`✖ review:stamp\n  ${error.message}\n`);
    process.exitCode = 1;
  }
}
