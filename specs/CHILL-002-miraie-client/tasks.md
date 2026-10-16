# CHILL-002 — Tasks

- [ ] Task 1: Types, constants, `parseStatus`
      Check: AC-4 table tests
      Files: src/lib/miraie/{types,constants,status}.ts, `__tests__/status.test.ts`
- [ ] Task 2: Control message builders
      Check: AC-5 table test (every builder vs the Python reference output)
      Files: src/lib/miraie/messages.ts, `__tests__/messages.test.ts`
- [ ] Task 3: REST sign-in with login-ID kind detection and error types
      Check: AC-1, AC-2 with a fake fetch
      Files: src/lib/miraie/{auth,rest}.ts, `__tests__/auth.test.ts`
- [ ] Task 4: `getHome` (homes → spaces → devices → details → status), zod-validated
      Check: AC-3
      Files: src/lib/miraie/rest.ts, `__tests__/rest.test.ts`
- [ ] Task 5: MQTT 3.1 codec
      Check: AC-6 against mqtt-packet
      Files: src/lib/miraie/mqtt/codec.ts, `__tests__/codec.test.ts`
- [ ] Task 6: MQTT session (connect, subscribe, publish, keep-alive, reconnect hook) + Node socket
      Check: AC-7 against aedes
      Files: src/lib/miraie/mqtt/{session,socket.node}.ts, `__tests__/session.test.ts`
- [ ] Task 7: Live backend: re-login once, signed-out event, 5 s REST fallback
      Check: AC-8, AC-9
      Files: src/lib/miraie/{backend,live-backend}.ts, `__tests__/live-backend.test.ts`
- [ ] Task 8: react-native-tcp-socket TLS socket, chosen at runtime (never imported on web/Expo Go)
      Check: typecheck; on-device check in CHILL-011
      Files: src/lib/miraie/mqtt/socket.native.ts
- [ ] Task 9: Demo backend
      Check: AC-10
      Files: src/lib/miraie/demo/demo-backend.ts, `__tests__/demo-backend.test.ts`
- [ ] Task 10: BackendProvider + query hooks (MQTT pushes into the cache, optimistic commands)
      Check: hook tests rendered with the demo backend
      Files: src/lib/miraie/react/**
- [ ] Task 11: `pnpm spike:miraie`
      Check: AC-11 — owner runs it (O1)
      Files: scripts/spike-miraie.ts, package.json, .env.example
- [ ] Task 12: STOP and run /review
