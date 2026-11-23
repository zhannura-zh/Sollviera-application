import React from 'react';
import { Alert, Pressable, Text, TextInput, View, type TextInputProps } from 'react-native';
import { Check, ChevronDown, Search } from 'lucide-react-native';
import type { Lang } from '@/components/reception/booking-utils';

export const comingSoon = (lang: Lang) =>
  Alert.alert(lang === 'RU' ? 'Добавится позже' : 'Coming soon');

export const showError = (lang: Lang, e: unknown) =>
  Alert.alert(lang === 'RU' ? 'Не удалось сохранить' : 'Could not save', e instanceof Error ? e.message : String(e ?? ''));

export function Checkbox({ checked, label, onToggle, muted }: { checked: boolean; label: string; onToggle: () => void; muted?: boolean }) {
  return (
    <Pressable onPress={onToggle} className="flex-row items-center gap-2.5 active:opacity-70" hitSlop={4}>
      <View
        className={`h-[18px] w-[18px] rounded border items-center justify-center ${checked ? 'bg-primary border-primary' : 'bg-white border-[#C5BFB5]'}`}
      >
        {checked && <Check size={12} color="#fff" strokeWidth={3} />}
      </View>
      <Text className={`text-xs font-jost ${muted ? 'text-text-secondary' : 'text-text-primary'}`}>{label}</Text>
    </Pressable>
  );
}

export function FieldLabel({ children }: { children: React.ReactNode }) {
  return <Text className="text-[11px] font-jost text-text-secondary mb-1">{children}</Text>;
}

export function FormInput(props: TextInputProps) {
  return (
    <TextInput
      placeholderTextColor="rgba(138,129,119,0.6)"
      {...props}
      className={`bg-white border border-border rounded-xl px-3.5 py-2.5 text-xs font-jost text-text-primary ${props.editable === false ? 'bg-[#F1F5F9] text-text-secondary' : ''}`}
    />
  );
}

export function SearchInput({ value, onChangeText, placeholder, right }: { value: string; onChangeText: (v: string) => void; placeholder: string; right?: React.ReactNode }) {
  return (
    <View className="flex-row items-center bg-white border border-border rounded-xl pl-3.5 pr-2.5">
      <Search size={16} color="#8A8177" />
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor="rgba(138,129,119,0.7)"
        className="flex-1 py-3 px-2.5 text-xs font-jost text-text-primary"
        autoCorrect={false}
      />
      {right}
    </View>
  );
}

// "+ Добавить счёт" / "+ Добавить смену" collapsible card.
export function AddCard({ title, open, onToggle, children }: { title: string; open: boolean; onToggle: () => void; children: React.ReactNode }) {
  return (
    <View className="bg-white rounded-2xl border border-border overflow-hidden">
      <Pressable onPress={onToggle} className="p-4 flex-row items-center justify-between active:bg-background">
        <View className="flex-row items-center gap-2">
          <Text className="text-primary font-jost-semibold text-lg" style={{ lineHeight: 20 }}>
            +
          </Text>
          <Text className="text-xs font-jost-medium text-text-primary">{title}</Text>
        </View>
        <Chevron open={open} />
      </Pressable>
      {open && <View className="p-4 pt-3 border-t border-border/60 gap-3 bg-background/50">{children}</View>}
    </View>
  );
}

export function Chevron({ open, size = 16 }: { open: boolean; size?: number }) {
  return (
    <View style={{ transform: [{ rotate: open ? '180deg' : '0deg' }] }}>
      <ChevronDown size={size} color="#8A8177" />
    </View>
  );
}

export function FormButtons({ submitLabel, onSubmit, onCancel, busy, lang }: { submitLabel: string; onSubmit: () => void; onCancel: () => void; busy?: boolean; lang: Lang }) {
  return (
    <View className="flex-row items-center gap-2 pt-1">
      <Pressable
        disabled={busy}
        onPress={onSubmit}
        className="flex-1 bg-primary rounded-xl py-2.5 items-center active:bg-primary-hover"
        style={{ opacity: busy ? 0.6 : 1 }}
      >
        <Text className="text-xs font-jost-medium text-white">{submitLabel}</Text>
      </Pressable>
      <Pressable onPress={onCancel} className="px-4 bg-white border border-border rounded-xl py-2.5 active:bg-background">
        <Text className="text-xs font-jost text-text-secondary">{lang === 'RU' ? 'Отмена' : 'Cancel'}</Text>
      </Pressable>
    </View>
  );
}

export function InfoRow({ label, value, valueClass = 'text-text-primary font-jost-medium' }: { label: string; value: string; valueClass?: string }) {
  return (
    <View className="flex-row items-center justify-between gap-3">
      <Text className="text-xs font-jost text-text-secondary">{label}</Text>
      <Text className={`text-xs flex-shrink text-right ${valueClass}`}>{value}</Text>
    </View>
  );
}

export function EmptyCard({ text }: { text: string }) {
  return (
    <View className="bg-white rounded-2xl border border-border p-6 items-center">
      <Text className="text-xs font-jost text-text-secondary text-center">{text}</Text>
    </View>
  );
}
