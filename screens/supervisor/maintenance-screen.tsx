import React, { useState } from 'react';
import { View, Text, TextInput, Pressable, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Search, Wrench, ChevronRight } from 'lucide-react-native';
import { MaintenanceCategory } from '@/types';
import { getTranslation } from '@/lib/locales';
import { useApp } from '@/context/app-store';

interface SupervisorMaintenanceScreenProps {
  onOpenTicket: (id: string) => void;
}

// Read-only view of maintenance tickets — the real supervisor account only carries
// `maintenance.read` (no update), so this is monitoring, not a workflow tool.
type Filter = 'ALL' | 'ACTIVE' | 'RESOLVED';

export function SupervisorMaintenanceScreen({ onOpenTicket }: SupervisorMaintenanceScreenProps) {
  const { lang, maintenanceRequests } = useApp();
  const t = getTranslation(lang);
  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState<Filter>('ALL');

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

  const activeCount = maintenanceRequests.filter((r) => r.status !== 'RESOLVED').length;
  const blockingCount = maintenanceRequests.filter((r) => r.status !== 'RESOLVED' && r.blocksCleaning).length;

  const resolvedCount = maintenanceRequests.filter((r) => r.status === 'RESOLVED').length;

  const filtered = maintenanceRequests
    .filter((r) => {
      if (filter === 'ACTIVE') return r.status !== 'RESOLVED';
      if (filter === 'RESOLVED') return r.status === 'RESOLVED';
      return true;
    })
    .filter((r) => {
      const q = searchQuery.toLowerCase().trim();
      if (!q) return true;
      return r.roomNumber.toLowerCase().includes(q) || getCategoryLabel(r.category).toLowerCase().includes(q);
    });

  return (
    <SafeAreaView edges={['top']} className="flex-1 bg-background">
      <View className="px-5 pt-7 pb-4 gap-3.5">
        <View className="gap-1.5">
          <Text className="text-2xl font-spectral text-text-primary">{lang === 'RU' ? 'Техслужба' : 'Maintenance'}</Text>
          <Text className="text-sm font-jost text-text-secondary">
            <Text className="text-text-primary font-jost-semibold">{activeCount} </Text>
            {lang === 'RU' ? 'в работе' : 'active'}
            {blockingCount > 0 && (
              <Text className="text-error font-jost-semibold"> · {blockingCount} {lang === 'RU' ? 'блокирует уборку' : 'blocking cleaning'}</Text>
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
            placeholder={lang === 'RU' ? 'Поиск по номеру или категории' : 'Search by room or category'}
            placeholderTextColor="#8A8177"
            className="w-full bg-white border border-border rounded-xl pl-9 pr-3 py-2.5 text-sm text-text-primary"
          />
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 6 }}>
          {([
            ['ALL', lang === 'RU' ? 'Все' : 'All', maintenanceRequests.length],
            ['ACTIVE', lang === 'RU' ? 'В работе' : 'Active', activeCount],
            ['RESOLVED', lang === 'RU' ? 'Устранённые' : 'Resolved', resolvedCount],
          ] as const).map(([key, label, count]) => {
            const isSelected = filter === key;
            return (
              <Pressable
                key={key}
                onPress={() => setFilter(key)}
                className={`px-3.5 py-1.5 rounded-full border flex-row items-center gap-1.5 ${isSelected ? 'bg-dark border-dark' : 'bg-white border-border'}`}
              >
                <Text className={`text-sm font-jost ${isSelected ? 'text-white' : 'text-text-secondary'}`}>{label}</Text>
                <Text className={`text-sm font-jost ${isSelected ? 'text-white/80' : 'text-text-secondary'}`}>{count}</Text>
              </Pressable>
            );
          })}
        </ScrollView>
      </View>

      <ScrollView className="flex-1 px-5" contentContainerStyle={{ paddingBottom: 20 }}>
        {filtered.length === 0 ? (
          <View className="bg-white rounded-[14px] border border-border p-8 items-center gap-2">
            <Wrench size={28} color="#8A8177" />
            <Text className="text-sm font-jost text-text-secondary">
              {lang === 'RU' ? 'Заявок не найдено' : 'No tickets found'}
            </Text>
          </View>
        ) : (
          <View className="bg-white rounded-[14px] border border-border overflow-hidden">
            {filtered.map((req, i) => {
              const isBlocked = req.blocksCleaning && req.status !== 'RESOLVED';
              return (
                <Pressable
                  key={req.id}
                  onPress={() => onOpenTicket(req.id)}
                  className={`p-3.5 flex-row items-center justify-between active:bg-background ${i > 0 ? 'border-t border-border-light' : ''}`}
                >
                  <View className="h-2 w-2 rounded-full shrink-0 mr-3" style={{ backgroundColor: isBlocked ? '#B3261E' : req.status === 'RESOLVED' ? '#5B8C6E' : '#C2410C' }} />
                  <View className="flex-1 min-w-0">
                    <View className="flex-row items-center gap-1.5 flex-wrap">
                      <Text className="text-sm font-jost-semibold text-text-primary">№ {req.roomNumber || '—'}</Text>
                      {req.isGuestDamage && (
                        <View className="bg-[#FFF4ED] border border-[#FED7AA] px-1.5 py-0.5 rounded">
                          <Text className="text-[9px] font-jost-semibold text-[#C2410C] uppercase">
                            {lang === 'RU' ? 'Поломка гостем' : 'Guest damage'}
                          </Text>
                        </View>
                      )}
                      {isBlocked && (
                        <View className="bg-error/10 px-1.5 py-0.5 rounded">
                          <Text className="text-error text-[9px] font-jost-semibold uppercase">
                            {lang === 'RU' ? 'БЛОКИРУЕТ' : 'BLOCKS'}
                          </Text>
                        </View>
                      )}
                    </View>
                    <Text className="text-[13px] font-jost text-text-secondary mt-0.5" numberOfLines={1}>
                      {getCategoryLabel(req.category)} · {req.description}
                    </Text>
                  </View>
                  <View className="flex-row items-center gap-1.5 shrink-0 pl-2">
                    <Text className="text-[12px] font-jost text-text-secondary">
                      {req.status === 'RESOLVED' ? (lang === 'RU' ? 'устранена' : 'resolved') : req.timestamp.split(',')[0]}
                    </Text>
                    <ChevronRight size={16} color="#8A8177" />
                  </View>
                </Pressable>
              );
            })}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
