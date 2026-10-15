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

import { rewardedAds } from '@/ads';
import { SnackbarProvider } from '@/components/overlays';
import { deviceLang, deviceStorage } from '@/state/device';
import { StoreProvider } from '@/state/store';
import { ThemeRoot, useTheme } from '@/theme';

SplashScreen.preventAutoHideAsync();
// Design 01: the system splash fades out over 320 ms into the home screen
SplashScreen.setOptions({ fade: true, duration: 320 });

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
      <StoreProvider storage={deviceStorage} deviceLang={deviceLang()} ads={rewardedAds}>
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
