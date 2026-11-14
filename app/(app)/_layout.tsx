import React from 'react';
import { Pressable } from 'react-native';
import { Stack, router } from 'expo-router';
import { ChevronLeft } from 'lucide-react-native';
import { ReceptionProvider } from '@/context/reception-store';

// Our own back button for the screens that show the native header (notifications, reports,
// settings, chats…). The system one stopped responding in testers' builds — e.g. on the
// second visit to Notifications — so this one just calls router.back(), or goes home when
// there's nothing to go back to.
function HeaderBack() {
  return (
    <Pressable
      hitSlop={12}
      onPress={() => (router.canGoBack() ? router.back() : router.replace('/'))}
      className="h-9 w-9 items-center justify-center active:opacity-60"
    >
      <ChevronLeft size={24} color="#241E1A" />
    </Pressable>
  );
}

export default function AppLayout() {
  return (
    <ReceptionProvider>
      <Stack
        screenOptions={{
          headerShown: false,
          headerBackButtonDisplayMode: 'minimal',
          headerLeft: () => <HeaderBack />,
          contentStyle: { backgroundColor: '#FAF7F3' },
        }}
      />
    </ReceptionProvider>
  );
}
