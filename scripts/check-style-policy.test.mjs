// Tests for check:style-policy (CHILL-001 AC-1).
import assert from 'node:assert/strict';
import { mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { test } from 'node:test';

import { checkStylePolicy, collect } from './check-style-policy.mjs';
import { GateSetupError } from './lib/gate.mjs';

const file = (p, text) => ({ path: p, text });

test('AC-1: a raw hex colour in a feature fails with file:line and the token hint', () => {
  const [v] = checkStylePolicy([
    file('src/features/x/screen.tsx', "const a = 1;\nconst c = '#E8701F';\n"),
  ]);
  assert.equal(v.path, 'src/features/x/screen.tsx');
  assert.equal(v.line, 2);
  assert.match(v.message, /raw colour #E8701F/);
  assert.match(v.fix, /use a token from src\/theme\/tokens\.ts/);
});

test('AC-1: an arbitrary Tailwind size fails with the named-step hint', () => {
  const [v] = checkStylePolicy([
    file('src/features/x/screen.tsx', '<View className="w-[52px] p-4" />'),
  ]);
  assert.match(v.message, /arbitrary Tailwind value w-\[52px\]/);
  assert.match(v.fix, /named Tailwind step/);
});

test('rgb(), rgba(), hsl() and variant-prefixed arbitrary values fail', () => {
  const violations = checkStylePolicy([
    file(
      'src/ui/a.tsx',
      "const a = 'rgba(0,0,0,.2)';\nconst b = 'rgb(1,2,3)';\nconst c = 'hsl(1 2% 3%)';\n<V className=\"md:text-[13px] bg-[#fff]\" />",
    ),
  ]);
  const messages = violations.map((v) => v.message).join('\n');
  assert.match(messages, /rgba\(/);
  assert.match(messages, /rgb\(/);
  assert.match(messages, /hsl\(/);
  assert.match(messages, /md:text-\[13px\]/);
  assert.match(messages, /bg-\[#fff\]/);
});

test('the tokens file may hold raw colours', () => {
  assert.deepEqual(
    checkStylePolicy([
      file('src/theme/tokens.ts', "export const a = '#E8701F'; const b = 'rgba(0,0,0,.1)';"),
    ]),
    [],
  );
});

test('clean code, URL fragments, named steps and array indexing pass', () => {
  const text = [
    '// see docs/engineering-rules.md#tests and https://x.dev/page#add',
    '<View className="h-13 w-30 rounded-full bg-accent" />',
    'const first = list[0]; const n = a - [1].length;',
    "const id = 'item#1';",
  ].join('\n');
  assert.deepEqual(checkStylePolicy([file('src/features/x/screen.tsx', text)]), []);
});

test('files outside src are not checked', () => {
  assert.deepEqual(checkStylePolicy([file('app.json', '{"backgroundColor": "#151413"}')]), []);
});

test('the ignore comment needs a reason', () => {
  const ok = checkStylePolicy([
    file(
      'src/ui/a.tsx',
      "// style-policy-ignore-next-line: fixture for the gallery\nconst c = '#fff';",
    ),
  ]);
  assert.deepEqual(ok, []);
  const bad = checkStylePolicy([
    file('src/ui/a.tsx', "// style-policy-ignore-next-line\nconst c = '#fff';"),
  ]);
  // Without a reason nothing is ignored, and the comment itself is reported.
  assert.deepEqual(bad.map((v) => v.message).sort(), [
    'raw colour #fff',
    'style-policy-ignore-next-line has no reason',
  ]);
});

test('broken setup: outside a git repository the gate fails', () => {
  const dir = mkdtempSync(path.join(tmpdir(), 'style-'));
  assert.throws(() => collect({ cwd: dir }), GateSetupError);
});

test('the real repo passes', () => {
  assert.deepEqual(collect(), []);
});
