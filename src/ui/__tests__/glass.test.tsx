import { render, screen } from '@testing-library/react-native';
import { isGlassEffectAPIAvailable, isLiquidGlassAvailable } from 'expo-glass-effect';

import { ThemeProvider } from '@/theme/theme-provider';

import { Glass } from '../glass';
import { Text } from '../text';

const liquid = jest.mocked(isLiquidGlassAvailable);
const api = jest.mocked(isGlassEffectAPIAvailable);

const glassViews = () => screen.container.queryAll((node) => node.type === 'ExpoGlassView');

describe('Glass', () => {
  afterEach(() => {
    liquid.mockReturnValue(false);
    api.mockReturnValue(false);
  });

  it('AC-2: given iOS 26 with liquid glass available, when Glass renders, then it uses the native GlassView', async () => {
    liquid.mockReturnValue(true);
    api.mockReturnValue(true);
    await render(
      <ThemeProvider name="dark">
        <Glass className="rounded-card p-4">
          <Text>Fan speed</Text>
        </Glass>
      </ThemeProvider>,
    );
    expect(screen.getByText('Fan speed')).toBeOnTheScreen();
    expect(glassViews()).toHaveLength(1);
    expect(glassViews()[0]?.props).toMatchObject({
      glassEffectStyle: 'regular',
      colorScheme: 'dark',
    });
  });

  it('AC-2: given an iOS without the glass API, when Glass renders, then it falls back to the frosted fill', async () => {
    liquid.mockReturnValue(true);
    api.mockReturnValue(false);
    await render(
      <Glass className="rounded-card p-4">
        <Text>Fan speed</Text>
      </Glass>,
    );
    expect(screen.getByText('Fan speed')).toBeOnTheScreen();
    expect(glassViews()).toHaveLength(0);
  });
});
