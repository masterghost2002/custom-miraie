---
name: miraie-protocol
description: Use when touching src/lib/miraie (REST, auth, status parsing, message builders, MQTT codec/session, demo backend) or adding a device control end to end. Forbids building MQTT payloads outside messages.ts, guessing payload keys, disabling TLS, logging credentials, and testing against a real AC without asking.
---

# MirAIe protocol

Full explainer: `learn/miraie-protocol.md`. Source of truth for keys and behaviour:
github.com/painful-bug/Panasonic-MirAIe-MCP-Server (`api.py`, `broker.py`, `device.py`).

## REST

| Call           | Request                                                                                                                 | Response used                                                                                                                                                   |
| -------------- | ----------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Login          | `POST https://auth.miraie.in/simplifi/v1/userManagement/login` JSON `{ clientId, password, scope, <authKey>: loginId }` | 200 `{ accessToken, refreshToken, userId, expiresIn }`; 401 bad credentials; 412 mobile not registered; other → connection error                                |
| Homes          | `GET https://app.miraie.in/simplifi/v1/homeManagement/homes`                                                            | `[ { homeId, spaces: [ { spaceName, devices: [ { deviceId, deviceName, topic: [ "<topic>" ] } ] } ] } ]` — first home only                                      |
| Device details | `GET https://app.miraie.in/simplifi/v1/deviceManagement/devices/deviceId/{deviceId}`                                    | `[ { category, modelName, macAddress, brand, firmwareVersion, serialNumber, modelNumber, productSerialNumber } ]` — keep only `category.toLowerCase() === 'ac'` |
| Status         | `GET https://app.miraie.in/simplifi/v1/deviceManagement/devices/{deviceId}/mobile/status`                               | status object (below)                                                                                                                                           |

- `clientId` = `PBcMcfG19njNCL8AOgvRzIC8AjQa` (public app id from the official app).
- `scope` = `"an"` + `Math.floor(Math.random() * 1e9)`.
- `authKey`: `email` if the login id contains `@`; `mobile` if it is digits (optionally `+`);
  otherwise `username`.
- App calls send `Authorization: Bearer <accessToken>` and `Content-Type: application/json`.

## Status keys (REST status and MQTT `{topic}/status` pushes)

| Key            | Meaning            | Type / values                                                            |
| -------------- | ------------------ | ------------------------------------------------------------------------ |
| `ps`           | power              | `"on"` \| `"off"`                                                        |
| `actmp`        | target temperature | string number, e.g. `"24.0"` (parse to number; unparsable → unknown)     |
| `rmtmp`        | room temperature   | string number                                                            |
| `acmd`         | mode               | `"cool"` \| `"auto"` \| `"dry"` \| `"fan"` \| `"heat"`                   |
| `acfs`         | fan speed          | `"auto"` \| `"quiet"` \| `"low"` \| `"medium"` \| `"high"`               |
| `acdc`         | indoor display     | `"on"` \| `"off"`                                                        |
| `acpm`         | powerchill (boost) | `"on"` \| `"off"`                                                        |
| `acem`         | eco                | `"on"` \| `"off"`                                                        |
| `acvs`         | vertical swing     | number `0` (auto/swing) … `5`                                            |
| `achs`         | horizontal swing   | number `0` (auto/swing) … `5`                                            |
| `onlineStatus` | online             | `"true"` \| `"false"` (also arrives alone on `{topic}/connectionStatus`) |

Preset is derived: `acpm === "on"` → powerchill, else `acem === "on"` → eco, else none.
MQTT pushes may be partial: merge into the cached status, never replace it with missing keys.

## Control messages (publish JSON to `{topic}/control`)

Every message = base `{ "ki": 1, "cnt": "an", "sid": "1" }` + the control's keys:

| Control              | Extra keys                                                 |
| -------------------- | ---------------------------------------------------------- |
| Power                | `ps: "on" \| "off"`                                        |
| Temperature          | `actmp: "<n>"` (string, e.g. `"24.0"`), 16–30              |
| Mode                 | `acmd: "<mode>"`                                           |
| Fan                  | `acfs: "<speed>"`                                          |
| Display              | `acdc: "on" \| "off"`                                      |
| Vertical swing       | `acvs: <0–5>` (number)                                     |
| Horizontal swing     | `achs: <0–5>` (number)                                     |
| Eco on               | `acem: "on", acpm: "off", actmp: 26`                       |
| Powerchill on        | `acpm: "on", acem: "off"`                                  |
| Eco / powerchill off | `acem: "off"` or `acpm: "off"` (none preset: both `"off"`) |

Eco and powerchill are never on together. Build payloads ONLY in `src/lib/miraie/messages.ts`.

## MQTT

- Broker `mqtt.miraie.in:8883`, TLS with normal certificate verification (never disable it).
- MQTT **3.1**: protocol name `MQIsdp`, level 3, clean session **false**, keepalive 60 s.
- `username` = `homeId`, `password` = `accessToken`, `clientId` = `"an"` + 16 random digits + 5
  random digits.
- Subscribe qos 1 to `{topic}/status` and `{topic}/connectionStatus` for every AC.
- On CONNACK rc 4/5 or an unexpected disconnect: log in again (stored credentials) and reconnect
  with the new access token.
- No WebSocket endpoint exists (probed 2026-10-16), so the phone opens a raw TLS socket through
  `react-native-tcp-socket` (`mqtt/socket.native.ts`) → needs a dev build, not Expo Go. The codec
  (`mqtt/codec.ts`) is hand-written and tested against `mqtt-packet` + a real `aedes` broker.

## Add a new control, end to end

1. **Builder + test**: add `buildXMessage()` to `messages.ts`; test the exact JSON in
   `src/lib/miraie/__tests__/messages.test.ts`.
2. **Status**: if it adds a status key, parse it in `status.ts` (with a test for a partial push).
3. **Backend**: add the method to the `MiraieBackend` interface (`backend.ts`), the live
   implementation (publish via the session) and the demo backend (`demo/`), which must update its
   in-memory status and push it back like the real broker does.
4. **Hook**: a TanStack Query `useMutation` in the feature's `hooks/` with an optimistic update of
   the device's status query, rolled back on error.
5. **UI**: wire it to the control from the board (`build-screen-from-design` skill), test it
   through `<BackendProvider>` with a test backend, asserting what the user sees.

## Don't

- Don't test against the real account or a real AC without asking the user first.
- Don't log tokens, passwords or full auth responses.
- Don't put credentials anywhere but expo-secure-store.
