import React, { useState } from 'react';
import {
  Calendar, Search, Plus, ChevronDown, ChevronLeft, ChevronRight,
  LayoutGrid, List, User, Users, Zap, Clock, CheckCircle2, Phone,
  MessageSquare, Bell, Settings, LogOut, QrCode, ShieldCheck, Lock,
  HelpCircle, RotateCw, BedDouble, ArrowRight, X, Check, Building2,
  CreditCard, FileText, Sparkles, Filter, ExternalLink, Eye, Edit3, Printer, Download, Info,
  Send, PhoneCall, Wrench, RefreshCw
} from 'lucide-react';
import { Language, CleanerProfile } from '../types';
import { mockShiftHistory } from '../data/mockData';

export type ReceptionTab =
  | 'RECEPTION_BOOKINGS'
  | 'RECEPTION_CREATE'
  | 'RECEPTION_WAITLIST'
  | 'RECEPTION_PROFILE';

type BookingStatus = 'NEW' | 'CONFIRMED' | 'CHECKED_IN' | 'CHECKED_OUT';
type BookingCategory = 'Люкс' | 'Стандарт' | 'Комфорт';
type BookingSource = 'Прямая бронь' | 'Booking.com' | 'Корпоративный' | 'От стойки';

interface ReceptionBooking {
  id: string;
  bookingNumber: string;
  guestName: string;
  shortName: string;
  phone: string;
  email: string;
  roomNumber: string;
  category: BookingCategory;
  guestsCount: number;
  startDay: number; // November day (e.g. 4 = Nov 4)
  endDay: number;   // November day (e.g. 8 = Nov 8)
  dateRangeText: string;
  nights: number;
  status: BookingStatus;
  source: BookingSource;
  totalAmount: string;
  isPaid: boolean;
  tariff: string;
  notes: string;
  bookingType: 'INDIVIDUAL' | 'GROUP' | 'QUICK';
  alsoRooms?: string[];
  // Extended fields for rich booking view
  birthDate?: string;
  gender?: string;
  nationality?: string;
  document?: string;
  manager?: string;
  prepayment?: string;
  specialTags?: string[];
  allergyNotice?: string;
  services?: Array<{ id: string; name: string; price: number }>;
}

interface WaitlistEntry {
  id: string;
  waitlistNumber: string;
  guestName: string;
  phone: string;
  desiredCategory: BookingCategory;
  guestsCount: number;
  desiredDates: string;
  checkinFull: string;
  checkoutFull: string;
  flexibleDates: boolean;
  nights: number;
  priority: 'HIGH' | 'NORMAL';
  status: 'WAITING' | 'OFFERED' | 'BOOKED';
  notes: string;
  createdAt: string;
}

interface ReceptionScreensProps {
  lang: Language;
  cleanerProfile: CleanerProfile;
  onUpdateCleanerProfile: (profile: CleanerProfile) => void;
  onLogout: () => void;
  offlineMode: boolean;
  onToggleOffline: () => void;
  activeTab: ReceptionTab;
  onLanguageChange?: (lang: Language) => void;
  onNavigateTab?: (tab: ReceptionTab) => void;
}

const RECEPTION_ROOMS: Array<{
  roomNumber: string;
  floor: number;
  capacity: number;
  category: BookingCategory;
  cleanStatus: 'CLEAN' | 'DIRTY';
}> = [
  { roomNumber: '303', floor: 3, capacity: 4, category: 'Люкс', cleanStatus: 'CLEAN' },
  { roomNumber: '301', floor: 3, capacity: 4, category: 'Люкс', cleanStatus: 'CLEAN' },
  { roomNumber: '101', floor: 1, capacity: 2, category: 'Стандарт', cleanStatus: 'CLEAN' },
  { roomNumber: '102', floor: 1, capacity: 2, category: 'Стандарт', cleanStatus: 'CLEAN' },
  { roomNumber: '103', floor: 1, capacity: 2, category: 'Стандарт', cleanStatus: 'CLEAN' },
  { roomNumber: '201', floor: 2, capacity: 3, category: 'Комфорт', cleanStatus: 'CLEAN' },
  { roomNumber: '202', floor: 2, capacity: 3, category: 'Комфорт', cleanStatus: 'CLEAN' },
];

const INITIAL_BOOKINGS: ReceptionBooking[] = [
  {
    id: 'bk-saltanat',
    bookingNumber: 'R2G-MWAM38JY-V6TT',
    guestName: 'Абдрахманова Салтанат Ериковна',
    shortName: 'Салтанат',
    phone: '+7 (702) 555 31 51',
    email: '',
    roomNumber: '303',
    category: 'Люкс',
    guestsCount: 4,
    startDay: 9,
    endDay: 12,
    dateRangeText: '9 нояб. 2026 г. → 12 нояб. 2026 г.',
    nights: 3,
    status: 'CONFIRMED',
    source: 'Прямая бронь',
    totalAmount: '155 000 ₸',
    isPaid: false,
    tariff: 'По цене номера',
    notes: 'Не беспокоить до обеда.',
    bookingType: 'INDIVIDUAL',
    birthDate: '27 мар. 1992 г.',
    gender: 'Женский',
    nationality: '—',
    document: 'Удостоверение личности:\n030110866',
    manager: 'Hotel Admin',
    prepayment: '0 ₸',
    specialTags: ['с детьми', 'late_checkout', 'allergy', 'BB'],
    allergyNotice: 'Аллерген: мёд',
  },
  {
    id: 'bk-1',
    bookingNumber: 'BR-4101',
    guestName: 'Елена Соколова',
    shortName: 'Елена',
    phone: '+7 (701) 442-19-08',
    email: 'elena.sokolova@mail.kz',
    roomNumber: '102',
    category: 'Стандарт',
    guestsCount: 1,
    startDay: 2,
    endDay: 5,
    dateRangeText: '2 нояб. → 5 нояб.',
    nights: 3,
    status: 'CHECKED_OUT',
    source: 'Booking.com',
    totalAmount: '135 000 ₸',
    isPaid: true,
    tariff: 'Стандарт с завтраком',
    notes: 'Поздний выезд согласован до 12:00. Мини-бар проверен.',
    bookingType: 'INDIVIDUAL',
  },
  {
    id: 'bk-2',
    bookingNumber: 'BR-4102',
    guestName: 'Анна Смирнова',
    shortName: 'Анна',
    phone: '+7 (777) 290-55-12',
    email: 'a.smirnova@gmail.com',
    roomNumber: '303',
    category: 'Люкс',
    guestsCount: 2,
    startDay: 4,
    endDay: 8,
    dateRangeText: '4 нояб. → 8 нояб.',
    nights: 4,
    status: 'CHECKED_IN',
    source: 'Прямая бронь',
    totalAmount: '480 000 ₸',
    isPaid: true,
    tariff: 'Люкс Полный пансион',
    notes: 'VIP-гость. Пожелание: тихий номер с видом на сосновый бор, гипоаллергенные подушки.',
    bookingType: 'INDIVIDUAL',
  },
  {
    id: 'bk-3',
    bookingNumber: 'BR-4103',
    guestName: 'Ольга Петрова',
    shortName: 'Ольга',
    phone: '+7 (702) 815-33-40',
    email: 'olga.petrova@inbox.ru',
    roomNumber: '202',
    category: 'Комфорт',
    guestsCount: 2,
    startDay: 4,
    endDay: 7,
    dateRangeText: '4 нояб. → 7 нояб.',
    nights: 3,
    status: 'CHECKED_IN',
    source: 'Прямая бронь',
    totalAmount: '225 000 ₸',
    isPaid: true,
    tariff: 'Комфорт с завтраком',
    notes: 'Дополнительное детское одеяло доставлено в номер.',
    bookingType: 'INDIVIDUAL',
  },
  {
    id: 'bk-4',
    bookingNumber: 'BR-4104',
    guestName: 'Данияр Алиев',
    shortName: 'Данияр',
    phone: '+7 (701) 918-77-21',
    email: 'daniyar.aliyev@corp.kz',
    roomNumber: '101',
    category: 'Стандарт',
    guestsCount: 2,
    startDay: 5,
    endDay: 7,
    dateRangeText: '5 нояб. → 7 нояб.',
    nights: 2,
    status: 'CONFIRMED',
    source: 'Booking.com',
    totalAmount: '90 000 ₸',
    isPaid: true,
    tariff: 'Стандарт с завтраком',
    notes: 'Ожидается заезд с 14:00. Заказан трансфер из аэропорта.',
    bookingType: 'INDIVIDUAL',
  },
  {
    id: 'bk-5',
    bookingNumber: 'BR-4105',
    guestName: 'Алина Ким',
    shortName: 'Ал',
    phone: '+7 (705) 334-10-95',
    email: 'alina.kim@mail.kz',
    roomNumber: '103',
    category: 'Стандарт',
    guestsCount: 2,
    startDay: 5,
    endDay: 6,
    dateRangeText: '5 нояб. → 6 нояб.',
    nights: 1,
    status: 'NEW',
    source: 'От стойки',
    totalAmount: '45 000 ₸',
    isPaid: false,
    tariff: 'Базовый тариф',
    notes: 'Оплата при заселении на стойке ресепшна.',
    bookingType: 'QUICK',
  },
  {
    id: 'bk-6',
    bookingNumber: 'BR-4106',
    guestName: 'Марк Волков',
    shortName: 'Марк',
    phone: '+7 (701) 550-61-82',
    email: 'mark.volkov@ studio.kz',
    roomNumber: '301',
    category: 'Люкс',
    guestsCount: 2,
    startDay: 6,
    endDay: 9,
    dateRangeText: '6 нояб. → 9 нояб.',
    nights: 3,
    status: 'CONFIRMED',
    source: 'Прямая бронь',
    totalAmount: '360 000 ₸',
    isPaid: true,
    tariff: 'Люкс с завтраком и SPA',
    notes: 'Годовщина свадьбы — комплимент от отеля (фрукты и десерт).',
    bookingType: 'INDIVIDUAL',
  },
  {
    id: 'bk-7',
    bookingNumber: 'BR-4107',
    guestName: 'Николай Орлов',
    shortName: 'Николай',
    phone: '+7 (778) 612-09-44',
    email: 'n.orlov@tech.kz',
    roomNumber: '102',
    category: 'Стандарт',
    guestsCount: 2,
    startDay: 7,
    endDay: 10,
    dateRangeText: '7 нояб. → 10 нояб.',
    nights: 3,
    status: 'NEW',
    source: 'Booking.com',
    totalAmount: '135 000 ₸',
    isPaid: false,
    tariff: 'Стандарт с завтраком',
    notes: 'Требуется подтверждение гарантии карты.',
    bookingType: 'INDIVIDUAL',
  },
  {
    id: 'bk-8',
    bookingNumber: 'BR-4108',
    guestName: 'ТОО «Альфа»',
    shortName: 'ТОО',
    phone: '+7 (7172) 55-40-10',
    email: 'office@alpha-group.kz',
    roomNumber: '201',
    alsoRooms: ['202'],
    category: 'Комфорт',
    guestsCount: 3,
    startDay: 8,
    endDay: 11,
    dateRangeText: '8 нояб. → 11 нояб.',
    nights: 3,
    status: 'CONFIRMED',
    source: 'Корпоративный',
    totalAmount: '450 000 ₸',
    isPaid: true,
    tariff: 'Корпоративный B2B (2 номера: №201, №202)',
    notes: 'Групповой заезд сотрудников на конференцию. Закрывающие документы по безналичному расчёту.',
    bookingType: 'GROUP',
  },
  {
    id: 'bk-9',
    bookingNumber: 'BR-4109',
    guestName: 'София Романова',
    shortName: 'София',
    phone: '+7 (701) 774-88-33',
    email: 'sofia.romanova@gmail.com',
    roomNumber: '303',
    category: 'Люкс',
    guestsCount: 3,
    startDay: 9,
    endDay: 13,
    dateRangeText: '9 нояб. → 13 нояб.',
    nights: 4,
    status: 'NEW',
    source: 'Прямая бронь',
    totalAmount: '480 000 ₸',
    isPaid: false,
    tariff: 'Люкс Семейный',
    notes: 'Запрос на ранний заезд в 11:00 при наличии свободного номера.',
    bookingType: 'INDIVIDUAL',
  },
  {
    id: 'bk-10',
    bookingNumber: 'BR-4110',
    guestName: 'Тимур Касымов',
    shortName: 'Тимур',
    phone: '+7 (701) 412-90-11',
    email: 't.kassymov@mail.kz',
    roomNumber: '101',
    category: 'Стандарт',
    guestsCount: 2,
    startDay: 12,
    endDay: 16,
    dateRangeText: '12 нояб. → 16 нояб.',
    nights: 4,
    status: 'CONFIRMED',
    source: 'Booking.com',
    totalAmount: '180 000 ₸',
    isPaid: true,
    tariff: 'Стандарт с завтраком',
    notes: 'Пожелание: высокий матрас и тихий номер.',
    bookingType: 'INDIVIDUAL',
  },
  {
    id: 'bk-11',
    bookingNumber: 'BR-4111',
    guestName: 'Диана Сапарова',
    shortName: 'Диана',
    phone: '+7 (702) 998-31-04',
    email: 'diana.s@gmail.com',
    roomNumber: '202',
    category: 'Комфорт',
    guestsCount: 2,
    startDay: 14,
    endDay: 18,
    dateRangeText: '14 нояб. → 18 нояб.',
    nights: 4,
    status: 'NEW',
    source: 'Прямая бронь',
    totalAmount: '300 000 ₸',
    isPaid: false,
    tariff: 'Комфорт Полупансион',
    notes: 'Оплата при заезде.',
    bookingType: 'INDIVIDUAL',
  },
];

const INITIAL_WAITLIST: WaitlistEntry[] = [
  {
    id: 'wl-1',
    waitlistNumber: '№31',
    guestName: 'Николай Карпов',
    phone: '+7 (702) 555-49-32',
    desiredCategory: 'Стандарт',
    guestsCount: 2,
    desiredDates: '6 нояб. → 8 нояб.',
    checkinFull: '6 ноября 2026',
    checkoutFull: '8 ноября 2026',
    flexibleDates: true,
    nights: 2,
    priority: 'HIGH',
    status: 'WAITING',
    notes: 'Подойдёт заезд на день позже. Нужна двуспальная кровать.',
    createdAt: 'Сегодня, 10:15',
  },
  {
    id: 'wl-2',
    waitlistNumber: '№32',
    guestName: 'Мария Белова',
    phone: '+7 (701) 888-12-34',
    desiredCategory: 'Комфорт',
    guestsCount: 3,
    desiredDates: '7 нояб. → 10 нояб.',
    checkinFull: '7 ноября 2026',
    checkoutFull: '10 ноября 2026',
    flexibleDates: false,
    nights: 3,
    priority: 'NORMAL',
    status: 'WAITING',
    notes: 'Нужен тихий номер на 2 этаже и детская кроватка.',
    createdAt: 'Сегодня, 09:30',
  },
  {
    id: 'wl-3',
    waitlistNumber: '№33',
    guestName: 'Алексей Орлов',
    phone: '+7 (707) 333-21-00',
    desiredCategory: 'Люкс',
    guestsCount: 2,
    desiredDates: '12 нояб. → 15 нояб.',
    checkinFull: '12 ноября 2026',
    checkoutFull: '15 ноября 2026',
    flexibleDates: true,
    nights: 3,
    priority: 'HIGH',
    status: 'WAITING',
    notes: 'Постоянный гость. Возможен сдвиг дат на 1–2 дня при освобождении Люкса.',
    createdAt: 'Вчера, 17:40',
  },
];

const WEEK_DAYS = [
  { day: 5, dow: 'чт' },
  { day: 6, dow: 'пт' },
  { day: 7, dow: 'сб' },
  { day: 8, dow: 'вс' },
  { day: 9, dow: 'пн' },
  { day: 10, dow: 'вт' },
  { day: 11, dow: 'ср' },
];

const FOURTEEN_DAYS = [
  { day: 5, dow: 'чт' },
  { day: 6, dow: 'пт' },
  { day: 7, dow: 'сб' },
  { day: 8, dow: 'вс' },
  { day: 9, dow: 'пн' },
  { day: 10, dow: 'вт' },
  { day: 11, dow: 'ср' },
  { day: 12, dow: 'чт' },
  { day: 13, dow: 'пт' },
  { day: 14, dow: 'сб' },
  { day: 15, dow: 'вс' },
  { day: 16, dow: 'пн' },
  { day: 17, dow: 'вт' },
  { day: 18, dow: 'ср' },
];

export const ReceptionScreens: React.FC<ReceptionScreensProps> = ({
  lang,
  cleanerProfile,
  onUpdateCleanerProfile,
  onLogout,
  offlineMode,
  onToggleOffline,
  activeTab,
  onLanguageChange,
  onNavigateTab,
}) => {
  const [bookings, setBookings] = useState<ReceptionBooking[]>(INITIAL_BOOKINGS);
  const [waitlist, setWaitlist] = useState<WaitlistEntry[]>(INITIAL_WAITLIST);

  // Bookings Screen States
  const [viewMode, setViewMode] = useState<'CHESS' | 'LIST'>('CHESS');
  const [periodScale, setPeriodScale] = useState<'WEEK' | '14DAYS' | 'DAY'>('WEEK');
  const [periodStartDay, setPeriodStartDay] = useState<number>(5); // Default: Nov 5
  const [showScaleDropdown, setShowScaleDropdown] = useState<boolean>(false);
  const [showPeriodPicker, setShowPeriodPicker] = useState<boolean>(false);
  const [pickerStartDate, setPickerStartDate] = useState<string>('05.11.2026');
  const [pickerEndDate, setPickerEndDate] = useState<string>('11.11.2026');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');
  const [guestsFilter, setGuestsFilter] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [sourceFilter, setSourceFilter] = useState<string>('ALL');
  const [showFiltersMenu, setShowFiltersMenu] = useState<boolean>(false);
  const [selectedBooking, setSelectedBooking] = useState<ReceptionBooking | null>(null);
  const [cardMergeBooking, setCardMergeBooking] = useState<boolean>(false);
  const [cardNotifyGuest, setCardNotifyGuest] = useState<boolean>(false);
  const [cardEditableAmount, setCardEditableAmount] = useState<string>('155000');
  const [showFolioModal, setShowFolioModal] = useState<boolean>(false);
  const [showOrderServiceModal, setShowOrderServiceModal] = useState<boolean>(false);
  const [showGuestProfileModal, setShowGuestProfileModal] = useState<boolean>(false);
  const [chessDragSelection, setChessDragSelection] = useState<{
    roomNumber: string;
    category: BookingCategory;
    capacity: number;
    floor: number;
    startDay: number;
    currentDay: number;
  } | null>(null);
  const [chessPrefillInfo, setChessPrefillInfo] = useState<{
    roomNumber: string;
    category: BookingCategory;
    checkinDate: string;
    checkoutDate: string;
    nights: number;
  } | null>(null);

  // Create Booking Screen States
  const [createBookingType, setCreateBookingType] = useState<'NONE' | 'INDIVIDUAL' | 'GROUP' | 'QUICK'>('NONE');
  const [indStep, setIndStep] = useState<number>(1); // 1 to 4

  // Step 1: Проживание (Individual Booking)
  const [indCheckinDate, setIndCheckinDate] = useState<string>('06.11.2026');
  const [indCheckinTime, setIndCheckinTime] = useState<string>('14:00');
  const [indCheckoutDate, setIndCheckoutDate] = useState<string>('07.11.2026');
  const [indCheckoutTime, setIndCheckoutTime] = useState<string>('12:00');
  const [indCategoryCode, setIndCategoryCode] = useState<'Lux' | 'Comfort' | 'Standard'>('Lux');
  const [indRoomNumber, setIndRoomNumber] = useState<string>('303');
  const [indTariff, setIndTariff] = useState<string>('Тариф номера');
  const [indAdults, setIndAdults] = useState<string>('2');
  const [indChildren, setIndChildren] = useState<string>('0');
  const [indCompany, setIndCompany] = useState<string>('Без компании');
  const [indAgentDiscount, setIndAgentDiscount] = useState<string>('0');

  // Step 2: Основной гость & Другие гости
  const [indDbSearch, setIndDbSearch] = useState<string>('');
  const [indLastName, setIndLastName] = useState<string>('');
  const [indFirstName, setIndFirstName] = useState<string>('');
  const [indMiddleName, setIndMiddleName] = useState<string>('');
  const [indPhone, setIndPhone] = useState<string>('');
  const [indEmail, setIndEmail] = useState<string>('');
  const [indSource, setIndSource] = useState<BookingSource>('Прямая бронь');
  const [indDocType, setIndDocType] = useState<string>('');
  const [indDocNumber, setIndDocNumber] = useState<string>('');
  const [indBirthDate, setIndBirthDate] = useState<string>('');
  const [indGender, setIndGender] = useState<string>('');
  const [indNationality, setIndNationality] = useState<string>('');

  const [indOtherGuests, setIndOtherGuests] = useState<
    Array<{
      lastName: string;
      firstName: string;
      middleName: string;
      phone: string;
      docType: string;
      docNumber: string;
      birthDate: string;
      gender: string;
      nationality: string;
    }>
  >([
    {
      lastName: '',
      firstName: '',
      middleName: '',
      phone: '',
      docType: '',
      docNumber: '',
      birthDate: '',
      gender: '',
      nationality: '',
    },
  ]);

  // Step 3: Пожелания и услуги
  const [indMealPlan, setIndMealPlan] = useState<string>('Завтрак');
  const [indSpecialMarks, setIndSpecialMarks] = useState<string[]>([]);
  const [indLateCheckout, setIndLateCheckout] = useState<boolean>(false);
  const [indEarlyCheckin, setIndEarlyCheckin] = useState<boolean>(false);
  const [indSpecialWishes, setIndSpecialWishes] = useState<string>('');
  const [indWithPets, setIndWithPets] = useState<boolean>(false);
  const [indTags, setIndTags] = useState<string>('');
  const [indBookingNotes, setIndBookingNotes] = useState<string>('');
  const [indServices, setIndServices] = useState<Array<{ id: string; name: string; price: number }>>([]);
  const [showIndServicePicker, setShowIndServicePicker] = useState<boolean>(false);

  // Inline Service Order Form states for Step 3
  const [indOrderServiceId, setIndOrderServiceId] = useState<string>('srv-transfer');
  const [indOrderSlot, setIndOrderSlot] = useState<string>('06.11.2026 18:00');
  const [indOrderDuration, setIndOrderDuration] = useState<string>('—');
  const [indOrderPaymentTiming, setIndOrderPaymentTiming] = useState<string>('При выселении');
  const [indOrderFolioStatus, setIndOrderFolioStatus] = useState<string>('Не оплачено');
  const [indOrderSum, setIndOrderSum] = useState<string>('8000');
  const [indOrderToPay, setIndOrderToPay] = useState<string>('8000');
  const [indOrderComment, setIndOrderComment] = useState<string>('');

  // Step 4: Оплата и группа
  const [indCustomSum, setIndCustomSum] = useState<string | null>(null);
  const [indPrepayment, setIndPrepayment] = useState<string>('0');
  const [indPaymentAccount, setIndPaymentAccount] = useState<string>('Касса ресепшн');
  const [indIsPaid, setIndIsPaid] = useState<boolean>(false);
  const [indExistingGroup, setIndExistingGroup] = useState<string>('Без группы');

  // ==================== GROUP BOOKING WIZARD STATES (5 STEPS) ====================
  const [grpStep, setGrpStep] = useState<number>(1); // 1 to 5
  // Step 1: Компания и даты
  const [grpCheckinDate, setGrpCheckinDate] = useState<string>('06.11.2026');
  const [grpCheckinTime, setGrpCheckinTime] = useState<string>('14:00');
  const [grpCheckoutDate, setGrpCheckoutDate] = useState<string>('09.11.2026');
  const [grpCheckoutTime, setGrpCheckoutTime] = useState<string>('12:00');
  const [grpRegistryCompany, setGrpRegistryCompany] = useState<string>('Новая компания');
  const [grpCompanyName, setGrpCompanyName] = useState<string>('');
  const [grpTotalGuests, setGrpTotalGuests] = useState<string>('10');
  const [grpRoomsNeeded, setGrpRoomsNeeded] = useState<string>('1');
  const [grpAgentDiscount, setGrpAgentDiscount] = useState<string>('10');

  // Step 2: Номера (Распределение номеров)
  const [grpSelectedRooms, setGrpSelectedRooms] = useState<
    Array<{
      id: string;
      roomNumber: string;
      categoryName: string;
      floor: number;
      capacity: number;
      adults: string;
      children: string;
      pricePerNight: number;
      guestNames?: string;
    }>
  >([
    {
      id: 'gr-1',
      roomNumber: '304',
      categoryName: 'Семейный',
      floor: 3,
      capacity: 4,
      adults: '5',
      children: '0',
      pricePerNight: 32000,
      guestNames: '',
    },
    {
      id: 'gr-2',
      roomNumber: '305',
      categoryName: 'Семейный',
      floor: 3,
      capacity: 4,
      adults: '5',
      children: '0',
      pricePerNight: 32000,
      guestNames: '',
    },
  ]);
  const [showGrpRoomingModal, setShowGrpRoomingModal] = useState<boolean>(false);
  const [grpExpandedRoomIdx, setGrpExpandedRoomIdx] = useState<number | null>(0);
  const [grpExpandedGuestKey, setGrpExpandedGuestKey] = useState<string | null>('0-0');
  const [grpExpandedDocKey, setGrpExpandedDocKey] = useState<string | null>(null);
  const [grpRoomingGuests, setGrpRoomingGuests] = useState<
    Record<
      string,
      {
        lastName: string;
        firstName: string;
        middleName: string;
        phone: string;
        docType: string;
        docNumber: string;
        birthDate: string;
        gender: string;
        nationality: string;
      }
    >
  >({});

  // Step 3: Контакты (Контактное лицо группы)
  const [grpContactLastName, setGrpContactLastName] = useState<string>('');
  const [grpContactFirstName, setGrpContactFirstName] = useState<string>('');
  const [grpContactPhone, setGrpContactPhone] = useState<string>('');
  const [grpContactEmail, setGrpContactEmail] = useState<string>('');

  // Step 4: Пожелания и услуги
  const [grpMealPlan, setGrpMealPlan] = useState<string>('Полупансион');
  const [grpNotes, setGrpNotes] = useState<string>('');
  const [grpServices, setGrpServices] = useState<Array<{ id: string; name: string; price: number }>>([]);
  const [showGrpServicePicker, setShowGrpServicePicker] = useState<boolean>(false);

  // Step 5: Оплата
  const [grpCustomSum, setGrpCustomSum] = useState<string | null>(null);
  const [grpPrepayment, setGrpPrepayment] = useState<string>('0');
  const [grpPaymentAccount, setGrpPaymentAccount] = useState<string>('Касса ресепшн');
  const [grpIsPaid, setGrpIsPaid] = useState<boolean>(false);

  // ==================== QUICK BOOKING WIZARD STATES (3 STEPS) ====================
  const [qckStep, setQckStep] = useState<number>(1); // 1 to 3
  // Step 1: Размещение
  const [qckCheckinDate, setQckCheckinDate] = useState<string>('06.11.2026');
  const [qckCheckinTime, setQckCheckinTime] = useState<string>('14:00');
  const [qckCheckoutDate, setQckCheckoutDate] = useState<string>('07.11.2026');
  const [qckCheckoutTime, setQckCheckoutTime] = useState<string>('12:00');
  const [qckCategoryCode, setQckCategoryCode] = useState<'Lux' | 'Comfort' | 'Standard'>('Lux');
  const [qckRoomNumber, setQckRoomNumber] = useState<string>('303');
  const [qckAdults, setQckAdults] = useState<string>('1');
  const [qckChildren, setQckChildren] = useState<string>('0');
  const [qckTariff, setQckTariff] = useState<string>('Тариф номера');

  // Step 2: Гость
  const [qckLastName, setQckLastName] = useState<string>('');
  const [qckFirstName, setQckFirstName] = useState<string>('');
  const [qckMiddleName, setQckMiddleName] = useState<string>('');
  const [qckPhone, setQckPhone] = useState<string>('');
  const [qckSource, setQckSource] = useState<BookingSource>('Прямая бронь');
  const [qckDocType, setQckDocType] = useState<string>('');
  const [qckDocNumber, setQckDocNumber] = useState<string>('');
  const [qckBirthDate, setQckBirthDate] = useState<string>('');
  const [qckGender, setQckGender] = useState<string>('');

  // Step 3: Оплата
  const [qckCustomSum, setQckCustomSum] = useState<string | null>(null);
  const [qckPrepayment, setQckPrepayment] = useState<string>('0');
  const [qckPaymentAccount, setQckPaymentAccount] = useState<string>('Касса ресепшн');
  const [qckIsPaid, setQckIsPaid] = useState<boolean>(false);

  // Group / Quick fallback states
  const [newGuestName, setNewGuestName] = useState<string>('');
  const [newGuestPhone, setNewGuestPhone] = useState<string>('');
  const [newGuestEmail, setNewGuestEmail] = useState<string>('');
  const [newRoomCategory, setNewRoomCategory] = useState<BookingCategory>('Стандарт');
  const [newRoomNumber, setNewRoomNumber] = useState<string>('101');
  const [newGuestsCount, setNewGuestsCount] = useState<string>('2');
  const [newStartDay, setNewStartDay] = useState<string>('5');
  const [newEndDay, setNewEndDay] = useState<string>('8');
  const [newNotes, setNewNotes] = useState<string>('');

  // Waitlist Screen States
  const [waitlistCategoryFilter, setWaitlistCategoryFilter] = useState<string>('ALL');
  const [waitlistGuestsFilter, setWaitlistGuestsFilter] = useState<string>('ALL');
  const [waitlistSearch, setWaitlistSearch] = useState<string>('');
  const [selectedWaitlistItem, setSelectedWaitlistItem] = useState<WaitlistEntry | null>(null);
  const [editingWaitlistId, setEditingWaitlistId] = useState<string | null>(null);
  const [showCreateWaitlistModal, setShowCreateWaitlistModal] = useState<boolean>(false);
  const [wlGuestName, setWlGuestName] = useState<string>('');
  const [wlPhone, setWlPhone] = useState<string>('');
  const [wlCategory, setWlCategory] = useState<BookingCategory>('Стандарт');
  const [wlGuestsCount, setWlGuestsCount] = useState<string>('2');
  const [wlCheckin, setWlCheckin] = useState<string>('6 ноября 2026');
  const [wlCheckout, setWlCheckout] = useState<string>('8 ноября 2026');
  const [wlFlexible, setWlFlexible] = useState<boolean>(true);
  const [wlNotes, setWlNotes] = useState<string>('');

  // Profile Screen States
  const [shiftStatus, setShiftStatus] = useState<'ON_SHIFT' | 'ON_BREAK' | 'SHIFT_ENDED'>('SHIFT_ENDED');
  const [showQrShiftModal, setShowQrShiftModal] = useState<boolean>(false);
  const [isHistoryExpanded, setIsHistoryExpanded] = useState<boolean>(false);
  const [showNotifications, setShowNotifications] = useState<boolean>(false);
  const [showSettings, setShowSettings] = useState<boolean>(false);
  const [showChats, setShowChats] = useState<boolean>(false);
  const [activeChatId, setActiveChatId] = useState<string | null>(null);
  const [chatSearchQuery, setChatSearchQuery] = useState<string>('');
  const [chatInput, setChatInput] = useState<string>('');
  const [pushEnabled, setPushEnabled] = useState<boolean>(true);
  const [soundEnabled, setSoundEnabled] = useState<boolean>(false);
  const [notifFilter, setNotifFilter] = useState<'ALL' | 'BOOKINGS' | 'ROOMS' | 'SHIFT'>('ALL');
  const [lastSyncedTime, setLastSyncedTime] = useState<string>('09:41');
  const [isEditingProfile, setIsEditingProfile] = useState<boolean>(false);
  const [editFullName, setEditFullName] = useState<string>(cleanerProfile.fullName);
  const [editFullNameRu, setEditFullNameRu] = useState<string>(cleanerProfile.fullNameRu);
  const [editBadgeId, setEditBadgeId] = useState<string>(cleanerProfile.badgeId);
  const [editDeskAssigned, setEditDeskAssigned] = useState<string>('Стойка 1 · Лобби');
  const [editAvatarUrl, setEditAvatarUrl] = useState<string>(cleanerProfile.avatarUrl);

  const [receptionNotifs, setReceptionNotifs] = useState<
    Array<{
      id: string;
      title: string;
      sub: string;
      unread: boolean;
      category: 'BOOKINGS' | 'ROOMS' | 'SHIFT';
      dayGroup: 'TODAY' | 'YESTERDAY';
      urgent?: boolean;
      iconType: 'CLOCK_URGENT' | 'WRENCH' | 'MESSAGE' | 'BOOKING' | 'CHECK' | 'SHIFT';
    }>
  >([
    {
      id: 'rn-1',
      title: 'Гость ожидает ранний заезд в №303',
      sub: 'Запрос с 12:30 · индивидуальная бронь BR-4109',
      unread: true,
      category: 'BOOKINGS',
      dayGroup: 'TODAY',
      urgent: true,
      iconType: 'CLOCK_URGENT',
    },
    {
      id: 'rn-2',
      title: 'Техник завершил проверку №202',
      sub: 'Олег Петров · кондиционер исправен · 09:50',
      unread: true,
      category: 'ROOMS',
      dayGroup: 'TODAY',
      iconType: 'WRENCH',
    },
    {
      id: 'rn-3',
      title: 'Сообщение от руководителя ПиР',
      sub: 'Арман Нурланов · 09:32',
      unread: true,
      category: 'BOOKINGS',
      dayGroup: 'TODAY',
      iconType: 'MESSAGE',
    },
    {
      id: 'rn-4',
      title: 'Номер №301 готов к заселению',
      sub: 'Проверен супервайзером Светланой Ким · 08:45',
      unread: true,
      category: 'ROOMS',
      dayGroup: 'TODAY',
      iconType: 'CHECK',
    },
    {
      id: 'rn-5',
      title: 'Выезд гостя оформлен (№102)',
      sub: 'Елена Соколова · счёт и folio закрыты · 16:40',
      unread: false,
      category: 'BOOKINGS',
      dayGroup: 'YESTERDAY',
      iconType: 'CHECK',
    },
    {
      id: 'rn-6',
      title: 'Смена завершена',
      sub: '14 заселений за 12 ч 00 мин · 20:05',
      unread: false,
      category: 'SHIFT',
      dayGroup: 'YESTERDAY',
      iconType: 'SHIFT',
    },
  ]);

  const [receptionChats, setReceptionChats] = useState([
    {
      id: 'rc-1',
      name: 'Арман Нурланов',
      nameEn: 'Arman Nurlanov',
      role: 'руководитель службы пир',
      roleFull: 'Руководитель службы приёма и размещения',
      phone: '+7 (701) 450-12-88',
      pinned: true,
      lastMsg: 'Доброе утро! Смена активирована. Проверьте готовность №303 к VIP-заезду.',
      time: '08:00',
      unread: 0,
      messages: [
        {
          sender: 'OTHER' as const,
          text: 'Доброе утро! Смена активирована. Проверьте готовность №303 и №101 к VIP-заезду.',
          time: '08:00',
        },
      ],
      quickReplies: [
        'Доброе утро! №303 и №101 уже проверены, готовы к заселению.',
        'Принято, свяжусь с супервайзером этажа.',
        'Спасибо, документы и ключ-карты подготовлены!',
      ],
    },
    {
      id: 'rc-2',
      name: 'Алина Серикова',
      nameEn: 'Alina Serikova',
      role: 'менеджер доп. услуг',
      roleFull: 'Менеджер дополнительных услуг и SPA',
      phone: '+7 (702) 555-01-99',
      pinned: false,
      lastMsg: 'Динара, гость из №303 просил перенести SPA-слот на 19:00, добавишь в folio?',
      time: '13:02',
      unread: 1,
      messages: [
        {
          sender: 'OTHER' as const,
          text: 'Динара, гость из №303 просил перенести SPA-слот на 19:00, добавишь в folio?',
          time: '13:02',
        },
      ],
      quickReplies: [
        'Привет! Да, сейчас обновлю время слота и запишу в folio №303.',
        'Принято, уже внесла в карточку бронирования!',
      ],
    },
    {
      id: 'rc-3',
      name: 'Светлана Ким',
      nameEn: 'Svetlana Kim',
      role: 'супервайзер housekeeping',
      roleFull: 'Супервайзер службы горничных',
      phone: '+7 (705) 100-20-30',
      pinned: true,
      lastMsg: 'Пожалуйста, сверьте выезд по 202 номеру до 13:45.',
      time: '12:45',
      unread: 0,
      messages: [
        {
          sender: 'OTHER' as const,
          text: 'Пожалуйста, сверьте выезд по 202 номеру до 13:45. Горничная ждёт подтверждения.',
          time: '12:45',
        },
      ],
      quickReplies: [
        'Гость уже сдал ключи, номер свободен — можно начинать уборку.',
        'У гостя согласован поздний выезд до 14:00.',
      ],
    },
    {
      id: 'rc-4',
      name: 'Олег Петров',
      nameEn: 'Oleg Petrov',
      role: 'старший техник',
      roleFull: 'Инженерно-техническая служба',
      phone: '+7 (707) 320-44-10',
      pinned: false,
      lastMsg: 'Замок в №103 перепрограммирован, ключ-карты работают штатно.',
      time: 'Вчера',
      unread: 0,
      messages: [
        {
          sender: 'OTHER' as const,
          text: 'Замок в №103 перепрограммирован, ключ-карты работают штатно.',
          time: 'Вчера',
        },
      ],
      quickReplies: [
        'Отлично, спасибо за оперативность!',
        'Принято, снимаю блокировку с №103 в шахматке.',
      ],
    },
  ]);

  // Date & Period Helpers (Base: November 2026, where Nov 5 is Thursday 'чт')
  const getDowForNovDay = (dayOffset: number) => {
    const dows = ['вс', 'пн', 'вт', 'ср', 'чт', 'пт', 'сб'];
    const idx = (((dayOffset - 1) % 7) + 7) % 7;
    return dows[idx];
  };

  const getDisplayDayNumber = (dayOffset: number) => {
    if (dayOffset < 1) return 31 + dayOffset; // October (31 days)
    if (dayOffset > 30) return dayOffset - 30; // December
    return dayOffset;
  };

  const formatSingleDayLabel = (dayOffset: number) => {
    if (dayOffset < 1) return `${31 + dayOffset} октября`;
    if (dayOffset > 30) return `${dayOffset - 30} декабря`;
    return `${dayOffset} ноября`;
  };

  const formatShortMonthDay = (dayOffset: number) => {
    if (dayOffset < 1) return `${31 + dayOffset} окт.`;
    if (dayOffset > 30) return `${dayOffset - 30} дек.`;
    return `${dayOffset} нояб.`;
  };

  const periodLength = periodScale === 'DAY' ? 1 : periodScale === 'WEEK' ? 7 : 14;
  const periodEndDay = periodStartDay + periodLength - 1;

  const getPeriodHeaderLabel = () => {
    if (periodScale === 'DAY') {
      return formatSingleDayLabel(periodStartDay);
    }
    // Both start and end in November
    if (periodStartDay >= 1 && periodEndDay <= 30) {
      return `${periodStartDay}–${periodEndDay} ноября`;
    }
    //Both in October
    if (periodStartDay < 1 && periodEndDay < 1) {
      return `${31 + periodStartDay}–${31 + periodEndDay} октября`;
    }
    // Both in December
    if (periodStartDay > 30 && periodEndDay > 30) {
      return `${periodStartDay - 30}–${periodEndDay - 30} декабря`;
    }
    return `${formatShortMonthDay(periodStartDay)} – ${formatShortMonthDay(periodEndDay)}`;
  };

  const handleShiftPeriod = (direction: -1 | 1) => {
    const step = periodScale === 'DAY' ? 1 : periodScale === 'WEEK' ? 7 : 14;
    setPeriodStartDay((prev) => prev + direction * step);
  };

  const formatDayOffsetToDateStr = (dayOffset: number) => {
    if (dayOffset < 1) {
      const d = String(31 + dayOffset).padStart(2, '0');
      return `${d}.10.2026`;
    }
    if (dayOffset > 30) {
      const d = String(dayOffset - 30).padStart(2, '0');
      return `${d}.12.2026`;
    }
    const d = String(dayOffset).padStart(2, '0');
    return `${d}.11.2026`;
  };

  const parseDateStrToNovDayOffset = (dateStr: string, fallback: number): number => {
    const parts = dateStr.trim().split('.');
    if (parts.length < 2) return fallback;
    const day = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10);
    if (isNaN(day) || isNaN(month)) return fallback;
    if (month === 10) return day - 31;
    if (month === 12) return 30 + day;
    return day;
  };

  const formatRuDateToIso = (ruDate: string): string => {
    const parts = ruDate.trim().split('.');
    if (parts.length !== 3) return '2026-11-05';
    const [dd, mm, yyyy] = parts;
    return `${yyyy}-${mm.padStart(2, '0')}-${dd.padStart(2, '0')}`;
  };

  const formatIsoToRuDate = (isoDate: string): string => {
    const parts = isoDate.trim().split('-');
    if (parts.length !== 3) return '05.11.2026';
    const [yyyy, mm, dd] = parts;
    return `${dd.padStart(2, '0')}.${mm.padStart(2, '0')}.${yyyy}`;
  };

  const handleOpenPeriodPicker = () => {
    setPickerStartDate(formatDayOffsetToDateStr(periodStartDay));
    setPickerEndDate(formatDayOffsetToDateStr(periodEndDay));
    setShowPeriodPicker((prev) => !prev);
    setShowScaleDropdown(false);
  };

  const handlePickerStartDateChange = (newStartStr: string) => {
    setPickerStartDate(newStartStr);
    const parsedStart = parseDateStrToNovDayOffset(newStartStr, periodStartDay);
    const span = periodScale === 'DAY' ? 0 : periodScale === 'WEEK' ? 6 : 13;
    setPickerEndDate(formatDayOffsetToDateStr(parsedStart + span));
  };

  const handleApplyPeriodPicker = () => {
    const parsedStart = parseDateStrToNovDayOffset(pickerStartDate, periodStartDay);
    setPeriodStartDay(parsedStart);
    setShowPeriodPicker(false);
  };

  const handleApplyChessSelection = (
    room: { roomNumber: string; category: BookingCategory; capacity: number; floor: number },
    startDay: number,
    endDay: number
  ) => {
    const normalizedStart = Math.min(startDay, endDay);
    const normalizedEnd = Math.max(normalizedStart + 1, Math.max(startDay, endDay));
    const checkinStr = formatDayOffsetToDateStr(normalizedStart);
    const checkoutStr = formatDayOffsetToDateStr(normalizedEnd);
    const catCode: 'Lux' | 'Comfort' | 'Standard' =
      room.category === 'Люкс' ? 'Lux' : room.category === 'Комфорт' ? 'Comfort' : 'Standard';
    const pricePerNight =
      room.category === 'Люкс' ? 50000 : room.category === 'Комфорт' ? 35000 : 25000;

    // Pre-fill Individual Booking Wizard
    setIndCheckinDate(checkinStr);
    setIndCheckoutDate(checkoutStr);
    setIndCategoryCode(catCode);
    setIndRoomNumber(room.roomNumber);
    setIndAdults(String(Math.min(2, room.capacity)));
    setIndStep(1);

    // Pre-fill Quick Booking Wizard
    setQckCheckinDate(checkinStr);
    setQckCheckoutDate(checkoutStr);
    setQckCategoryCode(catCode);
    setQckRoomNumber(room.roomNumber);
    setQckAdults('1');
    setQckStep(1);

    // Pre-fill Group Booking Wizard
    setGrpCheckinDate(checkinStr);
    setGrpCheckoutDate(checkoutStr);
    setGrpSelectedRooms((prev) => {
      const exists = prev.some((r) => r.roomNumber === room.roomNumber);
      if (exists) return prev;
      return [
        {
          id: `gr-chess-${room.roomNumber}`,
          roomNumber: room.roomNumber,
          categoryName: room.category,
          floor: room.floor,
          capacity: room.capacity,
          adults: String(room.capacity),
          children: '0',
          pricePerNight,
          guestNames: '',
        },
        ...prev.slice(0, 1),
      ];
    });
    setGrpStep(1);

    // Legacy fallback states
    setNewRoomCategory(room.category);
    setNewRoomNumber(room.roomNumber);
    setNewStartDay(String(normalizedStart));
    setNewEndDay(String(normalizedEnd));

    setChessPrefillInfo({
      roomNumber: room.roomNumber,
      category: room.category,
      checkinDate: checkinStr,
      checkoutDate: checkoutStr,
      nights: normalizedEnd - normalizedStart,
    });

    setCreateBookingType('INDIVIDUAL');
    if (onNavigateTab) onNavigateTab('RECEPTION_CREATE');
  };

  const activeFiltersCount = [
    categoryFilter !== 'ALL',
    guestsFilter !== 'ALL',
    statusFilter !== 'ALL',
    sourceFilter !== 'ALL',
  ].filter(Boolean).length;

  // Filter Bookings
  const filteredBookings = bookings.filter((b) => {
    // Filter by current period [periodStartDay .. periodEndDay]
    if (b.endDay < periodStartDay || b.startDay > periodEndDay) return false;
    if (categoryFilter !== 'ALL' && b.category !== categoryFilter) return false;
    if (guestsFilter !== 'ALL' && b.guestsCount !== Number(guestsFilter)) return false;
    if (statusFilter !== 'ALL' && b.status !== statusFilter) return false;
    if (sourceFilter !== 'ALL' && b.source !== sourceFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchName = b.guestName.toLowerCase().includes(q);
      const matchPhone = b.phone.toLowerCase().includes(q);
      const matchNum = b.bookingNumber.toLowerCase().includes(q) || b.roomNumber.includes(q);
      if (!matchName && !matchPhone && !matchNum) return false;
    }
    return true;
  });

  // Status Helpers matching exact colors from screenshots
  const getStatusBadge = (status: BookingStatus) => {
    switch (status) {
      case 'NEW':
        return {
          label: lang === 'RU' ? 'Новая' : 'New',
          dotColor: 'bg-[#D9822B]',
          pillBg: 'bg-[#F8EFE0]',
          pillText: 'text-[#8F5B1D]',
          chessBg: 'bg-[#F6ECDC]',
          chessBorder: 'border-l-[#D9822B]',
          chessText: 'text-[#734816]',
        };
      case 'CONFIRMED':
        return {
          label: lang === 'RU' ? 'Подтверждена' : 'Confirmed',
          dotColor: 'bg-[#4B7F52]',
          pillBg: 'bg-[#E6F0E8]',
          pillText: 'text-[#2E623C]',
          chessBg: 'bg-[#E4EFE7]',
          chessBorder: 'border-l-[#4B7F52]',
          chessText: 'text-[#28593A]',
        };
      case 'CHECKED_IN':
        return {
          label: lang === 'RU' ? 'Заселён' : 'Checked In',
          dotColor: 'bg-[#B94A2C]',
          pillBg: 'bg-[#F5E4DC]',
          pillText: 'text-[#96361C]',
          chessBg: 'bg-[#F3E3D8]',
          chessBorder: 'border-l-[#B94A2C]',
          chessText: 'text-[#7A2713]',
        };
      case 'CHECKED_OUT':
        return {
          label: lang === 'RU' ? 'Выехал' : 'Checked Out',
          dotColor: 'bg-[#8A8177]',
          pillBg: 'bg-[#EFECE6]',
          pillText: 'text-[#635C54]',
          chessBg: 'bg-[#EFECE6]',
          chessBorder: 'border-l-[#8A8177]',
          chessText: 'text-[#5C544D]',
        };
    }
  };

  const handleUpdateBookingStatus = (bookingId: string, nextStatus: BookingStatus) => {
    setBookings((prev) =>
      prev.map((b) => (b.id === bookingId ? { ...b, status: nextStatus } : b))
    );
    if (selectedBooking && selectedBooking.id === bookingId) {
      setSelectedBooking({ ...selectedBooking, status: nextStatus });
    }
  };

  const handleCreateNewBooking = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newGuestName.trim()) return;
    const sDay = Math.max(1, Math.min(28, Number(newStartDay) || 5));
    const eDay = Math.max(sDay + 1, Math.min(30, Number(newEndDay) || sDay + 2));
    const nights = eDay - sDay;
    const pricePerNight = newRoomCategory === 'Люкс' ? 120000 : newRoomCategory === 'Комфорт' ? 75000 : 45000;
    const total = (nights * pricePerNight).toLocaleString('ru-RU') + ' ₸';

    const created: ReceptionBooking = {
      id: `bk-${Date.now()}`,
      bookingNumber: `BR-${Math.floor(4110 + Math.random() * 890)}`,
      guestName: newGuestName.trim(),
      shortName: newGuestName.trim().split(' ')[0],
      phone: newGuestPhone.trim() || '+7 (701) 000-00-00',
      email: newGuestEmail.trim() || 'guest@sollviera.kz',
      roomNumber: newRoomNumber,
      category: newRoomCategory,
      guestsCount: Number(newGuestsCount) || 2,
      startDay: sDay,
      endDay: eDay,
      dateRangeText: `${sDay} нояб. → ${eDay} нояб.`,
      nights,
      status: createBookingType === 'QUICK' ? 'CHECKED_IN' : 'NEW',
      source: createBookingType === 'QUICK' ? 'От стойки' : createBookingType === 'GROUP' ? 'Корпоративный' : 'Прямая бронь',
      totalAmount: total,
      isPaid: createBookingType === 'QUICK',
      tariff:
        createBookingType === 'GROUP'
          ? 'Корпоративный B2B'
          : createBookingType === 'QUICK'
          ? 'От стойки · Экспресс-заселение'
          : `${newRoomCategory} с завтраком`,
      notes: newNotes.trim() || 'Создано через мобильный терминал ресепшна.',
      bookingType: createBookingType === 'NONE' ? 'INDIVIDUAL' : createBookingType,
    };

    setBookings((prev) => [created, ...prev]);
    setNewGuestName('');
    setNewGuestPhone('');
    setNewGuestEmail('');
    setNewNotes('');
    setCreateBookingType('NONE');
    if (onNavigateTab) {
      onNavigateTab('RECEPTION_BOOKINGS');
    }
  };

  const formatWaitlistInputToFullRu = (val: string): string => {
    const trimmed = val.trim();
    const parts = trimmed.split('.');
    if (parts.length === 3) {
      const d = parseInt(parts[0], 10);
      const m = parseInt(parts[1], 10);
      const y = parts[2];
      const months = [
        'января',
        'февраля',
        'марта',
        'апреля',
        'мая',
        'июня',
        'июля',
        'августа',
        'сентября',
        'октября',
        'ноября',
        'декабря',
      ];
      if (!isNaN(d) && m >= 1 && m <= 12) {
        return `${d} ${months[m - 1]} ${y}`;
      }
    }
    return trimmed;
  };

  const formatWaitlistFullToDotDate = (fullStr: string, fallback: string): string => {
    const trimmed = fullStr.trim();
    if (/^\d{2}\.\d{2}\.\d{4}$/.test(trimmed)) return trimmed;
    const match = trimmed.match(/^(\d{1,2})\s+([а-яА-Яa-zA-Z.]+)(?:\s+(\d{4}))?/);
    if (match) {
      const day = match[1].padStart(2, '0');
      const mStr = match[2].toLowerCase();
      const year = match[3] || '2026';
      const monthMap: Record<string, string> = {
        января: '01',
        февраля: '02',
        марта: '03',
        апреля: '04',
        мая: '05',
        июня: '06',
        июля: '07',
        августа: '08',
        сентября: '09',
        октября: '10',
        ноября: '11',
        декабря: '12',
      };
      const mm = monthMap[mStr] || '11';
      return `${day}.${mm}.${year}`;
    }
    return fallback;
  };

  const handleCreateWaitlistEntry = (e: React.FormEvent) => {
    e.preventDefault();
    if (!wlGuestName.trim()) return;
    const fullCheckin = formatWaitlistInputToFullRu(wlCheckin || '06.11.2026');
    const fullCheckout = formatWaitlistInputToFullRu(wlCheckout || '08.11.2026');
    const shortIn = fullCheckin
      .replace(' ноября 2026', ' нояб.')
      .replace(' октября 2026', ' окт.')
      .replace(' декабря 2026', ' дек.')
      .replace(' ноября', ' нояб.');
    const shortOut = fullCheckout
      .replace(' ноября 2026', ' нояб.')
      .replace(' октября 2026', ' окт.')
      .replace(' декабря 2026', ' дек.')
      .replace(' ноября', ' нояб.');
    const shortRange = `${shortIn} → ${shortOut}`;

    if (editingWaitlistId) {
      setWaitlist((prev) =>
        prev.map((w) =>
          w.id === editingWaitlistId
            ? {
                ...w,
                guestName: wlGuestName.trim(),
                phone: wlPhone.trim() || '+7 (701) 000-00-00',
                desiredCategory: wlCategory,
                guestsCount: Number(wlGuestsCount) || 2,
                desiredDates: shortRange,
                checkinFull: fullCheckin,
                checkoutFull: fullCheckout,
                flexibleDates: wlFlexible,
                notes: wlNotes.trim() || 'Без комментариев.',
              }
            : w
        )
      );
      if (selectedWaitlistItem && selectedWaitlistItem.id === editingWaitlistId) {
        setSelectedWaitlistItem({
          ...selectedWaitlistItem,
          guestName: wlGuestName.trim(),
          phone: wlPhone.trim() || '+7 (701) 000-00-00',
          desiredCategory: wlCategory,
          guestsCount: Number(wlGuestsCount) || 2,
          desiredDates: shortRange,
          checkinFull: fullCheckin,
          checkoutFull: fullCheckout,
          flexibleDates: wlFlexible,
          notes: wlNotes.trim() || 'Без комментариев.',
        });
      }
      setEditingWaitlistId(null);
      setShowCreateWaitlistModal(false);
      return;
    }

    const entry: WaitlistEntry = {
      id: `wl-${Date.now()}`,
      waitlistNumber: `№${31 + waitlist.length}`,
      guestName: wlGuestName.trim(),
      phone: wlPhone.trim() || '+7 (701) 000-00-00',
      desiredCategory: wlCategory,
      guestsCount: Number(wlGuestsCount) || 2,
      desiredDates: shortRange,
      checkinFull: fullCheckin,
      checkoutFull: fullCheckout,
      flexibleDates: wlFlexible,
      nights: 2,
      priority: 'NORMAL',
      status: 'WAITING',
      notes: wlNotes.trim() || 'Подойдёт заезд на день позже. Нужна двуспальная кровать.',
      createdAt: 'Только что',
    };
    setWaitlist((prev) => [...prev, entry]);
    setWlGuestName('');
    setWlPhone('');
    setWlNotes('');
    setShowCreateWaitlistModal(false);
  };

  // ==================== BOOKING DETAILS OVERLAY (SCREENSHOTS 1-5) ====================
  if (selectedBooking) {
    const isConfirmed = selectedBooking.status === 'CONFIRMED';
    const isCheckedIn = selectedBooking.status === 'CHECKED_IN';
    const isCheckedOut = selectedBooking.status === 'CHECKED_OUT';

    // Status label and colors matching the screenshots
    const statusLabel =
      selectedBooking.status === 'CONFIRMED'
        ? 'Подтверждена'
        : selectedBooking.status === 'CHECKED_IN'
        ? 'Заселён'
        : selectedBooking.status === 'CHECKED_OUT'
        ? 'Выехал'
        : 'Новая';

    const statusPillClass =
      selectedBooking.status === 'CONFIRMED'
        ? 'bg-[#EAF3EC] text-[#3D7C52] border border-[#CDE3D2]'
        : selectedBooking.status === 'CHECKED_IN'
        ? 'bg-[#FBECE7] text-[#B94A2C] border border-[#F2C9BE]'
        : selectedBooking.status === 'CHECKED_OUT'
        ? 'bg-[#EFECE6] text-[#6E665E] border border-[#DDD8CF]'
        : 'bg-[#FAF2E6] text-[#C2410C] border border-[#F2D7C2]';

    const statusDotClass =
      selectedBooking.status === 'CONFIRMED'
        ? 'bg-[#4B7F52]'
        : selectedBooking.status === 'CHECKED_IN'
        ? 'bg-[#B94A2C]'
        : selectedBooking.status === 'CHECKED_OUT'
        ? 'bg-[#8A8177]'
        : 'bg-[#D9822B]';

    const categoryEn =
      selectedBooking.category === 'Люкс'
        ? 'Lux'
        : selectedBooking.category === 'Комфорт'
        ? 'Comfort'
        : 'Standard';

    const bookingTotalNumeric = parseInt(
      (selectedBooking.totalAmount || '155 000').replace(/\D/g, ''),
      10
    ) || 155000;

    const ratePerNight = Math.round(bookingTotalNumeric / Math.max(1, selectedBooking.nights));

    return (
      <div className="flex-1 flex flex-col bg-[#FAF7F3] overflow-hidden animate-in slide-in-from-right duration-200">
        {/* Top Back Navigation Bar */}
        <div className="px-5 pt-3.5 pb-2 flex items-center justify-between shrink-0 bg-[#FAF7F3]">
          <button
            type="button"
            onClick={() => setSelectedBooking(null)}
            className="flex items-center gap-2 text-xs font-sans text-[#6E665E] hover:text-[#241E1A] cursor-pointer py-1"
          >
            <ChevronLeft className="h-4 w-4 text-[#241E1A]" />
            <span>{lang === 'RU' ? 'Бронирования' : 'Bookings'}</span>
          </button>
        </div>

        {/* Scrollable Content Body */}
        <div className="flex-1 overflow-y-auto px-5 pt-1 pb-24 space-y-5 no-scrollbar">
          {/* Header Block: Code, Status Pill, Full Name, Subtitle */}
          <div>
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-sans text-[#8A8177] tracking-wider uppercase">
                {selectedBooking.bookingNumber}
              </span>
              <span
                className={`px-2.5 py-1 rounded-full text-[11px] font-sans font-medium flex items-center gap-1.5 shrink-0 ${statusPillClass}`}
              >
                <span className={`h-1.5 w-1.5 rounded-full ${statusDotClass}`} />
                {statusLabel}
              </span>
            </div>

            <h1 className="text-[26px] font-serif font-normal text-[#241E1A] mt-2.5 leading-snug">
              {selectedBooking.guestName}
            </h1>

            <p className="text-xs font-sans text-[#8A8177] mt-1.5">
              {selectedBooking.bookingType === 'GROUP'
                ? 'Групповая'
                : selectedBooking.bookingType === 'QUICK'
                ? 'Быстрая'
                : 'Индивидуальная'}{' '}
              · {selectedBooking.guestsCount}{' '}
              {selectedBooking.guestsCount === 1
                ? 'гость'
                : selectedBooking.guestsCount < 5
                ? 'гостя'
                : 'гостей'}{' '}
              / 1 номер
            </p>
          </div>

          {/* ==================== 1. ДАТЫ ПРОЖИВАНИЯ ==================== */}
          <div className="space-y-2">
            <span className="text-[11px] font-sans uppercase tracking-wider text-[#8A8177] block font-medium">
              ДАТЫ ПРОЖИВАНИЯ
            </span>
            <div className="bg-white rounded-[18px] border border-[#E5E2DD] p-4 flex items-center justify-between shadow-2xs">
              <div>
                <span className="text-[11px] font-sans text-[#8A8177] block">Заезд</span>
                <span className="text-sm font-sans font-medium text-[#241E1A] mt-0.5 block">
                  {selectedBooking.startDay} нояб. 2026 г.
                </span>
                <span className="text-xs font-sans text-[#8A8177] mt-0.5 block">14:00</span>
              </div>

              <div className="px-3.5 py-1 rounded-full bg-[#241E1A] text-white text-xs font-sans font-medium shrink-0">
                {selectedBooking.nights}{' '}
                {selectedBooking.nights === 1
                  ? 'ночь'
                  : selectedBooking.nights < 5
                  ? 'ночи'
                  : 'ночей'}
              </div>

              <div className="text-right">
                <span className="text-[11px] font-sans text-[#8A8177] block">Выезд</span>
                <span className="text-sm font-sans font-medium text-[#241E1A] mt-0.5 block">
                  {selectedBooking.endDay} нояб. 2026 г.
                </span>
                <span className="text-xs font-sans text-[#8A8177] mt-0.5 block">12:00</span>
              </div>
            </div>
          </div>

          {/* ==================== 2. НОМЕРА ==================== */}
          <div className="space-y-2">
            <span className="text-[11px] font-sans uppercase tracking-wider text-[#8A8177] block font-medium">
              НОМЕРА
            </span>
            <div className="bg-white rounded-[18px] border border-[#E5E2DD] p-4 space-y-3 shadow-2xs">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2.5">
                  <BedDouble className="h-4.5 w-4.5 text-[#241E1A] stroke-[1.8]" />
                  <span className="text-base font-sans font-medium text-[#241E1A]">
                    {categoryEn} · {selectedBooking.roomNumber}
                  </span>
                </div>
                <span className="px-2.5 py-1 rounded-[10px] bg-[#FAF7F3] border border-[#E5E2DD] text-[11px] font-sans text-[#6E665E]">
                  {selectedBooking.guestsCount} взрослых
                </span>
              </div>

              <div className="pt-2 border-t border-[#F0ECE6] flex items-center justify-between text-xs font-sans">
                <span className="text-[#8A8177]">
                  {selectedBooking.tariff || 'По цене номера'}
                </span>
                <div className="text-right">
                  <span className="text-sm font-sans font-semibold text-[#241E1A]">
                    {ratePerNight.toLocaleString('ru-RU')} ₸
                  </span>
                  <span className="text-[#8A8177] text-xs">/ночь</span>
                </div>
              </div>
            </div>
          </div>

          {/* ==================== 3. КОНТАКТЫ ==================== */}
          <div className="space-y-2">
            <span className="text-[11px] font-sans uppercase tracking-wider text-[#8A8177] block font-medium">
              КОНТАКТЫ
            </span>
            <div className="bg-white rounded-[18px] border border-[#E5E2DD] p-4.5 space-y-3.5 shadow-2xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <span className="text-[11px] font-sans text-[#8A8177] block">Телефон</span>
                  <a
                    href={`tel:${selectedBooking.phone}`}
                    className="text-sm font-sans font-medium text-[#241E1A] mt-0.5 block hover:text-[#C2410C]"
                  >
                    {selectedBooking.phone}
                  </a>
                </div>
                <div>
                  <span className="text-[11px] font-sans text-[#8A8177] block">E-mail</span>
                  <span className="text-sm font-sans text-[#241E1A] mt-0.5 block">
                    {selectedBooking.email || '—'}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-1 border-t border-[#F0ECE6]">
                <div>
                  <span className="text-[11px] font-sans text-[#8A8177] block">Дата рождения</span>
                  <span className="text-sm font-sans text-[#241E1A] mt-0.5 block">
                    {selectedBooking.birthDate || '27 мар. 1992 г.'}
                  </span>
                </div>
                <div>
                  <span className="text-[11px] font-sans text-[#8A8177] block">Пол</span>
                  <span className="text-sm font-sans text-[#241E1A] mt-0.5 block">
                    {selectedBooking.gender || 'Женский'}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-1 border-t border-[#F0ECE6]">
                <div>
                  <span className="text-[11px] font-sans text-[#8A8177] block">Национальность</span>
                  <span className="text-sm font-sans text-[#241E1A] mt-0.5 block">
                    {selectedBooking.nationality || '—'}
                  </span>
                </div>
                <div>
                  <span className="text-[11px] font-sans text-[#8A8177] block">Документ</span>
                  <div className="text-xs font-sans text-[#241E1A] mt-0.5 leading-tight">
                    {selectedBooking.document ? (
                      selectedBooking.document.split('\n').map((line, i) => (
                        <span key={i} className="block">
                          {line}
                        </span>
                      ))
                    ) : (
                      <>
                        <span className="block text-[#6E665E]">Удостоверение личности:</span>
                        <span className="block font-medium mt-0.5">030110866</span>
                      </>
                    )}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-1 border-t border-[#F0ECE6]">
                <div>
                  <span className="text-[11px] font-sans text-[#8A8177] block">Менеджер</span>
                  <span className="text-sm font-sans text-[#241E1A] mt-0.5 block">
                    {selectedBooking.manager || 'Hotel Admin'}
                  </span>
                </div>
                <div>
                  <span className="text-[11px] font-sans text-[#8A8177] block">Источник</span>
                  <span className="text-sm font-sans text-[#241E1A] mt-0.5 block">
                    {selectedBooking.source || 'Прямая бронь'}
                  </span>
                </div>
              </div>
            </div>

            {/* Profile link */}
            <div className="pt-0.5">
              <button
                type="button"
                onClick={() => setShowGuestProfileModal(true)}
                className="flex items-center gap-1.5 text-xs font-sans text-[#C2410C] hover:underline cursor-pointer"
              >
                <span>Профиль гостя</span>
                <ExternalLink className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>

          {/* ==================== 4. ОБЪЕДИНИТЬ БРОНИ ==================== */}
          <div className="space-y-2">
            <span className="text-[11px] font-sans uppercase tracking-wider text-[#8A8177] block font-medium">
              ОБЪЕДИНИТЬ БРОНИ
            </span>
            <div
              onClick={() => setCardMergeBooking((prev) => !prev)}
              className="bg-white rounded-[16px] border border-[#E5E2DD] p-4 flex items-center gap-3 cursor-pointer shadow-2xs hover:border-[#C2410C]/40 transition-colors"
            >
              <div
                className={`h-5 w-5 rounded-[6px] border flex items-center justify-center transition-colors ${
                  cardMergeBooking
                    ? 'bg-[#C2410C] border-[#C2410C] text-white'
                    : 'border-[#CCC5BA] bg-white'
                }`}
              >
                {cardMergeBooking && <Check className="h-3.5 w-3.5 stroke-[3]" />}
              </div>
              <span className="text-xs font-sans text-[#241E1A]">Объединить бронь</span>
            </div>
          </div>

          {/* ==================== 5. ОПЛАТА ==================== */}
          <div className="space-y-2">
            <span className="text-[11px] font-sans uppercase tracking-wider text-[#8A8177] block font-medium">
              ОПЛАТА
            </span>
            <div className="bg-white rounded-[18px] border border-[#E5E2DD] p-4 space-y-3.5 shadow-2xs">
              <div>
                <label className="text-xs font-sans text-[#8A8177] block mb-1.5">
                  Сумма к оплате
                </label>
                <div className="relative bg-white border border-[#E5E2DD] rounded-[14px] px-3.5 py-2.5 flex items-center justify-between">
                  <input
                    type="text"
                    value={cardEditableAmount}
                    onChange={(e) => setCardEditableAmount(e.target.value)}
                    className="w-full bg-transparent text-base font-sans font-medium text-[#241E1A] focus:outline-none"
                  />
                  <span className="text-sm font-sans text-[#8A8177] ml-2 select-none">₸</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-1">
                <div>
                  <span className="text-xs font-sans text-[#8A8177] block">Предоплата</span>
                  <span className="text-sm font-sans font-medium text-[#241E1A] mt-0.5 block">
                    {selectedBooking.prepayment || '0 ₸'}
                  </span>
                </div>
                <div>
                  <span className="text-xs font-sans text-[#8A8177] block">Статус</span>
                  <span className="text-sm font-sans font-medium text-[#241E1A] mt-0.5 block">
                    {selectedBooking.isPaid ? 'Оплачено' : 'Не оплачено'}
                  </span>
                </div>
              </div>

              <div className="pt-2 border-t border-[#F0ECE6] flex items-center justify-between">
                <span className="text-xs font-sans text-[#8A8177]">К доплате</span>
                <span className="text-lg font-sans font-semibold text-[#B93800]">
                  {parseInt(cardEditableAmount || '0', 10).toLocaleString('ru-RU')} ₸
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2.5 pt-1">
                <button
                  type="button"
                  onClick={() => {
                    handleUpdateBookingStatus(selectedBooking.id, 'CONFIRMED');
                    setBookings((prev) =>
                      prev.map((b) =>
                        b.id === selectedBooking.id ? { ...b, isPaid: true } : b
                      )
                    );
                    setSelectedBooking((prev) => (prev ? { ...prev, isPaid: true } : null));
                  }}
                  className="py-3 rounded-[12px] bg-[#B93800] hover:bg-[#9E3000] text-white text-xs font-sans font-medium cursor-pointer transition-colors shadow-2xs"
                >
                  Принять оплату
                </button>
                <button
                  type="button"
                  onClick={() => setShowFolioModal(true)}
                  className="py-3 rounded-[12px] bg-white border border-[#E5E2DD] hover:bg-[#FAF7F3] text-xs font-sans font-medium text-[#B93800] flex items-center justify-center gap-1.5 cursor-pointer transition-colors"
                >
                  <span>Открыть folio</span>
                  <ExternalLink className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          </div>

          {/* ==================== 6. ДОКУМЕНТЫ ==================== */}
          <div className="space-y-2">
            <span className="text-[11px] font-sans uppercase tracking-wider text-[#8A8177] block font-medium">
              ДОКУМЕНТЫ
            </span>

            {/* Document 1: Регистрационная карта гостя */}
            <div className="bg-white rounded-[18px] border border-[#E5E2DD] p-4 space-y-3 shadow-2xs">
              <div className="flex items-start gap-3">
                <FileText className="h-5 w-5 text-[#8A8177] shrink-0 mt-0.5 stroke-[1.6]" />
                <div>
                  <h4 className="text-sm font-sans font-medium text-[#241E1A]">
                    Регистрационная карта гостя
                  </h4>
                  <p className="text-[11px] font-sans text-[#8A8177] mt-0.5">
                    10 нояб., 16:33 · {selectedBooking.manager || 'Hotel Admin'}
                  </p>
                </div>
              </div>

              <div className="pt-2 border-t border-[#F0ECE6] grid grid-cols-4 gap-1 text-center">
                <button
                  type="button"
                  className="flex flex-col items-center gap-1 text-[10px] font-sans text-[#6E665E] hover:text-[#241E1A] cursor-pointer py-1"
                >
                  <Eye className="h-4 w-4 stroke-[1.7]" />
                  <span>Просмотр</span>
                </button>
                <button
                  type="button"
                  className="flex flex-col items-center gap-1 text-[10px] font-sans text-[#6E665E] hover:text-[#241E1A] cursor-pointer py-1"
                >
                  <Edit3 className="h-4 w-4 stroke-[1.7]" />
                  <span>Изменить</span>
                </button>
                <button
                  type="button"
                  className="flex flex-col items-center gap-1 text-[10px] font-sans text-[#6E665E] hover:text-[#241E1A] cursor-pointer py-1"
                >
                  <Printer className="h-4 w-4 stroke-[1.7]" />
                  <span>Печать</span>
                </button>
                <button
                  type="button"
                  className="flex flex-col items-center gap-1 text-[10px] font-sans text-[#6E665E] hover:text-[#241E1A] cursor-pointer py-1"
                >
                  <Download className="h-4 w-4 stroke-[1.7]" />
                  <span>Скачать</span>
                </button>
              </div>
            </div>

            {/* Document 2: Подтверждение бронирования */}
            <div className="bg-white rounded-[18px] border border-[#E5E2DD] p-4 space-y-3 shadow-2xs">
              <div className="flex items-start gap-3">
                <FileText className="h-5 w-5 text-[#8A8177] shrink-0 mt-0.5 stroke-[1.6]" />
                <div>
                  <h4 className="text-sm font-sans font-medium text-[#241E1A]">
                    Подтверждение бронирования
                  </h4>
                  <p className="text-[11px] font-sans text-[#8A8177] mt-0.5">
                    10 нояб., 16:33 · {selectedBooking.manager || 'Hotel Admin'}
                  </p>
                </div>
              </div>

              <div className="pt-2 border-t border-[#F0ECE6] grid grid-cols-3 gap-1 text-center">
                <button
                  type="button"
                  className="flex flex-col items-center gap-1 text-[10px] font-sans text-[#6E665E] hover:text-[#241E1A] cursor-pointer py-1"
                >
                  <Eye className="h-4 w-4 stroke-[1.7]" />
                  <span>Просмотр</span>
                </button>
                <button
                  type="button"
                  className="flex flex-col items-center gap-1 text-[10px] font-sans text-[#6E665E] hover:text-[#241E1A] cursor-pointer py-1"
                >
                  <Printer className="h-4 w-4 stroke-[1.7]" />
                  <span>Печать</span>
                </button>
                <button
                  type="button"
                  className="flex flex-col items-center gap-1 text-[10px] font-sans text-[#6E665E] hover:text-[#241E1A] cursor-pointer py-1"
                >
                  <Download className="h-4 w-4 stroke-[1.7]" />
                  <span>Скачать</span>
                </button>
              </div>
            </div>
          </div>

          {/* ==================== 7. ПОЖЕЛАНИЯ И ПРИМЕЧАНИЯ ==================== */}
          <div className="space-y-2">
            <span className="text-[11px] font-sans uppercase tracking-wider text-[#8A8177] block font-medium">
              ПОЖЕЛАНИЯ И ПРИМЕЧАНИЯ
            </span>
            <div className="bg-white rounded-[18px] border border-[#E5E2DD] p-4 space-y-3 shadow-2xs">
              <p className="text-xs font-sans text-[#241E1A] leading-relaxed">
                {selectedBooking.notes || 'Не беспокоить до обеда.'}
              </p>

              {/* Allergy banner if present */}
              <div className="bg-[#FAF2E6] rounded-[12px] px-3.5 py-2.5 flex items-center gap-2.5 text-xs font-sans text-[#7A4B1A]">
                <Info className="h-4 w-4 text-[#C2410C] shrink-0" />
                <span>{selectedBooking.allergyNotice || 'Аллерген: мёд'}</span>
              </div>

              {/* Tags: с детьми, late_checkout, allergy, BB */}
              <div className="flex items-center gap-2 flex-wrap pt-1">
                {(
                  selectedBooking.specialTags || ['с детьми', 'late_checkout', 'allergy', 'BB']
                ).map((tag, i) => (
                  <span
                    key={i}
                    className="px-3 py-1 rounded-full bg-[#FAF2E6] text-xs font-sans text-[#7A4B1A]"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>

            {/* Checkbox: Уведомить гостя */}
            <div
              onClick={() => setCardNotifyGuest((prev) => !prev)}
              className="bg-white rounded-[16px] border border-[#E5E2DD] p-4 flex items-center gap-3 cursor-pointer shadow-2xs hover:border-[#C2410C]/40 transition-colors"
            >
              <div
                className={`h-5 w-5 rounded-[6px] border flex items-center justify-center transition-colors ${
                  cardNotifyGuest
                    ? 'bg-[#C2410C] border-[#C2410C] text-white'
                    : 'border-[#CCC5BA] bg-white'
                }`}
              >
                {cardNotifyGuest && <Check className="h-3.5 w-3.5 stroke-[3]" />}
              </div>
              <span className="text-xs font-sans text-[#241E1A]">Уведомить гостя</span>
            </div>
          </div>

          {/* ==================== 8. УСЛУГИ ==================== */}
          <div className="space-y-2">
            <span className="text-[11px] font-sans uppercase tracking-wider text-[#8A8177] block font-medium">
              УСЛУГИ
            </span>

            {/* Empty state or list */}
            <div className="bg-white rounded-[18px] border border-dashed border-[#DDD7CD] p-6 text-center shadow-2xs">
              <span className="text-xs font-sans text-[#8A8177]">Услуг пока нет</span>
            </div>

            <button
              type="button"
              onClick={() => setShowOrderServiceModal(true)}
              className="w-full py-3 rounded-[14px] bg-white border border-[#E5E2DD] hover:bg-[#FAF7F3] text-xs font-sans font-medium text-[#B93800] flex items-center justify-center gap-1.5 cursor-pointer transition-colors shadow-2xs"
            >
              <Plus className="h-4 w-4 text-[#B93800]" />
              <span>Заказать услугу</span>
            </button>
          </div>
        </div>

        {/* ==================== STICKY BOTTOM ACTION BAR (3 BUTTONS) ==================== */}
        <div className="p-3.5 border-t border-[#E5E2DD] bg-white/95 backdrop-blur-md flex items-center gap-2 shrink-0 z-30 shadow-lg">
          {/* Button 1: Изменить (Orange) */}
          <button
            type="button"
            onClick={() => {
              // Pre-fill individual booking wizard for editing
              setIndCheckinDate(formatDayOffsetToDateStr(selectedBooking.startDay));
              setIndCheckoutDate(formatDayOffsetToDateStr(selectedBooking.endDay));
              setIndRoomNumber(selectedBooking.roomNumber);
              setIndStep(1);
              setCreateBookingType('INDIVIDUAL');
              setSelectedBooking(null);
              if (onNavigateTab) onNavigateTab('RECEPTION_CREATE');
            }}
            className="flex-1 py-3.5 rounded-[14px] bg-[#B93800] hover:bg-[#9E3000] text-white text-xs font-sans font-semibold cursor-pointer transition-colors text-center shadow-xs"
          >
            Изменить
          </button>

          {/* Button 2: Заселить / Выселить (Green) */}
          <button
            type="button"
            onClick={() => {
              if (selectedBooking.status === 'CHECKED_IN') {
                handleUpdateBookingStatus(selectedBooking.id, 'CHECKED_OUT');
              } else {
                handleUpdateBookingStatus(selectedBooking.id, 'CHECKED_IN');
              }
            }}
            className="flex-1 py-3.5 rounded-[14px] bg-[#538363] hover:bg-[#467053] text-white text-xs font-sans font-semibold cursor-pointer transition-colors text-center shadow-xs"
          >
            {selectedBooking.status === 'CHECKED_IN' ? 'Выселить' : 'Заселить'}
          </button>

          {/* Button 3: Отменить (White with red text) */}
          <button
            type="button"
            onClick={() => {
              setBookings((prev) => prev.filter((b) => b.id !== selectedBooking.id));
              setSelectedBooking(null);
            }}
            className="flex-1 py-3.5 rounded-[14px] bg-white border border-[#E5E2DD] hover:bg-[#FAF7F3] text-[#B92A2A] text-xs font-sans font-semibold cursor-pointer transition-colors text-center shadow-xs"
          >
            Отменить
          </button>
        </div>

        {/* Guest Profile Modal */}
        {showGuestProfileModal && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-[20px] max-w-sm w-full p-5 space-y-4 shadow-xl">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-serif font-medium text-[#241E1A]">
                  Профиль гостя
                </h3>
                <button
                  type="button"
                  onClick={() => setShowGuestProfileModal(false)}
                  className="text-[#8A8177] hover:text-[#241E1A]"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
              <div className="space-y-2 text-xs font-sans">
                <div className="p-3 bg-[#FAF7F3] rounded-[12px] space-y-1">
                  <div className="font-medium text-[#241E1A]">{selectedBooking.guestName}</div>
                  <div className="text-[#8A8177]">{selectedBooking.phone}</div>
                </div>
                <div className="flex justify-between py-1 border-b border-[#F0ECE6]">
                  <span className="text-[#8A8177]">Всего визитов:</span>
                  <span className="font-medium text-[#241E1A]">4</span>
                </div>
                <div className="flex justify-between py-1 border-b border-[#F0ECE6]">
                  <span className="text-[#8A8177]">Общая сумма трат:</span>
                  <span className="font-medium text-[#241E1A]">620 000 ₸</span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-[#8A8177]">Категория лояльности:</span>
                  <span className="font-medium text-[#C2410C]">Silver Guest</span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowGuestProfileModal(false)}
                className="w-full py-2.5 rounded-[12px] bg-[#241E1A] text-white text-xs font-sans font-medium"
              >
                Закрыть
              </button>
            </div>
          </div>
        )}

        {/* Folio Modal */}
        {showFolioModal && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-[20px] max-w-sm w-full p-5 space-y-4 shadow-xl">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-serif font-medium text-[#241E1A]">
                  Folio брони {selectedBooking.bookingNumber}
                </h3>
                <button
                  type="button"
                  onClick={() => setShowFolioModal(false)}
                  className="text-[#8A8177] hover:text-[#241E1A]"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
              <div className="space-y-2 text-xs font-sans">
                <div className="flex justify-between py-1.5 border-b border-[#F0ECE6]">
                  <span className="text-[#8A8177]">Проживание (3 ночи):</span>
                  <span className="font-medium text-[#241E1A]">150 000 ₸</span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-[#F0ECE6]">
                  <span className="text-[#8A8177]">Завтрак BB (компл.):</span>
                  <span className="font-medium text-[#241E1A]">5 000 ₸</span>
                </div>
                <div className="flex justify-between py-2 border-t border-[#241E1A] text-sm">
                  <span className="font-medium text-[#241E1A]">Итого к оплате:</span>
                  <span className="font-bold text-[#B93800]">155 000 ₸</span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowFolioModal(false)}
                className="w-full py-2.5 rounded-[12px] bg-[#241E1A] text-white text-xs font-sans font-medium"
              >
                Закрыть
              </button>
            </div>
          </div>
        )}

        {/* Order Service Modal */}
        {showOrderServiceModal && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-[20px] max-w-sm w-full p-5 space-y-3 shadow-xl">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-serif font-medium text-[#241E1A]">
                  Заказ услуги в номер
                </h3>
                <button
                  type="button"
                  onClick={() => setShowOrderServiceModal(false)}
                  className="text-[#8A8177] hover:text-[#241E1A]"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
              <div className="space-y-2 text-xs font-sans max-h-60 overflow-y-auto">
                {[
                  { name: 'Трансфер из аэропорта', price: '8 000 ₸' },
                  { name: 'Посещение SPA-зоны', price: '12 000 ₸' },
                  { name: 'Фруктовая корзина в номер', price: '6 000 ₸' },
                  { name: 'Прачечная / Химчистка', price: '5 000 ₸' },
                ].map((s, i) => (
                  <div
                    key={i}
                    onClick={() => {
                      alert(`Услуга "${s.name}" добавлена`);
                      setShowOrderServiceModal(false);
                    }}
                    className="p-3 bg-[#FAF7F3] rounded-[12px] flex items-center justify-between hover:bg-[#FAF2E6] cursor-pointer transition-colors"
                  >
                    <span className="text-[#241E1A] font-medium">{s.name}</span>
                    <span className="text-[#C2410C] font-semibold">{s.price}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // ==================== TAB 1: БРОНИРОВАНИЯ (ШАХМАТКА & СПИСОК) ====================
  if (activeTab === 'RECEPTION_BOOKINGS') {
    const categories: BookingCategory[] = ['Люкс', 'Стандарт', 'Комфорт'];

    return (
      <div className="flex-1 flex flex-col bg-[#FAF7F3] overflow-y-auto no-scrollbar select-none">
        {/* Top Section */}
        <div className="px-4 pt-3 pb-3 space-y-3.5">
          {/* Header Row: Бронирования + Orange Plus Button */}
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-[28px] font-serif font-normal text-[#241E1A] leading-tight">
                {lang === 'RU' ? 'Бронирования' : 'Bookings'}
              </h1>
              <p className="text-xs font-sans text-[#8A8177] mt-0.5">
                {lang === 'RU' ? 'Четверг, 5 ноября' : 'Thursday, November 5'}
              </p>
            </div>

            <button
              type="button"
              onClick={() => onNavigateTab && onNavigateTab('RECEPTION_CREATE')}
              className="h-11 w-11 rounded-[14px] bg-[#C2410C] hover:bg-[#A93A0C] text-white flex items-center justify-center shadow-xs transition-all cursor-pointer active:scale-95"
              title="Создать бронь"
            >
              <Plus className="h-5 w-5 stroke-[2.2]" />
            </button>
          </div>

          {/* Segmented Control: Шахматка | Список */}
          <div className="bg-[#EBE6DF] p-1 rounded-[14px] grid grid-cols-2 gap-1">
            <button
              type="button"
              onClick={() => setViewMode('CHESS')}
              className={`py-2.5 rounded-[11px] text-xs font-sans flex items-center justify-center gap-2 transition-all cursor-pointer ${
                viewMode === 'CHESS'
                  ? 'bg-[#241E1A] text-white font-medium shadow-2xs'
                  : 'text-[#241E1A] font-normal hover:bg-black/5'
              }`}
            >
              <LayoutGrid className="h-3.5 w-3.5" />
              <span>{lang === 'RU' ? 'Шахматка' : 'Grid'}</span>
            </button>

            <button
              type="button"
              onClick={() => setViewMode('LIST')}
              className={`py-2.5 rounded-[11px] text-xs font-sans flex items-center justify-center gap-2 transition-all cursor-pointer ${
                viewMode === 'LIST'
                  ? 'bg-[#241E1A] text-white font-medium shadow-2xs'
                  : 'text-[#241E1A] font-normal hover:bg-black/5'
              }`}
            >
              <List className="h-3.5 w-3.5" />
              <span>{lang === 'RU' ? 'Список' : 'List'}</span>
            </button>
          </div>

          {/* Search Input + Integrated Filter Menu Dropdown */}
          <div className="relative">
            <div className="bg-white border border-[#E5E2DD] rounded-[14px] px-3.5 py-2 flex items-center gap-2.5 shadow-2xs">
              <Search className="h-4 w-4 text-[#8A8177] shrink-0" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={lang === 'RU' ? 'Гость, телефон или № брони' : 'Guest, phone or booking #'}
                className="w-full bg-transparent text-xs font-sans text-[#241E1A] placeholder:text-[#8A8177] focus:outline-none py-0.5"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="text-[#8A8177] hover:text-[#241E1A] text-xs cursor-pointer px-1"
                >
                  ✕
                </button>
              )}

              {/* Filter Icon Button at the end of Search Input */}
              <button
                type="button"
                onClick={() => setShowFiltersMenu((prev) => !prev)}
                title={lang === 'RU' ? 'Фильтры' : 'Filters'}
                className={`relative h-7 w-7 rounded-[10px] flex items-center justify-center shrink-0 transition-colors cursor-pointer ${
                  showFiltersMenu || activeFiltersCount > 0
                    ? 'bg-[#FAF2E6] text-[#C2410C] border border-[#E6B89C]'
                    : 'text-[#8A8177] hover:text-[#241E1A] hover:bg-[#FAF7F3]'
                }`}
              >
                <Filter className="h-3.5 w-3.5" />
                {activeFiltersCount > 0 && (
                  <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-[#C2410C] text-white text-[9px] font-sans font-semibold flex items-center justify-center">
                    {activeFiltersCount}
                  </span>
                )}
              </button>
            </div>

            {/* Dropdown Menu with the 4 Filters */}
            {showFiltersMenu && (
              <div className="absolute left-0 right-0 top-full mt-2 bg-white border border-[#E5E2DD] rounded-[16px] p-3.5 shadow-lg z-40 space-y-3 animate-in fade-in zoom-in-95 duration-150">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-sans font-medium text-[#241E1A]">
                    {lang === 'RU' ? 'Фильтры' : 'Filters'}
                  </span>
                  <div className="flex items-center gap-3">
                    {activeFiltersCount > 0 && (
                      <button
                        type="button"
                        onClick={() => {
                          setCategoryFilter('ALL');
                          setGuestsFilter('ALL');
                          setStatusFilter('ALL');
                          setSourceFilter('ALL');
                        }}
                        className="text-[11px] font-sans text-[#C2410C] hover:underline cursor-pointer"
                      >
                        {lang === 'RU' ? 'Сбросить' : 'Reset'}
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => setShowFiltersMenu(false)}
                      className="text-[#8A8177] hover:text-[#241E1A] cursor-pointer"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  {/* 1. Все категории */}
                  <div className="relative">
                    <select
                      value={categoryFilter}
                      onChange={(e) => setCategoryFilter(e.target.value)}
                      className="w-full appearance-none bg-[#FAF7F3] border border-[#E5E2DD] rounded-[12px] px-3 py-2 pr-7 text-[11px] font-sans text-[#241E1A] focus:outline-none cursor-pointer"
                    >
                      <option value="ALL">{lang === 'RU' ? 'Все категории' : 'All categories'}</option>
                      <option value="Люкс">Люкс</option>
                      <option value="Стандарт">Стандарт</option>
                      <option value="Комфорт">Комфорт</option>
                    </select>
                    <ChevronDown className="h-3.5 w-3.5 text-[#241E1A] absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  </div>

                  {/* 2. Любое количество */}
                  <div className="relative">
                    <select
                      value={guestsFilter}
                      onChange={(e) => setGuestsFilter(e.target.value)}
                      className="w-full appearance-none bg-[#FAF7F3] border border-[#E5E2DD] rounded-[12px] px-3 py-2 pr-7 text-[11px] font-sans text-[#241E1A] focus:outline-none cursor-pointer"
                    >
                      <option value="ALL">{lang === 'RU' ? 'Любое количество' : 'Any guests'}</option>
                      <option value="1">1 гость</option>
                      <option value="2">2 гостя</option>
                      <option value="3">3 гостя</option>
                      <option value="4">4 гостя</option>
                    </select>
                    <ChevronDown className="h-3.5 w-3.5 text-[#241E1A] absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  </div>

                  {/* 3. Все статусы */}
                  <div className="relative">
                    <select
                      value={statusFilter}
                      onChange={(e) => setStatusFilter(e.target.value)}
                      className="w-full appearance-none bg-[#FAF7F3] border border-[#E5E2DD] rounded-[12px] px-3 py-2 pr-7 text-[11px] font-sans text-[#241E1A] focus:outline-none cursor-pointer"
                    >
                      <option value="ALL">{lang === 'RU' ? 'Все статусы' : 'All statuses'}</option>
                      <option value="NEW">Новая</option>
                      <option value="CONFIRMED">Подтверждена</option>
                      <option value="CHECKED_IN">Заселён</option>
                      <option value="CHECKED_OUT">Выехал</option>
                    </select>
                    <ChevronDown className="h-3.5 w-3.5 text-[#241E1A] absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  </div>

                  {/* 4. Все источники */}
                  <div className="relative">
                    <select
                      value={sourceFilter}
                      onChange={(e) => setSourceFilter(e.target.value)}
                      className="w-full appearance-none bg-[#FAF7F3] border border-[#E5E2DD] rounded-[12px] px-3 py-2 pr-7 text-[11px] font-sans text-[#241E1A] focus:outline-none cursor-pointer"
                    >
                      <option value="ALL">{lang === 'RU' ? 'Все источники' : 'All sources'}</option>
                      <option value="Прямая бронь">Прямая бронь</option>
                      <option value="Booking.com">Booking.com</option>
                      <option value="Корпоративный">Корпоративный</option>
                      <option value="От стойки">От стойки</option>
                    </select>
                    <ChevronDown className="h-3.5 w-3.5 text-[#241E1A] absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Date Range Bar + Period Scale Selector (Неделя / 14 дней / День) */}
          <div className="flex items-center justify-between pt-1 relative">
            <button
              type="button"
              onClick={handleOpenPeriodPicker}
              className="flex items-center gap-2 py-1 px-1.5 -ml-1.5 rounded-lg hover:bg-black/5 transition-colors cursor-pointer"
            >
              <Calendar className="h-4 w-4 text-[#C2410C]" />
              <span className="text-sm font-sans font-medium text-[#241E1A]">
                {getPeriodHeaderLabel()}
              </span>
            </button>

            {showPeriodPicker && (
              <div className="absolute left-0 right-0 top-full mt-2 bg-white rounded-[18px] border border-[#E5E2DD] shadow-lg p-4 z-40 space-y-3 animate-in fade-in zoom-in-95 duration-150">
                <div className="text-[13px] font-sans font-semibold text-[#241E1A]">
                  {lang === 'RU' ? 'Период' : 'Period'}
                </div>

                {periodScale === 'DAY' ? (
                  /* Single Day Selection when 'День' is active */
                  <div className="space-y-1.5">
                    <label className="block text-xs font-sans text-[#8A8177]">
                      {lang === 'RU' ? 'Дата' : 'Date'}
                    </label>
                    <div className="relative bg-white border border-[#E5E2DD] rounded-[12px] px-3.5 py-2.5 flex items-center justify-between">
                      <input
                        type="text"
                        value={pickerStartDate}
                        onChange={(e) => handlePickerStartDateChange(e.target.value)}
                        placeholder="05.11.2026"
                        className="w-full bg-transparent text-sm font-sans text-[#241E1A] focus:outline-none"
                      />
                      <div className="relative shrink-0 ml-2 flex items-center justify-center">
                        <Calendar className="h-4 w-4 text-[#8A8177] pointer-events-none" />
                        <input
                          type="date"
                          value={formatRuDateToIso(pickerStartDate)}
                          onChange={(e) => {
                            if (e.target.value) {
                              handlePickerStartDateChange(formatIsoToRuDate(e.target.value));
                            }
                          }}
                          className="absolute inset-0 opacity-0 cursor-pointer w-6 h-6"
                        />
                      </div>
                    </div>
                  </div>
                ) : (
                  /* Range Selection (Дата с / Дата по) when 'Неделя' or '14 дней' is active */
                  <>
                    <div className="space-y-1.5">
                      <label className="block text-xs font-sans text-[#8A8177]">
                        {lang === 'RU' ? 'Дата с' : 'Date from'}
                      </label>
                      <div className="relative bg-white border border-[#E5E2DD] rounded-[12px] px-3.5 py-2.5 flex items-center justify-between">
                        <input
                          type="text"
                          value={pickerStartDate}
                          onChange={(e) => handlePickerStartDateChange(e.target.value)}
                          placeholder="01.11.2026"
                          className="w-full bg-transparent text-sm font-sans text-[#241E1A] focus:outline-none"
                        />
                        <div className="relative shrink-0 ml-2 flex items-center justify-center">
                          <Calendar className="h-4 w-4 text-[#8A8177] pointer-events-none" />
                          <input
                            type="date"
                            value={formatRuDateToIso(pickerStartDate)}
                            onChange={(e) => {
                              if (e.target.value) {
                                handlePickerStartDateChange(formatIsoToRuDate(e.target.value));
                              }
                            }}
                            className="absolute inset-0 opacity-0 cursor-pointer w-6 h-6"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <label className="block text-xs font-sans text-[#8A8177]">
                        {lang === 'RU' ? 'Дата по' : 'Date to'}
                      </label>
                      <div className="relative bg-white border border-[#E5E2DD] rounded-[12px] px-3.5 py-2.5 flex items-center justify-between">
                        <input
                          type="text"
                          value={pickerEndDate}
                          onChange={(e) => {
                            const newEndStr = e.target.value;
                            setPickerEndDate(newEndStr);
                            const parsedEnd = parseDateStrToNovDayOffset(
                              newEndStr,
                              periodEndDay
                            );
                            const span = periodScale === 'WEEK' ? 6 : 13;
                            setPickerStartDate(formatDayOffsetToDateStr(parsedEnd - span));
                          }}
                          placeholder="07.11.2026"
                          className="w-full bg-transparent text-sm font-sans text-[#241E1A] focus:outline-none"
                        />
                        <div className="relative shrink-0 ml-2 flex items-center justify-center">
                          <Calendar className="h-4 w-4 text-[#8A8177] pointer-events-none" />
                          <input
                            type="date"
                            value={formatRuDateToIso(pickerEndDate)}
                            onChange={(e) => {
                              if (e.target.value) {
                                const newEndStr = formatIsoToRuDate(e.target.value);
                                setPickerEndDate(newEndStr);
                                const parsedEnd = parseDateStrToNovDayOffset(
                                  newEndStr,
                                  periodEndDay
                                );
                                const span = periodScale === 'WEEK' ? 6 : 13;
                                setPickerStartDate(formatDayOffsetToDateStr(parsedEnd - span));
                              }
                            }}
                            className="absolute inset-0 opacity-0 cursor-pointer w-6 h-6"
                          />
                        </div>
                      </div>
                    </div>
                  </>
                )}

                <div className="flex items-center justify-end gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setShowPeriodPicker(false)}
                    className="px-4 py-2 rounded-[10px] border border-[#E5E2DD] bg-white hover:bg-[#FAF7F3] text-xs font-sans font-medium text-[#241E1A] cursor-pointer transition-colors"
                  >
                    {lang === 'RU' ? 'Отмена' : 'Cancel'}
                  </button>
                  <button
                    type="button"
                    onClick={handleApplyPeriodPicker}
                    className="px-4 py-2 rounded-[10px] bg-[#B93800] hover:bg-[#9E3000] text-white text-xs font-sans font-medium cursor-pointer transition-colors"
                  >
                    {lang === 'RU' ? 'Применить' : 'Apply'}
                  </button>
                </div>
              </div>
            )}

            <div className="flex items-center gap-2">
              <div className="relative">
                <button
                  type="button"
                  onClick={() => {
                    setShowScaleDropdown(!showScaleDropdown);
                    setShowPeriodPicker(false);
                  }}
                  className="flex items-center gap-1 text-xs font-sans text-[#8A8177] hover:text-[#241E1A] cursor-pointer py-1 px-1.5 rounded-lg"
                >
                  <span>
                    {periodScale === 'WEEK'
                      ? 'Неделя'
                      : periodScale === '14DAYS'
                      ? '14 дней'
                      : 'День'}
                  </span>
                  <ChevronDown className="h-3.5 w-3.5" />
                </button>

                {showScaleDropdown && (
                  <div className="absolute right-0 top-full mt-1 w-28 bg-white rounded-xl border border-[#E5E2DD] shadow-lg py-1 z-30">
                    {(
                      [
                        { id: 'DAY', label: 'День' },
                        { id: 'WEEK', label: 'Неделя' },
                        { id: '14DAYS', label: '14 дней' },
                      ] as const
                    ).map((opt) => (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => {
                          setPeriodScale(opt.id);
                          const span = opt.id === 'DAY' ? 0 : opt.id === 'WEEK' ? 6 : 13;
                          setPickerStartDate(formatDayOffsetToDateStr(periodStartDay));
                          setPickerEndDate(formatDayOffsetToDateStr(periodStartDay + span));
                          setShowScaleDropdown(false);
                        }}
                        className={`w-full text-left px-3 py-1.5 text-xs font-sans cursor-pointer ${
                          periodScale === opt.id
                            ? 'bg-[#FAF2E6] text-[#C2410C] font-medium'
                            : 'text-[#241E1A] hover:bg-[#FAF7F3]'
                        }`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <button
                type="button"
                onClick={() => handleShiftPeriod(-1)}
                className="p-1 text-[#241E1A] hover:opacity-70 cursor-pointer"
                title="Предыдущий период"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={() => handleShiftPeriod(1)}
                className="p-1 text-[#241E1A] hover:opacity-70 cursor-pointer"
                title="Следующий период"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Status Legend (only in Chessboard view) */}
          {viewMode === 'CHESS' && (
            <div className="flex items-center gap-3.5 text-[11px] font-sans text-[#8A8177] flex-wrap">
              <span className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-[#D9822B]" />
                <span>Новая</span>
              </span>
              <span className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-[#4B7F52]" />
                <span>Подтверждена</span>
              </span>
              <span className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-[#B94A2C]" />
                <span>Заселён</span>
              </span>
              <span className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-[#8A8177]" />
                <span>Выехал</span>
              </span>
            </div>
          )}
        </div>

        {/* ==================== VIEW MODE 1: СПИСОК (LIST) ==================== */}
        {viewMode === 'LIST' ? (
          <div className="px-4 pb-6 space-y-2.5">
            <div className="flex items-center justify-between text-xs font-sans py-1">
              <span className="text-[#8A8177]">Брони за выбранный период</span>
              <span className="text-[#241E1A] font-medium">{filteredBookings.length}</span>
            </div>

            {filteredBookings.map((b) => {
              const st = getStatusBadge(b.status);
              return (
                <div
                  key={b.id}
                  onClick={() => setSelectedBooking(b)}
                  className="bg-white rounded-[16px] border border-[#E5E2DD] p-4 space-y-2 shadow-2xs hover:border-[#C2410C]/40 transition-all cursor-pointer active:scale-[0.99]"
                >
                  <div className="flex items-center justify-between gap-2">
                    <h3 className="text-[15px] font-sans font-medium text-[#241E1A]">
                      {b.guestName}
                    </h3>
                    <span
                      className={`px-2.5 py-1 rounded-full text-[11px] font-sans font-normal flex items-center gap-1.5 shrink-0 ${st.pillBg} ${st.pillText}`}
                    >
                      <span className={`h-1.5 w-1.5 rounded-full ${st.dotColor}`} />
                      {st.label}
                    </span>
                  </div>

                  <p className="text-xs font-sans text-[#8A8177]">
                    <span className="text-[#241E1A] font-medium">№{b.roomNumber}</span>
                    {' · '}
                    {b.category}
                    {' · '}
                    {b.guestsCount}{' '}
                    {b.guestsCount === 1 ? 'гость' : b.guestsCount < 5 ? 'гостя' : 'гостей'}
                  </p>

                  <div className="flex items-center justify-between text-xs font-sans pt-0.5">
                    <span className="text-[#241E1A] font-normal">{b.dateRangeText}</span>
                    <span className="text-[#8A8177]">
                      {b.nights} {b.nights === 1 ? 'ночь' : b.nights < 5 ? 'ночи' : 'ночей'}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        ) : periodScale === 'DAY' ? (
          /* ==================== VIEW MODE 2A: ШАХМАТКА — ДЕНЬ (SCREENSHOT 4) ==================== */
          <div className="px-4 pb-6 space-y-4">
            {(() => {
              const checkinsToday = bookings.filter((b) => b.startDay === periodStartDay).length;
              const checkoutsToday = bookings.filter((b) => b.endDay === periodStartDay).length;
              const checkinWord =
                checkinsToday === 1
                  ? 'заезд'
                  : checkinsToday >= 2 && checkinsToday <= 4
                  ? 'заезда'
                  : 'заездов';
              const checkoutWord =
                checkoutsToday === 1
                  ? 'выезд'
                  : checkoutsToday >= 2 && checkoutsToday <= 4
                  ? 'выезда'
                  : 'выездов';

              return (
                <div className="bg-[#EFECE6] rounded-[14px] px-4 py-3 flex items-center justify-between text-xs font-sans">
                  <span className="text-[#241E1A] font-normal">
                    {formatSingleDayLabel(periodStartDay)}
                  </span>
                  <span className="text-[#241E1A] font-medium">
                    {checkinsToday} {checkinWord} · {checkoutsToday} {checkoutWord}
                  </span>
                </div>
              );
            })()}

            {categories
              .filter((cat) => categoryFilter === 'ALL' || categoryFilter === cat)
              .map((cat) => {
                const catRooms = RECEPTION_ROOMS.filter((r) => r.category === cat);
                return (
                  <div key={cat} className="space-y-2.5">
                    <h4 className="text-[11px] font-sans font-normal tracking-wider text-[#8A8177] uppercase">
                      {cat}
                    </h4>

                    <div className="space-y-2.5">
                      {catRooms.map((room) => {
                        // Find booking active on periodStartDay for this room
                        const roomBooking = filteredBookings.find(
                          (b) =>
                            (b.roomNumber === room.roomNumber ||
                              b.alsoRooms?.includes(room.roomNumber)) &&
                            b.startDay <= periodStartDay &&
                            b.endDay >= periodStartDay
                        );

                        if (!roomBooking) {
                          // Free room card (e.g. 301 Свободен)
                          return (
                            <div key={room.roomNumber} className="flex items-center gap-3">
                              <div className="w-12 shrink-0">
                                <div className="text-base font-sans font-medium text-[#241E1A] leading-tight">
                                  {room.roomNumber}
                                </div>
                                <div className="text-[10px] font-sans text-[#8A8177]">
                                  {room.capacity} {room.capacity < 5 ? 'гостя' : 'гостей'}
                                </div>
                              </div>

                              <div
                                onClick={() =>
                                  handleApplyChessSelection(
                                    room,
                                    periodStartDay,
                                    periodStartDay + 1
                                  )
                                }
                                className="flex-1 bg-[#EDF4EE] border border-dashed border-[#9BBFA4] rounded-[16px] p-3.5 flex items-center justify-between cursor-pointer hover:bg-[#E4EFE7] transition-colors"
                              >
                                <div>
                                  <div className="text-sm font-sans font-medium text-[#2E623C]">
                                    Свободен
                                  </div>
                                  <div className="text-[11px] font-sans text-[#8A8177] mt-0.5">
                                    Чистый · можно заселять
                                  </div>
                                </div>
                                <Plus className="h-4.5 w-4.5 text-[#4B7F52]" />
                              </div>
                            </div>
                          );
                        }

                        const isCheckoutToday = roomBooking.endDay === periodStartDay;
                        const isCheckinToday = roomBooking.startDay === periodStartDay;
                        const borderLeftClass = isCheckoutToday
                          ? 'border-l-[3.5px] border-l-[#8A8177]'
                          : roomBooking.status === 'CHECKED_IN'
                          ? 'border-l-[3.5px] border-l-[#B94A2C]'
                          : roomBooking.status === 'CONFIRMED'
                          ? 'border-l-[3.5px] border-l-[#4B7F52]'
                          : 'border-l-[3.5px] border-l-[#D9822B]';

                        const subText = isCheckoutToday
                          ? 'Выезд · до 12:00'
                          : isCheckinToday
                          ? 'Заезд · с 14:00'
                          : `Проживает · до ${roomBooking.endDay} нояб.`;

                        return (
                          <div key={room.roomNumber} className="flex items-center gap-3">
                            <div className="w-12 shrink-0">
                              <div className="text-base font-sans font-medium text-[#241E1A] leading-tight">
                                {room.roomNumber}
                              </div>
                              <div className="text-[10px] font-sans text-[#8A8177]">
                                {room.capacity} {room.capacity < 5 ? 'гостя' : 'гостей'}
                              </div>
                            </div>

                            <div
                              onClick={() => setSelectedBooking(roomBooking)}
                              className={`flex-1 bg-white border border-[#E5E2DD] ${borderLeftClass} rounded-[16px] p-3.5 flex items-center justify-between cursor-pointer shadow-2xs hover:border-[#C2410C]/40 transition-all`}
                            >
                              <div>
                                <div className="text-sm font-sans font-medium text-[#241E1A]">
                                  {roomBooking.guestName}
                                </div>
                                <div className="text-[11px] font-sans text-[#8A8177] mt-0.5">
                                  {subText}
                                </div>
                              </div>

                              {isCheckoutToday ? (
                                <ArrowRight className="h-4 w-4 text-[#8A8177]" />
                              ) : isCheckinToday ? (
                                <Plus
                                  className={`h-4.5 w-4.5 ${
                                    roomBooking.status === 'CONFIRMED'
                                      ? 'text-[#4B7F52]'
                                      : 'text-[#D9822B]'
                                  }`}
                                />
                              ) : (
                                <BedDouble className="h-4.5 w-4.5 text-[#B94A2C]" />
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
          </div>
        ) : (
          /* ==================== VIEW MODE 2B & 2C: ШАХМАТКА — НЕДЕЛЯ & 14 ДНЕЙ ==================== */
          <div className="border-t border-[#E5E2DD] bg-white flex-1 overflow-x-auto no-scrollbar">
            {(() => {
              const countDays = periodScale === '14DAYS' ? 14 : 7;
              const daysList = Array.from({ length: countDays }, (_, idx) => {
                const dayOffset = periodStartDay + idx;
                return {
                  day: dayOffset,
                  displayDay: getDisplayDayNumber(dayOffset),
                  dow: getDowForNovDay(dayOffset),
                };
              });
              const isCompact14 = periodScale === '14DAYS';
              const dayColWidth = isCompact14 ? 22 : 72;
              const leftColWidth = isCompact14 ? 82 : 96;

              return (
                <div
                  style={{
                    minWidth: `${leftColWidth + daysList.length * dayColWidth}px`,
                  }}
                >
                  {/* Header Row: Номер | Days */}
                  <div className="flex border-b border-[#E5E2DD] bg-[#FAF7F3]">
                    <div
                      style={{ width: `${leftColWidth}px` }}
                      className="shrink-0 px-3 py-2.5 text-xs font-sans text-[#8A8177] flex items-center border-r border-[#E5E2DD]"
                    >
                      Номер
                    </div>

                    <div className="flex flex-1">
                      {daysList.map((d) => {
                        const isToday = d.day === 5;
                        const isWeekend = d.dow === 'сб' || d.dow === 'вс';
                        return (
                          <div
                            key={d.day}
                            style={{ width: `${dayColWidth}px` }}
                            className={`shrink-0 py-1.5 text-center border-r border-[#E5E2DD]/60 ${
                              isToday
                                ? 'bg-[#EFE5DC]'
                                : isWeekend
                                ? 'bg-[#FAF3EE]/60'
                                : 'bg-[#FAF7F3]'
                            }`}
                          >
                            <div className="text-[10px] font-sans text-[#8A8177] leading-tight">
                              {d.dow}
                            </div>
                            <div
                              className={`text-xs font-sans mt-0.5 ${
                                isToday ? 'text-[#C2410C] font-semibold' : 'text-[#241E1A] font-medium'
                              }`}
                            >
                              {d.displayDay}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Category Groups & Room Rows */}
                  {categories
                    .filter((cat) => categoryFilter === 'ALL' || categoryFilter === cat)
                    .map((cat) => {
                      const catRooms = RECEPTION_ROOMS.filter((r) => r.category === cat);
                      return (
                        <div key={cat}>
                          {/* Category Group Banner */}
                          <div className="bg-[#F3EFEA] px-3 py-1.5 border-b border-[#E5E2DD] flex items-center gap-1.5">
                            <span className="text-xs font-sans font-medium text-[#241E1A]">
                              {cat}
                            </span>
                            <span className="text-xs font-sans text-[#8A8177]">
                              {catRooms.length}
                            </span>
                          </div>

                          {/* Rooms in Category */}
                          {catRooms.map((room) => {
                            // Bookings for this room overlapping visible range [5 .. lastDay]
                            const firstVisibleDay = daysList[0].day;
                            const lastVisibleDay = daysList[daysList.length - 1].day;
                            const roomBookings = filteredBookings.filter(
                              (b) =>
                                (b.roomNumber === room.roomNumber ||
                                  b.alsoRooms?.includes(room.roomNumber)) &&
                                b.endDay > firstVisibleDay &&
                                b.startDay <= lastVisibleDay
                            );

                            return (
                              <div
                                key={room.roomNumber}
                                className="flex border-b border-[#E5E2DD] bg-white min-h-[68px]"
                              >
                                {/* Left Room Cell */}
                                <div
                                  style={{ width: `${leftColWidth}px` }}
                                  className="shrink-0 px-3 py-2.5 border-r border-[#E5E2DD] flex flex-col justify-center"
                                >
                                  <div className="text-sm font-sans font-medium text-[#241E1A]">
                                    №{room.roomNumber}
                                  </div>
                                  <div className="text-[10px] font-sans text-[#8A8177] mt-0.5 whitespace-nowrap">
                                    {room.floor} этаж · {room.capacity} гостя
                                  </div>
                                  {!isCompact14 && (
                                    <div className="flex items-center gap-1 text-[10px] font-sans text-[#4B7F52] mt-1">
                                      <span className="h-1.5 w-1.5 rounded-full bg-[#4B7F52]" />
                                      <span>Чистый</span>
                                    </div>
                                  )}
                                </div>

                                {/* Right Timeline Grid Cells + Overlaid Booking Bars */}
                                <div
                                  className="relative flex flex-1 select-none"
                                  onMouseLeave={() => {
                                    if (chessDragSelection?.roomNumber === room.roomNumber) {
                                      // Keep selection active if dragging within row, cancel if pointer leaves row without releasing
                                      setChessDragSelection(null);
                                    }
                                  }}
                                >
                                  {daysList.map((d) => {
                                    const isToday = d.day === 5;
                                    const isWeekend = d.dow === 'сб' || d.dow === 'вс';
                                    const isCellOccupied = roomBookings.some(
                                      (b) => d.day >= b.startDay && d.day < b.endDay
                                    );
                                    const isDraggingThisRoom =
                                      chessDragSelection?.roomNumber === room.roomNumber;
                                    const dragMin = isDraggingThisRoom
                                      ? Math.min(chessDragSelection.startDay, chessDragSelection.currentDay)
                                      : -999;
                                    const dragMax = isDraggingThisRoom
                                      ? Math.max(chessDragSelection.startDay, chessDragSelection.currentDay)
                                      : -999;
                                    const isCellInDragRange =
                                      isDraggingThisRoom && d.day >= dragMin && d.day <= dragMax;

                                    return (
                                      <div
                                        key={d.day}
                                        style={{ width: `${dayColWidth}px` }}
                                        onMouseDown={() => {
                                          if (isCellOccupied) return;
                                          setChessDragSelection({
                                            roomNumber: room.roomNumber,
                                            category: room.category,
                                            capacity: room.capacity,
                                            floor: room.floor,
                                            startDay: d.day,
                                            currentDay: d.day,
                                          });
                                        }}
                                        onMouseEnter={() => {
                                          if (
                                            chessDragSelection &&
                                            chessDragSelection.roomNumber === room.roomNumber &&
                                            !isCellOccupied
                                          ) {
                                            setChessDragSelection((prev) =>
                                              prev ? { ...prev, currentDay: d.day } : null
                                            );
                                          }
                                        }}
                                        onMouseUp={() => {
                                          if (
                                            chessDragSelection &&
                                            chessDragSelection.roomNumber === room.roomNumber
                                          ) {
                                            const minD = Math.min(
                                              chessDragSelection.startDay,
                                              chessDragSelection.currentDay
                                            );
                                            const maxD = Math.max(
                                              chessDragSelection.startDay,
                                              chessDragSelection.currentDay
                                            );
                                            setChessDragSelection(null);
                                            handleApplyChessSelection(room, minD, maxD + 1);
                                          }
                                        }}
                                        title={
                                          !isCellOccupied
                                            ? `Нажмите или растяните для создания брони (№${room.roomNumber})`
                                            : undefined
                                        }
                                        className={`group shrink-0 h-full border-r border-[#E5E2DD]/50 flex items-center justify-center transition-colors ${
                                          !isCellOccupied
                                            ? 'cursor-pointer hover:bg-[#FAF2E6]/70'
                                            : ''
                                        } ${
                                          isCellInDragRange
                                            ? 'bg-[#FAF2E6]'
                                            : isToday
                                            ? 'bg-[#FAF3EC]/50'
                                            : isWeekend
                                            ? 'bg-[#FAF7F3]/40'
                                            : 'bg-white'
                                        }`}
                                      >
                                        {!isCellOccupied && !isCompact14 && !isDraggingThisRoom && (
                                          <Plus className="h-3.5 w-3.5 text-[#C2410C]/0 group-hover:text-[#C2410C]/60 transition-opacity pointer-events-none" />
                                        )}
                                      </div>
                                    );
                                  })}

                                  {/* Active Drag Selection Preview Bar */}
                                  {chessDragSelection &&
                                    chessDragSelection.roomNumber === room.roomNumber && (() => {
                                      const minD = Math.min(
                                        chessDragSelection.startDay,
                                        chessDragSelection.currentDay
                                      );
                                      const maxD = Math.max(
                                        chessDragSelection.startDay,
                                        chessDragSelection.currentDay
                                      );
                                      const startOffsetCols = minD - firstVisibleDay;
                                      const spanCols = Math.max(1, maxD - minD + 1);
                                      const leftPx = startOffsetCols * dayColWidth + 2;
                                      const widthPx = spanCols * dayColWidth - 4;
                                      return (
                                        <div
                                          style={{
                                            left: `${leftPx}px`,
                                            width: `${widthPx}px`,
                                          }}
                                          className="absolute top-2 bottom-2 rounded-[8px] border border-dashed border-[#C2410C] bg-[#FAF2E6]/95 text-[#C2410C] px-2 py-1 flex flex-col justify-center overflow-hidden pointer-events-none z-20 shadow-xs"
                                        >
                                          <div className="text-[11px] font-sans font-semibold truncate leading-tight">
                                            + Новая бронь · №{room.roomNumber}
                                          </div>
                                          {!isCompact14 && (
                                            <div className="text-[10px] font-sans truncate mt-0.5">
                                              {formatShortMonthDay(minD)} → {formatShortMonthDay(maxD + 1)} ({spanCols} н.)
                                            </div>
                                          )}
                                        </div>
                                      );
                                    })()}

                                  {/* Booking Bars */}
                                  {roomBookings.map((b) => {
                                    const clampedStart = Math.max(firstVisibleDay, b.startDay);
                                    const clampedEnd = Math.min(lastVisibleDay + 1, b.endDay);
                                    const startOffsetCols = clampedStart - firstVisibleDay;
                                    const spanCols = Math.max(1, clampedEnd - clampedStart);

                                    const leftPx = startOffsetCols * dayColWidth + 2;
                                    const widthPx = spanCols * dayColWidth - 4;
                                    const st = getStatusBadge(b.status);

                                    return (
                                      <div
                                        key={`${b.id}-${room.roomNumber}`}
                                        onClick={() => setSelectedBooking(b)}
                                        style={{
                                          left: `${leftPx}px`,
                                          width: `${widthPx}px`,
                                        }}
                                        className={`absolute top-2 bottom-2 rounded-[8px] border-l-[3px] ${st.chessBg} ${st.chessBorder} ${st.chessText} px-2 py-1 flex flex-col justify-center overflow-hidden cursor-pointer hover:brightness-95 transition-all shadow-2xs`}
                                      >
                                        <div className="text-[11px] font-sans font-medium truncate leading-tight">
                                          {isCompact14 ? b.shortName : b.guestName}
                                        </div>
                                        {!isCompact14 && (
                                          <div className="text-[10px] font-sans opacity-80 truncate mt-0.5">
                                            {b.dateRangeText}
                                          </div>
                                        )}
                                      </div>
                                    );
                                  })}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      );
                    })}
                </div>
              );
            })()}
          </div>
        )}
      </div>
    );
  }

  // ==================== TAB 2: СОЗДАТЬ БРОНЬ (SCREENSHOT 5 + FORMS) ====================
  if (activeTab === 'RECEPTION_CREATE') {
    if (createBookingType === 'INDIVIDUAL') {
      // Calculate nights from DD.MM.YYYY
      const parseDateDay = (dateStr: string, fallback: number) => {
        const parts = dateStr.split('.');
        const d = parseInt(parts[0], 10);
        return isNaN(d) ? fallback : d;
      };
      const sDayNum = parseDateDay(indCheckinDate, 6);
      const eDayNum = parseDateDay(indCheckoutDate, 7);
      const nightsCount = Math.max(1, eDayNum - sDayNum);
      const nightsLabel =
        nightsCount === 1 ? '1 ночь' : nightsCount < 5 ? `${nightsCount} ночи` : `${nightsCount} ночей`;

      const adultsNum = Math.max(1, parseInt(indAdults, 10) || 1);
      const childrenNum = Math.max(0, parseInt(indChildren, 10) || 0);
      const totalGuestsCount = adultsNum + childrenNum;
      const otherGuestsCount = Math.max(0, totalGuestsCount - 1);

      const guestsWord =
        totalGuestsCount === 1
          ? 'гость'
          : totalGuestsCount >= 2 && totalGuestsCount <= 4
          ? 'гостя'
          : 'гостей';

      const selectedRoomObj =
        RECEPTION_ROOMS.find((r) => r.roomNumber === indRoomNumber) || RECEPTION_ROOMS[0];
      const roomCap = selectedRoomObj.capacity;
      const roomCapWord = roomCap === 1 ? 'гость' : roomCap < 5 ? 'гостя' : 'гостей';

      const basePricePerNight =
        indCategoryCode === 'Lux' ? 50000 : indCategoryCode === 'Comfort' ? 35000 : 25000;
      const discountPct = Math.min(100, Math.max(0, parseFloat(indAgentDiscount) || 0));
      const roomStaySum = Math.round(nightsCount * basePricePerNight * (1 - discountPct / 100));
      const extraCheckinOutSum = (indLateCheckout ? 5000 : 0) + (indEarlyCheckin ? 5000 : 0);
      const servicesSum = indServices.reduce((acc, s) => acc + s.price, 0);
      const calculatedTotal = roomStaySum + extraCheckinOutSum + servicesSum;

      const effectiveTotal =
        indCustomSum !== null && !isNaN(parseInt(indCustomSum, 10))
          ? Math.max(0, parseInt(indCustomSum, 10))
          : calculatedTotal;
      const prepaymentNum = Math.max(0, parseInt(indPrepayment, 10) || 0);
      const remainingToPay = indIsPaid ? 0 : Math.max(0, effectiveTotal - prepaymentNum);

      const formattedTotal = `${effectiveTotal.toLocaleString('ru-RU')} ₸`;
      const formattedPrepayment = `${(indIsPaid ? effectiveTotal : prepaymentNum).toLocaleString('ru-RU')} ₸`;
      const formattedRemaining = `${remainingToPay.toLocaleString('ru-RU')} ₸`;

      const stepTitles: Record<number, string> = {
        1: 'Проживание',
        2: 'Гости',
        3: 'Пожелания',
        4: 'Оплата',
      };

      const toggleSpecialMark = (mark: string) => {
        setIndSpecialMarks((prev) =>
          prev.includes(mark) ? prev.filter((m) => m !== mark) : [...prev, mark]
        );
      };

      const availableHotelServices = [
        { id: 'srv-transfer', name: 'Трансфер из аэропорта', price: 8000 },
        { id: 'srv-spa', name: 'Посещение SPA-зоны', price: 12000 },
        { id: 'srv-bed', name: 'Дополнительное спальное место', price: 10000 },
        { id: 'srv-laundry', name: 'Прачечная / Химчистка', price: 5000 },
        { id: 'srv-fruits', name: 'Фруктовая корзина в номер', price: 6000 },
      ];

      const updateOtherGuestField = (
        idx: number,
        field: keyof (typeof indOtherGuests)[0],
        value: string
      ) => {
        setIndOtherGuests((prev) => {
          const copy = [...prev];
          while (copy.length <= idx) {
            copy.push({
              lastName: '',
              firstName: '',
              middleName: '',
              phone: '',
              docType: '',
              docNumber: '',
              birthDate: '',
              gender: '',
              nationality: '',
            });
          }
          copy[idx] = { ...copy[idx], [field]: value };
          return copy;
        });
      };

      const mapCodeToRuCat = (code: 'Lux' | 'Comfort' | 'Standard'): BookingCategory =>
        code === 'Lux' ? 'Люкс' : code === 'Comfort' ? 'Комфорт' : 'Стандарт';

      const handleFinishIndividualBooking = () => {
        const fullName =
          `${indFirstName.trim()} ${indLastName.trim()}`.trim() || 'Новый Гость';
        const noteParts: string[] = [];
        if (indMealPlan) noteParts.push(`Питание: ${indMealPlan}`);
        if (indSpecialMarks.length > 0) noteParts.push(`Метки: ${indSpecialMarks.join(', ')}`);
        if (indLateCheckout) noteParts.push('Поздний выезд (+5 000 ₸)');
        if (indEarlyCheckin) noteParts.push('Ранний заезд (+5 000 ₸)');
        if (indWithPets) noteParts.push('Проживание с животными');
        if (indSpecialWishes.trim()) noteParts.push(`Пожелания: ${indSpecialWishes.trim()}`);
        if (indBookingNotes.trim()) noteParts.push(indBookingNotes.trim());

        const created: ReceptionBooking = {
          id: `bk-${Date.now()}`,
          bookingNumber: `BR-${Math.floor(4112 + Math.random() * 880)}`,
          guestName: fullName,
          shortName: indFirstName.trim() || fullName.split(' ')[0],
          phone: indPhone.trim() || '+7 (701) 000-00-00',
          email: indEmail.trim() || 'guest@example.com',
          roomNumber: indRoomNumber,
          category: mapCodeToRuCat(indCategoryCode),
          guestsCount: totalGuestsCount,
          startDay: sDayNum,
          endDay: eDayNum,
          dateRangeText: `${sDayNum} нояб. → ${eDayNum} нояб.`,
          nights: nightsCount,
          status: 'NEW',
          source: indSource,
          totalAmount: formattedTotal,
          isPaid: indIsPaid || remainingToPay === 0,
          tariff: indTariff,
          notes:
            noteParts.join(' · ') ||
            `Создано через форму индивидуального бронирования (${totalGuestsCount} ${guestsWord}).`,
          bookingType: 'INDIVIDUAL',
        };
        setBookings((prev) => [created, ...prev]);
        setCreateBookingType('NONE');
        setIndStep(1);
        if (onNavigateTab) onNavigateTab('RECEPTION_BOOKINGS');
      };

      return (
        <div className="flex-1 flex flex-col bg-[#FAF7F3] overflow-hidden select-none animate-in slide-in-from-right duration-200">
          {/* ==================== TOP HEADER + 4-STEP PROGRESS BAR ==================== */}
          <div className="px-5 pt-4 pb-3 border-b border-[#E5E2DD] bg-[#FAF7F3] shrink-0">
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-2.5 -ml-1">
                <button
                  type="button"
                  onClick={() => {
                    if (indStep > 1) setIndStep(indStep - 1);
                    else setCreateBookingType('NONE');
                  }}
                  className="mt-1 h-7 w-7 rounded-lg flex items-center justify-center text-[#241E1A] hover:bg-black/5 cursor-pointer"
                >
                  <ChevronLeft className="h-5 w-5" />
                </button>
                <div>
                  <h1 className="text-[22px] font-serif font-normal text-[#241E1A] leading-tight">
                    Индивидуальная бронь
                  </h1>
                  <p className="text-xs font-sans text-[#8A8177] mt-0.5">
                    Индивидуальный гость
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => {
                  setCreateBookingType('NONE');
                  setIndStep(1);
                }}
                className="mt-1 h-7 w-7 rounded-lg flex items-center justify-center text-[#241E1A] hover:bg-black/5 cursor-pointer"
              >
                <X className="h-5 w-5 stroke-[1.75]" />
              </button>
            </div>

            {/* Step Title & Counter */}
            <div className="flex items-center justify-between text-xs font-sans mt-4 mb-2">
              <span className="font-medium text-[#241E1A]">{stepTitles[indStep]}</span>
              <span className="text-[#8A8177]">Шаг {indStep} из 4</span>
            </div>

            {/* 4 Progress Bars */}
            <div className="grid grid-cols-4 gap-1.5">
              {[1, 2, 3, 4].map((stNum) => (
                <div
                  key={stNum}
                  onClick={() => setIndStep(stNum)}
                  className={`h-[3px] rounded-full cursor-pointer transition-colors ${
                    stNum <= indStep ? 'bg-[#C2410C]' : 'bg-[#E2DDD5]'
                  }`}
                />
              ))}
            </div>
          </div>

          {/* ==================== SCROLLABLE STEP BODY ==================== */}
          <div className="flex-1 overflow-y-auto no-scrollbar px-5 py-4 space-y-5">
            {indStep === 1 && (
              /* ---------------- ШАГ 1 ИЗ 5: ПРОЖИВАНИЕ ---------------- */
              <>
                {/* Summary Banner Card: Новая бронь */}
                <div className="bg-[#EFECE6] rounded-[16px] p-4 flex items-center justify-between">
                  <div>
                    <h2 className="text-[20px] font-serif font-normal text-[#241E1A] leading-tight">
                      Новая бронь
                    </h2>
                    <p className="text-xs font-sans text-[#8A8177] mt-1">
                      Индивидуальная · {totalGuestsCount} {guestsWord} / 1 номер
                    </p>
                  </div>

                  <span className="px-3 py-1 rounded-full bg-[#241E1A] text-white text-[11px] font-sans font-medium shrink-0">
                    {nightsLabel}
                  </span>
                </div>

                {/* Section: Даты проживания */}
                <div className="space-y-2.5">
                  <h3 className="text-xs font-sans font-medium text-[#241E1A]">
                    Даты проживания
                  </h3>

                  <div className="bg-white rounded-[18px] border border-[#E5E2DD] p-3.5 space-y-3 shadow-2xs">
                    {/* Заезд */}
                    <div className="flex items-center gap-2.5">
                      <span className="w-12 text-xs font-sans font-medium text-[#241E1A] shrink-0">
                        Заезд
                      </span>

                      <div className="flex-1 bg-white border border-[#E5E2DD] rounded-[12px] px-3 py-2.5 flex items-center justify-between">
                        <input
                          type="text"
                          value={indCheckinDate}
                          onChange={(e) => setIndCheckinDate(e.target.value)}
                          className="w-full bg-transparent text-xs font-sans text-[#241E1A] focus:outline-none"
                        />
                        <Calendar className="h-3.5 w-3.5 text-[#241E1A] shrink-0 ml-1" />
                      </div>

                      <div className="w-[92px] bg-white border border-[#E5E2DD] rounded-[12px] px-3 py-2.5 flex items-center justify-between shrink-0">
                        <input
                          type="text"
                          value={indCheckinTime}
                          onChange={(e) => setIndCheckinTime(e.target.value)}
                          className="w-full bg-transparent text-xs font-sans text-[#241E1A] focus:outline-none"
                        />
                        <Clock className="h-3.5 w-3.5 text-[#241E1A] shrink-0 ml-1" />
                      </div>
                    </div>

                    <div className="border-t border-[#E5E2DD]/70" />

                    {/* Выезд */}
                    <div className="flex items-center gap-2.5">
                      <span className="w-12 text-xs font-sans font-medium text-[#241E1A] shrink-0">
                        Выезд
                      </span>

                      <div className="flex-1 bg-white border border-[#E5E2DD] rounded-[12px] px-3 py-2.5 flex items-center justify-between">
                        <input
                          type="text"
                          value={indCheckoutDate}
                          onChange={(e) => setIndCheckoutDate(e.target.value)}
                          className="w-full bg-transparent text-xs font-sans text-[#241E1A] focus:outline-none"
                        />
                        <Calendar className="h-3.5 w-3.5 text-[#241E1A] shrink-0 ml-1" />
                      </div>

                      <div className="w-[92px] bg-white border border-[#E5E2DD] rounded-[12px] px-3 py-2.5 flex items-center justify-between shrink-0">
                        <input
                          type="text"
                          value={indCheckoutTime}
                          onChange={(e) => setIndCheckoutTime(e.target.value)}
                          className="w-full bg-transparent text-xs font-sans text-[#241E1A] focus:outline-none"
                        />
                        <Clock className="h-3.5 w-3.5 text-[#241E1A] shrink-0 ml-1" />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Section: Номера */}
                <div className="space-y-3.5">
                  <h3 className="text-xs font-sans font-medium text-[#241E1A]">Номера</h3>

                  {/* Категория номера */}
                  <div>
                    <label className="block text-xs font-sans text-[#6E675F] mb-1.5">
                      Категория номера
                    </label>
                    <div className="relative">
                      <select
                        value={indCategoryCode}
                        onChange={(e) => {
                          const nextCode = e.target.value as 'Lux' | 'Comfort' | 'Standard';
                          setIndCategoryCode(nextCode);
                          const nextRu = mapCodeToRuCat(nextCode);
                          const firstMatching = RECEPTION_ROOMS.find((r) => r.category === nextRu);
                          if (firstMatching) setIndRoomNumber(firstMatching.roomNumber);
                        }}
                        className="w-full appearance-none bg-white border border-[#E5E2DD] rounded-[14px] px-3.5 py-3 pr-9 text-xs font-sans text-[#241E1A] focus:outline-none cursor-pointer"
                      >
                        <option value="Lux">Lux</option>
                        <option value="Comfort">Comfort</option>
                        <option value="Standard">Standard</option>
                      </select>
                      <ChevronDown className="h-4 w-4 text-[#241E1A] absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    </div>
                  </div>

                  {/* № комнаты */}
                  <div>
                    <label className="block text-xs font-sans text-[#6E675F] mb-1.5">
                      № комнаты
                    </label>
                    <div className="relative">
                      <select
                        value={indRoomNumber}
                        onChange={(e) => setIndRoomNumber(e.target.value)}
                        className="w-full appearance-none bg-white border border-[#E5E2DD] rounded-[14px] px-3.5 py-3 pr-9 text-xs font-sans text-[#241E1A] focus:outline-none cursor-pointer"
                      >
                        {RECEPTION_ROOMS.filter(
                          (r) => r.category === mapCodeToRuCat(indCategoryCode)
                        ).map((r) => (
                          <option key={r.roomNumber} value={r.roomNumber}>
                            № {r.roomNumber} · {indCategoryCode} · {r.capacity}{' '}
                            {r.capacity < 5 ? 'гостя' : 'гостей'}
                          </option>
                        ))}
                      </select>
                      <ChevronDown className="h-4 w-4 text-[#241E1A] absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    </div>
                  </div>

                  {/* Тариф */}
                  <div>
                    <label className="block text-xs font-sans text-[#6E675F] mb-1.5">
                      Тариф
                    </label>
                    <div className="relative">
                      <select
                        value={indTariff}
                        onChange={(e) => setIndTariff(e.target.value)}
                        className="w-full appearance-none bg-white border border-[#E5E2DD] rounded-[14px] px-3.5 py-3 pr-9 text-xs font-sans text-[#241E1A] focus:outline-none cursor-pointer"
                      >
                        <option value="Тариф номера">Тариф номера</option>
                        <option value="Тариф с завтраком">Тариф с завтраком</option>
                        <option value="Полупансион">Полупансион</option>
                        <option value="Полный пансион">Полный пансион</option>
                      </select>
                      <ChevronDown className="h-4 w-4 text-[#241E1A] absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    </div>
                  </div>

                  {/* Взрослые | Дети */}
                  <div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-sans text-[#6E675F] mb-1.5">
                          Взрослые
                        </label>
                        <input
                          type="number"
                          min={1}
                          max={6}
                          value={indAdults}
                          onChange={(e) => setIndAdults(e.target.value)}
                          className="w-full bg-white border border-[#E5E2DD] rounded-[14px] px-3.5 py-3 text-xs font-sans text-[#241E1A] focus:outline-none"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-sans text-[#6E675F] mb-1.5">
                          Дети
                        </label>
                        <input
                          type="number"
                          min={0}
                          max={6}
                          value={indChildren}
                          onChange={(e) => setIndChildren(e.target.value)}
                          className="w-full bg-white border border-[#E5E2DD] rounded-[14px] px-3.5 py-3 text-xs font-sans text-[#241E1A] focus:outline-none"
                        />
                      </div>
                    </div>

                    <p className="text-[11px] font-sans text-[#8A8177] mt-2">
                      {totalGuestsCount} {guestsWord} · вместимость номера — {roomCap}{' '}
                      {roomCapWord}.
                    </p>
                  </div>
                </div>

                <div className="border-t border-[#E5E2DD]" />

                {/* Section: Компания и агент */}
                <div className="space-y-3.5 pb-2">
                  <h3 className="text-xs font-sans font-medium text-[#241E1A]">
                    Компания и агент
                  </h3>

                  <div>
                    <label className="block text-xs font-sans text-[#6E675F] mb-1.5">
                      Компания
                    </label>
                    <div className="relative">
                      <select
                        value={indCompany}
                        onChange={(e) => {
                          setIndCompany(e.target.value);
                          if (e.target.value === 'Без компании') setIndAgentDiscount('0');
                        }}
                        className="w-full appearance-none bg-white border border-[#E5E2DD] rounded-[14px] px-3.5 py-3 pr-9 text-xs font-sans text-[#241E1A] focus:outline-none cursor-pointer"
                      >
                        <option value="Без компании">Без компании</option>
                        <option value="ТОО «Альфа»">ТОО «Альфа»</option>
                        <option value="ТОО «КазМунайСервис»">ТОО «КазМунайСервис»</option>
                        <option value="KazTour Agency">KazTour Agency</option>
                      </select>
                      <ChevronDown className="h-4 w-4 text-[#241E1A] absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-sans text-[#6E675F] mb-1.5">
                      Скидка агента, %
                    </label>
                    <input
                      type="number"
                      min={0}
                      max={100}
                      value={indAgentDiscount}
                      onChange={(e) => setIndAgentDiscount(e.target.value)}
                      className={`w-full border border-[#E5E2DD] rounded-[14px] px-3.5 py-3 text-xs font-sans focus:outline-none ${
                        indCompany === 'Без компании'
                          ? 'bg-[#EFECE6] text-[#8A8177]'
                          : 'bg-white text-[#241E1A]'
                      }`}
                    />
                  </div>
                </div>
              </>
            )}

            {indStep === 2 && (
              /* ---------------- ШАГ 2 ИЗ 4: ГОСТИ (ОСНОВНОЙ ГОСТЬ + ГОСТЬ 2, ...) ---------------- */
              <div className="space-y-4 pb-2">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-sans font-medium text-[#241E1A]">Гости</h3>
                  <span className="text-[11px] font-sans text-[#8A8177]">
                    Всего гостей: {totalGuestsCount}
                  </span>
                </div>

                {/* ==================== БЛОК 1: ОСНОВНОЙ ГОСТЬ ==================== */}
                <div className="bg-white rounded-[18px] border border-[#E5E2DD] p-4 space-y-4 shadow-2xs">
                  <div className="flex items-center justify-between border-b border-[#E5E2DD]/70 pb-2.5">
                    <span className="text-sm font-sans font-semibold text-[#241E1A]">
                      Основной гость
                    </span>
                    <span className="text-[11px] font-sans text-[#8A8177]">Взрослый</span>
                  </div>

                  {/* Подраздел: Контакты */}
                  <div className="space-y-3.5">
                    <h4 className="text-xs font-sans font-medium text-[#241E1A]">Контакты</h4>

                    {/* Поиск в базе */}
                    <div>
                      <label className="block text-xs font-sans text-[#6E675F] mb-1.5">
                        Поиск в базе
                      </label>
                      <div className="bg-[#FAF7F3] border border-[#E5E2DD] rounded-[14px] px-3.5 py-3 flex items-center gap-2.5">
                        <Search className="h-4 w-4 text-[#8A8177] shrink-0" />
                        <input
                          type="text"
                          value={indDbSearch}
                          onChange={(e) => setIndDbSearch(e.target.value)}
                          placeholder="Имя или телефон..."
                          className="w-full bg-transparent text-xs font-sans text-[#241E1A] placeholder:text-[#8A8177] focus:outline-none"
                        />
                      </div>
                      <p className="text-[11px] font-sans text-[#8A8177] mt-1.5">
                        Найдите гостя в базе или заполните данные ниже.
                      </p>

                      {/* Quick Autofill Suggestions when typing in Поиск в базе */}
                      {indDbSearch.trim().length > 0 && (
                        <div className="mt-2 bg-[#FAF7F3] rounded-xl border border-[#E5E2DD] divide-y divide-[#E5E2DD]/60 overflow-hidden shadow-xs">
                          {bookings
                            .filter(
                              (b) =>
                                b.guestName.toLowerCase().includes(indDbSearch.toLowerCase()) ||
                                b.phone.toLowerCase().includes(indDbSearch.toLowerCase())
                            )
                            .slice(0, 3)
                            .map((b) => (
                              <div
                                key={b.id}
                                onClick={() => {
                                  const parts = b.guestName.split(' ');
                                  setIndFirstName(parts[0] || '');
                                  setIndLastName(parts.slice(1).join(' ') || '');
                                  setIndPhone(b.phone);
                                  setIndEmail(b.email);
                                  setIndDbSearch('');
                                }}
                                className="px-3.5 py-2.5 flex items-center justify-between text-xs cursor-pointer hover:bg-white"
                              >
                                <span className="font-medium text-[#241E1A]">{b.guestName}</span>
                                <span className="text-[#8A8177]">{b.phone}</span>
                              </div>
                            ))}
                        </div>
                      )}
                    </div>

                    {/* Фамилия */}
                    <div>
                      <label className="block text-xs font-sans text-[#6E675F] mb-1.5">
                        Фамилия
                      </label>
                      <input
                        type="text"
                        value={indLastName}
                        onChange={(e) => setIndLastName(e.target.value)}
                        placeholder="Фамилия гостя"
                        className="w-full bg-[#FAF7F3] border border-[#E5E2DD] rounded-[14px] px-3.5 py-3 text-xs font-sans text-[#241E1A] placeholder:text-[#8A8177] focus:outline-none"
                      />
                    </div>

                    {/* Имя | Отчество */}
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-sans text-[#6E675F] mb-1.5">
                          Имя
                        </label>
                        <input
                          type="text"
                          value={indFirstName}
                          onChange={(e) => setIndFirstName(e.target.value)}
                          placeholder="Имя"
                          className="w-full bg-[#FAF7F3] border border-[#E5E2DD] rounded-[14px] px-3.5 py-3 text-xs font-sans text-[#241E1A] placeholder:text-[#8A8177] focus:outline-none"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-sans text-[#6E675F] mb-1.5">
                          Отчество
                        </label>
                        <input
                          type="text"
                          value={indMiddleName}
                          onChange={(e) => setIndMiddleName(e.target.value)}
                          placeholder="Отчество"
                          className="w-full bg-[#FAF7F3] border border-[#E5E2DD] rounded-[14px] px-3.5 py-3 text-xs font-sans text-[#241E1A] placeholder:text-[#8A8177] focus:outline-none"
                        />
                      </div>
                    </div>

                    {/* Телефон */}
                    <div>
                      <label className="block text-xs font-sans text-[#6E675F] mb-1.5">
                        Телефон
                      </label>
                      <input
                        type="text"
                        value={indPhone}
                        onChange={(e) => setIndPhone(e.target.value)}
                        placeholder="+7 (XXX) XXX XX XX"
                        className="w-full bg-[#FAF7F3] border border-[#E5E2DD] rounded-[14px] px-3.5 py-3 text-xs font-sans text-[#241E1A] placeholder:text-[#8A8177] focus:outline-none"
                      />
                    </div>

                    {/* E-mail */}
                    <div>
                      <label className="block text-xs font-sans text-[#6E675F] mb-1.5">
                        E-mail
                      </label>
                      <input
                        type="email"
                        value={indEmail}
                        onChange={(e) => setIndEmail(e.target.value)}
                        placeholder="guest@example.com"
                        className="w-full bg-[#FAF7F3] border border-[#E5E2DD] rounded-[14px] px-3.5 py-3 text-xs font-sans text-[#241E1A] placeholder:text-[#8A8177] focus:outline-none"
                      />
                    </div>
                  </div>

                  <div className="border-t border-[#E5E2DD]/70" />

                  {/* Подраздел: Источник */}
                  <div className="space-y-3">
                    <h4 className="text-xs font-sans font-medium text-[#241E1A]">Источник</h4>

                    <div>
                      <label className="block text-xs font-sans text-[#6E675F] mb-1.5">
                        Источник бронирования
                      </label>
                      <div className="relative">
                        <select
                          value={indSource}
                          onChange={(e) => setIndSource(e.target.value as BookingSource)}
                          className="w-full appearance-none bg-[#FAF7F3] border border-[#E5E2DD] rounded-[14px] px-3.5 py-3 pr-9 text-xs font-sans text-[#241E1A] focus:outline-none cursor-pointer"
                        >
                          <option value="Прямая бронь">Прямая бронь</option>
                          <option value="Booking.com">Booking.com</option>
                          <option value="Корпоративный">Корпоративный</option>
                          <option value="От стойки">От стойки</option>
                        </select>
                        <ChevronDown className="h-4 w-4 text-[#241E1A] absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                      </div>
                    </div>
                  </div>

                  <div className="border-t border-[#E5E2DD]/70" />

                  {/* Подраздел: Документы и личные данные */}
                  <div className="space-y-3.5">
                    <h4 className="text-xs font-sans font-medium text-[#241E1A]">
                      Документы и личные данные
                    </h4>

                    {/* Тип документа */}
                    <div>
                      <label className="block text-xs font-sans text-[#6E675F] mb-1.5">
                        Тип документа
                      </label>
                      <div className="relative">
                        <select
                          value={indDocType}
                          onChange={(e) => setIndDocType(e.target.value)}
                          className="w-full appearance-none bg-[#FAF7F3] border border-[#E5E2DD] rounded-[14px] px-3.5 py-3 pr-9 text-xs font-sans text-[#241E1A] focus:outline-none cursor-pointer"
                        >
                          <option value="">Выбрать...</option>
                          <option value="Удостоверение личности">Удостоверение личности</option>
                          <option value="Паспорт">Паспорт</option>
                          <option value="Заграничный паспорт">Заграничный паспорт</option>
                          <option value="Вид на жительство">Вид на жительство</option>
                        </select>
                        <ChevronDown className="h-4 w-4 text-[#241E1A] absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                      </div>
                    </div>

                    {/* Номер документа */}
                    <div>
                      <label className="block text-xs font-sans text-[#6E675F] mb-1.5">
                        Номер документа
                      </label>
                      <input
                        type="text"
                        value={indDocNumber}
                        onChange={(e) => setIndDocNumber(e.target.value)}
                        placeholder="Номер документа"
                        className="w-full bg-[#FAF7F3] border border-[#E5E2DD] rounded-[14px] px-3.5 py-3 text-xs font-sans text-[#241E1A] placeholder:text-[#8A8177] focus:outline-none"
                      />
                    </div>

                    {/* Дата рождения */}
                    <div>
                      <label className="block text-xs font-sans text-[#6E675F] mb-1.5">
                        Дата рождения
                      </label>
                      <div className="bg-[#FAF7F3] border border-[#E5E2DD] rounded-[14px] px-3.5 py-3 flex items-center justify-between">
                        <input
                          type="text"
                          value={indBirthDate}
                          onChange={(e) => setIndBirthDate(e.target.value)}
                          placeholder="дд.мм.гггг"
                          className="w-full bg-transparent text-xs font-sans text-[#241E1A] placeholder:text-[#241E1A] focus:outline-none"
                        />
                        <Calendar className="h-4 w-4 text-[#241E1A] shrink-0 ml-2" />
                      </div>
                    </div>

                    {/* Пол */}
                    <div>
                      <label className="block text-xs font-sans text-[#6E675F] mb-1.5">
                        Пол
                      </label>
                      <div className="relative">
                        <select
                          value={indGender}
                          onChange={(e) => setIndGender(e.target.value)}
                          className="w-full appearance-none bg-[#FAF7F3] border border-[#E5E2DD] rounded-[14px] px-3.5 py-3 pr-9 text-xs font-sans text-[#241E1A] focus:outline-none cursor-pointer"
                        >
                          <option value="">Выбрать...</option>
                          <option value="Мужской">Мужской</option>
                          <option value="Женский">Женский</option>
                        </select>
                        <ChevronDown className="h-4 w-4 text-[#241E1A] absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                      </div>
                    </div>

                    {/* Национальность */}
                    <div>
                      <label className="block text-xs font-sans text-[#6E675F] mb-1.5">
                        Национальность
                      </label>
                      <div className="relative">
                        <select
                          value={indNationality}
                          onChange={(e) => setIndNationality(e.target.value)}
                          className="w-full appearance-none bg-[#FAF7F3] border border-[#E5E2DD] rounded-[14px] px-3.5 py-3 pr-9 text-xs font-sans text-[#241E1A] focus:outline-none cursor-pointer"
                        >
                          <option value="">Выбрать...</option>
                          <option value="Казахстан">Казахстан</option>
                          <option value="Россия">Россия</option>
                          <option value="Узбекистан">Узбекистан</option>
                          <option value="Кыргызстан">Кыргызстан</option>
                          <option value="Турция">Турция</option>
                          <option value="Германия">Германия</option>
                          <option value="США">США</option>
                          <option value="Другая">Другая</option>
                        </select>
                        <ChevronDown className="h-4 w-4 text-[#241E1A] absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                      </div>
                    </div>
                  </div>
                </div>

                {/* ==================== БЛОКИ: ГОСТЬ 2, ГОСТЬ 3, ... ==================== */}
                {otherGuestsCount > 0 &&
                  Array.from({ length: otherGuestsCount }, (_, idx) => {
                    const g = indOtherGuests[idx] || {
                      lastName: '',
                      firstName: '',
                      middleName: '',
                      phone: '',
                      docType: '',
                      docNumber: '',
                      birthDate: '',
                      gender: '',
                      nationality: '',
                    };
                    const isChildSlot = idx >= adultsNum - 1;

                    return (
                      <div
                        key={idx}
                        className="bg-white rounded-[18px] border border-[#E5E2DD] p-4 space-y-4 shadow-2xs"
                      >
                        <div className="flex items-center justify-between border-b border-[#E5E2DD]/70 pb-2.5">
                          <span className="text-sm font-sans font-semibold text-[#241E1A]">
                            Гость {idx + 2}
                          </span>
                          <span className="text-[11px] font-sans text-[#8A8177]">
                            {isChildSlot ? 'Ребёнок' : 'Взрослый'}
                          </span>
                        </div>

                        {/* Подраздел: Контакты */}
                        <div className="space-y-3.5">
                          <h4 className="text-xs font-sans font-medium text-[#241E1A]">Контакты</h4>

                          {/* Фамилия */}
                          <div>
                            <label className="block text-xs font-sans text-[#6E675F] mb-1.5">
                              Фамилия
                            </label>
                            <input
                              type="text"
                              value={g.lastName}
                              onChange={(e) =>
                                updateOtherGuestField(idx, 'lastName', e.target.value)
                              }
                              placeholder="Фамилия гостя"
                              className="w-full bg-[#FAF7F3] border border-[#E5E2DD] rounded-[14px] px-3.5 py-3 text-xs font-sans text-[#241E1A] placeholder:text-[#8A8177] focus:outline-none"
                            />
                          </div>

                          {/* Имя | Отчество */}
                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <label className="block text-xs font-sans text-[#6E675F] mb-1.5">
                                Имя
                              </label>
                              <input
                                type="text"
                                value={g.firstName}
                                onChange={(e) =>
                                  updateOtherGuestField(idx, 'firstName', e.target.value)
                                }
                                placeholder="Имя"
                                className="w-full bg-[#FAF7F3] border border-[#E5E2DD] rounded-[14px] px-3.5 py-3 text-xs font-sans text-[#241E1A] placeholder:text-[#8A8177] focus:outline-none"
                              />
                            </div>
                            <div>
                              <label className="block text-xs font-sans text-[#6E675F] mb-1.5">
                                Отчество
                              </label>
                              <input
                                type="text"
                                value={g.middleName}
                                onChange={(e) =>
                                  updateOtherGuestField(idx, 'middleName', e.target.value)
                                }
                                placeholder="Отчество"
                                className="w-full bg-[#FAF7F3] border border-[#E5E2DD] rounded-[14px] px-3.5 py-3 text-xs font-sans text-[#241E1A] placeholder:text-[#8A8177] focus:outline-none"
                              />
                            </div>
                          </div>

                          {/* Телефон */}
                          <div>
                            <label className="block text-xs font-sans text-[#6E675F] mb-1.5">
                              Телефон
                            </label>
                            <input
                              type="text"
                              value={g.phone}
                              onChange={(e) =>
                                updateOtherGuestField(idx, 'phone', e.target.value)
                              }
                              placeholder="+7 (XXX) XXX XX XX"
                              className="w-full bg-[#FAF7F3] border border-[#E5E2DD] rounded-[14px] px-3.5 py-3 text-xs font-sans text-[#241E1A] placeholder:text-[#8A8177] focus:outline-none"
                            />
                          </div>
                        </div>

                        <div className="border-t border-[#E5E2DD]/70" />

                        {/* Подраздел: Документы и личные данные */}
                        <div className="space-y-3.5">
                          <h4 className="text-xs font-sans font-medium text-[#241E1A]">
                            Документы и личные данные
                          </h4>

                          {/* Тип документа */}
                          <div>
                            <label className="block text-xs font-sans text-[#6E675F] mb-1.5">
                              Тип документа
                            </label>
                            <div className="relative">
                              <select
                                value={g.docType}
                                onChange={(e) =>
                                  updateOtherGuestField(idx, 'docType', e.target.value)
                                }
                                className="w-full appearance-none bg-[#FAF7F3] border border-[#E5E2DD] rounded-[14px] px-3.5 py-3 pr-9 text-xs font-sans text-[#241E1A] focus:outline-none cursor-pointer"
                              >
                                <option value="">Выбрать...</option>
                                <option value="Удостоверение личности">
                                  Удостоверение личности
                                </option>
                                <option value="Паспорт">Паспорт</option>
                                <option value="Заграничный паспорт">Заграничный паспорт</option>
                                <option value="Свидетельство о рождении">
                                  Свидетельство о рождении
                                </option>
                              </select>
                              <ChevronDown className="h-4 w-4 text-[#241E1A] absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                            </div>
                          </div>

                          {/* Номер документа */}
                          <div>
                            <label className="block text-xs font-sans text-[#6E675F] mb-1.5">
                              Номер документа
                            </label>
                            <input
                              type="text"
                              value={g.docNumber}
                              onChange={(e) =>
                                updateOtherGuestField(idx, 'docNumber', e.target.value)
                              }
                              placeholder="Номер документа"
                              className="w-full bg-[#FAF7F3] border border-[#E5E2DD] rounded-[14px] px-3.5 py-3 text-xs font-sans text-[#241E1A] placeholder:text-[#8A8177] focus:outline-none"
                            />
                          </div>

                          {/* Дата рождения */}
                          <div>
                            <label className="block text-xs font-sans text-[#6E675F] mb-1.5">
                              Дата рождения
                            </label>
                            <div className="bg-[#FAF7F3] border border-[#E5E2DD] rounded-[14px] px-3.5 py-3 flex items-center justify-between">
                              <input
                                type="text"
                                value={g.birthDate}
                                onChange={(e) =>
                                  updateOtherGuestField(idx, 'birthDate', e.target.value)
                                }
                                placeholder="дд.мм.гггг"
                                className="w-full bg-transparent text-xs font-sans text-[#241E1A] placeholder:text-[#241E1A] focus:outline-none"
                              />
                              <Calendar className="h-4 w-4 text-[#241E1A] shrink-0 ml-2" />
                            </div>
                          </div>

                          {/* Пол */}
                          <div>
                            <label className="block text-xs font-sans text-[#6E675F] mb-1.5">
                              Пол
                            </label>
                            <div className="relative">
                              <select
                                value={g.gender}
                                onChange={(e) =>
                                  updateOtherGuestField(idx, 'gender', e.target.value)
                                }
                                className="w-full appearance-none bg-[#FAF7F3] border border-[#E5E2DD] rounded-[14px] px-3.5 py-3 pr-9 text-xs font-sans text-[#241E1A] focus:outline-none cursor-pointer"
                              >
                                <option value="">Выбрать...</option>
                                <option value="Мужской">Мужской</option>
                                <option value="Женский">Женский</option>
                              </select>
                              <ChevronDown className="h-4 w-4 text-[#241E1A] absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                            </div>
                          </div>

                          {/* Национальность */}
                          <div>
                            <label className="block text-xs font-sans text-[#6E675F] mb-1.5">
                              Национальность
                            </label>
                            <div className="relative">
                              <select
                                value={g.nationality}
                                onChange={(e) =>
                                  updateOtherGuestField(idx, 'nationality', e.target.value)
                                }
                                className="w-full appearance-none bg-[#FAF7F3] border border-[#E5E2DD] rounded-[14px] px-3.5 py-3 pr-9 text-xs font-sans text-[#241E1A] focus:outline-none cursor-pointer"
                              >
                                <option value="">Выбрать...</option>
                                <option value="Казахстан">Казахстан</option>
                                <option value="Россия">Россия</option>
                                <option value="Узбекистан">Узбекистан</option>
                                <option value="Кыргызстан">Кыргызстан</option>
                                <option value="Турция">Турция</option>
                                <option value="Германия">Германия</option>
                                <option value="США">США</option>
                                <option value="Другая">Другая</option>
                              </select>
                              <ChevronDown className="h-4 w-4 text-[#241E1A] absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
              </div>
            )}

            {indStep === 3 && (
              /* ---------------- ШАГ 3 ИЗ 4: ПОЖЕЛАНИЯ И УСЛУГИ ---------------- */
              <>
                <div className="space-y-4">
                  <h3 className="text-xs font-sans font-medium text-[#241E1A]">
                    Пожелания и примечания
                  </h3>

                  {/* Питание */}
                  <div>
                    <label className="block text-xs font-sans text-[#6E675F] mb-1.5">
                      Питание
                    </label>
                    <div className="relative">
                      <select
                        value={indMealPlan}
                        onChange={(e) => setIndMealPlan(e.target.value)}
                        className="w-full appearance-none bg-white border border-[#E5E2DD] rounded-[14px] px-3.5 py-3 pr-9 text-xs font-sans text-[#241E1A] focus:outline-none cursor-pointer"
                      >
                        <option value="Завтрак">Завтрак</option>
                        <option value="Без питания">Без питания</option>
                        <option value="Полупансион">Полупансион</option>
                        <option value="Полный пансион">Полный пансион</option>
                        <option value="Всё включено">Всё включено</option>
                      </select>
                      <ChevronDown className="h-4 w-4 text-[#241E1A] absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    </div>
                  </div>

                  {/* Особые метки */}
                  <div>
                    <label className="block text-xs font-sans text-[#6E675F] mb-2">
                      Особые метки
                    </label>

                    <div className="flex flex-wrap gap-2">
                      {['VIP-гость', 'Аллергия', 'Молодожёны'].map((mark) => {
                        const isSelected = indSpecialMarks.includes(mark);
                        return (
                          <button
                            key={mark}
                            type="button"
                            onClick={() => toggleSpecialMark(mark)}
                            className={`px-3.5 py-2 rounded-full text-xs font-sans border transition-colors cursor-pointer ${
                              isSelected
                                ? 'bg-[#C2410C]/10 border-[#C2410C] text-[#C2410C] font-medium'
                                : 'bg-[#F5F1EB] border-[#E2DAD0] text-[#5C544C] hover:bg-[#EDE7DE]'
                            }`}
                          >
                            {mark}
                          </button>
                        );
                      })}
                    </div>

                    <div className="flex flex-wrap gap-2 mt-2">
                      <button
                        type="button"
                        onClick={() => setIndLateCheckout(!indLateCheckout)}
                        className={`px-3.5 py-2 rounded-full text-xs font-sans border flex items-center gap-2 transition-colors cursor-pointer ${
                          indLateCheckout
                            ? 'bg-[#C2410C]/10 border-[#C2410C] text-[#C2410C] font-medium'
                            : 'bg-[#F5F1EB] border-[#E2DAD0] text-[#5C544C] hover:bg-[#EDE7DE]'
                        }`}
                      >
                        <span>Поздний выезд</span>
                        <span
                          className={`h-3 w-[1px] ${
                            indLateCheckout ? 'bg-[#C2410C]/40' : 'bg-[#D2C9BD]'
                          }`}
                        />
                        <span>+5 000 ₸</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setIndEarlyCheckin(!indEarlyCheckin)}
                        className={`px-3.5 py-2 rounded-full text-xs font-sans border flex items-center gap-2 transition-colors cursor-pointer ${
                          indEarlyCheckin
                            ? 'bg-[#C2410C]/10 border-[#C2410C] text-[#C2410C] font-medium'
                            : 'bg-[#F5F1EB] border-[#E2DAD0] text-[#5C544C] hover:bg-[#EDE7DE]'
                        }`}
                      >
                        <span>Ранний заезд</span>
                        <span
                          className={`h-3 w-[1px] ${
                            indEarlyCheckin ? 'bg-[#C2410C]/40' : 'bg-[#D2C9BD]'
                          }`}
                        />
                        <span>+5 000 ₸</span>
                      </button>
                    </div>
                  </div>

                  {/* Особые пожелания */}
                  <div>
                    <label className="block text-xs font-sans text-[#6E675F] mb-1.5">
                      Особые пожелания
                    </label>
                    <textarea
                      rows={3}
                      value={indSpecialWishes}
                      onChange={(e) => setIndSpecialWishes(e.target.value)}
                      placeholder="Например, тихий номер или гипоаллергенная подушка"
                      className="w-full bg-white border border-[#E5E2DD] rounded-[14px] px-3.5 py-3 text-xs font-sans text-[#241E1A] placeholder:text-[#8A8177] focus:outline-none resize-y"
                    />
                  </div>

                  {/* Проживание с животными */}
                  <div>
                    <button
                      type="button"
                      onClick={() => setIndWithPets(!indWithPets)}
                      className={`px-3.5 py-2 rounded-full text-xs font-sans border transition-colors cursor-pointer ${
                        indWithPets
                          ? 'bg-[#C2410C]/10 border-[#C2410C] text-[#C2410C] font-medium'
                          : 'bg-[#F5F1EB] border-[#E2DAD0] text-[#5C544C] hover:bg-[#EDE7DE]'
                      }`}
                    >
                      Проживание с животными
                    </button>
                  </div>

                  {/* Теги (через запятую) */}
                  <div>
                    <label className="block text-xs font-sans text-[#6E675F] mb-1.5">
                      Теги (через запятую)
                    </label>
                    <input
                      type="text"
                      value={indTags}
                      onChange={(e) => setIndTags(e.target.value)}
                      placeholder="VIP, с детьми..."
                      className="w-full bg-white border border-[#E5E2DD] rounded-[14px] px-3.5 py-3 text-xs font-sans text-[#241E1A] placeholder:text-[#8A8177] focus:outline-none"
                    />
                  </div>

                  {/* Примечания */}
                  <div>
                    <label className="block text-xs font-sans text-[#6E675F] mb-1.5">
                      Примечания
                    </label>
                    <textarea
                      rows={3}
                      value={indBookingNotes}
                      onChange={(e) => setIndBookingNotes(e.target.value)}
                      placeholder="Дополнительная информация по брони"
                      className="w-full bg-white border border-[#E5E2DD] rounded-[14px] px-3.5 py-3 text-xs font-sans text-[#241E1A] placeholder:text-[#8A8177] focus:outline-none resize-y"
                    />
                  </div>
                </div>

                <div className="border-t border-[#E5E2DD]" />

                {/* Section: Услуги */}
                <div className="space-y-3 pb-2">
                  <h3 className="text-xs font-sans font-medium text-[#241E1A]">Услуги</h3>

                  {indServices.length === 0 ? (
                    <div className="border border-dashed border-[#D6CFC5] rounded-[14px] py-4 px-4 flex items-center justify-center gap-2 text-xs font-sans text-[#8A8177] bg-white/40">
                      <List className="h-4 w-4 text-[#8A8177]" />
                      <span>Услуг пока нет</span>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {indServices.map((srv, idx) => (
                        <div
                          key={`${srv.id}-${idx}`}
                          className="bg-white border border-[#E5E2DD] rounded-[14px] px-3.5 py-2.5 flex items-center justify-between text-xs font-sans"
                        >
                          <span className="text-[#241E1A] font-medium">{srv.name}</span>
                          <div className="flex items-center gap-2.5">
                            <span className="text-[#C2410C] font-semibold">
                              +{srv.price.toLocaleString('ru-RU')} ₸
                            </span>
                            <button
                              type="button"
                              onClick={() =>
                                setIndServices((prev) => prev.filter((_, i) => i !== idx))
                              }
                              className="h-6 w-6 rounded-md flex items-center justify-center text-[#8A8177] hover:bg-black/5 cursor-pointer"
                            >
                              <X className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Inline Order Service Form matching Screenshots */}
                  {showIndServicePicker && (
                    <div className="bg-[#FAF7F3] border border-[#E5E2DD] rounded-[18px] p-4.5 space-y-4 shadow-sm animate-in fade-in duration-200">
                      <div className="flex items-center justify-between">
                        <p className="text-xs font-sans text-[#8A8177]">
                          Услуга будет записана в бронь и добавлена в folio гостя.
                        </p>
                        <button
                          type="button"
                          onClick={() => setShowIndServicePicker(false)}
                          className="text-[#8A8177] hover:text-[#241E1A] p-1 cursor-pointer"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>

                      {/* 1. Услуга */}
                      <div className="space-y-1.5">
                        <label className="block text-xs font-sans text-[#241E1A]">
                          Услуга
                        </label>
                        <div className="relative">
                          <select
                            value={indOrderServiceId}
                            onChange={(e) => {
                              const srvId = e.target.value;
                              setIndOrderServiceId(srvId);
                              const found = availableHotelServices.find((s) => s.id === srvId);
                              if (found) {
                                setIndOrderSum(String(found.price));
                                setIndOrderToPay(String(found.price));
                              }
                            }}
                            className="w-full appearance-none bg-white border border-[#E5E2DD] rounded-[14px] px-3.5 py-3 text-xs font-sans text-[#241E1A] focus:outline-none cursor-pointer pr-9"
                          >
                            <option value="">Выберите услугу</option>
                            {availableHotelServices.map((s) => (
                              <option key={s.id} value={s.id}>
                                {s.name} ({s.price.toLocaleString('ru-RU')} ₸)
                              </option>
                            ))}
                          </select>
                          <ChevronDown className="h-4 w-4 text-[#241E1A] absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                        </div>
                      </div>

                      {/* 2. Время / слот */}
                      <div className="space-y-1.5">
                        <label className="block text-xs font-sans text-[#241E1A]">
                          Время / слот
                        </label>
                        <div className="relative bg-white border border-[#E5E2DD] rounded-[14px] px-3.5 py-3 flex items-center justify-between">
                          <input
                            type="text"
                            value={indOrderSlot}
                            onChange={(e) => setIndOrderSlot(e.target.value)}
                            className="w-full bg-transparent text-xs font-sans text-[#241E1A] focus:outline-none"
                            placeholder="06.11.2026 18:00"
                          />
                          <Calendar className="h-4 w-4 text-[#241E1A] shrink-0 ml-2" />
                        </div>
                      </div>

                      {/* 3. Длительность */}
                      <div className="space-y-1.5">
                        <label className="block text-xs font-sans text-[#241E1A]">
                          Длительность
                        </label>
                        <div className="relative">
                          <select
                            value={indOrderDuration}
                            onChange={(e) => setIndOrderDuration(e.target.value)}
                            className="w-full appearance-none bg-white border border-[#E5E2DD] rounded-[14px] px-3.5 py-3 text-xs font-sans text-[#241E1A] focus:outline-none cursor-pointer pr-9"
                          >
                            <option value="—">—</option>
                            <option value="30 мин">30 мин</option>
                            <option value="1 час">1 час</option>
                            <option value="2 часа">2 часа</option>
                            <option value="Весь день">Весь день</option>
                          </select>
                          <ChevronDown className="h-4 w-4 text-[#241E1A] absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                        </div>
                      </div>

                      {/* Sub-card: Касса */}
                      <div className="bg-white rounded-[16px] border border-[#E5E2DD] p-4 space-y-3.5">
                        <h4 className="text-xs font-sans font-semibold text-[#241E1A]">Касса</h4>

                        {/* Оплата */}
                        <div className="space-y-1.5">
                          <label className="block text-xs font-sans text-[#8A8177]">
                            Оплата
                          </label>
                          <div className="relative">
                            <select
                              value={indOrderPaymentTiming}
                              onChange={(e) => setIndOrderPaymentTiming(e.target.value)}
                              className="w-full appearance-none bg-white border border-[#E5E2DD] rounded-[12px] px-3 py-2.5 text-xs font-sans text-[#241E1A] focus:outline-none cursor-pointer pr-9"
                            >
                              <option value="При выселении">При выселении</option>
                              <option value="Сразу">Сразу</option>
                              <option value="Предоплата 50%">Предоплата 50%</option>
                            </select>
                            <ChevronDown className="h-4 w-4 text-[#241E1A] absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                          </div>
                        </div>

                        {/* Оплата / Folio */}
                        <div className="space-y-1.5">
                          <label className="block text-xs font-sans text-[#8A8177]">
                            Оплата / Folio
                          </label>
                          <div className="relative">
                            <select
                              value={indOrderFolioStatus}
                              onChange={(e) => setIndOrderFolioStatus(e.target.value)}
                              className="w-full appearance-none bg-white border border-[#E5E2DD] rounded-[12px] px-3 py-2.5 text-xs font-sans text-[#241E1A] focus:outline-none cursor-pointer pr-9"
                            >
                              <option value="Не оплачено">Не оплачено</option>
                              <option value="Оплачено">Оплачено</option>
                              <option value="Частично оплачено">Частично оплачено</option>
                            </select>
                            <ChevronDown className="h-4 w-4 text-[#241E1A] absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                          </div>
                        </div>

                        {/* Сумма / К оплате */}
                        <div className="grid grid-cols-2 gap-3">
                          <div className="space-y-1.5">
                            <label className="block text-xs font-sans text-[#8A8177]">
                              Сумма
                            </label>
                            <div className="bg-white border border-[#E5E2DD] rounded-[12px] px-3 py-2.5 flex items-center justify-between">
                              <input
                                type="text"
                                value={indOrderSum}
                                onChange={(e) => setIndOrderSum(e.target.value)}
                                className="w-full bg-transparent text-xs font-sans text-[#241E1A] focus:outline-none"
                              />
                              <span className="text-xs font-sans text-[#8A8177] ml-1">₸</span>
                            </div>
                          </div>

                          <div className="space-y-1.5">
                            <label className="block text-xs font-sans text-[#8A8177]">
                              К оплате
                            </label>
                            <div className="bg-white border border-[#E5E2DD] rounded-[12px] px-3 py-2.5 flex items-center justify-between">
                              <input
                                type="text"
                                value={indOrderToPay}
                                onChange={(e) => setIndOrderToPay(e.target.value)}
                                className="w-full bg-transparent text-xs font-sans text-[#241E1A] focus:outline-none"
                              />
                              <span className="text-xs font-sans text-[#8A8177] ml-1">₸</span>
                            </div>
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => {
                            setIndOrderFolioStatus('Оплачено');
                            setIndOrderToPay('0');
                          }}
                          className="w-full py-2.5 rounded-[12px] bg-[#D6A283] hover:bg-[#C99170] text-white text-xs font-sans font-medium cursor-pointer transition-colors shadow-2xs"
                        >
                          Принять
                        </button>
                      </div>

                      {/* Комментарий */}
                      <div className="space-y-1.5">
                        <label className="block text-xs font-sans text-[#241E1A]">
                          Комментарий
                        </label>
                        <textarea
                          rows={3}
                          value={indOrderComment}
                          onChange={(e) => setIndOrderComment(e.target.value)}
                          placeholder=""
                          className="w-full bg-white border border-[#E5E2DD] rounded-[14px] p-3 text-xs font-sans text-[#241E1A] focus:outline-none resize-none"
                        />
                      </div>

                      {/* Кнопка Добавить услугу */}
                      <button
                        type="button"
                        onClick={() => {
                          const srvObj = availableHotelServices.find(
                            (s) => s.id === indOrderServiceId
                          ) || {
                            id: `custom-${Date.now()}`,
                            name: 'Дополнительная услуга',
                            price: parseInt(indOrderSum || '0', 10) || 5000,
                          };
                          setIndServices((prev) => [
                            ...prev,
                            {
                              id: `srv-${Date.now()}`,
                              name: srvObj.name,
                              price: parseInt(indOrderSum || '0', 10) || srvObj.price,
                            },
                          ]);
                          setShowIndServicePicker(false);
                          setIndOrderComment('');
                        }}
                        className="w-full py-3.5 rounded-[14px] bg-[#B93800] hover:bg-[#9E3000] text-white text-xs font-sans font-semibold cursor-pointer transition-colors shadow-xs"
                      >
                        Добавить услугу
                      </button>
                    </div>
                  )}

                  {!showIndServicePicker && (
                    <button
                      type="button"
                      onClick={() => setShowIndServicePicker(true)}
                      className="w-full rounded-[14px] border border-[#DFC3B4] bg-[#FAF7F3] hover:bg-[#F5EFE6] py-3.5 px-4 flex items-center justify-center gap-2 text-xs font-sans font-medium text-[#C2410C] cursor-pointer transition-colors"
                    >
                      <Plus className="h-4 w-4 text-[#C2410C]" />
                      <span>Заказать услугу</span>
                    </button>
                  )}
                </div>
              </>
            )}

            {indStep === 4 && (
              /* ---------------- ШАГ 4 ИЗ 4: ОПЛАТА И ГРУППА ---------------- */
              <>
                <div className="space-y-3">
                  <h3 className="text-xs font-sans font-medium text-[#241E1A]">Оплата</h3>

                  <div className="bg-white rounded-[18px] border border-[#E5E2DD] p-4 space-y-3.5 shadow-2xs">
                    {/* Сумма */}
                    <div>
                      <label className="block text-xs font-sans text-[#6E675F] mb-1.5">
                        Сумма
                      </label>
                      <div className="bg-white border border-[#E5E2DD] rounded-[14px] px-3.5 py-3 flex items-center justify-between">
                        <input
                          type="number"
                          min={0}
                          value={indCustomSum !== null ? indCustomSum : String(calculatedTotal)}
                          onChange={(e) => {
                            setIndCustomSum(e.target.value);
                            setIndIsPaid(false);
                          }}
                          className="w-full bg-transparent text-xs font-sans text-[#241E1A] focus:outline-none"
                        />
                        <span className="text-xs font-sans text-[#8A8177] shrink-0 ml-2">₸</span>
                      </div>
                    </div>

                    {/* Предоплата */}
                    <div>
                      <label className="block text-xs font-sans text-[#6E675F] mb-1.5">
                        Предоплата
                      </label>
                      <div className="bg-white border border-[#E5E2DD] rounded-[14px] px-3.5 py-3 flex items-center justify-between">
                        <input
                          type="number"
                          min={0}
                          value={indPrepayment}
                          onChange={(e) => {
                            setIndPrepayment(e.target.value);
                            setIndIsPaid(false);
                          }}
                          className="w-full bg-transparent text-xs font-sans text-[#241E1A] focus:outline-none"
                        />
                        <span className="text-xs font-sans text-[#8A8177] shrink-0 ml-2">₸</span>
                      </div>
                    </div>

                    <div className="border-t border-[#E5E2DD]/80" />

                    {/* К доплате */}
                    <div className="flex items-center justify-between py-0.5">
                      <span className="text-xs font-sans text-[#8A8177]">К доплате</span>
                      <span className="text-[20px] font-sans font-semibold text-[#C2410C]">
                        {formattedRemaining}
                      </span>
                    </div>

                    <div className="border-t border-[#E5E2DD]/80" />

                    {/* Счёт зачисления */}
                    <div>
                      <label className="block text-xs font-sans text-[#6E675F] mb-1.5">
                        Счёт зачисления
                      </label>
                      <div className="relative">
                        <select
                          value={indPaymentAccount}
                          onChange={(e) => setIndPaymentAccount(e.target.value)}
                          className="w-full appearance-none bg-white border border-[#E5E2DD] rounded-[14px] px-3.5 py-3 pr-9 text-xs font-sans text-[#241E1A] focus:outline-none cursor-pointer"
                        >
                          <option value="Касса ресепшн">Касса ресепшн</option>
                          <option value="Kaspi QR / Kaspi Pay">Kaspi QR / Kaspi Pay</option>
                          <option value="POS-терминал (Карта)">POS-терминал (Карта)</option>
                          <option value="Расчётный счёт (Безнал)">Расчётный счёт (Безнал)</option>
                        </select>
                        <ChevronDown className="h-4 w-4 text-[#241E1A] absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                      </div>
                    </div>

                    {/* Статус */}
                    <div className="flex items-center justify-between pt-0.5">
                      <span className="text-xs font-sans text-[#8A8177]">Статус</span>
                      {indIsPaid || remainingToPay === 0 ? (
                        <div className="flex items-center gap-1.5 text-xs font-sans font-medium text-[#15803D]">
                          <span className="h-2 w-2 rounded-full bg-[#15803D]" />
                          <span>Оплачено</span>
                        </div>
                      ) : prepaymentNum > 0 ? (
                        <div className="flex items-center gap-1.5 text-xs font-sans font-medium text-[#B45309]">
                          <span className="h-2 w-2 rounded-full bg-[#D97706]" />
                          <span>Частично оплачено</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1.5 text-xs font-sans font-medium text-[#9A6B11]">
                          <span className="h-2 w-2 rounded-full bg-[#C58B16]" />
                          <span>Не оплачено</span>
                        </div>
                      )}
                    </div>

                    {/* Кнопка Оплатить */}
                    <button
                      type="button"
                      onClick={() => {
                        setIndIsPaid(true);
                        setIndPrepayment(String(effectiveTotal));
                      }}
                      className="w-full py-3.5 rounded-[14px] bg-[#C2410C] hover:bg-[#A93A0C] text-white text-xs font-sans font-medium cursor-pointer transition-colors shadow-xs"
                    >
                      {indIsPaid || remainingToPay === 0 ? 'Оплачено ✓' : 'Оплатить'}
                    </button>
                  </div>
                </div>

                {/* Section: Добавить в группу */}
                <div className="space-y-2.5 pt-1 pb-2">
                  <h3 className="text-xs font-sans font-medium text-[#241E1A]">
                    Добавить в группу
                  </h3>

                  <div>
                    <label className="block text-xs font-sans text-[#6E675F] mb-1.5">
                      Существующая группа
                    </label>
                    <div className="relative">
                      <select
                        value={indExistingGroup}
                        onChange={(e) => setIndExistingGroup(e.target.value)}
                        className="w-full appearance-none bg-white border border-[#E5E2DD] rounded-[14px] px-3.5 py-3 pr-9 text-xs font-sans text-[#241E1A] focus:outline-none cursor-pointer"
                      >
                        <option value="Без группы">Без группы</option>
                        <option value="ГР-104 · ТОО «Альфа»">ГР-104 · ТОО «Альфа»</option>
                        <option value="ГР-108 · Конференция Satbayev">
                          ГР-108 · Конференция Satbayev
                        </option>
                        <option value="ГР-112 · Тургруппа Silk Road">
                          ГР-112 · Тургруппа Silk Road
                        </option>
                      </select>
                      <ChevronDown className="h-4 w-4 text-[#241E1A] absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>

          {/* ==================== BOTTOM STICKY SUMMARY & NAVIGATION ==================== */}
          <div className="px-5 pt-3 pb-4 border-t border-[#E5E2DD] bg-[#FAF7F3] shrink-0">
            <div className="grid grid-cols-3 gap-2 mb-3">
              <div>
                <span className="block text-[10px] font-sans text-[#8A8177]">Итого</span>
                <span className="text-base font-sans font-semibold text-[#241E1A]">
                  {formattedTotal}
                </span>
              </div>

              <div>
                <span className="block text-[10px] font-sans text-[#8A8177]">Предоплата</span>
                <span className="text-base font-sans font-semibold text-[#241E1A]">
                  {formattedPrepayment}
                </span>
              </div>

              <div>
                <span className="block text-[10px] font-sans text-[#8A8177]">
                  К оплате при заезде
                </span>
                <span className="text-base font-sans font-semibold text-[#C2410C]">
                  {formattedRemaining}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2.5">
              <button
                type="button"
                onClick={() => {
                  if (indStep === 4) {
                    setCreateBookingType('NONE');
                    setIndStep(1);
                  } else if (indStep > 1) {
                    setIndStep(indStep - 1);
                  } else {
                    setCreateBookingType('NONE');
                  }
                }}
                className="w-[34%] py-3.5 rounded-[14px] bg-white hover:bg-slate-50 border border-[#E5E2DD] text-[#241E1A] text-xs font-sans font-medium cursor-pointer transition-colors text-center shadow-2xs"
              >
                {indStep === 4 ? 'Отмена' : 'Назад'}
              </button>

              <button
                type="button"
                onClick={() => {
                  if (indStep < 4) setIndStep(indStep + 1);
                  else handleFinishIndividualBooking();
                }}
                className="flex-1 py-3.5 rounded-[14px] bg-[#C2410C] hover:bg-[#A93A0C] text-white text-xs font-sans font-medium flex items-center justify-center gap-1.5 cursor-pointer transition-colors shadow-xs"
              >
                <span>{indStep < 4 ? 'Далее' : 'Создать бронь'}</span>
                {indStep < 4 && <ChevronRight className="h-4 w-4 text-white" />}
              </button>
            </div>
          </div>
        </div>
      );
    }

    if (createBookingType === 'GROUP') {
      const grpRoomCatalog = [
        { roomNumber: '304', categoryName: 'Семейный', floor: 3, capacity: 4, pricePerNight: 32000 },
        { roomNumber: '305', categoryName: 'Семейный', floor: 3, capacity: 4, pricePerNight: 32000 },
        { roomNumber: '303', categoryName: 'Lux', floor: 3, capacity: 4, pricePerNight: 50000 },
        { roomNumber: '306', categoryName: 'Стандарт', floor: 3, capacity: 2, pricePerNight: 25000 },
        { roomNumber: '201', categoryName: 'Комфорт', floor: 2, capacity: 3, pricePerNight: 35000 },
        { roomNumber: '204', categoryName: 'Комфорт', floor: 2, capacity: 2, pricePerNight: 30000 },
        { roomNumber: '101', categoryName: 'Стандарт', floor: 1, capacity: 2, pricePerNight: 25000 },
        { roomNumber: '102', categoryName: 'Стандарт', floor: 1, capacity: 2, pricePerNight: 25000 },
      ];

      const parseDateDay = (dateStr: string, fallback: number) => {
        const parts = dateStr.split('.');
        const d = parseInt(parts[0], 10);
        return isNaN(d) ? fallback : d;
      };
      const sDayNum = parseDateDay(grpCheckinDate, 6);
      const eDayNum = parseDateDay(grpCheckoutDate, 9);
      const nightsCount = Math.max(1, eDayNum - sDayNum);
      const nightsLabel =
        nightsCount === 1 ? '1 ночь' : nightsCount < 5 ? `${nightsCount} ночи` : `${nightsCount} ночей`;

      const totalGuestsTarget = Math.max(1, parseInt(grpTotalGuests, 10) || 1);
      const guestsWord =
        totalGuestsTarget === 1
          ? 'гость'
          : totalGuestsTarget >= 2 && totalGuestsTarget <= 4
          ? 'гостя'
          : 'гостей';

      const roomsCount = grpSelectedRooms.length;
      const roomsWord =
        roomsCount === 1
          ? 'номер'
          : roomsCount >= 2 && roomsCount <= 4
          ? 'номера'
          : 'номеров';

      const distributedGuestsCount = grpSelectedRooms.reduce(
        (sum, r) => sum + (parseInt(r.adults, 10) || 0) + (parseInt(r.children, 10) || 0),
        0
      );
      const totalRoomCapacity = grpSelectedRooms.reduce((sum, r) => sum + r.capacity, 0);
      const hasOverflowRoom = grpSelectedRooms.some(
        (r) => (parseInt(r.adults, 10) || 0) + (parseInt(r.children, 10) || 0) > r.capacity
      );
      const hasCapacityMismatch =
        totalRoomCapacity < totalGuestsTarget ||
        hasOverflowRoom ||
        distributedGuestsCount !== totalGuestsTarget;

      const sumPerNightAllRooms = grpSelectedRooms.reduce((sum, r) => sum + r.pricePerNight, 0);
      const grossRoomsSum = nightsCount * sumPerNightAllRooms;
      const discountPct = Math.min(100, Math.max(0, parseFloat(grpAgentDiscount) || 0));
      const discountAmount = Math.round(grossRoomsSum * (discountPct / 100));
      const discountedRoomsSum = grossRoomsSum - discountAmount;
      const grpServicesSum = grpServices.reduce((acc, s) => acc + s.price, 0);
      const grpCalculatedTotal = discountedRoomsSum + grpServicesSum;

      const grpEffectiveTotal =
        grpCustomSum !== null && !isNaN(parseInt(grpCustomSum, 10))
          ? Math.max(0, parseInt(grpCustomSum, 10))
          : grpCalculatedTotal;
      const grpPrepaymentNum = Math.max(0, parseInt(grpPrepayment, 10) || 0);
      const grpRemainingToPay = grpIsPaid ? 0 : Math.max(0, grpEffectiveTotal - grpPrepaymentNum);

      const formattedGrpTotal = `${grpEffectiveTotal.toLocaleString('ru-RU')} ₸`;
      const formattedGrpPrepayment = `${(grpIsPaid ? grpEffectiveTotal : grpPrepaymentNum).toLocaleString('ru-RU')} ₸`;
      const formattedGrpRemaining = `${grpRemainingToPay.toLocaleString('ru-RU')} ₸`;

      const availableGroupServices = [
        { id: 'gsrv-transfer', name: 'Групповой трансфер (микроавтобус)', price: 25000 },
        { id: 'gsrv-conf', name: 'Аренда конференц-зала', price: 45000 },
        { id: 'gsrv-coffee', name: 'Кофе-брейк для группы', price: 30000 },
        { id: 'gsrv-banquet', name: 'Приветственный ужин', price: 60000 },
      ];

      const getRoomingGuest = (roomIdx: number, guestIdx: number) => {
        const key = `${roomIdx}-${guestIdx}`;
        return (
          grpRoomingGuests[key] || {
            lastName: '',
            firstName: '',
            middleName: '',
            phone: '',
            docType: '',
            docNumber: '',
            birthDate: '',
            gender: '',
            nationality: '',
          }
        );
      };

      const updateRoomingGuest = (
        roomIdx: number,
        guestIdx: number,
        field: string,
        value: string
      ) => {
        const key = `${roomIdx}-${guestIdx}`;
        setGrpRoomingGuests((prev) => ({
          ...prev,
          [key]: {
            ...getRoomingGuest(roomIdx, guestIdx),
            [field]: value,
          },
        }));
      };

      const isRoomGuestListFilled = (roomIdx: number, totalGuestsInRoom: number) => {
        for (let g = 0; g < totalGuestsInRoom; g++) {
          const gd = getRoomingGuest(roomIdx, g);
          if (gd.lastName.trim() || gd.firstName.trim()) {
            return true;
          }
        }
        return false;
      };

      const filledRoomingCount = grpSelectedRooms.filter((r, rIdx) => {
        const count =
          Math.max(1, (parseInt(r.adults, 10) || 0) + (parseInt(r.children, 10) || 0));
        return isRoomGuestListFilled(rIdx, count);
      }).length;

      const grpStepTitles: Record<number, string> = {
        1: 'Компания и даты',
        2: 'Номера',
        3: 'Контакты',
        4: 'Пожелания',
        5: 'Оплата',
      };

      const handleAutoPickRooms = () => {
        // Pick rooms on floor 3 to accommodate totalGuestsTarget
        let remaining = totalGuestsTarget;
        const picked: typeof grpSelectedRooms = [];
        for (const catRoom of grpRoomCatalog) {
          if (remaining <= 0) break;
          const assign = Math.min(remaining, catRoom.capacity);
          picked.push({
            id: `gr-${Date.now()}-${catRoom.roomNumber}`,
            roomNumber: catRoom.roomNumber,
            categoryName: catRoom.categoryName,
            floor: catRoom.floor,
            capacity: catRoom.capacity,
            adults: String(assign),
            children: '0',
            pricePerNight: catRoom.pricePerNight,
            guestNames: '',
          });
          remaining -= assign;
        }
        setGrpSelectedRooms(picked);
        setGrpRoomsNeeded(String(picked.length));
      };

      const handleAddGroupRoom = () => {
        const usedNumbers = new Set(grpSelectedRooms.map((r) => r.roomNumber));
        const nextAvailable =
          grpRoomCatalog.find((r) => !usedNumbers.has(r.roomNumber)) || grpRoomCatalog[0];

        // If any existing room is over capacity, rebalance excess into the new room
        const currentOverflow = Math.max(0, totalGuestsTarget - totalRoomCapacity);
        const defaultAdultsForNew = Math.min(
          nextAvailable.capacity,
          currentOverflow > 0 ? currentOverflow : 2
        );

        setGrpSelectedRooms((prev) => {
          const rebalanced = prev.map((r) => {
            const rGuests = (parseInt(r.adults, 10) || 0) + (parseInt(r.children, 10) || 0);
            if (rGuests > r.capacity) {
              return { ...r, adults: String(r.capacity), children: '0' };
            }
            return r;
          });
          return [
            ...rebalanced,
            {
              id: `gr-${Date.now()}`,
              roomNumber: nextAvailable.roomNumber,
              categoryName: nextAvailable.categoryName,
              floor: nextAvailable.floor,
              capacity: nextAvailable.capacity,
              adults: String(defaultAdultsForNew),
              children: '0',
              pricePerNight: nextAvailable.pricePerNight,
              guestNames: '',
            },
          ];
        });
      };

      const handleFinishGroupBooking = () => {
        const orgName =
          grpCompanyName.trim() ||
          (grpRegistryCompany !== 'Новая компания' ? grpRegistryCompany : 'ТОО Sunny Travel');
        const repName = `${grpContactFirstName.trim()} ${grpContactLastName.trim()}`.trim();
        const mainRoomNum = grpSelectedRooms[0]?.roomNumber || '304';
        const extraRooms = grpSelectedRooms.slice(1).map((r) => r.roomNumber);

        const created: ReceptionBooking = {
          id: `bk-grp-${Date.now()}`,
          bookingNumber: `BR-${Math.floor(4112 + Math.random() * 880)}`,
          guestName: orgName,
          shortName: orgName,
          phone: grpContactPhone.trim() || '+7 (701) 555-20-30',
          email: grpContactEmail.trim() || 'b2b@sunnytravel.kz',
          roomNumber: mainRoomNum,
          category: 'Люкс',
          guestsCount: totalGuestsTarget,
          startDay: sDayNum,
          endDay: eDayNum,
          dateRangeText: `${sDayNum} нояб. → ${eDayNum} нояб.`,
          nights: nightsCount,
          status: 'NEW',
          source: 'Корпоративный',
          totalAmount: formattedGrpTotal,
          isPaid: grpIsPaid || grpRemainingToPay === 0,
          tariff: `B2B (-${discountPct}%) · ${grpMealPlan}`,
          notes:
            [
              repName ? `Представитель: ${repName}` : '',
              `Питание: ${grpMealPlan}`,
              grpNotes.trim(),
            ]
              .filter(Boolean)
              .join(' · ') ||
            `Групповая бронь: ${totalGuestsTarget} ${guestsWord}, номеров: ${grpSelectedRooms.length}`,
          bookingType: 'GROUP',
          alsoRooms: extraRooms.length > 0 ? extraRooms : undefined,
        };
        setBookings((prev) => [created, ...prev]);
        setCreateBookingType('NONE');
        setGrpStep(1);
        if (onNavigateTab) onNavigateTab('RECEPTION_BOOKINGS');
      };

      return (
        <div className="flex-1 flex flex-col bg-[#FAF7F3] overflow-hidden select-none animate-in slide-in-from-right duration-200 relative">
          {/* ==================== TOP HEADER + 5-STEP PROGRESS BAR ==================== */}
          <div className="px-5 pt-4 pb-3 border-b border-[#E5E2DD] bg-[#FAF7F3] shrink-0">
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-2.5 -ml-1">
                <button
                  type="button"
                  onClick={() => {
                    if (showGrpRoomingModal) setShowGrpRoomingModal(false);
                    else if (grpStep > 1) setGrpStep(grpStep - 1);
                    else setCreateBookingType('NONE');
                  }}
                  className="mt-1 h-7 w-7 rounded-lg flex items-center justify-center text-[#241E1A] hover:bg-black/5 cursor-pointer"
                >
                  <ChevronLeft className="h-5 w-5" />
                </button>
                <div>
                  <h1 className="text-[22px] font-serif font-normal text-[#241E1A] leading-tight">
                    Групповая бронь
                  </h1>
                  <p className="text-xs font-sans text-[#8A8177] mt-0.5">
                    B2B / Турфирмы
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => {
                  setShowGrpRoomingModal(false);
                  setCreateBookingType('NONE');
                  setGrpStep(1);
                }}
                className="mt-1 h-7 w-7 rounded-lg flex items-center justify-center text-[#241E1A] hover:bg-black/5 cursor-pointer"
              >
                <X className="h-5 w-5 stroke-[1.75]" />
              </button>
            </div>

            {/* Step Title & Counter */}
            <div className="flex items-center justify-between text-xs font-sans mt-4 mb-2">
              <span className="font-medium text-[#241E1A]">
                {showGrpRoomingModal ? 'Rooming list' : grpStepTitles[grpStep]}
              </span>
              <span className="text-[#8A8177]">
                {showGrpRoomingModal ? 'Детали размещения' : `Шаг ${grpStep} из 5`}
              </span>
            </div>

            {/* 5 Progress Bars */}
            <div className="grid grid-cols-5 gap-1.5">
              {[1, 2, 3, 4, 5].map((stNum) => (
                <div
                  key={stNum}
                  onClick={() => {
                    setShowGrpRoomingModal(false);
                    setGrpStep(stNum);
                  }}
                  className={`h-[3px] rounded-full cursor-pointer transition-colors ${
                    stNum <= grpStep ? 'bg-[#C2410C]' : 'bg-[#E2DDD5]'
                  }`}
                />
              ))}
            </div>
          </div>

          {/* ==================== SCROLLABLE STEP BODY ==================== */}
          <div className="flex-1 overflow-y-auto no-scrollbar px-5 py-4 space-y-5">
            {grpStep === 1 && (
              /* ---------------- ШАГ 1 ИЗ 5: КОМПАНИЯ И ДАТЫ ---------------- */
              <>
                {/* Summary Banner Card: Групповая бронь */}
                <div className="bg-[#EFECE6] rounded-[16px] p-4 flex items-center justify-between">
                  <div>
                    <h2 className="text-[20px] font-serif font-normal text-[#241E1A] leading-tight">
                      Групповая бронь
                    </h2>
                    <p className="text-xs font-sans text-[#8A8177] mt-1">
                      Групповая · {totalGuestsTarget} {guestsWord} / {roomsCount} {roomsWord}
                    </p>
                  </div>

                  <span className="px-3 py-1 rounded-full bg-[#241E1A] text-white text-[11px] font-sans font-medium shrink-0">
                    {nightsLabel}
                  </span>
                </div>

                {/* Section: Даты проживания */}
                <div className="space-y-2.5">
                  <h3 className="text-xs font-sans font-medium text-[#241E1A]">
                    Даты проживания
                  </h3>

                  <div className="bg-white rounded-[18px] border border-[#E5E2DD] p-3.5 space-y-3 shadow-2xs">
                    {/* Заезд */}
                    <div className="flex items-center gap-2.5">
                      <span className="w-12 text-xs font-sans font-medium text-[#241E1A] shrink-0">
                        Заезд
                      </span>

                      <div className="flex-1 bg-white border border-[#E5E2DD] rounded-[12px] px-3 py-2.5 flex items-center justify-between">
                        <input
                          type="text"
                          value={grpCheckinDate}
                          onChange={(e) => setGrpCheckinDate(e.target.value)}
                          className="w-full bg-transparent text-xs font-sans text-[#241E1A] focus:outline-none"
                        />
                        <Calendar className="h-3.5 w-3.5 text-[#241E1A] shrink-0 ml-1" />
                      </div>

                      <div className="w-[92px] bg-white border border-[#E5E2DD] rounded-[12px] px-3 py-2.5 flex items-center justify-between shrink-0">
                        <input
                          type="text"
                          value={grpCheckinTime}
                          onChange={(e) => setGrpCheckinTime(e.target.value)}
                          className="w-full bg-transparent text-xs font-sans text-[#241E1A] focus:outline-none"
                        />
                        <Clock className="h-3.5 w-3.5 text-[#241E1A] shrink-0 ml-1" />
                      </div>
                    </div>

                    <div className="border-t border-[#E5E2DD]/70" />

                    {/* Выезд */}
                    <div className="flex items-center gap-2.5">
                      <span className="w-12 text-xs font-sans font-medium text-[#241E1A] shrink-0">
                        Выезд
                      </span>

                      <div className="flex-1 bg-white border border-[#E5E2DD] rounded-[12px] px-3 py-2.5 flex items-center justify-between">
                        <input
                          type="text"
                          value={grpCheckoutDate}
                          onChange={(e) => setGrpCheckoutDate(e.target.value)}
                          className="w-full bg-transparent text-xs font-sans text-[#241E1A] focus:outline-none"
                        />
                        <Calendar className="h-3.5 w-3.5 text-[#241E1A] shrink-0 ml-1" />
                      </div>

                      <div className="w-[92px] bg-white border border-[#E5E2DD] rounded-[12px] px-3 py-2.5 flex items-center justify-between shrink-0">
                        <input
                          type="text"
                          value={grpCheckoutTime}
                          onChange={(e) => setGrpCheckoutTime(e.target.value)}
                          className="w-full bg-transparent text-xs font-sans text-[#241E1A] focus:outline-none"
                        />
                        <Clock className="h-3.5 w-3.5 text-[#241E1A] shrink-0 ml-1" />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Section: Компания */}
                <div className="space-y-3.5 pb-2">
                  <h3 className="text-xs font-sans font-medium text-[#241E1A]">Компания</h3>

                  {/* Компания из реестра B2B */}
                  <div>
                    <label className="block text-xs font-sans text-[#6E675F] mb-1.5">
                      Компания из реестра B2B
                    </label>
                    <div className="relative">
                      <select
                        value={grpRegistryCompany}
                        onChange={(e) => {
                          const val = e.target.value;
                          setGrpRegistryCompany(val);
                          if (val !== 'Новая компания') {
                            setGrpCompanyName(val);
                          }
                        }}
                        className="w-full appearance-none bg-white border border-[#E5E2DD] rounded-[14px] px-3.5 py-3 pr-9 text-xs font-sans text-[#241E1A] focus:outline-none cursor-pointer"
                      >
                        <option value="Новая компания">Новая компания</option>
                        <option value="ТОО Sunny Travel">ТОО Sunny Travel</option>
                        <option value="ТОО «Альфа»">ТОО «Альфа»</option>
                        <option value="KazTour Agency">KazTour Agency</option>
                        <option value="ТОО «КазМунайСервис»">ТОО «КазМунайСервис»</option>
                      </select>
                      <ChevronDown className="h-4 w-4 text-[#241E1A] absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    </div>
                  </div>

                  {/* Компания */}
                  <div>
                    <label className="block text-xs font-sans text-[#6E675F] mb-1.5">
                      Компания
                    </label>
                    <input
                      type="text"
                      value={grpCompanyName}
                      onChange={(e) => setGrpCompanyName(e.target.value)}
                      placeholder="ТОО Sunny Travel"
                      className="w-full bg-white border border-[#E5E2DD] rounded-[14px] px-3.5 py-3 text-xs font-sans text-[#241E1A] placeholder:text-[#8A8177] focus:outline-none"
                    />
                  </div>

                  {/* Всего гостей | Нужно номеров */}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-sans text-[#6E675F] mb-1.5">
                        Всего гостей
                      </label>
                      <input
                        type="number"
                        min={1}
                        max={100}
                        value={grpTotalGuests}
                        onChange={(e) => setGrpTotalGuests(e.target.value)}
                        className="w-full bg-white border border-[#E5E2DD] rounded-[14px] px-3.5 py-3 text-xs font-sans text-[#241E1A] focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-sans text-[#6E675F] mb-1.5">
                        Нужно номеров
                      </label>
                      <input
                        type="number"
                        min={1}
                        max={30}
                        value={grpRoomsNeeded}
                        onChange={(e) => setGrpRoomsNeeded(e.target.value)}
                        className="w-full bg-white border border-[#E5E2DD] rounded-[14px] px-3.5 py-3 text-xs font-sans text-[#241E1A] focus:outline-none"
                      />
                    </div>
                  </div>

                  {/* Скидка агента, % */}
                  <div>
                    <label className="block text-xs font-sans text-[#6E675F] mb-1.5">
                      Скидка агента, %
                    </label>
                    <input
                      type="number"
                      min={0}
                      max={100}
                      value={grpAgentDiscount}
                      onChange={(e) => setGrpAgentDiscount(e.target.value)}
                      className="w-full bg-white border border-[#E5E2DD] rounded-[14px] px-3.5 py-3 text-xs font-sans text-[#241E1A] focus:outline-none"
                    />
                  </div>
                </div>
              </>
            )}

            {grpStep === 2 && !showGrpRoomingModal && (
              /* ---------------- ШАГ 2 ИЗ 5: НОМЕРА (РАСПРЕДЕЛЕНИЕ НОМЕРОВ) ---------------- */
              <>
                <div className="space-y-3">
                  <h3 className="text-xs font-sans font-medium text-[#241E1A]">
                    Распределение номеров
                  </h3>

                  {/* Button: Подобрать номера */}
                  <button
                    type="button"
                    onClick={handleAutoPickRooms}
                    className="w-full bg-white hover:bg-slate-50 border border-[#E5E2DD] rounded-[14px] py-3.5 px-4 flex items-center justify-center gap-2 text-xs font-sans font-medium text-[#241E1A] cursor-pointer transition-colors shadow-2xs"
                  >
                    <LayoutGrid className="h-4 w-4 text-[#241E1A]" />
                    <span>Подобрать номера</span>
                  </button>

                  <p className="text-[11px] font-sans text-[#8A8177]">
                    Предложено {roomsCount} {roomsWord} · этаж {grpSelectedRooms[0]?.floor || 3}
                  </p>

                  {/* Status Pill Bar: X / Y гостей распределено | Z номера */}
                  <div className="bg-[#EFECE6] rounded-[12px] px-3.5 py-2.5 flex items-center justify-between text-xs font-sans">
                    <div>
                      <span className="font-semibold text-[#241E1A]">
                        {distributedGuestsCount} / {totalGuestsTarget}
                      </span>{' '}
                      <span className="text-[#6E675F]">гостей распределено</span>
                    </div>
                    <span className="text-[#6E675F]">
                      {roomsCount} {roomsWord}
                    </span>
                  </div>
                </div>

                {/* Selected Room Cards */}
                <div className="space-y-3.5">
                  {grpSelectedRooms.map((roomItem, idx) => {
                    const rAdults = parseInt(roomItem.adults, 10) || 0;
                    const rChildren = parseInt(roomItem.children, 10) || 0;
                    const rTotal = rAdults + rChildren;
                    const isOverCap = rTotal > roomItem.capacity;
                    const capWord =
                      roomItem.capacity === 1
                        ? 'гость'
                        : roomItem.capacity < 5
                        ? 'гостя'
                        : 'гостей';
                    const rTotalWord =
                      rTotal === 1 ? 'гость' : rTotal >= 2 && rTotal <= 4 ? 'гостя' : 'гостей';

                    return (
                      <div
                        key={roomItem.id}
                        className="bg-white rounded-[18px] border border-[#E5E2DD] p-4 space-y-3 shadow-2xs"
                      >
                        {/* Card Top Header */}
                        <div className="flex items-center justify-between">
                          <h4 className="text-sm font-sans font-semibold text-[#241E1A]">
                            Номер №{roomItem.roomNumber}
                          </h4>
                          {grpSelectedRooms.length > 1 && (
                            <button
                              type="button"
                              onClick={() =>
                                setGrpSelectedRooms((prev) =>
                                  prev.filter((_, i) => i !== idx)
                                )
                              }
                              className="flex items-center gap-1 text-xs font-sans text-[#8A8177] hover:text-[#C2410C] cursor-pointer"
                            >
                              <X className="h-3.5 w-3.5" />
                              <span>Убрать</span>
                            </button>
                          )}
                        </div>

                        {/* № комнаты */}
                        <div>
                          <label className="block text-xs font-sans text-[#6E675F] mb-1.5">
                            № комнаты
                          </label>
                          <div className="relative">
                            <select
                              value={roomItem.roomNumber}
                              onChange={(e) => {
                                const found = grpRoomCatalog.find(
                                  (c) => c.roomNumber === e.target.value
                                );
                                if (!found) return;
                                setGrpSelectedRooms((prev) =>
                                  prev.map((item, i) =>
                                    i === idx
                                      ? {
                                          ...item,
                                          roomNumber: found.roomNumber,
                                          categoryName: found.categoryName,
                                          floor: found.floor,
                                          capacity: found.capacity,
                                          pricePerNight: found.pricePerNight,
                                        }
                                      : item
                                  )
                                );
                              }}
                              className="w-full appearance-none bg-white border border-[#E5E2DD] rounded-[14px] px-3.5 py-3 pr-9 text-xs font-sans text-[#241E1A] focus:outline-none cursor-pointer"
                            >
                              {grpRoomCatalog.map((c) => {
                                const cWord =
                                  c.capacity === 1
                                    ? 'гость'
                                    : c.capacity < 5
                                    ? 'гостя'
                                    : 'гостей';
                                return (
                                  <option key={c.roomNumber} value={c.roomNumber}>
                                    № {c.roomNumber} · {c.categoryName} · {c.capacity} {cWord}
                                  </option>
                                );
                              })}
                            </select>
                            <ChevronDown className="h-4 w-4 text-[#241E1A] absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                          </div>

                          <p className="text-[11px] font-sans text-[#8A8177] mt-1.5">
                            {roomItem.floor} этаж · Вместимость — {roomItem.capacity} {capWord}
                          </p>
                        </div>

                        {/* Взрослые | Дети */}
                        <div>
                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <label className="block text-xs font-sans text-[#6E675F] mb-1.5">
                                Взрослые
                              </label>
                              <input
                                type="number"
                                min={1}
                                max={10}
                                value={roomItem.adults}
                                onChange={(e) => {
                                  const val = e.target.value;
                                  setGrpSelectedRooms((prev) =>
                                    prev.map((item, i) =>
                                      i === idx ? { ...item, adults: val } : item
                                    )
                                  );
                                }}
                                className={`w-full rounded-[14px] px-3.5 py-3 text-xs font-sans focus:outline-none border ${
                                  isOverCap
                                    ? 'bg-[#FDF6F3] border-[#C96B4B] text-[#9A3412]'
                                    : 'bg-white border-[#E5E2DD] text-[#241E1A]'
                                }`}
                              />
                            </div>

                            <div>
                              <label className="block text-xs font-sans text-[#6E675F] mb-1.5">
                                Дети
                              </label>
                              <input
                                type="number"
                                min={0}
                                max={10}
                                value={roomItem.children}
                                onChange={(e) => {
                                  const val = e.target.value;
                                  setGrpSelectedRooms((prev) =>
                                    prev.map((item, i) =>
                                      i === idx ? { ...item, children: val } : item
                                    )
                                  );
                                }}
                                className="w-full bg-white border border-[#E5E2DD] rounded-[14px] px-3.5 py-3 text-xs font-sans text-[#241E1A] focus:outline-none"
                              />
                            </div>
                          </div>

                          {isOverCap && (
                            <p className="text-[11px] font-sans text-[#C2410C] mt-1.5">
                              Указано {rTotal} {rTotalWord} при вместимости {roomItem.capacity}
                            </p>
                          )}
                        </div>

                        <div className="border-t border-[#E5E2DD]/70" />

                        {/* Цена/ночь */}
                        <div className="flex items-center justify-between pt-0.5">
                          <span className="text-xs font-sans text-[#8A8177]">Цена/ночь</span>
                          <div>
                            <span className="text-base font-sans font-semibold text-[#241E1A]">
                              {roomItem.pricePerNight.toLocaleString('ru-RU')} ₸
                            </span>{' '}
                            <span className="text-[11px] font-sans text-[#8A8177]">/ночь</span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Warning Box when capacity < totalGuestsTarget or overflow */}
                {hasCapacityMismatch && (
                  <div className="bg-[#FBECE6] border border-[#E8C5B8] rounded-[14px] p-3.5 text-xs font-sans text-[#9A3412] leading-relaxed">
                    В выбранных номерах {totalRoomCapacity} мест для {totalGuestsTarget}{' '}
                    {guestsWord}. Измените размещение или добавьте номер.
                  </div>
                )}

                {/* Button: + Добавить номер */}
                <button
                  type="button"
                  onClick={handleAddGroupRoom}
                  className="w-full bg-white hover:bg-slate-50 border border-[#E5E2DD] rounded-[14px] py-3.5 px-4 flex items-center justify-center gap-2 text-xs font-sans font-medium text-[#241E1A] cursor-pointer transition-colors shadow-2xs"
                >
                  <Plus className="h-4 w-4 text-[#241E1A]" />
                  <span>Добавить номер</span>
                </button>

                {/* Rooming list card */}
                <div
                  onClick={() => {
                    setGrpExpandedRoomIdx(0);
                    setGrpExpandedGuestKey('0-0');
                    setShowGrpRoomingModal(true);
                  }}
                  className="bg-white hover:bg-slate-50 border border-[#E5E2DD] rounded-[16px] p-3.5 flex items-center justify-between cursor-pointer transition-colors shadow-2xs"
                >
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-[12px] bg-[#EFECE6] flex items-center justify-center text-[#5C544C] shrink-0">
                      <List className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="text-xs font-sans font-semibold text-[#241E1A]">
                        Rooming list
                      </p>
                      <p className="text-[11px] font-sans text-[#8A8177] mt-0.5">
                        Заполнено {filledRoomingCount} из {roomsCount} {roomsWord}
                      </p>
                    </div>
                  </div>
                  <ChevronRight className="h-4 w-4 text-[#8A8177]" />
                </div>
              </>
            )}

            {grpStep === 2 && showGrpRoomingModal && (
              /* ---------------- ЭКРАН ROOMING LIST (ДЕТАЛИ РАЗМЕЩЕНИЯ) ---------------- */
              <div className="space-y-3.5 pb-2">
                {/* Summary Banner Card: Rooming list | 0 / 2 */}
                <div className="bg-[#EFECE6] rounded-[16px] p-4 flex items-center justify-between">
                  <div>
                    <h2 className="text-[15px] font-sans font-semibold text-[#241E1A] leading-tight">
                      Rooming list
                    </h2>
                    <p className="text-[11px] font-sans text-[#8A8177] mt-1">
                      Заполнено {filledRoomingCount} из {roomsCount} {roomsWord}
                    </p>
                  </div>

                  <span className="text-[22px] font-sans font-medium text-[#8A8177] shrink-0">
                    {filledRoomingCount} / {roomsCount}
                  </span>
                </div>

                {/* Accordion Cards per Room */}
                {grpSelectedRooms.map((roomItem, rIdx) => {
                  const rAdults = parseInt(roomItem.adults, 10) || 0;
                  const rChildren = parseInt(roomItem.children, 10) || 0;
                  const rTotalGuests = Math.max(1, rAdults + rChildren);
                  const rGuestsWord =
                    rTotalGuests === 1
                      ? 'гость'
                      : rTotalGuests >= 2 && rTotalGuests <= 4
                      ? 'гостя'
                      : 'гостей';
                  const isRoomExpanded = grpExpandedRoomIdx === rIdx;
                  const isRoomFilled = isRoomGuestListFilled(rIdx, rTotalGuests);

                  return (
                    <div
                      key={roomItem.id}
                      className="bg-white rounded-[18px] border border-[#E5E2DD] overflow-hidden shadow-2xs"
                    >
                      {/* Room Accordion Header */}
                      <div
                        onClick={() =>
                          setGrpExpandedRoomIdx(isRoomExpanded ? null : rIdx)
                        }
                        className="p-4 flex items-center justify-between cursor-pointer hover:bg-[#FAF7F3]/50 transition-colors"
                      >
                        <div>
                          <h3 className="text-[15px] font-sans font-semibold text-[#241E1A]">
                            №{roomItem.roomNumber} · {roomItem.categoryName}
                          </h3>
                          <p className="text-xs font-sans text-[#8A8177] mt-0.5">
                            {rTotalGuests} {rGuestsWord} ·{' '}
                            {isRoomFilled ? 'список заполнен' : 'список не заполнен'}
                          </p>
                        </div>

                        <ChevronDown
                          className={`h-4 w-4 text-[#6E675F] transition-transform duration-200 ${
                            isRoomExpanded ? 'rotate-180' : ''
                          }`}
                        />
                      </div>

                      {/* Guests Inside Room */}
                      {isRoomExpanded && (
                        <div className="divide-y divide-[#E5E2DD]/80 border-t border-[#E5E2DD]/80">
                          {Array.from({ length: rTotalGuests }, (_, gIdx) => {
                            const gKey = `${rIdx}-${gIdx}`;
                            const isGuestExpanded = grpExpandedGuestKey === gKey;
                            const isDocExpanded = grpExpandedDocKey === gKey;
                            const gd = getRoomingGuest(rIdx, gIdx);
                            const fullGuestLabel =
                              `${gd.lastName.trim()} ${gd.firstName.trim()}`.trim();

                            return (
                              <div key={gKey} className="px-4 py-3.5">
                                {/* Guest Header */}
                                <div
                                  onClick={() =>
                                    setGrpExpandedGuestKey(isGuestExpanded ? null : gKey)
                                  }
                                  className="flex items-center justify-between cursor-pointer"
                                >
                                  <div>
                                    <h4 className="text-sm font-sans font-semibold text-[#241E1A]">
                                      Гость {gIdx + 1}
                                    </h4>
                                    <p className="text-[11px] font-sans text-[#8A8177] mt-0.5">
                                      {fullGuestLabel || 'Данные не заполнены'}
                                    </p>
                                  </div>

                                  <ChevronDown
                                    className={`h-4 w-4 text-[#6E675F] transition-transform duration-200 ${
                                      isGuestExpanded ? 'rotate-180' : ''
                                    }`}
                                  />
                                </div>

                                {/* Expanded Guest Form */}
                                {isGuestExpanded && (
                                  <div className="mt-3.5 space-y-3">
                                    {/* Фамилия */}
                                    <div>
                                      <label className="block text-xs font-sans text-[#6E675F] mb-1.5">
                                        Фамилия
                                      </label>
                                      <input
                                        type="text"
                                        value={gd.lastName}
                                        onChange={(e) =>
                                          updateRoomingGuest(
                                            rIdx,
                                            gIdx,
                                            'lastName',
                                            e.target.value
                                          )
                                        }
                                        placeholder="Фамилия гостя"
                                        className="w-full bg-white border border-[#E5E2DD] rounded-[14px] px-3.5 py-3 text-xs font-sans text-[#241E1A] placeholder:text-[#8A8177] focus:outline-none"
                                      />
                                    </div>

                                    {/* Имя | Отчество */}
                                    <div className="grid grid-cols-2 gap-3">
                                      <div>
                                        <label className="block text-xs font-sans text-[#6E675F] mb-1.5">
                                          Имя
                                        </label>
                                        <input
                                          type="text"
                                          value={gd.firstName}
                                          onChange={(e) =>
                                            updateRoomingGuest(
                                              rIdx,
                                              gIdx,
                                              'firstName',
                                              e.target.value
                                            )
                                          }
                                          placeholder="Имя"
                                          className="w-full bg-white border border-[#E5E2DD] rounded-[14px] px-3.5 py-3 text-xs font-sans text-[#241E1A] placeholder:text-[#8A8177] focus:outline-none"
                                        />
                                      </div>

                                      <div>
                                        <label className="block text-xs font-sans text-[#6E675F] mb-1.5">
                                          Отчество
                                        </label>
                                        <input
                                          type="text"
                                          value={gd.middleName}
                                          onChange={(e) =>
                                            updateRoomingGuest(
                                              rIdx,
                                              gIdx,
                                              'middleName',
                                              e.target.value
                                            )
                                          }
                                          placeholder="Отчество"
                                          className="w-full bg-white border border-[#E5E2DD] rounded-[14px] px-3.5 py-3 text-xs font-sans text-[#241E1A] placeholder:text-[#8A8177] focus:outline-none"
                                        />
                                      </div>
                                    </div>

                                    {/* Телефон */}
                                    <div>
                                      <label className="block text-xs font-sans text-[#6E675F] mb-1.5">
                                        Телефон
                                      </label>
                                      <input
                                        type="text"
                                        value={gd.phone}
                                        onChange={(e) =>
                                          updateRoomingGuest(
                                            rIdx,
                                            gIdx,
                                            'phone',
                                            e.target.value
                                          )
                                        }
                                        placeholder="+7 (XXX) XXX XX XX"
                                        className="w-full bg-white border border-[#E5E2DD] rounded-[14px] px-3.5 py-3 text-xs font-sans text-[#241E1A] placeholder:text-[#8A8177] focus:outline-none"
                                      />
                                    </div>

                                    {/* Документ и личные данные (Expandable) */}
                                    <div className="pt-1">
                                      <div
                                        onClick={() =>
                                          setGrpExpandedDocKey(isDocExpanded ? null : gKey)
                                        }
                                        className="flex items-center justify-between py-2 cursor-pointer text-xs font-sans text-[#6E675F] hover:text-[#241E1A]"
                                      >
                                        <span>Документ и личные данные</span>
                                        <ChevronDown
                                          className={`h-3.5 w-3.5 transition-transform duration-200 ${
                                            isDocExpanded ? 'rotate-180' : ''
                                          }`}
                                        />
                                      </div>

                                      {isDocExpanded && (
                                        <div className="space-y-3 pt-2 pb-1">
                                          <div className="grid grid-cols-2 gap-2.5">
                                            <div>
                                              <label className="block text-xs font-sans text-[#6E675F] mb-1">
                                                Тип документа
                                              </label>
                                              <div className="relative">
                                                <select
                                                  value={gd.docType}
                                                  onChange={(e) =>
                                                    updateRoomingGuest(
                                                      rIdx,
                                                      gIdx,
                                                      'docType',
                                                      e.target.value
                                                    )
                                                  }
                                                  className="w-full appearance-none bg-white border border-[#E5E2DD] rounded-[12px] px-3 py-2.5 pr-7 text-xs font-sans text-[#241E1A] focus:outline-none cursor-pointer"
                                                >
                                                  <option value="">Выбрать...</option>
                                                  <option value="Удостоверение личности">
                                                    Уд. личности
                                                  </option>
                                                  <option value="Паспорт">Паспорт</option>
                                                  <option value="Свидетельство о рождении">
                                                    Св-во о рожд.
                                                  </option>
                                                </select>
                                                <ChevronDown className="h-3.5 w-3.5 text-[#241E1A] absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                                              </div>
                                            </div>

                                            <div>
                                              <label className="block text-xs font-sans text-[#6E675F] mb-1">
                                                Номер документа
                                              </label>
                                              <input
                                                type="text"
                                                value={gd.docNumber}
                                                onChange={(e) =>
                                                  updateRoomingGuest(
                                                    rIdx,
                                                    gIdx,
                                                    'docNumber',
                                                    e.target.value
                                                  )
                                                }
                                                placeholder="Номер документа"
                                                className="w-full bg-white border border-[#E5E2DD] rounded-[12px] px-3 py-2.5 text-xs font-sans text-[#241E1A] placeholder:text-[#8A8177] focus:outline-none"
                                              />
                                            </div>
                                          </div>

                                          <div>
                                            <label className="block text-xs font-sans text-[#6E675F] mb-1">
                                              Дата рождения
                                            </label>
                                            <div className="bg-white border border-[#E5E2DD] rounded-[12px] px-3 py-2.5 flex items-center justify-between">
                                              <input
                                                type="text"
                                                value={gd.birthDate}
                                                onChange={(e) =>
                                                  updateRoomingGuest(
                                                    rIdx,
                                                    gIdx,
                                                    'birthDate',
                                                    e.target.value
                                                  )
                                                }
                                                placeholder="дд.мм.гггг"
                                                className="w-full bg-transparent text-xs font-sans text-[#241E1A] placeholder:text-[#241E1A] focus:outline-none"
                                              />
                                              <Calendar className="h-3.5 w-3.5 text-[#241E1A] shrink-0 ml-2" />
                                            </div>
                                          </div>

                                          <div className="grid grid-cols-2 gap-2.5">
                                            <div>
                                              <label className="block text-xs font-sans text-[#6E675F] mb-1">
                                                Пол
                                              </label>
                                              <div className="relative">
                                                <select
                                                  value={gd.gender}
                                                  onChange={(e) =>
                                                    updateRoomingGuest(
                                                      rIdx,
                                                      gIdx,
                                                      'gender',
                                                      e.target.value
                                                    )
                                                  }
                                                  className="w-full appearance-none bg-white border border-[#E5E2DD] rounded-[12px] px-3 py-2.5 pr-7 text-xs font-sans text-[#241E1A] focus:outline-none cursor-pointer"
                                                >
                                                  <option value="">Выбрать...</option>
                                                  <option value="Мужской">Мужской</option>
                                                  <option value="Женский">Женский</option>
                                                </select>
                                                <ChevronDown className="h-3.5 w-3.5 text-[#241E1A] absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                                              </div>
                                            </div>

                                            <div>
                                              <label className="block text-xs font-sans text-[#6E675F] mb-1">
                                                Национальность
                                              </label>
                                              <div className="relative">
                                                <select
                                                  value={gd.nationality}
                                                  onChange={(e) =>
                                                    updateRoomingGuest(
                                                      rIdx,
                                                      gIdx,
                                                      'nationality',
                                                      e.target.value
                                                    )
                                                  }
                                                  className="w-full appearance-none bg-white border border-[#E5E2DD] rounded-[12px] px-3 py-2.5 pr-7 text-xs font-sans text-[#241E1A] focus:outline-none cursor-pointer"
                                                >
                                                  <option value="">Выбрать...</option>
                                                  <option value="Казахстан">Казахстан</option>
                                                  <option value="Россия">Россия</option>
                                                  <option value="Узбекистан">Узбекистан</option>
                                                  <option value="Кыргызстан">Кыргызстан</option>
                                                  <option value="Другая">Другая</option>
                                                </select>
                                                <ChevronDown className="h-3.5 w-3.5 text-[#241E1A] absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                                              </div>
                                            </div>
                                          </div>
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            {grpStep === 3 && (
              /* ---------------- ШАГ 3 ИЗ 5: КОНТАКТЫ (КОНТАКТНОЕ ЛИЦО ГРУППЫ) ---------------- */
              <div className="space-y-3.5 pb-2">
                <h3 className="text-xs font-sans font-medium text-[#241E1A]">Контакты</h3>

                {/* Banner: Контактное лицо группы */}
                <div className="bg-[#EFECE6] border border-[#E2DDD5] rounded-[14px] px-4 py-3.5 flex items-center gap-2.5">
                  <User className="h-4 w-4 text-[#6E675F] shrink-0" />
                  <span className="text-xs font-sans text-[#241E1A]">
                    Контактное лицо группы
                  </span>
                </div>

                {/* Фамилия */}
                <div>
                  <label className="block text-xs font-sans text-[#6E675F] mb-1.5">
                    Фамилия
                  </label>
                  <input
                    type="text"
                    value={grpContactLastName}
                    onChange={(e) => setGrpContactLastName(e.target.value)}
                    placeholder="Фамилия представителя"
                    className="w-full bg-white border border-[#E5E2DD] rounded-[14px] px-3.5 py-3 text-xs font-sans text-[#241E1A] placeholder:text-[#8A8177] focus:outline-none"
                  />
                </div>

                {/* Имя */}
                <div>
                  <label className="block text-xs font-sans text-[#6E675F] mb-1.5">
                    Имя
                  </label>
                  <input
                    type="text"
                    value={grpContactFirstName}
                    onChange={(e) => setGrpContactFirstName(e.target.value)}
                    placeholder="Имя представителя"
                    className="w-full bg-white border border-[#E5E2DD] rounded-[14px] px-3.5 py-3 text-xs font-sans text-[#241E1A] placeholder:text-[#8A8177] focus:outline-none"
                  />
                </div>

                {/* Телефон */}
                <div>
                  <label className="block text-xs font-sans text-[#6E675F] mb-1.5">
                    Телефон
                  </label>
                  <input
                    type="text"
                    value={grpContactPhone}
                    onChange={(e) => setGrpContactPhone(e.target.value)}
                    placeholder="+7 (XXX) XXX XX XX"
                    className="w-full bg-white border border-[#E5E2DD] rounded-[14px] px-3.5 py-3 text-xs font-sans text-[#241E1A] placeholder:text-[#8A8177] focus:outline-none"
                  />
                </div>

                {/* E-mail */}
                <div>
                  <label className="block text-xs font-sans text-[#6E675F] mb-1.5">
                    E-mail
                  </label>
                  <input
                    type="email"
                    value={grpContactEmail}
                    onChange={(e) => setGrpContactEmail(e.target.value)}
                    placeholder="name@company.com"
                    className="w-full bg-white border border-[#E5E2DD] rounded-[14px] px-3.5 py-3 text-xs font-sans text-[#241E1A] placeholder:text-[#8A8177] focus:outline-none"
                  />
                </div>
              </div>
            )}

            {grpStep === 4 && (
              /* ---------------- ШАГ 4 ИЗ 5: ПОЖЕЛАНИЯ И УСЛУГИ ---------------- */
              <>
                <div className="space-y-4">
                  <h3 className="text-xs font-sans font-medium text-[#241E1A]">
                    Пожелания и примечания
                  </h3>

                  {/* Питание */}
                  <div>
                    <label className="block text-xs font-sans text-[#6E675F] mb-1.5">
                      Питание
                    </label>
                    <div className="relative">
                      <select
                        value={grpMealPlan}
                        onChange={(e) => setGrpMealPlan(e.target.value)}
                        className="w-full appearance-none bg-white border border-[#E5E2DD] rounded-[14px] px-3.5 py-3 pr-9 text-xs font-sans text-[#241E1A] focus:outline-none cursor-pointer"
                      >
                        <option value="Полупансион">Полупансион</option>
                        <option value="Завтрак">Завтрак</option>
                        <option value="Без питания">Без питания</option>
                        <option value="Полный пансион">Полный пансион</option>
                        <option value="Всё включено">Всё включено</option>
                      </select>
                      <ChevronDown className="h-4 w-4 text-[#241E1A] absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    </div>
                  </div>

                  {/* Примечания */}
                  <div>
                    <label className="block text-xs font-sans text-[#6E675F] mb-1.5">
                      Примечания
                    </label>
                    <textarea
                      rows={4}
                      value={grpNotes}
                      onChange={(e) => setGrpNotes(e.target.value)}
                      placeholder="Пожелания по размещению и информация о группе"
                      className="w-full bg-white border border-[#E5E2DD] rounded-[14px] px-3.5 py-3 text-xs font-sans text-[#241E1A] placeholder:text-[#8A8177] focus:outline-none resize-y"
                    />
                  </div>
                </div>

                <div className="border-t border-[#E5E2DD]" />

                {/* Section: Услуги */}
                <div className="space-y-3 pb-2">
                  <h3 className="text-xs font-sans font-medium text-[#241E1A]">Услуги</h3>

                  {grpServices.length === 0 ? (
                    <div className="border border-dashed border-[#D6CFC5] rounded-[14px] py-4 px-4 flex items-center justify-center gap-2 text-xs font-sans text-[#8A8177] bg-white/40">
                      <List className="h-4 w-4 text-[#8A8177]" />
                      <span>Услуг пока нет</span>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {grpServices.map((srv, idx) => (
                        <div
                          key={`${srv.id}-${idx}`}
                          className="bg-white border border-[#E5E2DD] rounded-[14px] px-3.5 py-2.5 flex items-center justify-between text-xs font-sans"
                        >
                          <span className="text-[#241E1A] font-medium">{srv.name}</span>
                          <div className="flex items-center gap-2.5">
                            <span className="text-[#C2410C] font-semibold">
                              +{srv.price.toLocaleString('ru-RU')} ₸
                            </span>
                            <button
                              type="button"
                              onClick={() =>
                                setGrpServices((prev) => prev.filter((_, i) => i !== idx))
                              }
                              className="h-6 w-6 rounded-md flex items-center justify-center text-[#8A8177] hover:bg-black/5 cursor-pointer"
                            >
                              <X className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {showGrpServicePicker && (
                    <div className="bg-white border border-[#E5E2DD] rounded-[14px] p-2.5 space-y-1.5 shadow-xs">
                      <div className="flex items-center justify-between px-1 pb-1 border-b border-[#E5E2DD]/60">
                        <span className="text-[11px] font-sans font-medium text-[#6E675F]">
                          Выберите услугу для группы
                        </span>
                        <button
                          type="button"
                          onClick={() => setShowGrpServicePicker(false)}
                          className="text-[#8A8177] hover:text-[#241E1A] cursor-pointer"
                        >
                          <X className="h-3.5 w-3.5" />
                        </button>
                      </div>
                      {availableGroupServices.map((srv) => (
                        <button
                          key={srv.id}
                          type="button"
                          onClick={() => {
                            setGrpServices((prev) => [...prev, srv]);
                            setShowGrpServicePicker(false);
                          }}
                          className="w-full px-2.5 py-2 rounded-lg hover:bg-[#FAF7F3] flex items-center justify-between text-xs font-sans text-left cursor-pointer transition-colors"
                        >
                          <span className="text-[#241E1A]">{srv.name}</span>
                          <span className="text-[#C2410C] font-medium">
                            +{srv.price.toLocaleString('ru-RU')} ₸
                          </span>
                        </button>
                      ))}
                    </div>
                  )}

                  <button
                    type="button"
                    onClick={() => setShowGrpServicePicker(!showGrpServicePicker)}
                    className="w-full rounded-[14px] border border-[#DFC3B4] bg-[#FAF7F3] hover:bg-[#F5EFE6] py-3.5 px-4 flex items-center justify-center gap-2 text-xs font-sans font-medium text-[#C2410C] cursor-pointer transition-colors"
                  >
                    <Plus className="h-4 w-4 text-[#C2410C]" />
                    <span>Заказать услугу</span>
                  </button>
                </div>
              </>
            )}

            {grpStep === 5 && (
              /* ---------------- ШАГ 5 ИЗ 5: ОПЛАТА ---------------- */
              <div className="space-y-3.5 pb-2">
                <h3 className="text-xs font-sans font-medium text-[#241E1A]">Оплата</h3>

                {/* Breakdown Summary Card */}
                <div className="bg-[#EFECE6] rounded-[16px] p-4 space-y-2">
                  <div className="flex items-center justify-between text-xs font-sans">
                    <span className="text-[#241E1A]">
                      {roomsCount} {roomsWord} × {nightsLabel}
                    </span>
                    <span className="font-medium text-[#241E1A]">
                      {grossRoomsSum.toLocaleString('ru-RU')} ₸
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-xs font-sans">
                    <span className="text-[#241E1A]">Скидка агента · {discountPct}%</span>
                    <span className="font-medium text-[#241E1A]">
                      −{discountAmount.toLocaleString('ru-RU')} ₸
                    </span>
                  </div>

                  {grpServicesSum > 0 && (
                    <div className="flex items-center justify-between text-xs font-sans">
                      <span className="text-[#241E1A]">Дополнительные услуги</span>
                      <span className="font-medium text-[#241E1A]">
                        +{grpServicesSum.toLocaleString('ru-RU')} ₸
                      </span>
                    </div>
                  )}

                  <div className="border-t border-[#DCD6CC] pt-2.5 mt-1 flex items-center justify-between">
                    <span className="text-sm font-sans text-[#241E1A]">Итого</span>
                    <span className="text-lg font-sans font-semibold text-[#C2410C]">
                      {formattedGrpTotal}
                    </span>
                  </div>
                </div>

                {/* Payment Form Card */}
                <div className="bg-white rounded-[18px] border border-[#E5E2DD] p-4 space-y-3.5 shadow-2xs">
                  {/* Сумма */}
                  <div>
                    <label className="block text-xs font-sans text-[#6E675F] mb-1.5">
                      Сумма
                    </label>
                    <div className="bg-white border border-[#E5E2DD] rounded-[14px] px-3.5 py-3 flex items-center justify-between">
                      <input
                        type="number"
                        min={0}
                        value={grpCustomSum !== null ? grpCustomSum : String(grpCalculatedTotal)}
                        onChange={(e) => {
                          setGrpCustomSum(e.target.value);
                          setGrpIsPaid(false);
                        }}
                        className="w-full bg-transparent text-xs font-sans text-[#241E1A] focus:outline-none"
                      />
                      <span className="text-xs font-sans text-[#8A8177] shrink-0 ml-2">₸</span>
                    </div>
                  </div>

                  {/* Предоплата */}
                  <div>
                    <label className="block text-xs font-sans text-[#6E675F] mb-1.5">
                      Предоплата
                    </label>
                    <div className="bg-white border border-[#E5E2DD] rounded-[14px] px-3.5 py-3 flex items-center justify-between">
                      <input
                        type="number"
                        min={0}
                        value={grpPrepayment}
                        onChange={(e) => {
                          setGrpPrepayment(e.target.value);
                          setGrpIsPaid(false);
                        }}
                        className="w-full bg-transparent text-xs font-sans text-[#241E1A] focus:outline-none"
                      />
                      <span className="text-xs font-sans text-[#8A8177] shrink-0 ml-2">₸</span>
                    </div>
                  </div>

                  <div className="border-t border-[#E5E2DD]/80" />

                  {/* К доплате */}
                  <div className="flex items-center justify-between py-0.5">
                    <span className="text-xs font-sans text-[#8A8177]">К доплате</span>
                    <span className="text-[20px] font-sans font-semibold text-[#C2410C]">
                      {formattedGrpRemaining}
                    </span>
                  </div>

                  <div className="border-t border-[#E5E2DD]/80" />

                  {/* Счёт зачисления */}
                  <div>
                    <label className="block text-xs font-sans text-[#6E675F] mb-1.5">
                      Счёт зачисления
                    </label>
                    <div className="relative">
                      <select
                        value={grpPaymentAccount}
                        onChange={(e) => setGrpPaymentAccount(e.target.value)}
                        className="w-full appearance-none bg-white border border-[#E5E2DD] rounded-[14px] px-3.5 py-3 pr-9 text-xs font-sans text-[#241E1A] focus:outline-none cursor-pointer"
                      >
                        <option value="Касса ресепшн">Касса ресепшн</option>
                        <option value="Расчётный счёт (Безнал)">Расчётный счёт (Безнал)</option>
                        <option value="Kaspi QR / Kaspi Pay">Kaspi QR / Kaspi Pay</option>
                        <option value="POS-терминал (Карта)">POS-терминал (Карта)</option>
                      </select>
                      <ChevronDown className="h-4 w-4 text-[#241E1A] absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    </div>
                  </div>

                  {/* Статус */}
                  <div className="flex items-center justify-between pt-0.5">
                    <span className="text-xs font-sans text-[#8A8177]">Статус</span>
                    {grpIsPaid || grpRemainingToPay === 0 ? (
                      <div className="flex items-center gap-1.5 text-xs font-sans font-medium text-[#15803D]">
                        <span className="h-2 w-2 rounded-full bg-[#15803D]" />
                        <span>Оплачено</span>
                      </div>
                    ) : grpPrepaymentNum > 0 ? (
                      <div className="flex items-center gap-1.5 text-xs font-sans font-medium text-[#B45309]">
                        <span className="h-2 w-2 rounded-full bg-[#D97706]" />
                        <span>Частично оплачено</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-1.5 text-xs font-sans font-medium text-[#9A6B11]">
                        <span className="h-2 w-2 rounded-full bg-[#C58B16]" />
                        <span>Не оплачено</span>
                      </div>
                    )}
                  </div>

                  {/* Кнопка Оплатить */}
                  <button
                    type="button"
                    onClick={() => {
                      setGrpIsPaid(true);
                      setGrpPrepayment(String(grpEffectiveTotal));
                    }}
                    className="w-full py-3.5 rounded-[14px] bg-[#C2410C] hover:bg-[#A93A0C] text-white text-xs font-sans font-medium cursor-pointer transition-colors shadow-xs"
                  >
                    {grpIsPaid || grpRemainingToPay === 0 ? 'Оплачено ✓' : 'Оплатить'}
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* ==================== BOTTOM STICKY SUMMARY & NAVIGATION ==================== */}
          <div className="px-5 pt-3 pb-4 border-t border-[#E5E2DD] bg-[#FAF7F3] shrink-0">
            <div className="grid grid-cols-3 gap-2 mb-3">
              <div>
                <span className="block text-[10px] font-sans text-[#8A8177]">Итого</span>
                <span className="text-base font-sans font-semibold text-[#241E1A]">
                  {formattedGrpTotal}
                </span>
              </div>

              <div>
                <span className="block text-[10px] font-sans text-[#8A8177]">Предоплата</span>
                <span className="text-base font-sans font-semibold text-[#241E1A]">
                  {formattedGrpPrepayment}
                </span>
              </div>

              <div>
                <span className="block text-[10px] font-sans text-[#8A8177]">
                  К оплате при заезде
                </span>
                <span className="text-base font-sans font-semibold text-[#C2410C]">
                  {formattedGrpRemaining}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2.5">
              <button
                type="button"
                onClick={() => {
                  if (showGrpRoomingModal) {
                    setShowGrpRoomingModal(false);
                  } else if (grpStep === 5) {
                    setCreateBookingType('NONE');
                    setGrpStep(1);
                  } else if (grpStep > 1) {
                    setGrpStep(grpStep - 1);
                  } else {
                    setCreateBookingType('NONE');
                  }
                }}
                className="w-[34%] py-3.5 rounded-[14px] bg-white hover:bg-slate-50 border border-[#E5E2DD] text-[#241E1A] text-xs font-sans font-medium cursor-pointer transition-colors text-center shadow-2xs"
              >
                {showGrpRoomingModal ? 'Назад' : grpStep === 5 ? 'Отмена' : 'Назад'}
              </button>

              <button
                type="button"
                onClick={() => {
                  if (showGrpRoomingModal) {
                    setShowGrpRoomingModal(false);
                  } else if (grpStep < 5) {
                    setGrpStep(grpStep + 1);
                  } else {
                    handleFinishGroupBooking();
                  }
                }}
                className={`flex-1 py-3.5 rounded-[14px] text-white text-xs font-sans font-medium flex items-center justify-center gap-1.5 cursor-pointer transition-colors shadow-xs ${
                  !showGrpRoomingModal && grpStep === 2 && hasCapacityMismatch
                    ? 'bg-[#DF9A84] hover:bg-[#D48870]'
                    : 'bg-[#C2410C] hover:bg-[#A93A0C]'
                }`}
              >
                <span>
                  {showGrpRoomingModal
                    ? 'Сохранить список'
                    : grpStep < 5
                    ? 'Далее'
                    : 'Создать бронь'}
                </span>
                {!showGrpRoomingModal && grpStep < 5 && (
                  <ChevronRight className="h-4 w-4 text-white" />
                )}
              </button>
            </div>
          </div>
        </div>
      );
    }

    if (createBookingType === 'QUICK') {
      const parseDateDay = (dateStr: string, fallback: number) => {
        const parts = dateStr.split('.');
        const d = parseInt(parts[0], 10);
        return isNaN(d) ? fallback : d;
      };
      const sDayNum = parseDateDay(qckCheckinDate, 6);
      const eDayNum = parseDateDay(qckCheckoutDate, 7);
      const nightsCount = Math.max(1, eDayNum - sDayNum);
      const nightsLabel =
        nightsCount === 1 ? '1 ночь' : nightsCount < 5 ? `${nightsCount} ночи` : `${nightsCount} ночей`;

      const adultsNum = Math.max(1, parseInt(qckAdults, 10) || 1);
      const childrenNum = Math.max(0, parseInt(qckChildren, 10) || 0);
      const totalGuestsCount = adultsNum + childrenNum;

      const adultsWord =
        adultsNum === 1 ? 'взрослый' : 'взрослых';
      const childrenPart =
        childrenNum > 0
          ? ` + ${childrenNum} ${childrenNum === 1 ? 'ребёнок' : childrenNum < 5 ? 'ребёнка' : 'детей'}`
          : '';

      const mapCodeToRuCat = (code: 'Lux' | 'Comfort' | 'Standard'): BookingCategory =>
        code === 'Lux' ? 'Люкс' : code === 'Comfort' ? 'Комфорт' : 'Стандарт';

      // Room 303 is occupied in mock hotel state (as shown in screenshots 1 & 2)
      const isRoomOccupied = qckRoomNumber === '303';

      const basePricePerNight =
        qckCategoryCode === 'Lux' ? 50000 : qckCategoryCode === 'Comfort' ? 35000 : 25000;
      const qckCalculatedTotal = nightsCount * basePricePerNight;

      const qckEffectiveTotal =
        qckCustomSum !== null && !isNaN(parseInt(qckCustomSum, 10))
          ? Math.max(0, parseInt(qckCustomSum, 10))
          : qckCalculatedTotal;
      const qckPrepaymentNum = Math.max(0, parseInt(qckPrepayment, 10) || 0);
      const qckRemainingToPay = qckIsPaid ? 0 : Math.max(0, qckEffectiveTotal - qckPrepaymentNum);

      const formattedQckTotal = `${qckEffectiveTotal.toLocaleString('ru-RU')} ₸`;
      const formattedQckPrepayment = `${(qckIsPaid ? qckEffectiveTotal : qckPrepaymentNum).toLocaleString('ru-RU')} ₸`;
      const formattedQckRemaining = `${qckRemainingToPay.toLocaleString('ru-RU')} ₸`;

      const qckStepTitles: Record<number, string> = {
        1: 'Размещение',
        2: 'Гость',
        3: 'Оплата',
      };

      const handleFinishQuickBooking = () => {
        const fullName =
          `${qckFirstName.trim()} ${qckLastName.trim()}`.trim() || 'Гость (Walk-in)';
        const created: ReceptionBooking = {
          id: `bk-qck-${Date.now()}`,
          bookingNumber: `BR-${Math.floor(4112 + Math.random() * 880)}`,
          guestName: fullName,
          shortName: qckFirstName.trim() || fullName.split(' ')[0],
          phone: qckPhone.trim() || '+7 (701) 000-00-00',
          email: 'walkin@guest.kz',
          roomNumber: qckRoomNumber,
          category: mapCodeToRuCat(qckCategoryCode),
          guestsCount: totalGuestsCount,
          startDay: sDayNum,
          endDay: eDayNum,
          dateRangeText: `${sDayNum} нояб. → ${eDayNum} нояб.`,
          nights: nightsCount,
          status: 'CHECKED_IN',
          source: qckSource,
          totalAmount: formattedQckTotal,
          isPaid: qckIsPaid || qckRemainingToPay === 0,
          tariff: qckTariff,
          notes: `Быстрая бронь (Заезд с ресепшн · Walk-in).`,
          bookingType: 'QUICK',
        };
        setBookings((prev) => [created, ...prev]);
        setCreateBookingType('NONE');
        setQckStep(1);
        if (onNavigateTab) onNavigateTab('RECEPTION_BOOKINGS');
      };

      return (
        <div className="flex-1 flex flex-col bg-[#FAF7F3] overflow-hidden select-none animate-in slide-in-from-right duration-200">
          {/* ==================== TOP HEADER + 3-STEP PROGRESS BAR ==================== */}
          <div className="px-5 pt-4 pb-3 border-b border-[#E5E2DD] bg-[#FAF7F3] shrink-0">
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-2.5 -ml-1">
                <button
                  type="button"
                  onClick={() => {
                    if (qckStep > 1) setQckStep(qckStep - 1);
                    else setCreateBookingType('NONE');
                  }}
                  className="mt-1 h-7 w-7 rounded-lg flex items-center justify-center text-[#241E1A] hover:bg-black/5 cursor-pointer"
                >
                  <ChevronLeft className="h-5 w-5" />
                </button>
                <div>
                  <h1 className="text-[22px] font-serif font-normal text-[#241E1A] leading-tight">
                    Быстрая бронь
                  </h1>
                  <p className="text-xs font-sans text-[#8A8177] mt-0.5">
                    Заезд с ресепшн
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => {
                  setCreateBookingType('NONE');
                  setQckStep(1);
                }}
                className="mt-1 h-7 w-7 rounded-lg flex items-center justify-center text-[#241E1A] hover:bg-black/5 cursor-pointer"
              >
                <X className="h-5 w-5 stroke-[1.75]" />
              </button>
            </div>

            {/* Step Title & Counter */}
            <div className="flex items-center justify-between text-xs font-sans mt-4 mb-2">
              <span className="font-medium text-[#241E1A]">{qckStepTitles[qckStep]}</span>
              <span className="text-[#8A8177]">Шаг {qckStep} из 3</span>
            </div>

            {/* 3 Progress Bars */}
            <div className="grid grid-cols-3 gap-1.5">
              {[1, 2, 3].map((stNum) => (
                <div
                  key={stNum}
                  onClick={() => setQckStep(stNum)}
                  className={`h-[3px] rounded-full cursor-pointer transition-colors ${
                    stNum <= qckStep ? 'bg-[#C2410C]' : 'bg-[#E2DDD5]'
                  }`}
                />
              ))}
            </div>
          </div>

          {/* ==================== SCROLLABLE STEP BODY ==================== */}
          <div className="flex-1 overflow-y-auto no-scrollbar px-5 py-4 space-y-5">
            {qckStep === 1 && (
              /* ---------------- ШАГ 1 ИЗ 3: РАЗМЕЩЕНИЕ ---------------- */
              <>
                {/* Summary Banner Card: Быстрая бронь */}
                <div className="bg-[#EFECE6] rounded-[16px] p-4 flex items-center justify-between">
                  <div>
                    <h2 className="text-[20px] font-serif font-normal text-[#241E1A] leading-tight">
                      Быстрая бронь
                    </h2>
                    <p className="text-xs font-sans text-[#8A8177] mt-1">
                      Walk-in · {adultsNum} {adultsWord}
                      {childrenPart} / 1 номер
                    </p>
                  </div>

                  <span className="px-3 py-1 rounded-full bg-[#241E1A] text-white text-[11px] font-sans font-medium shrink-0">
                    {nightsLabel}
                  </span>
                </div>

                {/* Section: Даты проживания */}
                <div className="space-y-2.5">
                  <h3 className="text-xs font-sans font-medium text-[#241E1A]">
                    Даты проживания
                  </h3>

                  <div className="bg-white rounded-[18px] border border-[#E5E2DD] p-3.5 space-y-3 shadow-2xs">
                    {/* Заезд */}
                    <div className="flex items-center gap-2.5">
                      <span className="w-12 text-xs font-sans font-medium text-[#241E1A] shrink-0">
                        Заезд
                      </span>

                      <div className="flex-1 bg-white border border-[#E5E2DD] rounded-[12px] px-3 py-2.5 flex items-center justify-between">
                        <input
                          type="text"
                          value={qckCheckinDate}
                          onChange={(e) => setQckCheckinDate(e.target.value)}
                          className="w-full bg-transparent text-xs font-sans text-[#241E1A] focus:outline-none"
                        />
                        <Calendar className="h-3.5 w-3.5 text-[#241E1A] shrink-0 ml-1" />
                      </div>

                      <div className="w-[92px] bg-white border border-[#E5E2DD] rounded-[12px] px-3 py-2.5 flex items-center justify-between shrink-0">
                        <input
                          type="text"
                          value={qckCheckinTime}
                          onChange={(e) => setQckCheckinTime(e.target.value)}
                          className="w-full bg-transparent text-xs font-sans text-[#241E1A] focus:outline-none"
                        />
                        <Clock className="h-3.5 w-3.5 text-[#241E1A] shrink-0 ml-1" />
                      </div>
                    </div>

                    <div className="border-t border-[#E5E2DD]/70" />

                    {/* Выезд */}
                    <div className="flex items-center gap-2.5">
                      <span className="w-12 text-xs font-sans font-medium text-[#241E1A] shrink-0">
                        Выезд
                      </span>

                      <div className="flex-1 bg-white border border-[#E5E2DD] rounded-[12px] px-3 py-2.5 flex items-center justify-between">
                        <input
                          type="text"
                          value={qckCheckoutDate}
                          onChange={(e) => setQckCheckoutDate(e.target.value)}
                          className="w-full bg-transparent text-xs font-sans text-[#241E1A] focus:outline-none"
                        />
                        <Calendar className="h-3.5 w-3.5 text-[#241E1A] shrink-0 ml-1" />
                      </div>

                      <div className="w-[92px] bg-white border border-[#E5E2DD] rounded-[12px] px-3 py-2.5 flex items-center justify-between shrink-0">
                        <input
                          type="text"
                          value={qckCheckoutTime}
                          onChange={(e) => setQckCheckoutTime(e.target.value)}
                          className="w-full bg-transparent text-xs font-sans text-[#241E1A] focus:outline-none"
                        />
                        <Clock className="h-3.5 w-3.5 text-[#241E1A] shrink-0 ml-1" />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Section: Номера */}
                <div className="space-y-3.5 pb-2">
                  <h3 className="text-xs font-sans font-medium text-[#241E1A]">Номера</h3>

                  {/* Категория номера */}
                  <div>
                    <label className="block text-xs font-sans text-[#6E675F] mb-1.5">
                      Категория номера
                    </label>
                    <div className="relative">
                      <select
                        value={qckCategoryCode}
                        onChange={(e) => {
                          const nextCode = e.target.value as 'Lux' | 'Comfort' | 'Standard';
                          setQckCategoryCode(nextCode);
                          const nextRu = mapCodeToRuCat(nextCode);
                          const firstMatching = RECEPTION_ROOMS.find(
                            (r) => r.category === nextRu
                          );
                          if (firstMatching) setQckRoomNumber(firstMatching.roomNumber);
                        }}
                        className="w-full appearance-none bg-white border border-[#E5E2DD] rounded-[14px] px-3.5 py-3 pr-9 text-xs font-sans text-[#241E1A] focus:outline-none cursor-pointer"
                      >
                        <option value="Lux">Lux</option>
                        <option value="Comfort">Comfort</option>
                        <option value="Standard">Standard</option>
                      </select>
                      <ChevronDown className="h-4 w-4 text-[#241E1A] absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    </div>
                  </div>

                  {/* № комнаты */}
                  <div>
                    <label className="block text-xs font-sans text-[#6E675F] mb-1.5">
                      № комнаты
                    </label>
                    <div className="relative">
                      <select
                        value={qckRoomNumber}
                        onChange={(e) => setQckRoomNumber(e.target.value)}
                        className={`w-full appearance-none bg-white rounded-[14px] px-3.5 py-3 pr-9 text-xs font-sans text-[#241E1A] focus:outline-none cursor-pointer border ${
                          isRoomOccupied ? 'border-[#C96B4B]' : 'border-[#E5E2DD]'
                        }`}
                      >
                        {RECEPTION_ROOMS.filter(
                          (r) => r.category === mapCodeToRuCat(qckCategoryCode)
                        ).map((r) => (
                          <option key={r.roomNumber} value={r.roomNumber}>
                            № {r.roomNumber} · {qckCategoryCode} · {r.capacity}{' '}
                            {r.capacity < 5 ? 'гостя' : 'гостей'}
                          </option>
                        ))}
                      </select>
                      <ChevronDown className="h-4 w-4 text-[#241E1A] absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    </div>
                  </div>

                  {/* Occupied Room Warning Card */}
                  {isRoomOccupied && (
                    <div className="bg-[#FBECE6] border border-[#E8C5B8] rounded-[14px] p-3.5 flex items-start gap-2.5">
                      <span className="mt-0.5 h-4 w-4 rounded-full border border-[#B84A27] text-[#B84A27] flex items-center justify-center text-[10px] font-sans font-bold shrink-0">
                        i
                      </span>
                      <div>
                        <p className="text-xs font-sans font-semibold text-[#B84A27]">
                          Номер не готов к заселению: Занят.
                        </p>
                        <p className="text-xs font-sans text-[#8A756A] mt-0.5">
                          Выберите свободный номер для заезда.
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Взрослые | Дети */}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-sans text-[#6E675F] mb-1.5">
                        Взрослые
                      </label>
                      <input
                        type="number"
                        min={1}
                        max={6}
                        value={qckAdults}
                        onChange={(e) => setQckAdults(e.target.value)}
                        className="w-full bg-white border border-[#E5E2DD] rounded-[14px] px-3.5 py-3 text-xs font-sans text-[#241E1A] focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-sans text-[#6E675F] mb-1.5">
                        Дети
                      </label>
                      <input
                        type="number"
                        min={0}
                        max={6}
                        value={qckChildren}
                        onChange={(e) => setQckChildren(e.target.value)}
                        className="w-full bg-white border border-[#E5E2DD] rounded-[14px] px-3.5 py-3 text-xs font-sans text-[#241E1A] focus:outline-none"
                      />
                    </div>
                  </div>

                  {/* Тариф */}
                  <div>
                    <label className="block text-xs font-sans text-[#6E675F] mb-1.5">
                      Тариф
                    </label>
                    <div className="relative">
                      <select
                        value={qckTariff}
                        onChange={(e) => setQckTariff(e.target.value)}
                        className="w-full appearance-none bg-white border border-[#E5E2DD] rounded-[14px] px-3.5 py-3 pr-9 text-xs font-sans text-[#241E1A] focus:outline-none cursor-pointer"
                      >
                        <option value="Тариф номера">Тариф номера</option>
                        <option value="Тариф с завтраком">Тариф с завтраком</option>
                        <option value="Полупансион">Полупансион</option>
                        <option value="Полный пансион">Полный пансион</option>
                      </select>
                      <ChevronDown className="h-4 w-4 text-[#241E1A] absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    </div>
                  </div>
                </div>
              </>
            )}

            {qckStep === 2 && (
              /* ---------------- ШАГ 2 ИЗ 3: ГОСТЬ ---------------- */
              <>
                <div className="space-y-3.5">
                  <h3 className="text-xs font-sans font-medium text-[#241E1A]">Контакты</h3>

                  {/* Фамилия */}
                  <div>
                    <label className="block text-xs font-sans text-[#6E675F] mb-1.5">
                      Фамилия
                    </label>
                    <input
                      type="text"
                      value={qckLastName}
                      onChange={(e) => setQckLastName(e.target.value)}
                      placeholder="Фамилия гостя"
                      className="w-full bg-white border border-[#E5E2DD] rounded-[14px] px-3.5 py-3 text-xs font-sans text-[#241E1A] placeholder:text-[#8A8177] focus:outline-none"
                    />
                  </div>

                  {/* Имя | Отчество */}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-sans text-[#6E675F] mb-1.5">
                        Имя
                      </label>
                      <input
                        type="text"
                        value={qckFirstName}
                        onChange={(e) => setQckFirstName(e.target.value)}
                        placeholder="Имя"
                        className="w-full bg-white border border-[#E5E2DD] rounded-[14px] px-3.5 py-3 text-xs font-sans text-[#241E1A] placeholder:text-[#8A8177] focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-sans text-[#6E675F] mb-1.5">
                        Отчество
                      </label>
                      <input
                        type="text"
                        value={qckMiddleName}
                        onChange={(e) => setQckMiddleName(e.target.value)}
                        placeholder="Отчество"
                        className="w-full bg-white border border-[#E5E2DD] rounded-[14px] px-3.5 py-3 text-xs font-sans text-[#241E1A] placeholder:text-[#8A8177] focus:outline-none"
                      />
                    </div>
                  </div>

                  {/* Телефон */}
                  <div>
                    <label className="block text-xs font-sans text-[#6E675F] mb-1.5">
                      Телефон
                    </label>
                    <input
                      type="text"
                      value={qckPhone}
                      onChange={(e) => setQckPhone(e.target.value)}
                      placeholder="+7 (XXX) XXX XX XX"
                      className="w-full bg-white border border-[#E5E2DD] rounded-[14px] px-3.5 py-3 text-xs font-sans text-[#241E1A] placeholder:text-[#8A8177] focus:outline-none"
                    />
                  </div>

                  {/* Источник */}
                  <div>
                    <label className="block text-xs font-sans text-[#6E675F] mb-1.5">
                      Источник
                    </label>
                    <div className="relative">
                      <select
                        value={qckSource}
                        onChange={(e) => setQckSource(e.target.value as BookingSource)}
                        className="w-full appearance-none bg-white border border-[#E5E2DD] rounded-[14px] px-3.5 py-3 pr-9 text-xs font-sans text-[#241E1A] focus:outline-none cursor-pointer"
                      >
                        <option value="Прямая бронь">Прямая бронь</option>
                        <option value="От стойки">От стойки</option>
                        <option value="Booking.com">Booking.com</option>
                        <option value="Корпоративный">Корпоративный</option>
                      </select>
                      <ChevronDown className="h-4 w-4 text-[#241E1A] absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    </div>
                  </div>
                </div>

                {/* Документы и личные данные */}
                <div className="space-y-3.5 pt-2 pb-2">
                  <h3 className="text-xs font-sans font-medium text-[#241E1A]">
                    Документы и личные данные
                  </h3>

                  {/* Тип документа */}
                  <div>
                    <label className="block text-xs font-sans text-[#6E675F] mb-1.5">
                      Тип документа
                    </label>
                    <div className="relative">
                      <select
                        value={qckDocType}
                        onChange={(e) => setQckDocType(e.target.value)}
                        className="w-full appearance-none bg-white border border-[#E5E2DD] rounded-[14px] px-3.5 py-3 pr-9 text-xs font-sans text-[#241E1A] focus:outline-none cursor-pointer"
                      >
                        <option value="">Выбрать...</option>
                        <option value="Удостоверение личности">Удостоверение личности</option>
                        <option value="Паспорт">Паспорт</option>
                        <option value="Заграничный паспорт">Заграничный паспорт</option>
                        <option value="Вид на жительство">Вид на жительство</option>
                      </select>
                      <ChevronDown className="h-4 w-4 text-[#241E1A] absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    </div>
                  </div>

                  {/* Номер документа */}
                  <div>
                    <label className="block text-xs font-sans text-[#6E675F] mb-1.5">
                      Номер документа
                    </label>
                    <input
                      type="text"
                      value={qckDocNumber}
                      onChange={(e) => setQckDocNumber(e.target.value)}
                      placeholder="Номер документа"
                      className="w-full bg-white border border-[#E5E2DD] rounded-[14px] px-3.5 py-3 text-xs font-sans text-[#241E1A] placeholder:text-[#8A8177] focus:outline-none"
                    />
                  </div>

                  {/* Дата рождения */}
                  <div>
                    <label className="block text-xs font-sans text-[#6E675F] mb-1.5">
                      Дата рождения
                    </label>
                    <div className="bg-white border border-[#E5E2DD] rounded-[14px] px-3.5 py-3 flex items-center justify-between">
                      <input
                        type="text"
                        value={qckBirthDate}
                        onChange={(e) => setQckBirthDate(e.target.value)}
                        placeholder="дд.мм.гггг"
                        className="w-full bg-transparent text-xs font-sans text-[#241E1A] placeholder:text-[#241E1A] focus:outline-none"
                      />
                      <Calendar className="h-4 w-4 text-[#241E1A] shrink-0 ml-2" />
                    </div>
                  </div>

                  {/* Пол */}
                  <div>
                    <label className="block text-xs font-sans text-[#6E675F] mb-1.5">
                      Пол
                    </label>
                    <div className="relative">
                      <select
                        value={qckGender}
                        onChange={(e) => setQckGender(e.target.value)}
                        className="w-full appearance-none bg-white border border-[#E5E2DD] rounded-[14px] px-3.5 py-3 pr-9 text-xs font-sans text-[#241E1A] focus:outline-none cursor-pointer"
                      >
                        <option value="">Выбрать...</option>
                        <option value="Мужской">Мужской</option>
                        <option value="Женский">Женский</option>
                      </select>
                      <ChevronDown className="h-4 w-4 text-[#241E1A] absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    </div>
                  </div>
                </div>
              </>
            )}

            {qckStep === 3 && (
              /* ---------------- ШАГ 3 ИЗ 3: ОПЛАТА ---------------- */
              <div className="space-y-3 pb-2">
                <h3 className="text-xs font-sans font-medium text-[#241E1A]">Оплата</h3>

                <div className="bg-white rounded-[18px] border border-[#E5E2DD] p-4 space-y-3.5 shadow-2xs">
                  {/* Сумма */}
                  <div>
                    <label className="block text-xs font-sans text-[#6E675F] mb-1.5">
                      Сумма
                    </label>
                    <div className="bg-white border border-[#E5E2DD] rounded-[14px] px-3.5 py-3 flex items-center justify-between">
                      <input
                        type="number"
                        min={0}
                        value={qckCustomSum !== null ? qckCustomSum : String(qckCalculatedTotal)}
                        onChange={(e) => {
                          setQckCustomSum(e.target.value);
                          setQckIsPaid(false);
                        }}
                        className="w-full bg-transparent text-xs font-sans text-[#241E1A] focus:outline-none"
                      />
                      <span className="text-xs font-sans text-[#8A8177] shrink-0 ml-2">₸</span>
                    </div>
                  </div>

                  {/* Предоплата */}
                  <div>
                    <label className="block text-xs font-sans text-[#6E675F] mb-1.5">
                      Предоплата
                    </label>
                    <div className="bg-white border border-[#E5E2DD] rounded-[14px] px-3.5 py-3 flex items-center justify-between">
                      <input
                        type="number"
                        min={0}
                        value={qckPrepayment}
                        onChange={(e) => {
                          setQckPrepayment(e.target.value);
                          setQckIsPaid(false);
                        }}
                        className="w-full bg-transparent text-xs font-sans text-[#241E1A] focus:outline-none"
                      />
                      <span className="text-xs font-sans text-[#8A8177] shrink-0 ml-2">₸</span>
                    </div>
                  </div>

                  <div className="border-t border-[#E5E2DD]/80" />

                  {/* К доплате */}
                  <div className="flex items-center justify-between py-0.5">
                    <span className="text-xs font-sans text-[#8A8177]">К доплате</span>
                    <span className="text-[20px] font-sans font-semibold text-[#C2410C]">
                      {formattedQckRemaining}
                    </span>
                  </div>

                  <div className="border-t border-[#E5E2DD]/80" />

                  {/* Счёт зачисления */}
                  <div>
                    <label className="block text-xs font-sans text-[#6E675F] mb-1.5">
                      Счёт зачисления
                    </label>
                    <div className="relative">
                      <select
                        value={qckPaymentAccount}
                        onChange={(e) => setQckPaymentAccount(e.target.value)}
                        className="w-full appearance-none bg-white border border-[#E5E2DD] rounded-[14px] px-3.5 py-3 pr-9 text-xs font-sans text-[#241E1A] focus:outline-none cursor-pointer"
                      >
                        <option value="Касса ресепшн">Касса ресепшн</option>
                        <option value="Kaspi QR / Kaspi Pay">Kaspi QR / Kaspi Pay</option>
                        <option value="POS-терминал (Карта)">POS-терминал (Карта)</option>
                        <option value="Расчётный счёт (Безнал)">Расчётный счёт (Безнал)</option>
                      </select>
                      <ChevronDown className="h-4 w-4 text-[#241E1A] absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    </div>
                  </div>

                  {/* Статус */}
                  <div className="flex items-center justify-between pt-0.5">
                    <span className="text-xs font-sans text-[#8A8177]">Статус</span>
                    {qckIsPaid || qckRemainingToPay === 0 ? (
                      <div className="flex items-center gap-1.5 text-xs font-sans font-medium text-[#15803D]">
                        <span className="h-2 w-2 rounded-full bg-[#15803D]" />
                        <span>Оплачено</span>
                      </div>
                    ) : qckPrepaymentNum > 0 ? (
                      <div className="flex items-center gap-1.5 text-xs font-sans font-medium text-[#B45309]">
                        <span className="h-2 w-2 rounded-full bg-[#D97706]" />
                        <span>Частично оплачено</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-1.5 text-xs font-sans font-medium text-[#9A6B11]">
                        <span className="h-2 w-2 rounded-full bg-[#C58B16]" />
                        <span>Не оплачено</span>
                      </div>
                    )}
                  </div>

                  {/* Кнопка Оплатить */}
                  <button
                    type="button"
                    onClick={() => {
                      setQckIsPaid(true);
                      setQckPrepayment(String(qckEffectiveTotal));
                    }}
                    className="w-full py-3.5 rounded-[14px] bg-[#C2410C] hover:bg-[#A93A0C] text-white text-xs font-sans font-medium cursor-pointer transition-colors shadow-xs"
                  >
                    {qckIsPaid || qckRemainingToPay === 0 ? 'Оплачено ✓' : 'Оплатить'}
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* ==================== BOTTOM STICKY SUMMARY & NAVIGATION ==================== */}
          <div className="px-5 pt-3 pb-4 border-t border-[#E5E2DD] bg-[#FAF7F3] shrink-0">
            <div className="grid grid-cols-3 gap-2 mb-2.5">
              <div>
                <span className="block text-[10px] font-sans text-[#8A8177]">Итого</span>
                <span className="text-base font-sans font-semibold text-[#241E1A]">
                  {formattedQckTotal}
                </span>
              </div>

              <div>
                <span className="block text-[10px] font-sans text-[#8A8177]">Предоплата</span>
                <span className="text-base font-sans font-semibold text-[#241E1A]">
                  {formattedQckPrepayment}
                </span>
              </div>

              <div>
                <span className="block text-[10px] font-sans text-[#8A8177]">
                  К оплате при заезде
                </span>
                <span className="text-base font-sans font-semibold text-[#C2410C]">
                  {formattedQckRemaining}
                </span>
              </div>
            </div>

            {qckStep === 1 && isRoomOccupied && (
              <div className="flex items-center gap-1.5 text-[11px] font-sans text-[#B84A27] mb-2.5">
                <span className="h-3.5 w-3.5 rounded-full border border-[#B84A27] text-[#B84A27] flex items-center justify-center text-[9px] font-bold shrink-0">
                  i
                </span>
                <span>№{qckRoomNumber} занят — выберите свободный номер</span>
              </div>
            )}

            <div className="flex items-center gap-2.5">
              <button
                type="button"
                onClick={() => {
                  if (qckStep === 3) {
                    setCreateBookingType('NONE');
                    setQckStep(1);
                  } else if (qckStep > 1) {
                    setQckStep(qckStep - 1);
                  } else {
                    setCreateBookingType('NONE');
                  }
                }}
                className="w-[34%] py-3.5 rounded-[14px] bg-white hover:bg-slate-50 border border-[#E5E2DD] text-[#241E1A] text-xs font-sans font-medium cursor-pointer transition-colors text-center shadow-2xs"
              >
                {qckStep === 3 ? 'Отмена' : 'Назад'}
              </button>

              <button
                type="button"
                onClick={() => {
                  if (qckStep < 3) setQckStep(qckStep + 1);
                  else handleFinishQuickBooking();
                }}
                className={`flex-1 py-3.5 rounded-[14px] text-white text-xs font-sans font-medium flex items-center justify-center gap-1.5 cursor-pointer transition-colors shadow-xs ${
                  qckStep === 1 && isRoomOccupied
                    ? 'bg-[#DF9A84] hover:bg-[#D48870]'
                    : 'bg-[#C2410C] hover:bg-[#A93A0C]'
                }`}
              >
                <span>{qckStep < 3 ? 'Далее' : 'Создать бронь'}</span>
                {qckStep < 3 && <ChevronRight className="h-4 w-4 text-white" />}
              </button>
            </div>
          </div>
        </div>
      );
    }

    // Main Selection Screen matching Screenshot 5
    return (
      <div className="flex-1 flex flex-col bg-[#FAF7F3] px-5 pt-4 pb-6 select-none overflow-y-auto no-scrollbar">
        <div className="mb-5">
          <h1 className="text-[28px] font-serif font-normal text-[#241E1A] leading-tight">
            {lang === 'RU' ? 'Создать бронь' : 'Create Booking'}
          </h1>
        </div>

        {chessPrefillInfo && (
          <div className="mb-4 bg-[#FAF2E6] border border-[#E6B89C] rounded-[16px] px-4 py-3 flex items-center justify-between gap-2">
            <div>
              <div className="text-xs font-sans font-semibold text-[#C2410C]">
                Выбрано в шахматке: №{chessPrefillInfo.roomNumber} · {chessPrefillInfo.category}
              </div>
              <div className="text-[11px] font-sans text-[#241E1A] mt-0.5">
                {chessPrefillInfo.checkinDate} → {chessPrefillInfo.checkoutDate} ({chessPrefillInfo.nights}{' '}
                {chessPrefillInfo.nights === 1
                  ? 'ночь'
                  : chessPrefillInfo.nights < 5
                  ? 'ночи'
                  : 'ночей'}
                )
              </div>
            </div>
            <button
              type="button"
              onClick={() => setChessPrefillInfo(null)}
              className="text-[#8A8177] hover:text-[#241E1A] p-1 cursor-pointer"
              title="Сбросить выбор"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        )}

        <div className="space-y-3">
          {/* Card 1: Индивидуальная бронь */}
          <div
            onClick={() => {
              setIndStep(1);
              setCreateBookingType('INDIVIDUAL');
            }}
            className="bg-white rounded-[18px] border border-[#E5E2DD] p-4.5 flex items-center justify-between cursor-pointer shadow-2xs hover:border-[#241E1A]/30 transition-all active:scale-[0.99]"
          >
            <div className="flex items-center gap-3.5">
              <div className="h-12 w-12 rounded-[14px] bg-[#241E1A] text-white flex items-center justify-center shrink-0">
                <User className="h-5 w-5 stroke-[1.8]" />
              </div>
              <div>
                <h3 className="text-[15px] font-sans font-medium text-[#241E1A]">
                  {lang === 'RU' ? 'Индивидуальная бронь' : 'Individual booking'}
                </h3>
                <p className="text-xs font-sans text-[#8A8177] mt-0.5">
                  {lang === 'RU' ? 'Индивидуальный гость' : 'Individual guest'}
                </p>
              </div>
            </div>
            <ChevronRight className="h-4 w-4 text-[#8A8177] shrink-0" />
          </div>

          {/* Card 2: Групповая бронь */}
          <div
            onClick={() => {
              setGrpStep(1);
              setCreateBookingType('GROUP');
            }}
            className="bg-white rounded-[18px] border border-[#E5E2DD] p-4.5 flex items-center justify-between cursor-pointer shadow-2xs hover:border-[#241E1A]/30 transition-all active:scale-[0.99]"
          >
            <div className="flex items-center gap-3.5">
              <div className="h-12 w-12 rounded-[14px] bg-[#241E1A] text-white flex items-center justify-center shrink-0">
                <Users className="h-5 w-5 stroke-[1.8]" />
              </div>
              <div>
                <h3 className="text-[15px] font-sans font-medium text-[#241E1A]">
                  {lang === 'RU' ? 'Групповая бронь' : 'Group booking'}
                </h3>
                <p className="text-xs font-sans text-[#8A8177] mt-0.5">
                  {lang === 'RU' ? 'B2B / Турфирмы' : 'B2B / Travel agencies'}
                </p>
              </div>
            </div>
            <ChevronRight className="h-4 w-4 text-[#8A8177] shrink-0" />
          </div>

          {/* Card 3: Быстрая бронь */}
          <div
            onClick={() => {
              setQckStep(1);
              setCreateBookingType('QUICK');
            }}
            className="bg-white rounded-[18px] border border-[#E5E2DD] p-4.5 flex items-center justify-between cursor-pointer shadow-2xs hover:border-[#241E1A]/30 transition-all active:scale-[0.99]"
          >
            <div className="flex items-center gap-3.5">
              <div className="h-12 w-12 rounded-[14px] bg-[#241E1A] text-white flex items-center justify-center shrink-0">
                <Zap className="h-5 w-5 stroke-[1.8]" />
              </div>
              <div>
                <h3 className="text-[15px] font-sans font-medium text-[#241E1A]">
                  {lang === 'RU' ? 'Быстрая бронь' : 'Quick booking'}
                </h3>
                <p className="text-xs font-sans text-[#8A8177] mt-0.5">
                  {lang === 'RU' ? 'Заезд с ресепшн' : 'Walk-in from reception'}
                </p>
              </div>
            </div>
            <ChevronRight className="h-4 w-4 text-[#8A8177] shrink-0" />
          </div>
        </div>
      </div>
    );
  }

  // ==================== TAB 3: ЛИСТ ОЖИДАНИЯ ====================
  if (activeTab === 'RECEPTION_WAITLIST') {
    const filteredWaitlist = waitlist.filter((w) => {
      if (waitlistCategoryFilter !== 'ALL' && w.desiredCategory !== waitlistCategoryFilter)
        return false;
      if (waitlistGuestsFilter !== 'ALL' && w.guestsCount !== Number(waitlistGuestsFilter))
        return false;
      if (waitlistSearch.trim()) {
        const q = waitlistSearch.toLowerCase();
        if (
          !w.guestName.toLowerCase().includes(q) &&
          !w.phone.toLowerCase().includes(q) &&
          !w.waitlistNumber.toLowerCase().includes(q)
        ) {
          return false;
        }
      }
      return true;
    });

    const getWaitlistCountLabel = (count: number) => {
      if (lang !== 'RU') return `${count} requests`;
      const mod10 = count % 10;
      const mod100 = count % 100;
      if (mod10 === 1 && mod100 !== 11) return `${count} заявка`;
      if (mod10 >= 2 && mod10 <= 4 && (mod100 < 10 || mod100 >= 20)) return `${count} заявки`;
      return `${count} заявок`;
    };

    const openEditWaitlistModal = (item: WaitlistEntry) => {
      setEditingWaitlistId(item.id);
      setWlGuestName(item.guestName);
      setWlPhone(item.phone);
      setWlCategory(item.desiredCategory);
      setWlGuestsCount(String(item.guestsCount));
      setWlCheckin(formatWaitlistFullToDotDate(item.checkinFull, '06.11.2026'));
      setWlCheckout(formatWaitlistFullToDotDate(item.checkoutFull, '08.11.2026'));
      setWlFlexible(item.flexibleDates);
      setWlNotes(item.notes);
      setShowCreateWaitlistModal(true);
    };

    const openNewWaitlistModal = () => {
      setEditingWaitlistId(null);
      setWlGuestName('');
      setWlPhone('');
      setWlCategory('Стандарт');
      setWlGuestsCount('2');
      setWlCheckin('06.11.2026');
      setWlCheckout('08.11.2026');
      setWlFlexible(true);
      setWlNotes('');
      setShowCreateWaitlistModal(true);
    };

    return (
      <div className="flex-1 flex flex-col bg-[#FAF7F3] overflow-hidden select-none relative">
        {showCreateWaitlistModal ? (
          /* ---------------- ПОЛНОЭКРАННАЯ ФОРМА: НОВАЯ ЗАЯВКА (SCREENSHOT 2) ---------------- */
          <div className="flex-1 flex flex-col overflow-y-auto no-scrollbar px-5 pt-4 pb-6 animate-in slide-in-from-right duration-200">
            {/* Back Link */}
            <button
              type="button"
              onClick={() => {
                setShowCreateWaitlistModal(false);
                setEditingWaitlistId(null);
              }}
              className="flex items-center gap-1.5 text-xs font-sans text-[#8A8177] hover:text-[#241E1A] cursor-pointer w-fit -ml-1"
            >
              <ChevronLeft className="h-4 w-4 text-[#241E1A]" />
              <span>{lang === 'RU' ? 'Лист ожидания' : 'Waitlist'}</span>
            </button>

            {/* Title & Subtitle */}
            <div className="mt-2.5 mb-5">
              <h1 className="text-[26px] font-serif font-normal text-[#241E1A] leading-tight">
                {editingWaitlistId
                  ? lang === 'RU'
                    ? 'Изменить заявку'
                    : 'Edit Request'
                  : lang === 'RU'
                  ? 'Новая заявка'
                  : 'New Request'}
              </h1>
              <p className="text-xs font-sans text-[#8A8177] mt-1">
                {lang === 'RU'
                  ? 'Пожелания гостя и даты размещения'
                  : 'Guest preferences and stay dates'}
              </p>
            </div>

            <form onSubmit={handleCreateWaitlistEntry} className="flex-1 flex flex-col space-y-4">
              {/* 1. Имя и фамилия гостя * */}
              <div className="space-y-1.5">
                <label className="block text-xs font-sans text-[#6E665E]">
                  {lang === 'RU' ? 'Имя и фамилия гостя *' : 'Guest full name *'}
                </label>
                <input
                  type="text"
                  required
                  value={wlGuestName}
                  onChange={(e) => setWlGuestName(e.target.value)}
                  placeholder={lang === 'RU' ? 'Например, Николай Карпов' : 'e.g., Nikolay Karpov'}
                  className="w-full bg-white border border-[#E5E2DD] rounded-[14px] px-3.5 py-3 text-xs font-sans text-[#241E1A] placeholder:text-[#8A8177] focus:outline-none focus:border-[#C2410C]"
                />
              </div>

              {/* 2. Телефон * */}
              <div className="space-y-1.5">
                <label className="block text-xs font-sans text-[#6E665E]">
                  {lang === 'RU' ? 'Телефон *' : 'Phone *'}
                </label>
                <input
                  type="text"
                  value={wlPhone}
                  onChange={(e) => setWlPhone(e.target.value)}
                  placeholder="+7 (___) ___-__-__"
                  className="w-full bg-white border border-[#E5E2DD] rounded-[14px] px-3.5 py-3 text-xs font-sans text-[#241E1A] placeholder:text-[#8A8177] focus:outline-none focus:border-[#C2410C]"
                />
              </div>

              {/* 3. Желаемый заезд * | Выезд * */}
              <div className="grid grid-cols-2 gap-2.5">
                <div className="space-y-1.5">
                  <label className="block text-xs font-sans text-[#6E665E]">
                    {lang === 'RU' ? 'Желаемый заезд *' : 'Desired check-in *'}
                  </label>
                  <div className="relative bg-white border border-[#E5E2DD] rounded-[14px] px-3.5 py-3 flex items-center justify-between">
                    <input
                      type="text"
                      value={wlCheckin}
                      onChange={(e) => setWlCheckin(e.target.value)}
                      placeholder="06.11.2026"
                      className="w-full bg-transparent text-xs font-sans text-[#241E1A] focus:outline-none"
                    />
                    <div className="relative shrink-0 ml-1.5 flex items-center justify-center">
                      <Calendar className="h-4 w-4 text-[#241E1A] pointer-events-none" />
                      <input
                        type="date"
                        value={formatRuDateToIso(wlCheckin)}
                        onChange={(e) => {
                          if (e.target.value) {
                            setWlCheckin(formatIsoToRuDate(e.target.value));
                          }
                        }}
                        className="absolute inset-0 opacity-0 cursor-pointer w-6 h-6"
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-sans text-[#6E665E]">
                    {lang === 'RU' ? 'Выезд *' : 'Check-out *'}
                  </label>
                  <div className="relative bg-white border border-[#E5E2DD] rounded-[14px] px-3.5 py-3 flex items-center justify-between">
                    <input
                      type="text"
                      value={wlCheckout}
                      onChange={(e) => setWlCheckout(e.target.value)}
                      placeholder="08.11.2026"
                      className="w-full bg-transparent text-xs font-sans text-[#241E1A] focus:outline-none"
                    />
                    <div className="relative shrink-0 ml-1.5 flex items-center justify-center">
                      <Calendar className="h-4 w-4 text-[#241E1A] pointer-events-none" />
                      <input
                        type="date"
                        value={formatRuDateToIso(wlCheckout)}
                        onChange={(e) => {
                          if (e.target.value) {
                            setWlCheckout(formatIsoToRuDate(e.target.value));
                          }
                        }}
                        className="absolute inset-0 opacity-0 cursor-pointer w-6 h-6"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* 4. Гостей * | Категория * */}
              <div className="grid grid-cols-2 gap-2.5">
                <div className="space-y-1.5">
                  <label className="block text-xs font-sans text-[#6E665E]">
                    {lang === 'RU' ? 'Гостей *' : 'Guests *'}
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={10}
                    value={wlGuestsCount}
                    onChange={(e) => setWlGuestsCount(e.target.value)}
                    className="w-full bg-white border border-[#E5E2DD] rounded-[14px] px-3.5 py-3 text-xs font-sans text-[#241E1A] focus:outline-none focus:border-[#C2410C]"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-sans text-[#6E665E]">
                    {lang === 'RU' ? 'Категория *' : 'Category *'}
                  </label>
                  <div className="relative">
                    <select
                      value={wlCategory}
                      onChange={(e) => setWlCategory(e.target.value as BookingCategory)}
                      className="w-full appearance-none bg-white border border-[#E5E2DD] rounded-[14px] px-3.5 py-3 pr-9 text-xs font-sans text-[#241E1A] focus:outline-none cursor-pointer"
                    >
                      <option value="Стандарт">Стандарт</option>
                      <option value="Комфорт">Комфорт</option>
                      <option value="Люкс">Люкс</option>
                    </select>
                    <ChevronDown className="h-4 w-4 text-[#241E1A] absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  </div>
                </div>
              </div>

              {/* 5. Чекбокс: Гость готов изменить даты */}
              <div
                onClick={() => setWlFlexible((prev) => !prev)}
                className="flex items-center gap-2.5 py-1 cursor-pointer w-fit"
              >
                <div
                  className={`h-5 w-5 rounded-[6px] border flex items-center justify-center transition-colors ${
                    wlFlexible
                      ? 'bg-[#B93800] border-[#B93800] text-white'
                      : 'bg-white border-[#CCC5BA]'
                  }`}
                >
                  {wlFlexible && <Check className="h-3.5 w-3.5 stroke-[3]" />}
                </div>
                <span className="text-xs font-sans text-[#241E1A]">
                  {lang === 'RU' ? 'Гость готов изменить даты' : 'Guest is flexible with dates'}
                </span>
              </div>

              {/* 6. Комментарий */}
              <div className="space-y-1.5">
                <label className="block text-xs font-sans text-[#6E665E]">
                  {lang === 'RU' ? 'Комментарий' : 'Comment'}
                </label>
                <textarea
                  rows={3}
                  value={wlNotes}
                  onChange={(e) => setWlNotes(e.target.value)}
                  placeholder={lang === 'RU' ? 'Пожелания гостя...' : 'Guest wishes...'}
                  className="w-full bg-white border border-[#E5E2DD] rounded-[14px] px-3.5 py-3 text-xs font-sans text-[#241E1A] placeholder:text-[#8A8177] focus:outline-none focus:border-[#C2410C] resize-y"
                />
              </div>

              {/* Submit Button */}
              <div className="pt-2 mt-auto">
                <button
                  type="submit"
                  className="w-full py-3.5 rounded-[14px] bg-[#B93800] hover:bg-[#9E3000] text-white text-xs font-sans font-semibold flex items-center justify-center gap-2 cursor-pointer transition-colors shadow-xs"
                >
                  <Plus className="h-4 w-4 text-white" />
                  <span>
                    {editingWaitlistId
                      ? lang === 'RU'
                        ? 'Сохранить заявку'
                        : 'Save request'
                      : lang === 'RU'
                      ? 'Добавить заявку'
                      : 'Add request'}
                  </span>
                </button>
              </div>
            </form>
          </div>
        ) : selectedWaitlistItem ? (
          /* ---------------- ПОЛНОЭКРАННАЯ КАРТОЧКА ЗАЯВКИ (SCREENSHOT 1: Заявка №31) ---------------- */
          <div className="flex-1 flex flex-col overflow-y-auto no-scrollbar px-5 pt-4 pb-6 animate-in slide-in-from-right duration-200">
            {/* Back Link */}
            <button
              type="button"
              onClick={() => setSelectedWaitlistItem(null)}
              className="flex items-center gap-1.5 text-xs font-sans text-[#8A8177] hover:text-[#241E1A] cursor-pointer w-fit -ml-1"
            >
              <ChevronLeft className="h-4 w-4 text-[#241E1A]" />
              <span>{lang === 'RU' ? 'Лист ожидания' : 'Waitlist'}</span>
            </button>

            {/* Title: Заявка №31 */}
            <h1 className="text-[26px] font-serif font-normal text-[#241E1A] leading-tight mt-2.5 mb-4">
              {lang === 'RU'
                ? `Заявка ${selectedWaitlistItem.waitlistNumber}`
                : `Request ${selectedWaitlistItem.waitlistNumber}`}
            </h1>

            {/* Main Guest Card (with smaller, harmonious guest name) */}
            <div className="bg-white rounded-[18px] border border-[#E5E2DD] p-4.5 space-y-2 shadow-2xs mb-5">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-[8px] bg-[#F5EFE4] text-[#7A6B58] text-[11px] font-sans">
                <Clock className="h-3.5 w-3.5 text-[#7A6B58]" />
                <span>{lang === 'RU' ? 'В листе ожидания' : 'On waitlist'}</span>
              </div>

              <h2 className="text-[18px] font-serif font-medium text-[#241E1A] leading-snug pt-0.5">
                {selectedWaitlistItem.guestName}
              </h2>

              <p className="text-xs font-sans text-[#8A8177]">{selectedWaitlistItem.phone}</p>
            </div>

            {/* 5 Key-Value Rows */}
            <div className="divide-y divide-[#E5E2DD] border-b border-[#E5E2DD] mb-5">
              <div className="py-3.5 flex items-center justify-between text-xs font-sans">
                <span className="text-[#8A8177]">
                  {lang === 'RU' ? 'Желаемый заезд' : 'Desired check-in'}
                </span>
                <span className="text-[#241E1A] font-semibold">
                  {selectedWaitlistItem.checkinFull}
                </span>
              </div>

              <div className="py-3.5 flex items-center justify-between text-xs font-sans">
                <span className="text-[#8A8177]">{lang === 'RU' ? 'Выезд' : 'Check-out'}</span>
                <span className="text-[#241E1A] font-semibold">
                  {selectedWaitlistItem.checkoutFull}
                </span>
              </div>

              <div className="py-3.5 flex items-center justify-between text-xs font-sans">
                <span className="text-[#8A8177]">
                  {lang === 'RU' ? 'Количество гостей' : 'Guests'}
                </span>
                <span className="text-[#241E1A] font-semibold">
                  {selectedWaitlistItem.guestsCount}
                </span>
              </div>

              <div className="py-3.5 flex items-center justify-between text-xs font-sans">
                <span className="text-[#8A8177]">{lang === 'RU' ? 'Категория' : 'Category'}</span>
                <span className="text-[#241E1A] font-semibold">
                  {selectedWaitlistItem.desiredCategory}
                </span>
              </div>

              <div className="py-3.5 flex items-center justify-between text-xs font-sans">
                <span className="text-[#8A8177]">
                  {lang === 'RU' ? 'Гибкие даты' : 'Flexible dates'}
                </span>
                <span className="text-[#241E1A] font-semibold">
                  {selectedWaitlistItem.flexibleDates
                    ? lang === 'RU'
                      ? 'Да, возможен перенос'
                      : 'Yes, flexible'
                    : lang === 'RU'
                    ? 'Нет, точные даты'
                    : 'No, exact dates'}
                </span>
              </div>
            </div>

            {/* Comment Card */}
            <div className="bg-white rounded-[16px] border border-[#E5E2DD] p-4 space-y-1.5 shadow-2xs mb-5">
              <span className="text-[11px] font-sans text-[#8A8177] block">
                {lang === 'RU' ? 'Комментарий' : 'Comment'}
              </span>
              <p className="text-xs font-sans text-[#241E1A] leading-relaxed">
                {selectedWaitlistItem.notes}
              </p>
            </div>

            {/* Bottom Actions: Изменить | + Создать бронь */}
            <div className="flex items-center gap-2.5 mt-auto pt-1">
              <button
                type="button"
                onClick={() => openEditWaitlistModal(selectedWaitlistItem)}
                className="w-[42%] py-3.5 rounded-[14px] bg-white hover:bg-slate-50 border border-[#E5E2DD] text-[#241E1A] text-xs font-sans font-semibold cursor-pointer transition-colors text-center shadow-2xs"
              >
                {lang === 'RU' ? 'Изменить' : 'Edit'}
              </button>

              <button
                type="button"
                onClick={() => {
                  const parts = selectedWaitlistItem.guestName.trim().split(' ');
                  setIndFirstName(parts[0] || '');
                  setIndLastName(parts.slice(1).join(' ') || '');
                  setIndPhone(selectedWaitlistItem.phone);
                  const catCode: 'Lux' | 'Comfort' | 'Standard' =
                    selectedWaitlistItem.desiredCategory === 'Люкс'
                      ? 'Lux'
                      : selectedWaitlistItem.desiredCategory === 'Комфорт'
                      ? 'Comfort'
                      : 'Standard';
                  setIndCategoryCode(catCode);
                  setIndAdults(String(selectedWaitlistItem.guestsCount));
                  setIndCheckinDate(
                    formatWaitlistFullToDotDate(selectedWaitlistItem.checkinFull, '06.11.2026')
                  );
                  setIndCheckoutDate(
                    formatWaitlistFullToDotDate(selectedWaitlistItem.checkoutFull, '08.11.2026')
                  );
                  setIndBookingNotes(selectedWaitlistItem.notes);
                  setIndStep(1);
                  setCreateBookingType('INDIVIDUAL');
                  setSelectedWaitlistItem(null);
                  if (onNavigateTab) onNavigateTab('RECEPTION_CREATE');
                }}
                className="flex-1 py-3.5 rounded-[14px] bg-[#B93800] hover:bg-[#9E3000] text-white text-xs font-sans font-semibold flex items-center justify-center gap-2 cursor-pointer transition-colors shadow-xs"
              >
                <Plus className="h-4 w-4 text-white" />
                <span>{lang === 'RU' ? 'Создать бронь' : 'Create booking'}</span>
              </button>
            </div>
          </div>
        ) : (
          /* ---------------- СПИСОК ЛИСТА ОЖИДАНИЯ ---------------- */
          <>
            <div className="flex-1 overflow-y-auto no-scrollbar px-5 pt-4 pb-4">
              {/* Header */}
              <div className="mb-4">
                <h1 className="text-[28px] font-serif font-normal text-[#241E1A] leading-tight">
                  {lang === 'RU' ? 'Лист ожидания' : 'Waitlist'}
                </h1>
              </div>

              {/* Search Bar */}
              <div className="bg-white border border-[#E5E2DD] rounded-[14px] px-3.5 py-2.5 flex items-center gap-2.5 shadow-2xs mb-2.5">
                <Search className="h-4 w-4 text-[#8A8177] shrink-0" />
                <input
                  type="text"
                  value={waitlistSearch}
                  onChange={(e) => setWaitlistSearch(e.target.value)}
                  placeholder={
                    lang === 'RU' ? 'Гость, телефон или № заявки' : 'Guest, phone or request #'
                  }
                  className="w-full bg-transparent text-xs font-sans text-[#241E1A] placeholder:text-[#8A8177] focus:outline-none"
                />
                {waitlistSearch && (
                  <button
                    type="button"
                    onClick={() => setWaitlistSearch('')}
                    className="text-[#8A8177] hover:text-[#241E1A] text-xs cursor-pointer"
                  >
                    ✕
                  </button>
                )}
              </div>

              {/* 2 Filter Dropdowns: Все категории | Любое количество */}
              <div className="grid grid-cols-2 gap-2 mb-4">
                <div className="relative">
                  <select
                    value={waitlistCategoryFilter}
                    onChange={(e) => setWaitlistCategoryFilter(e.target.value)}
                    className="w-full appearance-none bg-white border border-[#E5E2DD] rounded-[12px] px-3 py-2 pr-7 text-[11px] font-sans text-[#241E1A] focus:outline-none cursor-pointer"
                  >
                    <option value="ALL">
                      {lang === 'RU' ? 'Все категории' : 'All categories'}
                    </option>
                    <option value="Стандарт">Стандарт</option>
                    <option value="Комфорт">Комфорт</option>
                    <option value="Люкс">Люкс</option>
                  </select>
                  <ChevronDown className="h-3.5 w-3.5 text-[#241E1A] absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>

                <div className="relative">
                  <select
                    value={waitlistGuestsFilter}
                    onChange={(e) => setWaitlistGuestsFilter(e.target.value)}
                    className="w-full appearance-none bg-white border border-[#E5E2DD] rounded-[12px] px-3 py-2 pr-7 text-[11px] font-sans text-[#241E1A] focus:outline-none cursor-pointer"
                  >
                    <option value="ALL">
                      {lang === 'RU' ? 'Любое количество' : 'Any guests'}
                    </option>
                    <option value="1">1 гость</option>
                    <option value="2">2 гостя</option>
                    <option value="3">3 гостя</option>
                    <option value="4">4 гостя</option>
                  </select>
                  <ChevronDown className="h-3.5 w-3.5 text-[#241E1A] absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>
              </div>

              {/* Count Row */}
              <div className="flex items-center justify-between text-xs font-sans mb-2.5">
                <span className="text-[#8A8177]">
                  {lang === 'RU' ? 'Ожидают размещения' : 'Awaiting placement'}
                </span>
                <span className="text-[#241E1A] font-medium">
                  {getWaitlistCountLabel(filteredWaitlist.length)}
                </span>
              </div>

              {/* Waitlist Cards */}
              <div className="space-y-2.5">
                {filteredWaitlist.map((item) => (
                  <div
                    key={item.id}
                    onClick={() => setSelectedWaitlistItem(item)}
                    className="bg-white rounded-[16px] border border-[#E5E2DD] p-4 space-y-1.5 shadow-2xs cursor-pointer hover:border-[#241E1A]/30 transition-all active:scale-[0.99]"
                  >
                    {/* Row 1: Name + №31 > */}
                    <div className="flex items-center justify-between gap-2">
                      <h3 className="text-[15px] font-sans font-medium text-[#241E1A]">
                        {item.guestName}
                      </h3>
                      <div className="flex items-center gap-1 text-xs font-sans text-[#8A8177] shrink-0">
                        <span>{item.waitlistNumber}</span>
                        <ChevronRight className="h-3.5 w-3.5 text-[#8A8177]" />
                      </div>
                    </div>

                    {/* Row 2: Phone + 2 гостя · Стандарт */}
                    <div className="flex items-center justify-between gap-2 text-xs font-sans text-[#8A8177]">
                      <span>{item.phone}</span>
                      <span>
                        {item.guestsCount}{' '}
                        {item.guestsCount === 1
                          ? 'гость'
                          : item.guestsCount < 5
                          ? 'гостя'
                          : 'гостей'}{' '}
                        · {item.desiredCategory}
                      </span>
                    </div>

                    {/* Row 3: Dates + Гибкие даты badge */}
                    <div className="flex items-center justify-between gap-2 pt-1">
                      <span className="text-xs font-sans text-[#241E1A]">
                        {item.desiredDates}
                      </span>
                      {item.flexibleDates && (
                        <span className="px-2.5 py-0.5 rounded-[7px] bg-[#E8EFEA] text-[#3B6647] text-[11px] font-sans font-normal">
                          {lang === 'RU' ? 'Гибкие даты' : 'Flexible dates'}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Bottom Pinned Button: + Создать заявку */}
            <div className="px-5 pb-4 pt-2 bg-[#FAF7F3] shrink-0">
              <button
                type="button"
                onClick={openNewWaitlistModal}
                className="w-full py-3.5 rounded-[14px] bg-[#C2410C] hover:bg-[#A93A0C] text-white text-xs font-sans font-medium flex items-center justify-center gap-2 cursor-pointer transition-colors shadow-xs active:scale-[0.99]"
              >
                <Plus className="h-4 w-4 text-white" />
                <span>{lang === 'RU' ? 'Создать заявку' : 'Create request'}</span>
              </button>
            </div>
          </>
        )}
      </div>
    );
  }

  // ==================== TAB 4: ПРОФИЛЬ РЕСЕПШНА ====================
  const unreadNotifsCount = receptionNotifs.filter((n) => n.unread).length;
  const unreadChatsCount = receptionChats.reduce((acc, c) => acc + c.unread, 0);

  return (
    <div className="flex-1 flex flex-col bg-[#FAF7F3] overflow-hidden relative select-none">
      {/* ==================== 1. SUB-OVERLAY: NOTIFICATIONS ==================== */}
      {showNotifications && (
        <div className="absolute inset-0 bg-[#FAF7F3] z-50 flex flex-col animate-in slide-in-from-right duration-300">
          {/* Header */}
          <div className="bg-[#FAF7F3] px-5 pt-7 pb-4 space-y-1.5 shrink-0 text-left">
            <div className="flex items-center gap-2 -ml-1">
              <button
                type="button"
                onClick={() => setShowNotifications(false)}
                className="flex items-center justify-center text-[#241E1A] hover:opacity-75 transition-opacity cursor-pointer"
              >
                <ChevronLeft className="h-6 w-6" />
              </button>
              <h2 className="text-2xl font-serif font-medium text-[#241E1A] pt-0.5 select-none">
                {lang === 'RU' ? 'Уведомления' : 'Notifications'}
              </h2>
            </div>
            <p className="text-xs font-sans font-normal text-[#8A8177]">
              <span className="text-[#241E1A] font-medium">
                {unreadNotifsCount} {lang === 'RU' ? 'новых' : 'new'}
              </span>
              {' · '}
              <button
                type="button"
                onClick={() =>
                  setReceptionNotifs((prev) => prev.map((n) => ({ ...n, unread: false })))
                }
                className="text-[#C2410C] hover:underline cursor-pointer font-sans"
              >
                {lang === 'RU' ? 'отметить все прочитанными' : 'mark all as read'}
              </button>
            </p>
          </div>

          {/* Category Filter Chips adapted for Receptionist */}
          <div className="px-5 pb-3.5 flex items-center gap-1.5 overflow-x-auto no-scrollbar text-[11px] shrink-0">
            {(
              [
                { id: 'ALL', ru: 'Все', en: 'All' },
                { id: 'BOOKINGS', ru: 'Бронирования', en: 'Bookings' },
                { id: 'ROOMS', ru: 'Номера и службы', en: 'Rooms & Services' },
                { id: 'SHIFT', ru: 'Смена', en: 'Shift' },
              ] as const
            ).map((f) => {
              const isSelected = notifFilter === f.id;
              return (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => setNotifFilter(f.id)}
                  className={`px-4 py-1.5 rounded-full text-xs font-sans font-normal border whitespace-nowrap cursor-pointer transition-all ${
                    isSelected
                      ? 'bg-[#241E1A] text-white border-[#241E1A] shadow-xs'
                      : 'bg-white text-[#8A8177] border-[#E5E2DD] hover:bg-[#FAF7F3]/40'
                  }`}
                >
                  {lang === 'RU' ? f.ru : f.en}
                </button>
              );
            })}
          </div>

          {/* Notifications Feed grouped by СЕГОДНЯ / ВЧЕРА */}
          <div className="flex-1 overflow-y-auto px-5 pb-5 space-y-4 no-scrollbar">
            {(() => {
              const filtered = receptionNotifs.filter((item) => {
                if (notifFilter === 'ALL') return true;
                return item.category === notifFilter;
              });

              if (filtered.length === 0) {
                return (
                  <div className="text-center py-12 text-[#8A8177] font-sans font-normal text-xs bg-white rounded-[14px] border border-[#E5E2DD] shadow-2xs">
                    <Bell className="h-6 w-6 mx-auto text-[#8A8177] mb-1" />
                    <p>{lang === 'RU' ? 'Уведомлений пока нет' : 'No notifications yet'}</p>
                  </div>
                );
              }

              const todayList = filtered.filter((n) => n.dayGroup === 'TODAY');
              const yesterdayList = filtered.filter((n) => n.dayGroup === 'YESTERDAY');

              const renderNotifIcon = (iconType: (typeof receptionNotifs)[0]['iconType']) => {
                switch (iconType) {
                  case 'CLOCK_URGENT':
                    return <Clock className="h-4.5 w-4.5 text-[#B3261E] shrink-0 mt-0.5" />;
                  case 'WRENCH':
                    return <Wrench className="h-4.5 w-4.5 text-[#8A8177] shrink-0 mt-0.5" />;
                  case 'MESSAGE':
                    return <MessageSquare className="h-4.5 w-4.5 text-[#8A8177] shrink-0 mt-0.5" />;
                  case 'BOOKING':
                    return <Calendar className="h-4.5 w-4.5 text-[#8A8177] shrink-0 mt-0.5" />;
                  case 'CHECK':
                    return <CheckCircle2 className="h-4.5 w-4.5 text-[#8A8177] shrink-0 mt-0.5" />;
                  default:
                    return <Clock className="h-4.5 w-4.5 text-[#8A8177] shrink-0 mt-0.5" />;
                }
              };

              const renderCard = (item: (typeof receptionNotifs)[0]) => {
                const hasLeftRedBorder = item.urgent && item.unread;
                return (
                  <div
                    key={item.id}
                    onClick={() =>
                      setReceptionNotifs((prev) =>
                        prev.map((n) => (n.id === item.id ? { ...n, unread: false } : n))
                      )
                    }
                    className={`bg-white border border-[#E5E2DD] rounded-[14px] p-4 shadow-2xs relative transition-all cursor-pointer flex gap-3 ${
                      hasLeftRedBorder ? 'border-l-2 border-l-[#B3261E]' : ''
                    }`}
                  >
                    {renderNotifIcon(item.iconType)}
                    <div className="flex-1 text-left min-w-0">
                      <span className="text-xs font-sans font-medium text-[#241E1A] block">
                        {item.title}
                      </span>
                      <span className="text-[10px] font-sans font-normal text-[#8A8177] block mt-0.5">
                        {item.sub}
                      </span>
                    </div>
                    {item.unread && (
                      <span className="h-2 w-2 rounded-full bg-[#C2410C] mt-2 self-start ml-auto shrink-0" />
                    )}
                  </div>
                );
              };

              return (
                <div className="space-y-4">
                  {todayList.length > 0 && (
                    <div className="space-y-2">
                      <h4 className="text-[10px] text-[#8A8177] font-sans font-normal tracking-widest uppercase px-1">
                        {lang === 'RU' ? 'СЕГОДНЯ' : 'TODAY'}
                      </h4>
                      <div className="space-y-2">{todayList.map(renderCard)}</div>
                    </div>
                  )}

                  {yesterdayList.length > 0 && (
                    <div className="space-y-2">
                      <h4 className="text-[10px] text-[#8A8177] font-sans font-normal tracking-widest uppercase px-1">
                        {lang === 'RU' ? 'ВЧЕРА' : 'YESTERDAY'}
                      </h4>
                      <div className="space-y-2">{yesterdayList.map(renderCard)}</div>
                    </div>
                  )}
                </div>
              );
            })()}
          </div>
        </div>
      )}

      {/* ==================== 1.5 SUB-OVERLAY: CHATS ==================== */}
      {showChats && (
        <div className="absolute inset-0 bg-[#FAF7F3] z-50 flex flex-col animate-in slide-in-from-right duration-200 select-none font-sans">
          {activeChatId === null ? (
            /* Chat List View */
            <div className="flex-1 overflow-y-auto no-scrollbar p-4.5 space-y-4">
              {/* Header with Back button & Spectral 500 Title */}
              <div className="pt-2 pb-1 flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setShowChats(false)}
                  className="text-[#241E1A] hover:text-black cursor-pointer"
                >
                  <ChevronLeft className="h-5 w-5" />
                </button>
                <h1 className="font-serif font-medium text-2xl text-[#241E1A] leading-tight">
                  {lang === 'RU' ? 'Чаты' : 'Chats'}
                </h1>
              </div>

              {/* Search Bar */}
              <div className="bg-white rounded-2xl border border-[#E5E2DD] px-3.5 py-2.5 flex items-center gap-2.5 shadow-2xs">
                <Search className="h-4 w-4 text-[#8A8177] shrink-0" />
                <input
                  type="text"
                  placeholder={lang === 'RU' ? 'Поиск по имени' : 'Search by name'}
                  value={chatSearchQuery}
                  onChange={(e) => setChatSearchQuery(e.target.value)}
                  className="w-full bg-transparent text-xs text-[#241E1A] placeholder-[#8A8177] focus:outline-none font-sans font-normal"
                />
              </div>

              {/* Contacts Card Container */}
              <div className="bg-white rounded-[24px] border border-[#E5E2DD] divide-y divide-[#E5E2DD]/50 shadow-2xs overflow-hidden">
                {receptionChats
                  .filter((c) => {
                    const q = chatSearchQuery.toLowerCase().trim();
                    if (!q) return true;
                    return (
                      c.name.toLowerCase().includes(q) ||
                      c.nameEn.toLowerCase().includes(q) ||
                      c.role.toLowerCase().includes(q) ||
                      c.roleFull.toLowerCase().includes(q)
                    );
                  })
                  .map((contact) => {
                    const displayName = lang === 'RU' ? contact.name : contact.nameEn;
                    const initials = displayName
                      .split(' ')
                      .map((n) => n[0])
                      .join('')
                      .toUpperCase();

                    return (
                      <div
                        key={contact.id}
                        onClick={() => {
                          setActiveChatId(contact.id);
                          setReceptionChats((prev) =>
                            prev.map((item) =>
                              item.id === contact.id ? { ...item, unread: 0 } : item
                            )
                          );
                        }}
                        className="p-4 flex items-center gap-3 hover:bg-slate-50/70 transition-colors cursor-pointer"
                      >
                        {/* Initials Avatar */}
                        <div className="h-10 w-10 rounded-full bg-[#E5E0D8] text-[#8A8177] font-sans font-medium text-xs flex items-center justify-center shrink-0">
                          {initials}
                        </div>

                        {/* Middle Text */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-1">
                            <div className="flex items-center gap-1.5 min-w-0">
                              <h4 className="text-xs font-sans font-medium text-[#241E1A] truncate">
                                {displayName}
                              </h4>
                              {contact.pinned && (
                                <span className="text-[#8A8177] text-[10px] shrink-0">📌</span>
                              )}
                              <span className="text-[10px] font-sans font-normal text-[#8A8177] truncate">
                                {contact.role}
                              </span>
                            </div>

                            <div className="flex items-center gap-1.5 shrink-0">
                              <span className="text-[10px] font-sans font-normal text-[#8A8177]">
                                {contact.time}
                              </span>
                              {contact.unread > 0 && (
                                <span className="h-4.5 w-4.5 rounded-full bg-[#C2410C] text-[10px] font-sans font-medium text-white flex items-center justify-center shrink-0">
                                  {contact.unread}
                                </span>
                              )}
                            </div>
                          </div>

                          <p className="text-xs text-[#8A8177] font-sans font-normal mt-0.5 truncate">
                            {contact.lastMsg}
                          </p>
                        </div>
                      </div>
                    );
                  })}
              </div>
            </div>
          ) : (
            /* Active Conversation View (Matching Reference Screenshot 1) */
            (() => {
              const contact = receptionChats.find((c) => c.id === activeChatId)!;
              const displayName = lang === 'RU' ? contact.name : contact.nameEn;
              const initials = displayName
                .split(' ')
                .map((n) => n[0])
                .join('')
                .toUpperCase();

              const handleSendReceptionMessage = (textToSend: string) => {
                if (!textToSend.trim()) return;
                const now = new Date().toLocaleTimeString('ru-RU', {
                  hour: '2-digit',
                  minute: '2-digit',
                });
                setReceptionChats((prev) =>
                  prev.map((c) =>
                    c.id === contact.id
                      ? {
                          ...c,
                          lastMsg: textToSend.trim(),
                          time: now,
                          messages: [
                            ...c.messages,
                            { sender: 'ME' as any, text: textToSend.trim(), time: now },
                          ],
                        }
                      : c
                  )
                );
                setChatInput('');

                // Simulated reply from colleague
                setTimeout(() => {
                  const repTime = new Date().toLocaleTimeString('ru-RU', {
                    hour: '2-digit',
                    minute: '2-digit',
                  });
                  setReceptionChats((prev) =>
                    prev.map((c) => {
                      if (c.id === contact.id) {
                        const randomReply =
                          c.quickReplies[Math.floor(Math.random() * c.quickReplies.length)] ||
                          'Принято, спасибо!';
                        return {
                          ...c,
                          lastMsg: randomReply,
                          time: repTime,
                          messages: [
                            ...c.messages,
                            { sender: 'OTHER' as const, text: randomReply, time: repTime },
                          ],
                        };
                      }
                      return c;
                    })
                  );
                }, 1400);
              };

              return (
                <div className="flex-1 flex flex-col min-h-0 bg-[#FAF7F3]">
                  {/* Active Chat Top Header */}
                  <div className="p-4 bg-white border-b border-[#E5E2DD] flex items-center justify-between shrink-0 shadow-2xs">
                    <div className="flex items-center gap-3">
                      <button
                        type="button"
                        onClick={() => setActiveChatId(null)}
                        className="text-[#241E1A] hover:text-black cursor-pointer"
                      >
                        <ChevronLeft className="h-5 w-5" />
                      </button>
                      <div className="h-9 w-9 rounded-full bg-[#E5E0D8] text-[#8A8177] font-sans font-medium text-xs flex items-center justify-center shrink-0">
                        {initials}
                      </div>
                      <div>
                        <h3 className="font-serif font-medium text-sm text-[#241E1A] leading-tight">
                          {displayName}
                        </h3>
                        <span className="text-[10px] font-sans font-normal text-[#8A8177] mt-0.5 block">
                          {contact.role}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Message List */}
                  <div className="flex-1 overflow-y-auto no-scrollbar p-4 space-y-3">
                    {contact.messages.map((msg, index) => {
                      const isMe = msg.sender !== 'OTHER';
                      return (
                        <div
                          key={index}
                          className={`flex ${isMe ? 'justify-end' : 'justify-start'} animate-in fade-in`}
                        >
                          <div
                            className={`max-w-[78%] rounded-[18px] p-3 shadow-2xs text-xs font-sans font-normal ${
                              isMe
                                ? 'bg-[#241E1A] text-white rounded-br-xs'
                                : 'bg-white border border-[#E5E2DD] text-[#241E1A] rounded-bl-xs'
                            }`}
                          >
                            <p className="leading-relaxed break-words">{msg.text}</p>
                            <span
                              className={`block text-[9px] mt-1 text-right font-sans ${
                                isMe ? 'text-white/60' : 'text-[#8A8177]'
                              }`}
                            >
                              {msg.time}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Chat Input Bar */}
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      handleSendReceptionMessage(chatInput);
                    }}
                    className="p-3 border-t border-[#E5E2DD] bg-white flex items-center gap-2 shrink-0"
                  >
                    <input
                      type="text"
                      value={chatInput}
                      onChange={(e) => setChatInput(e.target.value)}
                      placeholder={
                        lang === 'RU' ? 'Сообщение...' : 'Type message...'
                      }
                      className="flex-1 bg-[#FAF7F3] border border-[#E5E2DD] rounded-xl px-3.5 py-2.5 text-xs text-[#241E1A] placeholder-[#8A8177] focus:outline-none focus:border-[#241E1A] font-sans font-normal"
                    />
                    <button
                      type="submit"
                      className="bg-[#241E1A] hover:bg-black text-white p-2.5 rounded-xl transition-all cursor-pointer flex items-center justify-center shrink-0 shadow-xs"
                    >
                      <Send className="h-4 w-4" />
                    </button>
                  </form>
                </div>
              );
            })()
          )}
        </div>
      )}

      {/* ==================== 2. SUB-OVERLAY: SETTINGS ==================== */}
      {showSettings && (
        <div className="absolute inset-0 bg-[#FAF7F3] z-50 flex flex-col animate-in slide-in-from-right duration-300">
          {/* Header */}
          <div className="bg-[#FAF7F3] px-5 pt-7 pb-4 space-y-1 shrink-0 text-left">
            <div className="flex items-center gap-2 -ml-1">
              <button
                type="button"
                onClick={() => {
                  setShowSettings(false);
                  setIsEditingProfile(false);
                }}
                className="flex items-center justify-center text-[#241E1A] hover:opacity-75 transition-opacity cursor-pointer"
              >
                <ChevronLeft className="h-6 w-6" />
              </button>
              <h2 className="text-2xl font-serif font-medium text-[#241E1A] pt-0.5 select-none">
                {lang === 'RU' ? 'Настройки' : 'Settings'}
              </h2>
            </div>
            <p className="text-xs font-sans font-normal text-[#8A8177] pl-7">
              {lang === 'RU' ? 'Приложение и учётная запись' : 'App and Account Settings'}
            </p>
          </div>

          {/* Scrollable Settings Panel */}
          <div className="flex-1 px-5 pb-5 space-y-5 overflow-y-auto no-scrollbar">
            {/* SECTION 1: ПРИЛОЖЕНИЕ */}
            <div className="space-y-2 text-left">
              <h3 className="text-[10px] text-[#8A8177] font-sans font-normal tracking-widest uppercase px-1">
                {lang === 'RU' ? 'ПРИЛОЖЕНИЕ' : 'APPLICATION'}
              </h3>

              <div className="bg-white rounded-[14px] border border-[#E5E2DD] overflow-hidden divide-y divide-[#E5E2DD]/50 shadow-2xs">
                {/* Язык интерфейса */}
                <div className="p-4 flex items-center justify-between">
                  <div>
                    <span className="text-xs font-sans font-normal text-[#241E1A] block">
                      {lang === 'RU' ? 'Язык интерфейса' : 'Interface Language'}
                    </span>
                    <span className="text-[10px] font-sans font-normal text-[#8A8177] block mt-0.5">
                      {lang === 'RU' ? 'Русский' : 'English'}
                    </span>
                  </div>

                  <div className="flex bg-[#E5E2DD]/40 p-0.5 rounded-full text-[10px] font-sans font-medium shrink-0">
                    <button
                      type="button"
                      onClick={() => onLanguageChange && onLanguageChange('RU')}
                      className={`px-3 py-1 rounded-full transition-all cursor-pointer ${
                        lang === 'RU' ? 'bg-[#241E1A] text-white' : 'text-[#8A8177]'
                      }`}
                    >
                      RU
                    </button>
                    <button
                      type="button"
                      onClick={() => onLanguageChange && onLanguageChange('EN')}
                      className={`px-3 py-1 rounded-full transition-all cursor-pointer ${
                        lang === 'EN' ? 'bg-[#241E1A] text-white' : 'text-[#8A8177]'
                      }`}
                    >
                      EN
                    </button>
                  </div>
                </div>

                {/* Офлайн-режим */}
                <div className="p-4 flex items-center justify-between">
                  <div>
                    <span className="text-xs font-sans font-normal text-[#241E1A] block">
                      {lang === 'RU' ? 'Офлайн-режим' : 'Offline Mode'}
                    </span>
                    <span className="text-[10px] font-sans font-normal text-[#8A8177] block mt-0.5">
                      {lang === 'RU'
                        ? 'данные синхронизируются при сети'
                        : 'data syncs when connected'}
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={onToggleOffline}
                    className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                      offlineMode ? 'bg-[#5B8C6E]' : 'bg-[#E5E2DD]'
                    }`}
                  >
                    <span
                      className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
                        offlineMode ? 'translate-x-4' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>

                {/* Push-уведомления */}
                <div className="p-4 flex items-center justify-between">
                  <div>
                    <span className="text-xs font-sans font-normal text-[#241E1A] block">
                      {lang === 'RU' ? 'Push-уведомления' : 'Push Notifications'}
                    </span>
                    <span className="text-[10px] font-sans font-normal text-[#8A8177] block mt-0.5">
                      {lang === 'RU'
                        ? 'новые брони, заезды и сообщения'
                        : 'new bookings, check-ins and messages'}
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={() => setPushEnabled(!pushEnabled)}
                    className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                      pushEnabled ? 'bg-[#5B8C6E]' : 'bg-[#E5E2DD]'
                    }`}
                  >
                    <span
                      className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
                        pushEnabled ? 'translate-x-4' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>

                {/* Звук при новой брони */}
                <div className="p-4 flex items-center justify-between">
                  <div>
                    <span className="text-xs font-sans font-normal text-[#241E1A] block">
                      {lang === 'RU' ? 'Звук при новой брони' : 'Sound on New Booking'}
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={() => setSoundEnabled(!soundEnabled)}
                    className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                      soundEnabled ? 'bg-[#5B8C6E]' : 'bg-[#E5E2DD]'
                    }`}
                  >
                    <span
                      className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
                        soundEnabled ? 'translate-x-4' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>
              </div>
            </div>

            {/* SECTION 2: СИНХРОНИЗАЦИЯ */}
            <div className="space-y-2 text-left">
              <h3 className="text-[10px] text-[#8A8177] font-sans font-normal tracking-widest uppercase px-1">
                {lang === 'RU' ? 'СИНХРОНИЗАЦИЯ' : 'SYNCHRONIZATION'}
              </h3>

              <div
                onClick={() => {
                  const now = new Date().toLocaleTimeString('ru-RU', {
                    hour: '2-digit',
                    minute: '2-digit',
                  });
                  setLastSyncedTime(now);
                  alert(
                    lang === 'RU'
                      ? 'Шахматка и данные бронирований успешно синхронизированы!'
                      : 'Grid and booking data synced successfully!'
                  );
                }}
                className="bg-white rounded-[14px] border border-[#E5E2DD] p-4 shadow-2xs flex items-center justify-between cursor-pointer hover:bg-[#FAF7F3]/40 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <RefreshCw className="h-4.5 w-4.5 text-[#8A8177]" />
                  <div>
                    <span className="text-xs font-sans font-normal text-[#241E1A] block">
                      {lang === 'RU' ? 'Обновить данные' : 'Refresh Data'}
                    </span>
                    <span className="text-[10px] font-sans font-normal text-[#8A8177] block mt-0.5">
                      {lang === 'RU'
                        ? `последняя синхронизация ${lastSyncedTime}`
                        : `last synced at ${lastSyncedTime}`}
                    </span>
                  </div>
                </div>
                <ChevronRight className="h-4 w-4 text-[#8A8177]" />
              </div>
            </div>

            {/* SECTION 3: УЧЁТНАЯ ЗАПИСЬ */}
            <div className="space-y-2 text-left">
              <h3 className="text-[10px] text-[#8A8177] font-sans font-normal tracking-widest uppercase px-1">
                {lang === 'RU' ? 'УЧЁТНАЯ ЗАПИСЬ' : 'ACCOUNT'}
              </h3>

              <div className="bg-white rounded-[14px] border border-[#E5E2DD] overflow-hidden divide-y divide-[#E5E2DD]/50 shadow-2xs">
                {/* Личные данные */}
                <div
                  onClick={() => {
                    setEditFullName(cleanerProfile.fullName);
                    setEditFullNameRu(cleanerProfile.fullNameRu);
                    setEditBadgeId(cleanerProfile.badgeId);
                    setEditAvatarUrl(cleanerProfile.avatarUrl);
                    setIsEditingProfile(true);
                  }}
                  className="p-4 flex items-center justify-between cursor-pointer hover:bg-[#FAF7F3]/40 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <User className="h-4 w-4 text-[#8A8177]" />
                    <span className="text-xs font-sans font-normal text-[#241E1A]">
                      {lang === 'RU' ? 'Личные данные' : 'Personal Details'}
                    </span>
                  </div>
                  <ChevronRight className="h-4 w-4 text-[#8A8177]" />
                </div>

                {/* Сменить пароль */}
                <div
                  onClick={() =>
                    alert(
                      lang === 'RU'
                        ? 'Смена пароля недоступна в демо-режиме'
                        : 'Change password is not available in demo mode'
                    )
                  }
                  className="p-4 flex items-center justify-between cursor-pointer hover:bg-[#FAF7F3]/40 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <Lock className="h-4 w-4 text-[#8A8177]" />
                    <span className="text-xs font-sans font-normal text-[#241E1A]">
                      {lang === 'RU' ? 'Сменить пароль' : 'Change Password'}
                    </span>
                  </div>
                  <ChevronRight className="h-4 w-4 text-[#8A8177]" />
                </div>

                {/* Служба поддержки */}
                <div
                  onClick={() =>
                    alert(
                      lang === 'RU'
                        ? 'ИТ-поддержка стойки ресепшна: +7 (800) 100-20-30 (вн. 105)'
                        : 'Reception IT Support Desk: +7 (800) 100-20-30 (ext. 105)'
                    )
                  }
                  className="p-4 flex items-center justify-between cursor-pointer hover:bg-[#FAF7F3]/40 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <HelpCircle className="h-4 w-4 text-[#8A8177]" />
                    <span className="text-xs font-sans font-normal text-[#241E1A]">
                      {lang === 'RU' ? 'Служба поддержки' : 'Support Desk'}
                    </span>
                  </div>
                  <ChevronRight className="h-4 w-4 text-[#8A8177]" />
                </div>
              </div>
            </div>

            {/* STANDALONE LOG OUT BUTTON */}
            <div
              onClick={onLogout}
              className="bg-white rounded-[14px] border border-[#E5E2DD] p-4 shadow-2xs flex items-center gap-3 cursor-pointer text-[#8A8177] hover:text-[#B3261E] hover:bg-[#FAF7F3]/40 transition-all active:scale-98"
            >
              <LogOut className="h-4 w-4 text-[#8A8177]" />
              <span className="text-xs font-sans font-normal">
                {lang === 'RU' ? 'Выйти из аккаунта' : 'Log Out'}
              </span>
            </div>
          </div>

          {/* Profile Edit Backdrop Modal */}
          {isEditingProfile && (
            <div className="absolute inset-0 bg-black/60 z-[60] flex items-center justify-center p-4">
              <div className="bg-white rounded-[24px] w-full max-w-xs p-5 shadow-2xl border border-[#E5E2DD] space-y-4 animate-in fade-in zoom-in duration-200">
                <div className="flex items-center justify-between border-b border-[#E5E2DD]/50 pb-2">
                  <h3 className="text-sm font-serif font-medium text-[#241E1A]">
                    {lang === 'RU' ? 'Личные данные' : 'Edit Details'}
                  </h3>
                  <button
                    type="button"
                    onClick={() => setIsEditingProfile(false)}
                    className="h-6 w-6 rounded-full bg-slate-50 text-[#8A8177] hover:bg-slate-100 flex items-center justify-center font-bold text-sm cursor-pointer"
                  >
                    ×
                  </button>
                </div>

                <div className="space-y-3.5 text-xs text-left">
                  <div className="space-y-2 font-sans">
                    <div>
                      <label className="block text-[9px] text-[#8A8177] uppercase tracking-wider mb-0.5">
                        {lang === 'RU' ? 'ФИО администратора' : 'Full name'}
                      </label>
                      <input
                        type="text"
                        value={lang === 'RU' ? editFullNameRu : editFullName}
                        onChange={(e) => {
                          setEditFullNameRu(e.target.value);
                          setEditFullName(e.target.value);
                        }}
                        className="w-full bg-[#FAF7F3] border border-[#E5E2DD] rounded-xl px-2.5 py-1.5 text-xs text-[#241E1A] focus:outline-none focus:ring-1 focus:ring-[#C2410C]"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-[9px] text-[#8A8177] uppercase tracking-wider mb-0.5">
                          {lang === 'RU' ? 'Табель' : 'Staff ID'}
                        </label>
                        <input
                          type="text"
                          value={editBadgeId}
                          onChange={(e) => setEditBadgeId(e.target.value)}
                          className="w-full bg-[#FAF7F3] border border-[#E5E2DD] rounded-xl px-2.5 py-1.5 text-xs text-[#241E1A] focus:outline-none focus:ring-1 focus:ring-[#C2410C]"
                        />
                      </div>
                      <div>
                        <label className="block text-[9px] text-[#8A8177] uppercase tracking-wider mb-0.5">
                          {lang === 'RU' ? 'Рабочая зона' : 'Desk'}
                        </label>
                        <input
                          type="text"
                          value={editDeskAssigned}
                          onChange={(e) => setEditDeskAssigned(e.target.value)}
                          className="w-full bg-[#FAF7F3] border border-[#E5E2DD] rounded-xl px-2.5 py-1.5 text-xs text-[#241E1A] focus:outline-none focus:ring-1 focus:ring-[#C2410C]"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-2 pt-2 border-t border-[#E5E2DD]/50 font-sans">
                    <button
                      type="button"
                      onClick={() => setIsEditingProfile(false)}
                      className="flex-1 py-1.5 border border-[#E5E2DD] rounded-xl font-normal text-[#8A8177] hover:bg-slate-50 cursor-pointer"
                    >
                      {lang === 'RU' ? 'Отмена' : 'Cancel'}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        onUpdateCleanerProfile({
                          ...cleanerProfile,
                          fullName: editFullName,
                          fullNameRu: editFullNameRu,
                          badgeId: editBadgeId,
                          floorAssigned: editDeskAssigned,
                          avatarUrl: editAvatarUrl,
                        });
                        setIsEditingProfile(false);
                      }}
                      className="flex-1 py-1.5 bg-[#C2410C] hover:bg-[#A93A0C] text-white rounded-xl font-normal cursor-pointer text-center"
                    >
                      {lang === 'RU' ? 'Сохранить' : 'Save'}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Main Profile Header */}
      <header className="px-5 pt-4 pb-1.5 flex items-center justify-between shrink-0">
        <h1 className="text-2xl font-serif font-medium text-[#241E1A]">
          {lang === 'RU' ? 'Профиль' : 'Profile'}
        </h1>

        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => setShowChats(true)}
            className="h-10 w-10 bg-white border border-[#E5E2DD] text-[#241E1A] rounded-xl flex items-center justify-center relative cursor-pointer hover:bg-[#FAF7F3]"
          >
            <MessageSquare className="h-4 w-4" />
            {unreadChatsCount > 0 && (
              <span className="absolute -top-1 -right-1 h-4 w-4 bg-[#C2410C] rounded-full text-[9px] font-medium text-white flex items-center justify-center">
                {unreadChatsCount}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setShowNotifications(true)}
            className="h-10 w-10 bg-white border border-[#E5E2DD] text-[#241E1A] rounded-xl flex items-center justify-center relative cursor-pointer hover:bg-[#FAF7F3]"
          >
            <Bell className="h-4 w-4" />
            {unreadNotifsCount > 0 && (
              <span className="absolute -top-1 -right-1 h-4 w-4 bg-[#C2410C] rounded-full text-[9px] font-medium text-white flex items-center justify-center">
                {unreadNotifsCount}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setShowSettings(true)}
            className="h-10 w-10 bg-white border border-[#E5E2DD] text-[#241E1A] rounded-xl flex items-center justify-center cursor-pointer hover:bg-[#FAF7F3]"
          >
            <Settings className="h-4 w-4" />
          </button>
        </div>
      </header>

      {/* Scrollable Profile Content */}
      <div className="flex-1 overflow-y-auto px-5 py-3 space-y-5 no-scrollbar">
        {/* Employee Card */}
        <div className="bg-white rounded-[18px] border border-[#E5E2DD] p-4 flex items-center gap-3.5 shadow-2xs">
          <div className="h-14 w-14 rounded-full bg-[#E5DEC9]/70 text-[#5C544D] font-sans font-medium text-base flex items-center justify-center shrink-0">
            ДК
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-serif font-medium text-[#241E1A]">
                {lang === 'RU' ? cleanerProfile.fullNameRu : cleanerProfile.fullName}
              </h2>
              <span className="text-[11px] font-sans text-[#8A8177]">{cleanerProfile.badgeId}</span>
            </div>
            <p className="text-xs font-sans text-[#8A8177] mt-0.5">
              {lang === 'RU' ? 'Администратор ресепшна' : 'Receptionist'}
            </p>
          </div>
        </div>

        {/* Section 1: ТЕКУЩАЯ СМЕНА */}
        <div className="space-y-2">
          <h3 className="text-[10px] text-[#8A8177] font-sans uppercase tracking-widest px-1">
            {lang === 'RU' ? 'ТЕКУЩАЯ СМЕНА' : 'CURRENT SHIFT'}
          </h3>

          {shiftStatus === 'SHIFT_ENDED' ? (
            <div className="bg-white rounded-[18px] border border-[#E5E2DD] p-4 space-y-3 shadow-2xs">
              <div className="flex items-center justify-between">
                <span className="text-sm font-sans font-medium text-[#241E1A]">
                  {lang === 'RU' ? 'Смена не начата' : 'Shift not started'}
                </span>
                <span className="text-xs font-sans text-[#8A8177]">5 нояб · 08:00–20:00</span>
              </div>
              <p className="text-xs font-sans text-[#8A8177] leading-relaxed">
                {lang === 'RU'
                  ? 'Начните смену, отсканировав QR-код на стойке ресепшна.'
                  : 'Start your shift by scanning the QR code at the reception desk.'}
              </p>
              <button
                type="button"
                onClick={() => setShowQrShiftModal(true)}
                className="w-full py-3 rounded-[14px] bg-[#C2410C] hover:bg-[#A93A0C] text-white text-xs font-sans font-medium flex items-center justify-center gap-2 transition-colors cursor-pointer shadow-2xs"
              >
                <QrCode className="h-4 w-4 text-white" />
                <span>{lang === 'RU' ? 'Начать смену по QR' : 'Start shift via QR'}</span>
              </button>
            </div>
          ) : (
            <div className="bg-white rounded-[18px] border border-[#E5E2DD] p-4 space-y-4 shadow-2xs">
              <div className="flex items-center justify-between text-xs font-sans">
                <span className="font-medium text-[#241E1A]">SH-4102</span>
                <span className="text-[#8A8177]">5 нояб · с 08:00</span>
              </div>

              <div className="grid grid-cols-3 gap-1.5">
                <button
                  type="button"
                  onClick={() => setShiftStatus('ON_SHIFT')}
                  className={`py-2.5 rounded-xl text-xs font-sans cursor-pointer transition-all ${
                    shiftStatus === 'ON_SHIFT'
                      ? 'bg-[#241E1A] text-white font-medium shadow-xs'
                      : 'bg-white border border-[#E5E2DD] text-[#8A8177]'
                  }`}
                >
                  {lang === 'RU' ? 'На смене' : 'On shift'}
                </button>
                <button
                  type="button"
                  onClick={() => setShiftStatus('ON_BREAK')}
                  className={`py-2.5 rounded-xl text-xs font-sans cursor-pointer transition-all ${
                    shiftStatus === 'ON_BREAK'
                      ? 'bg-[#241E1A] text-white font-medium shadow-xs'
                      : 'bg-white border border-[#E5E2DD] text-[#8A8177]'
                  }`}
                >
                  {lang === 'RU' ? 'Перерыв' : 'Break'}
                </button>
                <button
                  type="button"
                  onClick={() => setShiftStatus('SHIFT_ENDED')}
                  className="py-2.5 rounded-xl text-xs font-sans bg-white border border-[#E5E2DD] text-[#8A8177] hover:text-[#241E1A] cursor-pointer transition-all"
                >
                  {lang === 'RU' ? 'Завершить' : 'End'}
                </button>
              </div>

              <div className="grid grid-cols-3 divide-x divide-[#E5E2DD]/60 pt-2 border-t border-[#E5E2DD]/60 text-center">
                <div className="px-1">
                  <div className="text-base font-sans font-medium text-[#241E1A]">
                    {bookings.length}
                  </div>
                  <div className="text-[10px] text-[#8A8177]">активных броней</div>
                </div>
                <div className="px-1">
                  <div className="text-base font-sans font-medium text-[#241E1A]">2 / 1</div>
                  <div className="text-[10px] text-[#8A8177]">заезды / выезды</div>
                </div>
                <div className="px-1">
                  <div className="text-base font-sans font-medium text-[#241E1A]">
                    {waitlist.filter((w) => w.status === 'WAITING').length}
                  </div>
                  <div className="text-[10px] text-[#8A8177]">лист ожидания</div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Section 2: РАБОТА */}
        <div className="space-y-2 pb-4">
          <h3 className="text-[10px] text-[#8A8177] font-sans uppercase tracking-widest px-1">
            {lang === 'RU' ? 'РАБОТА' : 'WORK'}
          </h3>

          <div className="bg-white rounded-[18px] border border-[#E5E2DD] overflow-hidden shadow-2xs">
            {/* Shift History */}
            <div>
              <div
                onClick={() => setIsHistoryExpanded(!isHistoryExpanded)}
                className="p-4 flex items-center justify-between cursor-pointer hover:bg-[#FAF7F3]/50"
              >
                <div className="flex items-center gap-3">
                  <Clock className="h-4 w-4 text-[#8A8177]" />
                  <span className="text-xs font-sans text-[#241E1A]">История смен</span>
                </div>
                <div className="flex items-center gap-1.5 text-xs text-[#8A8177]">
                  <span>18 смен за месяц</span>
                  <ChevronRight
                    className={`h-4 w-4 transition-transform ${
                      isHistoryExpanded ? 'rotate-90' : ''
                    }`}
                  />
                </div>
              </div>

              {isHistoryExpanded && (
                <div className="px-4 pb-3 space-y-2 bg-[#FAF7F3]/50 border-t border-[#E5E2DD]/50 pt-2">
                  {mockShiftHistory.slice(0, 3).map((sh) => (
                    <div
                      key={sh.id}
                      className="bg-white rounded-xl p-2.5 border border-[#E5E2DD] flex items-center justify-between text-xs"
                    >
                      <div>
                        <span className="font-medium text-[#241E1A]">{sh.shiftNumber}</span>
                        <span className="text-[#8A8177] ml-2">{sh.date}</span>
                      </div>
                      <span className="text-[#2E623C] font-medium">{sh.hoursWorked} ч · 100%</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Modal: QR Shift Scanner */}
      {showQrShiftModal && (
        <div className="fixed inset-0 z-50 bg-black/45 backdrop-blur-[1px] flex items-center justify-center p-4">
          <div className="bg-[#F5F2ED] w-full max-w-[340px] rounded-[24px] border border-[#E5E2DD] p-5 space-y-4 shadow-xl">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-sans font-medium text-[#241E1A]">
                {lang === 'RU' ? 'Сканирование QR смены' : 'Scan Shift QR'}
              </h3>
              <button
                type="button"
                onClick={() => setShowQrShiftModal(false)}
                className="h-8 w-8 rounded-full bg-white border border-[#E5E2DD] flex items-center justify-center text-[#8A8177] hover:text-[#241E1A] cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="bg-[#1F1A17] rounded-[20px] p-5 flex flex-col items-center justify-center space-y-3">
              <div className="w-[160px] h-[160px] relative flex items-center justify-center">
                <div className="absolute top-0 left-0 w-6 h-6 border-t-[2.5px] border-l-[2.5px] border-[#F5F2ED] rounded-tl-[10px]" />
                <div className="absolute top-0 right-0 w-6 h-6 border-t-[2.5px] border-r-[2.5px] border-[#F5F2ED] rounded-tr-[10px]" />
                <div className="absolute bottom-0 left-0 w-6 h-6 border-b-[2.5px] border-l-[2.5px] border-[#F5F2ED] rounded-bl-[10px]" />
                <div className="absolute bottom-0 right-0 w-6 h-6 border-b-[2.5px] border-r-[2.5px] border-[#F5F2ED] rounded-br-[10px]" />
                <div className="w-[125px] h-[2px] bg-[#C2410C]" />
              </div>
              <p className="text-xs font-sans text-[#D4CEC6] text-center">
                {lang === 'RU'
                  ? 'Поместите QR-код смены в рамку'
                  : 'Place shift QR code inside frame'}
              </p>
            </div>

            <button
              type="button"
              onClick={() => {
                setShiftStatus('ON_SHIFT');
                setShowQrShiftModal(false);
              }}
              className="w-full py-3 rounded-[14px] bg-[#C2410C] hover:bg-[#A93A0C] text-white text-xs font-sans font-medium transition-colors cursor-pointer shadow-xs"
            >
              {lang === 'RU' ? 'Подтвердить и начать смену' : 'Confirm & start shift'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
