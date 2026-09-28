import React from 'react';
import { View, Text, Pressable } from 'react-native';
import { ChevronRight } from 'lucide-react-native';
import { Language, MaintenanceRequest } from '@/types';

interface TicketListItemProps {
  req: MaintenanceRequest;
  categoryLabel: string;
  lang: Language;
  onPress: () => void;
}

export function TicketListItem({ req, categoryLabel, lang, onPress }: TicketListItemProps) {
  const isBlocked = req.blocksCleaning && req.status !== 'RESOLVED';
  return (
    <Pressable onPress={onPress} className="bg-white rounded-[14px] border border-border p-3.5 flex-row items-center gap-3 active:bg-background">
      <View className="h-11 w-11 rounded-xl bg-background items-center justify-center border border-border">
        <Text className="text-xs font-jost-semibold text-text-primary">№{req.roomNumber || '—'}</Text>
      </View>
      <View className="flex-1 gap-1">
        <View className="flex-row items-center gap-1.5 flex-wrap">
          <Text className="text-sm font-jost-semibold text-text-primary">{categoryLabel}</Text>
          {req.isGuestDamage && (
            <View className="bg-[#FFF4ED] border border-[#FED7AA] px-1.5 py-0.5 rounded">
              <Text className="text-[10px] font-jost-semibold text-[#C2410C] uppercase">
                {lang === 'RU' ? 'Поломка гостем' : 'Guest damage'}
              </Text>
            </View>
          )}
          {isBlocked && (
            <View className="bg-error/10 px-1.5 py-0.5 rounded">
              <Text className="text-error text-[10px] font-jost-semibold uppercase">
                {lang === 'RU' ? 'БЛОКИРУЕТ' : 'BLOCKS'}
              </Text>
            </View>
          )}
        </View>
        <Text className="text-[13px] font-jost text-text-secondary" numberOfLines={1}>
          {req.description} · {req.timestamp}
        </Text>
      </View>
      <ChevronRight size={16} color="#8A8177" />
    </Pressable>
  );
}
