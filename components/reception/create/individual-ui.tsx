import React, { useState } from 'react';
import { Modal, Pressable, ScrollView, Text, TextInput, type TextInputProps, View } from 'react-native';
import { Calendar, Check, ChevronDown, Clock } from 'lucide-react-native';
import { DatePickerOverlay, type DateRangeLink } from '@/components/ui/date-picker';

// Small building blocks for the "Индивидуальная бронь" wizard (web design:
// ReceptionScreens.tsx → createBookingType === 'INDIVIDUAL'). Colours are the design's.

export const C = {
  text: '#241E1A',
  muted: '#8A8177',
  label: '#6E675F',
  border: '#E5E2DD',
  accent: '#C2410C',
  error: '#B3261E',
  subtle: '#FAF7F3',
};

// "12 500 ₸" (ru-RU grouping without relying on Intl).
export function money(value: number) {
  const n = Math.round(Number.isFinite(value) ? value : 0);
  const sign = n < 0 ? '-' : '';
  return `${sign}${String(Math.abs(n)).replace(/\B(?=(\d{3})+(?!\d))/g, ' ')} ₸`;
}

export const isTime = (value: string) => /^([01]\d|2[0-3]):[0-5]\d$/.test(value.trim());

export function FieldLabel({ children, className }: { children: string; className?: string }) {
  return <Text className={`text-xs font-jost text-[#6E675F] mb-1.5 ${className ?? ''}`}>{children}</Text>;
}

export function SectionTitle({ children }: { children: string }) {
  return <Text className="text-xs font-jost-medium text-text-primary">{children}</Text>;
}

export function Divider({ soft }: { soft?: boolean }) {
  return <View style={{ height: 1, backgroundColor: soft ? 'rgba(229,226,221,0.7)' : C.border }} />;
}

type Tone = 'white' | 'subtle' | 'disabled';
const toneBg = (tone: Tone) => (tone === 'subtle' ? C.subtle : tone === 'disabled' ? '#EFECE6' : '#FFFFFF');

interface InputProps extends Omit<TextInputProps, 'style'> {
  tone?: Tone;
  invalid?: boolean;
  suffix?: string;
  minHeight?: number;
}

// Text input styled like the design's `rounded-[14px] px-3.5 py-3 text-xs` fields.
export function Input({ tone = 'white', invalid, suffix, minHeight, editable, ...rest }: InputProps) {
  const disabled = tone === 'disabled' || editable === false;
  return (
    <View
      className="rounded-[14px] px-3.5 flex-row items-center"
      style={{ backgroundColor: toneBg(tone), borderWidth: 1, borderColor: invalid ? C.error : C.border, minHeight }}
    >
      <TextInput
        placeholderTextColor={C.muted}
        editable={!disabled}
        {...rest}
        className="flex-1 py-3 text-xs font-jost"
        style={{ color: disabled ? C.muted : C.text, minHeight: minHeight ? minHeight - 2 : undefined }}
      />
      {suffix ? <Text className="text-xs font-jost text-text-secondary ml-2">{suffix}</Text> : null}
    </View>
  );
}

// ДД.ММ.ГГГГ field with a calendar icon; a tap opens the system date picker (design: <input type="date">).
export function DateInput({
  value,
  onChange,
  invalid,
  tone = 'white',
  compact,
  placeholder = 'дд.мм.гггг',
  birth,
  title,
  range,
}: {
  value: string;
  onChange: (v: string) => void;
  invalid?: boolean;
  tone?: Tone;
  compact?: boolean;
  placeholder?: string;
  birth?: boolean;
  title?: string;
  range?: DateRangeLink;
}) {
  return (
    <DatePickerOverlay value={value} onChange={onChange} birth={birth} title={title} range={range}>
      <View
        className={`flex-row items-center ${compact ? 'rounded-[12px] px-3' : 'rounded-[14px] px-3.5'}`}
        style={{ backgroundColor: toneBg(tone), borderWidth: 1, borderColor: invalid ? C.error : C.border }}
      >
        <Text
          className={`flex-1 ${compact ? 'py-2.5' : 'py-3'} text-xs font-jost`}
          style={{ color: value ? C.text : C.muted }}
          numberOfLines={1}
        >
          {value || placeholder}
        </Text>
        <Calendar size={compact ? 14 : 16} color={C.text} />
      </View>
    </DatePickerOverlay>
  );
}

export function TimeInput({ value, onChange, invalid }: { value: string; onChange: (v: string) => void; invalid?: boolean }) {
  return (
    <View
      className="w-[92px] bg-white rounded-[12px] px-3 flex-row items-center"
      style={{ borderWidth: 1, borderColor: invalid ? C.error : C.border }}
    >
      <TextInput
        value={value}
        onChangeText={onChange}
        placeholder="14:00"
        placeholderTextColor={C.muted}
        keyboardType="numbers-and-punctuation"
        maxLength={5}
        className="flex-1 py-2.5 text-xs font-jost text-text-primary"
      />
      <Clock size={14} color={C.text} />
    </View>
  );
}

export interface PickOption {
  value: string;
  label: string;
  hint?: string;
  disabled?: boolean;
}

// Native stand-in for the design's <select>: a field that opens a centred option list.
export function Select({
  title,
  value,
  options,
  onChange,
  placeholder,
  tone = 'white',
  invalid,
  disabled,
  emptyText,
  compact,
}: {
  title: string;
  value: string;
  options: PickOption[];
  onChange: (v: string) => void;
  placeholder?: string;
  tone?: Tone;
  invalid?: boolean;
  disabled?: boolean;
  emptyText?: string;
  compact?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const current = options.find((o) => o.value === value);
  const label = current?.label ?? placeholder ?? '';
  return (
    <>
      <Pressable
        onPress={() => !disabled && setOpen(true)}
        className={`flex-row items-center justify-between gap-2 ${compact ? 'rounded-[12px] px-3 py-2.5' : 'rounded-[14px] px-3.5 py-3'} ${disabled ? '' : 'active:opacity-70'}`}
        style={{
          backgroundColor: disabled ? '#EFECE6' : toneBg(tone),
          borderWidth: 1,
          borderColor: invalid ? C.error : C.border,
        }}
      >
        <Text
          className="flex-1 text-xs font-jost"
          style={{ color: disabled || !current ? C.muted : C.text }}
          numberOfLines={1}
        >
          {label}
        </Text>
        <ChevronDown size={16} color={disabled ? C.muted : C.text} />
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
                      key={opt.value || '__empty'}
                      disabled={opt.disabled}
                      onPress={() => {
                        onChange(opt.value);
                        setOpen(false);
                      }}
                      className={`px-4 py-3 flex-row items-center justify-between gap-3 border-t border-border-light ${active ? 'bg-background-subtle' : 'active:bg-background'}`}
                      style={{ opacity: opt.disabled ? 0.45 : 1 }}
                    >
                      <View className="flex-1">
                        <Text className={`text-sm ${active ? 'text-primary font-jost-semibold' : 'text-text-primary font-jost'}`}>{opt.label}</Text>
                        {opt.hint ? <Text className="text-[11px] font-jost text-text-secondary mt-0.5">{opt.hint}</Text> : null}
                      </View>
                      {active && <Check size={16} color={C.accent} />}
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

// Rounded toggle chip (special marks, pets).
export function Chip({ label, selected, onPress, extra }: { label: string; selected: boolean; onPress: () => void; extra?: string }) {
  return (
    <Pressable
      onPress={onPress}
      className="px-3.5 py-2 rounded-full flex-row items-center gap-2 active:opacity-70"
      style={{
        borderWidth: 1,
        backgroundColor: selected ? 'rgba(194,65,12,0.1)' : '#F5F1EB',
        borderColor: selected ? C.accent : '#E2DAD0',
      }}
    >
      <Text className={`text-xs ${selected ? 'font-jost-medium' : 'font-jost'}`} style={{ color: selected ? C.accent : '#5C544C' }}>
        {label}
      </Text>
      {extra ? (
        <>
          <View style={{ width: 1, height: 12, backgroundColor: selected ? 'rgba(194,65,12,0.4)' : '#D2C9BD' }} />
          <Text className={`text-xs ${selected ? 'font-jost-medium' : 'font-jost'}`} style={{ color: selected ? C.accent : '#5C544C' }}>
            {extra}
          </Text>
        </>
      ) : null}
    </Pressable>
  );
}

export function SoonBadge({ lang }: { lang: 'RU' | 'EN' }) {
  return (
    <View className="px-2 py-0.5 rounded-full bg-[#EFECE6]">
      <Text className="text-[10px] font-jost-medium text-text-secondary">{lang === 'RU' ? 'Скоро' : 'Soon'}</Text>
    </View>
  );
}
