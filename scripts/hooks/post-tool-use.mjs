// PostToolUse hook — formats the file the agent just wrote with Prettier, so formatting never
// shows up in review. A failure here only warns (CHILL-001 AC-15).
import { execFileSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import path from 'node:path';

import { REPO_ROOT, isMain } from '../lib/gate.mjs';
import { repoRelative, runHook } from './lib.mjs';

export const EDIT_TOOLS = new Set(['Write', 'Edit', 'MultiEdit']);

/** The repo-relative file to format, or null. */
export function formatTarget(event, root = REPO_ROOT) {
  if (!EDIT_TOOLS.has(event.tool_name)) return null;
  const file = repoRelative(event.tool_input?.file_path, root);
  if (!file || /^(node_modules|ios|android|\.review)\//.test(file)) return null;
  return file;
}

export function formatFile(file, { root = REPO_ROOT } = {}) {
  const prettier = path.join(REPO_ROOT, 'node_modules', '.bin', 'prettier');
  if (!existsSync(prettier)) throw new Error('prettier is not installed (run pnpm install)');
  execFileSync(prettier, ['--write', '--ignore-unknown', '--log-level', 'warn', file], {
    cwd: root,
    stdio: ['ignore', 'pipe', 'pipe'],
  });
}

if (isMain(import.meta.url)) {
  await runHook('post-tool-use', (event) => {
    const root = event.cwd && existsSync(event.cwd) ? event.cwd : REPO_ROOT;
    const file = formatTarget(event, root);
    if (!file || !existsSync(path.join(root, file))) return { exitCode: 0 };
    try {
      formatFile(file, { root });
      return { exitCode: 0 };
    } catch (error) {
      return { exitCode: 0, stderr: `⚠ prettier could not format ${file}: ${error.message}\n` };
    }
  });
}
