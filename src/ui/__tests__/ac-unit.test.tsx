import { act, render, screen } from '@testing-library/react-native';

import { display } from '@/theme/tokens';
import { animatedStyle, animatedViews, viewsSized } from '@/test-support/drawing';

import { AcDisplay } from '../ac-display';
import { AcUnit } from '../ac-unit';

const hidden = { includeHiddenElements: true };
const slot = () => animatedViews('height')[0];

describe('AcUnit', () => {
  beforeEach(() => jest.useFakeTimers());
  afterEach(() => jest.useRealTimers());

  it('is decoration: VoiceOver skips it, and it carries the display', async () => {
    await render(<AcUnit size="lg" display={<AcDisplay size="lg" on mode="cool" temp={24} />} />);
    expect(screen.queryByText('24°')).not.toBeOnTheScreen();
    expect(screen.getByText('24°', hidden)).toBeOnTheScreen();
  });

  it('narrows the vent slot when the AC turns off (9 → 3 on the Climate unit)', async () => {
    const view = await render(<AcUnit size="lg" on />);
    expect(animatedStyle(slot()).height).toBe(9);
    await view.rerender(<AcUnit size="lg" on={false} />);
    await act(async () => jest.advanceTimersByTime(600));
    expect(animatedStyle(slot()).height).toBe(3);
  });

  it.each([
    ['lg', 310, 92],
    ['md', 250, 76],
    ['sm', 150, 48],
    ['xs', 104, 32],
    ['icon', 44, 15],
    ['side', 58, 52],
    ['top', 120, 14],
  ] as const)('draws the %s unit at the board size %i × %i', async (size, width, height) => {
    await render(<AcUnit size={size} />);
    expect(viewsSized(width, height)).toHaveLength(1);
  });

  it('spans a custom width (the Climate unit fills the screen minus 40 pt each side)', async () => {
    await render(<AcUnit size="lg" width={350} />);
    expect(viewsSized(350, 92)).toHaveLength(1);
  });

  it('lights the status LED only while on (list icon)', async () => {
    const led = () => viewsSized(3, 3)[0];
    const view = await render(<AcUnit size="icon" on={false} />);
    expect(led()?.props.style).toEqual(
      expect.objectContaining({ backgroundColor: display.ledOff }),
    );
    await view.rerender(<AcUnit size="icon" on />);
    expect(led()?.props.style).not.toEqual(
      expect.objectContaining({ backgroundColor: display.ledOff }),
    );
  });
});
