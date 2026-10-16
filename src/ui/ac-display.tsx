// Design: design/boards/Climate.dc.html — the AC's dead-front display (.disp): icons, digits, fan bars
import { Leaf, Zap } from 'lucide-react-native';
import { useEffect } from 'react';
import { View } from 'react-native';
import Animated, {
  cancelAnimation,
  Easing,
  interpolateColor,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';

import { display } from '@/theme/tokens';

import { ModeIcon, type AcModeName } from './mode-icon';
import { Text } from './text';

export type DisplayFan = 'auto' | 'quiet' | 'low' | 'medium' | 'high';
export type DisplayPreset = 'none' | 'eco' | 'boost';

const LEVEL: Record<DisplayFan, number> = { auto: 0, quiet: 1, low: 2, medium: 3, high: 4 };
const BAR_HEIGHTS = [3, 5, 8, 11] as const;
const BAR_DELAYS = [0, 150, 300, 450] as const;

/** Per-size layout from language §8. */
const SIZES = {
  lg: { gap: 7, icon: 12, height: 18, text: 'display-lg', extras: true },
  md: { gap: 6, icon: 11, height: 15, text: 'display-md', extras: false },
  sm: { gap: 4, icon: 9, height: 12, text: 'display-sm', extras: false },
} as const;

export type AcDisplayProps = {
  size: keyof typeof SIZES;
  on: boolean;
  mode: AcModeName;
  /** Target temperature; ignored in fan-only mode, which shows "FAN". */
  temp: number | null;
  fan?: DisplayFan;
  preset?: DisplayPreset;
};

function Bar({ index, lit, wave }: { index: number; lit: boolean; wave: boolean }) {
  const v = useSharedValue(lit ? 1 : 0);
  useEffect(() => {
    cancelAnimation(v);
    if (wave) {
      v.set(0);
      v.set(
        withDelay(
          BAR_DELAYS[index] ?? 0,
          withRepeat(
            withSequence(
              withTiming(1, { duration: 700, easing: Easing.inOut(Easing.ease) }),
              withTiming(0, { duration: 700, easing: Easing.inOut(Easing.ease) }),
            ),
            -1,
          ),
        ),
      );
    } else {
      v.set(withTiming(lit ? 1 : 0, { duration: 300 }));
    }
    return () => cancelAnimation(v);
  }, [wave, lit, index, v]);
  const style = useAnimatedStyle(() => ({
    backgroundColor: interpolateColor(v.get(), [0, 1], [display.dim, display.glow]),
  }));
  return (
    <Animated.View style={[{ width: 2, height: BAR_HEIGHTS[index], borderRadius: 1 }, style]} />
  );
}

/**
 * Small orange digits and icons glowing on the white panel, mirroring every setting.
 * Blank when the AC is off; re-pulses (.15 → 1 over .6 s) whenever a setting changes.
 */
export function AcDisplay({ size, on, mode, temp, fan = 'auto', preset = 'none' }: AcDisplayProps) {
  const reduced = useReducedMotion();
  const s = SIZES[size];
  const value = mode === 'fan' ? 'FAN' : temp === null ? '' : `${Math.round(temp)}°`;
  const level = LEVEL[fan];

  const shown = useSharedValue(on ? 1 : 0);
  const pulse = useSharedValue(1);
  useEffect(() => {
    shown.set(withTiming(on ? 1 : 0, { duration: 400 }));
  }, [on, shown]);
  useEffect(() => {
    pulse.set(
      withSequence(
        withTiming(0.15, { duration: 0 }),
        withTiming(1, { duration: 600, easing: Easing.out(Easing.ease) }),
      ),
    );
  }, [on, mode, value, fan, preset, pulse]);
  const style = useAnimatedStyle(() => ({ opacity: shown.get() * pulse.get() }));

  const PresetIcon = preset === 'eco' ? Leaf : preset === 'boost' ? Zap : null;
  const summary = on
    ? [value, mode, preset !== 'none' ? preset : null, s.extras ? `fan level ${level}` : null]
        .filter(Boolean)
        .join(', ')
    : 'blank';

  return (
    <Animated.View
      accessibilityLabel={summary}
      style={[{ flexDirection: 'row', alignItems: 'center', gap: s.gap, height: s.height }, style]}
    >
      {s.extras ? (
        <View style={{ width: 10, height: 10 }}>
          {PresetIcon ? <PresetIcon size={10} strokeWidth={2.2} color={display.glow} /> : null}
        </View>
      ) : null}
      <ModeIcon mode={mode} size={s.icon} strokeWidth={2.2} color={display.glow} />
      <Text
        variant={s.text}
        style={{
          color: display.glow,
          textShadowColor: display.glowShadow,
          textShadowRadius: 8,
          textShadowOffset: { width: 0, height: 0 },
        }}
      >
        {value}
      </Text>
      {s.extras ? (
        <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: 1.5, height: 11 }}>
          {BAR_HEIGHTS.map((_, i) => (
            <Bar key={i} index={i} lit={level >= i + 1} wave={fan === 'auto' && on && !reduced} />
          ))}
        </View>
      ) : null}
    </Animated.View>
  );
}
