// Design: design/boards/Climate.dc.html — spinning fan icon (.spin), speed by fan, still when off
import { Fan } from 'lucide-react-native';
import { useEffect } from 'react';
import Animated, {
  cancelAnimation,
  Easing,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';

export type FanSpinSpeed = 'auto' | 'quiet' | 'low' | 'medium' | 'high';

/** One full turn, in ms (Climate board; Home spins at the 2 s default). */
export const SPIN_MS: Record<FanSpinSpeed, number> = {
  auto: 2000,
  quiet: 3600,
  low: 2600,
  medium: 1300,
  high: 600,
};

export type FanIconProps = {
  spinning: boolean;
  speed?: FanSpinSpeed;
  size?: number;
  color: string;
  strokeWidth?: number;
};

export function FanIcon({
  spinning,
  speed = 'auto',
  size = 20,
  color,
  strokeWidth = 1.9,
}: FanIconProps) {
  const reduced = useReducedMotion();
  const turn = useSharedValue(0);
  const active = spinning && !reduced;
  useEffect(() => {
    cancelAnimation(turn);
    turn.set(0);
    if (active) {
      turn.set(
        withRepeat(withTiming(360, { duration: SPIN_MS[speed], easing: Easing.linear }), -1),
      );
    }
    return () => cancelAnimation(turn);
  }, [active, speed, turn]);
  const style = useAnimatedStyle(() => ({ transform: [{ rotate: `${turn.get()}deg` }] }));
  return (
    <Animated.View
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      style={[{ width: size, height: size }, style]}
    >
      <Fan size={size} color={color} strokeWidth={strokeWidth} />
    </Animated.View>
  );
}
