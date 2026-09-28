import React from 'react';
import { Stack, useRouter } from 'expo-router';
import { useApp } from '@/context/app-store';
import { StaffDirectoryScreen } from '@/screens/supervisor/staff-directory-screen';

export default function StaffDirectoryRoute() {
  const { lang } = useApp();
  const router = useRouter();
  return (
    <>
      <Stack.Screen options={{ headerShown: false, title: lang === 'RU' ? 'Персонал' : 'Staff' }} />
      <StaffDirectoryScreen onBack={() => router.back()} />
    </>
  );
}
