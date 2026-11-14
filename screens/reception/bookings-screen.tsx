import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, RefreshControl, ScrollView, Text, TextInput, View, useWindowDimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Calendar, CalendarX, ChevronLeft, ChevronRight, CircleAlert, Filter, LayoutGrid, List, Plus, Search, X } from 'lucide-react-native';
import { useApp } from '@/context/app-store';
import { type ReceptionBooking, type ReceptionRoom, toIsoDate, useReception } from '@/context/reception-store';
import { SelectField, type SelectOption } from '@/components/ui/select-field';
import { BookingChessboard, BookingDayBoard } from '@/components/reception/booking-chessboard';
import { PeriodPickerPanel, ScaleMenu } from '@/components/reception/period-picker';
import {
  type PeriodScale,
  STATUS_STYLE,
  VISIBLE_STATUSES,
  addDaysIso,
  bookingRangeText,
  diffDays,
  formatLongToday,
  formatPeriodLabel,
  guestsText,
  isVisibleStatus,
  nightsText,
  scaleOfLength,
  scaleLength,
  sourceLabel,
  statusLabel,
} from '@/components/reception/booking-utils';

type ViewMode = 'CHESS' | 'LIST';

export function ReceptionBookingsScreen() {
  const { lang } = useApp();
  const router = useRouter();
  const { rooms, bookings, period, setPeriod, loading, error, refresh } = useReception();
  const ru = lang === 'RU';

  const [viewMode, setViewMode] = useState<ViewMode>('CHESS');
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [guestsFilter, setGuestsFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [sourceFilter, setSourceFilter] = useState('ALL');
  const [showFilters, setShowFilters] = useState(false);
  const activeFiltersCount = [categoryFilter, guestsFilter, statusFilter, sourceFilter].filter((f) => f !== 'ALL').length;
  const resetFilters = () => {
    setCategoryFilter('ALL');
    setGuestsFilter('ALL');
    setStatusFilter('ALL');
    setSourceFilter('ALL');
  };
  // Period length in days: set by the scale menu or picked by hand in the period panel.
  const [dayCount, setDayCount] = useState(() => Math.max(1, diffDays(period.from, period.to)));
  const scale = scaleOfLength(dayCount);
  const [fromIso, setFromIso] = useState(period.from);
  const [showPeriodPicker, setShowPeriodPicker] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [searchBottom, setSearchBottom] = useState(0);
  const [periodBottom, setPeriodBottom] = useState(0);
  const { height: screenHeight } = useWindowDimensions();

  const todayIso = toIsoDate(new Date());
  const toIso = addDaysIso(fromIso, dayCount);

  // The store reloads itself whenever the period changes.
  useEffect(() => {
    setPeriod(fromIso, toIso);
  }, [fromIso, toIso, setPeriod]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await refresh();
    } finally {
      setRefreshing(false);
    }
  }, [refresh]);

  // ---------- filter options from real data ----------
  const categories = useMemo(() => {
    const list: string[] = [];
    for (const name of [...rooms.map((r) => r.category), ...bookings.map((b) => b.category)]) {
      if (name && name !== '—' && !list.includes(name)) list.push(name);
    }
    return list;
  }, [rooms, bookings]);

  const sources = useMemo(() => {
    const list: string[] = [];
    for (const b of bookings) if (b.source && !list.includes(b.source)) list.push(b.source);
    if (sourceFilter !== 'ALL' && !list.includes(sourceFilter)) list.push(sourceFilter);
    return list;
  }, [bookings, sourceFilter]);

  const maxGuests = useMemo(
    () => Math.min(10, Math.max(4, ...rooms.map((r) => r.capacity), ...bookings.map((b) => b.guestsCount))),
    [rooms, bookings]
  );

  const categoryOptions: SelectOption<string>[] = [
    { value: 'ALL', label: ru ? 'Все категории' : 'All categories' },
    ...categories.map((c) => ({ value: c, label: c })),
  ];
  const guestOptions: SelectOption<string>[] = [
    { value: 'ALL', label: ru ? 'Любое количество' : 'Any guests' },
    ...Array.from({ length: maxGuests }, (_, i) => ({ value: String(i + 1), label: guestsText(i + 1, lang) })),
  ];
  const statusOptions: SelectOption<string>[] = [
    { value: 'ALL', label: ru ? 'Все статусы' : 'All statuses' },
    ...VISIBLE_STATUSES.map((s) => ({ value: s, label: statusLabel(s, lang) })),
  ];
  const sourceOptions: SelectOption<string>[] = [
    { value: 'ALL', label: ru ? 'Все источники' : 'All sources' },
    ...sources.map((s) => ({ value: s, label: sourceLabel(s, lang) })),
  ];

  // ---------- filtering ----------
  const filteredBookings = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return bookings.filter((b) => {
      if (!isVisibleStatus(b.status)) return false;
      // Overlaps the period; departures on its first day still count (day view shows them).
      if (!b.checkIn || !b.checkOut || b.checkIn >= toIso || b.checkOut < fromIso) return false;
      if (categoryFilter !== 'ALL' && b.category !== categoryFilter) return false;
      if (guestsFilter !== 'ALL' && b.guestsCount !== Number(guestsFilter)) return false;
      if (statusFilter !== 'ALL' && b.status !== statusFilter) return false;
      if (sourceFilter !== 'ALL' && b.source !== sourceFilter) return false;
      if (q) {
        const hit =
          b.guestName.toLowerCase().includes(q) ||
          b.phone.toLowerCase().includes(q) ||
          b.bookingNumber.toLowerCase().includes(q) ||
          b.roomNumber.toLowerCase().includes(q);
        if (!hit) return false;
      }
      return true;
    });
  }, [bookings, searchQuery, categoryFilter, guestsFilter, statusFilter, sourceFilter, fromIso, toIso]);

  const visibleRooms = useMemo(
    () => (categoryFilter === 'ALL' ? rooms : rooms.filter((r) => r.category === categoryFilter)),
    [rooms, categoryFilter]
  );

  const listBookings = useMemo(
    () => [...filteredBookings].sort((a, b) => a.checkIn.localeCompare(b.checkIn) || a.roomNumber.localeCompare(b.roomNumber, undefined, { numeric: true })),
    [filteredBookings]
  );

  // ---------- actions ----------
  const openBooking = (booking: ReceptionBooking) => router.push(`/booking/${booking.id}`);
  const openCreate = () => router.push('/(app)/(reception)/create');

  // As in the design: a tap on a free cell (or a long-press drag over several) opens the
  // individual booking wizard prefilled with the room and dates.
  const createFromRange = (room: ReceptionRoom, checkIn: string, checkOut: string) => {
    router.navigate({ pathname: '/(app)/(reception)/create', params: { roomId: room.id, checkIn, checkOut, at: String(Date.now()) } });
  };

  const shiftPeriod = (direction: -1 | 1) => {
    setShowPeriodPicker(false);
    setFromIso((prev) => addDaysIso(prev, direction * dayCount));
  };

  const changeScale = (next: PeriodScale) => {
    setShowPeriodPicker(false);
    setDayCount(scaleLength(next));
  };

  const initialLoading = loading && rooms.length === 0 && bookings.length === 0;

  return (
    <SafeAreaView edges={['top']} className="flex-1 bg-background">
      <ScrollView
        className="flex-1"
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{ paddingBottom: 24 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {/* Wrapper is tall enough to hold the floating panels so they stay tappable on Android. */}
        <View style={{ minHeight: screenHeight }}>
        <View className="px-4 pt-3 pb-3 gap-3.5">
          {/* Header */}
          <View className="flex-row items-start justify-between">
            <View>
              <Text className="text-[28px] font-spectral text-text-primary">{ru ? 'Бронирования' : 'Bookings'}</Text>
              <Text className="text-xs font-jost text-text-secondary mt-0.5">{formatLongToday(todayIso, lang)}</Text>
            </View>
            <Pressable onPress={openCreate} className="h-11 w-11 rounded-[14px] bg-primary items-center justify-center active:bg-primary-hover">
              <Plus size={20} color="#FFFFFF" strokeWidth={2.2} />
            </Pressable>
          </View>

          {/* Шахматка | Список */}
          <View className="bg-[#EBE6DF] p-1 rounded-[14px] flex-row gap-1">
            {(
              [
                { id: 'CHESS', icon: LayoutGrid, label: ru ? 'Шахматка' : 'Grid' },
                { id: 'LIST', icon: List, label: ru ? 'Список' : 'List' },
              ] as const
            ).map(({ id, icon: Icon, label }) => {
              const active = viewMode === id;
              return (
                <Pressable
                  key={id}
                  onPress={() => setViewMode(id)}
                  className={`flex-1 py-2.5 rounded-[11px] flex-row items-center justify-center gap-2 ${active ? 'bg-dark' : 'active:bg-black/5'}`}
                >
                  <Icon size={14} color={active ? '#FFFFFF' : '#241E1A'} />
                  <Text className={`text-xs ${active ? 'text-white font-jost-medium' : 'text-text-primary font-jost'}`}>{label}</Text>
                </Pressable>
              );
            })}
          </View>

          {/* Search */}
          <View
            onLayout={(e) => setSearchBottom(e.nativeEvent.layout.y + e.nativeEvent.layout.height)}
            className="bg-white border border-border rounded-[14px] px-3.5 flex-row items-center gap-2.5"
          >
            <Search size={16} color="#8A8177" />
            <TextInput
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholder={ru ? 'Гость, телефон или № брони' : 'Guest, phone or booking #'}
              placeholderTextColor="#8A8177"
              autoCorrect={false}
              className="flex-1 py-3 text-[13px] font-jost text-text-primary"
            />
            {searchQuery.length > 0 && (
              <Pressable onPress={() => setSearchQuery('')} hitSlop={8} className="active:opacity-60">
                <X size={14} color="#8A8177" />
              </Pressable>
            )}
            {/* Filter button at the end of the search field, with the active-filter count */}
            <Pressable
              onPress={() => setShowFilters((v) => !v)}
              hitSlop={6}
              className={`h-7 w-7 rounded-[10px] items-center justify-center ${
                showFilters || activeFiltersCount > 0 ? 'bg-[#FAF2E6] border border-[#E6B89C]' : ''
              }`}
            >
              <Filter size={14} color={showFilters || activeFiltersCount > 0 ? '#C2410C' : '#8A8177'} />
              {activeFiltersCount > 0 && (
                <View className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-primary items-center justify-center">
                  <Text className="text-[9px] font-jost-semibold text-white">{activeFiltersCount}</Text>
                </View>
              )}
            </Pressable>
          </View>

          {/* Period row */}
          <View
            onLayout={(e) => setPeriodBottom(e.nativeEvent.layout.y + e.nativeEvent.layout.height)}
            className="flex-row items-center justify-between pt-1"
          >
            <Pressable
              onPress={() => setShowPeriodPicker((v) => !v)}
              className="flex-row items-center gap-2 py-1 px-1.5 -ml-1.5 rounded-lg active:bg-black/5"
            >
              <Calendar size={16} color="#C2410C" />
              <Text className="text-sm font-jost-medium text-text-primary">{formatPeriodLabel(fromIso, dayCount, lang)}</Text>
            </Pressable>
            <View className="flex-row items-center gap-2">
              <ScaleMenu lang={lang} value={scale} days={dayCount} onChange={changeScale} />
              <Pressable onPress={() => shiftPeriod(-1)} hitSlop={6} className="p-1 active:opacity-60">
                <ChevronLeft size={16} color="#241E1A" />
              </Pressable>
              <Pressable onPress={() => shiftPeriod(1)} hitSlop={6} className="p-1 active:opacity-60">
                <ChevronRight size={16} color="#241E1A" />
              </Pressable>
            </View>
          </View>

          {/* Legend */}
          {viewMode === 'CHESS' && (
            <View className="flex-row flex-wrap items-center gap-x-3.5 gap-y-1">
              {VISIBLE_STATUSES.map((s) => (
                <View key={s} className="flex-row items-center gap-1.5">
                  <View className="h-2 w-2 rounded-full" style={{ backgroundColor: STATUS_STYLE[s].dot }} />
                  <Text className="text-[11px] font-jost text-text-secondary">{statusLabel(s, lang)}</Text>
                </View>
              ))}
            </View>
          )}

          {error && (
            <Pressable onPress={onRefresh} className="bg-error-light border border-[#F2D6D4] rounded-[14px] px-3.5 py-3 flex-row items-center gap-2.5">
              <CircleAlert size={16} color="#B3261E" />
              <View className="flex-1">
                <Text className="text-xs font-jost-medium text-error-text">{ru ? 'Не удалось загрузить брони' : 'Could not load bookings'}</Text>
                <Text className="text-[11px] font-jost text-text-secondary mt-0.5" numberOfLines={2}>
                  {ru ? 'Потяните вниз или нажмите, чтобы повторить' : 'Pull down or tap to retry'}
                </Text>
              </View>
            </Pressable>
          )}
        </View>

        {initialLoading ? (
          <View className="py-16 items-center">
            <ActivityIndicator color="#C2410C" />
          </View>
        ) : viewMode === 'LIST' ? (
          <View className="px-4 gap-2.5">
            <View className="flex-row items-center justify-between py-1">
              <Text className="text-xs font-jost text-text-secondary">{ru ? 'Брони за выбранный период' : 'Bookings in this period'}</Text>
              <Text className="text-xs font-jost-medium text-text-primary">{listBookings.length}</Text>
            </View>

            {listBookings.length === 0 ? (
              <EmptyState
                title={ru ? 'Броней нет' : 'No bookings'}
                text={
                  bookings.length === 0
                    ? ru ? 'За выбранный период бронирований нет' : 'There are no bookings for this period'
                    : ru ? 'Ничего не найдено по заданным фильтрам' : 'Nothing matches the current filters'
                }
                actionLabel={ru ? 'Создать бронь' : 'Create booking'}
                onAction={openCreate}
              />
            ) : (
              listBookings.map((b) => <BookingCard key={b.id} booking={b} lang={lang} onPress={() => openBooking(b)} />)
            )}
          </View>
        ) : visibleRooms.length === 0 ? (
          <View className="px-4">
            <EmptyState
              title={ru ? 'Номеров нет' : 'No rooms'}
              text={ru ? 'В этой категории нет номеров' : 'There are no rooms in this category'}
            />
          </View>
        ) : dayCount === 1 ? (
          <BookingDayBoard
            lang={lang}
            rooms={visibleRooms}
            bookings={filteredBookings}
            fromIso={fromIso}
            onPressBooking={openBooking}
            onSelectRange={createFromRange}
          />
        ) : (
          <>
            <BookingChessboard
              lang={lang}
              rooms={visibleRooms}
              bookings={filteredBookings}
              fromIso={fromIso}
              dayCount={dayCount}
              todayIso={todayIso}
              onPressBooking={openBooking}
              onSelectRange={createFromRange}
            />
            {filteredBookings.length === 0 && (
              <Text className="px-4 pt-3 text-xs font-jost text-text-secondary text-center">
                {bookings.length === 0
                  ? ru ? 'За выбранный период бронирований нет. Нажмите на свободную ячейку или зажмите и протяните, чтобы создать бронь.' : 'No bookings for this period. Tap a free cell, or long-press and drag, to create one.'
                  : ru ? 'Ничего не найдено по заданным фильтрам' : 'Nothing matches the current filters'}
              </Text>
            )}
          </>
        )}

          {/* Floating panels over the content, as in the design; a tap outside closes them. */}
          {(showFilters || showPeriodPicker) && (
            <Pressable
              className="absolute inset-0"
              style={{ zIndex: 10, elevation: 7 }}
              onPress={() => {
                setShowFilters(false);
                setShowPeriodPicker(false);
              }}
            />
          )}
          {showFilters && (
            <View className="absolute left-4 right-4" style={{ top: searchBottom + 8, zIndex: 11, elevation: 8 }}>
              <View className="bg-white border border-border rounded-[16px] p-3.5 gap-3" style={{ shadowColor: '#000', shadowOpacity: 0.12, shadowRadius: 16, shadowOffset: { width: 0, height: 6 }, elevation: 8 }}>
                <View className="flex-row items-center justify-between">
                  <Text className="text-xs font-jost-medium text-text-primary">{ru ? 'Фильтры' : 'Filters'}</Text>
                  <View className="flex-row items-center gap-3">
                    {activeFiltersCount > 0 && (
                      <Pressable onPress={resetFilters} hitSlop={6} className="active:opacity-60">
                        <Text className="text-[11px] font-jost text-primary">{ru ? 'Сбросить' : 'Reset'}</Text>
                      </Pressable>
                    )}
                    <Pressable onPress={() => setShowFilters(false)} hitSlop={8} className="active:opacity-60">
                      <X size={14} color="#8A8177" />
                    </Pressable>
                  </View>
                </View>
                <View className="gap-2">
                  <View className="flex-row gap-2">
                    <SelectField variant="soft" className="flex-1" value={categoryFilter} options={categoryOptions} onChange={setCategoryFilter} />
                    <SelectField variant="soft" className="flex-1" value={guestsFilter} options={guestOptions} onChange={setGuestsFilter} />
                  </View>
                  <View className="flex-row gap-2">
                    <SelectField variant="soft" className="flex-1" value={statusFilter} options={statusOptions} onChange={setStatusFilter} />
                    <SelectField variant="soft" className="flex-1" value={sourceFilter} options={sourceOptions} onChange={setSourceFilter} />
                  </View>
                </View>
              </View>
            </View>
          )}
          {showPeriodPicker && (
            <View className="absolute left-4 right-4" style={{ top: periodBottom + 8, zIndex: 11, elevation: 8 }}>
              <View className="rounded-[18px]" style={{ shadowColor: '#000', shadowOpacity: 0.12, shadowRadius: 16, shadowOffset: { width: 0, height: 6 }, elevation: 8 }}>
                <PeriodPickerPanel
                  key={`${fromIso}-${dayCount}`}
                  lang={lang}
                  fromIso={fromIso}
                  dayCount={dayCount}
                  onCancel={() => setShowPeriodPicker(false)}
                  onApply={(iso, days) => {
                    setFromIso(iso);
                    setDayCount(days);
                    setShowPeriodPicker(false);
                  }}
                />
              </View>
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function BookingCard({ booking: b, lang, onPress }: { booking: ReceptionBooking; lang: 'RU' | 'EN'; onPress: () => void }) {
  if (!isVisibleStatus(b.status)) return null;
  const st = STATUS_STYLE[b.status];
  return (
    <Pressable onPress={onPress} className="bg-white rounded-[16px] border border-border p-4 gap-2 active:opacity-80">
      <View className="flex-row items-center justify-between gap-2">
        <Text className="flex-1 text-[15px] font-jost-medium text-text-primary" numberOfLines={1}>
          {b.guestName}
        </Text>
        <View className="px-2.5 py-1 rounded-full flex-row items-center gap-1.5" style={{ backgroundColor: st.pillBg }}>
          <View className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: st.dot }} />
          <Text className="text-[11px] font-jost" style={{ color: st.pillText }}>
            {statusLabel(b.status, lang)}
          </Text>
        </View>
      </View>

      <Text className="text-xs font-jost text-text-secondary" numberOfLines={1}>
        <Text className="text-text-primary font-jost-medium">№{b.roomNumber || '—'}</Text>
        {` · ${b.category} · ${guestsText(b.guestsCount, lang)}`}
      </Text>

      <View className="flex-row items-center justify-between pt-0.5">
        <Text className="text-xs font-jost text-text-primary">{bookingRangeText(b.checkIn, b.checkOut, lang)}</Text>
        <Text className="text-xs font-jost text-text-secondary">{nightsText(b.nights, lang)}</Text>
      </View>
    </Pressable>
  );
}

function EmptyState({ title, text, actionLabel, onAction }: { title: string; text: string; actionLabel?: string; onAction?: () => void }) {
  return (
    <View className="bg-white rounded-[16px] border border-border px-5 py-8 items-center gap-2">
      <View className="h-11 w-11 rounded-full bg-background-secondary items-center justify-center mb-1">
        <CalendarX size={20} color="#8A8177" />
      </View>
      <Text className="text-[15px] font-jost-medium text-text-primary">{title}</Text>
      <Text className="text-xs font-jost text-text-secondary text-center">{text}</Text>
      {actionLabel && onAction && (
        <Pressable onPress={onAction} className="mt-2 px-4 py-2.5 rounded-[12px] bg-primary flex-row items-center gap-1.5 active:bg-primary-hover">
          <Plus size={14} color="#FFFFFF" />
          <Text className="text-xs font-jost-medium text-white">{actionLabel}</Text>
        </Pressable>
      )}
    </View>
  );
}
