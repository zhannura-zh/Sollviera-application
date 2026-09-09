import React from 'react';
import { useRouter } from 'expo-router';
import { DashboardScreen } from '@/screens/cleaner/dashboard-screen';

export default function DashboardTab() {
  const router = useRouter();
  return <DashboardScreen onOpenRoom={(id) => router.push(`/room/${id}`)} />;
}
