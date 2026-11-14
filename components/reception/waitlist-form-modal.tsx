import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native';
import { EdgeInsets, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Calendar, Check, ChevronDown, ChevronLeft, Plus } from 'lucide-react-native';
import type { WaitlistEntry, WaitlistInput } from '@/context/reception-store';
import { type Lang, addDaysIso, dotsToIso, isoToDots } from '@/components/reception/booking-utils';
import { DatePickerOverlay, type DateRangeLink } from '@/components/ui/date-picker';

// Full-screen "Новая заявка" / "Изменить заявку" form (web design: ReceptionScreens.tsx →
// RECEPTION_WAITLIST → showCreateWaitlistModal). Dates are typed as ДД.ММ.ГГГГ.

export type WaitlistFormValues = Omit<WaitlistInput, 'priority' | 'status'>;

interface WaitlistFormModalProps {
  visible: boolean;
  lang: Lang;
  // null = new request
  entry: WaitlistEntry | null;
  categories: string[];
  todayIso: string;
  onClose: () => void;
  onSubmit: (values: WaitlistFormValues) => Promise<void>;
}

const INPUT_CLASS = 'bg-white border border-border rounded-[14px] px-3.5 py-3 text-[13px] font-jost text-text-primary';

function Label({ children }: { children: string }) {
  return <Text className="text-xs font-jost text-[#6E665E]">{children}</Text>;
}

function DateField({
  label,
  value,
  onChange,
  invalid,
  range,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  invalid: boolean;
  range?: DateRangeLink;
}) {
  return (
    <View className="flex-1 gap-1.5">
      <Label>{label}</Label>
      <DatePickerOverlay value={value} onChange={onChange} title={label} range={range}>
        <View
          className="bg-white rounded-[14px] px-3.5 flex-row items-center justify-between"
          style={{ borderWidth: 1, borderColor: invalid ? '#B3261E' : '#E5E2DD' }}
        >
          <Text className="flex-1 py-3 text-[13px] font-jost" style={{ color: value ? '#241E1A' : '#8A8177' }} numberOfLines={1}>
            {value || '06.11.2026'}
          </Text>
          <Calendar size={16} color="#241E1A" />
        </View>
      </DatePickerOverlay>
    </View>
  );
}

function CountField({ label, value, onChange, invalid }: { label: string; value: string; onChange: (v: string) => void; invalid?: boolean }) {
  return (
    <View className="flex-1 gap-1.5">
      <Label>{label}</Label>
      <TextInput
        value={value}
        onChangeText={(t) => onChange(t.replace(/\D/g, '').slice(0, 2))}
        keyboardType="number-pad"
        className={INPUT_CLASS}
        style={invalid ? { borderColor: '#B3261E' } : undefined}
      />
    </View>
  );
}

function CategoryField({ lang, value, options, onChange }: { lang: Lang; value: string; options: string[]; onChange: (v: string) => void }) {
  const [open, setOpen] = useState(false);
  const ru = lang === 'RU';
  return (
    <View className="flex-1 gap-1.5">
      <Label>{ru ? 'Категория *' : 'Category *'}</Label>
      <Pressable
        onPress={() => setOpen(true)}
        className="bg-white border border-border rounded-[14px] px-3.5 py-3 flex-row items-center justify-between gap-2 active:bg-background"
      >
        <Text className={`flex-1 text-[13px] font-jost ${value ? 'text-text-primary' : 'text-text-secondary'}`} numberOfLines={1}>
          {value || (ru ? 'Выберите' : 'Select')}
        </Text>
        <ChevronDown size={16} color="#241E1A" />
      </Pressable>

      <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
        <Pressable className="flex-1 bg-black/40 items-center justify-center p-6" onPress={() => setOpen(false)}>
          <Pressable className="bg-white rounded-[20px] w-full max-w-sm py-2 overflow-hidden" onPress={() => {}}>
            <Text className="px-4 pt-2 pb-2.5 text-base font-spectral text-text-primary">{ru ? 'Категория' : 'Category'}</Text>
            <ScrollView style={{ maxHeight: 360 }}>
              {options.length === 0 ? (
                <Text className="px-4 py-3 text-xs font-jost text-text-secondary">{ru ? 'Категории не загружены' : 'No categories loaded'}</Text>
              ) : (
                options.map((opt) => {
                  const active = opt === value;
                  return (
                    <Pressable
                      key={opt}
                      onPress={() => {
                        onChange(opt);
                        setOpen(false);
                      }}
                      className={`px-4 py-3 flex-row items-center justify-between border-t border-border-light ${active ? 'bg-background-subtle' : 'active:bg-background'}`}
                    >
                      <Text className={`text-sm ${active ? 'text-primary font-jost-semibold' : 'text-text-primary font-jost'}`}>{opt}</Text>
                      {active && <Check size={16} color="#C2410C" />}
                    </Pressable>
                  );
                })
              )}
            </ScrollView>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

function WaitlistForm({ lang, entry, categories, todayIso, onClose, onSubmit, insets }: Omit<WaitlistFormModalProps, 'visible'> & { insets: EdgeInsets }) {
  const ru = lang === 'RU';
  const [guestName, setGuestName] = useState(entry?.guestName === '—' ? '' : entry?.guestName ?? '');
  const [phone, setPhone] = useState(entry?.phone ?? '');
  const [checkInText, setCheckInText] = useState(isoToDots(entry?.checkIn || todayIso));
  const [checkOutText, setCheckOutText] = useState(isoToDots(entry?.checkOut || addDaysIso(todayIso, 1)));
  // Check-in / check-out are picked together in one calendar.
  const stayRange = {
    start: checkInText,
    end: checkOutText,
    onChange: (start: string, end: string) => {
      setCheckInText(start);
      setCheckOutText(end);
    },
  };
  const [adults, setAdults] = useState(String(entry?.adults ?? 2));
  const [children, setChildren] = useState(String(entry?.children ?? 0));
  const [category, setCategory] = useState(entry?.category ?? categories[0] ?? '');
  const [flexible, setFlexible] = useState(entry?.flexibleCategory ?? true);
  const [comment, setComment] = useState(entry?.comment ?? '');
  const [saving, setSaving] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const checkInIso = dotsToIso(checkInText);
  const checkOutIso = dotsToIso(checkOutText);
  const adultsNum = parseInt(adults || '0', 10);
  const childrenNum = parseInt(children || '0', 10);
  const categoryOptions = category && !categories.includes(category) ? [...categories, category] : categories;

  const validate = (): string | null => {
    if (!guestName.trim()) return ru ? 'Укажите имя и фамилию гостя' : 'Enter the guest name';
    if (!phone.trim()) return ru ? 'Укажите телефон' : 'Enter the phone number';
    if (!checkInIso || !checkOutIso) return ru ? 'Введите даты в формате ДД.ММ.ГГГГ' : 'Enter dates as DD.MM.YYYY';
    if (checkOutIso <= checkInIso) return ru ? 'Дата выезда должна быть позже даты заезда' : 'Check-out must be after check-in';
    if (!(adultsNum >= 1)) return ru ? 'Взрослых должно быть не меньше 1' : 'At least 1 adult is required';
    if (!category) return ru ? 'Выберите категорию' : 'Select a category';
    return null;
  };

  const submit = async () => {
    setSubmitted(true);
    const problem = validate();
    if (problem) {
      Alert.alert(ru ? 'Проверьте заявку' : 'Check the request', problem);
      return;
    }
    setSaving(true);
    try {
      await onSubmit({
        guestName: guestName.trim(),
        phone: phone.trim(),
        checkIn: checkInIso!,
        checkOut: checkOutIso!,
        adults: adultsNum,
        children: Number.isFinite(childrenNum) ? childrenNum : 0,
        category,
        flexibleCategory: flexible,
        comment: comment.trim(),
      });
    } catch (error) {
      Alert.alert(ru ? 'Ошибка' : 'Error', error instanceof Error ? error.message : String(error));
    } finally {
      setSaving(false);
    }
  };

  const datesInvalid = submitted && !!checkInIso && !!checkOutIso && checkOutIso <= checkInIso;

  return (
    // SafeAreaView reads zero insets inside a RN Modal, so the insets come from outside it.
    <View className="flex-1 bg-background" style={{ paddingTop: insets.top, paddingBottom: insets.bottom }}>
      <KeyboardAvoidingView className="flex-1" behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView className="flex-1" keyboardShouldPersistTaps="handled" contentContainerStyle={{ flexGrow: 1, paddingHorizontal: 20, paddingTop: 16, paddingBottom: 24 }}>
          {/* Back link */}
          <Pressable onPress={onClose} disabled={saving} hitSlop={8} className="flex-row items-center gap-1.5 self-start -ml-1 active:opacity-60">
            <ChevronLeft size={16} color="#241E1A" />
            <Text className="text-xs font-jost text-text-secondary">{ru ? 'Лист ожидания' : 'Waitlist'}</Text>
          </Pressable>

          {/* Title */}
          <View className="mt-2.5 mb-5">
            <Text className="text-[26px] font-spectral text-text-primary">
              {entry ? (ru ? 'Изменить заявку' : 'Edit Request') : ru ? 'Новая заявка' : 'New Request'}
            </Text>
            <Text className="text-xs font-jost text-text-secondary mt-1">
              {ru ? 'Пожелания гостя и даты размещения' : 'Guest preferences and stay dates'}
            </Text>
          </View>

          <View className="gap-4 flex-1">
            <View className="gap-1.5">
              <Label>{ru ? 'Имя и фамилия гостя *' : 'Guest full name *'}</Label>
              <TextInput
                value={guestName}
                onChangeText={setGuestName}
                placeholder={ru ? 'Например, Николай Карпов' : 'e.g., Nikolay Karpov'}
                placeholderTextColor="#8A8177"
                autoCapitalize="words"
                className={INPUT_CLASS}
                style={submitted && !guestName.trim() ? { borderColor: '#B3261E' } : undefined}
              />
            </View>

            <View className="gap-1.5">
              <Label>{ru ? 'Телефон *' : 'Phone *'}</Label>
              <TextInput
                value={phone}
                onChangeText={setPhone}
                placeholder="+7 (___) ___-__-__"
                placeholderTextColor="#8A8177"
                keyboardType="phone-pad"
                className={INPUT_CLASS}
                style={submitted && !phone.trim() ? { borderColor: '#B3261E' } : undefined}
              />
            </View>

            <View className="flex-row gap-2.5">
              <DateField
                label={ru ? 'Желаемый заезд *' : 'Desired check-in *'}
                value={checkInText}
                onChange={setCheckInText}
                range={{ role: 'start', ...stayRange }}
                invalid={(submitted || checkInText.length >= 10) && !checkInIso}
              />
              <DateField
                label={ru ? 'Выезд *' : 'Check-out *'}
                value={checkOutText}
                onChange={setCheckOutText}
                range={{ role: 'end', ...stayRange }}
                invalid={((submitted || checkOutText.length >= 10) && !checkOutIso) || datesInvalid}
              />
            </View>

            <View className="flex-row gap-2.5">
              <CountField label={ru ? 'Взрослых *' : 'Adults *'} value={adults} onChange={setAdults} invalid={submitted && !(adultsNum >= 1)} />
              <CountField label={ru ? 'Детей' : 'Children'} value={children} onChange={setChildren} />
            </View>

            <View className="flex-row">
              <CategoryField lang={lang} value={category} options={categoryOptions} onChange={setCategory} />
            </View>

            {/* Flexible category checkbox */}
            <Pressable onPress={() => setFlexible((v) => !v)} className="flex-row items-center gap-2.5 py-1 self-start active:opacity-70">
              <View
                className="h-5 w-5 rounded-[6px] items-center justify-center"
                style={{ borderWidth: 1, backgroundColor: flexible ? '#B93800' : '#FFFFFF', borderColor: flexible ? '#B93800' : '#CCC5BA' }}
              >
                {flexible && <Check size={14} color="#FFFFFF" strokeWidth={3} />}
              </View>
              <Text className="text-xs font-jost text-text-primary">{ru ? 'Открыт к другим категориям' : 'Open to other categories'}</Text>
            </Pressable>

            <View className="gap-1.5">
              <Label>{ru ? 'Комментарий' : 'Comment'}</Label>
              <TextInput
                value={comment}
                onChangeText={setComment}
                placeholder={ru ? 'Пожелания гостя...' : 'Guest wishes...'}
                placeholderTextColor="#8A8177"
                multiline
                textAlignVertical="top"
                className={INPUT_CLASS}
                style={{ minHeight: 76 }}
              />
            </View>

            <View className="pt-2 mt-auto">
              <Pressable
                onPress={submit}
                disabled={saving}
                className="w-full py-3.5 rounded-[14px] bg-[#B93800] flex-row items-center justify-center gap-2 active:bg-[#9E3000]"
                style={{ opacity: saving ? 0.7 : 1 }}
              >
                {saving ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <>
                    <Plus size={16} color="#FFFFFF" />
                    <Text className="text-xs font-jost-semibold text-white">
                      {entry ? (ru ? 'Сохранить заявку' : 'Save request') : ru ? 'Добавить заявку' : 'Add request'}
                    </Text>
                  </>
                )}
              </Pressable>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

export function WaitlistFormModal(props: WaitlistFormModalProps) {
  const { visible, onClose, entry } = props;
  const insets = useSafeAreaInsets();
  return (
    <Modal visible={visible} animationType="slide" presentationStyle="fullScreen" onRequestClose={onClose}>
      {/* Remount per opening so the fields start from the entry being edited (or blank). */}
      {visible && <WaitlistForm key={entry?.id ?? 'new'} {...props} insets={insets} />}
    </Modal>
  );
}
