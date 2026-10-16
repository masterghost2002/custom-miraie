// Design: design/boards/Rooms.dc.html — device list icon tile: 44 × 15 unit, LED and falling drips
import { useEffect } from 'react';
import { View } from 'react-native';
import Animated, {
  cancelAnimation,
  Easing,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withRepeat,
  withTiming,
  type SharedValue,
} from 'react-native-reanimated';

import { useTheme } from '@/theme/theme-provider';

import { AcUnit } from './ac-unit';

const DRIP_MS = 1600;
const FALL = 18;
/** x position and CSS delay (s) of each drip. */
const DRIPS = [
  { x: 10, delay: -0.2 },
  { x: 21, delay: -0.9 },
  { x: 32, delay: -0.5 },
] as const;

function Drip({
  x,
  offset,
  progress,
  color,
}: {
  x: number;
  offset: number;
  progress: SharedValue<number>;
  color: string;
}) {
  const style = useAnimatedStyle(() => {
    const t = (progress.get() + offset) % 1;
    return {
      opacity: t < 0.2 ? t / 0.2 : (1 - t) / 0.8,
      transform: [{ translateY: t * FALL }],
    };
  });
  return (
    <Animated.View
      style={[
        {
          position: 'absolute',
          top: 0,
          left: x,
          width: 3,
          height: 3,
          borderRadius: 1.5,
          backgroundColor: color,
        },
        style,
      ]}
    />
  );
}

export type AcUnitTileProps = { on: boolean };

/** Decorative 68 pt tile: the tiny unit with its status LED, dripping cold air while on. */
export function AcUnitTile({ on }: AcUnitTileProps) {
  const { tokens } = useTheme();
  const reduced = useReducedMotion();
  const progress = useSharedValue(0);
  const dripping = on && !reduced;
  useEffect(() => {
    cancelAnimation(progress);
    if (!dripping) return;
    progress.set(0);
    progress.set(withRepeat(withTiming(1, { duration: DRIP_MS, easing: Easing.linear }), -1));
    return () => cancelAnimation(progress);
  }, [dripping, progress]);

  return (
    <View
      accessible={false}
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      className="size-17 rounded-tile-sm bg-pill"
    >
      <AcUnit size="icon" on={on} style={{ position: 'absolute', left: 12, top: 20 }} />
      {dripping ? (
        <View style={{ position: 'absolute', left: 12, top: 38, width: 44, height: 22 }}>
          {DRIPS.map((d) => (
            <Drip
              key={d.x}
              x={d.x}
              offset={(-d.delay * 1000) / DRIP_MS}
              progress={progress}
              color={tokens.particle}
            />
          ))}
        </View>
      ) : null}
    </View>
  );
}
