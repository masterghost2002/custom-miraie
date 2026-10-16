// The React glue rendered with the real demo backend (the network stand-in) and real TanStack
// Query: status pushes land in the cache, commands are optimistic and roll back on failure.
import { QueryClient } from '@tanstack/react-query';
import { act, renderHook, waitFor } from '@testing-library/react-native';
import type { ReactNode } from 'react';

import type { MiraieBackend } from '../../backend';
import { createDemoBackend, demoDevice, type DemoSeed } from '../../demo/demo-backend';
import { DeviceOfflineError, MiraieNetworkError } from '../../errors';
import type { BackendEvent } from '../../types';
import {
  BackendProvider,
  useBackend,
  useBackendEvents,
  useConnectionState,
} from '../backend-provider';
import { queryKeys } from '../query-keys';
import { useAcCommand, useSendCommand } from '../use-ac-command';
import { useSignIn, useSignOut } from '../use-account';
import { useAcStatus } from '../use-ac-status';
import { useHome } from '../use-home';

// Every test leaves no timers behind (demo pushes, query garbage collection), so Jest can exit.
const cleanups: (() => Promise<void> | void)[] = [];
afterEach(async () => {
  for (const cleanup of cleanups.splice(0)) await cleanup();
});

function setup(seed: DemoSeed = {}) {
  const backend = createDemoBackend({ latencyMs: 30, ...seed });
  // Count REST-like reads, to prove the cache is used instead of the network.
  const calls = { getStatus: 0, getHome: 0 };
  const counted: MiraieBackend = {
    ...backend,
    getStatus: (id) => {
      calls.getStatus++;
      return backend.getStatus(id);
    },
    getHome: () => {
      calls.getHome++;
      return backend.getHome();
    },
  };
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: Infinity },
      mutations: { gcTime: Infinity },
    },
  });
  cleanups.push(
    () => queryClient.clear(),
    () => backend.signOut(),
  );
  function Providers({ children }: { children: ReactNode }) {
    return (
      <BackendProvider backend={counted} queryClient={queryClient}>
        {children}
      </BackendProvider>
    );
  }
  return { backend, calls, queryClient, wrapper: Providers };
}

/** Home + one AC's live status + its command hook, as a screen would use them. */
function useBedroom() {
  const home = useHome();
  const status = useAcStatus(home.data ? 'bed' : undefined);
  const command = useAcCommand('bed');
  return { home, status, command };
}

describe('React glue', () => {
  it('given the demo home, when useHome loads, then the ACs are listed and each status is seeded without a REST read', async () => {
    const { wrapper, calls } = setup();
    const { result } = await renderHook(useBedroom, { wrapper });

    await waitFor(() => expect(result.current.home.data?.devices).toHaveLength(3));
    await waitFor(() =>
      expect(result.current.status).toMatchObject({ power: true, targetTemp: 24 }),
    );
    expect(calls.getStatus).toBe(0);
  });

  it('given an AC whose status is not cached, when useAcStatus mounts, then it reads it from the backend', async () => {
    const { wrapper, calls } = setup();
    const { result } = await renderHook(() => useAcStatus('living'), { wrapper });
    await waitFor(() => expect(result.current).toMatchObject({ mode: 'dry', power: false }));
    expect(calls.getStatus).toBe(1);
  });

  it('given a status push, when it arrives, then the cached status updates and keeps the other fields', async () => {
    const { wrapper, backend } = setup();
    const { result } = await renderHook(useBedroom, { wrapper });
    await waitFor(() => expect(result.current.status?.mode).toBe('cool'));

    await act(async () => backend.simulate.push('bed', { mode: 'dry' }));

    await waitFor(() =>
      expect(result.current.status).toMatchObject({ mode: 'dry', power: true, targetTemp: 24 }),
    );
  });

  it('given a push for an AC nobody has loaded, then it is ignored', async () => {
    const { wrapper, backend, queryClient } = setup();
    await renderHook(() => useBackend(), { wrapper });
    await act(async () => backend.simulate.push('living', { mode: 'heat' }));
    expect(queryClient.getQueryData(['miraie', 'ac', 'living', 'status'])).toBeUndefined();
  });

  it('given a command, when sent, then the status changes before the AC confirms it (optimistic)', async () => {
    // The demo's push is a minute away, so the change on screen can only be the optimistic one.
    const { wrapper } = setup({ latencyMs: 60_000 });
    const { result } = await renderHook(useBedroom, { wrapper });
    await waitFor(() => expect(result.current.status?.power).toBe(true));

    await act(async () => result.current.command.send({ kind: 'power', on: false }));

    await waitFor(() => expect(result.current.status?.power).toBe(false));
    await waitFor(() => expect(result.current.command.isPending).toBe(false));
    expect(result.current.command.error).toBeNull();
  });

  it('given a command, when the AC pushes its new status, then the cache keeps it', async () => {
    const { wrapper, queryClient } = setup({ latencyMs: 30 });
    const { result } = await renderHook(useBedroom, { wrapper });
    await waitFor(() => expect(result.current.status?.fan).toBe('auto'));

    await act(async () => result.current.command.send({ kind: 'fan', speed: 'high' }));
    await act(() => new Promise((r) => setTimeout(r, 80))); // the demo's push

    expect(queryClient.getQueryData(['miraie', 'ac', 'bed', 'status'])).toMatchObject({
      fan: 'high',
    });
  });

  it('given eco, when sent, then the optimistic status already holds 26°', async () => {
    const { wrapper } = setup({ latencyMs: 60_000 });
    const { result } = await renderHook(useBedroom, { wrapper });
    await waitFor(() => expect(result.current.status).toBeDefined());

    await act(async () => result.current.command.send({ kind: 'preset', preset: 'eco' }));

    await waitFor(() =>
      expect(result.current.status).toMatchObject({ preset: 'eco', targetTemp: 26 }),
    );
  });

  it('given the command fails, when sent, then the status rolls back and the error is exposed', async () => {
    const { wrapper } = setup({ failCommandsFor: ['bed'] });
    const { result } = await renderHook(useBedroom, { wrapper });
    await waitFor(() => expect(result.current.status?.power).toBe(true));

    await act(async () => result.current.command.send({ kind: 'power', on: false }));

    await waitFor(() => expect(result.current.command.error).toBeInstanceOf(MiraieNetworkError));
    expect(result.current.status?.power).toBe(true);
  });

  it('given an offline AC, when a command is sent, then it rejects with DeviceOfflineError and nothing changes', async () => {
    const { wrapper } = setup();
    const { result } = await renderHook(
      () => {
        useHome();
        return { status: useAcStatus('study'), send: useSendCommand() };
      },
      { wrapper },
    );
    await waitFor(() => expect(result.current.status?.online).toBe(false));

    let error: unknown;
    await act(async () => {
      error = await result.current.send('study', { kind: 'power', on: true }).catch((e) => e);
    });

    expect(error).toBeInstanceOf(DeviceOfflineError);
    expect(result.current.status?.power).toBe(false);
  });

  it('given useSendCommand, when several ACs are switched, then each one changes', async () => {
    const { wrapper } = setup({ latencyMs: 60_000 });
    const { result } = await renderHook(
      () => {
        useHome();
        return {
          bed: useAcStatus('bed'),
          living: useAcStatus('living'),
          send: useSendCommand(),
        };
      },
      { wrapper },
    );
    await waitFor(() => expect(result.current.living).toBeDefined());

    await act(async () => {
      await Promise.all([
        result.current.send('bed', { kind: 'power', on: false }),
        result.current.send('living', { kind: 'power', on: true }),
      ]);
    });

    await waitFor(() => expect(result.current.bed?.power).toBe(false));
    await waitFor(() => expect(result.current.living?.power).toBe(true));
  });

  it('given the connection comes back after a drop, then cached statuses are refetched', async () => {
    const { wrapper, backend, calls } = setup();
    const { result } = await renderHook(useBedroom, { wrapper });
    await waitFor(() => expect(result.current.status).toBeDefined());
    const before = calls.getStatus;

    await act(async () => backend.simulate.connection('disconnected'));
    await act(async () => backend.simulate.connection('connected'));

    await waitFor(() => expect(calls.getStatus).toBeGreaterThan(before));
  });

  it('given connection events, then useConnectionState follows them', async () => {
    const { wrapper, backend } = setup();
    const { result } = await renderHook(
      () => {
        useHome();
        return useConnectionState();
      },
      { wrapper },
    );
    await waitFor(() => expect(result.current).toBe('connected'));
    await act(async () => backend.simulate.connection('disconnected'));
    await waitFor(() => expect(result.current).toBe('disconnected'));
  });

  it('given MirAIe signs the user out, then useBackendEvents hears signed-out', async () => {
    const { wrapper, backend } = setup();
    const heard: BackendEvent[] = [];
    await renderHook(() => useBackendEvents((e) => heard.push(e)), { wrapper });

    await act(() => backend.simulate.expireSession());

    expect(heard).toContainEqual({ type: 'signed-out' });
  });

  it('given no provider, when useBackend is called, then it says what is missing', async () => {
    jest.spyOn(console, 'error').mockImplementation(() => {});
    await expect(renderHook(() => useBackend())).rejects.toThrow('<BackendProvider>');
    jest.restoreAllMocks();
  });

  it('given no queryClient prop, when the provider renders, then it creates its own', async () => {
    jest.useFakeTimers(); // its 5-minute cache timers must not outlive the test
    cleanups.push(() => {
      jest.clearAllTimers();
      jest.useRealTimers();
    });
    const backend = createDemoBackend();
    function Providers({ children }: { children: ReactNode }) {
      return <BackendProvider backend={backend}>{children}</BackendProvider>;
    }
    const { result } = await renderHook(() => useHome(), { wrapper: Providers });
    await waitFor(() => expect(result.current.data?.devices).toHaveLength(3));
  });
});

describe('React glue — accounts and the cache', () => {
  it('given sign out and sign in again, then the home is fetched again and commands work', async () => {
    const { wrapper, calls, queryClient } = setup({ latencyMs: 60_000 });
    const { result } = await renderHook(
      () => ({
        home: useHome(),
        bed: useAcStatus('bed'),
        signIn: useSignIn(),
        signOut: useSignOut(),
        send: useSendCommand(),
      }),
      { wrapper },
    );
    await waitFor(() => expect(result.current.home.data?.devices).toHaveLength(3));
    const loads = calls.getHome;

    await act(() => result.current.signOut.mutateAsync());
    expect(queryClient.getQueryData(queryKeys.home)).toBeUndefined();
    expect(queryClient.getQueryData(queryKeys.status('bed'))).toBeUndefined();

    await act(() =>
      result.current.signIn.mutateAsync({ loginId: 'b@example.com', password: 'demo' }),
    );
    await waitFor(() => expect(result.current.home.data?.devices).toHaveLength(3));
    expect(calls.getHome).toBeGreaterThan(loads);

    await act(() => result.current.send('bed', { kind: 'power', on: false }));
    await waitFor(() => expect(result.current.bed?.power).toBe(false));
  });

  it('given a wrong password, when useSignIn runs, then the error is exposed and nothing is cleared', async () => {
    const { wrapper, queryClient } = setup();
    const { result } = await renderHook(() => ({ home: useHome(), signIn: useSignIn() }), {
      wrapper,
    });
    await waitFor(() => expect(result.current.home.data).toBeDefined());

    await act(async () => {
      await result.current.signIn
        .mutateAsync({ loginId: '9876543210', password: 'wrong' })
        .catch(() => {});
    });

    await waitFor(() => expect(result.current.signIn.error?.name).toBe('WrongCredentialsError'));
    expect(queryClient.getQueryData(queryKeys.home)).toBeDefined();
  });

  it('given MirAIe signs the user out, then the cached home and statuses are dropped', async () => {
    const { wrapper, backend, queryClient } = setup();
    const { result } = await renderHook(() => useHome(), { wrapper });
    await waitFor(() => expect(result.current.data).toBeDefined());

    await act(() => backend.simulate.expireSession());

    expect(queryClient.getQueryData(queryKeys.home)).toBeUndefined();
    expect(queryClient.getQueryData(queryKeys.status('bed'))).toBeUndefined();
  });

  it('given the backend is replaced, then nothing cached from the old one is kept', async () => {
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false, gcTime: Infinity } },
    });
    const first = createDemoBackend();
    const second = createDemoBackend({ devices: [demoDevice({ id: 'hall', room: 'Hall' })] });
    cleanups.push(() => queryClient.clear());
    let current: MiraieBackend = first;
    function Providers({ children }: { children: ReactNode }) {
      return (
        <BackendProvider backend={current} queryClient={queryClient}>
          {children}
        </BackendProvider>
      );
    }
    const { result, rerender } = await renderHook(() => useHome(), { wrapper: Providers });
    await waitFor(() => expect(result.current.data?.devices).toHaveLength(3));

    current = second;
    await rerender({});

    await waitFor(() => expect(result.current.data?.devices.map((d) => d.id)).toEqual(['hall']));
    expect(queryClient.getQueryData(queryKeys.status('bed'))).toBeUndefined();
  });
});
