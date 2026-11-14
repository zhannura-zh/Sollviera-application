import React from 'react';
import { View, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LucideIcon } from 'lucide-react-native';
import { useApp } from '@/context/app-store';

// Placeholder for reception tabs that are ported in later stages.
export function ReceptionComingSoonScreen({ icon: Icon, titleRu, titleEn }: { icon: LucideIcon; titleRu: string; titleEn: string }) {
  const { lang } = useApp();
  return (
    <SafeAreaView edges={['top']} className="flex-1 bg-background">
      <View className="px-5 pt-7 pb-4">
        <Text className="text-[32px] font-spectral text-text-primary">{lang === 'RU' ? titleRu : titleEn}</Text>
      </View>
      <View className="flex-1 items-center justify-center px-8 gap-3">
        <Icon size={28} color="#8A8177" />
        <Text className="text-sm font-jost text-text-secondary text-center">
          {lang === 'RU' ? 'Раздел появится в следующем обновлении' : 'Coming in the next update'}
        </Text>
      </View>
    </SafeAreaView>
  );
}
