import React from 'react';
import { View, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Wrench } from 'lucide-react-native';
import { useApp } from '@/context/app-store';
import { TicketDetailsScreen } from '@/screens/technician/ticket-details-screen';

interface ActiveScreenProps {
  onBack: () => void;
}

// Shows the single ticket the technician has started (IN_PROGRESS) — mirrors the
// production app's Active tab, which is always one ticket's full workflow, not a list.
export function ActiveScreen({ onBack }: ActiveScreenProps) {
  const { lang, maintenanceRequests } = useApp();
  const active = maintenanceRequests.find((r) => r.status === 'IN_PROGRESS') || null;

  if (!active) {
    return (
      <SafeAreaView edges={['top']} className="flex-1 bg-background items-center justify-center px-8 gap-2">
        <Wrench size={28} color="#8A8177" />
        <Text className="text-sm font-jost text-text-secondary text-center">
          {lang === 'RU'
            ? 'Нет активной заявки. Возьмите заявку в работу на вкладке «Номера».'
            : 'No active ticket. Start one from the Rooms tab.'}
        </Text>
      </SafeAreaView>
    );
  }

  return <TicketDetailsScreen ticket={active} onBack={onBack} />;
}
