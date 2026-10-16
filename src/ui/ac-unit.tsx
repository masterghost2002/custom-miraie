// Design: design/boards/Climate.dc.html — the white AC unit with its slim vent (language §7, every size)
import { useEffect, type ReactNode } from 'react';
import { View, type StyleProp, type ViewStyle } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

import { useTheme } from '@/theme/theme-provider';
import { display as displayColours, fixed } from '@/theme/tokens';

type Vent = {
  /** left/right inset, distance from the bottom, height on / off, radius */
  inset: number;
  bottom: number;
  on: number;
  off: number;
  radius: number;
  dark: boolean;
};

type Spec = {
  width: number;
  height: number;
  radii: [topLeft: number, topRight: number, bottomRight: number, bottomLeft: number];
  shadow: string;
  vent?: Vent;
  /** Side view: a short vent at the right instead of a full-width slot. */
  sideVent?: boolean;
  blade?: boolean;
  seam?: { y: number; inset: number };
  display?: { right: number; top: number };
  led?: boolean;
};

const w = fixed.white;

/** Size table from language §7 — the only place these drawing values live. */
const SPECS = {
  lg: {
    width: 310,
    height: 92,
    radii: [26, 26, 36, 36],
    shadow: `inset 0px 3px 0px ${w}, inset 0px -16px 22px ${fixed.insetSoft}, 0px 30px 50px ${fixed.unitShadowStrong}, 0px 6px 14px ${fixed.unitShadowSoft}`,
    vent: { inset: 34, bottom: 13, on: 9, off: 3, radius: 5, dark: true },
    blade: true,
    seam: { y: 60, inset: 20 },
    display: { right: 30, top: 24 },
  },
  md: {
    width: 250,
    height: 76,
    radii: [20, 20, 28, 28],
    shadow: `inset 0px 3px 0px ${w}, inset 0px -14px 20px ${fixed.seam}, 0px 26px 44px ${fixed.warmShadow16}, 0px 6px 12px ${fixed.warmShadow08}`,
    vent: { inset: 30, bottom: 11, on: 7, off: 3, radius: 4, dark: true },
    seam: { y: 50, inset: 16 },
    display: { right: 26, top: 20 },
  },
  sm: {
    width: 150,
    height: 48,
    radii: [15, 15, 20, 20],
    shadow: `inset 0px 2px 0px ${w}, inset 0px -10px 14px ${fixed.insetSoft}, 0px 14px 26px ${fixed.unitShadowMid}`,
    vent: { inset: 18, bottom: 6, on: 5, off: 2, radius: 3, dark: true },
    seam: { y: 31, inset: 10 },
    display: { right: 14, top: 11 },
  },
  xs: {
    width: 104,
    height: 32,
    radii: [10, 10, 13, 13],
    shadow: `inset 0px 2px 0px ${w}, inset 0px -8px 10px ${fixed.seam}, 0px 10px 18px ${fixed.warmShadow12}`,
    vent: { inset: 10, bottom: 5, on: 4, off: 4, radius: 2, dark: false },
  },
  icon: {
    width: 44,
    height: 15,
    radii: [6, 6, 8, 8],
    shadow: `inset 0px 1px 0px ${w}, 0px 6px 12px ${fixed.warmShadow16}`,
    vent: { inset: 6, bottom: 3, on: 4, off: 2, radius: 2, dark: false },
    led: true,
  },
  side: {
    width: 58,
    height: 52,
    radii: [0, 18, 22, 0],
    shadow: `inset 0px 2px 0px ${w}, inset 0px -10px 14px ${fixed.seam}, 0px 12px 24px ${fixed.warmShadow14}`,
    sideVent: true,
  },
  top: {
    width: 120,
    height: 14,
    radii: [7, 7, 7, 7],
    shadow: `inset 0px 2px 0px ${w}, 0px 8px 18px ${fixed.warmShadow14}`,
  },
} as const satisfies Record<string, Spec>;

export type AcUnitSize = keyof typeof SPECS;

const ventEasing = Easing.bezier(0.2, 0.8, 0.2, 1);

export type AcUnitProps = {
  size: AcUnitSize;
  on?: boolean;
  /** The dead-front display (`AcDisplay`), placed where the board puts it for this size. */
  display?: ReactNode;
  /** Width override, e.g. the Climate unit spans the screen minus 40 pt each side. */
  width?: number;
  style?: StyleProp<ViewStyle>;
};

/** Decorative: hidden from VoiceOver. Volume comes from inset shadows only, never a gradient. */
export function AcUnit({ size, on = true, display, width, style }: AcUnitProps) {
  const { tokens } = useTheme();
  const spec: Spec = SPECS[size];
  const vent = spec.vent;
  const ventHeight = useSharedValue(vent ? (on ? vent.on : vent.off) : 0);
  const blade = useSharedValue(on ? 1 : 0);
  useEffect(() => {
    if (vent)
      ventHeight.set(withTiming(on ? vent.on : vent.off, { duration: 500, easing: ventEasing }));
    blade.set(withTiming(on ? 1 : 0, { duration: 400 }));
  }, [on, vent, ventHeight, blade]);
  const ventStyle = useAnimatedStyle(() => ({ height: ventHeight.get() }));
  const bladeStyle = useAnimatedStyle(() => ({ opacity: blade.get() }));
  const [tl, tr, br, bl] = spec.radii;

  return (
    <View
      accessible={false}
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      style={[
        {
          width: width ?? spec.width,
          height: spec.height,
          backgroundColor: tokens.unit,
          borderTopLeftRadius: tl,
          borderTopRightRadius: tr,
          borderBottomRightRadius: br,
          borderBottomLeftRadius: bl,
          boxShadow: spec.shadow,
        },
        style,
      ]}
    >
      {spec.seam ? (
        <View
          style={{
            position: 'absolute',
            left: spec.seam.inset,
            right: spec.seam.inset,
            top: spec.seam.y,
            height: 1,
            backgroundColor: fixed.seam,
          }}
        />
      ) : null}
      {spec.display && display ? (
        <View style={{ position: 'absolute', right: spec.display.right, top: spec.display.top }}>
          {display}
        </View>
      ) : null}
      {vent ? (
        <Animated.View
          style={[
            {
              position: 'absolute',
              left: vent.inset,
              right: vent.inset,
              bottom: vent.bottom,
              borderRadius: vent.radius,
              overflow: 'hidden',
              justifyContent: 'center',
              backgroundColor: vent.dark ? displayColours.vent : tokens.slot,
            },
            ventStyle,
          ]}
        >
          {spec.blade ? (
            <Animated.View
              style={[
                {
                  marginHorizontal: 8,
                  height: 2,
                  borderRadius: 1,
                  backgroundColor: displayColours.blade,
                },
                bladeStyle,
              ]}
            />
          ) : null}
        </Animated.View>
      ) : null}
      {spec.sideVent ? (
        <View
          style={{
            position: 'absolute',
            right: 6,
            bottom: 6,
            width: 24,
            height: 6,
            borderRadius: 3,
            backgroundColor: tokens.slot,
          }}
        />
      ) : null}
      {spec.led ? (
        <View
          style={{
            position: 'absolute',
            right: 6,
            top: 4,
            width: 3,
            height: 3,
            borderRadius: 2,
            backgroundColor: on ? tokens.accent : displayColours.ledOff,
            boxShadow: on ? `0px 0px 5px ${tokens.accent}` : undefined,
          }}
        />
      ) : null}
    </View>
  );
}
