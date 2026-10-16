import { act, fireEvent, render, screen } from '@testing-library/react-native';

import { animatedStyle, animatedViews } from '@/test-support/drawing';

import { PowerPill } from '../power-pill';

const labels = { onLabel: 'On', offLabel: 'Off' };
/** The knob is the animated view that slides (translateX). */
const knob = () => animatedViews('translateX')[0] ?? animatedViews('transform')[0];

describe('PowerPill', () => {
  beforeEach(() => jest.useFakeTimers());
  afterEach(() => jest.useRealTimers());

  it('AC-5: given PowerPill on, then "On" shows and tapping calls onChange(false)', async () => {
    const onChange = jest.fn();
    await render(
      <PowerPill on onChange={onChange} accessibilityLabel="Bedroom power" {...labels} />,
    );
    const pill = screen.getByRole('switch', { name: 'Bedroom power' });
    expect(pill).toBeChecked();
    expect(screen.getByText('On')).toBeOnTheScreen();
    await fireEvent.press(pill);
    expect(onChange).toHaveBeenCalledWith(false);
  });

  it('AC-5: the "on" knob rests 4 pt from the right end (left: 100% − 48)', async () => {
    const { rerender } = await render(
      <PowerPill on={false} onChange={jest.fn()} accessibilityLabel="Bedroom power" {...labels} />,
    );
    await fireEvent(screen.getByRole('switch', { name: 'Bedroom power' }), 'layout', {
      nativeEvent: { layout: { width: 120, height: 52, x: 0, y: 0 } },
    });
    expect(animatedStyle(knob()).transform).toEqual([{ translateX: 0 }]);
    await rerender(
      <PowerPill on onChange={jest.fn()} accessibilityLabel="Bedroom power" {...labels} />,
    );
    await act(async () => jest.advanceTimersByTime(600));
    // knob starts at left 4; on a 120 pt pill it ends at left 72 = 120 − 48
    expect(animatedStyle(knob()).transform).toEqual([{ translateX: 68 }]);
  });

  it('AC-5: is disabled when the AC is offline', async () => {
    const onChange = jest.fn();
    await render(
      <PowerPill
        on={false}
        disabled
        fill
        onChange={onChange}
        accessibilityLabel="Power"
        {...labels}
      />,
    );
    const pill = screen.getByRole('switch', { name: 'Power' });
    expect(pill).toBeDisabled();
    expect(pill).not.toBeChecked();
    await fireEvent.press(pill);
    expect(onChange).not.toHaveBeenCalled();
  });
});
