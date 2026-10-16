// check:style-policy — raw colours live only in src/theme/tokens.ts and sizes come from named
// Tailwind steps, so every screen follows the design tokens (CHILL-001).
import {
  GateSetupError,
  REPO_ROOT,
  applyIgnores,
  isMain,
  lineOf,
  listFiles,
  readFiles,
  runGate,
} from './lib/gate.mjs';
import { scanSource } from './lib/source-scan.mjs';

export const RULE = 'style-policy';
export const SEVERITY = 'error';
export const TOKENS_FILE = 'src/theme/tokens.ts';

// A hex colour starts a token: not part of a word, path or URL fragment (`docs/x.md#tests`).
const HEX =
  /(?<![\w/.#&-])#(?:[0-9a-fA-F]{8}|[0-9a-fA-F]{6}|[0-9a-fA-F]{4}|[0-9a-fA-F]{3})(?![\w-])/g;
const COLOUR_FN = /(?<![\w-])(?:rgba?|hsla?)\(/g;
// An arbitrary Tailwind value: `w-[52px]`, `text-[13px]`, `md:p-[13px]`, `bg-[#fff]`.
const ARBITRARY = /(?<![\w$.])(?:[a-z0-9]+:)*!?-?[a-z][a-z0-9]*(?:-[a-z0-9]+)*-\[[^\]\s'"`]+\]/g;

export function appliesTo(file) {
  return file.startsWith('src/') && /\.(ts|tsx|js|jsx|css)$/.test(file);
}

/** Pure check: `files` = [{ path, text }] → violations. */
export function checkStylePolicy(files) {
  const violations = [];
  for (const file of files) {
    if (!appliesTo(file.path)) continue;
    const css = file.path.endsWith('.css');
    // Comments and regex literals are blanked; class names are looked for only inside strings
    // (in CSS, everywhere outside comments).
    const { code, strings } = scanSource(file.text, { css });
    const found = [];
    const add = (index, message, fix) =>
      found.push({ path: file.path, line: lineOf(file.text, index), message, fix });
    const tokenFix = `use a token from ${TOKENS_FILE} (a colour class, or useTheme().tokens)`;
    if (file.path !== TOKENS_FILE) {
      for (const match of code.matchAll(HEX)) add(match.index, `raw colour ${match[0]}`, tokenFix);
      for (const match of code.matchAll(COLOUR_FN)) {
        add(match.index, `raw colour ${match[0]}…)`, tokenFix);
      }
    }
    const regions = css ? [{ start: 0, end: code.length }] : strings;
    for (const { start, end } of regions) {
      for (const match of code.slice(start, end).matchAll(ARBITRARY)) {
        add(
          start + match.index,
          `arbitrary Tailwind value ${match[0]}`,
          'use a named Tailwind step (add it to tailwind.config.js and docs/design-map.md)',
        );
      }
    }
    violations.push(...applyIgnores(RULE, file, found));
  }
  return violations.sort((a, b) => a.path.localeCompare(b.path) || a.line - b.line);
}

/** Reads the repo at `cwd` and checks it; a missing tokens file means the setup is broken. */
export function collect({ cwd = REPO_ROOT } = {}) {
  const files = listFiles({ cwd }).filter(appliesTo);
  if (!files.includes(TOKENS_FILE)) throw new GateSetupError(`${TOKENS_FILE} not found`);
  return checkStylePolicy(readFiles(files, { cwd }));
}

if (isMain(import.meta.url)) await runGate(RULE, () => collect(), { severity: SEVERITY });
