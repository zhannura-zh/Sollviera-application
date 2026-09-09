import { Tabs } from 'expo-router';
import React from 'react';

import { CleanerTabBar } from '@/components/cleaner-tab-bar';

export default function TabLayout() {
  return (
    <Tabs screenOptions={{ headerShown: false }} tabBar={(props) => <CleanerTabBar {...props} />}>
      <Tabs.Screen name="index" />
      <Tabs.Screen name="active" />
      <Tabs.Screen name="maintenance" />
      <Tabs.Screen name="supplies" />
      <Tabs.Screen name="profile" />
    </Tabs>
  );
}
