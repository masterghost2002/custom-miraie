// Design: design/boards/Rooms.dc.html — "Turn everything off" primary button (56 tall, solid ink)
import { type LucideIcon } from 'lucide-react-native';

import { useTheme } from '@/theme/theme-provider';

import { PressScale } from './press-scale';
import { Text } from './text';

export type PrimaryButtonProps = {
  label: string;
  onPress?: () => void;
  disabled?: boolean;
  /** A request is running: the label says so and the button can't be pressed again. */
  busy?: boolean;
  icon?: LucideIcon;
};

export function PrimaryButton({ label, onPress, disabled, busy, icon: Icon }: PrimaryButtonProps) {
  const { tokens } = useTheme();
  return (
    <PressScale
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ busy: !!busy }}
      onPress={onPress}
      disabled={disabled || busy}
      scale={0.97}
      className="h-14 w-full flex-row items-center justify-center gap-2.5 rounded-card bg-sel-bg"
    >
      {Icon ? <Icon size={18} strokeWidth={2.2} color={tokens.selInk} /> : null}
      <Text variant="card" tone="sel-ink">
        {label}
      </Text>
    </PressScale>
  );
}
