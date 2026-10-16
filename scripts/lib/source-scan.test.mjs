import './test-git.mjs';

// Tests for the gates' source scanner (CHILL-001).
import assert from 'node:assert/strict';
import { test } from 'node:test';

import { scanSource } from './source-scan.mjs';

const strings = (text) => scanSource(text).strings.map(({ start, end }) => text.slice(start, end));

test('comments are blanked, keeping length and newlines', () => {
  const text = 'a // x #fff\n/* y\n z */ b';
  const { code } = scanSource(text);
  assert.equal(code.length, text.length);
  assert.equal(code.split('\n').length, 3);
  assert.doesNotMatch(code, /#fff|y|z/);
  assert.match(code, /a .*\n.*\n.* b/);
});

test('string, quote and template contents are listed; // inside a string is not a comment', () => {
  assert.deepEqual(strings('f(\'https://x.dev\', "b", `c ${d}`) // e'), [
    'https://x.dev',
    'b',
    'c ${d}',
  ]);
  assert.deepEqual(strings("'it\\'s'"), ["it\\'s"]);
});

test('regex literals are blanked after operators and keywords, divisions are kept', () => {
  assert.doesNotMatch(scanSource('x = /#[0-9a-f]{3}/gi.test(y)').code, /#/);
  assert.doesNotMatch(scanSource('return /rgba\\(/.test(y)').code, /rgba/);
  assert.doesNotMatch(scanSource('s.match(/[/]#a/)').code, /#a/);
  assert.equal(scanSource('const r = a / b / c;').code, 'const r = a / b / c;');
  assert.equal(scanSource('(x) / 2').code, '(x) / 2');
});

test('JSX closing tags and self-closing slashes are not regex literals', () => {
  const text = '<A b={c} /><B className="h-1" /></A>';
  assert.equal(scanSource(text).code, text);
  assert.deepEqual(strings(text), ['h-1']);
});

test('an apostrophe in JSX text ends its "string" at the line end', () => {
  assert.deepEqual(strings("<T>Don't</T>\nconst c = 'x';"), ['t</T>', 'x']);
});

test('unterminated comments, strings and regexes do not throw or shift offsets', () => {
  for (const text of ['/* open', "'open", '`open\nmore', 'x = /open']) {
    assert.equal(scanSource(text).code.length, text.length);
  }
});

test('css mode blanks only block comments', () => {
  const text = '/* #fff */ .a { color: red; } // not a css comment';
  const { code, strings: found } = scanSource(text, { css: true });
  assert.doesNotMatch(code, /#fff/);
  assert.match(code, /\/\/ not a css comment/);
  assert.deepEqual(found, []);
});
