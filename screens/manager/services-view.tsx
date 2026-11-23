import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Alert, Modal, Pressable, RefreshControl, ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Filter, User, X } from 'lucide-react-native';
import { useApp } from '@/context/app-store';
import { useReception } from '@/context/reception-store';
import {
  createCatalogService,
  createRecord,
  listRecord,
  listServicesCatalog,
  listStaff,
  updateCatalogService,
  updateRecord,
} from '@/lib/api-client';
import { SelectField } from '@/components/ui/select-field';
import { money, num } from '@/components/manager/manager-utils';
import type { Lang } from '@/components/reception/booking-utils';
import { list, mapAccount, mapEmployee, type FinanceAccount } from '@/components/manager/finance-data';
import { useManagerToast } from '@/components/manager/toast';
import { AddCard, Chevron, comingSoon, EmptyCard, FieldLabel, FormButtons, FormInput, InfoRow, SearchInput, showError } from '@/components/manager/finance-ui';

type Json = Record<string, any>;
const str = (v: unknown) => (v === null || v === undefined ? '' : String(v));
const pad = (n: number) => String(n).padStart(2, '0');
const TIME_RE = /^([01]\d|2[0-3]):[0-5]\d$/;

interface CatalogService {
  id: string;
  code: string;
  name: string;
  description: string;
  price: number;
  available: boolean;
  kind: string;
  responsible: string;
}

interface ServiceOrder {
  id: string;
  number: string;
  title: string;
  guestName: string;
  room: string;
  scheduledAt: string;
  amount: number;
  status: string;
  paymentStatus: string;
  accountName: string;
  search: string;
}

const ORDER_STATUS: Record<string, [string, string]> = {
  new: ['Новая', 'New'],
  accepted: ['Подтверждена', 'Confirmed'],
  in_progress: ['В работе', 'In progress'],
  completed: ['Выполнена', 'Done'],
  cancelled: ['Отменена', 'Cancelled'],
};
const PAYMENT: Record<string, { ru: string; en: string; bg: string; text: string }> = {
  paid: { ru: 'Оплачено', en: 'Paid', bg: '#EAF3EC', text: '#3D7C52' },
  included: { ru: 'Включено в тариф', en: 'Included', bg: '#EAF3EC', text: '#3D7C52' },
  bill_to_room: { ru: 'На счёт номера', en: 'Billed to room', bg: '#FAF2E6', text: '#7A4B1A' },
  unpaid: { ru: 'Не оплачено', en: 'Unpaid', bg: '#FDF0F0', text: '#B3261E' },
};

function orderWhen(iso: string, lang: Lang) {
  const d = new Date(iso);
  if (!iso || Number.isNaN(d.getTime())) return '';
  const date = d.toLocaleDateString(lang === 'RU' ? 'ru-RU' : 'en-GB', { day: 'numeric', month: 'short' });
  return `${date} · ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function ManagerServicesView() {
  const toast = useManagerToast();
  const { lang } = useApp();
  const ru = lang === 'RU';
  const t = (r: string, e: string) => (ru ? r : e);
  const [tab, setTab] = useState<'CATALOG' | 'ORDERS'>('CATALOG');
  const [catalog, setCatalog] = useState<CatalogService[]>([]);
  const [ordersRaw, setOrdersRaw] = useState<Json[]>([]);
  const [accounts, setAccounts] = useState<FinanceAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [bookItem, setBookItem] = useState<CatalogService | null>(null);
  const [payOrder, setPayOrder] = useState<ServiceOrder | null>(null);

  const load = useCallback(async () => {
    setError('');
    try {
      const [services, orders, staff, accs] = await Promise.all([
        listServicesCatalog().then(list),
        listRecord('service_request').then(list),
        listStaff().then(list).catch(() => [] as Json[]),
        listRecord('finance_account').then(list).catch(() => [] as Json[]),
      ]);
      const staffNames = new Map(staff.map(mapEmployee).map((e) => [e.id, e.name]));
      setCatalog(
        services
          .filter((s) => str(s.kind || 'service') === 'service')
          .map((s) => ({
            id: str(s.id),
            code: str(s.code || s.id),
            name: str(s.name || s.code) || '—',
            description: str(s.description),
            price: num(s.price),
            available: s.isAvailable !== false,
            kind: str(s.kind || 'service'),
            responsible: (s.assigneeUserId && staffNames.get(str(s.assigneeUserId))) || str(s.assigneeDepartment),
          }))
          .sort((a, b) => a.name.localeCompare(b.name, 'ru'))
      );
      setOrdersRaw(orders);
      setAccounts(accs.map(mapAccount));
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  }, [load]);

  const orders: ServiceOrder[] = useMemo(() => {
    const byId = new Map(catalog.map((c) => [c.id, c.name]));
    const byCode = new Map(catalog.map((c) => [c.code.toLowerCase(), c.name]));
    const accName = new Map(accounts.map((a) => [a.id, a.name]));
    return ordersRaw
      .map((o) => {
        const title = byId.get(str(o.catalog_item_id)) ?? byCode.get(str(o.type).toLowerCase()) ?? (str(o.type) || t('Услуга', 'Service'));
        const number = str(o.number ?? o.request_number) || str(o.id).slice(-4).toUpperCase();
        const room = str(o.room_number);
        return {
          id: str(o.id),
          number: `№${number}`,
          title,
          guestName: str(o.guest_name) || '—',
          room: room && room !== '—' ? `№${room.replace(/^№/, '')}` : '—',
          scheduledAt: str(o.scheduled_at ?? o.created_at),
          amount: num(o.amount),
          status: str(o.status) || 'new',
          paymentStatus: PAYMENT[str(o.payment_status)] ? str(o.payment_status) : 'unpaid',
          accountName: accName.get(str(o.payment_account_id ?? o.account_id)) ?? '',
          search: [title, o.guest_name, number, room, o.comment].filter(Boolean).join(' ').toLowerCase(),
        };
      })
      .sort((a, b) => b.scheduledAt.localeCompare(a.scheduledAt));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ordersRaw, catalog, accounts, lang]);

  const setOrderStatus = async (o: ServiceOrder, status: string) => {
    try {
      await updateRecord('service_request', o.id, { status });
      const done =
        status === 'in_progress'
          ? t(`Заказ ${o.number} переведён в статус «В работе»`, `Order ${o.number} moved to “In progress”`)
          : status === 'completed'
            ? t(`Заказ ${o.number} выполнен`, `Order ${o.number} completed`)
            : status === 'cancelled'
              ? t(`Заказ ${o.number} отменён`, `Order ${o.number} cancelled`)
              : '';
      if (done) toast(done);
      await load();
    } catch (e) {
      showError(lang, e);
    }
  };

  return (
    <View className="flex-1">
      <View className="px-5 pb-3 flex-row items-center gap-6 border-b border-border/70">
        {(['CATALOG', 'ORDERS'] as const).map((id) => {
          const active = tab === id;
          return (
            <Pressable key={id} onPress={() => setTab(id)} className="pb-2" style={{ borderBottomWidth: 2, borderBottomColor: active ? '#C2410C' : 'transparent' }}>
              <Text className={`text-xs ${active ? 'text-primary font-jost-medium' : 'text-text-secondary font-jost'}`}>
                {id === 'CATALOG' ? t('Каталог', 'Catalog') : t('Заявки и брони', 'Orders & Bookings')}
              </Text>
            </Pressable>
          );
        })}
      </View>

      <ScrollView
        className="flex-1"
        contentContainerClassName="px-5 py-3.5 gap-3.5"
        keyboardShouldPersistTaps="handled"
        automaticallyAdjustKeyboardInsets
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {loading && !catalog.length && !ordersRaw.length ? (
          <View className="py-16 items-center">
            <ActivityIndicator color="#C2410C" />
          </View>
        ) : error && !catalog.length && !ordersRaw.length ? (
          <View className="py-12 items-center gap-3">
            <Text className="text-sm font-jost text-text-secondary text-center">{t('Не удалось загрузить услуги', 'Failed to load services')}</Text>
            <Text className="text-xs font-jost text-text-muted text-center">{error}</Text>
            <Pressable onPress={load} className="px-4 py-2 rounded-xl border border-border bg-white active:bg-background">
              <Text className="text-xs font-jost-medium text-text-primary">{t('Повторить', 'Retry')}</Text>
            </Pressable>
          </View>
        ) : tab === 'CATALOG' ? (
          <CatalogTab lang={lang} catalog={catalog} reload={load} onBook={setBookItem} />
        ) : (
          <OrdersTab lang={lang} orders={orders} onStatus={setOrderStatus} onPay={setPayOrder} />
        )}
      </ScrollView>

      {bookItem && (
        <BookServiceModal
          lang={lang}
          item={bookItem}
          onClose={() => setBookItem(null)}
          onDone={async () => {
            toast(t(`Услуга «${bookItem.name}» забронирована`, `Service “${bookItem.name}” booked`));
            setBookItem(null);
            await load();
          }}
        />
      )}
      {payOrder && (
        <PayOrderModal
          lang={lang}
          order={payOrder}
          accounts={accounts.filter((a) => !a.archived)}
          onClose={() => setPayOrder(null)}
          onDone={async () => {
            toast(t(`Заказ ${payOrder.number} успешно оплачен`, `Order ${payOrder.number} paid`));
            setPayOrder(null);
            await load();
          }}
        />
      )}
    </View>
  );
}

export function FilterButton({ active, onPress }: { active: boolean; onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      className={`h-11 w-11 rounded-xl border items-center justify-center ${active ? 'bg-dark border-dark' : 'bg-white border-border active:bg-background'}`}
    >
      <Filter size={18} color={active ? '#fff' : '#241E1A'} />
    </Pressable>
  );
}

// ---------- Каталог ----------

function CatalogTab({ lang, catalog, reload, onBook }: { lang: Lang; catalog: CatalogService[]; reload: () => Promise<void>; onBook: (s: CatalogService) => void }) {
  const toast = useManagerToast();
  const ru = lang === 'RU';
  const t = (r: string, e: string) => (ru ? r : e);
  const [search, setSearch] = useState('');
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [availability, setAvailability] = useState<'ALL' | 'YES' | 'NO'>('ALL');
  const [responsible, setResponsible] = useState('ALL');
  const [addOpen, setAddOpen] = useState(false);
  const [name, setName] = useState('');
  const [desc, setDesc] = useState('');
  const [resp, setResp] = useState('');
  const [price, setPrice] = useState('');
  const [busy, setBusy] = useState(false);
  const [expanded, setExpanded] = useState<string | null>(null);

  const responsibles = useMemo(() => [...new Set(catalog.map((c) => c.responsible).filter(Boolean))], [catalog]);
  const filtered = catalog.filter((s) => {
    if (availability === 'YES' && !s.available) return false;
    if (availability === 'NO' && s.available) return false;
    if (responsible !== 'ALL' && s.responsible !== responsible) return false;
    const q = search.trim().toLowerCase();
    if (q && ![s.name, s.description, s.responsible].some((v) => v.toLowerCase().includes(q))) return false;
    return true;
  });
  const filtersActive = availability !== 'ALL' || responsible !== 'ALL';

  const create = async () => {
    if (!name.trim()) return toast(t('Введите название услуги', 'Enter the service name'));
    setBusy(true);
    try {
      await createCatalogService({
        code: `service_${Date.now().toString(36)}`,
        name: name.trim(),
        description: desc.trim(),
        price: num(price),
        isAvailable: true,
        kind: 'service',
        assigneeDepartment: resp.trim() || null,
      });
      toast(t(`Услуга «${name.trim()}» добавлена в каталог`, `Service “${name.trim()}” added to the catalog`));
      setName('');
      setDesc('');
      setResp('');
      setPrice('');
      setAddOpen(false);
      await reload();
    } catch (e) {
      showError(lang, e);
    } finally {
      setBusy(false);
    }
  };

  const toggle = async (s: CatalogService) => {
    try {
      await updateCatalogService(s.id, { isAvailable: !s.available });
      toast(s.available ? t(`Услуга «${s.name}» временно приостановлена`, `Service “${s.name}” paused`) : t(`Услуга «${s.name}» снова доступна`, `Service “${s.name}” is available again`));
      await reload();
    } catch (e) {
      showError(lang, e);
    }
  };

  return (
    <>
      <View className="flex-row items-center gap-2">
        <View className="flex-1">
          <SearchInput value={search} onChangeText={setSearch} placeholder={t('Название услуги или ответственный', 'Service or assignee')} />
        </View>
        <FilterButton active={filtersOpen || filtersActive} onPress={() => setFiltersOpen((v) => !v)} />
      </View>

      {filtersOpen && (
        <View className="p-3.5 bg-white border border-border rounded-2xl flex-row gap-2.5">
          <View className="flex-1">
            <FieldLabel>{t('Доступность', 'Availability')}</FieldLabel>
            <SelectField
              variant="soft"
              value={availability}
              onChange={setAvailability}
              options={[
                { value: 'ALL', label: t('Все услуги', 'All services') },
                { value: 'YES', label: t('Доступно', 'Available') },
                { value: 'NO', label: t('Недоступно', 'Unavailable') },
              ]}
            />
          </View>
          <View className="flex-1">
            <FieldLabel>{t('Ответственный', 'Assignee')}</FieldLabel>
            <SelectField
              variant="soft"
              value={responsible}
              onChange={setResponsible}
              options={[{ value: 'ALL', label: t('Все', 'All') }, ...responsibles.map((r) => ({ value: r, label: r }))]}
            />
          </View>
        </View>
      )}

      <AddCard title={t('Новая услуга', 'New service')} open={addOpen} onToggle={() => setAddOpen((v) => !v)}>
        <View>
          <FieldLabel>{t('Название услуги', 'Service name')}</FieldLabel>
          <FormInput value={name} onChangeText={setName} placeholder={t('Например: Аренда конференц-зала', 'E.g. Conference room rental')} />
        </View>
        <View>
          <FieldLabel>{t('Краткое описание', 'Short description')}</FieldLabel>
          <FormInput value={desc} onChangeText={setDesc} placeholder={t('Описание услуги для гостя', 'Description for the guest')} />
        </View>
        <View className="flex-row gap-2">
          <View className="flex-1">
            <FieldLabel>{t('Ответственный', 'Assignee')}</FieldLabel>
            <FormInput value={resp} onChangeText={setResp} placeholder={t('porter / администратор', 'porter / admin')} />
          </View>
          <View className="flex-1">
            <FieldLabel>{t('Стоимость (₸)', 'Price (₸)')}</FieldLabel>
            <FormInput value={price} onChangeText={setPrice} placeholder="5 000" keyboardType="numeric" />
          </View>
        </View>
        <FormButtons lang={lang} busy={busy} submitLabel={t('Сохранить услугу', 'Save service')} onSubmit={create} onCancel={() => setAddOpen(false)} />
      </AddCard>

      {filtered.length === 0 ? (
        <EmptyCard text={t('Услуг по заданным параметрам не найдено', 'No services match the filters')} />
      ) : (
        filtered.map((s) => {
          const open = expanded === s.id;
          return (
            <View key={s.id} className="bg-white rounded-2xl border border-border p-[18px] gap-2.5">
              <View className="flex-row items-start justify-between gap-2">
                <Text className="flex-1 text-lg font-spectral text-text-primary">{s.name}</Text>
                <View className={`px-2 py-0.5 rounded-md ${s.available ? 'bg-[#EAF3EC]' : 'bg-[#F1EFEA]'}`}>
                  <Text className={`text-[10px] font-jost-medium ${s.available ? 'text-[#3D7C52]' : 'text-text-secondary'}`}>
                    {s.available ? t('Доступно', 'Available') : t('Недоступно', 'Unavailable')}
                  </Text>
                </View>
              </View>
              {!!s.description && <Text className="text-xs font-jost text-text-secondary leading-5">{s.description}</Text>}
              {!!s.responsible && (
                <View className="flex-row items-center gap-1.5">
                  <User size={14} color="#8A8177" />
                  <Text className="text-xs font-jost text-text-secondary">{s.responsible}</Text>
                </View>
              )}
              <Text className="text-2xl font-spectral text-text-primary pt-1">{money(s.price)}</Text>
              <Pressable
                disabled={!s.available}
                onPress={() => onBook(s)}
                className="bg-primary py-3 rounded-xl items-center active:bg-primary-hover"
                style={{ opacity: s.available ? 1 : 0.5 }}
              >
                <Text className="text-xs font-jost-medium text-white">{t('Забронировать', 'Book')}</Text>
              </Pressable>

              <View className="rounded-xl border border-border overflow-hidden">
                <Pressable onPress={() => setExpanded(open ? null : s.id)} className="p-3 flex-row items-center justify-between bg-white active:bg-background">
                  <Text className="text-xs font-jost text-text-primary">{t('Управление услугой', 'Manage service')}</Text>
                  <Chevron open={open} />
                </Pressable>
                {open && (
                  <View className="p-3.5 bg-background/70 border-t border-border/60 gap-2.5">
                    <InfoRow
                      label={t('Статус в каталоге:', 'Catalog status:')}
                      value={s.available ? t('Активна для заказа', 'Open for orders') : t('Приостановлена', 'Paused')}
                      valueClass={s.available ? 'text-[#3D7C52] font-jost-medium' : 'text-text-secondary font-jost-medium'}
                    />
                    <InfoRow label={t('Назначенный исполнитель:', 'Assignee:')} value={s.responsible || '—'} />
                    <View className="flex-row gap-2 pt-2 border-t border-border/50">
                      <Pressable onPress={() => comingSoon(lang)} className="flex-1 bg-white border border-border py-2 rounded-lg items-center active:bg-background">
                        <Text className="text-xs font-jost-medium text-text-primary">{t('Редактировать', 'Edit')}</Text>
                      </Pressable>
                      <Pressable onPress={() => toggle(s)} className="flex-1 bg-white border border-border py-2 rounded-lg items-center active:bg-[#FBECEA]">
                        <Text className="text-xs font-jost text-[#B3261E]">{s.available ? t('Приостановить', 'Pause') : t('Включить', 'Enable')}</Text>
                      </Pressable>
                    </View>
                  </View>
                )}
              </View>
            </View>
          );
        })
      )}
    </>
  );
}

// ---------- Заявки и брони ----------

function OrdersTab({
  lang,
  orders,
  onStatus,
  onPay,
}: {
  lang: Lang;
  orders: ServiceOrder[];
  onStatus: (o: ServiceOrder, status: string) => void;
  onPay: (o: ServiceOrder) => void;
}) {
  const ru = lang === 'RU';
  const t = (r: string, e: string) => (ru ? r : e);
  const [search, setSearch] = useState('');
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [status, setStatus] = useState('ALL');
  const [payment, setPayment] = useState<'ALL' | 'PAID' | 'UNPAID'>('ALL');
  const [expanded, setExpanded] = useState<string | null>(null);

  const isPaid = (o: ServiceOrder) => o.paymentStatus === 'paid' || o.paymentStatus === 'included';
  const filtered = orders.filter((o) => {
    if (status !== 'ALL' && o.status !== status) return false;
    if (payment === 'PAID' && !isPaid(o)) return false;
    if (payment === 'UNPAID' && isPaid(o)) return false;
    const q = search.trim().toLowerCase();
    return !q || o.search.includes(q);
  });

  return (
    <>
      <View className="flex-row items-center gap-2">
        <View className="flex-1">
          <SearchInput value={search} onChangeText={setSearch} placeholder={t('Гость, услуга или № заявки', 'Guest, service or order #')} />
        </View>
        <FilterButton active={filtersOpen || status !== 'ALL' || payment !== 'ALL'} onPress={() => setFiltersOpen((v) => !v)} />
      </View>

      {filtersOpen && (
        <View className="p-3.5 bg-white border border-border rounded-2xl flex-row gap-2.5">
          <View className="flex-1">
            <FieldLabel>{t('Статус', 'Status')}</FieldLabel>
            <SelectField
              variant="soft"
              value={status}
              onChange={setStatus}
              options={[
                { value: 'ALL', label: t('Все статусы', 'All statuses') },
                ...Object.entries(ORDER_STATUS).map(([v, l]) => ({ value: v, label: ru ? l[0] : l[1] })),
              ]}
            />
          </View>
          <View className="flex-1">
            <FieldLabel>{t('Оплата', 'Payment')}</FieldLabel>
            <SelectField
              variant="soft"
              value={payment}
              onChange={setPayment}
              options={[
                { value: 'ALL', label: t('Любая', 'Any') },
                { value: 'PAID', label: t('Оплачено', 'Paid') },
                { value: 'UNPAID', label: t('Не оплачено', 'Unpaid') },
              ]}
            />
          </View>
        </View>
      )}

      {filtered.length === 0 ? (
        <EmptyCard text={t('Заявок по заданным параметрам не найдено', 'No orders match the filters')} />
      ) : (
        filtered.map((o) => {
          const open = expanded === o.id;
          const st = ORDER_STATUS[o.status];
          const stStyle =
            o.status === 'completed' ? 'bg-[#EAF3EC] text-[#3D7C52]' : o.status === 'cancelled' ? 'bg-[#F1EFEA] text-text-secondary' : 'bg-[#FDF3E3] text-[#B87A28]';
          const [stBg, stText] = stStyle.split(' ');
          const pay = PAYMENT[o.paymentStatus];
          const closed = o.status === 'completed' || o.status === 'cancelled';
          return (
            <View key={o.id} className="bg-white rounded-2xl border border-border p-4 gap-2">
              <View className="flex-row items-start justify-between gap-2">
                <Text className="flex-1 text-sm font-jost-medium text-text-primary">{o.title}</Text>
                <Text className="text-xs font-jost text-text-secondary">{o.number}</Text>
              </View>
              <Text className="text-xs font-jost text-text-secondary">
                {o.guestName} · {o.room}
              </Text>
              <View className="flex-row items-center justify-between">
                <Text className="text-xs font-jost text-text-secondary">{orderWhen(o.scheduledAt, lang)}</Text>
                <Pressable onPress={() => setExpanded(open ? null : o.id)} hitSlop={6} className="flex-row items-center gap-1 active:opacity-60">
                  <Text className="text-xs font-spectral text-text-primary">{money(o.amount)}</Text>
                  <Chevron open={open} size={14} />
                </Pressable>
              </View>
              <View className="flex-row items-center gap-2 pt-1">
                <View className={`px-2.5 py-0.5 rounded-md ${stBg}`}>
                  <Text className={`text-[11px] font-jost-medium ${stText}`}>{st ? (ru ? st[0] : st[1]) : o.status}</Text>
                </View>
                <View className="px-2.5 py-0.5 rounded-md" style={{ backgroundColor: pay.bg }}>
                  <Text className="text-[11px] font-jost-medium" style={{ color: pay.text }}>
                    {ru ? pay.ru : pay.en}
                  </Text>
                </View>
              </View>

              {open && (
                <View className="mt-3 bg-background rounded-xl p-3 gap-2.5">
                  <InfoRow label={t('Счёт зачисления:', 'Credited to:')} value={o.accountName || '—'} />
                  <View className="flex-row items-center justify-between">
                    <Text className="text-xs font-jost text-text-secondary">{t('Управление оплатой:', 'Payment:')}</Text>
                    <Pressable onPress={() => (isPaid(o) ? comingSoon(lang) : onPay(o))} hitSlop={6}>
                      <Text className="text-xs font-jost-medium text-primary">{isPaid(o) ? t('Снять оплату', 'Undo payment') : t('Отметить оплаченным', 'Mark as paid')}</Text>
                    </Pressable>
                  </View>
                  {!closed && (
                    <View className="flex-row gap-1.5 pt-1.5 border-t border-border/50">
                      <Pressable onPress={() => onStatus(o, 'in_progress')} className="flex-1 bg-white border border-border py-1.5 rounded-lg items-center active:bg-background">
                        <Text className="text-[11px] font-jost text-text-primary">{t('В работу', 'Start')}</Text>
                      </Pressable>
                      <Pressable onPress={() => onStatus(o, 'completed')} className="flex-1 bg-white border border-border py-1.5 rounded-lg items-center active:bg-[#EAF3EC]">
                        <Text className="text-[11px] font-jost-medium text-[#3D7C52]">{t('Выполнена', 'Done')}</Text>
                      </Pressable>
                      <Pressable
                        onPress={() =>
                          Alert.alert(t('Отменить заявку?', 'Cancel the order?'), o.title, [
                            { text: t('Нет', 'No'), style: 'cancel' },
                            { text: t('Отменить', 'Cancel order'), style: 'destructive', onPress: () => onStatus(o, 'cancelled') },
                          ])
                        }
                        className="flex-1 bg-white border border-border py-1.5 rounded-lg items-center active:bg-[#FBECEA]"
                      >
                        <Text className="text-[11px] font-jost text-[#B3261E]">{t('Отменить', 'Cancel')}</Text>
                      </Pressable>
                    </View>
                  )}
                </View>
              )}
            </View>
          );
        })
      )}
    </>
  );
}

// ---------- modals ----------

function Sheet({ title, subtitle, onClose, children }: { title: string; subtitle?: string; onClose: () => void; children: React.ReactNode }) {
  const insets = useSafeAreaInsets();
  return (
    <Modal visible transparent animationType="slide" onRequestClose={onClose}>
      <Pressable className="flex-1 bg-black/40" onPress={onClose} />
      <View className="bg-white rounded-t-3xl border border-border overflow-hidden" style={{ paddingBottom: insets.bottom }}>
        <View className="p-[18px] border-b border-border flex-row items-start justify-between bg-background gap-3">
          <View className="flex-1">
            <Text className="text-base font-spectral text-text-primary">{title}</Text>
            {!!subtitle && <Text className="text-[11px] font-jost text-text-secondary mt-0.5">{subtitle}</Text>}
          </View>
          <Pressable onPress={onClose} hitSlop={8} className="p-1.5 active:opacity-60">
            <X size={20} color="#8A8177" />
          </Pressable>
        </View>
        <View className="p-5 gap-4">{children}</View>
      </View>
    </Modal>
  );
}

function SheetButtons({ lang, label, busy, onSubmit, onCancel }: { lang: Lang; label: string; busy: boolean; onSubmit: () => void; onCancel: () => void }) {
  return (
    <View className="pt-2 flex-row items-center gap-2">
      <Pressable disabled={busy} onPress={onSubmit} className="flex-1 bg-primary py-3 rounded-xl items-center active:bg-primary-hover" style={{ opacity: busy ? 0.6 : 1 }}>
        <Text className="text-xs font-jost-medium text-white">{label}</Text>
      </Pressable>
      <Pressable onPress={onCancel} className="px-4 bg-white border border-border py-3 rounded-xl active:bg-background">
        <Text className="text-xs font-jost text-text-secondary">{lang === 'RU' ? 'Отмена' : 'Cancel'}</Text>
      </Pressable>
    </View>
  );
}

function nextHour() {
  const d = new Date();
  return `${pad((d.getHours() + 1) % 24)}:00`;
}

// «Заказ услуги»: the guest is one of the in-house bookings; the time is today's.
function BookServiceModal({ lang, item, onClose, onDone }: { lang: Lang; item: CatalogService; onClose: () => void; onDone: () => void }) {
  const ru = lang === 'RU';
  const t = (r: string, e: string) => (ru ? r : e);
  const { bookings } = useReception();
  const inHouse = useMemo(
    () => bookings.filter((b) => b.status === 'CHECKED_IN').sort((a, b) => a.roomNumber.localeCompare(b.roomNumber, undefined, { numeric: true })),
    [bookings]
  );
  const [bookingId, setBookingId] = useState(inHouse[0]?.id ?? '');
  const [time, setTime] = useState(nextHour);
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    const b = inHouse.find((x) => x.id === bookingId);
    if (!b) return Alert.alert(t('Выберите гостя', 'Choose a guest'));
    if (!TIME_RE.test(time)) return Alert.alert(t('Время в формате ЧЧ:ММ', 'Time as HH:MM'));
    const [h, m] = time.split(':').map(Number);
    const at = new Date();
    at.setHours(h, m, 0, 0);
    setBusy(true);
    try {
      await createRecord('service_request', {
        booking_id: b.id,
        guest_id: b.guestId || undefined,
        guest_name: b.guestName && b.guestName !== '—' ? b.guestName : 'Walk-in',
        guest_phone: b.phone || undefined,
        room_id: b.roomId || undefined,
        room_number: b.roomNumber || '—',
        catalog_item_id: item.id,
        kind: item.kind,
        type: item.code,
        amount: item.price,
        scheduled_at: at.toISOString(),
        duration_minutes: null,
        source: 'staff',
        pay_mode: 'on_checkout',
        payment_status: 'bill_to_room',
      });
      onDone();
    } catch (e) {
      showError(lang, e);
    } finally {
      setBusy(false);
    }
  };

  return (
    <Sheet title={t('Заказ услуги', 'Service order')} subtitle={`${item.name} · ${money(item.price)}`} onClose={onClose}>
      <View>
        <FieldLabel>{t('Выберите гостя / номер', 'Choose guest / room')}</FieldLabel>
        {inHouse.length === 0 ? (
          <Text className="text-xs font-jost text-text-secondary py-2">{t('Сейчас нет проживающих гостей', 'No in-house guests right now')}</Text>
        ) : (
          <SelectField variant="form" value={bookingId} onChange={setBookingId} options={inHouse.map((b) => ({ value: b.id, label: `${b.guestName} · №${b.roomNumber}` }))} />
        )}
      </View>
      <View>
        <FieldLabel>{t('Время оказания услуги', 'Service time')}</FieldLabel>
        <FormInput value={time} onChangeText={setTime} placeholder="18:00" keyboardType="numbers-and-punctuation" maxLength={5} />
      </View>
      <SheetButtons lang={lang} busy={busy} label={t('Подтвердить бронь услуги', 'Confirm service booking')} onSubmit={submit} onCancel={onClose} />
    </Sheet>
  );
}

// «Отметить оплаченным» needs the account the money went to (as on the web).
function PayOrderModal({ lang, order, accounts, onClose, onDone }: { lang: Lang; order: ServiceOrder; accounts: FinanceAccount[]; onClose: () => void; onDone: () => void }) {
  const ru = lang === 'RU';
  const t = (r: string, e: string) => (ru ? r : e);
  const [accountId, setAccountId] = useState(accounts[0]?.id ?? '');
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    if (!accountId) return Alert.alert(t('Выберите счёт', 'Choose an account'));
    setBusy(true);
    try {
      await updateRecord('service_request', order.id, { payment_status: 'paid', account_id: accountId });
      onDone();
    } catch (e) {
      showError(lang, e);
    } finally {
      setBusy(false);
    }
  };

  return (
    <Sheet title={t('Оплата заявки', 'Order payment')} subtitle={`${order.title} · ${money(order.amount)}`} onClose={onClose}>
      <View>
        <FieldLabel>{t('Счёт зачисления', 'Credit to account')}</FieldLabel>
        <SelectField variant="form" value={accountId} onChange={setAccountId} options={accounts.map((a) => ({ value: a.id, label: a.name }))} />
      </View>
      <SheetButtons lang={lang} busy={busy} label={t('Отметить оплаченным', 'Mark as paid')} onSubmit={submit} onCancel={onClose} />
    </Sheet>
  );
}
