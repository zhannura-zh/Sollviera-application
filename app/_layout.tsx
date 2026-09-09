import '@/global.css';

import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { useFonts, Jost_400Regular, Jost_500Medium, Jost_600SemiBold } from '@expo-google-fonts/jost';
import { Spectral_500Medium } from '@expo-google-fonts/spectral';

import { AppProvider } from '@/context/app-store';

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    Jost_400Regular,
    Jost_500Medium,
    Jost_600SemiBold,
    Spectral_500Medium,
  });

  if (!fontsLoaded) return null;

  return (
    <SafeAreaProvider>
      <AppProvider>
        <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: '#FAF7F3' } }} />
        <StatusBar style="dark" />
      </AppProvider>
    </SafeAreaProvider>
  );
}
