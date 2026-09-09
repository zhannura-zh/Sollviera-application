import React, { useState, useEffect } from 'react';
import { View, Text, Pressable, ScrollView, TextInput, Image, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  Play, Pause, AlertTriangle, ShieldCheck, ClipboardList, Camera,
  ChevronDown, ChevronRight, HelpCircle, ArrowLeft, Send, Check, Package,
} from 'lucide-react-native';
import { HotelRoom, RoomStatus, RoomCheckitem, ChecklistZone } from '@/types';
import { getTranslation } from '@/lib/locales';
import { useApp } from '@/context/app-store';

const MOCK_PHOTOS = [
  'https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1507652313519-d4e9174996dd?w=150&auto=format&fit=crop&q=80',
];
const MOCK_PHOTO_BEFORE = 'https://images.unsplash.com/photo-1616594039964-ae9021a400a0?w=300&auto=format&fit=crop&q=80';
const MOCK_PHOTO_AFTER = 'https://images.unsplash.com/photo-1598928506311-c55ded91a20c?w=300&auto=format&fit=crop&q=80';
const MOCK_DEFECT_PHOTO = 'https://images.unsplash.com/photo-1581092921461-eab62e97a780?w=300&auto=format&fit=crop&q=80';
const DAMAGE_TYPES = ['Сломан фен', 'Сломана мебель', 'Разбито стекло', 'Повреждён ТВ', 'Другое'];

interface RoomDetailsScreenProps {
  room: HotelRoom | null;
  onBack: () => void;
  onGoToMaintenance: () => void;
}

export function RoomDetailsScreen({ room, onBack, onGoToMaintenance }: RoomDetailsScreenProps) {
  const { lang, updateRoomStatus, updateRoomChecklist, addSystemNotification, addMaintenanceRequest, supplies, deductSupplies } = useApp();
  const t = getTranslation(lang);

  const [timerSeconds, setTimerSeconds] = useState(0);
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [roomComment, setRoomComment] = useState('');

  const [spentQuantities, setSpentQuantities] = useState<Record<string, number>>({});
  const [deductedSuccess, setDeductedSuccess] = useState(false);

  const [maintenanceDesc, setMaintenanceDesc] = useState('');
  const [maintenancePhoto, setMaintenancePhoto] = useState('');
  const [maintenanceSuccess, setMaintenanceSuccess] = useState(false);
  const [isGuestDamage, setIsGuestDamage] = useState(false);
  const [guestDamageType, setGuestDamageType] = useState('Сломан фен');

  const [isSuppliesExpanded, setIsSuppliesExpanded] = useState(false);
  const [isMaintenanceExpanded, setIsMaintenanceExpanded] = useState(false);

  const [minibarRefilled, setMinibarRefilled] = useState<Record<string, number>>({});
  const [minibarDeductedSuccess, setMinibarDeductedSuccess] = useState(false);

  const [expandedZones, setExpandedZones] = useState<Record<string, boolean>>({
    BEDROOM: true,
    BATHROOM: true,
    MINIBAR: false,
    BALCONY: false,
    OTHER: false,
  });

  const [confirmStandard, setConfirmStandard] = useState(false);
  const [photoBeforeUrl, setPhotoBeforeUrl] = useState('');
  const [photoAfterUrl, setPhotoAfterUrl] = useState('');
  const [zonePhotos, setZonePhotos] = useState<Record<string, string>>({});

  useEffect(() => {
    let interval: ReturnType<typeof setInterval> | null = null;
    if (room && room.status === 'IN_PROGRESS' && isTimerRunning) {
      interval = setInterval(() => setTimerSeconds((prev) => prev + 1), 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [room?.status, isTimerRunning]);

  useEffect(() => {
    if (room) {
      if (room.status === 'IN_PROGRESS') {
        setIsTimerRunning(true);
        if (timerSeconds === 0) setTimerSeconds(8 * 60 + 12);
      } else {
        setIsTimerRunning(false);
      }
      setConfirmStandard(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [room?.id, room?.status]);

  if (!room) {
    return (
      <SafeAreaView edges={['top']} className="flex-1 bg-background-subtle items-center justify-center p-8 gap-4">
        <View className="h-16 w-16 bg-sky-50 rounded-3xl items-center justify-center border border-sky-100">
          <ClipboardList size={32} color="#0284c7" />
        </View>
        <Text className="text-lg font-jost-semibold text-text-primary text-center">{t.noActiveRoom}</Text>
        <Text className="text-sm text-text-secondary text-center max-w-xs leading-relaxed">
          {t.selectRoomWarning}
        </Text>
      </SafeAreaView>
    );
  }

  const formatTime = (sec: number) => {
    const mm = Math.floor(sec / 60).toString().padStart(2, '0');
    const ss = (sec % 60).toString().padStart(2, '0');
    return `${mm}:${ss}`;
  };

  const handleStartCleaning = () => {
    updateRoomStatus(room.id, 'IN_PROGRESS');
    setIsTimerRunning(true);
    addSystemNotification(
      `Cleaning started for Room ${room.roomNumber}`,
      `Начата уборка номера ${room.roomNumber}`,
      'SYSTEM'
    );
  };

  const toggleZone = (zone: string) => setExpandedZones((prev) => ({ ...prev, [zone]: !prev[zone] }));

  const handleToggleCheckitem = (itemId: string) => {
    const updated = room.checklist.map((item) => (item.id === itemId ? { ...item, done: !item.done } : item));
    updateRoomChecklist(room.id, updated);
  };

  const handleUpdateSpent = (id: string, diff: number) => {
    setSpentQuantities((prev) => ({ ...prev, [id]: Math.max(0, (prev[id] || 0) + diff) }));
  };

  const handleConfirmDeductions = () => {
    deductSupplies(spentQuantities);
    setSpentQuantities({});
    setDeductedSuccess(true);
    setTimeout(() => setDeductedSuccess(false), 2500);
  };

  const handleUpdateMinibarRefilled = (id: string, diff: number) => {
    setMinibarRefilled((prev) => ({ ...prev, [id]: Math.max(0, (prev[id] || 0) + diff) }));
  };

  const handleConfirmMinibarDeduction = () => {
    deductSupplies(minibarRefilled);
    setMinibarRefilled({});
    setMinibarDeductedSuccess(true);
    setTimeout(() => setMinibarDeductedSuccess(false), 2500);
  };

  const handleReportMaintenance = () => {
    if (!maintenanceDesc.trim()) return;
    addMaintenanceRequest({
      roomNumber: room.roomNumber,
      category: isGuestDamage ? 'APPLIANCES' : 'OTHER',
      priority: isGuestDamage ? 'HIGH' : 'MEDIUM',
      description: isGuestDamage ? `[Поломка гостем: ${guestDamageType}] ${maintenanceDesc.trim()}` : maintenanceDesc.trim(),
      blocksCleaning: false,
      photoUrl: maintenancePhoto || undefined,
      isGuestDamage,
      guestDamageType: isGuestDamage ? guestDamageType : undefined,
    });
    setMaintenanceDesc('');
    setMaintenancePhoto('');
    setIsGuestDamage(false);
    setMaintenanceSuccess(true);
    setTimeout(() => setMaintenanceSuccess(false), 3000);
  };

  const handleMarkFinished = () => {
    if (!confirmStandard) return;
    updateRoomStatus(room.id, 'READY');
    setIsTimerRunning(false);
    addSystemNotification(
      `Room ${room.roomNumber} ready for inspection`,
      `Номер ${room.roomNumber} готов к проверке`,
      'SUPERVISOR'
    );
    onBack();
  };

  const randomMockPhoto = () => MOCK_PHOTOS[Math.floor(Math.random() * MOCK_PHOTOS.length)];

  const itemsByZone: Record<ChecklistZone, RoomCheckitem[]> = {
    BEDROOM: [], BATHROOM: [], MINIBAR: [], BALCONY: [], OTHER: [],
  };
  room.checklist.forEach((item) => itemsByZone[item.zone || 'OTHER'].push(item));

  const getZoneLabel = (zone: string) => {
    switch (zone) {
      case 'BEDROOM': return t.zoneBedroom;
      case 'BATHROOM': return t.zoneBathroom;
      case 'MINIBAR': return t.zoneMinibar;
      case 'BALCONY': return t.zoneBalcony;
      default: return t.zoneOther;
    }
  };

  const allTasksDone = room.checklist.every((item) => item.done);
  const statusLabel =
    room.status === 'READY' ? (lang === 'RU' ? 'готово' : 'ready') :
    room.status === 'PROBLEM' ? (lang === 'RU' ? 'поломка' : 'defect') :
    room.status === 'VERIFIED' ? (lang === 'RU' ? 'проверено' : 'verified') :
    (lang === 'RU' ? 'ожидает' : 'pending');

  return (
    <View className="flex-1 bg-background">
      {/* Header */}
      <SafeAreaView edges={['top']} className="bg-dark px-[18px] pt-[18px] pb-4 gap-3.5 border-b border-white/10">
        <View className="flex-row items-center justify-between">
          <Pressable onPress={onBack} className="flex-row items-center gap-1 active:opacity-70">
            <ArrowLeft size={16} color="#8A8177" />
            <Text className="text-[13px] font-jost text-text-secondary">{lang === 'RU' ? 'Назад' : 'Back'}</Text>
          </Pressable>
          {!!room.priority && (
            <View
              className={`px-2 py-0.5 rounded border ${
                room.priority === 'VIP'
                  ? 'bg-amber-950/50 border-amber-800/30'
                  : room.priority === 'URGENT'
                  ? 'bg-rose-950/50 border-rose-800/30'
                  : 'bg-white/5 border-white/10'
              }`}
            >
              <Text
                className={`text-[11px] font-jost-semibold uppercase tracking-widest ${
                  room.priority === 'VIP' ? 'text-warning' : room.priority === 'URGENT' ? 'text-rose-500' : 'text-text-secondary'
                }`}
              >
                {room.priority}
              </Text>
            </View>
          )}
        </View>

        <View className="flex-row items-end justify-between">
          <View className="shrink">
            <Text className="text-[30px] font-jost-semibold text-white">
              {lang === 'RU' ? `№ ${room.roomNumber}` : `No. ${room.roomNumber}`}
            </Text>
            <Text className="text-[13px] text-text-secondary font-jost mt-1.5" numberOfLines={1}>
              {room.category} ·{' '}
              {room.cleaningType === 'CHECKOUT' ? (lang === 'RU' ? 'выездная' : 'checkout') :
                room.cleaningType === 'STAYOVER' ? (lang === 'RU' ? 'текущая' : 'stayover') :
                room.cleaningType === 'DEEP_CLEAN' ? (lang === 'RU' ? 'генеральная' : 'deep clean') :
                (lang === 'RU' ? 'после ремонта' : 'after maintenance')}
            </Text>
          </View>

          <View className="items-end shrink-0">
            {room.status === 'IN_PROGRESS' ? (
              <>
                <Text className="text-2xl font-jost-semibold text-warning tracking-tight">
                  {formatTime(timerSeconds)}
                </Text>
                <Text className="text-[12px] text-text-secondary font-jost mt-1">
                  {lang === 'RU' ? 'в работе' : 'in progress'}
                </Text>
              </>
            ) : (
              <>
                <Text className="text-lg font-jost-semibold text-background uppercase tracking-wide">{statusLabel}</Text>
                <Text className="text-[12px] text-text-secondary font-jost mt-1.5">{lang === 'RU' ? 'статус' : 'status'}</Text>
              </>
            )}
          </View>
        </View>
      </SafeAreaView>

      <ScrollView className="flex-1 p-4" contentContainerStyle={{ gap: 16 }}>
        {(room.notesEn || room.notesRu) && (
          <View className="bg-[#FFFDF5] rounded-[14px] border border-warning/40 p-3.5 flex-row gap-2.5">
            <HelpCircle size={16} color="#8A8177" />
            <Text className="text-sm text-text-primary font-jost leading-relaxed flex-1">
              {lang === 'RU' ? room.notesRu : room.notesEn}
            </Text>
          </View>
        )}

        <View className="flex-row items-center gap-3">
          {room.status === 'PENDING' && (
            <Pressable
              onPress={handleStartCleaning}
              className="flex-1 bg-primary py-3 px-4 rounded-xl flex-row items-center justify-center gap-2 active:bg-primary-hover"
            >
              <Play size={16} color="#fff" />
              <Text className="text-white text-sm font-jost-semibold">{t.btnStartCleaning}</Text>
            </Pressable>
          )}
          {(room.status === 'IN_PROGRESS' || room.status === 'PROBLEM') && (
            <>
              <Pressable
                onPress={() => setIsTimerRunning(!isTimerRunning)}
                className="flex-1 bg-white border border-warning py-3 px-4 rounded-xl flex-row items-center justify-center gap-2 active:bg-background"
              >
                {isTimerRunning ? <Pause size={16} color="#E4762B" /> : <Play size={16} color="#E4762B" />}
                <Text className="text-text-primary text-sm font-jost-semibold">{isTimerRunning ? t.btnPause : t.btnResume}</Text>
              </Pressable>
              <Pressable
                onPress={onGoToMaintenance}
                className="flex-1 bg-white border border-error py-3 px-4 rounded-xl flex-row items-center justify-center gap-2 active:bg-background"
              >
                <AlertTriangle size={16} color="#B3261E" />
                <Text className="text-text-primary text-sm font-jost-semibold">{lang === 'RU' ? 'Поломка' : 'Damage'}</Text>
              </Pressable>
            </>
          )}
        </View>

        {room.status !== 'PENDING' && (
          <View className="gap-3.5">
            <Text className="text-[12px] text-text-secondary font-jost tracking-widest uppercase px-1">
              {lang === 'RU' ? 'Чек-лист уборки номера' : 'Room Cleaning Checklist'}
            </Text>

            {(Object.keys(itemsByZone) as ChecklistZone[]).map((zone) => {
              const items = itemsByZone[zone];
              if (items.length === 0) return null;
              const isExpanded = expandedZones[zone];
              const completedCount = items.filter((i) => i.done).length;

              return (
                <View key={zone} className="bg-white rounded-[14px] border border-border overflow-hidden">
                  <Pressable
                    onPress={() => toggleZone(zone)}
                    className={`flex-row items-center justify-between px-3.5 py-2.5 active:bg-background ${
                      isExpanded ? 'border-b border-border-light' : ''
                    }`}
                  >
                    <View className="flex-row items-center gap-2">
                      <Text className="text-[12px] text-text-primary font-jost-semibold tracking-widest uppercase">
                        {getZoneLabel(zone)}
                      </Text>
                      <Text className="text-[12px] text-text-secondary font-jost">
                        {completedCount} {lang === 'RU' ? 'из' : 'of'} {items.length}
                      </Text>
                    </View>
                    {isExpanded ? <ChevronDown size={16} color="#8A8177" /> : <ChevronRight size={16} color="#8A8177" />}
                  </Pressable>

                  {isExpanded && (
                    <View className="p-3.5 gap-3">
                      {items.map((item) => (
                        <View key={item.id} className="gap-2">
                          <View className="flex-row items-start gap-2.5">
                            <Pressable
                              disabled={room.status !== 'IN_PROGRESS'}
                              onPress={() => handleToggleCheckitem(item.id)}
                              className={`h-[18px] w-[18px] rounded border items-center justify-center ${
                                item.done ? 'bg-success border-success' : 'border-border bg-white'
                              } ${room.status !== 'IN_PROGRESS' ? 'opacity-50' : ''}`}
                            >
                              {item.done && <Check size={12} color="#fff" />}
                            </Pressable>
                            <Text
                              className={`text-sm font-jost text-text-primary flex-1 leading-snug ${
                                item.done ? 'line-through text-text-secondary' : ''
                              }`}
                            >
                              {lang === 'RU' ? item.textRu : item.textEn}
                            </Text>
                          </View>

                          {zone === 'MINIBAR' && room.status === 'IN_PROGRESS' && (
                            <View className="mt-2.5 ml-6 gap-2">
                              <View className="border border-border rounded-xl bg-background-subtle">
                                {supplies.filter((s) => s.category === 'MINIBAR').map((s, i, arr) => {
                                  const standardQty = s.id === 's14' || s.id === 's15' ? 1 : 2;
                                  const refilledQty = minibarRefilled[s.id] || 0;
                                  return (
                                    <View
                                      key={s.id}
                                      className={`flex-row items-center justify-between p-2 ${
                                        i < arr.length - 1 ? 'border-b border-border-light' : ''
                                      }`}
                                    >
                                      <View className="flex-1 pr-2">
                                        <Text className="font-jost text-text-primary text-sm leading-snug" numberOfLines={1}>
                                          {lang === 'RU' ? s.nameRu : s.nameEn}
                                        </Text>
                                        <Text className="text-[11px] text-text-secondary font-jost">
                                          {lang === 'RU' ? `Стандарт: ${standardQty} | В наличии: ${s.trolleyQty}` : `Standard: ${standardQty} | Trolley: ${s.trolleyQty}`}
                                        </Text>
                                      </View>
                                      <View className="flex-row items-center gap-1.5">
                                        <Pressable
                                          disabled={refilledQty <= 0}
                                          onPress={() => handleUpdateMinibarRefilled(s.id, -1)}
                                          className="h-6 w-6 rounded-md bg-white border border-border items-center justify-center disabled:opacity-40"
                                        >
                                          <Text className="font-jost-semibold text-text-primary">-</Text>
                                        </Pressable>
                                        <Text className="w-5 text-center font-jost text-text-primary text-[13px]">{refilledQty}</Text>
                                        <Pressable
                                          disabled={refilledQty >= standardQty || refilledQty >= s.trolleyQty}
                                          onPress={() => handleUpdateMinibarRefilled(s.id, 1)}
                                          className="h-6 w-6 rounded-md bg-white border border-border items-center justify-center disabled:opacity-40"
                                        >
                                          <Text className="font-jost-semibold text-text-primary">+</Text>
                                        </Pressable>
                                      </View>
                                    </View>
                                  );
                                })}
                              </View>

                              {Object.keys(minibarRefilled).some((k) => minibarRefilled[k] > 0) && (
                                <View className="pt-1.5 flex-row items-center justify-between gap-2.5">
                                  <Text className="text-[11px] text-text-secondary font-jost flex-1">
                                    {lang === 'RU' ? 'Спишется с тележки.' : 'Will deduct from trolley.'}
                                  </Text>
                                  {minibarDeductedSuccess ? (
                                    <Text className="text-[12px] font-jost text-success">✓ {lang === 'RU' ? 'Готово!' : 'Done!'}</Text>
                                  ) : (
                                    <Pressable
                                      onPress={handleConfirmMinibarDeduction}
                                      className="px-3 py-1.5 bg-primary rounded-lg active:bg-primary-hover"
                                    >
                                      <Text className="text-white text-[12px] font-jost-semibold">
                                        {lang === 'RU' ? 'Подтвердить списание' : 'Confirm Refills'}
                                      </Text>
                                    </Pressable>
                                  )}
                                </View>
                              )}
                            </View>
                          )}
                        </View>
                      ))}

                      {room.status === 'IN_PROGRESS' && (
                        zonePhotos[zone] ? (
                          <View className="pt-2.5 border-t border-border-light flex-row items-center justify-between gap-3">
                            <View className="flex-row items-center gap-2 flex-1">
                              <Camera size={16} color="#8A8177" />
                              <Text className="text-[12px] text-text-secondary font-jost uppercase tracking-wider">
                                {lang === 'RU' ? 'Фотофиксация зоны' : 'Zone Photo Capture'}
                              </Text>
                            </View>
                            <View className="flex-row items-center gap-2">
                              <Pressable onPress={() => setZonePhotos((prev) => ({ ...prev, [zone]: '' }))}>
                                <Image source={{ uri: zonePhotos[zone] }} className="h-10 w-16 rounded-lg border border-border" />
                              </Pressable>
                              <Text className="text-[11px] font-jost text-success">✓ {lang === 'RU' ? 'Загружено' : 'Uploaded'}</Text>
                            </View>
                          </View>
                        ) : (
                          <Pressable
                            onPress={() => setZonePhotos((prev) => ({ ...prev, [zone]: randomMockPhoto() }))}
                            className="pt-2.5 border-t border-border-light flex-row items-center gap-2"
                          >
                            <Camera size={16} color="#8A8177" />
                            <Text className="text-[12px] text-text-secondary font-jost uppercase tracking-wider">
                              {lang === 'RU' ? 'Фотофиксация зоны' : 'Zone Photo Capture'}
                            </Text>
                          </Pressable>
                        )
                      )}
                    </View>
                  )}
                </View>
              );
            })}
          </View>
        )}

        {room.status === 'IN_PROGRESS' && (
          <View className="bg-white rounded-[14px] border border-border overflow-hidden">
            <Pressable
              onPress={() => setIsSuppliesExpanded(!isSuppliesExpanded)}
              className={`flex-row items-center justify-between px-3.5 py-2.5 active:bg-background ${
                isSuppliesExpanded ? 'border-b border-border-light' : ''
              }`}
            >
              <View className="flex-row items-center gap-2">
                <Package size={16} color="#8A8177" />
                <Text className="text-[12px] text-text-secondary font-jost tracking-widest uppercase">
                  {lang === 'RU' ? 'Расход материалов' : 'Supplies Consumption'}
                </Text>
              </View>
              {isSuppliesExpanded ? <ChevronDown size={16} color="#8A8177" /> : <ChevronRight size={16} color="#8A8177" />}
            </Pressable>

            {isSuppliesExpanded && (
              <View className="p-3.5 gap-3">
                <Text className="text-[11px] text-text-secondary font-jost uppercase">
                  {lang === 'RU' ? 'Укажите количество использованных позиций:' : 'Specify used quantities:'}
                </Text>
                <View className="border border-border rounded-xl bg-background-subtle">
                  {supplies.filter((s) => s.category !== 'CLEANING' && s.category !== 'MINIBAR').map((s, i, arr) => {
                    const currentSpent = spentQuantities[s.id] || 0;
                    return (
                      <View
                        key={s.id}
                        className={`flex-row items-center justify-between p-2 ${i < arr.length - 1 ? 'border-b border-border-light' : ''}`}
                      >
                        <View className="flex-1 pr-2">
                          <Text className="font-jost text-text-primary text-sm leading-snug" numberOfLines={1}>
                            {lang === 'RU' ? s.nameRu : s.nameEn}
                          </Text>
                          <Text className="text-[11px] text-text-secondary font-jost">
                            {lang === 'RU' ? 'В наличии на тележке: ' : 'Trolley stock: '}{s.trolleyQty} {s.unit}
                          </Text>
                        </View>
                        <View className="flex-row items-center gap-1.5">
                          <Pressable
                            disabled={currentSpent <= 0}
                            onPress={() => handleUpdateSpent(s.id, -1)}
                            className="h-6 w-6 rounded-md bg-white border border-border items-center justify-center disabled:opacity-40"
                          >
                            <Text className="font-jost-semibold text-text-primary">-</Text>
                          </Pressable>
                          <Text className="w-5 text-center font-jost text-text-primary text-[13px]">{currentSpent}</Text>
                          <Pressable
                            disabled={currentSpent >= s.trolleyQty}
                            onPress={() => handleUpdateSpent(s.id, 1)}
                            className="h-6 w-6 rounded-md bg-white border border-border items-center justify-center disabled:opacity-40"
                          >
                            <Text className="font-jost-semibold text-text-primary">+</Text>
                          </Pressable>
                        </View>
                      </View>
                    );
                  })}
                </View>

                {Object.keys(spentQuantities).some((k) => spentQuantities[k] > 0) && (
                  <View className="pt-1.5 flex-row items-center justify-between gap-2.5">
                    <Text className="text-[11px] text-text-secondary font-jost flex-1">
                      {lang === 'RU' ? 'Будет списано с тележки.' : 'Will be deducted from trolley.'}
                    </Text>
                    {deductedSuccess ? (
                      <Text className="text-[12px] font-jost text-success">✓ {lang === 'RU' ? 'Списано!' : 'Deducted!'}</Text>
                    ) : (
                      <Pressable onPress={handleConfirmDeductions} className="px-3 py-1.5 bg-primary rounded-lg active:bg-primary-hover">
                        <Text className="text-white text-[12px] font-jost-semibold">
                          {lang === 'RU' ? 'Подтвердить списание' : 'Confirm Deductions'}
                        </Text>
                      </Pressable>
                    )}
                  </View>
                )}
              </View>
            )}
          </View>
        )}

        {room.status === 'IN_PROGRESS' && (
          <View className="bg-white rounded-xl border border-border p-3 gap-2.5">
            <Text className="text-[12px] font-jost uppercase text-text-secondary tracking-widest">
              {lang === 'RU' ? 'Фотоотчет состояния комнаты' : 'Room Photo Inspection'}
            </Text>
            <View className="flex-row gap-3">
              <View className="flex-1 gap-1.5">
                <Text className="text-[11px] text-text-secondary uppercase">{t.photoBefore}</Text>
                {photoBeforeUrl ? (
                  <Pressable onPress={() => setPhotoBeforeUrl('')}>
                    <Image source={{ uri: photoBeforeUrl }} className="w-full h-20 rounded-lg border border-border" />
                  </Pressable>
                ) : (
                  <Pressable
                    onPress={() => setPhotoBeforeUrl(MOCK_PHOTO_BEFORE)}
                    className="w-full h-20 border-2 border-dashed border-border rounded-lg items-center justify-center gap-1 bg-background"
                  >
                    <Camera size={16} color="#8A8177" />
                    <Text className="text-[11px] text-text-secondary">{t.btnUpload}</Text>
                  </Pressable>
                )}
              </View>
              <View className="flex-1 gap-1.5">
                <Text className="text-[11px] text-text-secondary uppercase">{t.photoAfter}</Text>
                {photoAfterUrl ? (
                  <Pressable onPress={() => setPhotoAfterUrl('')}>
                    <Image source={{ uri: photoAfterUrl }} className="w-full h-20 rounded-lg border border-border" />
                  </Pressable>
                ) : (
                  <Pressable
                    onPress={() => setPhotoAfterUrl(MOCK_PHOTO_AFTER)}
                    className="w-full h-20 border-2 border-dashed border-border rounded-lg items-center justify-center gap-1 bg-background"
                  >
                    <Camera size={16} color="#8A8177" />
                    <Text className="text-[11px] text-text-secondary">{t.btnUpload}</Text>
                  </Pressable>
                )}
              </View>
            </View>

            <TextInput
              multiline
              numberOfLines={2}
              value={roomComment}
              onChangeText={setRoomComment}
              placeholder={lang === 'RU' ? 'Комментарии и примечания по комнате' : 'Room Comments & Notes'}
              placeholderTextColor="#8A8177"
              className="w-full bg-background border border-border rounded-xl p-2 text-sm text-text-primary font-jost min-h-[52px] mt-1.5"
            />
          </View>
        )}

        {room.status === 'IN_PROGRESS' && (
          <View className="bg-white rounded-[14px] border border-border overflow-hidden">
            <Pressable
              onPress={() => setIsMaintenanceExpanded(!isMaintenanceExpanded)}
              className={`flex-row items-center justify-between px-3.5 py-2.5 active:bg-background ${
                isMaintenanceExpanded ? 'border-b border-border-light' : ''
              }`}
            >
              <View className="flex-row items-center gap-2">
                <AlertTriangle size={16} color="#8A8177" />
                <Text className="text-[12px] text-text-secondary font-jost tracking-widest uppercase">
                  {lang === 'RU' ? 'Фиксация неполадок' : 'Report Defect'}
                </Text>
              </View>
              {isMaintenanceExpanded ? <ChevronDown size={16} color="#8A8177" /> : <ChevronRight size={16} color="#8A8177" />}
            </Pressable>

            {isMaintenanceExpanded && (
              <View className="p-3.5 gap-2.5">
                <TextInput
                  multiline
                  value={maintenanceDesc}
                  onChangeText={setMaintenanceDesc}
                  placeholder={lang === 'RU' ? 'Опишите проблему' : 'Describe defect'}
                  placeholderTextColor="#8A8177"
                  className="w-full bg-background border border-border rounded-xl p-2 text-sm text-text-primary font-jost min-h-[40px]"
                />

                <View className="bg-background rounded-xl p-2.5 border border-border gap-2">
                  <Pressable onPress={() => setIsGuestDamage(!isGuestDamage)} className="flex-row items-center justify-between">
                    <View className="flex-row items-center gap-1.5">
                      <AlertTriangle size={13} color={isGuestDamage ? '#B3261E' : '#8A8177'} />
                      <Text className="text-[12px] font-jost-semibold text-text-primary">
                        {lang === 'RU' ? 'Ущерб' : 'Damage'}
                      </Text>
                    </View>
                    <View
                      className={`h-4 w-4 rounded border items-center justify-center ${
                        isGuestDamage ? 'bg-primary border-primary' : 'border-border bg-white'
                      }`}
                    >
                      {isGuestDamage && <Check size={11} color="#fff" />}
                    </View>
                  </Pressable>

                  {isGuestDamage && (
                    <View className="gap-1.5 pt-1 border-t border-border-light">
                      <Text className="text-[11px] font-jost text-text-secondary uppercase">
                        {lang === 'RU' ? 'Тип поломки:' : 'Breakage type:'}
                      </Text>
                      <View className="flex-row flex-wrap gap-1.5">
                        {DAMAGE_TYPES.map((type) => (
                          <Pressable
                            key={type}
                            onPress={() => setGuestDamageType(type)}
                            className={`px-2 py-1 rounded-md ${
                              guestDamageType === type ? 'bg-dark' : 'bg-white border border-border'
                            }`}
                          >
                            <Text className={`text-[12px] font-jost ${guestDamageType === type ? 'text-white font-jost-semibold' : 'text-text-secondary'}`}>
                              {type}
                            </Text>
                          </Pressable>
                        ))}
                      </View>
                    </View>
                  )}
                </View>

                <View className="flex-row items-center justify-between gap-3">
                  <View className="flex-row items-center gap-1">
                    <Camera size={13} color="#8A8177" />
                    <Text className="text-[11px] text-text-secondary font-jost uppercase">
                      {lang === 'RU' ? 'Фотофиксация' : 'Photo fixation'}
                    </Text>
                  </View>
                  {maintenancePhoto ? (
                    <View className="flex-row items-center gap-2">
                      <Pressable onPress={() => setMaintenancePhoto('')}>
                        <Image source={{ uri: maintenancePhoto }} className="h-10 w-16 rounded-lg border border-border" />
                      </Pressable>
                      <Text className="text-[11px] font-jost text-success">✓ {lang === 'RU' ? 'Загружено' : 'Uploaded'}</Text>
                    </View>
                  ) : (
                    <Pressable
                      onPress={() => setMaintenancePhoto(MOCK_DEFECT_PHOTO)}
                      className="px-2.5 py-1 bg-background rounded-lg border border-border"
                    >
                      <Text className="text-[11px] font-jost text-text-secondary">{t.btnUpload}</Text>
                    </Pressable>
                  )}
                </View>

                {!!maintenanceDesc.trim() && (
                  <View className="pt-1 border-t border-border-light items-end">
                    {maintenanceSuccess ? (
                      <Text className="text-[12px] font-jost text-success">
                        ✓ {lang === 'RU' ? 'Заявка отправлена в техслужбу!' : 'Defect ticket sent to engineering!'}
                      </Text>
                    ) : (
                      <Pressable onPress={handleReportMaintenance} className="px-3.5 py-1.5 bg-primary rounded-lg active:bg-primary-hover">
                        <Text className="text-white text-[12px] font-jost-semibold">
                          {lang === 'RU' ? 'Заявить о неполадке' : 'Submit Defect Ticket'}
                        </Text>
                      </Pressable>
                    )}
                  </View>
                )}
              </View>
            )}
          </View>
        )}

        {room.status === 'IN_PROGRESS' && (
          <View className="bg-white rounded-xl border border-border p-3 gap-3.5">
            <Pressable onPress={() => setConfirmStandard(!confirmStandard)} className="flex-row items-start gap-2.5">
              <View
                className={`h-[18px] w-[18px] rounded border items-center justify-center mt-0.5 ${
                  confirmStandard ? 'bg-primary border-primary' : 'border-border bg-white'
                }`}
              >
                {confirmStandard && <Check size={13} color="#fff" />}
              </View>
              <Text className="text-[12px] font-jost text-text-secondary leading-normal flex-1">{t.cleanerConfirm}</Text>
            </Pressable>

            <Pressable
              onPress={handleMarkFinished}
              disabled={!confirmStandard || !allTasksDone}
              className={`w-full py-3 px-4 rounded-xl flex-row items-center justify-center gap-2 ${
                confirmStandard && allTasksDone ? 'bg-primary active:bg-primary-hover' : 'bg-background border border-border'
              }`}
            >
              <Send size={14} color={confirmStandard && allTasksDone ? '#fff' : '#8A8177'} />
              <Text className={`text-sm font-jost ${confirmStandard && allTasksDone ? 'text-white' : 'text-text-secondary'}`}>
                {t.btnComplete}
              </Text>
            </Pressable>
          </View>
        )}

        {(room.status === 'READY' || room.status === 'VERIFIED') && (
          <View className="bg-success-light rounded-xl border border-success/30 p-4 items-center gap-2.5">
            <View className="h-10 w-10 bg-success/20 rounded-full items-center justify-center border border-success/30">
              <ShieldCheck size={24} color="#3D6A50" />
            </View>
            <Text className="text-sm font-jost-semibold text-success-text">✓ {lang === 'RU' ? 'Работа сдана' : 'Clean Submitted'}</Text>
            <Text className="text-[13px] text-success-text text-center leading-normal max-w-xs">{t.roomVerifiedText}</Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}
