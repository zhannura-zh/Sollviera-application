import React from 'react';
import { useRouter } from 'expo-router';
import { SupervisorMaintenanceScreen } from '@/screens/supervisor/maintenance-screen';

export default function SupervisorMaintenanceTab() {
  const router = useRouter();
  return <SupervisorMaintenanceScreen onOpenTicket={(id) => router.push(`/ticket/${id}`)} />;
}
