import React from 'react';
import { useRouter } from 'expo-router';
import { WaiterProfileScreen } from '@/screens/waiter/profile-screen';

export default function WaiterProfileTab() {
  const router = useRouter();
  return (
    <WaiterProfileScreen
      onOpenChats={() => router.push('/profile/chats')}
      onOpenNotifications={() => router.push('/profile/notifications')}
      onOpenSettings={() => router.push('/profile/settings')}
      onLoggedOut={() => router.replace('/login')}
    />
  );
}
