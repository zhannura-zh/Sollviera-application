import React, { useState } from 'react';
import { View, Text, TextInput, Pressable, ScrollView, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { KeyboardAvoidingView } from 'react-native-keyboard-controller';
import { Plus } from 'lucide-react-native';
import { useApp } from '@/context/app-store';
import { SelectField } from '@/components/ui/select-field';

export function ParkingCheckinScreen() {
  const { lang, parkingSpots, parkingSessions, checkInVehicle } = useApp();
  const freeSpots = parkingSpots.filter((s) => !parkingSessions.some((session) => session.spotId === s.id));

  const [plate, setPlate] = useState('');
  const [guestName, setGuestName] = useState('');
  const [spotId, setSpotId] = useState(freeSpots[0]?.id || '');
  const [note, setNote] = useState('');

  const canSubmit = plate.trim().length > 0 && !!spotId;

  const handleSubmit = () => {
    if (!canSubmit) return;
    checkInVehicle(plate.trim().toUpperCase(), guestName.trim() || (lang === 'RU' ? 'Гость' : 'Guest'), spotId, note.trim() || undefined);
    Alert.alert(
      lang === 'RU' ? 'Заезд зарегистрирован' : 'Check-in registered',
      lang === 'RU' ? `${plate.trim().toUpperCase()} размещён на месте ${parkingSpots.find((s) => s.id === spotId)?.code}.` : `${plate.trim().toUpperCase()} parked at ${parkingSpots.find((s) => s.id === spotId)?.code}.`
    );
    setPlate('');
    setGuestName('');
    setNote('');
  };

  return (
    <SafeAreaView edges={['top']} className="flex-1 bg-background">
      <KeyboardAvoidingView className="flex-1" behavior="padding">
        <View className="px-5 pt-4 pb-1.5">
          <Text className="text-2xl font-spectral text-text-primary">{lang === 'RU' ? 'Заезд на парковку' : 'Parking check-in'}</Text>
          <Text className="text-sm font-jost text-text-secondary mt-0.5">{lang === 'RU' ? 'Номер авто и место' : 'Plate and spot'}</Text>
        </View>

        <ScrollView className="flex-1 px-5" contentContainerStyle={{ paddingTop: 12, paddingBottom: 20, gap: 16 }} keyboardShouldPersistTaps="handled">
          <View className="gap-1.5">
            <Text className="text-[12px] font-jost text-text-secondary uppercase tracking-wider px-1">{lang === 'RU' ? 'Госномер' : 'Plate'}</Text>
            <TextInput
              value={plate}
              onChangeText={setPlate}
              autoCapitalize="characters"
              placeholder="001AAA01"
              placeholderTextColor="#8A8177"
              className="w-full bg-white border border-border rounded-xl px-3.5 py-3 text-sm text-text-primary"
            />
          </View>

          <View className="gap-1.5">
            <Text className="text-[12px] font-jost text-text-secondary uppercase tracking-wider px-1">{lang === 'RU' ? 'Гость' : 'Guest'}</Text>
            <TextInput
              value={guestName}
              onChangeText={setGuestName}
              placeholder={lang === 'RU' ? 'Имя гостя' : 'Guest name'}
              placeholderTextColor="#8A8177"
              className="w-full bg-white border border-border rounded-xl px-3.5 py-3 text-sm text-text-primary"
            />
          </View>

          <View className="gap-1.5">
            <Text className="text-[12px] font-jost text-text-secondary uppercase tracking-wider px-1">{lang === 'RU' ? 'Место' : 'Spot'}</Text>
            {freeSpots.length === 0 ? (
              <View className="bg-white border border-border rounded-xl px-3.5 py-3">
                <Text className="text-sm font-jost text-text-secondary">{lang === 'RU' ? 'Свободных мест нет' : 'No free spots'}</Text>
              </View>
            ) : (
              <SelectField
                value={spotId}
                onChange={setSpotId}
                options={freeSpots.map((s) => ({ value: s.id, label: `${s.code} · ${s.zone}` }))}
              />
            )}
          </View>

          <View className="gap-1.5">
            <Text className="text-[12px] font-jost text-text-secondary uppercase tracking-wider px-1">{lang === 'RU' ? 'Заметка' : 'Note'}</Text>
            <TextInput
              value={note}
              onChangeText={setNote}
              multiline
              numberOfLines={3}
              placeholder={lang === 'RU' ? 'Например: гость попросил место в тени' : 'e.g. guest asked for shaded spot'}
              placeholderTextColor="#8A8177"
              className="w-full bg-white border border-border rounded-xl px-3.5 py-3 text-sm text-text-primary"
              style={{ minHeight: 80, textAlignVertical: 'top' }}
            />
          </View>

          <Pressable
            onPress={handleSubmit}
            disabled={!canSubmit}
            className={`flex-row items-center justify-center gap-2 py-3.5 rounded-xl ${canSubmit ? 'bg-primary active:bg-primary-hover' : 'bg-border'}`}
          >
            <Plus size={16} color="#fff" />
            <Text className="text-white text-sm font-jost-semibold">{lang === 'RU' ? 'Зарегистрировать' : 'Register'}</Text>
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
