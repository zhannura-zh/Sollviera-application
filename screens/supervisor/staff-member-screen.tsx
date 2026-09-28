import React, { useState } from 'react';
import { View, Text, Pressable, ScrollView, Switch, Alert } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { ChevronLeft, ChevronRight, UserX } from 'lucide-react-native';
import { StaffMember } from '@/types';
import { useApp } from '@/context/app-store';

interface StaffMemberScreenProps {
  staff: StaffMember | null;
  onBack: () => void;
  onMessage: () => void;
}

type RoleTier = 'CLEANER' | 'SENIOR_CLEANER' | 'SUPERVISOR';

interface Permissions {
  ownRooms: boolean;
  allRooms: boolean;
  inspection: boolean;
  maintenance: boolean;
  staffManagement: boolean;
  appSettings: boolean;
}

const PERMISSIONS_BY_TIER: Record<RoleTier, Permissions> = {
  CLEANER: { ownRooms: true, allRooms: false, inspection: false, maintenance: false, staffManagement: false, appSettings: false },
  SENIOR_CLEANER: { ownRooms: true, allRooms: true, inspection: false, maintenance: true, staffManagement: false, appSettings: false },
  SUPERVISOR: { ownRooms: true, allRooms: true, inspection: true, maintenance: true, staffManagement: true, appSettings: true },
};

function roleTierOf(roleCode: string | undefined): RoleTier {
  const code = (roleCode || '').toLowerCase();
  if (code.includes('senior')) return 'SENIOR_CLEANER';
  if (code.includes('supervisor')) return 'SUPERVISOR';
  return 'CLEANER';
}

function roleTierLabel(tier: RoleTier, lang: 'RU' | 'EN') {
  switch (tier) {
    case 'CLEANER': return lang === 'RU' ? 'Клинер' : 'Cleaner';
    case 'SENIOR_CLEANER': return lang === 'RU' ? 'Ст. клинер' : 'Senior cleaner';
    case 'SUPERVISOR': return lang === 'RU' ? 'Супервайзер' : 'Supervisor';
  }
}

function InfoRow({ label, value, onPress }: { label: string; value: string; onPress?: () => void }) {
  const Wrapper = onPress ? Pressable : View;
  return (
    <Wrapper onPress={onPress} className="p-3.5 flex-row items-center justify-between border-t border-border-light first:border-t-0 active:bg-background">
      <Text className="text-sm font-jost text-text-secondary">{label}</Text>
      <View className="flex-row items-center gap-1">
        <Text className="text-sm font-jost-semibold text-text-primary">{value}</Text>
        {!!onPress && <ChevronRight size={14} color="#8A8177" />}
      </View>
    </Wrapper>
  );
}

function PermissionRow({ title, subtitle, value, onChange, isFirst }: { title: string; subtitle?: string; value: boolean; onChange: (v: boolean) => void; isFirst?: boolean }) {
  return (
    <View className={`p-3.5 flex-row items-center justify-between ${isFirst ? '' : 'border-t border-border-light'}`}>
      <View className="flex-1 pr-3">
        <Text className="text-sm font-jost-semibold text-text-primary">{title}</Text>
        {!!subtitle && <Text className="text-[12px] font-jost text-text-secondary mt-0.5">{subtitle}</Text>}
      </View>
      <Switch
        value={value}
        onValueChange={onChange}
        trackColor={{ false: '#E5DFD3', true: '#5B8C6E' }}
        thumbColor="#fff"
      />
    </View>
  );
}

// Staff member profile (Profile → "Управление персоналом" → staff card). The real API
// (GET /staff) has no fields for zone/schedule/norm/per-user permissions and no write
// endpoint, so everything below the read-only Info rows is session-local demo state,
// seeded from role-based defaults — same "not persisted" pattern as the invite flow in
// staff-directory-screen.tsx.
export function StaffMemberScreen({ staff, onBack, onMessage }: StaffMemberScreenProps) {
  const { lang } = useApp();
  const insets = useSafeAreaInsets();
  const [roleTier, setRoleTier] = useState<RoleTier>(() => roleTierOf(staff?.roleCode));
  const [permissions, setPermissions] = useState<Permissions>(() => PERMISSIONS_BY_TIER[roleTierOf(staff?.roleCode)]);
  const [schedule, setSchedule] = useState<'2/2' | '5/2' | 'FLEX'>('2/2');
  const [normMinutes, setNormMinutes] = useState(25);

  if (!staff) {
    return (
      <SafeAreaView edges={['top']} className="flex-1 bg-background items-center justify-center">
        <Text className="text-sm font-jost text-text-secondary">{lang === 'RU' ? 'Сотрудник не найден' : 'Staff member not found'}</Text>
      </SafeAreaView>
    );
  }

  const scheduleLabel = (s: typeof schedule) => (s === '2/2' ? (lang === 'RU' ? '2 через 2' : '2 on / 2 off') : s === '5/2' ? (lang === 'RU' ? '5/2' : '5/2') : (lang === 'RU' ? 'Гибкий' : 'Flexible'));
  const cycleSchedule = () => setSchedule((s) => (s === '2/2' ? '5/2' : s === '5/2' ? 'FLEX' : '2/2'));

  const selectRoleTier = (tier: RoleTier) => {
    setRoleTier(tier);
    setPermissions(PERMISSIONS_BY_TIER[tier]);
  };

  const notPersisted = () =>
    Alert.alert(
      lang === 'RU' ? 'Демо-режим' : 'Demo mode',
      lang === 'RU' ? 'Изменения не отправляются на сервер — в API нет эндпоинта для управления ролями и доступами персонала.' : 'Changes are not sent to the server — the API has no endpoint for staff roles and permissions.'
    );

  const confirmDismiss = () =>
    Alert.alert(
      lang === 'RU' ? 'Уволить сотрудника?' : 'Dismiss staff member?',
      lang === 'RU' ? `${staff.fullName} будет отключён от системы.` : `${staff.fullName} will be removed from the system.`,
      [
        { text: lang === 'RU' ? 'Отмена' : 'Cancel', style: 'cancel' },
        { text: lang === 'RU' ? 'Уволить' : 'Dismiss', style: 'destructive', onPress: notPersisted },
      ]
    );

  return (
    <SafeAreaView edges={['top']} className="flex-1 bg-background">
      <View className="px-5 pt-4 pb-4 gap-3">
        <Pressable onPress={onBack} className="flex-row items-center gap-1.5 self-start">
          <ChevronLeft size={16} color="#8A8177" />
          <Text className="text-xs font-jost text-text-secondary">{lang === 'RU' ? 'Персонал' : 'Staff'}</Text>
        </Pressable>
        <View className="gap-0.5">
          <Text className="text-2xl font-spectral text-text-primary">{staff.fullName}</Text>
          <Text className="text-sm font-jost text-text-secondary">
            {staff.id} · {staff.shiftStatus === 'ON_SHIFT' ? (lang === 'RU' ? 'на смене' : 'on shift') : (lang === 'RU' ? 'не на смене' : 'off shift')}
          </Text>
        </View>
      </View>

      <ScrollView className="flex-1 px-5" contentContainerStyle={{ paddingBottom: 20, gap: 16 }}>
        <View className="gap-2">
          <Text className="text-[12px] text-text-secondary font-jost tracking-widest uppercase px-1">
            {lang === 'RU' ? 'ДОЛЖНОСТЬ' : 'ROLE'}
          </Text>
          <View className="bg-white rounded-[14px] border border-border overflow-hidden">
            <View className="flex-row gap-2 p-3.5">
              {(['CLEANER', 'SENIOR_CLEANER', 'SUPERVISOR'] as const).map((tier) => {
                const isSelected = roleTier === tier;
                return (
                  <Pressable
                    key={tier}
                    onPress={() => selectRoleTier(tier)}
                    className={`flex-1 py-2 rounded-xl border items-center ${isSelected ? 'bg-dark border-dark' : 'bg-white border-border'}`}
                  >
                    <Text className={`text-[12px] font-jost ${isSelected ? 'text-white' : 'text-text-secondary'}`}>{roleTierLabel(tier, lang)}</Text>
                  </Pressable>
                );
              })}
            </View>
            <InfoRow label={lang === 'RU' ? 'Зона ответственности' : 'Responsibility zone'} value={staff.department || '—'} onPress={notPersisted} />
            <InfoRow label={lang === 'RU' ? 'Телефон' : 'Phone'} value={staff.phone || '—'} />
            <InfoRow label={lang === 'RU' ? 'Табельный номер' : 'Badge ID'} value={staff.id} />
          </View>
        </View>

        <View className="gap-2">
          <Text className="text-[12px] text-text-secondary font-jost tracking-widest uppercase px-1">
            {lang === 'RU' ? 'ДОСТУП В ПРИЛОЖЕНИИ' : 'APP ACCESS'}
          </Text>
          <View className="bg-white rounded-[14px] border border-border overflow-hidden">
            <PermissionRow
              isFirst
              title={lang === 'RU' ? 'Свои номера' : 'Own rooms'}
              subtitle={lang === 'RU' ? 'список задач и чек-листы' : 'task list and checklists'}
              value={permissions.ownRooms}
              onChange={(v) => setPermissions((p) => ({ ...p, ownRooms: v }))}
            />
            <PermissionRow
              title={lang === 'RU' ? 'Все номера отеля' : 'All hotel rooms'}
              subtitle={lang === 'RU' ? 'мониторинг чужих задач' : 'monitor other staff tasks'}
              value={permissions.allRooms}
              onChange={(v) => setPermissions((p) => ({ ...p, allRooms: v }))}
            />
            <PermissionRow
              title={lang === 'RU' ? 'Инспекция и приёмка' : 'Inspection and acceptance'}
              subtitle={lang === 'RU' ? 'принимать и отклонять номера' : 'accept and reject rooms'}
              value={permissions.inspection}
              onChange={(v) => setPermissions((p) => ({ ...p, inspection: v }))}
            />
            <PermissionRow
              title={lang === 'RU' ? 'Заявки в техслужбу' : 'Maintenance tickets'}
              value={permissions.maintenance}
              onChange={(v) => setPermissions((p) => ({ ...p, maintenance: v }))}
            />
            <PermissionRow
              title={lang === 'RU' ? 'Управление персоналом' : 'Staff management'}
              value={permissions.staffManagement}
              onChange={(v) => setPermissions((p) => ({ ...p, staffManagement: v }))}
            />
            <PermissionRow
              title={lang === 'RU' ? 'Настройки приложения' : 'App settings'}
              value={permissions.appSettings}
              onChange={(v) => setPermissions((p) => ({ ...p, appSettings: v }))}
            />
          </View>
        </View>

        <View className="gap-2">
          <Text className="text-[12px] text-text-secondary font-jost tracking-widest uppercase px-1">
            {lang === 'RU' ? 'СМЕНЫ' : 'SHIFTS'}
          </Text>
          <View className="bg-white rounded-[14px] border border-border overflow-hidden">
            <InfoRow label={lang === 'RU' ? 'График' : 'Schedule'} value={scheduleLabel(schedule)} onPress={cycleSchedule} />
            <View className="p-3.5 flex-row items-center justify-between border-t border-border-light">
              <Text className="text-sm font-jost text-text-secondary">{lang === 'RU' ? 'Норматив на номер' : 'Norm per room'}</Text>
              <View className="flex-row items-center gap-3">
                <Pressable
                  onPress={() => setNormMinutes((m) => Math.max(5, m - 1))}
                  className="h-7 w-7 rounded-lg border border-border items-center justify-center active:bg-background"
                >
                  <Text className="text-text-primary font-jost-semibold">-</Text>
                </Pressable>
                <Text className="text-sm font-jost-semibold text-text-primary w-14 text-center">{normMinutes} {lang === 'RU' ? 'мин' : 'min'}</Text>
                <Pressable
                  onPress={() => setNormMinutes((m) => Math.min(90, m + 1))}
                  className="h-7 w-7 rounded-lg border border-border items-center justify-center active:bg-background"
                >
                  <Text className="text-text-primary font-jost-semibold">+</Text>
                </Pressable>
              </View>
            </View>
          </View>
        </View>

        <Pressable
          onPress={confirmDismiss}
          className="bg-white rounded-[14px] border border-border p-3.5 flex-row items-center gap-2.5 active:bg-background"
        >
          <UserX size={16} color="#B3261E" />
          <Text className="text-sm font-jost-semibold text-error">{lang === 'RU' ? 'Уволить сотрудника' : 'Dismiss staff member'}</Text>
        </Pressable>
      </ScrollView>

      <View className="p-5 border-t border-border-light bg-background flex-row gap-2.5" style={{ paddingBottom: insets.bottom + 20 }}>
        <Pressable onPress={onMessage} className="flex-1 py-3.5 rounded-xl border border-border bg-white items-center">
          <Text className="text-sm font-jost-semibold text-text-primary">{lang === 'RU' ? 'Написать' : 'Message'}</Text>
        </Pressable>
        <Pressable onPress={notPersisted} className="flex-1 py-3.5 rounded-xl bg-primary items-center active:bg-primary-hover">
          <Text className="text-sm font-jost-semibold text-white">{lang === 'RU' ? 'Сохранить' : 'Save'}</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}
