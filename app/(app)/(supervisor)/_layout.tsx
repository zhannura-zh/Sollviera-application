import { Tabs } from 'expo-router';
import React from 'react';

import { SupervisorTabBar } from '@/components/supervisor-tab-bar';

export default function SupervisorTabLayout() {
  return (
    <Tabs screenOptions={{ headerShown: false }} tabBar={(props) => <SupervisorTabBar {...props} />}>
      <Tabs.Screen name="index" />
      <Tabs.Screen name="inspection" />
      <Tabs.Screen name="maintenance" />
      <Tabs.Screen name="team" />
      <Tabs.Screen name="profile" />
    </Tabs>
  );
}
