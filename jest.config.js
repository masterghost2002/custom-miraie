/** @type {import('jest').Config} */
module.exports = {
  preset: 'jest-expo',
  setupFilesAfterEnv: ['<rootDir>/jest.setup.ts'],
  transformIgnorePatterns: [
    'node_modules/(?!((jest-)?react-native|@react-native(-community)?|expo(nent)?|@expo(nent)?/.*|@expo-google-fonts/.*|react-navigation|@react-navigation/.*|react-native-svg|lucide-react-native|nativewind|react-native-css-interop))',
  ],
  testPathIgnorePatterns: ['/node_modules/', '/scripts/'],
  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    // Exclusions — each needs a reason (docs/engineering-rules.md#tests):
    '!src/**/*.d.ts',
    '!src/app/**', // route files only compose feature screens; the screens are tested
    '!src/lib/miraie/mqtt/socket.native.ts', // binds react-native-tcp-socket; exercised on device
  ],
  // Final target from day one (playbook: raising it later is painful).
  coverageThreshold: {
    global: { lines: 85, statements: 85, functions: 85, branches: 75 },
  },
};
