import { addDaysIso, parseIso, pluralRu, type Lang } from '@/components/reception/booking-utils';

export type PeriodMode = 'DAY' | 'WEEK' | 'MONTH' | 'YEAR';

export const PERIOD_OPTIONS: { id: PeriodMode; ru: string; en: string }[] = [
  { id: 'DAY', ru: 'День', en: 'Day' },
  { id: 'WEEK', ru: 'Неделя', en: 'Week' },
  { id: 'MONTH', ru: 'Месяц', en: 'Month' },
  { id: 'YEAR', ru: 'Год', en: 'Year' },
];

export const periodModeLabel = (mode: PeriodMode, lang: Lang) => {
  const o = PERIOD_OPTIONS.find((p) => p.id === mode)!;
  return lang === 'RU' ? o.ru : o.en;
};

export const money = (value: number) => `${Math.round(value).toLocaleString('ru-RU')} ₸`;

export const num = (value: unknown): number => {
  const n = typeof value === 'number' ? value : Number(String(value ?? '').replace(',', '.'));
  return Number.isFinite(n) ? n : 0;
};

const toIso = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

export const todayIso = () => toIso(new Date());

// Range a mode covers starting from `anchorIso` (as in the design: a week runs 7 days from the
// anchor, a month and a year are calendar ones).
export function rangeForMode(anchorIso: string, mode: PeriodMode): [string, string] {
  const d = parseIso(anchorIso);
  if (mode === 'DAY') return [anchorIso, anchorIso];
  if (mode === 'WEEK') return [anchorIso, addDaysIso(anchorIso, 6)];
  if (mode === 'MONTH') return [toIso(new Date(d.getFullYear(), d.getMonth(), 1)), toIso(new Date(d.getFullYear(), d.getMonth() + 1, 0))];
  return [`${d.getFullYear()}-01-01`, `${d.getFullYear()}-12-31`];
}

export function shiftRange(startIso: string, endIso: string, mode: PeriodMode, dir: -1 | 1): [string, string] {
  if (mode === 'DAY') return [addDaysIso(startIso, dir), addDaysIso(endIso, dir)];
  if (mode === 'WEEK') return [addDaysIso(startIso, dir * 7), addDaysIso(endIso, dir * 7)];
  const s = parseIso(startIso);
  if (mode === 'MONTH') {
    const start = new Date(s.getFullYear(), s.getMonth() + dir, 1);
    return [toIso(start), toIso(new Date(start.getFullYear(), start.getMonth() + 1, 0))];
  }
  const y = s.getFullYear() + dir;
  return [`${y}-01-01`, `${y}-12-31`];
}

const MONTHS_GEN_RU = ['января', 'февраля', 'марта', 'апреля', 'мая', 'июня', 'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря'];
const MONTHS_NOM_RU = ['Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь', 'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь'];
const MONTHS_SHORT_RU = ['янв.', 'февр.', 'марта', 'апр.', 'мая', 'июня', 'июля', 'авг.', 'сент.', 'окт.', 'нояб.', 'дек.'];
const MONTHS_EN = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const MONTHS_SHORT_EN = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export function dayMonthText(iso: string, lang: Lang) {
  const d = parseIso(iso);
  return lang === 'RU' ? `${d.getDate()} ${MONTHS_GEN_RU[d.getMonth()]}` : `${d.getDate()} ${MONTHS_EN[d.getMonth()]}`;
}

// "10–16 ноября", "Ноябрь 2026", "2026 год", "28 нояб. – 4 дек." — as the design formats periods.
export function periodText(startIso: string, endIso: string, mode: PeriodMode, lang: Lang, withYear = false) {
  const ru = lang === 'RU';
  const s = parseIso(startIso);
  const e = parseIso(endIso);
  const [sd, ed, sm, em, sy, ey] = [s.getDate(), e.getDate(), s.getMonth(), e.getMonth(), s.getFullYear(), e.getFullYear()];
  const yr = withYear ? ` ${sy}` : '';
  if (startIso === endIso) return ru ? `${sd} ${MONTHS_GEN_RU[sm]}${yr}` : `${sd} ${MONTHS_EN[sm]}${yr}`;
  const lastDay = new Date(sy, sm + 1, 0).getDate();
  if (mode === 'MONTH' && sm === em && sy === ey && sd === 1 && ed === lastDay) return ru ? `${MONTHS_NOM_RU[sm]} ${sy}` : `${MONTHS_EN[sm]} ${sy}`;
  if (mode === 'YEAR' && sy === ey && sm === 0 && sd === 1 && em === 11 && ed === 31) return ru ? `${sy} год` : `${sy}`;
  if (sm === em && sy === ey) return ru ? `${sd}–${ed} ${MONTHS_GEN_RU[sm]}${yr}` : `${sd}–${ed} ${MONTHS_EN[sm]}${yr}`;
  if (sy === ey)
    return ru
      ? `${sd} ${MONTHS_SHORT_RU[sm]} – ${ed} ${MONTHS_SHORT_RU[em]}${yr}`
      : `${sd} ${MONTHS_SHORT_EN[sm]} – ${ed} ${MONTHS_SHORT_EN[em]}${yr}`;
  return ru
    ? `${sd} ${MONTHS_SHORT_RU[sm]} ${sy} – ${ed} ${MONTHS_SHORT_RU[em]} ${ey}`
    : `${sd} ${MONTHS_SHORT_EN[sm]} ${sy} – ${ed} ${MONTHS_SHORT_EN[em]} ${ey}`;
}

// "12–14 ноября" for a stay.
export function stayText(checkIn: string, checkOut: string, lang: Lang) {
  if (!checkIn) return '';
  if (!checkOut) return dayMonthText(checkIn, lang);
  return periodText(checkIn, checkOut, 'DAY', lang);
}

export const bookingsCountText = (n: number, lang: Lang) =>
  lang === 'RU' ? `${n} ${pluralRu(n, 'бронь', 'брони', 'броней')}` : `${n} ${n === 1 ? 'booking' : 'bookings'}`;

export const requestsCountText = (n: number, lang: Lang) =>
  lang === 'RU' ? `${n} ${pluralRu(n, 'заявка', 'заявки', 'заявок')}` : `${n} ${n === 1 ? 'request' : 'requests'}`;

export const roomsWord = (n: number) => pluralRu(n, 'номер', 'номера', 'номеров');

// "8,3" — Russian decimal comma, at most one fractional digit.
export const dec = (value: number, digits = 1) =>
  value.toLocaleString('ru-RU', { minimumFractionDigits: 0, maximumFractionDigits: digits });
