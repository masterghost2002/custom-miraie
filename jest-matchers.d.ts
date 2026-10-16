// Types for Reanimated's Jest matchers, registered by setUpTests() in jest.setup.ts.
export {};

declare global {
  namespace jest {
    interface Matchers<R> {
      toHaveAnimatedStyle(
        style: Record<string, unknown>[] | Record<string, unknown>,
        config?: { shouldMatchAllProps?: boolean },
      ): R;
    }
  }
}
