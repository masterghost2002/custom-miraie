import { gitIn, tempRepo } from './lib/test-git.mjs';

// Tests for check:secrets (CHILL-001 AC-7).
import assert from 'node:assert/strict';
import { mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { test } from 'node:test';

import { checkSecrets, collect, isEnvFile } from './check-secrets.mjs';
import { GateSetupError } from './lib/gate.mjs';

const fakeJwt = [
  'eyJhbGciOiJIUzI1NiJ9',
  'eyJzdWIiOiIxMjM0NTY3ODkwIn0',
  'c2lnbmF0dXJlLXNpZ25hdHVyZQ',
].join('.');

function repoWith(files) {
  const dir = tempRepo('secrets-');
  for (const [name, text] of Object.entries(files)) writeFileSync(path.join(dir, name), text);
  return dir;
}

test('AC-7: a staged .env.local blocks the commit', () => {
  const dir = repoWith({ '.env.local': 'MIRAIE_PASSWORD=x\n', 'a.ts': 'ok' });
  gitIn(dir, 'add', '-f', '.env.local', 'a.ts');
  const violations = collect({ cwd: dir, staged: true });
  assert.equal(violations.length, 1);
  assert.equal(violations[0].path, '.env.local');
  assert.match(violations[0].message, /must never be committed/);
});

test('only staged content counts in --staged mode', () => {
  const dir = repoWith({ 'a.ts': 'clean' });
  gitIn(dir, 'add', 'a.ts');
  writeFileSync(path.join(dir, 'a.ts'), `const accessToken = '${fakeJwt}';`);
  assert.deepEqual(collect({ cwd: dir, staged: true }), []);
});

test('.env.example is allowed; .env and .env.production are not', () => {
  assert.equal(isEnvFile('.env.example'), false);
  assert.equal(isEnvFile('.env'), true);
  assert.equal(isEnvFile('config/.env.production'), true);
});

test('a private key block or a JWT assigned to a token key fails', () => {
  const violations = checkSecrets([
    // Split so this test file doesn't trip the gate it tests.
    { path: 'k.pem.txt', text: '-----BEGIN RSA ' + 'PRIVATE KEY-----\nabc' },
    { path: 'src/a.ts', text: `\nconst session = { accessToken: "${fakeJwt}" };` },
    { path: 'b.json', text: `{"Authorization": "Bearer ${fakeJwt}"}` },
  ]);
  assert.equal(violations.length, 3);
  assert.equal(violations[1].line, 2);
});

test('obvious test fakes and binaries pass', () => {
  assert.deepEqual(
    checkSecrets([
      {
        path: 'src/a.test.ts',
        text: "signIn('9876543210', 'wrong-password'); const accessToken = 'token-1';",
      },
      { path: 'img.png', text: 'a\0b' },
    ]),
    [],
  );
});

test('broken setup: outside a git repository the gate fails', () => {
  const dir = mkdtempSync(path.join(tmpdir(), 'nogit-'));
  assert.throws(() => collect({ cwd: dir, staged: true }), GateSetupError);
});

// The scan itself is `pnpm gates`; here we only prove the gate can read the real repo.
test('the gate runs on the real repo without a setup error', () => {
  assert.ok(Array.isArray(collect()));
});
