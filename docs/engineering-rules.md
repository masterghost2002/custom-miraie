# Engineering rules

The handbook (`CLAUDE.md`) lists each rule in one line; this page explains them. A rule that matters
must be checked by a program — the checker is named next to each rule. "Planned" checkers are built in
CHILL-001; until then the rule is enforced by `/review`.

## Platform

- **iOS only.** No Android code paths, no Android-specific styling. Web exists only as a preview that
  runs against the demo backend (`EXPO_PUBLIC_MIRAIE_DEMO=1`); it never talks to MirAIe.
- **Expo SDK 58, Continuous Native Generation.** Configure native behaviour in `app.json` and config
  plugins; `ios/` is generated and never committed or edited.
- **Expo Go until CHILL-011.** Anything that needs `react-native-tcp-socket` (live MQTT) runs only in
  the development build. Code must not import `mqtt/socket.native.ts` at module load in a way that
  crashes Expo Go — the backend picks the transport at runtime.

## Work flow

1. A ticket is a folder `specs/CHILL-NNN-<slug>/` with `spec.md`, `plan.md`, `tasks.md`
   (template: `specs/_template/`). The next free number is the highest in `specs/ROADMAP.md` + 1.
2. `/spec` writes `spec.md` and stops. The owner answers every open question in its table, with a date.
3. `/plan` writes `plan.md` and `tasks.md` (each task: what, `Check:`, `Files:`).
4. `/build` does one task: failing test → code → related tests, typecheck, lint, gates → one commit.
5. `/review` (code-reviewer agent, strongest model) must pass; it writes `.review/stamp.json`.
6. Push → PR to `main` → CI reruns everything → owner merges.

Commit format: `type(scope): subject (CHILL-NNN)`; types feat, fix, refactor, test, docs, chore.
Checked by: `check:commit-msg` (planned).

## Styling — `check:style-policy` (planned)

- Colours come from `src/theme/tokens.ts`, reach classes through CSS variables set by
  `<ThemeProvider>` (`tailwind.config.js` maps names to `var(--…)`), and reach JS (SVG strokes,
  shadows, reanimated colours) through `useTheme().tokens`. No `#hex`, `rgb()`, `rgba()` or `hsl()`
  anywhere else in `src/`.
- Sizes come from the Tailwind scale or a named value in `tailwind.config.js`. Arbitrary classes
  (`w-[52px]`, `text-[13px]`) are banned; add a named step instead and note it in `docs/design-map.md`.
- Inline `style={{…}}` is allowed only for values computed at runtime (animation, measured layout).
- Fonts: only the Plus Jakarta Sans families via `font-light|regular|medium|semibold|bold`.

## Design fidelity — `check:design-source` (planned)

- Build from `docs/design/screens/<screen>.md`, checking numbers against the raw board.
- First line of every non-test file in `src/features/**` and `src/ui/**`:
  `// Design: design/boards/<Board>.dc.html — <part>` or `// Design: none — <reason> (CHILL-NNN)`.
- Implement every state the board's script supports. A state the board does not show (loading,
  error, empty, offline on a detail screen) is an open question for the owner, not a guess.
- Compare with the board at 390×844 on the web preview and on the iPhone before calling a screen done.
  There is no automatic overlay tool yet; attach the two screenshots to the PR.
- Glass: `<Glass>` uses `GlassView` from expo-glass-effect when
  `isLiquidGlassAvailable() && isGlassEffectAPIAvailable()`, else the frosted fill (`bg-glass`,
  `border-glass-line`, glass shadow). Liquid glass will not match the canvas pixel for pixel; accepted.
- Motion: reanimated; every ambient animation (breeze, particles, sweeps, spins) stops when
  `useReducedMotion()` is true. Timings are in `docs/design/language.md`.
- Touch targets ≥ 44 pt. Icon-only buttons have `accessibilityLabel`; toggles use
  `accessibilityRole="switch"` with `accessibilityState={{ checked }}`; segmented options use
  `accessibilityState={{ selected }}`; the temperature slider is `adjustable`.

## Tests — `check:feature`, `check:testid`, `check:ui-mock-policy` (planned)

- jest-expo + @testing-library/react-native. Run `pnpm test -- <path>` while working; the full suite
  and coverage on the PR.
- Query by role, label or visible text, the way a person finds things. `getByTestId`/`testID` banned.
- Never `jest.mock` a module from this repo. Fake only what we don't own:
  - the network — every MirAIe call goes through the `MiraieBackend` interface; tests render inside
    `<BackendProvider backend={createDemoBackend(seed)}>` or a small fake built for the test;
  - native modules — mocked once in `jest.setup.ts` (secure store, async storage).
- Never test a stand-in you made in the same file. Assert the words people see.
- Test names reuse the spec's AC IDs: `AC-3: given an offline AC, when …, then …`.
- If nothing is worth testing, don't invent a test — add the file to the exclusion list in
  `jest.config.js` with the reason.
- Coverage thresholds (from day one): lines 85, statements 85, functions 85, branches 75.
- `src/lib/miraie` is also tested against real counterparts: the MQTT codec against `mqtt-packet`,
  the session against a local `aedes` broker.

## Security — `check:secrets`, `check:env-policy` (planned)

- MirAIe password, access token and refresh token are stored only with `expo-secure-store`.
  The password is kept so the app can sign in again when the token expires (no refresh endpoint is
  known); the Sign in screen tells the user this.
- Never log credentials, tokens, home IDs or full payloads (`console.log` is lint-banned).
- Only `auth.miraie.in`, `app.miraie.in` and `mqtt.miraie.in` are contacted; TLS certificates are
  verified (never `rejectUnauthorized: false` in app code).
- `.env` / `.env.*` are never committed; `.env.example` lists every variable, and `EXPO_PUBLIC_*`
  values must never be secrets (they ship in the bundle).
- `HTTP_CLIENT_ID` in the client is the MirAIe app's public client ID, not a secret.

## Review — `check:review` (planned)

`/review` reads the full change (`git diff $(git merge-base origin/main HEAD)` plus uncommitted work)
for correctness, clarity, structure, security, performance, design fidelity and test honesty, using
the strongest model (`claude-opus-5-5`, effort `xhigh`). Pass writes `.review/stamp.json`:

```json
{
  "verdict": "pass",
  "model": "claude-opus-5-5",
  "effort": "xhigh",
  "findings": { "critical": 0, "important": 0, "suggestion": 2 },
  "reviewId": "3f9a1c0e7b2d4a6f"
}
```

`reviewId` is the first 16 hex characters of the SHA-256 of that diff. Any later change breaks the
match and the push is blocked until a fresh review. The stamp is local, so it stops agents cutting
corners; it is not a security lock.

## Handbook upkeep — `check:handbook-size`, `check:agent-rules` (planned)

- `CLAUDE.md` stays under 10 KB; detail moves to `docs/`.
- `AGENTS.md` repeats the must-know rules; the list of checks must be identical in both files.
- Explainer pages in `learn/` start with `<!-- learn-sources: … -->`; when a listed file changes and
  the page does not, the page may be stale (checker planned later).

## Memory → docs → gates

A surprise one agent hits goes into its memory. If everyone needs it, it becomes a skill, a doc or a
`learn/` page. If breaking it causes real damage, it becomes a gate, with the CHILL ticket in a comment.
