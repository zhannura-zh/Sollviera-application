import React from 'react';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useApp } from '@/context/app-store';
import { InspectionDetailScreen } from '@/screens/supervisor/inspection-detail-screen';

export default function InspectionDetailRoute() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { rooms } = useApp();
  const room = rooms.find((r) => r.id === id) || null;

  return <InspectionDetailScreen room={room} onBack={() => router.back()} />;
}
