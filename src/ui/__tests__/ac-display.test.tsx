import { act, render, screen } from '@testing-library/react-native';
import { useReducedMotion } from 'react-native-reanimated';

import { animatedStyle, animatedViews, drawnPaths, lucidePaths } from '@/test-support/drawing';

import { AcDisplay } from '../ac-display';

const hidden = { includeHiddenElements: true };
/** The four fan bars are the animated views that carry a colour. */
const bars = () => animatedViews('backgroundColor').map((n) => animatedStyle(n).backgroundColor);
/** The whole display fades as one animated view (opacity only). */
const panel = () => animatedViews('opacity')[0];

const GLOW = 'rgba(232, 112, 31, 1)';
const DIM = 'rgba(232, 112, 31, 0.2)';

describe('AcDisplay', () => {
  beforeEach(() => jest.useFakeTimers());
  afterEach(() => {
    jest.useRealTimers();
    jest.mocked(useReducedMotion).mockReturnValue(false);
  });

  it('AC-7: given cool, 24°, fan medium, preset eco, then snowflake + leaf, "24°" and bars 1–3 lit', async () => {
    await render(<AcDisplay size="lg" on mode="cool" temp={24} fan="medium" preset="eco" />);
    await act(async () => jest.advanceTimersByTime(400));
    expect(screen.getByText('24°', hidden)).toBeOnTheScreen();
    expect(drawnPaths()).toEqual(
      expect.arrayContaining([...lucidePaths('leaf'), ...lucidePaths('snowflake')]),
    );
    expect(bars()).toEqual([GLOW, GLOW, GLOW, DIM]);
  });

  it('AC-7: with power off nothing shows', async () => {
    await render(
      <AcDisplay size="lg" on={false} mode="cool" temp={24} fan="medium" preset="eco" />,
    );
    await act(async () => jest.advanceTimersByTime(700));
    expect(panel()).toHaveAnimatedStyle({ opacity: 0 });
  });

  it('shows FAN instead of a temperature in fan-only mode, with the Powerchill bolt', async () => {
    await render(<AcDisplay size="lg" on mode="fan" temp={24} fan="high" preset="boost" />);
    await act(async () => jest.advanceTimersByTime(400));
    expect(screen.getByText('FAN', hidden)).toBeOnTheScreen();
    expect(screen.queryByText('24°', hidden)).not.toBeOnTheScreen();
    expect(drawnPaths()).toEqual(expect.arrayContaining(lucidePaths('zap')));
    expect(bars()).toEqual([GLOW, GLOW, GLOW, GLOW]);
  });

  it('the small Home display shows only the mode and temperature', async () => {
    await render(<AcDisplay size="sm" on mode="dry" temp={25} />);
    expect(screen.getByText('25°', hidden)).toBeOnTheScreen();
    expect(drawnPaths()).toEqual(lucidePaths('droplet'));
    expect(bars()).toEqual([]);
  });

  it('pulses from .15 back to full when a setting changes', async () => {
    const view = await render(<AcDisplay size="md" on mode="cool" temp={24} />);
    await act(async () => jest.advanceTimersByTime(700));
    expect(panel()).toHaveAnimatedStyle({ opacity: 1 });
    await view.rerender(<AcDisplay size="md" on mode="cool" temp={25} />);
    await act(async () => jest.advanceTimersByTime(32));
    expect(Number(animatedStyle(panel()).opacity)).toBeLessThan(0.4);
    await act(async () => jest.advanceTimersByTime(700));
    expect(panel()).toHaveAnimatedStyle({ opacity: 1 });
  });

  it('runs the fan-bar wave in auto', async () => {
    await render(<AcDisplay size="lg" on mode="cool" temp={24} fan="auto" />);
    await act(async () => jest.advanceTimersByTime(700));
    expect(bars()[0]).not.toBe(DIM);
  });

  it('AC-8: keeps the auto fan bars still under Reduce Motion', async () => {
    jest.mocked(useReducedMotion).mockReturnValue(true);
    await render(<AcDisplay size="lg" on mode="cool" temp={24} fan="auto" />);
    await act(async () => jest.advanceTimersByTime(700));
    expect(bars()).toEqual([DIM, DIM, DIM, DIM]);
  });
});
