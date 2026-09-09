import React from 'react';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useApp } from '@/context/app-store';
import { RoomDetailsScreen } from '@/screens/cleaner/room-details-screen';

export default function RoomDetailRoute() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { rooms } = useApp();
  const room = rooms.find((r) => r.id === id) || null;

  return (
    <RoomDetailsScreen
      room={room}
      onBack={() => router.back()}
      onGoToMaintenance={() => router.push('/(tabs)/maintenance')}
    />
  );
}
