/** @jest-environment node */
// The Node TLS socket verifies certificates: a server with a self-signed certificate is refused
// (CHILL-002 — "TLS verified"). The certificate is generated per run; no key is committed.
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import tls from 'node:tls';

import { nodeTlsSocketFactory } from '../mqtt/socket.node';

jest.setTimeout(20_000);

let server: tls.Server;
let port: number;
let dir: string;

beforeAll(async () => {
  dir = fs.mkdtempSync(path.join(os.tmpdir(), 'chill-tls-'));
  const key = path.join(dir, 'key.pem');
  const cert = path.join(dir, 'cert.pem');
  execFileSync(
    'openssl',
    [
      'req',
      '-x509',
      '-newkey',
      'rsa:2048',
      '-nodes',
      '-keyout',
      key,
      '-out',
      cert,
      '-days',
      '1',
      '-subj',
      '/CN=localhost',
    ],
    { stdio: 'ignore' },
  );
  server = tls.createServer({ key: fs.readFileSync(key), cert: fs.readFileSync(cert) }, (s) =>
    s.end(),
  );
  await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve));
  port = (server.address() as { port: number }).port;
});

afterAll(async () => {
  await new Promise<void>((resolve) => server.close(() => resolve()));
  fs.rmSync(dir, { recursive: true, force: true });
});

it('given a server whose certificate is not trusted, when the TLS socket connects, then it errors and never reports connected', async () => {
  const events: string[] = [];
  await new Promise<void>((resolve) => {
    nodeTlsSocketFactory(
      { host: 'localhost', port },
      {
        onConnect: () => events.push('connect'),
        onData: () => events.push('data'),
        onError: (error) => events.push(`error:${(error as NodeJS.ErrnoException).code}`),
        onClose: () => {
          events.push('close');
          resolve();
        },
      },
    );
  });
  expect(events).toContain('close');
  expect(events).not.toContain('connect');
  expect(
    events.some((e) =>
      /^error:(DEPTH_ZERO_SELF_SIGNED_CERT|SELF_SIGNED_CERT_IN_CHAIN|UNABLE_TO_VERIFY_LEAF_SIGNATURE)$/.test(
        e,
      ),
    ),
  ).toBe(true);
});
