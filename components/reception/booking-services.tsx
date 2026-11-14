import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Modal, Pressable, ScrollView, Text, View } from 'react-native';
import { type EdgeInsets, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Plus, X } from 'lucide-react-native';
import { createRecord, listRecord, listServicesCatalog } from '@/lib/api-client';
import type { ReceptionBooking } from '@/context/reception-store';

// Booking services, same data as the web PMS (booking → «Услуги»): orders are
// `service_request` records linked to the booking, picked from the hotel service catalog.

type PaymentStatus = 'unpaid' | 'paid' | 'included' | 'bill_to_room';

const STATUS_LABEL: Record<string, string> = {
  new: 'Новая',
  accepted: 'Принята',
  in_progress: 'В работе',
  completed: 'Выполнена',
  cancelled: 'Отменена',
};

const PAYMENT_STYLE: Record<PaymentStatus, { label: string; bg: string; text: string }> = {
  unpaid: { label: 'Не оплачено', bg: '#FBECEA', text: '#B3261E' },
  paid: { label: 'Оплачено', bg: '#EAF3EC', text: '#3D7C52' },
  included: { label: 'Включено в тариф', bg: '#EEF1F6', text: '#3F4E6B' },
  bill_to_room: { label: 'На счёт номера', bg: '#FAF2E6', text: '#7A4B1A' },
};

const MONTHS_SHORT = ['янв.', 'февр.', 'мар.', 'апр.', 'мая', 'июн.', 'июл.', 'авг.', 'сент.', 'окт.', 'нояб.', 'дек.'];

interface CatalogService {
  id: string;
  code: string;
  name: string;
  price: number;
  kind: 'service' | 'product';
  stockQty: number;
}

interface ServiceOrder {
  id: string;
  catalogItemId: string;
  type: string;
  kind: string;
  quantity: number;
  amount: number;
  status: string;
  paymentStatus: PaymentStatus;
  scheduledAt: string;
  comment: string;
  createdAt: string;
}

const str = (v: unknown) => (v === null || v === undefined ? '' : String(v));
const num = (v: unknown) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
};
const money = (value: number) => `${Math.round(value).toLocaleString('ru-RU')} ₸`;
const pad = (n: number) => String(n).padStart(2, '0');

function formatDateTime(iso: string) {
  if (!iso) return null;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  return `${d.getDate()} ${MONTHS_SHORT[d.getMonth()]}, ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

// Same default as the web: next full hour, kept inside the stay (check-in time … 12:00 on check-out day).
function defaultScheduledAt(b: ReceptionBooking) {
  const now = new Date();
  now.setMinutes(0, 0, 0);
  now.setHours(now.getHours() + 1);
  const time = /^\d{2}:\d{2}$/.test(b.checkInTime) ? b.checkInTime : '14:00';
  const start = new Date(`${b.checkIn}T${time}:00`);
  const end = new Date(`${b.checkOut}T12:00:00`);
  const at = Number.isNaN(start.getTime()) || (now >= start && now <= end) ? now : start;
  return at.toISOString();
}

const mapService = (x: any): CatalogService => ({
  id: str(x?.id),
  code: str(x?.code || x?.id),
  name: str(x?.name || x?.code) || '—',
  price: num(x?.price),
  kind: x?.kind === 'product' ? 'product' : 'service',
  stockQty: num(x?.stockQty),
});

const mapOrder = (x: any): ServiceOrder => ({
  id: str(x?.id),
  catalogItemId: str(x?.catalog_item_id),
  type: str(x?.type),
  kind: str(x?.kind),
  quantity: num(x?.quantity) || 1,
  amount: num(x?.amount),
  status: str(x?.status) || 'new',
  paymentStatus: (['unpaid', 'paid', 'included', 'bill_to_room'].includes(x?.payment_status) ? x.payment_status : 'unpaid') as PaymentStatus,
  scheduledAt: str(x?.scheduled_at),
  comment: str(x?.comment),
  createdAt: str(x?.created_at),
});

export function BookingServices({ booking, onOrdered }: { booking: ReceptionBooking; onOrdered?: () => void }) {
  const insets = useSafeAreaInsets();
  const [orders, setOrders] = useState<ServiceOrder[]>([]);
  const [catalog, setCatalog] = useState<CatalogService[]>([]);
  const [loading, setLoading] = useState(true);
  const [showOrder, setShowOrder] = useState(false);
  const closed = booking.status === 'CANCELLED' || booking.status === 'CHECKED_OUT';

  const loadOrders = useCallback(async () => {
    const list = ((await listRecord('service_request')) ?? []) as any[];
    setOrders(
      list
        .filter((x) => str(x?.booking_id) === booking.id)
        .map(mapOrder)
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    );
  }, [booking.id]);

  useEffect(() => {
    setLoading(true);
    Promise.all([
      loadOrders().catch(() => setOrders([])),
      listServicesCatalog()
        .then((list) =>
          setCatalog(
            ((list ?? []) as any[])
              .filter((x) => x?.isAvailable !== false && (x?.kind !== 'product' || num(x?.stockQty) > 0))
              .map(mapService)
              .sort((a, b) => a.name.localeCompare(b.name, 'ru'))
          )
        )
        .catch(() => setCatalog([])),
    ]).finally(() => setLoading(false));
  }, [loadOrders]);

  const nameOf = (o: ServiceOrder) => {
    const item = catalog.find((c) => c.id === o.catalogItemId || c.code === o.type);
    const name = item?.name ?? (o.type || 'Услуга');
    return o.kind === 'product' && o.quantity > 1 ? `${name} × ${o.quantity}` : name;
  };

  return (
    <>
      {loading ? (
        <View className="bg-white rounded-[18px] border border-border p-6 items-center">
          <ActivityIndicator color="#C2410C" />
        </View>
      ) : orders.length === 0 ? (
        <View className="bg-white rounded-[18px] border border-dashed border-[#DDD7CD] p-6 items-center">
          <Text className="text-xs font-jost text-text-secondary">Услуг пока нет</Text>
        </View>
      ) : (
        orders.map((o) => {
          const cancelled = o.status === 'cancelled';
          const pay = PAYMENT_STYLE[o.paymentStatus];
          const meta = [formatDateTime(o.scheduledAt), STATUS_LABEL[o.status] ?? o.status].filter(Boolean).join(' · ');
          return (
            <View key={o.id} className="bg-white rounded-[18px] border border-border p-4 flex-row items-start justify-between gap-3">
              <View className="flex-1">
                <Text
                  className={`text-sm font-jost-medium ${cancelled ? 'text-text-secondary line-through' : 'text-text-primary'}`}
                  numberOfLines={1}
                >
                  {nameOf(o)}
                </Text>
                <Text className="text-[11px] font-jost text-text-secondary mt-0.5">{meta}</Text>
                {!!o.comment && (
                  <Text className="text-[11px] font-jost text-text-primary mt-0.5" numberOfLines={2}>
                    {o.comment}
                  </Text>
                )}
              </View>
              <View className="items-end gap-1">
                <Text className={`text-sm font-jost-semibold ${cancelled ? 'text-text-secondary line-through' : 'text-text-primary'}`}>
                  {o.amount > 0 ? money(o.amount) : 'Бесплатно'}
                </Text>
                <View className="px-2 py-0.5 rounded-md" style={{ backgroundColor: pay.bg }}>
                  <Text className="text-[10px] font-jost-medium" style={{ color: pay.text }}>
                    {pay.label}
                  </Text>
                </View>
              </View>
            </View>
          );
        })
      )}

      {!closed && (
        <Pressable
          onPress={() => setShowOrder(true)}
          className="w-full py-3 rounded-[14px] bg-white border border-border flex-row items-center justify-center gap-1.5 active:bg-background"
        >
          <Plus size={16} color="#B93800" />
          <Text className="text-xs font-jost-medium text-[#B93800]">Заказать услугу</Text>
        </Pressable>
      )}

      {showOrder && (
        <OrderServiceModal
          insets={insets}
          booking={booking}
          catalog={catalog}
          onClose={() => setShowOrder(false)}
          onCreated={async () => {
            setShowOrder(false);
            await loadOrders().catch(() => undefined);
            onOrdered?.();
          }}
        />
      )}
    </>
  );
}

interface OrderModalProps {
  insets: EdgeInsets;
  booking: ReceptionBooking;
  catalog: CatalogService[];
  onClose: () => void;
  onCreated: () => void;
}

function OrderServiceModal({ insets, booking, catalog, onClose, onCreated }: OrderModalProps) {
  const [savingId, setSavingId] = useState('');

  // As in the design: tapping a service orders it. Payment follows the web default —
  // charged to the room for in-house guests, otherwise unpaid; time is the next full hour.
  const order = async (item: CatalogService) => {
    if (savingId) return;
    setSavingId(item.id);
    try {
      await createRecord('service_request', {
        booking_id: booking.id,
        guest_id: booking.guestId || undefined,
        guest_name: booking.guestName && booking.guestName !== '—' ? booking.guestName : 'Walk-in',
        guest_phone: booking.phone || undefined,
        room_id: booking.roomId || undefined,
        room_number: booking.roomNumber || '—',
        catalog_item_id: item.id,
        kind: item.kind,
        type: item.code,
        quantity: item.kind === 'product' ? 1 : undefined,
        amount: item.price,
        scheduled_at: defaultScheduledAt(booking),
        duration_minutes: null,
        source: 'staff',
        pay_mode: 'on_checkout',
        payment_status: booking.status === 'CHECKED_IN' ? 'bill_to_room' : 'unpaid',
      });
      Alert.alert(`Услуга «${item.name}» добавлена`);
      onCreated();
    } catch (error) {
      Alert.alert('Не удалось заказать услугу', error instanceof Error ? error.message : undefined);
    } finally {
      setSavingId('');
    }
  };

  return (
    <Modal visible transparent animationType="fade" onRequestClose={onClose}>
      <View className="flex-1 bg-black/50 items-center justify-center px-4" style={{ paddingTop: insets.top + 16, paddingBottom: insets.bottom + 16 }}>
        <View className="bg-white rounded-[20px] w-full max-w-sm p-5 gap-3">
          <View className="flex-row items-center justify-between gap-2">
            <Text className="flex-1 text-base font-spectral text-text-primary">Заказ услуги в номер</Text>
            <Pressable onPress={onClose} hitSlop={10} className="active:opacity-60">
              <X size={16} color="#8A8177" />
            </Pressable>
          </View>

          {catalog.length === 0 ? (
            <Text className="text-xs font-jost text-text-secondary py-4 text-center">Нет доступных услуг</Text>
          ) : (
            <ScrollView style={{ maxHeight: 240 }} contentContainerStyle={{ gap: 8 }}>
              {catalog.map((item) => (
                <Pressable
                  key={item.id}
                  onPress={() => void order(item)}
                  disabled={!!savingId}
                  className="p-3 bg-background rounded-[12px] flex-row items-center justify-between gap-3 active:bg-[#FAF2E6]"
                >
                  <Text className="flex-1 text-xs font-jost-medium text-text-primary">{item.name}</Text>
                  {savingId === item.id ? (
                    <ActivityIndicator size="small" color="#C2410C" />
                  ) : (
                    <Text className="text-xs font-jost-semibold text-primary">{money(item.price)}</Text>
                  )}
                </Pressable>
              ))}
            </ScrollView>
          )}
        </View>
      </View>
    </Modal>
  );
}
