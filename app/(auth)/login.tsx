import React from 'react';
import { useRouter } from 'expo-router';
import { LoginScreen } from '@/screens/login-screen';

export default function LoginRoute() {
  const router = useRouter();
  // Redirect through '/' rather than a hardcoded tab group: it reads the freshly-set
  // `role` from context on render, avoiding a stale closure from right after authenticate().
  return <LoginScreen onLoggedIn={() => router.replace('/')} />;
}
