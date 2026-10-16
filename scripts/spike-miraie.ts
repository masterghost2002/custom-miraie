// pnpm spike:miraie — the owner's check that the live client works with their account
// (CHILL-002 AC-11, owner check O1). Reads MIRAIE_LOGIN_ID / MIRAIE_PASSWORD from .env.local,
// signs in, prints the home's ACs, then 30 s of live status pushes.
//
//   pnpm spike:miraie                 read only
//   pnpm spike:miraie --write-test    also flips the first online AC's display light and back
//
// Prints no password, token, home id or raw payload. Run it only on your own laptop.
//
// TLS trusts Node's bundled CAs only — never the system store — so a TLS-intercepting proxy
// (Zscaler on the work Mac) can't read your MirAIe password: run it off the corporate network or
// with *.miraie.in on the proxy's SSL-bypass list. `--use-system-ca` is for package installs only.
import fs from 'node:fs';
import path from 'node:path';

import { createMemoryCredentialStore } from '../src/lib/miraie/backend';
import { createLiveBackend } from '../src/lib/miraie/live-backend';
import { nodeTlsSocketFactory } from '../src/lib/miraie/mqtt/socket.node';
import type { AcDevice, AcStatus } from '../src/lib/miraie/types';

const LISTEN_MS = 30_000;

function readEnvLocal(): Record<string, string> {
  const file = path.join(__dirname, '..', '.env.local');
  if (!fs.existsSync(file)) return {};
  const env: Record<string, string> = {};
  for (const line of fs.readFileSync(file, 'utf8').split('\n')) {
    const match = /^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/.exec(line);
    if (match?.[1]) env[match[1]] = (match[2] ?? '').replace(/^["']|["']$/g, '');
  }
  return env;
}

function describe(status: AcStatus): string {
  if (!status.online) return 'offline';
  const parts = [
    status.power ? 'on' : 'standby',
    status.mode,
    `set ${status.targetTemp ?? '?'}°`,
    `inside ${status.roomTemp ?? '?'}°`,
    `fan ${status.fan}`,
    `swing ${status.swingV}/${status.swingH}`,
    status.preset === 'none' ? null : status.preset,
    `display ${status.display ? 'on' : 'off'}`,
  ];
  return parts.filter(Boolean).join(', ');
}

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/** Why this process would trust more than Node's bundled CAs, or null. */
function extraTrust(): string | null {
  const flags = [process.env.NODE_OPTIONS ?? '', ...process.execArgv].join(' ');
  if (/--use-(system|openssl|bundled-and-system)-ca/.test(flags)) return 'a --use-*-ca flag';
  if (process.env.NODE_EXTRA_CA_CERTS) return 'NODE_EXTRA_CA_CERTS';
  return null;
}

async function main() {
  const trust = extraTrust();
  if (trust) {
    console.error(`Refusing to send your MirAIe password: ${trust} adds extra trusted CAs.`);
    console.error('Run `pnpm spike:miraie` (it clears them), off the corporate network.');
    process.exit(1);
  }
  const env = { ...readEnvLocal(), ...process.env };
  const loginId = env.MIRAIE_LOGIN_ID;
  const password = env.MIRAIE_PASSWORD;
  if (!loginId || !password) {
    console.error('Set MIRAIE_LOGIN_ID and MIRAIE_PASSWORD in .env.local (see .env.example).');
    process.exit(1);
  }

  const backend = createLiveBackend({
    socketFactory: nodeTlsSocketFactory,
    credentials: createMemoryCredentialStore(),
  });

  const names = new Map<string, string>();
  backend.subscribe((event) => {
    const time = new Date().toLocaleTimeString();
    if (event.type === 'connection') console.log(`[${time}] MQTT ${event.state}`);
    if (event.type === 'signed-out') console.log(`[${time}] MirAIe signed us out`);
    if (event.type === 'status') {
      const name = names.get(event.deviceId) ?? 'AC';
      const status = event.status as AcStatus;
      console.log(`[${time}] ${name}: ${describe(status)}`);
    }
  });

  console.log('Signing in…');
  await backend.signIn(loginId, password);
  const home = await backend.getHome();
  console.log(`\n${home.devices.length} air conditioner(s):`);
  for (const device of home.devices) {
    names.set(device.id, device.room || device.name);
    const status = home.statuses[device.id] as AcStatus;
    const model = [device.model.brand, device.model.modelName].filter(Boolean).join(' ');
    console.log(
      `  • ${device.room} — ${device.name}${model ? ` (${model})` : ''}: ${describe(status)}`,
    );
  }

  if (process.argv.includes('--write-test')) {
    const target = home.devices.find((d: AcDevice) => home.statuses[d.id]?.online);
    if (target) {
      const before = (home.statuses[target.id] as AcStatus).display;
      console.log(
        `\nWrite test: display light ${before ? 'off' : 'on'} on ${target.room}, back in 5 s…`,
      );
      await backend.send(target.id, { kind: 'display', on: !before });
      await wait(5000);
      await backend.send(target.id, { kind: 'display', on: before });
    } else {
      console.log('\nWrite test skipped: no AC is online.');
    }
  }

  console.log(`\nListening for status pushes for ${LISTEN_MS / 1000} s…`);
  await wait(LISTEN_MS);
  await backend.signOut();
  console.log('Done.');
  process.exit(0);
}

main().catch((error: unknown) => {
  // Error classes from src/lib/miraie carry no credentials.
  console.error(error instanceof Error ? `${error.name}: ${error.message}` : 'Spike failed');
  process.exit(1);
});
