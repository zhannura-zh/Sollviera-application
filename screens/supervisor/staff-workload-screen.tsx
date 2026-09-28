import React from 'react';
import { View, Text, Pressable, ScrollView, Alert } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { ChevronLeft, MessageSquare, Share2 } from 'lucide-react-native';
import { useApp } from '@/context/app-store';

interface StaffWorkloadScreenProps {
  staffName: string | null;
  onBack: () => void;
  onMessage: () => void;
}

// Minutes between two "HH:MM" clock readings (see mapHousekeepingTask in app-store.tsx).
function minutesBetweenClock(start: string, end: string): number {
  const parse = (v: string) => {
    const m = /^(\d{1,2}):(\d{2})/.exec(v);
    return m ? Number(m[1]) * 60 + Number(m[2]) : null;
  };
  const s = parse(start);
  const e = parse(end);
  if (s === null || e === null) return 0;
  let diff = e - s;
  if (diff < 0) diff += 24 * 60;
  return diff;
}

export function StaffWorkloadScreen({ staffName, onBack, onMessage }: StaffWorkloadScreenProps) {
  const { lang, rooms, staffList } = useApp();
  const insets = useSafeAreaInsets();

  const staff = staffList.find((s) => s.fullName === staffName);
  const assigned = rooms.filter((r) => r.assignedTo === staffName);
  const done = assigned.filter((r) => r.status === 'READY' || r.status === 'VERIFIED');
  const current = assigned.filter((r) => r.status !== 'READY' && r.status !== 'VERIFIED');
  const durations = done.filter((r) => r.startTime && r.endTime).map((r) => minutesBetweenClock(r.startTime as string, r.endTime as string));
  const avgMinutes = durations.length > 0 ? Math.round(durations.reduce((a, b) => a + b, 0) / durations.length) : null;

  if (!staffName) {
    return (
      <SafeAreaView edges={['top']} className="flex-1 bg-background items-center justify-center">
        <Text className="text-sm font-jost text-text-secondary">{lang === 'RU' ? 'Сотрудник не найден' : 'Staff member not found'}</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView edges={['top']} className="flex-1 bg-background">
      <View className="px-5 pt-2 pb-4 gap-3">
        <Pressable onPress={onBack} className="flex-row items-center gap-1.5 self-start">
          <ChevronLeft size={16} color="#8A8177" />
          <Text className="text-xs font-jost text-text-secondary">{lang === 'RU' ? 'Команда' : 'Team'}</Text>
        </Pressable>
        <View className="gap-1">
          <Text className="text-2xl font-spectral text-text-primary">{staffName}</Text>
          <Text className="text-[13px] font-jost text-text-secondary">
            {staff?.roleCode || (lang === 'RU' ? 'Клинер' : 'Cleaner')} ·{' '}
            <Text className={staff?.shiftStatus === 'ON_SHIFT' ? 'text-success-text' : 'text-text-secondary'}>
              {staff?.shiftStatus === 'ON_SHIFT' ? (lang === 'RU' ? 'на смене' : 'on shift') : (lang === 'RU' ? 'не на смене' : 'off shift')}
            </Text>
          </Text>
        </View>
      </View>

      <ScrollView className="flex-1 px-5" contentContainerStyle={{ paddingBottom: 20, gap: 16 }}>
        <View className="bg-white rounded-[14px] border border-border p-4 flex-row">
          <View className="flex-1 items-center">
            <Text className="text-lg font-jost-semibold text-text-primary">
              {done.length}<Text className="text-sm text-text-secondary font-jost"> / {assigned.length}</Text>
            </Text>
            <Text className="text-[11px] text-text-secondary font-jost uppercase tracking-wider mt-0.5">
              {lang === 'RU' ? 'убрано' : 'cleaned'}
            </Text>
          </View>
          <View className="flex-1 items-center">
            <Text className="text-lg font-jost-semibold text-text-primary">{avgMinutes !== null ? avgMinutes : '—'}</Text>
            <Text className="text-[11px] text-text-secondary font-jost uppercase tracking-wider mt-0.5">
              {lang === 'RU' ? 'мин / номер' : 'min / room'}
            </Text>
          </View>
        </View>

        <View className="gap-2">
          <Text className="text-[12px] text-text-secondary font-jost tracking-widest uppercase px-1">
            {lang === 'RU' ? 'ТЕКУЩИЕ ЗАДАЧИ' : 'CURRENT TASKS'}
          </Text>
          {current.length === 0 ? (
            <View className="bg-white rounded-[14px] border border-border p-6 items-center">
              <Text className="text-sm font-jost text-text-secondary">{lang === 'RU' ? 'Нет активных задач' : 'No active tasks'}</Text>
            </View>
          ) : (
            <View className="bg-white rounded-[14px] border border-border overflow-hidden">
              {current.map((room, i) => (
                <View key={room.id} className={`p-3.5 flex-row items-center justify-between ${i > 0 ? 'border-t border-border-light' : ''}`}>
                  <Text className="text-sm font-jost-semibold text-text-primary">№ {room.roomNumber}</Text>
                  <Text className="text-[12px] font-jost text-text-secondary">{room.category}</Text>
                </View>
              ))}
            </View>
          )}
        </View>
      </ScrollView>

      <View className="p-5 border-t border-border-light bg-background flex-row gap-2.5" style={{ paddingBottom: insets.bottom + 20 }}>
        <Pressable onPress={onMessage} className="flex-1 flex-row items-center justify-center gap-2 py-3.5 rounded-xl border border-border bg-white">
          <MessageSquare size={15} color="#241E1A" />
          <Text className="text-sm font-jost-semibold text-text-primary">{lang === 'RU' ? 'Написать' : 'Message'}</Text>
        </Pressable>
        <Pressable
          onPress={() =>
            Alert.alert(
              lang === 'RU' ? 'Недоступно' : 'Not available',
              lang === 'RU' ? 'Передача задач другому клинеру пока недоступна в демо-режиме.' : 'Reassigning tasks is not wired up yet in demo mode.'
            )
          }
          className="flex-1 flex-row items-center justify-center gap-2 py-3.5 rounded-xl bg-primary active:bg-primary-hover"
        >
          <Share2 size={15} color="#fff" />
          <Text className="text-sm font-jost-semibold text-white">{lang === 'RU' ? 'Передать задачи' : 'Reassign tasks'}</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}
