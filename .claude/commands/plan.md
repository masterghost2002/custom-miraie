---
description: Turn an answered spec into plan.md and tasks.md (small tasks, each with a check).
argument-hint: <CHILL-NNN>
---

Plan the spec for ticket $ARGUMENTS.

1. Open `specs/$ARGUMENTS-*/spec.md`. List every row in **Open questions** with an empty Answer.
   Plan the work that doesn't depend on them; mark every task that does `BLOCKED by Qn`. Never guess
   an answer into a task. If every task would be blocked, stop and ask the questions instead.
2. Read the files the spec touches and `docs/feature-layout.md`, so file paths follow the layout
   (`src/app/` routes stay thin; feature code lives in `src/features/<feature>/`; primitives in
   `src/ui/`; API in `src/lib/miraie/`).
3. Write `specs/$ARGUMENTS-<slug>/plan.md` from `specs/_template/plan.md`:
   - **Order**: what goes first and why (API before hook before UI; primitives before screens).
   - **Risks**: what could go wrong (MQTT reconnects, a state the board doesn't show, Expo Go vs
     dev build, reduced motion) and how each task guards against it.
   - **Files**: every file created or changed.
4. Write `specs/$ARGUMENTS-<slug>/tasks.md` from `specs/_template/tasks.md`:
   - Small tasks, each one commit. Each task has:
     `Check:` how we know it's done (the AC IDs whose tests pass, a gate, a screenshot), and
     `Files:` the paths it touches.
   - Every AC in the spec is covered by at least one task's Check.
   - The last task is always `- [ ] Task N: STOP and run /review`.
5. Reply with the task list. Do not start building.
