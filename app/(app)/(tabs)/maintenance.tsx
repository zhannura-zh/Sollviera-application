import React from 'react';
import { useLocalSearchParams } from 'expo-router';
import { MaintenanceScreen } from '@/screens/cleaner/maintenance-screen';

export default function MaintenanceTab() {
  // Set when coming from a room card's "Поломка" button — prefills the room in the form.
  const { room } = useLocalSearchParams<{ room?: string }>();
  return <MaintenanceScreen roomNumber={room} />;
}
