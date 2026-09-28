import React, { useState } from 'react';
import { View, Text, TextInput, Pressable, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Search, ChevronRight, Wrench } from 'lucide-react-native';
import { MaintenanceCategory, MaintenanceRequest } from '@/types';
import { getTranslation } from '@/lib/locales';
import { useApp } from '@/context/app-store';

type Filter = 'WITH_ISSUES' | 'BLOCKED' | 'ALL';

interface DashboardScreenProps {
  onOpenTicket: (id: string) => void;
}

function dotColor(req: MaintenanceRequest) {
  if (req.blocksCleaning) return '#B3261E';
  if (req.priority === 'CRITICAL' || req.priority === 'HIGH') return '#C2410C';
  return '#D97706';
}

function relativeDay(timestamp: string) {
  // timestamp is a full localized string (see mapMaintenance) — only the date part matters here.
  const d = new Date(timestamp.split(',')[0].split('.').reverse().join('-'));
  if (Number.isNaN(d.getTime())) return timestamp;
  const today = new Date();
  const diffDays = Math.round((today.setHours(0, 0, 0, 0) - d.setHours(0, 0, 0, 0)) / 86400000);
  if (diffDays === 0) return 'сегодня';
  if (diffDays === 1) return 'вчера';
  return timestamp.split(',')[0];
}

export function DashboardScreen({ onOpenTicket }: DashboardScreenProps) {
  const { lang, maintenanceRequests } = useApp();
  const t = getTranslation(lang);
  const [filter, setFilter] = useState<Filter>('WITH_ISSUES');
  const [searchQuery, setSearchQuery] = useState('');

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

  const open = maintenanceRequests.filter((r) => r.status !== 'RESOLVED');
  const blocked = open.filter((r) => r.blocksCleaning);
  const serviced = maintenanceRequests
    .filter((r) => r.status === 'RESOLVED')
    .slice()
    .sort((a, b) => (a.timestamp < b.timestamp ? 1 : -1));

  const matchesSearch = (r: MaintenanceRequest) => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return true;
    return r.roomNumber.toLowerCase().includes(q) || getCategoryLabel(r.category).toLowerCase().includes(q);
  };

  const issueRooms = (filter === 'BLOCKED' ? blocked : open).filter(matchesSearch);
  const servicedRooms = filter !== 'BLOCKED' ? serviced.filter(matchesSearch) : [];

  const renderIssueRow = (req: MaintenanceRequest, i: number) => (
    <Pressable
      key={req.id}
      onPress={() => onOpenTicket(req.id)}
      className={`p-4 flex-row items-center justify-between active:bg-background ${i > 0 ? 'border-t border-border-light' : ''}`}
    >
      <View className="flex-row items-center gap-3 flex-1 min-w-0">
        <View className="h-2 w-2 rounded-full shrink-0" style={{ backgroundColor: dotColor(req) }} />
        <View className="flex-1 min-w-0">
          <View className="flex-row items-center gap-1.5 flex-wrap">
            <Text className="text-sm font-jost-semibold text-text-primary">№ {req.roomNumber || '—'}</Text>
            {req.blocksCleaning && (
              <View className="bg-[#FAF0EF] border border-[#F5D6D5] px-1.5 py-0.5 rounded">
                <Text className="text-[9px] font-jost-semibold text-[#B3261E] uppercase tracking-wide">
                  {lang === 'RU' ? 'ЗАБЛОКИРОВАН' : 'BLOCKED'}
                </Text>
              </View>
            )}
            {req.isGuestDamage && (
              <View className="bg-[#FFF4ED] border border-[#FED7AA] px-1.5 py-0.5 rounded">
                <Text className="text-[9px] font-jost-semibold text-[#C2410C] uppercase tracking-wide">
                  {lang === 'RU' ? 'ПОЛОМКА ГОСТЕМ' : 'GUEST DAMAGE'}
                </Text>
              </View>
            )}
          </View>
          <Text className="text-xs font-jost text-text-secondary mt-0.5" numberOfLines={1}>
            {[req.roomCategory || (lang === 'RU' ? 'Номер отеля' : 'Hotel room'), req.floor !== undefined ? `${req.floor} ${lang === 'RU' ? 'этаж' : 'floor'}` : null, getCategoryLabel(req.category)]
              .filter(Boolean)
              .join(' · ')}
          </Text>
        </View>
      </View>
      <View className="flex-row items-center gap-1.5 shrink-0 pl-2">
        <Text className="text-xs font-jost text-text-secondary">{lang === 'RU' ? '1 заявка' : '1 ticket'}</Text>
        <ChevronRight size={16} color="#8A8177" />
      </View>
    </Pressable>
  );

  return (
    <SafeAreaView edges={['top']} className="flex-1 bg-background">
      <View className="px-5 pt-7 pb-4 gap-3.5">
        <View className="gap-1.5">
          <Text className="text-2xl font-spectral text-text-primary">{lang === 'RU' ? 'Номера' : 'Rooms'}</Text>
          <Text className="text-sm font-jost text-text-secondary">
            <Text className="text-text-primary font-jost-semibold">{open.length} </Text>
            {lang === 'RU' ? 'номера с неполадками' : 'rooms with issues'}
            {blocked.length > 0 && (
              <Text className="text-[#C2410C] font-jost"> · {blocked.length} {lang === 'RU' ? 'заблокирован' : 'blocked'}</Text>
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
            placeholder={lang === 'RU' ? 'Поиск по номеру или зоне' : 'Search by room or zone'}
            placeholderTextColor="#8A8177"
            className="w-full bg-white border border-border rounded-xl pl-9 pr-3 py-2.5 text-sm text-text-primary"
          />
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 6 }}>
          {([
            ['WITH_ISSUES', lang === 'RU' ? 'С неполадками' : 'With issues', open.length],
            ['BLOCKED', lang === 'RU' ? 'Заблокированные' : 'Blocked', blocked.length],
            ['ALL', lang === 'RU' ? 'Все' : 'All', null],
          ] as const).map(([f, label, count]) => {
            const isSelected = filter === f;
            return (
              <Pressable
                key={f}
                onPress={() => setFilter(f)}
                className={`px-3.5 py-1.5 rounded-full border flex-row items-center gap-1.5 ${isSelected ? 'bg-dark border-dark' : 'bg-white border-border'}`}
              >
                <Text className={`text-sm font-jost ${isSelected ? 'text-white' : 'text-text-secondary'}`}>{label}</Text>
                {count !== null && (
                  <Text className={`text-sm font-jost ${isSelected ? 'text-white/80' : 'text-text-secondary'}`}>{count}</Text>
                )}
              </Pressable>
            );
          })}
        </ScrollView>
      </View>

      <ScrollView className="flex-1 px-5" contentContainerStyle={{ paddingBottom: 20, gap: 16 }}>
        <View className="gap-2">
          <Text className="text-[12px] text-text-secondary font-jost tracking-widest uppercase px-1">
            {lang === 'RU' ? 'НОМЕРА' : 'ROOMS'}
          </Text>
          {issueRooms.length === 0 ? (
            <View className="bg-white rounded-[14px] border border-border p-8 items-center gap-2">
              <Wrench size={28} color="#8A8177" />
              <Text className="text-sm font-jost text-text-secondary">
                {lang === 'RU' ? 'Нет номеров по выбранному фильтру' : 'No rooms match this filter'}
              </Text>
            </View>
          ) : (
            <View className="bg-white rounded-[14px] border border-border overflow-hidden">
              {issueRooms.map(renderIssueRow)}
            </View>
          )}
        </View>

        {filter !== 'BLOCKED' && servicedRooms.length > 0 && (
          <View className="gap-2">
            <Text className="text-[12px] text-text-secondary font-jost tracking-widest uppercase px-1">
              {lang === 'RU' ? 'НЕДАВНО ОБСЛУЖЕНЫ' : 'RECENTLY SERVICED'}
            </Text>
            <View className="bg-white rounded-[14px] border border-border overflow-hidden">
              {servicedRooms.map((req, i) => (
                <Pressable
                  key={req.id}
                  onPress={() => onOpenTicket(req.id)}
                  className={`p-4 flex-row items-center justify-between active:bg-background ${i > 0 ? 'border-t border-border-light' : ''}`}
                >
                  <View className="flex-row items-center gap-3 flex-1 min-w-0">
                    <View className="h-2 w-2 rounded-full bg-success shrink-0" />
                    <View className="flex-1 min-w-0">
                      <Text className="text-sm font-jost-semibold text-text-primary">№ {req.roomNumber || '—'}</Text>
                      <Text className="text-xs font-jost text-text-secondary mt-0.5" numberOfLines={1}>
                        {[req.roomCategory, getCategoryLabel(req.category)].filter(Boolean).join(' · ')}
                      </Text>
                    </View>
                  </View>
                  <View className="flex-row items-center gap-1.5 shrink-0 pl-2">
                    <Text className="text-xs font-jost text-success-text">{relativeDay(req.timestamp)}</Text>
                    <ChevronRight size={16} color="#8A8177" />
                  </View>
                </Pressable>
              ))}
            </View>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
