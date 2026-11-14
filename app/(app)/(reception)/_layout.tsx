import { Tabs } from 'expo-router';
import React from 'react';

import { ReceptionTabBar } from '@/components/reception-tab-bar';

export default function ReceptionTabLayout() {
  return (
    <Tabs screenOptions={{ headerShown: false }} tabBar={(props) => <ReceptionTabBar {...props} />}>
      <Tabs.Screen name="index" />
      <Tabs.Screen name="create" />
      <Tabs.Screen name="waitlist" />
      <Tabs.Screen name="profile" />
    </Tabs>
  );
}
