---
name: honest-tests
description: Use when writing or changing any test in Chill (jest-expo, @testing-library/react-native, node:test gate tests). Forbids testID queries, jest.mock of any module from this repo, tests that only check their own stand-in, and invented tests written just to raise coverage.
---

# Honest tests

A test is the agent's proof that the code works. It must fail when the real feature breaks.

## Rules

1. **Never test a stand-in you made.** No `jest.mock('@/…')`, `jest.mock('./…')`,
   `jest.mock('../…')` — render the real component with the real hooks and `src/lib/miraie` code.
   (`check:ui-mock-policy`.)
2. **Fake only what we don't own.**
   - Network → a test backend implementing `MiraieBackend`, or `createDemoBackend()` seeded with
     the state you need, passed through `<BackendProvider>`.
   - Clock → `jest.useFakeTimers()`.
   - Native modules → already mocked in `jest.setup.ts` (expo-secure-store, AsyncStorage). Add new
     ones there, never per test.
3. **Find things the way a person does**: `getByRole`, `getByLabelText`, `getByText`.
   `testID` / `getByTestId` are banned (`check:testid`). If you can't find it by role or
   label, the component is missing an `accessibilityRole` or `accessibilityLabel` — fix that.
4. **Assert what the user sees or what leaves the phone**: visible text, `accessibilityState`,
   and for protocol code the exact JSON payload or packet bytes.
5. **Name tests after the acceptance criteria**: `it('AC-3: given …, when …, then …')`.
6. **Nothing worth testing? Don't invent a test.** Add the file to the `jest.config.js`
   exclusions with a reason instead. Coverage target: global lines 85 / branches 75.
7. **Protocol tests use oracles**: the MQTT codec is checked against `mqtt-packet`; the session
   against a real `aedes` broker on localhost.
8. **jsdom-free RN tests can't measure layout** — sizes and clipping are checked on the web
   preview at 390×844 or on device, not with `toBeVisible()`.

## Fake vs real

Fake — passes even when the real power pill is broken:

```tsx
jest.mock('@/ui/power-pill', () => ({ PowerPill: () => <Text>On</Text> }));

it('shows on', () => {
  render(<HomeScreen />);
  expect(screen.getByText('On')).toBeTruthy(); // always passes
});
```

Real — the real screen, a fake network, found like a person:

```tsx
it('AC-2: given the Bedroom AC is on, when the user turns it off, then it shows Standby', async () => {
  const backend = createDemoBackend({ devices: [bedroom({ ps: 'on' })] });
  render(
    <BackendProvider backend={backend}>
      <HomeScreen />
    </BackendProvider>,
  );

  const user = userEvent.setup();
  const power = await screen.findByRole('switch', { name: 'Bedroom power' });
  await user.press(power);

  expect(power).not.toBeChecked();
  expect(await screen.findByText('Air conditioner · Standby')).toBeTruthy();
});
```

## Decorative drawings (the one exception to rule 3)

The AC unit, its display, air particles, drips, the breeze and icon glyphs are hidden from
VoiceOver on purpose, so they can't be found by role or label — and adding labels only for tests
is wrong (the label would be invented wording nobody hears). Test them through the host tree the
real component renders, with the shared helpers in `src/test-support/drawing.ts`:

- `animatedViews(key)` + `toHaveAnimatedStyle` / `animatedStyle()` on fake timers
  (`setUpTests()` runs in `jest.setup.ts`) — e.g. the vent narrows, the knob ends at x, dots move;
- `drawnPaths()` vs `lucidePaths('snowflake')` — the right glyph is drawn;
- `viewsSized(w, h)` — a drawing has the board size.

Every such test must fail when the behaviour breaks: compare before/after, never "something
rendered". Interactive things are still found by role, label or text.
