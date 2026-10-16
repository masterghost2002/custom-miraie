// Design: design/boards/Main.dc.html — room pills (.rp) and the featured card's mode chip
import { type ReactNode } from 'react';
import { View } from 'react-native';

import { Glass } from './glass';
import { PressScale } from './press-scale';
import { Text } from './text';

export type ChipProps = {
  label: string;
  onPress?: () => void;
  /**
   * `room`: 44 tall glass pill, solid ink when selected (Home room pills).
   * `pill`: 52 tall raised pill inside a card (Home mode chip).
   * `header`: 48 tall glass chip with an icon (Airflow header mode chip).
   */
  variant?: 'room' | 'pill' | 'header';
  selected?: boolean;
  icon?: ReactNode;
  accessibilityLabel?: string;
  disabled?: boolean;
};

export function Chip({
  label,
  onPress,
  variant = 'room',
  selected,
  icon,
  accessibilityLabel,
  disabled,
}: ChipProps) {
  const a11y = {
    accessibilityRole: 'button' as const,
    accessibilityLabel: accessibilityLabel ?? label,
    accessibilityState: variant === 'room' ? { selected: !!selected } : undefined,
    onPress,
    disabled,
  };

  if (variant === 'pill') {
    return (
      <PressScale {...a11y} className="h-13 flex-row items-center rounded-full bg-pill px-4.5">
        <Text variant="chip">{label}</Text>
      </PressScale>
    );
  }

  if (variant === 'header') {
    return (
      <PressScale {...a11y}>
        <Glass interactive className="h-12 flex-row items-center gap-1.5 rounded-full pl-3.5 pr-4">
          {icon}
          <Text variant="chip">{label}</Text>
        </Glass>
      </PressScale>
    );
  }

  return (
    <PressScale {...a11y}>
      {selected ? (
        <View className="h-11 justify-center rounded-full border border-sel-bg bg-sel-bg px-5">
          <Text variant="body" weight="medium" tone="sel-ink">
            {label}
          </Text>
        </View>
      ) : (
        <Glass interactive saturate={false} className="h-11 justify-center rounded-full px-5">
          <Text variant="body" weight="medium">
            {label}
          </Text>
        </Glass>
      )}
    </PressScale>
  );
}
