import React from 'react';
import { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { BarChart3, Wallet, Calendar, Package, User } from 'lucide-react-native';
import { RoleTabBar, RoleTabConfig } from '@/components/role-tab-bar';

const TAB_CONFIG: Record<string, RoleTabConfig> = {
  index: { icon: BarChart3, labelRu: 'Аналитика', labelEn: 'Analytics' },
  finance: { icon: Wallet, labelRu: 'Финансы', labelEn: 'Finance' },
  bookings: { icon: Calendar, labelRu: 'Бронирование', labelEn: 'Bookings' },
  warehouse: { icon: Package, labelRu: 'Склад', labelEn: 'Warehouse' },
  profile: { icon: User, labelRu: 'Профиль', labelEn: 'Profile' },
};

export function ManagerTabBar(props: BottomTabBarProps) {
  return <RoleTabBar {...props} tabs={TAB_CONFIG} />;
}
