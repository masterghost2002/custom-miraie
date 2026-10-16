// A small JS/TS/CSS scanner for the gates: blanks comments and regex literals (keeping offsets and
// newlines) and lists string/template literal ranges, so a gate can ignore `// #E8701F` in a
// comment and look for class names only where class names live (CHILL-001).

// After these characters (or at the start), a `/` begins a regex literal, not a division.
// `<`, `>`, `}` and `)` are left out: in JSX `</Text>` and `{x} />` they precede a slash.
const REGEX_AFTER = new Set([
  '(',
  ',',
  '=',
  ':',
  '[',
  '!',
  '&',
  '|',
  '?',
  '{',
  ';',
  '+',
  '-',
  '*',
  '%',
  '~',
  '^',
]);
const REGEX_AFTER_WORD = new Set([
  'return',
  'typeof',
  'case',
  'do',
  'else',
  'in',
  'of',
  'delete',
  'void',
  'throw',
  'new',
  'yield',
  'await',
]);

/**
 * `{ code, strings }`: `code` is `text` with comments and regex literals replaced by spaces
 * (same length, newlines kept); `strings` are `{ start, end }` ranges of literal contents.
 * `css: true` only blanks block comments.
 */
export function scanSource(text, { css = false } = {}) {
  const out = text.split('');
  const strings = [];
  const blank = (from, to) => {
    for (let k = from; k < to; k += 1) if (out[k] !== '\n') out[k] = ' ';
  };
  const n = text.length;
  let prev = ''; // last significant character outside comments
  let word = ''; // the word that ends at `prev`, if any
  let i = 0;
  while (i < n) {
    const c = text[i];
    const next = text[i + 1];
    if (c === '/' && next === '*') {
      const end = text.indexOf('*/', i + 2);
      const stop = end === -1 ? n : end + 2;
      blank(i, stop);
      i = stop;
      continue;
    }
    if (css) {
      i += 1;
      continue;
    }
    if (c === '/' && next === '/') {
      const end = text.indexOf('\n', i);
      const stop = end === -1 ? n : end;
      blank(i, stop);
      i = stop;
      continue;
    }
    if (c === '"' || c === "'" || c === '`') {
      // Quotes end at the closing quote; plain strings also end at a newline (JSX apostrophes).
      let j = i + 1;
      while (j < n && text[j] !== c && (c === '`' || text[j] !== '\n'))
        j += text[j] === '\\' ? 2 : 1;
      strings.push({ start: i + 1, end: Math.min(j, n) });
      i = j + 1;
      prev = c;
      word = '';
      continue;
    }
    if (c === '/' && (prev === '' || REGEX_AFTER.has(prev) || REGEX_AFTER_WORD.has(word))) {
      let j = i + 1;
      let inClass = false;
      while (j < n && text[j] !== '\n') {
        const d = text[j];
        if (d === '\\') {
          j += 2;
          continue;
        }
        if (d === '[') inClass = true;
        else if (d === ']') inClass = false;
        else if (d === '/' && !inClass) break;
        j += 1;
      }
      if (text[j] === '/') {
        let end = j + 1;
        while (end < n && /[a-z]/i.test(text[end])) end += 1;
        blank(i, end);
        i = end;
        prev = '/';
        word = '';
        continue;
      }
    }
    if (!/\s/.test(c)) {
      word = /[\w$]/.test(c) ? (/[\w$]/.test(prev) ? word + c : c) : '';
      prev = c;
    }
    i += 1;
  }
  return { code: out.join(''), strings };
}
