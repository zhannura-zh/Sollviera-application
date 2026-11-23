import React from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Bell, MessageSquare, Settings } from 'lucide-react-native';
import { useApp } from '@/context/app-store';
import { useChat } from '@/context/chat-store';
import { ManagerAvatar } from '@/components/manager/manager-avatar';

// Hotel manager profile (design ManagerScreens → profile). Chats, notifications and settings
// (personal data, password, support, log out) are the app's shared /profile/* screens.

const MONTHS_SHORT = ['янв.', 'февр.', 'мар.', 'апр.', 'мая', 'июн.', 'июл.', 'авг.', 'сент.', 'окт.', 'нояб.', 'дек.'];
const MONTHS_SHORT_EN = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

function HeaderButton({ onPress, badge, children }: { onPress: () => void; badge?: number; children: React.ReactNode }) {
  return (
    <Pressable onPress={onPress} className="h-10 w-10 bg-white border border-border rounded-xl items-center justify-center active:bg-background">
      {children}
      {!!badge && badge > 0 && (
        <View className="absolute -top-1 -right-1 h-4 min-w-4 px-0.5 bg-primary rounded-full items-center justify-center">
          <Text className="text-white text-[9px] font-jost-medium">{badge}</Text>
        </View>
      )}
    </Pressable>
  );
}

export function ManagerProfileScreen() {
  const router = useRouter();
  const { lang, cleanerProfile, notifications } = useApp();
  const { totalUnread } = useChat();
  const ru = lang === 'RU';
  const t = (r: string, e: string) => (ru ? r : e);

  const name = (ru ? cleanerProfile.fullNameRu : cleanerProfile.fullName) || cleanerProfile.fullName || '—';
  const unreadNotifs = notifications.filter((n) => !n.isRead).length;
  const status = cleanerProfile.currentShift.status;
  const active = status === 'ON_SHIFT' || status === 'ON_BREAK';
  const now = new Date();
  const today = ru ? `${now.getDate()} ${MONTHS_SHORT[now.getMonth()]}` : `${now.getDate()} ${MONTHS_SHORT_EN[now.getMonth()]}`;
  const start = cleanerProfile.currentShift.startTime;

  const presence =
    status === 'ON_SHIFT'
      ? { dot: '#3D7C52', text: t('На рабочем месте', 'On duty') }
      : status === 'ON_BREAK'
        ? { dot: '#D9822B', text: t('Перерыв', 'On break') }
        : { dot: '#8A8177', text: t('Не на смене', 'Off duty') };

  return (
    <SafeAreaView edges={['top']} className="flex-1 bg-background">
      <View className="px-5 pt-7 pb-3 flex-row items-center justify-between">
        <Text className="text-2xl font-spectral text-text-primary">{t('Профиль', 'Profile')}</Text>
        <View className="flex-row items-center gap-2">
          <HeaderButton onPress={() => router.push('/profile/chats')} badge={totalUnread}>
            <MessageSquare size={18} color="#241E1A" />
          </HeaderButton>
          <HeaderButton onPress={() => router.push('/profile/notifications')} badge={unreadNotifs}>
            <Bell size={18} color="#241E1A" />
          </HeaderButton>
          <HeaderButton onPress={() => router.push('/profile/settings')}>
            <Settings size={18} color="#241E1A" />
          </HeaderButton>
        </View>
      </View>

      <ScrollView className="flex-1" contentContainerClassName="px-5 py-3 gap-4">
        <View className="bg-white rounded-2xl border border-border p-[18px] flex-row items-center gap-3.5">
          <ManagerAvatar name={name} size={56} />
          <View className="flex-1">
            <Text className="text-sm font-jost-medium text-text-primary" numberOfLines={1}>
              {name}
            </Text>
            <Text className="text-xs font-jost text-text-secondary mt-0.5">{t('Руководитель отеля', 'Hotel manager')}</Text>
            {!!cleanerProfile.badgeId && <Text className="text-[10px] font-jost text-primary mt-1">ID: {cleanerProfile.badgeId}</Text>}
          </View>
        </View>

        <View className="gap-1.5">
          <Text className="text-[10px] font-jost-medium text-text-secondary tracking-widest uppercase px-1">{t('ТЕКУЩАЯ СМЕНА', 'CURRENT SHIFT')}</Text>
          <View className="bg-white rounded-2xl border border-border p-[18px] gap-3">
            <View className="flex-row items-center justify-between gap-2">
              <Text className="text-sm font-jost-medium text-text-primary">{active ? t('Смена активна', 'Shift active') : t('Смена не начата', 'Shift not started')}</Text>
              <Text className="text-xs font-jost text-text-secondary">
                {cleanerProfile.currentShift.date || today}
                {active && start ? ` · ${t('с', 'from')} ${start}` : ''}
              </Text>
            </View>
            <Text className="text-xs font-jost text-text-secondary leading-5">
              {t('Операционный контроль номерного фонда, кассы и служб отеля.', 'Operational control of room inventory, cash register, and hotel departments.')}
            </Text>
            <View className="bg-background border border-border py-2.5 px-3.5 rounded-xl flex-row items-center justify-between">
              <View className="flex-row items-center gap-2">
                <View className="h-2 w-2 rounded-full" style={{ backgroundColor: presence.dot }} />
                <Text className="text-xs font-jost-medium text-text-primary">{t('Статус руководителя', 'Manager status')}</Text>
              </View>
              <Text className="text-xs font-jost-medium" style={{ color: presence.dot }}>
                {presence.text}
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
