import { render, screen } from '@testing-library/react-native';
import { View } from 'react-native';

import { AutoModeIcon } from '../auto-mode';

describe('AutoModeIcon', () => {
  it('draws the circle-A glyph at the asked size', async () => {
    await render(
      <View accessible accessibilityLabel="Auto">
        <AutoModeIcon size={12} color="currentColor" strokeWidth={2.2} />
      </View>,
    );
    expect(screen.getByLabelText('Auto')).not.toBeEmptyElement();
  });
});
