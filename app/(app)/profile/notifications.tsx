import React from 'react';
import { Stack } from 'expo-router';
import { useApp } from '@/context/app-store';
import { NotificationsScreen } from '@/screens/cleaner/notifications-screen';

export default function NotificationsRoute() {
  const { lang } = useApp();
  return (
    <>
      <Stack.Screen options={{ headerShown: true, title: lang === 'RU' ? 'Уведомления' : 'Notifications' }} />
      <NotificationsScreen />
    </>
  );
}
