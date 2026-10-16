// Shared plumbing for the Claude Code hooks: read the JSON event from stdin, map an absolute tool
// path to a repo-relative one, and never let a crashing hook block the agent (CHILL-001).
import path from 'node:path';

import { REPO_ROOT } from '../lib/gate.mjs';

/** Reads all of stdin as text. */
export async function readStdin(stream = process.stdin) {
  let text = '';
  for await (const chunk of stream) text += chunk;
  return text;
}

/** `file_path` from the tool input as a repo-relative POSIX path, or null if outside `root`. */
export function repoRelative(filePath, root = REPO_ROOT) {
  if (!filePath) return null;
  const absolute = path.resolve(root, filePath);
  const relative = path.relative(root, absolute);
  if (!relative || relative.startsWith('..') || path.isAbsolute(relative)) return null;
  return relative.split(path.sep).join('/');
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
