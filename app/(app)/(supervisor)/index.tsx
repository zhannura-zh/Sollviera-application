import React from 'react';
import { useRouter } from 'expo-router';
import { SupervisorDashboardScreen } from '@/screens/supervisor/dashboard-screen';

export default function SupervisorDashboardTab() {
  const router = useRouter();
  return <SupervisorDashboardScreen onOpenRoom={(id) => router.push(`/monitor/${id}`)} />;
}
