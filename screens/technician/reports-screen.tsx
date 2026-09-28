import React from 'react';
import { View, Text, ScrollView } from 'react-native';
import { Wrench } from 'lucide-react-native';
import { MaintenanceCategory } from '@/types';
import { getTranslation } from '@/lib/locales';
import { useApp } from '@/context/app-store';

export function ReportsScreen() {
  const { lang, cleanerProfile, maintenanceRequests } = useApp();
  const t = getTranslation(lang);
  const shift = cleanerProfile.currentShift;

  const getCategoryLabel = (cat: MaintenanceCategory) => {
    switch (cat) {
      case 'PLUMBING': return t.categoryPlumbing;
      case 'ELECTRICAL': return t.categoryElectrical;
      case 'FURNITURE': return t.categoryFurniture;
      case 'APPLIANCES': return t.categoryAppliances;
      case 'CLEANLINESS': return t.categoryCleanliness;
      default: return t.categoryOther;
    }
  };

  const resolved = maintenanceRequests
    .filter((r) => r.status === 'RESOLVED')
    .sort((a, b) => b.timestamp.localeCompare(a.timestamp));
  const guestDamageCost = maintenanceRequests.reduce((acc, r) => acc + (r.repairCost || 0), 0);
  const categoryCounts: Record<string, number> = {};
  maintenanceRequests.forEach((r) => {
    categoryCounts[r.category] = (categoryCounts[r.category] || 0) + 1;
  });
  const maxCategoryCount = Math.max(1, ...Object.values(categoryCounts));

  return (
    <ScrollView className="flex-1 bg-background" contentContainerStyle={{ padding: 20, gap: 20 }}>
      <Text className="text-sm font-jost text-text-secondary">
        {shift.shiftNumber} · {shift.date} · {lang === 'RU' ? 'с' : 'from'} {shift.startTime}
      </Text>

      <View className="gap-2">
        <Text className="text-[12px] text-text-secondary font-jost tracking-widest uppercase px-1">
          {lang === 'RU' ? 'ИТОГИ СМЕНЫ' : 'SHIFT SUMMARY'}
        </Text>
        <View className="bg-white rounded-[14px] border border-border p-4 flex-row">
          <View className="flex-1 items-center gap-1">
            <Text className="text-sm text-text-secondary">
              <Text className="text-xl font-jost-semibold text-text-primary">{resolved.length}</Text> / {maintenanceRequests.length}
            </Text>
            <Text className="text-[12px] font-jost text-text-secondary">{lang === 'RU' ? 'закрыто заявок' : 'tickets closed'}</Text>
          </View>
          <View className="flex-1 items-center gap-1 border-l border-border-light">
            <Text className="text-sm text-text-secondary">
              <Text className="text-xl font-jost-semibold text-text-primary">{shift.avgTimePerRoom.replace(/[^0-9]/g, '') || '—'}</Text>{' '}
              {lang === 'RU' ? 'мин' : 'min'}
            </Text>
            <Text className="text-[12px] font-jost text-text-secondary">{lang === 'RU' ? 'на заявку' : 'per ticket'}</Text>
          </View>
          <View className="flex-1 items-center gap-1 border-l border-border-light">
            <Text className="text-sm text-text-secondary">
              <Text className="text-xl font-jost-semibold text-text-primary">{guestDamageCost.toLocaleString('ru-RU')}</Text> ₸
            </Text>
            <Text className="text-[12px] font-jost text-text-secondary">{lang === 'RU' ? 'ущерба' : 'damage'}</Text>
          </View>
        </View>
      </View>

      <View className="gap-2">
        <Text className="text-[12px] text-text-secondary font-jost tracking-widest uppercase px-1">
          {lang === 'RU' ? 'ПО КАТЕГОРИЯМ' : 'BY CATEGORY'}
        </Text>
        <View className="bg-white rounded-[14px] border border-border p-4 gap-3">
          {Object.entries(categoryCounts).map(([cat, count]) => (
            <View key={cat} className="gap-1">
              <View className="flex-row items-center justify-between">
                <Text className="text-sm font-jost text-text-primary">{getCategoryLabel(cat as MaintenanceCategory)}</Text>
                <Text className="text-sm font-jost text-text-secondary">{count}</Text>
              </View>
              <View className="h-1.5 bg-border/40 rounded-full overflow-hidden">
                <View className="h-full bg-primary rounded-full" style={{ width: `${(count / maxCategoryCount) * 100}%` }} />
              </View>
            </View>
          ))}
          {Object.keys(categoryCounts).length === 0 && (
            <Text className="text-sm font-jost text-text-secondary text-center py-4">
              {lang === 'RU' ? 'Пока нет данных' : 'No data yet'}
            </Text>
          )}
        </View>
      </View>

      <View className="gap-2">
        <Text className="text-[12px] text-text-secondary font-jost tracking-widest uppercase px-1">
          {lang === 'RU' ? 'ИСТОРИЯ ЗАЯВОК' : 'TICKET HISTORY'}
        </Text>
        <View className="bg-white rounded-[14px] border border-border overflow-hidden">
          {resolved.length === 0 ? (
            <View className="items-center py-8 gap-2">
              <Wrench size={22} color="#8A8177" />
              <Text className="text-sm font-jost text-text-secondary">
                {lang === 'RU' ? 'Пока нет закрытых заявок' : 'No closed tickets yet'}
              </Text>
            </View>
          ) : (
            resolved.map((req, i) => (
              <View key={req.id} className={`p-3.5 flex-row items-start justify-between gap-3 ${i > 0 ? 'border-t border-border-light' : ''}`}>
                <View className="flex-1 min-w-0">
                  <Text className="text-sm font-jost-semibold text-text-primary">№ {req.roomNumber || '—'}</Text>
                  <Text className="text-[13px] font-jost text-text-secondary mt-0.5" numberOfLines={2}>
                    {lang === 'RU' ? req.descriptionRu || req.description : req.descriptionEn || req.description}
                  </Text>
                  {!!req.materials?.length && (
                    <Text className="text-[12px] font-jost text-text-secondary mt-0.5" numberOfLines={1}>
                      {req.materials.map((m) => `${lang === 'RU' ? m.nameRu : m.nameEn} · ${m.qty} ${lang === 'RU' ? 'шт' : 'pcs'}`).join(', ')}
                    </Text>
                  )}
                </View>
                <Text className="text-[12px] font-jost text-text-secondary shrink-0">{req.timestamp.split(',')[0]}</Text>
              </View>
            ))
          )}
        </View>
      </View>
    </ScrollView>
  );
}
