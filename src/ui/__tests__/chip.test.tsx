import { fireEvent, render, screen } from '@testing-library/react-native';
import { Snowflake } from 'lucide-react-native';

import { Chip } from '../chip';

describe('Chip', () => {
  it('a room pill reads as selected when it is the featured room', async () => {
    await render(
      <>
        <Chip label="Bedroom" selected onPress={jest.fn()} />
        <Chip label="Living room" onPress={jest.fn()} />
      </>,
    );
    expect(screen.getByRole('button', { name: 'Bedroom' })).toBeSelected();
    expect(screen.getByRole('button', { name: 'Living room' })).not.toBeSelected();
  });

  it('AC-10: calls onPress when tapped', async () => {
    const onPress = jest.fn();
    await render(<Chip label="Cool" variant="pill" onPress={onPress} />);
    await fireEvent.press(screen.getByRole('button', { name: 'Cool' }));
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it('a header chip can carry its own spoken label', async () => {
    await render(
      <Chip
        label="Cool"
        variant="header"
        icon={<Snowflake size={16} />}
        accessibilityLabel="Mode: cool"
        onPress={jest.fn()}
      />,
    );
    expect(screen.getByRole('button', { name: 'Mode: cool' })).toBeOnTheScreen();
  });
});
