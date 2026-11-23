import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Alert, Modal, Pressable, RefreshControl, ScrollView, Text, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Filter, X } from 'lucide-react-native';
import { useApp } from '@/context/app-store';
import { createRecord, listRecord } from '@/lib/api-client';
import { SelectField } from '@/components/ui/select-field';
import { dec, num } from '@/components/manager/manager-utils';
import { pluralRu, type Lang } from '@/components/reception/booking-utils';
import { list } from '@/components/manager/finance-data';
import { useManagerToast } from '@/components/manager/toast';
import { EmptyCard, FieldLabel, FormInput, SearchInput, showError } from '@/components/manager/finance-ui';

type Json = Record<string, any>;
const str = (v: unknown) => (v === null || v === undefined ? '' : String(v));
const first = (o: Json, keys: string[]) => keys.map((k) => o[k]).find((v) => v !== undefined && v !== null && v !== '');

interface StockItem {
  id: string;
  name: string;
  category: string;
  location: string;
  unit: string;
  quantity: number;
  min: number;
}

// Field names follow the PMS warehouse_item record; a few alternatives are accepted.
function mapItem(i: Json): StockItem {
  return {
    id: str(i.id),
    name: str(first(i, ['name', 'title'])) || '—',
    category: str(first(i, ['category_name', 'category'])),
    location: str(first(i, ['location', 'storage', 'warehouse_name', 'warehouse'])),
    unit: str(first(i, ['unit', 'unit_name', 'uom'])) || 'шт.',
    quantity: num(first(i, ['quantity', 'stock', 'current_stock', 'stock_qty', 'qty', 'balance'])),
    min: num(first(i, ['min_stock', 'min_quantity', 'min_qty', 'minimum', 'min'])),
  };
}

const low = (i: StockItem) => i.min > 0 && i.quantity < i.min;

export function ManagerWarehouseScreen() {
  const { lang } = useApp();
  const ru = lang === 'RU';
  const t = (r: string, e: string) => (ru ? r : e);
  const [items, setItems] = useState<StockItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [tab, setTab] = useState<'ALL' | 'REPLENISH'>('ALL');
  const [search, setSearch] = useState('');
  const [filterOpen, setFilterOpen] = useState(false);
  const [category, setCategory] = useState('ALL');
  const [replenish, setReplenish] = useState<StockItem | null>(null);
  const toast = useManagerToast();

  const load = useCallback(async () => {
    setError('');
    try {
      const raw = list(await listRecord('warehouse_item'));
      setItems(raw.map(mapItem).sort((a, b) => a.name.localeCompare(b.name, 'ru')));
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

  const lowItems = items.filter(low);
  const categories = useMemo(() => [...new Set(items.map((i) => i.category).filter(Boolean))], [items]);
  const filtered = (tab === 'ALL' ? items : lowItems).filter((i) => {
    if (category !== 'ALL' && i.category !== category) return false;
    const q = search.trim().toLowerCase();
    return !q || [i.name, i.category, i.location].some((v) => v.toLowerCase().includes(q));
  });

  return (
    <SafeAreaView edges={['top']} className="flex-1 bg-background">
      <ScrollView
        className="flex-1"
        contentContainerClassName="px-5 pt-7 pb-6 gap-4"
        keyboardShouldPersistTaps="handled"
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        <View>
          <Text className="text-2xl font-spectral text-text-primary">{t('Склад', 'Warehouse')}</Text>
          <Text className="text-xs font-jost text-text-secondary mt-0.5">
            {tab === 'ALL' ? t('Запасы отеля', 'Hotel inventory') : t('Требует пополнения', 'Needs replenishing')}
          </Text>
        </View>

        {loading && !items.length ? (
          <View className="py-16 items-center">
            <ActivityIndicator color="#C2410C" />
          </View>
        ) : error && !items.length ? (
          <View className="py-12 items-center gap-3">
            <Text className="text-sm font-jost text-text-secondary text-center">{t('Не удалось загрузить склад', 'Failed to load the warehouse')}</Text>
            <Text className="text-xs font-jost text-text-muted text-center">{error}</Text>
            <Pressable onPress={load} className="px-4 py-2 rounded-xl border border-border bg-white active:bg-background">
              <Text className="text-xs font-jost-medium text-text-primary">{t('Повторить', 'Retry')}</Text>
            </Pressable>
          </View>
        ) : (
          <>
            <View className="flex-row gap-2.5">
              <View className="flex-1 bg-white rounded-2xl border border-border p-4">
                <Text className="text-3xl font-spectral text-text-primary" style={{ lineHeight: 32 }}>
                  {items.length}
                </Text>
                <Text className="text-xs font-jost text-text-secondary mt-2">
                  {ru ? pluralRu(items.length, 'позиция', 'позиции', 'позиций') : 'positions'}
                </Text>
              </View>
              <View className="flex-1 bg-white rounded-2xl border border-border p-4">
                <Text className="text-3xl font-spectral text-primary" style={{ lineHeight: 32 }}>
                  {lowItems.length}
                </Text>
                <Text className="text-xs font-jost text-text-secondary mt-2">{t('нужно пополнить', 'need refill')}</Text>
              </View>
            </View>

            <View className="flex-row items-center gap-6 border-b border-border/70 pt-1">
              {(['ALL', 'REPLENISH'] as const).map((id) => {
                const active = tab === id;
                return (
                  <Pressable key={id} onPress={() => setTab(id)} className="pb-2" style={{ borderBottomWidth: 2, borderBottomColor: active ? '#C2410C' : 'transparent' }}>
                    <Text className={`text-xs ${active ? 'text-primary font-jost-medium' : 'text-text-secondary font-jost'}`}>
                      {id === 'ALL' ? t('Все остатки', 'All stock') : `${t('Пополнить', 'Replenish')} · ${lowItems.length}`}
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            <SearchInput
              value={search}
              onChangeText={setSearch}
              placeholder={t('Название, категория или склад', 'Title, category or storage')}
              right={
                <Pressable hitSlop={6} onPress={() => setFilterOpen((v) => !v)} className={`p-1.5 rounded-lg ${filterOpen || category !== 'ALL' ? 'bg-background' : ''}`}>
                  <Filter size={16} color={filterOpen || category !== 'ALL' ? '#C2410C' : '#8A8177'} />
                </Pressable>
              }
            />

            {filterOpen && (
              <View>
                <FieldLabel>{t('Категория', 'Category')}</FieldLabel>
                <SelectField
                  variant="form"
                  value={category}
                  onChange={setCategory}
                  options={[{ value: 'ALL', label: t('Все категории', 'All categories') }, ...categories.map((c) => ({ value: c, label: c }))]}
                />
              </View>
            )}

            {tab === 'REPLENISH' && <Text className="text-xs font-jost text-text-secondary">{t('Позиции ниже минимального запаса.', 'Items below the minimum stock.')}</Text>}

            {filtered.length === 0 ? (
              <EmptyCard
                text={
                  tab === 'REPLENISH'
                    ? t('Все позиции в достаточном количестве', 'All items are sufficiently stocked')
                    : t('Позиций по заданным критериям не найдено', 'No items match the criteria')
                }
              />
            ) : (
              filtered.map((i) => (
                <View key={i.id} className="bg-white rounded-2xl border border-border p-[18px] gap-2.5">
                  <View className="flex-row items-start justify-between gap-2">
                    <Text className="flex-1 text-sm font-jost-medium text-text-primary">{i.name}</Text>
                    <Pressable onPress={() => setReplenish(i)} className="bg-[#FDF3E3] px-3 py-1 rounded-lg active:bg-[#FBE8CD]">
                      <Text className="text-xs font-jost-medium text-[#A66E22]">{t('Пополнить', 'Replenish')}</Text>
                    </Pressable>
                  </View>
                  {!!(i.category || i.location) && (
                    <Text className="text-xs font-jost text-text-secondary">{[i.category, i.location].filter(Boolean).join(' · ')}</Text>
                  )}
                  <View className="flex-row items-end justify-between pt-1">
                    <View className="flex-row items-baseline gap-1">
                      <Text className="text-2xl font-spectral text-text-primary">{dec(i.quantity, 2)}</Text>
                      <Text className="text-xs font-jost text-text-secondary">{i.unit}</Text>
                    </View>
                    {i.min > 0 && (
                      <Text className="text-xs font-jost text-text-secondary">
                        {t('Минимум', 'Minimum')} {dec(i.min, 2)} {i.unit}
                      </Text>
                    )}
                  </View>
                  {low(i) && (
                    <Text className="text-xs font-jost text-primary">
                      {t('До минимума не хватает', 'Short of minimum by')} {dec(i.min - i.quantity, 2)} {i.unit}
                    </Text>
                  )}
                </View>
              ))
            )}
          </>
        )}
      </ScrollView>

      {replenish && (
        <ReplenishModal
          lang={lang}
          item={replenish}
          onClose={() => setReplenish(null)}
          onDone={async (qty) => {
            toast(ru ? `Товар «${replenish.name}» пополнен на +${dec(qty, 2)} ${replenish.unit}` : `“${replenish.name}” restocked by +${dec(qty, 2)} ${replenish.unit}`);
            setReplenish(null);
            await load();
          }}
        />
      )}
    </SafeAreaView>
  );
}

function ReplenishModal({ lang, item, onClose, onDone }: { lang: Lang; item: StockItem; onClose: () => void; onDone: (qty: number) => void }) {
  const insets = useSafeAreaInsets();
  const ru = lang === 'RU';
  const t = (r: string, e: string) => (ru ? r : e);
  const deficit = item.min - item.quantity;
  const [amount, setAmount] = useState(String(Math.max(1, Math.ceil(deficit > 0 ? deficit : 10))));
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    const qty = num(amount);
    if (qty <= 0) return Alert.alert(t('Введите корректное количество', 'Enter a valid quantity'));
    setBusy(true);
    try {
      await createRecord('warehouse_movement', { item_id: item.id, quantity: qty, type: 'receipt' });
      onDone(qty);
    } catch (e) {
      showError(lang, e);
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal visible transparent animationType="slide" onRequestClose={onClose}>
      <Pressable className="flex-1 bg-black/40" onPress={onClose} />
      <View className="bg-white rounded-t-3xl border border-border overflow-hidden" style={{ paddingBottom: insets.bottom }}>
        <View className="p-[18px] border-b border-border flex-row items-start justify-between bg-background gap-3">
          <View className="flex-1">
            <Text className="text-base font-spectral text-text-primary">{t('Пополнение запасов', 'Stock replenishment')}</Text>
            <Text className="text-[11px] font-jost text-text-secondary mt-0.5">{[item.name, item.location].filter(Boolean).join(' · ')}</Text>
          </View>
          <Pressable onPress={onClose} hitSlop={8} className="p-1.5 active:opacity-60">
            <X size={20} color="#8A8177" />
          </Pressable>
        </View>
        <View className="p-5 gap-4">
          <View className="bg-background rounded-xl p-3.5 border border-border gap-2">
            <View className="flex-row justify-between">
              <Text className="text-xs font-jost text-text-secondary">{t('Текущий остаток:', 'Current stock:')}</Text>
              <Text className="text-xs font-jost-medium text-text-primary">
                {dec(item.quantity, 2)} {item.unit}
              </Text>
            </View>
            <View className="flex-row justify-between">
              <Text className="text-xs font-jost text-text-secondary">{t('Минимальный порог:', 'Minimum level:')}</Text>
              <Text className="text-xs font-jost text-text-primary">
                {dec(item.min, 2)} {item.unit}
              </Text>
            </View>
            {deficit > 0 && (
              <View className="flex-row justify-between">
                <Text className="text-xs font-jost text-primary">{t('Дефицит:', 'Shortage:')}</Text>
                <Text className="text-xs font-jost-medium text-primary">
                  {dec(deficit, 2)} {item.unit}
                </Text>
              </View>
            )}
          </View>
          <View>
            <FieldLabel>
              {t('Количество для оприходования', 'Quantity to receive')} ({item.unit})
            </FieldLabel>
            <FormInput value={amount} onChangeText={setAmount} placeholder="0" keyboardType="numeric" />
          </View>
          <View className="pt-2 flex-row items-center gap-2">
            <Pressable disabled={busy} onPress={submit} className="flex-1 bg-primary py-3 rounded-xl items-center active:bg-primary-hover" style={{ opacity: busy ? 0.6 : 1 }}>
              <Text className="text-xs font-jost-medium text-white">{t('Оформить поступление', 'Register receipt')}</Text>
            </Pressable>
            <Pressable onPress={onClose} className="px-4 bg-white border border-border py-3 rounded-xl active:bg-background">
              <Text className="text-xs font-jost text-text-secondary">{t('Отмена', 'Cancel')}</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}
