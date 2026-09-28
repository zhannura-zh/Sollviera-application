import React, { useState } from 'react';
import { View, Text, TextInput, Pressable, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Search, Users, ChevronRight } from 'lucide-react-native';
import { useApp } from '@/context/app-store';
import { ReassignTasksModal } from '@/components/reassign-tasks-modal';

interface TeamScreenProps {
  onOpenStaff: (name: string) => void;
}

function getInitials(name: string) {
  return name.split(' ').filter(Boolean).map((n) => n[0]).slice(0, 2).join('').toUpperCase() || '?';
}

// Full staff roster on shift today — same set as "Персонал" under Profile, just the
// operational at-a-glance view (name + shift status) instead of the HR-style directory.
export function TeamScreen({ onOpenStaff }: TeamScreenProps) {
  const { lang, staffList, cleanerProfile } = useApp();
  const [searchQuery, setSearchQuery] = useState('');
  const [showReassign, setShowReassign] = useState(false);

  const staffOthers = staffList.filter((s) => s.id !== cleanerProfile.id);

  const onShiftCount = staffOthers.filter((s) => s.shiftStatus === 'ON_SHIFT').length;

  const filtered = staffOthers.filter((s) => {
    const q = searchQuery.toLowerCase().trim();
    return !q || s.fullName.toLowerCase().includes(q);
  });

  return (
    <SafeAreaView edges={['top']} className="flex-1 bg-background">
      <View className="px-5 pt-7 pb-4 gap-3.5">
        <View className="gap-1.5">
          <Text className="text-2xl font-spectral text-text-primary">{lang === 'RU' ? 'Команда' : 'Team'}</Text>
          <Text className="text-sm font-jost text-text-secondary">
            {onShiftCount} {lang === 'RU' ? 'на смене' : 'on shift'} · {staffOthers.length - onShiftCount} {lang === 'RU' ? 'на перерыве' : 'off shift'}
          </Text>
        </View>
        <View className="relative">
          <View className="absolute left-3 top-0 bottom-0 justify-center z-10">
            <Search size={14} color="#8A8177" />
          </View>
          <TextInput
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder={lang === 'RU' ? 'Поиск по имени' : 'Search by name'}
            placeholderTextColor="#8A8177"
            className="w-full bg-white border border-border rounded-xl pl-9 pr-3 py-2.5 text-sm text-text-primary"
          />
        </View>
      </View>

      <ScrollView className="flex-1 px-5" contentContainerStyle={{ paddingBottom: 20, gap: 16 }}>
        {filtered.length === 0 ? (
          <View className="bg-white rounded-[14px] border border-border p-8 items-center gap-2">
            <Users size={28} color="#8A8177" />
            <Text className="text-sm font-jost text-text-secondary">{lang === 'RU' ? 'Сотрудники не найдены' : 'No staff found'}</Text>
          </View>
        ) : (
          <View className="bg-white rounded-[14px] border border-border overflow-hidden">
            {filtered.map((s, i) => (
              <Pressable
                key={s.id}
                onPress={() => onOpenStaff(s.fullName)}
                className={`p-3.5 flex-row items-center gap-3 active:bg-background ${i > 0 ? 'border-t border-border-light' : ''}`}
              >
                <View className="h-10 w-10 rounded-full bg-primary-light items-center justify-center border border-border">
                  <Text className="text-text-primary font-jost text-sm">{getInitials(s.fullName)}</Text>
                </View>
                <Text className="text-sm font-jost-semibold text-text-primary flex-1">{s.fullName}</Text>
                <View className="flex-row items-center gap-1.5">
                  <Text className={`text-[12px] font-jost ${s.shiftStatus === 'ON_SHIFT' ? 'text-success-text' : 'text-text-secondary'}`}>
                    {s.shiftStatus === 'ON_SHIFT' ? (lang === 'RU' ? 'на смене' : 'on shift') : (lang === 'RU' ? 'не на смене' : 'off shift')}
                  </Text>
                  <ChevronRight size={16} color="#8A8177" />
                </View>
              </Pressable>
            ))}
          </View>
        )}
      </ScrollView>

      <View className="p-5 border-t border-border-light bg-background">
        <Pressable
          onPress={() => setShowReassign(true)}
          className="w-full bg-primary py-3.5 rounded-xl items-center active:bg-primary-hover"
        >
          <Text className="text-white text-sm font-jost-semibold">{lang === 'RU' ? 'Перераспределить задачи' : 'Reallocate tasks'}</Text>
        </Pressable>
      </View>

      <ReassignTasksModal visible={showReassign} onClose={() => setShowReassign(false)} />
    </SafeAreaView>
  );
}
