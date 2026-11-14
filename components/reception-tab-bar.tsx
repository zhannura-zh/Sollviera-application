import React from 'react';
import { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { Calendar, PlusCircle, Clock, User } from 'lucide-react-native';
import { RoleTabBar, RoleTabConfig } from '@/components/role-tab-bar';

const TAB_CONFIG: Record<string, RoleTabConfig> = {
  index: { icon: Calendar, labelRu: 'Бронирования', labelEn: 'Bookings' },
  create: { icon: PlusCircle, labelRu: 'Создать бронь', labelEn: 'Create' },
  waitlist: { icon: Clock, labelRu: 'Лист ожидания', labelEn: 'Waitlist' },
  profile: { icon: User, labelRu: 'Профиль', labelEn: 'Profile' },
};

export function ReceptionTabBar(props: BottomTabBarProps) {
  return <RoleTabBar {...props} tabs={TAB_CONFIG} />;
}
