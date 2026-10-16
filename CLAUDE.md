# Chill — handbook for agents

Chill is an **iOS-only** Expo app that replaces the Panasonic MirAIe app for controlling home air
conditioners. Agents write the code; the owner decides what to build and approves the result.
Keep this file under 10 KB (`check:handbook-size`, planned); put detail in the linked docs.

## Start here

- Plan and status of every feature: `specs/ROADMAP.md`. Work only on a ticket (`specs/CHILL-NNN-*`).
- Design source of truth: `design/README.md` → boards in `design/boards/`, per-screen specs in
  `docs/design/screens/`, values → classes in `docs/design-map.md`.
- How MirAIe works (REST + MQTT): `learn/miraie-protocol.md`.
- Full rules: `docs/engineering-rules.md`. Folder shape: `docs/feature-layout.md`.

## Run it

```bash
pnpm install                 # pnpm only (node-linker=hoisted)
pnpm start                   # Metro; iPhone via Expo Go until CHILL-011, then the dev build
pnpm start:demo              # same, against the in-memory demo MirAIe (no account)
pnpm web                     # web preview (demo backend only) at http://localhost:8081
pnpm typecheck && pnpm lint && pnpm test
```

On this Mac, Node needs `NODE_OPTIONS=--use-system-ca` (Zscaler) for `expo install` and fetches.
Install packages with `pnpm expo install <pkg>`, never a bare `pnpm add`, so versions match SDK 58.

## Branches and commits

- Trunk is `main`. Branch `feat/CHILL-NNN-<slug>`; PRs target `main`.
- Commit message: `type(scope): subject (CHILL-NNN)` — e.g. `feat(climate): add fan speed pill (CHILL-006)`.
  Checked by: `check:commit-msg` (planned, CHILL-001).

## Rules (each one is checked by a program — or will be, see CHILL-001)

### Expo changes fast

Never trust memory for Expo, Expo Router or EAS APIs. Read `https://docs.expo.dev/versions/v58.0.0/`
or `https://docs.expo.dev/llms.txt` first. Never create or edit `ios/` or `android/` by hand.

### Specs before code

No code without a spec whose open questions are all answered. Flow: `/spec` → owner answers →
`/plan` → `/build` (one task, one commit) → `/review` → push. Guide: `.claude/commands/`.

### Design values come from tokens

- Raw colours (`#…`, `rgb(…)`) live only in `src/theme/tokens.ts`. Never use arbitrary Tailwind
  values like `p-[13px]`; add a named value to `tailwind.config.js` instead.
- Checked by: `check:style-policy` (planned). Guide: `.claude/skills/ui-primitives/SKILL.md`.

### Every screen says where its design came from

- First line of every file in `src/features/**` and `src/ui/**` (not tests):
  `// Design: design/boards/<Board>.dc.html — <part>` or `// Design: none — <reason> (CHILL-NNN)`.
- Checked by: `check:design-source` (planned). Guide: `.claude/skills/build-screen-from-design/SKILL.md`.

### Glass is native liquid glass

Use `<Glass>` from `src/ui` — `GlassView` (expo-glass-effect) on iOS 26+, the canvas's frosted
fill everywhere else. Never hand-roll blur or a translucent card.

### Tests are honest

- Query by role, label or visible text. `testID` queries are banned (`check:testid`, planned).
- Never `jest.mock` a module from this repo (`check:ui-mock-policy`, planned). Fake only what we
  don't own: the network goes through `MiraieBackend` (use `createDemoBackend()`), native modules
  are mocked once in `jest.setup.ts`.
- Every new screen and component has a test (`check:feature`, planned). Coverage: lines 85%,
  branches 75% (`jest.config.js`); any exclusion carries a reason there.
- Guide: `.claude/skills/honest-tests/SKILL.md`.

### Credentials stay on the phone

- Password and tokens only in `expo-secure-store`; never logged, never in `EXPO_PUBLIC_*`, never sent
  anywhere except `auth.miraie.in`, `app.miraie.in`, `mqtt.miraie.in` (TLS verified).
- `.env*` files are never committed (`check:secrets`, planned); every `EXPO_PUBLIC_*` the app reads
  is listed in `.env.example` (`check:env-policy`, planned).

### Use the established libraries

zustand (client state, `persist`), TanStack Query (server state — MQTT pushes write into its cache),
react-hook-form + zod (forms), NativeWind (styling), lucide-react-native (icons),
react-native-reanimated (motion), expo-glass-effect (glass). Hand-written code only where no library
fits, with a one-line reason — e.g. `src/lib/miraie/mqtt/codec.ts` (see CHILL-002).

### Reviewed before push

`/review` must pass and write the stamp; `check:review` (planned) blocks a push whose code changed
after the review.

## When you must stop and ask

- The design has no board or state for what you need (loading, error, empty, offline, Settings).
- A value is not a token, or two boards disagree about the same thing.
- There is no CHILL ticket for the work.
- User-visible wording is not in the design or the spec.
- The task needs the owner's MirAIe account (live device tests, credentials).
- Anything changes how credentials are stored or where they are sent.

For anything else, work it out from the code and the docs.

## Done means

- [ ] The spec's open questions are all answered, and every AC has a test named after it
- [ ] Tests are honest; `pnpm test`, `pnpm typecheck`, `pnpm lint` (and `pnpm gates` once built) pass
- [ ] Every new screen/component has its Design note and a test, and every state the board shows
- [ ] Every colour, size and spacing value came from a token
- [ ] The screen was compared with its board at 390×844 (web preview) and on the iPhone
- [ ] `/review` passed and the stamp matches this exact change
