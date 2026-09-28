import React from 'react';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { StaffWorkloadScreen } from '@/screens/supervisor/staff-workload-screen';

export default function StaffWorkloadRoute() {
  const { name } = useLocalSearchParams<{ name: string }>();
  const router = useRouter();

  return (
    <StaffWorkloadScreen
      staffName={name ? decodeURIComponent(name) : null}
      onBack={() => router.back()}
      onMessage={() => router.push('/profile/chats')}
    />
  );
}
