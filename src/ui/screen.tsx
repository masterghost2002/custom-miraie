// Design: design/boards/Main.dc.html — page root: ground, breeze, safe area, 20 pt gutters
import { type ReactNode } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Breeze } from './breeze';
import { useTabBarSpace } from './tab-bar';

const padding = {
  /** Tab screens: 20 top, 20 sides (the tab bar floats over the bottom). */
  tab: 'px-5 pt-5',
  /** Detail screens (Climate, Airflow): 16 top, 20 sides, 28 bottom. */
  detail: 'px-5 pt-4 pb-7',
  /** Sign in: 44 top, 24 sides, 24 bottom. */
  auth: 'px-6 pt-11 pb-6',
} as const;

export type ScreenProps = {
  children: ReactNode;
  variant?: keyof typeof padding;
  /** Decorative layer between the breeze and the content (air particles), so glass can blur it. */
  background?: ReactNode;
  /** Scroll when content is taller than the screen (short iPhones, long lists). */
  scroll?: boolean;
};

export function Screen({ children, variant = 'tab', background, scroll = false }: ScreenProps) {
  const insets = useSafeAreaInsets();
  const tabSpace = useTabBarSpace();
  const bottom = variant === 'tab' ? tabSpace : insets.bottom;
  const content = <View className={`flex-1 ${padding[variant]}`}>{children}</View>;
  return (
    <View className="flex-1 bg-ground">
      <Breeze />
      {background ? (
        <View
          pointerEvents="none"
          accessibilityElementsHidden
          importantForAccessibility="no-hide-descendants"
          style={StyleSheet.absoluteFill}
        >
          {background}
        </View>
      ) : null}
      <View style={{ flex: 1, paddingTop: insets.top, paddingBottom: bottom }}>
        {scroll ? (
          <ScrollView
            contentContainerStyle={{ flexGrow: 1 }}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            {content}
          </ScrollView>
        ) : (
          content
        )}
      </View>
    </View>
  );
}
