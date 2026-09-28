import React from 'react';
import { useRouter } from 'expo-router';
import { TeamScreen } from '@/screens/supervisor/team-screen';

export default function SupervisorTeamTab() {
  const router = useRouter();
  return <TeamScreen onOpenStaff={(name) => router.push(`/staff/${encodeURIComponent(name)}`)} />;
}
