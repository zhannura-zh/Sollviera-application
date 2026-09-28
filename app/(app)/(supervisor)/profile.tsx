import React from 'react';
import { useRouter } from 'expo-router';
import { ProfileScreen } from '@/screens/supervisor/profile-screen';

export default function SupervisorProfileTab() {
  const router = useRouter();
  return (
    <ProfileScreen
      onOpenChats={() => router.push('/profile/chats')}
      onOpenNotifications={() => router.push('/profile/notifications')}
      onOpenSettings={() => router.push('/profile/settings')}
      onOpenReports={() => router.push('/profile/reports')}
      onOpenStaff={() => router.push('/profile/staff')}
      onLoggedOut={() => router.replace('/login')}
    />
  );
}
