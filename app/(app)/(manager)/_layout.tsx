import { Tabs } from 'expo-router';
import React from 'react';

import { ManagerTabBar } from '@/components/manager-tab-bar';

export default function ManagerTabLayout() {
  return (
    <Tabs screenOptions={{ headerShown: false }} tabBar={(props) => <ManagerTabBar {...props} />}>
      <Tabs.Screen name="index" />
      <Tabs.Screen name="finance" />
      <Tabs.Screen name="bookings" />
      <Tabs.Screen name="warehouse" />
      <Tabs.Screen name="profile" />
    </Tabs>
  );
}
