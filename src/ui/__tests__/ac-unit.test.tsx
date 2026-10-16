import { act, render, screen } from '@testing-library/react-native';

import { AcDisplay } from '../ac-display';
import { AcUnit } from '../ac-unit';

const hidden = { includeHiddenElements: true };
const views = () => screen.container.queryAll((n) => n.type === 'View');

describe('AcUnit', () => {
  beforeEach(() => jest.useFakeTimers());
  afterEach(() => jest.useRealTimers());

  it('is decoration: VoiceOver skips it, and it carries the display', async () => {
    await render(<AcUnit size="lg" display={<AcDisplay size="lg" on mode="cool" temp={24} />} />);
    expect(screen.queryByText('24°')).not.toBeOnTheScreen();
    expect(screen.getByText('24°', hidden)).toBeOnTheScreen();
  });

  it('narrows the vent slot when the AC turns off (9 → 3 on the Climate unit)', async () => {
    const { rerender } = await render(<AcUnit size="lg" on />);
    const slot = () => views().find((n) => n.props.jestAnimatedStyle?.value?.height !== undefined);
    expect(slot()).toHaveAnimatedStyle({ height: 9 });
    await rerender(<AcUnit size="lg" on={false} />);
    await act(async () => jest.advanceTimersByTime(600));
    expect(slot()).toHaveAnimatedStyle({ height: 3 });
  });

  it.each(['md', 'sm', 'xs', 'icon', 'side', 'top'] as const)('draws the %s size', async (size) => {
    await render(<AcUnit size={size} on={false} />);
    expect(views().length).toBeGreaterThan(0);
  });
});
