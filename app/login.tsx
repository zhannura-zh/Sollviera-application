import React from 'react';
import { useRouter } from 'expo-router';
import { LoginScreen } from '@/screens/login-screen';

export default function LoginRoute() {
  const router = useRouter();
  return <LoginScreen onLoggedIn={() => router.replace('/(tabs)')} />;
}
