import React from 'react';
import { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { ParkingSquare, Car, User } from 'lucide-react-native';
import { RoleTabBar, RoleTabConfig } from '@/components/role-tab-bar';

const TAB_CONFIG: Record<string, RoleTabConfig> = {
  index: { icon: ParkingSquare, labelRu: 'Двор', labelEn: 'Yard' },
  checkin: { icon: Car, labelRu: 'Заезд', labelEn: 'Check-in' },
  profile: { icon: User, labelRu: 'Профиль', labelEn: 'Profile' },
};

export function ParkingTabBar(props: BottomTabBarProps) {
  return <RoleTabBar {...props} tabs={TAB_CONFIG} />;
}
