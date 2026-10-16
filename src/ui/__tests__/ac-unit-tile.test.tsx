import { act, render, screen } from '@testing-library/react-native';
import { useReducedMotion } from 'react-native-reanimated';

import { AcUnitTile } from '../ac-unit-tile';

const drips = () =>
  screen.container.queryAll(
    (n) => n.type === 'View' && n.props.jestAnimatedStyle?.value?.transform !== undefined,
  );

describe('AcUnitTile', () => {
  beforeEach(() => jest.useFakeTimers());
  afterEach(() => {
    jest.useRealTimers();
    jest.mocked(useReducedMotion).mockReturnValue(false);
  });

  it('drips three drops of cold air while the AC is on', async () => {
    await render(<AcUnitTile on />);
    expect(drips()).toHaveLength(3);
    await act(async () => jest.advanceTimersByTime(400));
    expect(drips()[0]).not.toHaveAnimatedStyle({ transform: [{ translateY: 0 }] });
  });

  it('stops dripping when the AC is off', async () => {
    await render(<AcUnitTile on={false} />);
    expect(drips()).toHaveLength(0);
  });

  it('AC-8: does not drip under Reduce Motion', async () => {
    jest.mocked(useReducedMotion).mockReturnValue(true);
    await render(<AcUnitTile on />);
    expect(drips()).toHaveLength(0);
  });
});
