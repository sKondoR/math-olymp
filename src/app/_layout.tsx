import {
  Manrope_500Medium,
  Manrope_600SemiBold,
  Manrope_700Bold,
  Manrope_800ExtraBold,
} from '@expo-google-fonts/manrope';
import { MaterialSymbols_500Medium } from '@expo-google-fonts/material-symbols/500Medium';
import { MaterialSymbols_500Medium_Filled } from '@expo-google-fonts/material-symbols/500Medium_Filled';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { SnackbarProvider } from '@/components/overlays';
import { StoreProvider } from '@/state/store';
import { ThemeRoot, useTheme } from '@/theme';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    Manrope_500Medium,
    Manrope_600SemiBold,
    Manrope_700Bold,
    Manrope_800ExtraBold,
    MaterialSymbols: MaterialSymbols_500Medium,
    MaterialSymbolsFilled: MaterialSymbols_500Medium_Filled,
  });
  return (
    <SafeAreaProvider>
      <StoreProvider>
        {(fontsLoaded || fontError) && (
          <ThemeRoot>
            <SnackbarProvider>
              <StatusBar style="dark" />
              <Screens />
            </SnackbarProvider>
          </ThemeRoot>
        )}
      </StoreProvider>
    </SafeAreaProvider>
  );
}

/** Mounts once the fonts and the saved state are both loaded. */
function Screens() {
  const c = useTheme();
  useEffect(() => {
    SplashScreen.hide();
  }, []);
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: c.page },
        animation: 'slide_from_right',
      }}
    />
  );
}
