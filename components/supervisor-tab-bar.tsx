import React from 'react';
import { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { LayoutDashboard, ShieldCheck, Wrench, Users, User } from 'lucide-react-native';
import { RoleTabBar, RoleTabConfig } from '@/components/role-tab-bar';

const TAB_CONFIG: Record<string, RoleTabConfig> = {
  index: { icon: LayoutDashboard, labelRu: 'Обзор', labelEn: 'Dashboard' },
  inspection: { icon: ShieldCheck, labelRu: 'Инспекция', labelEn: 'Inspection' },
  maintenance: { icon: Wrench, labelRu: 'Техслужба', labelEn: 'Maintenance' },
  team: { icon: Users, labelRu: 'Команда', labelEn: 'Team' },
  profile: { icon: User, labelRu: 'Профиль', labelEn: 'Profile' },
};

export function SupervisorTabBar(props: BottomTabBarProps) {
  return <RoleTabBar {...props} tabs={TAB_CONFIG} />;
}
