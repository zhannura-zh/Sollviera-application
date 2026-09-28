import React from 'react';
import { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { CalendarDays, LayoutDashboard, User } from 'lucide-react-native';
import { RoleTabBar, RoleTabConfig } from '@/components/role-tab-bar';

const TAB_CONFIG: Record<string, RoleTabConfig> = {
  index: { icon: CalendarDays, labelRu: 'Сегодня', labelEn: 'Today' },
  zal: { icon: LayoutDashboard, labelRu: 'Зал', labelEn: 'Hall' },
  profile: { icon: User, labelRu: 'Профиль', labelEn: 'Profile' },
};

export function WaiterTabBar(props: BottomTabBarProps) {
  return <RoleTabBar {...props} tabs={TAB_CONFIG} />;
}
