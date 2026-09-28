import React from 'react';
import { useRouter } from 'expo-router';
import { ActiveScreen } from '@/screens/technician/active-screen';

export default function TechnicianActiveTab() {
  const router = useRouter();
  return <ActiveScreen onBack={() => router.push('/(tech)')} />;
}
