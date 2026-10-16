import { render } from '@testing-library/react-native';

import { drawnPaths, lucidePaths } from '@/test-support/drawing';

import { ModeIcon } from '../mode-icon';

describe('ModeIcon', () => {
  it.each([
    ['cool', 'snowflake'],
    ['dry', 'droplet'],
    ['fan', 'fan'],
    ['heat', 'sun'],
  ] as const)('draws the %s mode as the Lucide %s glyph', async (mode, glyph) => {
    await render(<ModeIcon mode={mode} color="currentColor" />);
    expect(drawnPaths()).toEqual(lucidePaths(glyph));
  });

  it('draws auto as the board’s circle-A glyph', async () => {
    await render(<ModeIcon mode="auto" color="currentColor" />);
    expect(drawnPaths()).toEqual(['M8.5 16 12 7.5 15.5 16', 'M9.8 13h4.4']);
  });
});
