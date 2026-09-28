import { Tabs } from 'expo-router';
import React from 'react';

import { ParkingTabBar } from '@/components/parking-tab-bar';

export default function ParkingTabLayout() {
  return (
    <Tabs screenOptions={{ headerShown: false }} tabBar={(props) => <ParkingTabBar {...props} />}>
      <Tabs.Screen name="index" />
      <Tabs.Screen name="checkin" />
      <Tabs.Screen name="profile" />
    </Tabs>
  );
}
