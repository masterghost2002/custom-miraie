// check:design-source — every screen and primitive says which board it was built from, so
// nobody (agent or person) guesses a design (CHILL-001).
import { readdirSync } from 'node:fs';
import path from 'node:path';

import {
  GateSetupError,
  REPO_ROOT,
  isMain,
  isTestFile,
  listFiles,
  readFiles,
  runGate,
} from './lib/gate.mjs';

export const RULE = 'design-source';
export const SEVERITY = 'error';

const BOARD_NOTE = /^\/\/ Design: (design\/boards\/[\w-]+\.dc\.html) — \S.*$/;
const NONE_NOTE = /^\/\/ Design: none — \S.*\(CHILL-\d{3}\)\s*$/;
const FORMAT =
  'start the file with `// Design: design/boards/<Board>.dc.html — <part>` or `// Design: none — <reason> (CHILL-NNN)`';

/** Files this rule covers: non-test source files in src/features and src/ui. */
export function appliesTo(file) {
  return /^src\/(features|ui)\//.test(file) && /\.(ts|tsx|js|jsx)$/.test(file) && !isTestFile(file);
}

/**
 * Checks one file's first line. `boards` = set of existing board paths (`design/boards/X.dc.html`).
 * Returns a violation or null. Shared with the PreToolUse hook.
 */
export function checkDesignNote(file, boards) {
  const firstLine = file.text.split('\n', 1)[0] ?? '';
  const board = firstLine.match(BOARD_NOTE);
  if (board) {
    if (boards.has(board[1])) return null;
    return {
      path: file.path,
      line: 1,
      message: `the Design note names ${board[1]}, which does not exist`,
      fix: `use one of: ${[...boards].sort().join(', ')}`,
    };
  }
  if (NONE_NOTE.test(firstLine)) return null;
  return {
    path: file.path,
    line: 1,
    message: 'missing or malformed `// Design:` note on line 1',
    fix: FORMAT,
  };
}

/** Pure check: `files` = [{ path, text }], `boards` = Set of board paths. */
export function checkDesignSource(files, { boards }) {
  return files
    .filter((file) => appliesTo(file.path))
    .map((file) => checkDesignNote(file, boards))
    .filter(Boolean);
}

/** The board files on disk; none at all means the setup is broken. */
export function readBoards({ cwd = REPO_ROOT } = {}) {
  let names;
  try {
    names = readdirSync(path.join(cwd, 'design', 'boards'));
  } catch (error) {
    throw new GateSetupError(`cannot list design/boards: ${error.message}`);
  }
  const boards = new Set(
    names.filter((n) => n.endsWith('.dc.html')).map((n) => `design/boards/${n}`),
  );
  if (boards.size === 0) throw new GateSetupError('design/boards has no *.dc.html boards');
  return boards;
}

export function collect({ cwd = REPO_ROOT } = {}) {
  const boards = readBoards({ cwd });
  const files = listFiles({ cwd }).filter(appliesTo);
  return checkDesignSource(readFiles(files, { cwd }), { boards });
}

if (isMain(import.meta.url)) await runGate(RULE, () => collect(), { severity: SEVERITY });
