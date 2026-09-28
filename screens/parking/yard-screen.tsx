import React, { useState } from 'react';
import { View, Text, TextInput, Pressable, ScrollView, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ParkingSquare, RefreshCw, LogOut } from 'lucide-react-native';
import { useApp } from '@/context/app-store';

export function ParkingYardScreen() {
  const { lang, parkingSpots, parkingSessions, refreshData, checkOutVehicle } = useApp();
  const [searchQuery, setSearchQuery] = useState('');
  const [isRefreshing, setIsRefreshing] = useState(false);

  const sessionBySpot = new Map(parkingSessions.map((s) => [s.spotId, s]));
  const freeCount = parkingSpots.length - parkingSessions.length;

  const q = searchQuery.toLowerCase().trim();
  const visibleSessions = parkingSessions.filter((s) => {
    if (!q) return true;
    return s.plate.toLowerCase().includes(q) || s.guestName.toLowerCase().includes(q);
  });

  const handleRefresh = async () => {
    if (isRefreshing) return;
    setIsRefreshing(true);
    try {
      await refreshData();
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleCheckOut = (sessionId: string, plate: string) => {
    Alert.alert(
      lang === 'RU' ? 'Выезд с парковки?' : 'Check out?',
      lang === 'RU' ? `${plate} будет отмечен как выехавший.` : `${plate} will be marked as departed.`,
      [
        { text: lang === 'RU' ? 'Отмена' : 'Cancel', style: 'cancel' },
        { text: lang === 'RU' ? 'Выезд' : 'Check out', onPress: () => checkOutVehicle(sessionId) },
      ]
    );
  };

  return (
    <SafeAreaView edges={['top']} className="flex-1 bg-background">
      <View className="px-5 pt-4 pb-1.5 flex-row items-start justify-between">
        <View>
          <Text className="text-2xl font-spectral text-text-primary">{lang === 'RU' ? 'Двор парковки' : 'Parking yard'}</Text>
          <Text className="text-sm font-jost text-text-secondary mt-0.5">
            {freeCount} {lang === 'RU' ? 'свободно' : 'free'} · {parkingSessions.length} {lang === 'RU' ? 'на месте' : 'on site'}
          </Text>
        </View>
        <Pressable
          onPress={handleRefresh}
          className="h-10 w-10 bg-white border border-border rounded-xl items-center justify-center active:bg-background"
        >
          <RefreshCw size={16} color="#241E1A" style={isRefreshing ? { opacity: 0.4 } : undefined} />
        </Pressable>
      </View>

      <ScrollView className="flex-1 px-5" contentContainerStyle={{ paddingTop: 12, paddingBottom: 20, gap: 16 }}>
        <View className="relative">
          <View className="absolute left-3 top-0 bottom-0 justify-center z-10">
            <ParkingSquare size={14} color="#8A8177" />
          </View>
          <TextInput
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder={lang === 'RU' ? 'Поиск по номеру или гостю' : 'Search by plate or guest'}
            placeholderTextColor="#8A8177"
            className="w-full bg-white border border-border rounded-xl pl-9 pr-3 py-2.5 text-sm text-text-primary"
          />
        </View>

        <View className="flex-row flex-wrap gap-2.5">
          {parkingSpots.map((spot) => {
            const session = sessionBySpot.get(spot.id);
            const occupied = !!session;
            return (
              <View
                key={spot.id}
                className={`w-[31%] rounded-[14px] border p-3.5 items-center gap-1 ${occupied ? 'bg-dark border-dark' : 'bg-white border-border'}`}
              >
                <ParkingSquare size={16} color={occupied ? '#fff' : '#241E1A'} />
                <Text className={`text-sm font-jost-semibold ${occupied ? 'text-white' : 'text-text-primary'}`}>{spot.code}</Text>
                <Text className={`text-[11px] font-jost ${occupied ? 'text-white/70' : 'text-text-secondary'}`}>
                  {occupied ? (lang === 'RU' ? 'занято' : 'occupied') : (lang === 'RU' ? 'свободно' : 'free')}
                </Text>
              </View>
            );
          })}
        </View>

        {visibleSessions.map((session) => {
          const spot = parkingSpots.find((s) => s.id === session.spotId);
          return (
            <View key={session.id} className="bg-white rounded-[14px] border border-border p-4 gap-3">
              <View className="flex-row items-center justify-between">
                <Text className="text-xl font-jost-semibold text-text-primary">{session.plate}</Text>
                <View className="bg-success-light px-2.5 py-1 rounded-md">
                  <Text className="text-success-text text-[11px] font-jost-semibold uppercase tracking-wider">
                    {lang === 'RU' ? 'на месте' : 'on site'}
                  </Text>
                </View>
              </View>
              <Text className="text-sm font-jost text-text-secondary">
                {spot?.code} · {session.guestName}
              </Text>
              <Text className="text-[12px] font-jost text-text-secondary">{session.checkedInAt}</Text>
              <Pressable
                onPress={() => handleCheckOut(session.id, session.plate)}
                className="bg-dark py-3 rounded-xl items-center flex-row justify-center gap-2"
              >
                <LogOut size={15} color="#fff" />
                <Text className="text-white text-sm font-jost-semibold">{lang === 'RU' ? 'Выезд' : 'Check out'}</Text>
              </Pressable>
            </View>
          );
        })}
      </ScrollView>
    </SafeAreaView>
  );
}
