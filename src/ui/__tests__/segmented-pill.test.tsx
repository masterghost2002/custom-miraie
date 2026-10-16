import { act, fireEvent, render, screen } from '@testing-library/react-native';

import { animatedStyle, animatedViews } from '@/test-support/drawing';

import { SegmentedPill } from '../segmented-pill';

const fan = [
  { value: 'auto', label: 'Auto' },
  { value: 'quiet', label: 'Quiet' },
  { value: 'low', label: 'Low' },
  { value: 'medium', label: 'Med', accessibilityLabel: 'Medium' },
  { value: 'high', label: 'High' },
] as const;

const indicatorX = () =>
  (animatedStyle(animatedViews('transform')[0]).transform as { translateX: number }[])[0]
    ?.translateX;
const layout = (width: number) => ({
  nativeEvent: { layout: { width, height: 52, x: 0, y: 0 } },
});

describe('SegmentedPill', () => {
  beforeEach(() => jest.useFakeTimers());
  afterEach(() => jest.useRealTimers());

  it('AC-3: the indicator slides to the chosen option in 0.45 s', async () => {
    const view = await render(
      <SegmentedPill
        options={fan}
        value="auto"
        onChange={jest.fn()}
        accessibilityLabel="Fan speed"
      />,
    );
    // 318 wide card track: (318 − 8 − 16) / 5 = 58.8 per column, 62.8 per step (board).
    await fireEvent(screen.getByLabelText('Fan speed'), 'layout', layout(318));
    expect(indicatorX()).toBe(0);
    await view.rerender(
      <SegmentedPill
        options={fan}
        value="low"
        onChange={jest.fn()}
        accessibilityLabel="Fan speed"
      />,
    );
    await act(async () => jest.advanceTimersByTime(200));
    expect(indicatorX()).toBeLessThan(125.6);
    await act(async () => jest.advanceTimersByTime(300));
    expect(indicatorX()).toBeCloseTo(125.6);
  });

  it('AC-3: given 5 options, when the person taps "Low", then onChange("low") fires', async () => {
    const onChange = jest.fn();
    await render(
      <SegmentedPill
        options={fan}
        value="auto"
        onChange={onChange}
        accessibilityLabel="Fan speed"
      />,
    );
    await fireEvent(screen.getByLabelText('Fan speed'), 'layout', {
      nativeEvent: { layout: { width: 318, height: 52, x: 0, y: 0 } },
    });
    await fireEvent.press(screen.getByRole('button', { name: 'Low' }));
    expect(onChange).toHaveBeenCalledWith('low');
  });

  it('AC-3: the chosen option reads as selected; a short label can carry a full spoken name', async () => {
    await render(
      <SegmentedPill
        options={fan}
        value="medium"
        onChange={jest.fn()}
        accessibilityLabel="Fan speed"
      />,
    );
    expect(screen.getByRole('button', { name: 'Medium' })).toBeSelected();
    expect(screen.getByText('Med')).toBeOnTheScreen();
    expect(screen.getByRole('button', { name: 'Auto' })).not.toBeSelected();
  });

  it('ignores a tap on the option that is already chosen', async () => {
    const onChange = jest.fn();
    await render(
      <SegmentedPill
        options={fan}
        value="auto"
        onChange={onChange}
        accessibilityLabel="Fan speed"
      />,
    );
    await fireEvent.press(screen.getByRole('button', { name: 'Auto' }));
    expect(onChange).not.toHaveBeenCalled();
  });

  it('works with numeric values and can be disabled', async () => {
    const onChange = jest.fn();
    await render(
      <SegmentedPill
        options={[
          { value: 0, label: 'Auto' },
          { value: 1, label: '1', accessibilityLabel: 'Position 1, highest' },
        ]}
        value={0}
        disabled
        onChange={onChange}
        accessibilityLabel="Up-down position"
      />,
    );
    const one = screen.getByRole('button', { name: 'Position 1, highest' });
    expect(one).toBeDisabled();
    await fireEvent.press(one);
    expect(onChange).not.toHaveBeenCalled();
  });
});
