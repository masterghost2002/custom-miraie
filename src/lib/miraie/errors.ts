// Errors the MirAIe client throws. Screens pick their message by class (CHILL-004 Q1).
// Messages never include credentials, tokens or payloads.

export class MiraieError extends Error {
  constructor(message: string, options?: { cause?: unknown }) {
    super(message, options);
    this.name = new.target.name;
  }
}

/** Login answered 401: the ID and password don't match. */
export class WrongCredentialsError extends MiraieError {
  constructor() {
    super('MirAIe rejected the login ID or password');
  }
}

/** Login answered 412: MirAIe doesn't know this login ID. */
export class NotRegisteredError extends MiraieError {
  constructor() {
    super('This login ID is not registered with MirAIe');
  }
}

/** No network, a server error, or a reply we can't read. `status` is the HTTP status if any. */
export class MiraieNetworkError extends MiraieError {
  readonly status: number | undefined;
  constructor(message: string, status?: number, options?: { cause?: unknown }) {
    super(message, options);
    this.status = status;
  }
}

/** A REST call answered 401: the access token is no longer valid. */
export class UnauthorizedError extends MiraieNetworkError {
  constructor() {
    super('MirAIe refused the access token', 401);
  }
}

/** There is no session (never signed in, signed out, or re-login failed). */
export class SignedOutError extends MiraieError {
  constructor() {
    super('Not signed in to MirAIe');
  }
}

/** The AC is offline, so a command can't reach it. */
export class DeviceOfflineError extends MiraieError {
  constructor(readonly deviceId: string) {
    super('The air conditioner is offline');
  }
}

/** No AC with this id in the home. */
export class DeviceNotFoundError extends MiraieError {
  constructor(readonly deviceId: string) {
    super('No air conditioner with this id');
  }
}
