import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { View, Text, Pressable, ScrollView, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Bell, ChevronRight, Clock, Lock, LogOut, MessageSquare, QrCode, Settings } from 'lucide-react-native';
import { useApp } from '@/context/app-store';
import { useChat } from '@/context/chat-store';
import { useReception, toIsoDate } from '@/context/reception-store';
import { useShiftActions } from '@/hooks/use-shift-status';
import { ShiftQrScanner } from '@/components/shift-qr-scanner';
import { ChangePasswordModal } from '@/components/password-modals';
import { getStoredSession, listCashShifts } from '@/lib/api-client';

// Front-desk profile (web PMS design, ReceptionScreens.tsx → profile). The design's
// notifications / chats / settings overlays are the app's shared /profile/* routes; the shift
// block follows components/shift-controls.tsx (QR open/close + presence) in the design's layout.

interface ReceptionProfileScreenProps {
  onLoggedOut: () => void;
}

const MONTHS_SHORT = ['янв', 'февр', 'мар', 'апр', 'мая', 'июн', 'июл', 'авг', 'сент', 'окт', 'нояб', 'дек'];

function getInitials(name: string) {
  return name.split(' ').filter(Boolean).map((n) => n[0]).slice(0, 2).join('').toUpperCase() || '?';
}

function plural(n: number, one: string, few: string, many: string) {
  const mod10 = n % 10;
  const mod100 = n % 100;
  if (mod10 === 1 && mod100 !== 11) return one;
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return few;
  return many;
}

// One of my shifts from GET /shifts (same data as the web's Finance → Shifts).
interface MyShift {
  id: string;
  open: boolean;
  openedAt: Date;
  closedAt: Date | null;
}

const pad2 = (n: number) => String(n).padStart(2, '0');
const shiftDateText = (d: Date) => `${d.getDate()} ${MONTHS_SHORT[d.getMonth()]}, ${pad2(d.getHours())}:${pad2(d.getMinutes())}`;
const durationText = (from: Date, to: Date, ru: boolean) => {
  const minutes = Math.max(0, Math.round((to.getTime() - from.getTime()) / 60000));
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return ru ? `${h} ч ${m} мин` : `${h} h ${m} min`;
};

function HeaderButton({ onPress, badge, children }: { onPress: () => void; badge?: number; children: React.ReactNode }) {
  return (
    <Pressable onPress={onPress} className="h-10 w-10 bg-white border border-border rounded-xl items-center justify-center relative active:bg-background">
      {children}
      {!!badge && badge > 0 && (
        <View className="absolute -top-1 -right-1 h-4 min-w-4 px-0.5 bg-primary rounded-full items-center justify-center">
          <Text className="text-white text-[9px] font-jost-medium">{badge}</Text>
        </View>
      )}
    </Pressable>
  );
}

function SectionTitle({ children }: { children: string }) {
  return <Text className="text-[10px] text-text-secondary font-jost uppercase tracking-widest px-1">{children}</Text>;
}

export function ReceptionProfileScreen({ onLoggedOut }: ReceptionProfileScreenProps) {
  const router = useRouter();
  const { lang, cleanerProfile, notifications, hasOpenDeskShift, changePassword, logout } = useApp();
  const { totalUnread: unreadChats } = useChat();
  const { bookings } = useReception();
  const { setPresence, canStopWorking, pauseActiveRoom } = useShiftActions();
  const ru = lang === 'RU';

  const [scan, setScan] = useState<'open' | 'close' | null>(null);
  const [isHistoryExpanded, setIsHistoryExpanded] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  // Shift history: my shifts from GET /shifts, newest first.
  const [shiftHistory, setShiftHistory] = useState<MyShift[]>([]);
  const loadShiftHistory = useCallback(async () => {
    const myId = getStoredSession()?.user.id;
    if (!myId) return;
    const list = ((await listCashShifts().catch(() => [])) ?? []) as any[];
    setShiftHistory(
      list
        .filter((x) => String(x?.userId ?? x?.user_id ?? '') === myId)
        .map((x) => ({
          id: String(x.id),
          open: String(x.status).toUpperCase() === 'OPEN',
          openedAt: new Date(x.openedAt ?? x.opened_at),
          closedAt: x.closedAt || x.closed_at ? new Date(x.closedAt ?? x.closed_at) : null,
        }))
        .filter((x) => !Number.isNaN(x.openedAt.getTime()))
        .sort((a, b) => b.openedAt.getTime() - a.openedAt.getTime())
    );
  }, []);
  useEffect(() => {
    void loadShiftHistory();
  }, [loadShiftHistory, hasOpenDeskShift]);

  const unreadNotifs = notifications.filter((n) => !n.isRead).length;
  const shiftStatus = hasOpenDeskShift ? cleanerProfile.currentShift.status : 'SHIFT_ENDED';
  const name = ru ? cleanerProfile.fullNameRu : cleanerProfile.fullName;
  const now = new Date();
  const todayLabel = `${now.getDate()} ${MONTHS_SHORT[now.getMonth()]}`;

  const stats = useMemo(() => {
    const today = toIsoDate(new Date());
    const live = bookings.filter((b) => b.status !== 'CANCELLED' && b.status !== 'NO_SHOW');
    return {
      active: live.filter((b) => b.status !== 'CHECKED_OUT').length,
      arrivals: live.filter((b) => b.checkIn === today).length,
      departures: live.filter((b) => b.checkOut === today).length,
    };
  }, [bookings]);

  const handleLogout = () => {
    Alert.alert(ru ? 'Выйти из аккаунта?' : 'Log out?', undefined, [
      { text: ru ? 'Отмена' : 'Cancel', style: 'cancel' },
      {
        text: ru ? 'Выйти' : 'Log out',
        style: 'destructive',
        onPress: () => {
          logout();
          onLoggedOut();
        },
      },
    ]);
  };

  const handleEndShift = () => {
    if (!canStopWorking('close')) return;
    setScan('close');
  };

  const handleScanDone = (result: 'opened' | 'closed') => {
    setScan(null);
    if (result === 'closed') pauseActiveRoom();
    Alert.alert(
      '',
      result === 'opened'
        ? ru ? 'Смена открыта. Хорошей работы!' : 'Shift opened. Have a good one!'
        : ru ? 'Смена закрыта.' : 'Shift closed.'
    );
  };

  return (
    <SafeAreaView edges={['top']} className="flex-1 bg-background">
      {/* Header */}
      <View className="px-5 pt-4 pb-1.5 flex-row items-center justify-between">
        <Text className="text-2xl font-spectral text-text-primary">{ru ? 'Профиль' : 'Profile'}</Text>
        <View className="flex-row items-center gap-1.5">
          <HeaderButton onPress={() => router.push('/profile/chats')} badge={unreadChats}>
            <MessageSquare size={16} color="#241E1A" />
          </HeaderButton>
          <HeaderButton onPress={() => router.push('/profile/notifications')} badge={unreadNotifs}>
            <Bell size={16} color="#241E1A" />
          </HeaderButton>
          <HeaderButton onPress={() => router.push('/profile/settings')}>
            <Settings size={16} color="#241E1A" />
          </HeaderButton>
        </View>
      </View>

      <ScrollView className="flex-1" contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 12, paddingBottom: 32, gap: 20 }}>
        {/* Employee card */}
        <View className="bg-white rounded-[18px] border border-border p-4 flex-row items-center gap-3.5">
          <View className="h-14 w-14 rounded-full items-center justify-center" style={{ backgroundColor: 'rgba(229,222,201,0.7)' }}>
            <Text className="text-base font-jost-medium text-[#5C544D]">{getInitials(name)}</Text>
          </View>
          <View className="flex-1">
            <View className="flex-row items-center gap-2">
              <Text className="text-base font-spectral text-text-primary flex-shrink" numberOfLines={1}>
                {name}
              </Text>
              {!!cleanerProfile.badgeId && <Text className="text-[11px] font-jost text-text-secondary">{cleanerProfile.badgeId}</Text>}
            </View>
            <Text className="text-xs font-jost text-text-secondary mt-0.5">{ru ? 'Администратор ресепшна' : 'Receptionist'}</Text>
          </View>
        </View>

        {/* Current shift */}
        <View className="gap-2">
          <SectionTitle>{ru ? 'ТЕКУЩАЯ СМЕНА' : 'CURRENT SHIFT'}</SectionTitle>

          {shiftStatus === 'SHIFT_ENDED' ? (
            <View className="bg-white rounded-[18px] border border-border p-4 gap-3">
              <View className="flex-row items-center justify-between">
                <Text className="text-sm font-jost-medium text-text-primary">{ru ? 'Смена не начата' : 'Shift not started'}</Text>
                <Text className="text-xs font-jost text-text-secondary">{todayLabel}</Text>
              </View>
              <Text className="text-xs font-jost text-text-secondary leading-relaxed">
                {ru
                  ? 'Начните смену, отсканировав QR-код на стойке ресепшна.'
                  : 'Start your shift by scanning the QR code at the reception desk.'}
              </Text>
              <Pressable
                onPress={() => setScan('open')}
                className="w-full py-3 rounded-[14px] bg-primary flex-row items-center justify-center gap-2 active:bg-primary-hover"
              >
                <QrCode size={16} color="#fff" />
                <Text className="text-white text-xs font-jost-medium">{ru ? 'Начать смену по QR' : 'Start shift via QR'}</Text>
              </Pressable>
            </View>
          ) : (
            <View className="bg-white rounded-[18px] border border-border p-4 gap-4">
              <View className="flex-row items-center justify-between">
                <Text className="text-xs font-jost-medium text-text-primary">{cleanerProfile.currentShift.shiftNumber || '—'}</Text>
                <Text className="text-xs font-jost text-text-secondary">
                  {cleanerProfile.currentShift.date || todayLabel} · {ru ? 'с' : 'from'} {cleanerProfile.currentShift.startTime || '—'}
                </Text>
              </View>

              <View className="flex-row gap-1.5">
                {(['ON_SHIFT', 'ON_BREAK'] as const).map((value) => {
                  const selected = shiftStatus === value;
                  return (
                    <Pressable
                      key={value}
                      disabled={selected}
                      onPress={() => setPresence(value)}
                      className={`flex-1 py-2.5 rounded-xl items-center ${selected ? 'bg-dark' : 'bg-white border border-border'}`}
                    >
                      <Text className={`text-xs ${selected ? 'text-white font-jost-medium' : 'text-text-secondary font-jost'}`}>
                        {value === 'ON_SHIFT' ? (ru ? 'На смене' : 'On shift') : ru ? 'Перерыв' : 'Break'}
                      </Text>
                    </Pressable>
                  );
                })}
                <Pressable onPress={handleEndShift} className="flex-1 py-2.5 rounded-xl items-center bg-white border border-border active:bg-background">
                  <Text className="text-xs font-jost text-text-secondary">{ru ? 'Завершить' : 'End'}</Text>
                </Pressable>
              </View>

              <View className="flex-row pt-2 border-t border-border/60">
                <View className="flex-1 px-1 items-center">
                  <Text className="text-base font-jost-medium text-text-primary">{stats.active}</Text>
                  <Text className="text-[10px] font-jost text-text-secondary text-center">активных броней</Text>
                </View>
                <View className="flex-1 px-1 items-center border-l border-border/60">
                  <Text className="text-base font-jost-medium text-text-primary">
                    {stats.arrivals} / {stats.departures}
                  </Text>
                  <Text className="text-[10px] font-jost text-text-secondary text-center">заезды / выезды</Text>
                </View>
                <View className="flex-1 px-1 items-center border-l border-border/60">
                  <Text className="text-base font-jost-medium text-text-primary">—</Text>
                  <Text className="text-[10px] font-jost text-text-secondary text-center">лист ожидания</Text>
                </View>
              </View>
            </View>
          )}
        </View>

        {/* Work */}
        <View className="gap-2">
          <SectionTitle>{ru ? 'РАБОТА' : 'WORK'}</SectionTitle>
          <View className="bg-white rounded-[18px] border border-border overflow-hidden">
            <Pressable
              onPress={() => {
                if (!isHistoryExpanded) void loadShiftHistory();
                setIsHistoryExpanded((v) => !v);
              }}
              className="p-4 flex-row items-center justify-between active:bg-background"
            >
              <View className="flex-row items-center gap-3">
                <Clock size={16} color="#8A8177" />
                <Text className="text-xs font-jost text-text-primary">{ru ? 'История смен' : 'Shift history'}</Text>
              </View>
              <View className="flex-row items-center gap-1.5">
                <Text className="text-xs font-jost text-text-secondary">
                  {shiftHistory.length} {plural(shiftHistory.length, 'смена', 'смены', 'смен')}
                </Text>
                <ChevronRight size={16} color="#8A8177" style={{ transform: [{ rotate: isHistoryExpanded ? '90deg' : '0deg' }] }} />
              </View>
            </Pressable>

            {isHistoryExpanded && (
              <View className="px-4 pb-3 pt-2 gap-2 bg-background/50 border-t border-border/50">
                {shiftHistory.length === 0 ? (
                  <Text className="text-xs font-jost text-text-secondary py-1">{ru ? 'Смен пока нет' : 'No shifts yet'}</Text>
                ) : (
                  shiftHistory.slice(0, 3).map((sh) => (
                    <View key={sh.id} className="bg-white rounded-xl p-2.5 border border-border flex-row items-center justify-between">
                      <Text className="text-xs font-jost-medium text-text-primary">{shiftDateText(sh.openedAt)}</Text>
                      <Text className="text-xs font-jost-medium" style={{ color: sh.open ? '#C2410C' : '#2E623C' }}>
                        {sh.open ? (ru ? 'Открыта' : 'Open') : sh.closedAt ? durationText(sh.openedAt, sh.closedAt, ru) : '—'}
                      </Text>
                    </View>
                  ))
                )}
              </View>
            )}
          </View>
        </View>

        {/* Account: password + log out (design's settings overlay, section «Учётная запись») */}
        <View className="gap-2">
          <SectionTitle>{ru ? 'УЧЁТНАЯ ЗАПИСЬ' : 'ACCOUNT'}</SectionTitle>
          <View className="bg-white rounded-[14px] border border-border overflow-hidden">
            <Pressable onPress={() => setIsChangingPassword(true)} className="p-4 flex-row items-center justify-between active:bg-background">
              <View className="flex-row items-center gap-3">
                <Lock size={16} color="#8A8177" />
                <Text className="text-xs font-jost text-text-primary">{ru ? 'Сменить пароль' : 'Change password'}</Text>
              </View>
              <ChevronRight size={16} color="#8A8177" />
            </Pressable>
          </View>
          <Pressable onPress={handleLogout} className="bg-white rounded-[14px] border border-border p-4 flex-row items-center gap-3 active:bg-background">
            <LogOut size={16} color="#8A8177" />
            <Text className="text-xs font-jost text-text-secondary">{ru ? 'Выйти из аккаунта' : 'Log out'}</Text>
          </Pressable>
        </View>
      </ScrollView>

      <ShiftQrScanner visible={scan !== null} action={scan ?? 'open'} onClose={() => setScan(null)} onDone={handleScanDone} />
      <ChangePasswordModal visible={isChangingPassword} lang={lang} onClose={() => setIsChangingPassword(false)} onSubmit={changePassword} />
    </SafeAreaView>
  );
}
