import React from 'react';
import { useRouter } from 'expo-router';
import { useApp } from '@/context/app-store';
import { RoomDetailsScreen } from '@/screens/cleaner/room-details-screen';

export default function ActiveTab() {
  const router = useRouter();
  const { activeRoom } = useApp();

  return (
    <RoomDetailsScreen
      room={activeRoom}
      onBack={() => router.push('/(tabs)')}
      onGoToMaintenance={() => router.push('/(tabs)/maintenance')}
    />
  );
}
