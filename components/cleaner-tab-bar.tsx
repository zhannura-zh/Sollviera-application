import React from 'react';
import { View, Text, Pressable } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { LayoutDashboard, CheckSquare, Wrench, Package, User } from 'lucide-react-native';
import { useApp } from '@/context/app-store';

const TAB_CONFIG: Record<string, { icon: typeof LayoutDashboard; labelRu: string; labelEn: string }> = {
  index: { icon: LayoutDashboard, labelRu: 'Номера', labelEn: 'Rooms' },
  active: { icon: CheckSquare, labelRu: 'Активное', labelEn: 'Active' },
  maintenance: { icon: Wrench, labelRu: 'Техслужба', labelEn: 'Maintenance' },
  supplies: { icon: Package, labelRu: 'Инвентарь', labelEn: 'Inventory' },
  profile: { icon: User, labelRu: 'Профиль', labelEn: 'Profile' },
};

export function CleanerTabBar({ state, navigation }: BottomTabBarProps) {
  const { lang } = useApp();
  const insets = useSafeAreaInsets();

  return (
    <View className="bg-dark border-t border-white/10 px-2 pt-1.5" style={{ paddingBottom: insets.bottom + 6 }}>
      <View className="flex-row gap-0.5">
        {state.routes.map((route, index) => {
          const config = TAB_CONFIG[route.name];
          if (!config) return null;
          const isFocused = state.index === index;
          const Icon = config.icon;

          return (
            <Pressable
              key={route.key}
              onPress={() => {
                const event = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
                if (!isFocused && !event.defaultPrevented) navigation.navigate(route.name);
              }}
              className={`flex-1 py-2 px-1 rounded-xl items-center justify-center gap-1 ${isFocused ? 'bg-primary' : ''}`}
            >
              <Icon size={16} color={isFocused ? '#fff' : '#8A8177'} />
              <Text
                className={`text-[11px] font-jost-semibold ${isFocused ? 'text-white' : 'text-text-secondary'}`}
                numberOfLines={1}
              >
                {lang === 'RU' ? config.labelRu : config.labelEn}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}
