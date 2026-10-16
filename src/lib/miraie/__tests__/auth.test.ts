import { detectLoginKind, signIn } from '../auth';
import { HTTP_CLIENT_ID, LOGIN_URL } from '../constants';
import { MiraieNetworkError, NotRegisteredError, WrongCredentialsError } from '../errors';

type Call = { url: string; init: RequestInit };

/** A fake network: records each request and answers with the given status and body. */
function fakeFetch(status: number, body: unknown) {
  const calls: Call[] = [];
  const fetch = async (url: string | URL | Request, init?: RequestInit) => {
    calls.push({ url: String(url), init: init ?? {} });
    return new Response(JSON.stringify(body), {
      status,
      headers: { 'Content-Type': 'application/json' },
    });
  };
  return { fetch: fetch as typeof globalThis.fetch, calls };
}

const tokens = {
  accessToken: 'access-1',
  refreshToken: 'refresh-1',
  userId: 'user-1',
  expiresIn: 86400,
};

describe('detectLoginKind', () => {
  it.each([
    ['ravi@example.com', 'email'],
    ['9876543210', 'mobile'],
    ['+919876543210', 'mobile'],
    ['ravi_k', 'username'],
    ['98765 43210', 'username'],
  ] as const)('given %p, then the kind is %s', (id, kind) => {
    expect(detectLoginKind(id)).toBe(kind);
  });
});

describe('signIn', () => {
  it('AC-1: given a mobile number and password, when signIn is called, then it POSTs the reference body and returns the tokens', async () => {
    const net = fakeFetch(200, tokens);

    const session = await signIn('9876543210', 'pa ss ', {
      fetch: net.fetch,
      random: () => 0.123456789,
    });

    expect(session).toEqual(tokens);
    expect(net.calls).toHaveLength(1);
    const [call] = net.calls;
    expect(call?.url).toBe(LOGIN_URL);
    expect(call?.init.method).toBe('POST');
    expect(new Headers(call?.init.headers).get('Content-Type')).toBe('application/json');
    // Key order and values as in api.py `_login`; the password is sent untrimmed.
    expect(call?.init.body).toBe(
      JSON.stringify({
        clientId: HTTP_CLIENT_ID,
        password: 'pa ss ',
        scope: 'an123456789',
        mobile: '9876543210',
      }),
    );
  });

  it.each([
    ['ravi@example.com', 'email'],
    ['ravi_k', 'username'],
  ])(
    'AC-1: given login id %p, when signIn is called, then it is sent under %p',
    async (id, key) => {
      const net = fakeFetch(200, tokens);
      await signIn(id, 'secret', { fetch: net.fetch });
      const body = JSON.parse(String(net.calls[0]?.init.body));
      expect(body[key]).toBe(id);
      expect(body.scope).toMatch(/^an\d{1,9}$/);
    },
  );

  it('AC-1: given a numeric userId, when signIn succeeds, then userId is a string', async () => {
    const net = fakeFetch(200, { ...tokens, userId: 42 });
    expect((await signIn('9876543210', 'x', { fetch: net.fetch })).userId).toBe('42');
  });

  it('AC-2: given the server answers 401, when signIn is called, then it throws WrongCredentialsError', async () => {
    const net = fakeFetch(401, { message: 'bad' });
    await expect(signIn('9876543210', 'nope', { fetch: net.fetch })).rejects.toBeInstanceOf(
      WrongCredentialsError,
    );
  });

  it('AC-2: given the server answers 412, when signIn is called, then it throws NotRegisteredError', async () => {
    const net = fakeFetch(412, { message: 'not registered' });
    await expect(signIn('0000000000', 'x', { fetch: net.fetch })).rejects.toBeInstanceOf(
      NotRegisteredError,
    );
  });

  it('AC-2: given the server answers 500, when signIn is called, then it throws MiraieNetworkError with the status', async () => {
    const net = fakeFetch(500, {});
    const error = await signIn('9876543210', 'x', { fetch: net.fetch }).catch((e: unknown) => e);
    expect(error).toBeInstanceOf(MiraieNetworkError);
    expect((error as MiraieNetworkError).status).toBe(500);
  });

  it('AC-2: given no network, when signIn is called, then it throws MiraieNetworkError without a status', async () => {
    const fetch = (async () => {
      throw new TypeError('Network request failed');
    }) as typeof globalThis.fetch;
    const error = await signIn('9876543210', 'x', { fetch }).catch((e: unknown) => e);
    expect(error).toBeInstanceOf(MiraieNetworkError);
    expect((error as MiraieNetworkError).status).toBeUndefined();
  });

  it('given a 200 whose body is not the token shape, when signIn is called, then it throws MiraieNetworkError', async () => {
    const net = fakeFetch(200, { hello: 'world' });
    await expect(signIn('9876543210', 'x', { fetch: net.fetch })).rejects.toBeInstanceOf(
      MiraieNetworkError,
    );
  });

  it('given a failure, when the error is printed, then it never contains the password', async () => {
    const net = fakeFetch(401, {});
    const error = await signIn('9876543210', 'hunter2', { fetch: net.fetch }).catch(
      (e: unknown) => e,
    );
    expect(String(error)).not.toContain('hunter2');
    expect(JSON.stringify(error)).not.toContain('hunter2');
  });
});
