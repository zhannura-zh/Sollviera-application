import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Alert, BackHandler, Pressable, RefreshControl, ScrollView, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Check, ChevronLeft, ChevronRight, CircleAlert, Clock, Plus, Search, Trash2, X } from 'lucide-react-native';
import { useApp } from '@/context/app-store';
import {
  type WaitlistEntry,
  type WaitlistPriority,
  type WaitlistStatus,
  toIsoDate,
  useReception,
} from '@/context/reception-store';
import { SelectField, type SelectOption } from '@/components/ui/select-field';
import { WaitlistFormModal, type WaitlistFormValues } from '@/components/reception/waitlist-form-modal';
import { type Lang, bookingRangeText, guestsText, nightsText, parseIso, pluralRu } from '@/components/reception/booking-utils';

// Reception "Лист ожидания" tab (web design: ReceptionScreens.tsx → RECEPTION_WAITLIST).
// Data: /records/waitlist via useReception(), shared with the web PMS.

const MONTHS_RU_GEN = ['января', 'февраля', 'марта', 'апреля', 'мая', 'июня', 'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря'];
const MONTHS_EN = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

// "6 ноября 2026" / "November 6, 2026"
function formatFullDate(iso: string, lang: Lang) {
  if (!iso) return '—';
  const d = parseIso(iso);
  return lang === 'RU'
    ? `${d.getDate()} ${MONTHS_RU_GEN[d.getMonth()]} ${d.getFullYear()}`
    : `${MONTHS_EN[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`;
}

const requestNo = (n: string) => (n.startsWith('№') ? n : `№${n}`);

const countLabel = (n: number, lang: Lang) =>
  lang === 'RU' ? `${n} ${pluralRu(n, 'заявка', 'заявки', 'заявок')}` : `${n} ${n === 1 ? 'request' : 'requests'}`;

const STATUS_STYLE: Record<WaitlistStatus, { ru: string; en: string; bg: string; text: string }> = {
  WAITING: { ru: 'В листе ожидания', en: 'On waitlist', bg: '#F5EFE4', text: '#7A6B58' },
  OFFERED: { ru: 'Предложен номер', en: 'Room offered', bg: '#FAF0E4', text: '#8A5210' },
  BOOKED: { ru: 'Забронировано', en: 'Booked', bg: '#E8EFEA', text: '#3B6647' },
};

const STATUS_SHORT: Record<WaitlistStatus, { ru: string; en: string }> = {
  WAITING: { ru: 'Ожидает', en: 'Waiting' },
  OFFERED: { ru: 'Предложено', en: 'Offered' },
  BOOKED: { ru: 'Забронировано', en: 'Booked' },
};

const STATUSES: WaitlistStatus[] = ['WAITING', 'OFFERED', 'BOOKED'];

const errorText = (error: unknown) => (error instanceof Error ? error.message : String(error));

export function ReceptionWaitlistScreen() {
  const { lang } = useApp();
  const ru = lang === 'RU';
  const {
    waitlist,
    waitlistLoading,
    waitlistError,
    refreshWaitlist,
    createWaitlistEntry,
    updateWaitlistEntry,
    deleteWaitlistEntry,
    roomTypes,
  } = useReception();

  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [guestsFilter, setGuestsFilter] = useState('ALL');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await refreshWaitlist();
    } finally {
      setRefreshing(false);
    }
  }, [refreshWaitlist]);

  // Categories: real room types first, then anything only the requests mention.
  const categories = useMemo(() => {
    const list: string[] = [];
    for (const name of [...roomTypes.map((t) => t.name), ...waitlist.map((w) => w.category)]) {
      if (name && !list.includes(name)) list.push(name);
    }
    return list;
  }, [roomTypes, waitlist]);
  const roomTypeNames = useMemo(() => roomTypes.map((t) => t.name).filter(Boolean), [roomTypes]);

  const maxGuests = useMemo(() => Math.min(10, Math.max(4, ...waitlist.map((w) => w.guestsCount))), [waitlist]);

  const categoryOptions: SelectOption<string>[] = [
    { value: 'ALL', label: ru ? 'Все категории' : 'All categories' },
    ...categories.map((c) => ({ value: c, label: c })),
  ];
  const guestOptions: SelectOption<string>[] = [
    { value: 'ALL', label: ru ? 'Любое количество' : 'Any guests' },
    ...Array.from({ length: maxGuests }, (_, i) => ({ value: String(i + 1), label: guestsText(i + 1, lang) })),
  ];

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return waitlist.filter((w) => {
      if (categoryFilter !== 'ALL' && w.category !== categoryFilter) return false;
      if (guestsFilter !== 'ALL' && w.guestsCount !== Number(guestsFilter)) return false;
      if (q) {
        const hit =
          w.guestName.toLowerCase().includes(q) ||
          w.phone.toLowerCase().includes(q) ||
          requestNo(w.number).toLowerCase().includes(q) ||
          w.number.toLowerCase().includes(q);
        if (!hit) return false;
      }
      return true;
    });
  }, [waitlist, search, categoryFilter, guestsFilter]);

  const selected = selectedId ? waitlist.find((w) => w.id === selectedId) ?? null : null;
  const editing = editingId ? waitlist.find((w) => w.id === editingId) ?? null : null;

  // Entry vanished (deleted here or on the web PMS) → back to the list.
  useEffect(() => {
    if (selectedId && !selected && !waitlistLoading) setSelectedId(null);
  }, [selectedId, selected, waitlistLoading]);

  // Android back closes the request card first.
  useEffect(() => {
    if (!selectedId) return;
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      setSelectedId(null);
      return true;
    });
    return () => sub.remove();
  }, [selectedId]);

  const openNew = () => {
    setEditingId(null);
    setFormOpen(true);
  };

  const openEdit = (entry: WaitlistEntry) => {
    setEditingId(entry.id);
    setFormOpen(true);
  };

  const closeForm = () => {
    setFormOpen(false);
    setEditingId(null);
  };

  // Errors are shown by the form itself (it keeps the entered data on failure).
  const submitForm = async (values: WaitlistFormValues) => {
    if (editingId) {
      await updateWaitlistEntry(editingId, values);
    } else {
      await createWaitlistEntry({ ...values, priority: 'NORMAL', status: 'WAITING' });
    }
    closeForm();
  };

  const today = toIsoDate(new Date());

  return (
    <SafeAreaView edges={['top']} className="flex-1 bg-background">
      {selected ? (
        <WaitlistDetails
          lang={lang}
          entry={selected}
          onBack={() => setSelectedId(null)}
          onEdit={() => openEdit(selected)}
          updateEntry={updateWaitlistEntry}
          deleteEntry={async (id) => {
            await deleteWaitlistEntry(id);
            setSelectedId(null);
          }}
        />
      ) : (
        <>
          <ScrollView
            className="flex-1"
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 16, paddingBottom: 16 }}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          >
            {/* Header */}
            <Text className="text-[28px] font-spectral text-text-primary mb-4">{ru ? 'Лист ожидания' : 'Waitlist'}</Text>

            {/* Search */}
            <View className="bg-white border border-border rounded-[14px] px-3.5 flex-row items-center gap-2.5 mb-2.5">
              <Search size={16} color="#8A8177" />
              <TextInput
                value={search}
                onChangeText={setSearch}
                placeholder={ru ? 'Гость, телефон или № заявки' : 'Guest, phone or request #'}
                placeholderTextColor="#8A8177"
                autoCorrect={false}
                className="flex-1 py-3 text-[13px] font-jost text-text-primary"
              />
              {search.length > 0 && (
                <Pressable onPress={() => setSearch('')} hitSlop={8} className="active:opacity-60">
                  <X size={14} color="#8A8177" />
                </Pressable>
              )}
            </View>

            {/* Filters */}
            <View className="flex-row gap-2 mb-4">
              <SelectField className="flex-1" value={categoryFilter} options={categoryOptions} onChange={setCategoryFilter} />
              <SelectField className="flex-1" value={guestsFilter} options={guestOptions} onChange={setGuestsFilter} />
            </View>

            {waitlistError && (
              <Pressable
                onPress={onRefresh}
                className="bg-error-light border border-[#F2D6D4] rounded-[14px] px-3.5 py-3 flex-row items-center gap-2.5 mb-4 active:opacity-80"
              >
                <CircleAlert size={16} color="#B3261E" />
                <View className="flex-1">
                  <Text className="text-xs font-jost-medium text-error-text">
                    {ru ? 'Не удалось загрузить лист ожидания' : 'Could not load the waitlist'}
                  </Text>
                  <Text className="text-[11px] font-jost text-text-secondary mt-0.5" numberOfLines={2}>
                    {ru ? 'Потяните вниз или нажмите, чтобы повторить' : 'Pull down or tap to retry'}
                  </Text>
                </View>
              </Pressable>
            )}

            {/* Count row */}
            <View className="flex-row items-center justify-between mb-2.5">
              <Text className="text-xs font-jost text-text-secondary">{ru ? 'Ожидают размещения' : 'Awaiting placement'}</Text>
              <Text className="text-xs font-jost-medium text-text-primary">{countLabel(filtered.length, lang)}</Text>
            </View>

            {waitlistLoading && !refreshing && waitlist.length === 0 ? (
              <View className="py-16 items-center">
                <ActivityIndicator color="#C2410C" />
              </View>
            ) : filtered.length === 0 ? (
              <View className="bg-white rounded-[16px] border border-border px-5 py-8 items-center gap-2">
                <View className="h-11 w-11 rounded-full bg-background-secondary items-center justify-center mb-1">
                  <Clock size={20} color="#8A8177" />
                </View>
                <Text className="text-[15px] font-jost-medium text-text-primary">
                  {waitlist.length === 0 ? (ru ? 'Лист ожидания пуст' : 'The waitlist is empty') : ru ? 'Ничего не найдено' : 'Nothing found'}
                </Text>
                <Text className="text-xs font-jost text-text-secondary text-center">
                  {waitlist.length === 0
                    ? ru
                      ? 'Добавьте заявку, если на нужные даты нет свободных номеров'
                      : 'Add a request when there are no free rooms for the dates'
                    : ru
                      ? 'Ничего не найдено по заданным фильтрам'
                      : 'Nothing matches the current filters'}
                </Text>
              </View>
            ) : (
              <View className="gap-2.5">
                {filtered.map((item) => (
                  <WaitlistCard key={item.id} lang={lang} entry={item} onPress={() => setSelectedId(item.id)} />
                ))}
              </View>
            )}
          </ScrollView>

          {/* Pinned bottom button */}
          <View className="px-5 pb-4 pt-2 bg-background">
            <Pressable onPress={openNew} className="w-full py-3.5 rounded-[14px] bg-primary flex-row items-center justify-center gap-2 active:bg-primary-hover">
              <Plus size={16} color="#FFFFFF" />
              <Text className="text-xs font-jost-medium text-white">{ru ? 'Создать заявку' : 'Create request'}</Text>
            </Pressable>
          </View>
        </>
      )}

      <WaitlistFormModal
        visible={formOpen}
        lang={lang}
        entry={editing}
        categories={roomTypeNames.length > 0 ? roomTypeNames : categories}
        todayIso={today}
        onClose={closeForm}
        onSubmit={submitForm}
      />
    </SafeAreaView>
  );
}

function WaitlistCard({ lang, entry: w, onPress }: { lang: Lang; entry: WaitlistEntry; onPress: () => void }) {
  const ru = lang === 'RU';
  return (
    <Pressable onPress={onPress} className="bg-white rounded-[16px] border border-border p-4 gap-1.5 active:opacity-80">
      {/* Name + №31 › */}
      <View className="flex-row items-center justify-between gap-2">
        <Text className="flex-1 text-[15px] font-jost-medium text-text-primary" numberOfLines={1}>
          {w.guestName}
        </Text>
        <View className="flex-row items-center gap-1">
          <Text className="text-xs font-jost text-text-secondary">{requestNo(w.number)}</Text>
          <ChevronRight size={14} color="#8A8177" />
        </View>
      </View>

      {/* Phone + guests · category */}
      <View className="flex-row items-center justify-between gap-2">
        <Text className="text-xs font-jost text-text-secondary" numberOfLines={1}>
          {w.phone || '—'}
        </Text>
        <Text className="flex-shrink text-xs font-jost text-text-secondary text-right" numberOfLines={1}>
          {guestsText(w.guestsCount, lang)}
          {w.category ? ` · ${w.category}` : ''}
        </Text>
      </View>

      {/* Dates + badges */}
      <View className="flex-row items-center justify-between gap-2 pt-1">
        <Text className="text-xs font-jost text-text-primary">{bookingRangeText(w.checkIn, w.checkOut, lang)}</Text>
        <View className="flex-row items-center gap-1.5 flex-shrink">
          {w.priority === 'HIGH' && (
            <View className="px-2.5 py-0.5 rounded-[7px] bg-[#FBECE7]">
              <Text className="text-[11px] font-jost text-[#B94A2C]">{ru ? 'Срочно' : 'Urgent'}</Text>
            </View>
          )}
          {w.status !== 'WAITING' && (
            <View className="px-2.5 py-0.5 rounded-[7px]" style={{ backgroundColor: STATUS_STYLE[w.status].bg }}>
              <Text className="text-[11px] font-jost" style={{ color: STATUS_STYLE[w.status].text }}>
                {ru ? STATUS_SHORT[w.status].ru : STATUS_SHORT[w.status].en}
              </Text>
            </View>
          )}
          {w.flexibleCategory && (
            <View className="px-2.5 py-0.5 rounded-[7px] bg-[#E8EFEA]">
              <Text className="text-[11px] font-jost text-[#3B6647]">{ru ? 'Гибкая категория' : 'Flexible category'}</Text>
            </View>
          )}
        </View>
      </View>
    </Pressable>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <View className="py-3.5 flex-row items-center justify-between gap-3 border-b border-border">
      <Text className="text-xs font-jost text-text-secondary">{label}</Text>
      <Text className="flex-shrink text-xs font-jost-semibold text-text-primary text-right">{value}</Text>
    </View>
  );
}

type Busy = { kind: 'status'; value: WaitlistStatus } | { kind: 'priority' } | { kind: 'delete' } | null;

function WaitlistDetails({
  lang,
  entry,
  onBack,
  onEdit,
  updateEntry,
  deleteEntry,
}: {
  lang: Lang;
  entry: WaitlistEntry;
  onBack: () => void;
  onEdit: () => void;
  updateEntry: (id: string, input: { status?: WaitlistStatus; priority?: WaitlistPriority }) => Promise<void>;
  deleteEntry: (id: string) => Promise<void>;
}) {
  const ru = lang === 'RU';
  const router = useRouter();
  const [busy, setBusy] = useState<Busy>(null);
  const st = STATUS_STYLE[entry.status];

  const run = async (next: Exclude<Busy, null>, action: () => Promise<void>) => {
    setBusy(next);
    try {
      await action();
    } catch (error) {
      Alert.alert(ru ? 'Ошибка' : 'Error', errorText(error));
    } finally {
      setBusy(null);
    }
  };

  const changeStatus = (status: WaitlistStatus) => {
    if (busy || status === entry.status) return;
    void run({ kind: 'status', value: status }, () => updateEntry(entry.id, { status }));
  };

  const togglePriority = () => {
    if (busy) return;
    const priority: WaitlistPriority = entry.priority === 'HIGH' ? 'NORMAL' : 'HIGH';
    void run({ kind: 'priority' }, () => updateEntry(entry.id, { priority }));
  };

  const confirmDelete = () => {
    if (busy) return;
    Alert.alert(
      ru ? 'Удалить заявку?' : 'Delete request?',
      ru ? `Заявка ${requestNo(entry.number)} (${entry.guestName}) будет удалена.` : `Request ${requestNo(entry.number)} (${entry.guestName}) will be deleted.`,
      [
        { text: ru ? 'Отмена' : 'Cancel', style: 'cancel' },
        { text: ru ? 'Удалить' : 'Delete', style: 'destructive', onPress: () => void run({ kind: 'delete' }, () => deleteEntry(entry.id)) },
      ]
    );
  };

  const guestsValue =
    entry.children > 0
      ? ru
        ? `${entry.adults} взр. + ${entry.children} ${pluralRu(entry.children, 'ребёнок', 'ребёнка', 'детей')}`
        : `${entry.adults} adults + ${entry.children} ${entry.children === 1 ? 'child' : 'children'}`
      : String(entry.guestsCount);

  return (
    <ScrollView className="flex-1" contentContainerStyle={{ flexGrow: 1, paddingHorizontal: 20, paddingTop: 16, paddingBottom: 24 }}>
      {/* Back link */}
      <Pressable onPress={onBack} hitSlop={8} className="flex-row items-center gap-1.5 self-start -ml-1 active:opacity-60">
        <ChevronLeft size={16} color="#241E1A" />
        <Text className="text-xs font-jost text-text-secondary">{ru ? 'Лист ожидания' : 'Waitlist'}</Text>
      </Pressable>

      <Text className="text-[26px] font-spectral text-text-primary mt-2.5 mb-4">
        {ru ? `Заявка ${requestNo(entry.number)}` : `Request ${requestNo(entry.number)}`}
      </Text>

      {/* Guest card */}
      <View className="bg-white rounded-[18px] border border-border p-[18px] gap-2 mb-5">
        <View className="flex-row items-center gap-1.5 flex-wrap">
          <View className="flex-row items-center gap-1.5 px-3 py-1 rounded-[8px]" style={{ backgroundColor: st.bg }}>
            <Clock size={14} color={st.text} />
            <Text className="text-[11px] font-jost" style={{ color: st.text }}>
              {ru ? st.ru : st.en}
            </Text>
          </View>
          {entry.priority === 'HIGH' && (
            <View className="px-3 py-1 rounded-[8px] bg-[#FBECE7]">
              <Text className="text-[11px] font-jost text-[#B94A2C]">{ru ? 'Высокий приоритет' : 'High priority'}</Text>
            </View>
          )}
        </View>
        <Text className="text-[18px] font-spectral text-text-primary pt-0.5">{entry.guestName}</Text>
        <Text className="text-xs font-jost text-text-secondary">{entry.phone || '—'}</Text>
      </View>

      {/* Key-value rows */}
      <View className="mb-5">
        <DetailRow label={ru ? 'Желаемый заезд' : 'Desired check-in'} value={formatFullDate(entry.checkIn, lang)} />
        <DetailRow label={ru ? 'Выезд' : 'Check-out'} value={formatFullDate(entry.checkOut, lang)} />
        <DetailRow label={ru ? 'Ночей' : 'Nights'} value={nightsText(entry.nights, lang)} />
        <DetailRow label={ru ? 'Количество гостей' : 'Guests'} value={guestsValue} />
        <DetailRow label={ru ? 'Категория' : 'Category'} value={entry.category || '—'} />
        <DetailRow
          label={ru ? 'Другие категории' : 'Other categories'}
          value={
            entry.flexibleCategory
              ? ru ? 'Да, рассмотрит' : 'Yes, open to others'
              : ru ? 'Нет, только эта' : 'No, this one only'
          }
        />
      </View>

      {/* Comment */}
      <View className="bg-white rounded-[16px] border border-border p-4 gap-1.5 mb-5">
        <Text className="text-[11px] font-jost text-text-secondary">{ru ? 'Комментарий' : 'Comment'}</Text>
        <Text className="text-xs font-jost text-text-primary leading-5">{entry.comment || (ru ? 'Без комментариев.' : 'No comments.')}</Text>
      </View>

      {/* Status & priority */}
      <View className="gap-2 mb-5">
        <Text className="text-[11px] font-jost text-text-secondary">{ru ? 'Статус заявки' : 'Request status'}</Text>
        <View className="bg-[#EBE6DF] p-1 rounded-[14px] flex-row gap-1">
          {STATUSES.map((s) => {
            const active = entry.status === s;
            const loading = busy?.kind === 'status' && busy.value === s;
            return (
              <Pressable
                key={s}
                onPress={() => changeStatus(s)}
                disabled={busy !== null}
                className={`flex-1 py-2.5 rounded-[11px] items-center justify-center ${active ? 'bg-dark' : 'active:bg-black/5'}`}
              >
                {loading ? (
                  <ActivityIndicator size="small" color={active ? '#FFFFFF' : '#241E1A'} />
                ) : (
                  <Text className={`text-xs ${active ? 'text-white font-jost-medium' : 'text-text-primary font-jost'}`} numberOfLines={1}>
                    {ru ? STATUS_SHORT[s].ru : STATUS_SHORT[s].en}
                  </Text>
                )}
              </Pressable>
            );
          })}
        </View>

        <Pressable
          onPress={togglePriority}
          disabled={busy !== null}
          className="bg-white rounded-[14px] border border-border px-4 py-3 flex-row items-center gap-3 active:bg-background"
        >
          <View
            className="h-5 w-5 rounded-[6px] items-center justify-center"
            style={{
              borderWidth: 1,
              backgroundColor: entry.priority === 'HIGH' ? '#B93800' : '#FFFFFF',
              borderColor: entry.priority === 'HIGH' ? '#B93800' : '#CCC5BA',
            }}
          >
            {busy?.kind === 'priority' ? (
              <ActivityIndicator size="small" color={entry.priority === 'HIGH' ? '#FFFFFF' : '#B93800'} style={{ transform: [{ scale: 0.6 }] }} />
            ) : entry.priority === 'HIGH' ? (
              <Check size={14} color="#FFFFFF" strokeWidth={3} />
            ) : null}
          </View>
          <Text className="flex-1 text-xs font-jost text-text-primary">{ru ? 'Высокий приоритет' : 'High priority'}</Text>
        </Pressable>
      </View>

      {/* Bottom actions: Изменить | + Создать бронь */}
      <View className="flex-row items-center gap-2.5 mt-auto pt-1">
        <Pressable
          onPress={onEdit}
          disabled={busy !== null}
          className="w-[42%] py-3.5 rounded-[14px] bg-white border border-border items-center active:bg-background"
        >
          <Text className="text-xs font-jost-semibold text-text-primary">{ru ? 'Изменить' : 'Edit'}</Text>
        </Pressable>
        <Pressable
          onPress={() => router.push('/(app)/(reception)/create')}
          disabled={busy !== null}
          className="flex-1 py-3.5 rounded-[14px] bg-[#B93800] flex-row items-center justify-center gap-2 active:bg-[#9E3000]"
        >
          <Plus size={16} color="#FFFFFF" />
          <Text className="text-xs font-jost-semibold text-white">{ru ? 'Создать бронь' : 'Create booking'}</Text>
        </Pressable>
      </View>

      <Pressable
        onPress={confirmDelete}
        disabled={busy !== null}
        className="mt-3 py-3 rounded-[14px] flex-row items-center justify-center gap-2 active:bg-black/5"
      >
        {busy?.kind === 'delete' ? (
          <ActivityIndicator size="small" color="#B92A2A" />
        ) : (
          <>
            <Trash2 size={14} color="#B92A2A" />
            <Text className="text-xs font-jost-medium text-[#B92A2A]">{ru ? 'Удалить заявку' : 'Delete request'}</Text>
          </>
        )}
      </Pressable>
    </ScrollView>
  );
}
