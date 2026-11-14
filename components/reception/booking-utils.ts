import type { ReceptionBookingStatus } from '@/context/reception-store';

// Shared helpers for the reception bookings tab (chessboard, list, period picker).

export type Lang = 'RU' | 'EN';
export type PeriodScale = 'DAY' | 'WEEK' | '14DAYS';

// Room + dates picked on the chessboard, handed to the create-booking wizards.
export interface BookingPrefill {
  roomId: string;
  checkIn: string; // YYYY-MM-DD
  checkOut: string; // YYYY-MM-DD, exclusive
}
export type VisibleStatus = 'NEW' | 'CONFIRMED' | 'CHECKED_IN' | 'CHECKED_OUT';

export const VISIBLE_STATUSES: VisibleStatus[] = ['NEW', 'CONFIRMED', 'CHECKED_IN', 'CHECKED_OUT'];

export const isVisibleStatus = (status: ReceptionBookingStatus): status is VisibleStatus =>
  (VISIBLE_STATUSES as string[]).includes(status);

export const scaleLength = (scale: PeriodScale) => (scale === 'DAY' ? 1 : scale === 'WEEK' ? 7 : 14);

export const scaleFromLength = (days: number): PeriodScale => (days <= 1 ? 'DAY' : days >= 14 ? '14DAYS' : 'WEEK');

// Scale whose length is exactly `days`; null for a period picked by hand.
export const scaleOfLength = (days: number): PeriodScale | null => (days === 1 ? 'DAY' : days === 7 ? 'WEEK' : days === 14 ? '14DAYS' : null);

export const daysText = (n: number, lang: Lang) => {
  if (lang !== 'RU') return `${n} ${n === 1 ? 'day' : 'days'}`;
  const m10 = n % 10;
  const m100 = n % 100;
  return `${n} ${m10 === 1 && m100 !== 11 ? 'день' : m10 >= 2 && m10 <= 4 && (m100 < 12 || m100 > 14) ? 'дня' : 'дней'}`;
};

export const scaleLabel = (scale: PeriodScale, lang: Lang) =>
  scale === 'DAY'
    ? lang === 'RU' ? 'День' : 'Day'
    : scale === 'WEEK'
      ? lang === 'RU' ? 'Неделя' : 'Week'
      : lang === 'RU' ? '14 дней' : '14 days';

// Status colours copied 1:1 from the web design.
export const STATUS_STYLE: Record<
  VisibleStatus,
  { ru: string; en: string; dot: string; pillBg: string; pillText: string; chessBg: string; chessBorder: string; chessText: string }
> = {
  NEW: { ru: 'Новая', en: 'New', dot: '#D9822B', pillBg: '#F8EFE0', pillText: '#8F5B1D', chessBg: '#F6ECDC', chessBorder: '#D9822B', chessText: '#734816' },
  CONFIRMED: { ru: 'Подтверждена', en: 'Confirmed', dot: '#4B7F52', pillBg: '#E6F0E8', pillText: '#2E623C', chessBg: '#E4EFE7', chessBorder: '#4B7F52', chessText: '#28593A' },
  CHECKED_IN: { ru: 'Заселён', en: 'Checked In', dot: '#B94A2C', pillBg: '#F5E4DC', pillText: '#96361C', chessBg: '#F3E3D8', chessBorder: '#B94A2C', chessText: '#7A2713' },
  CHECKED_OUT: { ru: 'Выехал', en: 'Checked Out', dot: '#8A8177', pillBg: '#EFECE6', pillText: '#635C54', chessBg: '#EFECE6', chessBorder: '#8A8177', chessText: '#5C544D' },
};

export const statusLabel = (status: VisibleStatus, lang: Lang) => (lang === 'RU' ? STATUS_STYLE[status].ru : STATUS_STYLE[status].en);

// ---------- dates (local calendar days, YYYY-MM-DD) ----------

export function parseIso(iso: string) {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(y, (m || 1) - 1, d || 1);
}

export function addDaysIso(iso: string, days: number) {
  const date = parseIso(iso);
  date.setDate(date.getDate() + days);
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

// Signed number of days from `from` to `to`.
export function diffDays(from: string, to: string) {
  return Math.round((parseIso(to).getTime() - parseIso(from).getTime()) / 86_400_000);
}

const MONTHS_RU_GEN = ['января', 'февраля', 'марта', 'апреля', 'мая', 'июня', 'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря'];
const MONTHS_RU_SHORT = ['янв.', 'февр.', 'мар.', 'апр.', 'мая', 'июн.', 'июл.', 'авг.', 'сент.', 'окт.', 'нояб.', 'дек.'];
const MONTHS_EN = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const MONTHS_EN_SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const WEEKDAYS_RU = ['Воскресенье', 'Понедельник', 'Вторник', 'Среда', 'Четверг', 'Пятница', 'Суббота'];
const WEEKDAYS_EN = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const DOW_RU = ['вс', 'пн', 'вт', 'ср', 'чт', 'пт', 'сб'];
const DOW_EN = ['su', 'mo', 'tu', 'we', 'th', 'fr', 'sa'];

export const dowLabel = (iso: string, lang: Lang) => (lang === 'RU' ? DOW_RU : DOW_EN)[parseIso(iso).getDay()];
export const isWeekend = (iso: string) => {
  const d = parseIso(iso).getDay();
  return d === 0 || d === 6;
};

// "Четверг, 5 ноября" / "Thursday, November 5"
export function formatLongToday(iso: string, lang: Lang) {
  const d = parseIso(iso);
  return lang === 'RU'
    ? `${WEEKDAYS_RU[d.getDay()]}, ${d.getDate()} ${MONTHS_RU_GEN[d.getMonth()]}`
    : `${WEEKDAYS_EN[d.getDay()]}, ${MONTHS_EN[d.getMonth()]} ${d.getDate()}`;
}

// "5 ноября" / "November 5"
export function formatDayLabel(iso: string, lang: Lang) {
  const d = parseIso(iso);
  return lang === 'RU' ? `${d.getDate()} ${MONTHS_RU_GEN[d.getMonth()]}` : `${MONTHS_EN[d.getMonth()]} ${d.getDate()}`;
}

// "5 нояб." / "Nov 5"
export function formatShortDate(iso: string, lang: Lang) {
  if (!iso) return '—';
  const d = parseIso(iso);
  return lang === 'RU' ? `${d.getDate()} ${MONTHS_RU_SHORT[d.getMonth()]}` : `${MONTHS_EN_SHORT[d.getMonth()]} ${d.getDate()}`;
}

// "5–11 ноября", "28 окт. – 3 нояб.", single day "5 ноября".
export function formatPeriodLabel(fromIso: string, length: number, lang: Lang) {
  if (length <= 1) return formatDayLabel(fromIso, lang);
  const lastIso = addDaysIso(fromIso, length - 1);
  const a = parseIso(fromIso);
  const b = parseIso(lastIso);
  if (a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth()) {
    return lang === 'RU'
      ? `${a.getDate()}–${b.getDate()} ${MONTHS_RU_GEN[a.getMonth()]}`
      : `${MONTHS_EN[a.getMonth()]} ${a.getDate()}–${b.getDate()}`;
  }
  return `${formatShortDate(fromIso, lang)} – ${formatShortDate(lastIso, lang)}`;
}

export const bookingRangeText = (checkIn: string, checkOut: string, lang: Lang) =>
  `${formatShortDate(checkIn, lang)} → ${formatShortDate(checkOut, lang)}`;

// YYYY-MM-DD <-> DD.MM.YYYY (period picker inputs)
export function isoToDots(iso: string) {
  const [y, m, d] = iso.split('-');
  return `${d}.${m}.${y}`;
}

export function dotsToIso(value: string): string | null {
  const match = value.trim().match(/^(\d{1,2})\.(\d{1,2})\.(\d{4})$/);
  if (!match) return null;
  const day = Number(match[1]);
  const month = Number(match[2]);
  const year = Number(match[3]);
  const date = new Date(year, month - 1, day);
  if (date.getFullYear() !== year || date.getMonth() !== month - 1 || date.getDate() !== day) return null;
  return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

// ---------- words ----------

export function pluralRu(n: number, one: string, few: string, many: string) {
  const mod10 = n % 10;
  const mod100 = n % 100;
  if (mod10 === 1 && mod100 !== 11) return one;
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return few;
  return many;
}

export const guestsText = (n: number, lang: Lang) =>
  lang === 'RU' ? `${n} ${pluralRu(n, 'гость', 'гостя', 'гостей')}` : `${n} ${n === 1 ? 'guest' : 'guests'}`;

export const nightsText = (n: number, lang: Lang) =>
  lang === 'RU' ? `${n} ${pluralRu(n, 'ночь', 'ночи', 'ночей')}` : `${n} ${n === 1 ? 'night' : 'nights'}`;

// Booking sources come from the API as free strings / codes: translate the usual codes, keep the rest as is.
const SOURCE_LABELS: Record<string, { ru: string; en: string }> = {
  DIRECT: { ru: 'Прямая бронь', en: 'Direct' },
  WALK_IN: { ru: 'От стойки', en: 'Walk-in' },
  WALKIN: { ru: 'От стойки', en: 'Walk-in' },
  FRONT_DESK: { ru: 'От стойки', en: 'Walk-in' },
  PHONE: { ru: 'Телефон', en: 'Phone' },
  WEBSITE: { ru: 'Сайт', en: 'Website' },
  WEB: { ru: 'Сайт', en: 'Website' },
  CORPORATE: { ru: 'Корпоративный', en: 'Corporate' },
  BOOKING_COM: { ru: 'Booking.com', en: 'Booking.com' },
  BOOKING: { ru: 'Booking.com', en: 'Booking.com' },
  OTA: { ru: 'OTA', en: 'OTA' },
  EMAIL: { ru: 'Email', en: 'Email' },
};

export function sourceLabel(source: string, lang: Lang) {
  const known = SOURCE_LABELS[source.trim().toUpperCase().replace(/[\s.-]+/g, '_')];
  if (known) return lang === 'RU' ? known.ru : known.en;
  return source;
}

// Server booking errors come as codes ("ROOM_CAPACITY_EXCEEDED:315:6:2"); known ones get a readable text.
export function bookingErrorText(error: unknown, lang: Lang): string {
  const message = error instanceof Error ? error.message : String(error);
  const capacity = /ROOM_CAPACITY_EXCEEDED:([^:]+):(\d+):(\d+)/.exec(message);
  if (capacity) {
    const [, room, guests, cap] = capacity;
    return lang === 'RU'
      ? `В номере №${room} помещается ${guestsText(Number(cap), lang)}, а в брони ${guestsText(Number(guests), lang)}. Уменьшите число гостей или выберите другой номер.`
      : `Room #${room} fits ${guestsText(Number(cap), lang)}, the booking has ${guestsText(Number(guests), lang)}. Reduce the guests or pick another room.`;
  }
  return message;
}
