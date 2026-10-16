import { fireEvent, render, screen } from '@testing-library/react-native';

import { PressScale } from '../press-scale';
import { Text } from '../text';

describe('PressScale', () => {
  it('calls onPress when tapped', async () => {
    const onPress = jest.fn();
    await render(
      <PressScale accessibilityRole="button" accessibilityLabel="Go" onPress={onPress}>
        <Text>Go</Text>
      </PressScale>,
    );
    await fireEvent.press(screen.getByRole('button', { name: 'Go' }));
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it('reads as disabled and ignores taps when disabled', async () => {
    const onPress = jest.fn();
    await render(
      <PressScale accessibilityRole="button" accessibilityLabel="Go" onPress={onPress} disabled>
        <Text>Go</Text>
      </PressScale>,
    );
    const button = screen.getByRole('button', { name: 'Go' });
    expect(button).toBeDisabled();
    await fireEvent.press(button);
    expect(onPress).not.toHaveBeenCalled();
  });
});
