import React from 'react';
import { useRouter } from 'expo-router';
import { InspectionScreen } from '@/screens/supervisor/inspection-screen';

export default function SupervisorInspectionTab() {
  const router = useRouter();
  return <InspectionScreen onOpenRoom={(id) => router.push(`/inspect/${id}`)} />;
}
