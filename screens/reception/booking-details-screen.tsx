import React, { useEffect, useState } from 'react';
import { View, Text, Pressable, ScrollView, TextInput, Modal, Alert, ActivityIndicator, Linking } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  BedDouble,
  Check,
  ChevronLeft,
  ExternalLink,
  X,
} from 'lucide-react-native';
import { useApp } from '@/context/app-store';
import { useReception, type ReceptionBooking, type ReceptionBookingStatus } from '@/context/reception-store';
import { BookingDocuments, recentlyClosedSheet } from '@/components/reception/booking-documents';
import { BookingServices } from '@/components/reception/booking-services';
import { IndividualBookingWizard } from '@/components/reception/create/individual-wizard';
import { getBooking } from '@/lib/api-client';

// Front-desk booking card (web PMS design, ReceptionScreens.tsx → selectedBooking).
// Check-in / check-out / cancel, editing, documents and services go to the API; taking a
// payment shows «Добавится позже» until it is designed.

interface ReceptionBookingDetailsScreenProps {
  bookingId: string;
  onBack: () => void;
}

type BusyAction = 'checkIn' | 'checkOut' | 'cancel' | null;

const MONTHS_SHORT = ['янв.', 'февр.', 'мар.', 'апр.', 'мая', 'июн.', 'июл.', 'авг.', 'сент.', 'окт.', 'нояб.', 'дек.'];

function formatDate(iso: string) {
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso);
  if (!match) return '—';
  return `${Number(match[3])} ${MONTHS_SHORT[Number(match[2]) - 1]} ${match[1]} г.`;
}

function plural(n: number, one: string, few: string, many: string) {
  const mod10 = n % 10;
  const mod100 = n % 100;
  if (mod10 === 1 && mod100 !== 11) return one;
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return few;
  return many;
}

const money = (value: number) => `${Math.round(value).toLocaleString('ru-RU')} ₸`;

const STATUS_STYLE: Record<ReceptionBookingStatus, { label: string; bg: string; text: string; border: string; dot: string }> = {
  CONFIRMED: { label: 'Подтверждена', bg: '#EAF3EC', text: '#3D7C52', border: '#CDE3D2', dot: '#4B7F52' },
  CHECKED_IN: { label: 'Заселён', bg: '#FBECE7', text: '#B94A2C', border: '#F2C9BE', dot: '#B94A2C' },
  CHECKED_OUT: { label: 'Выехал', bg: '#EFECE6', text: '#6E665E', border: '#DDD8CF', dot: '#8A8177' },
  CANCELLED: { label: 'Отменена', bg: '#EFECE6', text: '#6E665E', border: '#DDD8CF', dot: '#8A8177' },
  NO_SHOW: { label: 'Не заехал', bg: '#EFECE6', text: '#6E665E', border: '#DDD8CF', dot: '#8A8177' },
  NEW: { label: 'Новая', bg: '#FAF2E6', text: '#C2410C', border: '#F2D7C2', dot: '#D9822B' },
};

// Controls the design shows but whose behaviour isn't designed yet.
const later = () => {
  // The tap that closes a print / share sheet can land on a button below it.
  if (recentlyClosedSheet()) return;
  Alert.alert('Добавится позже');
};

function SectionTitle({ children }: { children: string }) {
  return <Text className="text-[11px] font-jost-medium uppercase tracking-wider text-text-secondary">{children}</Text>;
}

function Field({ label, value, small }: { label: string; value?: string; small?: boolean }) {
  return (
    <View className="flex-1">
      <Text className="text-[11px] font-jost text-text-secondary">{label}</Text>
      <Text className={`${small ? 'text-xs' : 'text-sm'} font-jost text-text-primary mt-0.5`}>{value || '—'}</Text>
    </View>
  );
}

function Checkbox({ checked, label, onToggle }: { checked: boolean; label: string; onToggle: () => void }) {
  return (
    <Pressable
      onPress={onToggle}
      className="bg-white rounded-[16px] border border-border p-4 flex-row items-center gap-3 active:bg-background"
    >
      <View
        className={`h-5 w-5 rounded-[6px] border items-center justify-center ${checked ? 'bg-primary border-primary' : 'bg-white border-[#CCC5BA]'}`}
      >
        {checked && <Check size={14} color="#fff" strokeWidth={3} />}
      </View>
      <Text className="text-xs font-jost text-text-primary">{label}</Text>
    </Pressable>
  );
}

function ModalShell({ visible, title, onClose, children }: { visible: boolean; title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View className="flex-1 bg-black/50 items-center justify-center p-4">
        <View className="bg-white rounded-[20px] w-full max-w-sm p-5 gap-4">
          <View className="flex-row items-center justify-between gap-2">
            <Text className="flex-1 text-base font-spectral text-text-primary">{title}</Text>
            <Pressable onPress={onClose} hitSlop={10} className="active:opacity-60">
              <X size={16} color="#8A8177" />
            </Pressable>
          </View>
          {children}
          <Pressable onPress={onClose} className="w-full py-2.5 rounded-[12px] bg-dark items-center active:opacity-80">
            <Text className="text-white text-xs font-jost-medium">Закрыть</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

function ModalRow({ label, value, accent, last }: { label: string; value: string; accent?: string; last?: boolean }) {
  return (
    <View className={`flex-row justify-between py-1.5 ${last ? '' : 'border-b border-[#F0ECE6]'}`}>
      <Text className="text-xs font-jost text-text-secondary">{label}</Text>
      <Text className="text-xs font-jost-medium" style={{ color: accent ?? '#241E1A' }}>
        {value}
      </Text>
    </View>
  );
}

export function ReceptionBookingDetailsScreen({ bookingId, onBack }: ReceptionBookingDetailsScreenProps) {
  const { lang } = useApp();
  const { bookings, loading, checkIn, checkOut, cancel, refreshBooking } = useReception();
  const insets = useSafeAreaInsets();
  const booking = bookings.find((b) => b.id === bookingId);

  const [busy, setBusy] = useState<BusyAction>(null);
  const [mergeBooking, setMergeBooking] = useState(false);
  const [notifyGuest, setNotifyGuest] = useState(false);
  const [editableAmount, setEditableAmount] = useState('');
  const [showFolio, setShowFolio] = useState(false);
  const [showGuestProfile, setShowGuestProfile] = useState(false);
  // «Изменить» opens the individual booking wizard (as in the design) with the booking's raw data.
  const [editRaw, setEditRaw] = useState<unknown>(null);
  const [editLoading, setEditLoading] = useState(false);

  const balance = booking?.balance ?? 0;
  useEffect(() => {
    setEditableAmount(String(Math.round(balance)));
  }, [balance]);

  const backBar = (
    <View className="px-5 pt-3.5 pb-2 flex-row items-center">
      <Pressable onPress={onBack} hitSlop={10} className="flex-row items-center gap-2 py-1 active:opacity-60">
        <ChevronLeft size={16} color="#241E1A" />
        <Text className="text-xs font-jost text-[#6E665E]">{lang === 'RU' ? 'Бронирования' : 'Bookings'}</Text>
      </Pressable>
    </View>
  );

  if (!booking) {
    return (
      <SafeAreaView edges={['top']} className="flex-1 bg-background">
        {backBar}
        <View className="flex-1 items-center justify-center">
          {loading ? (
            <ActivityIndicator color="#C2410C" />
          ) : (
            <Text className="text-sm font-jost text-text-secondary">Бронь не найдена</Text>
          )}
        </View>
      </SafeAreaView>
    );
  }

  const b: ReceptionBooking = booking;
  const statusStyle = STATUS_STYLE[b.status];
  const isCheckedIn = b.status === 'CHECKED_IN';
  const canStayAction = b.status === 'NEW' || b.status === 'CONFIRMED' || isCheckedIn;
  const canCancel = b.status === 'NEW' || b.status === 'CONFIRMED';
  const canEdit = b.status === 'NEW' || b.status === 'CONFIRMED' || isCheckedIn;
  const ratePerNight = b.totalAmount > 0 ? b.totalAmount / Math.max(1, b.nights) : 0;
  const toPay = parseInt(editableAmount.replace(/\D/g, '') || '0', 10);
  const tags = [...b.specialMarks, ...(b.mealPlan ? [b.mealPlan] : [])];

  const run = (action: Exclude<BusyAction, null>, title: string, message: string, confirmLabel: string, destructive?: boolean) => {
    Alert.alert(title, message, [
      { text: 'Нет', style: 'cancel' },
      {
        text: confirmLabel,
        style: destructive ? 'destructive' : 'default',
        onPress: async () => {
          setBusy(action);
          try {
            if (action === 'checkIn') await checkIn(b.id);
            else if (action === 'checkOut') await checkOut(b.id);
            else {
              await cancel(b.id);
              onBack();
            }
          } catch (error) {
            Alert.alert('Ошибка', error instanceof Error ? error.message : String(error));
          } finally {
            setBusy(null);
          }
        },
      },
    ]);
  };

  const openEdit = async () => {
    if (recentlyClosedSheet()) return;
    setEditLoading(true);
    try {
      const raw: any = await getBooking(b.id);
      setEditRaw(raw?.data ?? raw);
    } catch (error) {
      Alert.alert('Не удалось открыть бронь', error instanceof Error ? error.message : undefined);
    } finally {
      setEditLoading(false);
    }
  };

  if (editRaw) {
    return (
      <IndividualBookingWizard
        edit={{ id: b.id, raw: editRaw, roomId: b.roomId }}
        onCancel={() => setEditRaw(null)}
        onCreated={() => {
          setEditRaw(null);
          void refreshBooking(b.id);
        }}
      />
    );
  }

  const handleStay = () => {
    if (recentlyClosedSheet()) return;
    if (isCheckedIn) {
      run('checkOut', 'Выселить гостя?', `${b.guestName}, номер ${b.roomNumber || '—'}`, 'Выселить');
    } else {
      run('checkIn', 'Заселить гостя?', `${b.guestName}, номер ${b.roomNumber || '—'}`, 'Заселить');
    }
  };

  const handleCancel = () => run('cancel', 'Отменить бронь?', `${b.bookingNumber} · ${b.guestName}`, 'Отменить бронь', true);

  return (
    <SafeAreaView edges={['top']} className="flex-1 bg-background">
      {backBar}

      <ScrollView className="flex-1" contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 4, paddingBottom: 32, gap: 20 }}>
        {/* Header: code, status, name, subtitle */}
        <View>
          <View className="flex-row items-center justify-between gap-2">
            <Text className="text-xs font-jost text-text-secondary tracking-wider uppercase">{b.bookingNumber}</Text>
            <View
              className="px-2.5 py-1 rounded-full flex-row items-center gap-1.5 border"
              style={{ backgroundColor: statusStyle.bg, borderColor: statusStyle.border }}
            >
              <View className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: statusStyle.dot }} />
              <Text className="text-[11px] font-jost-medium" style={{ color: statusStyle.text }}>
                {statusStyle.label}
              </Text>
            </View>
          </View>
          <Text className="text-[26px] font-spectral text-text-primary mt-2.5 leading-snug">{b.guestName}</Text>
          <Text className="text-xs font-jost text-text-secondary mt-1.5">
            {b.bookingType === 'GROUP' ? 'Групповая' : b.bookingType === 'QUICK' ? 'Быстрая' : 'Индивидуальная'} · {b.guestsCount}{' '}
            {plural(b.guestsCount, 'гость', 'гостя', 'гостей')} / 1 номер
          </Text>
        </View>

        {/* 1. Dates */}
        <View className="gap-2">
          <SectionTitle>ДАТЫ ПРОЖИВАНИЯ</SectionTitle>
          <View className="bg-white rounded-[18px] border border-border p-4 flex-row items-center justify-between">
            <View>
              <Text className="text-[11px] font-jost text-text-secondary">Заезд</Text>
              <Text className="text-sm font-jost-medium text-text-primary mt-0.5">{formatDate(b.checkIn)}</Text>
              <Text className="text-xs font-jost text-text-secondary mt-0.5">{b.checkInTime || '—'}</Text>
            </View>
            <View className="px-3.5 py-1 rounded-full bg-dark">
              <Text className="text-white text-xs font-jost-medium">
                {b.nights} {plural(b.nights, 'ночь', 'ночи', 'ночей')}
              </Text>
            </View>
            <View className="items-end">
              <Text className="text-[11px] font-jost text-text-secondary">Выезд</Text>
              <Text className="text-sm font-jost-medium text-text-primary mt-0.5">{formatDate(b.checkOut)}</Text>
              <Text className="text-xs font-jost text-text-secondary mt-0.5">{b.checkOutTime || '—'}</Text>
            </View>
          </View>
        </View>

        {/* 2. Rooms */}
        <View className="gap-2">
          <SectionTitle>НОМЕРА</SectionTitle>
          <View className="bg-white rounded-[18px] border border-border p-4 gap-3">
            <View className="flex-row items-center justify-between gap-2">
              <View className="flex-row items-center gap-2.5 flex-1">
                <BedDouble size={18} color="#241E1A" strokeWidth={1.8} />
                <Text className="text-base font-jost-medium text-text-primary flex-shrink" numberOfLines={1}>
                  {b.category || '—'} · {b.roomNumber || '—'}
                </Text>
              </View>
              <View className="px-2.5 py-1 rounded-[10px] bg-background border border-border">
                <Text className="text-[11px] font-jost text-[#6E665E]">
                  {b.adults} {plural(b.adults, 'взрослый', 'взрослых', 'взрослых')}
                  {b.children > 0 ? ` + ${b.children} дет.` : ''}
                </Text>
              </View>
            </View>
            <View className="pt-2 border-t border-[#F0ECE6] flex-row items-center justify-between">
              <Text className="text-xs font-jost text-text-secondary">{b.tariff || 'По цене номера'}</Text>
              <Text>
                <Text className="text-sm font-jost-semibold text-text-primary">{ratePerNight > 0 ? money(ratePerNight) : '—'}</Text>
                <Text className="text-xs font-jost text-text-secondary">/ночь</Text>
              </Text>
            </View>
          </View>
        </View>

        {/* 3. Contacts */}
        <View className="gap-2">
          <SectionTitle>КОНТАКТЫ</SectionTitle>
          <View className="bg-white rounded-[18px] border border-border p-[18px] gap-3.5">
            <View className="flex-row gap-3">
              <Pressable
                className="flex-1"
                disabled={!b.phone}
                onPress={() => Linking.openURL(`tel:${b.phone.replace(/[^\d+]/g, '')}`).catch(() => undefined)}
              >
                <Text className="text-[11px] font-jost text-text-secondary">Телефон</Text>
                <Text className="text-sm font-jost-medium text-text-primary mt-0.5">{b.phone || '—'}</Text>
              </Pressable>
              <Field label="E-mail" value={b.email} />
            </View>
            <View className="flex-row gap-3 pt-1 border-t border-[#F0ECE6]">
              <Field label="Дата рождения" value={b.birthDate ? formatDate(b.birthDate) : undefined} />
              <Field label="Пол" value={b.gender} />
            </View>
            <View className="flex-row gap-3 pt-1 border-t border-[#F0ECE6]">
              <Field label="Национальность" value={b.nationality} />
              <Field label="Документ" value={b.document} small />
            </View>
            <View className="flex-row gap-3 pt-1 border-t border-[#F0ECE6]">
              <Field label="Менеджер" value={b.manager} />
              <Field label="Источник" value={b.source} />
            </View>
          </View>
          <Pressable onPress={() => setShowGuestProfile(true)} className="flex-row items-center gap-1.5 pt-0.5 self-start active:opacity-60">
            <Text className="text-xs font-jost text-primary">Профиль гостя</Text>
            <ExternalLink size={14} color="#C2410C" />
          </Pressable>
        </View>

        {/* 4. Merge */}
        <View className="gap-2">
          <SectionTitle>ОБЪЕДИНИТЬ БРОНИ</SectionTitle>
          <Checkbox checked={mergeBooking} label="Объединить бронь" onToggle={() => setMergeBooking((v) => !v)} />
        </View>

        {/* 5. Payment */}
        <View className="gap-2">
          <SectionTitle>ОПЛАТА</SectionTitle>
          <View className="bg-white rounded-[18px] border border-border p-4 gap-3.5">
            <View>
              <Text className="text-xs font-jost text-text-secondary mb-1.5">Сумма к оплате</Text>
              <View className="bg-white border border-border rounded-[14px] px-3.5 py-2.5 flex-row items-center justify-between">
                <TextInput
                  value={editableAmount}
                  onChangeText={(v) => setEditableAmount(v.replace(/[^\d]/g, ''))}
                  keyboardType="number-pad"
                  className="flex-1 text-base font-jost-medium text-text-primary p-0"
                />
                <Text className="text-sm font-jost text-text-secondary ml-2">₸</Text>
              </View>
            </View>
            <View className="flex-row gap-3 pt-1">
              <View className="flex-1">
                <Text className="text-xs font-jost text-text-secondary">Предоплата</Text>
                <Text className="text-sm font-jost-medium text-text-primary mt-0.5">{money(b.paidAmount)}</Text>
              </View>
              <View className="flex-1">
                <Text className="text-xs font-jost text-text-secondary">Статус</Text>
                <Text className="text-sm font-jost-medium text-text-primary mt-0.5">{b.isPaid ? 'Оплачено' : 'Не оплачено'}</Text>
              </View>
            </View>
            <View className="pt-2 border-t border-[#F0ECE6] flex-row items-center justify-between">
              <Text className="text-xs font-jost text-text-secondary">К доплате</Text>
              <Text className="text-lg font-jost-semibold text-[#B93800]">{money(toPay)}</Text>
            </View>
            <View className="flex-row gap-2.5 pt-1">
              <Pressable
                onPress={later}
                className="flex-1 py-3 rounded-[12px] bg-[#B93800] items-center active:bg-[#9E3000]"
              >
                <Text className="text-white text-xs font-jost-medium">Принять оплату</Text>
              </Pressable>
              <Pressable
                onPress={() => setShowFolio(true)}
                className="flex-1 py-3 rounded-[12px] bg-white border border-border flex-row items-center justify-center gap-1.5 active:bg-background"
              >
                <Text className="text-xs font-jost-medium text-[#B93800]">Открыть folio</Text>
                <ExternalLink size={14} color="#B93800" />
              </Pressable>
            </View>
          </View>
        </View>

        {/* 6. Documents */}
        <View className="gap-2">
          <SectionTitle>ДОКУМЕНТЫ</SectionTitle>
          <BookingDocuments bookingId={b.id} status={b.status} />
        </View>

        {/* 7. Notes */}
        <View className="gap-2">
          <SectionTitle>ПОЖЕЛАНИЯ И ПРИМЕЧАНИЯ</SectionTitle>
          <View className="bg-white rounded-[18px] border border-border p-4 gap-3">
            <Text className="text-xs font-jost text-text-primary leading-relaxed">{b.notes || '—'}</Text>
            {tags.length > 0 && (
              <View className="flex-row items-center gap-2 flex-wrap pt-1">
                {tags.map((tag, i) => (
                  <View key={`${tag}-${i}`} className="px-3 py-1 rounded-full bg-[#FAF2E6]">
                    <Text className="text-xs font-jost text-[#7A4B1A]">{tag}</Text>
                  </View>
                ))}
              </View>
            )}
          </View>
          <Checkbox checked={notifyGuest} label="Уведомить гостя" onToggle={() => setNotifyGuest((v) => !v)} />
        </View>

        {/* 8. Services */}
        <View className="gap-2">
          <SectionTitle>УСЛУГИ</SectionTitle>
          <BookingServices booking={b} onOrdered={() => void refreshBooking(b.id)} />
        </View>
      </ScrollView>

      {/* Sticky bottom action bar */}
      <View
        className="px-3.5 pt-3.5 border-t border-border bg-white flex-row items-center gap-2"
        style={{ paddingBottom: Math.max(insets.bottom, 14) }}
      >
        <Pressable
          onPress={openEdit}
          disabled={!canEdit || editLoading}
          className={`flex-1 py-3.5 rounded-[14px] bg-[#B93800] items-center active:bg-[#9E3000] ${canEdit ? '' : 'opacity-50'}`}
        >
          {editLoading ? <ActivityIndicator size="small" color="#fff" /> : <Text className="text-white text-xs font-jost-semibold">Изменить</Text>}
        </Pressable>
        <Pressable
          onPress={handleStay}
          disabled={!canStayAction || busy !== null}
          className={`flex-1 py-3.5 rounded-[14px] bg-[#538363] items-center active:bg-[#467053] ${!canStayAction ? 'opacity-50' : ''}`}
        >
          {busy === 'checkIn' || busy === 'checkOut' ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Text className="text-white text-xs font-jost-semibold">{isCheckedIn ? 'Выселить' : 'Заселить'}</Text>
          )}
        </Pressable>
        <Pressable
          onPress={handleCancel}
          disabled={!canCancel || busy !== null}
          className={`flex-1 py-3.5 rounded-[14px] bg-white border border-border items-center active:bg-background ${!canCancel ? 'opacity-50' : ''}`}
        >
          {busy === 'cancel' ? (
            <ActivityIndicator size="small" color="#B92A2A" />
          ) : (
            <Text className="text-[#B92A2A] text-xs font-jost-semibold">Отменить</Text>
          )}
        </Pressable>
      </View>

      {/* Guest profile */}
      <ModalShell visible={showGuestProfile} title="Профиль гостя" onClose={() => setShowGuestProfile(false)}>
        <View className="gap-2">
          <View className="p-3 bg-background rounded-[12px] gap-1">
            <Text className="text-xs font-jost-medium text-text-primary">{b.guestName}</Text>
            <Text className="text-xs font-jost text-text-secondary">{b.phone || '—'}</Text>
          </View>
          <ModalRow label="Всего визитов:" value="—" />
          <ModalRow label="Общая сумма трат:" value="—" />
          <ModalRow label="Категория лояльности:" value="—" accent="#C2410C" last />
        </View>
      </ModalShell>

      {/* Folio */}
      <ModalShell visible={showFolio} title={`Folio брони ${b.bookingNumber}`} onClose={() => setShowFolio(false)}>
        <View className="gap-2">
          <ModalRow label={`Сумма брони (${b.nights} ${plural(b.nights, 'ночь', 'ночи', 'ночей')}):`} value={money(b.totalAmount)} />
          <ModalRow label="Оплачено:" value={money(b.paidAmount)} />
          <View className="flex-row justify-between py-2 border-t border-dark">
            <Text className="text-sm font-jost-medium text-text-primary">Итого к оплате:</Text>
            <Text className="text-sm font-jost-semibold text-[#B93800]">{money(b.balance)}</Text>
          </View>
        </View>
      </ModalShell>


    </SafeAreaView>
  );
}
