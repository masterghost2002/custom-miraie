import { act, render, screen } from '@testing-library/react-native';
import { useReducedMotion } from 'react-native-reanimated';

import { FanIcon } from '../fan-icon';

const spinner = () => screen.container.queryAll((n) => n.type === 'View')[0];

describe('FanIcon', () => {
  beforeEach(() => jest.useFakeTimers());
  afterEach(() => {
    jest.useRealTimers();
    jest.mocked(useReducedMotion).mockReturnValue(false);
  });

  it('spins once every 2 s by default', async () => {
    await render(<FanIcon spinning color="currentColor" />);
    await act(async () => jest.advanceTimersByTime(500));
    expect(spinner()).toHaveAnimatedStyle({ transform: [{ rotate: '90deg' }] });
  });

  it('spins faster on high (0.6 s a turn)', async () => {
    await render(<FanIcon spinning speed="high" color="currentColor" />);
    await act(async () => jest.advanceTimersByTime(150));
    expect(spinner()).toHaveAnimatedStyle({ transform: [{ rotate: '90deg' }] });
  });

  it('is still when the AC is off', async () => {
    await render(<FanIcon spinning={false} color="currentColor" />);
    await act(async () => jest.advanceTimersByTime(500));
    expect(spinner()).toHaveAnimatedStyle({ transform: [{ rotate: '0deg' }] });
  });

  it('AC-8: is still under Reduce Motion', async () => {
    jest.mocked(useReducedMotion).mockReturnValue(true);
    await render(<FanIcon spinning color="currentColor" />);
    await act(async () => jest.advanceTimersByTime(500));
    expect(spinner()).toHaveAnimatedStyle({ transform: [{ rotate: '0deg' }] });
  });
});
