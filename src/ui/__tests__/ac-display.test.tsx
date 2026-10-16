import { act, render, screen } from '@testing-library/react-native';

import { AcDisplay } from '../ac-display';

const hidden = { includeHiddenElements: true };

describe('AcDisplay', () => {
  beforeEach(() => jest.useFakeTimers());
  afterEach(() => jest.useRealTimers());

  it('AC-7: given cool, 24°, fan medium, preset eco, then snowflake + leaf, "24°" and bars 1–3 lit', async () => {
    await render(<AcDisplay size="lg" on mode="cool" temp={24} fan="medium" preset="eco" />);
    expect(screen.getByText('24°', hidden)).toBeOnTheScreen();
    expect(screen.getByLabelText('24°, cool, eco, fan level 3', hidden)).toBeOnTheScreen();
  });

  it('AC-7: with power off nothing shows', async () => {
    await render(
      <AcDisplay size="lg" on={false} mode="cool" temp={24} fan="medium" preset="eco" />,
    );
    await act(async () => jest.advanceTimersByTime(700));
    expect(screen.getByLabelText('blank', hidden)).toHaveAnimatedStyle({ opacity: 0 });
  });

  it('shows FAN instead of a temperature in fan-only mode', async () => {
    await render(<AcDisplay size="lg" on mode="fan" temp={24} fan="high" preset="boost" />);
    expect(screen.getByText('FAN', hidden)).toBeOnTheScreen();
    expect(screen.getByLabelText('FAN, fan, boost, fan level 4', hidden)).toBeOnTheScreen();
  });

  it('the small Home display shows only the mode and temperature', async () => {
    await render(<AcDisplay size="sm" on mode="dry" temp={25} />);
    expect(screen.getByLabelText('25°, dry', hidden)).toBeOnTheScreen();
  });

  it('fades back in after a change', async () => {
    const { rerender } = await render(<AcDisplay size="md" on mode="cool" temp={24} />);
    await act(async () => jest.advanceTimersByTime(700));
    await rerender(<AcDisplay size="md" on mode="cool" temp={25} />);
    await act(async () => jest.advanceTimersByTime(700));
    expect(screen.getByLabelText('25°, cool', hidden)).toHaveAnimatedStyle({ opacity: 1 });
  });
});
