import React, { useState } from 'react';
import { View, Text, Pressable, ScrollView, Image, TextInput, Modal } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { KeyboardAvoidingView } from 'react-native-keyboard-controller';
import { ChevronLeft, Check, X, Camera } from 'lucide-react-native';
import { HotelRoom, RoomCheckitem, ChecklistZone } from '@/types';
import { useApp } from '@/context/app-store';

interface InspectionDetailScreenProps {
  room: HotelRoom | null;
  onBack: () => void;
}

const ZONE_ORDER: ChecklistZone[] = ['BEDROOM', 'BATHROOM', 'MINIBAR', 'BALCONY', 'OTHER'];

// No backend field carries a per-room cleaning-time norm — same per-cleaning-type
// defaults used on the plain room-detail screen (screens/supervisor/room-detail-screen.tsx).
const NORM_MINUTES: Record<HotelRoom['cleaningType'], number> = {
  CHECKOUT: 45,
  STAYOVER: 25,
  DEEP_CLEAN: 60,
  AFTER_MAINTENANCE: 30,
};

// Minutes between two "HH:MM" clock readings (see mapHousekeepingTask in app-store.tsx).
function minutesBetweenClock(start: string, end: string): number {
  const parse = (v: string) => {
    const m = /^(\d{1,2}):(\d{2})/.exec(v);
    return m ? Number(m[1]) * 60 + Number(m[2]) : null;
  };
  const s = parse(start);
  const e = parse(end);
  if (s === null || e === null) return 0;
  let diff = e - s;
  if (diff < 0) diff += 24 * 60;
  return diff;
}

function zoneLabel(zone: ChecklistZone, lang: 'RU' | 'EN') {
  switch (zone) {
    case 'BEDROOM': return lang === 'RU' ? 'Спальня' : 'Bedroom';
    case 'BATHROOM': return lang === 'RU' ? 'Ванная комната' : 'Bathroom';
    case 'MINIBAR': return lang === 'RU' ? 'Мини-бар' : 'Minibar';
    case 'BALCONY': return lang === 'RU' ? 'Балкон' : 'Balcony';
    default: return lang === 'RU' ? 'Прочее' : 'Other';
  }
}

export function InspectionDetailScreen({ room, onBack }: InspectionDetailScreenProps) {
  const { lang, verifyRoom, rejectRoomInspection } = useApp();
  const insets = useSafeAreaInsets();
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectNote, setRejectNote] = useState('');

  if (!room) {
    return (
      <SafeAreaView edges={['top']} className="flex-1 bg-background items-center justify-center">
        <Text className="text-sm font-jost text-text-secondary">{lang === 'RU' ? 'Номер не найден' : 'Room not found'}</Text>
      </SafeAreaView>
    );
  }

  const grouped: Partial<Record<ChecklistZone, RoomCheckitem[]>> = {};
  room.checklist.forEach((item) => {
    if (!grouped[item.zone]) grouped[item.zone] = [];
    grouped[item.zone]!.push(item);
  });
  const guestNote = lang === 'RU' ? room.notesRu : room.notesEn;
  const canAct = room.status === 'READY';

  const handleReject = () => {
    rejectRoomInspection(room.id, rejectNote.trim());
    setShowRejectModal(false);
    setRejectNote('');
    onBack();
  };

  return (
    <SafeAreaView edges={['top']} className="flex-1 bg-dark">
      <View className="bg-dark px-5 pt-2 pb-5 gap-1.5">
        <View className="flex-row items-center justify-between">
          <Pressable onPress={onBack} className="flex-row items-center gap-1.5">
            <ChevronLeft size={16} color="#8A8177" />
            <Text className="text-xs font-jost text-text-secondary">{lang === 'RU' ? 'Инспекция' : 'Inspection'}</Text>
          </Pressable>
          {!!room.endTime && (
            <Text className="text-xs font-jost text-text-secondary">{lang === 'RU' ? 'сдан в' : 'submitted at'} {room.endTime}</Text>
          )}
        </View>
        <View className="flex-row items-end justify-between">
          <Text className="text-3xl font-jost-semibold text-white">№ {room.roomNumber}</Text>
          <Text className="text-xs font-jost text-text-secondary">
            {room.startTime && room.endTime ? `${minutesBetweenClock(room.startTime, room.endTime)} ${lang === 'RU' ? 'мин' : 'min'} · ` : ''}
            {lang === 'RU' ? 'норма' : 'norm'} {NORM_MINUTES[room.cleaningType]}
          </Text>
        </View>
        <Text className="text-xs font-jost text-text-secondary">{room.category}{room.assignedTo ? ` · ${room.assignedTo}` : ''}</Text>
      </View>

      <ScrollView className="flex-1 bg-background px-5" contentContainerStyle={{ paddingTop: 16, paddingBottom: 20, gap: 16 }}>
        {!!guestNote && (
          <View className="gap-2">
            <Text className="text-[12px] text-text-secondary font-jost tracking-widest uppercase px-1">
              {lang === 'RU' ? 'ОСОБЫЕ УКАЗАНИЯ' : 'SPECIAL INSTRUCTIONS'}
            </Text>
            <View className="bg-[#FAF6EE] border border-[#EFE5D8] rounded-[14px] p-3.5">
              <Text className="text-sm font-jost text-text-primary leading-normal">{guestNote}</Text>
            </View>
          </View>
        )}

        {ZONE_ORDER.filter((z) => grouped[z]?.length).map((zone) => {
          const items = grouped[zone]!;
          const doneCount = items.filter((i) => i.done).length;
          const photos = items.map((i) => i.photoUrl).filter(Boolean) as string[];
          return (
            <View key={zone} className="gap-2">
              <View className="flex-row items-center justify-between px-1">
                <Text className="text-[12px] text-text-secondary font-jost tracking-widest uppercase">{zoneLabel(zone, lang).toUpperCase()}</Text>
                <Text className="text-xs font-jost text-text-secondary">{doneCount} / {items.length}</Text>
              </View>
              <View className="bg-white rounded-[14px] border border-border overflow-hidden">
                {items.map((item, i) => (
                  <View key={item.id} className={`p-3.5 flex-row items-center gap-3 ${i > 0 ? 'border-t border-border-light' : ''}`}>
                    <View className={`h-5 w-5 rounded-md items-center justify-center shrink-0 ${item.done ? 'bg-success' : 'border border-border bg-white'}`}>
                      {item.done && <Check size={13} color="#fff" />}
                    </View>
                    <Text className={`text-sm font-jost flex-1 ${item.done ? 'text-text-primary' : 'text-text-secondary'}`}>
                      {lang === 'RU' ? item.textRu : item.textEn}
                    </Text>
                  </View>
                ))}
                {photos.length > 0 && (
                  <View className="p-3.5 border-t border-border-light gap-2.5">
                    <View className="flex-row items-center gap-1.5">
                      <Camera size={13} color="#8A8177" />
                      <Text className="text-xs font-jost text-text-secondary">{photos.length} {lang === 'RU' ? 'фото' : 'photos'}</Text>
                    </View>
                    <View className="flex-row gap-2 flex-wrap">
                      {photos.map((uri, i) => (
                        <Image key={i} source={{ uri }} className="w-20 h-20 rounded-xl border border-border" />
                      ))}
                    </View>
                  </View>
                )}
              </View>
            </View>
          );
        })}
      </ScrollView>

      {canAct && (
        <View
          className="p-5 border-t border-border bg-background flex-row gap-2.5"
          style={{ paddingBottom: insets.bottom + 20 }}
        >
          <Pressable
            onPress={() => setShowRejectModal(true)}
            className="flex-1 flex-row items-center justify-center gap-1.5 py-3.5 rounded-xl border border-error/40 bg-error/5"
          >
            <X size={15} color="#B3261E" />
            <Text className="text-sm font-jost-semibold text-error">{lang === 'RU' ? 'Отклонить' : 'Reject'}</Text>
          </Pressable>
          <Pressable
            onPress={() => {
              verifyRoom(room.id);
              onBack();
            }}
            className="flex-1 flex-row items-center justify-center gap-1.5 py-3.5 rounded-xl bg-success"
          >
            <Check size={15} color="#fff" />
            <Text className="text-sm font-jost-semibold text-white">{lang === 'RU' ? 'Принять' : 'Accept'}</Text>
          </Pressable>
        </View>
      )}

      <Modal visible={showRejectModal} transparent animationType="fade" onRequestClose={() => setShowRejectModal(false)}>
        <KeyboardAvoidingView className="flex-1 items-center justify-center bg-dark/60 p-3.5" behavior="padding">
          <View className="bg-white rounded-[20px] border border-border w-full max-w-sm p-5 gap-3.5">
            <Text className="text-base font-jost-semibold text-text-primary">
              {lang === 'RU' ? `Вернуть № ${room.roomNumber} на переуборку` : `Send No. ${room.roomNumber} back`}
            </Text>
            <TextInput
              value={rejectNote}
              onChangeText={setRejectNote}
              multiline
              placeholder={lang === 'RU' ? 'Что нужно переделать' : 'What needs to be redone'}
              placeholderTextColor="#8A8177"
              className="bg-background border border-border rounded-xl p-3 text-sm text-text-primary font-jost min-h-[70px]"
            />
            <View className="flex-row gap-2.5">
              <Pressable onPress={() => setShowRejectModal(false)} className="flex-1 py-2.5 bg-background rounded-xl border border-border-light items-center active:bg-border-light">
                <Text className="text-primary text-sm font-jost-semibold">{lang === 'RU' ? 'Отмена' : 'Cancel'}</Text>
              </Pressable>
              <Pressable onPress={handleReject} className="flex-1 py-2.5 rounded-xl items-center bg-error">
                <Text className="text-sm font-jost-semibold text-white">{lang === 'RU' ? 'Вернуть' : 'Send back'}</Text>
              </Pressable>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
}
