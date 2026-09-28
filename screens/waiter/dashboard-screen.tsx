import React from 'react';
import { View, Text, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AlertTriangle, PartyPopper, Users } from 'lucide-react-native';
import { useApp } from '@/context/app-store';
import { MEAL_PERIODS, DAILY_ALERTS, DailyAlert } from './waiter-mock-data';

function alertIcon(kind: DailyAlert['kind']) {
  switch (kind) {
    case 'ALLERGY': return <AlertTriangle size={16} color="#B3261E" />;
    case 'BIRTHDAY': return <PartyPopper size={16} color="#C2410C" />;
    case 'BANQUET': return <Users size={16} color="#8A8177" />;
  }
}

export function WaiterDashboardScreen() {
  const { lang, cleanerProfile } = useApp();

  const breakfast = MEAL_PERIODS[0];
  const breakfastTotal = breakfast.breakdown.reduce((acc, b) => acc + (b.code ? b.count : 0), 0);
  const breakfastArrived = Math.round(breakfastTotal * 0.68);

  return (
    <SafeAreaView edges={['top']} className="flex-1 bg-background">
      <View className="px-5 pt-4 pb-1.5">
        <Text className="text-2xl font-spectral text-text-primary">{lang === 'RU' ? 'Сегодня' : 'Today'}</Text>
        <Text className="text-sm font-jost text-text-secondary mt-0.5">
          {cleanerProfile.currentShift.date} · {lang === 'RU' ? 'основной ресторан' : 'main restaurant'} · {lang === 'RU' ? 'загрузка' : 'occupancy'} 78%
        </Text>
      </View>

      <ScrollView className="flex-1 px-5" contentContainerStyle={{ paddingTop: 12, paddingBottom: 24, gap: 18 }}>
        {MEAL_PERIODS.map((period) => {
          const isBreakfast = period.key === 'BREAKFAST';
          const arrived = isBreakfast ? breakfastArrived : undefined;
          const widthPct = isBreakfast ? Math.min(100, ((arrived as number) / period.expected) * 100) : 0;

          return (
            <View key={period.key} className="gap-2">
              <View className="flex-row items-center justify-between px-1">
                <Text className="text-[12px] text-text-secondary font-jost tracking-widest uppercase">
                  {lang === 'RU' ? period.labelRu : period.labelEn}
                </Text>
                <Text className="text-[12px] text-text-secondary font-jost">{period.timeRange}</Text>
              </View>

              {isBreakfast ? (
                <View className="bg-white rounded-[14px] border border-border overflow-hidden">
                  <View className="p-4 gap-2.5">
                    <View className="flex-row items-end justify-between">
                      <Text className="text-sm text-text-secondary">
                        <Text className="text-3xl font-jost-semibold text-text-primary">{arrived}</Text>{' '}
                        {lang === 'RU' ? `из ${period.expected} пришли` : `of ${period.expected} arrived`}
                      </Text>
                      <Text className="text-sm font-jost text-text-secondary">
                        {lang === 'RU' ? 'осталось' : 'remaining'} {period.expected - (arrived as number)}
                      </Text>
                    </View>
                    <View className="h-1.5 bg-border/40 rounded-full overflow-hidden">
                      <View className="h-full bg-success rounded-full" style={{ width: `${widthPct}%` }} />
                    </View>
                  </View>
                  {period.breakdown.map((b, i) => (
                    <View key={i} className="px-4 py-3 flex-row items-center justify-between border-t border-border-light">
                      <Text className="text-sm font-jost text-text-primary">
                        {b.code ? `${b.code} · ${lang === 'RU' ? b.labelRu : b.labelEn}` : (lang === 'RU' ? b.labelRu : b.labelEn)}
                      </Text>
                      <Text className="text-sm font-jost-semibold text-text-primary">{b.count}</Text>
                    </View>
                  ))}
                </View>
              ) : (
                <View className="bg-white rounded-[14px] border border-border p-4 flex-row items-center justify-between">
                  <Text className="text-sm text-text-secondary">
                    <Text className="text-3xl font-jost-semibold text-text-primary">{period.expected}</Text>{' '}
                    {lang === 'RU' ? 'ожидается' : 'expected'}
                  </Text>
                  <Text className="text-sm font-jost text-text-secondary">
                    {period.breakdown.map((b) => `${b.code} ${b.count}`).join(' · ')}
                  </Text>
                </View>
              )}
            </View>
          );
        })}

        <View className="gap-2">
          <Text className="text-[12px] text-text-secondary font-jost tracking-widest uppercase px-1">
            {lang === 'RU' ? 'ВАЖНОЕ СЕГОДНЯ' : "TODAY'S NOTES"}
          </Text>
          <View className="gap-2">
            {DAILY_ALERTS.map((alert) => (
              <View
                key={alert.id}
                className={`bg-white rounded-[14px] border border-border p-3.5 flex-row items-start gap-3 ${
                  alert.kind === 'ALLERGY' ? 'border-l-[3px] border-l-error' : ''
                }`}
              >
                <View className="pt-0.5">{alertIcon(alert.kind)}</View>
                <View className="flex-1 min-w-0">
                  <Text className="text-sm font-jost-semibold text-text-primary">{lang === 'RU' ? alert.titleRu : alert.titleEn}</Text>
                  <Text className="text-[13px] font-jost text-text-secondary mt-0.5">{lang === 'RU' ? alert.subtitleRu : alert.subtitleEn}</Text>
                </View>
              </View>
            ))}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
