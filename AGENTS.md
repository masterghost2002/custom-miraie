# Chill — entry file for Codex, Cursor and other agents

The full handbook is **`CLAUDE.md`**. Read it first; this file only repeats what you must not miss.

- iOS-only Expo SDK 58 app. Expo changes every release: read `https://docs.expo.dev/versions/v58.0.0/`
  or `https://docs.expo.dev/llms.txt` before touching an Expo/EAS API. Never edit `ios/`/`android/`.
- Install packages with `pnpm expo install <pkg>`. Run `pnpm typecheck && pnpm lint && pnpm test`.
- No code without a ticket: `specs/CHILL-NNN-*/` with every open question answered (`specs/ROADMAP.md`).
- Commits: `type(scope): subject (CHILL-NNN)`; branch `feat/CHILL-NNN-<slug>` off `main`.
- Design: `design/boards/` + `docs/design/` + `docs/design-map.md`. Raw colours only in
  `src/theme/tokens.ts`; no arbitrary `[..px]` classes; first line of every feature/ui file is a
  `// Design:` note.
- Tests: by role/label/text, no `testID`, never `jest.mock` this repo's modules; fake the network via
  `MiraieBackend` / `createDemoBackend()`.
- Credentials only in `expo-secure-store`, sent only to `*.miraie.in` over verified TLS.
- Stop and ask when a design state, token, ticket or wording is missing.

Checks (planned in CHILL-001; must match the list in CLAUDE.md): check:style-policy,
check:design-source, check:feature, check:testid, check:ui-mock-policy, check:env-policy,
check:secrets, check:handbook-size, check:agent-rules, check:review, check:commit-msg.
