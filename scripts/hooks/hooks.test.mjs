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
// Pure tests: files under /repo belong to the repo at /repo; anything else is in no repo.
const rootOf = (absolute) => (absolute.startsWith('/repo/') ? '/repo' : null);
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
    const result = decidePreToolUse(write(file, 'x'), { rootOf, readFile: noFile, boards });
    assert.equal(result.exitCode, 2, file);
    assert.match(result.stderr, hint);
  }
});

test('.env.example and ordinary files may be written', () => {
  for (const file of ['/repo/.env.example', '/repo/src/lib/miraie/status.ts', '/repo/README.md']) {
    assert.equal(
      decidePreToolUse(write(file, 'x'), { rootOf, readFile: noFile, boards }).exitCode,
      0,
    );
  }
});

test('AC-3: writing a new screen without the Design note is blocked with the gate message', () => {
  const result = decidePreToolUse(write('/repo/src/features/climate/screen.tsx', 'export {};'), {
    rootOf,
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
  assert.equal(decidePreToolUse(ok, { rootOf, readFile: noFile, boards }).exitCode, 0);
  const t = write('/repo/src/features/climate/__tests__/screen.test.tsx', 'test');
  assert.equal(decidePreToolUse(t, { rootOf, readFile: noFile, boards }).exitCode, 0);
});

test('an Edit that removes the Design note is blocked; other edits pass', () => {
  const current = '// Design: design/boards/Climate.dc.html — screen\nconst a = 1;\n';
  const edit = (old_string, new_string) => ({
    tool_name: 'Edit',
    tool_input: { file_path: '/repo/src/ui/x.tsx', old_string, new_string },
  });
  const readFile = () => current;
  assert.equal(
    decidePreToolUse(edit('const a = 1;', 'const a = 2;'), { rootOf, readFile, boards }).exitCode,
    0,
  );
  const removed = decidePreToolUse(
    edit('// Design: design/boards/Climate.dc.html — screen\n', ''),
    {
      rootOf,
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

test('other tools, and ordinary files outside any repo, are let through', () => {
  assert.equal(
    decidePreToolUse(
      { tool_name: 'Bash', tool_input: { command: 'ls' } },
      { rootOf, readFile: noFile, boards },
    ).exitCode,
    0,
  );
  assert.equal(
    decidePreToolUse(write('/tmp/notes.md', 'x'), { rootOf, readFile: noFile, boards }).exitCode,
    0,
  );
});

test('an env file is blocked anywhere, even outside every repo (.env, .env.local, .envrc)', () => {
  for (const file of ['/tmp/.env', '/elsewhere/project/.env.local']) {
    assert.equal(
      decidePreToolUse(write(file, 'x'), { rootOf, readFile: noFile, boards }).exitCode,
      2,
      file,
    );
  }
});

/** A parent folder with two checkouts, like the main repo and a sibling worktree. */
function siblingCheckouts() {
  const parent = mkdtempSync(path.join(tmpdir(), 'siblings-'));
  for (const name of ['main', 'wt']) {
    const dir = path.join(parent, name);
    mkdirSync(path.join(dir, 'design', 'boards'), { recursive: true });
    writeFileSync(path.join(dir, 'design', 'boards', 'Main.dc.html'), '<board/>');
    writeFileSync(path.join(dir, 'package.json'), '{}');
    gitIn(parent, 'init', '-q', name);
  }
  return parent;
}

test('AC-14: writes into a sibling worktree are judged by that worktree, not by cwd', () => {
  const parent = siblingCheckouts();
  const cwd = path.join(parent, 'main');
  const wt = path.join(parent, 'wt');
  const blocked = [
    path.join(wt, '.env.local'),
    path.join(wt, 'ios', 'Podfile'),
    path.join(wt, 'src', 'ui', 'new-thing.tsx'),
  ];
  for (const file of blocked) {
    const result = hook('pre-tool-use', { ...write(file, 'export {};'), cwd });
    assert.equal(result.code, 2, file);
  }
  const withNote = hook('pre-tool-use', {
    ...write(
      path.join(wt, 'src', 'ui', 'new-thing.tsx'),
      '// Design: design/boards/Main.dc.html — x\n',
    ),
    cwd,
  });
  assert.equal(withNote.code, 0, withNote.stderr);
});

test('AC-14: with cwd moved into node_modules, ios/ in the repo is still blocked', () => {
  const result = hook('pre-tool-use', {
    ...write(path.join(REPO_ROOT, 'ios', 'Podfile'), 'x'),
    cwd: path.join(REPO_ROOT, 'node_modules', 'react'),
  });
  assert.equal(result.code, 2);
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

test('AC-15: post-tool-use formats the edited file, in its own repo even when cwd is elsewhere', () => {
  const dir = tempRepo('fmt-');
  writeFileSync(path.join(dir, 'package.json'), '{}');
  writeFileSync(path.join(dir, 'a.ts'), 'const   a  =  {b:1}\n');
  const result = hook('post-tool-use', {
    hook_event_name: 'PostToolUse',
    tool_name: 'Edit',
    tool_input: { file_path: path.join(dir, 'a.ts') },
    cwd: REPO_ROOT,
  });
  assert.equal(result.code, 0, result.stderr);
  assert.equal(readFileSync(path.join(dir, 'a.ts'), 'utf8'), 'const a = { b: 1 };\n');
});

test('post-tool-use ignores other tools, generated folders and files in no repo', () => {
  const rootOfR = (absolute) => (absolute.startsWith('/r/') ? '/r' : null);
  const target = (tool_name, file_path) =>
    formatTarget({ tool_name, tool_input: { file_path } }, rootOfR);
  assert.equal(target('Read', '/r/a.ts'), null);
  assert.equal(target('Write', '/r/ios/a.swift'), null);
  assert.equal(target('Write', '/r/node_modules/x/a.js'), null);
  assert.equal(target('Write', '/tmp/a.ts'), null);
  assert.deepEqual(target('Write', '/r/src/a.ts'), { root: '/r', file: 'src/a.ts' });
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
  // Started from a subfolder, it still looks at the whole repo and its stamp.
  assert.equal(hasUnreviewedSrc({ cwd: path.join(dir, 'src') }), true);
});

test('AC-13 end to end: the Stop hook started in a subfolder asks for /review', () => {
  const dir = tempRepo('stop-e2e-');
  writeFileSync(path.join(dir, 'README.md'), 'x\n');
  gitIn(dir, 'add', '.');
  gitIn(dir, 'commit', '-q', '-m', 'init');
  gitIn(dir, 'update-ref', 'refs/remotes/origin/main', 'HEAD');
  mkdirSync(path.join(dir, 'src', 'deep'), { recursive: true });
  writeFileSync(path.join(dir, 'src', 'deep', 'a.ts'), 'code');
  const result = hook('stop', {
    hook_event_name: 'Stop',
    stop_hook_active: false,
    cwd: path.join(dir, 'src', 'deep'),
  });
  assert.equal(result.code, 0);
  assert.equal(JSON.parse(result.stdout).decision, 'block');
});
