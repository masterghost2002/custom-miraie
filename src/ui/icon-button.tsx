// Design: design/boards/Climate.dc.html — header back / more options and −/+ (48 pt glass circles)
import { type LucideIcon } from 'lucide-react-native';
import { View } from 'react-native';

import { useTheme } from '@/theme/theme-provider';

import { Glass } from './glass';
import { PressScale } from './press-scale';

const sizes = { 40: 'size-10', 44: 'size-11', 48: 'size-12', 52: 'size-13' } as const;

export type IconButtonProps = {
  icon: LucideIcon;
  /** Required: icon-only buttons are named for VoiceOver (the board's aria-label). */
  accessibilityLabel: string;
  onPress?: () => void;
  disabled?: boolean;
  /** `glass` for header and −/+ buttons; `pill` for the small raised circle inside cards. */
  variant?: 'glass' | 'pill';
  size?: keyof typeof sizes;
  iconSize?: 16 | 18 | 20;
  strokeWidth?: number;
};

export function IconButton({
  icon: Icon,
  accessibilityLabel,
  onPress,
  disabled,
  variant = 'glass',
  size = 48,
  iconSize = 20,
  strokeWidth = 2,
}: IconButtonProps) {
  const { tokens } = useTheme();
  const shape = `${sizes[size]} items-center justify-center rounded-full`;
  const icon = <Icon size={iconSize} strokeWidth={strokeWidth} color={tokens.ink} />;
  return (
    <PressScale
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      onPress={onPress}
      disabled={disabled}
      hitSlop={size < 44 ? (44 - size) / 2 : undefined}
    >
      {variant === 'glass' ? (
        <Glass interactive className={shape}>
          {icon}
        </Glass>
      ) : (
        <View className={`${shape} bg-pill`}>{icon}</View>
      )}
    </PressScale>
  );
}
