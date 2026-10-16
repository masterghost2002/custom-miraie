# Roadmap

Each feature is a ticket folder with `spec.md` (what and why, acceptance criteria, open questions),
`plan.md` (order, files, risks) and `tasks.md` (one commit each). Tasks marked `BLOCKED by Qn` wait for
the owner's answer in that spec's Open questions table. Next free number: **CHILL-012**.

| ID                                           | Feature                                       | Board     | Depends on | Status      | Waiting on the owner                                                                     |
| -------------------------------------------- | --------------------------------------------- | --------- | ---------- | ----------- | ---------------------------------------------------------------------------------------- |
| [CHILL-001](CHILL-001-agent-harness/spec.md) | Agent harness: gates, hooks, review stamp, CI | —         | —          | ready       | Q1 Storybook later? Q2 review on CI? (defaults recommended)                              |
| [CHILL-002](CHILL-002-miraie-client/spec.md) | MirAIe client (REST + MQTT) + demo backend    | —         | 001        | ready       | Owner checks O1–O3 with the account (not blocking)                                       |
| [CHILL-003](CHILL-003-design-system/spec.md) | Design-system primitives in `src/ui`          | Style     | 001        | ready       | Q1 glass tint, Q2 board disagreements (defaults proposed)                                |
| [CHILL-004](CHILL-004-sign-in/spec.md)       | Sign in                                       | SignIn    | 002, 003   | draft       | Q1 error wording, Q2 busy state, Q3 account button                                       |
| [CHILL-005](CHILL-005-home/spec.md)          | Home                                          | Main      | 002–004    | draft       | Q1 mode words, Q2 greetings, Q3 loading/error/empty, Q4 airflow subtitle, Q5 1 or 4+ ACs |
| [CHILL-006](CHILL-006-climate/spec.md)       | Climate                                       | Climate   | 005        | draft       | Q1 More options, Q2 offline, Q3 Heat, Q4 half degrees, Q5 small iPhones                  |
| [CHILL-007](CHILL-007-airflow/spec.md)       | Airflow                                       | Airflow   | 005        | draft       | Q1 off/offline, Q2 horizontal swing support                                              |
| [CHILL-008](CHILL-008-all-devices/spec.md)   | All devices                                   | Rooms     | 005        | draft       | Q1 row opens Home or Climate                                                             |
| [CHILL-009](CHILL-009-schedules/spec.md)     | Schedules + sleep timer                       | Schedules | 002, 003   | **blocked** | Q1 how schedules can run (no known API), Q2 editor design, Q3 clashes                    |
| [CHILL-010](CHILL-010-settings/spec.md)      | Settings                                      | none      | 003, 004   | **blocked** | Q1 no board, Q2 sign-out confirm, Q3 display light                                       |
| [CHILL-011](CHILL-011-ios-dev-build/spec.md) | iOS development build                         | —         | 002        | **blocked** | Q1 Xcode (free) vs EAS ($99/yr), Q2 app icon                                             |

## Build order

1. **CHILL-001** — the checks come first, so everything after is held to them.
2. **CHILL-002** and **CHILL-003** — independent of each other; both can start right away.
3. **CHILL-004 → 005 → 006 / 007 / 008** — screens, against the demo backend in Expo Go and the web
   preview; their blocked tasks wait for answers, the rest proceeds.
4. **CHILL-011** — as soon as Q1 is answered; needed for anything live on the iPhone.
5. **CHILL-009**, **CHILL-010** — once their blocking questions are answered.

## Where things are

- Design: `design/README.md` (boards), `docs/design/` (language + per-screen specs), `docs/design-map.md`.
- Rules: `CLAUDE.md`, `docs/engineering-rules.md`, `docs/feature-layout.md`.
- Protocol: `learn/miraie-protocol.md`. Reference implementation:
  [painful-bug/Panasonic-MirAIe-MCP-Server](https://github.com/painful-bug/Panasonic-MirAIe-MCP-Server).
