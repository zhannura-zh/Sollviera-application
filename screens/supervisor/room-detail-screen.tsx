import React, { useState, useEffect } from 'react';
import { View, Text, Pressable, ScrollView, Alert } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { ChevronLeft, MessageSquare, Share2 } from 'lucide-react-native';
import { HotelRoom } from '@/types';
import { getTranslation } from '@/lib/locales';
import { useApp } from '@/context/app-store';

interface RoomDetailScreenProps {
  room: HotelRoom | null;
  onBack: () => void;
  onMessage: () => void;
}

function statusLabel(status: HotelRoom['status'], lang: 'RU' | 'EN') {
  switch (status) {
    case 'PENDING': return lang === 'RU' ? 'ожидает' : 'pending';
    case 'IN_PROGRESS': return lang === 'RU' ? 'в работе' : 'in progress';
    case 'READY': return lang === 'RU' ? 'на проверке' : 'awaiting review';
    case 'PROBLEM': return lang === 'RU' ? 'проблема' : 'problem';
    case 'VERIFIED': return lang === 'RU' ? 'проверено' : 'verified';
  }
}

function initials(name: string) {
  return name.split(' ').filter(Boolean).map((n) => n[0]).slice(0, 2).join('').toUpperCase() || '?';
}

// No backend field carries a per-room cleaning-time norm — these are the same
// reasonable per-cleaning-type defaults the room's own checklist/report screens imply.
const NORM_MINUTES: Record<HotelRoom['cleaningType'], number> = {
  CHECKOUT: 45,
  STAYOVER: 25,
  DEEP_CLEAN: 60,
  AFTER_MAINTENANCE: 30,
};

// room.startTime is an "HH:MM" clock reading with no date (see updateRoomStatus in
// app-store.tsx), so this assumes the room's work started today.
function elapsedSecondsSince(startTime?: string): number {
  const match = startTime ? /^(\d{1,2}):(\d{2})/.exec(startTime) : null;
  if (!match) return 0;
  const start = new Date();
  start.setHours(Number(match[1]), Number(match[2]), 0, 0);
  let diffSeconds = Math.floor((Date.now() - start.getTime()) / 1000);
  if (diffSeconds < 0) diffSeconds += 24 * 60 * 60;
  return Math.max(0, diffSeconds);
}

function formatTimer(totalSeconds: number) {
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;
  return h > 0
    ? `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
    : `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

function useElapsedTimer(startTime: string | undefined, active: boolean) {
  const [seconds, setSeconds] = useState(() => elapsedSecondsSince(startTime));
  useEffect(() => {
    setSeconds(elapsedSecondsSince(startTime));
    if (!active) return;
    const interval = setInterval(() => setSeconds(elapsedSecondsSince(startTime)), 1000);
    return () => clearInterval(interval);
  }, [startTime, active]);
  return seconds;
}

export function RoomDetailScreen({ room, onBack, onMessage }: RoomDetailScreenProps) {
  const { lang } = useApp();
  const t = getTranslation(lang);
  const insets = useSafeAreaInsets();
  const elapsedSeconds = useElapsedTimer(room?.startTime, room?.status === 'IN_PROGRESS');

  if (!room) {
    return (
      <SafeAreaView edges={['top']} className="flex-1 bg-background items-center justify-center">
        <Text className="text-sm font-jost text-text-secondary">{lang === 'RU' ? 'Номер не найден' : 'Room not found'}</Text>
      </SafeAreaView>
    );
  }

  const cleaningTypeLabel = (() => {
    switch (room.cleaningType) {
      case 'CHECKOUT': return t.typeCheckout;
      case 'STAYOVER': return t.typeStayover;
      case 'DEEP_CLEAN': return t.typeDeepClean;
      case 'AFTER_MAINTENANCE': return t.typeAfterMaintenance;
    }
  })();

  const guestNote = lang === 'RU' ? room.notesRu : room.notesEn;
  const doneCount = room.checklist.filter((c) => c.done).length;

  return (
    <SafeAreaView edges={['top']} className="flex-1 bg-dark">
      <View className="bg-dark px-5 pt-2 pb-5 gap-3">
        <View className="flex-row items-center justify-between">
          <Pressable onPress={onBack} className="flex-row items-center gap-1.5">
            <ChevronLeft size={16} color="#8A8177" />
            <Text className="text-xs font-jost text-text-secondary">{lang === 'RU' ? 'Номера' : 'Rooms'}</Text>
          </Pressable>
          {room.priority === 'VIP' && (
            <View className="bg-amber-950/40 border border-amber-200/30 rounded-md px-2.5 py-0.5">
              <Text className="text-[10px] font-jost-semibold text-amber-200 uppercase tracking-wider">VIP</Text>
            </View>
          )}
          {room.priority === 'URGENT' && (
            <View className="bg-[#FAF0EF]/20 border border-rose-200/30 rounded-md px-2.5 py-0.5">
              <Text className="text-[10px] font-jost-semibold text-rose-200 uppercase tracking-wider">
                {lang === 'RU' ? 'СРОЧНО' : 'URGENT'}
              </Text>
            </View>
          )}
        </View>
        <View className="flex-row items-end justify-between">
          <Text className="text-3xl font-jost-semibold text-white">№ {room.roomNumber}</Text>
          <View className="items-end">
            {!!room.startTime && (
              <Text className="text-3xl font-jost-semibold text-[#E4762B] tracking-tight">{formatTimer(elapsedSeconds)}</Text>
            )}
            <Text className="text-xs font-jost text-text-secondary mt-0.5">{statusLabel(room.status, lang)}</Text>
          </View>
        </View>
      </View>

      <ScrollView className="flex-1 bg-background px-5" contentContainerStyle={{ paddingTop: 16, paddingBottom: 20, gap: 16 }}>
        <View className="bg-white rounded-[14px] border border-border overflow-hidden">
          <View className="p-3.5 flex-row items-center justify-between">
            <Text className="text-sm font-jost text-text-secondary">{lang === 'RU' ? 'Исполнитель' : 'Assigned to'}</Text>
            {room.assignedTo ? (
              <View className="flex-row items-center gap-2">
                <Text className="text-sm font-jost-semibold text-text-primary">{room.assignedTo}</Text>
                <View className="h-6 w-6 rounded-full bg-primary-light items-center justify-center border border-border">
                  <Text className="text-[10px] font-jost-semibold text-text-primary">{initials(room.assignedTo)}</Text>
                </View>
              </View>
            ) : (
              <Text className="text-sm font-jost text-text-secondary">—</Text>
            )}
          </View>
          <View className="p-3.5 flex-row items-center justify-between border-t border-border-light">
            <Text className="text-sm font-jost text-text-secondary">{lang === 'RU' ? 'Начата' : 'Started'}</Text>
            <Text className="text-sm font-jost-semibold text-text-primary">{room.startTime || '—'}</Text>
          </View>
          <View className="p-3.5 flex-row items-center justify-between border-t border-border-light">
            <Text className="text-sm font-jost text-text-secondary">{lang === 'RU' ? 'Норматив' : 'Time norm'}</Text>
            <Text className="text-sm font-jost-semibold text-text-primary">{NORM_MINUTES[room.cleaningType]} {lang === 'RU' ? 'мин' : 'min'}</Text>
          </View>
          <View className="p-3.5 flex-row items-center justify-between border-t border-border-light">
            <Text className="text-sm font-jost text-text-secondary">{lang === 'RU' ? 'Тип уборки' : 'Cleaning type'}</Text>
            <Text className="text-sm font-jost-semibold text-text-primary">{cleaningTypeLabel}</Text>
          </View>
        </View>

        <View className="gap-2">
          <View className="flex-row items-center justify-between px-1">
            <Text className="text-[12px] text-text-secondary font-jost tracking-widest uppercase">
              {lang === 'RU' ? 'ВЫПОЛНЕНИЕ' : 'PROGRESS'}
            </Text>
            <Text className="text-xs font-jost text-text-secondary">
              {lang === 'RU' ? 'Задачи чек-листа' : 'Checklist tasks'} {doneCount} / {room.checklist.length}
            </Text>
          </View>
          <View className="bg-white rounded-[14px] border border-border p-3.5">
            <View className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
              <View
                className="h-full bg-success rounded-full"
                style={{ width: `${room.checklist.length ? (doneCount / room.checklist.length) * 100 : 0}%` }}
              />
            </View>
          </View>
        </View>

        {!!guestNote && (
          <View className="gap-2">
            <Text className="text-[12px] text-text-secondary font-jost tracking-widest uppercase px-1">
              {lang === 'RU' ? 'ПОЖЕЛАНИЯ ГОСТЯ' : 'GUEST NOTES'}
            </Text>
            <View className="bg-[#FAF6EE] border border-[#EFE5D8] rounded-[14px] p-3.5">
              <Text className="text-sm font-jost text-text-primary leading-normal">{guestNote}</Text>
            </View>
          </View>
        )}
      </ScrollView>

      <View
        className="p-5 border-t border-border bg-background flex-row gap-2.5"
        style={{ paddingBottom: insets.bottom + 20 }}
      >
        <Pressable onPress={onMessage} className="flex-1 flex-row items-center justify-center gap-2 py-3.5 rounded-xl border border-border bg-white">
          <MessageSquare size={15} color="#241E1A" />
          <Text className="text-sm font-jost-semibold text-text-primary">{lang === 'RU' ? 'Написать клинеру' : 'Message cleaner'}</Text>
        </Pressable>
        <Pressable
          onPress={() =>
            Alert.alert(
              lang === 'RU' ? 'Недоступно' : 'Not available',
              lang === 'RU' ? 'Передача задачи другому клинеру пока недоступна в демо-режиме.' : 'Reassigning tasks is not wired up yet in demo mode.'
            )
          }
          className="flex-1 flex-row items-center justify-center gap-2 py-3.5 rounded-xl bg-primary active:bg-primary-hover"
        >
          <Share2 size={15} color="#fff" />
          <Text className="text-sm font-jost-semibold text-white">{lang === 'RU' ? 'Передать задачу' : 'Reassign task'}</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}
