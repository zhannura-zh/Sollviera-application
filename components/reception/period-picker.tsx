import React, { useRef, useState } from 'react';
import { Dimensions, Modal, Pressable, Text, View } from 'react-native';
import { DatePickerOverlay, type DateRangeLink } from '@/components/ui/date-picker';
import { Calendar, ChevronDown } from 'lucide-react-native';
import {
  type Lang,
  type PeriodScale,
  daysText,
  diffDays,
  dotsToIso,
  isoToDots,
  scaleLabel,
  addDaysIso,
} from '@/components/reception/booking-utils';

// Plain-text "Неделя ⌄" trigger with a small menu anchored under it.
// `value` is null for a period picked by hand; the trigger then shows its length.
export function ScaleMenu({
  lang,
  value,
  days,
  onChange,
}: {
  lang: Lang;
  value: PeriodScale | null;
  days: number;
  onChange: (scale: PeriodScale) => void;
}) {
  const triggerRef = useRef<View>(null);
  const [anchor, setAnchor] = useState<{ x: number; y: number; width: number; height: number } | null>(null);
  const options: PeriodScale[] = ['DAY', 'WEEK', '14DAYS'];
  const menuWidth = 112;
  const screenWidth = Dimensions.get('window').width;

  return (
    <>
      <View ref={triggerRef} collapsable={false}>
        <Pressable
          onPress={() => triggerRef.current?.measureInWindow((x, y, width, height) => setAnchor({ x, y, width, height }))}
          className="flex-row items-center gap-1 py-1 px-1.5 active:opacity-60"
        >
          <Text className="text-xs font-jost text-text-secondary">{value ? scaleLabel(value, lang) : daysText(days, lang)}</Text>
          <ChevronDown size={14} color="#8A8177" />
        </Pressable>
      </View>

      <Modal visible={anchor !== null} transparent animationType="fade" onRequestClose={() => setAnchor(null)}>
        <Pressable className="flex-1" onPress={() => setAnchor(null)}>
          {anchor && (
            <View
              className="absolute bg-white rounded-xl border border-border py-1 shadow-lg"
              style={{
                top: anchor.y + anchor.height + 4,
                left: Math.min(anchor.x + anchor.width - menuWidth, screenWidth - menuWidth - 8),
                width: menuWidth,
              }}
            >
              {options.map((opt) => {
                const active = opt === value;
                return (
                  <Pressable
                    key={opt}
                    onPress={() => {
                      onChange(opt);
                      setAnchor(null);
                    }}
                    className={`px-3 py-2 ${active ? 'bg-[#FAF2E6]' : 'active:bg-background'}`}
                  >
                    <Text className={`text-xs ${active ? 'text-primary font-jost-medium' : 'text-text-primary font-jost'}`}>
                      {scaleLabel(opt, lang)}
                    </Text>
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

function DateInput({
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
    <View className="gap-1.5">
      <Text className="text-xs font-jost text-text-secondary">{label}</Text>
      <DatePickerOverlay value={value} onChange={onChange} title={label} range={range}>
        <View
          className="bg-white rounded-[12px] px-3.5 flex-row items-center justify-between"
          style={{ borderWidth: 1, borderColor: invalid ? '#B3261E' : '#E5E2DD' }}
        >
          <Text className="flex-1 py-2.5 text-sm font-jost" style={{ color: value ? '#241E1A' : '#A0988E' }} numberOfLines={1}>
            {value || '05.11.2026'}
          </Text>
          <Calendar size={16} color="#8A8177" />
        </View>
      </DatePickerOverlay>
    </View>
  );
}

// Inline "Период" card: one date for a single day, otherwise both dates picked freely in one calendar.
export function PeriodPickerPanel({
  lang,
  fromIso,
  dayCount,
  onCancel,
  onApply,
}: {
  lang: Lang;
  fromIso: string;
  dayCount: number;
  onCancel: () => void;
  onApply: (fromIso: string, dayCount: number) => void;
}) {
  const [startText, setStartText] = useState(isoToDots(fromIso));
  const [endText, setEndText] = useState(isoToDots(addDaysIso(fromIso, dayCount - 1)));
  const startIso = dotsToIso(startText);
  const endIso = dotsToIso(endText);
  const single = dayCount === 1;
  const valid = !!startIso && (single || (!!endIso && endIso >= startIso));

  const ru = lang === 'RU';
  const periodRange = {
    start: startText,
    end: endText,
    inclusive: true,
    labels: { title: ru ? 'Период' : 'Period', start: ru ? 'С' : 'From', end: ru ? 'По' : 'To' },
    onChange: (start: string, end: string) => {
      setStartText(start);
      setEndText(end);
    },
  };
  const apply = () => {
    if (!startIso) return;
    onApply(startIso, single || !endIso ? 1 : diffDays(startIso, endIso) + 1);
  };

  return (
    <View className="bg-white rounded-[18px] border border-border p-4 gap-3">
      <Text className="text-[13px] font-jost-semibold text-text-primary">{ru ? 'Период' : 'Period'}</Text>

      {single ? (
        <DateInput label={ru ? 'Дата' : 'Date'} value={startText} onChange={setStartText} invalid={!startIso} />
      ) : (
        <>
          <DateInput
            label={ru ? 'Дата с' : 'Date from'}
            value={startText}
            onChange={setStartText}
            invalid={!startIso}
            range={{ role: 'start', ...periodRange }}
          />
          <DateInput
            label={ru ? 'Дата по' : 'Date to'}
            value={endText}
            onChange={setEndText}
            invalid={!endIso || (!!startIso && endIso < startIso)}
            range={{ role: 'end', ...periodRange }}
          />
        </>
      )}

      <View className="flex-row items-center justify-end gap-2 pt-1">
        <Pressable onPress={onCancel} className="px-4 py-2 rounded-[10px] border border-border bg-white active:bg-background">
          <Text className="text-xs font-jost-medium text-text-primary">{ru ? 'Отмена' : 'Cancel'}</Text>
        </Pressable>
        <Pressable
          disabled={!valid}
          onPress={apply}
          className="px-4 py-2 rounded-[10px] bg-[#B93800] active:bg-[#9E3000]"
          style={{ opacity: valid ? 1 : 0.5 }}
        >
          <Text className="text-xs font-jost-medium text-white">{ru ? 'Применить' : 'Apply'}</Text>
        </Pressable>
      </View>
    </View>
  );
}
