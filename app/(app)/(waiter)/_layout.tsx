import { Tabs } from 'expo-router';
import React from 'react';

import { WaiterTabBar } from '@/components/waiter-tab-bar';

export default function WaiterTabLayout() {
  return (
    <Tabs screenOptions={{ headerShown: false }} tabBar={(props) => <WaiterTabBar {...props} />}>
      <Tabs.Screen name="index" />
      <Tabs.Screen name="zal" />
      <Tabs.Screen name="profile" />
    </Tabs>
  );
}
