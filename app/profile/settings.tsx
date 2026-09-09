import React from 'react';
import { Stack, useRouter } from 'expo-router';
import { useApp } from '@/context/app-store';
import { SettingsScreen } from '@/screens/cleaner/settings-screen';

export default function SettingsRoute() {
  const { lang } = useApp();
  const router = useRouter();
  return (
    <>
      <Stack.Screen options={{ headerShown: true, title: lang === 'RU' ? 'Настройки' : 'Settings' }} />
      <SettingsScreen onLoggedOut={() => router.replace('/login')} />
    </>
  );
}
