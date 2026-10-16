/** @type {import('jest').Config} */
module.exports = {
  preset: 'jest-expo',
  setupFilesAfterEnv: ['<rootDir>/jest.setup.ts'],
  // Reanimated 4 / worklets ship web-only code paths for Jest; their resolver picks them.
  resolver: 'react-native-reanimated/jest/resolver',
  moduleNameMapper: {
    // lucide's package exports point Jest at an ESM .mjs build; use its CommonJS build.
    // Tests read an icon's path data to check which glyph a drawing shows.
    '^lucide-react-native/icons/(.*)$':
      '<rootDir>/node_modules/lucide-react-native/dist/cjs/icons/$1.js',
    '^lucide-react-native$':
      '<rootDir>/node_modules/lucide-react-native/dist/cjs/lucide-react-native.js',
  },
  transformIgnorePatterns: [
    'node_modules/(?!((jest-)?react-native|@react-native(-community)?|expo(nent)?|@expo(nent)?/.*|@expo-google-fonts/.*|react-navigation|@react-navigation/.*|react-native-svg|lucide-react-native|nativewind|react-native-css-interop))',
  ],
  testPathIgnorePatterns: ['/node_modules/', '/scripts/'],
  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    // Exclusions — each needs a reason (docs/engineering-rules.md#tests):
    '!src/**/*.d.ts',
    '!src/app/**', // route files only compose feature screens; the screens are tested
    '!src/test-support/**', // helpers used only by tests
    '!src/lib/miraie/mqtt/socket.native.ts', // binds react-native-tcp-socket; exercised on device
  ],
  // Final target from day one (playbook: raising it later is painful).
  coverageThreshold: {
    global: { lines: 85, statements: 85, functions: 85, branches: 75 },
  },
};
