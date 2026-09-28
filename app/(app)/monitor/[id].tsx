import React from 'react';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useApp } from '@/context/app-store';
import { RoomDetailScreen } from '@/screens/supervisor/room-detail-screen';

export default function SupervisorRoomDetailRoute() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { rooms } = useApp();
  const room = rooms.find((r) => r.id === id) || null;

  return (
    <RoomDetailScreen
      room={room}
      onBack={() => router.back()}
      onMessage={() => router.push('/profile/chats')}
    />
  );
}
