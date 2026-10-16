# CHILL-004 — Tasks

- [ ] Task 1: Session store (secure-storage hydrate, sign out) + auth redirect in the root layout
      Check: AC-7, AC-8
      Files: src/state/session.ts, src/app/_layout.tsx, `src/state/__tests__/session.test.ts`
- [ ] Task 2: zod schema + `useSignIn`
      Check: AC-2 (no request on empty), AC-3 (one request)
      Files: src/features/auth/{schema.ts,hooks/use-sign-in.ts}, `__tests__`
- [ ] Task 3: Screen and form from the board
      Check: AC-1, AC-9
      Files: src/features/auth/{screen.tsx,copy.ts,components/sign-in-form.tsx}, src/app/sign-in.tsx
- [ ] Task 4: Error states — BLOCKED by Q1
      Check: AC-4, AC-5, AC-6
      Files: src/features/auth/**
- [ ] Task 5: Busy state — BLOCKED by Q2
      Check: AC-3 busy label
      Files: src/features/auth/components/sign-in-form.tsx
- [ ] Task 6: STOP and run /review
