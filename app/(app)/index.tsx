import React from 'react';
import { Redirect } from 'expo-router';
import { useApp } from '@/context/app-store';

// Reached once Stack.Protected in the root layout has already confirmed isLoggedIn —
// this only decides which role's tab group to land on.
export default function AppIndex() {
  const { role } = useApp();
  if (role === 'TECHNICIAN') return <Redirect href="/(tech)" />;
  if (role === 'SUPERVISOR') return <Redirect href="/(supervisor)" />;
  if (role === 'WAITER') return <Redirect href="/(waiter)" />;
  if (role === 'PARKING') return <Redirect href="/(parking)" />;
  return <Redirect href="/(tabs)" />;
}
