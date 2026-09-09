import React from 'react';
import { Stack } from 'expo-router';
import { useApp } from '@/context/app-store';
import { ReportsScreen } from '@/screens/cleaner/reports-screen';

export default function ReportsRoute() {
  const { lang } = useApp();
  return (
    <>
      <Stack.Screen options={{ headerShown: true, title: lang === 'RU' ? 'Мои отчёты' : 'My Reports' }} />
      <ReportsScreen />
    </>
  );
}
