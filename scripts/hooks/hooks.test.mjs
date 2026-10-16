import { gitIn, tempRepo } from '../lib/test-git.mjs';

// Tests for the Claude Code hooks: pure decisions plus the real scripts fed sample hook JSON
// on stdin (CHILL-001 AC-3, AC-13, AC-14, AC-15).
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import {
  appendFileSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  symlinkSync,
  writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';

import { REPO_ROOT } from '../lib/gate.mjs';
import { formatTarget } from './post-tool-use.mjs';
import { contentAfter, decidePreToolUse } from './pre-tool-use.mjs';
import { REASON, decideStop, hasUnreviewedSrc } from './stop.mjs';

const here = path.dirname(fileURLToPath(import.meta.url));
const root = '/repo';
const boards = () => new Set(['design/boards/Climate.dc.html']);
const noFile = () => null;

function hook(name, event) {
  const result = spawnSync(process.execPath, [path.join(here, `${name}.mjs`)], {
    input: typeof event === 'string' ? event : JSON.stringify(event),
    encoding: 'utf8',
  });
  return { code: result.status, stdout: result.stdout, stderr: result.stderr };
}

const write = (file, content) => ({
  hook_event_name: 'PreToolUse',
  tool_name: 'Write',
  tool_input: { file_path: file, content },
});

test('AC-14: writing .env*, ios/**, android/** or the review stamp is blocked with the alternative', () => {
  const cases = {
    '/repo/.env.local': /\.env\.example/,
    '/repo/ios/Chill/AppDelegate.swift': /app\.json or a config plugin/,
    '/repo/android/app/build.gradle': /app\.json or a config plugin/,
    '/repo/.review/stamp.json': /run \/review/,
  };
  for (const [file, hint] of Object.entries(cases)) {
    const result = decidePreToolUse(write(file, 'x'), { root, readFile: noFile, boards });
    assert.equal(result.exitCode, 2, file);
    assert.match(result.stderr, hint);
  }
});

test('.env.example and ordinary files may be written', () => {
  for (const file of ['/repo/.env.example', '/repo/src/lib/miraie/status.ts', '/repo/README.md']) {
    assert.equal(
      decidePreToolUse(write(file, 'x'), { root, readFile: noFile, boards }).exitCode,
      0,
    );
  }
});

test('AC-3: writing a new screen without the Design note is blocked with the gate message', () => {
  const result = decidePreToolUse(write('/repo/src/features/climate/screen.tsx', 'export {};'), {
    root,
    readFile: noFile,
    boards,
  });
  assert.equal(result.exitCode, 2);
  assert.match(result.stderr, /check:design-source/);
  assert.match(result.stderr, /\/\/ Design: design\/boards\/<Board>\.dc\.html — <part>/);
});

test('a screen with the note, or a test file, may be written', () => {
  const ok = write(
    '/repo/src/features/climate/screen.tsx',
    '// Design: design/boards/Climate.dc.html — screen\n',
  );
  assert.equal(decidePreToolUse(ok, { root, readFile: noFile, boards }).exitCode, 0);
  const t = write('/repo/src/features/climate/__tests__/screen.test.tsx', 'test');
  assert.equal(decidePreToolUse(t, { root, readFile: noFile, boards }).exitCode, 0);
});

test('an Edit that removes the Design note is blocked; other edits pass', () => {
  const current = '// Design: design/boards/Climate.dc.html — screen\nconst a = 1;\n';
  const edit = (old_string, new_string) => ({
    tool_name: 'Edit',
    tool_input: { file_path: '/repo/src/ui/x.tsx', old_string, new_string },
  });
  const readFile = () => current;
  assert.equal(
    decidePreToolUse(edit('const a = 1;', 'const a = 2;'), { root, readFile, boards }).exitCode,
    0,
  );
  const removed = decidePreToolUse(
    edit('// Design: design/boards/Climate.dc.html — screen\n', ''),
    {
      root,
      readFile,
      boards,
    },
  );
  assert.equal(removed.exitCode, 2);
});

test('contentAfter applies Edit, replace_all and MultiEdit like the tools do', () => {
  assert.equal(contentAfter('Edit', { old_string: 'a', new_string: 'b' }, 'a a'), 'b a');
  assert.equal(
    contentAfter('Edit', { old_string: 'a', new_string: 'b', replace_all: true }, 'a a'),
    'b b',
  );
  assert.equal(
    contentAfter(
      'MultiEdit',
      {
        edits: [
          { old_string: 'a', new_string: '$&' },
          { old_string: 'c', new_string: 'd' },
        ],
      },
      'ac',
    ),
    '$&d',
  );
  assert.equal(contentAfter('Edit', { old_string: 'a', new_string: 'b' }, null), null);
});

test('other tools and paths outside the repo are let through', () => {
  assert.equal(
    decidePreToolUse(
      { tool_name: 'Bash', tool_input: { command: 'ls' } },
      { root, readFile: noFile, boards },
    ).exitCode,
    0,
  );
  assert.equal(
    decidePreToolUse(write('/tmp/.env', 'x'), { root, readFile: noFile, boards }).exitCode,
    0,
  );
});

test('AC-14 end to end: the real pre-tool-use script exits 2 for ios/', () => {
  const result = hook('pre-tool-use', {
    ...write(path.join(REPO_ROOT, 'ios', 'Podfile'), 'x'),
    cwd: REPO_ROOT,
  });
  assert.equal(result.code, 2);
  assert.match(result.stderr, /Blocked: ios\/Podfile/);
});

test('AC-14: the pre-tool-use hook started through a symlink still blocks ios/', () => {
  const link = path.join(mkdtempSync(path.join(tmpdir(), 'hooklink-')), 'pre.mjs');
  symlinkSync(path.join(here, 'pre-tool-use.mjs'), link);
  const result = spawnSync(process.execPath, [link], {
    input: JSON.stringify({
      ...write(path.join(REPO_ROOT, 'ios', 'Podfile'), 'x'),
      cwd: REPO_ROOT,
    }),
    encoding: 'utf8',
  });
  assert.equal(result.status, 2);
});

test('AC-3 end to end: the real script blocks a new src/ui file without the note', () => {
  const result = hook('pre-tool-use', {
    ...write(path.join(REPO_ROOT, 'src', 'ui', 'brand-new.tsx'), 'export {};'),
    cwd: REPO_ROOT,
  });
  assert.equal(result.code, 2);
  assert.match(result.stderr, /check:design-source/);
});

test('a hook that crashes lets the work continue (exit 0 with a warning)', () => {
  for (const name of ['pre-tool-use', 'post-tool-use', 'stop']) {
    const result = hook(name, '{not json');
    assert.equal(result.code, 0, name);
    assert.match(result.stderr, /crashed and was skipped/);
  }
});

test('AC-15: post-tool-use formats the file that was just edited', () => {
  const dir = mkdtempSync(path.join(tmpdir(), 'fmt-'));
  writeFileSync(path.join(dir, 'package.json'), '{}');
  writeFileSync(path.join(dir, 'a.ts'), 'const   a  =  {b:1}\n');
  const result = hook('post-tool-use', {
    hook_event_name: 'PostToolUse',
    tool_name: 'Edit',
    tool_input: { file_path: path.join(dir, 'a.ts') },
    cwd: dir,
  });
  assert.equal(result.code, 0);
  assert.equal(readFileSync(path.join(dir, 'a.ts'), 'utf8'), 'const a = { b: 1 };\n');
});

test('post-tool-use ignores other tools and generated folders', () => {
  assert.equal(
    formatTarget({ tool_name: 'Read', tool_input: { file_path: '/r/a.ts' } }, '/r'),
    null,
  );
  assert.equal(
    formatTarget({ tool_name: 'Write', tool_input: { file_path: '/r/ios/a.swift' } }, '/r'),
    null,
  );
  assert.equal(
    formatTarget({ tool_name: 'Write', tool_input: { file_path: '/r/src/a.ts' } }, '/r'),
    'src/a.ts',
  );
});

test('AC-13: with unreviewed src/ changes the Stop hook asks once for /review', () => {
  const result = decideStop({ stop_hook_active: false }, { unreviewedSrc: () => true });
  assert.deepEqual(JSON.parse(result.stdout), { decision: 'block', reason: REASON });
});

test('AC-13: when stop_hook_active is set it never asks again (no loop)', () => {
  let asked = false;
  const result = decideStop({ stop_hook_active: true }, { unreviewedSrc: () => (asked = true) });
  assert.deepEqual(result, { exitCode: 0 });
  assert.equal(asked, false);
});

test('no unreviewed src/ change: the agent may stop', () => {
  assert.deepEqual(decideStop({ stop_hook_active: false }, { unreviewedSrc: () => false }), {
    exitCode: 0,
  });
});

test('hasUnreviewedSrc: src/ changes without a stamp count, docs-only changes do not', () => {
  const dir = tempRepo('stop-');
  const run = (...args) => gitIn(dir, ...args);
  writeFileSync(path.join(dir, 'README.md'), 'x\n');
  run('add', '.');
  run('commit', '-q', '-m', 'init');
  run('update-ref', 'refs/remotes/origin/main', 'HEAD');
  appendFileSync(path.join(dir, 'README.md'), 'docs only\n');
  assert.equal(hasUnreviewedSrc({ cwd: dir }), false);
  mkdirSync(path.join(dir, 'src'));
  writeFileSync(path.join(dir, 'src', 'a.ts'), 'code');
  assert.equal(hasUnreviewedSrc({ cwd: dir }), true);
});
