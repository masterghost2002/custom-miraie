import { render, screen } from '@testing-library/react-native';

import { Text } from '../text';

describe('Text', () => {
  it('renders its words', async () => {
    await render(<Text variant="title">Good evening</Text>);
    expect(screen.getByText('Good evening')).toBeOnTheScreen();
  });

  it('uses tabular numerals for readings, so digits do not jump as they change', async () => {
    await render(<Text variant="reading">24</Text>);
    expect(screen.getByText('24')).toHaveStyle({ fontVariant: ['tabular-nums'] });
  });

  it('keeps proportional numerals for body text', async () => {
    await render(<Text variant="body">Inside 27°</Text>);
    expect(screen.getByText('Inside 27°')).not.toHaveStyle({ fontVariant: ['tabular-nums'] });
  });
});
