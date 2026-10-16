// Shared plumbing for the Claude Code hooks: read the JSON event from stdin, find the repo a
// target file belongs to, and never let a crashing hook block the agent (CHILL-001).
import { existsSync } from 'node:fs';
import path from 'node:path';

/** Reads all of stdin as text. */
export async function readStdin(stream = process.stdin) {
  let text = '';
  for await (const chunk of stream) text += chunk;
  return text;
}

/** The tool's target as an absolute path (relative paths are relative to the event's cwd). */
export function absoluteTarget(filePath, cwd = process.cwd()) {
  return filePath ? path.resolve(cwd, filePath) : null;
}

/**
 * The checkout a file belongs to: the nearest folder at or above it holding `.git` (a folder in
 * a repo, a file in a worktree), or null. Judged from the TARGET, never from the agent's cwd, so a
 * write into a sibling worktree gets that worktree's rules.
 */
export function repoRootOf(absolute) {
  let dir = path.dirname(absolute);
  for (;;) {
    if (existsSync(path.join(dir, '.git'))) return dir;
    const parent = path.dirname(dir);
    if (parent === dir) return null;
    dir = parent;
  }
}

/** `absolute` relative to `root`, as a POSIX path. */
export function relativeTo(root, absolute) {
  return path.relative(root, absolute).split(path.sep).join('/');
}

/**
 * Runs a hook body. The body returns `{ exitCode, stdout?, stderr? }`. If the hook itself
 * crashes (bad JSON, a bug), it warns on stderr and exits 0: the gates at push time are the
 * safety net, a broken hook must never lock the agent out.
 */
export async function runHook(name, body) {
  try {
    const input = JSON.parse(await readStdin());
    const result = await body(input);
    if (result.stdout) process.stdout.write(result.stdout);
    if (result.stderr) process.stderr.write(result.stderr);
    process.exitCode = result.exitCode ?? 0;
  } catch (error) {
    process.stderr.write(`⚠ hook ${name} crashed and was skipped: ${error.message}\n`);
    process.exitCode = 0;
  }
}
