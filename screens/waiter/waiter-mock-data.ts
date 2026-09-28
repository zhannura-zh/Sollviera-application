// The real API has no restaurant/F&B domain at all (no meal-period occupancy, meal-plan
// breakdowns, hall check-in roster, or banquet bookings) — everything below is
// session-local demo data mirroring the shapes shown on mobile.sollviera.com, same
// "not backed by a real endpoint" pattern as the invite flow in staff-directory-screen.tsx.

export type MealPeriodKey = 'BREAKFAST' | 'LUNCH' | 'DINNER';

export interface MealPlanCount {
  code: string;
  labelRu: string;
  labelEn: string;
  count: number;
}

export interface MealPeriod {
  key: MealPeriodKey;
  labelRu: string;
  labelEn: string;
  timeRange: string;
  expected: number;
  breakdown: MealPlanCount[];
}

export const MEAL_PERIODS: MealPeriod[] = [
  {
    key: 'BREAKFAST',
    labelRu: 'Завтрак',
    labelEn: 'Breakfast',
    timeRange: '07:00–10:30',
    expected: 142,
    breakdown: [
      { code: 'BB', labelRu: 'завтрак включён', labelEn: 'breakfast included', count: 88 },
      { code: 'HB', labelRu: 'полупансион', labelEn: 'half board', count: 34 },
      { code: 'AI', labelRu: 'всё включено', labelEn: 'all inclusive', count: 20 },
      { code: '', labelRu: 'дети до 6 лет · бесплатно', labelEn: 'kids under 6 · free', count: 12 },
    ],
  },
  {
    key: 'LUNCH',
    labelRu: 'Обед',
    labelEn: 'Lunch',
    timeRange: '12:30–15:00',
    expected: 54,
    breakdown: [
      { code: 'FB', labelRu: 'полный пансион', labelEn: 'full board', count: 34 },
      { code: 'AI', labelRu: 'всё включено', labelEn: 'all inclusive', count: 20 },
    ],
  },
  {
    key: 'DINNER',
    labelRu: 'Ужин',
    labelEn: 'Dinner',
    timeRange: '18:30–22:00',
    expected: 88,
    breakdown: [
      { code: 'HB', labelRu: 'полупансион', labelEn: 'half board', count: 34 },
      { code: 'FB', labelRu: 'полный пансион', labelEn: 'full board', count: 34 },
      { code: 'AI', labelRu: 'всё включено', labelEn: 'all inclusive', count: 20 },
    ],
  },
];

export interface DailyAlert {
  id: string;
  kind: 'ALLERGY' | 'BIRTHDAY' | 'BANQUET';
  titleRu: string;
  titleEn: string;
  subtitleRu: string;
  subtitleEn: string;
}

export const DAILY_ALERTS: DailyAlert[] = [
  {
    id: 'allergy-1',
    kind: 'ALLERGY',
    titleRu: 'Аллергия · орехи',
    titleEn: 'Allergy · nuts',
    subtitleRu: 'Ким А., № 304 · предупредить кухню',
    subtitleEn: 'Kim A., Room 304 · notify the kitchen',
  },
  {
    id: 'birthday-1',
    kind: 'BIRTHDAY',
    titleRu: 'День рождения гостя',
    titleEn: "Guest birthday",
    subtitleRu: 'Абдиров К., № 412 · комплимент от отеля',
    subtitleEn: 'Abdirov K., Room 412 · compliment from the hotel',
  },
  {
    id: 'banquet-1',
    kind: 'BANQUET',
    titleRu: 'Банкет в 19:00 · 30 человек',
    titleEn: 'Banquet at 19:00 · 30 guests',
    subtitleRu: 'Малый зал · отдельное меню',
    subtitleEn: 'Small hall · separate menu',
  },
];

export interface HallGuest {
  id: string;
  roomNumber: string;
  guestName: string;
  mealPlan: string;
  period: MealPeriodKey;
  checkedIn: boolean;
}

export const HALL_GUESTS: HallGuest[] = [
  { id: 'g1', roomNumber: '304', guestName: 'Ким А.', mealPlan: 'HB', period: 'BREAKFAST', checkedIn: false },
  { id: 'g2', roomNumber: '412', guestName: 'Абдиров К.', mealPlan: 'AI', period: 'BREAKFAST', checkedIn: true },
  { id: 'g3', roomNumber: '201', guestName: 'Петрова С.', mealPlan: 'BB', period: 'BREAKFAST', checkedIn: false },
  { id: 'g4', roomNumber: '108', guestName: 'Nazarov Y.', mealPlan: 'BB', period: 'BREAKFAST', checkedIn: false },
  { id: 'g5', roomNumber: '512', guestName: 'Смирнова Е.', mealPlan: 'FB', period: 'LUNCH', checkedIn: false },
  { id: 'g6', roomNumber: '304', guestName: 'Ким А.', mealPlan: 'HB', period: 'DINNER', checkedIn: false },
];

export interface BanquetBooking {
  id: string;
  time: string;
  guests: number;
  hall: string;
  noteRu: string;
  noteEn: string;
  responsible: string;
  confirmed: boolean;
}

export const BANQUET_BOOKINGS: BanquetBooking[] = [
  {
    id: 'b1',
    time: '19:00',
    guests: 30,
    hall: 'Малый зал',
    noteRu: 'Отдельное сет-меню шефа. Сервировка к 17:30.',
    noteEn: "Separate chef's set menu. Table setup by 17:30.",
    responsible: 'Айгерим Д.',
    confirmed: true,
  },
];

export interface ShiftScheduleDay {
  date: string;
  isToday?: boolean;
  isTomorrow?: boolean;
  timeRange?: string;
  hall?: string;
  dayOff?: boolean;
}

export const SHIFT_SCHEDULE: ShiftScheduleDay[] = [
  { date: '27 авг', isToday: true, timeRange: '08:00 — 20:00', hall: 'Зал А' },
  { date: '28 авг', isTomorrow: true, timeRange: '08:00 — 20:00', hall: 'Зал B' },
  { date: '29 авг', dayOff: true },
];
