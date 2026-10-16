// Design: design/boards/Style.dc.html — .breeze: two drifting wave layers, 70 s / 110 s (language §6)
import { useEffect, useMemo } from 'react';
import { StyleSheet, useWindowDimensions, View } from 'react-native';
import Animated, {
  cancelAnimation,
  Easing,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import Svg, { Path } from 'react-native-svg';

import { useTheme } from '@/theme/theme-provider';

/** Each layer slides left by 390 pt per loop — a whole number of waves, so the loop is seamless. */
const DRIFT = 390;

type Layer = { first: number; wave: number; amplitudes: readonly number[]; duration: number };

// From the boards: layer 1 starts at y 52, layer 2 at y 126; lines repeat every 148 pt.
const LAYERS: readonly Layer[] = [
  { first: 52, wave: 97.5, amplitudes: [-9, -12, 10, -11, -6, 9], duration: 70_000 },
  { first: 126, wave: 65, amplitudes: [6, -7, -5, 8, -12, -7], duration: 110_000 },
];
const LINE_GAP = 148;

export function wavePath(y: number, amplitude: number, wave: number, length: number) {
  let d = `M0 ${y} Q${wave / 2} ${y + amplitude} ${wave} ${y}`;
  for (let x = wave * 2; x <= length + wave; x += wave) d += ` T${x} ${y}`;
  return d;
}

function BreezeLayer({ layer, width, height }: { layer: Layer; width: number; height: number }) {
  const { tokens } = useTheme();
  const reduced = useReducedMotion();
  const x = useSharedValue(0);
  const length = width + DRIFT;

  const paths = useMemo(() => {
    const out: string[] = [];
    for (let i = 0, y = layer.first; y < height; i++, y += LINE_GAP) {
      out.push(wavePath(y, layer.amplitudes[i % layer.amplitudes.length] ?? 0, layer.wave, length));
    }
    return out;
  }, [layer, height, length]);

  useEffect(() => {
    if (reduced) return;
    x.set(0);
    x.set(
      withRepeat(
        withTiming(-DRIFT, { duration: layer.duration, easing: Easing.linear }),
        -1,
        false,
      ),
    );
    return () => cancelAnimation(x);
  }, [reduced, layer.duration, x]);

  const style = useAnimatedStyle(() => ({ transform: [{ translateX: x.get() }] }));

  return (
    <Animated.View style={[StyleSheet.absoluteFill, { width: length + layer.wave }, style]}>
      <Svg width={length + layer.wave} height={height}>
        {paths.map((d) => (
          <Path key={d} d={d} fill="none" stroke={tokens.wave} strokeWidth={1} />
        ))}
      </Svg>
    </Animated.View>
  );
}

/** Slow drifting breeze lines behind every screen: flat strokes, never a gradient. */
export function Breeze() {
  const { width, height } = useWindowDimensions();
  return (
    <View
      pointerEvents="none"
      accessible={false}
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      style={[StyleSheet.absoluteFill, { overflow: 'hidden' }]}
    >
      {LAYERS.map((layer) => (
        <BreezeLayer key={layer.first} layer={layer} width={width} height={height} />
      ))}
    </View>
  );
}
