import React, { useState } from 'react';
import { Modal, Pressable, ScrollView, Text, TextInput, View, type KeyboardTypeOptions } from 'react-native';
import { Calendar, Check, ChevronDown, Clock } from 'lucide-react-native';
import { DatePickerOverlay, type DateRangeLink } from '@/components/ui/date-picker';

// Small form pieces shared by the group booking wizard (web design: ReceptionScreens.tsx →
// createBookingType === 'GROUP'). Sizes and colours follow the design 1:1.

export const money = (value: number) => `${Math.round(value).toLocaleString('ru-RU')} ₸`;

export const digitsOnly = (value: string, maxLength = 9) => value.replace(/\D/g, '').slice(0, maxLength);

export const INPUT_CLASS = 'bg-white border border-[#E5E2DD] rounded-[14px] px-3.5 py-3 text-xs font-jost text-[#241E1A]';
export const INPUT_SM_CLASS = 'bg-white border border-[#E5E2DD] rounded-[12px] px-3 py-2.5 text-xs font-jost text-[#241E1A]';
export const ERROR_BORDER = { borderColor: '#B3261E' };

export function FieldLabel({ children, small }: { children: string; small?: boolean }) {
  return <Text className={`text-xs font-jost text-[#6E675F] ${small ? 'mb-1' : 'mb-1.5'}`}>{children}</Text>;
}

export function SectionTitle({ children }: { children: string }) {
  return <Text className="text-xs font-jost-medium text-[#241E1A]">{children}</Text>;
}

interface TextFieldProps {
  label?: string;
  value: string;
  onChangeText: (v: string) => void;
  placeholder?: string;
  keyboardType?: KeyboardTypeOptions;
  autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters';
  invalid?: boolean;
  small?: boolean;
  editable?: boolean;
  suffix?: string;
  multiline?: boolean;
  className?: string;
}

export function TextField({
  label,
  value,
  onChangeText,
  placeholder,
  keyboardType,
  autoCapitalize,
  invalid,
  small,
  editable = true,
  suffix,
  multiline,
  className,
}: TextFieldProps) {
  const box = small ? INPUT_SM_CLASS : INPUT_CLASS;
  return (
    <View className={className}>
      {label ? <FieldLabel small={small}>{label}</FieldLabel> : null}
      {suffix ? (
        <View
          className={`${small ? 'rounded-[12px] px-3' : 'rounded-[14px] px-3.5'} flex-row items-center justify-between`}
          style={{ borderWidth: 1, borderColor: invalid ? '#B3261E' : '#E5E2DD', backgroundColor: editable ? '#FFFFFF' : '#F5F2EC' }}
        >
          <TextInput
            value={value}
            onChangeText={onChangeText}
            placeholder={placeholder}
            placeholderTextColor="#8A8177"
            keyboardType={keyboardType}
            editable={editable}
            className={`flex-1 ${small ? 'py-2.5' : 'py-3'} text-xs font-jost text-[#241E1A]`}
          />
          <Text className="text-xs font-jost text-[#8A8177] ml-2">{suffix}</Text>
        </View>
      ) : (
        <TextInput
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor="#8A8177"
          keyboardType={keyboardType}
          autoCapitalize={autoCapitalize}
          editable={editable}
          multiline={multiline}
          textAlignVertical={multiline ? 'top' : undefined}
          className={box}
          style={[
            invalid ? ERROR_BORDER : null,
            !editable ? { backgroundColor: '#F5F2EC', color: '#8A8177' } : null,
            multiline ? { minHeight: 96 } : null,
          ]}
        />
      )}
    </View>
  );
}

// Date (ДД.ММ.ГГГГ, picked in the system date picker like the design's <input type="date">)
// or time (ЧЧ:ММ, typed by hand).
export function IconInput({
  value,
  onChangeText,
  placeholder,
  icon,
  invalid,
  small,
  className,
  birth,
  title,
  range,
}: {
  value: string;
  onChangeText: (v: string) => void;
  placeholder: string;
  icon: 'calendar' | 'clock';
  invalid?: boolean;
  small?: boolean;
  className?: string;
  birth?: boolean;
  title?: string;
  range?: DateRangeLink;
}) {
  const Icon = icon === 'calendar' ? Calendar : Clock;
  const field = (
    <View
      // For dates the layout class goes on the picker wrapper (a flex-1 child of it would collapse).
      className={`bg-white rounded-[12px] px-3 flex-row items-center justify-between ${icon === 'calendar' ? '' : (className ?? '')}`}
      style={{ borderWidth: 1, borderColor: invalid ? '#B3261E' : '#E5E2DD' }}
    >
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={small ? '#241E1A' : '#8A8177'}
        keyboardType="numbers-and-punctuation"
        maxLength={icon === 'calendar' ? 10 : 5}
        className="flex-1 py-2.5 text-xs font-jost text-[#241E1A]"
      />
      <Icon size={14} color="#241E1A" style={{ marginLeft: 4 }} />
    </View>
  );
  if (icon !== 'calendar') return field;
  return (
    <DatePickerOverlay value={value} onChange={onChangeText} birth={birth} title={title} range={range} className={className}>
      {field}
    </DatePickerOverlay>
  );
}

export interface PickerOption {
  value: string;
  label: string;
  hint?: string;
}

// Native stand-in for the design's <select>: a field that opens a centred list.
export function PickerField({
  label,
  title,
  value,
  options,
  onChange,
  placeholder,
  small,
  emptyText,
  disabled,
  className,
}: {
  label?: string;
  title: string;
  value: string;
  options: PickerOption[];
  onChange: (v: string) => void;
  placeholder?: string;
  small?: boolean;
  emptyText?: string;
  disabled?: boolean;
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const current = options.find((o) => o.value === value);
  return (
    <View className={className}>
      {label ? <FieldLabel small={small}>{label}</FieldLabel> : null}
      <Pressable
        onPress={() => !disabled && setOpen(true)}
        className={`border border-[#E5E2DD] flex-row items-center justify-between gap-2 active:opacity-70 ${
          small ? 'rounded-[12px] px-3 py-2.5' : 'rounded-[14px] px-3.5 py-3'
        }`}
        style={{ backgroundColor: disabled ? '#F5F2EC' : '#FFFFFF' }}
      >
        <Text className={`flex-1 text-xs font-jost ${current ? 'text-[#241E1A]' : 'text-[#8A8177]'}`} numberOfLines={1}>
          {current?.label ?? placeholder ?? ''}
        </Text>
        <ChevronDown size={small ? 14 : 16} color="#241E1A" />
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
                      onPress={() => {
                        onChange(opt.value);
                        setOpen(false);
                      }}
                      className={`px-4 py-3 flex-row items-center justify-between gap-3 border-t border-border-light ${
                        active ? 'bg-background-subtle' : 'active:bg-background'
                      }`}
                    >
                      <View className="flex-1">
                        <Text className={`text-sm ${active ? 'text-primary font-jost-semibold' : 'text-text-primary font-jost'}`}>{opt.label}</Text>
                        {opt.hint ? <Text className="text-[11px] font-jost text-text-secondary mt-0.5">{opt.hint}</Text> : null}
                      </View>
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
