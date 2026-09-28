import React, { useState } from 'react';
import { View, Text, TextInput, Pressable, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Search } from 'lucide-react-native';
import { PartCategory, PartItem } from '@/types';
import { useApp } from '@/context/app-store';

type CategoryFilter = 'ALL' | PartCategory;
const CATEGORIES: CategoryFilter[] = ['ALL', 'ELECTRICAL', 'PLUMBING', 'CONSUMABLES'];

export function InventoryScreen() {
  const { lang, parts, partOrders, orderParts } = useApp();
  const [selectedCategory, setSelectedCategory] = useState<CategoryFilter>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [orderQuantities, setOrderQuantities] = useState<Record<string, number>>({});

  const getCategoryTitle = (cat: string) => {
    switch (cat) {
      case 'ELECTRICAL': return lang === 'RU' ? 'Электрика' : 'Electrical';
      case 'PLUMBING': return lang === 'RU' ? 'Сантехника' : 'Plumbing';
      default: return lang === 'RU' ? 'Расходники' : 'Consumables';
    }
  };

  const handleQtyChange = (partId: string, diff: number) => {
    setOrderQuantities((prev) => ({ ...prev, [partId]: Math.max(1, (prev[partId] || 1) + diff) }));
  };

  const filteredParts = (selectedCategory === 'ALL' ? parts : parts.filter((p) => p.category === selectedCategory)).filter((p) => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return true;
    return p.nameEn.toLowerCase().includes(q) || p.nameRu.toLowerCase().includes(q) || p.code.toLowerCase().includes(q);
  });

  const groupedParts: Record<string, PartItem[]> = {};
  filteredParts.forEach((item) => {
    if (!groupedParts[item.category]) groupedParts[item.category] = [];
    groupedParts[item.category].push(item);
  });

  const lowStockCount = parts.filter((p) => p.currentStock < p.normStock * 0.5).length;
  const totalToOrder = Object.entries(orderQuantities).reduce((acc, [id, qty]) => {
    const part = parts.find((p) => p.id === id);
    return part && part.currentStock < part.normStock * 0.5 ? acc + qty : acc;
  }, 0);

  const handleSubmitOrder = () => {
    const items = parts
      .filter((p) => p.currentStock < p.normStock * 0.5 && orderQuantities[p.id])
      .map((p) => ({ ...p, orderQty: orderQuantities[p.id] }));
    orderParts(items);
    setOrderQuantities({});
  };

  return (
    <SafeAreaView edges={['top']} className="flex-1 bg-background">
      <View className="px-5 pt-7 pb-4 gap-3.5">
        <View className="gap-1.5">
          <Text className="text-2xl font-spectral text-text-primary">{lang === 'RU' ? 'Склад' : 'Warehouse'}</Text>
          <Text className="text-sm font-jost text-text-secondary">
            {lang === 'RU' ? 'Запчасти и материалы' : 'Parts & supplies'}
            {lowStockCount > 0 && (
              <Text className="text-error font-jost-semibold"> · {lowStockCount} {lang === 'RU' ? 'позиции ниже нормы' : 'items low on stock'}</Text>
            )}
          </Text>
        </View>

        <View className="relative">
          <View className="absolute left-3 top-0 bottom-0 justify-center z-10">
            <Search size={14} color="#8A8177" />
          </View>
          <TextInput
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder={lang === 'RU' ? 'Поиск по названию или коду' : 'Search by name or code'}
            placeholderTextColor="#8A8177"
            className="w-full bg-white border border-border rounded-xl pl-9 pr-3 py-2.5 text-sm text-text-primary"
          />
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 6 }}>
          {CATEGORIES.map((cat) => {
            const isSelected = selectedCategory === cat;
            const label = cat === 'ALL' ? (lang === 'RU' ? 'Все' : 'All') : getCategoryTitle(cat);
            return (
              <Pressable
                key={cat}
                onPress={() => setSelectedCategory(cat)}
                className={`px-3.5 py-1.5 rounded-full border ${isSelected ? 'bg-dark border-dark' : 'bg-white border-border'}`}
              >
                <Text className={`text-sm font-jost ${isSelected ? 'text-white' : 'text-text-secondary'}`}>{label}</Text>
              </Pressable>
            );
          })}
        </ScrollView>
      </View>

      <ScrollView className="flex-1 px-5" contentContainerStyle={{ gap: 20, paddingBottom: 20 }} keyboardShouldPersistTaps="handled">
        {parts.length === 0 ? (
          <View className="bg-white rounded-[14px] border border-border p-8 items-center gap-2">
            <Text className="text-sm font-jost text-text-secondary">
              {lang === 'RU' ? 'Склад пока пуст' : 'Warehouse is empty'}
            </Text>
          </View>
        ) : (
          Object.keys(groupedParts).map((cat) => {
            const items = groupedParts[cat];
            return (
              <View key={cat} className="gap-2">
                <Text className="text-[12px] text-text-secondary font-jost tracking-widest uppercase px-1">
                  {getCategoryTitle(cat)}
                </Text>
                <View className="bg-white rounded-[14px] border border-border overflow-hidden">
                  {items.map((item, i) => {
                    const stockPercent = Math.min(100, Math.round((item.currentStock / item.normStock) * 100));
                    const isLow = item.currentStock / item.normStock < 0.5;
                    const orderQty = orderQuantities[item.id] || 1;
                    return (
                      <View
                        key={item.id}
                        className={`p-4 gap-3 ${i < items.length - 1 ? 'border-b border-border-light' : ''}`}
                      >
                        <View className="flex-row items-center justify-between">
                          <Text className="text-sm font-jost text-text-primary flex-1" numberOfLines={1}>
                            {lang === 'RU' ? item.nameRu : item.nameEn}
                          </Text>
                          <Text className="text-sm font-jost leading-none">
                            <Text className={isLow ? 'text-error font-jost-semibold' : 'text-text-primary'}>{item.currentStock}</Text>
                            <Text className="text-text-secondary"> / {item.normStock}</Text>
                          </Text>
                        </View>
                        <View className="flex-row items-center gap-3">
                          <View className="h-1 flex-1 bg-slate-100 rounded-full overflow-hidden">
                            <View className={`h-full rounded-full ${isLow ? 'bg-error' : 'bg-success'}`} style={{ width: `${stockPercent}%` }} />
                          </View>
                          {isLow && (
                            <View className="flex-row items-center bg-white border border-border rounded-xl px-1 py-0.5 h-7">
                              <Pressable onPress={() => handleQtyChange(item.id, -1)} className="h-5 w-5 items-center justify-center">
                                <Text className="text-text-secondary font-jost-semibold">-</Text>
                              </Pressable>
                              <Text className="w-6 text-center text-sm font-jost text-text-primary">{orderQty}</Text>
                              <Pressable onPress={() => handleQtyChange(item.id, 1)} className="h-5 w-5 items-center justify-center">
                                <Text className="text-text-secondary font-jost-semibold">+</Text>
                              </Pressable>
                            </View>
                          )}
                        </View>
                      </View>
                    );
                  })}
                </View>
              </View>
            );
          })
        )}

        {partOrders.length > 0 && (
          <View className="gap-2">
            <Text className="text-[12px] text-text-secondary font-jost tracking-widest uppercase px-1">
              {lang === 'RU' ? 'ИСТОРИЯ ЗАКАЗОВ' : 'ORDER HISTORY'}
            </Text>
            <View className="bg-white rounded-[14px] border border-border overflow-hidden">
              {partOrders.map((order, i) => (
                <View key={order.id} className={`p-3.5 flex-row items-center justify-between ${i > 0 ? 'border-t border-border-light' : ''}`}>
                  <View>
                    <Text className="text-sm font-jost text-text-primary">{lang === 'RU' ? order.titleRu : order.titleEn}</Text>
                    <Text className="text-[11px] font-jost text-text-secondary mt-0.5">{lang === 'RU' ? order.subRu : order.subEn}</Text>
                  </View>
                  <Text className="text-xs font-jost text-text-secondary">{order.status}</Text>
                </View>
              ))}
            </View>
          </View>
        )}
      </ScrollView>

      {totalToOrder > 0 && (
        <View className="p-5 bg-white border-t border-border-light">
          <Pressable onPress={handleSubmitOrder} className="w-full bg-[#C2410C] py-3.5 px-4 rounded-xl items-center active:opacity-90">
            <Text className="text-white text-base font-jost-semibold">
              {lang === 'RU' ? `Заказать · ${totalToOrder} позиций` : `Order · ${totalToOrder} items`}
            </Text>
          </Pressable>
        </View>
      )}
    </SafeAreaView>
  );
}
