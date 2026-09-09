import React, { useState } from 'react';
import { View, Text, TextInput, Pressable, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Search } from 'lucide-react-native';
import { SupplyItem } from '@/types';
import { getTranslation } from '@/lib/locales';
import { useApp } from '@/context/app-store';

type CategoryFilter = 'ALL' | SupplyItem['category'];
const CATEGORIES: CategoryFilter[] = ['ALL', 'LINEN', 'TOWELS', 'AMENITIES', 'CLEANING', 'MINIBAR'];

export function SuppliesScreen() {
  const { lang, supplies, requestSupplyRefill } = useApp();
  const t = getTranslation(lang);

  const [selectedCategory, setSelectedCategory] = useState<CategoryFilter>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [requestQuantities, setRequestQuantities] = useState<Record<string, number>>({});
  const [successMessage, setSuccessMessage] = useState('');

  const handleRequestQtyChange = (itemId: string, diff: number) => {
    setRequestQuantities((prev) => ({ ...prev, [itemId]: Math.max(0, (prev[itemId] || 0) + diff) }));
  };

  const handleGlobalSubmit = () => {
    let total = 0;
    supplies.forEach((item) => {
      const qty = requestQuantities[item.id] || 0;
      if (qty > 0) {
        requestSupplyRefill(item.id, qty);
        total += qty;
      }
    });
    if (total === 0) return;
    setRequestQuantities({});
    setSuccessMessage(lang === 'RU' ? 'Запрос отправлен!' : 'Request sent!');
    setTimeout(() => setSuccessMessage(''), 3000);
  };

  const getCategoryTitle = (cat: string) => {
    switch (cat) {
      case 'LINEN': return t.categoryLinenLabel;
      case 'TOWELS': return t.categoryTowelsLabel;
      case 'AMENITIES': return t.categoryAmenitiesLabel;
      case 'MINIBAR': return lang === 'RU' ? 'Мини-бар' : 'Minibar';
      default: return t.categoryCleaningLabel;
    }
  };

  const filteredSupplies = (selectedCategory === 'ALL' ? supplies : supplies.filter((s) => s.category === selectedCategory)).filter((s) => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return true;
    return s.nameEn.toLowerCase().includes(q) || s.nameRu.toLowerCase().includes(q);
  });

  const groupedSupplies: Record<string, SupplyItem[]> = {};
  filteredSupplies.forEach((item) => {
    if (!groupedSupplies[item.category]) groupedSupplies[item.category] = [];
    groupedSupplies[item.category].push(item);
  });

  const lowNormCount = supplies.filter((s) => s.trolleyQty / s.neededQty < 0.7).length;
  const totalItemsToRequest = Object.values(requestQuantities).reduce((acc, v) => acc + v, 0);

  return (
    <SafeAreaView edges={['top']} className="flex-1 bg-background">
      <View className="px-5 pt-7 pb-4 gap-3.5">
        <View className="gap-1.5">
          <Text className="text-2xl font-spectral text-text-primary">{t.suppliesTitle}</Text>
          <Text className="text-sm font-jost text-text-secondary">
            {lang === 'RU' ? 'Тележка' : 'Housekeeping Cart'}
            {lowNormCount > 0 && (
              <Text className="text-error font-jost-semibold"> · {lowNormCount} {lang === 'RU' ? 'позиции ниже нормы' : 'items low on stock'}</Text>
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
            placeholder={lang === 'RU' ? 'Поиск по названию' : 'Search by name'}
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

      <ScrollView className="flex-1 px-5" contentContainerStyle={{ gap: 20, paddingBottom: 20 }}>
        {successMessage !== '' && (
          <View className="bg-[#FFFDF5] rounded-xl border border-warning/40 p-3.5 flex-row items-center gap-2.5">
            <Text className="text-success font-jost-semibold">✓</Text>
            <Text className="text-sm font-jost text-text-primary">{successMessage}</Text>
          </View>
        )}

        {Object.keys(groupedSupplies).map((cat) => {
          const items = groupedSupplies[cat];
          return (
            <View key={cat} className="gap-2">
              <Text className="text-[12px] text-text-secondary font-jost tracking-widest uppercase px-1">
                {getCategoryTitle(cat)}
              </Text>
              <View className="bg-white rounded-[14px] border border-border overflow-hidden">
                {items.map((item, i) => {
                  const stockPercent = Math.min(100, Math.round((item.trolleyQty / item.neededQty) * 100));
                  const isLow = item.trolleyQty / item.neededQty < 0.7;
                  const reqQty = requestQuantities[item.id] || 0;
                  return (
                    <View
                      key={item.id}
                      className={`p-4 flex-row items-center justify-between gap-4 ${i < items.length - 1 ? 'border-b border-border-light' : ''}`}
                    >
                      <View className="flex-1 gap-3.5">
                        <Text className="text-sm font-jost text-text-primary leading-snug" numberOfLines={1}>
                          {lang === 'RU' ? item.nameRu : item.nameEn}
                        </Text>
                        <View className="h-1 w-full bg-slate-100 rounded-full overflow-hidden">
                          <View
                            className={`h-full rounded-full ${isLow ? 'bg-error' : 'bg-success'}`}
                            style={{ width: `${stockPercent}%` }}
                          />
                        </View>
                      </View>

                      <View className="shrink-0 items-end gap-2">
                        <Text className="text-sm font-jost leading-none pt-0.5">
                          <Text className={isLow ? 'text-error font-jost-semibold' : 'text-text-primary'}>{item.trolleyQty}</Text>
                          <Text className="text-text-secondary"> / {item.neededQty}</Text>
                        </Text>

                        {isLow && (
                          <View className="flex-row items-center bg-white border border-border rounded-xl px-1 py-0.5 h-7">
                            <Pressable onPress={() => handleRequestQtyChange(item.id, -1)} className="h-5 w-5 items-center justify-center">
                              <Text className="text-text-secondary font-jost-semibold">-</Text>
                            </Pressable>
                            <Text className="w-6 text-center text-sm font-jost text-text-primary">{reqQty}</Text>
                            <Pressable onPress={() => handleRequestQtyChange(item.id, 1)} className="h-5 w-5 items-center justify-center">
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
        })}
      </ScrollView>

      {totalItemsToRequest > 0 && (
        <View className="p-5 bg-white border-t border-border-light">
          <Pressable onPress={handleGlobalSubmit} className="w-full bg-primary py-3.5 px-4 rounded-xl items-center active:bg-primary-hover">
            <Text className="text-white text-base font-jost-semibold">
              {lang === 'RU' ? `Запросить пополнение · ${totalItemsToRequest} шт` : `Request replenishment · ${totalItemsToRequest} pcs`}
            </Text>
          </Pressable>
        </View>
      )}
    </SafeAreaView>
  );
}
