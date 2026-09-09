import React from 'react';
import { useRouter } from 'expo-router';
import { ProfileScreen } from '@/screens/cleaner/profile-screen';

export default function ProfileTab() {
  const router = useRouter();
  return (
    <ProfileScreen
      onOpenChats={() => router.push('/profile/chats')}
      onOpenNotifications={() => router.push('/profile/notifications')}
      onOpenSettings={() => router.push('/profile/settings')}
      onOpenReports={() => router.push('/profile/reports')}
    />
  );
}
