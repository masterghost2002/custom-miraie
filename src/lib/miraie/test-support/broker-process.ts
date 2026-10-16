// Starts aedes-broker.mjs in a child process and lets a test wait for what the broker saw.
// Test-only (excluded from coverage in jest.config.js).
import { spawn } from 'node:child_process';
import path from 'node:path';
import readline from 'node:readline';

export type BrokerEvent = { event: string } & Record<string, unknown>;

export interface TestBroker {
  port: number;
  events: BrokerEvent[];
  /** Resolves with the first event (already seen or future) matching `predicate`. */
  waitFor(predicate: (e: BrokerEvent) => boolean, timeoutMs?: number): Promise<BrokerEvent>;
  publish(topic: string, payload: string, qos?: 0 | 1): Promise<void>;
  setPasswords(passwords: string[]): Promise<void>;
  /** Drops every client connection, like a network failure. */
  kick(): Promise<void>;
  /** Answers the next `times` CONNECTs with CONNACK `returnCode` (2–5). */
  refuseNext(returnCode: number, times: number): Promise<void>;
  stop(): Promise<void>;
}

export async function startBroker(passwords: string[] = []): Promise<TestBroker> {
  const script = path.join(__dirname, 'aedes-broker.mjs');
  const child = spawn(process.execPath, [script, JSON.stringify(passwords)], {
    stdio: ['pipe', 'pipe', 'inherit'],
  });
  const events: BrokerEvent[] = [];
  const waiters: { predicate: (e: BrokerEvent) => boolean; resolve: (e: BrokerEvent) => void }[] =
    [];

  readline.createInterface({ input: child.stdout }).on('line', (line) => {
    const event = JSON.parse(line) as BrokerEvent;
    events.push(event);
    for (const waiter of [...waiters]) {
      if (waiter.predicate(event)) {
        waiters.splice(waiters.indexOf(waiter), 1);
        waiter.resolve(event);
      }
    }
  });

  const waitFor = (predicate: (e: BrokerEvent) => boolean, timeoutMs = 4000) => {
    const seen = events.find(predicate);
    if (seen) return Promise.resolve(seen);
    return new Promise<BrokerEvent>((resolve, reject) => {
      const timer = setTimeout(() => {
        waiters.splice(waiters.indexOf(waiter), 1);
        reject(new Error(`Broker never saw the expected event. Saw: ${JSON.stringify(events)}`));
      }, timeoutMs);
      const waiter = {
        predicate,
        resolve: (e: BrokerEvent) => {
          clearTimeout(timer);
          resolve(e);
        },
      };
      waiters.push(waiter);
    });
  };

  const send = (command: object) => child.stdin.write(`${JSON.stringify(command)}\n`);
  const listening = await waitFor((e) => e.event === 'listening', 10_000);

  return {
    port: listening.port as number,
    events,
    waitFor,
    async publish(topic, payload, qos = 1) {
      const count = events.filter((e) => e.event === 'published' && e.topic === topic).length;
      send({ cmd: 'publish', topic, payload, qos });
      await waitFor(
        (e) =>
          e.event === 'published' &&
          e.topic === topic &&
          events.filter((x) => x.event === 'published' && x.topic === topic).length > count,
      );
    },
    async setPasswords(list) {
      const count = events.filter((e) => e.event === 'passwords').length;
      send({ cmd: 'passwords', passwords: list });
      await waitFor(() => events.filter((x) => x.event === 'passwords').length > count);
    },
    async refuseNext(returnCode, times) {
      const count = events.filter((e) => e.event === 'refuseNext').length;
      send({ cmd: 'refuseNext', returnCode, times });
      await waitFor(() => events.filter((x) => x.event === 'refuseNext').length > count);
    },
    async kick() {
      const count = events.filter((e) => e.event === 'kicked').length;
      send({ cmd: 'kick' });
      await waitFor(() => events.filter((x) => x.event === 'kicked').length > count);
    },
    stop() {
      return new Promise<void>((resolve) => {
        child.once('exit', () => resolve());
        child.stdin.end();
        setTimeout(() => child.kill(), 2000).unref();
      });
    },
  };
}
