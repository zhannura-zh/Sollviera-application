import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { View, Text, TextInput, Pressable, ScrollView, ActivityIndicator, RefreshControl, Alert } from 'react-native';
import { Search, Package, Minus, Plus, Trash2, ChevronDown, ChevronUp } from 'lucide-react-native';
import { useApp } from '@/context/app-store';
import { cancelLunchboxOrder, createLunchboxOrder, listBookings, listLunchboxOrders } from '@/lib/api-client';

// Lunchbox orders for in-house guests (e.g. a packed breakfast for an early excursion).
// Guests come from GET /bookings for today; orders per booking from
// /bookings/:id/lunchbox-orders. The kitchen and staff are notified by the backend.

interface StayGuest {
  bookingId: string;
  roomNumber: string;
  guestName: string;
  checkOut: string;
}

interface LunchboxOrder {
  id: string;
  readyAt: string;
  quantity: number;
  notes?: string;
}

function asArray(value: unknown): any[] {
  if (Array.isArray(value)) return value;
  if (value && typeof value === 'object' && Array.isArray((value as { data?: unknown }).data)) return (value as { data: any[] }).data;
  return [];
}

function localDateIso(d = new Date()) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function mapGuest(b: any): StayGuest | null {
  const status = String(b?.status ?? '').toUpperCase();
  if (status === 'CANCELLED' || status === 'NO_SHOW' || status === 'CHECKED_OUT' || status === 'INQUIRY') return null;
  const guest = b?.guest ?? {};
  return {
    bookingId: String(b?.id ?? ''),
    roomNumber: String(b?.room?.number ?? b?.roomNumber ?? '—'),
    guestName: String(guest.fullName ?? guest.name ?? [guest.lastName, guest.firstName].filter(Boolean).join(' ') ?? '').trim() || '—',
    checkOut: String(b?.checkOutDate ?? '').slice(0, 10),
  };
}

function mapOrder(o: any): LunchboxOrder {
  return {
    id: String(o?.id ?? ''),
    readyAt: String(o?.readyAt ?? o?.ready_at ?? ''),
    quantity: Number(o?.quantity ?? 1),
    notes: o?.notes ? String(o.notes) : undefined,
  };
}

function formatReady(iso: string, lang: 'RU' | 'EN') {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  const today = localDateIso();
  const tomorrow = localDateIso(new Date(Date.now() + 86_400_000));
  const day = localDateIso(d);
  const time = `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
  if (day === today) return `${lang === 'RU' ? 'сегодня' : 'today'} ${time}`;
  if (day === tomorrow) return `${lang === 'RU' ? 'завтра' : 'tomorrow'} ${time}`;
  return `${String(d.getDate()).padStart(2, '0')}.${String(d.getMonth() + 1).padStart(2, '0')} ${time}`;
}

function OrderForm({ lang, onCreate }: { lang: 'RU' | 'EN'; onCreate: (readyAt: string, quantity: number, notes: string) => Promise<void> }) {
  const [day, setDay] = useState<'today' | 'tomorrow'>('tomorrow');
  const [time, setTime] = useState('07:00');
  const [quantity, setQuantity] = useState(1);
  const [notes, setNotes] = useState('');
  const [busy, setBusy] = useState(false);
  const valid = /^([01]?\d|2[0-3]):[0-5]\d$/.test(time);

  const submit = async () => {
    const [h, m] = time.split(':').map(Number);
    const ready = new Date();
    if (day === 'tomorrow') ready.setDate(ready.getDate() + 1);
    ready.setHours(h, m, 0, 0);
    if (ready.getTime() < Date.now()) {
      Alert.alert('', lang === 'RU' ? 'Это время уже прошло' : 'That time has already passed');
      return;
    }
    setBusy(true);
    try {
      await onCreate(ready.toISOString(), quantity, notes.trim());
      setNotes('');
      setQuantity(1);
    } finally {
      setBusy(false);
    }
  };

  return (
    <View className="gap-2.5 pt-1">
      <View className="flex-row gap-2">
        {(['today', 'tomorrow'] as const).map((d) => (
          <Pressable
            key={d}
            onPress={() => setDay(d)}
            className={`flex-1 py-2 rounded-xl border items-center ${day === d ? 'bg-dark border-dark' : 'bg-white border-border'}`}
          >
            <Text className={`text-[13px] font-jost ${day === d ? 'text-white' : 'text-text-secondary'}`}>
              {d === 'today' ? (lang === 'RU' ? 'Сегодня' : 'Today') : lang === 'RU' ? 'Завтра' : 'Tomorrow'}
            </Text>
          </Pressable>
        ))}
      </View>
      <View className="flex-row gap-2 items-center">
        <View className="flex-1">
          <Text className="text-[11px] text-text-secondary uppercase tracking-wider mb-0.5">{lang === 'RU' ? 'Готов к' : 'Ready at'}</Text>
          <TextInput
            value={time}
            onChangeText={(v) => setTime(v.replace(/[^0-9:]/g, '').slice(0, 5))}
            keyboardType="numbers-and-punctuation"
            placeholder="07:00"
            className={`bg-background border rounded-xl px-3 py-2 text-sm text-text-primary ${valid ? 'border-border' : 'border-error'}`}
          />
        </View>
        <View>
          <Text className="text-[11px] text-text-secondary uppercase tracking-wider mb-0.5">{lang === 'RU' ? 'Кол-во' : 'Qty'}</Text>
          <View className="flex-row items-center gap-2">
            <Pressable onPress={() => setQuantity((q) => Math.max(1, q - 1))} className="h-9 w-9 border border-border rounded-xl items-center justify-center">
              <Minus size={14} color="#241E1A" />
            </Pressable>
            <Text className="text-base font-jost-semibold text-text-primary w-6 text-center">{quantity}</Text>
            <Pressable onPress={() => setQuantity((q) => Math.min(20, q + 1))} className="h-9 w-9 border border-border rounded-xl items-center justify-center">
              <Plus size={14} color="#241E1A" />
            </Pressable>
          </View>
        </View>
      </View>
      <TextInput
        value={notes}
        onChangeText={setNotes}
        placeholder={lang === 'RU' ? 'Комментарий: без глютена, детский…' : 'Notes: gluten-free, kids…'}
        placeholderTextColor="#8A8177"
        className="bg-background border border-border rounded-xl px-3 py-2 text-sm text-text-primary"
      />
      <Pressable
        onPress={submit}
        disabled={!valid || busy}
        className={`py-2.5 rounded-xl items-center ${!valid || busy ? 'bg-border' : 'bg-primary active:bg-primary-hover'}`}
      >
        <Text className="text-white font-jost-semibold text-sm">{busy ? '…' : lang === 'RU' ? 'Заказать ланчбокс' : 'Order lunchbox'}</Text>
      </Pressable>
    </View>
  );
}

function GuestRow({ guest, lang }: { guest: StayGuest; lang: 'RU' | 'EN' }) {
  const [open, setOpen] = useState(false);
  const [orders, setOrders] = useState<LunchboxOrder[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setOrders(asArray(await listLunchboxOrders(guest.bookingId)).map(mapOrder).sort((a, b) => a.readyAt.localeCompare(b.readyAt)));
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    }
  }, [guest.bookingId]);

  useEffect(() => {
    if (open && orders === null) void load();
  }, [open, orders, load]);

  const create = async (readyAt: string, quantity: number, notes: string) => {
    try {
      const created = mapOrder(await createLunchboxOrder(guest.bookingId, { readyAt, quantity, notes: notes || undefined }));
      setOrders((prev) => [...(prev || []), created].sort((a, b) => a.readyAt.localeCompare(b.readyAt)));
    } catch (e) {
      Alert.alert(lang === 'RU' ? 'Не удалось заказать' : 'Could not order', e instanceof Error ? e.message : '');
    }
  };

  const cancel = (order: LunchboxOrder) =>
    Alert.alert(lang === 'RU' ? 'Отменить ланчбокс?' : 'Cancel lunchbox?', formatReady(order.readyAt, lang), [
      { text: lang === 'RU' ? 'Нет' : 'No', style: 'cancel' },
      {
        text: lang === 'RU' ? 'Отменить' : 'Cancel order',
        style: 'destructive',
        onPress: async () => {
          try {
            await cancelLunchboxOrder(guest.bookingId, order.id);
            setOrders((prev) => (prev || []).filter((o) => o.id !== order.id));
          } catch (e) {
            Alert.alert(lang === 'RU' ? 'Не удалось отменить' : 'Could not cancel', e instanceof Error ? e.message : '');
          }
        },
      },
    ]);

  return (
    <View className="bg-white rounded-[14px] border border-border overflow-hidden">
      <Pressable onPress={() => setOpen((v) => !v)} className="p-4 flex-row items-center gap-3 active:bg-background">
        <View className="h-10 w-12 rounded-xl bg-primary-light border border-border items-center justify-center">
          <Text className="text-sm font-jost-semibold text-text-primary">{guest.roomNumber}</Text>
        </View>
        <View className="flex-1">
          <Text className="text-sm font-jost-semibold text-text-primary" numberOfLines={1}>{guest.guestName}</Text>
          {!!guest.checkOut && (
            <Text className="text-[12px] font-jost text-text-secondary">
              {lang === 'RU' ? 'выезд' : 'check-out'} {guest.checkOut.split('-').reverse().slice(0, 2).join('.')}
            </Text>
          )}
        </View>
        {orders && orders.length > 0 && (
          <View className="flex-row items-center gap-1 bg-amber-50 border border-amber-100 px-2 py-0.5 rounded-md">
            <Package size={11} color="#B45309" />
            <Text className="text-amber-800 font-jost-semibold text-[11px]">{orders.reduce((a, o) => a + o.quantity, 0)}</Text>
          </View>
        )}
        {open ? <ChevronUp size={16} color="#8A8177" /> : <ChevronDown size={16} color="#8A8177" />}
      </Pressable>
      {open && (
        <View className="px-4 pb-4 gap-2.5 border-t border-border-light pt-3">
          {orders === null && !error ? (
            <ActivityIndicator color="#8A8177" />
          ) : error ? (
            <Text className="text-[13px] font-jost text-error">{error}</Text>
          ) : orders && orders.length > 0 ? (
            orders.map((o) => (
              <View key={o.id} className="flex-row items-center gap-3">
                <Package size={16} color="#8A8177" />
                <View className="flex-1">
                  <Text className="text-sm font-jost text-text-primary">
                    {o.quantity} × {formatReady(o.readyAt, lang)}
                  </Text>
                  {!!o.notes && <Text className="text-[12px] font-jost text-text-secondary">{o.notes}</Text>}
                </View>
                <Pressable onPress={() => cancel(o)} className="h-8 w-8 items-center justify-center rounded-lg active:bg-background">
                  <Trash2 size={15} color="#B3261E" />
                </Pressable>
              </View>
            ))
          ) : (
            <Text className="text-[13px] font-jost text-text-secondary">{lang === 'RU' ? 'Заказов пока нет' : 'No orders yet'}</Text>
          )}
          <OrderForm lang={lang} onCreate={create} />
        </View>
      )}
    </View>
  );
}

export function LunchboxScreen() {
  const { lang } = useApp();
  const [guests, setGuests] = useState<StayGuest[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try {
      const today = localDateIso();
      const list = asArray(await listBookings(today, today))
        .map(mapGuest)
        .filter((g): g is StayGuest => !!g && !!g.bookingId);
      list.sort((a, b) => a.roomNumber.localeCompare(b.roomNumber, undefined, { numeric: true }));
      setGuests(list);
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!guests) return [];
    if (!q) return guests;
    return guests.filter((g) => g.roomNumber.toLowerCase().includes(q) || g.guestName.toLowerCase().includes(q));
  }, [guests, query]);

  return (
    <View className="flex-1 bg-background">
      <View className="px-5 pb-3 pt-2">
        <View className="relative">
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder={lang === 'RU' ? 'Номер или фамилия гостя' : 'Room or guest name'}
            placeholderTextColor="#8A8177"
            className="w-full bg-white border border-border rounded-xl pl-9 pr-3 py-2.5 text-sm text-text-primary"
          />
          <View className="absolute left-3 top-0 bottom-0 justify-center">
            <Search size={16} color="#8A8177" />
          </View>
        </View>
      </View>
      <ScrollView
        className="flex-1 px-5"
        contentContainerStyle={{ paddingBottom: 24, gap: 10 }}
        keyboardShouldPersistTaps="handled"
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={async () => {
              setRefreshing(true);
              await load();
              setRefreshing(false);
            }}
          />
        }
      >
        {guests === null && !error ? (
          <ActivityIndicator className="mt-8" color="#8A8177" />
        ) : error && !guests ? (
          <Text className="text-sm text-text-secondary font-jost text-center mt-8">
            {lang === 'RU' ? 'Не удалось загрузить гостей. Потяните вниз, чтобы повторить.' : 'Could not load guests. Pull down to retry.'}
          </Text>
        ) : filtered.length === 0 ? (
          <Text className="text-sm text-text-secondary font-jost text-center mt-8">
            {lang === 'RU' ? 'Гостей не найдено' : 'No guests found'}
          </Text>
        ) : (
          filtered.map((g) => <GuestRow key={g.bookingId} guest={g} lang={lang} />)
        )}
      </ScrollView>
    </View>
  );
}
