// Design: design/boards/Rooms.dc.html — round power button (.pw), accent while running
import { Power } from 'lucide-react-native';
import { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  interpolateColor,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

import { useTheme } from '@/theme/theme-provider';
import { fixed } from '@/theme/tokens';

import { PressScale } from './press-scale';

export type PowerButtonProps = {
  on: boolean;
  onPress: () => void;
  /** "<room> power" */
  accessibilityLabel: string;
  disabled?: boolean;
  /** 44 on Home's small cards, 48 in the All devices list. */
  size?: 44 | 48;
};

export function PowerButton({
  on,
  onPress,
  accessibilityLabel,
  disabled,
  size = 44,
}: PowerButtonProps) {
  const { tokens } = useTheme();
  const progress = useSharedValue(on ? 1 : 0);
  useEffect(() => {
    progress.set(withTiming(on ? 1 : 0, { duration: 300 }));
  }, [on, progress]);
  const fill = useAnimatedStyle(() => ({
    backgroundColor: interpolateColor(progress.get(), [0, 1], [tokens.pill, tokens.accent]),
  }));
  return (
    <PressScale
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      accessibilityState={{ selected: on }}
      onPress={onPress}
      disabled={disabled}
      disabledOpacity={0.4}
      className={`${size === 44 ? 'size-11' : 'size-12'} items-center justify-center rounded-full`}
    >
      <Animated.View
        style={[
          StyleSheet.absoluteFill,
          { borderRadius: size / 2 },
          fill,
          on ? { boxShadow: `0px 6px 16px ${fixed.powerShadow}` } : null,
        ]}
      />
      <View className="absolute inset-0 items-center justify-center">
        <Power
          size={size === 44 ? 18 : 20}
          strokeWidth={2.2}
          color={on ? tokens.onAccent : tokens.ink}
        />
      </View>
    </PressScale>
  );
}
