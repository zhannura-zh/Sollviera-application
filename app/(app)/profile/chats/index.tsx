import React from 'react';
import { Stack, useRouter } from 'expo-router';
import { useApp } from '@/context/app-store';
import { ChatsScreen } from '@/screens/cleaner/chats-screen';

export default function ChatsRoute() {
  const { lang } = useApp();
  const router = useRouter();
  return (
    <>
      <Stack.Screen options={{ headerShown: true, title: lang === 'RU' ? 'Чаты' : 'Chats' }} />
      <ChatsScreen onOpenContact={(id) => router.push(`/profile/chats/${id}`)} />
    </>
  );
}
