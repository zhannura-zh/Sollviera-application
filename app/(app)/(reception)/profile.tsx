import React from 'react';
import { useRouter } from 'expo-router';
import { ReceptionProfileScreen } from '@/screens/reception/profile-screen';

export default function ReceptionProfileTab() {
  const router = useRouter();
  return <ReceptionProfileScreen onLoggedOut={() => router.replace('/login')} />;
}
