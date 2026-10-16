// check:secrets — .env files and credentials never reach git: MirAIe passwords and tokens belong
// in the phone's secure storage only (CHILL-001).
import { execFileSync } from 'node:child_process';

import {
  GateSetupError,
  REPO_ROOT,
  applyIgnores,
  git,
  isMain,
  lineOf,
  listFiles,
  readFiles,
  runGate,
} from './lib/gate.mjs';

export const RULE = 'secrets';
export const SEVERITY = 'error';

const PRIVATE_KEY = /-----BEGIN (?:[A-Z]+ )*PRIVATE KEY-----/g;
// A JWT-looking value assigned to a token/password/secret key: `accessToken: "eyJ…"`.
const JWT_ASSIGNED =
  /\b[\w-]*(?:token|password|passwd|secret|authorization)[\w-]*["']?\s*[:=]\s*["'`](?:Bearer\s+)?eyJ[\w-]{8,}\.[\w-]{8,}\.[\w-]{8,}/gi;

/** `.env`, `.env.local`, `config/.env.production` … but not `.env.example`. */
export function isEnvFile(file) {
  const base = file.split('/').pop();
  return (base === '.env' || base.startsWith('.env.')) && base !== '.env.example';
}

/** Pure check: `files` = [{ path, text }] (text may be null for binaries). */
export function checkSecrets(files) {
  const violations = [];
  for (const file of files) {
    if (isEnvFile(file.path)) {
      violations.push({
        path: file.path,
        message: 'an .env file must never be committed',
        fix: `unstage it (git restore --staged ${file.path}); keep values in .env.local, list names in .env.example`,
      });
      continue;
    }
    if (typeof file.text !== 'string' || file.text.includes('\0')) continue;
    const found = [];
    for (const pattern of [PRIVATE_KEY, JWT_ASSIGNED]) {
      for (const match of file.text.matchAll(pattern)) {
        found.push({
          path: file.path,
          line: lineOf(file.text, match.index),
          message: pattern === PRIVATE_KEY ? 'a private key block' : 'what looks like a real token',
          fix: 'remove it; credentials live only in expo-secure-store on the phone (tests use obvious fakes)',
        });
      }
    }
    violations.push(...applyIgnores(RULE, file, found));
  }
  return violations;
}

/** The staged version of each staged file (what the commit will contain). */
export function readStaged({ cwd = REPO_ROOT } = {}) {
  const names = git(['diff', '--cached', '--name-only', '--diff-filter=ACMR'], { cwd })
    .split('\n')
    .filter(Boolean);
  return names.map((name) => {
    try {
      const text = execFileSync('git', ['show', `:${name}`], {
        cwd,
        encoding: 'utf8',
        maxBuffer: 64 * 1024 * 1024,
        stdio: ['ignore', 'pipe', 'pipe'],
      });
      return { path: name, text };
    } catch (error) {
      throw new GateSetupError(`cannot read the staged ${name}: ${error.message}`);
    }
  });
}

export function collect({ cwd = REPO_ROOT, staged = false } = {}) {
  if (staged) return checkSecrets(readStaged({ cwd }));
  const paths = listFiles({ cwd });
  if (paths.length === 0) throw new GateSetupError('git lists no files');
  return checkSecrets(readFiles(paths, { cwd }));
}

if (isMain(import.meta.url)) {
  const staged = process.argv.includes('--staged');
  await runGate(RULE, () => collect({ staged }), { severity: SEVERITY });
}
