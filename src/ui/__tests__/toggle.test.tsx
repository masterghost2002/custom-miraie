import { act, fireEvent, render, screen } from '@testing-library/react-native';

import { animatedStyle, animatedViews } from '@/test-support/drawing';

import { Toggle } from '../toggle';

const knobX = () =>
  (animatedStyle(animatedViews('transform')[0]).transform as { translateX: number }[])[0]
    ?.translateX;

describe('Toggle', () => {
  beforeEach(() => jest.useFakeTimers());
  afterEach(() => jest.useRealTimers());

  it('AC-4: given Toggle off, when tapped, then onChange(true) fires and it is a switch', async () => {
    const onChange = jest.fn();
    await render(<Toggle value={false} onChange={onChange} accessibilityLabel="Eco" />);
    const toggle = screen.getByRole('switch', { name: 'Eco' });
    expect(toggle).not.toBeChecked();
    expect(knobX()).toBe(0);
    await fireEvent.press(toggle);
    expect(onChange).toHaveBeenCalledWith(true);
  });

  it('AC-4: when switched on, it reads as checked and the knob springs 20 pt right', async () => {
    const view = await render(
      <Toggle value={false} onChange={jest.fn()} accessibilityLabel="Eco" />,
    );
    await view.rerender(<Toggle value onChange={jest.fn()} accessibilityLabel="Eco" />);
    expect(screen.getByRole('switch', { name: 'Eco' })).toBeChecked();
    await act(async () => jest.advanceTimersByTime(400));
    expect(knobX()).toBeCloseTo(20);
  });

  it('does not change while disabled', async () => {
    const onChange = jest.fn();
    await render(<Toggle value={false} disabled onChange={onChange} accessibilityLabel="Eco" />);
    const toggle = screen.getByRole('switch', { name: 'Eco' });
    expect(toggle).toBeDisabled();
    await fireEvent.press(toggle);
    expect(onChange).not.toHaveBeenCalled();
  });
});
