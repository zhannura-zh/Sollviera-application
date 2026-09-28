import React from 'react';
import { useRouter } from 'expo-router';
import { DashboardScreen } from '@/screens/technician/dashboard-screen';

export default function TechnicianDashboardTab() {
  const router = useRouter();
  return <DashboardScreen onOpenTicket={(id) => router.push(`/ticket/${id}`)} />;
}
