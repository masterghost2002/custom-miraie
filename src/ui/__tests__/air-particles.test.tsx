import { act, render, screen } from '@testing-library/react-native';
import { useReducedMotion } from 'react-native-reanimated';

import { AirParticles, arcLengthTable, curvePath, type ParticleCurve } from '../air-particles';

const curves: ParticleCurve[] = [
  { path: [75, 0, 75, 25, 75, 50, 75, 70], delays: [-0.9, -2.1] },
  { path: [30, 0, 30, 25, 22, 50, 14, 70], delays: [-0.3] },
];

const dots = () =>
  screen.container.queryAll(
    (n) => n.type === 'View' && n.props.jestAnimatedStyle?.value?.transform !== undefined,
  );

const props = {
  boardWidth: 150,
  boardHeight: 70,
  curves,
  durationMs: 2400,
  dotSize: 4 as const,
  fadeIn: 0.12,
  fadeOut: 0.75,
};

describe('AirParticles', () => {
  beforeEach(() => jest.useFakeTimers());
  afterEach(() => {
    jest.useRealTimers();
    jest.mocked(useReducedMotion).mockReturnValue(false);
  });

  it('measures curves by length, so a straight 70 pt drop is 70 long', () => {
    expect(arcLengthTable([75, 0, 75, 25, 75, 50, 75, 70]).total).toBeCloseTo(70);
    expect(curvePath([30, 0, 30, 25, 22, 50, 14, 70])).toBe('M30 0 C30 25 22 50 14 70');
  });

  it('moves one dot per delay down its curve while the AC runs', async () => {
    await render(<AirParticles {...props} visible />);
    expect(dots()).toHaveLength(3);
    const first = JSON.stringify(dots()[0]?.props.jestAnimatedStyle.value);
    await act(async () => jest.advanceTimersByTime(300));
    expect(JSON.stringify(dots()[0]?.props.jestAnimatedStyle.value)).not.toBe(first);
  });

  it('fades the air away when the AC is off', async () => {
    await render(<AirParticles {...props} visible={false} fadeMs={700} guides />);
    await act(async () => jest.advanceTimersByTime(800));
    const layer = screen.container.queryAll(
      (n) =>
        n.type === 'View' &&
        n.props.jestAnimatedStyle?.value?.opacity !== undefined &&
        !n.props.jestAnimatedStyle.value.transform,
    )[0];
    expect(layer).toHaveAnimatedStyle({ opacity: 0 });
  });

  it('AC-8: shows no moving particles under Reduce Motion', async () => {
    jest.mocked(useReducedMotion).mockReturnValue(true);
    await render(<AirParticles {...props} visible />);
    expect(dots()).toHaveLength(0);
  });
});
