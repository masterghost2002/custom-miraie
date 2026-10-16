import { fireEvent, render, screen } from '@testing-library/react-native';

import { PowerPill } from '../power-pill';

const labels = { onLabel: 'On', offLabel: 'Off' };

describe('PowerPill', () => {
  it('AC-5: given PowerPill on, then "On" shows and tapping calls onChange(false)', async () => {
    const onChange = jest.fn();
    await render(
      <PowerPill on onChange={onChange} accessibilityLabel="Bedroom power" {...labels} />,
    );
    const pill = screen.getByRole('switch', { name: 'Bedroom power' });
    expect(pill).toBeChecked();
    expect(screen.getByText('On')).toBeOnTheScreen();
    await fireEvent.press(pill);
    expect(onChange).toHaveBeenCalledWith(false);
  });

  it('AC-5: is disabled when the AC is offline', async () => {
    const onChange = jest.fn();
    await render(
      <PowerPill
        on={false}
        disabled
        fill
        onChange={onChange}
        accessibilityLabel="Power"
        {...labels}
      />,
    );
    const pill = screen.getByRole('switch', { name: 'Power' });
    expect(pill).toBeDisabled();
    expect(pill).not.toBeChecked();
    await fireEvent.press(pill);
    expect(onChange).not.toHaveBeenCalled();
  });
});
