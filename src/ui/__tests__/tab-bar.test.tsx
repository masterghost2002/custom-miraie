import { fireEvent, render, screen } from '@testing-library/react-native';
import { Clock, House, LayoutGrid, Settings } from 'lucide-react-native';

import { TabBar } from '../tab-bar';

const items = [
  { key: 'index', label: 'Home', icon: House },
  { key: 'devices', label: 'All devices', icon: LayoutGrid },
  { key: 'schedules', label: 'Schedules', icon: Clock },
  { key: 'settings', label: 'Settings', icon: Settings },
];

describe('TabBar', () => {
  it('AC-9: given the tab bar, when the person taps "Schedules", then it asks to go to Schedules', async () => {
    const onSelect = jest.fn();
    await render(<TabBar items={items} current="index" onSelect={onSelect} />);
    await fireEvent.press(screen.getByRole('tab', { name: 'Schedules' }));
    expect(onSelect).toHaveBeenCalledWith('schedules');
  });

  it('AC-9: the current tab reads as selected and the others do not', async () => {
    await render(<TabBar items={items} current="devices" onSelect={jest.fn()} />);
    expect(screen.getByRole('tab', { name: 'All devices' })).toBeSelected();
    expect(screen.getByRole('tab', { name: 'Home' })).not.toBeSelected();
  });

  it('does nothing when the current tab is tapped again', async () => {
    const onSelect = jest.fn();
    await render(<TabBar items={items} current="index" onSelect={onSelect} />);
    await fireEvent.press(screen.getByRole('tab', { name: 'Home' }));
    expect(onSelect).not.toHaveBeenCalled();
  });
});
