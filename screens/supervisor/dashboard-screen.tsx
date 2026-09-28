import React, { useState } from 'react';
import { View, Text, TextInput, Pressable, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Search, LayoutDashboard, ChevronRight } from 'lucide-react-native';
import { HotelRoom, RoomStatus } from '@/types';
import { getTranslation } from '@/lib/locales';
import { useApp } from '@/context/app-store';
import { SelectField } from '@/components/ui/select-field';

interface DashboardScreenProps {
  onOpenRoom: (roomId: string) => void;
}

const STATUS_ORDER: (RoomStatus | 'ALL')[] = ['ALL', 'IN_PROGRESS', 'READY', 'PROBLEM', 'PENDING', 'VERIFIED'];

function statusLabel(status: RoomStatus | 'ALL', lang: 'RU' | 'EN') {
  switch (status) {
    case 'ALL': return lang === 'RU' ? 'Все' : 'All';
    case 'IN_PROGRESS': return lang === 'RU' ? 'В работе' : 'In progress';
    case 'READY': return lang === 'RU' ? 'На проверке' : 'Awaiting review';
    case 'PROBLEM': return lang === 'RU' ? 'Проблема' : 'Problem';
    case 'PENDING': return lang === 'RU' ? 'Ожидают' : 'Pending';
    case 'VERIFIED': return lang === 'RU' ? 'Проверено' : 'Verified';
  }
}

function dotColor(status: RoomStatus) {
  switch (status) {
    case 'PROBLEM': return '#B3261E';
    case 'IN_PROGRESS': return '#C2410C';
    case 'READY': return '#3E5372';
    case 'VERIFIED': return '#5B8C6E';
    default: return '#EDE4D3';
  }
}

function rightText(room: HotelRoom, lang: 'RU' | 'EN') {
  if (room.status === 'READY' && room.endTime) return `${lang === 'RU' ? 'на проверке' : 'awaiting review'} · ${room.endTime}`;
  if (room.status === 'IN_PROGRESS' && room.startTime) return `${lang === 'RU' ? 'в работе' : 'in progress'} · ${room.startTime}`;
  if (room.status === 'VERIFIED' && room.endTime) return `${lang === 'RU' ? 'принят' : 'accepted'} · ${room.endTime}`;
  if (room.status === 'PENDING') return `${lang === 'RU' ? 'до' : 'by'} ${room.deadline}`;
  return statusLabel(room.status, lang);
}

export function SupervisorDashboardScreen({ onOpenRoom }: DashboardScreenProps) {
  const { lang, rooms } = useApp();
  const t = getTranslation(lang);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<RoomStatus | 'ALL'>('ALL');
  const [selectedFloor, setSelectedFloor] = useState<number | 'ALL'>('ALL');

  const floors = Array.from(new Set(rooms.map((r) => r.floor))).sort((a, b) => a - b);

  const filteredRooms = rooms.filter((room) => {
    const q = searchQuery.toLowerCase().trim();
    const matchesSearch = !q || room.roomNumber.toLowerCase().includes(q) || (room.assignedTo || '').toLowerCase().includes(q);
    const matchesStatus = selectedStatus === 'ALL' || room.status === selectedStatus;
    const matchesFloor = selectedFloor === 'ALL' || room.floor === selectedFloor;
    return matchesSearch && matchesStatus && matchesFloor;
  });

  const problemCount = rooms.filter((r) => r.status === 'PROBLEM').length;
  const counts: Record<RoomStatus, number> = { PENDING: 0, IN_PROGRESS: 0, READY: 0, PROBLEM: 0, VERIFIED: 0 };
  rooms.forEach((r) => { counts[r.status] += 1; });

  return (
    <SafeAreaView edges={['top']} className="flex-1 bg-background">
      <View className="px-3.5 pt-3.5 pb-2.5 gap-2.5">
        <Text className="text-2xl font-spectral text-text-primary">{lang === 'RU' ? 'Мониторинг номеров' : 'Room Monitoring'}</Text>
        <Text className="text-[13px] text-text-secondary font-jost">
          {selectedFloor === 'ALL' ? (lang === 'RU' ? 'Все этажи' : 'All floors') : `${t.floorLabel} ${selectedFloor}`} ·{' '}
          <Text className="text-text-primary font-jost-semibold">{rooms.length}</Text> {lang === 'RU' ? 'номера' : 'rooms'} ·{' '}
          <Text className="text-error">
            {problemCount} {lang === 'RU' ? 'проблемы' : 'problems'}
          </Text>
        </Text>

        <View className="relative pt-0.5">
          <View className="absolute left-3.5 top-0 bottom-0 items-center justify-center z-10">
            <Search size={14} color="#8A8177" />
          </View>
          <TextInput
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder={lang === 'RU' ? 'Поиск по номеру или клинеру' : 'Search by room or cleaner'}
            placeholderTextColor="#8A8177"
            className="w-full bg-white border border-border rounded-xl pl-9 pr-3 py-2.5 text-sm text-text-primary"
          />
        </View>
      </View>

      <View className="px-3.5 py-1.5 gap-2">
        <View className="flex-row gap-2">
          <SelectField
            className="w-32"
            value={selectedFloor}
            onChange={setSelectedFloor}
            options={[
              { value: 'ALL' as const, label: t.floorAll },
              ...floors.map((f) => ({ value: f, label: `${t.floorLabel} ${f}` })),
            ]}
          />
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 6 }}>
            {STATUS_ORDER.map((status) => {
              const isSelected = selectedStatus === status;
              const count = status === 'ALL' ? rooms.length : counts[status];
              return (
                <Pressable
                  key={status}
                  onPress={() => setSelectedStatus(status)}
                  className={`px-3.5 py-1.5 rounded-full border flex-row items-center gap-1.5 ${
                    isSelected ? 'bg-dark border-dark' : 'bg-white border-border'
                  }`}
                >
                  <Text className={`text-[13px] font-jost-semibold ${isSelected ? 'text-white' : 'text-text-secondary'}`}>
                    {statusLabel(status, lang)}
                  </Text>
                  <Text className={`text-[13px] font-jost ${isSelected ? 'text-white/80' : 'text-text-secondary'}`}>{count}</Text>
                </Pressable>
              );
            })}
          </ScrollView>
        </View>
      </View>

      <ScrollView className="flex-1 px-3.5" contentContainerStyle={{ paddingVertical: 8 }}>
        {filteredRooms.length === 0 ? (
          <View className="p-8 items-center gap-2">
            <LayoutDashboard size={40} color="#cbd5e1" />
            <Text className="text-sm font-jost-semibold text-slate-400">
              {lang === 'RU' ? 'Комнаты не найдены' : 'No rooms match filters'}
            </Text>
          </View>
        ) : (
          <View className="bg-white rounded-[14px] border border-border overflow-hidden">
            {filteredRooms.map((room, i) => (
              <Pressable
                key={room.id}
                onPress={() => onOpenRoom(room.id)}
                className={`p-3.5 flex-row items-center gap-3 active:bg-background ${i > 0 ? 'border-t border-border-light' : ''}`}
              >
                <View className="h-2 w-2 rounded-full shrink-0" style={{ backgroundColor: dotColor(room.status) }} />
                <View className="flex-1 min-w-0">
                  <View className="flex-row items-center gap-1.5 flex-wrap">
                    <Text className="text-[15px] font-jost-semibold text-text-primary">№ {room.roomNumber}</Text>
                    {room.priority === 'VIP' && (
                      <View className="bg-background border border-amber-200/60 px-1.5 py-0.5 rounded">
                        <Text className="text-amber-800 font-jost-semibold text-[10px] uppercase">VIP</Text>
                      </View>
                    )}
                    {room.priority === 'URGENT' && (
                      <View className="bg-rose-50 border border-rose-100 px-1.5 py-0.5 rounded">
                        <Text className="text-rose-700 font-jost-semibold text-[10px] uppercase">{lang === 'RU' ? 'СРОЧНО' : 'URGENT'}</Text>
                      </View>
                    )}
                  </View>
                  {!!room.assignedTo && (
                    <Text className="text-[12px] font-jost text-text-secondary mt-0.5" numberOfLines={1}>{room.assignedTo}</Text>
                  )}
                </View>
                <View className="flex-row items-center gap-1.5 shrink-0">
                  <Text className={`text-[12px] font-jost ${room.status === 'PROBLEM' ? 'text-rose-700' : 'text-text-secondary'}`}>
                    {rightText(room, lang)}
                  </Text>
                  <ChevronRight size={16} color="#8A8177" />
                </View>
              </Pressable>
            ))}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
