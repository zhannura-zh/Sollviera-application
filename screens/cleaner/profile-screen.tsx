import React, { useState } from 'react';
import { View, Text, Pressable, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MessageSquare, Bell, Settings, BarChart3, Clock, ChevronRight } from 'lucide-react-native';
import { useApp } from '@/context/app-store';
import { mockShiftHistory } from '@/data/mockData';
import { getTranslation } from '@/lib/locales';

interface ProfileScreenProps {
  onOpenChats: () => void;
  onOpenNotifications: () => void;
  onOpenSettings: () => void;
  onOpenReports: () => void;
}

export function ProfileScreen({ onOpenChats, onOpenNotifications, onOpenSettings, onOpenReports }: ProfileScreenProps) {
  const { lang, cleanerProfile, notifications, chatContacts } = useApp();
  const t = getTranslation(lang);
  const [isHistoryExpanded, setIsHistoryExpanded] = useState(false);
  const [shiftStatus, setShiftStatus] = useState<'ON_SHIFT' | 'ON_BREAK' | 'SHIFT_ENDED'>('ON_SHIFT');
  const [roomsCleaned] = useState(cleanerProfile.currentShift.roomsCompleted);
  const [elapsedSeconds] = useState(20669);

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
            <Text className="text-text-primary font-jost text-base">{lang === 'RU' ? 'ЕВ' : 'EB'}</Text>
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
              <Text className="text-base font-jost-semibold text-text-primary">{cleanerProfile.currentShift.shiftNumber}</Text>
              <Text className="text-sm font-jost text-text-secondary">
                {cleanerProfile.currentShift.date} · {lang === 'RU' ? 'с 08:00' : 'from 08:00'}
              </Text>
            </View>

            <View className="flex-row gap-2">
              {(['ON_SHIFT', 'ON_BREAK', 'SHIFT_ENDED'] as const).map((status) => (
                <Pressable
                  key={status}
                  onPress={() => setShiftStatus(status)}
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
                {mockShiftHistory.map((item) => (
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
