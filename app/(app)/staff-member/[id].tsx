import React from 'react';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useApp } from '@/context/app-store';
import { StaffMemberScreen } from '@/screens/supervisor/staff-member-screen';

export default function StaffMemberRoute() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { staffList } = useApp();
  const staff = staffList.find((s) => s.id === id) || null;

  return (
    <StaffMemberScreen
      staff={staff}
      onBack={() => router.back()}
      onMessage={() => router.push('/profile/chats')}
    />
  );
}
