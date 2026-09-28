import React from 'react';
import { Stack } from 'expo-router';
import { useApp } from '@/context/app-store';
import { ReportsScreen as CleanerReportsScreen } from '@/screens/cleaner/reports-screen';
import { ReportsScreen as TechnicianReportsScreen } from '@/screens/technician/reports-screen';
import { ReportsScreen as SupervisorReportsScreen } from '@/screens/supervisor/reports-screen';

export default function ReportsRoute() {
  const { lang, role } = useApp();
  const title = lang === 'RU' ? (role === 'SUPERVISOR' ? 'Отчёты по смене' : 'Мои отчёты') : role === 'SUPERVISOR' ? 'Shift Reports' : 'My Reports';
  return (
    <>
      <Stack.Screen options={{ headerShown: true, title }} />
      {role === 'TECHNICIAN' ? <TechnicianReportsScreen /> : role === 'SUPERVISOR' ? <SupervisorReportsScreen /> : <CleanerReportsScreen />}
    </>
  );
}
