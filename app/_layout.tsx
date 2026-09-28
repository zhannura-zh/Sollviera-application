import '@/global.css';

import React, { useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { KeyboardProvider } from 'react-native-keyboard-controller';
import { useFonts, Jost_400Regular, Jost_500Medium, Jost_600SemiBold } from '@expo-google-fonts/jost';
import { Spectral_500Medium } from '@expo-google-fonts/spectral';

import { AppProvider, useApp } from '@/context/app-store';

// Keep the native splash up until we know both the fonts AND the restored-session /
// role decision are ready — so the very first frame the user sees is already the right
// screen (dashboard if logged in, login if not), never a blank frame or a flash of the
// wrong screen before Stack.Protected below picks a branch.
void SplashScreen.preventAutoHideAsync().catch(() => undefined);

function AppShell({ fontsLoaded }: { fontsLoaded: boolean }) {
  const { authReady, isLoggedIn } = useApp();
  const ready = fontsLoaded && authReady;

  useEffect(() => {
    if (ready) void SplashScreen.hideAsync().catch(() => undefined);
  }, [ready]);

  if (!ready) return null;

  return (
    <>
    <Stack screenOptions={{ headerShown: false, headerBackButtonDisplayMode: "minimal", contentStyle: { backgroundColor: '#FAF7F3' } }}>
    <Stack.Protected guard={isLoggedIn}>
          <Stack.Screen name="(app)" />
        </Stack.Protected>

        <Stack.Protected guard={!isLoggedIn}>
          <Stack.Screen name="(aut]h)" />
        </Stack.Protected>
      </Stack>
      <StatusBar style="dark" />
    </>
  );
}

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    Jost_400Regular,
    Jost_500Medium,
    Jost_600SemiBold,
    Spectral_500Medium,
  });

  return (
    <SafeAreaProvider>
      <KeyboardProvider>
        <AppProvider>
          <AppShell fontsLoaded={fontsLoaded} />
        </AppProvider>
      </KeyboardProvider>
    </SafeAreaProvider>
  );
}
