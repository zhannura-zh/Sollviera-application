import React, { useState } from 'react';
import { View, Text, Pressable, ScrollView } from 'react-native';
import { ChevronRight } from 'lucide-react-native';
import { useApp } from '@/context/app-store';
import { mockShiftHistory } from '@/data/mockData';

const ROOM_CHART_DATA = [
  { room: '301', minutes: 14 },
  { room: '205', minutes: 18 },
  { room: '306', minutes: 20 },
  { room: '310', minutes: 31 },
  { room: '214', minutes: 16 },
  { room: '402', minutes: 23 },
];

export function ReportsScreen() {
  const { lang, cleanerProfile, rooms } = useApp();
  const [expandedShiftId, setExpandedShiftId] = useState<string | null>(null);

  const completedRoomsCount = rooms.filter((r) => r.status === 'READY' || r.status === 'VERIFIED').length;
  const avgQuality =
    mockShiftHistory.length > 0
      ? Math.round(mockShiftHistory.reduce((acc, cur) => acc + cur.qualityScore, 0) / mockShiftHistory.length)
      : 96;

  const totalRoomsCleaned = completedRoomsCount + cleanerProfile.currentShift.roomsCompleted;
  const targetRooms = 12;
  const cleanAvgTime = cleanerProfile.currentShift.avgTimePerRoom.replace(/[^0-9]/g, '') || '22';

  return (
    <ScrollView className="flex-1 bg-background" contentContainerStyle={{ padding: 20, gap: 20 }}>
      <View className="gap-2">
        <Text className="text-[12px] text-text-secondary font-jost tracking-widest uppercase px-1">
          {lang === 'RU' ? 'ЗА СЕГОДНЯ' : 'FOR TODAY'}
        </Text>
        <View className="bg-white rounded-[14px] border border-border p-4 flex-row">
          <View className="flex-1 items-center gap-1">
            <Text className="text-sm text-text-secondary">
              <Text className="text-xl font-jost-semibold text-text-primary">{totalRoomsCleaned}</Text> / {targetRooms}
            </Text>
            <Text className="text-[12px] font-jost text-text-secondary">{lang === 'RU' ? 'убрано' : 'cleaned'}</Text>
          </View>
          <View className="flex-1 items-center gap-1 border-l border-border-light">
            <Text className="text-sm text-text-secondary">
              <Text className="text-xl font-jost-semibold text-text-primary">{cleanAvgTime}</Text> {lang === 'RU' ? 'мин' : 'min'}
            </Text>
            <Text className="text-[12px] font-jost text-text-secondary">{lang === 'RU' ? 'на номер' : 'per room'}</Text>
          </View>
          <View className="flex-1 items-center gap-1 border-l border-border-light">
            <Text className="text-sm text-text-secondary">
              <Text className="text-xl font-jost-semibold text-text-primary">{avgQuality}</Text>%
            </Text>
            <Text className="text-[12px] font-jost text-text-secondary">{lang === 'RU' ? 'без замечаний' : 'no issues'}</Text>
          </View>
        </View>
      </View>

      <View className="gap-2">
        <View className="flex-row items-center justify-between px-1">
          <Text className="text-[12px] text-text-secondary font-jost tracking-widest uppercase">
            {lang === 'RU' ? 'ДЛИТЕЛЬНОСТЬ ПО НОМЕРАМ' : 'DURATION BY ROOMS'}
          </Text>
          <Text className="text-[12px] text-text-secondary font-jost">{lang === 'RU' ? 'норма 25 мин' : 'standard 25 min'}</Text>
        </View>
        <View className="bg-white rounded-[14px] border border-border p-5 gap-4">
          {ROOM_CHART_DATA.map((data, index) => {
            const norm = 25;
            const widthPct = Math.min(100, (data.minutes / 35) * 100);
            return (
              <View key={index} className="flex-row items-center gap-3.5">
                <Text className="w-11 text-text-primary font-jost text-sm">
                  {lang === 'RU' ? `№ ${data.room}` : `#${data.room}`}
                </Text>
                <View className="flex-1 h-2 bg-border/40 rounded-full overflow-hidden">
                  <View
                    className={`h-full rounded-full ${data.minutes > norm ? 'bg-error' : 'bg-primary'}`}
                    style={{ width: `${widthPct}%` }}
                  />
                </View>
                <Text className="w-12 text-right text-text-primary font-jost text-sm">
                  {data.minutes} {lang === 'RU' ? 'мин' : 'min'}
                </Text>
              </View>
            );
          })}
        </View>
      </View>

      <View className="gap-2">
        <Text className="text-[12px] text-text-secondary font-jost tracking-widest uppercase px-1">
          {lang === 'RU' ? 'ИСТОРИЯ СМЕН' : 'SHIFT HISTORY'}
        </Text>
        <View className="bg-white rounded-[14px] border border-border overflow-hidden">
          {mockShiftHistory.map((item, i) => {
            const isExpanded = expandedShiftId === item.id;
            return (
              <View key={item.id} className={i < mockShiftHistory.length - 1 ? 'border-b border-border-light' : ''}>
                <Pressable
                  onPress={() => setExpandedShiftId(isExpanded ? null : item.id)}
                  className="p-4 flex-row items-center justify-between active:bg-background"
                >
                  <View className="gap-0.5">
                    <Text className="text-sm font-jost text-text-primary">{item.date}</Text>
                    <Text className="text-[12px] text-text-secondary font-jost">
                      {lang === 'RU' ? `${item.roomsCleaned} номеров` : `${item.roomsCleaned} rooms`}
                    </Text>
                  </View>
                  <ChevronRight size={16} color="#8A8177" style={{ transform: [{ rotate: isExpanded ? '90deg' : '0deg' }] }} />
                </Pressable>

                {isExpanded && (
                  <View className="px-4 pb-4 pt-1 bg-background-subtle gap-3.5">
                    <View className="flex-row gap-2 pt-3">
                      <View className="flex-1">
                        <Text className="text-[11px] uppercase tracking-wider text-text-secondary mb-0.5">
                          {lang === 'RU' ? 'Качество' : 'Quality'}
                        </Text>
                        <Text className="font-jost-semibold text-text-primary text-sm">{item.qualityScore}%</Text>
                      </View>
                      <View className="flex-1">
                        <Text className="text-[11px] uppercase tracking-wider text-text-secondary mb-0.5">
                          {lang === 'RU' ? 'Комнат' : 'Rooms'}
                        </Text>
                        <Text className="font-jost-semibold text-text-primary text-sm">{item.roomsCleaned}</Text>
                      </View>
                      <View className="flex-1">
                        <Text className="text-[11px] uppercase tracking-wider text-text-secondary mb-0.5">
                          {lang === 'RU' ? 'Часов' : 'Hours'}
                        </Text>
                        <Text className="font-jost-semibold text-text-primary text-sm">
                          {item.hoursWorked} {lang === 'RU' ? 'ч.' : 'hrs'}
                        </Text>
                      </View>
                    </View>
                    {!!item.notes && (
                      <View className="bg-background p-3 rounded-xl border border-border">
                        <Text className="text-[12px] text-text-secondary italic font-jost">
                          "{lang === 'RU' ? item.notesRu : item.notes}"
                        </Text>
                      </View>
                    )}
                  </View>
                )}
              </View>
            );
          })}
        </View>
      </View>
    </ScrollView>
  );
}
