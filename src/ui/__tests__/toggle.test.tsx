import { fireEvent, render, screen } from '@testing-library/react-native';

import { Toggle } from '../toggle';

describe('Toggle', () => {
  it('AC-4: given Toggle off, when tapped, then onChange(true) fires and it is a switch', async () => {
    const onChange = jest.fn();
    await render(<Toggle value={false} onChange={onChange} accessibilityLabel="Eco" />);
    const toggle = screen.getByRole('switch', { name: 'Eco' });
    expect(toggle).not.toBeChecked();
    await fireEvent.press(toggle);
    expect(onChange).toHaveBeenCalledWith(true);
  });

  it('AC-4: reads as checked when on', async () => {
    await render(<Toggle value onChange={jest.fn()} accessibilityLabel="Powerchill" />);
    expect(screen.getByRole('switch', { name: 'Powerchill' })).toBeChecked();
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
