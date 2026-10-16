// check:commit-msg — every commit says what it is and which ticket it belongs to:
// `type(scope): subject (CHILL-NNN)`, and the ticket folder must exist (CHILL-001).
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import path from 'node:path';

import { GateSetupError, REPO_ROOT, isMain, runGate } from './lib/gate.mjs';

export const RULE = 'commit-msg';
export const SEVERITY = 'error';

const FORMAT = /^(feat|fix|refactor|test|docs|chore)(\([a-z0-9-]+\))?: .+ \((CHILL-\d{3})\)$/;
const GIT_GENERATED = /^(Merge |Revert "|fixup! |squash! |amend! )/;
const EXAMPLE = 'feat(climate): add fan speed pill (CHILL-006)';

/** The subject line: the first non-comment, non-empty line. */
export function subjectOf(message) {
  return (
    message
      .split('\n')
      .map((line) => line.trimEnd())
      .find((line) => line && !line.startsWith('#')) ?? ''
  );
}

/** Pure check: `ticketExists(id)` says whether `specs/<id>-*` exists. */
export function checkCommitMessage(message, { ticketExists }) {
  const subject = subjectOf(message);
  if (GIT_GENERATED.test(subject)) return [];
  const match = subject.match(FORMAT);
  if (!match) {
    return [
      {
        path: 'commit message',
        line: 1,
        message: `"${subject}" does not match type(scope): subject (CHILL-NNN)`,
        fix: `types: feat fix refactor test docs chore — e.g. "${EXAMPLE}"`,
      },
    ];
  }
  if (!ticketExists(match[3])) {
    return [
      {
        path: 'commit message',
        line: 1,
        message: `${match[3]} has no specs/${match[3]}-* folder`,
        fix: 'use the ticket this work belongs to, or write its spec first (/spec)',
      },
    ];
  }
  return [];
}

/** Ticket IDs that have a spec folder. */
export function ticketsIn({ cwd = REPO_ROOT } = {}) {
  let names;
  try {
    names = readdirSync(path.join(cwd, 'specs'));
  } catch (error) {
    throw new GateSetupError(`cannot list specs/: ${error.message}`);
  }
  return new Set(names.map((n) => n.match(/^(CHILL-\d{3})-/)?.[1]).filter(Boolean));
}

export function collect({ cwd = REPO_ROOT, messageFile } = {}) {
  if (!messageFile)
    throw new GateSetupError('no commit message file given (usage: check-commit-msg.mjs <file>)');
  const file = path.resolve(cwd, messageFile);
  if (!existsSync(file)) throw new GateSetupError(`commit message file ${messageFile} not found`);
  const tickets = ticketsIn({ cwd });
  return checkCommitMessage(readFileSync(file, 'utf8'), { ticketExists: (id) => tickets.has(id) });
}

if (isMain(import.meta.url)) {
  await runGate(RULE, () => collect({ messageFile: process.argv[2] }), { severity: SEVERITY });
}
