// Design: design/boards/Main.dc.html — power pill (.pp): 52 tall, sliding 44 pt knob, "On" / "Off"
import { Power } from 'lucide-react-native';
import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import Animated, {
  Easing,
  interpolateColor,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

import { useTheme } from '@/theme/theme-provider';
import { fixed } from '@/theme/tokens';

import { Text } from './text';

const knobEasing = Easing.bezier(0.3, 1.3, 0.5, 1);
/** The knob (44) sits 4 pt in from either end, so it travels the width minus 52. */
const KNOB_INSETS = 52;

export type PowerPillProps = {
  on: boolean;
  onChange: (next: boolean) => void;
  /** "<room> power" on Home, "Power" on Climate. */
  accessibilityLabel: string;
  /** Words on the pill, from the feature's copy ("On" / "Off"). */
  onLabel: string;
  offLabel: string;
  disabled?: boolean;
  /** 120 wide on Home; fills its card on Climate. */
  fill?: boolean;
};

export function PowerPill({
  on,
  onChange,
  accessibilityLabel,
  onLabel,
  offLabel,
  disabled,
  fill,
}: PowerPillProps) {
  const { tokens } = useTheme();
  const [width, setWidth] = useState(120);
  const progress = useSharedValue(on ? 1 : 0);
  const fade = useSharedValue(on ? 1 : 0);
  useEffect(() => {
    progress.set(withTiming(on ? 1 : 0, { duration: 450, easing: knobEasing }));
    fade.set(withTiming(on ? 1 : 0, { duration: 300 }));
  }, [on, progress, fade]);

  const travel = Math.max(0, width - KNOB_INSETS);
  const knob = useAnimatedStyle(() => ({
    transform: [{ translateX: progress.get() * travel }],
    backgroundColor: interpolateColor(fade.get(), [0, 1], [tokens.track, tokens.accent]),
  }));
  const onText = useAnimatedStyle(() => ({ opacity: fade.get() }));
  const offText = useAnimatedStyle(() => ({ opacity: 1 - fade.get() }));

  return (
    <Pressable
      accessibilityRole="switch"
      accessibilityLabel={accessibilityLabel}
      accessibilityState={{ checked: on, disabled: !!disabled }}
      onPress={() => onChange(!on)}
      disabled={disabled}
      onLayout={(e) => setWidth(e.nativeEvent.layout.width)}
      className={`h-13 rounded-full bg-pill ${fill ? 'self-stretch' : 'w-30'}`}
      style={disabled ? { opacity: 0.4 } : undefined}
    >
      <Animated.View style={[styles.onLabel, onText]}>
        <Text variant="body" weight="semibold">
          {onLabel}
        </Text>
      </Animated.View>
      <Animated.View style={[styles.offLabel, offText]}>
        <Text variant="body" weight="semibold" tone="muted">
          {offLabel}
        </Text>
      </Animated.View>
      <Animated.View
        style={[styles.knob, on ? { boxShadow: `0px 6px 16px ${fixed.powerShadow}` } : null, knob]}
      >
        <View className="flex-1 items-center justify-center">
          <Power size={18} strokeWidth={2.2} color={on ? tokens.onAccent : tokens.ink} />
        </View>
      </Animated.View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  onLabel: { position: 'absolute', left: 18, top: 0, bottom: 0, justifyContent: 'center' },
  offLabel: { position: 'absolute', right: 18, top: 0, bottom: 0, justifyContent: 'center' },
  knob: { position: 'absolute', top: 4, left: 4, width: 44, height: 44, borderRadius: 22 },
});
