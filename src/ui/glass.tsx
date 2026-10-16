// Design: design/boards/Style.dc.html — .glass frosted card; liquid glass on iOS 26+ (language §5)
import { GlassView, isGlassEffectAPIAvailable, isLiquidGlassAvailable } from 'expo-glass-effect';
import { cssInterop } from 'nativewind';
import { useSyncExternalStore } from 'react';
import { AccessibilityInfo, View, type ViewProps } from 'react-native';

import { useTheme } from '@/theme/theme-provider';

cssInterop(GlassView, { className: 'style' });

// Reduce Transparency is one app-wide setting, so every Glass shares one subscription.
let reduceTransparency = false;
const listeners = new Set<() => void>();
let subscribed = false;
function subscribe(onChange: () => void) {
  listeners.add(onChange);
  if (!subscribed) {
    subscribed = true;
    const set = (value: boolean) => {
      reduceTransparency = value;
      listeners.forEach((l) => l());
    };
    AccessibilityInfo.isReduceTransparencyEnabled?.()
      .then(set)
      .catch(() => {});
    AccessibilityInfo.addEventListener?.('reduceTransparencyChanged', set);
  }
  return () => listeners.delete(onChange);
}
const getReduceTransparency = () => reduceTransparency;

/** True when the native liquid glass view can be used (iOS 26+, not reduced transparency). */
export function useLiquidGlass() {
  const reduced = useSyncExternalStore(subscribe, getReduceTransparency, getReduceTransparency);
  return !reduced && isLiquidGlassAvailable() && isGlassEffectAPIAvailable();
}

export type GlassProps = ViewProps & {
  className?: string;
  /** Pressable glass (round buttons) reacts to touch on iOS 26. */
  interactive?: boolean;
  /** Room pills blur without the saturate boost on the web preview. */
  saturate?: boolean;
};

/**
 * The one frosted surface: cards, the tab bar, round buttons. Liquid glass where iOS has it,
 * otherwise the canvas's frosted fill (glass token, 1 px glass-line border, glass shadow).
 */
export function Glass({ className, interactive, saturate = true, style, ...rest }: GlassProps) {
  const { name, tokens } = useTheme();
  const liquid = useLiquidGlass();
  if (liquid) {
    return (
      <GlassView
        {...rest}
        glassEffectStyle="regular"
        colorScheme={name}
        isInteractive={interactive}
        className={className}
        style={style}
      />
    );
  }
  return (
    <View
      {...rest}
      className={[
        'border border-glass-line bg-glass',
        saturate ? 'web:backdrop-glass' : 'web:backdrop-pill',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
      style={[{ boxShadow: `0px 10px 30px ${tokens.glassShadow}` }, style]}
    />
  );
}
