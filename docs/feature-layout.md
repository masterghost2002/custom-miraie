# Feature layout

Every feature has the same shape, so an agent can find and place code without inventing structure.

```
src/
├── app/                              routes only (Expo Router); each file renders one feature screen
│   ├── _layout.tsx                   providers: fonts, theme, QueryClient, BackendProvider, auth gate
│   ├── sign-in.tsx                   → features/auth
│   ├── (tabs)/_layout.tsx            Tabs with the glass TabBar (src/ui/tab-bar.tsx)
│   ├── (tabs)/index.tsx              → features/home
│   ├── (tabs)/devices.tsx            → features/devices
│   ├── (tabs)/schedules.tsx          → features/schedules
│   ├── (tabs)/settings.tsx           → features/settings
│   ├── device/[id]/climate.tsx       → features/climate
│   └── device/[id]/airflow.tsx       → features/airflow
├── features/<feature>/
│   ├── screen.tsx                    the screen; composes components + hooks; no fetching inline
│   ├── components/<name>.tsx         feature-only components (shared ones go to src/ui)
│   ├── hooks/use-<name>.ts           TanStack Query / mutation hooks, derived state
│   ├── copy.ts                       every user-visible string of the feature
│   ├── schema.ts                     zod schemas (forms, parsing) when the feature has any
│   └── __tests__/<name>.test.tsx     one per screen/component/hook
├── ui/                               design-system primitives (CHILL-003), one file each + __tests__/
├── lib/miraie/                       the MirAIe client (CHILL-002); React only in react/
│   ├── backend.ts                    `MiraieBackend` interface the app talks to
│   ├── rest.ts  auth.ts              HTTPS calls (login, homes, device details, status)
│   ├── status.ts  messages.ts        parse status JSON → `AcStatus`; build control payloads
│   ├── live-backend.ts               REST + MQTT, re-login, 5 s REST fallback
│   ├── mqtt/codec.ts  mqtt/session.ts  MQTT 3.1 packets + session over a socket factory
│   ├── mqtt/socket-types.ts          the socket interface (not `socket.ts`: Metro would pick
│   │                                 `socket.native.ts` for it on iOS)
│   ├── mqtt/socket.native.ts         react-native-tcp-socket TLS socket (dev build only, lazy)
│   ├── mqtt/socket.node.ts           Node net/tls sockets (tests, spike) — never in the app
│   ├── demo/                         in-memory demo MirAIe (web preview, tests, `pnpm start:demo`)
│   ├── react/                        BackendProvider, useHome, useAcStatus, useAcCommand
│   ├── test-support/                 local aedes broker for the session tests
│   └── __tests__/
├── state/                            zustand stores (session, preferences)
└── theme/                            tokens.ts (only place for raw colours), theme-provider.tsx
```

## Rules

- `src/app/*` files stay thin: read params, render `<FeatureScreen />`. Logic lives in the feature.
- A feature never imports another feature. Shared UI → `src/ui`; shared data → `src/lib` or `src/state`.
- `src/lib/miraie` has no React except in `react/` and no Expo or React Native imports except
  `mqtt/socket.native.ts`, so everything else runs in Node for tests and `pnpm spike:miraie`.
- File names are kebab-case; components are PascalCase exports; hooks start with `use`.
- Tests sit in the folder's `__tests__/` and are named after the file they test.
