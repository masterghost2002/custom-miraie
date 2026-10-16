// PostToolUse hook — formats the file the agent just wrote with Prettier, so formatting never
// shows up in review. A failure here only warns (CHILL-001 AC-15).
import { execFileSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import path from 'node:path';

import { REPO_ROOT, isMain } from '../lib/gate.mjs';
import { absoluteTarget, relativeTo, repoRootOf, runHook } from './lib.mjs';

export const EDIT_TOOLS = new Set(['Write', 'Edit', 'MultiEdit']);

/** `{ root, file }` to format — the target's own checkout and its path there — or null. */
export function formatTarget(event, rootOf = repoRootOf) {
  if (!EDIT_TOOLS.has(event.tool_name)) return null;
  const absolute = absoluteTarget(event.tool_input?.file_path, event.cwd);
  const root = absolute && rootOf(absolute);
  if (!root) return null;
  const file = relativeTo(root, absolute);
  if (/^(node_modules|ios|android|\.review)\//.test(file) || file.includes('/node_modules/'))
    return null;
  return { root, file };
}

export function formatFile(file, { root }) {
  const prettier = path.join(REPO_ROOT, 'node_modules', '.bin', 'prettier');
  if (!existsSync(prettier)) throw new Error('prettier is not installed (run pnpm install)');
  execFileSync(prettier, ['--write', '--ignore-unknown', '--log-level', 'warn', file], {
    cwd: root,
    stdio: ['ignore', 'pipe', 'pipe'],
  });
}

if (isMain(import.meta.url)) {
  await runHook('post-tool-use', (event) => {
    const target = formatTarget(event);
    if (!target || !existsSync(path.join(target.root, target.file))) return { exitCode: 0 };
    try {
      formatFile(target.file, { root: target.root });
      return { exitCode: 0 };
    } catch (error) {
      return {
        exitCode: 0,
        stderr: `⚠ prettier could not format ${target.file}: ${error.message}\n`,
      };
    }
  });
}
