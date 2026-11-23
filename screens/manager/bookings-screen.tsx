import React, { useState } from 'react';
import { Linking, Modal, Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Phone, X } from 'lucide-react-native';
import { useApp } from '@/context/app-store';
import { useReception, type ReceptionBooking } from '@/context/reception-store';
import { ManagerRoomsView } from '@/screens/manager/rooms-view';
import { ManagerServicesView } from '@/screens/manager/services-view';
import { money } from '@/components/manager/manager-utils';
import { bookingRangeText, isVisibleStatus, nightsText, sourceLabel, STATUS_STYLE, statusLabel, type Lang } from '@/components/reception/booking-utils';

type Section = 'ROOMS' | 'SERVICES';

function Header({ lang, section, onChange }: { lang: Lang; section: Section; onChange: (s: Section) => void }) {
  const ru = lang === 'RU';
  const t = (r: string, e: string) => (ru ? r : e);
  return (
    <View className="px-5 pt-7 pb-3">
      <Text className="text-2xl font-spectral text-text-primary">{t('Бронирования', 'Bookings')}</Text>
      <Text className="text-xs font-jost text-text-secondary mt-0.5">
        {section === 'ROOMS' ? t('Номера и шахматка', 'Rooms & chessboard') : t('Услуги отеля', 'Hotel services')}
      </Text>
      <View className="mt-3.5 bg-[#EAE6DE]/70 rounded-xl p-1 flex-row gap-1">
        {(['ROOMS', 'SERVICES'] as const).map((id) => {
          const active = section === id;
          return (
            <Pressable key={id} onPress={() => onChange(id)} className={`flex-1 py-2 rounded-lg items-center ${active ? 'bg-dark' : ''}`}>
              <Text className={`text-xs ${active ? 'text-white font-jost-medium' : 'text-[#6E665E] font-jost'}`}>
                {id === 'ROOMS' ? t('Брони', 'Bookings') : t('Услуги', 'Services')}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

export function ManagerBookingsScreen() {
  const { lang } = useApp();
  const [section, setSection] = useState<Section>('ROOMS');
  const [selected, setSelected] = useState<ReceptionBooking | null>(null);
  const header = <Header lang={lang} section={section} onChange={setSection} />;

  return (
    <>
      <SafeAreaView edges={['top']} className="flex-1 bg-background">
        {header}
        {section === 'ROOMS' ? <ManagerRoomsView onOpenBooking={setSelected} /> : <ManagerServicesView />}
      </SafeAreaView>
      {selected && <BookingCardModal lang={lang} booking={selected} onClose={() => setSelected(null)} />}
    </>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <View className="flex-row items-center justify-between gap-3">
      <Text className="text-xs font-jost text-text-secondary">{label}</Text>
      {children}
    </View>
  );
}

// Design's «Карточка бронирования» bottom sheet.
function BookingCardModal({ lang, booking: b, onClose }: { lang: Lang; booking: ReceptionBooking; onClose: () => void }) {
  const insets = useSafeAreaInsets();
  const ru = lang === 'RU';
  const t = (r: string, e: string) => (ru ? r : e);
  const { bookingSources } = useReception();
  const visible = isVisibleStatus(b.status);
  const payment = b.isPaid
    ? { text: t('Оплачено полностью', 'Paid in full'), color: '#3D7C52' }
    : b.paidAmount > 0
      ? { text: ru ? `Предоплата ${money(b.paidAmount)}` : `Prepaid ${money(b.paidAmount)}`, color: '#3D7C52' }
      : { text: t('Не оплачено', 'Unpaid'), color: '#B3261E' };

  return (
    <Modal visible transparent animationType="slide" onRequestClose={onClose}>
      <Pressable className="flex-1 bg-black/40" onPress={onClose} />
      <View className="bg-white rounded-t-3xl border border-border overflow-hidden" style={{ maxHeight: '85%', paddingBottom: insets.bottom }}>
        <View className="p-[18px] border-b border-border flex-row items-start justify-between bg-background gap-3">
          <View className="flex-1">
            <View className="flex-row items-center gap-2 flex-wrap">
              <Text className="text-base font-spectral text-text-primary">
                {t('Бронирование', 'Booking')} #{b.bookingNumber}
              </Text>
              <View className="bg-[#EAF3EC] px-2 py-0.5 rounded-md">
                <Text className="text-[10px] font-jost-medium text-[#3D7C52]">
                  №{b.roomNumber || '—'} · {b.category}
                </Text>
              </View>
            </View>
            <Text className="text-[11px] font-jost text-text-secondary mt-0.5">
              {t('Источник', 'Source')}: {b.source ? sourceLabel(b.source, lang, bookingSources) : t('Прямая бронь', 'Direct booking')}
            </Text>
          </View>
          <Pressable onPress={onClose} hitSlop={8} className="p-1.5 active:opacity-60">
            <X size={20} color="#8A8177" />
          </Pressable>
        </View>

        <ScrollView contentContainerClassName="p-5 gap-4">
          <View className="bg-background rounded-xl p-3.5 border border-border gap-2">
            <Row label={t('Гость:', 'Guest:')}>
              <Text className="text-xs font-jost-medium text-text-primary flex-shrink text-right">{b.guestName}</Text>
            </Row>
            {!!b.phone && (
              <Row label={t('Телефон:', 'Phone:')}>
                <Pressable onPress={() => Linking.openURL(`tel:${b.phone.replace(/[^\d+]/g, '')}`)} className="flex-row items-center gap-1 active:opacity-60">
                  <Phone size={12} color="#C2410C" />
                  <Text className="text-xs font-jost text-primary">{b.phone}</Text>
                </Pressable>
              </Row>
            )}
            <Row label={t('Количество гостей:', 'Guests:')}>
              <Text className="text-xs font-jost text-text-primary">
                {b.guestsCount} {t('чел.', 'ppl')}
              </Text>
            </Row>
          </View>

          <View className="bg-white rounded-xl p-3.5 border border-border gap-2">
            <Row label={t('Даты проживания:', 'Stay dates:')}>
              <Text className="text-xs font-jost-medium text-text-primary">{bookingRangeText(b.checkIn, b.checkOut, lang)}</Text>
            </Row>
            <Row label={t('Длительность:', 'Duration:')}>
              <Text className="text-xs font-jost text-text-primary">{nightsText(b.nights, lang)}</Text>
            </Row>
            <Row label={t('Текущий статус:', 'Current status:')}>
              <Text className="text-xs font-jost-medium" style={{ color: visible ? STATUS_STYLE[b.status as keyof typeof STATUS_STYLE].pillText : '#8A8177' }}>
                {visible ? statusLabel(b.status as keyof typeof STATUS_STYLE, lang) : b.status}
              </Text>
            </Row>
          </View>

          <View className="bg-background rounded-xl p-3.5 border border-border gap-2">
            <Row label={t('Стоимость проживания:', 'Stay cost:')}>
              <Text className="text-sm font-spectral text-text-primary">{money(b.totalAmount)}</Text>
            </Row>
            <Row label={t('Оплата:', 'Payment:')}>
              <Text className="text-xs font-jost-medium" style={{ color: payment.color }}>
                {payment.text}
              </Text>
            </Row>
          </View>

          <Pressable onPress={onClose} className="bg-dark py-3 rounded-xl items-center active:opacity-80">
            <Text className="text-xs font-jost-medium text-white">{t('Закрыть', 'Close')}</Text>
          </Pressable>
        </ScrollView>
      </View>
    </Modal>
  );
}
