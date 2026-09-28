import React from 'react';
import { View, Text, ScrollView, Pressable, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { BarChart3, ChevronRight } from 'lucide-react-native';
import { MaintenanceCategory } from '@/types';
import { getTranslation } from '@/lib/locales';
import { useApp } from '@/context/app-store';

const NORM_MINUTES = 25;

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

function getInitials(name: string) {
  return name.split(' ').filter(Boolean).map((n) => n[0]).slice(0, 2).join('').toUpperCase() || '?';
}

type ShiftEvent = { id: string; kind: 'rejected' | 'overdue' | 'blocked'; roomNumber: string; title: string; subtitle: string; timestamp: string };

export function ReportsScreen() {
  const { lang, rooms, staffList, cleanerProfile, rejectedInspections, maintenanceRequests } = useApp();
  const t = getTranslation(lang);
  const router = useRouter();

  const getCategoryLabel = (cat: MaintenanceCategory) => {
    switch (cat) {
      case 'PLUMBING': return t.categoryPlumbing;
      case 'ELECTRICAL': return t.categoryElectrical;
      case 'FURNITURE': return t.categoryFurniture;
      case 'APPLIANCES': return t.categoryAppliances;
      case 'CLEANLINESS': return t.categoryCleanliness;
      default: return t.categoryOther;
    }
  };

  const shift = cleanerProfile.currentShift;
  const verifiedCount = rooms.filter((r) => r.status === 'VERIFIED').length;
  const acceptedFirstTry = verifiedCount + rejectedInspections.length > 0
    ? Math.round((verifiedCount / (verifiedCount + rejectedInspections.length)) * 100)
    : 100;

  const roomDurations = rooms
    .filter((r) => (r.status === 'READY' || r.status === 'VERIFIED') && r.startTime && r.endTime)
    .map((r) => ({ room: r.roomNumber, minutes: minutesBetweenClock(r.startTime as string, r.endTime as string) }));
  const maxDurationMinutes = Math.max(NORM_MINUTES + 10, ...roomDurations.map((d) => d.minutes));

  const byStaff: Record<string, { total: number; verified: number; minutesSum: number; minutesCount: number; deviations: number }> = {};
  rooms.forEach((r) => {
    if (!r.assignedTo) return;
    if (!byStaff[r.assignedTo]) byStaff[r.assignedTo] = { total: 0, verified: 0, minutesSum: 0, minutesCount: 0, deviations: 0 };
    const stat = byStaff[r.assignedTo];
    stat.total += 1;
    if (r.status === 'VERIFIED') stat.verified += 1;
    if (r.startTime && r.endTime) {
      stat.minutesSum += minutesBetweenClock(r.startTime, r.endTime);
      stat.minutesCount += 1;
    }
  });
  rejectedInspections.forEach((item) => {
    if (!item.assignedTo) return;
    if (!byStaff[item.assignedTo]) byStaff[item.assignedTo] = { total: 0, verified: 0, minutesSum: 0, minutesCount: 0, deviations: 0 };
    byStaff[item.assignedTo].deviations += 1;
  });

  const events: ShiftEvent[] = [
    ...rejectedInspections.map((item) => ({
      id: `rej-${item.id}`,
      kind: 'rejected' as const,
      roomNumber: item.roomNumber,
      title: lang === 'RU' ? `№ ${item.roomNumber} отклонён при проверке` : `Room ${item.roomNumber} rejected at inspection`,
      subtitle: [item.assignedTo, item.note].filter(Boolean).join(' · '),
      timestamp: item.timestamp,
    })),
    ...maintenanceRequests
      .filter((req) => req.blocksCleaning && req.status !== 'RESOLVED')
      .map((req) => ({
        id: `block-${req.id}`,
        kind: 'blocked' as const,
        roomNumber: req.roomNumber,
        title: lang === 'RU' ? `№ ${req.roomNumber} заблокирован` : `Room ${req.roomNumber} blocked`,
        subtitle: `${lang === 'RU' ? 'Заявка в техслужбу' : 'Maintenance ticket'} · ${getCategoryLabel(req.category)}`,
        timestamp: req.timestamp.split(',')[0],
      })),
    ...roomDurations
      .filter((d) => d.minutes > NORM_MINUTES)
      .map((d) => {
        const room = rooms.find((r) => r.roomNumber === d.room);
        return {
          id: `overdue-${d.room}`,
          kind: 'overdue' as const,
          roomNumber: d.room,
          title: lang === 'RU' ? `№ ${d.room} просрочен` : `Room ${d.room} overdue`,
          subtitle: [room?.assignedTo, `+${d.minutes - NORM_MINUTES} ${lang === 'RU' ? 'мин к нормативу' : 'min over norm'}`].filter(Boolean).join(' · '),
          timestamp: room?.endTime || '',
        };
      }),
  ].sort((a, b) => b.timestamp.localeCompare(a.timestamp));

  const eventDotColor = (kind: ShiftEvent['kind']) => (kind === 'blocked' ? '#C2410C' : '#B3261E');

  const notAvailable = () =>
    Alert.alert(
      lang === 'RU' ? 'Недоступно' : 'Not available',
      lang === 'RU' ? 'Действие пока недоступно в демо-режиме.' : 'This action is not wired up yet in demo mode.'
    );

  return (
    <ScrollView className="flex-1 bg-background" contentContainerStyle={{ padding: 20, gap: 20 }}>
      <Text className="text-sm font-jost text-text-secondary">
        {shift.shiftNumber} · {shift.date} · {lang === 'RU' ? 'с' : 'from'} {shift.startTime}
      </Text>

      <View className="gap-2">
        <Text className="text-[12px] text-text-secondary font-jost tracking-widest uppercase px-1">
          {lang === 'RU' ? 'ИТОГИ СМЕНЫ' : 'SHIFT SUMMARY'}
        </Text>
        <View className="bg-white rounded-[14px] border border-border p-4 flex-row">
          <View className="flex-1 items-center gap-1">
            <Text className="text-sm text-text-secondary">
              <Text className="text-xl font-jost-semibold text-text-primary">{shift.roomsCompleted}</Text> / {shift.roomsTotal}
            </Text>
            <Text className="text-[12px] font-jost text-text-secondary">{lang === 'RU' ? 'сдано' : 'submitted'}</Text>
          </View>
          <View className="flex-1 items-center gap-1 border-l border-border-light">
            <Text className="text-sm text-text-secondary">
              <Text className="text-xl font-jost-semibold text-text-primary">{shift.avgTimePerRoom.replace(/[^0-9]/g, '') || '—'}</Text>{' '}
              {lang === 'RU' ? 'мин' : 'min'}
            </Text>
            <Text className="text-[12px] font-jost text-text-secondary">{lang === 'RU' ? 'в среднем' : 'average'}</Text>
          </View>
          <View className="flex-1 items-center gap-1 border-l border-border-light">
            <Text className="text-sm text-text-secondary">
              <Text className="text-xl font-jost-semibold text-text-primary">{acceptedFirstTry}</Text>%
            </Text>
            <Text className="text-[12px] font-jost text-text-secondary">{lang === 'RU' ? 'принято сразу' : 'accepted first try'}</Text>
          </View>
        </View>
      </View>

      <View className="gap-2">
        <Text className="text-[12px] text-text-secondary font-jost tracking-widest uppercase px-1">
          {lang === 'RU' ? 'ПО СОТРУДНИКАМ' : 'BY STAFF'}
        </Text>
        <View className="bg-white rounded-[14px] border border-border overflow-hidden">
          {Object.entries(byStaff).map(([name, stats], i) => {
            const avgMinutes = stats.minutesCount > 0 ? Math.round(stats.minutesSum / stats.minutesCount) : null;
            return (
              <Pressable
                key={name}
                onPress={() => {
                  const staffId = staffList.find((s) => s.fullName === name)?.id;
                  router.push(staffId ? `/staff-member/${encodeURIComponent(staffId)}` : '/profile/staff');
                }}
                className={`p-3.5 flex-row items-center gap-3 active:bg-background ${i > 0 ? 'border-t border-border-light' : ''}`}
              >
                <View className="h-10 w-10 rounded-full bg-primary-light items-center justify-center border border-border">
                  <Text className="text-text-primary font-jost text-sm">{getInitials(name)}</Text>
                </View>
                <View className="flex-1 min-w-0">
                  <View className="flex-row items-center gap-1.5">
                    <Text className="text-sm font-jost-semibold text-text-primary">{name}</Text>
                    <Text className="text-sm font-jost text-text-secondary">{stats.verified} {lang === 'RU' ? 'из' : 'of'} {stats.total}</Text>
                  </View>
                  <Text className="text-[13px] font-jost text-text-secondary mt-0.5" numberOfLines={1}>
                    {avgMinutes !== null ? `${avgMinutes} ${lang === 'RU' ? 'мин на номер' : 'min per room'} · ` : ''}
                    {stats.deviations > 0 ? (
                      <Text className="text-error">
                        {stats.deviations} {lang === 'RU' ? 'отклонение' : 'deviation'}{stats.deviations > 1 ? (lang === 'RU' ? 'й' : 's') : ''}
                      </Text>
                    ) : (
                      lang === 'RU' ? 'без отклонений' : 'no deviations'
                    )}
                  </Text>
                </View>
                <ChevronRight size={16} color="#8A8177" />
              </Pressable>
            );
          })}
          {Object.keys(byStaff).length === 0 && (
            <Text className="text-sm font-jost text-text-secondary text-center py-4">
              {lang === 'RU' ? 'Пока нет данных' : 'No data yet'}
            </Text>
          )}
        </View>
      </View>

      <View className="gap-2">
        <View className="flex-row items-center justify-between px-1">
          <Text className="text-[12px] text-text-secondary font-jost tracking-widest uppercase">
            {lang === 'RU' ? 'ДЛИТЕЛЬНОСТЬ ПО НОМЕРАМ' : 'DURATION BY ROOM'}
          </Text>
          <Text className="text-[12px] text-text-secondary font-jost">{lang === 'RU' ? `норма ${NORM_MINUTES} мин` : `standard ${NORM_MINUTES} min`}</Text>
        </View>
        <View className="bg-white rounded-[14px] border border-border p-5 gap-4">
          {roomDurations.length === 0 ? (
            <View className="items-center py-4 gap-2">
              <BarChart3 size={22} color="#8A8177" />
              <Text className="text-[12px] font-jost text-text-secondary text-center">
                {lang === 'RU' ? 'Пока нет завершённых номеров с этой сменой' : 'No rooms completed this shift yet'}
              </Text>
            </View>
          ) : (
            roomDurations.map((data, index) => {
              const widthPct = Math.min(100, (data.minutes / maxDurationMinutes) * 100);
              const overNorm = data.minutes > NORM_MINUTES;
              return (
                <View key={`${data.room}-${index}`} className="flex-row items-center gap-3.5">
                  <Text className="w-11 text-text-primary font-jost text-sm">
                    {lang === 'RU' ? `№ ${data.room}` : `#${data.room}`}
                  </Text>
                  <View className="flex-1 h-2 bg-border/40 rounded-full overflow-hidden">
                    <View
                      className={`h-full rounded-full ${overNorm ? 'bg-error' : 'bg-primary'}`}
                      style={{ width: `${widthPct}%` }}
                    />
                  </View>
                  <Text className={`w-12 text-right font-jost text-sm ${overNorm ? 'text-error' : 'text-text-primary'}`}>
                    {data.minutes} {lang === 'RU' ? 'мин' : 'min'}
                  </Text>
                </View>
              );
            })
          )}
        </View>
      </View>

      <View className="gap-2">
        <Text className="text-[12px] text-text-secondary font-jost tracking-widest uppercase px-1">
          {lang === 'RU' ? 'СОБЫТИЯ СМЕНЫ' : 'SHIFT EVENTS'}
        </Text>
        <View className="bg-white rounded-[14px] border border-border overflow-hidden">
          {events.map((event, i) => (
            <View key={event.id} className={`p-3.5 flex-row items-start justify-between gap-3 ${i > 0 ? 'border-t border-border-light' : ''}`}>
              <View className="h-2 w-2 rounded-full shrink-0 mt-1.5" style={{ backgroundColor: eventDotColor(event.kind) }} />
              <View className="flex-1 min-w-0">
                <Text className="text-sm font-jost-semibold text-text-primary">{event.title}</Text>
                {!!event.subtitle && (
                  <Text className="text-[13px] font-jost text-text-secondary mt-0.5" numberOfLines={1}>{event.subtitle}</Text>
                )}
              </View>
              <Text className="text-[12px] font-jost text-text-secondary shrink-0">{event.timestamp}</Text>
            </View>
          ))}
          {events.length === 0 && (
            <Text className="text-sm font-jost text-text-secondary text-center py-4">
              {lang === 'RU' ? 'Событий пока нет' : 'No events yet'}
            </Text>
          )}
        </View>
      </View>

      <View className="flex-row gap-2.5">
        <Pressable onPress={notAvailable} className="flex-1 py-3.5 rounded-xl border border-border bg-white items-center">
          <Text className="text-sm font-jost-semibold text-text-primary">{lang === 'RU' ? 'Отправить руководителю' : 'Send to manager'}</Text>
        </Pressable>
        <Pressable onPress={notAvailable} className="flex-1 py-3.5 rounded-xl bg-primary items-center active:bg-primary-hover">
          <Text className="text-sm font-jost-semibold text-white">{lang === 'RU' ? 'Выгрузить отчёт' : 'Export report'}</Text>
        </Pressable>
      </View>
    </ScrollView>
  );
}
