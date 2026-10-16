import { fireEvent, render, screen } from '@testing-library/react-native';
import { ArrowLeft, Plus } from 'lucide-react-native';

import { IconButton } from '../icon-button';

describe('IconButton', () => {
  it('AC-10: is a named button that calls onPress', async () => {
    const onPress = jest.fn();
    await render(
      <IconButton icon={ArrowLeft} accessibilityLabel="Back to Bedroom" onPress={onPress} />,
    );
    await fireEvent.press(screen.getByRole('button', { name: 'Back to Bedroom' }));
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it('reads as disabled at a limit and ignores taps', async () => {
    const onPress = jest.fn();
    await render(
      <IconButton
        icon={Plus}
        accessibilityLabel="Raise temperature"
        onPress={onPress}
        disabled
        variant="pill"
        size={40}
        iconSize={18}
      />,
    );
    const button = screen.getByRole('button', { name: 'Raise temperature' });
    expect(button).toBeDisabled();
    await fireEvent.press(button);
    expect(onPress).not.toHaveBeenCalled();
  });
});
