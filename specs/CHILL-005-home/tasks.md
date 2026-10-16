# CHILL-005 — Tasks

- [ ] Task 1: Tabs layout + glass TabBar + device stack routes
      Check: CHILL-003 AC-9 in place; each tab opens
      Files: src/app/(tabs)/_layout.tsx, src/app/device/[id]/_layout.tsx
- [ ] Task 2: Preferences store (featured AC) + `useHomeView`
      Check: AC-5 (persisted featured), default featured rule
      Files: src/state/preferences.ts, src/features/home/hooks/use-home-view.ts
- [ ] Task 3: Header (date + greeting + account button)
      Check: greeting table test (BLOCKED by Q2 for final words)
      Files: src/features/home/{greeting.ts,copy.ts}
- [ ] Task 4: Room chips + featured card
      Check: AC-1, AC-2, AC-3, AC-7, AC-9
      Files: src/features/home/components/{room-chips,featured-card}.tsx
- [ ] Task 5: Small AC cards + offline state
      Check: AC-4, AC-6
      Files: src/features/home/components/ac-card.tsx
- [ ] Task 6: Airflow + Schedules tiles
      Check: AC-8 (subtitle BLOCKED by Q4)
      Files: src/features/home/components/feature-tile.tsx
- [ ] Task 7: Mode words for heat/fan/auto — BLOCKED by Q1
- [ ] Task 8: Loading / error / empty — BLOCKED by Q3; 1 AC and 4+ ACs — BLOCKED by Q5
      Check: AC-10, measured layout shift = 0 on the web preview
- [ ] Task 9: STOP and run /review
