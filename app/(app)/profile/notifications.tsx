import React from 'react';
import { Stack, useRouter } from 'expo-router';
import { useApp } from '@/context/app-store';
import { NotificationsScreen } from '@/screens/cleaner/notifications-screen';

export default function NotificationsRoute() {
  const { lang } = useApp();
  const router = useRouter();
  return (
    <>
      <Stack.Screen options={{ headerShown: true, title: lang === 'RU' ? 'Уведомления' : 'Notifications' }} />
      <NotificationsScreen onOpenChats={() => router.push('/profile/chats')} />
    </>
  );
}
