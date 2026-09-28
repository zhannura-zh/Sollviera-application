import React, { useState } from 'react';
import { View, Text, Pressable, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ShieldCheck, ChevronRight } from 'lucide-react-native';
import { useApp } from '@/context/app-store';

type Tab = 'PENDING' | 'ACCEPTED' | 'REJECTED';

interface InspectionScreenProps {
  onOpenRoom: (roomId: string) => void;
}

// Minutes between two "HH:MM" clock readings (see mapHousekeepingTask in app-store.tsx).
function minutesBetweenClock(start: string, end: string): number {
  const parse = (v: string) => {
    const m = /^(\d{1,2}):(\d{2})/.exec(v);
    return m ? Number(m[1]) * 60 + Number(m[2]) : null;
  };
  const s = parse(start);
  const e = parse(end);
  if (s === null || e === null) return 0;
  let diff = e - s;
  if (diff < 0) diff += 24 * 60;
  return diff;
}

export function InspectionScreen({ onOpenRoom }: InspectionScreenProps) {
  const { lang, rooms, rejectedInspections } = useApp();
  const [tab, setTab] = useState<Tab>('PENDING');

  const pending = rooms.filter((r) => r.status === 'READY');
  const accepted = rooms.filter((r) => r.status === 'VERIFIED');
  const recentActivity = [
    ...accepted.map((room) => ({ kind: 'accepted' as const, id: room.id, room })),
    ...rejectedInspections.map((item) => ({ kind: 'rejected' as const, id: item.id, item })),
  ];

  return (
    <SafeAreaView edges={['top']} className="flex-1 bg-background">
      <View className="px-5 pt-7 pb-4 gap-3.5">
        <View className="gap-1.5">
          <Text className="text-2xl font-spectral text-text-primary">{lang === 'RU' ? 'Инспекция' : 'Inspection'}</Text>
          <Text className="text-sm font-jost text-text-secondary">
            <Text className="text-text-primary font-jost-semibold">{pending.length} </Text>
            {lang === 'RU' ? 'номеров ждут проверки' : 'rooms awaiting review'}
          </Text>
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 6 }}>
          {([
            ['PENDING', lang === 'RU' ? 'Ждут проверки' : 'Awaiting review', pending.length],
            ['ACCEPTED', lang === 'RU' ? 'Принятые' : 'Accepted', accepted.length],
            ['REJECTED', lang === 'RU' ? 'Отклонённые' : 'Rejected', rejectedInspections.length],
          ] as const).map(([key, label, count]) => {
            const isSelected = tab === key;
            return (
              <Pressable
                key={key}
                onPress={() => setTab(key)}
                className={`px-3.5 py-1.5 rounded-full border flex-row items-center gap-1.5 ${isSelected ? 'bg-dark border-dark' : 'bg-white border-border'}`}
              >
                <Text className={`text-sm font-jost ${isSelected ? 'text-white' : 'text-text-secondary'}`}>{label}</Text>
                <Text className={`text-sm font-jost ${isSelected ? 'text-white/80' : 'text-text-secondary'}`}>{count}</Text>
              </Pressable>
            );
          })}
        </ScrollView>
      </View>

      <ScrollView className="flex-1 px-5" contentContainerStyle={{ paddingBottom: 20 }}>
        {tab === 'PENDING' && (
          pending.length === 0 ? (
            <View className="bg-white rounded-[14px] border border-border p-8 items-center gap-2">
              <ShieldCheck size={28} color="#8A8177" />
              <Text className="text-sm font-jost text-text-secondary">
                {lang === 'RU' ? 'Все номера проверены' : 'Nothing to review right now'}
              </Text>
            </View>
          ) : (
            <View className="bg-white rounded-[14px] border border-border overflow-hidden">
              {pending.map((room, i) => (
                <Pressable
                  key={room.id}
                  onPress={() => onOpenRoom(room.id)}
                  className={`p-3.5 flex-row items-center justify-between active:bg-background ${i > 0 ? 'border-t border-border-light' : ''}`}
                >
                  <View className="flex-1 min-w-0">
                    <View className="flex-row items-center gap-1.5">
                      <Text className="text-base font-jost-semibold text-text-primary">№ {room.roomNumber}</Text>
                      {room.priority === 'VIP' && (
                        <View className="bg-background border border-amber-200/60 px-1.5 py-0.5 rounded">
                          <Text className="text-amber-800 text-[10px] font-jost-semibold">VIP</Text>
                        </View>
                      )}
                    </View>
                    <Text className="text-[13px] font-jost text-text-secondary mt-0.5" numberOfLines={1}>
                      {[room.category, room.assignedTo, room.startTime && room.endTime ? `${minutesBetweenClock(room.startTime, room.endTime)} ${lang === 'RU' ? 'мин' : 'min'}` : null]
                        .filter(Boolean)
                        .join(' · ')}
                    </Text>
                  </View>
                  <View className="flex-row items-center gap-1.5 shrink-0 pl-2">
                    <Text className="text-[12px] font-jost text-text-secondary">
                      {room.endTime ? `${lang === 'RU' ? 'сдан' : 'submitted'} ${room.endTime}` : ''}
                    </Text>
                    <ChevronRight size={16} color="#8A8177" />
                  </View>
                </Pressable>
              ))}
            </View>
          )
        )}

        {tab === 'PENDING' && recentActivity.length > 0 && (
          <View className="gap-2 mt-4">
            <Text className="text-[12px] text-text-secondary font-jost tracking-widest uppercase px-1">
              {lang === 'RU' ? 'ПРОВЕРЕНЫ СЕГОДНЯ' : 'CHECKED TODAY'}
            </Text>
            <View className="bg-white rounded-[14px] border border-border overflow-hidden">
              {recentActivity.map((entry, i) => (
                <Pressable
                  key={entry.id}
                  disabled={entry.kind === 'rejected'}
                  onPress={() => entry.kind === 'accepted' && onOpenRoom(entry.room.id)}
                  className={`p-3.5 flex-row items-center justify-between active:bg-background ${i > 0 ? 'border-t border-border-light' : ''}`}
                >
                  <View className="flex-1 min-w-0">
                    <Text className="text-base font-jost-semibold text-text-primary">
                      № {entry.kind === 'accepted' ? entry.room.roomNumber : entry.item.roomNumber}
                    </Text>
                    <Text className="text-[13px] font-jost text-text-secondary mt-0.5" numberOfLines={1}>
                      {entry.kind === 'accepted'
                        ? [entry.room.category, entry.room.assignedTo, lang === 'RU' ? 'без замечаний' : 'no remarks'].filter(Boolean).join(' · ')
                        : entry.item.note || (lang === 'RU' ? 'без комментария' : 'no comment')}
                    </Text>
                  </View>
                  <Text className={`text-[12px] font-jost shrink-0 pl-2 ${entry.kind === 'accepted' ? 'text-success-text' : 'text-error'}`}>
                    {entry.kind === 'accepted' ? (lang === 'RU' ? 'принят' : 'accepted') : (lang === 'RU' ? 'отклонён' : 'rejected')}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>
        )}

        {tab === 'ACCEPTED' && (
          accepted.length === 0 ? (
            <View className="bg-white rounded-[14px] border border-border p-8 items-center gap-2">
              <Text className="text-sm font-jost text-text-secondary">{lang === 'RU' ? 'Пока нет принятых номеров' : 'Nothing accepted yet'}</Text>
            </View>
          ) : (
            <View className="bg-white rounded-[14px] border border-border overflow-hidden">
              {accepted.map((room, i) => (
                <Pressable
                  key={room.id}
                  onPress={() => onOpenRoom(room.id)}
                  className={`p-3.5 flex-row items-center justify-between active:bg-background ${i > 0 ? 'border-t border-border-light' : ''}`}
                >
                  <View className="flex-1 min-w-0">
                    <Text className="text-base font-jost-semibold text-text-primary">№ {room.roomNumber}</Text>
                    <Text className="text-[13px] font-jost text-text-secondary mt-0.5" numberOfLines={1}>
                      {room.category}{room.assignedTo ? ` · ${room.assignedTo}` : ''}
                    </Text>
                  </View>
                  <View className="flex-row items-center gap-1.5 shrink-0 pl-2">
                    <Text className="text-[12px] font-jost text-success-text">{lang === 'RU' ? 'принят' : 'accepted'}</Text>
                    <ChevronRight size={16} color="#8A8177" />
                  </View>
                </Pressable>
              ))}
            </View>
          )
        )}

        {tab === 'REJECTED' && (
          rejectedInspections.length === 0 ? (
            <View className="bg-white rounded-[14px] border border-border p-8 items-center gap-2">
              <Text className="text-sm font-jost text-text-secondary">{lang === 'RU' ? 'Пока нет отклонённых номеров' : 'Nothing rejected yet'}</Text>
            </View>
          ) : (
            <View className="bg-white rounded-[14px] border border-border overflow-hidden">
              {rejectedInspections.map((item, i) => (
                <View key={item.id} className={`p-3.5 flex-row items-center justify-between ${i > 0 ? 'border-t border-border-light' : ''}`}>
                  <View className="flex-1 min-w-0">
                    <Text className="text-base font-jost-semibold text-text-primary">№ {item.roomNumber}</Text>
                    <Text className="text-[13px] font-jost text-text-secondary mt-0.5" numberOfLines={1}>{item.note || '—'}</Text>
                  </View>
                  <Text className="text-[12px] font-jost text-error shrink-0 pl-2">{lang === 'RU' ? 'отклонён' : 'rejected'}</Text>
                </View>
              ))}
            </View>
          )
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
