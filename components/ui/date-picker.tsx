import React, { useState } from 'react';
import { Modal, Platform, Pressable, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import DateTimePicker, { DateTimePickerAndroid } from '@react-native-community/datetimepicker';
import { ChevronLeft, ChevronRight } from 'lucide-react-native';
import { dotsToIso, isoToDots } from '@/components/reception/booking-utils';

// The design's date fields are <input type="date">, which on a phone opens a date picker.
// Wrapping a field in <DatePickerOverlay> does the same: a tap anywhere on the field opens it;
// the field itself only displays the ДД.ММ.ГГГГ value.
// - Check-in / check-out pairs (`range`): one calendar for both dates, like Booking.com — the
//   first tap picks check-in, the second check-out (both platforms).
// - Single dates: iOS — a bottom sheet with a full-width month grid (the native inline calendar
//   has a fixed width); Android — the system date dialog.
// - Birth dates: the system wheel on iOS (years are far away), the system dialog on Android.

const pad = (n: number) => String(n).padStart(2, '0');
const toIso = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const fromIso = (iso: string) => {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(y, m - 1, d);
};
const nightsBetween = (from: string, to: string) => Math.round((fromIso(to).getTime() - fromIso(from).getTime()) / 86400000);

const MONTHS = ['Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь', 'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь'];
const MONTHS_SHORT = ['янв.', 'февр.', 'мар.', 'апр.', 'мая', 'июн.', 'июл.', 'авг.', 'сент.', 'окт.', 'нояб.', 'дек.'];
const WEEKDAYS = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];
const ACCENT = '#C2410C';
const RANGE_BG = '#FAF2E6';

const shortDate = (iso: string) => {
  const d = fromIso(iso);
  return `${d.getDate()} ${MONTHS_SHORT[d.getMonth()]}`;
};
const plural = (n: number, one: string, few: string, many: string) => {
  const m10 = n % 10;
  const m100 = n % 100;
  const word = m10 === 1 && m100 !== 11 ? one : m10 >= 2 && m10 <= 4 && (m100 < 12 || m100 > 14) ? few : many;
  return `${n} ${word}`;
};
const nightsLabel = (n: number) => plural(n, 'ночь', 'ночи', 'ночей');
const daysLabel = (n: number) => plural(n, 'день', 'дня', 'дней');


// Month grid, Monday first, as wide as its container. `start`/`end` mark the picked dates
// (a single date passes only `start`); days between them get a band.
function MonthCalendar({
  start,
  end,
  onPick,
  minimumIso,
  maximumIso,
}: {
  start: string | null;
  end?: string | null;
  onPick: (iso: string) => void;
  minimumIso?: string;
  maximumIso?: string;
}) {
  const [month, setMonth] = useState(() => {
    const base = start ? fromIso(start) : new Date();
    return new Date(base.getFullYear(), base.getMonth(), 1);
  });
  const todayIso = toIso(new Date());
  const lead = (month.getDay() + 6) % 7; // empty cells before the 1st (Monday = 0)
  const daysInMonth = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate();
  const cells: (number | null)[] = [...Array.from({ length: lead }, () => null), ...Array.from({ length: daysInMonth }, (_, i) => i + 1)];
  while (cells.length % 7) cells.push(null);
  const weeks = Array.from({ length: cells.length / 7 }, (_, w) => cells.slice(w * 7, w * 7 + 7));
  const shift = (delta: number) => setMonth((m) => new Date(m.getFullYear(), m.getMonth() + delta, 1));

  return (
    <View className="pt-2">
      <View className="flex-row items-center justify-between py-2">
        <Text className="text-base font-jost-semibold text-text-primary">
          {MONTHS[month.getMonth()]} {month.getFullYear()}
        </Text>
        <View className="flex-row items-center gap-1">
          <Pressable onPress={() => shift(-1)} hitSlop={6} className="h-9 w-9 rounded-full items-center justify-center active:bg-background">
            <ChevronLeft size={20} color={ACCENT} />
          </Pressable>
          <Pressable onPress={() => shift(1)} hitSlop={6} className="h-9 w-9 rounded-full items-center justify-center active:bg-background">
            <ChevronRight size={20} color={ACCENT} />
          </Pressable>
        </View>
      </View>

      <View className="flex-row py-1.5">
        {WEEKDAYS.map((d, i) => (
          <Text key={d} className="flex-1 text-center text-xs font-jost-medium" style={{ color: i >= 5 ? ACCENT : '#8A8177' }}>
            {d}
          </Text>
        ))}
      </View>

      {weeks.map((week, w) => (
        <View key={w} className="flex-row">
          {week.map((day, i) => {
            if (!day) return <View key={i} className="flex-1 h-12" />;
            const iso = toIso(new Date(month.getFullYear(), month.getMonth(), day));
            const isStart = iso === start;
            const isEnd = !!end && iso === end;
            const picked = isStart || isEnd;
            const hasRange = !!start && !!end && end > start;
            const inside = hasRange && iso > start! && iso < end!;
            const disabled = (!!minimumIso && iso < minimumIso) || (!!maximumIso && iso > maximumIso);
            return (
              <Pressable key={i} disabled={disabled} onPress={() => onPick(iso)} className="flex-1 h-12 items-center justify-center">
                {/* Band between check-in and check-out (half-cells under the end circles). */}
                {hasRange && (inside || isStart || isEnd) ? (
                  <View
                    className="absolute top-1 bottom-1"
                    style={{ left: isStart ? '50%' : 0, right: isEnd ? '50%' : 0, backgroundColor: RANGE_BG }}
                  />
                ) : null}
                <View className="h-10 w-10 rounded-full items-center justify-center" style={{ backgroundColor: picked ? ACCENT : 'transparent' }}>
                  <Text
                    className={`text-base ${picked || iso === todayIso ? 'font-jost-semibold' : 'font-jost'}`}
                    style={{ color: picked ? '#FFFFFF' : disabled ? '#D2CBC2' : iso === todayIso ? ACCENT : '#241E1A' }}
                  >
                    {day}
                  </Text>
                </View>
              </Pressable>
            );
          })}
        </View>
      ))}
    </View>
  );
}

// Check-in / check-out pair shown in one calendar.
export interface DateRangeLink {
  role: 'start' | 'end'; // which field this overlay wraps
  start: string; // ДД.ММ.ГГГГ (may be empty)
  end: string;
  onChange: (start: string, end: string) => void;
  // A period of days rather than a stay: the end day is included and may equal the start.
  inclusive?: boolean;
  // Wording for a period that isn't a stay.
  labels?: { title: string; start: string; end: string };
}

interface Props {
  value: string; // ДД.ММ.ГГГГ (may be empty)
  onChange: (dots: string) => void;
  // Date shown when the field is empty (YYYY-MM-DD); today by default.
  fallbackIso?: string;
  minimumIso?: string;
  maximumIso?: string;
  // Birth dates: wheel instead of a month calendar (years are far away).
  birth?: boolean;
  // Check-in / check-out: both dates are picked in one calendar.
  range?: DateRangeLink;
  title?: string;
  className?: string; // layout of the wrapper (e.g. flex-1 inside a row)
  children: React.ReactNode;
}

export function DatePickerOverlay({ value, onChange, fallbackIso, minimumIso, maximumIso, birth, range, title, className, children }: Props) {
  const insets = useSafeAreaInsets();
  const [open, setOpen] = useState(false);
  // Field labels may carry a required-mark; the sheet title shouldn't.
  const sheetTitle = title?.replace(/\s*\*\s*$/, '');
  const [draft, setDraft] = useState(new Date());
  // Range mode: picked dates (YYYY-MM-DD) and which one the next tap sets.
  const [rangeStart, setRangeStart] = useState<string | null>(null);
  const [rangeEnd, setRangeEnd] = useState<string | null>(null);
  const [picking, setPicking] = useState<'start' | 'end'>('start');

  const current = () => {
    const iso = dotsToIso(value) ?? fallbackIso ?? (birth ? '1990-01-01' : undefined);
    return iso ? fromIso(iso) : new Date();
  };
  const minimumDate = minimumIso ? fromIso(minimumIso) : undefined;
  const maximumDate = maximumIso ? fromIso(maximumIso) : birth ? new Date() : undefined;

  const show = () => {
    if (range) {
      const s = dotsToIso(range.start);
      const e = dotsToIso(range.end);
      setRangeStart(s);
      setRangeEnd(s && e && (e > s || (range.inclusive && e === s)) ? e : null);
      // Tapping the check-out field with a check-in set goes straight to choosing check-out.
      setPicking(range.role === 'end' && s ? 'end' : 'start');
      setOpen(true);
      return;
    }
    if (Platform.OS === 'android') {
      DateTimePickerAndroid.open({
        value: current(),
        mode: 'date',
        minimumDate,
        maximumDate,
        onChange: (event, date) => {
          if (event.type === 'set' && date) onChange(isoToDots(toIso(date)));
        },
      });
      return;
    }
    setDraft(current());
    setOpen(true);
  };

  const pickInRange = (iso: string) => {
    if (picking === 'start' || !rangeStart || iso < rangeStart || (iso === rangeStart && !range?.inclusive)) {
      setRangeStart(iso);
      setRangeEnd(null);
      setPicking('end');
      return;
    }
    setRangeEnd(iso);
    setPicking('start');
  };

  const rangeReady = !!rangeStart && !!rangeEnd;
  const canApply = range ? rangeReady : true;
  const apply = () => {
    if (range) {
      if (!rangeStart || !rangeEnd) return;
      range.onChange(isoToDots(rangeStart), isoToDots(rangeEnd));
    } else {
      onChange(isoToDots(toIso(draft)));
    }
    setOpen(false);
  };

  const sheetNeeded = !!range || Platform.OS === 'ios';

  return (
    <>
      <View className={className}>
        {/* The field stays visible underneath; this layer takes the tap instead of the keyboard. */}
        <View pointerEvents="none">{children}</View>
        <Pressable onPress={show} className="absolute inset-0" accessibilityRole="button" accessibilityLabel={title ?? 'Выбрать дату'} />
      </View>

      {sheetNeeded && (
        <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
          <Pressable className="flex-1 bg-black/40 justify-end" onPress={() => setOpen(false)}>
            <Pressable onPress={() => {}} className="bg-white rounded-t-[20px] px-4 pt-3" style={{ paddingBottom: Math.max(16, insets.bottom) }}>
              <View className="flex-row items-center justify-between py-1">
                <Pressable onPress={() => setOpen(false)} hitSlop={10} className="active:opacity-60">
                  <Text className="text-sm font-jost text-text-secondary">Отмена</Text>
                </Pressable>
                <Text className="text-sm font-jost-medium text-text-primary">{range ? (range.labels?.title ?? 'Даты проживания') : sheetTitle ?? ''}</Text>
                <Pressable onPress={apply} disabled={!canApply} hitSlop={10} className="active:opacity-60">
                  <Text className="text-sm font-jost-semibold" style={{ color: canApply ? ACCENT : '#D2CBC2' }}>
                    Готово
                  </Text>
                </Pressable>
              </View>

              {range ? (
                <>
                  {/* Check-in / check-out summary, the active one outlined. */}
                  <View className="flex-row gap-2 pt-3">
                    {(['start', 'end'] as const).map((role) => {
                      const iso = role === 'start' ? rangeStart : rangeEnd;
                      const active = picking === role;
                      return (
                        <Pressable
                          key={role}
                          onPress={() => (role === 'start' || rangeStart) && setPicking(role)}
                          className="flex-1 rounded-[12px] px-3 py-2"
                          style={{ borderWidth: 1, borderColor: active ? ACCENT : '#E5E2DD', backgroundColor: active ? RANGE_BG : '#FFFFFF' }}
                        >
                          <Text className="text-[11px] font-jost text-text-secondary">{role === 'start' ? (range.labels?.start ?? 'Заезд') : (range.labels?.end ?? 'Выезд')}</Text>
                          <Text className="text-sm font-jost-medium text-text-primary mt-0.5">{iso ? shortDate(iso) : '—'}</Text>
                        </Pressable>
                      );
                    })}
                  </View>
                  <Text className="text-xs font-jost text-text-secondary pt-2">
                    {rangeReady
                      ? range.inclusive
                        ? daysLabel(nightsBetween(rangeStart!, rangeEnd!) + 1)
                        : nightsLabel(nightsBetween(rangeStart!, rangeEnd!))
                      : range.inclusive
                        ? picking === 'end'
                          ? 'Выберите последний день'
                          : 'Выберите первый день'
                        : picking === 'end'
                          ? 'Выберите дату выезда'
                          : 'Выберите дату заезда'}
                  </Text>
                  <MonthCalendar start={rangeStart} end={rangeEnd} onPick={pickInRange} minimumIso={minimumIso} maximumIso={maximumIso} />
                </>
              ) : birth ? (
                <DateTimePicker
                  value={draft}
                  mode="date"
                  display="spinner"
                  locale="ru-RU"
                  themeVariant="light"
                  minimumDate={minimumDate}
                  maximumDate={maximumDate}
                  onChange={(_, date) => date && setDraft(date)}
                  style={{ alignSelf: 'stretch' }}
                />
              ) : (
                <MonthCalendar start={toIso(draft)} onPick={(iso) => setDraft(fromIso(iso))} minimumIso={minimumIso} maximumIso={maximumIso} />
              )}
            </Pressable>
          </Pressable>
        </Modal>
      )}
    </>
  );
}
