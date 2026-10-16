# CHILL-002 — MirAIe client (REST + MQTT) and demo backend

Status: ready (owner checks listed below need the MirAIe account) · Design: none (no UI) ·
Depends on: CHILL-001 (gates) · Explainer: `learn/miraie-protocol.md`

## Assumptions (correct these now, or the work goes ahead on them)

- The reference behaviour is the Python library in
  [painful-bug/Panasonic-MirAIe-MCP-Server](https://github.com/painful-bug/Panasonic-MirAIe-MCP-Server)
  (`api.py`, `broker.py`, `device.py`). We copy its requests and payloads byte for byte unless a device
  test shows otherwise.
- **First home only** (`homes[0]`), **air conditioners only** (`category` = `ac`), like the reference.
- Login ID kind is detected from its shape: contains `@` → `email`; only digits (optionally a leading
  `+`) → `mobile`; anything else → `username`. The value is sent as typed.
- No refresh-token endpoint is known. When REST returns 401 or the broker refuses the token
  (CONNACK 4/5), the client signs in again **once** with the stored password, then gives up and
  reports `signed-out`.
- MQTT: TLS to `mqtt.miraie.in:8883` (probe on 2026-10-16: broker answers MQTT 3.1; no WebSocket
  endpoint), protocol `MQIsdp` level 3, client ID `an` + 16 + 5 random digits, clean session **false**,
  keep-alive 60 s, username = home ID, password = access token. Subscribe QoS 1 to every AC's
  `{topic}/status` and `{topic}/connectionStatus`; publish controls to `{topic}/control` at QoS 0.
- The MQTT 3.1 client is hand-written (`mqtt/codec.ts`, `mqtt/session.ts`): mqtt.js cannot open a raw
  TLS socket in React Native and `mqtt-packet` pulls in Node's stream stack. The codec only needs
  CONNECT, CONNACK, SUBSCRIBE, SUBACK, PUBLISH, PUBACK, PINGREQ, PINGRESP, DISCONNECT.
- The socket is injected: `react-native-tcp-socket` TLS on the phone (`mqtt/socket.native.ts`),
  Node `tls` in tests and the spike. Web has no socket; web always uses the demo backend.
- Commands are optimistic: the query cache changes immediately; a status push confirms it. With no push
  within 5 s, the client refetches status over REST and the cache follows the device.
- Temperature is sent like the reference: `actmp` as a string with one decimal (`"24.0"`); the eco
  preset sends `actmp: 26.0` as a number. Owner check O2 confirms the device accepts both.
- The demo backend mirrors the boards' demo data: Bedroom (on, cool, 24°, inside 27°), Living room
  (standby, dry, 25°, inside 29°), Study (offline, cool, 24°, inside 31°); it answers every command with
  a status push after 300 ms.

## Goal

One typed `MiraieBackend` the app talks to, with two implementations — live MirAIe and an in-memory
demo — so every screen can be built and tested without the account, and works for real on the iPhone.

## Acceptance criteria

| ID    | Given                                                                                                               | When                                        | Then                                                                                                                                                                                                                                           |
| ----- | ------------------------------------------------------------------------------------------------------------------- | ------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| AC-1  | a login ID and password                                                                                             | `signIn` is called                          | it POSTs `{clientId: "PBcMcfG19njNCL8AOgvRzIC8AjQa", password, scope: "an<9 digits>", <email\|mobile\|username>: id}` to `auth.miraie.in/simplifi/v1/userManagement/login` and returns `{accessToken, refreshToken, userId, expiresIn}`        |
| AC-2  | the server answers 401 / 412 / anything else                                                                        | `signIn`                                    | it throws `WrongCredentialsError` / `NotRegisteredError` / `MiraieNetworkError` (with status)                                                                                                                                                  |
| AC-3  | a signed-in session                                                                                                 | `getHome`                                   | it returns the first home: `homeId` and its ACs, each with `id`, `name`, `room` (spaceName), `topic`, model info and parsed status; non-AC devices are skipped                                                                                 |
| AC-4  | a status JSON (`ps, actmp, rmtmp, acmd, acfs, acdc, acpm, acem, acvs, achs, onlineStatus`)                          | `parseStatus`                               | it returns `AcStatus {online, power, mode, targetTemp, roomTemp, fan, display, preset, swingV, swingH}`; preset is `boost` if `acpm` = on, else `eco` if `acem` = on, else `none`; an unknown enum value becomes `unknown` instead of throwing |
| AC-5  | each control (power, temperature, mode, fan, preset none/eco/boost, swing V/H 0–5, display, power plan, powerchill) | its builder runs                            | the JSON equals the reference's exactly (base `{ki:1, cnt:"an", sid:"1"}` + keys); a table test pins every case                                                                                                                                |
| AC-6  | any packet the session sends or receives                                                                            | encoded/decoded by `codec.ts`               | `mqtt-packet` decodes our output to the same fields, and we decode `mqtt-packet`'s output — including several packets in one chunk and one packet split across chunks                                                                          |
| AC-7  | a local `aedes` broker                                                                                              | the session connects, subscribes, publishes | the broker sees CONNECT (MQIsdp, clean false), SUBSCRIBE QoS 1, the control PUBLISH; a status publish reaches our callback; PINGREQ is sent on keep-alive                                                                                      |
| AC-8  | the broker refuses the token (CONNACK 4 or 5) or drops the connection                                               | session handling                            | it signs in again once and reconnects with the new token; a second refusal emits `signed-out`                                                                                                                                                  |
| AC-9  | a command and no status push within 5 s                                                                             | after the timeout                           | status is refetched over REST and the cache shows the device's real state                                                                                                                                                                      |
| AC-10 | the demo backend                                                                                                    | any `MiraieBackend` call                    | it behaves like the live one (same types, status push 300 ms after a command, offline AC rejects commands)                                                                                                                                     |
| AC-11 | `.env.local` with `MIRAIE_LOGIN_ID` / `MIRAIE_PASSWORD`                                                             | the owner runs `pnpm spike:miraie`          | it prints the home's ACs and 30 s of live status pushes, then optionally toggles the display light as a harmless write test                                                                                                                    |

## Out of scope

- Schedules and timers on the MirAIe cloud (no API known — CHILL-009).
- More than one home, energy usage, firmware info screens.
- Web live mode (browsers can't open raw TLS sockets).

## Open questions

| #   | Who decides | Question                                                                                                                                                                                                        | Answer (with date)             |
| --- | ----------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------ |
| Q1  | Owner       | Keep the MirAIe password in the iPhone's secure storage so the app can sign in again by itself? The Sign in board already promises "Your password stays in this phone's secure storage", so the default is yes. | Yes — design copy (2026-10-16) |

## Owner checks (need the MirAIe account; not blocking the build)

- O1: `pnpm spike:miraie` lists your ACs with the right rooms and live status.
- O2: on the phone, changing temperature, mode, fan, swing, eco and powerchill moves the real AC.
- O3: tell us whether swing position 1 means highest / far-left, as the boards assume.
