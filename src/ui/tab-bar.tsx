// Design: design/boards/Main.dc.html — glass tab bar dock (nav), 4 × 56 round buttons
import { type LucideIcon } from 'lucide-react-native';
import { View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useTheme } from '@/theme/theme-provider';

import { Glass } from './glass';
import { PressScale } from './press-scale';

/** Dock: 56 pt buttons + 6 pt padding top and bottom. */
const DOCK_HEIGHT = 68;
/** Space the board leaves between the last content and the dock. */
const GAP_ABOVE = 16;
/** Board bottom padding when the phone has no home indicator inset. */
const MIN_BOTTOM = 28;

/** Distance from the screen bottom to the dock. */
export function useTabBarBottom() {
  const insets = useSafeAreaInsets();
  return insets.bottom > 0 ? insets.bottom : MIN_BOTTOM;
}

/** Bottom padding a tab screen needs so its content ends above the floating dock. */
export function useTabBarSpace() {
  return useTabBarBottom() + DOCK_HEIGHT + GAP_ABOVE;
}

export type TabItem = { key: string; label: string; icon: LucideIcon };

export type TabBarProps = {
  items: readonly TabItem[];
  current: string;
  onSelect: (key: string) => void;
};

/** The frosted dock at the bottom of every tab: icons only, labels for VoiceOver. */
export function TabBar({ items, current, onSelect }: TabBarProps) {
  const { tokens } = useTheme();
  const bottom = useTabBarBottom();
  return (
    <View
      pointerEvents="box-none"
      className="absolute left-0 right-0 items-center"
      style={{ bottom }}
    >
      <Glass className="flex-row gap-1.5 rounded-dock p-1.5" accessibilityRole="tablist">
        {items.map(({ key, label, icon: Icon }) => {
          const selected = key === current;
          return (
            <PressScale
              key={key}
              accessibilityRole="tab"
              accessibilityLabel={label}
              accessibilityState={{ selected }}
              onPress={() => {
                if (!selected) onSelect(key);
              }}
              className={`size-14 items-center justify-center rounded-full ${selected ? 'bg-sel-bg' : ''}`}
            >
              <Icon size={22} strokeWidth={1.9} color={selected ? tokens.selInk : tokens.muted} />
            </PressScale>
          );
        })}
      </Glass>
    </View>
  );
}
