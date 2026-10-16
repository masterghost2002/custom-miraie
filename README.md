# Chill

A calm, Tesla-inspired iPhone app for Panasonic MirAIe air conditioners — an unofficial replacement
for the MirAIe app. Built agent-first: specs and checks in this repo tell AI agents what to build and
stop them when they get it wrong.

- **Design:** [`design/`](design/README.md) — live canvas + verbatim board copies, per-screen specs
- **What to build:** [`specs/ROADMAP.md`](specs/ROADMAP.md) — one folder per feature (spec, plan, tasks)
- **How MirAIe works:** [`learn/miraie-protocol.md`](learn/miraie-protocol.md)
- **Rules for agents:** [`CLAUDE.md`](CLAUDE.md)

## Run

```bash
pnpm install
pnpm start        # scan the QR with the iPhone camera → Expo Go
pnpm web          # browser preview at http://localhost:8081 (demo data)
```

Live AC control needs a raw TLS socket to `mqtt.miraie.in:8883`, which Expo Go can't open; from
CHILL-011 on, the app runs as a development build (see that spec).

Unofficial · not affiliated with Panasonic. API knowledge comes from
[painful-bug/Panasonic-MirAIe-MCP-Server](https://github.com/painful-bug/Panasonic-MirAIe-MCP-Server).
