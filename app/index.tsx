import React from 'react';
import { Redirect } from 'expo-router';
import { useApp } from '@/context/app-store';

export default function Index() {
  const { isLoggedIn, authReady } = useApp();
  if (!authReady) return null;
  return <Redirect href={isLoggedIn ? '/(tabs)' : '/login'} />;
}
