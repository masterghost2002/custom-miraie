import { render, screen } from '@testing-library/react-native';

import { drawnPaths } from '@/test-support/drawing';

import { AutoModeIcon } from '../auto-mode';

describe('AutoModeIcon', () => {
  it('draws the board’s A inside a circle, at the asked size and stroke', async () => {
    await render(<AutoModeIcon size={12} color="currentColor" strokeWidth={2.2} />);
    expect(drawnPaths()).toEqual(['M8.5 16 12 7.5 15.5 16', 'M9.8 13h4.4']);
    const circle = screen.container.queryAll((n) => n.props.r !== undefined)[0];
    expect(circle?.props).toMatchObject({ cx: 12, cy: 12, r: 9 });
    const svg = screen.container.queryAll((n) => n.type === 'RNSVGSvgView')[0];
    expect(svg?.props).toMatchObject({ bbWidth: 12, bbHeight: 12, strokeWidth: 2.2 });
  });
});
