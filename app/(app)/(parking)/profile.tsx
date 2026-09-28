import React from 'react';
import { useRouter } from 'expo-router';
import { ParkingProfileScreen } from '@/screens/parking/profile-screen';

export default function ParkingProfileTab() {
  const router = useRouter();
  return <ParkingProfileScreen onLoggedOut={() => router.replace('/login')} />;
}
