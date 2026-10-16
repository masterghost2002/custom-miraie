// Design: design/boards/Style.dc.html — .press: scale .94 over .15 s (.97 for the primary button), disabled opacity
import { type ReactNode } from 'react';
import { Pressable, type PressableProps, type StyleProp, type ViewStyle } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export type PressScaleProps = Omit<PressableProps, 'style' | 'children'> & {
  children: ReactNode;
  /** Pressed scale: .94 everywhere, .97 for wide buttons (CHILL-003 Q2). */
  scale?: 0.94 | 0.97;
  /** Opacity while disabled: .35 buttons, .4 power controls. */
  disabledOpacity?: 0.35 | 0.4;
  className?: string;
  style?: StyleProp<ViewStyle>;
};

/** A Pressable that shrinks a little while held, like every button on the boards. */
export function PressScale({
  children,
  scale = 0.94,
  disabledOpacity = 0.35,
  disabled,
  onPressIn,
  onPressOut,
  style,
  ...rest
}: PressScaleProps) {
  const pressed = useSharedValue(1);
  const animated = useAnimatedStyle(() => ({ transform: [{ scale: pressed.get() }] }));
  return (
    <AnimatedPressable
      {...rest}
      disabled={disabled}
      accessibilityState={{ ...rest.accessibilityState, disabled: !!disabled }}
      onPressIn={(e) => {
        pressed.set(withTiming(scale, { duration: 150 }));
        onPressIn?.(e);
      }}
      onPressOut={(e) => {
        pressed.set(withTiming(1, { duration: 150 }));
        onPressOut?.(e);
      }}
      style={[animated, disabled ? { opacity: disabledOpacity } : null, style]}
    >
      {children}
    </AnimatedPressable>
  );
}
