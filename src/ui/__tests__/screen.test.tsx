import { render, screen } from '@testing-library/react-native';

import { Screen } from '../screen';
import { Text } from '../text';

describe('Screen', () => {
  it('shows its content above the breeze', async () => {
    await render(
      <Screen>
        <Text>Good evening</Text>
      </Screen>,
    );
    expect(screen.getByText('Good evening')).toBeVisible();
  });

  it('keeps the decorative background layer away from VoiceOver', async () => {
    await render(
      <Screen variant="detail" scroll background={<Text>particles</Text>}>
        <Text>Air conditioner</Text>
      </Screen>,
    );
    expect(screen.getByText('Air conditioner')).toBeVisible();
    expect(screen.queryByText('particles')).not.toBeOnTheScreen();
  });
});
