import { fireEvent, render, screen } from '@testing-library/react-native';
import { Power } from 'lucide-react-native';

import { PrimaryButton } from '../primary-button';

describe('PrimaryButton', () => {
  it('AC-10: shows its label and calls onPress', async () => {
    const onPress = jest.fn();
    await render(<PrimaryButton label="Turn everything off" icon={Power} onPress={onPress} />);
    expect(screen.getByText('Turn everything off')).toBeOnTheScreen();
    await fireEvent.press(screen.getByRole('button', { name: 'Turn everything off' }));
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it('reads as disabled and ignores taps when disabled', async () => {
    const onPress = jest.fn();
    await render(<PrimaryButton label="Turn everything off" onPress={onPress} disabled />);
    const button = screen.getByRole('button', { name: 'Turn everything off' });
    expect(button).toBeDisabled();
    await fireEvent.press(button);
    expect(onPress).not.toHaveBeenCalled();
  });

  it('while busy, reads as busy and cannot be pressed again', async () => {
    const onPress = jest.fn();
    await render(<PrimaryButton label="Signing in…" onPress={onPress} busy />);
    const button = screen.getByRole('button', { name: 'Signing in…' });
    expect(button).toBeBusy();
    await fireEvent.press(button);
    expect(onPress).not.toHaveBeenCalled();
  });
});
