# CHILL-011 — Plan

Draft — the steps depend on Q1.

## Order

1. `pnpm expo install expo-dev-client`; scripts `ios` (`expo run:ios --device`) or `eas.json` profiles.
2. Route A: Xcode → sign with the owner's Apple ID → `pnpm ios`.
   Route B: `npx eas-cli@latest build --profile development --platform ios`, register the device
   (`eas device:create`), install from the build link.
3. Verify AC-2…AC-4; document in README.

## Files

- `package.json`, `app.json`, `eas.json` (route B), `README.md`

## Risks

| Risk                                                | What we do about it                                                                       |
| --------------------------------------------------- | ----------------------------------------------------------------------------------------- |
| Zscaler breaks downloads during the build (route A) | `NODE_OPTIONS=--use-system-ca`; CocoaPods may need the Zscaler root in its CA bundle      |
| Free signing expires after 7 days (route A)         | Re-run `pnpm ios`; note in README                                                         |
| react-native-tcp-socket TLS fails on device         | Fallback: diagnose with the spike's packet log; the session only needs `write/on/destroy` |

## How we will know it works

- Manual only: AC-1…AC-5 on the owner's iPhone.
