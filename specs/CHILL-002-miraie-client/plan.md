# CHILL-002 — Plan

## Order

1. Types and pure functions first (`types.ts`, `status.ts`, `messages.ts`): no I/O, table tests
   straight from the Python reference.
2. REST (`rest.ts`, `auth.ts`) with `fetch` injected, so tests pass a fake `fetch` (the network is the
   one thing we don't own).
3. MQTT codec, tested against `mqtt-packet` as an oracle.
4. MQTT session over an injected socket factory, tested against a real `aedes` broker on localhost.
5. `MiraieBackend` interface + live implementation (REST + session + re-login + 5 s fallback refetch).
6. Demo backend.
7. React glue: `<BackendProvider>`, query keys, `useHome()`, `useAcStatus(id)`, `useAcCommand(id)`
   (TanStack Query; MQTT pushes → `queryClient.setQueryData`).
8. Spike script for the owner.

## Files

- `src/lib/miraie/{types,constants,status,messages,rest,auth,backend,live-backend}.ts`
- `src/lib/miraie/mqtt/{codec,session,socket.native,socket.node}.ts`
- `src/lib/miraie/demo/demo-backend.ts`
- `src/lib/miraie/react/{backend-provider.tsx,query-keys.ts,use-home.ts,use-ac-status.ts,use-ac-command.ts}`
- `src/lib/miraie/__tests__/**`, `scripts/spike-miraie.ts`, `package.json` (`spike:miraie`)

## Risks

| Risk                                                                    | What we do about it                                                                                          |
| ----------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------ |
| REST shapes differ from the Python code (it reads `resp[0]`, `json[0]`) | Parse with zod and report a clear error; owner check O1 with the spike                                       |
| The device ignores `"24.0"` or needs a number                           | One place builds temperature payloads; O2 decides; the test table updates                                    |
| `react-native-tcp-socket` TLS behaves differently from Node `tls`       | Session depends only on a tiny socket interface (`write`, `on data/close/error`, `destroy`); device check O2 |
| Token expiry mid-session                                                | AC-8 re-login path tested against aedes with a password-checking authenticate hook                           |
| Leaking credentials in logs                                             | No logging of payloads; security-auditor in /ship                                                            |

## How we will know it works

- Automated: AC-1…AC-10 (fake fetch, mqtt-packet oracle, aedes broker, demo backend).
- Manual: owner checks O1–O3.
