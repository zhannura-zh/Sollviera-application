import React, { useState } from 'react';
import { Modal, View, Text, Pressable, TextInput, ScrollView, Alert } from 'react-native';
import { X, Plus, Minus } from 'lucide-react-native';
import { Language, HotelRoom } from '@/types';

interface CheckoutReportModalProps {
  room: HotelRoom | null;
  isOpen: boolean;
  onClose: () => void;
  lang: Language;
  onSubmit: (roomId: string) => void;
}

function Counter({ label, qty, onChange }: { label: string; qty: number; onChange: (diff: number) => void }) {
  return (
    <View className="flex-row justify-between items-center bg-background p-2.5 rounded-xl border border-border-light">
      <Text className="text-text-primary font-jost-semibold text-sm">{label}</Text>
      <View className="flex-row items-center gap-2.5">
        <Pressable
          onPress={() => onChange(-1)}
          className="h-6 w-6 rounded-lg bg-white border border-border items-center justify-center active:bg-background"
        >
          <Minus size={12} color="#475569" />
        </Pressable>
        <Text className="w-5 text-center font-jost-semibold text-text-primary">{qty}</Text>
        <Pressable
          onPress={() => onChange(1)}
          className="h-6 w-6 rounded-lg bg-white border border-border items-center justify-center active:bg-background"
        >
          <Plus size={12} color="#475569" />
        </Pressable>
      </View>
    </View>
  );
}

export function CheckoutReportModal({ room, isOpen, onClose, lang, onSubmit }: CheckoutReportModalProps) {
  const [colaQty, setColaQty] = useState(0);
  const [chipsQty, setChipsQty] = useState(0);
  const [waterQty, setWaterQty] = useState(0);
  const [chocolateQty, setChocolateQty] = useState(0);
  const [hasDamage, setHasDamage] = useState(false);
  const [damageDescription, setDamageDescription] = useState('');

  if (!isOpen || !room) return null;

  const handleSubmit = () => {
    const message =
      lang === 'RU'
        ? `Данные отправлены на ресепшн для комнаты №${room.roomNumber}:\n` +
          `• Газированные напитки: ${colaQty} шт.\n` +
          `• Снеки/чипсы: ${chipsQty} шт.\n` +
          `• Вода: ${waterQty} шт.\n` +
          `• Шоколад: ${chocolateQty} шт.\n` +
          (hasDamage ? `• Ущерб имущества: ${damageDescription}` : '• Ущерб имущества отсутствует')
        : `Report sent to front desk for No. ${room.roomNumber}:\n` +
          `• Soda: ${colaQty} pcs\n` +
          `• Chips: ${chipsQty} pcs\n` +
          `• Water: ${waterQty} pcs\n` +
          `• Chocolate: ${chocolateQty} pcs\n` +
          (hasDamage ? `• Interior damage: ${damageDescription}` : '• No interior damage reported');
    Alert.alert(lang === 'RU' ? 'Отправлено' : 'Sent', message);
    onSubmit(room.id);
    onClose();
  };

  return (
    <Modal visible={isOpen} transparent animationType="fade" onRequestClose={onClose}>
      <View className="flex-1 items-center justify-center bg-dark/40 p-3.5">
        <View className="bg-white rounded-[20px] border border-border w-full max-w-sm max-h-[90%]">
          <ScrollView contentContainerStyle={{ padding: 16, gap: 16 }}>
            {/* Header */}
            <View className="flex-row justify-between items-center border-b border-border-light pb-2">
              <View className="flex-1 pr-2">
                <Text className="text-base font-jost-semibold text-text-primary" numberOfLines={1}>
                  {lang === 'RU' ? `Мини-бар №${room.roomNumber}` : `Minibar No. ${room.roomNumber}`}
                </Text>
                <Text className="text-[12px] text-text-secondary font-jost mt-0.5">
                  {lang === 'RU' ? 'Передача доп. расходов на ресепшн' : 'Send extra room charges to front desk'}
                </Text>
              </View>
              <Pressable
                onPress={onClose}
                className="h-8 w-8 rounded-full bg-background items-center justify-center border border-border-light active:bg-border-light"
              >
                <X size={16} color="#241E1A" />
              </Pressable>
            </View>

            {/* Counters */}
            <View className="gap-2.5">
              <Text className="text-[11px] text-text-secondary uppercase font-jost tracking-wider">
                {lang === 'RU' ? 'Платный мини-бар / Расходники' : 'Consumables / Minibar'}
              </Text>
              <View className="gap-2">
                <Counter label={lang === 'RU' ? 'Газировка / Пепси' : 'Soda / Soda drinks'} qty={colaQty} onChange={(d) => setColaQty((q) => Math.max(0, q + d))} />
                <Counter label={lang === 'RU' ? 'Чипсы / Снеки' : 'Chips / Snacks'} qty={chipsQty} onChange={(d) => setChipsQty((q) => Math.max(0, q + d))} />
                <Counter label={lang === 'RU' ? 'Минеральная вода' : 'Mineral water'} qty={waterQty} onChange={(d) => setWaterQty((q) => Math.max(0, q + d))} />
                <Counter label={lang === 'RU' ? 'Шоколад' : 'Chocolate'} qty={chocolateQty} onChange={(d) => setChocolateQty((q) => Math.max(0, q + d))} />
              </View>
            </View>

            {/* Damage */}
            <View className="gap-2 border-t border-border-light pt-3">
              <Pressable onPress={() => setHasDamage(!hasDamage)} className="flex-row items-center gap-2">
                <View
                  className={`h-[18px] w-[18px] rounded border items-center justify-center ${
                    hasDamage ? 'bg-primary border-primary' : 'border-border bg-white'
                  }`}
                >
                  {hasDamage && <Text className="text-white text-[12px] font-jost-semibold">✓</Text>}
                </View>
                <Text className="text-sm font-jost text-text-primary">
                  {lang === 'RU' ? 'Есть повреждения имущества' : 'Interior damage detected'}
                </Text>
              </Pressable>

              {hasDamage && (
                <TextInput
                  multiline
                  numberOfLines={2}
                  value={damageDescription}
                  onChangeText={setDamageDescription}
                  placeholder={lang === 'RU' ? 'Укажите сломанную технику / мебель...' : 'Specify broken assets...'}
                  placeholderTextColor="#A0988E"
                  className="w-full bg-background border border-border rounded-xl px-2.5 py-2 text-sm font-jost text-text-primary min-h-[56px]"
                />
              )}
            </View>

            {/* Actions */}
            <View className="flex-row gap-2.5">
              <Pressable
                onPress={onClose}
                className="flex-1 py-2.5 bg-background rounded-xl border border-border-light items-center active:bg-border-light"
              >
                <Text className="text-primary text-sm font-jost-semibold">{lang === 'RU' ? 'Отмена' : 'Cancel'}</Text>
              </Pressable>
              <Pressable
                onPress={handleSubmit}
                className="flex-1 py-2.5 bg-primary rounded-xl items-center active:bg-primary-hover"
              >
                <Text className="text-white text-sm font-jost-semibold">
                  {lang === 'RU' ? 'Отправить ресепшну' : 'Submit to desk'}
                </Text>
              </Pressable>
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}
