import React, { useState } from 'react';
import { View, Text, TextInput, Pressable, ScrollView, Modal } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Search, Users, X, ChevronRight, ChevronLeft, UserPlus } from 'lucide-react-native';
import { useApp } from '@/context/app-store';

interface StaffDirectoryScreenProps {
  onBack: () => void;
}

type RoleFilter = 'ALL' | 'CLEANER' | 'SUPERVISOR' | 'TECHNICIAN';
type InviteRole = 'CLEANER' | 'SUPERVISOR' | 'TECHNICIAN';

interface PendingInvite {
  id: string;
  phone: string;
  name?: string;
  role: InviteRole;
  invitedDate: string;
}

function getInitials(name: string) {
  return name.split(' ').filter(Boolean).map((n) => n[0]).slice(0, 2).join('').toUpperCase() || '?';
}

function matchesRoleFilter(roleCode: string | undefined, filter: RoleFilter) {
  const code = (roleCode || '').toLowerCase();
  switch (filter) {
    case 'CLEANER': return code.includes('cleaner') || code.includes('housekeep');
    case 'SUPERVISOR': return code.includes('supervisor');
    case 'TECHNICIAN': return code.includes('technician');
    default: return true;
  }
}

function inviteRoleLabel(role: InviteRole, lang: 'RU' | 'EN') {
  switch (role) {
    case 'CLEANER': return lang === 'RU' ? 'Клинер' : 'Cleaner';
    case 'SUPERVISOR': return lang === 'RU' ? 'Супервайзер' : 'Supervisor';
    case 'TECHNICIAN': return lang === 'RU' ? 'Техник' : 'Technician';
  }
}

// Staff directory (reached from Profile → "Управление персоналом"). Tapping a staff row
// opens the full staff-member screen (app/staff-member/[id].tsx). The real API has no
// write endpoint for inviting staff (only GET /staff), so invitations below are
// session-local UI state, not persisted anywhere — they reset on reload, same as other
// "demo mode" actions in the app.
export function StaffDirectoryScreen({ onBack }: StaffDirectoryScreenProps) {
  const { lang, staffList } = useApp();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<RoleFilter>('ALL');
  const [invitations, setInvitations] = useState<PendingInvite[]>([
    { id: 'inv-seed', phone: '+7 701 555 20 14', role: 'CLEANER', invitedDate: '26 авг' },
  ]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [invitePhone, setInvitePhone] = useState('');
  const [inviteName, setInviteName] = useState('');
  const [inviteRole, setInviteRole] = useState<InviteRole>('CLEANER');

  const filtered = staffList.filter((s) => {
    const q = searchQuery.toLowerCase().trim();
    const matchesSearch = !q || s.fullName.toLowerCase().includes(q) || (s.department || '').toLowerCase().includes(q) || (s.roleCode || '').toLowerCase().includes(q);
    return matchesSearch && matchesRoleFilter(s.roleCode, roleFilter);
  });
  const onShiftCount = staffList.filter((s) => s.shiftStatus === 'ON_SHIFT').length;
  const counts = {
    ALL: staffList.length,
    CLEANER: staffList.filter((s) => matchesRoleFilter(s.roleCode, 'CLEANER')).length,
    SUPERVISOR: staffList.filter((s) => matchesRoleFilter(s.roleCode, 'SUPERVISOR')).length,
    TECHNICIAN: staffList.filter((s) => matchesRoleFilter(s.roleCode, 'TECHNICIAN')).length,
  };

  const closeAddModal = () => {
    setShowAddModal(false);
    setInvitePhone('');
    setInviteName('');
    setInviteRole('CLEANER');
  };

  const sendInvite = () => {
    const phone = invitePhone.trim();
    if (!phone) return;
    setInvitations((prev) => [
      {
        id: `inv-${Date.now()}`,
        phone,
        name: inviteName.trim() || undefined,
        role: inviteRole,
        invitedDate: new Date().toLocaleDateString(lang === 'RU' ? 'ru-RU' : 'en-US', { day: '2-digit', month: 'short' }),
      },
      ...prev,
    ]);
    closeAddModal();
  };

  const removeInvite = (id: string) => setInvitations((prev) => prev.filter((i) => i.id !== id));

  return (
    <SafeAreaView edges={['top']} className="flex-1 bg-background">
      <View className="px-5 pt-4 pb-4 gap-3.5">
        <Pressable onPress={onBack} className="flex-row items-center gap-1.5 self-start">
          <ChevronLeft size={16} color="#8A8177" />
          <Text className="text-xs font-jost text-text-secondary">{lang === 'RU' ? 'Профиль' : 'Profile'}</Text>
        </Pressable>
        <View className="gap-1.5">
          <Text className="text-2xl font-spectral text-text-primary">{lang === 'RU' ? 'Персонал' : 'Staff'}</Text>
          <Text className="text-sm font-jost text-text-secondary">
            {staffList.length} {lang === 'RU' ? 'сотрудников' : 'staff'} · {onShiftCount} {lang === 'RU' ? 'на смене' : 'on shift'}
          </Text>
        </View>
        <View className="relative">
          <View className="absolute left-3 top-0 bottom-0 justify-center z-10">
            <Search size={14} color="#8A8177" />
          </View>
          <TextInput
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder={lang === 'RU' ? 'Поиск по имени или роли' : 'Search by name or role'}
            placeholderTextColor="#8A8177"
            className="w-full bg-white border border-border rounded-xl pl-9 pr-3 py-2.5 text-sm text-text-primary"
          />
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 6 }}>
          {([
            ['ALL', lang === 'RU' ? 'Все' : 'All'],
            ['CLEANER', lang === 'RU' ? 'Клинеры' : 'Cleaners'],
            ['SUPERVISOR', lang === 'RU' ? 'Супервайзеры' : 'Supervisors'],
            ['TECHNICIAN', lang === 'RU' ? 'Техники' : 'Technicians'],
          ] as const).map(([key, label]) => {
            const isSelected = roleFilter === key;
            return (
              <Pressable
                key={key}
                onPress={() => setRoleFilter(key)}
                className={`px-3.5 py-1.5 rounded-full border flex-row items-center gap-1.5 ${isSelected ? 'bg-dark border-dark' : 'bg-white border-border'}`}
              >
                <Text className={`text-sm font-jost ${isSelected ? 'text-white' : 'text-text-secondary'}`}>{label}</Text>
                <Text className={`text-sm font-jost ${isSelected ? 'text-white/80' : 'text-text-secondary'}`}>{counts[key]}</Text>
              </Pressable>
            );
          })}
        </ScrollView>
      </View>

      <ScrollView className="flex-1 px-5" contentContainerStyle={{ paddingBottom: 20, gap: 16 }}>
        <View className="gap-2">
          <Text className="text-[12px] text-text-secondary font-jost tracking-widest uppercase px-1">
            {lang === 'RU' ? 'СОТРУДНИКИ' : 'STAFF'}
          </Text>
          {filtered.length === 0 ? (
            <View className="bg-white rounded-[14px] border border-border p-8 items-center gap-2">
              <Users size={28} color="#8A8177" />
              <Text className="text-sm font-jost text-text-secondary">
                {lang === 'RU' ? 'Сотрудники не найдены' : 'No staff found'}
              </Text>
            </View>
          ) : (
            <View className="bg-white rounded-[14px] border border-border overflow-hidden">
              {filtered.map((s, i) => (
                <Pressable
                  key={s.id}
                  onPress={() => router.push(`/staff-member/${encodeURIComponent(s.id)}`)}
                  className={`p-3.5 flex-row items-center gap-3 active:bg-background ${i > 0 ? 'border-t border-border-light' : ''}`}
                >
                  <View className="h-10 w-10 rounded-full bg-primary-light items-center justify-center border border-border">
                    <Text className="text-text-primary font-jost text-sm">{getInitials(s.fullName)}</Text>
                  </View>
                  <View className="flex-1">
                    <Text className="text-sm font-jost-semibold text-text-primary">{s.fullName}</Text>
                    <Text className="text-[12px] font-jost text-text-secondary mt-0.5">
                      {s.roleCode || '—'}{s.department ? ` · ${s.department}` : ''}
                    </Text>
                  </View>
                  {s.shiftStatus === 'ON_SHIFT' && (
                    <View className="bg-success-light px-2 py-0.5 rounded-md">
                      <Text className="text-success-text text-[10px] font-jost-semibold uppercase">{lang === 'RU' ? 'на смене' : 'on shift'}</Text>
                    </View>
                  )}
                  <ChevronRight size={16} color="#8A8177" />
                </Pressable>
              ))}
            </View>
          )}
        </View>

        {invitations.length > 0 && (
          <View className="gap-2">
            <Text className="text-[12px] text-text-secondary font-jost tracking-widest uppercase px-1">
              {lang === 'RU' ? 'ПРИГЛАШЕНИЯ' : 'INVITATIONS'}
            </Text>
            <View className="bg-white rounded-[14px] border border-border overflow-hidden">
              {invitations.map((inv, i) => (
                <View key={inv.id} className={`p-3.5 flex-row items-center gap-3 ${i > 0 ? 'border-t border-border-light' : ''}`}>
                  <View className="h-10 w-10 rounded-full bg-background items-center justify-center border border-border">
                    <Text className="text-text-secondary font-jost text-sm">{inv.name ? getInitials(inv.name) : '?'}</Text>
                  </View>
                  <View className="flex-1 min-w-0">
                    <View className="flex-row items-center gap-1.5 flex-wrap">
                      <Text className="text-sm font-jost-semibold text-text-primary">{inv.name || inv.phone}</Text>
                      <View className="bg-[#FFF4ED] border border-[#FED7AA] px-1.5 py-0.5 rounded">
                        <Text className="text-[9px] font-jost-semibold text-[#C2410C] uppercase">{lang === 'RU' ? 'ждёт входа' : 'awaiting'}</Text>
                      </View>
                    </View>
                    <Text className="text-[12px] font-jost text-text-secondary mt-0.5" numberOfLines={1}>
                      {[inv.name ? inv.phone : null, inviteRoleLabel(inv.role, lang), `${lang === 'RU' ? 'приглашение от' : 'invited'} ${inv.invitedDate}`]
                        .filter(Boolean)
                        .join(' · ')}
                    </Text>
                  </View>
                  <Pressable onPress={() => removeInvite(inv.id)} className="h-7 w-7 items-center justify-center active:opacity-60">
                    <X size={16} color="#8A8177" />
                  </Pressable>
                </View>
              ))}
            </View>
          </View>
        )}
      </ScrollView>

      <View className="p-5 border-t border-border-light bg-background" style={{ paddingBottom: insets.bottom + 20 }}>
        <Pressable
          onPress={() => setShowAddModal(true)}
          className="w-full flex-row items-center justify-center gap-2 bg-primary py-3.5 rounded-xl active:bg-primary-hover"
        >
          <UserPlus size={16} color="#fff" />
          <Text className="text-white text-sm font-jost-semibold">{lang === 'RU' ? 'Добавить сотрудника' : 'Add staff'}</Text>
        </Pressable>
      </View>

      <Modal visible={showAddModal} transparent animationType="fade" onRequestClose={closeAddModal}>
        <View className="flex-1 items-center justify-center bg-dark/60 p-3.5">
          <View className="bg-white rounded-[20px] border border-border w-full max-w-sm p-5 gap-4">
            <View className="flex-row items-center justify-between">
              <Text className="text-base font-jost-semibold text-text-primary">{lang === 'RU' ? 'Добавить сотрудника' : 'Add staff'}</Text>
              <Pressable onPress={closeAddModal} className="h-8 w-8 rounded-full bg-background items-center justify-center border border-border-light active:bg-border-light">
                <X size={16} color="#241E1A" />
              </Pressable>
            </View>

            <View className="gap-1.5">
              <Text className="text-[12px] font-jost text-text-secondary uppercase tracking-wider">{lang === 'RU' ? 'Телефон (логин)' : 'Phone (login)'}</Text>
              <TextInput
                value={invitePhone}
                onChangeText={setInvitePhone}
                placeholder="+7 (701) 000-00-00"
                placeholderTextColor="#8A8177"
                keyboardType="phone-pad"
                className="w-full bg-background border border-border rounded-xl px-3 py-2.5 text-sm text-text-primary"
              />
            </View>

            <View className="gap-1.5">
              <Text className="text-[12px] font-jost text-text-secondary uppercase tracking-wider">{lang === 'RU' ? 'Имя и фамилия' : 'Full name'}</Text>
              <TextInput
                value={inviteName}
                onChangeText={setInviteName}
                placeholder={lang === 'RU' ? 'Например: Сабина Алиева' : 'e.g. Sabina Aliyeva'}
                placeholderTextColor="#8A8177"
                className="w-full bg-background border border-border rounded-xl px-3 py-2.5 text-sm text-text-primary"
              />
            </View>

            <View className="gap-1.5">
              <Text className="text-[12px] font-jost text-text-secondary uppercase tracking-wider">{lang === 'RU' ? 'Роль' : 'Role'}</Text>
              <View className="flex-row gap-2">
                {(['CLEANER', 'SUPERVISOR', 'TECHNICIAN'] as const).map((role) => {
                  const isSelected = inviteRole === role;
                  return (
                    <Pressable
                      key={role}
                      onPress={() => setInviteRole(role)}
                      className={`flex-1 py-2 rounded-xl border items-center ${isSelected ? 'bg-dark border-dark' : 'bg-background border-border'}`}
                    >
                      <Text className={`text-[12px] font-jost-semibold ${isSelected ? 'text-white' : 'text-text-secondary'}`}>
                        {inviteRoleLabel(role, lang)}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>

            <View className="bg-[#FFF8F0] border border-amber-200/60 rounded-xl p-3">
              <Text className="text-[12px] font-jost text-text-secondary leading-normal">
                {lang === 'RU'
                  ? 'Сотруднику будет отправлено SMS со ссылкой и одноразовым паролем. Приглашение действует 7 дней.'
                  : 'The employee will receive an SMS with a link and a one-time password. The invitation is valid for 7 days.'}
              </Text>
            </View>

            <View className="flex-row gap-2.5">
              <Pressable
                onPress={closeAddModal}
                className="flex-1 py-3 rounded-xl border border-border-light bg-background items-center active:bg-border-light"
              >
                <Text className="text-primary text-sm font-jost-semibold">{lang === 'RU' ? 'Отмена' : 'Cancel'}</Text>
              </Pressable>
              <Pressable
                onPress={sendInvite}
                disabled={!invitePhone.trim()}
                className={`flex-1 py-3 rounded-xl items-center ${invitePhone.trim() ? 'bg-primary active:bg-primary-hover' : 'bg-border'}`}
              >
                <Text className="text-white text-sm font-jost-semibold">{lang === 'RU' ? 'Отправить' : 'Send'}</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
