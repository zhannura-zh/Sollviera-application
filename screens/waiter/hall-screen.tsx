import React, { useState } from 'react';
import { View, Text, TextInput, Pressable, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Search, Check, Users } from 'lucide-react-native';
import { useApp } from '@/context/app-store';
import { MEAL_PERIODS, MealPeriodKey, HALL_GUESTS } from './waiter-mock-data';

export function WaiterHallScreen() {
  const { lang } = useApp();
  const [period, setPeriod] = useState<MealPeriodKey>('BREAKFAST');
  const [searchQuery, setSearchQuery] = useState('');
  const [checkedIn, setCheckedIn] = useState<Record<string, boolean>>(
    () => Object.fromEntries(HALL_GUESTS.map((g) => [g.id, g.checkedIn]))
  );

  const currentPeriod = MEAL_PERIODS.find((p) => p.key === period)!;
  const guestsForPeriod = HALL_GUESTS.filter((g) => g.period === period).filter((g) => {
    const q = searchQuery.toLowerCase().trim();
    return !q || g.roomNumber.includes(q) || g.guestName.toLowerCase().includes(q);
  });
  const arrivedCount = HALL_GUESTS.filter((g) => g.period === period && checkedIn[g.id]).length;

  return (
    <SafeAreaView edges={['top']} className="flex-1 bg-background">
      <View className="px-5 pt-4 pb-1.5 gap-3.5">
        <View>
          <Text className="text-2xl font-spectral text-text-primary">{lang === 'RU' ? 'Зал' : 'Hall'}</Text>
          <Text className="text-sm font-jost text-text-secondary mt-0.5">
            <Text className="text-text-primary font-jost-semibold">{arrivedCount}</Text> {lang === 'RU' ? 'из' : 'of'} {guestsForPeriod.length}{' '}
            {lang === 'RU' ? 'гостей пришли' : 'guests arrived'} ·{' '}
            <Text className="text-success-text font-jost-semibold">{lang === 'RU' ? currentPeriod.labelRu.toLowerCase() : currentPeriod.labelEn.toLowerCase()}</Text>
          </Text>
        </View>

        <View className="flex-row gap-2">
          {MEAL_PERIODS.map((p) => {
            const isSelected = period === p.key;
            return (
              <Pressable
                key={p.key}
                onPress={() => setPeriod(p.key)}
                className={`flex-1 px-2 py-2 rounded-xl border items-center ${isSelected ? 'bg-dark border-dark' : 'bg-white border-border'}`}
              >
                <Text className={`text-sm font-jost-semibold ${isSelected ? 'text-white' : 'text-text-primary'}`}>
                  {lang === 'RU' ? p.labelRu : p.labelEn}
                </Text>
                <Text className={`text-[11px] font-jost ${isSelected ? 'text-white/70' : 'text-text-secondary'}`}>{p.timeRange}</Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      <ScrollView className="flex-1 px-5" contentContainerStyle={{ paddingTop: 8, paddingBottom: 20, gap: 8 }}>
        <View className="flex-row items-center justify-between px-1">
          <Text className="text-[12px] text-text-secondary font-jost tracking-widest uppercase">
            {lang === 'RU' ? 'ОТМЕТКА ПРИХОДА' : 'CHECK-IN'}
          </Text>
          <Text className="text-[12px] text-success-text font-jost-semibold">
            {lang === 'RU' ? currentPeriod.labelRu.toLowerCase() : currentPeriod.labelEn.toLowerCase()}
          </Text>
        </View>

        <View className="relative">
          <View className="absolute left-3 top-0 bottom-0 justify-center z-10">
            <Search size={14} color="#8A8177" />
          </View>
          <TextInput
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder={lang === 'RU' ? 'Номер комнаты или фамилия' : 'Room number or last name'}
            placeholderTextColor="#8A8177"
            className="w-full bg-white border border-border rounded-xl pl-9 pr-3 py-2.5 text-sm text-text-primary"
          />
        </View>

        {guestsForPeriod.length === 0 ? (
          <View className="bg-white rounded-[14px] border border-border p-8 items-center gap-2">
            <Users size={24} color="#8A8177" />
            <Text className="text-sm font-jost text-text-secondary text-center">
              {lang === 'RU'
                ? `Нет гостей in-house на ${currentPeriod.labelRu.toLowerCase()}`
                : `No in-house guests for ${currentPeriod.labelEn.toLowerCase()}`}
            </Text>
          </View>
        ) : (
          <View className="bg-white rounded-[14px] border border-border overflow-hidden">
            {guestsForPeriod.map((g, i) => {
              const arrived = !!checkedIn[g.id];
              return (
                <Pressable
                  key={g.id}
                  onPress={() => setCheckedIn((prev) => ({ ...prev, [g.id]: !prev[g.id] }))}
                  className={`p-3.5 flex-row items-center gap-3 active:bg-background ${i > 0 ? 'border-t border-border-light' : ''}`}
                >
                  <View className={`h-9 w-9 rounded-full items-center justify-center border ${arrived ? 'bg-success border-success' : 'bg-background border-border'}`}>
                    {arrived && <Check size={16} color="#fff" />}
                  </View>
                  <View className="flex-1">
                    <Text className="text-sm font-jost-semibold text-text-primary">№ {g.roomNumber} · {g.guestName}</Text>
                    <Text className="text-[12px] font-jost text-text-secondary mt-0.5">{g.mealPlan}</Text>
                  </View>
                  <Text className={`text-[12px] font-jost ${arrived ? 'text-success-text' : 'text-text-secondary'}`}>
                    {arrived ? (lang === 'RU' ? 'пришёл' : 'arrived') : (lang === 'RU' ? 'отметить' : 'check in')}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
