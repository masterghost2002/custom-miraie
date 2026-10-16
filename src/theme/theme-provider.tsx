// Design: Chill canvas › Style.dc.html — dark is the default theme, light is optional.
import { vars } from 'nativewind';
import { createContext, useContext, useMemo, type ReactNode } from 'react';
import { View } from 'react-native';

import { cssVars, themes, type ThemeName, type ThemeTokens } from './tokens';

const ThemeContext = createContext<{ name: ThemeName; tokens: ThemeTokens }>({
  name: 'dark',
  tokens: themes.dark,
});

export function ThemeProvider({
  name = 'dark',
  children,
}: {
  name?: ThemeName;
  children: ReactNode;
}) {
  const value = useMemo(() => ({ name, tokens: themes[name] }), [name]);
  const style = useMemo(() => vars(cssVars(themes[name])), [name]);
  return (
    <ThemeContext.Provider value={value}>
      <View style={style} className="flex-1 bg-ground">
        {children}
      </View>
    </ThemeContext.Provider>
  );
}

/** Raw token values for places classes can't reach (SVG strokes, shadows, blur tint). */
export function useTheme() {
  return useContext(ThemeContext);
}
