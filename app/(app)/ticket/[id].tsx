import React from 'react';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useApp } from '@/context/app-store';
import { TicketDetailsScreen } from '@/screens/technician/ticket-details-screen';
import { MaintenanceDetailScreen } from '@/screens/supervisor/maintenance-detail-screen';

export default function TicketDetailRoute() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { maintenanceRequests, role } = useApp();
  const ticket = maintenanceRequests.find((r) => r.id === id) || null;

  if (role === 'SUPERVISOR') {
    return <MaintenanceDetailScreen ticket={ticket} onBack={() => router.back()} />;
  }
  return <TicketDetailsScreen ticket={ticket} onBack={() => router.back()} readOnly={role !== 'TECHNICIAN'} />;
}
