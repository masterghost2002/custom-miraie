// pnpm gates — runs every gate in parallel and prints each one's result and time; any failure
// fails the run. `--push` adds check:review (pre-push only) (CHILL-001).
import { spawn } from 'node:child_process';
import { existsSync } from 'node:fs';
import path from 'node:path';

import { REPO_ROOT, isMain } from './lib/gate.mjs';

/** Gates for `pnpm gates`. commit-msg runs at commit time; review only before a push. */
export const GATES = [
  'style-policy',
  'design-source',
  'feature',
  'testid',
  'ui-mock-policy',
  'env-policy',
  'secrets',
  'handbook-size',
  'agent-rules',
];
export const PUSH_GATES = [...GATES, 'review'];

const escape = (text) => text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const resultLine = (name) => new RegExp(`^[✓⚠] check:${escape(name)}(\\s|$)`, 'm');

/** Runs one gate script; resolves with its exit code, output and time. Never rejects. */
function runOne(name, { cwd, scriptsDir }) {
  const script = path.join(scriptsDir, `check-${name}.mjs`);
  const started = process.hrtime.bigint();
  const elapsed = () => Number(process.hrtime.bigint() - started) / 1e9;
  if (!existsSync(script)) {
    return Promise.resolve({
      name,
      code: 1,
      output: `  setup broken: ${script} not found`,
      seconds: 0,
    });
  }
  return new Promise((resolve) => {
    const child = spawn(process.execPath, [script], { cwd, stdio: ['ignore', 'pipe', 'pipe'] });
    let output = '';
    child.stdout.on('data', (chunk) => (output += chunk));
    child.stderr.on('data', (chunk) => (output += chunk));
    child.on('error', (error) =>
      resolve({ name, code: 1, output: `  ${error.message}`, seconds: elapsed() }),
    );
    child.on('close', (code, signal) => {
      let exit = code ?? (signal ? 1 : 0);
      let text = output.trimEnd();
      // A gate that passes always prints its ✓ (or ⚠) line; exit 0 without it means it never ran.
      if (exit === 0 && !resultLine(name).test(text)) {
        exit = 1;
        text = `${text ? `${text}\n` : ''}setup broken: the gate exited 0 but printed no ✓ check:${name} line`;
      }
      resolve({ name, code: exit, output: text, seconds: elapsed() });
    });
  });
}

/** Runs `gates` in parallel. Returns `{ results, failed, seconds, report }`. */
export async function runGates(
  gates,
  { cwd = REPO_ROOT, scriptsDir = path.join(REPO_ROOT, 'scripts') } = {},
) {
  if (gates.length === 0) throw new Error('no gates to run');
  const started = Date.now();
  const results = await Promise.all(gates.map((name) => runOne(name, { cwd, scriptsDir })));
  const seconds = (Date.now() - started) / 1000;
  const failed = results.filter((r) => r.code !== 0);
  const lines = [];
  for (const r of results) {
    const time = `${r.seconds.toFixed(2)}s`;
    if (r.code === 0) {
      // A passing gate may still print warnings; show them.
      const extra = r.output.split('\n').filter((l) => l && !l.startsWith('✓'));
      lines.push(`✓ check:${r.name}  ${time}`, ...extra.map((l) => `  ${l}`));
    } else {
      lines.push(`✖ check:${r.name}  ${time}`, ...r.output.split('\n').map((l) => `  ${l}`));
    }
  }
  lines.push(
    `gates: ${results.length - failed.length} passed, ${failed.length} failed in ${seconds.toFixed(1)}s`,
  );
  return { results, failed, seconds, report: lines.join('\n') };
}

if (isMain(import.meta.url)) {
  const gates = process.argv.includes('--push') ? PUSH_GATES : GATES;
  const { failed, report } = await runGates(gates);
  (failed.length ? process.stderr : process.stdout).write(`${report}\n`);
  process.exitCode = failed.length ? 1 : 0;
}
