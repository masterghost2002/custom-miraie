import { render, screen } from '@testing-library/react-native';

import { Breeze, wavePath } from '../breeze';

describe('Breeze', () => {
  it('draws the board wave: a quadratic first wave, then smooth repeats along the line', () => {
    expect(wavePath(52, -9, 97.5, 195)).toBe('M0 52 Q48.75 43 97.5 52 T195 52 T292.5 52');
  });

  it('is hidden from VoiceOver', async () => {
    await render(<Breeze />);
    expect(screen.root).not.toBeVisible();
  });
});
