import React, { useEffect, useState } from 'react';
import { View, Text, Pressable, Modal, Alert } from 'react-native';
import { X } from 'lucide-react-native';
import { useApp } from '@/context/app-store';
import { SelectField } from '@/components/ui/select-field';

interface ReassignTasksModalProps {
  visible: boolean;
  onClose: () => void;
}

// "Перераспределение задач" (Profile → Work, and the button at the bottom of the Team
// screen). Moves every non-verified room from one staff member to another — real write,
// via reassignRooms in app-store.tsx (PATCH /housekeeping/:id when online), matching the
// exact source/recipient-picker flow on mobile.sollviera.com.
export function ReassignTasksModal({ visible, onClose }: ReassignTasksModalProps) {
  const { lang, staffList, rooms, reassignRooms } = useApp();
  const [fromId, setFromId] = useState('');
  const [toId, setToId] = useState('');

  useEffect(() => {
    if (visible) {
      setFromId('');
      setToId('');
    }
  }, [visible]);

  const fromStaff = staffList.find((s) => s.id === fromId) || null;
  const toStaff = staffList.find((s) => s.id === toId) || null;
  const pendingCount = fromStaff ? rooms.filter((r) => r.assignedTo === fromStaff.fullName && r.status !== 'VERIFIED').length : 0;
  const canConfirm = !!fromStaff && !!toStaff && fromStaff.id !== toStaff.id;

  const handleConfirm = () => {
    if (!fromStaff || !toStaff) return;
    const count = reassignRooms(fromStaff.fullName, toStaff.fullName);
    onClose();
    Alert.alert(
      lang === 'RU' ? 'Готово' : 'Done',
      count > 0
        ? (lang === 'RU' ? `Передано номеров: ${count}` : `Rooms reassigned: ${count}`)
        : (lang === 'RU' ? 'У этого сотрудника нет активных номеров' : 'This staff member has no active rooms')
    );
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View className="flex-1 items-center justify-center bg-dark/60 p-3.5">
        <View className="bg-white rounded-[20px] border border-border w-full max-w-sm p-5 gap-4">
          <View className="flex-row items-center justify-between">
            <Text className="text-sm font-jost-semibold text-text-primary uppercase tracking-wider">
              {lang === 'RU' ? 'Перераспределить уборки' : 'Reassign cleanings'}
            </Text>
            <Pressable onPress={onClose} className="h-8 w-8 rounded-full bg-background items-center justify-center border border-border-light active:bg-border-light">
              <X size={16} color="#241E1A" />
            </Pressable>
          </View>

          <View className="gap-1.5">
            <Text className="text-[12px] font-jost text-text-secondary uppercase tracking-wider">
              {lang === 'RU' ? 'От кого перенести (источник)' : 'Transfer from (source)'}
            </Text>
            <SelectField
              value={fromId}
              onChange={setFromId}
              options={[
                { value: '', label: lang === 'RU' ? '– Выберите клинера –' : '– Select staff –' },
                ...staffList.map((s) => ({ value: s.id, label: s.fullName })),
              ]}
            />
            {!!fromStaff && (
              <Text className="text-[12px] font-jost text-text-secondary px-0.5">
                {lang === 'RU' ? `Активных номеров: ${pendingCount}` : `Active rooms: ${pendingCount}`}
              </Text>
            )}
          </View>

          <View className="gap-1.5">
            <Text className="text-[12px] font-jost text-text-secondary uppercase tracking-wider">
              {lang === 'RU' ? 'Кому назначить (получатель)' : 'Assign to (recipient)'}
            </Text>
            <SelectField
              value={toId}
              onChange={setToId}
              options={[
                { value: '', label: lang === 'RU' ? '– Выберите клинера –' : '– Select staff –' },
                ...staffList.filter((s) => s.id !== fromId).map((s) => ({ value: s.id, label: s.fullName })),
              ]}
            />
          </View>

          <View className="flex-row gap-2.5">
            <Pressable
              onPress={onClose}
              className="flex-1 py-3 rounded-xl border border-border-light bg-background items-center active:bg-border-light"
            >
              <Text className="text-primary text-sm font-jost-semibold">{lang === 'RU' ? 'Отмена' : 'Cancel'}</Text>
            </Pressable>
            <Pressable
              onPress={handleConfirm}
              disabled={!canConfirm}
              className={`flex-1 py-3 rounded-xl items-center ${canConfirm ? 'bg-primary active:bg-primary-hover' : 'bg-primary/40'}`}
            >
              <Text className="text-white text-sm font-jost-semibold">{lang === 'RU' ? 'Подтвердить перевод' : 'Confirm transfer'}</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}
