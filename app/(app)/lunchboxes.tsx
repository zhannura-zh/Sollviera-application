import React from 'react';
import { Stack } from 'expo-router';
import { useApp } from '@/context/app-store';
import { LunchboxScreen } from '@/screens/waiter/lunchbox-screen';

export default function LunchboxesRoute() {
  const { lang } = useApp();
  return (
    <>
      <Stack.Screen options={{ headerShown: true, title: lang === 'RU' ? 'Ланчбоксы' : 'Lunchboxes' }} />
      <LunchboxScreen />
    </>
  );
}
