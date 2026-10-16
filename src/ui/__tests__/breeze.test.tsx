import { act, render, screen } from '@testing-library/react-native';
import { useReducedMotion } from 'react-native-reanimated';

import { animatedStyle, animatedViews } from '@/test-support/drawing';

import { Breeze, wavePath } from '../breeze';

const offsets = () =>
  animatedViews('transform').map(
    (n) => (animatedStyle(n).transform as { translateX: number }[])[0]?.translateX ?? 0,
  );

describe('Breeze', () => {
  beforeEach(() => jest.useFakeTimers());
  afterEach(() => {
    jest.useRealTimers();
    jest.mocked(useReducedMotion).mockReturnValue(false);
  });

  it('draws the board wave: a quadratic first wave, then smooth repeats along the line', () => {
    expect(wavePath(52, -9, 97.5, 195)).toBe('M0 52 Q48.75 43 97.5 52 T195 52 T292.5 52');
  });

  it('is hidden from VoiceOver', async () => {
    await render(<Breeze />);
    expect(screen.root).not.toBeVisible();
  });

  it('drifts both layers left; the 70 s layer faster than the 110 s one', async () => {
    await render(<Breeze />);
    await act(async () => jest.advanceTimersByTime(7000));
    const [fast, slow] = offsets();
    expect(fast).toBeCloseTo(-39, 0); // 390 pt per 70 s
    expect(slow).toBeCloseTo(-24.8, 0); // 390 pt per 110 s
  });

  it('AC-8: stays still under Reduce Motion', async () => {
    jest.mocked(useReducedMotion).mockReturnValue(true);
    await render(<Breeze />);
    await act(async () => jest.advanceTimersByTime(7000));
    expect(offsets()).toEqual([0, 0]);
  });
});
