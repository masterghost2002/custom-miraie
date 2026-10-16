// Design: design/boards/Climate.dc.html — mode column buttons (.mb); selected = mode-sel fill + accent ring
import { View } from 'react-native';

import { useTheme } from '@/theme/theme-provider';
import { fixed } from '@/theme/tokens';

import { Glass } from './glass';
import { ModeIcon, type AcModeName } from './mode-icon';
import { PressScale } from './press-scale';

export type ModeButtonProps = {
  mode: AcModeName;
  /** Spoken name from the feature's copy: "Cool", "Dry", "Fan only", "Heat", "Auto". */
  label: string;
  selected: boolean;
  onPress: () => void;
  disabled?: boolean;
};

export function ModeButton({ mode, label, selected, onPress, disabled }: ModeButtonProps) {
  const { tokens } = useTheme();
  const icon = (
    <ModeIcon
      mode={mode}
      size={20}
      strokeWidth={1.9}
      color={selected ? tokens.accent : tokens.muted}
    />
  );
  return (
    <PressScale
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ selected }}
      onPress={onPress}
      disabled={disabled}
    >
      {selected ? (
        <View
          className="size-12 items-center justify-center rounded-full bg-mode-sel"
          style={{
            boxShadow: `0px 0px 0px 2px ${tokens.accent}, 0px 8px 20px ${fixed.modeShadow}`,
          }}
        >
          {icon}
        </View>
      ) : (
        <Glass interactive className="size-12 items-center justify-center rounded-full">
          {icon}
        </Glass>
      )}
    </PressScale>
  );
}
