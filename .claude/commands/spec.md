---
description: Write the spec for a feature (specs/CHILL-NNN-<slug>/spec.md), then stop and list its open questions.
argument-hint: <short feature description>
---

Write a spec for: $ARGUMENTS

1. Find the next free ticket number: list `specs/` and take the highest `CHILL-NNN` + 1.
   Pick a short kebab-case slug. Create `specs/CHILL-NNN-<slug>/spec.md` by copying
   `specs/_template/spec.md`. Do not create plan.md or tasks.md yet (that is `/plan`).
2. Read before writing:
   - `CLAUDE.md` and `docs/feature-layout.md`
   - the matching design: `docs/design/screens/<screen>.md`, the raw board in `design/boards/`,
     `docs/design-map.md`
   - for anything that talks to the AC: `learn/miraie-protocol.md` and the `miraie-protocol` skill
   - related specs in `specs/` so you don't duplicate or contradict them
3. Fill the template in this order:
   - **Assumptions** first: every guess you made (limits, wording, which board wins, what the
     API does). Phrase each so the user can correct it in seconds.
   - **Goal**: one or two sentences, user-facing.
   - **Acceptance criteria**: a Given | When | Then table with IDs `AC-1`, `AC-2`, … Concrete
     values only ("24°", "Bedroom", "Offline"), no "works correctly". Cover loading, error,
     empty and offline states, or list them as open questions if the design doesn't show them.
   - **Out of scope**: what a reader might expect that this ticket does not do.
   - **Open questions**: table `| # | Who decides | Question | Answer |`. Add one for every item
     on the stop-and-ask list in `CLAUDE.md` that applies: a missing design state, a value that
     isn't a token, boards that disagree, wording nobody gave, anything that needs the MirAIe
     account, any change to how credentials are stored or sent.
4. Do not write code, tests or tasks.
5. STOP. Reply with the spec path and the open questions as a numbered list. The spec is not
   ready for `/plan` until every open question has an answer written into its row (with the date).
