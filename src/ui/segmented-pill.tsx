// Design: design/boards/Climate.dc.html — fan speed segmented pill with the sliding .ind indicator
import { useEffect, useRef, useState } from 'react';
import { Pressable, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

import { useTheme } from '@/theme/theme-provider';

import { Text } from './text';

const slideEasing = Easing.bezier(0.2, 0.8, 0.2, 1);
const PAD = 4;
const GAP = 4;

export type SegmentOption<T> = { value: T; label: string; accessibilityLabel?: string };

export type SegmentedPillProps<T> = {
  options: readonly SegmentOption<T>[];
  value: T | undefined;
  onChange: (value: T) => void;
  /** Name of the group, e.g. "Fan speed". */
  accessibilityLabel: string;
  disabled?: boolean;
};

export function SegmentedPill<T extends string | number>({
  options,
  value,
  onChange,
  accessibilityLabel,
  disabled,
}: SegmentedPillProps<T>) {
  const { tokens } = useTheme();
  const [width, setWidth] = useState(0);
  const index = options.findIndex((o) => o.value === value);
  const column = width > 0 ? (width - PAD * 2 - GAP * (options.length - 1)) / options.length : 0;
  const x = useSharedValue(Math.max(index, 0) * (column + GAP));
  // The first measured position is placed at once; later changes slide.
  const placed = useRef(false);

  useEffect(() => {
    if (column <= 0) return;
    const target = Math.max(index, 0) * (column + GAP);
    if (!placed.current) {
      placed.current = true;
      x.set(target);
      return;
    }
    x.set(withTiming(target, { duration: 450, easing: slideEasing }));
  }, [index, column, x]);

  const indicator = useAnimatedStyle(() => ({ transform: [{ translateX: x.get() }] }));

  return (
    <View
      accessibilityRole="radiogroup"
      accessibilityLabel={accessibilityLabel}
      onLayout={(e) => setWidth(e.nativeEvent.layout.width)}
      className="rounded-tile bg-track p-1"
      style={disabled ? { opacity: 0.35 } : undefined}
    >
      {index >= 0 && column > 0 ? (
        <Animated.View
          style={[
            {
              position: 'absolute',
              left: PAD,
              top: PAD,
              height: 44,
              width: column,
              borderRadius: 22,
              backgroundColor: tokens.selBg,
            },
            indicator,
          ]}
        />
      ) : null}
      <View className="flex-row gap-1">
        {options.map((o) => {
          const selected = o.value === value;
          return (
            <Pressable
              key={String(o.value)}
              accessibilityRole="button"
              accessibilityLabel={o.accessibilityLabel ?? o.label}
              accessibilityState={{ selected, disabled: !!disabled }}
              disabled={disabled}
              onPress={() => {
                if (!selected) onChange(o.value);
              }}
              className="h-11 flex-1 items-center justify-center rounded-full"
            >
              <Text variant="support" weight="semibold" tone={selected ? 'sel-ink' : 'muted'}>
                {o.label}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}
