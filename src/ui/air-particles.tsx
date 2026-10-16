// Design: design/boards/Climate.dc.html — air particles (.pt) flowing along cubic offset paths
import { useEffect, useMemo, useState } from 'react';
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
import Svg, { Path } from 'react-native-svg';

import { useTheme } from '@/theme/theme-provider';

/** A cubic Bézier in board coordinates: x0 y0, c1, c2, x1 y1 (the board's `M… C…` paths). */
export type Curve = readonly [number, number, number, number, number, number, number, number];

export type ParticleCurve = {
  path: Curve;
  /** CSS animation delays of the dots on this curve, in seconds (negative = already under way). */
  delays: readonly number[];
};

type Lut = { xs: number[]; ys: number[]; lens: number[]; total: number };

const SAMPLES = 40;

function point(c: Curve, t: number): [number, number] {
  const [x0, y0, x1, y1, x2, y2, x3, y3] = c;
  const u = 1 - t;
  const a = u * u * u;
  const b = 3 * u * u * t;
  const d = 3 * u * t * t;
  const e = t * t * t;
  return [a * x0 + b * x1 + d * x2 + e * x3, a * y0 + b * y1 + d * y2 + e * y3];
}

/** Sample the curve by arc length, so dots move evenly like CSS offset-distance. */
export function arcLengthTable(c: Curve): Lut {
  const xs: number[] = [];
  const ys: number[] = [];
  const lens: number[] = [];
  let total = 0;
  for (let i = 0; i <= SAMPLES; i++) {
    const [x, y] = point(c, i / SAMPLES);
    if (i > 0) total += Math.hypot(x - (xs[i - 1] ?? x), y - (ys[i - 1] ?? y));
    xs.push(x);
    ys.push(y);
    lens.push(total);
  }
  return { xs, ys, lens, total };
}

export function curvePath(c: Curve) {
  const [x0, y0, x1, y1, x2, y2, x3, y3] = c;
  return `M${x0} ${y0} C${x1} ${y1} ${x2} ${y2} ${x3} ${y3}`;
}

type DotProps = {
  lut: Lut;
  progress: SharedValue<number>;
  offset: number;
  size: number;
  fadeIn: number;
  fadeOut: number;
  sx: number;
  sy: number;
  color: string;
};

function Dot({ lut, progress, offset, size, fadeIn, fadeOut, sx, sy, color }: DotProps) {
  const style = useAnimatedStyle(() => {
    const t = (progress.get() + offset) % 1;
    const opacity = t < fadeIn ? t / fadeIn : t > fadeOut ? (1 - t) / (1 - fadeOut) : 1;
    const target = t * lut.total;
    let i = 1;
    while (i < lut.lens.length - 1 && (lut.lens[i] ?? 0) < target) i++;
    const l0 = lut.lens[i - 1] ?? 0;
    const l1 = lut.lens[i] ?? l0;
    const k = l1 > l0 ? (target - l0) / (l1 - l0) : 0;
    const x0 = lut.xs[i - 1] ?? 0;
    const y0 = lut.ys[i - 1] ?? 0;
    const x = x0 + ((lut.xs[i] ?? x0) - x0) * k;
    const y = y0 + ((lut.ys[i] ?? y0) - y0) * k;
    return {
      opacity,
      transform: [{ translateX: x * sx - size / 2 }, { translateY: y * sy - size / 2 }],
    };
  });
  return (
    <Animated.View
      style={[
        {
          position: 'absolute',
          left: 0,
          top: 0,
          width: size,
          height: size,
          borderRadius: size / 2,
        },
        { backgroundColor: color },
        style,
      ]}
    />
  );
}

export type AirParticlesProps = {
  /** Size of the board box the curves are drawn in; the layer stretches it to its own size. */
  boardWidth: number;
  boardHeight: number;
  curves: readonly ParticleCurve[];
  /** One trip along the curve, in ms (Climate: by fan speed). */
  durationMs: number;
  dotSize: 3 | 4 | 5;
  /** Opacity keyframes: fully in by `fadeIn`, starts fading at `fadeOut` (fractions of a trip). */
  fadeIn: number;
  fadeOut: number;
  /** Air flows only while the AC runs; the layer fades out over `fadeMs` when it stops. */
  visible: boolean;
  fadeMs?: number;
  /** Draw the curves as thin guide lines (Climate). */
  guides?: boolean;
};

/** Decorative air flow behind the cards, so frosted glass has something to blur. */
export function AirParticles({
  boardWidth,
  boardHeight,
  curves,
  durationMs,
  dotSize,
  fadeIn,
  fadeOut,
  visible,
  fadeMs = 600,
  guides,
}: AirParticlesProps) {
  const { tokens } = useTheme();
  const reduced = useReducedMotion();
  const [box, setBox] = useState({ width: boardWidth, height: boardHeight });
  const progress = useSharedValue(0);
  const shown = useSharedValue(visible ? 1 : 0);
  const luts = useMemo(() => curves.map((c) => arcLengthTable(c.path)), [curves]);
  const moving = visible && !reduced;

  useEffect(() => {
    shown.set(withTiming(visible ? 1 : 0, { duration: fadeMs }));
  }, [visible, fadeMs, shown]);

  useEffect(() => {
    cancelAnimation(progress);
    if (!moving) return;
    progress.set(0);
    progress.set(
      withRepeat(withTiming(1, { duration: durationMs, easing: Easing.linear }), -1, false),
    );
    return () => cancelAnimation(progress);
  }, [moving, durationMs, progress]);

  const layer = useAnimatedStyle(() => ({ opacity: shown.get() }));
  const sx = box.width / boardWidth;
  const sy = box.height / boardHeight;

  return (
    <View
      pointerEvents="none"
      accessible={false}
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      onLayout={(e) =>
        setBox({ width: e.nativeEvent.layout.width, height: e.nativeEvent.layout.height })
      }
      style={{ position: 'absolute', left: 0, top: 0, right: 0, bottom: 0 }}
    >
      {guides ? (
        <Svg
          width={box.width}
          height={box.height}
          viewBox={`0 0 ${boardWidth} ${boardHeight}`}
          preserveAspectRatio="none"
          style={{ position: 'absolute' }}
        >
          {curves.map((c) => (
            <Path
              key={curvePath(c.path)}
              d={curvePath(c.path)}
              fill="none"
              stroke={tokens.guide}
              strokeWidth={1}
              vectorEffect="non-scaling-stroke"
            />
          ))}
        </Svg>
      ) : null}
      {reduced ? null : (
        <Animated.View
          style={[{ position: 'absolute', left: 0, top: 0, right: 0, bottom: 0 }, layer]}
        >
          {curves.flatMap((c, ci) =>
            c.delays.map((delay) => (
              <Dot
                key={`${ci}:${delay}`}
                lut={luts[ci] as Lut}
                progress={progress}
                offset={((((-delay * 1000) / durationMs) % 1) + 1) % 1}
                size={dotSize}
                fadeIn={fadeIn}
                fadeOut={fadeOut}
                sx={sx}
                sy={sy}
                color={tokens.particle}
              />
            )),
          )}
        </Animated.View>
      )}
    </View>
  );
}
