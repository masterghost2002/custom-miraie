import '@/global.css';

import {
  PlusJakartaSans_300Light,
  PlusJakartaSans_400Regular,
  PlusJakartaSans_500Medium,
  PlusJakartaSans_600SemiBold,
  PlusJakartaSans_700Bold,
  useFonts,
} from '@expo-google-fonts/plus-jakarta-sans';
import { DarkTheme, Stack, ThemeProvider as NavigationTheme } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';

import { ThemeProvider } from '@/theme/theme-provider';
import { themes } from '@/theme/tokens';

// Screens draw their own ground; navigation containers must stay see-through.
const navigationTheme = {
  ...DarkTheme,
  colors: { ...DarkTheme.colors, background: themes.dark.bg, card: themes.dark.bg },
};

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    PlusJakartaSans_300Light,
    PlusJakartaSans_400Regular,
    PlusJakartaSans_500Medium,
    PlusJakartaSans_600SemiBold,
    PlusJakartaSans_700Bold,
  });

  useEffect(() => {
    if (fontsLoaded) SplashScreen.hideAsync();
  }, [fontsLoaded]);

  if (!fontsLoaded) return null;

  return (
    <ThemeProvider name="dark">
      <NavigationTheme value={navigationTheme}>
        <StatusBar style="light" />
        <Stack screenOptions={{ headerShown: false }} />
      </NavigationTheme>
    </ThemeProvider>
  );
}
