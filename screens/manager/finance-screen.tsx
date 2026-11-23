import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, RefreshControl, ScrollView, Text, View, type NativeScrollEvent, type NativeSyntheticEvent } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Download, Filter } from 'lucide-react-native';
import { useApp } from '@/context/app-store';
import { listRecord, listServicesCatalog } from '@/lib/api-client';
import { SelectField } from '@/components/ui/select-field';
import { money, todayIso } from '@/components/manager/manager-utils';
import { addDaysIso, pluralRu, type Lang } from '@/components/reception/booking-utils';
import { buildLedger, list, mapAccount, type FinanceAccount, type LedgerEntry } from '@/components/manager/finance-data';
import { Checkbox, Chevron, comingSoon, EmptyCard, InfoRow, SearchInput } from '@/components/manager/finance-ui';
import { FinanceAccountsView } from '@/screens/manager/finance-accounts';
import { FinanceSalaryView } from '@/screens/manager/finance-salary';

type SubTab = 'TRANSACTIONS' | 'ACCOUNTS' | 'SALARY';
type Json = Record<string, any>;

export interface FinanceData {
  accounts: FinanceAccount[];
  ledger: LedgerEntry[];
}

// Optional record lists: a role may lack access to some of them, the ledger is built from what loads.
const safe = (p: Promise<unknown>) => p.then(list).catch(() => [] as Json[]);

export function ManagerFinanceScreen() {
  const { lang } = useApp();
  const ru = lang === 'RU';
  const t = (r: string, e: string) => (ru ? r : e);
  const [subTab, setSubTab] = useState<SubTab>('TRANSACTIONS');
  const [data, setData] = useState<FinanceData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setError('');
    try {
      const [accounts, transactions, expenses, requests, payroll, movements, items, services] = await Promise.all([
        listRecord('finance_account').then(list),
        listRecord('finance_transaction').then(list),
        safe(listRecord('finance_expense')),
        safe(listRecord('service_request')),
        safe(listRecord('payroll')),
        safe(listRecord('warehouse_movement')),
        safe(listRecord('warehouse_item')),
        safe(listServicesCatalog()),
      ]);
      setData({
        accounts: accounts.map(mapAccount),
        ledger: buildLedger({ accounts, transactions, expenses, requests, payroll, movements, items, services }, lang),
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }, [lang]);

  useEffect(() => {
    load();
  }, [load]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  }, [load]);

  const subtitle = subTab === 'TRANSACTIONS' ? t('Движение денег', 'Cash flow & transactions') : subTab === 'ACCOUNTS' ? t('Мои счета', 'Bank accounts & wallets') : t('Фонд оплаты труда', 'Payroll & compensation');
  const tabs: [SubTab, string][] = [
    ['TRANSACTIONS', t('Транзакции', 'Transactions')],
    ['ACCOUNTS', t('Счета', 'Accounts')],
    ['SALARY', t('Зарплата', 'Payroll')],
  ];

  return (
    <SafeAreaView edges={['top']} className="flex-1 bg-background">
      <View className="px-5 pt-7 pb-3">
        <Text className="text-2xl font-spectral text-text-primary">{t('Финансы', 'Finance')}</Text>
        <Text className="text-xs font-jost text-text-secondary mt-0.5">{subtitle}</Text>
        <View className="mt-3.5 bg-[#EAE6DE]/70 rounded-xl p-1 flex-row gap-1">
          {tabs.map(([id, label]) => {
            const active = subTab === id;
            return (
              <Pressable key={id} onPress={() => setSubTab(id)} className={`flex-1 py-2 rounded-lg items-center ${active ? 'bg-dark' : ''}`}>
                <Text className={`text-xs ${active ? 'text-white font-jost-medium' : 'text-[#6E665E] font-jost'}`}>{label}</Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      {subTab === 'SALARY' ? (
        <FinanceSalaryView />
      ) : loading && !data ? (
        <View className="py-16 items-center">
          <ActivityIndicator color="#C2410C" />
        </View>
      ) : !data ? (
        <View className="py-12 px-5 items-center gap-3">
          <Text className="text-sm font-jost text-text-secondary text-center">{t('Не удалось загрузить финансы', 'Failed to load finance')}</Text>
          {!!error && <Text className="text-xs font-jost text-text-muted text-center">{error}</Text>}
          <Pressable onPress={load} className="px-4 py-2 rounded-xl border border-border bg-white active:bg-background">
            <Text className="text-xs font-jost-medium text-text-primary">{t('Повторить', 'Retry')}</Text>
          </Pressable>
        </View>
      ) : subTab === 'ACCOUNTS' ? (
        <FinanceAccountsView lang={lang} accounts={data.accounts} refreshing={refreshing} onRefresh={onRefresh} reload={load} />
      ) : (
        <TransactionsView lang={lang} data={data} refreshing={refreshing} onRefresh={onRefresh} />
      )}
    </SafeAreaView>
  );
}

// ---------- Транзакции ----------

type TxPeriod = 'D30' | 'D7' | 'TODAY' | 'THIS_MONTH' | 'LAST_MONTH' | 'ALL';
const TX_PERIODS: { id: TxPeriod; ru: string; en: string }[] = [
  { id: 'D30', ru: '30 дней', en: '30 days' },
  { id: 'D7', ru: '7 дней', en: '7 days' },
  { id: 'TODAY', ru: 'Сегодня', en: 'Today' },
  { id: 'THIS_MONTH', ru: 'Этот месяц', en: 'This month' },
  { id: 'LAST_MONTH', ru: 'Прошлый месяц', en: 'Last month' },
  { id: 'ALL', ru: 'Весь период', en: 'All time' },
];

const pad = (n: number) => String(n).padStart(2, '0');
const localIso = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

// Inclusive local-date bounds of a period, null for "all time".
function periodBounds(p: TxPeriod): [string, string] | null {
  const today = todayIso();
  const now = new Date();
  if (p === 'TODAY') return [today, today];
  if (p === 'D7') return [addDaysIso(today, -6), today];
  if (p === 'D30') return [addDaysIso(today, -29), today];
  if (p === 'THIS_MONTH') return [localIso(new Date(now.getFullYear(), now.getMonth(), 1)), today];
  if (p === 'LAST_MONTH') return [localIso(new Date(now.getFullYear(), now.getMonth() - 1, 1)), localIso(new Date(now.getFullYear(), now.getMonth(), 0))];
  return null;
}

const entryDate = (e: LedgerEntry) => {
  const d = new Date(e.occurredAt);
  return Number.isNaN(d.getTime()) ? e.occurredAt.slice(0, 10) : localIso(d);
};

function whenText(iso: string, lang: Lang) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso.slice(0, 10);
  const date = d.toLocaleDateString(lang === 'RU' ? 'ru-RU' : 'en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
  return `${date}, ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

const affectsProfit = (e: LedgerEntry) => e.kind !== 'transfer' && !e.excludeFromTotals;

const PAGE = 40;

function TransactionsView({ lang, data, refreshing, onRefresh }: { lang: Lang; data: FinanceData; refreshing: boolean; onRefresh: () => void }) {
  const ru = lang === 'RU';
  const t = (r: string, e: string) => (ru ? r : e);
  const [search, setSearch] = useState('');
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [type, setType] = useState<'ALL' | 'income' | 'expense'>('ALL');
  const [account, setAccount] = useState('ALL');
  const [period, setPeriod] = useState<TxPeriod>('D30');
  const [showAll, setShowAll] = useState(false);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [limit, setLimit] = useState(PAGE);

  const inPeriod = useMemo(() => {
    const b = periodBounds(period);
    return b ? data.ledger.filter((e) => { const d = entryDate(e); return d >= b[0] && d <= b[1]; }) : data.ledger;
  }, [data.ledger, period]);

  const income = inPeriod.filter((e) => e.kind === 'income' && affectsProfit(e)).reduce((s, e) => s + e.amount, 0);
  const expense = inPeriod.filter((e) => e.kind === 'expense' && affectsProfit(e)).reduce((s, e) => s + e.amount, 0);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return inPeriod.filter((e) => {
      if (type !== 'ALL' && e.kind !== type) return false;
      if (account !== 'ALL' && e.accountId !== account) return false;
      if (!showAll && !affectsProfit(e)) return false;
      if (q && !e.search.includes(q) && !e.paymentLabel.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [inPeriod, type, account, showAll, search]);

  useEffect(() => setLimit(PAGE), [filtered]);

  const filtersActive = type !== 'ALL' || account !== 'ALL';
  const periodLabel = TX_PERIODS.find((p) => p.id === period)!;

  const onScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const { layoutMeasurement, contentOffset, contentSize } = e.nativeEvent;
    if (limit < filtered.length && layoutMeasurement.height + contentOffset.y > contentSize.height - 600) setLimit((l) => l + PAGE);
  };

  return (
    <ScrollView
      className="flex-1"
      contentContainerClassName="px-5 pb-6 gap-4"
      keyboardShouldPersistTaps="handled"
      onScroll={onScroll}
      scrollEventThrottle={200}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      <View className="flex-row gap-2.5">
        <View className="flex-1 bg-white rounded-2xl border border-border p-4">
          <Text className="text-[11px] font-jost text-text-secondary">{t('Общий доход', 'Total income')}</Text>
          <Text className="text-2xl font-spectral text-text-primary mt-1" numberOfLines={1} adjustsFontSizeToFit>
            {money(income)}
          </Text>
        </View>
        <View className="flex-1 bg-white rounded-2xl border border-border p-4">
          <Text className="text-[11px] font-jost text-text-secondary">{t('Общие расходы', 'Total expenses')}</Text>
          <Text className="text-2xl font-spectral text-text-primary mt-1" numberOfLines={1} adjustsFontSizeToFit>
            {money(expense)}
          </Text>
        </View>
      </View>

      <View className="bg-dark rounded-2xl p-[18px] flex-row items-center justify-between">
        <Text className="text-xs font-jost text-white/80">{t('Чистая прибыль', 'Net profit')}</Text>
        <Text className="text-2xl font-spectral text-white" numberOfLines={1} adjustsFontSizeToFit>
          {income - expense < 0 ? '−' : ''}
          {money(Math.abs(income - expense))}
        </Text>
      </View>

      <View className="gap-3 pt-1">
        <Text className="text-xs font-jost text-text-secondary">
          {ru ? `За выбранные ${periodLabel.ru.toLowerCase()}` : `For selected ${periodLabel.en.toLowerCase()}`}
        </Text>

        <SearchInput
          value={search}
          onChangeText={setSearch}
          placeholder={t('Поиск транзакции', 'Search transactions')}
          right={
            <Pressable
              hitSlop={6}
              onPress={() => setFiltersOpen((v) => !v)}
              className={`p-1.5 rounded-lg ${filtersOpen || filtersActive ? 'bg-background' : ''}`}
            >
              <Filter size={16} color={filtersOpen || filtersActive ? '#C2410C' : '#8A8177'} />
            </Pressable>
          }
        />

        {filtersOpen && (
          <View className="p-3.5 bg-white border border-border rounded-2xl gap-3">
            <View className="flex-row gap-2.5">
              <View className="flex-1">
                <Text className="text-[11px] font-jost text-text-secondary mb-1">{t('Тип', 'Type')}</Text>
                <SelectField
                  variant="soft"
                  value={type}
                  onChange={setType}
                  options={[
                    { value: 'ALL', label: t('Все типы', 'All types') },
                    { value: 'income', label: t('Доход', 'Income') },
                    { value: 'expense', label: t('Расход', 'Expense') },
                  ]}
                />
              </View>
              <View className="flex-1">
                <Text className="text-[11px] font-jost text-text-secondary mb-1">{t('Счёт', 'Account')}</Text>
                <SelectField
                  variant="soft"
                  value={account}
                  onChange={setAccount}
                  options={[{ value: 'ALL', label: t('Все счета', 'All accounts') }, ...data.accounts.map((a) => ({ value: a.id, label: a.name }))]}
                />
              </View>
            </View>
            {filtersActive && (
              <View className="items-end">
                <Pressable
                  onPress={() => {
                    setType('ALL');
                    setAccount('ALL');
                  }}
                >
                  <Text className="text-xs font-jost text-primary">{t('Сбросить фильтры', 'Reset filters')}</Text>
                </Pressable>
              </View>
            )}
          </View>
        )}

        <View>
          <Text className="text-xs font-jost text-text-secondary mb-1.5">{t('Период', 'Period')}</Text>
          <View className="flex-row items-center gap-2.5">
            <SelectField
              className="flex-1"
              variant="form"
              value={period}
              onChange={setPeriod}
              options={TX_PERIODS.map((p) => ({ value: p.id, label: ru ? p.ru : p.en }))}
            />
            <Pressable onPress={() => comingSoon(lang)} className="bg-primary rounded-xl h-11 w-11 items-center justify-center active:bg-primary-hover">
              <Download size={20} color="#fff" />
            </Pressable>
          </View>
        </View>

        <View className="pt-1">
          <Checkbox checked={showAll} onToggle={() => setShowAll((v) => !v)} label={t('Показывать не влияющие на доходность', 'Show non-profit-affecting')} />
        </View>
      </View>

      <View className="gap-2.5 pt-2">
        <View className="flex-row items-center justify-between">
          <Text className="text-xs font-jost-medium text-text-primary">{t('Транзакции', 'Transactions')}</Text>
          <Text className="text-[11px] font-jost text-text-secondary">
            {ru ? `${filtered.length} ${pluralRu(filtered.length, 'операция', 'операции', 'операций')}` : `${filtered.length} operations`}
          </Text>
        </View>

        {filtered.length === 0 ? (
          <EmptyCard text={t('По заданным фильтрам транзакций не найдено', 'No transactions match the filters')} />
        ) : (
          filtered.slice(0, limit).map((e) => (
            <TransactionCard key={`${e.kind}-${e.id}`} lang={lang} entry={e} open={expanded === `${e.kind}-${e.id}`} onToggle={() => setExpanded((v) => (v === `${e.kind}-${e.id}` ? null : `${e.kind}-${e.id}`))} />
          ))
        )}
        {limit < filtered.length && (
          <View className="py-3 items-center">
            <ActivityIndicator color="#C2410C" />
          </View>
        )}
      </View>
    </ScrollView>
  );
}

const KIND_STYLE: Record<LedgerEntry['kind'], { amount: string; badgeBg: string; badgeText: string; sign: string }> = {
  income: { amount: 'text-[#3D7C52]', badgeBg: 'bg-[#EBF4EE]', badgeText: 'text-[#3D7C52]', sign: '+' },
  expense: { amount: 'text-[#B3261E]', badgeBg: 'bg-[#FBECEA]', badgeText: 'text-[#B3261E]', sign: '−' },
  transfer: { amount: 'text-text-primary', badgeBg: 'bg-background', badgeText: 'text-text-secondary', sign: '' },
};

function TransactionCard({ lang, entry: e, open, onToggle }: { lang: Lang; entry: LedgerEntry; open: boolean; onToggle: () => void }) {
  const ru = lang === 'RU';
  const style = KIND_STYLE[e.kind];
  const title = e.counterparty !== '—' ? e.counterparty : e.description;
  return (
    <View className="bg-white rounded-2xl border border-border p-4 gap-2">
      <View className="flex-row items-start justify-between gap-2">
        <Text className="flex-1 text-sm font-jost-medium text-text-primary">{title}</Text>
        <Text className={`text-base font-spectral ${style.amount}`}>
          {style.sign}
          {money(e.amount)}
        </Text>
      </View>
      <Text className="text-xs font-jost text-text-secondary">
        {whenText(e.occurredAt, lang)}
        {e.accountName !== '—' ? ` · ${e.accountName}` : ''}
      </Text>
      <View className="flex-row items-center justify-between pt-1 gap-2">
        <View className={`${style.badgeBg} px-2.5 py-0.5 rounded-lg flex-shrink`}>
          <Text className={`text-[11px] font-jost-medium ${style.badgeText}`} numberOfLines={1}>
            {e.sourceLabel}
          </Text>
        </View>
        <Pressable onPress={onToggle} hitSlop={6} className="flex-row items-center gap-1 active:opacity-60">
          <Text className="text-xs font-jost text-text-secondary">{e.paymentLabel}</Text>
          <Chevron open={open} size={14} />
        </Pressable>
      </View>
      {open && (
        <View className="mt-3 bg-background rounded-xl p-3 gap-2">
          <InfoRow label={ru ? 'Назначение:' : 'Purpose:'} value={e.description} />
          <InfoRow label={e.kind === 'income' ? (ru ? 'Счёт зачисления:' : 'Credited to:') : ru ? 'Счёт списания:' : 'Debited from:'} value={e.accountName} />
          <InfoRow
            label={ru ? 'Фискальный чек:' : 'Fiscal receipt:'}
            value={e.fiscalReceipt ? (ru ? 'Сформирован' : 'Issued') : ru ? 'Нет' : 'No'}
            valueClass={e.fiscalReceipt ? 'text-[#3D7C52] font-jost-medium' : 'text-text-primary font-jost'}
          />
          <InfoRow label={ru ? 'Влияет на доходность:' : 'Affects profit:'} value={affectsProfit(e) ? (ru ? 'Да' : 'Yes') : ru ? 'Нет' : 'No'} valueClass="text-text-primary font-jost" />
        </View>
      )}
    </View>
  );
}
