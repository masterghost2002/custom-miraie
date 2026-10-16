// Design: design/boards/Climate.dc.html — energy toggles (.tg): 48 × 28 track, 22 pt knob
import { useEffect } from 'react';
import { Pressable, StyleSheet } from 'react-native';
import Animated, {
  Easing,
  interpolateColor,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

import { useTheme } from '@/theme/theme-provider';
import { fixed } from '@/theme/tokens';

const KNOB_TRAVEL = 20; // left 3 → 23
const knobEasing = Easing.bezier(0.3, 1.3, 0.5, 1);

export type ToggleProps = {
  value: boolean;
  onChange: (next: boolean) => void;
  accessibilityLabel: string;
  disabled?: boolean;
};

export function Toggle({ value, onChange, accessibilityLabel, disabled }: ToggleProps) {
  const { tokens } = useTheme();
  const knob = useSharedValue(value ? 1 : 0);
  const track = useSharedValue(value ? 1 : 0);
  useEffect(() => {
    knob.set(withTiming(value ? 1 : 0, { duration: 350, easing: knobEasing }));
    track.set(withTiming(value ? 1 : 0, { duration: 300 }));
  }, [value, knob, track]);

  const trackStyle = useAnimatedStyle(() => ({
    backgroundColor: interpolateColor(track.get(), [0, 1], [tokens.track, tokens.selBg]),
  }));
  const knobStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: knob.get() * KNOB_TRAVEL }],
    backgroundColor: interpolateColor(track.get(), [0, 1], [fixed.white, tokens.selInk]),
  }));

  return (
    <Pressable
      accessibilityRole="switch"
      accessibilityLabel={accessibilityLabel}
      accessibilityState={{ checked: value, disabled: !!disabled }}
      onPress={() => onChange(!value)}
      disabled={disabled}
      hitSlop={{ top: 8, bottom: 8 }}
      className="h-7 w-12 rounded-full"
      style={disabled ? { opacity: 0.35 } : undefined}
    >
      <Animated.View style={[StyleSheet.absoluteFill, { borderRadius: 14 }, trackStyle]} />
      <Animated.View
        style={[
          styles.knob,
          { boxShadow: value ? undefined : `0px 1px 3px ${fixed.knobShadow}` },
          knobStyle,
        ]}
      />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  knob: { position: 'absolute', top: 3, left: 3, width: 22, height: 22, borderRadius: 11 },
});
