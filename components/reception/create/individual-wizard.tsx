import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Alert, BackHandler, KeyboardAvoidingView, Platform, Pressable, ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ChevronLeft, ChevronRight, X } from 'lucide-react-native';
import { useApp } from '@/context/app-store';
import { payBooking, updateBooking, updateGuestProfile } from '@/lib/api-client';
import {
  BOOKING_SOURCES,
  MEAL_PLANS,
  SPECIAL_MARKS,
  type CatalogItem,
  type CreateBookingInput,
  type FoundGuest,
  guestPayload,
  nightsBetween,
  toIsoDate,
  useReception,
} from '@/context/reception-store';
import { type BookingPrefill, addDaysIso, dotsToIso, guestsText, isoToDots, nightsText } from '@/components/reception/booking-utils';
import { C, Chip, DateInput, Divider, FieldLabel, Input, SectionTitle, Select, SoonBadge, TimeInput, isTime, money, type PickOption } from './individual-ui';
import {
  GuestCard,
  type GuestDraft,
  birthDateInvalid,
  draftToGuestInput,
  emptyGuest,
  foundToDraft,
  isGuestBlank,
} from './individual-guest-card';
import { ServicesSection } from './individual-services';

// "Индивидуальная бронь" — 4-step wizard of the reception role (web design:
// ReceptionScreens.tsx → createBookingType === 'INDIVIDUAL'), wired to the real API.

const digits = (value: string, max = 9) => value.replace(/\D/g, '').slice(0, max);
const toInt = (value: string) => {
  const n = parseInt(value, 10);
  return Number.isFinite(n) ? n : 0;
};
// Special marks shown as the second chip row (the design pairs them with check-in/out).
const TIME_MARKS = ['Late checkout', 'Early check-in'];

// Booking being edited (raw GET /bookings/:id). The wizard then saves with PATCH instead of creating.
export interface EditSource {
  id: string;
  raw: any;
  roomId?: string; // room from the timeline, used if the single-booking response lacks it
}

const s = (v: unknown) => (v === null || v === undefined ? '' : String(v));
const rawDate = (v: unknown) => (/^\d{4}-\d{2}-\d{2}/.exec(s(v))?.[0] ?? '');

function guestFromRaw(g: any): GuestDraft {
  const birth = rawDate(g?.birthDate || g?.birth_date);
  const gender = s(g?.gender);
  return {
    lastName: s(g?.lastName || g?.last_name),
    firstName: s(g?.firstName || g?.first_name),
    middleName: s(g?.middleName || g?.middle_name),
    phone: s(g?.phone),
    email: s(g?.email),
    docType: s(g?.documentType || g?.document_type),
    docNumber: s(g?.documentId || g?.documentNumber || g?.document_number),
    birthDate: birth ? isoToDots(birth) : '',
    gender: gender === 'male' || gender === 'female' ? gender : '',
    nationality: s(g?.nationality),
  };
}

interface Availability {
  ids: Set<string> | null; // null = unknown (dates invalid, loading or request failed)
  loading: boolean;
  failed: boolean;
}

export function IndividualBookingWizard({
  onCancel,
  onCreated,
  prefill,
  edit,
  insideTabs,
}: {
  onCancel: () => void;
  onCreated: () => void;
  prefill?: BookingPrefill | null;
  edit?: EditSource;
  insideTabs?: boolean; // the tab bar below already covers the bottom safe area
}) {
  const { lang } = useApp();
  const ru = lang === 'RU';
  const L = (r: string, e: string) => (ru ? r : e);
  const insets = useSafeAreaInsets();
  const {
    rooms,
    tariffs,
    services,
    companies,
    paymentAccounts,
    loadCatalogs,
    availableRoomIds,
    searchGuests,
    createBooking,
  } = useReception();

  const todayIso = useMemo(() => toIsoDate(new Date()), []);
  const raw = edit?.raw;
  const isEdit = !!edit;
  // Values of the booking being edited, to tell what the user changed.
  const original = useMemo(() => {
    if (!raw) return null;
    const roomIdRaw = s(raw.roomId || raw.room_id || raw.room?.id || edit?.roomId);
    const adultsRaw = Number(raw.adults) || 1;
    const childrenRaw = Number(raw.children) || 0;
    return {
      checkIn: rawDate(raw.checkInDate || raw.checkIn),
      checkOut: rawDate(raw.checkOutDate || raw.checkOut),
      roomId: roomIdRaw,
      adults: adultsRaw,
      children: childrenRaw,
      total: Math.round(Number(raw.totalAmount ?? raw.totalDue) || 0),
      paid: Math.round(Number(raw.paidAmount ?? raw.amountPaid) || 0),
      guestId: s(raw.guestId || raw.guest?.id) || undefined,
      guest: guestFromRaw(raw.guest || raw.primaryGuest || {}),
      extraServices: Array.isArray(raw.extraServices) ? raw.extraServices.map(s) : [],
      extraBedKey: raw.extraBedConfirmed ? `${roomIdRaw}:${adultsRaw + childrenRaw}` : '',
      code: s(raw.confirmationCode || raw.code),
    };
  }, [raw, edit?.roomId]);
  const scrollRef = useRef<ScrollView>(null);
  const [step, setStep] = useState(1);
  const [showErrors, setShowErrors] = useState<Record<number, boolean>>({});
  const [saving, setSaving] = useState(false);

  // Step 1 — stay
  const [checkInText, setCheckInText] = useState(isoToDots(original?.checkIn || prefill?.checkIn || todayIso));
  const [checkInTime, setCheckInTime] = useState(s(raw?.checkInTime) || '14:00');
  const [checkOutText, setCheckOutText] = useState(isoToDots(original?.checkOut || prefill?.checkOut || addDaysIso(todayIso, 1)));
  // Check-in / check-out are picked together in one calendar.
  const stayRange = {
    start: checkInText,
    end: checkOutText,
    onChange: (start: string, end: string) => {
      setCheckInText(start);
      setCheckOutText(end);
    },
  };
  const [checkOutTime, setCheckOutTime] = useState(s(raw?.checkOutTime) || '12:00');
  const [category, setCategory] = useState(() => rooms.find((r) => r.id === (original?.roomId || prefill?.roomId))?.category ?? '');
  const [roomId, setRoomId] = useState(original?.roomId || prefill?.roomId || '');
  const [tariffCode, setTariffCode] = useState(s(raw?.tariffCode));
  const [adultsText, setAdultsText] = useState(original ? String(original.adults) : '2');
  const [childrenText, setChildrenText] = useState(original ? String(original.children) : '0');
  const [companyId, setCompanyId] = useState('');
  const [discountText, setDiscountText] = useState('0');
  // "roomId:guests" the extra bed was confirmed for; changes to either drop the confirmation.
  const [extraBedFor, setExtraBedFor] = useState(original?.extraBedKey ?? '');
  const [avail, setAvail] = useState<Availability>({ ids: null, loading: false, failed: false });

  // Step 2 — guests
  const [mainGuest, setMainGuest] = useState<GuestDraft>(() => original?.guest ?? emptyGuest());
  const [guestId, setGuestId] = useState<string | undefined>(original?.guestId);
  const [source, setSource] = useState(s(raw?.source) || 'direct');
  const [companions, setCompanions] = useState<GuestDraft[]>([]);

  // Step 3 — wishes & services
  const [mealPlan, setMealPlan] = useState(raw ? s(raw.mealPlan) : 'Breakfast');
  const [marks, setMarks] = useState<string[]>(Array.isArray(raw?.specialMarks) ? raw.specialMarks.map(s) : []);
  const [specialRequests, setSpecialRequests] = useState(s(raw?.specialRequests));
  const [hasPets, setHasPets] = useState(!!raw?.hasPets);
  const [tags, setTags] = useState<string>(Array.isArray(raw?.tags) ? raw.tags.map(s).join(', ') : '');
  const [notes, setNotes] = useState(s(raw?.notes));
  const [chosenServices, setChosenServices] = useState<CatalogItem[]>([]);

  // Step 4 — payment
  // When editing, the sum starts as the booking's current total.
  const [customSum, setCustomSum] = useState<string | null>(original ? String(original.total) : null);
  const [prepaymentText, setPrepaymentText] = useState('0');
  const [accountId, setAccountId] = useState('');

  useEffect(() => {
    loadCatalogs().catch(() => {});
  }, [loadCatalogs]);

  // ── Derived ───────────────────────────────────────────────────────────────────
  const checkInIso = dotsToIso(checkInText);
  const checkOutIso = dotsToIso(checkOutText);
  const datesValid = !!checkInIso && !!checkOutIso && checkOutIso > checkInIso;
  const nights = datesValid ? nightsBetween(checkInIso!, checkOutIso!) : 0;

  const operationalRooms = useMemo(() => rooms.filter((r) => r.isOperational), [rooms]);
  const categories = useMemo(() => Array.from(new Set(operationalRooms.map((r) => r.category))), [operationalRooms]);
  const room = operationalRooms.find((r) => r.id === roomId);
  const isFree = useCallback((id: string) => !avail.ids || avail.ids.has(id) || id === original?.roomId, [avail.ids, original?.roomId]);

  const adults = toInt(adultsText);
  const children = toInt(childrenText);
  const totalGuests = Math.max(1, adults) + Math.max(0, children);
  const otherGuestsCount = Math.max(0, totalGuests - 1);
  const capacityKey = `${roomId}:${totalGuests}`;
  const overCapacity = !!room && totalGuests > room.capacity;
  const extraBedConfirmed = overCapacity && extraBedFor === capacityKey;

  const discountPct = companyId ? Math.min(100, Math.max(0, toInt(discountText))) : 0;
  const roomStaySum = Math.round(nights * (room?.pricePerNight ?? 0) * (1 - discountPct / 100));
  const servicesSum = chosenServices.reduce((acc, s) => acc + s.price, 0);
  const calculatedTotal = roomStaySum + servicesSum;
  const customNum = customSum !== null && customSum.trim() !== '' ? toInt(customSum) : null;
  const effectiveTotal = customNum ?? calculatedTotal;
  const prepayment = toInt(prepaymentText);
  const alreadyPaid = original?.paid ?? 0;
  const remaining = Math.max(0, effectiveTotal - alreadyPaid - prepayment);
  const paidInFull = alreadyPaid + prepayment > 0 && remaining === 0;

  // ── Effects ───────────────────────────────────────────────────────────────────
  // Free rooms for the chosen dates.
  useEffect(() => {
    if (!datesValid) {
      setAvail({ ids: null, loading: false, failed: false });
      return;
    }
    let alive = true;
    setAvail((a) => ({ ...a, loading: true }));
    const timer = setTimeout(() => {
      availableRoomIds(checkInIso!, checkOutIso!)
        .then((ids) => alive && setAvail({ ids: new Set(ids), loading: false, failed: false }))
        .catch(() => alive && setAvail({ ids: null, loading: false, failed: true }));
    }, 250);
    return () => {
      alive = false;
      clearTimeout(timer);
    };
  }, [datesValid, checkInIso, checkOutIso, availableRoomIds]);

  useEffect(() => {
    if (!category && categories.length) setCategory(categories[0]);
  }, [category, categories]);

  // Pre-select the first free room of the category once availability is known.
  useEffect(() => {
    if (roomId || !category || avail.loading) return;
    const first = operationalRooms.find((r) => r.category === category && isFree(r.id));
    if (first) setRoomId(first.id);
  }, [roomId, category, avail.loading, operationalRooms, isFree]);

  useEffect(() => {
    if (!accountId && paymentAccounts.length) setAccountId((paymentAccounts.find((a) => a.type === 'cash') ?? paymentAccounts[0]).id);
  }, [accountId, paymentAccounts]);

  // Editing: pick the booking's extra services once the catalog is loaded.
  const servicesPrefilled = useRef(false);
  useEffect(() => {
    if (!original || servicesPrefilled.current || services.length === 0) return;
    servicesPrefilled.current = true;
    setChosenServices(services.filter((sv) => original.extraServices.includes(sv.code)));
  }, [original, services]);

  // Editing: once dates, room or guests change, the old total no longer applies — show the estimate.
  const stayChanged =
    !!original &&
    (checkInIso !== original.checkIn ||
      checkOutIso !== original.checkOut ||
      roomId !== original.roomId ||
      adults !== original.adults ||
      children !== original.children);
  useEffect(() => {
    if (stayChanged) setCustomSum(null);
  }, [stayChanged]);

  // Keep one companion slot per extra guest (data of removed slots is kept for undo).
  useEffect(() => {
    setCompanions((prev) => (prev.length >= otherGuestsCount ? prev : [...prev, ...Array.from({ length: otherGuestsCount - prev.length }, emptyGuest)]));
  }, [otherGuestsCount]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ y: 0, animated: false });
  }, [step]);

  // ── Validation ────────────────────────────────────────────────────────────────
  const validateStep = (s: number): string | null => {
    if (s === 1) {
      if (!checkInIso || !checkOutIso) return L('Введите даты в формате ДД.ММ.ГГГГ', 'Enter dates as DD.MM.YYYY');
      if (checkOutIso <= checkInIso) return L('Дата выезда должна быть позже даты заезда', 'Check-out must be after check-in');
      if (!isTime(checkInTime) || !isTime(checkOutTime)) return L('Укажите время в формате ЧЧ:ММ', 'Enter time as HH:MM');
      if (!room) return L('Выберите номер', 'Select a room');
      if (!isFree(room.id)) return L(`Номер ${room.number} занят на выбранные даты`, `Room ${room.number} is occupied on these dates`);
      if (adults < 1) return L('Взрослых должно быть не меньше 1', 'At least 1 adult is required');
      if (companyId && toInt(discountText) > 100) return L('Скидка агента — от 0 до 100%', 'Agent discount must be 0–100%');
      return null;
    }
    if (s === 2) {
      if (!guestId && (!mainGuest.lastName.trim() || !mainGuest.firstName.trim()))
        return L('Укажите фамилию и имя основного гостя', 'Enter the main guest’s last and first name');
      if (birthDateInvalid(mainGuest)) return L('Дата рождения основного гостя: формат ДД.ММ.ГГГГ', 'Main guest date of birth: DD.MM.YYYY');
      for (let i = 0; i < otherGuestsCount; i++) {
        const g = companions[i];
        if (!g || isGuestBlank(g)) continue;
        if (!g.lastName.trim() || !g.firstName.trim()) return L(`Укажите фамилию и имя гостя ${i + 2}`, `Enter guest ${i + 2}’s last and first name`);
        if (birthDateInvalid(g)) return L(`Дата рождения гостя ${i + 2}: формат ДД.ММ.ГГГГ`, `Guest ${i + 2} date of birth: DD.MM.YYYY`);
      }
      return null;
    }
    if (s === 4) {
      if (prepayment > Math.max(0, effectiveTotal - alreadyPaid)) return L(isEdit ? 'Оплата больше долга по брони' : 'Предоплата больше суммы брони', 'Payment exceeds the booking balance');
      if (prepayment > 0 && !accountId) return L('Выберите счёт зачисления', 'Select a payment account');
      return null;
    }
    return null;
  };

  const askExtraBed = () => {
    Alert.alert(
      L('Гостей больше вместимости', 'Over capacity'),
      L(
        `В номере ${room?.number} помещается ${guestsText(room?.capacity ?? 0, lang)}, а в брони ${guestsText(totalGuests, lang)}. Добавить дополнительное место?`,
        `Room ${room?.number} fits ${guestsText(room?.capacity ?? 0, lang)}, the booking has ${guestsText(totalGuests, lang)}. Add an extra bed?`
      ),
      [
        { text: L('Отмена', 'Cancel'), style: 'cancel' },
        {
          text: L('Доп. место', 'Extra bed'),
          onPress: () => {
            setExtraBedFor(capacityKey);
            setStep(2);
          },
        },
      ]
    );
  };

  // Validates every step from the current one up to (not including) `target`.
  const checkUpTo = (target: number): boolean => {
    for (let s = Math.min(step, target); s < target; s++) {
      const problem = validateStep(s);
      if (problem) {
        setShowErrors((prev) => ({ ...prev, [s]: true }));
        setStep(s);
        Alert.alert(L('Проверьте данные', 'Check the details'), problem);
        return false;
      }
      if (s === 1 && overCapacity && !extraBedConfirmed) {
        setStep(1);
        askExtraBed();
        return false;
      }
    }
    return true;
  };

  const goTo = (target: number) => {
    if (target <= step) {
      setStep(target);
      return;
    }
    if (checkUpTo(target)) setStep(target);
  };

  const goBack = useCallback(() => {
    if (saving) return;
    if (step > 1) setStep(step - 1);
    else onCancel();
  }, [saving, step, onCancel]);

  useEffect(() => {
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      goBack();
      return true;
    });
    return () => sub.remove();
  }, [goBack]);

  // ── Submit ────────────────────────────────────────────────────────────────────
  const submit = async () => {
    // Steps 1–3 were checked on the way here, but re-check them all (data may have changed).
    for (let s = 1; s <= 4; s++) {
      const problem = validateStep(s);
      if (problem) {
        setShowErrors((prev) => ({ ...prev, [s]: true }));
        setStep(s);
        Alert.alert(L('Проверьте данные', 'Check the details'), problem);
        return;
      }
    }
    if (overCapacity && !extraBedConfirmed) {
      setStep(1);
      askExtraBed();
      return;
    }
    if (!room || !checkInIso || !checkOutIso) return;

    if (edit && original) {
      setSaving(true);
      try {
        if (guestId && JSON.stringify(mainGuest) !== JSON.stringify(original.guest)) {
          await updateGuestProfile(guestId, guestPayload(draftToGuestInput(mainGuest)));
        }
        const manual = customNum !== null && customNum !== original.total ? customNum : null;
        await updateBooking(edit.id, {
          roomId: room.id,
          checkInDate: checkInIso,
          checkOutDate: checkOutIso,
          checkInTime: checkInTime.trim(),
          checkOutTime: checkOutTime.trim(),
          adults: Math.max(1, adults),
          children: Math.max(0, children),
          extraBedConfirmed: extraBedConfirmed || undefined,
          source,
          tariffCode: tariffCode || undefined,
          mealPlan: mealPlan || undefined,
          specialMarks: marks,
          extraServices: chosenServices.map((sv) => sv.code),
          specialRequests,
          notes,
          tags: tags
            .split(',')
            .map((t) => t.trim())
            .filter(Boolean),
          hasPets,
          ...(manual !== null ? { manualPrice: true, totalAmount: manual } : {}),
        });
        if (prepayment > 0 && accountId) await payBooking(edit.id, { amount: prepayment, accountId });
        Alert.alert(L('Бронь сохранена', 'Booking saved'), undefined, [{ text: 'OK', onPress: onCreated }], { cancelable: false });
      } catch (error) {
        Alert.alert(L('Ошибка', 'Error'), error instanceof Error ? error.message : String(error));
      } finally {
        setSaving(false);
      }
      return;
    }

    const companionInputs = companions
      .slice(0, otherGuestsCount)
      .filter((g) => !isGuestBlank(g))
      .map(draftToGuestInput);
    const tagList = tags
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean);

    const input: CreateBookingInput = {
      kind: 'individual',
      roomId: room.id,
      checkIn: checkInIso,
      checkOut: checkOutIso,
      checkInTime: checkInTime.trim(),
      checkOutTime: checkOutTime.trim(),
      adults: Math.max(1, adults),
      children: Math.max(0, children),
      extraBedConfirmed: extraBedConfirmed || undefined,
      guestId,
      guest: guestId ? undefined : draftToGuestInput(mainGuest),
      companions: companionInputs,
      source,
      tariffCode: tariffCode || undefined,
      mealPlan,
      specialMarks: marks,
      extraServices: chosenServices.map((s) => s.code),
      specialRequests,
      notes,
      tags: tagList,
      hasPets,
      companyId: companyId || undefined,
      discountPercent: companyId ? discountPct : undefined,
      paidAmount: prepayment > 0 ? prepayment : undefined,
      paymentAccountId: prepayment > 0 ? accountId : undefined,
      manualTotal: customNum !== null && customNum !== calculatedTotal ? customNum : undefined,
    };

    setSaving(true);
    try {
      await createBooking(input);
      Alert.alert(L('Бронь создана', 'Booking created'), undefined, [{ text: 'OK', onPress: onCreated }], { cancelable: false });
    } catch (error) {
      Alert.alert(L('Ошибка', 'Error'), error instanceof Error ? error.message : String(error));
    } finally {
      setSaving(false);
    }
  };

  // ── Options ───────────────────────────────────────────────────────────────────
  const categoryOptions: PickOption[] = categories.map((c) => {
    const inCat = operationalRooms.filter((r) => r.category === c);
    const free = inCat.filter((r) => isFree(r.id)).length;
    return {
      value: c,
      label: c,
      hint: avail.ids ? L(`Свободно ${free} из ${inCat.length}`, `${free} of ${inCat.length} free`) : undefined,
    };
  });
  const roomOptions: PickOption[] = operationalRooms
    .filter((r) => r.category === category)
    .map((r) => {
      const free = isFree(r.id);
      return {
        value: r.id,
        label: `№ ${r.number} · ${r.category} · ${guestsText(r.capacity, lang)}`,
        hint: !free ? L('Занят на эти даты', 'Occupied on these dates') : r.floor !== null ? L(`${r.floor} этаж`, `Floor ${r.floor}`) : undefined,
        disabled: !free,
      };
    });
  const tariffOptions: PickOption[] = [{ value: '', label: L('Тариф номера', 'Room rate') }, ...tariffs.map((t) => ({ value: t.code, label: t.name }))];
  const companyOptions: PickOption[] = [{ value: '', label: L('Без компании', 'No company') }, ...companies.map((c) => ({ value: c.id, label: c.name }))];
  const sourceOptions: PickOption[] = BOOKING_SOURCES.map((s) => ({ value: s.value, label: ru ? s.ru : s.en }));
  const mealOptions: PickOption[] = MEAL_PLANS.map((m) => ({ value: m.value, label: ru ? m.ru : m.en }));
  const accountOptions: PickOption[] = paymentAccounts.map((a) => ({ value: a.id, label: a.name }));
  const stepTitles = [L('Проживание', 'Stay'), L('Гости', 'Guests'), L('Пожелания', 'Wishes'), L('Оплата', 'Payment')];
  const errs = (s: number) => !!showErrors[s];

  const toggleMark = (value: string) => setMarks((prev) => (prev.includes(value) ? prev.filter((m) => m !== value) : [...prev, value]));
  const markLabel = (value: string) => {
    const m = SPECIAL_MARKS.find((x) => x.value === value);
    return m ? (ru ? m.ru : m.en) : value;
  };

  const updateMain = (patch: Partial<GuestDraft>) => {
    setMainGuest((g) => ({ ...g, ...patch }));
    // Editing the found guest's name means it is a different person now.
    if (!isEdit && guestId && (patch.lastName !== undefined || patch.firstName !== undefined)) setGuestId(undefined);
  };
  const pickFound = (f: FoundGuest) => {
    setMainGuest(foundToDraft(f));
    setGuestId(f.id || undefined);
  };
  const updateCompanion = (idx: number, patch: Partial<GuestDraft>) =>
    setCompanions((prev) => prev.map((g, i) => (i === idx ? { ...g, ...patch } : g)));

  // ── Render ────────────────────────────────────────────────────────────────────
  return (
    <View className="flex-1 bg-background" style={{ paddingTop: insets.top }}>
      {/* Header + 4-step progress */}
      <View className="px-5 pt-4 pb-3 bg-background" style={{ borderBottomWidth: 1, borderBottomColor: C.border }}>
        <View className="flex-row items-start justify-between">
          <View className="flex-row items-start gap-2.5 -ml-1 flex-1">
            <Pressable onPress={goBack} hitSlop={8} className="mt-1 h-7 w-7 rounded-lg items-center justify-center active:bg-black/5">
              <ChevronLeft size={20} color={C.text} />
            </Pressable>
            <View className="flex-1">
              <Text className="text-[22px] font-spectral text-text-primary">{isEdit ? L('Изменить бронь', 'Edit booking') : L('Индивидуальная бронь', 'Individual Booking')}</Text>
              <Text className="text-xs font-jost text-text-secondary mt-0.5">{L('Индивидуальный гость', 'Individual guest')}</Text>
            </View>
          </View>
          <Pressable onPress={onCancel} disabled={saving} hitSlop={8} className="mt-1 h-7 w-7 rounded-lg items-center justify-center active:bg-black/5">
            <X size={20} color={C.text} strokeWidth={1.75} />
          </Pressable>
        </View>

        <View className="flex-row items-center justify-between mt-4 mb-2">
          <Text className="text-xs font-jost-medium text-text-primary">{stepTitles[step - 1]}</Text>
          <Text className="text-xs font-jost text-text-secondary">{L(`Шаг ${step} из 4`, `Step ${step} of 4`)}</Text>
        </View>
        <View className="flex-row gap-1.5">
          {[1, 2, 3, 4].map((n) => (
            <Pressable key={n} onPress={() => goTo(n)} hitSlop={{ top: 10, bottom: 10 }} className="flex-1">
              <View className="h-[3px] rounded-full" style={{ backgroundColor: n <= step ? C.accent : '#E2DDD5' }} />
            </Pressable>
          ))}
        </View>
      </View>

      <KeyboardAvoidingView className="flex-1" behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView
          ref={scrollRef}
          className="flex-1"
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={{ paddingHorizontal: 20, paddingVertical: 16, gap: 20 }}
        >
          {step === 1 && (
            <>
              {/* Summary banner */}
              <View className="bg-[#EFECE6] rounded-[16px] p-4 flex-row items-center justify-between gap-3">
                <View className="flex-1">
                  <Text className="text-[20px] font-spectral text-text-primary">
                    {isEdit ? (original?.code ? L(`Бронь ${original.code}`, `Booking ${original.code}`) : L('Бронь', 'Booking')) : L('Новая бронь', 'New booking')}
                  </Text>
                  <Text className="text-xs font-jost text-text-secondary mt-1">
                    {L('Индивидуальная', 'Individual')} · {guestsText(totalGuests, lang)} / {L('1 номер', '1 room')}
                  </Text>
                </View>
                <View className="px-3 py-1 rounded-full bg-dark">
                  <Text className="text-[11px] font-jost-medium text-white">{datesValid ? nightsText(nights, lang) : '—'}</Text>
                </View>
              </View>

              {/* Dates */}
              <View className="gap-2.5">
                <SectionTitle>{L('Даты проживания', 'Stay dates')}</SectionTitle>
                <View className="bg-white rounded-[18px] p-3.5 gap-3" style={{ borderWidth: 1, borderColor: C.border }}>
                  <View className="flex-row items-center gap-2.5">
                    <Text className="w-12 text-xs font-jost-medium text-text-primary">{L('Заезд', 'In')}</Text>
                    <View className="flex-1">
                      <DateInput
                        compact
                        title={L('Заезд', 'Check-in')}
                        range={{ role: 'start', ...stayRange }}
                        value={checkInText}
                        onChange={setCheckInText}
                        placeholder={L('дд.мм.гггг', 'dd.mm.yyyy')}
                        invalid={(errs(1) || checkInText.length >= 10) && !checkInIso}
                      />
                    </View>
                    <TimeInput value={checkInTime} onChange={setCheckInTime} invalid={(errs(1) || checkInTime.length >= 5) && !isTime(checkInTime)} />
                  </View>
                  <Divider soft />
                  <View className="flex-row items-center gap-2.5">
                    <Text className="w-12 text-xs font-jost-medium text-text-primary">{L('Выезд', 'Out')}</Text>
                    <View className="flex-1">
                      <DateInput
                        compact
                        title={L('Выезд', 'Check-out')}
                        range={{ role: 'end', ...stayRange }}
                        value={checkOutText}
                        onChange={setCheckOutText}
                        placeholder={L('дд.мм.гггг', 'dd.mm.yyyy')}
                        invalid={((errs(1) || checkOutText.length >= 10) && !checkOutIso) || (!!checkInIso && !!checkOutIso && !datesValid)}
                      />
                    </View>
                    <TimeInput value={checkOutTime} onChange={setCheckOutTime} invalid={(errs(1) || checkOutTime.length >= 5) && !isTime(checkOutTime)} />
                  </View>
                </View>
                {!!checkInIso && !!checkOutIso && !datesValid ? (
                  <Text className="text-[11px] font-jost text-error">{L('Дата выезда должна быть позже даты заезда', 'Check-out must be after check-in')}</Text>
                ) : null}
              </View>

              {/* Rooms */}
              <View className="gap-3.5">
                <View className="flex-row items-center justify-between">
                  <SectionTitle>{L('Номера', 'Rooms')}</SectionTitle>
                  {avail.loading ? (
                    <View className="flex-row items-center gap-1.5">
                      <ActivityIndicator size="small" color={C.muted} />
                      <Text className="text-[11px] font-jost text-text-secondary">{L('Проверяем свободные', 'Checking availability')}</Text>
                    </View>
                  ) : avail.failed ? (
                    <Text className="text-[11px] font-jost text-error">{L('Не удалось проверить занятость', 'Could not check availability')}</Text>
                  ) : null}
                </View>

                <View>
                  <FieldLabel>{L('Категория номера', 'Room category')}</FieldLabel>
                  <Select
                    title={L('Категория номера', 'Room category')}
                    value={category}
                    options={categoryOptions}
                    placeholder={L('Выберите', 'Select')}
                    emptyText={L('Номера не загружены', 'No rooms loaded')}
                    onChange={(v) => {
                      setCategory(v);
                      const first = operationalRooms.find((r) => r.category === v && isFree(r.id));
                      setRoomId(first?.id ?? '');
                    }}
                  />
                </View>

                <View>
                  <FieldLabel>{L('№ комнаты', 'Room no.')}</FieldLabel>
                  <Select
                    title={L('№ комнаты', 'Room no.')}
                    value={roomId}
                    options={roomOptions}
                    placeholder={
                      roomOptions.length && roomOptions.every((o) => o.disabled)
                        ? L('Нет свободных номеров', 'No free rooms')
                        : L('Выберите номер', 'Select a room')
                    }
                    invalid={(errs(1) && !room) || (!!room && !isFree(room.id))}
                    emptyText={L('В категории нет номеров', 'No rooms in this category')}
                    onChange={setRoomId}
                  />
                  {room && !isFree(room.id) ? (
                    <Text className="text-[11px] font-jost text-error mt-1.5">{L('Номер занят на выбранные даты', 'The room is occupied on these dates')}</Text>
                  ) : null}
                </View>

                <View>
                  <FieldLabel>{L('Тариф', 'Rate')}</FieldLabel>
                  <Select title={L('Тариф', 'Rate')} value={tariffCode} options={tariffOptions} onChange={setTariffCode} />
                </View>

                <View>
                  <View className="flex-row gap-3">
                    <View className="flex-1">
                      <FieldLabel>{L('Взрослые', 'Adults')}</FieldLabel>
                      <Input
                        value={adultsText}
                        onChangeText={(t) => setAdultsText(digits(t, 2))}
                        keyboardType="number-pad"
                        invalid={errs(1) && adults < 1}
                      />
                    </View>
                    <View className="flex-1">
                      <FieldLabel>{L('Дети', 'Children')}</FieldLabel>
                      <Input value={childrenText} onChangeText={(t) => setChildrenText(digits(t, 2))} keyboardType="number-pad" />
                    </View>
                  </View>
                  <Text className="text-[11px] font-jost mt-2" style={{ color: overCapacity && !extraBedConfirmed ? C.error : C.muted }}>
                    {guestsText(totalGuests, lang)}
                    {room ? L(` · вместимость номера — ${guestsText(room.capacity, lang)}.`, ` · room capacity — ${guestsText(room.capacity, lang)}.`) : ''}
                    {extraBedConfirmed ? L(' Доп. место подтверждено.', ' Extra bed confirmed.') : ''}
                  </Text>
                </View>
              </View>

              {!isEdit && <Divider />}

              {/* Company & agent (set only when creating — the booking update has no such fields) */}
              {!isEdit && (
              <View className="gap-3.5 pb-2">
                <SectionTitle>{L('Компания и агент', 'Company & agent')}</SectionTitle>
                <View>
                  <FieldLabel>{L('Компания', 'Company')}</FieldLabel>
                  <Select
                    title={L('Компания', 'Company')}
                    value={companyId}
                    options={companyOptions}
                    onChange={(v) => {
                      setCompanyId(v);
                      if (!v) setDiscountText('0');
                    }}
                  />
                </View>
                <View>
                  <FieldLabel>{L('Скидка агента, %', 'Agent discount, %')}</FieldLabel>
                  <Input
                    tone={companyId ? 'white' : 'disabled'}
                    value={discountText}
                    onChangeText={(t) => setDiscountText(digits(t, 3))}
                    keyboardType="number-pad"
                    invalid={errs(1) && !!companyId && toInt(discountText) > 100}
                  />
                </View>
              </View>
              )}
            </>
          )}

          {step === 2 && (
            <View className="gap-4 pb-2">
              <View className="flex-row items-center justify-between">
                <SectionTitle>{L('Гости', 'Guests')}</SectionTitle>
                <Text className="text-[11px] font-jost text-text-secondary">{L(`Всего гостей: ${totalGuests}`, `Total guests: ${totalGuests}`)}</Text>
              </View>

              <GuestCard
                lang={lang}
                primary
                title={L('Основной гость', 'Main guest')}
                kindLabel={L('Взрослый', 'Adult')}
                guest={mainGuest}
                onChange={updateMain}
                showErrors={errs(2)}
                requireNames={!guestId}
                searchGuests={isEdit ? undefined : searchGuests}
                onPickFound={pickFound}
                linkedToBase={!isEdit && !!guestId}
                onUnlink={() => setGuestId(undefined)}
                sourceSlot={
                  <View className="gap-3">
                    <Text className="text-xs font-jost-medium text-text-primary">{L('Источник', 'Source')}</Text>
                    <View>
                      <FieldLabel>{L('Источник бронирования', 'Booking source')}</FieldLabel>
                      <Select title={L('Источник бронирования', 'Booking source')} tone="subtle" value={source} options={sourceOptions} onChange={setSource} />
                    </View>
                  </View>
                }
              />

              {!isEdit && Array.from({ length: otherGuestsCount }, (_, idx) => {
                const g = companions[idx] ?? emptyGuest();
                const isChild = idx >= Math.max(1, adults) - 1;
                return (
                  <GuestCard
                    key={idx}
                    lang={lang}
                    title={L(`Гость ${idx + 2}`, `Guest ${idx + 2}`)}
                    kindLabel={isChild ? L('Ребёнок', 'Child') : L('Взрослый', 'Adult')}
                    guest={g}
                    onChange={(patch) => updateCompanion(idx, patch)}
                    showErrors={errs(2)}
                    requireNames={!isGuestBlank(g)}
                  />
                );
              })}
            </View>
          )}

          {step === 3 && (
            <>
              <View className="gap-4">
                <SectionTitle>{L('Пожелания и примечания', 'Wishes & notes')}</SectionTitle>

                <View>
                  <FieldLabel>{L('Питание', 'Meals')}</FieldLabel>
                  <Select title={L('Питание', 'Meals')} value={mealPlan} options={mealOptions} onChange={setMealPlan} />
                </View>

                <View>
                  <FieldLabel className="mb-2">{L('Особые метки', 'Special marks')}</FieldLabel>
                  <View className="flex-row flex-wrap gap-2">
                    {SPECIAL_MARKS.filter((m) => !TIME_MARKS.includes(m.value)).map((m) => (
                      <Chip key={m.value} label={ru ? m.ru : m.en} selected={marks.includes(m.value)} onPress={() => toggleMark(m.value)} />
                    ))}
                  </View>
                  <View className="flex-row flex-wrap gap-2 mt-2">
                    {TIME_MARKS.map((value) => (
                      <Chip key={value} label={markLabel(value)} selected={marks.includes(value)} onPress={() => toggleMark(value)} />
                    ))}
                  </View>
                </View>

                <View>
                  <FieldLabel>{L('Особые пожелания', 'Special requests')}</FieldLabel>
                  <Input
                    value={specialRequests}
                    onChangeText={setSpecialRequests}
                    placeholder={L('Например, тихий номер или гипоаллергенная подушка', 'E.g. a quiet room or a hypoallergenic pillow')}
                    multiline
                    textAlignVertical="top"
                    minHeight={76}
                  />
                </View>

                <View className="flex-row">
                  <Chip label={L('Проживание с животными', 'Staying with pets')} selected={hasPets} onPress={() => setHasPets((v) => !v)} />
                </View>

                <View>
                  <FieldLabel>{L('Теги (через запятую)', 'Tags (comma-separated)')}</FieldLabel>
                  <Input value={tags} onChangeText={setTags} placeholder={L('VIP, с детьми...', 'VIP, with kids...')} />
                </View>

                <View>
                  <FieldLabel>{L('Примечания', 'Notes')}</FieldLabel>
                  <Input
                    value={notes}
                    onChangeText={setNotes}
                    placeholder={L('Дополнительная информация по брони', 'Additional booking information')}
                    multiline
                    textAlignVertical="top"
                    minHeight={76}
                  />
                </View>
              </View>

              <Divider />

              <ServicesSection
                lang={lang}
                catalog={services}
                selected={chosenServices}
                onAdd={(item) => setChosenServices((prev) => (prev.some((s) => s.code === item.code) ? prev : [...prev, item]))}
                onRemove={(code) => setChosenServices((prev) => prev.filter((s) => s.code !== code))}
              />
            </>
          )}

          {step === 4 && (
            <>
              <View className="gap-3">
                <SectionTitle>{L('Оплата', 'Payment')}</SectionTitle>
                <View className="bg-white rounded-[18px] p-4 gap-3.5" style={{ borderWidth: 1, borderColor: C.border }}>
                  <View>
                    <FieldLabel>{L('Сумма', 'Amount')}</FieldLabel>
                    <Input
                      value={customSum ?? String(calculatedTotal)}
                      onChangeText={(t) => setCustomSum(digits(t))}
                      keyboardType="number-pad"
                      suffix="₸"
                    />
                    {customNum !== null && customNum !== calculatedTotal ? (
                      <Pressable onPress={() => setCustomSum(null)} hitSlop={6} className="self-start mt-1.5 active:opacity-60">
                        <Text className="text-[11px] font-jost text-primary">
                          {L(`Своя сумма · вернуть расчёт ${money(calculatedTotal)}`, `Custom amount · reset to ${money(calculatedTotal)}`)}
                        </Text>
                      </Pressable>
                    ) : (
                      <Text className="text-[11px] font-jost text-text-secondary mt-1.5">
                        {L('Предварительный расчёт, итог по тарифу посчитает система', 'Estimate; the system calculates the final total by rate')}
                      </Text>
                    )}
                  </View>

                  <View>
                    <FieldLabel>{L('Предоплата', 'Prepayment')}</FieldLabel>
                    <Input
                      value={prepaymentText}
                      onChangeText={(t) => setPrepaymentText(digits(t))}
                      keyboardType="number-pad"
                      suffix="₸"
                      invalid={prepayment > Math.max(0, effectiveTotal - alreadyPaid)}
                    />
                  </View>

                  <Divider />

                  <View className="flex-row items-center justify-between py-0.5">
                    <Text className="text-xs font-jost text-text-secondary">{L('К доплате', 'Balance due')}</Text>
                    <Text className="text-[20px] font-jost-semibold text-primary">{money(remaining)}</Text>
                  </View>

                  <Divider />

                  <View>
                    <FieldLabel>{L('Счёт зачисления', 'Payment account')}</FieldLabel>
                    <Select
                      title={L('Счёт зачисления', 'Payment account')}
                      value={accountId}
                      options={accountOptions}
                      placeholder={L('Счета не загружены', 'No accounts loaded')}
                      emptyText={L('Счета не загружены', 'No accounts loaded')}
                      invalid={errs(4) && prepayment > 0 && !accountId}
                      onChange={setAccountId}
                    />
                  </View>

                  <View className="flex-row items-center justify-between pt-0.5">
                    <Text className="text-xs font-jost text-text-secondary">{L('Статус', 'Status')}</Text>
                    {paidInFull ? (
                      <View className="flex-row items-center gap-1.5">
                        <View className="h-2 w-2 rounded-full bg-[#15803D]" />
                        <Text className="text-xs font-jost-medium text-[#15803D]">{L('Оплачено', 'Paid')}</Text>
                      </View>
                    ) : prepayment > 0 ? (
                      <View className="flex-row items-center gap-1.5">
                        <View className="h-2 w-2 rounded-full bg-[#D97706]" />
                        <Text className="text-xs font-jost-medium text-[#B45309]">{L('Частично оплачено', 'Partially paid')}</Text>
                      </View>
                    ) : (
                      <View className="flex-row items-center gap-1.5">
                        <View className="h-2 w-2 rounded-full bg-[#C58B16]" />
                        <Text className="text-xs font-jost-medium text-[#9A6B11]">{L('Не оплачено', 'Unpaid')}</Text>
                      </View>
                    )}
                  </View>

                  <Pressable
                    onPress={() => setPrepaymentText(String(Math.max(0, effectiveTotal - alreadyPaid)))}
                    disabled={effectiveTotal - alreadyPaid <= 0}
                    className="w-full py-3.5 rounded-[14px] bg-primary items-center active:bg-primary-hover"
                    style={{ opacity: effectiveTotal - alreadyPaid <= 0 ? 0.5 : 1 }}
                  >
                    <Text className="text-xs font-jost-medium text-white">{paidInFull ? L('Оплачено ✓', 'Paid ✓') : L('Оплатить', 'Pay')}</Text>
                  </Pressable>
                  <Text className="text-[11px] font-jost text-text-secondary -mt-1.5">
                    {L('Оплата проводится при создании брони', 'The payment is posted when the booking is created')}
                  </Text>
                </View>
              </View>

              {!isEdit && (
              <View className="gap-2.5 pt-1 pb-2">
                <View className="flex-row items-center gap-2">
                  <SectionTitle>{L('Добавить в группу', 'Add to group')}</SectionTitle>
                  <SoonBadge lang={lang} />
                </View>
                <View>
                  <FieldLabel>{L('Существующая группа', 'Existing group')}</FieldLabel>
                  <Select
                    title={L('Существующая группа', 'Existing group')}
                    value="none"
                    options={[{ value: 'none', label: L('Без группы', 'No group') }]}
                    onChange={() => {}}
                    disabled
                  />
                  <Text className="text-[11px] font-jost text-text-secondary mt-1.5">
                    {L('Добавление в существующую группу скоро будет доступно', 'Adding to an existing group is coming soon')}
                  </Text>
                </View>
              </View>
              )}
            </>
          )}
        </ScrollView>

        {/* Sticky summary + navigation */}
        <View
          className="px-5 pt-3 bg-background"
          style={{ borderTopWidth: 1, borderTopColor: C.border, paddingBottom: insideTabs ? 16 : Math.max(16, insets.bottom + 8) }}
        >
          <View className="flex-row gap-2 mb-3">
            <View className="flex-1">
              <Text className="text-[10px] font-jost text-text-secondary">{L('Итого', 'Total')}</Text>
              <Text className="text-base font-jost-semibold text-text-primary" numberOfLines={1} adjustsFontSizeToFit>
                {money(effectiveTotal)}
              </Text>
            </View>
            <View className="flex-1">
              <Text className="text-[10px] font-jost text-text-secondary">{L('Предоплата', 'Prepayment')}</Text>
              <Text className="text-base font-jost-semibold text-text-primary" numberOfLines={1} adjustsFontSizeToFit>
                {money(alreadyPaid + prepayment)}
              </Text>
            </View>
            <View className="flex-1">
              <Text className="text-[10px] font-jost text-text-secondary" numberOfLines={1}>
                {L('К оплате при заезде', 'Due at check-in')}
              </Text>
              <Text className="text-base font-jost-semibold text-primary" numberOfLines={1} adjustsFontSizeToFit>
                {money(remaining)}
              </Text>
            </View>
          </View>

          <View className="flex-row items-center gap-2.5">
            <Pressable
              onPress={() => (step === 4 ? onCancel() : goBack())}
              disabled={saving}
              className="w-[34%] py-3.5 rounded-[14px] bg-white items-center active:bg-background-hover"
              style={{ borderWidth: 1, borderColor: C.border }}
            >
              <Text className="text-xs font-jost-medium text-text-primary">{step === 4 ? L('Отмена', 'Cancel') : L('Назад', 'Back')}</Text>
            </Pressable>
            <Pressable
              onPress={() => (step < 4 ? goTo(step + 1) : void submit())}
              disabled={saving}
              className="flex-1 py-3.5 rounded-[14px] bg-primary flex-row items-center justify-center gap-1.5 active:bg-primary-hover"
              style={{ opacity: saving ? 0.7 : 1 }}
            >
              {saving ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <>
                  <Text className="text-xs font-jost-medium text-white">{step < 4 ? L('Далее', 'Next') : isEdit ? L('Сохранить', 'Save') : L('Создать бронь', 'Create booking')}</Text>
                  {step < 4 ? <ChevronRight size={16} color="#FFFFFF" /> : null}
                </>
              )}
            </Pressable>
          </View>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

