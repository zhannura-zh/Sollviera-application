import React, { useState } from 'react';
import { Modal, View, Text, Pressable, TextInput, ScrollView, Alert } from 'react-native';
import { X, Plus, Minus } from 'lucide-react-native';
import { Language, HotelRoom, SupplyItem } from '@/types';

interface CheckoutReportModalProps {
  room: HotelRoom | null;
  isOpen: boolean;
  onClose: () => void;
  lang: Language;
  supplies: SupplyItem[];
  onSubmit: (
    roomId: string,
    items: { id: string; nameEn: string; nameRu: string; qty: number }[],
    hasDamage: boolean,
    damageDescription: string
  ) => void;
}

function Counter({ label, qty, onChange }: { label: string; qty: number; onChange: (diff: number) => void }) {
  return (
    <View className="flex-row justify-between items-center bg-background p-2.5 rounded-xl border border-border-light">
      <Text className="text-text-primary font-jost-semibold text-sm flex-1 pr-2" numberOfLines={1}>
        {label}
      </Text>
      <View className="flex-row items-center gap-2.5">
        <Pressable
          disabled={qty <= 0}
          onPress={() => onChange(-1)}
          className="h-6 w-6 rounded-lg bg-white border border-border items-center justify-center active:bg-background disabled:opacity-40"
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

export function CheckoutReportModal({ room, isOpen, onClose, lang, supplies, onSubmit }: CheckoutReportModalProps) {
  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const [hasDamage, setHasDamage] = useState(false);
  const [damageDescription, setDamageDescription] = useState('');

  const minibarItems = supplies.filter((s) => s.category === 'MINIBAR');

  if (!isOpen || !room) return null;

  const handleChange = (id: string, diff: number) => {
    setQuantities((prev) => ({ ...prev, [id]: Math.max(0, (prev[id] || 0) + diff) }));
  };

  const handleSubmit = () => {
    const items = minibarItems.map((item) => ({
      id: item.id,
      nameEn: item.nameEn,
      nameRu: item.nameRu,
      qty: quantities[item.id] || 0,
    }));
    onSubmit(room.id, items, hasDamage, damageDescription);
    setQuantities({});
    setHasDamage(false);
    setDamageDescription('');
    Alert.alert(
      lang === 'RU' ? 'Отправлено' : 'Sent',
      lang === 'RU' ? `Отчёт по номеру №${room.roomNumber} отправлен на ресепшн.` : `Report for No. ${room.roomNumber} sent to the front desk.`
    );
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
              {minibarItems.length === 0 ? (
                <Text className="text-[12px] text-text-secondary font-jost">
                  {lang === 'RU' ? 'Каталог мини-бара пуст' : 'Minibar catalog is empty'}
                </Text>
              ) : (
                <View className="gap-2">
                  {minibarItems.map((item) => (
                    <Counter
                      key={item.id}
                      label={lang === 'RU' ? item.nameRu : item.nameEn}
                      qty={quantities[item.id] || 0}
                      onChange={(diff) => handleChange(item.id, diff)}
                    />
                  ))}
                </View>
              )}
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
