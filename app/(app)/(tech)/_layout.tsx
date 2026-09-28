import { Tabs } from 'expo-router';
import React from 'react';

import { TechnicianTabBar } from '@/components/technician-tab-bar';

export default function TechnicianTabLayout() {
  return (
    <Tabs screenOptions={{ headerShown: false }} tabBar={(props) => <TechnicianTabBar {...props} />}>
      <Tabs.Screen name="index" />
      <Tabs.Screen name="active" />
      <Tabs.Screen name="create" />
      <Tabs.Screen name="inventory" />
      <Tabs.Screen name="profile" />
    </Tabs>
  );
}
