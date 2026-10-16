import { render, screen } from '@testing-library/react-native';
import { View } from 'react-native';

import { ModeIcon } from '../mode-icon';

describe('ModeIcon', () => {
  it.each(['cool', 'dry', 'fan', 'heat', 'auto'] as const)('draws the %s glyph', async (mode) => {
    await render(
      <View accessible accessibilityLabel={mode}>
        <ModeIcon mode={mode} color="currentColor" />
      </View>,
    );
    expect(screen.getByLabelText(mode)).not.toBeEmptyElement();
  });
});
