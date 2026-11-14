import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  BackHandler,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Calendar, Check, ChevronDown, ChevronLeft, ChevronRight, Clock, X } from 'lucide-react-native';
import { DatePickerOverlay, type DateRangeLink } from '@/components/ui/date-picker';
import { useApp } from '@/context/app-store';
import { BOOKING_SOURCES, type GuestInput, type ReceptionRoom, nightsBetween, toIsoDate, useReception } from '@/context/reception-store';
import { type BookingPrefill, type Lang, addDaysIso, dotsToIso, isoToDots, nightsText, pluralRu } from '@/components/reception/booking-utils';

// Reception "Быстрая бронь" wizard, 3 steps (web design: ReceptionScreens.tsx →
// RECEPTION_CREATE → createBookingType === 'QUICK'). Walk-in guest, one room.
// Room occupancy comes from availableRoomIds(); the total shown here is room price × nights,
// the server prices the booking by tariff unless the sum was edited (manualTotal).

interface QuickBookingWizardProps {
  onCancel: () => void;
  onCreated: () => void;
  prefill?: BookingPrefill | null;
}

type Step = 1 | 2 | 3;

const money = (value: number) => `${Math.round(value).toLocaleString('ru-RU')} ₸`;
const isTime = (v: string) => /^([01]\d|2[0-3]):[0-5]\d$/.test(v.trim());
const digits = (v: string) => v.replace(/\D/g, '');

const ERROR_BORDER = '#B3261E';
const INPUT_CLASS = 'bg-white border border-border rounded-[14px] px-3.5 py-3 text-[13px] font-jost text-text-primary';

const DOC_TYPES: { value: string; ru: string; en: string }[] = [
  { value: 'Удостоверение личности', ru: 'Удостоверение личности', en: 'ID card' },
  { value: 'Паспорт', ru: 'Паспорт', en: 'Passport' },
  { value: 'Заграничный паспорт', ru: 'Заграничный паспорт', en: 'International passport' },
  { value: 'Вид на жительство', ru: 'Вид на жительство', en: 'Residence permit' },
];

// ── Small building blocks ────────────────────────────────────────────────────────

function Label({ children }: { children: string }) {
  return <Text className="text-xs font-jost text-[#6E675F] mb-1.5">{children}</Text>;
}

function SectionTitle({ children }: { children: string }) {
  return <Text className="text-xs font-jost-medium text-text-primary">{children}</Text>;
}

interface PickerOption {
  value: string;
  label: string;
}

// Design's <select>: a full-width field that opens a centred list.
function PickerField({
  title,
  value,
  options,
  placeholder,
  onChange,
  invalid,
  emptyText,
}: {
  title: string;
  value: string;
  options: PickerOption[];
  placeholder?: string;
  onChange: (value: string) => void;
  invalid?: boolean;
  emptyText?: string;
}) {
  const [open, setOpen] = useState(false);
  const current = options.find((o) => o.value === value);
  return (
    <>
      <Pressable
        onPress={() => setOpen(true)}
        className="bg-white rounded-[14px] px-3.5 py-3 flex-row items-center justify-between gap-2 active:bg-background"
        style={{ borderWidth: 1, borderColor: invalid ? '#C96B4B' : '#E5E2DD' }}
      >
        <Text className={`flex-1 text-[13px] font-jost ${current ? 'text-text-primary' : 'text-text-secondary'}`} numberOfLines={1}>
          {current?.label ?? placeholder ?? ''}
        </Text>
        <ChevronDown size={16} color="#241E1A" />
      </Pressable>

      <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
        <Pressable className="flex-1 bg-black/40 items-center justify-center p-6" onPress={() => setOpen(false)}>
          <Pressable className="bg-white rounded-[20px] w-full max-w-sm py-2 overflow-hidden" onPress={() => {}}>
            <Text className="px-4 pt-2 pb-2.5 text-base font-spectral text-text-primary">{title}</Text>
            <ScrollView style={{ maxHeight: 380 }}>
              {options.length === 0 ? (
                <Text className="px-4 py-3 text-xs font-jost text-text-secondary">{emptyText ?? '—'}</Text>
              ) : (
                options.map((opt) => {
                  const active = opt.value === value;
                  return (
                    <Pressable
                      key={opt.value}
                      onPress={() => {
                        onChange(opt.value);
                        setOpen(false);
                      }}
                      className={`px-4 py-3 flex-row items-center justify-between gap-2 border-t border-border-light ${active ? 'bg-background-subtle' : 'active:bg-background'}`}
                    >
                      <Text className={`flex-1 text-sm ${active ? 'text-primary font-jost-semibold' : 'text-text-primary font-jost'}`}>{opt.label}</Text>
                      {active && <Check size={16} color="#C2410C" />}
                    </Pressable>
                  );
                })
              )}
            </ScrollView>
          </Pressable>
        </Pressable>
      </Modal>
    </>
  );
}

function TextField({
  label,
  value,
  onChange,
  placeholder,
  invalid,
  keyboardType,
  autoCapitalize,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  invalid?: boolean;
  keyboardType?: 'default' | 'phone-pad' | 'number-pad';
  autoCapitalize?: 'none' | 'words' | 'sentences';
}) {
  return (
    <View>
      <Label>{label}</Label>
      <TextInput
        value={value}
        onChangeText={onChange}
        placeholder={placeholder}
        placeholderTextColor="#8A8177"
        keyboardType={keyboardType}
        autoCapitalize={autoCapitalize}
        className={INPUT_CLASS}
        style={invalid ? { borderColor: ERROR_BORDER } : undefined}
      />
    </View>
  );
}

// Field with a trailing icon or unit (date, time, ₸).
function AdornedInput({
  value,
  onChange,
  placeholder,
  trailing,
  invalid,
  keyboardType,
  maxLength,
  compact,
  date,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  trailing: React.ReactNode;
  invalid?: boolean;
  keyboardType?: 'numbers-and-punctuation' | 'number-pad';
  maxLength?: number;
  compact?: boolean;
  // Date field: a tap opens the system date picker (design: <input type="date">).
  date?: { title: string; birth?: boolean; range?: DateRangeLink };
}) {
  const field = (
    <View
      className={`bg-white flex-row items-center justify-between ${compact ? 'rounded-[12px] px-3' : 'rounded-[14px] px-3.5'}`}
      style={{ borderWidth: 1, borderColor: invalid ? ERROR_BORDER : '#E5E2DD' }}
    >
      <TextInput
        value={value}
        onChangeText={onChange}
        placeholder={placeholder}
        placeholderTextColor="#8A8177"
        keyboardType={keyboardType}
        maxLength={maxLength}
        className={`flex-1 font-jost text-text-primary ${compact ? 'py-2.5 text-xs' : 'py-3 text-[13px]'}`}
      />
      <View className="ml-1">{trailing}</View>
    </View>
  );
  if (!date) return field;
  return (
    <DatePickerOverlay value={value} onChange={onChange} birth={date.birth} title={date.title} range={date.range}>
      {field}
    </DatePickerOverlay>
  );
}

function InfoMark({ small }: { small?: boolean }) {
  const size = small ? 14 : 16;
  return (
    <View className="rounded-full items-center justify-center" style={{ width: size, height: size, borderWidth: 1, borderColor: '#B84A27' }}>
      <Text className="font-jost-semibold text-[#B84A27]" style={{ fontSize: small ? 9 : 10, lineHeight: small ? 11 : 12 }}>
        i
      </Text>
    </View>
  );
}

// ── Wizard ───────────────────────────────────────────────────────────────────────

export function QuickBookingWizard({ onCancel, onCreated, prefill }: QuickBookingWizardProps) {
  const { lang } = useApp();
  const ru = lang === 'RU';
  const { rooms, tariffs, paymentAccounts, availableRoomIds, createBooking } = useReception();

  const today = useMemo(() => toIsoDate(new Date()), []);
  const [step, setStep] = useState<Step>(1);
  const [submitted, setSubmitted] = useState<Record<Step, boolean>>({ 1: false, 2: false, 3: false });
  const [saving, setSaving] = useState(false);

  // Step 1: Размещение
  const [checkInText, setCheckInText] = useState(isoToDots(prefill?.checkIn ?? today));
  const [checkInTime, setCheckInTime] = useState('14:00');
  const [checkOutText, setCheckOutText] = useState(isoToDots(prefill?.checkOut ?? addDaysIso(today, 1)));
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
  const [category, setCategory] = useState(() => rooms.find((r) => r.id === prefill?.roomId)?.category ?? '');
  const [roomId, setRoomId] = useState(prefill?.roomId ?? '');
  // A room picked on the chessboard counts as chosen by hand.
  const [roomTouched, setRoomTouched] = useState(!!prefill?.roomId);
  const [adults, setAdults] = useState('1');
  const [children, setChildren] = useState('0');
  const [tariffCode, setTariffCode] = useState(''); // '' = «Тариф номера»

  // Step 2: Гость
  const [lastName, setLastName] = useState('');
  const [firstName, setFirstName] = useState('');
  const [middleName, setMiddleName] = useState('');
  const [phone, setPhone] = useState('');
  const [source, setSource] = useState('walk_in');
  const [docType, setDocType] = useState('');
  const [docNumber, setDocNumber] = useState('');
  const [birthText, setBirthText] = useState('');
  const [gender, setGender] = useState<'' | 'male' | 'female'>('');

  // Step 3: Оплата
  const [customSum, setCustomSum] = useState<string | null>(null);
  const [prepayment, setPrepayment] = useState('0');
  const [accountId, setAccountId] = useState('');
  const [isPaid, setIsPaid] = useState(false);

  // ── Derived: dates ──
  const checkInIso = dotsToIso(checkInText);
  const checkOutIso = dotsToIso(checkOutText);
  const datesOrdered = !!checkInIso && !!checkOutIso && checkOutIso > checkInIso;
  const nights = datesOrdered ? nightsBetween(checkInIso!, checkOutIso!) : 0;
  const nightsShown = Math.max(1, nights);

  const adultsNum = parseInt(adults || '0', 10) || 0;
  const childrenNum = parseInt(children || '0', 10) || 0;

  // ── Derived: rooms ──
  const bookableRooms = useMemo(() => rooms.filter((r) => r.isOperational), [rooms]);
  const categories = useMemo(() => {
    const seen = new Set<string>();
    const list: string[] = [];
    for (const r of bookableRooms) {
      if (!seen.has(r.category)) {
        seen.add(r.category);
        list.push(r.category);
      }
    }
    return list;
  }, [bookableRooms]);
  const roomsInCategory = useMemo(() => bookableRooms.filter((r) => r.category === category), [bookableRooms, category]);
  const room: ReceptionRoom | undefined = bookableRooms.find((r) => r.id === roomId);

  // Free rooms for the chosen dates (null = unknown / loading).
  const [freeIds, setFreeIds] = useState<Set<string> | null>(null);
  const [checking, setChecking] = useState(false);
  useEffect(() => {
    if (!datesOrdered) {
      setFreeIds(null);
      return;
    }
    let cancelled = false;
    setChecking(true);
    availableRoomIds(checkInIso!, checkOutIso!)
      .then((ids) => {
        if (!cancelled) setFreeIds(new Set(ids));
      })
      .catch(() => {
        if (!cancelled) setFreeIds(null);
      })
      .finally(() => {
        if (!cancelled) setChecking(false);
      });
    return () => {
      cancelled = true;
    };
  }, [availableRoomIds, checkInIso, checkOutIso, datesOrdered]);

  const isFree = (r: ReceptionRoom) => !freeIds || freeIds.has(r.id);
  const firstPreferred = (list: ReceptionRoom[]) => list.find(isFree) ?? list[0];

  // Initial category once rooms arrive.
  useEffect(() => {
    if (!category && categories.length) setCategory(categories[0]);
  }, [categories, category]);

  // Until the user picks a room by hand, keep a free room of the category selected.
  useEffect(() => {
    if (!roomsInCategory.length) return;
    const current = roomsInCategory.find((r) => r.id === roomId);
    if (!current || (!roomTouched && !isFree(current))) {
      const next = firstPreferred(roomsInCategory);
      if (next && next.id !== roomId) setRoomId(next.id);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roomsInCategory, freeIds, roomTouched]);

  // Default account: the cash desk if there is one.
  useEffect(() => {
    if (accountId || !paymentAccounts.length) return;
    const cash = paymentAccounts.find((a) => /касс|cash/i.test(a.name));
    setAccountId((cash ?? paymentAccounts[0]).id);
  }, [accountId, paymentAccounts]);

  const isRoomOccupied = !!room && !!freeIds && !freeIds.has(room.id);
  const isRoomDirty = !!room && !isRoomOccupied && room.cleanStatus === 'DIRTY';

  // ── Derived: money ──
  const calculatedTotal = (room?.pricePerNight ?? 0) * nightsShown;
  const customNum = customSum !== null && customSum !== '' ? parseInt(customSum, 10) : NaN;
  const effectiveTotal = Number.isFinite(customNum) ? Math.max(0, customNum) : calculatedTotal;
  const prepaymentNum = Math.max(0, parseInt(prepayment || '0', 10) || 0);
  const paidNow = isPaid ? effectiveTotal : prepaymentNum;
  const remaining = isPaid ? 0 : Math.max(0, effectiveTotal - prepaymentNum);
  const fullyPaid = isPaid || (effectiveTotal > 0 && remaining === 0);

  // ── Labels ──
  const stepTitles: Record<Step, string> = ru
    ? { 1: 'Размещение', 2: 'Гость', 3: 'Оплата' }
    : { 1: 'Accommodation', 2: 'Guest', 3: 'Payment' };
  const guestsLine = ru
    ? `Walk-in · ${adultsNum} ${pluralRu(adultsNum, 'взрослый', 'взрослых', 'взрослых')}` +
      (childrenNum > 0 ? ` + ${childrenNum} ${pluralRu(childrenNum, 'ребёнок', 'ребёнка', 'детей')}` : '') +
      ' / 1 номер'
    : `Walk-in · ${adultsNum} ${adultsNum === 1 ? 'adult' : 'adults'}` +
      (childrenNum > 0 ? ` + ${childrenNum} ${childrenNum === 1 ? 'child' : 'children'}` : '') +
      ' / 1 room';

  const roomOptions: PickerOption[] = roomsInCategory.map((r) => ({
    value: r.id,
    label:
      `№ ${r.number} · ${r.category} · ${r.capacity} ` +
      (ru ? pluralRu(r.capacity, 'гость', 'гостя', 'гостей') : r.capacity === 1 ? 'guest' : 'guests') +
      (freeIds && !freeIds.has(r.id) ? (ru ? ' · занят' : ' · occupied') : ''),
  }));
  const tariffOptions: PickerOption[] = [
    { value: '', label: ru ? 'Тариф номера' : 'Room rate' },
    ...tariffs.map((t) => ({ value: t.code, label: t.name })),
  ];
  const sourceOptions: PickerOption[] = BOOKING_SOURCES.map((s) => ({ value: s.value, label: ru ? s.ru : s.en }));
  const docOptions: PickerOption[] = DOC_TYPES.map((d) => ({ value: d.value, label: ru ? d.ru : d.en }));
  const genderOptions: PickerOption[] = [
    { value: 'male', label: ru ? 'Мужской' : 'Male' },
    { value: 'female', label: ru ? 'Женский' : 'Female' },
  ];
  const accountOptions: PickerOption[] = paymentAccounts.map((a) => ({ value: a.id, label: a.name }));

  // ── Validation ──
  const birthIso = birthText.trim() ? dotsToIso(birthText) : null;

  const problemOf = (s: Step): string | null => {
    if (s === 1) {
      if (!checkInIso || !checkOutIso) return ru ? 'Введите даты в формате ДД.ММ.ГГГГ' : 'Enter dates as DD.MM.YYYY';
      if (!datesOrdered) return ru ? 'Дата выезда должна быть позже даты заезда' : 'Check-out must be after check-in';
      if (!isTime(checkInTime) || !isTime(checkOutTime)) return ru ? 'Введите время в формате ЧЧ:ММ' : 'Enter time as HH:MM';
      if (!room) return ru ? 'Выберите номер' : 'Select a room';
      if (isRoomOccupied) return ru ? `№${room.number} занят — выберите свободный номер` : `#${room.number} is occupied — pick a free room`;
      if (adultsNum < 1) return ru ? 'Взрослых должно быть не меньше 1' : 'At least 1 adult is required';
      return null;
    }
    if (s === 2) {
      if (!lastName.trim() || !firstName.trim()) return ru ? 'Укажите фамилию и имя гостя' : 'Enter the guest last and first name';
      if (birthText.trim() && !birthIso) return ru ? 'Дата рождения — в формате ДД.ММ.ГГГГ' : 'Birth date must be DD.MM.YYYY';
      return null;
    }
    if (prepaymentNum > 0 && !accountId) return ru ? 'Выберите счёт зачисления' : 'Select the payment account';
    return null;
  };

  // Validates `from`..`to-1`; stops on the first failing step.
  const advanceTo = (target: Step) => {
    for (let s = step; s < target; s = (s + 1) as Step) {
      setSubmitted((prev) => ({ ...prev, [s]: true }));
      const problem = problemOf(s);
      if (problem) {
        setStep(s);
        Alert.alert(ru ? 'Проверьте данные' : 'Check the details', problem);
        return;
      }
    }
    setStep(target);
  };

  const goBack = () => {
    if (saving) return;
    if (step > 1) setStep((step - 1) as Step);
    else onCancel();
  };

  // Android back: previous step, then leave the wizard.
  useEffect(() => {
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      goBack();
      return true;
    });
    return () => sub.remove();
  });

  const create = async () => {
    for (const s of [1, 2, 3] as Step[]) {
      setSubmitted((prev) => ({ ...prev, [s]: true }));
      const problem = problemOf(s);
      if (problem) {
        setStep(s);
        Alert.alert(ru ? 'Проверьте данные' : 'Check the details', problem);
        return;
      }
    }
    const guest: GuestInput = {
      lastName: lastName.trim(),
      firstName: firstName.trim(),
      middleName,
      phone,
      birthDate: birthIso ?? undefined,
      gender: gender || undefined,
      documentType: docType || undefined,
      documentId: docNumber,
    };
    setSaving(true);
    try {
      await createBooking({
        kind: 'quick',
        roomId: room!.id,
        checkIn: checkInIso!,
        checkOut: checkOutIso!,
        checkInTime: checkInTime.trim(),
        checkOutTime: checkOutTime.trim(),
        adults: adultsNum,
        children: childrenNum,
        guest,
        source,
        tariffCode: tariffCode || undefined,
        paidAmount: paidNow > 0 ? paidNow : undefined,
        paymentAccountId: paidNow > 0 ? accountId : undefined,
        manualTotal: Number.isFinite(customNum) && customNum !== calculatedTotal ? Math.max(0, customNum) : undefined,
      });
      Alert.alert(ru ? 'Бронь создана' : 'Booking created', undefined, [{ text: 'OK', onPress: onCreated }], {
        cancelable: true,
        onDismiss: onCreated,
      });
    } catch (error) {
      Alert.alert(ru ? 'Ошибка' : 'Error', error instanceof Error ? error.message : String(error));
    } finally {
      setSaving(false);
    }
  };

  const s1 = submitted[1];
  const s2 = submitted[2];
  const checkInInvalid = (s1 || checkInText.length >= 10) && !checkInIso;
  const checkOutInvalid = ((s1 || checkOutText.length >= 10) && !checkOutIso) || (s1 && !!checkInIso && !!checkOutIso && !datesOrdered);

  return (
    <View className="flex-1 bg-background">
      {/* ── Header + 3-step progress ── */}
      <View className="px-5 pt-4 pb-3 border-b border-border bg-background">
        <View className="flex-row items-start justify-between">
          <View className="flex-row items-start gap-2.5 -ml-1">
            <Pressable onPress={goBack} hitSlop={8} className="mt-1 h-7 w-7 rounded-lg items-center justify-center active:bg-black/5">
              <ChevronLeft size={20} color="#241E1A" />
            </Pressable>
            <View>
              <Text className="text-[22px] font-spectral text-text-primary leading-tight">{ru ? 'Быстрая бронь' : 'Quick booking'}</Text>
              <Text className="text-xs font-jost text-text-secondary mt-0.5">{ru ? 'Заезд с ресепшн' : 'Walk-in from reception'}</Text>
            </View>
          </View>
          <Pressable
            onPress={() => !saving && onCancel()}
            hitSlop={8}
            className="mt-1 h-7 w-7 rounded-lg items-center justify-center active:bg-black/5"
          >
            <X size={20} color="#241E1A" strokeWidth={1.75} />
          </Pressable>
        </View>

        <View className="flex-row items-center justify-between mt-4 mb-2">
          <Text className="text-xs font-jost-medium text-text-primary">{stepTitles[step]}</Text>
          <Text className="text-xs font-jost text-text-secondary">{ru ? `Шаг ${step} из 3` : `Step ${step} of 3`}</Text>
        </View>
        <View className="flex-row gap-1.5">
          {([1, 2, 3] as Step[]).map((n) => (
            <Pressable
              key={n}
              hitSlop={{ top: 8, bottom: 8 }}
              onPress={() => (n < step ? setStep(n) : n > step ? advanceTo(n) : undefined)}
              className="flex-1 h-[3px] rounded-full"
              style={{ backgroundColor: n <= step ? '#C2410C' : '#E2DDD5' }}
            />
          ))}
        </View>
      </View>

      {/* ── Step body ── */}
      <KeyboardAvoidingView className="flex-1" behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView className="flex-1" keyboardShouldPersistTaps="handled" contentContainerStyle={{ paddingHorizontal: 20, paddingVertical: 16, gap: 20 }}>
          {step === 1 && (
            <>
              {/* Summary banner */}
              <View className="bg-[#EFECE6] rounded-[16px] p-4 flex-row items-center justify-between gap-3">
                <View className="flex-1">
                  <Text className="text-[20px] font-spectral text-text-primary leading-tight">{ru ? 'Быстрая бронь' : 'Quick booking'}</Text>
                  <Text className="text-xs font-jost text-text-secondary mt-1">{guestsLine}</Text>
                </View>
                <View className="px-3 py-1 rounded-full bg-dark">
                  <Text className="text-[11px] font-jost-medium text-white">{nightsText(nightsShown, lang as Lang)}</Text>
                </View>
              </View>

              {/* Даты проживания */}
              <View className="gap-2.5">
                <SectionTitle>{ru ? 'Даты проживания' : 'Stay dates'}</SectionTitle>
                <View className="bg-white rounded-[18px] border border-border p-3.5 gap-3">
                  <View className="flex-row items-center gap-2.5">
                    <Text className="w-12 text-xs font-jost-medium text-text-primary">{ru ? 'Заезд' : 'In'}</Text>
                    <View className="flex-1">
                      <AdornedInput
                        compact
                        date={{ title: ru ? 'Заезд' : 'Check-in', range: { role: 'start', ...stayRange } }}
                        value={checkInText}
                        onChange={setCheckInText}
                        placeholder={isoToDots(today)}
                        keyboardType="numbers-and-punctuation"
                        maxLength={10}
                        invalid={checkInInvalid}
                        trailing={<Calendar size={14} color="#241E1A" />}
                      />
                    </View>
                    <View className="w-[92px]">
                      <AdornedInput
                        compact
                        value={checkInTime}
                        onChange={setCheckInTime}
                        placeholder="14:00"
                        keyboardType="numbers-and-punctuation"
                        maxLength={5}
                        invalid={s1 && !isTime(checkInTime)}
                        trailing={<Clock size={14} color="#241E1A" />}
                      />
                    </View>
                  </View>

                  <View className="border-t border-border/70" />

                  <View className="flex-row items-center gap-2.5">
                    <Text className="w-12 text-xs font-jost-medium text-text-primary">{ru ? 'Выезд' : 'Out'}</Text>
                    <View className="flex-1">
                      <AdornedInput
                        compact
                        date={{ title: ru ? 'Выезд' : 'Check-out', range: { role: 'end', ...stayRange } }}
                        value={checkOutText}
                        onChange={setCheckOutText}
                        placeholder={isoToDots(addDaysIso(today, 1))}
                        keyboardType="numbers-and-punctuation"
                        maxLength={10}
                        invalid={checkOutInvalid}
                        trailing={<Calendar size={14} color="#241E1A" />}
                      />
                    </View>
                    <View className="w-[92px]">
                      <AdornedInput
                        compact
                        value={checkOutTime}
                        onChange={setCheckOutTime}
                        placeholder="12:00"
                        keyboardType="numbers-and-punctuation"
                        maxLength={5}
                        invalid={s1 && !isTime(checkOutTime)}
                        trailing={<Clock size={14} color="#241E1A" />}
                      />
                    </View>
                  </View>
                </View>
              </View>

              {/* Номера */}
              <View className="gap-3.5 pb-2">
                <View className="flex-row items-center justify-between">
                  <SectionTitle>{ru ? 'Номера' : 'Rooms'}</SectionTitle>
                  {checking && <ActivityIndicator size="small" color="#8A8177" />}
                </View>

                <View>
                  <Label>{ru ? 'Категория номера' : 'Room category'}</Label>
                  <PickerField
                    title={ru ? 'Категория номера' : 'Room category'}
                    value={category}
                    options={categories.map((c) => ({ value: c, label: c }))}
                    placeholder={ru ? 'Выбрать...' : 'Select...'}
                    emptyText={ru ? 'Номера не загружены' : 'No rooms loaded'}
                    onChange={(c) => {
                      setCategory(c);
                      setRoomTouched(false);
                      const next = firstPreferred(bookableRooms.filter((r) => r.category === c));
                      if (next) setRoomId(next.id);
                    }}
                  />
                </View>

                <View>
                  <Label>{ru ? '№ комнаты' : 'Room no.'}</Label>
                  <PickerField
                    title={ru ? '№ комнаты' : 'Room no.'}
                    value={roomId}
                    options={roomOptions}
                    placeholder={ru ? 'Выбрать...' : 'Select...'}
                    emptyText={ru ? 'Нет номеров в категории' : 'No rooms in this category'}
                    invalid={isRoomOccupied || (s1 && !room)}
                    onChange={(id) => {
                      setRoomId(id);
                      setRoomTouched(true);
                    }}
                  />
                </View>

                {(isRoomOccupied || isRoomDirty) && (
                  <View className="bg-[#FBECE6] border border-[#E8C5B8] rounded-[14px] p-3.5 flex-row items-start gap-2.5">
                    <View className="mt-0.5">
                      <InfoMark />
                    </View>
                    <View className="flex-1">
                      <Text className="text-xs font-jost-semibold text-[#B84A27]">
                        {ru
                          ? `Номер не готов к заселению: ${isRoomOccupied ? 'Занят' : 'Не убран'}.`
                          : `Room is not ready for check-in: ${isRoomOccupied ? 'Occupied' : 'Not cleaned'}.`}
                      </Text>
                      <Text className="text-xs font-jost text-[#8A756A] mt-0.5">
                        {isRoomOccupied
                          ? ru
                            ? 'Выберите свободный номер для заезда.'
                            : 'Pick a free room for check-in.'
                          : ru
                            ? 'Номер свободен, но ещё не убран.'
                            : 'The room is free but not cleaned yet.'}
                      </Text>
                    </View>
                  </View>
                )}

                <View className="flex-row gap-3">
                  <View className="flex-1">
                    <TextField
                      label={ru ? 'Взрослые' : 'Adults'}
                      value={adults}
                      onChange={(t) => setAdults(digits(t).slice(0, 2))}
                      keyboardType="number-pad"
                      invalid={s1 && adultsNum < 1}
                    />
                  </View>
                  <View className="flex-1">
                    <TextField
                      label={ru ? 'Дети' : 'Children'}
                      value={children}
                      onChange={(t) => setChildren(digits(t).slice(0, 2))}
                      keyboardType="number-pad"
                    />
                  </View>
                </View>

                <View>
                  <Label>{ru ? 'Тариф' : 'Rate'}</Label>
                  <PickerField title={ru ? 'Тариф' : 'Rate'} value={tariffCode} options={tariffOptions} onChange={setTariffCode} />
                </View>
              </View>
            </>
          )}

          {step === 2 && (
            <>
              <View className="gap-3.5">
                <SectionTitle>{ru ? 'Контакты' : 'Contacts'}</SectionTitle>
                <TextField
                  label={ru ? 'Фамилия' : 'Last name'}
                  value={lastName}
                  onChange={setLastName}
                  placeholder={ru ? 'Фамилия гостя' : 'Guest last name'}
                  autoCapitalize="words"
                  invalid={s2 && !lastName.trim()}
                />
                <View className="flex-row gap-3">
                  <View className="flex-1">
                    <TextField
                      label={ru ? 'Имя' : 'First name'}
                      value={firstName}
                      onChange={setFirstName}
                      placeholder={ru ? 'Имя' : 'First name'}
                      autoCapitalize="words"
                      invalid={s2 && !firstName.trim()}
                    />
                  </View>
                  <View className="flex-1">
                    <TextField
                      label={ru ? 'Отчество' : 'Middle name'}
                      value={middleName}
                      onChange={setMiddleName}
                      placeholder={ru ? 'Отчество' : 'Middle name'}
                      autoCapitalize="words"
                    />
                  </View>
                </View>
                <TextField
                  label={ru ? 'Телефон' : 'Phone'}
                  value={phone}
                  onChange={setPhone}
                  placeholder="+7 (XXX) XXX XX XX"
                  keyboardType="phone-pad"
                />
                <View>
                  <Label>{ru ? 'Источник' : 'Source'}</Label>
                  <PickerField title={ru ? 'Источник' : 'Source'} value={source} options={sourceOptions} onChange={setSource} />
                </View>
              </View>

              <View className="gap-3.5 pt-2 pb-2">
                <SectionTitle>{ru ? 'Документы и личные данные' : 'Documents and personal data'}</SectionTitle>
                <View>
                  <Label>{ru ? 'Тип документа' : 'Document type'}</Label>
                  <PickerField
                    title={ru ? 'Тип документа' : 'Document type'}
                    value={docType}
                    options={docOptions}
                    placeholder={ru ? 'Выбрать...' : 'Select...'}
                    onChange={setDocType}
                  />
                </View>
                <TextField
                  label={ru ? 'Номер документа' : 'Document number'}
                  value={docNumber}
                  onChange={setDocNumber}
                  placeholder={ru ? 'Номер документа' : 'Document number'}
                  autoCapitalize="none"
                />
                <View>
                  <Label>{ru ? 'Дата рождения' : 'Date of birth'}</Label>
                  <AdornedInput
                    date={{ title: ru ? 'Дата рождения' : 'Date of birth', birth: true }}
                    value={birthText}
                    onChange={setBirthText}
                    placeholder={ru ? 'дд.мм.гггг' : 'dd.mm.yyyy'}
                    keyboardType="numbers-and-punctuation"
                    maxLength={10}
                    invalid={(s2 || birthText.length >= 10) && !!birthText.trim() && !birthIso}
                    trailing={<Calendar size={16} color="#241E1A" />}
                  />
                </View>
                <View>
                  <Label>{ru ? 'Пол' : 'Gender'}</Label>
                  <PickerField
                    title={ru ? 'Пол' : 'Gender'}
                    value={gender}
                    options={genderOptions}
                    placeholder={ru ? 'Выбрать...' : 'Select...'}
                    onChange={(v) => setGender(v as 'male' | 'female')}
                  />
                </View>
              </View>
            </>
          )}

          {step === 3 && (
            <View className="gap-3 pb-2">
              <SectionTitle>{ru ? 'Оплата' : 'Payment'}</SectionTitle>
              <View className="bg-white rounded-[18px] border border-border p-4 gap-3.5">
                <View>
                  <Label>{ru ? 'Сумма' : 'Amount'}</Label>
                  <AdornedInput
                    value={customSum !== null ? customSum : String(calculatedTotal)}
                    onChange={(t) => {
                      setCustomSum(digits(t));
                      setIsPaid(false);
                    }}
                    keyboardType="number-pad"
                    trailing={<Text className="text-xs font-jost text-text-secondary ml-1">₸</Text>}
                  />
                </View>

                <View>
                  <Label>{ru ? 'Предоплата' : 'Prepayment'}</Label>
                  <AdornedInput
                    value={prepayment}
                    onChange={(t) => {
                      setPrepayment(digits(t));
                      setIsPaid(false);
                    }}
                    keyboardType="number-pad"
                    trailing={<Text className="text-xs font-jost text-text-secondary ml-1">₸</Text>}
                  />
                </View>

                <View className="border-t border-border/80" />

                <View className="flex-row items-center justify-between py-0.5">
                  <Text className="text-xs font-jost text-text-secondary">{ru ? 'К доплате' : 'Balance due'}</Text>
                  <Text className="text-[20px] font-jost-semibold text-primary">{money(remaining)}</Text>
                </View>

                <View className="border-t border-border/80" />

                <View>
                  <Label>{ru ? 'Счёт зачисления' : 'Deposit account'}</Label>
                  <PickerField
                    title={ru ? 'Счёт зачисления' : 'Deposit account'}
                    value={accountId}
                    options={accountOptions}
                    placeholder={ru ? 'Выбрать...' : 'Select...'}
                    emptyText={ru ? 'Счета не загружены' : 'No accounts loaded'}
                    invalid={submitted[3] && prepaymentNum > 0 && !accountId}
                    onChange={setAccountId}
                  />
                </View>

                <View className="flex-row items-center justify-between pt-0.5">
                  <Text className="text-xs font-jost text-text-secondary">{ru ? 'Статус' : 'Status'}</Text>
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
                      <Text className="text-xs font-jost-medium text-[#9A6B11]">{ru ? 'Не оплачено' : 'Unpaid'}</Text>
                    </View>
                  )}
                </View>

                {/* Marks the whole sum as paid now; the payment itself is posted with the booking. */}
                <Pressable
                  onPress={() => {
                    setIsPaid(true);
                    setPrepayment(String(effectiveTotal));
                  }}
                  className="w-full py-3.5 rounded-[14px] bg-primary items-center active:bg-primary-hover"
                >
                  <Text className="text-xs font-jost-medium text-white">
                    {fullyPaid ? (ru ? 'Оплачено ✓' : 'Paid ✓') : ru ? 'Оплатить' : 'Pay'}
                  </Text>
                </Pressable>
              </View>
            </View>
          )}
        </ScrollView>

        {/* ── Sticky summary + navigation ── */}
        <View className="px-5 pt-3 pb-4 border-t border-border bg-background">
          <View className="flex-row gap-2 mb-2.5">
            <View className="flex-1">
              <Text className="text-[10px] font-jost text-text-secondary">{ru ? 'Итого' : 'Total'}</Text>
              <Text className="text-base font-jost-semibold text-text-primary" numberOfLines={1} adjustsFontSizeToFit>
                {money(effectiveTotal)}
              </Text>
            </View>
            <View className="flex-1">
              <Text className="text-[10px] font-jost text-text-secondary">{ru ? 'Предоплата' : 'Prepayment'}</Text>
              <Text className="text-base font-jost-semibold text-text-primary" numberOfLines={1} adjustsFontSizeToFit>
                {money(paidNow)}
              </Text>
            </View>
            <View className="flex-1">
              <Text className="text-[10px] font-jost text-text-secondary" numberOfLines={1}>
                {ru ? 'К оплате при заезде' : 'Due at check-in'}
              </Text>
              <Text className="text-base font-jost-semibold text-primary" numberOfLines={1} adjustsFontSizeToFit>
                {money(remaining)}
              </Text>
            </View>
          </View>

          {step === 1 && isRoomOccupied && room && (
            <View className="flex-row items-center gap-1.5 mb-2.5">
              <InfoMark small />
              <Text className="text-[11px] font-jost text-[#B84A27]">
                {ru ? `№${room.number} занят — выберите свободный номер` : `#${room.number} is occupied — pick a free room`}
              </Text>
            </View>
          )}

          <View className="flex-row items-center gap-2.5">
            <Pressable
              onPress={() => (step === 3 ? !saving && onCancel() : goBack())}
              disabled={saving}
              className="w-[34%] py-3.5 rounded-[14px] bg-white border border-border items-center active:bg-background"
            >
              <Text className="text-xs font-jost-medium text-text-primary">
                {step === 3 ? (ru ? 'Отмена' : 'Cancel') : ru ? 'Назад' : 'Back'}
              </Text>
            </Pressable>
            <Pressable
              onPress={() => (step < 3 ? advanceTo((step + 1) as Step) : create())}
              disabled={saving}
              className="flex-1 py-3.5 rounded-[14px] flex-row items-center justify-center gap-1.5"
              style={{ backgroundColor: step === 1 && isRoomOccupied ? '#DF9A84' : '#C2410C', opacity: saving ? 0.7 : 1 }}
            >
              {saving ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <>
                  <Text className="text-xs font-jost-medium text-white">
                    {step < 3 ? (ru ? 'Далее' : 'Next') : ru ? 'Создать бронь' : 'Create booking'}
                  </Text>
                  {step < 3 && <ChevronRight size={16} color="#FFFFFF" />}
                </>
              )}
            </Pressable>
          </View>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}
