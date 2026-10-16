import { fireEvent, render, screen } from '@testing-library/react-native';

import { ModeButton } from '../mode-button';

describe('ModeButton', () => {
  it('AC-6: given ModeButton selected, then it is a selected button with its label', async () => {
    await render(<ModeButton mode="cool" label="Cool" selected onPress={jest.fn()} />);
    expect(screen.getByRole('button', { name: 'Cool' })).toBeSelected();
  });

  it('AC-6: an unselected mode calls onPress', async () => {
    const onPress = jest.fn();
    await render(<ModeButton mode="fan" label="Fan only" selected={false} onPress={onPress} />);
    const button = screen.getByRole('button', { name: 'Fan only' });
    expect(button).not.toBeSelected();
    await fireEvent.press(button);
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it.each([
    ['dry', 'Dry'],
    ['heat', 'Heat'],
    ['auto', 'Auto'],
  ] as const)('AC-6: renders the %s mode', async (mode, label) => {
    await render(<ModeButton mode={mode} label={label} selected={false} onPress={jest.fn()} />);
    expect(screen.getByRole('button', { name: label })).toBeOnTheScreen();
  });
});
