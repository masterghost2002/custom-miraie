import './lib/test-git.mjs';

// Tests for check:agent-rules (CHILL-001 AC-8).
import assert from 'node:assert/strict';
import { mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { test } from 'node:test';

import { checkAgentRules, checksIn, collect } from './check-agent-rules.mjs';
import { GateSetupError } from './lib/gate.mjs';

test('AC-8: a check missing from AGENTS.md fails', () => {
  const [v] = checkAgentRules({
    claude: 'Checked by `check:testid` and `check:feature`.',
    agents: 'Checks: check:testid.',
  });
  assert.equal(v.path, 'AGENTS.md');
  assert.match(v.message, /check:feature is in CLAUDE\.md but not in AGENTS\.md/);
});

test('a check only in AGENTS.md fails too', () => {
  const [v] = checkAgentRules({ claude: 'check:testid', agents: 'check:testid, check:old-rule' });
  assert.equal(v.path, 'CLAUDE.md');
  assert.match(v.message, /check:old-rule/);
});

test('the same set in a different order passes', () => {
  assert.deepEqual(checkAgentRules({ claude: 'check:a check:b', agents: 'check:b, check:a.' }), []);
});

test('checksIn ignores punctuation around names', () => {
  assert.deepEqual([...checksIn('(`check:style-policy`, planned) check:review.')].sort(), [
    'review',
    'style-policy',
  ]);
});

test('broken setup: a missing AGENTS.md, or a CLAUDE.md naming no checks, fails', () => {
  const dir = mkdtempSync(path.join(tmpdir(), 'agents-'));
  writeFileSync(path.join(dir, 'CLAUDE.md'), 'check:testid');
  assert.throws(() => collect({ cwd: dir }), GateSetupError);
  writeFileSync(path.join(dir, 'CLAUDE.md'), 'no checks here');
  writeFileSync(path.join(dir, 'AGENTS.md'), 'none');
  assert.throws(() => collect({ cwd: dir }), GateSetupError);
});

// The scan itself is `pnpm gates`; here we only prove the gate can read the real repo.
test('the gate runs on the real repo without a setup error', () => {
  assert.ok(Array.isArray(collect()));
});
