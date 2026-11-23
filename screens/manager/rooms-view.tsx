import React, { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Dimensions, Pressable, RefreshControl, ScrollView, Text, View } from 'react-native';
import { ChevronDown } from 'lucide-react-native';
import { useApp } from '@/context/app-store';
import { useReception, type ReceptionBooking, type ReceptionRoom } from '@/context/reception-store';
import { SelectField } from '@/components/ui/select-field';
import { PeriodBar, type PeriodValue } from '@/components/manager/period-bar';
import { rangeForMode, todayIso } from '@/components/manager/manager-utils';
import { EmptyCard, FieldLabel, SearchInput } from '@/components/manager/finance-ui';
import { FilterButton } from '@/screens/manager/services-view';
import {
  addDaysIso,
  bookingRangeText,
  diffDays,
  dowLabel,
  guestsText,
  isVisibleStatus,
  nightsText,
  parseIso,
  type Lang,
  type VisibleStatus,
} from '@/components/reception/booking-utils';

// Design ManagerScreens → Бронирования → Брони: sub-tabs Шахматка / Список, search + filter
// button, filters (Категория / Гостей / Статус и источник), the analytics period row, status
// legend, then the chessboard card or the booking cards.

// Design palette for booking statuses (differs from the front desk's).
const STATUS: Record<VisibleStatus, { ru: string; en: string; dot: string; barBg: string; badgeBg: string; badgeText: string }> = {
  NEW: { ru: 'Новая', en: 'New', dot: '#E89234', barBg: '#FDF3E3', badgeBg: '#FDF3E3', badgeText: '#B87A28' },
  CONFIRMED: { ru: 'Подтверждена', en: 'Confirmed', dot: '#3D7C52', barBg: '#EAF3EC', badgeBg: '#EAF3EC', badgeText: '#3D7C52' },
  CHECKED_IN: { ru: 'Заселён', en: 'Checked in', dot: '#C2410C', barBg: '#FDF0EB', badgeBg: '#FDF0EB', badgeText: '#C2410C' },
  CHECKED_OUT: { ru: 'Выехал', en: 'Checked out', dot: '#8A8177', barBg: '#F1EFEA', badgeBg: '#F1EFEA', badgeText: '#6E665E' },
};
const ORDER: VisibleStatus[] = ['NEW', 'CONFIRMED', 'CHECKED_IN', 'CHECKED_OUT'];

const ROOM_COL = 110;
const MIN_DAY_COL = 64;

type VisibleBooking = ReceptionBooking & { status: VisibleStatus };

export function ManagerRoomsView({ onOpenBooking }: { onOpenBooking: (b: ReceptionBooking) => void }) {
  const { lang } = useApp();
  const ru = lang === 'RU';
  const t = (r: string, e: string) => (ru ? r : e);
  const { rooms, bookings, loading, error, refresh, setPeriod: setStorePeriod } = useReception();

  const [sub, setSub] = useState<'CHESS' | 'LIST'>('CHESS');
  const [search, setSearch] = useState('');
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [category, setCategory] = useState('ALL');
  const [guests, setGuests] = useState('ALL');
  const [status, setStatus] = useState('ALL');
  const [refreshing, setRefreshing] = useState(false);
  const [period, setPeriod] = useState<PeriodValue>(() => {
    const [start, end] = rangeForMode(todayIso(), 'WEEK');
    return { mode: 'WEEK', start, end };
  });

  // The board loads [from, to) — the selected period plus its last day.
  useEffect(() => {
    setStorePeriod(period.start, addDaysIso(period.end, 1));
  }, [period.start, period.end, setStorePeriod]);

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      await refresh();
    } finally {
      setRefreshing(false);
    }
  };

  const categories = useMemo(() => [...new Set(rooms.map((r) => r.category).filter(Boolean))], [rooms]);
  const filtersActive = category !== 'ALL' || guests !== 'ALL' || status !== 'ALL';

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return bookings
      .filter((b): b is VisibleBooking => isVisibleStatus(b.status))
      .filter((b) => b.checkIn <= period.end && b.checkOut > period.start)
      .filter((b) => category === 'ALL' || b.category === category)
      .filter((b) => guests === 'ALL' || (guests === '4' ? b.guestsCount >= 4 : b.guestsCount === Number(guests)))
      .filter((b) => status === 'ALL' || b.status === status)
      .filter((b) => !q || [b.guestName, b.phone, b.bookingNumber, `#${b.bookingNumber}`].some((v) => v.toLowerCase().includes(q)))
      .sort((a, b) => a.checkIn.localeCompare(b.checkIn) || a.roomNumber.localeCompare(b.roomNumber, undefined, { numeric: true }));
  }, [bookings, period.start, period.end, category, guests, status, search]);

  return (
    <View className="flex-1">
      <View className="px-5 pt-1 pb-3 flex-row items-center gap-6 border-b border-border/70">
        {(['CHESS', 'LIST'] as const).map((id) => {
          const active = sub === id;
          return (
            <Pressable key={id} onPress={() => setSub(id)} className="pb-2" style={{ borderBottomWidth: 2, borderBottomColor: active ? '#C2410C' : 'transparent' }}>
              <Text className={`text-xs ${active ? 'text-primary font-jost-medium' : 'text-text-secondary font-jost'}`}>
                {id === 'CHESS' ? t('Шахматка', 'Chessboard') : t('Список', 'List')}
              </Text>
            </Pressable>
          );
        })}
      </View>

      <ScrollView
        className="flex-1"
        contentContainerClassName="px-5 py-3.5 gap-3.5"
        keyboardShouldPersistTaps="handled"
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        <View className="flex-row items-center gap-2">
          <View className="flex-1">
            <SearchInput value={search} onChangeText={setSearch} placeholder={t('Гость, телефон или № брони', 'Guest, phone or booking #')} />
          </View>
          <FilterButton active={filtersOpen || filtersActive} onPress={() => setFiltersOpen((v) => !v)} />
        </View>

        {filtersOpen && (
          <View className="p-3.5 bg-white border border-border rounded-2xl gap-3">
            <View className="flex-row gap-2.5">
              <View className="flex-1">
                <FieldLabel>{t('Категория', 'Category')}</FieldLabel>
                <SelectField
                  variant="soft"
                  value={category}
                  onChange={setCategory}
                  options={[{ value: 'ALL', label: t('Все категории', 'All categories') }, ...categories.map((c) => ({ value: c, label: c }))]}
                />
              </View>
              <View className="flex-1">
                <FieldLabel>{t('Гостей', 'Guests')}</FieldLabel>
                <SelectField
                  variant="soft"
                  value={guests}
                  onChange={setGuests}
                  options={[
                    { value: 'ALL', label: t('Любое количество', 'Any number') },
                    { value: '1', label: t('1 гость', '1 guest') },
                    { value: '2', label: t('2 гостя', '2 guests') },
                    { value: '3', label: t('3 гостя', '3 guests') },
                    { value: '4', label: t('4+ гостей', '4+ guests') },
                  ]}
                />
              </View>
            </View>
            <View>
              <FieldLabel>{t('Статус и источник', 'Status & source')}</FieldLabel>
              <SelectField
                variant="soft"
                value={status}
                onChange={setStatus}
                options={[{ value: 'ALL', label: t('Все статусы', 'All statuses') }, ...ORDER.map((s) => ({ value: s, label: ru ? STATUS[s].ru : STATUS[s].en }))]}
              />
            </View>
            {filtersActive && (
              <View className="pt-1 items-end">
                <Pressable
                  hitSlop={6}
                  onPress={() => {
                    setCategory('ALL');
                    setGuests('ALL');
                    setStatus('ALL');
                  }}
                  className="active:opacity-60"
                >
                  <Text className="text-xs font-jost text-primary">{t('Сбросить фильтры', 'Reset filters')}</Text>
                </Pressable>
              </View>
            )}
          </View>
        )}

        <PeriodBar lang={lang} value={period} onChange={setPeriod} />

        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerClassName="gap-3.5" className="grow-0">
          {ORDER.map((s) => (
            <View key={s} className="flex-row items-center gap-1.5">
              <View className="h-2 w-2 rounded-full" style={{ backgroundColor: STATUS[s].dot }} />
              <Text className="text-[11px] font-jost text-text-secondary">{ru ? STATUS[s].ru : STATUS[s].en}</Text>
            </View>
          ))}
        </ScrollView>

        {loading && !rooms.length ? (
          <View className="py-16 items-center">
            <ActivityIndicator color="#C2410C" />
          </View>
        ) : error && !rooms.length ? (
          <View className="py-12 items-center gap-3">
            <Text className="text-sm font-jost text-text-secondary text-center">{t('Не удалось загрузить брони', 'Failed to load bookings')}</Text>
            <Text className="text-xs font-jost text-text-muted text-center">{error}</Text>
            <Pressable onPress={refresh} className="px-4 py-2 rounded-xl border border-border bg-white active:bg-background">
              <Text className="text-xs font-jost-medium text-text-primary">{t('Повторить', 'Retry')}</Text>
            </Pressable>
          </View>
        ) : sub === 'CHESS' ? (
          <Chessboard lang={lang} rooms={rooms} bookings={filtered} category={category} start={period.start} end={period.end} onOpen={onOpenBooking} />
        ) : filtered.length === 0 ? (
          <EmptyCard text={t('Бронирований по заданным параметрам не найдено', 'No bookings match the filters')} />
        ) : (
          filtered.map((b) => <BookingCard key={b.id} lang={lang} booking={b} onPress={() => onOpenBooking(b)} />)
        )}
      </ScrollView>
    </View>
  );
}

function BookingCard({ lang, booking: b, onPress }: { lang: Lang; booking: VisibleBooking; onPress: () => void }) {
  const s = STATUS[b.status];
  return (
    <Pressable onPress={onPress} className="bg-white rounded-2xl border border-border p-4 gap-2 active:opacity-80">
      <View className="flex-row items-start justify-between gap-2">
        <Text className="flex-1 text-sm font-jost-medium text-text-primary">{b.guestName}</Text>
        <View className="px-2.5 py-0.5 rounded-md" style={{ backgroundColor: s.badgeBg }}>
          <Text className="text-xs font-jost-medium" style={{ color: s.badgeText }}>
            {lang === 'RU' ? s.ru : s.en}
          </Text>
        </View>
      </View>
      <Text className="text-xs font-jost text-text-secondary">
        {[b.roomNumber ? `№${b.roomNumber}` : '', b.category, guestsText(b.guestsCount, lang)].filter(Boolean).join(' · ')}
      </Text>
      <View className="flex-row items-center justify-between pt-1">
        <Text className="text-xs font-jost text-text-primary">{bookingRangeText(b.checkIn, b.checkOut, lang)}</Text>
        <View className="flex-row items-center gap-1">
          <Text className="text-xs font-jost text-text-secondary">{nightsText(b.nights, lang)}</Text>
          <ChevronDown size={14} color="#8A8177" />
        </View>
      </View>
    </Pressable>
  );
}

function Chessboard({
  lang,
  rooms,
  bookings,
  category,
  start,
  end,
  onOpen,
}: {
  lang: Lang;
  rooms: ReceptionRoom[];
  bookings: VisibleBooking[];
  category: string;
  start: string;
  end: string;
  onOpen: (b: ReceptionBooking) => void;
}) {
  const ru = lang === 'RU';
  const today = todayIso();
  const dayCount = Math.max(1, diffDays(start, end) + 1);
  const days = useMemo(() => Array.from({ length: dayCount }, (_, i) => addDaysIso(start, i)), [start, dayCount]);
  // Card width = screen − page gutters; short periods stretch to fill it, long ones scroll.
  const cardWidth = Dimensions.get('window').width - 40 - 2;
  const dayW = Math.max(MIN_DAY_COL, (cardWidth - ROOM_COL) / dayCount);
  const width = ROOM_COL + dayW * dayCount;

  const groups = useMemo(() => {
    const map = new Map<string, ReceptionRoom[]>();
    rooms.forEach((r) => {
      if (category !== 'ALL' && r.category !== category) return;
      const list = map.get(r.category) ?? [];
      list.push(r);
      map.set(r.category, list);
    });
    return [...map.entries()];
  }, [rooms, category]);

  const byRoom = useMemo(() => {
    const map = new Map<string, VisibleBooking[]>();
    bookings.forEach((b) => {
      const list = map.get(b.roomId) ?? [];
      list.push(b);
      map.set(b.roomId, list);
    });
    return map;
  }, [bookings]);

  return (
    <View className="bg-white rounded-2xl border border-border overflow-hidden">
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <View style={{ width }}>
          <View className="flex-row border-b border-border bg-background">
            <View style={{ width: ROOM_COL }} className="p-3 justify-center">
              <Text className="text-xs font-jost-medium text-text-primary">{ru ? 'Номер' : 'Room'}</Text>
            </View>
            {days.map((d) => (
              <View key={d} style={{ width: dayW, backgroundColor: d === today ? '#F5EFE6' : undefined }} className="p-2.5 border-l border-border items-center">
                <Text className="text-[10px] font-jost text-text-secondary">{dowLabel(d, lang)}</Text>
                <Text className="text-sm font-jost-medium text-text-primary mt-0.5">{parseIso(d).getDate()}</Text>
              </View>
            ))}
          </View>

          {groups.map(([cat, list]) => (
            <View key={cat}>
              <View className="px-3.5 py-1.5 border-t border-border" style={{ backgroundColor: 'rgba(250,247,243,0.7)' }}>
                <Text className="text-[11px] font-jost-medium text-text-secondary">{cat}</Text>
              </View>
              {list.map((room) => (
                <RoomRow key={room.id} lang={lang} room={room} days={days} dayW={dayW} today={today} start={start} bookings={byRoom.get(room.id) ?? []} onOpen={onOpen} />
              ))}
            </View>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

function RoomRow({
  lang,
  room,
  days,
  dayW,
  today,
  start,
  bookings,
  onOpen,
}: {
  lang: Lang;
  room: ReceptionRoom;
  days: string[];
  dayW: number;
  today: string;
  start: string;
  bookings: VisibleBooking[];
  onOpen: (b: ReceptionBooking) => void;
}) {
  const ru = lang === 'RU';
  const clean = room.cleanStatus === 'CLEAN';
  const meta = [room.floor !== null ? (ru ? `${room.floor} этаж` : `Floor ${room.floor}`) : '', room.capacity ? guestsText(room.capacity, lang) : '']
    .filter(Boolean)
    .join(' · ');

  return (
    <View className="flex-row border-b border-border/60" style={{ minHeight: 64 }}>
      <View style={{ width: ROOM_COL }} className="p-2.5 justify-between border-r border-border bg-white gap-1">
        <View>
          <Text className="text-xs font-jost-medium text-text-primary">№{room.number}</Text>
          {!!meta && <Text className="text-[9px] font-jost text-text-secondary mt-0.5">{meta}</Text>}
        </View>
        <View className="self-start px-1.5 py-0.5 rounded" style={{ backgroundColor: clean ? '#EBF4EE' : '#FDF0EB' }}>
          <Text className="text-[9px] font-jost-medium" style={{ color: clean ? '#3D7C52' : '#C2410C' }}>
            {clean ? (ru ? 'Чистая' : 'Clean') : ru ? 'Грязная' : 'Dirty'}
          </Text>
        </View>
      </View>
      {days.map((d) => (
        <View key={d} style={{ width: dayW, backgroundColor: d === today ? 'rgba(245,239,230,0.3)' : undefined }} className="border-r border-border/40" />
      ))}
      {bookings.map((b) => {
        const startCol = Math.max(0, diffDays(start, b.checkIn));
        const endCol = Math.min(days.length, diffDays(start, b.checkOut));
        const span = Math.max(1, endCol - startCol);
        const s = STATUS[b.status];
        return (
          <Pressable
            key={b.id}
            onPress={() => onOpen(b)}
            className="absolute rounded-xl p-2 justify-between active:opacity-80"
            style={{
              top: 8,
              bottom: 8,
              left: ROOM_COL + startCol * dayW + 3,
              width: span * dayW - 6,
              backgroundColor: s.barBg,
              borderLeftWidth: 4,
              borderLeftColor: s.dot,
            }}
          >
            <Text className="text-xs font-jost-medium text-text-primary" numberOfLines={1}>
              {b.shortName || b.guestName}
            </Text>
            <Text className="text-[10px] font-jost text-text-secondary" numberOfLines={1}>
              {ru ? s.ru : s.en}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}
