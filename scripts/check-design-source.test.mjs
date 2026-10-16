// Tests for check:design-source (CHILL-001 AC-3).
import assert from 'node:assert/strict';
import { mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { test } from 'node:test';

import { checkDesignNote, checkDesignSource, collect, readBoards } from './check-design-source.mjs';
import { GateSetupError } from './lib/gate.mjs';

const boards = new Set(['design/boards/Climate.dc.html', 'design/boards/Main.dc.html']);
const file = (p, text) => ({ path: p, text });

test('AC-3: a feature file without a Design note on line 1 fails', () => {
  const [v] = checkDesignSource(
    [file('src/features/climate/screen.tsx', "import { View } from 'react-native';\n")],
    { boards },
  );
  assert.equal(v.path, 'src/features/climate/screen.tsx');
  assert.equal(v.line, 1);
  assert.match(v.message, /missing or malformed `\/\/ Design:` note/);
  assert.match(v.fix, /\/\/ Design: design\/boards\/<Board>\.dc\.html — <part>/);
});

test('a board note and a none note with a ticket pass', () => {
  const files = [
    file('src/features/climate/screen.tsx', '// Design: design/boards/Climate.dc.html — screen\n'),
    file('src/ui/glass.tsx', '// Design: design/boards/Main.dc.html — .glass card\nexport {};'),
    file(
      'src/features/settings/screen.tsx',
      '// Design: none — Settings has no board; built from list cards (CHILL-010)\n',
    ),
  ];
  assert.deepEqual(checkDesignSource(files, { boards }), []);
});

test('a note naming a board that does not exist fails', () => {
  const v = checkDesignNote(
    file('src/ui/a.tsx', '// Design: design/boards/Nope.dc.html — x\n'),
    boards,
  );
  assert.match(v.message, /Nope\.dc\.html, which does not exist/);
});

test('a none note without a ticket, or the note on line 2, fails', () => {
  const files = [
    file('src/ui/a.tsx', '// Design: none — no board\n'),
    file('src/ui/b.tsx', "'use client';\n// Design: design/boards/Main.dc.html — x\n"),
  ];
  assert.equal(checkDesignSource(files, { boards }).length, 2);
});

test('tests and files outside src/features and src/ui are not checked', () => {
  const files = [
    file('src/ui/__tests__/glass.test.tsx', 'test'),
    file('src/features/home/home.test.ts', 'test'),
    file('src/lib/miraie/status.ts', 'export {}'),
    file('src/app/index.tsx', 'export {}'),
  ];
  assert.deepEqual(checkDesignSource(files, { boards }), []);
});

test('broken setup: no design/boards folder fails', () => {
  const dir = mkdtempSync(path.join(tmpdir(), 'design-'));
  assert.throws(() => readBoards({ cwd: dir }), GateSetupError);
});

// The scan itself is `pnpm gates`; here we only prove the gate can read the real repo.
test('the gate runs on the real repo and finds the boards', () => {
  assert.ok(readBoards().size >= 7);
  assert.ok(Array.isArray(collect()));
});
