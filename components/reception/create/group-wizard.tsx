import React, { useCallback, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Alert, KeyboardAvoidingView, Platform, Pressable, ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ChevronLeft, ChevronRight, List, Plus, User, X } from 'lucide-react-native';
import { useApp } from '@/context/app-store';
import {
  MEAL_PLANS,
  useReception,
  type CatalogItem,
  type CreateGroupBookingInput,
  type GuestInput,
} from '@/context/reception-store';
import { type BookingPrefill, addDaysIso, bookingErrorText, diffDays, dotsToIso, guestsText, isoToDots, nightsText, type Lang } from '@/components/reception/booking-utils';
import { IconInput, PickerField, SectionTitle, TextField, digitsOnly, money, type PickerOption } from './group-ui';
import {
  EMPTY_GUEST,
  GroupRoomingList,
  GroupRoomsStep,
  guestKey,
  isRoomListFilled,
  roomGuests,
  roomingGuestCount,
  roomsWord,
  type GrpRoom,
  type RoomStats,
  type RoomingGuest,
} from './group-rooms-step';

// «Групповая бронь» — 5-step wizard of the reception role (web design: ReceptionScreens.tsx →
// createBookingType === 'GROUP'). Rooms come from the server's group allocation, the final
// price is computed by the server; the totals shown here are an estimate from nightly rates.

const NEW_COMPANY = '__new__';
const TIME_RE = /^([01]\d|2[0-3]):[0-5]\d$/;

const todayIso = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

let keySeq = 0;
const nextKey = () => `grp-${Date.now()}-${keySeq++}`;

export function GroupBookingWizard({
  onCancel,
  onCreated,
  prefill,
  insideTabs,
}: {
  onCancel: () => void;
  onCreated: () => void;
  prefill?: BookingPrefill | null;
  insideTabs?: boolean; // the tab bar below already covers the bottom safe area
}) {
  const { lang } = useApp();
  const ru = lang === 'RU';
  const insets = useSafeAreaInsets();
  const { rooms: allRooms, services, companies, paymentAccounts, suggestGroupRooms, availableRoomIds, createGroupBooking } = useReception();

  const [step, setStep] = useState(1);
  const [maxStep, setMaxStep] = useState(1);
  const [showRooming, setShowRooming] = useState(false);
  const scrollRef = useRef<ScrollView>(null);

  // Step 1: Компания и даты
  const [checkInText, setCheckInText] = useState(() => isoToDots(prefill?.checkIn ?? todayIso()));
  const [checkInTime, setCheckInTime] = useState('14:00');
  const [checkOutText, setCheckOutText] = useState(() => isoToDots(prefill?.checkOut ?? addDaysIso(todayIso(), 1)));
  // Check-in / check-out are picked together in one calendar.
  const stayRange = {
    start: checkInText,
    end: checkOutText,
    onChange: (start: string, end: string) => {
      setCheckInText(start);
      setCheckOutText(end);
    },
  };
  const [checkOutTime, setCheckOutTime] = useState('12:00');
  const [companyId, setCompanyId] = useState(NEW_COMPANY);
  const [companyName, setCompanyName] = useState('');
  const [totalGuests, setTotalGuests] = useState('2');
  const [roomsNeeded, setRoomsNeeded] = useState('1');
  const [agentDiscount, setAgentDiscount] = useState('10');
  const [step1Tried, setStep1Tried] = useState(false);

  // Step 2: Номера
  const [rooms, setRooms] = useState<GrpRoom[]>([]);
  const [freeIds, setFreeIds] = useState<string[] | null>(null);
  const [picking, setPicking] = useState(false);
  const [pickedFor, setPickedFor] = useState('');
  const [roomingGuests, setRoomingGuests] = useState<Record<string, RoomingGuest>>({});

  // Step 3: Контакты
  const [contactLast, setContactLast] = useState('');
  const [contactFirst, setContactFirst] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [step3Tried, setStep3Tried] = useState(false);

  // Step 4: Пожелания и услуги
  const [mealPlan, setMealPlan] = useState('Half board');
  const [notes, setNotes] = useState('');
  const [chosenServices, setChosenServices] = useState<CatalogItem[]>([]);
  const [showServicePicker, setShowServicePicker] = useState(false);

  // Step 5: Оплата
  const [customSum, setCustomSum] = useState<string | null>(null);
  const [prepayment, setPrepayment] = useState('0');
  const [accountId, setAccountId] = useState('');
  const [isPaid, setIsPaid] = useState(false);
  const [saving, setSaving] = useState(false);

  // ---------- derived ----------

  const checkInIso = dotsToIso(checkInText);
  const checkOutIso = dotsToIso(checkOutText);
  const datesOk = !!checkInIso && !!checkOutIso && checkOutIso > checkInIso;
  const nights = datesOk ? diffDays(checkInIso!, checkOutIso!) : 1;
  const target = Math.max(1, parseInt(totalGuests, 10) || 1);
  const roomsNeededNum = Math.max(1, parseInt(roomsNeeded, 10) || 1);
  const pickKey = `${checkInIso}|${checkOutIso}|${target}|${roomsNeededNum}`;
  const company = companies.find((c) => c.id === companyId);
  const effectiveAccountId = accountId || paymentAccounts[0]?.id || '';

  const roomById = useMemo(() => new Map(allRooms.map((r) => [r.id, r])), [allRooms]);

  const stats: RoomStats = useMemo(() => {
    const distributed = rooms.reduce((s, r) => s + roomGuests(r), 0);
    const totalCapacity = rooms.reduce((s, r) => s + (roomById.get(r.roomId)?.capacity ?? 0), 0);
    let overflowRoom: RoomStats['overflowRoom'] = null;
    for (const r of rooms) {
      const room = roomById.get(r.roomId);
      const capacity = room?.capacity ?? 0;
      if (roomGuests(r) > capacity) {
        overflowRoom = { number: room?.number ?? '—', guests: roomGuests(r), capacity };
        break;
      }
    }
    const guestsUnplaced = target - distributed;
    return {
      target,
      distributed,
      totalCapacity,
      guestsUnplaced,
      overflowRoom,
      hasCapacityMismatch: rooms.length > 0 && (totalCapacity < target || !!overflowRoom || guestsUnplaced !== 0),
    };
  }, [rooms, roomById, target]);

  const usedIds = useMemo(() => new Set(rooms.map((r) => r.roomId)), [rooms]);
  const freeSet = useMemo(() => (freeIds ? new Set(freeIds) : null), [freeIds]);
  const addableRooms = useMemo(
    () => allRooms.filter((r) => r.isOperational !== false && !usedIds.has(r.id) && (!freeSet || freeSet.has(r.id))),
    [allRooms, usedIds, freeSet],
  );

  const roomOptions = useCallback(
    (current: GrpRoom): PickerOption[] =>
      allRooms
        .filter((r) => r.id === current.roomId || (r.isOperational !== false && !usedIds.has(r.id) && (!freeSet || freeSet.has(r.id))))
        .map((r) => ({
          value: r.id,
          label: `№ ${r.number}${r.category ? ` · ${r.category}` : ''} · ${guestsText(r.capacity, lang)}`,
          hint: money(r.pricePerNight) + (ru ? ' / ночь' : ' / night'),
        })),
    [allRooms, usedIds, freeSet, lang, ru],
  );

  const filledCount = rooms.filter((r) => isRoomListFilled(r, roomingGuests)).length;

  const perNightAll = rooms.reduce((s, r) => s + (roomById.get(r.roomId)?.pricePerNight ?? 0), 0);
  const grossRooms = nights * perNightAll;
  const discountPct = company ? Math.min(100, Math.max(0, parseFloat(agentDiscount.replace(',', '.')) || 0)) : 0;
  const discountAmount = Math.round(grossRooms * (discountPct / 100));
  const servicesSum = chosenServices.reduce((s, x) => s + x.price, 0);
  const calculatedTotal = grossRooms - discountAmount + servicesSum;
  const customNum = customSum !== null && customSum.trim() !== '' ? parseInt(customSum, 10) : NaN;
  const effectiveTotal = Number.isFinite(customNum) ? Math.max(0, customNum) : calculatedTotal;
  const prepaymentNum = Math.max(0, parseInt(prepayment, 10) || 0);
  const paidNow = isPaid ? effectiveTotal : prepaymentNum;
  const remaining = isPaid ? 0 : Math.max(0, effectiveTotal - prepaymentNum);
  const fullyPaid = isPaid || (remaining === 0 && effectiveTotal > 0);

  const stepTitles: Record<number, string> = ru
    ? { 1: 'Компания и даты', 2: 'Номера', 3: 'Контакты', 4: 'Пожелания', 5: 'Оплата' }
    : { 1: 'Company & dates', 2: 'Rooms', 3: 'Contacts', 4: 'Requests', 5: 'Payment' };

  // ---------- rooms ----------

  const pickRooms = useCallback(async () => {
    if (!checkInIso || !checkOutIso) return false;
    setPicking(true);
    try {
      const [suggested, free] = await Promise.all([
        suggestGroupRooms(checkInIso, checkOutIso, target, roomsNeededNum),
        availableRoomIds(checkInIso, checkOutIso).catch(() => null),
      ]);
      setFreeIds(free);
      setPickedFor(pickKey);
      const next: GrpRoom[] = suggested
        .filter((s) => s.roomId)
        .map((s) => ({ key: nextKey(), roomId: s.roomId, adults: String(Math.max(1, s.guestsCount)), children: '0' }));
      setRooms(next);
      setRoomingGuests({});
      if (next.length > 0) setRoomsNeeded(String(next.length));
      if (next.length === 0) {
        Alert.alert(
          ru ? 'Номера не найдены' : 'No rooms found',
          ru ? 'На эти даты нет подходящих свободных номеров. Добавьте номер вручную или измените даты.' : 'No suitable free rooms for these dates. Add a room manually or change the dates.',
        );
      }
      return true;
    } catch (error) {
      Alert.alert(ru ? 'Ошибка подбора' : 'Allocation error', error instanceof Error ? error.message : String(error));
      return false;
    } finally {
      setPicking(false);
    }
  }, [checkInIso, checkOutIso, target, roomsNeededNum, pickKey, suggestGroupRooms, availableRoomIds, ru]);

  const addRoom = () => {
    const candidate = addableRooms[0];
    if (!candidate) {
      Alert.alert(ru ? 'Нет свободных номеров' : 'No free rooms', ru ? 'На эти даты свободных номеров больше нет.' : 'There are no more free rooms for these dates.');
      return;
    }
    setRooms((prev) => {
      // Like the design: trim overfilled rooms to capacity, the excess goes to the new room.
      const rebalanced = prev.map((r) => {
        const cap = roomById.get(r.roomId)?.capacity ?? 1;
        if (roomGuests(r) <= cap) return r;
        const children = Math.min(parseInt(r.children, 10) || 0, cap - 1);
        return { ...r, adults: String(cap - children), children: String(children) };
      });
      const placed = rebalanced.reduce((s, r) => s + roomGuests(r), 0);
      const unplaced = target - placed;
      const adults = Math.min(candidate.capacity, Math.max(1, unplaced));
      return [...rebalanced, { key: nextKey(), roomId: candidate.id, adults: String(adults), children: '0' }];
    });
  };

  const removeRoom = (key: string) => {
    setRooms((prev) => prev.filter((r) => r.key !== key));
    setRoomingGuests((prev) => {
      const next: Record<string, RoomingGuest> = {};
      for (const [k, v] of Object.entries(prev)) if (!k.startsWith(`${key}-`)) next[k] = v;
      return next;
    });
  };

  const changeRoom = (key: string, patch: Partial<GrpRoom>) =>
    setRooms((prev) => prev.map((r) => (r.key === key ? { ...r, ...patch } : r)));

  const changeGuest = (key: string, field: keyof RoomingGuest, value: string) =>
    setRoomingGuests((prev) => ({ ...prev, [key]: { ...(prev[key] ?? EMPTY_GUEST), [field]: value } }));

  // ---------- validation & navigation ----------

  const step1Problem = (): string | null => {
    if (!checkInIso || !checkOutIso) return ru ? 'Введите даты в формате ДД.ММ.ГГГГ' : 'Enter dates as DD.MM.YYYY';
    if (checkOutIso <= checkInIso) return ru ? 'Дата выезда должна быть позже даты заезда' : 'Check-out must be after check-in';
    if (!TIME_RE.test(checkInTime) || !TIME_RE.test(checkOutTime)) return ru ? 'Введите время в формате ЧЧ:ММ' : 'Enter time as HH:MM';
    if (!(companyName.trim() || company?.name)) return ru ? 'Укажите название компании или группы' : 'Enter the company or group name';
    if (!(parseInt(totalGuests, 10) >= 1)) return ru ? 'Укажите число гостей' : 'Enter the number of guests';
    return null;
  };

  const roomingProblem = (): string | null => {
    for (const r of rooms) {
      const number = roomById.get(r.roomId)?.number ?? '—';
      for (let g = 0; g < roomingGuestCount(r); g++) {
        const gd = roomingGuests[guestKey(r.key, g)];
        if (!gd) continue;
        const hasLast = !!gd.lastName.trim();
        const hasFirst = !!gd.firstName.trim();
        const touched = hasLast || hasFirst || gd.middleName.trim() || gd.phone.trim() || gd.docNumber.trim() || gd.birthDate.trim();
        if (touched && (!hasLast || !hasFirst)) {
          return ru ? `Rooming list, №${number}, гость ${g + 1}: укажите фамилию и имя` : `Rooming list, room ${number}, guest ${g + 1}: enter last and first name`;
        }
        if (gd.birthDate.trim() && !dotsToIso(gd.birthDate)) {
          return ru ? `Rooming list, №${number}, гость ${g + 1}: дата рождения в формате ДД.ММ.ГГГГ` : `Rooming list, room ${number}, guest ${g + 1}: date of birth as DD.MM.YYYY`;
        }
      }
    }
    return null;
  };

  const step2Problem = (): string | null => {
    if (rooms.length === 0) return ru ? 'Добавьте хотя бы один номер' : 'Add at least one room';
    if (new Set(rooms.map((r) => r.roomId)).size !== rooms.length) return ru ? 'Один номер выбран дважды' : 'The same room is selected twice';
    for (const r of rooms) {
      if (!((parseInt(r.adults, 10) || 0) >= 1)) {
        return ru ? `№${roomById.get(r.roomId)?.number ?? '—'}: нужен хотя бы один взрослый` : `Room ${roomById.get(r.roomId)?.number ?? '—'}: at least one adult is required`;
      }
    }
    if (stats.overflowRoom) {
      const o = stats.overflowRoom;
      return ru
        ? `В номере №${o.number} указано ${guestsText(o.guests, lang)} при вместимости ${o.capacity}`
        : `Room ${o.number}: ${guestsText(o.guests, lang)} for a capacity of ${o.capacity}`;
    }
    return roomingProblem();
  };

  const goTo = (n: number) => {
    setShowRooming(false);
    setStep(n);
    setMaxStep((m) => Math.max(m, n));
    scrollRef.current?.scrollTo({ y: 0, animated: false });
  };

  const goNext = async () => {
    if (step === 1) {
      setStep1Tried(true);
      const problem = step1Problem();
      if (problem) {
        Alert.alert(ru ? 'Проверьте данные' : 'Check the details', problem);
        return;
      }
      // Re-run the server allocation whenever dates or group size changed.
      if (pickedFor !== pickKey) {
        const ok = await pickRooms();
        if (!ok) return;
      }
      goTo(2);
      return;
    }
    if (step === 2) {
      const problem = step2Problem();
      if (problem) {
        Alert.alert(ru ? 'Проверьте размещение' : 'Check the allocation', problem);
        return;
      }
      if (stats.guestsUnplaced !== 0) {
        Alert.alert(
          ru ? 'Размещение не совпадает' : 'Allocation mismatch',
          ru
            ? `Распределено ${guestsText(stats.distributed, lang)} из ${stats.target}. Продолжить с таким размещением?`
            : `${guestsText(stats.distributed, lang)} allocated out of ${stats.target}. Continue anyway?`,
          [
            { text: ru ? 'Изменить' : 'Edit', style: 'cancel' },
            { text: ru ? 'Продолжить' : 'Continue', onPress: () => goTo(3) },
          ],
        );
        return;
      }
      goTo(3);
      return;
    }
    if (step === 3) {
      setStep3Tried(true);
      if (!contactLast.trim() || !contactFirst.trim()) {
        Alert.alert(ru ? 'Проверьте данные' : 'Check the details', ru ? 'Укажите фамилию и имя контактного лица' : 'Enter the contact person’s last and first name');
        return;
      }
      goTo(4);
      return;
    }
    if (step === 4) {
      goTo(5);
      return;
    }
    void submit();
  };

  const goBack = () => {
    if (showRooming) setShowRooming(false);
    else if (step > 1) goTo(step - 1);
    else onCancel();
  };

  // Progress bars: going back is free, going forward only to steps already reached.
  const jumpTo = (n: number) => {
    if (n === step && !showRooming) return;
    if (n < step || (n <= maxStep && pickedFor === pickKey)) goTo(n);
  };

  const openRooming = () => {
    const problem = rooms.length === 0 ? (ru ? 'Сначала добавьте номера' : 'Add rooms first') : null;
    if (problem) {
      Alert.alert('Rooming list', problem);
      return;
    }
    setShowRooming(true);
    scrollRef.current?.scrollTo({ y: 0, animated: false });
  };

  // ---------- submit ----------

  const toGuestInput = (gd: RoomingGuest): GuestInput => ({
    lastName: gd.lastName.trim(),
    firstName: gd.firstName.trim(),
    middleName: gd.middleName.trim() || undefined,
    phone: gd.phone.trim() || undefined,
    birthDate: dotsToIso(gd.birthDate) ?? undefined,
    gender: gd.gender === 'male' || gd.gender === 'female' ? gd.gender : undefined,
    documentType: gd.docType || undefined,
    documentId: gd.docNumber.trim() || undefined,
    nationality: gd.nationality || undefined,
  });

  const submit = async () => {
    const problem = step1Problem() ?? step2Problem() ?? (!contactLast.trim() || !contactFirst.trim() ? (ru ? 'Укажите фамилию и имя контактного лица' : 'Enter the contact person’s name') : null);
    if (problem) {
      Alert.alert(ru ? 'Проверьте данные' : 'Check the details', problem);
      return;
    }
    if (paidNow > 0 && !effectiveAccountId) {
      Alert.alert(ru ? 'Проверьте оплату' : 'Check the payment', ru ? 'Выберите счёт зачисления' : 'Select the deposit account');
      return;
    }
    if (paidNow > effectiveTotal) {
      Alert.alert(ru ? 'Проверьте оплату' : 'Check the payment', ru ? 'Предоплата больше суммы брони' : 'The prepayment exceeds the booking total');
      return;
    }

    const input: CreateGroupBookingInput = {
      groupName: companyName.trim() || company?.name || '',
      companyId: company?.id,
      discountPercent: company ? discountPct : undefined,
      checkIn: checkInIso!,
      checkOut: checkOutIso!,
      checkInTime,
      checkOutTime,
      mealPlan,
      extraServices: chosenServices.map((s) => s.code),
      notes,
      contact: {
        lastName: contactLast.trim(),
        firstName: contactFirst.trim(),
        phone: contactPhone.trim() || undefined,
        email: contactEmail.trim() || undefined,
      },
      allocations: rooms.map((r) => {
        const guests: GuestInput[] = [];
        for (let g = 0; g < roomingGuestCount(r); g++) {
          const gd = roomingGuests[guestKey(r.key, g)];
          if (gd && gd.lastName.trim() && gd.firstName.trim()) guests.push(toGuestInput(gd));
        }
        return {
          roomId: r.roomId,
          adults: parseInt(r.adults, 10) || 1,
          children: parseInt(r.children, 10) || 0,
          guests: guests.length ? guests : undefined,
        };
      }),
      paidAmount: paidNow > 0 ? paidNow : undefined,
      paymentAccountId: paidNow > 0 ? effectiveAccountId : undefined,
      manualTotal: Number.isFinite(customNum) && Math.max(0, customNum) !== calculatedTotal ? Math.max(0, customNum) : undefined,
    };

    setSaving(true);
    try {
      await createGroupBooking(input);
      Alert.alert(ru ? 'Групповая бронь создана' : 'Group booking created', undefined, [{ text: 'OK', onPress: onCreated }], {
        cancelable: false,
      });
    } catch (error) {
      Alert.alert(ru ? 'Ошибка' : 'Error', bookingErrorText(error, lang));
    } finally {
      setSaving(false);
    }
  };

  // ---------- render ----------

  const companyOptions: PickerOption[] = [
    { value: NEW_COMPANY, label: ru ? 'Новая компания' : 'New company' },
    ...companies.map((c) => ({ value: c.id, label: c.name })),
  ];
  const mealOptions: PickerOption[] = MEAL_PLANS.map((m) => ({ value: m.value, label: ru ? m.ru : m.en }));
  const accountOptions: PickerOption[] = paymentAccounts.map((a) => ({ value: a.id, label: a.name }));
  const pickableServices = services.filter((s) => !chosenServices.some((c) => c.id === s.id));
  const nextTinted = !showRooming && step === 2 && (stats.hasCapacityMismatch || rooms.length === 0);
  const busy = saving || picking;

  return (
    <View className="flex-1 bg-[#FAF7F3]" style={{ paddingTop: insets.top }}>
      {/* ==================== HEADER + 5-STEP PROGRESS ==================== */}
      <View className="px-5 pt-4 pb-3 border-b border-[#E5E2DD] bg-[#FAF7F3]">
        <View className="flex-row items-start justify-between">
          <View className="flex-row items-start gap-2.5 -ml-1 flex-1">
            <Pressable onPress={goBack} disabled={busy} hitSlop={8} className="mt-1 h-7 w-7 rounded-lg items-center justify-center active:bg-black/5">
              <ChevronLeft size={20} color="#241E1A" />
            </Pressable>
            <View className="flex-1">
              <Text className="text-[22px] font-spectral text-[#241E1A] leading-tight">{ru ? 'Групповая бронь' : 'Group booking'}</Text>
              <Text className="text-xs font-jost text-[#8A8177] mt-0.5">{ru ? 'B2B / Турфирмы' : 'B2B / Tour operators'}</Text>
            </View>
          </View>
          <Pressable onPress={onCancel} disabled={busy} hitSlop={8} className="mt-1 h-7 w-7 rounded-lg items-center justify-center active:bg-black/5">
            <X size={20} color="#241E1A" strokeWidth={1.75} />
          </Pressable>
        </View>

        <View className="flex-row items-center justify-between mt-4 mb-2">
          <Text className="text-xs font-jost-medium text-[#241E1A]">{showRooming ? 'Rooming list' : stepTitles[step]}</Text>
          <Text className="text-xs font-jost text-[#8A8177]">
            {showRooming ? (ru ? 'Детали размещения' : 'Allocation details') : ru ? `Шаг ${step} из 5` : `Step ${step} of 5`}
          </Text>
        </View>

        <View className="flex-row gap-1.5">
          {[1, 2, 3, 4, 5].map((n) => (
            <Pressable key={n} onPress={() => jumpTo(n)} disabled={busy} hitSlop={{ top: 8, bottom: 8 }} className="flex-1">
              <View className="h-[3px] rounded-full" style={{ backgroundColor: n <= step ? '#C2410C' : '#E2DDD5' }} />
            </Pressable>
          ))}
        </View>
      </View>

      <KeyboardAvoidingView className="flex-1" behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        {/* ==================== STEP BODY ==================== */}
        <ScrollView
          ref={scrollRef}
          className="flex-1"
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={{ paddingHorizontal: 20, paddingVertical: 16, gap: 20 }}
        >
          {step === 1 && (
            <>
              <View className="bg-[#EFECE6] rounded-[16px] p-4 flex-row items-center justify-between">
                <View className="flex-1 pr-2">
                  <Text className="text-[20px] font-spectral text-[#241E1A] leading-tight">{ru ? 'Групповая бронь' : 'Group booking'}</Text>
                  <Text className="text-xs font-jost text-[#8A8177] mt-1">
                    {ru ? 'Групповая' : 'Group'} · {guestsText(target, lang)} / {rooms.length || roomsNeededNum} {roomsWord(rooms.length || roomsNeededNum, lang)}
                  </Text>
                </View>
                <View className="px-3 py-1 rounded-full bg-[#241E1A]">
                  <Text className="text-[11px] font-jost-medium text-white">{nightsText(nights, lang)}</Text>
                </View>
              </View>

              <View className="gap-2.5">
                <SectionTitle>{ru ? 'Даты проживания' : 'Stay dates'}</SectionTitle>
                <View className="bg-white rounded-[18px] border border-[#E5E2DD] p-3.5 gap-3">
                  <View className="flex-row items-center gap-2.5">
                    <Text className="w-12 text-xs font-jost-medium text-[#241E1A]">{ru ? 'Заезд' : 'In'}</Text>
                    <IconInput
                      className="flex-1"
                      icon="calendar"
                      title={ru ? 'Заезд' : 'Check-in'}
                      range={{ role: 'start', ...stayRange }}
                      value={checkInText}
                      onChangeText={setCheckInText}
                      placeholder="ДД.ММ.ГГГГ"
                      invalid={(step1Tried || checkInText.length >= 10) && !checkInIso}
                    />
                    <IconInput
                      className="w-[92px]"
                      icon="clock"
                      value={checkInTime}
                      onChangeText={setCheckInTime}
                      placeholder="14:00"
                      invalid={step1Tried && !TIME_RE.test(checkInTime)}
                    />
                  </View>
                  <View className="h-px bg-[#E5E2DD]/70" />
                  <View className="flex-row items-center gap-2.5">
                    <Text className="w-12 text-xs font-jost-medium text-[#241E1A]">{ru ? 'Выезд' : 'Out'}</Text>
                    <IconInput
                      className="flex-1"
                      icon="calendar"
                      title={ru ? 'Выезд' : 'Check-out'}
                      range={{ role: 'end', ...stayRange }}
                      value={checkOutText}
                      onChangeText={setCheckOutText}
                      placeholder="ДД.ММ.ГГГГ"
                      invalid={((step1Tried || checkOutText.length >= 10) && !checkOutIso) || (step1Tried && !!checkInIso && !!checkOutIso && !datesOk)}
                    />
                    <IconInput
                      className="w-[92px]"
                      icon="clock"
                      value={checkOutTime}
                      onChangeText={setCheckOutTime}
                      placeholder="12:00"
                      invalid={step1Tried && !TIME_RE.test(checkOutTime)}
                    />
                  </View>
                </View>
              </View>

              <View className="gap-3.5 pb-2">
                <SectionTitle>{ru ? 'Компания' : 'Company'}</SectionTitle>
                <PickerField
                  label={ru ? 'Компания из реестра B2B' : 'Company from the B2B registry'}
                  title={ru ? 'Компания' : 'Company'}
                  value={companyId}
                  options={companyOptions}
                  onChange={(v) => {
                    setCompanyId(v);
                    const found = companies.find((c) => c.id === v);
                    if (found) setCompanyName(found.name);
                  }}
                />
                <TextField
                  label={ru ? 'Компания' : 'Company'}
                  value={companyName}
                  onChangeText={setCompanyName}
                  placeholder="ТОО Sunny Travel"
                  invalid={step1Tried && !companyName.trim() && !company}
                />
                <View className="flex-row gap-3">
                  <TextField
                    className="flex-1"
                    label={ru ? 'Всего гостей' : 'Total guests'}
                    value={totalGuests}
                    onChangeText={(v) => setTotalGuests(digitsOnly(v, 3))}
                    keyboardType="number-pad"
                    invalid={step1Tried && !(parseInt(totalGuests, 10) >= 1)}
                  />
                  <TextField
                    className="flex-1"
                    label={ru ? 'Нужно номеров' : 'Rooms needed'}
                    value={roomsNeeded}
                    onChangeText={(v) => setRoomsNeeded(digitsOnly(v, 2))}
                    keyboardType="number-pad"
                  />
                </View>
                <View>
                  <TextField
                    label={ru ? 'Скидка агента, %' : 'Agent discount, %'}
                    value={company ? agentDiscount : '0'}
                    onChangeText={(v) => setAgentDiscount(v.replace(/[^\d.,]/g, '').slice(0, 5))}
                    keyboardType="decimal-pad"
                    editable={!!company}
                  />
                  {!company && (
                    <Text className="text-[11px] font-jost text-[#8A8177] mt-1.5">
                      {ru ? 'Скидка применяется к компании из реестра B2B' : 'The discount applies to a company from the B2B registry'}
                    </Text>
                  )}
                </View>
              </View>
            </>
          )}

          {step === 2 && !showRooming && (
            <GroupRoomsStep
              lang={lang as Lang}
              rooms={rooms}
              roomById={roomById}
              roomOptions={roomOptions}
              stats={stats}
              canAddRoom={addableRooms.length > 0}
              picking={picking}
              filledCount={filledCount}
              onAutoPick={() => void pickRooms()}
              onAddRoom={addRoom}
              onRemoveRoom={removeRoom}
              onChangeRoom={changeRoom}
              onOpenRooming={openRooming}
            />
          )}

          {step === 2 && showRooming && (
            <GroupRoomingList
              lang={lang as Lang}
              rooms={rooms}
              roomById={roomById}
              guests={roomingGuests}
              filledCount={filledCount}
              onChangeGuest={changeGuest}
            />
          )}

          {step === 3 && (
            <View className="gap-3.5 pb-2">
              <SectionTitle>{ru ? 'Контакты' : 'Contacts'}</SectionTitle>
              <View className="bg-[#EFECE6] border border-[#E2DDD5] rounded-[14px] px-4 py-3.5 flex-row items-center gap-2.5">
                <User size={16} color="#6E675F" />
                <Text className="text-xs font-jost text-[#241E1A]">{ru ? 'Контактное лицо группы' : 'Group contact person'}</Text>
              </View>
              <TextField
                label={ru ? 'Фамилия' : 'Last name'}
                value={contactLast}
                onChangeText={setContactLast}
                placeholder={ru ? 'Фамилия представителя' : 'Representative’s last name'}
                autoCapitalize="words"
                invalid={step3Tried && !contactLast.trim()}
              />
              <TextField
                label={ru ? 'Имя' : 'First name'}
                value={contactFirst}
                onChangeText={setContactFirst}
                placeholder={ru ? 'Имя представителя' : 'Representative’s first name'}
                autoCapitalize="words"
                invalid={step3Tried && !contactFirst.trim()}
              />
              <TextField
                label={ru ? 'Телефон' : 'Phone'}
                value={contactPhone}
                onChangeText={setContactPhone}
                placeholder="+7 (XXX) XXX XX XX"
                keyboardType="phone-pad"
              />
              <TextField
                label="E-mail"
                value={contactEmail}
                onChangeText={setContactEmail}
                placeholder="name@company.com"
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>
          )}

          {step === 4 && (
            <>
              <View className="gap-4">
                <SectionTitle>{ru ? 'Пожелания и примечания' : 'Requests and notes'}</SectionTitle>
                <PickerField label={ru ? 'Питание' : 'Meals'} title={ru ? 'Питание' : 'Meals'} value={mealPlan} options={mealOptions} onChange={setMealPlan} />
                <TextField
                  label={ru ? 'Примечания' : 'Notes'}
                  value={notes}
                  onChangeText={setNotes}
                  placeholder={ru ? 'Пожелания по размещению и информация о группе' : 'Allocation wishes and group details'}
                  multiline
                />
              </View>

              <View className="h-px bg-[#E5E2DD]" />

              <View className="gap-3 pb-2">
                <SectionTitle>{ru ? 'Услуги' : 'Services'}</SectionTitle>

                {chosenServices.length === 0 ? (
                  <View className="border border-dashed border-[#D6CFC5] rounded-[14px] py-4 px-4 flex-row items-center justify-center gap-2 bg-white/40">
                    <List size={16} color="#8A8177" />
                    <Text className="text-xs font-jost text-[#8A8177]">{ru ? 'Услуг пока нет' : 'No services yet'}</Text>
                  </View>
                ) : (
                  <View className="gap-2">
                    {chosenServices.map((srv) => (
                      <View key={srv.id} className="bg-white border border-[#E5E2DD] rounded-[14px] px-3.5 py-2.5 flex-row items-center justify-between gap-2">
                        <Text className="flex-1 text-xs font-jost-medium text-[#241E1A]">{srv.name}</Text>
                        <View className="flex-row items-center gap-2.5">
                          <Text className="text-xs font-jost-semibold text-[#C2410C]">+{money(srv.price)}</Text>
                          <Pressable
                            onPress={() => setChosenServices((prev) => prev.filter((s) => s.id !== srv.id))}
                            hitSlop={6}
                            className="h-6 w-6 rounded-md items-center justify-center active:bg-black/5"
                          >
                            <X size={14} color="#8A8177" />
                          </Pressable>
                        </View>
                      </View>
                    ))}
                  </View>
                )}

                {showServicePicker && (
                  <View className="bg-white border border-[#E5E2DD] rounded-[14px] p-2.5 gap-1.5">
                    <View className="flex-row items-center justify-between px-1 pb-1 border-b border-[#E5E2DD]/60">
                      <Text className="text-[11px] font-jost-medium text-[#6E675F]">{ru ? 'Выберите услугу для группы' : 'Choose a service for the group'}</Text>
                      <Pressable onPress={() => setShowServicePicker(false)} hitSlop={8}>
                        <X size={14} color="#8A8177" />
                      </Pressable>
                    </View>
                    {pickableServices.length === 0 ? (
                      <Text className="px-2.5 py-2 text-xs font-jost text-[#8A8177]">
                        {services.length === 0 ? (ru ? 'Каталог услуг пуст' : 'The service catalog is empty') : ru ? 'Все услуги уже добавлены' : 'All services are added'}
                      </Text>
                    ) : (
                      pickableServices.map((srv) => (
                        <Pressable
                          key={srv.id}
                          onPress={() => {
                            setChosenServices((prev) => [...prev, srv]);
                            setShowServicePicker(false);
                          }}
                          className="w-full px-2.5 py-2 rounded-lg flex-row items-center justify-between gap-2 active:bg-[#FAF7F3]"
                        >
                          <Text className="flex-1 text-xs font-jost text-[#241E1A]">{srv.name}</Text>
                          <Text className="text-xs font-jost-medium text-[#C2410C]">+{money(srv.price)}</Text>
                        </Pressable>
                      ))
                    )}
                  </View>
                )}

                <Pressable
                  onPress={() => setShowServicePicker((v) => !v)}
                  className="w-full rounded-[14px] border border-[#DFC3B4] bg-[#FAF7F3] py-3.5 px-4 flex-row items-center justify-center gap-2 active:bg-[#F5EFE6]"
                >
                  <Plus size={16} color="#C2410C" />
                  <Text className="text-xs font-jost-medium text-[#C2410C]">{ru ? 'Заказать услугу' : 'Order a service'}</Text>
                </Pressable>
              </View>
            </>
          )}

          {step === 5 && (
            <View className="gap-3.5 pb-2">
              <SectionTitle>{ru ? 'Оплата' : 'Payment'}</SectionTitle>

              <View className="bg-[#EFECE6] rounded-[16px] p-4 gap-2">
                <View className="flex-row items-center justify-between">
                  <Text className="text-xs font-jost text-[#241E1A]">
                    {rooms.length} {roomsWord(rooms.length, lang)} × {nightsText(nights, lang)}
                  </Text>
                  <Text className="text-xs font-jost-medium text-[#241E1A]">{money(grossRooms)}</Text>
                </View>
                {company && (
                  <View className="flex-row items-center justify-between">
                    <Text className="text-xs font-jost text-[#241E1A]">
                      {ru ? 'Скидка агента' : 'Agent discount'} · {discountPct}%
                    </Text>
                    <Text className="text-xs font-jost-medium text-[#241E1A]">−{money(discountAmount)}</Text>
                  </View>
                )}
                {servicesSum > 0 && (
                  <View className="flex-row items-center justify-between">
                    <Text className="text-xs font-jost text-[#241E1A]">{ru ? 'Дополнительные услуги' : 'Extra services'}</Text>
                    <Text className="text-xs font-jost-medium text-[#241E1A]">+{money(servicesSum)}</Text>
                  </View>
                )}
                <View className="border-t border-[#DCD6CC] pt-2.5 mt-1 flex-row items-center justify-between">
                  <Text className="text-sm font-jost text-[#241E1A]">{ru ? 'Итого' : 'Total'}</Text>
                  <Text className="text-lg font-jost-semibold text-[#C2410C]">{money(effectiveTotal)}</Text>
                </View>
                <Text className="text-[11px] font-jost text-[#8A8177]">
                  {ru ? 'Окончательную сумму рассчитает сервер по тарифу' : 'The final amount is priced by the server'}
                </Text>
              </View>

              <View className="bg-white rounded-[18px] border border-[#E5E2DD] p-4 gap-3.5">
                <TextField
                  label={ru ? 'Сумма' : 'Amount'}
                  value={customSum !== null ? customSum : String(calculatedTotal)}
                  onChangeText={(v) => {
                    setCustomSum(digitsOnly(v));
                    setIsPaid(false);
                  }}
                  keyboardType="number-pad"
                  suffix="₸"
                />
                <TextField
                  label={ru ? 'Предоплата' : 'Prepayment'}
                  value={isPaid ? String(effectiveTotal) : prepayment}
                  onChangeText={(v) => {
                    setPrepayment(digitsOnly(v));
                    setIsPaid(false);
                  }}
                  keyboardType="number-pad"
                  suffix="₸"
                />

                <View className="h-px bg-[#E5E2DD]/80" />
                <View className="flex-row items-center justify-between py-0.5">
                  <Text className="text-xs font-jost text-[#8A8177]">{ru ? 'К доплате' : 'Balance due'}</Text>
                  <Text className="text-[20px] font-jost-semibold text-[#C2410C]">{money(remaining)}</Text>
                </View>
                <View className="h-px bg-[#E5E2DD]/80" />

                <PickerField
                  label={ru ? 'Счёт зачисления' : 'Deposit account'}
                  title={ru ? 'Счёт зачисления' : 'Deposit account'}
                  value={effectiveAccountId}
                  options={accountOptions}
                  onChange={setAccountId}
                  placeholder={ru ? 'Счета не загружены' : 'No accounts loaded'}
                  emptyText={ru ? 'Счета не загружены' : 'No accounts loaded'}
                />

                <View className="flex-row items-center justify-between pt-0.5">
                  <Text className="text-xs font-jost text-[#8A8177]">{ru ? 'Статус' : 'Status'}</Text>
                  {fullyPaid ? (
                    <View className="flex-row items-center gap-1.5">
                      <View className="h-2 w-2 rounded-full bg-[#15803D]" />
                      <Text className="text-xs font-jost-medium text-[#15803D]">{ru ? 'Оплачено' : 'Paid'}</Text>
                    </View>
                  ) : prepaymentNum > 0 ? (
                    <View className="flex-row items-center gap-1.5">
                      <View className="h-2 w-2 rounded-full bg-[#D97706]" />
                      <Text className="text-xs font-jost-medium text-[#B45309]">{ru ? 'Частично оплачено' : 'Partially paid'}</Text>
                    </View>
                  ) : (
                    <View className="flex-row items-center gap-1.5">
                      <View className="h-2 w-2 rounded-full bg-[#C58B16]" />
                      <Text className="text-xs font-jost-medium text-[#9A6B11]">{ru ? 'Не оплачено' : 'Not paid'}</Text>
                    </View>
                  )}
                </View>

                <Pressable
                  onPress={() => {
                    setIsPaid(true);
                    setPrepayment(String(effectiveTotal));
                  }}
                  className="w-full py-3.5 rounded-[14px] bg-[#C2410C] items-center active:bg-[#A93A0C]"
                >
                  <Text className="text-xs font-jost-medium text-white">
                    {fullyPaid ? (ru ? 'Оплачено ✓' : 'Paid ✓') : ru ? 'Оплатить' : 'Pay'}
                  </Text>
                </Pressable>
              </View>
            </View>
          )}
        </ScrollView>

        {/* ==================== BOTTOM SUMMARY & NAVIGATION ==================== */}
        <View className="px-5 pt-3 border-t border-[#E5E2DD] bg-[#FAF7F3]" style={{ paddingBottom: insideTabs ? 16 : Math.max(16, insets.bottom) }}>
          <View className="flex-row gap-2 mb-3">
            <View className="flex-1">
              <Text className="text-[10px] font-jost text-[#8A8177]">{ru ? 'Итого' : 'Total'}</Text>
              <Text className="text-base font-jost-semibold text-[#241E1A]" numberOfLines={1} adjustsFontSizeToFit>
                {money(effectiveTotal)}
              </Text>
            </View>
            <View className="flex-1">
              <Text className="text-[10px] font-jost text-[#8A8177]">{ru ? 'Предоплата' : 'Prepayment'}</Text>
              <Text className="text-base font-jost-semibold text-[#241E1A]" numberOfLines={1} adjustsFontSizeToFit>
                {money(paidNow)}
              </Text>
            </View>
            <View className="flex-1">
              <Text className="text-[10px] font-jost text-[#8A8177]" numberOfLines={1}>
                {ru ? 'К оплате при заезде' : 'Due at check-in'}
              </Text>
              <Text className="text-base font-jost-semibold text-[#C2410C]" numberOfLines={1} adjustsFontSizeToFit>
                {money(remaining)}
              </Text>
            </View>
          </View>

          <View className="flex-row items-center gap-2.5">
            <Pressable
              onPress={() => {
                if (showRooming) setShowRooming(false);
                else if (step === 5) onCancel();
                else goBack();
              }}
              disabled={busy}
              className="w-[34%] py-3.5 rounded-[14px] bg-white border border-[#E5E2DD] items-center active:bg-[#F5F2EC]"
            >
              <Text className="text-xs font-jost-medium text-[#241E1A]">{!showRooming && step === 5 ? (ru ? 'Отмена' : 'Cancel') : ru ? 'Назад' : 'Back'}</Text>
            </Pressable>

            <Pressable
              onPress={() => {
                if (showRooming) {
                  const problem = roomingProblem();
                  if (problem) Alert.alert('Rooming list', problem);
                  else setShowRooming(false);
                } else void goNext();
              }}
              disabled={busy}
              className="flex-1 py-3.5 rounded-[14px] flex-row items-center justify-center gap-1.5"
              style={{ backgroundColor: nextTinted ? '#DF9A84' : '#C2410C', opacity: busy ? 0.8 : 1 }}
            >
              {busy ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <>
                  <Text className="text-xs font-jost-medium text-white">
                    {showRooming ? (ru ? 'Сохранить список' : 'Save list') : step < 5 ? (ru ? 'Далее' : 'Next') : ru ? 'Создать бронь' : 'Create booking'}
                  </Text>
                  {!showRooming && step < 5 && <ChevronRight size={16} color="#FFFFFF" />}
                </>
              )}
            </Pressable>
          </View>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}
