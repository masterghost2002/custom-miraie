import { fireEvent, render, screen } from '@testing-library/react-native';

import { PowerButton } from '../power-button';

describe('PowerButton', () => {
  it('reads as pressed while the AC is on', async () => {
    await render(<PowerButton on accessibilityLabel="Living room power" onPress={jest.fn()} />);
    expect(screen.getByRole('button', { name: 'Living room power' })).toBeSelected();
  });

  it('AC-10: calls onPress when tapped', async () => {
    const onPress = jest.fn();
    await render(
      <PowerButton on={false} size={48} accessibilityLabel="Study power" onPress={onPress} />,
    );
    const button = screen.getByRole('button', { name: 'Study power' });
    expect(button).not.toBeSelected();
    await fireEvent.press(button);
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it('is disabled for an offline AC', async () => {
    const onPress = jest.fn();
    await render(
      <PowerButton on={false} disabled accessibilityLabel="Study power" onPress={onPress} />,
    );
    const button = screen.getByRole('button', { name: 'Study power' });
    expect(button).toBeDisabled();
    await fireEvent.press(button);
    expect(onPress).not.toHaveBeenCalled();
  });
});
