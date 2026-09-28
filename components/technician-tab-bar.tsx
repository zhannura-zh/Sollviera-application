import React from 'react';
import { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { LayoutDashboard, Wrench, PlusCircle, Package, User } from 'lucide-react-native';
import { RoleTabBar, RoleTabConfig } from '@/components/role-tab-bar';

const TAB_CONFIG: Record<string, RoleTabConfig> = {
  index: { icon: LayoutDashboard, labelRu: 'Заявки', labelEn: 'Tickets' },
  active: { icon: Wrench, labelRu: 'В работе', labelEn: 'Active' },
  create: { icon: PlusCircle, labelRu: 'Создать', labelEn: 'Create' },
  inventory: { icon: Package, labelRu: 'Склад', labelEn: 'Inventory' },
  profile: { icon: User, labelRu: 'Профиль', labelEn: 'Profile' },
};

export function TechnicianTabBar(props: BottomTabBarProps) {
  return <RoleTabBar {...props} tabs={TAB_CONFIG} />;
}
