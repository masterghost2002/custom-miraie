// Runs after the test framework is installed. Only fakes what we don't own
// (native modules); never our own components — see .claude/skills/honest-tests.
import 'react-native-gesture-handler/jestSetup';

jest.mock('expo-secure-store', () => {
  const store = new Map<string, string>();
  return {
    getItemAsync: jest.fn(async (k: string) => store.get(k) ?? null),
    setItemAsync: jest.fn(async (k: string, v: string) => void store.set(k, v)),
    deleteItemAsync: jest.fn(async (k: string) => void store.delete(k)),
  };
});

jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock'),
);

jest.mock(
  'react-native-safe-area-context',
  () => require('react-native-safe-area-context/jest/mock').default,
);

// Liquid glass is a native iOS 26 view. Tests choose whether it is available; the view itself
// renders as a plain host element so the tree shows which surface was picked.
jest.mock('expo-glass-effect', () => {
  const React = jest.requireActual<typeof import('react')>('react');
  return {
    GlassView: (props: object) => React.createElement('ExpoGlassView', props),
    GlassContainer: (props: object) => React.createElement('ExpoGlassContainer', props),
    isLiquidGlassAvailable: jest.fn(() => false),
    isGlassEffectAPIAvailable: jest.fn(() => false),
  };
});
