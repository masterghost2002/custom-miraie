// Test-only: importing this module scrubs the git environment of the test process, so a test that
// builds a temp repo can never reach the real one. Git exports GIT_DIR, GIT_INDEX_FILE, … to hooks
// (pre-push runs the gate tests), and every child git would otherwise follow them (CHILL-001).
import { execFileSync } from 'node:child_process';
import { mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';

export const LEAKY_GIT_VARS = [
  'GIT_DIR',
  'GIT_WORK_TREE',
  'GIT_INDEX_FILE',
  'GIT_COMMON_DIR',
  'GIT_PREFIX',
  'GIT_OBJECT_DIRECTORY',
  'GIT_ALTERNATE_OBJECT_DIRECTORIES',
  'GIT_NAMESPACE',
];

/** Removes repo-pointing variables and ignores the owner's global/system git config. */
export function isolateGitEnv(env = process.env) {
  for (const name of LEAKY_GIT_VARS) delete env[name];
  env.GIT_CONFIG_GLOBAL = '/dev/null';
  env.GIT_CONFIG_NOSYSTEM = '1';
  return env;
}

isolateGitEnv();

// No hooks (the owner has a global core.hooksPath), no signing, a throwaway identity.
const SAFE = [
  '-c',
  'core.hooksPath=/dev/null',
  '-c',
  'commit.gpgsign=false',
  '-c',
  'user.name=Gate Test',
  '-c',
  'user.email=gate-test@example.invalid',
];

/** Runs git in `dir` with the scrubbed environment. */
export function gitIn(dir, ...args) {
  return execFileSync('git', [...SAFE, ...args], {
    cwd: dir,
    env: process.env,
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
  });
}

/** A new empty repository on branch main in a temp folder. */
export function tempRepo(prefix = 'gate-') {
  const dir = mkdtempSync(path.join(tmpdir(), prefix));
  gitIn(dir, 'init', '-q', '-b', 'main');
  return dir;
}
