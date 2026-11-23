import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Alert, BackHandler, Linking, Pressable, RefreshControl, ScrollView, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowDownRight, ArrowUpRight, BedDouble, CalendarClock, ChevronDown, ChevronLeft, ChevronRight, LogIn, LogOut, Phone, Search, type LucideIcon } from 'lucide-react-native';
import { useApp } from '@/context/app-store';
import { getAnalytics } from '@/lib/api-client';
import { PeriodBar, type PeriodValue } from '@/components/manager/period-bar';
import {
  bookingsCountText,
  dayMonthText,
  dec,
  money,
  num,
  requestsCountText,
  roomsWord,
  stayText,
  todayIso,
} from '@/components/manager/manager-utils';
import { addDaysIso } from '@/components/reception/booking-utils';
import { guestsText, pluralRu, type Lang } from '@/components/reception/booking-utils';
import { ManagerReportsView } from '@/screens/manager/reports-view';

type Json = Record<string, any>;

interface UnpaidBooking {
  id: string;
  guestName: string;
  room: string;
  category: string;
  dates: string;
  amount: number;
  phone: string;
}

interface UnpaidService {
  id: string;
  guestName: string;
  room: string;
  serviceName: string;
  date: string;
  status: string;
  amount: number;
}

interface CancelledBooking {
  id: string;
  guestName: string;
  room: string;
  dates: string;
  guests: number;
  noShow: boolean;
}

const str = (v: unknown) => (v === null || v === undefined ? '' : String(v));
const roomLabel = (v: unknown) => {
  const r = str(v);
  if (!r) return '';
  return r.includes(',') || r.startsWith('№') ? r : `№${r}`;
};
const list = (v: unknown): Json[] => (Array.isArray(v) ? v : []);

function mapUnpaidBooking(b: Json, lang: Lang): UnpaidBooking {
  return {
    id: str(b.id ?? b.booking_id),
    guestName: str(b.guest_name ?? b.guestName),
    room: roomLabel(b.room_number ?? b.roomNumber),
    category: str(b.category_name ?? b.room_category ?? b.category ?? b.room_type),
    dates: stayText(str(b.check_in ?? b.checkIn).slice(0, 10), str(b.check_out ?? b.checkOut).slice(0, 10), lang),
    amount: num(b.amount ?? b.balance ?? b.due),
    phone: str(b.guest_phone ?? b.phone),
  };
}

function mapUnpaidService(s: Json, lang: Lang): UnpaidService {
  const date = str(s.date ?? s.scheduled_at ?? s.created_at).slice(0, 10);
  return {
    id: str(s.id),
    guestName: str(s.guest_name ?? s.guestName),
    room: roomLabel(s.room_number ?? s.roomNumber),
    serviceName: str(s.service_name ?? s.serviceName ?? s.name),
    date: /^\d{4}-\d{2}-\d{2}$/.test(date) ? dayMonthText(date, lang) : '',
    status: s.status_label ? str(s.status_label) : (SERVICE_STATUS[str(s.status).toLowerCase()]?.[lang === 'RU' ? 0 : 1] ?? ''),
    amount: num(s.amount),
  };
}

function mapCancelled(b: Json, noShowDefault: boolean, lang: Lang): CancelledBooking {
  const status = str(b.status).toLowerCase();
  return {
    id: str(b.id),
    guestName: str(b.guest_name ?? b.guestName),
    room: roomLabel(b.room_number ?? b.roomNumber),
    dates: stayText(str(b.check_in).slice(0, 10), str(b.check_out).slice(0, 10), lang),
    guests: num(b.guests ?? b.guests_count ?? b.adults),
    noShow: status ? status === 'no_show' : noShowDefault,
  };
}

// "4,8 ночи" — a fractional count reads with the genitive singular.
const staysText = (v: number, lang: Lang) =>
  lang === 'RU'
    ? `${dec(v)} ${Number.isInteger(v) ? pluralRu(v, 'ночь', 'ночи', 'ночей') : 'ночи'}`
    : `${dec(v)} ${v === 1 ? 'night' : 'nights'}`;

const SERVICE_STATUS: Record<string, [string, string]> = {
  new: ['Новая', 'New'],
  pending: ['Ожидает', 'Pending'],
  scheduled: ['Запланирована', 'Scheduled'],
  in_progress: ['В работе', 'In progress'],
  done: ['Выполнена', 'Done'],
  completed: ['Выполнена', 'Done'],
  cancelled: ['Отменена', 'Cancelled'],
};

const API_PERIOD = { DAY: 'day', WEEK: 'week', MONTH: 'month', YEAR: 'year' } as const;

export function ManagerAnalyticsScreen() {
  const { lang } = useApp();
  const ru = lang === 'RU';
  const t = (r: string, e: string) => (ru ? r : e);

  const [subTab, setSubTab] = useState<'DASHBOARD' | 'REPORTS'>('DASHBOARD');
  const [unpaidView, setUnpaidView] = useState<'NONE' | 'BOOKINGS' | 'SERVICES'>('NONE');
  const [period, setPeriod] = useState<PeriodValue>(() => {
    // Design: the default week is the last 7 days, ending today.
    const end = todayIso();
    return { mode: 'WEEK', start: addDaysIso(end, -6), end };
  });
  const [data, setData] = useState<Json | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const requestId = useRef(0);

  const load = useCallback(async (p: PeriodValue) => {
    const id = ++requestId.current;
    setError('');
    try {
      const res = await getAnalytics(API_PERIOD[p.mode], p.start, p.end);
      if (id === requestId.current) setData(res);
    } catch (e) {
      if (id === requestId.current) setError(e instanceof Error ? e.message : String(e));
    } finally {
      if (id === requestId.current) setLoading(false);
    }
  }, []);

  useEffect(() => {
    load(period);
  }, [load, period]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await load(period);
    setRefreshing(false);
  }, [load, period]);

  // Android back returns from a drill-down to the dashboard.
  useEffect(() => {
    if (unpaidView === 'NONE') return;
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      setUnpaidView('NONE');
      return true;
    });
    return () => sub.remove();
  }, [unpaidView]);

  const unpaidBookings = useMemo(() => list(data?.pending_payment_bookings).map((b) => mapUnpaidBooking(b, lang)), [data, lang]);
  const unpaidServices = useMemo(() => list(data?.pending_payment_services).map((s) => mapUnpaidService(s, lang)), [data, lang]);

  if (unpaidView === 'BOOKINGS') {
    return <UnpaidBookingsView lang={lang} items={unpaidBookings} onBack={() => setUnpaidView('NONE')} />;
  }
  if (unpaidView === 'SERVICES') {
    return <UnpaidServicesView lang={lang} items={unpaidServices} onBack={() => setUnpaidView('NONE')} />;
  }

  return (
    <SafeAreaView edges={['top']} className="flex-1 bg-background">
      <View className="px-5 pt-7 pb-3">
        <Text className="text-2xl font-spectral text-text-primary">{t('Аналитика', 'Analytics')}</Text>
        <Text className="text-xs font-jost text-text-secondary mt-0.5">{t('Операционный обзор', 'Operational overview')}</Text>

        <View className="mt-3.5 bg-[#EAE6DE]/70 rounded-xl p-1 flex-row gap-1">
          {(['DASHBOARD', 'REPORTS'] as const).map((tab) => {
            const active = subTab === tab;
            return (
              <Pressable
                key={tab}
                onPress={() => setSubTab(tab)}
                className={`flex-1 py-2 rounded-lg items-center ${active ? 'bg-dark' : ''}`}
              >
                <Text className={`text-xs ${active ? 'text-white font-jost-medium' : 'text-[#6E665E] font-jost'}`}>
                  {tab === 'DASHBOARD' ? t('Дашборд', 'Dashboard') : t('Отчёты', 'Reports')}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      {subTab === 'REPORTS' ? (
        <ManagerReportsView />
      ) : (
        <ScrollView
          className="flex-1"
          contentContainerClassName="px-5 pb-6 gap-5"
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        >
          {loading && !data ? (
            <View className="py-16 items-center">
              <ActivityIndicator color="#C2410C" />
            </View>
          ) : !data ? (
            <View className="py-12 items-center gap-3">
              <Text className="text-sm font-jost text-text-secondary text-center">
                {t('Не удалось загрузить аналитику', 'Failed to load analytics')}
              </Text>
              {!!error && <Text className="text-xs font-jost text-text-muted text-center">{error}</Text>}
              <Pressable onPress={() => load(period)} className="px-4 py-2 rounded-xl border border-border bg-white active:bg-background">
                <Text className="text-xs font-jost-medium text-text-primary">{t('Повторить', 'Retry')}</Text>
              </Pressable>
            </View>
          ) : (
            <DashboardContent
              lang={lang}
              data={data}
              period={period}
              onPeriodChange={setPeriod}
              periodError={error}
              unpaidBookings={unpaidBookings}
              unpaidServices={unpaidServices}
              onOpenUnpaid={setUnpaidView}
            />
          )}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

function StatusCard({ icon: Icon, value, title, sub }: { icon: LucideIcon; value: string; title: string; sub: string }) {
  return (
    <View className="flex-1 bg-white rounded-2xl border border-border p-3.5 justify-between" style={{ minHeight: 118 }}>
      <View className="flex-row items-center justify-between">
        <Icon size={18} color="#C2410C" strokeWidth={2} />
        <ChevronRight size={14} color="rgba(138,129,119,0.6)" />
      </View>
      <View>
        <Text className="text-3xl font-spectral text-text-primary mb-1.5" style={{ lineHeight: 32 }}>
          {value}
        </Text>
        <Text className="text-xs font-jost-medium text-text-primary">{title}</Text>
        <Text className="text-[10px] font-jost text-text-secondary mt-0.5">{sub}</Text>
      </View>
    </View>
  );
}

// Change vs the previous period, as on the web: an arrow icon, green when up, red when down,
// grey without an icon at zero.
type Delta = { value: number; text: string };

function DeltaLine({ delta }: { delta: Delta }) {
  const color = delta.value > 0 ? '#3D7C52' : delta.value < 0 ? '#B3261E' : '#8A8177';
  const Icon = delta.value > 0 ? ArrowUpRight : delta.value < 0 ? ArrowDownRight : null;
  return (
    <View className="flex-row items-center gap-1">
      {Icon && <Icon size={12} color={color} strokeWidth={2} />}
      <Text className="text-[10px] font-jost-medium" style={{ color }}>
        {delta.text}
      </Text>
    </View>
  );
}

function MetricCard({ label, value, delta, note, small }: { label: string; value: string; delta?: Delta; note: string; small?: boolean }) {
  return (
    <View className="flex-1 bg-white rounded-2xl border border-border p-3.5 justify-between" style={{ minHeight: 128 }}>
      <Text className="text-[10px] font-jost text-text-secondary">{label}</Text>
      <View>
        <Text
          className={`${small ? 'text-2xl' : 'text-3xl'} font-spectral text-text-primary mb-1`}
          style={{ lineHeight: small ? 28 : 32 }}
          numberOfLines={1}
          adjustsFontSizeToFit
        >
          {value}
        </Text>
        {delta ? <DeltaLine delta={delta} /> : null}
        <Text className={`text-[9px] font-jost text-text-secondary ${delta ? 'mt-0.5' : 'mt-2'}`}>{note}</Text>
      </View>
    </View>
  );
}

function Accordion({ title, open, onToggle, children }: { title: string; open: boolean; onToggle: () => void; children: React.ReactNode }) {
  return (
    <View className="bg-white rounded-2xl border border-border overflow-hidden">
      <Pressable onPress={onToggle} className="p-4 flex-row items-center justify-between active:bg-background">
        <Text className="text-xs font-jost-medium text-text-primary">{title}</Text>
        <View style={{ transform: [{ rotate: open ? '180deg' : '0deg' }] }}>
          <ChevronDown size={16} color="#8A8177" />
        </View>
      </Pressable>
      {open && <View className="border-t border-border/50">{children}</View>}
    </View>
  );
}

function DetailRow({ label, value, last }: { label: string; value: string; last?: boolean }) {
  return (
    <View className={`py-3 flex-row items-center justify-between gap-3 ${last ? '' : 'border-b border-border/50'}`}>
      <Text className="text-xs font-jost text-text-secondary flex-shrink">{label}</Text>
      <Text className="text-xs font-jost-medium text-text-primary">{value}</Text>
    </View>
  );
}

function DashboardContent({
  lang,
  data,
  period,
  onPeriodChange,
  periodError,
  unpaidBookings,
  unpaidServices,
  onOpenUnpaid,
}: {
  lang: Lang;
  data: Json;
  period: PeriodValue;
  onPeriodChange: (p: PeriodValue) => void;
  periodError: string;
  unpaidBookings: UnpaidBooking[];
  unpaidServices: UnpaidService[];
  onOpenUnpaid: (view: 'BOOKINGS' | 'SERVICES') => void;
}) {
  const ru = lang === 'RU';
  const t = (r: string, e: string) => (ru ? r : e);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [cancellationsOpen, setCancellationsOpen] = useState(false);

  const op: Json = data.operational ?? {};
  const kpi: Json = data.kpi ?? {};
  const staying = num(op.staying);
  const stayingGuests = op.staying_guests ?? op.guests_staying ?? op.guests;
  const arriving = num(op.arriving);
  const departing = num(op.departing);
  const preBooked = num(op.pre_booked);

  const unpaidBookingsSum = unpaidBookings.reduce((s, b) => s + b.amount, 0);
  const unpaidServicesSum = unpaidServices.reduce((s, b) => s + b.amount, 0);

  const occupancy = num(kpi.occupancy_rate);
  const occChange = kpi.occupancy_change_pct;
  const revenue = num(kpi.revenue);
  const revChange = kpi.revenue_change_pct;
  const arrivals = num(kpi.arrivals ?? kpi.arrivals_expected);
  const departures = kpi.departures;
  const arrivalsTotal = num(kpi.arrivals_expected ?? kpi.arrivals);

  const signed = (v: number) => `${v > 0 ? '+' : v < 0 ? '−' : ''}${dec(Math.abs(v))}`;

  const cancelled: CancelledBooking[] = useMemo(() => {
    const combined = list(data.cancellation_bookings);
    if (combined.length) return combined.map((b) => mapCancelled(b, false, lang));
    return [
      ...list(data.cancelled_bookings).map((b) => mapCancelled(b, false, lang)),
      ...list(data.no_show_bookings).map((b) => mapCancelled(b, true, lang)),
    ];
  }, [data, lang]);
  const hasNoShows = cancelled.some((c) => c.noShow);
  const hasCancellations = cancelled.some((c) => !c.noShow);

  const ofArrivals = (count: number) =>
    ru ? `${count} из ${arrivalsTotal} заездов` : `${count} of ${arrivalsTotal} arrivals`;

  return (
    <>
      {/* Операционный статус */}
      <View className="gap-2.5">
        <View className="flex-row items-center justify-between">
          <Text className="text-xs font-jost-medium text-text-primary">{t('Операционный статус', 'Operational status')}</Text>
          <Text className="text-[10px] font-jost text-text-secondary">
            {t('Сегодня', 'Today')} · {dayMonthText(todayIso(), lang)}
          </Text>
        </View>
        <View className="flex-row gap-2.5">
          <StatusCard
            icon={BedDouble}
            value={String(staying)}
            title={t('Проживают', 'In house')}
            sub={
              ru
                ? `${roomsWord(staying)}${stayingGuests !== undefined ? ` · ${guestsText(num(stayingGuests), lang)}` : ''}`
                : `rooms${stayingGuests !== undefined ? ` · ${guestsText(num(stayingGuests), lang)}` : ''}`
            }
          />
          <StatusCard icon={LogIn} value={String(arriving)} title={t('Заезды сегодня', 'Arrivals today')} sub={t('ожидаемых заезда', 'expected arrivals')} />
        </View>
        <View className="flex-row gap-2.5">
          <StatusCard icon={LogOut} value={String(departing)} title={t('Выезды сегодня', 'Departures today')} sub={t('до 12:00', 'until 12:00')} />
          <StatusCard icon={CalendarClock} value={String(preBooked)} title={t('Предварительные брони', 'Tentative bookings')} sub={t('сегодня', 'today')} />
        </View>
      </View>

      {/* Ожидает оплаты */}
      <View className="gap-2">
        <Text className="text-xs font-jost-medium text-text-primary">{t('Ожидает оплаты', 'Awaiting payment')}</Text>
        <View className="bg-white rounded-2xl border border-border overflow-hidden">
          <Pressable onPress={() => onOpenUnpaid('BOOKINGS')} className="p-4 flex-row items-center justify-between active:bg-background border-b border-border/60">
            <View>
              <Text className="text-xs font-jost-medium text-text-primary">{t('Брони без полной оплаты', 'Bookings not fully paid')}</Text>
              <Text className="text-[10px] font-jost text-text-secondary mt-0.5">{bookingsCountText(unpaidBookings.length, lang)}</Text>
            </View>
            <View className="flex-row items-center gap-1.5">
              <Text className="text-xs font-jost-medium text-primary">{money(unpaidBookingsSum)}</Text>
              <ChevronRight size={16} color="#C2410C" />
            </View>
          </Pressable>
          <Pressable onPress={() => onOpenUnpaid('SERVICES')} className="p-4 flex-row items-center justify-between active:bg-background">
            <View>
              <Text className="text-xs font-jost-medium text-text-primary">{t('Услуги', 'Services')}</Text>
              <Text className="text-[10px] font-jost text-text-secondary mt-0.5">{requestsCountText(unpaidServices.length, lang)}</Text>
            </View>
            <View className="flex-row items-center gap-1.5">
              <Text className="text-xs font-jost-medium text-primary">{money(unpaidServicesSum)}</Text>
              <ChevronRight size={16} color="#C2410C" />
            </View>
          </Pressable>
        </View>
      </View>

      {/* Ключевые метрики */}
      <View className="gap-2.5">
        <Text className="text-xs font-jost-medium text-text-primary">{t('Ключевые метрики', 'Key metrics')}</Text>
        <PeriodBar lang={lang} value={period} onChange={onPeriodChange} />
        {!!periodError && (
          <Text className="text-[11px] font-jost text-error">{t('Не удалось обновить данные за период', 'Failed to update the period')}</Text>
        )}

        <View className="flex-row gap-2.5">
          <MetricCard
            label={t('Occupancy · загрузка', 'Occupancy')}
            value={`${dec(occupancy)}%`}
            delta={occChange !== undefined && occChange !== null ? { value: num(occChange), text: `${signed(num(occChange))} ${t('п. п.', 'pp')}` } : undefined}
            note={t('к предыдущему периоду', 'vs previous period')}
          />
          <MetricCard
            label={t('Revenue · выручка', 'Revenue')}
            value={money(revenue)}
            small
            delta={revChange !== undefined && revChange !== null ? { value: num(revChange), text: `${signed(num(revChange))}%` } : undefined}
            note={t('к предыдущему периоду', 'vs previous period')}
          />
        </View>
        <View className="flex-row gap-2.5">
          <MetricCard label={t('Количество гостей', 'Guests')} value={String(num(kpi.guests))} note={t('за выбранный период', 'for the selected period')} />
          <MetricCard
            label={t('Заезды / Выезды', 'Arrivals / Departures')}
            value={`${arrivals} / ${departures !== undefined && departures !== null ? num(departures) : '—'}`}
            note={t('за выбранный период', 'for the selected period')}
          />
        </View>

        <Accordion title={t('Подробнее о показателях', 'Metric details')} open={detailsOpen} onToggle={() => setDetailsOpen((v) => !v)}>
          <View className="px-4">
            <DetailRow label={t('ADR · средний тариф', 'ADR · average rate')} value={money(num(kpi.adr))} />
            <DetailRow label={t('RevPAR · доход на номер', 'RevPAR · revenue per room')} value={money(num(kpi.revpar))} />
            <DetailRow label={t('GOP · операционная прибыль', 'GOP · operating profit')} value={money(num(kpi.gop))} />
            <DetailRow label={t('Room nights · проданные ночи', 'Room nights sold')} value={String(num(kpi.occupied_room_nights))} />
            <DetailRow label={t('Средняя длина проживания', 'Average length of stay')} value={staysText(num(kpi.avg_length_of_stay), lang)} />
            <DetailRow
              label={t('Доля отмен', 'Cancellation rate')}
              value={`${dec(num(kpi.cancellation_rate))}% · ${ofArrivals(num(kpi.cancellations))}`}
            />
            <DetailRow label="No-show" value={`${dec(num(kpi.no_show_rate))}% · ${ofArrivals(num(kpi.no_shows))}`} last />
          </View>
        </Accordion>

        <Accordion title={t('Отмены и no-show', 'Cancellations and no-shows')} open={cancellationsOpen} onToggle={() => setCancellationsOpen((v) => !v)}>
          <View className="p-4 gap-2.5">
            {cancelled.map((c, i) => (
              <View key={c.id || i} className={`gap-1.5 ${i > 0 ? 'pt-2.5 border-t border-border/40' : ''}`}>
                <View className="flex-row items-center gap-2">
                  <Text className="text-xs font-jost-medium text-text-primary">{c.guestName}</Text>
                  <View className={`px-2 py-0.5 rounded-md ${c.noShow ? 'bg-warning-light' : 'bg-[#FAF0EF]'}`}>
                    <Text className={`text-[10px] font-jost-medium ${c.noShow ? 'text-warning-text' : 'text-error'}`}>
                      {c.noShow ? 'No-show' : t('Отмена', 'Cancelled')}
                    </Text>
                  </View>
                </View>
                <Text className="text-xs font-jost text-text-secondary">
                  {[c.room, c.dates, c.guests ? guestsText(c.guests, lang) : ''].filter(Boolean).join(' · ')}
                </Text>
              </View>
            ))}
            {!hasCancellations && (
              <Text className="text-[11px] font-jost text-text-secondary">{t('Отмен за выбранный период нет.', 'No cancellations for the selected period.')}</Text>
            )}
            {!hasNoShows && (
              <Text className={`text-[11px] font-jost text-text-secondary ${cancelled.length ? 'pt-1 border-t border-border/40' : ''}`}>
                {t('No-show за выбранный период нет.', 'No no-shows for the selected period.')}
              </Text>
            )}
          </View>
        </Accordion>
      </View>
    </>
  );
}

function UnpaidHeader({ lang, subtitle, onBack }: { lang: Lang; subtitle: string; onBack: () => void }) {
  const ru = lang === 'RU';
  return (
    <View className="px-5 pt-7 pb-3">
      <Text className="text-2xl font-spectral text-text-primary">{ru ? 'Ожидает оплаты' : 'Awaiting payment'}</Text>
      <Text className="text-xs font-jost text-text-secondary mt-0.5">{subtitle}</Text>
      <Pressable onPress={onBack} className="flex-row items-center gap-1.5 mt-3 self-start active:opacity-60">
        <ChevronLeft size={16} color="#8A8177" />
        <Text className="text-xs font-jost text-text-secondary">{ru ? 'Дашборд' : 'Dashboard'}</Text>
      </Pressable>
    </View>
  );
}

function SearchField({ value, onChange, placeholder }: { value: string; onChange: (v: string) => void; placeholder: string }) {
  return (
    <View className="bg-white border border-border rounded-2xl h-11 flex-row items-center pl-3.5 pr-3 gap-2.5">
      <Search size={16} color="#8A8177" />
      <TextInput
        value={value}
        onChangeText={onChange}
        placeholder={placeholder}
        placeholderTextColor="rgba(138,129,119,0.8)"
        className="flex-1 text-xs font-jost text-text-primary py-0"
      />
      {!!value && (
        <Pressable hitSlop={8} onPress={() => onChange('')}>
          <Text className="text-xs text-text-secondary">✕</Text>
        </Pressable>
      )}
    </View>
  );
}

function NothingFound({ lang, query }: { lang: Lang; query: string }) {
  return (
    <View className="p-8 bg-white rounded-2xl border border-border">
      <Text className="text-xs font-jost text-text-secondary text-center">
        {query
          ? lang === 'RU'
            ? `Ничего не найдено по запросу «${query}»`
            : `Nothing found for “${query}”`
          : lang === 'RU'
            ? 'Нет задолженностей'
            : 'Nothing is due'}
      </Text>
    </View>
  );
}

function UnpaidBookingsView({ lang, items, onBack }: { lang: Lang; items: UnpaidBooking[]; onBack: () => void }) {
  const ru = lang === 'RU';
  const [query, setQuery] = useState('');
  const q = query.toLowerCase().trim();
  const filtered = items.filter(
    (b) =>
      !q ||
      b.guestName.toLowerCase().includes(q) ||
      b.room.toLowerCase().includes(q) ||
      b.phone.includes(q) ||
      b.category.toLowerCase().includes(q)
  );
  const total = items.reduce((s, b) => s + b.amount, 0);

  return (
    <SafeAreaView edges={['top']} className="flex-1 bg-background">
      <UnpaidHeader lang={lang} subtitle={ru ? `Брони · остаток ${money(total)}` : `Bookings · balance ${money(total)}`} onBack={onBack} />
      <ScrollView className="flex-1" contentContainerClassName="px-5 pb-6 gap-3.5" keyboardShouldPersistTaps="handled">
        <SearchField value={query} onChange={setQuery} placeholder={ru ? 'Гость, номер или телефон' : 'Guest, room or phone'} />
        <View className="gap-3">
          {filtered.map((item, i) => (
            <View key={item.id || i} className="bg-white rounded-2xl border border-border p-[18px] gap-2">
              <View className="flex-row items-start justify-between gap-2">
                <Text className="text-sm font-jost-medium text-text-primary flex-shrink">{item.guestName}</Text>
                <Text className="text-sm font-jost-medium text-primary">{money(item.amount)}</Text>
              </View>
              <Text className="text-xs font-jost text-text-secondary">{[item.room, item.category, item.dates].filter(Boolean).join(' · ')}</Text>
              <View className="flex-row items-center justify-between pt-1">
                <Text className="text-[11px] font-jost text-text-secondary">{ru ? 'Остаток к оплате' : 'Balance due'}</Text>
                {!!item.phone && (
                  <Pressable
                    hitSlop={8}
                    onPress={() => Linking.openURL(`tel:${item.phone.replace(/[^\d+]/g, '')}`).catch(() => undefined)}
                    className="flex-row items-center gap-1.5 active:opacity-60"
                  >
                    <Phone size={14} color="#C2410C" />
                    <Text className="text-[11px] font-jost-medium text-primary">{ru ? 'Позвонить' : 'Call'}</Text>
                  </Pressable>
                )}
              </View>
            </View>
          ))}
          {filtered.length === 0 && <NothingFound lang={lang} query={query} />}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function UnpaidServicesView({ lang, items, onBack }: { lang: Lang; items: UnpaidService[]; onBack: () => void }) {
  const ru = lang === 'RU';
  const [query, setQuery] = useState('');
  const q = query.toLowerCase().trim();
  const filtered = items.filter(
    (s) => !q || s.guestName.toLowerCase().includes(q) || s.room.toLowerCase().includes(q) || s.serviceName.toLowerCase().includes(q)
  );
  const total = items.reduce((s, b) => s + b.amount, 0);

  return (
    <SafeAreaView edges={['top']} className="flex-1 bg-background">
      <UnpaidHeader lang={lang} subtitle={ru ? `Услуги · остаток ${money(total)}` : `Services · balance ${money(total)}`} onBack={onBack} />
      <ScrollView className="flex-1" contentContainerClassName="px-5 pb-6 gap-3.5" keyboardShouldPersistTaps="handled">
        <SearchField value={query} onChange={setQuery} placeholder={ru ? 'Гость или услуга' : 'Guest or service'} />
        <View className="gap-3">
          {filtered.map((item, i) => (
            <View key={item.id || i} className="bg-white rounded-2xl border border-border p-[18px] gap-2">
              <View className="flex-row items-start justify-between gap-2">
                <Text className="text-sm font-jost-medium text-text-primary flex-shrink">{item.guestName}</Text>
                <Text className="text-sm font-jost-medium text-primary">{money(item.amount)}</Text>
              </View>
              <Text className="text-xs font-jost text-text-secondary">{[item.room, item.serviceName].filter(Boolean).join(' · ')}</Text>
              <View className="flex-row items-center justify-between pt-1">
                <Text className="text-[11px] font-jost text-text-secondary flex-shrink">{[item.date, item.status].filter(Boolean).join(' · ')}</Text>
                <Pressable hitSlop={8} onPress={() => Alert.alert(ru ? 'Добавится позже' : 'Coming later')} className="flex-row items-center gap-0.5 active:opacity-60">
                  <Text className="text-[11px] font-jost-medium text-primary">{ru ? 'Проверить' : 'Check'}</Text>
                  <ChevronRight size={14} color="#C2410C" />
                </Pressable>
              </View>
            </View>
          ))}
          {filtered.length === 0 && <NothingFound lang={lang} query={query} />}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
