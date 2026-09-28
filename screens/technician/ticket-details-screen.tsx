import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, Pressable, ScrollView, Image, Modal, Alert } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { KeyboardAvoidingView } from 'react-native-keyboard-controller';
import * as ImagePicker from 'expo-image-picker';
import { ChevronLeft, Camera, Receipt, X, Plus, Minus, Check, Pause, Share2, ChevronRight, Info } from 'lucide-react-native';
import { MaintenanceCategory, MaintenanceRequest, PartItem } from '@/types';
import { getTranslation } from '@/lib/locales';
import { useApp } from '@/context/app-store';

// ticket.startedAt is an "HH:MM" clock reading with no date (see updateMaintenanceStatus
// in app-store.tsx), so this assumes the ticket was started today.
function elapsedSecondsSince(startTime?: string): number {
  const match = startTime ? /^(\d{1,2}):(\d{2})/.exec(startTime) : null;
  if (!match) return 0;
  const start = new Date();
  start.setHours(Number(match[1]), Number(match[2]), 0, 0);
  let diffSeconds = Math.floor((Date.now() - start.getTime()) / 1000);
  if (diffSeconds < 0) diffSeconds += 24 * 60 * 60;
  return Math.max(0, diffSeconds);
}

function formatTimer(totalSeconds: number) {
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;
  return h > 0
    ? `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
    : `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

interface TicketDetailsScreenProps {
  ticket: MaintenanceRequest | null;
  onBack: () => void;
  // Supervisors can only view tickets (the real account has maintenance.read, not
  // .update) — this hides every editing affordance and just shows the ticket's state.
  readOnly?: boolean;
}

export function TicketDetailsScreen({ ticket, onBack, readOnly = false }: TicketDetailsScreenProps) {
  const { lang, parts, updateMaintenanceStatus, toggleMaintenanceStep, saveRepairCost, addMaintenanceComment, addUsedPart, uploadMaintenancePhoto } = useApp();
  const insets = useSafeAreaInsets();
  const t = getTranslation(lang);
  const [comment, setComment] = useState('');
  const [showAddPart, setShowAddPart] = useState(false);
  const [showDamageModal, setShowDamageModal] = useState(false);
  const [damageComment, setDamageComment] = useState(ticket?.repairComment || '');
  const [damageCost, setDamageCost] = useState(ticket?.repairCost ? String(ticket.repairCost) : '');
  const [partQuantities, setPartQuantities] = useState<Record<string, number>>({});
  const [elapsedSeconds, setElapsedSeconds] = useState(() => elapsedSecondsSince(ticket?.startedAt));

  useEffect(() => {
    setElapsedSeconds(elapsedSecondsSince(ticket?.startedAt));
    if (ticket?.status !== 'IN_PROGRESS') return;
    const interval = setInterval(() => setElapsedSeconds(elapsedSecondsSince(ticket?.startedAt)), 1000);
    return () => clearInterval(interval);
  }, [ticket?.startedAt, ticket?.status]);

  if (!ticket) {
    return (
      <SafeAreaView edges={['top']} className="flex-1 bg-background items-center justify-center">
        <Text className="text-sm font-jost text-text-secondary">
          {lang === 'RU' ? 'Заявка не найдена' : 'Ticket not found'}
        </Text>
      </SafeAreaView>
    );
  }

  const getCategoryLabel = (cat: MaintenanceCategory) => {
    switch (cat) {
      case 'PLUMBING': return t.categoryPlumbing;
      case 'ELECTRICAL': return t.categoryElectrical;
      case 'FURNITURE': return t.categoryFurniture;
      case 'APPLIANCES': return t.categoryAppliances;
      case 'CLEANLINESS': return t.categoryCleanliness;
      default: return t.categoryOther;
    }
  };

  const isBlocked = ticket.blocksCleaning && ticket.status !== 'RESOLVED';

  const pickPhoto = async (stage: 'before' | 'after') => {
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) {
      Alert.alert(
        lang === 'RU' ? 'Нет доступа' : 'Permission required',
        lang === 'RU' ? 'Разрешите доступ к камере в настройках устройства.' : 'Allow camera access in device settings.'
      );
      return;
    }
    const result = await ImagePicker.launchCameraAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, quality: 0.8 });
    if (result.canceled || !result.assets[0]?.uri) return;
    void uploadMaintenancePhoto(ticket.id, result.assets[0].uri, stage);
  };

  const handleSaveComment = () => {
    if (!comment.trim()) return;
    addMaintenanceComment(ticket.id, comment.trim());
    setComment('');
  };

  const handleSubmitParts = () => {
    parts.forEach((part) => {
      const qty = partQuantities[part.id] || 0;
      if (qty > 0) addUsedPart(ticket.id, part, qty);
    });
    setPartQuantities({});
    setShowAddPart(false);
  };

  const handleSaveDamageCost = () => {
    const cost = parseInt(damageCost, 10) || 0;
    saveRepairCost(ticket.id, cost, damageComment.trim());
    setShowDamageModal(false);
  };

  const isActive = ticket.status === 'IN_PROGRESS';
  const isResolved = ticket.status === 'RESOLVED';

  const statusLabel = isResolved
    ? (lang === 'RU' ? 'Обслужен' : 'Serviced')
    : isActive
      ? (lang === 'RU' ? 'В работе' : 'In progress')
      : (lang === 'RU' ? 'Требуется ремонт' : 'Repair needed');
  const statusColor = isResolved ? '#5B8C6E' : isActive ? '#C2410C' : '#D97706';

  const guestDamageSection = ticket.isGuestDamage && (
    <View className="bg-[#FFF8F5] border border-[#FED7AA] rounded-[14px] p-3.5 gap-2">
      <View className="flex-row items-center justify-between">
        <Text className="text-[11px] font-jost-semibold uppercase tracking-wider text-text-primary">
          {lang === 'RU' ? 'Ущерб' : 'Damage'}
        </Text>
        {ticket.costCalculated && ticket.repairCost !== undefined && (
          <Text className="text-xs font-jost-semibold text-[#C2410C] bg-[#FAF0EB] border border-[#F3CDB8] rounded px-2 py-0.5">
            {ticket.repairCost.toLocaleString('ru-RU')} ₸
          </Text>
        )}
      </View>
      <Text className="text-[13px] font-jost text-[#C2410C]">
        {ticket.guestDamageType || (lang === 'RU' ? 'Поломка по вине гостя' : 'Guest damage')}
      </Text>
      {!!ticket.repairComment && (
        <Text className="text-[12px] font-jost text-text-primary">{ticket.repairComment}</Text>
      )}
      {!readOnly && (
        <Pressable
          onPress={() => {
            setDamageComment(ticket.repairComment || '');
            setDamageCost(ticket.repairCost ? String(ticket.repairCost) : '');
            setShowDamageModal(true);
          }}
          className="flex-row items-center justify-center gap-1.5 bg-[#FAF0EB] border border-[#F3CDB8] rounded-xl py-2 mt-1"
        >
          <Receipt size={14} color="#C2410C" />
          <Text className="text-[12px] font-jost-semibold text-[#C2410C]">
            {ticket.costCalculated
              ? (lang === 'RU' ? 'Изменить расчёт суммы ремонта' : 'Edit repair cost')
              : (lang === 'RU' ? 'Рассчитать сумму ремонта' : 'Calculate repair cost')}
          </Text>
        </Pressable>
      )}
    </View>
  );

  const locationLine = [ticket.roomCategory || (lang === 'RU' ? 'Номер отеля' : 'Hotel room'), ticket.floor !== undefined ? `${ticket.floor} ${lang === 'RU' ? 'этаж' : 'floor'}` : null]
    .filter(Boolean)
    .join(' · ');

  // Not-yet-started or already-resolved tickets get a plain info-card view; only an
  // IN_PROGRESS ticket gets the rich dark-hero workflow view below (matches production).
  if (!isActive) {
    return (
      <SafeAreaView edges={['top']} className="flex-1 bg-background">
        <View className="px-5 pt-2 pb-1">
          <Pressable onPress={onBack} className="h-9 w-9 rounded-full bg-white border border-border items-center justify-center">
            <ChevronLeft size={16} color="#241E1A" />
          </Pressable>
        </View>
        <ScrollView className="flex-1 px-5" contentContainerStyle={{ paddingTop: 12, paddingBottom: 20, gap: 16 }}>
          <View className="gap-1">
            <View className="flex-row items-center gap-2">
              <Text className="text-3xl font-spectral text-text-primary">№ {ticket.roomNumber || '—'}</Text>
              {isBlocked && (
                <View className="bg-[#FAF0EF] rounded-md px-2.5 py-0.5">
                  <Text className="text-[10px] font-jost-semibold text-[#B3261E] uppercase tracking-wider">
                    {lang === 'RU' ? 'БЛОКИРУЕТ' : 'BLOCKING'}
                  </Text>
                </View>
              )}
            </View>
            {!!locationLine && <Text className="text-sm font-jost text-text-secondary">{locationLine}</Text>}
          </View>

          <View className="gap-2">
            <Text className="text-[12px] text-text-secondary font-jost tracking-widest uppercase px-1">
              {lang === 'RU' ? 'ИНФОРМАЦИЯ' : 'INFORMATION'}
            </Text>
            <View className="bg-white rounded-[14px] border border-border overflow-hidden">
              <View className="p-3.5 flex-row items-center justify-between">
                <Text className="text-sm font-jost text-text-secondary">{lang === 'RU' ? 'Категория' : 'Category'}</Text>
                <Text className="text-sm font-jost-semibold text-text-primary">{getCategoryLabel(ticket.category)}</Text>
              </View>
              <View className="p-3.5 flex-row items-center justify-between border-t border-border-light">
                <Text className="text-sm font-jost text-text-secondary">{lang === 'RU' ? 'Статус' : 'Status'}</Text>
                <View className="flex-row items-center gap-1.5">
                  <View className="h-2 w-2 rounded-full" style={{ backgroundColor: statusColor }} />
                  <Text className="text-sm font-jost-semibold text-text-primary">{statusLabel}</Text>
                </View>
              </View>
              {!isResolved && (
                <View className="p-3.5 flex-row items-center justify-between border-t border-border-light">
                  <Text className="text-sm font-jost text-text-secondary">{lang === 'RU' ? 'Приоритет' : 'Priority'}</Text>
                  <Text className="text-sm font-jost-semibold text-text-primary">
                    {ticket.priority === 'CRITICAL' || ticket.priority === 'HIGH'
                      ? (lang === 'RU' ? 'Высокий' : 'High')
                      : (lang === 'RU' ? 'Стандартный' : 'Standard')}
                  </Text>
                </View>
              )}
            </View>
          </View>

          <View className="gap-2">
            <Text className="text-[12px] text-text-secondary font-jost tracking-widest uppercase px-1">
              {lang === 'RU' ? 'ОПИСАНИЕ РАБОТ' : 'WORK DESCRIPTION'}
            </Text>
            <View className="bg-white rounded-[14px] border border-border p-3.5">
              <Text className="text-sm font-jost text-text-primary leading-normal">
                {lang === 'RU' ? ticket.descriptionRu || ticket.description : ticket.descriptionEn || ticket.description}
              </Text>
            </View>
          </View>

          {guestDamageSection}

          {(ticket.materials || []).length > 0 && (
            <View className="gap-2">
              <Text className="text-[12px] text-text-secondary font-jost tracking-widest uppercase px-1">
                {lang === 'RU' ? 'ИСПОЛЬЗОВАННЫЕ МАТЕРИАЛЫ' : 'MATERIALS USED'}
              </Text>
              <View className="bg-white rounded-[14px] border border-border p-3.5 gap-1.5">
                {ticket.materials!.map((m) => (
                  <Text key={m.id} className="text-sm font-jost text-text-primary">
                    {lang === 'RU' ? m.nameRu : m.nameEn} · {m.qty} {lang === 'RU' ? 'шт.' : 'pcs'}
                  </Text>
                ))}
              </View>
            </View>
          )}
        </ScrollView>

        {!readOnly && (
          <View
            className="p-5 border-t border-border bg-background flex-row gap-2.5"
            style={{ paddingBottom: insets.bottom + 20 }}
          >
            {isResolved ? (
              <Pressable onPress={onBack} className="flex-1 bg-dark py-3.5 rounded-xl items-center">
                <Text className="text-white text-sm font-jost-semibold">{lang === 'RU' ? 'Закрыть' : 'Close'}</Text>
              </Pressable>
            ) : (
              <>
                <Pressable
                  onPress={() => updateMaintenanceStatus(ticket.id, 'IN_PROGRESS')}
                  className="flex-1 bg-dark py-3.5 rounded-xl items-center"
                >
                  <Text className="text-white text-sm font-jost-semibold">{lang === 'RU' ? 'Взять в работу' : 'Start work'}</Text>
                </Pressable>
                <Pressable
                  onPress={() => {
                    updateMaintenanceStatus(ticket.id, 'RESOLVED');
                    onBack();
                  }}
                  className="flex-1 bg-success py-3.5 rounded-xl items-center flex-row justify-center gap-1.5"
                >
                  <Check size={15} color="#fff" />
                  <Text className="text-white text-sm font-jost-semibold">{lang === 'RU' ? 'Выполнено' : 'Done'}</Text>
                </Pressable>
              </>
            )}
          </View>
        )}

        <DamageCostModal
          visible={showDamageModal}
          lang={lang}
          ticket={ticket}
          damageComment={damageComment}
          damageCost={damageCost}
          onChangeComment={setDamageComment}
          onChangeCost={setDamageCost}
          onClose={() => setShowDamageModal(false)}
          onSave={handleSaveDamageCost}
        />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView edges={['top']} className="flex-1 bg-dark">
      <View className="bg-dark px-5 pt-2 pb-5 gap-3">
        <View className="flex-row items-center justify-between">
          <Pressable onPress={onBack} className="flex-row items-center gap-1.5">
            <ChevronLeft size={16} color="#8A8177" />
            <Text className="text-xs font-jost text-text-secondary">{lang === 'RU' ? 'Заявки' : 'Tickets'}</Text>
          </Pressable>
          {isBlocked && (
            <View className="bg-[#FAF0EF] rounded-md px-2.5 py-0.5">
              <Text className="text-[10px] font-jost-semibold text-[#B3261E] uppercase tracking-wider">
                {lang === 'RU' ? 'БЛОКИРУЕТ' : 'BLOCKING'}
              </Text>
            </View>
          )}
        </View>
        <View className="flex-row items-end justify-between">
          <View>
            <Text className="text-3xl font-jost-semibold text-white">№ {ticket.roomNumber || '—'}</Text>
            <Text className="text-xs font-jost text-text-secondary mt-1.5">
              {getCategoryLabel(ticket.category)}
            </Text>
          </View>
          <View className="items-end">
            <Text className="text-3xl font-jost-semibold text-[#E4762B] tracking-tight">
              {formatTimer(elapsedSeconds)}
            </Text>
            <Text className="text-xs font-jost text-text-secondary mt-0.5">{lang === 'RU' ? 'в работе' : 'in work'}</Text>
          </View>
        </View>
      </View>

      <KeyboardAvoidingView className="flex-1 bg-background" behavior="padding">
      <ScrollView className="flex-1 px-5" contentContainerStyle={{ paddingTop: 16, paddingBottom: 20, gap: 16 }} keyboardShouldPersistTaps="handled">
        <View className="bg-[#FAF6EE] border border-[#EFE5D8] rounded-[14px] p-3.5 flex-row items-start gap-2.5">
          <Info size={15} color="#8A8177" style={{ marginTop: 1 }} />
          <Text className="text-sm font-jost text-text-primary leading-normal flex-1">
            {lang === 'RU' ? ticket.descriptionRu || ticket.description : ticket.descriptionEn || ticket.description}
          </Text>
        </View>

        {ticket.steps && (
          <View className="gap-2">
            <View className="flex-row items-center justify-between px-1">
              <Text className="text-[12px] text-text-secondary font-jost tracking-widest uppercase">
                {lang === 'RU' ? 'ХОД РАБОТ' : 'WORKFLOW'}
              </Text>
              <Text className="text-xs font-jost text-text-secondary">
                {ticket.steps.filter((s) => s.done).length} {lang === 'RU' ? 'из' : 'of'} {ticket.steps.length}
              </Text>
            </View>
            <View className="bg-white rounded-[14px] border border-border overflow-hidden">
              {ticket.steps.map((step, i) => (
                <Pressable
                  key={step.id}
                  disabled={readOnly}
                  onPress={() => toggleMaintenanceStep(ticket.id, step.id)}
                  className={`p-3.5 flex-row items-center gap-3 active:bg-background ${i > 0 ? 'border-t border-border-light' : ''}`}
                >
                  <View className={`h-5 w-5 rounded-md items-center justify-center shrink-0 ${step.done ? 'bg-success' : 'border border-border bg-white'}`}>
                    {step.done && <Check size={13} color="#fff" />}
                  </View>
                  <Text className={`text-sm font-jost flex-1 ${step.done ? 'line-through text-text-secondary' : 'text-text-primary'}`}>
                    {lang === 'RU' ? step.textRu : step.textEn}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>
        )}

        {guestDamageSection}

        {(!readOnly || (ticket.materials || []).length > 0) && (
          <View className="gap-2">
            <Text className="text-[12px] text-text-secondary font-jost tracking-widest uppercase px-1">
              {lang === 'RU' ? 'ИСПОЛЬЗОВАННЫЕ ЗАПЧАСТИ' : 'USED PARTS'}
            </Text>
            <View className="bg-white rounded-[14px] border border-border overflow-hidden">
              {(ticket.materials || []).map((m, i) => (
                <View key={m.id} className={`p-3.5 flex-row items-center justify-between ${i > 0 ? 'border-t border-border-light' : ''}`}>
                  <Text className="text-sm font-jost text-text-primary">{lang === 'RU' ? m.nameRu : m.nameEn}</Text>
                  <Text className="text-sm font-jost text-text-secondary">× {m.qty}</Text>
                </View>
              ))}
              {!readOnly && (
                <Pressable
                  onPress={() => setShowAddPart(true)}
                  className={`p-3.5 flex-row items-center gap-1.5 ${(ticket.materials || []).length > 0 ? 'border-t border-border-light' : ''}`}
                >
                  <Plus size={14} color="#C2410C" />
                  <Text className="text-[13px] font-jost text-[#C2410C]">{lang === 'RU' ? 'Добавить запчасть' : 'Add spare part'}</Text>
                </Pressable>
              )}
            </View>
          </View>
        )}

        {(!readOnly || ticket.photosBefore?.length || ticket.photosAfter?.length) && (
          <View className="gap-2">
            <Text className="text-[12px] text-text-secondary font-jost tracking-widest uppercase px-1">
              {lang === 'RU' ? 'ФОТООТЧЁТ' : 'PHOTO REPORT'}
            </Text>
            <View className="flex-row gap-3">
              {(['before', 'after'] as const).map((stage) => {
                const photos = stage === 'before' ? ticket.photosBefore : ticket.photosAfter;
                const uri = photos?.[photos.length - 1];
                if (readOnly && !uri) return null;
                const Wrapper = readOnly ? View : Pressable;
                return (
                  <Wrapper
                    key={stage}
                    {...(!readOnly ? { onPress: () => pickPhoto(stage) } : {})}
                    className="flex-1 aspect-square border border-dashed border-border rounded-2xl items-center justify-center bg-white overflow-hidden"
                  >
                    {uri ? (
                      <Image source={{ uri }} className="w-full h-full" />
                    ) : (
                      <View className="items-center gap-1.5">
                        <Camera size={18} color="#8A8177" />
                        <Text className="text-xs font-jost text-text-secondary">
                          {stage === 'before'
                            ? (lang === 'RU' ? 'До ремонта' : 'Before repair')
                            : (lang === 'RU' ? 'После ремонта' : 'After repair')}
                        </Text>
                      </View>
                    )}
                  </Wrapper>
                );
              })}
            </View>
          </View>
        )}

        {(!readOnly || (ticket.comments || []).length > 0) && (
          <View className="gap-2">
            <Text className="text-[12px] text-text-secondary font-jost tracking-widest uppercase px-1">
              {lang === 'RU' ? 'КОММЕНТАРИЙ' : 'COMMENT'}
            </Text>
            <View className="bg-white rounded-[14px] border border-border p-3 gap-2">
              {(ticket.comments || []).map((c, i) => (
                <Text key={i} className="text-[13px] font-jost text-text-primary">{c}</Text>
              ))}
              {!readOnly && (
                <View className="flex-row gap-2 items-center">
                  <TextInput
                    value={comment}
                    onChangeText={setComment}
                    placeholder={lang === 'RU' ? 'Что сделано / что проверить позже' : 'What was done / check later'}
                    placeholderTextColor="#8A8177"
                    className="flex-1 bg-background border border-border rounded-xl px-3 py-2 text-sm text-text-primary font-jost"
                  />
                  <Pressable onPress={handleSaveComment} className="bg-dark px-3.5 py-2 rounded-xl">
                    <Text className="text-white text-xs font-jost-semibold">{lang === 'RU' ? 'Добавить' : 'Add'}</Text>
                  </Pressable>
                </View>
              )}
            </View>
          </View>
        )}

        {!readOnly && isActive && (
          <View className="gap-2">
            <Text className="text-[12px] text-text-secondary font-jost tracking-widest uppercase px-1">
              {lang === 'RU' ? 'ЕЩЁ' : 'MORE'}
            </Text>
            <View className="bg-white rounded-[14px] border border-border overflow-hidden">
              <Pressable
                onPress={() =>
                  Alert.alert(
                    lang === 'RU' ? 'Приостановлено' : 'Paused',
                    lang === 'RU' ? 'Отметка «нужна запчасть» пока недоступна в демо-режиме.' : 'This flag is not wired up yet in demo mode.'
                  )
                }
                className="p-3.5 flex-row items-center justify-between active:bg-background"
              >
                <View className="flex-row items-center gap-3">
                  <Pause size={16} color="#8A8177" />
                  <Text className="text-sm font-jost text-text-primary">{lang === 'RU' ? 'Приостановить · нужна запчасть' : 'Pause · need spare parts'}</Text>
                </View>
                <ChevronRight size={16} color="#8A8177" />
              </Pressable>
              <Pressable
                onPress={() =>
                  Alert.alert(
                    lang === 'RU' ? 'Недоступно' : 'Not available',
                    lang === 'RU' ? 'Передача заявки другому технику пока недоступна в демо-режиме.' : 'Transferring tickets is not wired up yet in demo mode.'
                  )
                }
                className="p-3.5 flex-row items-center justify-between border-t border-border-light active:bg-background"
              >
                <View className="flex-row items-center gap-3">
                  <Share2 size={16} color="#8A8177" />
                  <Text className="text-sm font-jost text-text-primary">{lang === 'RU' ? 'Передать другому технику' : 'Transfer to another technician'}</Text>
                </View>
                <ChevronRight size={16} color="#8A8177" />
              </Pressable>
            </View>
          </View>
        )}
      </ScrollView>
      </KeyboardAvoidingView>

      {!readOnly && (
      <View
        className="p-5 border-t border-border bg-background flex-row gap-2.5"
        style={{ paddingBottom: insets.bottom + 20 }}
      >
        <Pressable
          onPress={() => {
            updateMaintenanceStatus(ticket.id, 'RESOLVED');
            onBack();
          }}
          className="flex-1 bg-primary py-3.5 rounded-xl items-center active:bg-primary-hover"
        >
          <Text className="text-white text-sm font-jost-semibold">
            {isBlocked ? (lang === 'RU' ? 'Завершить и снять блокировку' : 'Complete and unblock') : (lang === 'RU' ? 'Завершить работу' : 'Complete')}
          </Text>
        </Pressable>
      </View>
      )}

      <AddPartModal
        visible={showAddPart}
        lang={lang}
        parts={parts}
        quantities={partQuantities}
        onChangeQty={(partId, diff) => setPartQuantities((prev) => ({ ...prev, [partId]: Math.max(0, (prev[partId] || 0) + diff) }))}
        onClose={() => {
          setPartQuantities({});
          setShowAddPart(false);
        }}
        onSubmit={handleSubmitParts}
      />

      <DamageCostModal
        visible={showDamageModal}
        lang={lang}
        ticket={ticket}
        damageComment={damageComment}
        damageCost={damageCost}
        onChangeComment={setDamageComment}
        onChangeCost={setDamageCost}
        onClose={() => setShowDamageModal(false)}
        onSave={handleSaveDamageCost}
      />
    </SafeAreaView>
  );
}

interface DamageCostModalProps {
  visible: boolean;
  lang: 'RU' | 'EN';
  ticket: MaintenanceRequest;
  damageComment: string;
  damageCost: string;
  onChangeComment: (v: string) => void;
  onChangeCost: (v: string) => void;
  onClose: () => void;
  onSave: () => void;
}

function DamageCostModal({ visible, lang, ticket, damageComment, damageCost, onChangeComment, onChangeCost, onClose, onSave }: DamageCostModalProps) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <KeyboardAvoidingView className="flex-1 items-center justify-center bg-dark/60 p-3.5" behavior="padding">
        <View className="bg-white rounded-[20px] border border-border w-full max-w-sm gap-3.5 p-5">
          <View className="flex-row items-center justify-between border-b border-border-light pb-2">
            <View className="flex-1 pr-2">
              <Text className="text-base font-jost-semibold text-text-primary">{lang === 'RU' ? 'Расчёт суммы ремонта' : 'Repair cost'}</Text>
              <Text className="text-xs font-jost text-text-secondary mt-0.5">№ {ticket.roomNumber} · {ticket.guestDamageType || (lang === 'RU' ? 'Поломка гостем' : 'Guest damage')}</Text>
            </View>
            <Pressable onPress={onClose} className="h-8 w-8 rounded-full bg-background items-center justify-center border border-border-light active:bg-border-light">
              <X size={16} color="#241E1A" />
            </Pressable>
          </View>

          <View className="gap-1">
            <Text className="text-[11px] font-jost uppercase text-text-secondary">
              {lang === 'RU' ? 'Что и как отремонтировано' : 'What was repaired & how'}
            </Text>
            <TextInput
              value={damageComment}
              onChangeText={onChangeComment}
              multiline
              placeholder={lang === 'RU' ? 'Например: заменён нагревательный элемент...' : 'e.g. replaced heating element...'}
              placeholderTextColor="#8A8177"
              className="bg-background border border-border rounded-xl p-3 text-sm text-text-primary font-jost min-h-[70px]"
            />
          </View>

          <View className="gap-1">
            <Text className="text-[11px] font-jost uppercase text-text-secondary">
              {lang === 'RU' ? 'Сумма ремонта (₸)' : 'Repair cost (₸)'}
            </Text>
            <TextInput
              value={damageCost}
              onChangeText={onChangeCost}
              keyboardType="numeric"
              placeholder="0 ₸"
              placeholderTextColor="#8A8177"
              className="bg-background border border-border rounded-xl p-3 text-sm text-text-primary font-jost"
            />
          </View>

          <View className="flex-row gap-2.5">
            <Pressable onPress={onClose} className="flex-1 py-2.5 bg-background rounded-xl border border-border-light items-center active:bg-border-light">
              <Text className="text-primary text-sm font-jost-semibold">{lang === 'RU' ? 'Отмена' : 'Cancel'}</Text>
            </Pressable>
            <Pressable onPress={onSave} className="flex-1 py-2.5 bg-primary rounded-xl items-center active:bg-primary-hover">
              <Text className="text-white text-sm font-jost-semibold">{lang === 'RU' ? 'Сохранить' : 'Save'}</Text>
            </Pressable>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

interface AddPartModalProps {
  visible: boolean;
  lang: 'RU' | 'EN';
  parts: PartItem[];
  quantities: Record<string, number>;
  onChangeQty: (partId: string, diff: number) => void;
  onClose: () => void;
  onSubmit: () => void;
}

function AddPartModal({ visible, lang, parts, quantities, onChangeQty, onClose, onSubmit }: AddPartModalProps) {
  const total = Object.values(quantities).reduce((acc, q) => acc + q, 0);
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View className="flex-1 items-center justify-center bg-dark/60 p-3.5">
        <View className="bg-white rounded-[20px] border border-border w-full max-w-sm max-h-[85%]">
          <ScrollView contentContainerStyle={{ padding: 20, gap: 16 }} keyboardShouldPersistTaps="handled">
            <View className="flex-row justify-between items-center border-b border-border-light pb-2">
              <Text className="text-base font-jost-semibold text-text-primary flex-1 pr-2">
                {lang === 'RU' ? 'Добавить запчасть' : 'Add spare part'}
              </Text>
              <Pressable onPress={onClose} className="h-8 w-8 rounded-full bg-background items-center justify-center border border-border-light active:bg-border-light">
                <X size={16} color="#241E1A" />
              </Pressable>
            </View>

            <View className="gap-2.5">
              {parts.length === 0 ? (
                <Text className="text-sm font-jost text-text-secondary py-4 text-center">
                  {lang === 'RU' ? 'Склад пуст' : 'Warehouse is empty'}
                </Text>
              ) : (
                parts.map((part) => {
                  const qty = quantities[part.id] || 0;
                  return (
                    <View key={part.id} className="bg-background p-2.5 rounded-xl border border-border-light gap-1.5">
                      <View className="flex-row items-center justify-between">
                        <View className="flex-1 pr-2">
                          <Text className="text-text-primary font-jost-semibold text-sm" numberOfLines={1}>
                            {lang === 'RU' ? part.nameRu : part.nameEn}
                          </Text>
                          <Text className="text-[11px] font-jost text-text-secondary mt-0.5">
                            {part.code} · {part.currentStock} {lang === 'RU' ? 'в наличии' : 'in stock'}
                          </Text>
                        </View>
                        <View className="flex-row items-center gap-2.5">
                          <Pressable
                            disabled={qty <= 0}
                            onPress={() => onChangeQty(part.id, -1)}
                            className="h-6 w-6 rounded-lg bg-white border border-border items-center justify-center active:bg-background disabled:opacity-40"
                          >
                            <Minus size={12} color="#475569" />
                          </Pressable>
                          <Text className="w-5 text-center font-jost-semibold text-text-primary">{qty}</Text>
                          <Pressable
                            onPress={() => onChangeQty(part.id, 1)}
                            className="h-6 w-6 rounded-lg bg-white border border-border items-center justify-center active:bg-background"
                          >
                            <Plus size={12} color="#475569" />
                          </Pressable>
                        </View>
                      </View>
                    </View>
                  );
                })
              )}
            </View>

            <View className="flex-row gap-2.5">
              <Pressable onPress={onClose} className="flex-1 py-2.5 bg-background rounded-xl border border-border-light items-center active:bg-border-light">
                <Text className="text-primary text-sm font-jost-semibold">{lang === 'RU' ? 'Отмена' : 'Cancel'}</Text>
              </Pressable>
              <Pressable
                disabled={total === 0}
                onPress={onSubmit}
                className={`flex-1 py-2.5 rounded-xl items-center ${total === 0 ? 'bg-primary/40' : 'bg-primary active:bg-primary-hover'}`}
              >
                <Text className="text-white text-sm font-jost-semibold">{lang === 'RU' ? 'Добавить' : 'Add'}</Text>
              </Pressable>
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}
