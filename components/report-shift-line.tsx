import React from 'react';
import { Text } from 'react-native';
import { useApp } from '@/context/app-store';

// Top line of the shift reports: today's date and the employee's own attendance shift
// (opened by the front-desk QR), e.g. "02.11.2026 · смена с 10:57".
export function ReportShiftLine() {
  const { lang, hasOpenDeskShift, cleanerProfile } = useApp();
  const ru = lang === 'RU';
  const today = new Date().toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit', year: 'numeric' });
  const shift = hasOpenDeskShift
    ? ru ? `смена с ${cleanerProfile.currentShift.startTime}` : `shift since ${cleanerProfile.currentShift.startTime}`
    : ru ? 'смена не открыта' : 'shift not open';
  return (
    <Text className="text-sm font-jost text-text-secondary">
      {today} · {shift}
    </Text>
  );
}
