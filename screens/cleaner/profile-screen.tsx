import React, { useState, useEffect } from 'react';
import { View, Text, Pressable, ScrollView, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MessageSquare, Bell, Settings, BarChart3, Clock, ChevronRight } from 'lucide-react-native';
import { useApp } from '@/context/app-store';
import { getTranslation } from '@/lib/locales';

// currentShift.startTime is an "HH:MM" clock reading (real session-start time, see
// login() in app-store.tsx), no date — assumes it was set today.
function elapsedSecondsSince(startTime?: string): number {
  const match = startTime ? /^(\d{1,2}):(\d{2})/.exec(startTime) : null;
  if (!match) return 0;
  const start = new Date();
  start.setHours(Number(match[1]), Number(match[2]), 0, 0);
  let diffSeconds = Math.floor((Date.now() - start.getTime()) / 1000);
  if (diffSeconds < 0) diffSeconds += 24 * 60 * 60;
  return Math.max(0, diffSeconds);
}

function getInitials(name: string) {
  return name.split(' ').filter(Boolean).map((n) => n[0]).slice(0, 2).join('').toUpperCase() || '?';
}

interface ProfileScreenProps {
  onOpenChats: () => void;
  onOpenNotifications: () => void;
  onOpenSettings: () => void;
  onOpenReports: () => void;
  onLoggedOut: () => void;
}

export function ProfileScreen({ onOpenChats, onOpenNotifications, onOpenSettings, onOpenReports, onLoggedOut }: ProfileScreenProps) {
  const { lang, cleanerProfile, notifications, chatContacts, shiftHistory, updateCleanerProfile, logout } = useApp();
  const t = getTranslation(lang);
  const [isHistoryExpanded, setIsHistoryExpanded] = useState(false);
  const [elapsedSeconds, setElapsedSeconds] = useState(() => elapsedSecondsSince(cleanerProfile.currentShift.startTime));

  useEffect(() => {
    setElapsedSeconds(elapsedSecondsSince(cleanerProfile.currentShift.startTime));
    const interval = setInterval(() => {
      setElapsedSeconds(elapsedSecondsSince(cleanerProfile.currentShift.startTime));
    }, 30000);
    return () => clearInterval(interval);
  }, [cleanerProfile.currentShift.startTime]);

  const shiftStatus = cleanerProfile.currentShift.status;
  const roomsCleaned = cleanerProfile.currentShift.roomsCompleted;

  // "On shift"/"Break" are local-only — the API has no break concept for housekeepers
  // (only isActive true/false). "Finish" is the one status with a real backend action:
  // ending your shift here means signing out.
  const handleSetShiftStatus = (status: 'ON_SHIFT' | 'ON_BREAK' | 'SHIFT_ENDED') => {
    if (status === 'SHIFT_ENDED') {
      Alert.alert(
        lang === 'RU' ? 'Завершить смену?' : 'Finish shift?',
        lang === 'RU' ? 'Вы будете выведены из аккаунта.' : 'You will be signed out.',
        [
          { text: lang === 'RU' ? 'Отмена' : 'Cancel', style: 'cancel' },
          {
            text: lang === 'RU' ? 'Завершить' : 'Finish',
            style: 'destructive',
            onPress: () => {
              logout();
              onLoggedOut();
            },
          },
        ]
      );
      return;
    }
    updateCleanerProfile({ ...cleanerProfile, currentShift: { ...cleanerProfile.currentShift, status } });
  };

  const unreadCount = notifications.filter((n) => !n.isRead).length;
  const totalUnreadChats = chatContacts.reduce((acc, c) => acc + c.unreadCount, 0);

  return (
    <SafeAreaView edges={['top']} className="flex-1 bg-background">
      <View className="px-5 pt-4 pb-1.5 flex-row items-center justify-between">
        <Text className="text-2xl font-spectral text-text-primary">{lang === 'RU' ? 'Профиль' : 'Profile'}</Text>
        <View className="flex-row items-center gap-1.5">
          <Pressable onPress={onOpenChats} className="h-10 w-10 bg-white border border-border rounded-xl items-center justify-center relative active:bg-background">
            <MessageSquare size={16} color="#241E1A" />
            {totalUnreadChats > 0 && (
              <View className="absolute -top-1 -right-1 h-4 w-4 bg-primary rounded-full items-center justify-center">
                <Text className="text-white text-[11px] font-jost-semibold">{totalUnreadChats}</Text>
              </View>
            )}
          </Pressable>
          <Pressable onPress={onOpenNotifications} className="h-10 w-10 bg-white border border-border rounded-xl items-center justify-center relative active:bg-background">
            <Bell size={16} color="#241E1A" />
            {unreadCount > 0 && (
              <View className="absolute -top-1 -right-1 h-4 w-4 bg-primary rounded-full items-center justify-center">
                <Text className="text-white text-[11px] font-jost-semibold">{unreadCount}</Text>
              </View>
            )}
          </Pressable>
          <Pressable onPress={onOpenSettings} className="h-10 w-10 bg-white border border-border rounded-xl items-center justify-center active:bg-background">
            <Settings size={16} color="#241E1A" />
          </Pressable>
        </View>
      </View>

      <ScrollView className="flex-1 px-5" contentContainerStyle={{ paddingBottom: 32, gap: 16 }}>
        <View className="flex-row items-center gap-3.5 pt-2">
          <View className="h-14 w-14 rounded-full bg-primary-light items-center justify-center border border-border">
            <Text className="text-text-primary font-jost text-base">
              {getInitials(lang === 'RU' ? cleanerProfile.fullNameRu : cleanerProfile.fullName)}
            </Text>
          </View>
          <View className="flex-1">
            <Text className="text-xl font-jost text-text-primary leading-tight" numberOfLines={1}>
              {lang === 'RU' ? cleanerProfile.fullNameRu : cleanerProfile.fullName}
            </Text>
            <Text className="text-sm font-jost text-text-secondary mt-0.5" numberOfLines={1}>
              {cleanerProfile.role === 'SENIOR_CLEANER'
                ? (lang === 'RU' ? 'Старший клинер' : 'Senior housekeeper')
                : (lang === 'RU' ? 'Клинер' : 'Housekeeper')}{' · '}
              {cleanerProfile.floorAssigned.includes('Floor 3')
                ? (lang === 'RU' ? '3 этаж' : 'Floor 3')
                : cleanerProfile.floorAssigned.includes('Floor 2')
                ? (lang === 'RU' ? '2 этаж' : 'Floor 2')
                : cleanerProfile.floorAssigned.replace(/\s*\(Rooms\s*\d+-\d+\)/gi, '')}
            </Text>
          </View>
        </View>

        <View className="gap-2">
          <Text className="text-[12px] text-text-secondary font-jost tracking-widest uppercase px-1">
            {lang === 'RU' ? 'ТЕКУЩАЯ СМЕНА' : 'CURRENT SHIFT'}
          </Text>
          <View className="bg-white rounded-[14px] border border-border p-4 gap-4">
            <View className="flex-row items-center justify-between">
              <Text className="text-base font-jost-semibold text-text-primary">{cleanerProfile.currentShift.date}</Text>
              <Text className="text-sm font-jost text-text-secondary">
                {lang === 'RU' ? 'с' : 'from'} {cleanerProfile.currentShift.startTime}
              </Text>
            </View>

            <View className="flex-row gap-2">
              {(['ON_SHIFT', 'ON_BREAK', 'SHIFT_ENDED'] as const).map((status) => (
                <Pressable
                  key={status}
                  onPress={() => handleSetShiftStatus(status)}
                  className={`flex-1 py-2 rounded-xl border items-center ${
                    shiftStatus === status ? 'bg-dark border-dark' : 'bg-white border-border'
                  }`}
                >
                  <Text className={`text-[13px] font-jost ${shiftStatus === status ? 'text-white' : 'text-text-secondary'}`}>
                    {status === 'ON_SHIFT'
                      ? (lang === 'RU' ? 'На смене' : 'On shift')
                      : status === 'ON_BREAK'
                      ? (lang === 'RU' ? 'Перерыв' : 'Break')
                      : (lang === 'RU' ? 'Завершить' : 'Finish')}
                  </Text>
                </Pressable>
              ))}
            </View>

            <View className="border-t border-border-light" />

            <View className="flex-row">
              <View className="flex-1 items-center">
                <Text className="text-lg font-jost-semibold text-text-primary">
                  {roomsCleaned}
                  <Text className="text-sm text-text-secondary font-jost"> / {cleanerProfile.currentShift.roomsTotal}</Text>
                </Text>
                <Text className="text-[12px] text-text-secondary font-jost uppercase tracking-wider mt-0.5">
                  {lang === 'RU' ? 'убрано' : 'cleaned'}
                </Text>
              </View>
              <View className="flex-1 items-center">
                <Text className="text-lg font-jost-semibold text-text-primary">
                  {cleanerProfile.currentShift.avgTimePerRoom.split(' ')[0]}
                  <Text className="text-sm text-text-secondary font-jost"> {lang === 'RU' ? 'мин' : 'min'}</Text>
                </Text>
                <Text className="text-[12px] text-text-secondary font-jost uppercase tracking-wider mt-0.5">
                  {lang === 'RU' ? 'на номер' : 'per room'}
                </Text>
              </View>
              <View className="flex-1 items-center">
                <Text className="text-lg font-jost-semibold text-text-primary">
                  {Math.floor(elapsedSeconds / 3600)}:{String(Math.floor((elapsedSeconds % 3600) / 60)).padStart(2, '0')}
                </Text>
                <Text className="text-[12px] text-text-secondary font-jost uppercase tracking-wider mt-0.5">
                  {lang === 'RU' ? 'на смене' : 'on shift'}
                </Text>
              </View>
            </View>
          </View>
        </View>

        <View className="gap-2">
          <Text className="text-[12px] text-text-secondary font-jost tracking-widest uppercase px-1">
            {lang === 'RU' ? 'РАБОТА' : 'WORK'}
          </Text>
          <View className="bg-white rounded-[14px] border border-border overflow-hidden">
            <Pressable onPress={onOpenReports} className="flex-row items-center justify-between p-3.5 active:bg-background border-b border-border-light">
              <View className="flex-row items-center gap-2.5">
                <BarChart3 size={16} color="#8A8177" />
                <Text className="text-sm font-jost text-text-primary">{lang === 'RU' ? 'Мои отчёты' : 'My Reports'}</Text>
              </View>
              <ChevronRight size={16} color="#8A8177" />
            </Pressable>

            <Pressable onPress={() => setIsHistoryExpanded(!isHistoryExpanded)} className="flex-row items-center justify-between p-3.5 active:bg-background">
              <View className="flex-row items-center gap-2.5">
                <Clock size={16} color="#8A8177" />
                <Text className="text-sm font-jost text-text-primary">{lang === 'RU' ? 'История смен' : 'Shift History'}</Text>
              </View>
              <ChevronRight size={16} color="#8A8177" style={{ transform: [{ rotate: isHistoryExpanded ? '90deg' : '0deg' }] }} />
            </Pressable>

            {isHistoryExpanded && (
              <View className="p-3.5 bg-background-subtle border-t border-border-light gap-2">
                {shiftHistory.map((item) => (
                  <View key={item.id} className="flex-row items-center justify-between py-1">
                    <View>
                      <Text className="font-jost text-text-primary text-sm">
                        {lang === 'RU' ? 'Смена' : 'Shift'} {item.shiftNumber} · <Text className="text-text-secondary">{item.date}</Text>
                      </Text>
                      <Text className="text-[12px] text-text-secondary font-jost">
                        {item.roomsCleaned} {t.historyRooms} · {item.hoursWorked} {lang === 'RU' ? 'ч.' : 'hrs'}
                      </Text>
                    </View>
                    <Text className="text-sm font-jost-semibold text-emerald-600">{item.qualityScore}%</Text>
                  </View>
                ))}
              </View>
            )}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
