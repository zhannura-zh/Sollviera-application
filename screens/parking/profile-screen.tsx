import React from 'react';
import { View, Text, Pressable, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LogOut, User } from 'lucide-react-native';
import { useApp } from '@/context/app-store';

interface ParkingProfileScreenProps {
  onLoggedOut: () => void;
}

export function ParkingProfileScreen({ onLoggedOut }: ParkingProfileScreenProps) {
  const { lang, cleanerProfile, parkingSpots, parkingSessions, logout } = useApp();

  const handleLogout = () => {
    Alert.alert(
      lang === 'RU' ? 'Выйти из аккаунта?' : 'Log out?',
      undefined,
      [
        { text: lang === 'RU' ? 'Отмена' : 'Cancel', style: 'cancel' },
        { text: lang === 'RU' ? 'Выйти' : 'Log out', style: 'destructive', onPress: () => { logout(); onLoggedOut(); } },
      ]
    );
  };

  const freeCount = parkingSpots.length - parkingSessions.length;

  return (
    <SafeAreaView edges={['top']} className="flex-1 bg-background">
      <View className="px-5 pt-4 pb-1.5 flex-row items-start justify-between">
        <View>
          <Text className="text-[12px] text-text-secondary font-jost tracking-widest uppercase">
            {lang === 'RU' ? 'ПАРКОВКА' : 'PARKING'}
          </Text>
          <Text className="text-2xl font-spectral text-text-primary mt-0.5">
            {lang === 'RU' ? cleanerProfile.fullNameRu : cleanerProfile.fullName}
          </Text>
        </View>
        <Pressable
          onPress={handleLogout}
          className="flex-row items-center gap-1.5 bg-white border border-border rounded-xl px-3.5 py-2.5 active:bg-background"
        >
          <LogOut size={15} color="#B3261E" />
          <Text className="text-error text-sm font-jost-semibold">{lang === 'RU' ? 'Выйти' : 'Log out'}</Text>
        </Pressable>
      </View>

      <View className="px-5 pt-4 gap-4">
        <View className="bg-white rounded-[14px] border border-border p-4 flex-row items-center gap-3.5">
          <View className="h-12 w-12 rounded-full bg-dark items-center justify-center">
            <User size={20} color="#fff" />
          </View>
          <View className="flex-1">
            <Text className="text-sm font-jost-semibold text-text-primary">{cleanerProfile.email}</Text>
            <Text className="text-[13px] font-jost text-text-secondary mt-0.5">
              {lang === 'RU' ? 'Сотрудник парковки' : 'Parking attendant'} · #{cleanerProfile.badgeId}
            </Text>
          </View>
        </View>

        <View className="flex-row gap-3">
          <View className="flex-1 bg-white rounded-[14px] border border-border p-4">
            <Text className="text-[12px] text-text-secondary font-jost tracking-widest uppercase">{lang === 'RU' ? 'ОТКРЫТО' : 'OPEN'}</Text>
            <Text className="text-3xl font-jost-semibold text-text-primary mt-1">{parkingSessions.length}</Text>
          </View>
          <View className="flex-1 bg-white rounded-[14px] border border-border p-4">
            <Text className="text-[12px] text-text-secondary font-jost tracking-widest uppercase">{lang === 'RU' ? 'СВОБОДНО' : 'FREE'}</Text>
            <Text className="text-3xl font-jost-semibold text-text-primary mt-1">{freeCount}</Text>
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
}
