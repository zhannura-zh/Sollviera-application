import React, { useState } from 'react';
import { Modal, View, Text, Pressable, ScrollView } from 'react-native';
import { X, CheckSquare, Square, AlertCircle, Play, ShieldCheck, Sparkles } from 'lucide-react-native';
import { Language, HotelRoom, RoomCheckitem } from '@/types';
import { getTranslation } from '@/lib/locales';

interface RoomChecklistModalProps {
  room: HotelRoom | null;
  isOpen: boolean;
  onClose: () => void;
  onUpdateRoomStatus: (roomId: string, newStatus: HotelRoom['status']) => void;
  onUpdateRoomChecklist: (roomId: string, newChecklist: RoomCheckitem[]) => void;
  lang: Language;
}

export function RoomChecklistModal({
  room,
  isOpen,
  onClose,
  onUpdateRoomStatus,
  onUpdateRoomChecklist,
  lang,
}: RoomChecklistModalProps) {
  const t = getTranslation(lang);
  const [checklist, setChecklist] = useState<RoomCheckitem[]>(room?.checklist ?? []);

  // Keep local checklist in sync whenever a different room is opened.
  React.useEffect(() => {
    if (room) setChecklist(room.checklist);
  }, [room?.id]);

  if (!isOpen || !room) return null;

  const toggleItem = (itemId: string) => {
    const updated = checklist.map((item) => (item.id === itemId ? { ...item, done: !item.done } : item));
    setChecklist(updated);
    onUpdateRoomChecklist(room.id, updated);
  };

  const handleCompleteAll = () => {
    const updated = checklist.map((i) => ({ ...i, done: true }));
    setChecklist(updated);
    onUpdateRoomChecklist(room.id, updated);
  };

  const handleMarkReady = () => {
    onUpdateRoomStatus(room.id, 'READY');
    onClose();
  };

  const handleStartCleaning = () => {
    onUpdateRoomStatus(room.id, 'IN_PROGRESS');
  };

  return (
    <Modal visible={isOpen} transparent animationType="fade" onRequestClose={onClose}>
      <View className="flex-1 items-center justify-center bg-dark/75 p-3">
        <View className="w-full max-w-md rounded-[24px] bg-white border border-border-dark overflow-hidden max-h-[90%]">
          {/* Header */}
          <View className="bg-dark px-5 py-4 flex-row items-center justify-between">
            <View className="flex-row items-center gap-3 flex-1">
              <View className="h-11 w-11 items-center justify-center rounded-2xl bg-primary">
                <Text className="text-white font-jost-semibold text-lg">{room.roomNumber}</Text>
              </View>
              <View className="flex-1">
                <View className="flex-row items-center gap-2">
                  <Text className="text-white font-jost-semibold text-base" numberOfLines={1}>
                    {lang === 'RU' ? 'Комната' : 'Room'} {room.roomNumber}
                  </Text>
                  <View className="rounded bg-white/10 px-2 py-0.5 border border-white/20">
                    <Text className="text-[12px] font-jost-semibold text-white/80">
                      {t.roomFloorLabel} {room.floor}
                    </Text>
                  </View>
                </View>
                <Text className="text-sm text-white/60 font-jost mt-0.5" numberOfLines={1}>
                  {room.category}
                </Text>
              </View>
            </View>
            <Pressable onPress={onClose} className="rounded-full p-2 active:bg-white/10">
              <X size={20} color="#FAF7F3" />
            </Pressable>
          </View>

          {/* Body */}
          <ScrollView className="p-5 bg-background-subtle" contentContainerStyle={{ gap: 16 }}>
            <View className="flex-row gap-2 bg-white p-3 rounded-2xl border border-border">
              <View className="flex-1">
                <Text className="text-[12px] text-text-muted uppercase font-jost-semibold">
                  {t.checkoutShort} / {t.checkinShort}
                </Text>
                <Text className="font-jost-semibold text-text-primary text-sm mt-0.5">
                  {room.checkoutTime} → {room.checkinTime}
                </Text>
              </View>
              <View className="flex-1">
                <Text className="text-[12px] text-text-muted uppercase font-jost-semibold">{t.guestsLabel}</Text>
                <Text className="font-jost-semibold text-text-primary text-sm mt-0.5">
                  {room.adults} {t.adultsShort}, {room.children} {t.childrenShort}
                </Text>
              </View>
            </View>

            {(room.notesEn || room.notesRu) && (
              <View className="rounded-2xl bg-warning-light p-3.5 border border-warning/30 gap-1">
                <View className="flex-row items-center gap-1">
                  <AlertCircle size={13} color="#8A5210" />
                  <Text className="font-jost-semibold uppercase tracking-wider text-[12px] text-warning-text">
                    {t.notesTitle}
                  </Text>
                </View>
                <Text className="text-sm text-warning-text font-jost leading-relaxed">
                  {lang === 'RU' ? room.notesRu : room.notesEn}
                </Text>
              </View>
            )}

            <View className="gap-2">
              <View className="flex-row items-center justify-between">
                <Text className="text-sm font-jost-semibold uppercase tracking-wider text-text-secondary">
                  {t.checklistTitle}
                </Text>
                <Pressable onPress={handleCompleteAll}>
                  <Text className="text-[13px] font-jost-semibold text-primary">{t.markAllDone}</Text>
                </Pressable>
              </View>

              <View className="gap-2 bg-white p-3 rounded-2xl border border-border">
                {checklist.map((item) => (
                  <Pressable
                    key={item.id}
                    onPress={() => toggleItem(item.id)}
                    className={`flex-row items-center gap-3 p-2.5 rounded-xl border active:opacity-80 ${
                      item.done ? 'bg-success-light border-success' : 'bg-background-subtle border-border'
                    }`}
                  >
                    {item.done ? (
                      <CheckSquare size={20} color="#5B8C6E" />
                    ) : (
                      <Square size={20} color="#A0988E" />
                    )}
                    <Text
                      className={`text-sm font-jost-semibold flex-1 ${
                        item.done ? 'line-through text-text-muted' : 'text-text-primary'
                      }`}
                    >
                      {lang === 'RU' ? item.textRu : item.textEn}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </View>
          </ScrollView>

          {/* Footer */}
          <View className="p-4 bg-white border-t border-border">
            {room.status === 'PENDING' && (
              <Pressable
                onPress={handleStartCleaning}
                className="w-full bg-primary py-3 px-4 rounded-xl flex-row items-center justify-center gap-2 active:bg-primary-hover"
              >
                <Play size={16} color="#fff" />
                <Text className="text-white font-jost-semibold text-sm">{t.btnStartCleaning}</Text>
              </Pressable>
            )}
            {room.status === 'IN_PROGRESS' && (
              <Pressable
                onPress={handleMarkReady}
                className="w-full bg-success py-3 px-4 rounded-xl flex-row items-center justify-center gap-2 active:opacity-90"
              >
                <ShieldCheck size={16} color="#fff" />
                <Text className="text-white font-jost-semibold text-sm">{t.submitInspection}</Text>
              </Pressable>
            )}
            {(room.status === 'READY' || room.status === 'VERIFIED') && (
              <View className="w-full items-center py-2.5 bg-success-light rounded-xl border border-success/30">
                <Text className="text-sm font-jost-semibold text-success-text">✓ {t.roomVerifiedText}</Text>
              </View>
            )}
            {room.status === 'PROBLEM' && (
              <Pressable
                onPress={handleStartCleaning}
                className="w-full bg-warning py-3 px-4 rounded-xl flex-row items-center justify-center gap-2 active:opacity-90"
              >
                <Sparkles size={16} color="#fff" />
                <Text className="text-white font-jost-semibold text-sm">{t.btnContinueCleaning}</Text>
              </Pressable>
            )}
          </View>
        </View>
      </View>
    </Modal>
  );
}
