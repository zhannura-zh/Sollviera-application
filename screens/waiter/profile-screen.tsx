import React, { useState } from 'react';
import { View, Text, Pressable, ScrollView, Modal, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MessageSquare, Bell, Settings, Coffee, Calendar, Users, X, ChevronRight, LogOut } from 'lucide-react-native';
import { useApp } from '@/context/app-store';
import { BANQUET_BOOKINGS, SHIFT_SCHEDULE } from './waiter-mock-data';

function getInitials(name: string) {
  return name.split(' ').filter(Boolean).map((n) => n[0]).slice(0, 2).join('').toUpperCase() || '?';
}

interface WaiterProfileScreenProps {
  onOpenChats: () => void;
  onOpenNotifications: () => void;
  onOpenSettings: () => void;
  onLoggedOut: () => void;
}

// Shift-report / schedule / banquets are shown as quick-look modals here rather than
// pushed screens — matches the actual mobile.sollviera.com waiter profile, and (like the
// mock data in waiter-mock-data.ts) none of it is backed by a real endpoint.
export function WaiterProfileScreen({ onOpenChats, onOpenNotifications, onOpenSettings, onLoggedOut }: WaiterProfileScreenProps) {
  const { lang, cleanerProfile, notifications, chatContacts, updateCleanerProfile, logout } = useApp();
  const [showReport, setShowReport] = useState(false);
  const [showSchedule, setShowSchedule] = useState(false);
  const [showBanquets, setShowBanquets] = useState(false);

  const shiftStatus = cleanerProfile.currentShift.status;
  const unreadCount = notifications.filter((n) => !n.isRead).length;
  const totalUnreadChats = chatContacts.reduce((acc, c) => acc + c.unreadCount, 0);

  const handleSetShiftStatus = (status: 'ON_SHIFT' | 'ON_BREAK' | 'SHIFT_ENDED') => {
    if (status === 'SHIFT_ENDED') {
      Alert.alert(
        lang === 'RU' ? 'Завершить смену?' : 'Finish shift?',
        lang === 'RU' ? 'Вы будете выведены из аккаунта.' : 'You will be signed out.',
        [
          { text: lang === 'RU' ? 'Отмена' : 'Cancel', style: 'cancel' },
          { text: lang === 'RU' ? 'Завершить' : 'Finish', style: 'destructive', onPress: () => { logout(); onLoggedOut(); } },
        ]
      );
      return;
    }
    updateCleanerProfile({ ...cleanerProfile, currentShift: { ...cleanerProfile.currentShift, status } });
  };

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
              {lang === 'RU' ? 'Официант' : 'Waiter'} · {lang === 'RU' ? 'основной ресторан, зал А' : 'main restaurant, hall A'}
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
                {cleanerProfile.currentShift.date} · {lang === 'RU' ? 'с' : 'from'} {cleanerProfile.currentShift.startTime}
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
                <Text className="text-lg font-jost-semibold text-text-primary">12</Text>
                <Text className="text-[12px] text-text-secondary font-jost uppercase tracking-wider mt-0.5">{lang === 'RU' ? 'заказов' : 'orders'}</Text>
              </View>
              <View className="flex-1 items-center">
                <Text className="text-lg font-jost-semibold text-text-primary">14<Text className="text-sm text-text-secondary"> {lang === 'RU' ? 'мин' : 'min'}</Text></Text>
                <Text className="text-[12px] text-text-secondary font-jost uppercase tracking-wider mt-0.5">{lang === 'RU' ? 'подача' : 'serving'}</Text>
              </View>
              <View className="flex-1 items-center">
                <Text className="text-lg font-jost-semibold text-text-primary">6</Text>
                <Text className="text-[12px] text-text-secondary font-jost uppercase tracking-wider mt-0.5">{lang === 'RU' ? 'столов' : 'tables'}</Text>
              </View>
            </View>
          </View>
        </View>

        <View className="gap-2">
          <Text className="text-[12px] text-text-secondary font-jost tracking-widest uppercase px-1">
            {lang === 'RU' ? 'РАБОТА' : 'WORK'}
          </Text>
          <View className="bg-white rounded-[14px] border border-border overflow-hidden">
            <Pressable onPress={() => setShowReport(true)} className="flex-row items-center justify-between p-3.5 active:bg-background border-b border-border-light">
              <View className="flex-row items-center gap-2.5">
                <Coffee size={16} color="#8A8177" />
                <Text className="text-sm font-jost text-text-primary">{lang === 'RU' ? 'Отчёт по смене' : 'Shift report'}</Text>
              </View>
              <ChevronRight size={16} color="#8A8177" />
            </Pressable>
            <Pressable onPress={() => setShowSchedule(true)} className="flex-row items-center justify-between p-3.5 active:bg-background border-b border-border-light">
              <View className="flex-row items-center gap-2.5">
                <Calendar size={16} color="#8A8177" />
                <Text className="text-sm font-jost text-text-primary">{lang === 'RU' ? 'График смен' : 'Shift schedule'}</Text>
              </View>
              <ChevronRight size={16} color="#8A8177" />
            </Pressable>
            <Pressable onPress={() => setShowBanquets(true)} className="flex-row items-center justify-between p-3.5 active:bg-background">
              <View className="flex-row items-center gap-2.5">
                <Users size={16} color="#8A8177" />
                <Text className="text-sm font-jost text-text-primary">{lang === 'RU' ? 'Банкеты и брони зала' : 'Banquets and hall bookings'}</Text>
              </View>
              <ChevronRight size={16} color="#8A8177" />
            </Pressable>
          </View>
        </View>

        <Pressable
          onPress={() =>
            Alert.alert(
              lang === 'RU' ? 'Выйти из аккаунта?' : 'Log out?',
              undefined,
              [
                { text: lang === 'RU' ? 'Отмена' : 'Cancel', style: 'cancel' },
                { text: lang === 'RU' ? 'Выйти' : 'Log out', style: 'destructive', onPress: () => { logout(); onLoggedOut(); } },
              ]
            )
          }
          className="bg-white rounded-[14px] border border-border p-4 flex-row items-center gap-3 active:bg-background"
        >
          <LogOut size={16} color="#8A8177" />
          <Text className="text-sm font-jost text-text-secondary">{lang === 'RU' ? 'Выйти из аккаунта' : 'Log out'}</Text>
        </Pressable>

        <Text className="text-[12px] text-text-secondary font-jost tracking-wide text-center">
          {lang === 'RU' ? 'Sollviera PMS v2.4 · Rixos Borovoe' : 'Sollviera PMS v2.4 · Rixos Borovoe'}
        </Text>
      </ScrollView>

      <Modal visible={showReport} transparent animationType="fade" onRequestClose={() => setShowReport(false)}>
        <View className="flex-1 items-center justify-center bg-dark/60 p-3.5">
          <View className="bg-white rounded-[20px] border border-border w-full max-w-sm p-5 gap-4">
            <View className="flex-row items-center justify-between">
              <Text className="text-base font-jost-semibold text-text-primary">{lang === 'RU' ? 'Отчёт по смене' : 'Shift report'}</Text>
              <Pressable onPress={() => setShowReport(false)} className="h-8 w-8 rounded-full bg-background items-center justify-center border border-border-light active:bg-border-light">
                <X size={16} color="#241E1A" />
              </Pressable>
            </View>
            <View className="gap-0">
              {[
                [lang === 'RU' ? 'Смена' : 'Shift', `${cleanerProfile.currentShift.shiftNumber} (${lang === 'RU' ? 'Зал А' : 'Hall A'})`],
                [lang === 'RU' ? 'Обслужено гостей' : 'Guests served', lang === 'RU' ? '96 гостей (12 заказов)' : '96 guests (12 orders)'],
                [lang === 'RU' ? 'Среднее время подачи' : 'Average serving time', lang === 'RU' ? '14 мин' : '14 min'],
                [lang === 'RU' ? 'Сумма чеков за смену' : 'Total sales this shift', '128 400 ₸'],
              ].map(([label, value], i) => (
                <View key={label} className={`py-2.5 flex-row items-center justify-between ${i > 0 ? 'border-t border-border-light' : ''}`}>
                  <Text className="text-sm font-jost text-text-secondary">{label}</Text>
                  <Text className={`text-sm font-jost-semibold ${label.includes('чеков') || label.includes('sales') ? 'text-success-text' : 'text-text-primary'}`}>{value}</Text>
                </View>
              ))}
            </View>
          </View>
        </View>
      </Modal>

      <Modal visible={showSchedule} transparent animationType="fade" onRequestClose={() => setShowSchedule(false)}>
        <View className="flex-1 items-center justify-center bg-dark/60 p-3.5">
          <View className="bg-white rounded-[20px] border border-border w-full max-w-sm p-5 gap-4">
            <View className="flex-row items-center justify-between">
              <Text className="text-base font-jost-semibold text-text-primary">{lang === 'RU' ? 'График смен' : 'Shift schedule'}</Text>
              <Pressable onPress={() => setShowSchedule(false)} className="h-8 w-8 rounded-full bg-background items-center justify-center border border-border-light active:bg-border-light">
                <X size={16} color="#241E1A" />
              </Pressable>
            </View>
            <View className="bg-white rounded-[14px] border border-border overflow-hidden">
              {SHIFT_SCHEDULE.map((day, i) => (
                <View key={day.date} className={`p-3.5 flex-row items-center justify-between ${i > 0 ? 'border-t border-border-light' : ''}`}>
                  <Text className={`text-sm font-jost ${day.isToday ? 'text-success-text font-jost-semibold' : 'text-text-primary'}`}>
                    {day.date}{day.isToday ? (lang === 'RU' ? ' (Сегодня)' : ' (Today)') : day.isTomorrow ? (lang === 'RU' ? ' (Завтра)' : ' (Tomorrow)') : ''}
                  </Text>
                  <Text className="text-sm font-jost text-text-secondary">
                    {day.dayOff ? (lang === 'RU' ? 'Выходной' : 'Day off') : `${day.timeRange} (${day.hall})`}
                  </Text>
                </View>
              ))}
            </View>
          </View>
        </View>
      </Modal>

      <Modal visible={showBanquets} transparent animationType="fade" onRequestClose={() => setShowBanquets(false)}>
        <View className="flex-1 items-center justify-center bg-dark/60 p-3.5">
          <View className="bg-white rounded-[20px] border border-border w-full max-w-sm p-5 gap-4">
            <View className="flex-row items-center justify-between">
              <Text className="text-base font-jost-semibold text-text-primary">{lang === 'RU' ? 'Банкеты и брони зала' : 'Banquets and hall bookings'}</Text>
              <Pressable onPress={() => setShowBanquets(false)} className="h-8 w-8 rounded-full bg-background items-center justify-center border border-border-light active:bg-border-light">
                <X size={16} color="#241E1A" />
              </Pressable>
            </View>
            <View className="gap-2.5">
              {BANQUET_BOOKINGS.map((b) => (
                <View key={b.id} className="bg-background border border-border-light rounded-xl p-3.5 gap-1.5">
                  <Text className="text-sm font-jost-semibold text-text-primary">
                    {lang === 'RU' ? `Банкет в ${b.time} · ${b.guests} человек` : `Banquet at ${b.time} · ${b.guests} guests`}
                  </Text>
                  <Text className="text-[13px] font-jost text-text-secondary">
                    {b.hall} · {lang === 'RU' ? b.noteRu : b.noteEn}
                  </Text>
                  <View className="flex-row items-center justify-between pt-1">
                    <Text className="text-[12px] font-jost text-text-secondary">{lang === 'RU' ? 'Ответственный' : 'Responsible'}: {b.responsible}</Text>
                    <Text className={`text-[12px] font-jost-semibold ${b.confirmed ? 'text-success-text' : 'text-text-secondary'}`}>
                      {b.confirmed ? (lang === 'RU' ? 'Подтверждено' : 'Confirmed') : (lang === 'RU' ? 'Ожидает' : 'Pending')}
                    </Text>
                  </View>
                </View>
              ))}
              {BANQUET_BOOKINGS.length === 0 && (
                <Text className="text-sm font-jost text-text-secondary text-center py-4">
                  {lang === 'RU' ? 'Сегодня банкетов нет' : 'No banquets today'}
                </Text>
              )}
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
