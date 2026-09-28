import React from 'react';
import { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { LayoutDashboard, CheckSquare, Wrench, Package, User } from 'lucide-react-native';
import { RoleTabBar, RoleTabConfig } from '@/components/role-tab-bar';

const TAB_CONFIG: Record<string, RoleTabConfig> = {
  index: { icon: LayoutDashboard, labelRu: 'Номера', labelEn: 'Rooms' },
  active: { icon: CheckSquare, labelRu: 'Активное', labelEn: 'Active' },
  maintenance: { icon: Wrench, labelRu: 'Техслужба', labelEn: 'Maintenance' },
  supplies: { icon: Package, labelRu: 'Инвентарь', labelEn: 'Inventory' },
  profile: { icon: User, labelRu: 'Профиль', labelEn: 'Profile' },
};

export function CleanerTabBar(props: BottomTabBarProps) {
  return <RoleTabBar {...props} tabs={TAB_CONFIG} />;
}
