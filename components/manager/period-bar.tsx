import React, { useRef, useState } from 'react';
import { Dimensions, Modal, Pressable, Text, View } from 'react-native';
import { Calendar, Check, ChevronDown, ChevronLeft, ChevronRight, X } from 'lucide-react-native';
import { DatePickerOverlay } from '@/components/ui/date-picker';
import { dotsToIso, isoToDots, type Lang } from '@/components/reception/booking-utils';
import {
  PERIOD_OPTIONS,
  periodModeLabel,
  periodText,
  rangeForMode,
  shiftRange,
  type PeriodMode,
} from '@/components/manager/manager-utils';

export interface PeriodValue {
  mode: PeriodMode;
  start: string;
  end: string;
}

// Design's period row: [📅 10–16 ноября]  Неделя ⌄  ‹ ›, with the "Выбор периода" card
// opening under it from the date button.
export function PeriodBar({
  lang,
  value,
  onChange,
  withYear,
}: {
  lang: Lang;
  value: PeriodValue;
  onChange: (value: PeriodValue) => void;
  withYear?: boolean;
}) {
  const [pickerOpen, setPickerOpen] = useState(false);
  const yearInLabel = withYear ?? (value.mode === 'DAY' || value.mode === 'MONTH' || value.mode === 'YEAR');
  const label = periodText(value.start, value.end, value.mode, lang, yearInLabel);

  return (
    <View className="gap-2.5">
      <View className="flex-row items-center justify-between">
        <Pressable onPress={() => setPickerOpen((v) => !v)} className="flex-row items-center gap-2 py-1 active:opacity-60 flex-shrink">
          <Calendar size={16} color="#C2410C" />
          <Text className="text-xs font-jost-medium text-text-primary" numberOfLines={1}>
            {label}
          </Text>
        </Pressable>

        <View className="flex-row items-center gap-1">
          <ModeMenu
            lang={lang}
            value={value.mode}
            onChange={(mode) => {
              const [start, end] = rangeForMode(value.start, mode);
              onChange({ mode, start, end });
            }}
          />
          <Pressable
            hitSlop={6}
            onPress={() => {
              const [start, end] = shiftRange(value.start, value.end, value.mode, -1);
              onChange({ ...value, start, end });
            }}
            className="p-1 active:opacity-60"
          >
            <ChevronLeft size={16} color="#8A8177" />
          </Pressable>
          <Pressable
            hitSlop={6}
            onPress={() => {
              const [start, end] = shiftRange(value.start, value.end, value.mode, 1);
              onChange({ ...value, start, end });
            }}
            className="p-1 active:opacity-60"
          >
            <ChevronRight size={16} color="#8A8177" />
          </Pressable>
        </View>
      </View>

      {pickerOpen && (
        <PeriodPickerCard
          lang={lang}
          value={value}
          onClose={() => setPickerOpen(false)}
          onApply={(start, end) => {
            onChange({ ...value, start, end });
            setPickerOpen(false);
          }}
        />
      )}
    </View>
  );
}

function ModeMenu({ lang, value, onChange }: { lang: Lang; value: PeriodMode; onChange: (mode: PeriodMode) => void }) {
  const triggerRef = useRef<View>(null);
  const [anchor, setAnchor] = useState<{ x: number; y: number; width: number; height: number } | null>(null);
  const menuWidth = 144;
  const screenWidth = Dimensions.get('window').width;

  return (
    <>
      <View ref={triggerRef} collapsable={false}>
        <Pressable
          onPress={() => triggerRef.current?.measureInWindow((x, y, width, height) => setAnchor({ x, y, width, height }))}
          className="flex-row items-center gap-1 py-1 px-1.5 active:opacity-60"
        >
          <Text className="text-xs font-jost text-text-secondary">{periodModeLabel(value, lang)}</Text>
          <ChevronDown size={14} color="#8A8177" />
        </Pressable>
      </View>

      <Modal visible={anchor !== null} transparent animationType="fade" onRequestClose={() => setAnchor(null)}>
        <Pressable className="flex-1" onPress={() => setAnchor(null)}>
          {anchor && (
            <View
              className="absolute bg-white rounded-xl border border-border py-1.5 shadow-lg"
              style={{
                top: anchor.y + anchor.height + 6,
                left: Math.min(anchor.x + anchor.width - menuWidth, screenWidth - menuWidth - 8),
                width: menuWidth,
              }}
            >
              {PERIOD_OPTIONS.map((opt) => {
                const active = opt.id === value;
                return (
                  <Pressable
                    key={opt.id}
                    onPress={() => {
                      onChange(opt.id);
                      setAnchor(null);
                    }}
                    className={`px-3.5 py-2 flex-row items-center justify-between ${active ? 'bg-background' : 'active:bg-background'}`}
                  >
                    <Text className={`text-xs ${active ? 'text-primary font-jost-medium' : 'text-text-primary font-jost'}`}>
                      {lang === 'RU' ? opt.ru : opt.en}
                    </Text>
                    {active && <Check size={14} color="#C2410C" />}
                  </Pressable>
                );
              })}
            </View>
          )}
        </Pressable>
      </Modal>
    </>
  );
}

function DateBox({ value }: { value: string }) {
  return (
    <View className="bg-background border border-border rounded-xl px-2.5 py-2 flex-row items-center justify-between">
      <Text className="text-xs font-jost text-text-primary">{value}</Text>
      <Calendar size={14} color="#8A8177" />
    </View>
  );
}

function PeriodPickerCard({
  lang,
  value,
  onClose,
  onApply,
}: {
  lang: Lang;
  value: PeriodValue;
  onClose: () => void;
  onApply: (start: string, end: string) => void;
}) {
  const ru = lang === 'RU';
  const [startText, setStartText] = useState(isoToDots(value.start));
  const [endText, setEndText] = useState(isoToDots(value.end));
  const startIso = dotsToIso(startText);
  const endIso = dotsToIso(endText);
  const valid = !!startIso && !!endIso && endIso >= startIso;

  const range = {
    start: startText,
    end: endText,
    inclusive: true,
    labels: { title: ru ? 'Выбор периода' : 'Select date range', start: ru ? 'От' : 'From', end: ru ? 'До' : 'To' },
    onChange: (start: string, end: string) => {
      setStartText(start);
      setEndText(end);
    },
  };

  return (
    <View className="p-3.5 bg-white border border-border rounded-2xl gap-3">
      <View className="flex-row items-center justify-between">
        <Text className="text-xs font-jost-medium text-text-primary">
          {ru ? 'Выбор периода' : 'Select Date Range'} ({periodModeLabel(value.mode, lang)})
        </Text>
        <Pressable hitSlop={8} onPress={onClose} className="active:opacity-60">
          <X size={16} color="#8A8177" />
        </Pressable>
      </View>

      <View className="flex-row gap-2.5">
        <View className="flex-1">
          <Text className="text-[10px] font-jost text-text-secondary mb-1">{ru ? 'От (с числа)' : 'From'}</Text>
          <DatePickerOverlay value={startText} onChange={setStartText} range={{ role: 'start', ...range }}>
            <DateBox value={startText} />
          </DatePickerOverlay>
        </View>
        <View className="flex-1">
          <Text className="text-[10px] font-jost text-text-secondary mb-1">{ru ? 'До (по число)' : 'To'}</Text>
          <DatePickerOverlay value={endText} onChange={setEndText} range={{ role: 'end', ...range }}>
            <DateBox value={endText} />
          </DatePickerOverlay>
        </View>
      </View>

      <View className="flex-row items-center justify-between pt-1">
        <Text className="text-[11px] font-jost text-text-secondary flex-shrink" numberOfLines={1}>
          {valid ? periodText(startIso!, endIso!, value.mode, lang, true) : ''}
        </Text>
        <Pressable
          disabled={!valid}
          onPress={() => valid && onApply(startIso!, endIso!)}
          className="px-4 py-1.5 bg-primary rounded-xl active:bg-primary-hover"
          style={{ opacity: valid ? 1 : 0.5 }}
        >
          <Text className="text-xs font-jost-medium text-white">{ru ? 'Применить' : 'Apply'}</Text>
        </Pressable>
      </View>
    </View>
  );
}
