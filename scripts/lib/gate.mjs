// Shared helpers for every gate (scripts/check-*.mjs) and Claude hook, so they all read files the
// same way and print the same report format (CHILL-001).
import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

/** Thrown when a gate cannot do its job (no git, missing file, nothing matched). Never a pass. */
export class GateSetupError extends Error {
  constructor(message) {
    super(message);
    this.name = 'GateSetupError';
  }
}

/** Repo root: the folder that holds package.json, two levels up from scripts/lib. */
export const REPO_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');

/** Runs git and returns stdout; any failure is a setup error. */
export function git(args, { cwd = REPO_ROOT } = {}) {
  try {
    return execFileSync('git', args, {
      cwd,
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'pipe'],
      maxBuffer: 64 * 1024 * 1024,
    });
  } catch (error) {
    const detail = error.stderr?.toString().trim() || error.message;
    throw new GateSetupError(`git ${args.join(' ')} failed: ${detail}`);
  }
}

/** Tracked and new (not ignored) files, so a file the agent just wrote is checked too. */
export function listFiles({ cwd = REPO_ROOT } = {}) {
  return git(['ls-files', '--cached', '--others', '--exclude-standard'], { cwd })
    .split('\n')
    .filter(Boolean)
    .filter((file) => existsSync(path.join(cwd, file)));
}

/** Files staged for the next commit (added, copied, modified, renamed). */
export function stagedFiles({ cwd = REPO_ROOT } = {}) {
  return git(['diff', '--cached', '--name-only', '--diff-filter=ACMR'], { cwd })
    .split('\n')
    .filter(Boolean);
}

/** Reads files as `{ path, text }`; an unreadable file is a setup error. */
export function readFiles(paths, { cwd = REPO_ROOT } = {}) {
  return paths.map((file) => {
    try {
      return { path: file, text: readFileSync(path.join(cwd, file), 'utf8') };
    } catch (error) {
      throw new GateSetupError(`cannot read ${file}: ${error.message}`);
    }
  });
}

/** A test file: anything under __tests__/ or named *.test.* / *.spec.*. */
export function isTestFile(file) {
  return /(^|\/)__tests__\//.test(file) || /\.(test|spec)\.[cm]?[jt]sx?$/.test(file);
}

/** Source files the app rules apply to. */
export function isSourceFile(file) {
  return /\.(ts|tsx|js|jsx|mjs|cjs)$/.test(file);
}

/** 1-based line number of a character offset. */
export function lineOf(text, index) {
  let line = 1;
  for (let i = 0; i < index && i < text.length; i += 1) if (text[i] === '\n') line += 1;
  return line;
}

const ignorePattern = (rule) =>
  new RegExp(
    String.raw`(?:\/\/|\/\*|#)\s*${rule}-ignore-next-line(?::[ \t]*([^\n]*?))?[ \t]*(?:\*\/[ \t]*\}?)?[ \t]*$`,
  );

/**
 * Drops violations on a line preceded by `// <rule>-ignore-next-line: <reason>` and adds a
 * violation for every ignore comment without a reason. `violations` are for one file.
 */
export function applyIgnores(rule, file, violations) {
  const lines = file.text.split('\n');
  const pattern = ignorePattern(rule);
  const ignored = new Set();
  const missingReason = [];
  lines.forEach((text, index) => {
    const match = text.match(pattern);
    if (!match) return;
    if (!match[1] || !match[1].trim()) {
      missingReason.push({
        path: file.path,
        line: index + 1,
        message: `${rule}-ignore-next-line has no reason`,
        fix: `write why after the colon: // ${rule}-ignore-next-line: <reason>`,
      });
      return;
    }
    ignored.add(index + 2);
  });
  return [...violations.filter((v) => !ignored.has(v.line)), ...missingReason];
}

/**
 * Formats a gate's result. `violations`: `[{ path, line?, message, fix }]`.
 * Returns `{ output, exitCode }` — exit 1 only for errors.
 */
export function formatReport(rule, violations, { severity = 'error' } = {}) {
  const name = `check:${rule}`;
  if (violations.length === 0) return { output: `✓ ${name}`, exitCode: 0 };
  const mark = severity === 'error' ? '✖' : '⚠';
  const lines = [`${mark} ${name}`];
  for (const v of violations) {
    lines.push(`  ${v.path}${v.line ? `:${v.line}` : ''}`);
    lines.push(`  ${v.message} — ${v.fix}`);
  }
  const noun = severity === 'error' ? 'error' : 'warning';
  lines.push(`${name}: ${violations.length} ${noun}${violations.length === 1 ? '' : 's'}`);
  return { output: lines.join('\n'), exitCode: severity === 'error' ? 1 : 0 };
}

/** Formats a broken setup: always a failure. */
export function formatSetupError(rule, error) {
  return {
    output: `✖ check:${rule}\n  setup broken: ${error.message} — fix the setup; a gate never passes when it cannot run\ncheck:${rule}: 1 error`,
    exitCode: 1,
  };
}

/** True when the module at `metaUrl` is the script node was started with. */
export function isMain(metaUrl) {
  return process.argv[1] !== undefined && path.resolve(process.argv[1]) === fileURLToPath(metaUrl);
}

/**
 * CLI wrapper used by every gate: runs `collect()` (which returns violations), prints the report
 * and exits. Any thrown error — setup or bug — fails the gate.
 */
export async function runGate(rule, collect, { severity = 'error' } = {}) {
  let result;
  try {
    result = formatReport(rule, await collect(), { severity });
  } catch (error) {
    result = formatSetupError(rule, error);
  }
  const stream = result.exitCode === 0 ? process.stdout : process.stderr;
  stream.write(`${result.output}\n`);
  process.exitCode = result.exitCode;
  return result;
}
