import { fireEvent, render, screen } from '@testing-library/react-native';

import GalleryRoute from '../_gallery';

describe('Primitive gallery', () => {
  it('AC-11: shows every primitive and switches between the dark and light themes', async () => {
    await render(<GalleryRoute />);
    expect(screen.getByRole('tab', { name: 'Schedules' })).toBeOnTheScreen();
    expect(screen.getAllByRole('button', { name: 'Turn everything off' })).toHaveLength(2);
    expect(screen.getByRole('switch', { name: 'Eco' })).toBeOnTheScreen();
    expect(screen.getByRole('switch', { name: 'Power' })).toBeOnTheScreen();
    expect(screen.getByRole('button', { name: 'Fan only' })).toBeOnTheScreen();
    expect(screen.getByRole('button', { name: 'Powerchill' })).toBeOnTheScreen();
    expect(screen.getByText('hero')).toBeOnTheScreen();

    await fireEvent.press(screen.getByRole('button', { name: 'Light' }));
    expect(screen.getByRole('button', { name: 'Light' })).toBeSelected();
    await fireEvent.press(screen.getByRole('tab', { name: 'Schedules' }));
    expect(screen.getByRole('tab', { name: 'Schedules' })).toBeSelected();
  });
});
