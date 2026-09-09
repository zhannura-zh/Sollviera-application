import React, { useState } from 'react';
import { View, Text, TextInput, Pressable, ScrollView, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Search, CheckSquare, DollarSign } from 'lucide-react-native';
import { HotelRoom, RoomStatus, CleaningType, RoomPriority } from '@/types';
import { getTranslation } from '@/lib/locales';
import { useApp } from '@/context/app-store';
import { RoomChecklistModal } from '@/components/room-checklist-modal';
import { CheckoutReportModal } from '@/components/checkout-report-modal';
import { SelectField } from '@/components/ui/select-field';

interface DashboardScreenProps {
  onOpenRoom: (roomId: string) => void;
}

export function DashboardScreen({ onOpenRoom }: DashboardScreenProps) {
  const { lang, cleanerProfile, rooms, updateRoomStatus, updateRoomChecklist } = useApp();
  const t = getTranslation(lang);

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<RoomStatus | 'ALL'>('ALL');
  const [selectedFloor, setSelectedFloor] = useState<number | 'ALL'>('ALL');
  const [selectedCleaningType, setSelectedCleaningType] = useState<CleaningType | 'ALL'>('ALL');

  const [activeModalRoomId, setActiveModalRoomId] = useState<string | null>(null);
  const activeModalRoom = rooms.find((r) => r.id === activeModalRoomId) || null;

  const [activeCheckoutRoomId, setActiveCheckoutRoomId] = useState<string | null>(null);
  const activeCheckoutRoom = rooms.find((r) => r.id === activeCheckoutRoomId) || null;
  const [submittedCheckoutRoomIds, setSubmittedCheckoutRoomIds] = useState<string[]>([]);

  const filteredRooms = rooms.filter((room) => {
    const q = searchQuery.toLowerCase();
    const matchesSearch =
      room.roomNumber.toLowerCase().includes(q) ||
      room.category.toLowerCase().includes(q) ||
      `floor ${room.floor}`.toLowerCase().includes(q);
    const matchesStatus = selectedStatus === 'ALL' || room.status === selectedStatus;
    const matchesFloor = selectedFloor === 'ALL' || room.floor === selectedFloor;
    const matchesType = selectedCleaningType === 'ALL' || room.cleaningType === selectedCleaningType;
    return matchesSearch && matchesStatus && matchesFloor && matchesType;
  });

  const completedToday = rooms.filter((r) => r.status === 'READY' || r.status === 'VERIFIED').length;
  const remainingRooms = rooms.length - completedToday;

  const getCleaningTypeLabel = (type: CleaningType) => {
    switch (type) {
      case 'CHECKOUT': return t.typeCheckout;
      case 'STAYOVER': return t.typeStayover;
      case 'DEEP_CLEAN': return t.typeDeepClean;
      case 'AFTER_MAINTENANCE': return t.typeAfterMaintenance;
    }
  };

  const getLeftLineColor = (status: RoomStatus) => {
    switch (status) {
      case 'PROBLEM': return '#e11d48';
      case 'IN_PROGRESS': return '#C2410C';
      case 'READY': return '#009b72';
      case 'VERIFIED': return '#64748b';
      default: return '#E5E2DD';
    }
  };

  const getRightStatusText = (room: HotelRoom) => {
    if (room.isOverdue) {
      if (room.roomNumber === '312') return lang === 'RU' ? '13:00 · +24 мин' : '13:00 · +24 min';
      return `${room.deadline} · LATE`;
    }
    if (room.status === 'IN_PROGRESS') return lang === 'RU' ? 'в работе · 12 мин' : 'in progress · 12 min';
    return '';
  };

  const handleRoomAction = (room: HotelRoom) => {
    const activeRoomInProgress = rooms.find((r) => r.status === 'IN_PROGRESS');
    if (activeRoomInProgress && activeRoomInProgress.id !== room.id) {
      Alert.alert(
        '',
        lang === 'RU'
          ? `Сначала приостановите (нажмите паузу) активную уборку в номере #${activeRoomInProgress.roomNumber}.`
          : `Please pause the active cleaning in room #${activeRoomInProgress.roomNumber} first.`
      );
      return;
    }

    if (room.status === 'PENDING') {
      updateRoomStatus(room.id, 'IN_PROGRESS');
      onOpenRoom(room.id);
    } else {
      onOpenRoom(room.id);
    }
  };

  const statusChips: (RoomStatus | 'ALL')[] = ['ALL', 'PENDING', 'IN_PROGRESS', 'READY', 'PROBLEM', 'VERIFIED'];
  const statusLabel = (status: RoomStatus | 'ALL') => {
    switch (status) {
      case 'PENDING': return lang === 'RU' ? 'Ожидают' : 'Pending';
      case 'IN_PROGRESS': return lang === 'RU' ? 'В работе' : 'In Work';
      case 'READY': return lang === 'RU' ? 'Готово' : 'Ready';
      case 'PROBLEM': return lang === 'RU' ? 'Проблема' : 'Problem';
      case 'VERIFIED': return lang === 'RU' ? 'Проверено' : 'Verified';
      default: return t.filterAll;
    }
  };

  const primaryActionLabel = (status: RoomStatus) => {
    switch (status) {
      case 'PENDING': return lang === 'RU' ? 'Начать уборку' : 'Start cleaning';
      case 'IN_PROGRESS': return lang === 'RU' ? 'Продолжить' : 'Continue';
      case 'READY': return lang === 'RU' ? 'Готово' : 'Ready';
      case 'VERIFIED': return lang === 'RU' ? 'Проверено' : 'Verified';
      case 'PROBLEM': return lang === 'RU' ? 'Поломка' : 'Damage';
    }
  };

  const primaryActionStyle = (status: RoomStatus) => {
    switch (status) {
      case 'PENDING': return 'bg-primary';
      case 'IN_PROGRESS': return 'bg-white border border-border';
      case 'READY': return 'bg-success-light border border-success/40';
      case 'VERIFIED': return 'bg-indigo-50 border border-indigo-200';
      case 'PROBLEM': return 'bg-error-light border border-error/30';
    }
  };

  const primaryActionTextStyle = (status: RoomStatus) => {
    switch (status) {
      case 'PENDING': return 'text-white';
      case 'IN_PROGRESS': return 'text-text-primary';
      case 'READY': return 'text-success-text';
      case 'VERIFIED': return 'text-indigo-700';
      case 'PROBLEM': return 'text-error-text';
    }
  };

  const renderRoomCard = (room: HotelRoom) => {
    const rightText = getRightStatusText(room);
    return (
      <Pressable
        key={room.id}
        onPress={() => onOpenRoom(room.id)}
        className="bg-white rounded-[14px] border border-border p-4 gap-3.5 relative overflow-hidden active:opacity-90"
      >
        <View
          className="absolute top-0 bottom-0 left-0 w-[3px]"
          style={{ backgroundColor: getLeftLineColor(room.status) }}
        />

        <View className="flex-row items-center justify-between pl-1.5">
          <View className="flex-row items-center gap-1.5">
            <Text className="text-[19px] font-jost-semibold text-text-primary">
              {lang === 'RU' ? `№ ${room.roomNumber}` : `No. ${room.roomNumber}`}
            </Text>
            {room.priority === 'VIP' && (
              <View className="bg-background border border-amber-200/60 px-2 py-0.5 rounded-md">
                <Text className="text-amber-800 font-jost-semibold text-[11px] uppercase tracking-wider">VIP</Text>
              </View>
            )}
            {room.priority === 'URGENT' && (
              <View className="bg-rose-50 border border-rose-100 px-2 py-0.5 rounded-md">
                <Text className="text-rose-700 font-jost-semibold text-[11px] uppercase tracking-wider">
                  {lang === 'RU' ? 'СРОЧНО' : 'URGENT'}
                </Text>
              </View>
            )}
          </View>
          {!!rightText && (
            <Text className={`text-[12px] font-jost ${room.isOverdue ? 'text-rose-700' : 'text-text-secondary'}`}>
              {rightText}
            </Text>
          )}
        </View>

        <Text className="text-[13px] font-jost text-text-secondary pl-1.5">
          {room.category} · {getCleaningTypeLabel(room.cleaningType)} · {room.floor} {lang === 'RU' ? 'этаж' : 'floor'}
        </Text>

        <View className="flex-row items-center gap-2 pt-1">
          <Pressable
            onPress={() => handleRoomAction(room)}
            className={`flex-1 py-3 rounded-xl items-center justify-center active:opacity-90 ${primaryActionStyle(room.status)}`}
          >
            <Text className={`text-sm font-jost-semibold ${primaryActionTextStyle(room.status)}`}>
              {primaryActionLabel(room.status)}
            </Text>
          </Pressable>

          <Pressable
            onPress={() => setActiveCheckoutRoomId(room.id)}
            className={`w-12 h-11 shrink-0 bg-white border rounded-xl items-center justify-center active:bg-background ${
              submittedCheckoutRoomIds.includes(room.id) ? 'border-success' : 'border-border'
            }`}
          >
            <DollarSign size={18} color="#C2410C" />
          </Pressable>
        </View>
      </Pressable>
    );
  };

  const overdueRooms = filteredRooms.filter((r) => r.isOverdue);
  const todayRooms = filteredRooms.filter((r) => !r.isOverdue);

  return (
    <SafeAreaView edges={['top']} className="flex-1 bg-background">
      {/* Header */}
      <View className="px-3.5 pt-3.5 pb-2.5 gap-2.5">
        <View>
          <Text className="text-[12px] text-text-secondary uppercase tracking-widest font-jost">
            {t.dashGreeting} {lang === 'RU' ? cleanerProfile.fullNameRu.split(' ')[0] : cleanerProfile.fullName.split(' ')[0]}
          </Text>
          <Text className="text-2xl font-spectral text-text-primary mt-1.5">
            {lang === 'RU' ? 'Уборка номеров' : 'Room Cleaning'}
          </Text>
        </View>

        <Text className="text-[13px] text-text-secondary font-jost">
          {cleanerProfile.floorAssigned.match(/\d+/)?.[0] || '3'} {lang === 'RU' ? 'этаж' : 'floor'} ·{' '}
          {remainingRooms} {lang === 'RU' ? 'осталось' : 'remaining'} · {completedToday}{' '}
          {lang === 'RU' ? 'убрано' : 'cleaned'} ·{' '}
          <Text className="text-rose-700">
            {rooms.filter((r) => r.isOverdue).length} {lang === 'RU' ? 'просрочен' : 'overdue'}
          </Text>
        </Text>

        <View className="relative pt-0.5">
          <View className="absolute left-3.5 top-0 bottom-0 items-center justify-center z-10">
            <Search size={14} color="#8A8177" />
          </View>
          <TextInput
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder={lang === 'RU' ? 'Поиск по номеру комнаты' : 'Search by room number'}
            placeholderTextColor="#8A8177"
            className="w-full bg-white border border-border rounded-xl pl-9 pr-3 py-2.5 text-sm text-text-primary"
          />
        </View>
      </View>

      {/* Filters */}
      <View className="px-3.5 py-1.5 gap-2">
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 6 }}>
          {statusChips.map((status) => {
            const isSelected = selectedStatus === status;
            return (
              <Pressable
                key={status}
                onPress={() => setSelectedStatus(status)}
                className={`px-3.5 py-1.5 rounded-full border ${
                  isSelected ? 'bg-dark border-dark' : 'bg-white border-border'
                }`}
              >
                <Text className={`text-[13px] font-jost-semibold ${isSelected ? 'text-white' : 'text-text-secondary'}`}>
                  {statusLabel(status)}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>

        <View className="flex-row gap-2">
          <SelectField
            className="flex-1"
            value={selectedFloor}
            onChange={setSelectedFloor}
            options={[
              { value: 'ALL' as const, label: t.floorAll },
              { value: 2, label: `${t.floorLabel} 2` },
              { value: 3, label: `${t.floorLabel} 3` },
              { value: 4, label: `${t.floorLabel} 4` },
            ]}
          />
          <SelectField
            className="flex-1"
            value={selectedCleaningType}
            onChange={setSelectedCleaningType}
            options={[
              { value: 'ALL' as const, label: t.typeAll },
              { value: 'CHECKOUT' as const, label: t.typeCheckout },
              { value: 'STAYOVER' as const, label: t.typeStayover },
              { value: 'DEEP_CLEAN' as const, label: t.typeDeepClean },
              { value: 'AFTER_MAINTENANCE' as const, label: t.typeAfterMaintenance },
            ]}
          />
        </View>
      </View>

      {/* Room list */}
      <ScrollView className="flex-1 px-3.5" contentContainerStyle={{ paddingVertical: 8, gap: 16 }}>
        {filteredRooms.length === 0 ? (
          <View className="p-8 items-center gap-2">
            <CheckSquare size={40} color="#cbd5e1" />
            <Text className="text-sm font-jost-semibold text-slate-400">
              {lang === 'RU' ? 'Комнаты не найдены' : 'No rooms match filters'}
            </Text>
          </View>
        ) : (
          <>
            {overdueRooms.length > 0 && (
              <View className="gap-2">
                <Text className="text-[12px] text-text-secondary font-jost tracking-widest uppercase pl-1.5">
                  {lang === 'RU' ? 'ПРОСРОЧЕНО' : 'OVERDUE'}
                </Text>
                <View className="gap-3">{overdueRooms.map(renderRoomCard)}</View>
              </View>
            )}
            {todayRooms.length > 0 && (
              <View className="gap-2">
                <Text className="text-[12px] text-text-secondary font-jost tracking-widest uppercase pl-1.5">
                  {lang === 'RU' ? 'СЕГОДНЯ' : 'TODAY'}
                </Text>
                <View className="gap-3">{todayRooms.map(renderRoomCard)}</View>
              </View>
            )}
          </>
        )}
      </ScrollView>

      <RoomChecklistModal
        key={activeModalRoom?.id}
        room={activeModalRoom}
        isOpen={activeModalRoom !== null}
        onClose={() => setActiveModalRoomId(null)}
        onUpdateRoomStatus={updateRoomStatus}
        onUpdateRoomChecklist={updateRoomChecklist}
        lang={lang}
      />

      <CheckoutReportModal
        key={activeCheckoutRoom?.id}
        room={activeCheckoutRoom}
        isOpen={activeCheckoutRoom !== null}
        onClose={() => setActiveCheckoutRoomId(null)}
        lang={lang}
        onSubmit={(roomId) => {
          if (!submittedCheckoutRoomIds.includes(roomId)) {
            setSubmittedCheckoutRoomIds((prev) => [...prev, roomId]);
          }
        }}
      />
    </SafeAreaView>
  );
}
