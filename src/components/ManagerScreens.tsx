import React, { useState } from 'react';
import {
  BarChart3,
  TrendingUp,
  Wallet,
  Calendar,
  Package,
  User,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  Search,
  Phone,
  ArrowUpRight,
  Bed,
  LogIn,
  LogOut,
  Filter,
  Download,
  CheckCircle2,
  Clock,
  CreditCard,
  Layers,
  Settings,
  Bell,
  MessageSquare,
  Send,
  FileText,
  Check,
  Building2,
  DollarSign,
  AlertCircle,
  Plus,
  Copy,
  Archive,
  X,
  Wrench,
  Pin,
  Lock,
  RefreshCw,
  HelpCircle,
  Edit3
} from 'lucide-react';
import { Language, CleanerProfile, HotelRoom } from '../types';

interface ManagerScreensProps {
  lang: Language;
  cleanerProfile: CleanerProfile;
  onUpdateCleanerProfile: (profile: CleanerProfile) => void;
  onLogout: () => void;
  offlineMode: boolean;
  onToggleOffline: () => void;
  activeTab: 'MANAGER_ANALYTICS' | 'MANAGER_FINANCE' | 'MANAGER_BOOKINGS' | 'MANAGER_WAREHOUSE' | 'MANAGER_PROFILE';
  onNavigateTab: (tab: any) => void;
  rooms?: HotelRoom[];
  onLanguageChange?: (lang: Language) => void;
}

interface UnpaidBooking {
  id: string;
  guestName: string;
  roomNumber: string;
  category: string;
  dates: string;
  amount: string;
  numericAmount: number;
  phone: string;
}

interface UnpaidService {
  id: string;
  guestName: string;
  roomNumber: string;
  serviceName: string;
  date: string;
  status: string;
  amount: string;
  numericAmount: number;
}

export const ManagerScreens: React.FC<ManagerScreensProps> = ({
  lang,
  cleanerProfile,
  onUpdateCleanerProfile,
  onLogout,
  offlineMode,
  onToggleOffline,
  activeTab,
  onNavigateTab,
  onLanguageChange,
}) => {
  // ==================== STATE: ANALYTICS ====================
  const [analyticsSubTab, setAnalyticsSubTab] = useState<'DASHBOARD' | 'REPORTS'>('DASHBOARD');
  const [activeUnpaidView, setActiveUnpaidView] = useState<'NONE' | 'BOOKINGS' | 'SERVICES'>('NONE');

  // Key metrics accordion states (Screenshot 2 & 3)
  const [metricsDetailsOpen, setMetricsDetailsOpen] = useState<boolean>(false);
  const [cancellationsOpen, setCancellationsOpen] = useState<boolean>(false);

  // Period selector state (Analytics Dashboard: DAY | WEEK | MONTH | YEAR)
  const [periodType, setPeriodType] = useState<'DAY' | 'WEEK' | 'MONTH' | 'YEAR'>('WEEK');
  const [analyticsStartDate, setAnalyticsStartDate] = useState<string>('2026-11-10');
  const [analyticsEndDate, setAnalyticsEndDate] = useState<string>('2026-11-16');
  const [showAnalyticsPeriodDropdown, setShowAnalyticsPeriodDropdown] = useState<boolean>(false);
  const [showAnalyticsCalendarPicker, setShowAnalyticsCalendarPicker] = useState<boolean>(false);

  // Bookings period selector state (Bookings -> Брони: DAY | WEEK | MONTH | YEAR)
  const [bookingsPeriodType, setBookingsPeriodType] = useState<'DAY' | 'WEEK' | 'MONTH' | 'YEAR'>('WEEK');
  const [bookingsStartDate, setBookingsStartDate] = useState<string>('2026-11-16');
  const [bookingsEndDate, setBookingsEndDate] = useState<string>('2026-11-22');
  const [showBookingsPeriodDropdown, setShowBookingsPeriodDropdown] = useState<boolean>(false);
  const [showBookingsCalendarPicker, setShowBookingsCalendarPicker] = useState<boolean>(false);

  // Finance -> Transactions expandable filter state & Salary month picker state
  const [showTransactionFilters, setShowTransactionFilters] = useState<boolean>(false);
  const [showSalaryMonthPicker, setShowSalaryMonthPicker] = useState<boolean>(false);
  const [salaryYear, setSalaryYear] = useState<number>(2026);
  const [salaryMonthIndex, setSalaryMonthIndex] = useState<number>(8); // 8 = Сентябрь

  // Search states for unpaid views
  const [searchUnpaidBookings, setSearchUnpaidBookings] = useState<string>('');
  const [searchUnpaidServices, setSearchUnpaidServices] = useState<string>('');

  // Dialog / action feedback state
  const [actionAlert, setActionAlert] = useState<string | null>(null);

  // ==================== STATE: REPORTS (Screenshots 1-5) ====================
  const ALL_REPORT_COLUMNS = [
    'Дата',
    'Категория номера',
    'Номер',
    'Номеров',
    'Доступно ночей',
    'Занято ночей',
    'Загрузка, %',
    'Заезды',
    'Выезды',
    'Гости',
    'Доход',
    'ADR',
    'RevPAR',
  ];

  const [reportDateFrom, setReportDateFrom] = useState<string>('01.11.2026');
  const [reportDateTo, setReportDateTo] = useState<string>('30.11.2026');
  const [reportType, setReportType] = useState<string>('ST003 · Загрузка за период');
  const [reportTemplate, setReportTemplate] = useState<string>('По категории номера');
  const [excludeNonGuaranteed, setExcludeNonGuaranteed] = useState<boolean>(false);
  const [reportColumnsOpen, setReportColumnsOpen] = useState<boolean>(false);
  const [selectedColumns, setSelectedColumns] = useState<string[]>(ALL_REPORT_COLUMNS);
  const [sortField, setSortField] = useState<string>('Категория номера');
  const [sortOrder, setSortOrder] = useState<string>('По возрастанию');
  const [generatedReportView, setGeneratedReportView] = useState<boolean>(false);

  // Profile overlay states
  const [showSettings, setShowSettings] = useState<boolean>(false);
  const [showNotifications, setShowNotifications] = useState<boolean>(false);
  const [showChats, setShowChats] = useState<boolean>(false);

  // Settings states (Screenshots 5 & 6)
  const [pushEnabled, setPushEnabled] = useState<boolean>(true);
  const [soundEnabled, setSoundEnabled] = useState<boolean>(false);
  const [lastSyncedTime, setLastSyncedTime] = useState<string>('09:41');

  // Account Modals inside Settings
  const [isEditingProfile, setIsEditingProfile] = useState<boolean>(false);
  const [editFullNameRu, setEditFullNameRu] = useState<string>(cleanerProfile.fullNameRu || 'Арман Нурланов');
  const [editPhone, setEditPhone] = useState<string>('+7 (701) 777-10-01');
  const [editEmail, setEditEmail] = useState<string>('arman.nurlanov@sollviera.kz');

  const [isChangingPassword, setIsChangingPassword] = useState<boolean>(false);
  const [currentPassword, setCurrentPassword] = useState<string>('');
  const [newPassword, setNewPassword] = useState<string>('');
  const [confirmPassword, setConfirmPassword] = useState<string>('');
  const [passwordError, setPasswordError] = useState<string | null>(null);

  const [isSupportModalOpen, setIsSupportModalOpen] = useState<boolean>(false);
  const [supportMessageText, setSupportMessageText] = useState<string>('');

  // Translation helper
  const isEn = lang === 'EN';
  const t = (ru: string, en: string) => (isEn ? en : ru);

  // Date & Period formatting / navigation helpers
  const MONTHS_GEN_RU = ['января', 'февраля', 'марта', 'апреля', 'мая', 'июня', 'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря'];
  const MONTHS_NOM_RU = ['Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь', 'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь'];
  const MONTHS_SHORT_RU = ['янв.', 'февр.', 'марта', 'апр.', 'мая', 'июня', 'июля', 'авг.', 'сент.', 'окт.', 'нояб.', 'дек.'];
  const MONTHS_EN = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  const MONTHS_SHORT_EN = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const WEEKDAYS_RU = ['ВС', 'ПН', 'ВТ', 'СР', 'ЧТ', 'ПТ', 'СБ'];
  const WEEKDAYS_EN = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];

  const parseIsoDate = (iso: string): Date => {
    const [y, m, d] = iso.split('-').map(Number);
    return new Date(y || 2026, (m || 11) - 1, d || 16);
  };

  const toIsoDate = (date: Date): string => {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  };

  const computeRangeForMode = (
    anchorIso: string,
    mode: 'DAY' | 'WEEK' | 'MONTH' | 'YEAR'
  ): [string, string] => {
    const d = parseIsoDate(anchorIso);
    if (mode === 'DAY') {
      return [toIsoDate(d), toIsoDate(d)];
    }
    if (mode === 'WEEK') {
      const end = new Date(d.getFullYear(), d.getMonth(), d.getDate() + 6);
      return [toIsoDate(d), toIsoDate(end)];
    }
    if (mode === 'MONTH') {
      const start = new Date(d.getFullYear(), d.getMonth(), 1);
      const end = new Date(d.getFullYear(), d.getMonth() + 1, 0);
      return [toIsoDate(start), toIsoDate(end)];
    }
    // YEAR
    const y = d.getFullYear();
    return [`${y}-01-01`, `${y}-12-31`];
  };

  const shiftRange = (
    startIso: string,
    endIso: string,
    mode: 'DAY' | 'WEEK' | 'MONTH' | 'YEAR',
    dir: -1 | 1
  ): [string, string] => {
    const s = parseIsoDate(startIso);
    const e = parseIsoDate(endIso);
    if (mode === 'DAY') {
      const nextS = new Date(s.getFullYear(), s.getMonth(), s.getDate() + dir);
      const nextE = new Date(e.getFullYear(), e.getMonth(), e.getDate() + dir);
      return [toIsoDate(nextS), toIsoDate(nextE)];
    }
    if (mode === 'WEEK') {
      const nextS = new Date(s.getFullYear(), s.getMonth(), s.getDate() + dir * 7);
      const nextE = new Date(e.getFullYear(), e.getMonth(), e.getDate() + dir * 7);
      return [toIsoDate(nextS), toIsoDate(nextE)];
    }
    if (mode === 'MONTH') {
      const nextMonthStart = new Date(s.getFullYear(), s.getMonth() + dir, 1);
      const nextMonthEnd = new Date(nextMonthStart.getFullYear(), nextMonthStart.getMonth() + 1, 0);
      return [toIsoDate(nextMonthStart), toIsoDate(nextMonthEnd)];
    }
    // YEAR
    const nextYear = s.getFullYear() + dir;
    return [`${nextYear}-01-01`, `${nextYear}-12-31`];
  };

  const formatPeriodLabel = (
    startIso: string,
    endIso: string,
    mode: 'DAY' | 'WEEK' | 'MONTH' | 'YEAR',
    withYear = false
  ): string => {
    const s = parseIsoDate(startIso);
    const e = parseIsoDate(endIso);
    const sDay = s.getDate();
    const eDay = e.getDate();
    const sMonth = s.getMonth();
    const eMonth = e.getMonth();
    const sYear = s.getFullYear();
    const eYear = e.getFullYear();

    if (startIso === endIso) {
      return isEn
        ? `${sDay} ${MONTHS_EN[sMonth]}${withYear ? ` ${sYear}` : ''}`
        : `${sDay} ${MONTHS_GEN_RU[sMonth]}${withYear ? ` ${sYear}` : ''}`;
    }

    const lastDayOfSMonth = new Date(sYear, sMonth + 1, 0).getDate();
    if (mode === 'MONTH' && sMonth === eMonth && sYear === eYear && sDay === 1 && eDay === lastDayOfSMonth) {
      return isEn
        ? `${MONTHS_EN[sMonth]} ${sYear}`
        : `${MONTHS_NOM_RU[sMonth]} ${sYear}`;
    }

    if (mode === 'YEAR' && sYear === eYear && sMonth === 0 && sDay === 1 && eMonth === 11 && eDay === 31) {
      return isEn ? `${sYear}` : `${sYear} год`;
    }

    if (sMonth === eMonth && sYear === eYear) {
      return isEn
        ? `${sDay}–${eDay} ${MONTHS_EN[sMonth]}${withYear ? ` ${sYear}` : ''}`
        : `${sDay}–${eDay} ${MONTHS_GEN_RU[sMonth]}${withYear ? ` ${sYear}` : ''}`;
    }

    if (sYear === eYear) {
      return isEn
        ? `${sDay} ${MONTHS_SHORT_EN[sMonth]} – ${eDay} ${MONTHS_SHORT_EN[eMonth]}${withYear ? ` ${sYear}` : ''}`
        : `${sDay} ${MONTHS_SHORT_RU[sMonth]} – ${eDay} ${MONTHS_SHORT_RU[eMonth]}${withYear ? ` ${sYear}` : ''}`;
    }

    return isEn
      ? `${sDay} ${MONTHS_SHORT_EN[sMonth]} ${sYear} – ${eDay} ${MONTHS_SHORT_EN[eMonth]} ${eYear}`
      : `${sDay} ${MONTHS_SHORT_RU[sMonth]} ${sYear} – ${eDay} ${MONTHS_SHORT_RU[eMonth]} ${eYear}`;
  };

  const PERIOD_OPTIONS: Array<{ id: 'DAY' | 'WEEK' | 'MONTH' | 'YEAR'; labelRu: string; labelEn: string }> = [
    { id: 'DAY', labelRu: 'День', labelEn: 'Day' },
    { id: 'WEEK', labelRu: 'Неделя', labelEn: 'Week' },
    { id: 'MONTH', labelRu: 'Месяц', labelEn: 'Month' },
    { id: 'YEAR', labelRu: 'Год', labelEn: 'Year' },
  ];

  const getPeriodOptionLabel = (mode: 'DAY' | 'WEEK' | 'MONTH' | 'YEAR') => {
    const found = PERIOD_OPTIONS.find((o) => o.id === mode);
    return found ? t(found.labelRu, found.labelEn) : t('Неделя', 'Week');
  };

  const currentPeriodText = formatPeriodLabel(
    analyticsStartDate,
    analyticsEndDate,
    periodType,
    periodType === 'DAY' || periodType === 'MONTH' || periodType === 'YEAR'
  );

  const bookingsPeriodText = formatPeriodLabel(
    bookingsStartDate,
    bookingsEndDate,
    bookingsPeriodType,
    true
  );

  // Notifications Data for Manager (Screenshot 4)
  interface ManagerNotification {
    id: string;
    title: string;
    sub: string;
    category: 'ALL' | 'BOOKINGS' | 'ROOMS' | 'FINANCE';
    dayGroup: 'TODAY' | 'YESTERDAY';
    iconType: 'CLOCK_URGENT' | 'WRENCH' | 'MESSAGE' | 'CHECK';
    urgent?: boolean;
    unread: boolean;
  }

  const [managerNotifs, setManagerNotifs] = useState<ManagerNotification[]>([
    {
      id: 'mn-1',
      title: 'Гость ожидает ранний заезд в №303',
      sub: 'Запрос с 12:30 · индивидуальная бронь BR-4109',
      category: 'BOOKINGS',
      dayGroup: 'TODAY',
      iconType: 'CLOCK_URGENT',
      urgent: true,
      unread: true,
    },
    {
      id: 'mn-2',
      title: 'Техник завершил проверку №202',
      sub: 'Олег Петров · кондиционер исправлен · 09:50',
      category: 'ROOMS',
      dayGroup: 'TODAY',
      iconType: 'WRENCH',
      unread: true,
    },
    {
      id: 'mn-3',
      title: 'Сообщение от службы ресепшн',
      sub: 'Динара Каримова · 09:32',
      category: 'ROOMS',
      dayGroup: 'TODAY',
      iconType: 'MESSAGE',
      unread: true,
    },
    {
      id: 'mn-4',
      title: 'Номер №301 готов к заселению',
      sub: 'Проверен супервайзером Светланой Ким · 08:45',
      category: 'ROOMS',
      dayGroup: 'TODAY',
      iconType: 'CHECK',
      unread: true,
    },
    {
      id: 'mn-5',
      title: 'Выезд гостя оформлен (№102)',
      sub: 'Елена Соколова · счёт и folio закрыты · 16:40',
      category: 'BOOKINGS',
      dayGroup: 'YESTERDAY',
      iconType: 'CHECK',
      unread: false,
    },
    {
      id: 'mn-6',
      title: 'Операционная смена завершена',
      sub: '14 заселений за 12 ч 00 мин · 20:05',
      category: 'FINANCE',
      dayGroup: 'YESTERDAY',
      iconType: 'CLOCK_URGENT',
      unread: false,
    },
  ]);

  const [notifFilter, setNotifFilter] = useState<'ALL' | 'BOOKINGS' | 'ROOMS' | 'FINANCE'>('ALL');

  // Chats Data for Manager (Screenshot 3)
  interface ManagerChatConversation {
    id: string;
    contactName: string;
    contactRole: string;
    avatarInitials: string;
    time: string;
    unreadCount: number;
    isPinned?: boolean;
    messages: Array<{
      id: string;
      sender: 'ME' | 'THEM';
      text: string;
      time: string;
    }>;
  }

  const [managerChats, setManagerChats] = useState<ManagerChatConversation[]>([
    {
      id: 'mc-1',
      contactName: 'Динара Каримова',
      contactRole: 'администратор ресепшна',
      avatarInitials: 'ДК',
      time: '13:02',
      unreadCount: 1,
      isPinned: true,
      messages: [
        {
          id: 'm1-1',
          sender: 'THEM',
          text: 'Добрый день, Арман! Смена стойки ресепшн открыта вовремя.',
          time: '08:05',
        },
        {
          id: 'm1-2',
          sender: 'ME',
          text: 'Отлично. Проверьте сегодня заезд группы из Павлодара к 14:00.',
          time: '08:20',
        },
        {
          id: 'm1-3',
          sender: 'THEM',
          text: 'Динара, гость из №303 просил подтвердить поздний выезд до 15:00. Согласуем?',
          time: '13:02',
        },
      ],
    },
    {
      id: 'mc-2',
      contactName: 'Светлана Ким',
      contactRole: 'супервайзер housekeeping',
      avatarInitials: 'СК',
      time: '12:45',
      unreadCount: 0,
      isPinned: true,
      messages: [
        {
          id: 'm2-1',
          sender: 'THEM',
          text: 'Пожалуйста, сверьте выезд по 202 номеру до 13:00.',
          time: '12:40',
        },
        {
          id: 'm2-2',
          sender: 'THEM',
          text: 'Генеральная уборка 3-го этажа завершена, номера сданы в шахматку.',
          time: '12:45',
        },
      ],
    },
    {
      id: 'mc-3',
      contactName: 'Алина Серикова',
      contactRole: 'менеджер доп. услуг',
      avatarInitials: 'АС',
      time: '10:15',
      unreadCount: 0,
      messages: [
        {
          id: 'm3-1',
          sender: 'THEM',
          text: 'По спа-комплексу и трансферам на вечер все брони подтверждены.',
          time: '10:15',
        },
      ],
    },
    {
      id: 'mc-4',
      contactName: 'Олег Петров',
      contactRole: 'старший техник',
      avatarInitials: 'ОП',
      time: 'Вчера',
      unreadCount: 0,
      messages: [
        {
          id: 'm4-1',
          sender: 'THEM',
          text: 'Замок в №103 перепрограммирован, ключ-карты обновлены. Кондиционер в №202 исправлен.',
          time: 'Вчера',
        },
      ],
    },
  ]);

  const [activeChatId, setActiveChatId] = useState<string | null>(null);
  const [chatSearchQuery, setChatSearchQuery] = useState<string>('');
  const [newMessageText, setNewMessageText] = useState<string>('');

  // ==================== STATE: FINANCE (Screenshots 1-5) ====================
  const [financeSubTab, setFinanceSubTab] = useState<'TRANSACTIONS' | 'ACCOUNTS' | 'SALARY'>('TRANSACTIONS');

  // Transactions state
  const [transactionTypeFilter, setTransactionTypeFilter] = useState<string>('Все типы');
  const [transactionAccountFilter, setTransactionAccountFilter] = useState<string>('Все счета');
  const [transactionSearch, setTransactionSearch] = useState<string>('');
  const [transactionPeriod, setTransactionPeriod] = useState<string>('30 дней');
  const [showNonIncomeAffecting, setShowNonIncomeAffecting] = useState<boolean>(false);
  const [expandedTransactionId, setExpandedTransactionId] = useState<string | null>(null);

  // Accounts state
  const [expandedAccountId, setExpandedAccountId] = useState<string | null>(null);
  const [archiveAccountsOpen, setArchiveAccountsOpen] = useState<boolean>(true); // Screenshot 5 shows archive open
  const [addAccountOpen, setAddAccountOpen] = useState<boolean>(false);
  const [newAccountName, setNewAccountName] = useState<string>('');
  const [newAccountType, setNewAccountType] = useState<string>('Расчётный счёт');
  const [newAccountBalance, setNewAccountBalance] = useState<string>('');

  // Financial Accounts Data (Screenshots 3, 4, 5)
  interface FinancialAccount {
    id: string;
    name: string;
    type: string;
    balance: number;
    currency: string;
    isActive: boolean;
    iban?: string;
    bik?: string;
    bankName?: string;
    detailsNote?: string;
  }

  const [accounts, setAccounts] = useState<FinancialAccount[]>([
    {
      id: 'acc-1',
      name: 'Расчётный счёт Halyk',
      type: 'Расчётный счёт',
      balance: 2500000,
      currency: '₸',
      isActive: true,
      iban: 'KZ236012345678901234',
      bik: 'HSBKKZKX',
      bankName: 'АО "Народный Банк Казахстана"',
      detailsNote: 'Основной корпоративный расчётный счёт'
    },
    {
      id: 'acc-2',
      name: 'Касса ресепшн',
      type: 'Наличные',
      balance: 354000,
      currency: '₸',
      isActive: true,
      bankName: 'Физическая касса отеля',
      detailsNote: 'Лимит наличности: 500 000 ₸ · Смена открыта'
    },
    {
      id: 'acc-3',
      name: 'Kaspi POS-терминал',
      type: 'Терминал',
      balance: 148000,
      currency: '₸',
      isActive: true,
      bankName: 'АО Kaspi Bank',
      detailsNote: 'Терминал №01 стойки ресепшн · Ставка 1.2%'
    },
    {
      id: 'acc-4',
      name: 'Kaspi',
      type: 'Терминал',
      balance: 5000,
      currency: '₸',
      isActive: true,
      bankName: 'Kaspi Pay QR',
      detailsNote: 'Мобильный приём платежей Kaspi Gold/Red'
    },
    {
      id: 'acc-5',
      name: 'Онлайн-оплата на сайте',
      type: 'Онлайн-оплата',
      balance: 0,
      currency: '₸',
      isActive: true,
      bankName: 'Интернет-эквайринг',
      detailsNote: 'Платёжный шлюз для прямых бронирований'
    }
  ]);

  const [archivedAccounts, setArchivedAccounts] = useState<FinancialAccount[]>([]);

  // Transactions Data (Screenshots 1 & 2)
  interface Transaction {
    id: string;
    name: string;
    amount: string;
    numericAmount: number;
    subtext: string;
    badge: string;
    paymentMethod: string;
    type: 'INCOME' | 'EXPENSE';
    account: string;
    affectsProfit: boolean;
    operationDetails?: string;
  }

  const [transactions, setTransactions] = useState<Transaction[]>([
    {
      id: 'tx-1',
      name: 'Нургалиева Динара',
      amount: '+50 000 ₸',
      numericAmount: 50000,
      subtext: '23 окт., 09:23 · Касса ресепшн',
      badge: 'Доход',
      paymentMethod: 'Наличные',
      type: 'INCOME',
      account: 'Касса ресепшн',
      affectsProfit: true,
      operationDetails: 'Оплата проживания (Бронь №1042 · Номер 204)'
    },
    {
      id: 'tx-2',
      name: 'Kaspi POS-терминал',
      amount: '+5 600 ₸',
      numericAmount: 5600,
      subtext: '20 окт., 12:47 · Kaspi POS-терминал',
      badge: 'Доход',
      paymentMethod: 'Банковская карта',
      type: 'INCOME',
      account: 'Kaspi POS-терминал',
      affectsProfit: true,
      operationDetails: 'Эквайринг: Мини-бар + прачечная'
    }
  ]);

  // ==================== STATE: SALARY / SHIFTS (Screenshots 1 & 2) ====================
  interface EmployeeShift {
    id: string;
    employeeName: string;
    date: string;
    hasQr?: boolean;
    startTime: string;
    endTime: string;
    isOpen: boolean;
    hours?: number;
    department: string;
    hourlyRate?: number;
  }

  const [salaryPeriod, setSalaryPeriod] = useState<string>('Сентябрь 2026');
  const [shiftSearch, setShiftSearch] = useState<string>('');
  const [addShiftOpen, setAddShiftOpen] = useState<boolean>(false);
  const [expandedShiftId, setExpandedShiftId] = useState<string | null>(null);

  // Add shift form states
  const [newShiftEmployee, setNewShiftEmployee] = useState<string>('');
  const [newShiftDept, setNewShiftDept] = useState<string>('housekeeping');
  const [newShiftDate, setNewShiftDate] = useState<string>('29 сент. 2026');
  const [newShiftStartTime, setNewShiftStartTime] = useState<string>('09:00');
  const [newShiftEndTime, setNewShiftEndTime] = useState<string>('18:00');
  const [newShiftIsOpen, setNewShiftIsOpen] = useState<boolean>(false);
  const [newShiftHasQr, setNewShiftHasQr] = useState<boolean>(false);

  const [shifts, setShifts] = useState<EmployeeShift[]>([
    {
      id: 'sh-1',
      employeeName: 'Мухамедова Зарина Айдаровна',
      date: '29 сент. 2026',
      startTime: '09:00',
      endTime: '18:00',
      isOpen: false,
      hours: 9,
      department: 'housekeeping',
      hourlyRate: 1500,
    },
    {
      id: 'sh-2',
      employeeName: 'Ержанов Мадияр Болатович',
      date: '29 сент. 2026',
      hasQr: true,
      startTime: '09:00',
      endTime: '18:00',
      isOpen: false,
      hours: 9,
      department: 'parking',
      hourlyRate: 1400,
    },
    {
      id: 'sh-3',
      employeeName: 'Досымов Канат Жанатович',
      date: '29 сент. 2026',
      startTime: '08:00',
      endTime: 'Открыта',
      isOpen: true,
      department: 'finance',
      hourlyRate: 2000,
    },
    {
      id: 'sh-4',
      employeeName: 'Громов Игорь Васильевич',
      date: '29 сент. 2026',
      startTime: '20:00',
      endTime: 'Открыта',
      isOpen: true,
      department: 'reception',
      hourlyRate: 1600,
    },
  ]);

  // ==================== STATE: BOOKINGS & SERVICES (Screenshots 1-5) ====================
  const [managerBookingsSection, setManagerBookingsSection] = useState<'ROOMS' | 'SERVICES'>('ROOMS');
  const [managerRoomsSubTab, setManagerRoomsSubTab] = useState<'CHESS' | 'LIST'>('CHESS');
  const [managerServicesSubTab, setManagerServicesSubTab] = useState<'CATALOG' | 'ORDERS'>('CATALOG');

  // Filter toggle states (user requested: filter button & search in one line, filters hidden until clicked)
  const [showBookingsFilters, setShowBookingsFilters] = useState<boolean>(false);
  const [showCatalogFilters, setShowCatalogFilters] = useState<boolean>(false);
  const [showOrdersFilters, setShowOrdersFilters] = useState<boolean>(false);

  // Search inputs
  const [managerBookingsSearch, setManagerBookingsSearch] = useState<string>('');
  const [catalogSearch, setCatalogSearch] = useState<string>('');
  const [ordersSearch, setOrdersSearch] = useState<string>('');

  // Bookings filters
  const [bookingCategoryFilter, setBookingCategoryFilter] = useState<string>('Все категории');
  const [bookingGuestsFilter, setBookingGuestsFilter] = useState<string>('Любое количество');
  const [bookingStatusFilter, setBookingStatusFilter] = useState<string>('Все статусы');
  const [currentWeekIndex, setCurrentWeekIndex] = useState<number>(0);

  // Services filters
  const [catalogAvailabilityFilter, setCatalogAvailabilityFilter] = useState<string>('Все услуги');
  const [catalogResponsibleFilter, setCatalogResponsibleFilter] = useState<string>('Все');
  const [orderStatusFilter, setOrderStatusFilter] = useState<string>('Все статусы');
  const [orderPaymentFilter, setOrderPaymentFilter] = useState<string>('Любая');

  // Accordion & Modals
  const [addServiceOpen, setAddServiceOpen] = useState<boolean>(false);
  const [expandedServiceManageId, setExpandedServiceManageId] = useState<string | null>(null);
  const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null);
  const [bookingServiceModalItem, setBookingServiceModalItem] = useState<any | null>(null);
  const [serviceBookingGuest, setServiceBookingGuest] = useState<string>('Тимур Беков · №101');
  const [serviceBookingTime, setServiceBookingTime] = useState<string>('18:00');

  // Add new service form
  const [newServiceName, setNewServiceName] = useState<string>('');
  const [newServiceDesc, setNewServiceDesc] = useState<string>('');
  const [newServiceResponsible, setNewServiceResponsible] = useState<string>('porter');
  const [newServicePrice, setNewServicePrice] = useState<string>('');

  // Bookings Data (Screenshots 1 & 2)
  interface ManagerBookingItem {
    id: string;
    bookingNumber: string;
    guestName: string;
    shortName: string;
    roomNumber: string;
    category: 'Lux' | 'Стандарт' | 'Комфорт';
    guestsCount: number;
    datesText: string;
    nightsText: string;
    nights: number;
    status: 'NEW' | 'CONFIRMED' | 'CHECKED_IN' | 'CHECKED_OUT';
    statusRu: 'Новая' | 'Подтверждена' | 'Заселён' | 'Выехал';
    amount: string;
    phone: string;
    startDay: number;
    endDay: number;
    source?: string;
  }

  const [selectedBookingForModal, setSelectedBookingForModal] = useState<ManagerBookingItem | null>(null);

  const [managerBookings, setManagerBookings] = useState<ManagerBookingItem[]>([
    {
      id: 'mb-1',
      bookingNumber: 'BR-8831',
      guestName: 'Салтанат Абдрахманова',
      shortName: 'Абдрахманова С.',
      roomNumber: '№303',
      category: 'Lux',
      guestsCount: 2,
      datesText: '16 нояб. → 19 нояб.',
      nightsText: '3 ночи',
      nights: 3,
      status: 'CONFIRMED',
      statusRu: 'Подтверждена',
      amount: '155 000 ₸',
      phone: '+7 (702) 555-31-51',
      startDay: 16,
      endDay: 19,
      source: 'Прямая бронь',
    },
    {
      id: 'mb-2',
      bookingNumber: 'BR-8832',
      guestName: 'Тимур Беков',
      shortName: 'Беков Т.',
      roomNumber: '№101',
      category: 'Стандарт',
      guestsCount: 2,
      datesText: '16 нояб. → 18 нояб.',
      nightsText: '3 ночи',
      nights: 2,
      status: 'CHECKED_IN',
      statusRu: 'Заселён',
      amount: '32 000 ₸',
      phone: '+7 (701) 450-12-88',
      startDay: 16,
      endDay: 18,
      source: 'Booking.com',
    },
    {
      id: 'mb-3',
      bookingNumber: 'BR-8833',
      guestName: 'Алия Нуржанова',
      shortName: 'Нуржанова А.',
      roomNumber: '№201',
      category: 'Комфорт',
      guestsCount: 3,
      datesText: '18 нояб. → 21 нояб.',
      nightsText: '3 ночи',
      nights: 3,
      status: 'NEW',
      statusRu: 'Новая',
      amount: '68 000 ₸',
      phone: '+7 (777) 321-44-55',
      startDay: 18,
      endDay: 21,
      source: 'Прямая бронь',
    },
    {
      id: 'mb-4',
      bookingNumber: 'BR-8834',
      guestName: 'Марат Омаров',
      shortName: 'Омаров М.',
      roomNumber: '№102',
      category: 'Стандарт',
      guestsCount: 1,
      datesText: '15 нояб. → 17 нояб.',
      nightsText: '2 ночи',
      nights: 2,
      status: 'CHECKED_OUT',
      statusRu: 'Выехал',
      amount: '45 000 ₸',
      phone: '+7 (705) 112-90-88',
      startDay: 15,
      endDay: 17,
      source: 'От стойки',
    },
  ]);

  // Catalog Services Data (Screenshots 3 & 4)
  interface CatalogServiceItem {
    id: string;
    title: string;
    description: string;
    responsible: string;
    price: string;
    numericPrice: number;
    isAvailable: boolean;
  }

  const [catalogServices, setCatalogServices] = useState<CatalogServiceItem[]>([
    {
      id: 'cs-1',
      title: 'Трансфер из аэропорта',
      description: 'Встреча в аэропорту Павлодара, седан бизнес-класса',
      responsible: 'porter',
      price: '8 000 ₸',
      numericPrice: 8000,
      isAvailable: true,
    },
    {
      id: 'cs-2',
      title: 'Прачечная (экспресс)',
      description: 'Стирка и глажка в течение 4 часов',
      responsible: 'Бекова Гульнара Ерлановна',
      price: '3 500 ₸',
      numericPrice: 3500,
      isAvailable: true,
    },
    {
      id: 'cs-3',
      title: 'Массаж спины 40 мин',
      description: 'Релаксирующий или оздоровительный массаж в спа-зоне',
      responsible: 'Ербол Нуржанов',
      price: '15 000 ₸',
      numericPrice: 15000,
      isAvailable: true,
    },
    {
      id: 'cs-4',
      title: 'Завтрак "Шведский стол" в номер',
      description: 'Горячий завтрак, свежая выпечка, кофе/чай',
      responsible: 'Ресторан Sollviera',
      price: '4 500 ₸',
      numericPrice: 4500,
      isAvailable: true,
    },
  ]);

  // Service Orders Data (Screenshot 5)
  interface ServiceOrderItem {
    id: string;
    orderNumber: string;
    serviceTitle: string;
    guestName: string;
    roomNumber: string;
    dateTimeText: string;
    price: string;
    numericPrice: number;
    status: 'CONFIRMED' | 'DONE' | 'IN_PROGRESS' | 'CANCELLED';
    statusRu: 'Подтверждена' | 'Выполнена' | 'В работе' | 'Отменена';
    isPaid: boolean;
  }

  const [serviceOrders, setServiceOrders] = useState<ServiceOrderItem[]>([
    {
      id: 'so-1',
      orderNumber: '№81',
      serviceTitle: 'Трансфер из аэропорта',
      guestName: 'Тимур Беков',
      roomNumber: '№101',
      dateTimeText: '16 нояб. · 18:00',
      price: '8 000 ₸',
      numericPrice: 8000,
      status: 'CONFIRMED',
      statusRu: 'Подтверждена',
      isPaid: false,
    },
    {
      id: 'so-2',
      orderNumber: '№82',
      serviceTitle: 'Прачечная (экспресс)',
      guestName: 'Данияр Амиров',
      roomNumber: '№202',
      dateTimeText: '16 нояб. · 12:00',
      price: '3 500 ₸',
      numericPrice: 3500,
      status: 'DONE',
      statusRu: 'Выполнена',
      isPaid: false,
    },
    {
      id: 'so-3',
      orderNumber: '№83',
      serviceTitle: 'Массаж спины 40 мин',
      guestName: 'Ербол Нуржанов',
      roomNumber: '№203',
      dateTimeText: '16 нояб. · 16:30',
      price: '15 000 ₸',
      numericPrice: 15000,
      status: 'IN_PROGRESS',
      statusRu: 'В работе',
      isPaid: false,
    },
  ]);

  // ==================== STATE: WAREHOUSE (Screenshots 1 & 2) ====================
  interface WarehouseItem {
    id: string;
    name: string;
    category: string;
    location: string;
    currentQuantity: number;
    minQuantity: number;
    unit: string;
  }

  const [warehouseSubTab, setWarehouseSubTab] = useState<'ALL' | 'REPLENISH'>('ALL');
  const [warehouseSearch, setWarehouseSearch] = useState<string>('');
  const [warehouseCategoryFilter, setWarehouseCategoryFilter] = useState<string>('Все категории');
  const [showWarehouseFilter, setShowWarehouseFilter] = useState<boolean>(false);
  const [replenishModalItem, setReplenishModalItem] = useState<WarehouseItem | null>(null);
  const [replenishAmount, setReplenishAmount] = useState<string>('');

  const [warehouseItems, setWarehouseItems] = useState<WarehouseItem[]>([
    {
      id: 'wh-1',
      name: 'Полотенце банное',
      category: 'Текстиль',
      location: 'Этаж 1 · бельевая',
      currentQuantity: 18,
      minQuantity: 30,
      unit: 'шт.',
    },
    {
      id: 'wh-2',
      name: 'Шампунь 30 мл',
      category: 'Косметика',
      location: 'Основной склад',
      currentQuantity: 12,
      minQuantity: 40,
      unit: 'шт.',
    },
    {
      id: 'wh-3',
      name: 'Вода 0,5 л',
      category: 'Мини-бар',
      location: 'Основной склад',
      currentQuantity: 15,
      minQuantity: 50,
      unit: 'шт.',
    },
    {
      id: 'wh-4',
      name: 'Постельное белье (евро)',
      category: 'Текстиль',
      location: 'Этаж 2 · бельевая',
      currentQuantity: 45,
      minQuantity: 30,
      unit: 'компл.',
    },
    {
      id: 'wh-5',
      name: 'Мыло кусковое 20 г',
      category: 'Косметика',
      location: 'Основной склад',
      currentQuantity: 85,
      minQuantity: 50,
      unit: 'шт.',
    },
    {
      id: 'wh-6',
      name: 'Тапочки одноразовые',
      category: 'Расходники',
      location: 'Основной склад',
      currentQuantity: 120,
      minQuantity: 60,
      unit: 'пар',
    },
  ]);

  // Unpaid Bookings Data (matching Screenshot 4)
  const unpaidBookings: UnpaidBooking[] = [
    {
      id: 'ub-1',
      guestName: 'Салтанат Абдрахманова',
      roomNumber: '№303',
      category: 'Lux',
      dates: '16 нояб. → 19 нояб.',
      amount: '155 000 ₸',
      numericAmount: 155000,
      phone: '+7 (701) 450-12-88',
    },
    {
      id: 'ub-2',
      guestName: 'Тимур Беков',
      roomNumber: '№101',
      category: 'Стандарт',
      dates: '16 нояб. → 18 нояб.',
      amount: '32 000 ₸',
      numericAmount: 32000,
      phone: '+7 (702) 880-14-22',
    },
    {
      id: 'ub-3',
      guestName: 'Данияр Амиров',
      roomNumber: '№202',
      category: 'Комфорт',
      dates: '17 нояб. → 20 нояб.',
      amount: '18 000 ₸',
      numericAmount: 18000,
      phone: '+7 (777) 310-90-55',
    },
  ];

  // Unpaid Services Data (matching Screenshot 5)
  const unpaidServices: UnpaidService[] = [
    {
      id: 'us-1',
      guestName: 'Тимур Беков',
      roomNumber: '№101',
      serviceName: 'Трансфер из аэропорта',
      date: '16 нояб.',
      status: 'Не оплачено',
      amount: '8 000 ₸',
      numericAmount: 8000,
    },
    {
      id: 'us-2',
      guestName: 'Данияр Амиров',
      roomNumber: '№202',
      serviceName: 'Прачечная (экспресс)',
      date: '16 нояб.',
      status: 'Не оплачено',
      amount: '3 500 ₸',
      numericAmount: 3500,
    },
    {
      id: 'us-3',
      guestName: 'Ербол Нуржанов',
      roomNumber: '№203',
      serviceName: 'Массаж спины 40 мин',
      date: '16 нояб.',
      status: 'Не оплачено',
      amount: '15 000 ₸',
      numericAmount: 15000,
    },
    {
      id: 'us-4',
      guestName: 'Сергей Петров',
      roomNumber: '№102',
      serviceName: 'Прачечная (экспресс)',
      date: '16 нояб.',
      status: 'Не оплачено',
      amount: '3 500 ₸',
      numericAmount: 3500,
    },
  ];

  // Trigger feedback banner
  const triggerNotification = (text: string) => {
    setActionAlert(text);
    setTimeout(() => setActionAlert(null), 3000);
  };

  // =========================================================================
  // SCREEN 4: ОЖИДАЕТ ОПЛАТЫ (БРОНИ) - SCREENSHOT 4
  // =========================================================================
  const renderUnpaidBookingsScreen = () => {
    const filtered = unpaidBookings.filter((b) => {
      const q = searchUnpaidBookings.toLowerCase().trim();
      if (!q) return true;
      return (
        b.guestName.toLowerCase().includes(q) ||
        b.roomNumber.toLowerCase().includes(q) ||
        b.phone.includes(q) ||
        b.category.toLowerCase().includes(q)
      );
    });

    return (
      <div className="flex-1 flex flex-col bg-[#FAF7F3] overflow-hidden select-none">
        {/* Header (Screenshot 4) */}
        <div className="px-5 pt-7 pb-3 bg-[#FAF7F3] shrink-0">
          <h1 className="text-2xl font-serif font-medium text-[#241E1A] leading-tight">
            {t('Ожидает оплаты', 'Awaiting Payment')}
          </h1>
          <p className="text-xs text-[#8A8177] font-sans mt-0.5">
            {t('Брони · остаток 205 000 ₸', 'Bookings · balance 205,000 ₸')}
          </p>

          <button
            type="button"
            onClick={() => setActiveUnpaidView('NONE')}
            className="flex items-center gap-1.5 text-xs text-[#8A8177] hover:text-[#241E1A] font-sans transition-colors cursor-pointer mt-3"
          >
            <ChevronLeft className="h-4 w-4" />
            <span>{t('Дашборд', 'Dashboard')}</span>
          </button>
        </div>

        {/* Scrollable Container */}
        <div className="flex-1 overflow-y-auto px-5 pb-6 space-y-3.5 no-scrollbar">
          {/* Search Bar */}
          <div className="relative">
            <input
              type="text"
              placeholder={t('Гость, номер или телефон', 'Guest, room or phone')}
              value={searchUnpaidBookings}
              onChange={(e) => setSearchUnpaidBookings(e.target.value)}
              className="w-full bg-white border border-[#E5E2DD] rounded-2xl pl-10 pr-4 py-2.5 text-xs text-[#241E1A] placeholder-[#8A8177]/80 focus:outline-none focus:ring-1 focus:ring-[#C2410C] font-sans shadow-2xs h-11"
            />
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[#8A8177]" />
            {searchUnpaidBookings && (
              <button
                type="button"
                onClick={() => setSearchUnpaidBookings('')}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs text-[#8A8177] hover:text-[#241E1A]"
              >
                ✕
              </button>
            )}
          </div>

          {/* List of cards */}
          <div className="space-y-3">
            {filtered.map((item) => (
              <div
                key={item.id}
                className="bg-white rounded-2xl border border-[#E5E2DD] p-4.5 shadow-2xs space-y-2 hover:border-[#241E1A]/20 transition-all"
              >
                {/* Top Row: Name + Amount */}
                <div className="flex items-start justify-between gap-2">
                  <h3 className="text-sm font-sans font-medium text-[#241E1A]">
                    {item.guestName}
                  </h3>
                  <span className="text-sm font-sans font-medium text-[#C2410C] shrink-0">
                    {item.amount}
                  </span>
                </div>

                {/* Middle Row: Room · Category · Dates */}
                <p className="text-xs text-[#8A8177] font-sans">
                  {item.roomNumber} · {item.category} · {item.dates}
                </p>

                {/* Bottom Row: Remaining label + Call button */}
                <div className="flex items-center justify-between pt-1">
                  <span className="text-[11px] text-[#8A8177] font-sans">
                    Остаток к оплате
                  </span>
                  <a
                    href={`tel:${item.phone}`}
                    onClick={(e) => {
                      triggerNotification(`Вызов: ${item.guestName} (${item.phone})`);
                    }}
                    className="text-[11px] text-[#C2410C] font-sans font-medium flex items-center gap-1.5 hover:underline cursor-pointer"
                  >
                    <Phone className="h-3.5 w-3.5" />
                    <span>Позвонить</span>
                  </a>
                </div>
              </div>
            ))}

            {filtered.length === 0 && (
              <div className="p-8 text-center text-xs text-[#8A8177] font-sans bg-white rounded-2xl border border-[#E5E2DD]">
                Ничего не найдено по запросу «{searchUnpaidBookings}»
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  // =========================================================================
  // SCREEN 5: ОЖИДАЕТ ОПЛАТЫ (УСЛУГИ) - SCREENSHOT 5
  // =========================================================================
  const renderUnpaidServicesScreen = () => {
    const filtered = unpaidServices.filter((s) => {
      const q = searchUnpaidServices.toLowerCase().trim();
      if (!q) return true;
      return (
        s.guestName.toLowerCase().includes(q) ||
        s.roomNumber.toLowerCase().includes(q) ||
        s.serviceName.toLowerCase().includes(q)
      );
    });

    return (
      <div className="flex-1 flex flex-col bg-[#FAF7F3] overflow-hidden select-none">
        {/* Header (Screenshot 5) */}
        <div className="px-5 pt-7 pb-3 bg-[#FAF7F3] shrink-0">
          <h1 className="text-2xl font-serif font-medium text-[#241E1A] leading-tight">
            {t('Ожидает оплаты', 'Awaiting Payment')}
          </h1>
          <p className="text-xs text-[#8A8177] font-sans mt-0.5">
            {t('Услуги · остаток 30 000 ₸', 'Services · balance 30,000 ₸')}
          </p>

          <button
            type="button"
            onClick={() => setActiveUnpaidView('NONE')}
            className="flex items-center gap-1.5 text-xs text-[#8A8177] hover:text-[#241E1A] font-sans transition-colors cursor-pointer mt-3"
          >
            <ChevronLeft className="h-4 w-4" />
            <span>{t('Дашборд', 'Dashboard')}</span>
          </button>
        </div>

        {/* Scrollable Container */}
        <div className="flex-1 overflow-y-auto px-5 pb-6 space-y-3.5 no-scrollbar">
          {/* Search Bar */}
          <div className="relative">
            <input
              type="text"
              placeholder={t('Гость или услуга', 'Guest or service')}
              value={searchUnpaidServices}
              onChange={(e) => setSearchUnpaidServices(e.target.value)}
              className="w-full bg-white border border-[#E5E2DD] rounded-2xl pl-10 pr-4 py-2.5 text-xs text-[#241E1A] placeholder-[#8A8177]/80 focus:outline-none focus:ring-1 focus:ring-[#C2410C] font-sans shadow-2xs h-11"
            />
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[#8A8177]" />
            {searchUnpaidServices && (
              <button
                type="button"
                onClick={() => setSearchUnpaidServices('')}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs text-[#8A8177] hover:text-[#241E1A]"
              >
                ✕
              </button>
            )}
          </div>

          {/* List of cards */}
          <div className="space-y-3">
            {filtered.map((item) => (
              <div
                key={item.id}
                className="bg-white rounded-2xl border border-[#E5E2DD] p-4.5 shadow-2xs space-y-2 hover:border-[#241E1A]/20 transition-all"
              >
                {/* Top Row: Name + Amount */}
                <div className="flex items-start justify-between gap-2">
                  <h3 className="text-sm font-sans font-medium text-[#241E1A]">
                    {item.guestName}
                  </h3>
                  <span className="text-sm font-sans font-medium text-[#C2410C] shrink-0">
                    {item.amount}
                  </span>
                </div>

                {/* Middle Row: Room · Service Name */}
                <p className="text-xs text-[#8A8177] font-sans">
                  {item.roomNumber} · {item.serviceName}
                </p>

                {/* Bottom Row: Date · Status + Проверить > */}
                <div className="flex items-center justify-between pt-1">
                  <span className="text-[11px] text-[#8A8177] font-sans">
                    {item.date} · {item.status}
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      triggerNotification(`Проверка заявки услуги ${item.serviceName} (${item.roomNumber})`);
                    }}
                    className="text-[11px] text-[#C2410C] font-sans font-medium flex items-center gap-0.5 hover:underline cursor-pointer"
                  >
                    <span>Проверить</span>
                    <ChevronRight className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            ))}

            {filtered.length === 0 && (
              <div className="p-8 text-center text-xs text-[#8A8177] font-sans bg-white rounded-2xl border border-[#E5E2DD]">
                Ничего не найдено по запросу «{searchUnpaidServices}»
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  // =========================================================================
  // SUB-TAB 2: ОТЧЁТЫ (REPORTS) - SCREENSHOTS 1-5
  // =========================================================================
  const toggleColumn = (colName: string) => {
    setSelectedColumns((prev) =>
      prev.includes(colName) ? prev.filter((c) => c !== colName) : [...prev, colName]
    );
  };

  const selectAllColumns = () => {
    setSelectedColumns([...ALL_REPORT_COLUMNS]);
  };

  const deselectAllColumns = () => {
    setSelectedColumns([]);
  };

  const renderReportsView = () => {
    // Generated Report Table View
    if (generatedReportView) {
      return (
        <div className="flex-1 overflow-y-auto px-5 pb-6 space-y-4 no-scrollbar select-none">
          <div className="flex items-center justify-between">
            <button
              type="button"
              onClick={() => setGeneratedReportView(false)}
              className="flex items-center gap-1.5 text-xs text-[#8A8177] hover:text-[#241E1A] font-sans transition-colors cursor-pointer"
            >
              <ChevronLeft className="h-4 w-4" />
              <span>Параметры отчёта</span>
            </button>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => triggerNotification('Экспорт отчёта в Excel...')}
                className="px-2.5 py-1 rounded-lg bg-white border border-[#E5E2DD] text-[11px] font-sans text-[#241E1A] hover:bg-slate-50 flex items-center gap-1 cursor-pointer"
              >
                <Download className="h-3.5 w-3.5 text-[#C2410C]" />
                <span>Excel</span>
              </button>
              <button
                type="button"
                onClick={() => triggerNotification('Формирование PDF документа...')}
                className="px-2.5 py-1 rounded-lg bg-white border border-[#E5E2DD] text-[11px] font-sans text-[#241E1A] hover:bg-slate-50 flex items-center gap-1 cursor-pointer"
              >
                <FileText className="h-3.5 w-3.5 text-[#C2410C]" />
                <span>PDF</span>
              </button>
            </div>
          </div>

          <div className="space-y-1">
            <h2 className="text-lg font-serif font-medium text-[#241E1A] leading-tight">
              {reportType}
            </h2>
            <p className="text-xs text-[#8A8177] font-sans">
              Период: {reportDateFrom} – {reportDateTo} · Шаблон: {reportTemplate}
            </p>
          </div>

          {/* Horizontally scrollable data table with only selected columns */}
          <div className="bg-white rounded-2xl border border-[#E5E2DD] shadow-2xs overflow-hidden">
            <div className="overflow-x-auto no-scrollbar">
              <table className="w-full text-left text-xs font-sans whitespace-nowrap">
                <thead className="bg-[#FAF7F3] border-b border-[#E5E2DD] text-[#8A8177] text-[11px]">
                  <tr>
                    {selectedColumns.map((col) => (
                      <th key={col} className="px-3.5 py-3 font-medium">
                        {col}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E5E2DD]/60 text-[#241E1A]">
                  <tr className="hover:bg-slate-50/70 transition-colors">
                    {selectedColumns.map((col) => {
                      if (col === 'Дата') return <td key={col} className="px-3.5 py-3">01.11 – 30.11</td>;
                      if (col === 'Категория номера') return <td key={col} className="px-3.5 py-3 font-medium">Стандарт</td>;
                      if (col === 'Номер') return <td key={col} className="px-3.5 py-3">101–112</td>;
                      if (col === 'Номеров') return <td key={col} className="px-3.5 py-3">12</td>;
                      if (col === 'Доступно ночей') return <td key={col} className="px-3.5 py-3">360</td>;
                      if (col === 'Занято ночей') return <td key={col} className="px-3.5 py-3">252</td>;
                      if (col === 'Загрузка, %') return <td key={col} className="px-3.5 py-3 font-medium text-[#5B8C6E]">70,0%</td>;
                      if (col === 'Заезды') return <td key={col} className="px-3.5 py-3">48</td>;
                      if (col === 'Выезды') return <td key={col} className="px-3.5 py-3">44</td>;
                      if (col === 'Гости') return <td key={col} className="px-3.5 py-3">64</td>;
                      if (col === 'Доход') return <td key={col} className="px-3.5 py-3 font-medium text-[#C2410C]">5 040 000 ₸</td>;
                      if (col === 'ADR') return <td key={col} className="px-3.5 py-3">20 000 ₸</td>;
                      if (col === 'RevPAR') return <td key={col} className="px-3.5 py-3">14 000 ₸</td>;
                      return <td key={col} className="px-3.5 py-3">—</td>;
                    })}
                  </tr>
                  <tr className="hover:bg-slate-50/70 transition-colors">
                    {selectedColumns.map((col) => {
                      if (col === 'Дата') return <td key={col} className="px-3.5 py-3">01.11 – 30.11</td>;
                      if (col === 'Категория номера') return <td key={col} className="px-3.5 py-3 font-medium">Комфорт</td>;
                      if (col === 'Номер') return <td key={col} className="px-3.5 py-3">201–208</td>;
                      if (col === 'Номеров') return <td key={col} className="px-3.5 py-3">8</td>;
                      if (col === 'Доступно ночей') return <td key={col} className="px-3.5 py-3">240</td>;
                      if (col === 'Занято ночей') return <td key={col} className="px-3.5 py-3">168</td>;
                      if (col === 'Загрузка, %') return <td key={col} className="px-3.5 py-3 font-medium text-[#5B8C6E]">70,0%</td>;
                      if (col === 'Заезды') return <td key={col} className="px-3.5 py-3">32</td>;
                      if (col === 'Выезды') return <td key={col} className="px-3.5 py-3">30</td>;
                      if (col === 'Гости') return <td key={col} className="px-3.5 py-3">42</td>;
                      if (col === 'Доход') return <td key={col} className="px-3.5 py-3 font-medium text-[#C2410C]">4 200 000 ₸</td>;
                      if (col === 'ADR') return <td key={col} className="px-3.5 py-3">25 000 ₸</td>;
                      if (col === 'RevPAR') return <td key={col} className="px-3.5 py-3">17 500 ₸</td>;
                      return <td key={col} className="px-3.5 py-3">—</td>;
                    })}
                  </tr>
                  <tr className="hover:bg-slate-50/70 transition-colors">
                    {selectedColumns.map((col) => {
                      if (col === 'Дата') return <td key={col} className="px-3.5 py-3">01.11 – 30.11</td>;
                      if (col === 'Категория номера') return <td key={col} className="px-3.5 py-3 font-medium">Люкс</td>;
                      if (col === 'Номер') return <td key={col} className="px-3.5 py-3">301–304</td>;
                      if (col === 'Номеров') return <td key={col} className="px-3.5 py-3">4</td>;
                      if (col === 'Доступно ночей') return <td key={col} className="px-3.5 py-3">120</td>;
                      if (col === 'Занято ночей') return <td key={col} className="px-3.5 py-3">78</td>;
                      if (col === 'Загрузка, %') return <td key={col} className="px-3.5 py-3 font-medium text-[#5B8C6E]">65,0%</td>;
                      if (col === 'Заезды') return <td key={col} className="px-3.5 py-3">16</td>;
                      if (col === 'Выезды') return <td key={col} className="px-3.5 py-3">14</td>;
                      if (col === 'Гости') return <td key={col} className="px-3.5 py-3">22</td>;
                      if (col === 'Доход') return <td key={col} className="px-3.5 py-3 font-medium text-[#C2410C]">3 900 000 ₸</td>;
                      if (col === 'ADR') return <td key={col} className="px-3.5 py-3">50 000 ₸</td>;
                      if (col === 'RevPAR') return <td key={col} className="px-3.5 py-3">32 500 ₸</td>;
                      return <td key={col} className="px-3.5 py-3">—</td>;
                    })}
                  </tr>
                </tbody>
                <tfoot className="bg-[#FAF7F3] border-t-2 border-[#E5E2DD] text-[#241E1A] font-medium text-xs">
                  <tr>
                    {selectedColumns.map((col) => {
                      if (col === 'Дата') return <td key={col} className="px-3.5 py-3">Итого</td>;
                      if (col === 'Категория номера') return <td key={col} className="px-3.5 py-3">Все категории</td>;
                      if (col === 'Номер') return <td key={col} className="px-3.5 py-3">Всего 24</td>;
                      if (col === 'Номеров') return <td key={col} className="px-3.5 py-3">24</td>;
                      if (col === 'Доступно ночей') return <td key={col} className="px-3.5 py-3">720</td>;
                      if (col === 'Занято ночей') return <td key={col} className="px-3.5 py-3">498</td>;
                      if (col === 'Загрузка, %') return <td key={col} className="px-3.5 py-3 font-bold text-[#5B8C6E]">69,2%</td>;
                      if (col === 'Заезды') return <td key={col} className="px-3.5 py-3">96</td>;
                      if (col === 'Выезды') return <td key={col} className="px-3.5 py-3">88</td>;
                      if (col === 'Гости') return <td key={col} className="px-3.5 py-3">128</td>;
                      if (col === 'Доход') return <td key={col} className="px-3.5 py-3 font-bold text-[#C2410C]">13 140 000 ₸</td>;
                      if (col === 'ADR') return <td key={col} className="px-3.5 py-3">26 385 ₸</td>;
                      if (col === 'RevPAR') return <td key={col} className="px-3.5 py-3">18 250 ₸</td>;
                      return <td key={col} className="px-3.5 py-3">—</td>;
                    })}
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setGeneratedReportView(false)}
            className="w-full py-3.5 rounded-2xl bg-white border border-[#E5E2DD] text-xs font-sans text-[#241E1A] hover:bg-slate-50 transition-colors cursor-pointer text-center"
          >
            Изменить параметры отчёта
          </button>
        </div>
      );
    }

    // Reports Filter Form View (Screenshots 1-5)
    return (
      <div className="flex-1 overflow-y-auto px-5 pb-6 space-y-3.5 no-scrollbar select-none">
        {/* ================= CARD 1: DATES, TYPE, TEMPLATE, CHECKBOX (Screenshot 1) ================= */}
        <div className="bg-white rounded-2xl border border-[#E5E2DD] p-4.5 space-y-4 shadow-2xs">
          {/* Row 1: С and По */}
          <div className="grid grid-cols-2 gap-3">
            {/* Field С */}
            <div>
              <label className="block text-xs font-sans text-[#8A8177] mb-1.5">
                С
              </label>
              <div className="relative bg-white border border-[#E5E2DD] rounded-xl px-3 py-2.5 flex items-center justify-between">
                <input
                  type="text"
                  value={reportDateFrom}
                  onChange={(e) => setReportDateFrom(e.target.value)}
                  className="w-full bg-transparent text-xs font-sans text-[#241E1A] focus:outline-none"
                />
                <Calendar className="h-4 w-4 text-[#241E1A] shrink-0 pointer-events-none" />
              </div>
            </div>

            {/* Field По */}
            <div>
              <label className="block text-xs font-sans text-[#8A8177] mb-1.5">
                По
              </label>
              <div className="relative bg-white border border-[#E5E2DD] rounded-xl px-3 py-2.5 flex items-center justify-between">
                <input
                  type="text"
                  value={reportDateTo}
                  onChange={(e) => setReportDateTo(e.target.value)}
                  className="w-full bg-transparent text-xs font-sans text-[#241E1A] focus:outline-none"
                />
                <Calendar className="h-4 w-4 text-[#241E1A] shrink-0 pointer-events-none" />
              </div>
            </div>
          </div>

          {/* Field 2: Тип отчёта */}
          <div>
            <label className="block text-xs font-sans text-[#8A8177] mb-1.5">
              Тип отчёта
            </label>
            <div className="relative bg-white border border-[#E5E2DD] rounded-xl px-3.5 py-3 flex items-center justify-between">
              <select
                value={reportType}
                onChange={(e) => setReportType(e.target.value)}
                className="w-full bg-transparent text-xs font-sans text-[#241E1A] focus:outline-none appearance-none cursor-pointer pr-6"
              >
                <option value="ST003 · Загрузка за период">ST003 · Загрузка за период</option>
                <option value="FN001 · Отчёт по доходам и RevPAR">FN001 · Отчёт по доходам и RevPAR</option>
                <option value="FN002 · Кассовый отчёт и платежи">FN002 · Кассовый отчёт и платежи</option>
                <option value="OP001 · Заезды и выезды гостей">OP001 · Заезды и выезды гостей</option>
                <option value="OP002 · Отчёт по отменам и No-show">OP002 · Отчёт по отменам и No-show</option>
                <option value="SR001 · Реализация дополнительных услуг">SR001 · Реализация дополнительных услуг</option>
              </select>
              <ChevronDown className="h-4 w-4 text-[#241E1A] absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>

          {/* Field 3: Шаблон (Screenshot 4) */}
          <div>
            <label className="block text-xs font-sans text-[#8A8177] mb-1.5">
              Шаблон
            </label>
            <div className="relative bg-white border border-[#E5E2DD] rounded-xl px-3.5 py-3 flex items-center justify-between">
              <select
                value={reportTemplate}
                onChange={(e) => setReportTemplate(e.target.value)}
                className="w-full bg-transparent text-xs font-sans text-[#241E1A] focus:outline-none appearance-none cursor-pointer pr-6"
              >
                <option value="По категории номера">По категории номера</option>
                <option value="По номеру">По номеру</option>
                <option value="По дням">По дням</option>
                <option value="Только итоги">Только итоги</option>
              </select>
              <ChevronDown className="h-4 w-4 text-[#241E1A] absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>

          {/* Field 4: Checkbox Исключить негарантированные группы */}
          <div
            onClick={() => setExcludeNonGuaranteed(!excludeNonGuaranteed)}
            className="flex items-center gap-3 pt-1 cursor-pointer"
          >
            <div
              className={`h-5 w-5 rounded-[5px] flex items-center justify-center shrink-0 transition-colors ${
                excludeNonGuaranteed
                  ? 'bg-[#C2410C] text-white'
                  : 'border border-[#D4CECA] bg-white'
              }`}
            >
              {excludeNonGuaranteed && <Check className="h-3.5 w-3.5 stroke-[2.5]" />}
            </div>
            <span className="text-xs font-sans text-[#241E1A]">
              Исключить негарантированные группы
            </span>
          </div>
        </div>

        {/* ================= CARD 2: СТОЛБЦЫ ОТЧЁТА · 13 (Screenshots 1 & 2) ================= */}
        <div className="bg-white rounded-2xl border border-[#E5E2DD] shadow-2xs overflow-hidden">
          <button
            type="button"
            onClick={() => setReportColumnsOpen(!reportColumnsOpen)}
            className="w-full p-4 flex items-center justify-between text-left hover:bg-[#FAF7F3]/40 transition-colors cursor-pointer"
          >
            <span className="text-xs font-sans font-medium text-[#241E1A]">
              Столбцы отчёта · {selectedColumns.length}
            </span>
            <ChevronDown
              className={`h-4 w-4 text-[#8A8177] transition-transform duration-200 ${
                reportColumnsOpen ? 'rotate-180' : ''
              }`}
            />
          </button>

          {/* Expanded Column Pickers (Screenshot 2) */}
          {reportColumnsOpen && (
            <div className="border-t border-[#E5E2DD]/50 p-4 space-y-4">
              {/* Select all / Deselect all row in terracotta */}
              <div className="flex items-center justify-between text-xs font-sans font-medium text-[#C2410C]">
                <button
                  type="button"
                  onClick={selectAllColumns}
                  className="hover:underline cursor-pointer"
                >
                  Выбрать все
                </button>
                <button
                  type="button"
                  onClick={deselectAllColumns}
                  className="hover:underline cursor-pointer"
                >
                  Снять
                </button>
              </div>

              {/* 13 Checkboxes arranged in 2 columns exactly matching Screenshot 2 */}
              <div className="grid grid-cols-2 gap-y-4 gap-x-4 pt-1">
                {/* Row 1 */}
                <div
                  onClick={() => toggleColumn('Дата')}
                  className="flex items-center gap-3 cursor-pointer"
                >
                  <div
                    className={`h-5 w-5 rounded-[5px] flex items-center justify-center shrink-0 transition-colors ${
                      selectedColumns.includes('Дата')
                        ? 'bg-[#C2410C] text-white'
                        : 'border border-[#D4CECA] bg-white'
                    }`}
                  >
                    {selectedColumns.includes('Дата') && (
                      <Check className="h-3.5 w-3.5 stroke-[2.5]" />
                    )}
                  </div>
                  <span className="text-xs font-sans text-[#241E1A]">Дата</span>
                </div>

                <div
                  onClick={() => toggleColumn('Категория номера')}
                  className="flex items-center gap-3 cursor-pointer"
                >
                  <div
                    className={`h-5 w-5 rounded-[5px] flex items-center justify-center shrink-0 transition-colors ${
                      selectedColumns.includes('Категория номера')
                        ? 'bg-[#C2410C] text-white'
                        : 'border border-[#D4CECA] bg-white'
                    }`}
                  >
                    {selectedColumns.includes('Категория номера') && (
                      <Check className="h-3.5 w-3.5 stroke-[2.5]" />
                    )}
                  </div>
                  <span className="text-xs font-sans text-[#241E1A]">Категория номера</span>
                </div>

                {/* Row 2 */}
                <div
                  onClick={() => toggleColumn('Номер')}
                  className="flex items-center gap-3 cursor-pointer"
                >
                  <div
                    className={`h-5 w-5 rounded-[5px] flex items-center justify-center shrink-0 transition-colors ${
                      selectedColumns.includes('Номер')
                        ? 'bg-[#C2410C] text-white'
                        : 'border border-[#D4CECA] bg-white'
                    }`}
                  >
                    {selectedColumns.includes('Номер') && (
                      <Check className="h-3.5 w-3.5 stroke-[2.5]" />
                    )}
                  </div>
                  <span className="text-xs font-sans text-[#241E1A]">Номер</span>
                </div>

                <div
                  onClick={() => toggleColumn('Номеров')}
                  className="flex items-center gap-3 cursor-pointer"
                >
                  <div
                    className={`h-5 w-5 rounded-[5px] flex items-center justify-center shrink-0 transition-colors ${
                      selectedColumns.includes('Номеров')
                        ? 'bg-[#C2410C] text-white'
                        : 'border border-[#D4CECA] bg-white'
                    }`}
                  >
                    {selectedColumns.includes('Номеров') && (
                      <Check className="h-3.5 w-3.5 stroke-[2.5]" />
                    )}
                  </div>
                  <span className="text-xs font-sans text-[#241E1A]">Номеров</span>
                </div>

                {/* Row 3 */}
                <div
                  onClick={() => toggleColumn('Доступно ночей')}
                  className="flex items-center gap-3 cursor-pointer"
                >
                  <div
                    className={`h-5 w-5 rounded-[5px] flex items-center justify-center shrink-0 transition-colors ${
                      selectedColumns.includes('Доступно ночей')
                        ? 'bg-[#C2410C] text-white'
                        : 'border border-[#D4CECA] bg-white'
                    }`}
                  >
                    {selectedColumns.includes('Доступно ночей') && (
                      <Check className="h-3.5 w-3.5 stroke-[2.5]" />
                    )}
                  </div>
                  <span className="text-xs font-sans text-[#241E1A]">Доступно ночей</span>
                </div>

                <div
                  onClick={() => toggleColumn('Занято ночей')}
                  className="flex items-center gap-3 cursor-pointer"
                >
                  <div
                    className={`h-5 w-5 rounded-[5px] flex items-center justify-center shrink-0 transition-colors ${
                      selectedColumns.includes('Занято ночей')
                        ? 'bg-[#C2410C] text-white'
                        : 'border border-[#D4CECA] bg-white'
                    }`}
                  >
                    {selectedColumns.includes('Занято ночей') && (
                      <Check className="h-3.5 w-3.5 stroke-[2.5]" />
                    )}
                  </div>
                  <span className="text-xs font-sans text-[#241E1A]">Занято ночей</span>
                </div>

                {/* Row 4 */}
                <div
                  onClick={() => toggleColumn('Загрузка, %')}
                  className="flex items-center gap-3 cursor-pointer"
                >
                  <div
                    className={`h-5 w-5 rounded-[5px] flex items-center justify-center shrink-0 transition-colors ${
                      selectedColumns.includes('Загрузка, %')
                        ? 'bg-[#C2410C] text-white'
                        : 'border border-[#D4CECA] bg-white'
                    }`}
                  >
                    {selectedColumns.includes('Загрузка, %') && (
                      <Check className="h-3.5 w-3.5 stroke-[2.5]" />
                    )}
                  </div>
                  <span className="text-xs font-sans text-[#241E1A]">Загрузка, %</span>
                </div>

                <div
                  onClick={() => toggleColumn('Заезды')}
                  className="flex items-center gap-3 cursor-pointer"
                >
                  <div
                    className={`h-5 w-5 rounded-[5px] flex items-center justify-center shrink-0 transition-colors ${
                      selectedColumns.includes('Заезды')
                        ? 'bg-[#C2410C] text-white'
                        : 'border border-[#D4CECA] bg-white'
                    }`}
                  >
                    {selectedColumns.includes('Заезды') && (
                      <Check className="h-3.5 w-3.5 stroke-[2.5]" />
                    )}
                  </div>
                  <span className="text-xs font-sans text-[#241E1A]">Заезды</span>
                </div>

                {/* Row 5 */}
                <div
                  onClick={() => toggleColumn('Выезды')}
                  className="flex items-center gap-3 cursor-pointer"
                >
                  <div
                    className={`h-5 w-5 rounded-[5px] flex items-center justify-center shrink-0 transition-colors ${
                      selectedColumns.includes('Выезды')
                        ? 'bg-[#C2410C] text-white'
                        : 'border border-[#D4CECA] bg-white'
                    }`}
                  >
                    {selectedColumns.includes('Выезды') && (
                      <Check className="h-3.5 w-3.5 stroke-[2.5]" />
                    )}
                  </div>
                  <span className="text-xs font-sans text-[#241E1A]">Выезды</span>
                </div>

                <div
                  onClick={() => toggleColumn('Гости')}
                  className="flex items-center gap-3 cursor-pointer"
                >
                  <div
                    className={`h-5 w-5 rounded-[5px] flex items-center justify-center shrink-0 transition-colors ${
                      selectedColumns.includes('Гости')
                        ? 'bg-[#C2410C] text-white'
                        : 'border border-[#D4CECA] bg-white'
                    }`}
                  >
                    {selectedColumns.includes('Гости') && (
                      <Check className="h-3.5 w-3.5 stroke-[2.5]" />
                    )}
                  </div>
                  <span className="text-xs font-sans text-[#241E1A]">Гости</span>
                </div>

                {/* Row 6 */}
                <div
                  onClick={() => toggleColumn('Доход')}
                  className="flex items-center gap-3 cursor-pointer"
                >
                  <div
                    className={`h-5 w-5 rounded-[5px] flex items-center justify-center shrink-0 transition-colors ${
                      selectedColumns.includes('Доход')
                        ? 'bg-[#C2410C] text-white'
                        : 'border border-[#D4CECA] bg-white'
                    }`}
                  >
                    {selectedColumns.includes('Доход') && (
                      <Check className="h-3.5 w-3.5 stroke-[2.5]" />
                    )}
                  </div>
                  <span className="text-xs font-sans text-[#241E1A]">Доход</span>
                </div>

                <div
                  onClick={() => toggleColumn('ADR')}
                  className="flex items-center gap-3 cursor-pointer"
                >
                  <div
                    className={`h-5 w-5 rounded-[5px] flex items-center justify-center shrink-0 transition-colors ${
                      selectedColumns.includes('ADR')
                        ? 'bg-[#C2410C] text-white'
                        : 'border border-[#D4CECA] bg-white'
                    }`}
                  >
                    {selectedColumns.includes('ADR') && (
                      <Check className="h-3.5 w-3.5 stroke-[2.5]" />
                    )}
                  </div>
                  <span className="text-xs font-sans text-[#241E1A]">ADR</span>
                </div>

                {/* Row 7 */}
                <div
                  onClick={() => toggleColumn('RevPAR')}
                  className="flex items-center gap-3 cursor-pointer"
                >
                  <div
                    className={`h-5 w-5 rounded-[5px] flex items-center justify-center shrink-0 transition-colors ${
                      selectedColumns.includes('RevPAR')
                        ? 'bg-[#C2410C] text-white'
                        : 'border border-[#D4CECA] bg-white'
                    }`}
                  >
                    {selectedColumns.includes('RevPAR') && (
                      <Check className="h-3.5 w-3.5 stroke-[2.5]" />
                    )}
                  </div>
                  <span className="text-xs font-sans text-[#241E1A]">RevPAR</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* ================= CARD 3: СОРТИРОВКА И КНОПКА (Screenshots 1, 3, 5) ================= */}
        <div className="space-y-3.5">
          {/* Field: Поле сортировки (Screenshot 3) */}
          <div>
            <label className="block text-xs font-sans text-[#8A8177] mb-1.5">
              Поле сортировки
            </label>
            <div className="relative bg-white border border-[#E5E2DD] rounded-xl px-3.5 py-3 flex items-center justify-between shadow-2xs">
              <select
                value={sortField}
                onChange={(e) => setSortField(e.target.value)}
                className="w-full bg-transparent text-xs font-sans text-[#241E1A] focus:outline-none appearance-none cursor-pointer pr-6"
              >
                {ALL_REPORT_COLUMNS.map((col) => (
                  <option key={col} value={col}>
                    {col}
                  </option>
                ))}
              </select>
              <ChevronDown className="h-4 w-4 text-[#241E1A] absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>

          {/* Field: Тип сортировки (Screenshot 5) */}
          <div>
            <label className="block text-xs font-sans text-[#8A8177] mb-1.5">
              Тип сортировки
            </label>
            <div className="relative bg-white border border-[#E5E2DD] rounded-xl px-3.5 py-3 flex items-center justify-between shadow-2xs">
              <select
                value={sortOrder}
                onChange={(e) => setSortOrder(e.target.value)}
                className="w-full bg-transparent text-xs font-sans text-[#241E1A] focus:outline-none appearance-none cursor-pointer pr-6"
              >
                <option value="По возрастанию">По возрастанию</option>
                <option value="По убыванию">По убыванию</option>
              </select>
              <ChevronDown className="h-4 w-4 text-[#241E1A] absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>

          {/* Bottom Action Button (Screenshot 5) */}
          <button
            type="button"
            onClick={() => {
              if (selectedColumns.length === 0) {
                triggerNotification('Выберите хотя бы один столбец для отчёта');
                return;
              }
              triggerNotification(`Формирование отчёта «${reportType}»...`);
              setGeneratedReportView(true);
            }}
            className="w-full bg-[#C2410C] hover:bg-[#A93A0C] text-white font-sans font-medium text-sm py-3.5 rounded-2xl shadow-xs transition-all cursor-pointer text-center active:scale-[0.99] mt-2"
          >
            Сформировать отчёт
          </button>
        </div>
      </div>
    );
  };

  // =========================================================================
  // SUB-TAB 1: ДАШБОРД (DASHBOARD) - SCREENSHOTS 1, 2, 3
  // =========================================================================
  const renderDashboardView = () => {
    return (
      <div className="flex-1 overflow-y-auto px-5 pb-6 space-y-5 no-scrollbar select-none">
        {/* ================= SECTION 1: ОПЕРАЦИОННЫЙ СТАТУС (Screenshot 1) ================= */}
        <div className="space-y-2.5">
          {/* Header Row */}
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-sans font-medium text-[#241E1A]">
              Операционный статус
            </h2>
            <span className="text-[10px] font-sans text-[#8A8177]">
              Сегодня · 16 ноября
            </span>
          </div>

          {/* 4 Cards (2x2 Grid) */}
          <div className="grid grid-cols-2 gap-2.5">
            {/* Card 1: Проживают */}
            <div className="bg-white rounded-2xl border border-[#E5E2DD] p-3.5 shadow-2xs relative flex flex-col justify-between min-h-[118px]">
              <div className="flex items-center justify-between">
                <Bed className="h-4.5 w-4.5 text-[#C2410C]" strokeWidth={2} />
                <ChevronRight className="h-3.5 w-3.5 text-[#8A8177]/60" />
              </div>
              <div>
                <div className="text-3xl font-serif font-medium text-[#241E1A] leading-none mb-1.5">
                  8
                </div>
                <h4 className="text-xs font-sans font-medium text-[#241E1A]">
                  Проживают
                </h4>
                <p className="text-[10px] text-[#8A8177] font-sans mt-0.5">
                  номеров · 16 гостей
                </p>
              </div>
            </div>

            {/* Card 2: Заезды сегодня */}
            <div className="bg-white rounded-2xl border border-[#E5E2DD] p-3.5 shadow-2xs relative flex flex-col justify-between min-h-[118px]">
              <div className="flex items-center justify-between">
                <LogIn className="h-4.5 w-4.5 text-[#C2410C]" strokeWidth={2} />
                <ChevronRight className="h-3.5 w-3.5 text-[#8A8177]/60" />
              </div>
              <div>
                <div className="text-3xl font-serif font-medium text-[#241E1A] leading-none mb-1.5">
                  3
                </div>
                <h4 className="text-xs font-sans font-medium text-[#241E1A]">
                  Заезды сегодня
                </h4>
                <p className="text-[10px] text-[#8A8177] font-sans mt-0.5">
                  ожидаемых заезда
                </p>
              </div>
            </div>

            {/* Card 3: Выезды сегодня */}
            <div className="bg-white rounded-2xl border border-[#E5E2DD] p-3.5 shadow-2xs relative flex flex-col justify-between min-h-[118px]">
              <div className="flex items-center justify-between">
                <LogOut className="h-4.5 w-4.5 text-[#C2410C]" strokeWidth={2} />
                <ChevronRight className="h-3.5 w-3.5 text-[#8A8177]/60" />
              </div>
              <div>
                <div className="text-3xl font-serif font-medium text-[#241E1A] leading-none mb-1.5">
                  2
                </div>
                <h4 className="text-xs font-sans font-medium text-[#241E1A]">
                  Выезды сегодня
                </h4>
                <p className="text-[10px] text-[#8A8177] font-sans mt-0.5">
                  до 12:00
                </p>
              </div>
            </div>

            {/* Card 4: Предварительные брони */}
            <div className="bg-white rounded-2xl border border-[#E5E2DD] p-3.5 shadow-2xs relative flex flex-col justify-between min-h-[118px]">
              <div className="flex items-center justify-between">
                <Calendar className="h-4.5 w-4.5 text-[#C2410C]" strokeWidth={2} />
                <ChevronRight className="h-3.5 w-3.5 text-[#8A8177]/60" />
              </div>
              <div>
                <div className="text-3xl font-serif font-medium text-[#241E1A] leading-none mb-1.5">
                  2
                </div>
                <h4 className="text-xs font-sans font-medium text-[#241E1A]">
                  Предварительные брони
                </h4>
                <p className="text-[10px] text-[#8A8177] font-sans mt-0.5">
                  сегодня
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* ================= SECTION 2: ОЖИДАЕТ ОПЛАТЫ (Screenshot 1) ================= */}
        <div className="space-y-2">
          <h2 className="text-xs font-sans font-medium text-[#241E1A]">
            Ожидает оплаты
          </h2>

          <div className="bg-white rounded-2xl border border-[#E5E2DD] divide-y divide-[#E5E2DD]/60 shadow-2xs overflow-hidden">
            {/* Row 1: Брони без полной оплаты */}
            <div
              onClick={() => setActiveUnpaidView('BOOKINGS')}
              className="p-4 flex items-center justify-between hover:bg-[#FAF7F3]/60 transition-colors cursor-pointer"
            >
              <div>
                <h3 className="text-xs font-sans font-medium text-[#241E1A]">
                  Брони без полной оплаты
                </h3>
                <p className="text-[10px] text-[#8A8177] font-sans mt-0.5">
                  3 брони
                </p>
              </div>
              <div className="flex items-center gap-1.5 text-xs font-sans font-medium text-[#C2410C]">
                <span>205 000 ₸</span>
                <ChevronRight className="h-4 w-4 text-[#C2410C]" />
              </div>
            </div>

            {/* Row 2: Услуги */}
            <div
              onClick={() => setActiveUnpaidView('SERVICES')}
              className="p-4 flex items-center justify-between hover:bg-[#FAF7F3]/60 transition-colors cursor-pointer"
            >
              <div>
                <h3 className="text-xs font-sans font-medium text-[#241E1A]">
                  Услуги
                </h3>
                <p className="text-[10px] text-[#8A8177] font-sans mt-0.5">
                  4 заявки
                </p>
              </div>
              <div className="flex items-center gap-1.5 text-xs font-sans font-medium text-[#C2410C]">
                <span>30 000 ₸</span>
                <ChevronRight className="h-4 w-4 text-[#C2410C]" />
              </div>
            </div>
          </div>
        </div>

        {/* ================= SECTION 3: КЛЮЧЕВЫЕ МЕТРИКИ (Screenshots 2 & 3) ================= */}
        <div className="space-y-2.5">
          <h2 className="text-xs font-sans font-medium text-[#241E1A]">
            Ключевые метрики
          </h2>

          {/* Period Selector Bar */}
          <div className="relative">
            <div className="flex items-center justify-between text-xs font-sans">
              {/* Left: Clickable Calendar Icon & Date Range */}
              <button
                type="button"
                onClick={() => {
                  setShowAnalyticsCalendarPicker(!showAnalyticsCalendarPicker);
                  setShowAnalyticsPeriodDropdown(false);
                }}
                className="flex items-center gap-2 text-[#241E1A] font-medium hover:text-[#C2410C] transition-colors cursor-pointer py-1"
                title={t('Выбрать даты периода', 'Select date range')}
              >
                <Calendar className="h-4 w-4 text-[#C2410C]" strokeWidth={2} />
                <span>{currentPeriodText}</span>
              </button>

              {/* Right: Timeframe Dropdown (День / Неделя / Месяц / Год) & Prev/Next < > */}
              <div className="flex items-center gap-2 text-[#8A8177]">
                {/* Dropdown "День / Неделя / Месяц / Год" */}
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => {
                      setShowAnalyticsPeriodDropdown(!showAnalyticsPeriodDropdown);
                      setShowAnalyticsCalendarPicker(false);
                    }}
                    className="flex items-center gap-1 hover:text-[#241E1A] cursor-pointer py-1 px-1.5 rounded-lg hover:bg-black/5 transition-colors"
                  >
                    <span>{getPeriodOptionLabel(periodType)}</span>
                    <ChevronDown
                      className={`h-3.5 w-3.5 transition-transform duration-150 ${
                        showAnalyticsPeriodDropdown ? 'rotate-180' : ''
                      }`}
                    />
                  </button>

                  {showAnalyticsPeriodDropdown && (
                    <div className="absolute right-0 top-full mt-1.5 w-36 bg-white border border-[#E5E2DD] rounded-xl shadow-lg py-1.5 z-30 animate-in fade-in zoom-in-95 duration-150">
                      {PERIOD_OPTIONS.map((opt) => {
                        const isSelected = periodType === opt.id;
                        return (
                          <button
                            key={opt.id}
                            type="button"
                            onClick={() => {
                              setPeriodType(opt.id);
                              const [newStart, newEnd] = computeRangeForMode(
                                analyticsStartDate,
                                opt.id
                              );
                              setAnalyticsStartDate(newStart);
                              setAnalyticsEndDate(newEnd);
                              setShowAnalyticsPeriodDropdown(false);
                            }}
                            className={`w-full px-3.5 py-2 text-left text-xs font-sans flex items-center justify-between transition-colors cursor-pointer ${
                              isSelected
                                ? 'bg-[#FAF7F3] text-[#C2410C] font-medium'
                                : 'text-[#241E1A] hover:bg-[#FAF7F3]/60'
                            }`}
                          >
                            <span>{t(opt.labelRu, opt.labelEn)}</span>
                            {isSelected && <Check className="h-3.5 w-3.5 text-[#C2410C]" />}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Prev / Next buttons (< >) */}
                <div className="flex items-center gap-1 pl-1">
                  <button
                    type="button"
                    onClick={() => {
                      const [prevS, prevE] = shiftRange(
                        analyticsStartDate,
                        analyticsEndDate,
                        periodType,
                        -1
                      );
                      setAnalyticsStartDate(prevS);
                      setAnalyticsEndDate(prevE);
                    }}
                    className="p-1 hover:text-[#241E1A] hover:bg-black/5 rounded-lg transition-colors cursor-pointer"
                    title={t('Предыдущий период', 'Previous period')}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const [nextS, nextE] = shiftRange(
                        analyticsStartDate,
                        analyticsEndDate,
                        periodType,
                        1
                      );
                      setAnalyticsStartDate(nextS);
                      setAnalyticsEndDate(nextE);
                    }}
                    className="p-1 hover:text-[#241E1A] hover:bg-black/5 rounded-lg transition-colors cursor-pointer"
                    title={t('Следующий период', 'Next period')}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>

            {/* Expandable Calendar Range Picker (От какого числа — до какого) */}
            {showAnalyticsCalendarPicker && (
              <div className="mt-2.5 p-3.5 bg-white border border-[#E5E2DD] rounded-2xl shadow-md space-y-3 z-20 animate-in fade-in duration-150">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-sans font-medium text-[#241E1A]">
                    {t('Выбор периода', 'Select Date Range')} ({getPeriodOptionLabel(periodType)})
                  </span>
                  <button
                    type="button"
                    onClick={() => setShowAnalyticsCalendarPicker(false)}
                    className="text-[#8A8177] hover:text-[#241E1A] cursor-pointer"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-2.5">
                  <div>
                    <label className="block text-[10px] font-sans text-[#8A8177] mb-1">
                      {t('От (с числа)', 'From')}
                    </label>
                    <input
                      type="date"
                      value={analyticsStartDate}
                      onChange={(e) => {
                        const val = e.target.value;
                        if (!val) return;
                        setAnalyticsStartDate(val);
                        const [, autoEnd] = computeRangeForMode(val, periodType);
                        setAnalyticsEndDate(autoEnd);
                      }}
                      className="w-full bg-[#FAF7F3] border border-[#E5E2DD] rounded-xl px-2.5 py-2 text-xs text-[#241E1A] focus:outline-none focus:border-[#C2410C]"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-sans text-[#8A8177] mb-1">
                      {t('До (по число)', 'To')}
                    </label>
                    <input
                      type="date"
                      value={analyticsEndDate}
                      min={analyticsStartDate}
                      onChange={(e) => {
                        const val = e.target.value;
                        if (!val) return;
                        setAnalyticsEndDate(val);
                      }}
                      className="w-full bg-[#FAF7F3] border border-[#E5E2DD] rounded-xl px-2.5 py-2 text-xs text-[#241E1A] focus:outline-none focus:border-[#C2410C]"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between pt-1">
                  <span className="text-[11px] text-[#8A8177] font-sans">
                    {currentPeriodText}
                  </span>
                  <button
                    type="button"
                    onClick={() => setShowAnalyticsCalendarPicker(false)}
                    className="px-4 py-1.5 bg-[#C2410C] hover:bg-[#A93A0C] text-white text-xs font-sans font-medium rounded-xl transition-colors cursor-pointer"
                  >
                    {t('Применить', 'Apply')}
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* 4 Metrics Cards (2x2 Grid) */}
          <div className="grid grid-cols-2 gap-2.5">
            {/* Metric 1: Occupancy · загрузка */}
            <div className="bg-white rounded-2xl border border-[#E5E2DD] p-3.5 shadow-2xs flex flex-col justify-between min-h-[128px]">
              <span className="text-[10px] text-[#8A8177] font-sans">
                Occupancy · загрузка
              </span>
              <div>
                <div className="text-3xl font-serif font-medium text-[#241E1A] leading-none mb-1">
                  68,3%
                </div>
                <div className="flex items-center gap-0.5 text-[10px] text-[#8A8177] font-sans">
                  <span className="text-[#8A8177]">↗ +8,3 п. п.</span>
                </div>
                <span className="text-[9px] text-[#8A8177] font-sans block mt-0.5">
                  к предыдущему периоду
                </span>
              </div>
            </div>

            {/* Metric 2: Revenue · выручка */}
            <div className="bg-white rounded-2xl border border-[#E5E2DD] p-3.5 shadow-2xs flex flex-col justify-between min-h-[128px]">
              <span className="text-[10px] text-[#8A8177] font-sans">
                Revenue · выручка
              </span>
              <div>
                <div className="text-2xl font-serif font-medium text-[#241E1A] leading-none mb-1">
                  2 150 000 ₸
                </div>
                <div className="flex items-center gap-0.5 text-[10px] text-[#8A8177] font-sans">
                  <span className="text-[#8A8177]">↗ +12,4%</span>
                </div>
                <span className="text-[9px] text-[#8A8177] font-sans block mt-0.5">
                  к предыдущему периоду
                </span>
              </div>
            </div>

            {/* Metric 3: Количество гостей */}
            <div className="bg-white rounded-2xl border border-[#E5E2DD] p-3.5 shadow-2xs flex flex-col justify-between min-h-[128px]">
              <span className="text-[10px] text-[#8A8177] font-sans">
                Количество гостей
              </span>
              <div>
                <div className="text-3xl font-serif font-medium text-[#241E1A] leading-none mb-1">
                  42
                </div>
                <span className="text-[9px] text-[#8A8177] font-sans block mt-2">
                  за выбранный период
                </span>
              </div>
            </div>

            {/* Metric 4: Заезды / Выезды */}
            <div className="bg-white rounded-2xl border border-[#E5E2DD] p-3.5 shadow-2xs flex flex-col justify-between min-h-[128px]">
              <span className="text-[10px] text-[#8A8177] font-sans">
                Заезды / Выезды
              </span>
              <div>
                <div className="text-3xl font-serif font-medium text-[#241E1A] leading-none mb-1">
                  18 / 16
                </div>
                <span className="text-[9px] text-[#8A8177] font-sans block mt-2">
                  за выбранный период
                </span>
              </div>
            </div>
          </div>

          {/* Collapsible Accordion 1: Подробнее о показателях (Screenshot 2 & 3) */}
          <div className="bg-white rounded-2xl border border-[#E5E2DD] shadow-2xs overflow-hidden">
            <button
              type="button"
              onClick={() => setMetricsDetailsOpen(!metricsDetailsOpen)}
              className="w-full p-4 flex items-center justify-between text-left hover:bg-[#FAF7F3]/40 transition-colors cursor-pointer"
            >
              <span className="text-xs font-sans font-medium text-[#241E1A]">
                Подробнее о показателях
              </span>
              <ChevronDown
                className={`h-4 w-4 text-[#8A8177] transition-transform duration-200 ${
                  metricsDetailsOpen ? 'rotate-180' : ''
                }`}
              />
            </button>

            {metricsDetailsOpen && (
              <div className="divide-y divide-[#E5E2DD]/50 border-t border-[#E5E2DD]/50 px-4 text-xs font-sans">
                {/* ADR */}
                <div className="py-3 flex items-center justify-between">
                  <span className="text-[#8A8177]">ADR · средний тариф</span>
                  <span className="font-medium text-[#241E1A]">25 000 ₸</span>
                </div>

                {/* RevPAR */}
                <div className="py-3 flex items-center justify-between">
                  <span className="text-[#8A8177]">RevPAR · доход на номер</span>
                  <span className="font-medium text-[#241E1A]">17 063 ₸</span>
                </div>

                {/* GOP */}
                <div className="py-3 flex items-center justify-between">
                  <span className="text-[#8A8177]">GOP · операционная прибыль</span>
                  <span className="font-medium text-[#241E1A]">1 345 000 ₸</span>
                </div>

                {/* Room nights */}
                <div className="py-3 flex items-center justify-between">
                  <span className="text-[#8A8177]">Room nights · проданные ночи</span>
                  <span className="font-medium text-[#241E1A]">86</span>
                </div>

                {/* Длина проживания */}
                <div className="py-3 flex items-center justify-between">
                  <span className="text-[#8A8177]">Средняя длина проживания</span>
                  <span className="font-medium text-[#241E1A]">4,8 ночи</span>
                </div>

                {/* Доля отмен */}
                <div className="py-3 flex items-center justify-between">
                  <span className="text-[#8A8177]">Доля отмен</span>
                  <span className="font-medium text-[#241E1A]">5% · 1 из 20 заездов</span>
                </div>

                {/* No-show */}
                <div className="py-3 flex items-center justify-between">
                  <span className="text-[#8A8177]">No-show</span>
                  <span className="font-medium text-[#241E1A]">0% · 0 из 20 заездов</span>
                </div>
              </div>
            )}
          </div>

          {/* Collapsible Accordion 2: Отмены и no-show (Screenshot 2 & 3) */}
          <div className="bg-white rounded-2xl border border-[#E5E2DD] shadow-2xs overflow-hidden">
            <button
              type="button"
              onClick={() => setCancellationsOpen(!cancellationsOpen)}
              className="w-full p-4 flex items-center justify-between text-left hover:bg-[#FAF7F3]/40 transition-colors cursor-pointer"
            >
              <span className="text-xs font-sans font-medium text-[#241E1A]">
                Отмены и no-show
              </span>
              <ChevronDown
                className={`h-4 w-4 text-[#8A8177] transition-transform duration-200 ${
                  cancellationsOpen ? 'rotate-180' : ''
                }`}
              />
            </button>

            {cancellationsOpen && (
              <div className="border-t border-[#E5E2DD]/50 p-4 space-y-2.5 text-xs font-sans">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-[#241E1A]">Мария Белова</span>
                  <span className="px-2 py-0.5 rounded-[6px] bg-[#FAF0EF] text-[#B3261E] text-[10px] font-sans font-medium">
                    Отмена
                  </span>
                </div>

                <p className="text-[#8A8177] text-xs">
                  №201 · 12–14 ноября · 2 гостя
                </p>

                <p className="text-[11px] text-[#8A8177] pt-1 border-t border-[#E5E2DD]/40">
                  No-show за выбранный период нет.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  // =========================================================================
  // MAIN VIEW FOR TAB: MANAGER_ANALYTICS
  // =========================================================================
  if (activeTab === 'MANAGER_ANALYTICS') {
    // If drilling down into Unpaid Bookings screen
    if (activeUnpaidView === 'BOOKINGS') {
      return renderUnpaidBookingsScreen();
    }

    // If drilling down into Unpaid Services screen
    if (activeUnpaidView === 'SERVICES') {
      return renderUnpaidServicesScreen();
    }

    return (
      <div className="flex-1 flex flex-col bg-[#FAF7F3] overflow-hidden select-none">
        {/* Top Notification Toast */}
        {actionAlert && (
          <div className="absolute top-3 left-4 right-4 bg-[#241E1A] text-white text-xs px-4 py-2.5 rounded-xl shadow-lg z-50 flex items-center justify-between animate-in fade-in duration-200">
            <span>{actionAlert}</span>
            <button onClick={() => setActionAlert(null)} className="text-white/60 hover:text-white">✕</button>
          </div>
        )}

        {/* Top Header: Title + Subtitle (Screenshot 1) */}
        <div className="px-5 pt-7 pb-3 bg-[#FAF7F3] shrink-0">
          <h1 className="text-2xl font-serif font-medium text-[#241E1A] leading-tight">
            {t('Аналитика', 'Analytics')}
          </h1>
          <p className="text-xs text-[#8A8177] font-sans mt-0.5">
            {t('Операционный обзор', 'Operational overview')}
          </p>

          {/* Segmented Control: [Дашборд] [Отчёты] */}
          <div className="mt-3.5 bg-[#EAE6DE]/70 rounded-xl p-1 grid grid-cols-2 gap-1">
            <button
              type="button"
              onClick={() => setAnalyticsSubTab('DASHBOARD')}
              className={`py-2 rounded-lg text-xs font-sans transition-all cursor-pointer ${
                analyticsSubTab === 'DASHBOARD'
                  ? 'bg-[#241E1A] text-white font-medium shadow-xs'
                  : 'text-[#6E665E] hover:text-[#241E1A] font-normal'
              }`}
            >
              {t('Дашборд', 'Dashboard')}
            </button>
            <button
              type="button"
              onClick={() => setAnalyticsSubTab('REPORTS')}
              className={`py-2 rounded-lg text-xs font-sans transition-all cursor-pointer ${
                analyticsSubTab === 'REPORTS'
                  ? 'bg-[#241E1A] text-white font-medium shadow-xs'
                  : 'text-[#6E665E] hover:text-[#241E1A] font-normal'
              }`}
            >
              {t('Отчёты', 'Reports')}
            </button>
          </div>
        </div>

        {/* Content switcher between Dashboard and Reports */}
        {analyticsSubTab === 'DASHBOARD' ? renderDashboardView() : renderReportsView()}
      </div>
    );
  }

  // =========================================================================
  // TAB 2: ФИНАНСЫ (MANAGER_FINANCE) - SCREENSHOTS 1 TO 5
  // =========================================================================
  const renderFinanceTransactionsView = () => {
    // Calculated metrics (Screenshot 1)
    const totalIncome = transactions
      .filter(t => t.type === 'INCOME' && (showNonIncomeAffecting || t.affectsProfit))
      .reduce((sum, t) => sum + t.numericAmount, 0);
    const totalExpense = transactions
      .filter(t => t.type === 'EXPENSE' && (showNonIncomeAffecting || t.affectsProfit))
      .reduce((sum, t) => sum + t.numericAmount, 0);
    const netProfit = totalIncome - totalExpense;

    // Filtered transaction list
    const filteredTransactions = transactions.filter(t => {
      if (transactionTypeFilter === 'Доход' && t.type !== 'INCOME') return false;
      if (transactionTypeFilter === 'Расход' && t.type !== 'EXPENSE') return false;
      if (transactionAccountFilter !== 'Все счета' && t.account !== transactionAccountFilter) return false;
      if (transactionSearch.trim()) {
        const q = transactionSearch.toLowerCase();
        const matchesName = t.name.toLowerCase().includes(q);
        const matchesSubtext = t.subtext.toLowerCase().includes(q);
        const matchesMethod = t.paymentMethod.toLowerCase().includes(q);
        if (!matchesName && !matchesSubtext && !matchesMethod) return false;
      }
      if (!showNonIncomeAffecting && !t.affectsProfit) return false;
      return true;
    });

    return (
      <div className="flex-1 overflow-y-auto px-5 pb-6 space-y-4 no-scrollbar select-none">
        {/* Row 1 Stats: 2 Cards (Screenshot 1) */}
        <div className="grid grid-cols-2 gap-2.5">
          {/* Card 1: Общий доход */}
          <div className="bg-white rounded-2xl border border-[#E5E2DD] p-4 shadow-2xs">
            <span className="text-[11px] font-sans text-[#8A8177]">Общий доход</span>
            <div className="text-2xl md:text-3xl font-serif font-medium text-[#241E1A] mt-1">
              {totalIncome.toLocaleString('ru-RU')} ₸
            </div>
          </div>

          {/* Card 2: Общие расходы */}
          <div className="bg-white rounded-2xl border border-[#E5E2DD] p-4 shadow-2xs">
            <span className="text-[11px] font-sans text-[#8A8177]">Общие расходы</span>
            <div className="text-2xl md:text-3xl font-serif font-medium text-[#241E1A] mt-1">
              {totalExpense.toLocaleString('ru-RU')} ₸
            </div>
          </div>
        </div>

        {/* Row 2 Card: Чистая прибыль (Screenshot 1) */}
        <div className="bg-[#241E1A] text-white rounded-2xl p-4.5 flex items-center justify-between shadow-xs">
          <span className="text-xs font-sans text-white/80">Чистая прибыль</span>
          <span className="text-2xl md:text-3xl font-serif font-medium text-white">
            {netProfit.toLocaleString('ru-RU')} ₸
          </span>
        </div>

        {/* Filter Section (Screenshot 1) */}
        <div className="space-y-3 pt-1">
          <div className="text-xs font-sans text-[#8A8177]">
            {t(`За выбранные ${transactionPeriod}`, `For selected ${transactionPeriod}`)}
          </div>

          {/* Search Input with Filter Icon INSIDE on the right */}
          <div className="relative">
            <Search className="h-4 w-4 text-[#8A8177] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={transactionSearch}
              onChange={(e) => setTransactionSearch(e.target.value)}
              placeholder={t('Поиск транзакции', 'Search transactions')}
              className="w-full bg-white border border-[#E5E2DD] rounded-xl pl-10 pr-10 py-3 text-xs text-[#241E1A] placeholder:text-[#8A8177]/70 focus:outline-none focus:border-[#C2410C] shadow-2xs"
            />
            <button
              type="button"
              onClick={() => setShowTransactionFilters(!showTransactionFilters)}
              className={`absolute right-2.5 top-1/2 -translate-y-1/2 p-1.5 rounded-lg transition-colors cursor-pointer ${
                showTransactionFilters ||
                transactionTypeFilter !== 'Все типы' ||
                transactionAccountFilter !== 'Все счета'
                  ? 'text-[#C2410C] bg-[#FAF7F3]'
                  : 'text-[#8A8177] hover:text-[#241E1A]'
              }`}
              title={t('Фильтры (тип и счёт)', 'Filters (type & account)')}
            >
              <Filter className="h-4 w-4" />
            </button>
          </div>

          {/* Expandable Filters Box: Тип & Счёт (shown when filter icon in search bar is clicked) */}
          {showTransactionFilters && (
            <div className="p-3.5 bg-white border border-[#E5E2DD] rounded-2xl shadow-2xs space-y-3 animate-in fade-in duration-150">
              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-[11px] font-sans text-[#8A8177] mb-1">
                    {t('Тип', 'Type')}
                  </label>
                  <div className="relative">
                    <select
                      value={transactionTypeFilter}
                      onChange={(e) => setTransactionTypeFilter(e.target.value)}
                      className="w-full bg-[#FAF7F3] border border-[#E5E2DD] rounded-xl px-3 py-2.5 text-xs text-[#241E1A] focus:outline-none focus:border-[#C2410C] appearance-none pr-8 cursor-pointer"
                    >
                      <option value="Все типы">{t('Все типы', 'All types')}</option>
                      <option value="Доход">{t('Доход', 'Income')}</option>
                      <option value="Расход">{t('Расход', 'Expense')}</option>
                    </select>
                    <ChevronDown className="h-4 w-4 text-[#8A8177] absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-sans text-[#8A8177] mb-1">
                    {t('Счёт', 'Account')}
                  </label>
                  <div className="relative">
                    <select
                      value={transactionAccountFilter}
                      onChange={(e) => setTransactionAccountFilter(e.target.value)}
                      className="w-full bg-[#FAF7F3] border border-[#E5E2DD] rounded-xl px-3 py-2.5 text-xs text-[#241E1A] focus:outline-none focus:border-[#C2410C] appearance-none pr-8 cursor-pointer"
                    >
                      <option value="Все счета">{t('Все счета', 'All accounts')}</option>
                      {accounts.map((acc) => (
                        <option key={acc.id} value={acc.name}>
                          {acc.name}
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="h-4 w-4 text-[#8A8177] absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  </div>
                </div>
              </div>

              {(transactionTypeFilter !== 'Все типы' ||
                transactionAccountFilter !== 'Все счета') && (
                <div className="flex justify-end pt-0.5">
                  <button
                    type="button"
                    onClick={() => {
                      setTransactionTypeFilter('Все типы');
                      setTransactionAccountFilter('Все счета');
                    }}
                    className="text-xs text-[#C2410C] hover:underline cursor-pointer"
                  >
                    {t('Сбросить фильтры', 'Reset filters')}
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Period Selector Row */}
          <div>
            <label className="block text-xs font-sans text-[#8A8177] mb-1.5">Период</label>
            <div className="flex items-center gap-2.5">
              <div className="flex-1 relative">
                <select
                  value={transactionPeriod}
                  onChange={(e) => setTransactionPeriod(e.target.value)}
                  className="w-full bg-white border border-[#E5E2DD] rounded-xl px-3.5 py-3 text-xs text-[#241E1A] focus:outline-none focus:border-[#C2410C] appearance-none pr-8 cursor-pointer shadow-2xs"
                >
                  <option value="30 дней">30 дней</option>
                  <option value="7 дней">7 дней</option>
                  <option value="Сегодня">Сегодня</option>
                  <option value="Этот месяц">Этот месяц</option>
                  <option value="Прошлый месяц">Прошлый месяц</option>
                  <option value="Весь период">Весь период</option>
                </select>
                <ChevronDown className="h-4 w-4 text-[#8A8177] absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>

              {/* Terracotta Download Button */}
              <button
                type="button"
                onClick={() => {
                  setActionAlert(`Выписка транзакций за период «${transactionPeriod}» успешно экспортирована`);
                  setTimeout(() => setActionAlert(null), 4000);
                }}
                className="bg-[#C2410C] hover:bg-[#A93A0C] text-white rounded-xl h-11 w-11 flex items-center justify-center shrink-0 shadow-xs transition-transform active:scale-95 cursor-pointer"
                title="Экспорт выписки"
              >
                <Download className="h-5 w-5" />
              </button>
            </div>
          </div>

          {/* Checkbox: Показывать не влияющие на доходность */}
          <div
            onClick={() => setShowNonIncomeAffecting(!showNonIncomeAffecting)}
            className="flex items-center gap-2.5 cursor-pointer pt-1"
          >
            <div className={`h-4.5 w-4.5 rounded border flex items-center justify-center transition-colors ${
              showNonIncomeAffecting
                ? 'bg-[#C2410C] border-[#C2410C] text-white'
                : 'bg-white border-[#C5BFB5]'
            }`}>
              {showNonIncomeAffecting && <Check className="h-3 w-3 stroke-[3]" />}
            </div>
            <span className="text-xs font-sans text-[#241E1A]">
              Показывать не влияющие на доходность
            </span>
          </div>
        </div>

        {/* Transactions List (Screenshots 1 & 2) */}
        <div className="space-y-2.5 pt-2">
          {/* Header row */}
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-sans font-medium text-[#241E1A]">
              Транзакции
            </h3>
            <span className="text-[11px] font-sans text-[#8A8177]">
              {filteredTransactions.length} операции
            </span>
          </div>

          {/* List */}
          {filteredTransactions.length === 0 ? (
            <div className="bg-white rounded-2xl border border-[#E5E2DD] p-6 text-center shadow-2xs">
              <p className="text-xs text-[#8A8177] font-sans">
                По заданным фильтрам транзакций не найдено
              </p>
            </div>
          ) : (
            filteredTransactions.map((tx) => {
              const isExpanded = expandedTransactionId === tx.id;
              return (
                <div
                  key={tx.id}
                  className="bg-white rounded-2xl border border-[#E5E2DD] p-4 shadow-2xs transition-all space-y-2"
                >
                  {/* Top row: Name & Amount */}
                  <div className="flex items-start justify-between gap-2">
                    <span className="font-sans font-medium text-sm text-[#241E1A]">
                      {tx.name}
                    </span>
                    <span className="font-serif font-medium text-base text-[#3D7C52] shrink-0">
                      {tx.amount}
                    </span>
                  </div>

                  {/* Subtitle row: Date · Account */}
                  <div className="text-xs text-[#8A8177] font-sans">
                    {tx.subtext}
                  </div>

                  {/* Bottom row: Badge & Payment Method with Chevron */}
                  <div className="flex items-center justify-between pt-1">
                    <span className="bg-[#EBF4EE] text-[#3D7C52] text-[11px] font-medium px-2.5 py-0.5 rounded-lg font-sans">
                      {tx.badge}
                    </span>

                    <button
                      type="button"
                      onClick={() => setExpandedTransactionId(isExpanded ? null : tx.id)}
                      className="flex items-center gap-1 text-xs text-[#8A8177] hover:text-[#241E1A] transition-colors cursor-pointer"
                    >
                      <span>{tx.paymentMethod}</span>
                      <ChevronDown className={`h-3.5 w-3.5 transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`} />
                    </button>
                  </div>

                  {/* Expandable details when chevron clicked */}
                  {isExpanded && (
                    <div className="mt-3 pt-3 border-t border-[#E5E2DD]/60 text-xs space-y-2 bg-[#FAF7F3] rounded-xl p-3">
                      <div className="flex items-center justify-between text-[#8A8177]">
                        <span>Назначение:</span>
                        <span className="text-[#241E1A] font-medium text-right">{tx.operationDetails || 'Оплата услуг гостиницы'}</span>
                      </div>
                      <div className="flex items-center justify-between text-[#8A8177]">
                        <span>Счёт зачисления:</span>
                        <span className="text-[#241E1A] font-medium">{tx.account}</span>
                      </div>
                      <div className="flex items-center justify-between text-[#8A8177]">
                        <span>Фискальный чек:</span>
                        <span className="text-[#3D7C52] font-medium">Сформирован (WebKassa)</span>
                      </div>
                      <div className="flex items-center justify-between text-[#8A8177]">
                        <span>Влияет на доходность:</span>
                        <span className="text-[#241E1A]">{tx.affectsProfit ? 'Да' : 'Нет'}</span>
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>
    );
  };

  const renderFinanceAccountsView = () => {
    const totalActiveBalance = accounts.reduce((acc, curr) => acc + curr.balance, 0);
    const formattedTotalActiveBalance = totalActiveBalance.toLocaleString('ru-RU') + ' ₸';

    return (
      <div className="flex-1 overflow-y-auto px-5 pb-6 space-y-4 no-scrollbar select-none">
        {/* Total Active Accounts Balance Banner (Screenshot 3) */}
        <div className="bg-[#F1E9DE] border border-[#E3DACD] rounded-2xl p-5 shadow-2xs">
          <span className="text-xs font-sans text-[#8A8177]">
            На всех активных счетах
          </span>
          <div className="text-3xl font-serif font-medium text-[#241E1A] mt-2">
            {formattedTotalActiveBalance}
          </div>
        </div>

        {/* Add Account Card Button (Screenshot 3) */}
        <div className="bg-white rounded-2xl border border-[#E5E2DD] shadow-2xs overflow-hidden transition-all">
          <button
            type="button"
            onClick={() => setAddAccountOpen(!addAccountOpen)}
            className="w-full p-4 flex items-center justify-between cursor-pointer hover:bg-slate-50 transition-colors"
          >
            <div className="flex items-center gap-2">
              <span className="text-[#C2410C] font-semibold text-lg leading-none">+</span>
              <span className="text-xs font-sans font-medium text-[#241E1A]">
                Добавить счёт
              </span>
            </div>
            <ChevronDown className={`h-4 w-4 text-[#8A8177] transition-transform duration-200 ${addAccountOpen ? 'rotate-180' : ''}`} />
          </button>

          {/* Form inside "+ Добавить счёт" */}
          {addAccountOpen && (
            <div className="p-4 pt-1 border-t border-[#E5E2DD]/60 space-y-3 bg-[#FAF7F3]/50">
              <div>
                <label className="block text-[11px] font-sans text-[#8A8177] mb-1">
                  Название счёта
                </label>
                <input
                  type="text"
                  value={newAccountName}
                  onChange={(e) => setNewAccountName(e.target.value)}
                  placeholder="Например: Kaspi Pay QR или Форте Банк"
                  className="w-full bg-white border border-[#E5E2DD] rounded-xl px-3.5 py-2.5 text-xs text-[#241E1A] placeholder:text-[#8A8177]/60 focus:outline-none focus:border-[#C2410C]"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[11px] font-sans text-[#8A8177] mb-1">
                    Тип счёта
                  </label>
                  <select
                    value={newAccountType}
                    onChange={(e) => setNewAccountType(e.target.value)}
                    className="w-full bg-white border border-[#E5E2DD] rounded-xl px-3 py-2.5 text-xs text-[#241E1A] focus:outline-none focus:border-[#C2410C]"
                  >
                    <option value="Расчётный счёт">Расчётный счёт</option>
                    <option value="Наличные">Наличные</option>
                    <option value="Терминал">Терминал</option>
                    <option value="Онлайн-оплата">Онлайн-оплата</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-sans text-[#8A8177] mb-1">
                    Баланс (₸)
                  </label>
                  <input
                    type="number"
                    value={newAccountBalance}
                    onChange={(e) => setNewAccountBalance(e.target.value)}
                    placeholder="0"
                    className="w-full bg-white border border-[#E5E2DD] rounded-xl px-3.5 py-2.5 text-xs text-[#241E1A] placeholder:text-[#8A8177]/60 focus:outline-none focus:border-[#C2410C]"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => {
                    if (!newAccountName.trim()) {
                      setActionAlert('Введите название счёта');
                      setTimeout(() => setActionAlert(null), 3000);
                      return;
                    }
                    const bal = parseFloat(newAccountBalance) || 0;
                    const createdAcc: FinancialAccount = {
                      id: `acc-${Date.now()}`,
                      name: newAccountName.trim(),
                      type: newAccountType,
                      balance: bal,
                      currency: '₸',
                      isActive: true,
                      detailsNote: 'Пользовательский счёт'
                    };
                    setAccounts([...accounts, createdAcc]);
                    setNewAccountName('');
                    setNewAccountBalance('');
                    setAddAccountOpen(false);
                    setActionAlert(`Счёт «${createdAcc.name}» успешно добавлен`);
                    setTimeout(() => setActionAlert(null), 3000);
                  }}
                  className="flex-1 bg-[#C2410C] hover:bg-[#A93A0C] text-white rounded-xl py-2.5 text-xs font-sans font-medium transition-colors cursor-pointer text-center"
                >
                  Создать счёт
                </button>
                <button
                  type="button"
                  onClick={() => setAddAccountOpen(false)}
                  className="px-4 bg-white hover:bg-slate-50 border border-[#E5E2DD] text-[#8A8177] rounded-xl py-2.5 text-xs font-sans transition-colors cursor-pointer"
                >
                  Отмена
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Section: Активные счета (Screenshots 3, 4, 5) */}
        <div className="space-y-3 pt-1">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-sans font-medium text-[#241E1A]">
              Активные счета
            </h3>
            <span className="text-[11px] font-sans text-[#8A8177]">
              {accounts.length} счетов
            </span>
          </div>

          {/* Cards List */}
          <div className="space-y-3">
            {accounts.map((acc) => {
              const isDetailsOpen = expandedAccountId === acc.id;

              return (
                <div
                  key={acc.id}
                  className="bg-white rounded-2xl border border-[#E5E2DD] p-4.5 shadow-2xs space-y-2.5"
                >
                  {/* Top row: Name & Badge */}
                  <div className="flex items-start justify-between gap-2">
                    <span className="font-sans font-medium text-sm text-[#241E1A]">
                      {acc.name}
                    </span>
                    <span className="bg-[#EBF4EE] text-[#3D7C52] text-[10px] font-medium px-2 py-0.5 rounded-md font-sans shrink-0">
                      Активен
                    </span>
                  </div>

                  {/* Subtitle: Account Type */}
                  <div className="text-xs text-[#8A8177] font-sans">
                    {acc.type}
                  </div>

                  {/* Large Balance Number */}
                  <div className="text-3xl font-serif font-medium text-[#241E1A] my-2">
                    {acc.balance.toLocaleString('ru-RU')} ₸
                  </div>

                  {/* Accordion Box: Реквизиты и управление */}
                  <div className="rounded-xl border border-[#E5E2DD] overflow-hidden transition-all">
                    <button
                      type="button"
                      onClick={() => setExpandedAccountId(isDetailsOpen ? null : acc.id)}
                      className="w-full p-3 flex items-center justify-between bg-white hover:bg-[#FAF7F3] transition-colors cursor-pointer text-left"
                    >
                      <span className="text-xs font-sans text-[#241E1A]">
                        Реквизиты и управление
                      </span>
                      <ChevronDown className={`h-4 w-4 text-[#8A8177] transition-transform duration-200 ${isDetailsOpen ? 'rotate-180' : ''}`} />
                    </button>

                    {/* Inside details when expanded */}
                    {isDetailsOpen && (
                      <div className="p-3.5 bg-[#FAF7F3]/70 border-t border-[#E5E2DD]/60 space-y-2.5 text-xs">
                        {acc.iban && (
                          <div className="flex items-center justify-between text-[#8A8177]">
                            <span>IBAN:</span>
                            <div className="flex items-center gap-1.5 font-mono text-[#241E1A]">
                              <span>{acc.iban}</span>
                              <button
                                type="button"
                                onClick={() => {
                                  setActionAlert(`IBAN ${acc.iban} скопирован`);
                                  setTimeout(() => setActionAlert(null), 3000);
                                }}
                                className="text-[#C2410C] hover:text-[#A93A0C] p-0.5 cursor-pointer"
                                title="Скопировать"
                              >
                                <Copy className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          </div>
                        )}

                        {acc.bik && (
                          <div className="flex items-center justify-between text-[#8A8177]">
                            <span>БИК:</span>
                            <span className="font-mono text-[#241E1A]">{acc.bik}</span>
                          </div>
                        )}

                        {acc.bankName && (
                          <div className="flex items-center justify-between text-[#8A8177]">
                            <span>Организация:</span>
                            <span className="text-[#241E1A] font-medium">{acc.bankName}</span>
                          </div>
                        )}

                        {acc.detailsNote && (
                          <div className="flex items-center justify-between text-[#8A8177]">
                            <span>Примечание:</span>
                            <span className="text-[#241E1A]">{acc.detailsNote}</span>
                          </div>
                        )}

                        {/* Action Buttons in details */}
                        <div className="grid grid-cols-2 gap-2 pt-2 border-t border-[#E5E2DD]/50">
                          <button
                            type="button"
                            onClick={() => {
                              const amountToAdd = 50000;
                              setAccounts(accounts.map(a => a.id === acc.id ? { ...a, balance: a.balance + amountToAdd } : a));
                              setActionAlert(`Счёт «${acc.name}» пополнен на 50 000 ₸`);
                              setTimeout(() => setActionAlert(null), 3000);
                            }}
                            className="bg-white border border-[#E5E2DD] hover:bg-slate-50 py-2 rounded-lg text-xs font-sans text-[#241E1A] font-medium transition-colors cursor-pointer text-center"
                          >
                            + Пополнить
                          </button>

                          <button
                            type="button"
                            onClick={() => {
                              setArchivedAccounts([...archivedAccounts, acc]);
                              setAccounts(accounts.filter(a => a.id !== acc.id));
                              setActionAlert(`Счёт «${acc.name}» перенесён в архив`);
                              setTimeout(() => setActionAlert(null), 3000);
                            }}
                            className="bg-white border border-[#E5E2DD] hover:bg-rose-50 text-[#B3261E] py-2 rounded-lg text-xs font-sans transition-colors cursor-pointer text-center"
                          >
                            В архив
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Section: Архив счетов (Screenshot 5) */}
        <div className="bg-white rounded-2xl border border-[#E5E2DD] overflow-hidden shadow-2xs transition-all">
          <button
            type="button"
            onClick={() => setArchiveAccountsOpen(!archiveAccountsOpen)}
            className="w-full p-4 flex items-center justify-between cursor-pointer hover:bg-slate-50 transition-colors"
          >
            <span className="text-xs font-sans font-medium text-[#241E1A]">
              Архив счетов
            </span>
            <ChevronUp className={`h-4 w-4 text-[#8A8177] transition-transform duration-200 ${archiveAccountsOpen ? '' : 'rotate-180'}`} />
          </button>

          {/* Content inside Archive */}
          {archiveAccountsOpen && (
            <div className="p-4 pt-3 border-t border-[#E5E2DD]/60">
              {archivedAccounts.length === 0 ? (
                <p className="text-xs text-[#8A8177] font-sans">
                  Архивных счетов пока нет.
                </p>
              ) : (
                <div className="space-y-2">
                  {archivedAccounts.map(arch => (
                    <div key={arch.id} className="flex items-center justify-between p-2.5 bg-[#FAF7F3] rounded-xl border border-[#E5E2DD]">
                      <div>
                        <span className="text-xs font-medium text-[#241E1A] block">{arch.name}</span>
                        <span className="text-[10px] text-[#8A8177]">{arch.type} · {arch.balance.toLocaleString('ru-RU')} ₸</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setAccounts([...accounts, arch]);
                          setArchivedAccounts(archivedAccounts.filter(a => a.id !== arch.id));
                          setActionAlert(`Счёт «${arch.name}» восстановлен из архива`);
                          setTimeout(() => setActionAlert(null), 3000);
                        }}
                        className="text-xs text-[#C2410C] hover:underline font-sans cursor-pointer"
                      >
                        Восстановить
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderFinanceSalaryView = () => {
    // Filter shifts based on shiftSearch
    const filteredShifts = shifts.filter((sh) => {
      if (!shiftSearch.trim()) return true;
      const q = shiftSearch.toLowerCase();
      return (
        sh.employeeName.toLowerCase().includes(q) ||
        sh.department.toLowerCase().includes(q)
      );
    });

    const applySalaryMonthChange = (mIdx: number, yr: number) => {
      const normalizedMonth = ((mIdx % 12) + 12) % 12;
      const monthNameRu = MONTHS_NOM_RU[normalizedMonth];
      const monthNameEn = MONTHS_EN[normalizedMonth];
      const shortRu = MONTHS_SHORT_RU[normalizedMonth];
      setSalaryMonthIndex(normalizedMonth);
      setSalaryYear(yr);
      setSalaryPeriod(isEn ? `${monthNameEn} ${yr}` : `${monthNameRu} ${yr}`);
      setNewShiftDate(`28 ${shortRu} ${yr}`);
      setShifts((prev) =>
        prev.map((sh, i) => ({
          ...sh,
          date: `${28 - (i % 3)} ${shortRu} ${yr}`,
        }))
      );
    };

    // Dynamic stats by month so switching month gives immediate feedback
    const monthDiff = salaryMonthIndex - 8;
    const dynamicPayroll = 2236450 + monthDiff * 48500;
    const dynamicHours = 312 + monthDiff * 8;
    const dynamicShiftsCount = 31 + monthDiff;

    return (
      <div className="flex-1 overflow-y-auto px-5 pb-6 space-y-4 no-scrollbar select-none">
        {/* Period Selector (Screenshot: media_1794908795842_a58f26aa.png) */}
        <div className="relative">
          <label className="block text-xs font-sans text-[#8A8177] mb-1.5">
            {t('Период', 'Period')}
          </label>
          <button
            type="button"
            onClick={() => setShowSalaryMonthPicker(!showSalaryMonthPicker)}
            className="w-full bg-white border border-[#E5E2DD] hover:border-[#C2410C]/60 rounded-xl px-4 py-3 flex items-center justify-between shadow-2xs transition-colors cursor-pointer"
          >
            <span className="text-xs font-sans text-[#241E1A] font-medium">
              {isEn
                ? `${MONTHS_EN[salaryMonthIndex]} ${salaryYear}`
                : `${MONTHS_NOM_RU[salaryMonthIndex]} ${salaryYear}`}
            </span>
            <div className="flex items-center gap-2">
              <ChevronDown
                className={`h-4 w-4 text-[#8A8177] transition-transform duration-150 ${
                  showSalaryMonthPicker ? 'rotate-180' : ''
                }`}
              />
              <Calendar className="h-4 w-4 text-[#241E1A]" />
            </div>
          </button>

          {/* Expandable Month & Year Picker */}
          {showSalaryMonthPicker && (
            <div className="mt-2 p-3.5 bg-white border border-[#E5E2DD] rounded-2xl shadow-lg space-y-3 z-30 animate-in fade-in duration-150">
              {/* Year header with < > */}
              <div className="flex items-center justify-between border-b border-[#E5E2DD]/60 pb-2">
                <button
                  type="button"
                  onClick={() => applySalaryMonthChange(salaryMonthIndex, salaryYear - 1)}
                  className="p-1.5 rounded-lg hover:bg-[#FAF7F3] text-[#241E1A] cursor-pointer"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <span className="text-xs font-serif font-medium text-[#241E1A]">
                  {salaryYear} {t('год', '')}
                </span>
                <button
                  type="button"
                  onClick={() => applySalaryMonthChange(salaryMonthIndex, salaryYear + 1)}
                  className="p-1.5 rounded-lg hover:bg-[#FAF7F3] text-[#241E1A] cursor-pointer"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>

              {/* 12 Months Grid (3x4) */}
              <div className="grid grid-cols-3 gap-1.5">
                {MONTHS_NOM_RU.map((mName, idx) => {
                  const isCurrent = idx === salaryMonthIndex;
                  return (
                    <button
                      key={mName}
                      type="button"
                      onClick={() => {
                        applySalaryMonthChange(idx, salaryYear);
                        setShowSalaryMonthPicker(false);
                      }}
                      className={`py-2 px-2 rounded-xl text-xs font-sans transition-all cursor-pointer ${
                        isCurrent
                          ? 'bg-[#241E1A] text-white font-medium shadow-2xs'
                          : 'bg-[#FAF7F3] text-[#241E1A] hover:bg-[#EAE6DE]/70'
                      }`}
                    >
                      {isEn ? MONTHS_SHORT_EN[idx] : mName}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Row 1 Stats: 2 Cards (Screenshot 1) */}
        <div className="grid grid-cols-2 gap-2.5">
          {/* Card 1: Фонд оплаты */}
          <div className="bg-white rounded-2xl border border-[#E5E2DD] p-4 shadow-2xs">
            <span className="text-[11px] font-sans text-[#8A8177]">
              {t('Фонд оплаты', 'Total Payroll')}
            </span>
            <div className="text-2xl md:text-3xl font-serif font-medium text-[#241E1A] mt-1">
              {dynamicPayroll.toLocaleString('ru-RU')} ₸
            </div>
          </div>

          {/* Card 2: Отработано */}
          <div className="bg-white rounded-2xl border border-[#E5E2DD] p-4 shadow-2xs">
            <span className="text-[11px] font-sans text-[#8A8177]">
              {t('Отработано', 'Hours Worked')}
            </span>
            <div className="text-2xl md:text-3xl font-serif font-medium text-[#241E1A] mt-1">
              {dynamicHours} {t('ч', 'h')}
            </div>
            <div className="text-[11px] font-sans text-[#8A8177] mt-0.5">
              {dynamicShiftsCount} {t('смена', 'shifts')}
            </div>
          </div>
        </div>

        {/* Row 2 Card: К выплате (Dark Card - Screenshot 1) */}
        <div className="bg-[#241E1A] text-white rounded-2xl p-4.5 shadow-xs">
          <span className="text-xs font-sans text-white/80">{t('К выплате', 'To Pay')}</span>
          <div className="text-2xl md:text-3xl font-serif font-medium text-white mt-0.5">
            {dynamicPayroll.toLocaleString('ru-RU')} ₸
          </div>
          <div className="text-[11px] font-sans text-white/70 mt-1">
            8 {t('сотрудников', 'employees')}
          </div>
        </div>

        {/* Action Button: + Добавить смену (Screenshot 1) */}
        <div className="bg-white rounded-2xl border border-[#E5E2DD] shadow-2xs overflow-hidden transition-all">
          <button
            type="button"
            onClick={() => setAddShiftOpen(!addShiftOpen)}
            className="w-full p-4 flex items-center justify-between cursor-pointer hover:bg-slate-50 transition-colors"
          >
            <div className="flex items-center gap-2">
              <span className="text-[#C2410C] font-semibold text-lg leading-none">+</span>
              <span className="text-xs font-sans font-medium text-[#241E1A]">
                Добавить смену
              </span>
            </div>
            <ChevronDown
              className={`h-4 w-4 text-[#8A8177] transition-transform duration-200 ${
                addShiftOpen ? 'rotate-180' : ''
              }`}
            />
          </button>

          {/* Add Shift Inline Form */}
          {addShiftOpen && (
            <div className="p-4 pt-1 border-t border-[#E5E2DD]/60 space-y-3 bg-[#FAF7F3]/50">
              <div>
                <label className="block text-[11px] font-sans text-[#8A8177] mb-1">
                  ФИО сотрудника
                </label>
                <input
                  type="text"
                  value={newShiftEmployee}
                  onChange={(e) => setNewShiftEmployee(e.target.value)}
                  placeholder="Например: Асанов Арман Кайратович"
                  className="w-full bg-white border border-[#E5E2DD] rounded-xl px-3.5 py-2.5 text-xs text-[#241E1A] placeholder:text-[#8A8177]/60 focus:outline-none focus:border-[#C2410C]"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[11px] font-sans text-[#8A8177] mb-1">
                    Отдел
                  </label>
                  <select
                    value={newShiftDept}
                    onChange={(e) => setNewShiftDept(e.target.value)}
                    className="w-full bg-white border border-[#E5E2DD] rounded-xl px-3 py-2.5 text-xs text-[#241E1A] focus:outline-none focus:border-[#C2410C]"
                  >
                    <option value="housekeeping">housekeeping</option>
                    <option value="reception">reception</option>
                    <option value="parking">parking</option>
                    <option value="finance">finance</option>
                    <option value="restaurant">restaurant</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-sans text-[#8A8177] mb-1">
                    Дата
                  </label>
                  <input
                    type="text"
                    value={newShiftDate}
                    onChange={(e) => setNewShiftDate(e.target.value)}
                    className="w-full bg-white border border-[#E5E2DD] rounded-xl px-3.5 py-2.5 text-xs text-[#241E1A] focus:outline-none focus:border-[#C2410C]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[11px] font-sans text-[#8A8177] mb-1">
                    Начало
                  </label>
                  <input
                    type="text"
                    value={newShiftStartTime}
                    onChange={(e) => setNewShiftStartTime(e.target.value)}
                    placeholder="09:00"
                    className="w-full bg-white border border-[#E5E2DD] rounded-xl px-3.5 py-2.5 text-xs text-[#241E1A] focus:outline-none focus:border-[#C2410C]"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-sans text-[#8A8177] mb-1">
                    Окончание
                  </label>
                  <input
                    type="text"
                    disabled={newShiftIsOpen}
                    value={newShiftIsOpen ? 'Открыта' : newShiftEndTime}
                    onChange={(e) => setNewShiftEndTime(e.target.value)}
                    placeholder="18:00"
                    className="w-full bg-white border border-[#E5E2DD] rounded-xl px-3.5 py-2.5 text-xs text-[#241E1A] disabled:bg-slate-100 disabled:text-[#8A8177] focus:outline-none focus:border-[#C2410C]"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between pt-1">
                <label
                  onClick={() => setNewShiftIsOpen(!newShiftIsOpen)}
                  className="flex items-center gap-2 cursor-pointer text-xs font-sans text-[#241E1A]"
                >
                  <div
                    className={`h-4 w-4 rounded border flex items-center justify-center ${
                      newShiftIsOpen
                        ? 'bg-[#C2410C] border-[#C2410C] text-white'
                        : 'bg-white border-[#C5BFB5]'
                    }`}
                  >
                    {newShiftIsOpen && <Check className="h-3 w-3 stroke-[3]" />}
                  </div>
                  <span>Смена открыта</span>
                </label>

                <label
                  onClick={() => setNewShiftHasQr(!newShiftHasQr)}
                  className="flex items-center gap-2 cursor-pointer text-xs font-sans text-[#8A8177]"
                >
                  <div
                    className={`h-4 w-4 rounded border flex items-center justify-center ${
                      newShiftHasQr
                        ? 'bg-[#C2410C] border-[#C2410C] text-white'
                        : 'bg-white border-[#C5BFB5]'
                    }`}
                  >
                    {newShiftHasQr && <Check className="h-3 w-3 stroke-[3]" />}
                  </div>
                  <span>Отметка QR</span>
                </label>
              </div>

              <div className="flex items-center gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    if (!newShiftEmployee.trim()) {
                      setActionAlert('Введите ФИО сотрудника');
                      setTimeout(() => setActionAlert(null), 3000);
                      return;
                    }

                    const newShift: EmployeeShift = {
                      id: `sh-${Date.now()}`,
                      employeeName: newShiftEmployee.trim(),
                      date: newShiftDate,
                      hasQr: newShiftHasQr,
                      startTime: newShiftStartTime,
                      endTime: newShiftIsOpen ? 'Открыта' : newShiftEndTime,
                      isOpen: newShiftIsOpen,
                      hours: newShiftIsOpen ? undefined : 9,
                      department: newShiftDept,
                      hourlyRate: 1500,
                    };

                    setShifts([newShift, ...shifts]);
                    setNewShiftEmployee('');
                    setAddShiftOpen(false);
                    setActionAlert(`Смена для ${newShift.employeeName} сохранена`);
                    setTimeout(() => setActionAlert(null), 3000);
                  }}
                  className="flex-1 bg-[#C2410C] hover:bg-[#A93A0C] text-white rounded-xl py-2.5 text-xs font-sans font-medium transition-colors cursor-pointer text-center"
                >
                  Сохранить смену
                </button>
                <button
                  type="button"
                  onClick={() => setAddShiftOpen(false)}
                  className="px-4 bg-white hover:bg-slate-50 border border-[#E5E2DD] text-[#8A8177] rounded-xl py-2.5 text-xs font-sans transition-colors cursor-pointer"
                >
                  Отмена
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Section: Табель смен (Screenshots: media_1794908795842_a58f26aa.png & media_1794908814014_ebc931db.png) */}
        <div className="space-y-3 pt-1">
          {/* Section Header: Title + Download Icon */}
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-sans font-medium text-[#241E1A]">
              Табель смен
            </h3>
            <button
              type="button"
              onClick={() => {
                setActionAlert(`Табель смен за «${salaryPeriod}» успешно экспортирован`);
                setTimeout(() => setActionAlert(null), 4000);
              }}
              className="text-[#241E1A] hover:text-[#C2410C] transition-colors p-1 cursor-pointer"
              title="Экспорт табеля"
            >
              <Download className="h-4.5 w-4.5" />
            </button>
          </div>

          {/* Search Input */}
          <div className="relative">
            <Search className="h-4 w-4 text-[#8A8177] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={shiftSearch}
              onChange={(e) => setShiftSearch(e.target.value)}
              placeholder="Сотрудник или отдел"
              className="w-full bg-white border border-[#E5E2DD] rounded-xl pl-10 pr-3.5 py-3 text-xs text-[#241E1A] placeholder:text-[#8A8177]/70 focus:outline-none focus:border-[#C2410C] shadow-2xs"
            />
          </div>

          {/* Shifts Cards List */}
          <div className="space-y-2.5">
            {filteredShifts.length === 0 ? (
              <div className="bg-white rounded-2xl border border-[#E5E2DD] p-6 text-center shadow-2xs">
                <p className="text-xs text-[#8A8177] font-sans">
                  Смен по данному запросу не найдено
                </p>
              </div>
            ) : (
              filteredShifts.map((shift) => {
                const isExpanded = expandedShiftId === shift.id;

                return (
                  <div
                    key={shift.id}
                    className="bg-white rounded-2xl border border-[#E5E2DD] p-4 shadow-2xs space-y-2 transition-all"
                  >
                    {/* Top Row: Name & Hours / Badge */}
                    <div className="flex items-start justify-between gap-2">
                      <span className="font-sans font-medium text-sm text-[#241E1A]">
                        {shift.employeeName}
                      </span>

                      {shift.isOpen ? (
                        <span className="bg-[#FDF3E3] text-[#B87A28] text-[11px] font-medium px-2.5 py-0.5 rounded-md font-sans shrink-0">
                          Открыта
                        </span>
                      ) : (
                        <span className="font-sans font-medium text-sm text-[#241E1A] shrink-0">
                          {shift.hours} ч
                        </span>
                      )}
                    </div>

                    {/* Subtitle Row: Date · QR */}
                    <div className="text-xs text-[#8A8177] font-sans">
                      {shift.date}
                      {shift.hasQr && ' · QR'}
                    </div>

                    {/* Bottom Row: Time Interval & Department with Chevron */}
                    <div className="flex items-center justify-between pt-1">
                      <span className="text-xs font-sans text-[#241E1A]">
                        {shift.isOpen
                          ? `${shift.startTime} → Открыта`
                          : `${shift.startTime} → ${shift.endTime}`}
                      </span>

                      <button
                        type="button"
                        onClick={() =>
                          setExpandedShiftId(isExpanded ? null : shift.id)
                        }
                        className="flex items-center gap-1 text-xs text-[#8A8177] hover:text-[#241E1A] transition-colors cursor-pointer"
                      >
                        <span>{shift.department}</span>
                        <ChevronDown
                          className={`h-3.5 w-3.5 transition-transform duration-200 ${
                            isExpanded ? 'rotate-180' : ''
                          }`}
                        />
                      </button>
                    </div>

                    {/* Expandable shift details */}
                    {isExpanded && (
                      <div className="mt-3 pt-3 border-t border-[#E5E2DD]/60 text-xs space-y-2 bg-[#FAF7F3] rounded-xl p-3">
                        <div className="flex items-center justify-between text-[#8A8177]">
                          <span>Почасовая ставка:</span>
                          <span className="text-[#241E1A] font-medium">
                            {shift.hourlyRate || 1500} ₸ / ч
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-[#8A8177]">
                          <span>Начислено за смену:</span>
                          <span className="text-[#3D7C52] font-serif font-medium">
                            {shift.hours
                              ? `${(
                                  shift.hours * (shift.hourlyRate || 1500)
                                ).toLocaleString('ru-RU')} ₸`
                              : 'Рассчитывается при закрытии'}
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-[#8A8177]">
                          <span>Фиксация времени:</span>
                          <span className="text-[#241E1A]">
                            {shift.hasQr
                              ? 'Вход по личному QR-коду'
                              : 'Через рабочее приложение'}
                          </span>
                        </div>

                        {shift.isOpen && (
                          <div className="pt-2 border-t border-[#E5E2DD]/50">
                            <button
                              type="button"
                              onClick={() => {
                                setShifts(
                                  shifts.map((s) =>
                                    s.id === shift.id
                                      ? {
                                          ...s,
                                          isOpen: false,
                                          endTime: '18:00',
                                          hours: 9,
                                        }
                                      : s
                                  )
                                );
                                setActionAlert(
                                  `Смена для «${shift.employeeName}» закрыта (9 ч)`
                                );
                                setTimeout(() => setActionAlert(null), 3000);
                              }}
                              className="w-full bg-[#C2410C] hover:bg-[#A93A0C] text-white py-2 rounded-lg text-xs font-sans font-medium transition-colors cursor-pointer text-center"
                            >
                              Закрыть смену
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    );
  };

  if (activeTab === 'MANAGER_FINANCE') {
    return (
      <div className="flex-1 flex flex-col bg-[#FAF7F3] overflow-hidden select-none">
        {/* Action toast alert */}
        {actionAlert && (
          <div className="fixed top-5 left-1/2 -translate-x-1/2 z-50 bg-[#241E1A] text-white text-xs font-sans px-4 py-2.5 rounded-xl shadow-lg border border-white/10 flex items-center gap-2 max-w-[90vw]">
            <CheckCircle2 className="h-4 w-4 text-[#3D7C52] shrink-0" />
            <span>{actionAlert}</span>
            <button onClick={() => setActionAlert(null)} className="text-white/60 hover:text-white cursor-pointer ml-1">✕</button>
          </div>
        )}

        {/* Top Header: Title + Subtitle */}
        <div className="px-5 pt-7 pb-3 bg-[#FAF7F3] shrink-0">
          <h1 className="text-2xl font-serif font-medium text-[#241E1A] leading-tight">
            {t('Финансы', 'Finance')}
          </h1>
          <p className="text-xs text-[#8A8177] font-sans mt-0.5">
            {financeSubTab === 'TRANSACTIONS' && t('Движение денег', 'Cash flow & transactions')}
            {financeSubTab === 'ACCOUNTS' && t('Мои счета', 'Bank accounts & wallets')}
            {financeSubTab === 'SALARY' && t('Фонд оплаты труда', 'Payroll & compensation')}
          </p>

          {/* Segmented Control: [Транзакции] [Счета] [Зарплата] */}
          <div className="mt-3.5 bg-[#EAE6DE]/70 rounded-xl p-1 grid grid-cols-3 gap-1">
            <button
              type="button"
              onClick={() => setFinanceSubTab('TRANSACTIONS')}
              className={`py-2 rounded-lg text-xs font-sans transition-all cursor-pointer ${
                financeSubTab === 'TRANSACTIONS'
                  ? 'bg-[#241E1A] text-white font-medium shadow-xs'
                  : 'text-[#6E665E] hover:text-[#241E1A] font-normal'
              }`}
            >
              {t('Транзакции', 'Transactions')}
            </button>
            <button
              type="button"
              onClick={() => setFinanceSubTab('ACCOUNTS')}
              className={`py-2 rounded-lg text-xs font-sans transition-all cursor-pointer ${
                financeSubTab === 'ACCOUNTS'
                  ? 'bg-[#241E1A] text-white font-medium shadow-xs'
                  : 'text-[#6E665E] hover:text-[#241E1A] font-normal'
              }`}
            >
              {t('Счета', 'Accounts')}
            </button>
            <button
              type="button"
              onClick={() => setFinanceSubTab('SALARY')}
              className={`py-2 rounded-lg text-xs font-sans transition-all cursor-pointer ${
                financeSubTab === 'SALARY'
                  ? 'bg-[#241E1A] text-white font-medium shadow-xs'
                  : 'text-[#6E665E] hover:text-[#241E1A] font-normal'
              }`}
            >
              {t('Зарплата', 'Payroll')}
            </button>
          </div>
        </div>

        {/* Content switcher between Transactions, Accounts, and Salary */}
        {financeSubTab === 'TRANSACTIONS' && renderFinanceTransactionsView()}
        {financeSubTab === 'ACCOUNTS' && renderFinanceAccountsView()}
        {financeSubTab === 'SALARY' && renderFinanceSalaryView()}
      </div>
    );
  }

  // =========================================================================
  // TAB 3: БРОНИРОВАНИЕ (MANAGER_BOOKINGS) - SCREENSHOTS 1 TO 5
  // =========================================================================

  // Helper: Filtered bookings list
  const filteredBookings = managerBookings.filter((b) => {
    if (bookingCategoryFilter !== 'Все категории' && b.category !== bookingCategoryFilter) return false;
    if (bookingStatusFilter !== 'Все статусы' && b.statusRu !== bookingStatusFilter) return false;
    if (bookingGuestsFilter !== 'Любое количество') {
      if (bookingGuestsFilter === '1 гость' && b.guestsCount !== 1) return false;
      if (bookingGuestsFilter === '2 гостя' && b.guestsCount !== 2) return false;
      if (bookingGuestsFilter === '3 гостя' && b.guestsCount !== 3) return false;
      if (bookingGuestsFilter === '4+ гостей' && b.guestsCount < 4) return false;
    }
    if (managerBookingsSearch.trim()) {
      const q = managerBookingsSearch.toLowerCase();
      const matchesName = b.guestName.toLowerCase().includes(q) || b.shortName.toLowerCase().includes(q);
      const matchesRoom = b.roomNumber.toLowerCase().includes(q);
      const matchesPhone = b.phone.toLowerCase().includes(q);
      const matchesNumber = b.bookingNumber.toLowerCase().includes(q);
      if (!matchesName && !matchesRoom && !matchesPhone && !matchesNumber) return false;
    }
    return true;
  });

  // Helper: Filtered services catalog
  const filteredCatalogServices = catalogServices.filter((s) => {
    if (catalogAvailabilityFilter === 'Доступно' && !s.isAvailable) return false;
    if (catalogAvailabilityFilter === 'Недоступно' && s.isAvailable) return false;
    if (catalogResponsibleFilter !== 'Все' && s.responsible !== catalogResponsibleFilter) return false;
    if (catalogSearch.trim()) {
      const q = catalogSearch.toLowerCase();
      const matchesTitle = s.title.toLowerCase().includes(q);
      const matchesDesc = s.description.toLowerCase().includes(q);
      const matchesResp = s.responsible.toLowerCase().includes(q);
      if (!matchesTitle && !matchesDesc && !matchesResp) return false;
    }
    return true;
  });

  // Helper: Filtered service orders
  const filteredServiceOrders = serviceOrders.filter((o) => {
    if (orderStatusFilter !== 'Все статусы' && o.statusRu !== orderStatusFilter) return false;
    if (orderPaymentFilter === 'Оплачено' && !o.isPaid) return false;
    if (orderPaymentFilter === 'Не оплачено' && o.isPaid) return false;
    if (ordersSearch.trim()) {
      const q = ordersSearch.toLowerCase();
      const matchesGuest = o.guestName.toLowerCase().includes(q);
      const matchesTitle = o.serviceTitle.toLowerCase().includes(q);
      const matchesOrderNum = o.orderNumber.toLowerCase().includes(q);
      const matchesRoom = o.roomNumber.toLowerCase().includes(q);
      if (!matchesGuest && !matchesTitle && !matchesOrderNum && !matchesRoom) return false;
    }
    return true;
  });

  // Days for the Chessboard week dynamically generated from bookingsStartDate
  const bookingsAnchorDate = parseIsoDate(bookingsStartDate);
  const CHESS_DAYS = Array.from({ length: 7 }, (_, idx) => {
    const d = new Date(
      bookingsAnchorDate.getFullYear(),
      bookingsAnchorDate.getMonth(),
      bookingsAnchorDate.getDate() + idx
    );
    const iso = toIsoDate(d);
    const dayOfWeek = d.getDay();
    return {
      dayName: isEn ? WEEKDAYS_EN[dayOfWeek] : WEEKDAYS_RU[dayOfWeek],
      date: d.getDate(),
      iso,
      isToday: iso === '2026-11-16',
    };
  });

  // Chessboard Room Categories & Rooms
  const CHESS_ROOM_GROUPS = [
    {
      category: 'Lux',
      rooms: [
        { roomNumber: '№303', floor: 3, capacity: 4, cleanStatus: 'Чистая' },
      ],
    },
    {
      category: 'Стандарт',
      rooms: [
        { roomNumber: '№101', floor: 1, capacity: 2, cleanStatus: 'Чистая' },
        { roomNumber: '№102', floor: 1, capacity: 2, cleanStatus: 'Чистая' },
      ],
    },
    {
      category: 'Комфорт',
      rooms: [
        { roomNumber: '№201', floor: 2, capacity: 3, cleanStatus: 'Чистая' },
        { roomNumber: '№202', floor: 2, capacity: 3, cleanStatus: 'Чистая' },
      ],
    },
  ];

  // Render Sub-view 1: ROOMS (Chessboard & List)
  const renderManagerBookingsRoomsView = () => {
    return (
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Secondary Sub-Tabs: [Шахматка] [Список] */}
        <div className="px-5 pt-1 pb-3 flex items-center gap-6 border-b border-[#E5E2DD]/70 bg-[#FAF7F3]">
          <button
            type="button"
            onClick={() => setManagerRoomsSubTab('CHESS')}
            className={`text-xs font-sans pb-2 transition-all cursor-pointer relative ${
              managerRoomsSubTab === 'CHESS'
                ? 'text-[#C2410C] font-medium border-b-2 border-[#C2410C]'
                : 'text-[#8A8177] hover:text-[#241E1A] font-normal'
            }`}
          >
            Шахматка
          </button>
          <button
            type="button"
            onClick={() => setManagerRoomsSubTab('LIST')}
            className={`text-xs font-sans pb-2 transition-all cursor-pointer relative ${
              managerRoomsSubTab === 'LIST'
                ? 'text-[#C2410C] font-medium border-b-2 border-[#C2410C]'
                : 'text-[#8A8177] hover:text-[#241E1A] font-normal'
            }`}
          >
            Список
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto px-5 py-3.5 space-y-3.5 no-scrollbar select-none">
          {/* SEARCH & FILTER TOGGLE IN ONE ROW (user request) */}
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="h-4 w-4 text-[#8A8177] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={managerBookingsSearch}
                onChange={(e) => setManagerBookingsSearch(e.target.value)}
                placeholder="Гость, телефон или № брони"
                className="w-full bg-white border border-[#E5E2DD] rounded-xl pl-10 pr-3.5 py-3 text-xs text-[#241E1A] placeholder:text-[#8A8177]/70 focus:outline-none focus:border-[#C2410C] shadow-2xs"
              />
            </div>
            <button
              type="button"
              onClick={() => setShowBookingsFilters(!showBookingsFilters)}
              className={`h-11 w-11 rounded-xl border flex items-center justify-center shrink-0 transition-all cursor-pointer shadow-2xs ${
                showBookingsFilters ||
                bookingCategoryFilter !== 'Все категории' ||
                bookingGuestsFilter !== 'Любое количество' ||
                bookingStatusFilter !== 'Все статусы'
                  ? 'bg-[#241E1A] text-white border-[#241E1A]'
                  : 'bg-white text-[#241E1A] border-[#E5E2DD] hover:bg-slate-50'
              }`}
              title="Фильтры"
            >
              <Filter className="h-4.5 w-4.5" />
            </button>
          </div>

          {/* EXPANDABLE FILTERS (hidden until filter button clicked) */}
          {showBookingsFilters && (
            <div className="p-3.5 bg-white border border-[#E5E2DD] rounded-2xl shadow-2xs space-y-3 animate-in fade-in duration-200">
              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-[11px] font-sans text-[#8A8177] mb-1">
                    Категория
                  </label>
                  <div className="relative">
                    <select
                      value={bookingCategoryFilter}
                      onChange={(e) => setBookingCategoryFilter(e.target.value)}
                      className="w-full bg-[#FAF7F3] border border-[#E5E2DD] rounded-xl px-3 py-2.5 text-xs text-[#241E1A] focus:outline-none focus:border-[#C2410C] appearance-none pr-8 cursor-pointer"
                    >
                      <option value="Все категории">Все категории</option>
                      <option value="Lux">Lux</option>
                      <option value="Стандарт">Стандарт</option>
                      <option value="Комфорт">Комфорт</option>
                    </select>
                    <ChevronDown className="h-4 w-4 text-[#8A8177] absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-sans text-[#8A8177] mb-1">
                    Гостей
                  </label>
                  <div className="relative">
                    <select
                      value={bookingGuestsFilter}
                      onChange={(e) => setBookingGuestsFilter(e.target.value)}
                      className="w-full bg-[#FAF7F3] border border-[#E5E2DD] rounded-xl px-3 py-2.5 text-xs text-[#241E1A] focus:outline-none focus:border-[#C2410C] appearance-none pr-8 cursor-pointer"
                    >
                      <option value="Любое количество">Любое количество</option>
                      <option value="1 гость">1 гость</option>
                      <option value="2 гостя">2 гостя</option>
                      <option value="3 гостя">3 гостя</option>
                      <option value="4+ гостей">4+ гостей</option>
                    </select>
                    <ChevronDown className="h-4 w-4 text-[#8A8177] absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-sans text-[#8A8177] mb-1">
                  Статус и источник
                </label>
                <div className="relative">
                  <select
                    value={bookingStatusFilter}
                    onChange={(e) => setBookingStatusFilter(e.target.value)}
                    className="w-full bg-[#FAF7F3] border border-[#E5E2DD] rounded-xl px-3 py-2.5 text-xs text-[#241E1A] focus:outline-none focus:border-[#C2410C] appearance-none pr-8 cursor-pointer"
                  >
                    <option value="Все статусы">Все статусы</option>
                    <option value="Новая">Новая</option>
                    <option value="Подтверждена">Подтверждена</option>
                    <option value="Заселён">Заселён</option>
                    <option value="Выехал">Выехал</option>
                  </select>
                  <ChevronDown className="h-4 w-4 text-[#8A8177] absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>
              </div>

              {(bookingCategoryFilter !== 'Все категории' ||
                bookingGuestsFilter !== 'Любое количество' ||
                bookingStatusFilter !== 'Все статусы') && (
                <div className="pt-1 flex justify-end">
                  <button
                    type="button"
                    onClick={() => {
                      setBookingCategoryFilter('Все категории');
                      setBookingGuestsFilter('Любое количество');
                      setBookingStatusFilter('Все статусы');
                    }}
                    className="text-xs text-[#C2410C] hover:underline cursor-pointer"
                  >
                    Сбросить фильтры
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Period Selector Bar (same style & controls as Analytics Dashboard) */}
          <div className="relative py-0.5">
            <div className="flex items-center justify-between text-xs font-sans">
              {/* Left: Clickable Calendar Icon & Date Range */}
              <button
                type="button"
                onClick={() => {
                  setShowBookingsCalendarPicker(!showBookingsCalendarPicker);
                  setShowBookingsPeriodDropdown(false);
                }}
                className="flex items-center gap-2 text-[#241E1A] font-medium hover:text-[#C2410C] transition-colors cursor-pointer py-1"
                title={t('Выбрать даты периода', 'Select date range')}
              >
                <Calendar className="h-4 w-4 text-[#C2410C]" strokeWidth={2} />
                <span>{bookingsPeriodText}</span>
              </button>

              {/* Right: Timeframe Dropdown (День / Неделя / Месяц / Год) & Prev/Next < > */}
              <div className="flex items-center gap-2 text-[#8A8177]">
                {/* Dropdown "День / Неделя / Месяц / Год" */}
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => {
                      setShowBookingsPeriodDropdown(!showBookingsPeriodDropdown);
                      setShowBookingsCalendarPicker(false);
                    }}
                    className="flex items-center gap-1 hover:text-[#241E1A] cursor-pointer py-1 px-1.5 rounded-lg hover:bg-black/5 transition-colors"
                  >
                    <span>{getPeriodOptionLabel(bookingsPeriodType)}</span>
                    <ChevronDown
                      className={`h-3.5 w-3.5 transition-transform duration-150 ${
                        showBookingsPeriodDropdown ? 'rotate-180' : ''
                      }`}
                    />
                  </button>

                  {showBookingsPeriodDropdown && (
                    <div className="absolute right-0 top-full mt-1.5 w-36 bg-white border border-[#E5E2DD] rounded-xl shadow-lg py-1.5 z-30 animate-in fade-in zoom-in-95 duration-150">
                      {PERIOD_OPTIONS.map((opt) => {
                        const isSelected = bookingsPeriodType === opt.id;
                        return (
                          <button
                            key={opt.id}
                            type="button"
                            onClick={() => {
                              setBookingsPeriodType(opt.id);
                              const [newStart, newEnd] = computeRangeForMode(
                                bookingsStartDate,
                                opt.id
                              );
                              setBookingsStartDate(newStart);
                              setBookingsEndDate(newEnd);
                              setShowBookingsPeriodDropdown(false);
                            }}
                            className={`w-full px-3.5 py-2 text-left text-xs font-sans flex items-center justify-between transition-colors cursor-pointer ${
                              isSelected
                                ? 'bg-[#FAF7F3] text-[#C2410C] font-medium'
                                : 'text-[#241E1A] hover:bg-[#FAF7F3]/60'
                            }`}
                          >
                            <span>{t(opt.labelRu, opt.labelEn)}</span>
                            {isSelected && <Check className="h-3.5 w-3.5 text-[#C2410C]" />}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Prev / Next buttons (< >) */}
                <div className="flex items-center gap-1 pl-1">
                  <button
                    type="button"
                    onClick={() => {
                      const [prevS, prevE] = shiftRange(
                        bookingsStartDate,
                        bookingsEndDate,
                        bookingsPeriodType,
                        -1
                      );
                      setBookingsStartDate(prevS);
                      setBookingsEndDate(prevE);
                    }}
                    className="p-1 hover:text-[#241E1A] hover:bg-black/5 rounded-lg transition-colors cursor-pointer"
                    title={t('Предыдущий период', 'Previous period')}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const [nextS, nextE] = shiftRange(
                        bookingsStartDate,
                        bookingsEndDate,
                        bookingsPeriodType,
                        1
                      );
                      setBookingsStartDate(nextS);
                      setBookingsEndDate(nextE);
                    }}
                    className="p-1 hover:text-[#241E1A] hover:bg-black/5 rounded-lg transition-colors cursor-pointer"
                    title={t('Следующий период', 'Next period')}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>

            {/* Expandable Calendar Range Picker (От какого числа — до какого) */}
            {showBookingsCalendarPicker && (
              <div className="mt-2.5 p-3.5 bg-white border border-[#E5E2DD] rounded-2xl shadow-md space-y-3 z-20 animate-in fade-in duration-150">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-sans font-medium text-[#241E1A]">
                    {t('Выбор периода', 'Select Date Range')} ({getPeriodOptionLabel(bookingsPeriodType)})
                  </span>
                  <button
                    type="button"
                    onClick={() => setShowBookingsCalendarPicker(false)}
                    className="text-[#8A8177] hover:text-[#241E1A] cursor-pointer"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-2.5">
                  <div>
                    <label className="block text-[10px] font-sans text-[#8A8177] mb-1">
                      {t('От (с числа)', 'From')}
                    </label>
                    <input
                      type="date"
                      value={bookingsStartDate}
                      onChange={(e) => {
                        const val = e.target.value;
                        if (!val) return;
                        setBookingsStartDate(val);
                        const [, autoEnd] = computeRangeForMode(val, bookingsPeriodType);
                        setBookingsEndDate(autoEnd);
                      }}
                      className="w-full bg-[#FAF7F3] border border-[#E5E2DD] rounded-xl px-2.5 py-2 text-xs text-[#241E1A] focus:outline-none focus:border-[#C2410C]"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-sans text-[#8A8177] mb-1">
                      {t('До (по число)', 'To')}
                    </label>
                    <input
                      type="date"
                      value={bookingsEndDate}
                      min={bookingsStartDate}
                      onChange={(e) => {
                        const val = e.target.value;
                        if (!val) return;
                        setBookingsEndDate(val);
                      }}
                      className="w-full bg-[#FAF7F3] border border-[#E5E2DD] rounded-xl px-2.5 py-2 text-xs text-[#241E1A] focus:outline-none focus:border-[#C2410C]"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between pt-1">
                  <span className="text-[11px] text-[#8A8177] font-sans">
                    {bookingsPeriodText}
                  </span>
                  <button
                    type="button"
                    onClick={() => setShowBookingsCalendarPicker(false)}
                    className="px-4 py-1.5 bg-[#C2410C] hover:bg-[#A93A0C] text-white text-xs font-sans font-medium rounded-xl transition-colors cursor-pointer"
                  >
                    {t('Применить', 'Apply')}
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Status Legends (Screenshot 1 & 2) */}
          <div className="flex items-center gap-3.5 text-[11px] font-sans text-[#8A8177] overflow-x-auto no-scrollbar pb-1">
            <div className="flex items-center gap-1.5 shrink-0">
              <span className="h-2 w-2 rounded-full bg-[#E89234]" />
              <span>Новая</span>
            </div>
            <div className="flex items-center gap-1.5 shrink-0">
              <span className="h-2 w-2 rounded-full bg-[#3D7C52]" />
              <span>Подтверждена</span>
            </div>
            <div className="flex items-center gap-1.5 shrink-0">
              <span className="h-2 w-2 rounded-full bg-[#C2410C]" />
              <span>Заселён</span>
            </div>
            <div className="flex items-center gap-1.5 shrink-0">
              <span className="h-2 w-2 rounded-full bg-[#8A8177]" />
              <span>Выехал</span>
            </div>
          </div>

          {/* ================= VIEW: CHESSBOARD (Шахматка - Screenshot 1) ================= */}
          {managerRoomsSubTab === 'CHESS' ? (
            <div className="bg-white rounded-2xl border border-[#E5E2DD] shadow-2xs overflow-hidden">
              <div className="overflow-x-auto no-scrollbar">
                <div className="min-w-[580px]">
                  {/* Table Header: Номер | ПН 16 | ВТ 17 | СР 18 | ЧТ 19 | ПТ 20 | СБ 21 | ВС 22 */}
                  <div className="grid grid-cols-[110px_repeat(7,1fr)] border-b border-[#E5E2DD] bg-[#FAF7F3] text-center">
                    <div className="p-3 text-left font-sans font-medium text-xs text-[#241E1A] flex items-center">
                      Номер
                    </div>
                    {CHESS_DAYS.map((d) => (
                      <div
                        key={d.date}
                        className={`p-2.5 border-l border-[#E5E2DD] transition-colors ${
                          d.isToday ? 'bg-[#F5EFE6]' : ''
                        }`}
                      >
                        <div className="text-[10px] font-sans text-[#8A8177]">
                          {d.dayName}
                        </div>
                        <div className="text-sm font-sans font-medium text-[#241E1A] mt-0.5">
                          {d.date}
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Room Categories & Rows */}
                  {CHESS_ROOM_GROUPS.map((group) => {
                    // Check if group is filtered out
                    if (
                      bookingCategoryFilter !== 'Все категории' &&
                      group.category !== bookingCategoryFilter
                    ) {
                      return null;
                    }

                    return (
                      <div key={group.category} className="divide-y divide-[#E5E2DD]/50">
                        {/* Category header row */}
                        <div className="bg-[#FAF7F3]/70 px-3.5 py-1.5 text-[11px] font-sans font-medium text-[#8A8177] border-t border-[#E5E2DD]">
                          {group.category}
                        </div>

                        {/* Room Rows in this Category */}
                        {group.rooms.map((room) => {
                          // Find bookings for this room
                          const roomBookings = filteredBookings.filter(
                            (b) => b.roomNumber === room.roomNumber
                          );

                          return (
                            <div
                              key={room.roomNumber}
                              className="grid grid-cols-[110px_repeat(7,1fr)] min-h-[64px] border-b border-[#E5E2DD]/60 relative hover:bg-slate-50/50 transition-colors"
                            >
                              {/* Left Room Info Cell */}
                              <div className="p-2.5 flex flex-col justify-between border-r border-[#E5E2DD] bg-white">
                                <div>
                                  <span className="font-sans font-medium text-xs text-[#241E1A]">
                                    {room.roomNumber}
                                  </span>
                                  <span className="text-[9px] text-[#8A8177] block mt-0.5">
                                    {room.floor} этаж · {room.capacity} гостя
                                  </span>
                                </div>
                                <span className="bg-[#EBF4EE] text-[#3D7C52] text-[9px] font-medium px-1.5 py-0.5 rounded w-fit">
                                  {room.cleanStatus}
                                </span>
                              </div>

                              {/* 7 Day Grid Cells (Background) */}
                              {CHESS_DAYS.map((d) => (
                                <div
                                  key={d.date}
                                  className={`border-r border-[#E5E2DD]/40 relative ${
                                    d.isToday ? 'bg-[#F5EFE6]/30' : ''
                                  }`}
                                />
                              ))}

                              {/* Render Booking Bars on Top */}
                              {roomBookings.map((b) => {
                                // Calculate offset and width across 7 days (16 to 22)
                                const startCol = Math.max(0, b.startDay - 16);
                                const endCol = Math.min(7, b.endDay - 16);
                                const span = Math.max(1, endCol - startCol);

                                // Style according to status
                                let barBg = 'bg-[#EAF3EC] border-[#3D7C52] text-[#241E1A]';
                                if (b.status === 'CHECKED_IN') {
                                  barBg = 'bg-[#FDF0EB] border-[#C2410C] text-[#241E1A]';
                                } else if (b.status === 'NEW') {
                                  barBg = 'bg-[#FDF3E3] border-[#E89234] text-[#241E1A]';
                                } else if (b.status === 'CHECKED_OUT') {
                                  barBg = 'bg-[#F1EFEA] border-[#8A8177] text-[#241E1A]';
                                }

                                return (
                                  <div
                                    key={b.id}
                                    onClick={() => setSelectedBookingForModal(b)}
                                    style={{
                                      left: `calc(110px + ${startCol} * ((100% - 110px) / 7) + 3px)`,
                                      width: `calc(${span} * ((100% - 110px) / 7) - 6px)`,
                                    }}
                                    className={`absolute top-2 bottom-2 rounded-xl border-l-4 p-2 shadow-2xs flex flex-col justify-between cursor-pointer transition-transform hover:scale-[1.01] active:scale-[0.99] z-10 ${barBg}`}
                                    title={`${b.guestName} (${b.statusRu})`}
                                  >
                                    <div className="font-sans font-medium text-xs truncate">
                                      {b.shortName}
                                    </div>
                                    <div className="text-[10px] text-[#8A8177] font-sans truncate">
                                      {b.statusRu}
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          );
                        })}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          ) : (
            /* ================= VIEW: LIST (Список - Screenshot 2) ================= */
            <div className="space-y-2.5">
              {filteredBookings.length === 0 ? (
                <div className="bg-white rounded-2xl border border-[#E5E2DD] p-6 text-center shadow-2xs">
                  <p className="text-xs text-[#8A8177] font-sans">
                    Бронирований по заданным параметрам не найдено
                  </p>
                </div>
              ) : (
                filteredBookings.map((b) => {
                  let badgeStyle = 'bg-[#EAF3EC] text-[#3D7C52]';
                  if (b.status === 'CHECKED_IN') {
                    badgeStyle = 'bg-[#FDF0EB] text-[#C2410C]';
                  } else if (b.status === 'NEW') {
                    badgeStyle = 'bg-[#FDF3E3] text-[#B87A28]';
                  } else if (b.status === 'CHECKED_OUT') {
                    badgeStyle = 'bg-[#F1EFEA] text-[#6E665E]';
                  }

                  return (
                    <div
                      key={b.id}
                      onClick={() => setSelectedBookingForModal(b)}
                      className="bg-white rounded-2xl border border-[#E5E2DD] p-4 shadow-2xs space-y-2 cursor-pointer hover:border-[#C2410C]/40 transition-all active:scale-[0.99]"
                    >
                      {/* Top Row: Guest Name & Status Badge */}
                      <div className="flex items-start justify-between gap-2">
                        <span className="font-sans font-medium text-sm text-[#241E1A]">
                          {b.guestName}
                        </span>
                        <span
                          className={`text-xs font-medium px-2.5 py-0.5 rounded-md font-sans shrink-0 ${badgeStyle}`}
                        >
                          {b.statusRu}
                        </span>
                      </div>

                      {/* Subtitle: Room · Category · Guests */}
                      <div className="text-xs text-[#8A8177] font-sans">
                        {b.roomNumber} · {b.category} · {b.guestsCount} гостя
                      </div>

                      {/* Bottom Row: Date Range & Nights with Chevron */}
                      <div className="flex items-center justify-between pt-1">
                        <span className="text-xs font-sans text-[#241E1A]">
                          {b.datesText}
                        </span>
                        <div className="flex items-center gap-1 text-xs text-[#8A8177]">
                          <span>{b.nightsText}</span>
                          <ChevronDown className="h-3.5 w-3.5" />
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          )}
        </div>
      </div>
    );
  };

  // Render Sub-view 2: SERVICES (Catalog & Orders)
  const renderManagerBookingsServicesView = () => {
    return (
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Secondary Sub-Tabs: [Каталог] [Заявки и брони] */}
        <div className="px-5 pt-1 pb-3 flex items-center gap-6 border-b border-[#E5E2DD]/70 bg-[#FAF7F3]">
          <button
            type="button"
            onClick={() => setManagerServicesSubTab('CATALOG')}
            className={`text-xs font-sans pb-2 transition-all cursor-pointer relative ${
              managerServicesSubTab === 'CATALOG'
                ? 'text-[#C2410C] font-medium border-b-2 border-[#C2410C]'
                : 'text-[#8A8177] hover:text-[#241E1A] font-normal'
            }`}
          >
            {t('Каталог', 'Catalog')}
          </button>
          <button
            type="button"
            onClick={() => setManagerServicesSubTab('ORDERS')}
            className={`text-xs font-sans pb-2 transition-all cursor-pointer relative ${
              managerServicesSubTab === 'ORDERS'
                ? 'text-[#C2410C] font-medium border-b-2 border-[#C2410C]'
                : 'text-[#8A8177] hover:text-[#241E1A] font-normal'
            }`}
          >
            {t('Заявки и брони', 'Orders & Bookings')}
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto px-5 py-3.5 space-y-3.5 no-scrollbar select-none">
          {/* ================= SUB-TAB 1: CATALOG (Каталог - Screenshots 3 & 4) ================= */}
          {managerServicesSubTab === 'CATALOG' ? (
            <>
              {/* SEARCH & FILTER TOGGLE IN ONE ROW */}
              <div className="flex items-center gap-2">
                <div className="relative flex-1">
                  <Search className="h-4 w-4 text-[#8A8177] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="text"
                    value={catalogSearch}
                    onChange={(e) => setCatalogSearch(e.target.value)}
                    placeholder="Название услуги или ответственный"
                    className="w-full bg-white border border-[#E5E2DD] rounded-xl pl-10 pr-3.5 py-3 text-xs text-[#241E1A] placeholder:text-[#8A8177]/70 focus:outline-none focus:border-[#C2410C] shadow-2xs"
                  />
                </div>
                <button
                  type="button"
                  onClick={() => setShowCatalogFilters(!showCatalogFilters)}
                  className={`h-11 w-11 rounded-xl border flex items-center justify-center shrink-0 transition-all cursor-pointer shadow-2xs ${
                    showCatalogFilters ||
                    catalogAvailabilityFilter !== 'Все услуги' ||
                    catalogResponsibleFilter !== 'Все'
                      ? 'bg-[#241E1A] text-white border-[#241E1A]'
                      : 'bg-white text-[#241E1A] border-[#E5E2DD] hover:bg-slate-50'
                  }`}
                  title="Фильтры"
                >
                  <Filter className="h-4.5 w-4.5" />
                </button>
              </div>

              {/* EXPANDABLE FILTERS */}
              {showCatalogFilters && (
                <div className="p-3.5 bg-white border border-[#E5E2DD] rounded-2xl shadow-2xs space-y-2.5 animate-in fade-in duration-200">
                  <div className="grid grid-cols-2 gap-2.5">
                    <div>
                      <label className="block text-[11px] font-sans text-[#8A8177] mb-1">
                        Доступность
                      </label>
                      <div className="relative">
                        <select
                          value={catalogAvailabilityFilter}
                          onChange={(e) => setCatalogAvailabilityFilter(e.target.value)}
                          className="w-full bg-[#FAF7F3] border border-[#E5E2DD] rounded-xl px-3 py-2.5 text-xs text-[#241E1A] focus:outline-none focus:border-[#C2410C] appearance-none pr-8 cursor-pointer"
                        >
                          <option value="Все услуги">Все услуги</option>
                          <option value="Доступно">Доступно</option>
                          <option value="Недоступно">Недоступно</option>
                        </select>
                        <ChevronDown className="h-4 w-4 text-[#8A8177] absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                      </div>
                    </div>

                    <div>
                      <label className="block text-[11px] font-sans text-[#8A8177] mb-1">
                        Ответственный
                      </label>
                      <div className="relative">
                        <select
                          value={catalogResponsibleFilter}
                          onChange={(e) => setCatalogResponsibleFilter(e.target.value)}
                          className="w-full bg-[#FAF7F3] border border-[#E5E2DD] rounded-xl px-3 py-2.5 text-xs text-[#241E1A] focus:outline-none focus:border-[#C2410C] appearance-none pr-8 cursor-pointer"
                        >
                          <option value="Все">Все</option>
                          <option value="porter">porter</option>
                          <option value="Бекова Гульнара Ерлановна">Бекова Гульнара Ерлановна</option>
                          <option value="Ербол Нуржанов">Ербол Нуржанов</option>
                          <option value="Ресторан Sollviera">Ресторан Sollviera</option>
                        </select>
                        <ChevronDown className="h-4 w-4 text-[#8A8177] absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Action Button: + Новая услуга ˇ (Screenshot 3) */}
              <div className="bg-white rounded-2xl border border-[#E5E2DD] shadow-2xs overflow-hidden transition-all">
                <button
                  type="button"
                  onClick={() => setAddServiceOpen(!addServiceOpen)}
                  className="w-full p-4 flex items-center justify-between cursor-pointer hover:bg-slate-50 transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <span className="text-[#C2410C] font-semibold text-lg leading-none">+</span>
                    <span className="text-xs font-sans font-medium text-[#241E1A]">
                      Новая услуга
                    </span>
                  </div>
                  <ChevronDown
                    className={`h-4 w-4 text-[#8A8177] transition-transform duration-200 ${
                      addServiceOpen ? 'rotate-180' : ''
                    }`}
                  />
                </button>

                {/* Form inside + Новая услуга */}
                {addServiceOpen && (
                  <div className="p-4 pt-1 border-t border-[#E5E2DD]/60 space-y-3 bg-[#FAF7F3]/50">
                    <div>
                      <label className="block text-[11px] font-sans text-[#8A8177] mb-1">
                        Название услуги
                      </label>
                      <input
                        type="text"
                        value={newServiceName}
                        onChange={(e) => setNewServiceName(e.target.value)}
                        placeholder="Например: Аренда конференц-зала"
                        className="w-full bg-white border border-[#E5E2DD] rounded-xl px-3.5 py-2.5 text-xs text-[#241E1A] placeholder:text-[#8A8177]/60 focus:outline-none focus:border-[#C2410C]"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-sans text-[#8A8177] mb-1">
                        Краткое описание
                      </label>
                      <input
                        type="text"
                        value={newServiceDesc}
                        onChange={(e) => setNewServiceDesc(e.target.value)}
                        placeholder="Описание услуги для гостя"
                        className="w-full bg-white border border-[#E5E2DD] rounded-xl px-3.5 py-2.5 text-xs text-[#241E1A] placeholder:text-[#8A8177]/60 focus:outline-none focus:border-[#C2410C]"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-[11px] font-sans text-[#8A8177] mb-1">
                          Ответственный
                        </label>
                        <input
                          type="text"
                          value={newServiceResponsible}
                          onChange={(e) => setNewServiceResponsible(e.target.value)}
                          placeholder="porter / администратор"
                          className="w-full bg-white border border-[#E5E2DD] rounded-xl px-3 py-2.5 text-xs text-[#241E1A] focus:outline-none focus:border-[#C2410C]"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-sans text-[#8A8177] mb-1">
                          Стоимость (₸)
                        </label>
                        <input
                          type="number"
                          value={newServicePrice}
                          onChange={(e) => setNewServicePrice(e.target.value)}
                          placeholder="5 000"
                          className="w-full bg-white border border-[#E5E2DD] rounded-xl px-3.5 py-2.5 text-xs text-[#241E1A] focus:outline-none focus:border-[#C2410C]"
                        />
                      </div>
                    </div>

                    <div className="flex items-center gap-2 pt-1">
                      <button
                        type="button"
                        onClick={() => {
                          if (!newServiceName.trim()) {
                            setActionAlert('Введите название услуги');
                            setTimeout(() => setActionAlert(null), 3000);
                            return;
                          }
                          const pr = parseFloat(newServicePrice) || 0;
                          const createdService: CatalogServiceItem = {
                            id: `cs-${Date.now()}`,
                            title: newServiceName.trim(),
                            description: newServiceDesc.trim() || 'Гостиничная услуга',
                            responsible: newServiceResponsible.trim() || 'porter',
                            price: `${pr.toLocaleString('ru-RU')} ₸`,
                            numericPrice: pr,
                            isAvailable: true,
                          };
                          setCatalogServices([createdService, ...catalogServices]);
                          setNewServiceName('');
                          setNewServiceDesc('');
                          setNewServicePrice('');
                          setAddServiceOpen(false);
                          setActionAlert(`Услуга «${createdService.title}» добавлена в каталог`);
                          setTimeout(() => setActionAlert(null), 3000);
                        }}
                        className="flex-1 bg-[#C2410C] hover:bg-[#A93A0C] text-white rounded-xl py-2.5 text-xs font-sans font-medium transition-colors cursor-pointer text-center"
                      >
                        Сохранить услугу
                      </button>
                      <button
                        type="button"
                        onClick={() => setAddServiceOpen(false)}
                        className="px-4 bg-white hover:bg-slate-50 border border-[#E5E2DD] text-[#8A8177] rounded-xl py-2.5 text-xs font-sans transition-colors cursor-pointer"
                      >
                        Отмена
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Catalog Cards List (Screenshots 3 & 4) */}
              <div className="space-y-3.5">
                {filteredCatalogServices.map((service) => {
                  const isManageOpen = expandedServiceManageId === service.id;

                  return (
                    <div
                      key={service.id}
                      className="bg-white rounded-2xl border border-[#E5E2DD] p-4.5 shadow-2xs space-y-2.5"
                    >
                      {/* Top Row: Title & Badge */}
                      <div className="flex items-start justify-between gap-2">
                        <h4 className="font-serif font-medium text-lg text-[#241E1A] leading-snug">
                          {service.title}
                        </h4>
                        <span className="bg-[#EAF3EC] text-[#3D7C52] text-[10px] font-medium px-2 py-0.5 rounded-md font-sans shrink-0">
                          {service.isAvailable ? 'Доступно' : 'Недоступно'}
                        </span>
                      </div>

                      {/* Description */}
                      <p className="text-xs text-[#8A8177] font-sans leading-relaxed">
                        {service.description}
                      </p>

                      {/* Responsible Person */}
                      <div className="flex items-center gap-1.5 text-xs text-[#8A8177] font-sans">
                        <User className="h-3.5 w-3.5 text-[#8A8177]" />
                        <span>{service.responsible}</span>
                      </div>

                      {/* Price Number */}
                      <div className="text-2xl font-serif font-medium text-[#241E1A] pt-1">
                        {service.price}
                      </div>

                      {/* Button: Забронировать (Screenshot 3 & 4) */}
                      <button
                        type="button"
                        onClick={() => setBookingServiceModalItem(service)}
                        className="w-full bg-[#C2410C] hover:bg-[#A93A0C] text-white py-3 rounded-xl font-sans font-medium text-xs shadow-xs transition-transform active:scale-[0.99] cursor-pointer text-center"
                      >
                        Забронировать
                      </button>

                      {/* Accordion Box: Управление услугой ˇ */}
                      <div className="rounded-xl border border-[#E5E2DD] overflow-hidden transition-all pt-0.5">
                        <button
                          type="button"
                          onClick={() =>
                            setExpandedServiceManageId(isManageOpen ? null : service.id)
                          }
                          className="w-full p-3 flex items-center justify-between bg-white hover:bg-[#FAF7F3] transition-colors cursor-pointer text-left"
                        >
                          <span className="text-xs font-sans text-[#241E1A]">
                            Управление услугой
                          </span>
                          <ChevronDown
                            className={`h-4 w-4 text-[#8A8177] transition-transform duration-200 ${
                              isManageOpen ? 'rotate-180' : ''
                            }`}
                          />
                        </button>

                        {/* Inside Manage when expanded */}
                        {isManageOpen && (
                          <div className="p-3.5 bg-[#FAF7F3]/70 border-t border-[#E5E2DD]/60 space-y-2.5 text-xs">
                            <div className="flex items-center justify-between text-[#8A8177]">
                              <span>Статус в каталоге:</span>
                              <span className="text-[#3D7C52] font-medium">Активна для заказа</span>
                            </div>
                            <div className="flex items-center justify-between text-[#8A8177]">
                              <span>Назначенный исполнитель:</span>
                              <span className="text-[#241E1A] font-medium">{service.responsible}</span>
                            </div>

                            <div className="grid grid-cols-2 gap-2 pt-2 border-t border-[#E5E2DD]/50">
                              <button
                                type="button"
                                onClick={() => {
                                  setActionAlert(`Параметры услуги «${service.title}» обновлены`);
                                  setTimeout(() => setActionAlert(null), 3000);
                                }}
                                className="bg-white border border-[#E5E2DD] hover:bg-slate-50 py-2 rounded-lg text-xs font-sans text-[#241E1A] font-medium transition-colors cursor-pointer text-center"
                              >
                                Редактировать
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  setCatalogServices(
                                    catalogServices.map((s) =>
                                      s.id === service.id
                                        ? { ...s, isAvailable: !s.isAvailable }
                                        : s
                                    )
                                  );
                                  setActionAlert(
                                    service.isAvailable
                                      ? `Услуга «${service.title}» временно приостановлена`
                                      : `Услуга «${service.title}» снова доступна`
                                  );
                                  setTimeout(() => setActionAlert(null), 3000);
                                }}
                                className="bg-white border border-[#E5E2DD] hover:bg-rose-50 text-[#B3261E] py-2 rounded-lg text-xs font-sans transition-colors cursor-pointer text-center"
                              >
                                {service.isAvailable ? 'Приостановить' : 'Включить'}
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          ) : (
            /* ================= SUB-TAB 2: ORDERS (Заявки и брони - Screenshot 5) ================= */
            <>
              {/* SEARCH & FILTER TOGGLE IN ONE ROW */}
              <div className="flex items-center gap-2">
                <div className="relative flex-1">
                  <Search className="h-4 w-4 text-[#8A8177] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="text"
                    value={ordersSearch}
                    onChange={(e) => setOrdersSearch(e.target.value)}
                    placeholder="Гость, услуга или № заявки"
                    className="w-full bg-white border border-[#E5E2DD] rounded-xl pl-10 pr-3.5 py-3 text-xs text-[#241E1A] placeholder:text-[#8A8177]/70 focus:outline-none focus:border-[#C2410C] shadow-2xs"
                  />
                </div>
                <button
                  type="button"
                  onClick={() => setShowOrdersFilters(!showOrdersFilters)}
                  className={`h-11 w-11 rounded-xl border flex items-center justify-center shrink-0 transition-all cursor-pointer shadow-2xs ${
                    showOrdersFilters ||
                    orderStatusFilter !== 'Все статусы' ||
                    orderPaymentFilter !== 'Любая'
                      ? 'bg-[#241E1A] text-white border-[#241E1A]'
                      : 'bg-white text-[#241E1A] border-[#E5E2DD] hover:bg-slate-50'
                  }`}
                  title="Фильтры"
                >
                  <Filter className="h-4.5 w-4.5" />
                </button>
              </div>

              {/* EXPANDABLE FILTERS */}
              {showOrdersFilters && (
                <div className="p-3.5 bg-white border border-[#E5E2DD] rounded-2xl shadow-2xs space-y-2.5 animate-in fade-in duration-200">
                  <div className="grid grid-cols-2 gap-2.5">
                    <div>
                      <label className="block text-[11px] font-sans text-[#8A8177] mb-1">
                        Статус
                      </label>
                      <div className="relative">
                        <select
                          value={orderStatusFilter}
                          onChange={(e) => setOrderStatusFilter(e.target.value)}
                          className="w-full bg-[#FAF7F3] border border-[#E5E2DD] rounded-xl px-3 py-2.5 text-xs text-[#241E1A] focus:outline-none focus:border-[#C2410C] appearance-none pr-8 cursor-pointer"
                        >
                          <option value="Все статусы">Все статусы</option>
                          <option value="Подтверждена">Подтверждена</option>
                          <option value="Выполнена">Выполнена</option>
                          <option value="В работе">В работе</option>
                          <option value="Отменена">Отменена</option>
                        </select>
                        <ChevronDown className="h-4 w-4 text-[#8A8177] absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                      </div>
                    </div>

                    <div>
                      <label className="block text-[11px] font-sans text-[#8A8177] mb-1">
                        Оплата
                      </label>
                      <div className="relative">
                        <select
                          value={orderPaymentFilter}
                          onChange={(e) => setOrderPaymentFilter(e.target.value)}
                          className="w-full bg-[#FAF7F3] border border-[#E5E2DD] rounded-xl px-3 py-2.5 text-xs text-[#241E1A] focus:outline-none focus:border-[#C2410C] appearance-none pr-8 cursor-pointer"
                        >
                          <option value="Любая">Любая</option>
                          <option value="Оплачено">Оплачено</option>
                          <option value="Не оплачено">Не оплачено</option>
                        </select>
                        <ChevronDown className="h-4 w-4 text-[#8A8177] absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Orders List (Screenshot 5) */}
              <div className="space-y-2.5">
                {filteredServiceOrders.length === 0 ? (
                  <div className="bg-white rounded-2xl border border-[#E5E2DD] p-6 text-center shadow-2xs">
                    <p className="text-xs text-[#8A8177] font-sans">
                      Заявок по заданным параметрам не найдено
                    </p>
                  </div>
                ) : (
                  filteredServiceOrders.map((order) => {
                    const isExpanded = expandedOrderId === order.id;

                    let statusBadgeClass = 'bg-[#FDF3E3] text-[#B87A28]';
                    if (order.status === 'DONE') {
                      statusBadgeClass = 'bg-[#EAF3EC] text-[#3D7C52]';
                    } else if (order.status === 'CANCELLED') {
                      statusBadgeClass = 'bg-[#F1EFEA] text-[#8A8177]';
                    }

                    return (
                      <div
                        key={order.id}
                        className="bg-white rounded-2xl border border-[#E5E2DD] p-4 shadow-2xs space-y-2 transition-all"
                      >
                        {/* Top Row: Service Title & Order Number */}
                        <div className="flex items-start justify-between gap-2">
                          <span className="font-sans font-medium text-sm text-[#241E1A]">
                            {order.serviceTitle}
                          </span>
                          <span className="text-xs text-[#8A8177] font-mono shrink-0">
                            {order.orderNumber}
                          </span>
                        </div>

                        {/* Subtitle: Guest Name · Room */}
                        <div className="text-xs text-[#8A8177] font-sans">
                          {order.guestName} · {order.roomNumber}
                        </div>

                        {/* Date/Time and Price with Chevron */}
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-[#8A8177] font-sans">
                            {order.dateTimeText}
                          </span>
                          <button
                            type="button"
                            onClick={() => setExpandedOrderId(isExpanded ? null : order.id)}
                            className="font-serif font-medium text-[#241E1A] hover:text-[#C2410C] flex items-center gap-1 cursor-pointer transition-colors"
                          >
                            <span>{order.price}</span>
                            <ChevronDown
                              className={`h-3.5 w-3.5 text-[#8A8177] transition-transform duration-200 ${
                                isExpanded ? 'rotate-180' : ''
                              }`}
                            />
                          </button>
                        </div>

                        {/* Badges Row: Status & Payment */}
                        <div className="flex items-center gap-2 pt-1">
                          <span
                            className={`text-[11px] font-medium px-2.5 py-0.5 rounded-md font-sans ${statusBadgeClass}`}
                          >
                            {order.statusRu}
                          </span>
                          <span
                            className={`text-[11px] font-medium px-2.5 py-0.5 rounded-md font-sans ${
                              order.isPaid
                                ? 'bg-[#EAF3EC] text-[#3D7C52]'
                                : 'bg-[#FDF0F0] text-[#B3261E]'
                            }`}
                          >
                            {order.isPaid ? 'Оплачено' : 'Не оплачено'}
                          </span>
                        </div>

                        {/* Expanded details & quick actions */}
                        {isExpanded && (
                          <div className="mt-3 pt-3 border-t border-[#E5E2DD]/60 text-xs space-y-2.5 bg-[#FAF7F3] rounded-xl p-3">
                            <div className="flex items-center justify-between text-[#8A8177]">
                              <span>Счёт зачисления:</span>
                              <span className="text-[#241E1A] font-medium">Касса ресепшн / Номер {order.roomNumber}</span>
                            </div>

                            <div className="flex items-center justify-between text-[#8A8177]">
                              <span>Управление оплатой:</span>
                              <button
                                type="button"
                                onClick={() => {
                                  setServiceOrders(
                                    serviceOrders.map((o) =>
                                      o.id === order.id ? { ...o, isPaid: !o.isPaid } : o
                                    )
                                  );
                                  setActionAlert(
                                    order.isPaid
                                      ? `Заказ ${order.orderNumber} отмечен как неоплаченный`
                                      : `Заказ ${order.orderNumber} успешно оплачен`
                                  );
                                  setTimeout(() => setActionAlert(null), 3000);
                                }}
                                className="text-xs text-[#C2410C] hover:underline font-medium cursor-pointer"
                              >
                                {order.isPaid ? 'Снять оплату' : 'Отметить оплаченным'}
                              </button>
                            </div>

                            <div className="grid grid-cols-3 gap-1.5 pt-1.5 border-t border-[#E5E2DD]/50">
                              <button
                                type="button"
                                onClick={() => {
                                  setServiceOrders(
                                    serviceOrders.map((o) =>
                                      o.id === order.id
                                        ? { ...o, status: 'IN_PROGRESS', statusRu: 'В работе' }
                                        : o
                                    )
                                  );
                                  setActionAlert(`Заказ ${order.orderNumber} переведён в статус «В работе»`);
                                  setTimeout(() => setActionAlert(null), 3000);
                                }}
                                className="bg-white border border-[#E5E2DD] hover:bg-slate-50 py-1.5 rounded-lg text-[11px] font-sans text-[#241E1A] transition-colors cursor-pointer text-center"
                              >
                                В работу
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  setServiceOrders(
                                    serviceOrders.map((o) =>
                                      o.id === order.id
                                        ? { ...o, status: 'DONE', statusRu: 'Выполнена' }
                                        : o
                                    )
                                  );
                                  setActionAlert(`Заказ ${order.orderNumber} выполнен`);
                                  setTimeout(() => setActionAlert(null), 3000);
                                }}
                                className="bg-white border border-[#E5E2DD] hover:bg-emerald-50 text-[#3D7C52] py-1.5 rounded-lg text-[11px] font-sans font-medium transition-colors cursor-pointer text-center"
                              >
                                Выполнена
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  setServiceOrders(
                                    serviceOrders.map((o) =>
                                      o.id === order.id
                                        ? { ...o, status: 'CANCELLED', statusRu: 'Отменена' }
                                        : o
                                    )
                                  );
                                  setActionAlert(`Заказ ${order.orderNumber} отменён`);
                                  setTimeout(() => setActionAlert(null), 3000);
                                }}
                                className="bg-white border border-[#E5E2DD] hover:bg-rose-50 text-[#B3261E] py-1.5 rounded-lg text-[11px] font-sans transition-colors cursor-pointer text-center"
                              >
                                Отменить
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </>
          )}
        </div>
      </div>
    );
  };

  if (activeTab === 'MANAGER_BOOKINGS') {
    return (
      <div className="flex-1 flex flex-col bg-[#FAF7F3] overflow-hidden select-none">
        {/* Action toast alert */}
        {actionAlert && (
          <div className="fixed top-5 left-1/2 -translate-x-1/2 z-50 bg-[#241E1A] text-white text-xs font-sans px-4 py-2.5 rounded-xl shadow-lg border border-white/10 flex items-center gap-2 max-w-[90vw]">
            <CheckCircle2 className="h-4 w-4 text-[#3D7C52] shrink-0" />
            <span>{actionAlert}</span>
            <button
              onClick={() => setActionAlert(null)}
              className="text-white/60 hover:text-white cursor-pointer ml-1"
            >
              ✕
            </button>
          </div>
        )}

        {/* Top Header: Title + Subtitle (Screenshots 1 - 5) */}
        <div className="px-5 pt-7 pb-2 bg-[#FAF7F3] shrink-0">
          <h1 className="text-2xl font-serif font-medium text-[#241E1A] leading-tight">
            {t('Бронирования', 'Bookings')}
          </h1>
          <p className="text-xs text-[#8A8177] font-sans mt-0.5">
            {managerBookingsSection === 'ROOMS'
              ? t('Номера и шахматка', 'Rooms & chessboard')
              : t('Услуги отеля', 'Hotel services')}
          </p>

          {/* Segmented Control: [Брони] [Услуги] */}
          <div className="mt-3.5 bg-[#EAE6DE]/70 rounded-xl p-1 grid grid-cols-2 gap-1">
            <button
              type="button"
              onClick={() => setManagerBookingsSection('ROOMS')}
              className={`py-2 rounded-lg text-xs font-sans transition-all cursor-pointer ${
                managerBookingsSection === 'ROOMS'
                  ? 'bg-[#241E1A] text-white font-medium shadow-xs'
                  : 'text-[#6E665E] hover:text-[#241E1A] font-normal'
              }`}
            >
              {t('Брони', 'Bookings')}
            </button>
            <button
              type="button"
              onClick={() => setManagerBookingsSection('SERVICES')}
              className={`py-2 rounded-lg text-xs font-sans transition-all cursor-pointer ${
                managerBookingsSection === 'SERVICES'
                  ? 'bg-[#241E1A] text-white font-medium shadow-xs'
                  : 'text-[#6E665E] hover:text-[#241E1A] font-normal'
              }`}
            >
              {t('Услуги', 'Services')}
            </button>
          </div>
        </div>

        {/* Content switcher between Rooms and Services */}
        {managerBookingsSection === 'ROOMS'
          ? renderManagerBookingsRoomsView()
          : renderManagerBookingsServicesView()}

        {/* ================= MODAL: КАРТОЧКА БРОНИРОВАНИЯ (Detailed View) ================= */}
        {selectedBookingForModal && (
          <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-[2px] flex items-end sm:items-center justify-center p-0 sm:p-4">
            <div className="bg-white w-full sm:max-w-md rounded-t-3xl sm:rounded-2xl border border-[#E5E2DD] shadow-xl overflow-hidden max-h-[85vh] flex flex-col animate-in slide-in-from-bottom duration-200">
              {/* Modal Header */}
              <div className="p-4.5 border-b border-[#E5E2DD] flex items-center justify-between bg-[#FAF7F3]">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-serif font-medium text-base text-[#241E1A]">
                      Бронирование #{selectedBookingForModal.bookingNumber}
                    </h3>
                    <span className="bg-[#EAF3EC] text-[#3D7C52] text-[10px] font-medium px-2 py-0.5 rounded-md font-sans">
                      {selectedBookingForModal.roomNumber} · {selectedBookingForModal.category}
                    </span>
                  </div>
                  <p className="text-[11px] text-[#8A8177] font-sans mt-0.5">
                    Источник: {selectedBookingForModal.source || 'Прямая бронь'}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedBookingForModal(null)}
                  className="p-1.5 text-[#8A8177] hover:text-[#241E1A] rounded-xl hover:bg-slate-100 transition-colors cursor-pointer"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Modal Content */}
              <div className="p-5 overflow-y-auto space-y-4 no-scrollbar text-xs">
                {/* Guest info card */}
                <div className="bg-[#FAF7F3] rounded-xl p-3.5 border border-[#E5E2DD] space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[#8A8177]">Гость:</span>
                    <span className="font-medium text-[#241E1A] text-right">
                      {selectedBookingForModal.guestName}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[#8A8177]">Телефон:</span>
                    <a
                      href={`tel:${selectedBookingForModal.phone}`}
                      className="text-[#C2410C] font-mono hover:underline flex items-center gap-1"
                    >
                      <Phone className="h-3 w-3" />
                      <span>{selectedBookingForModal.phone}</span>
                    </a>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[#8A8177]">Количество гостей:</span>
                    <span className="text-[#241E1A]">
                      {selectedBookingForModal.guestsCount} чел.
                    </span>
                  </div>
                </div>

                {/* Dates & Room Info */}
                <div className="bg-white rounded-xl p-3.5 border border-[#E5E2DD] space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[#8A8177]">Даты проживания:</span>
                    <span className="text-[#241E1A] font-medium">
                      {selectedBookingForModal.datesText}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[#8A8177]">Длительность:</span>
                    <span className="text-[#241E1A]">
                      {selectedBookingForModal.nightsText}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[#8A8177]">Текущий статус:</span>
                    <span className="font-medium text-[#3D7C52]">
                      {selectedBookingForModal.statusRu}
                    </span>
                  </div>
                </div>

                {/* Financial Summary */}
                <div className="bg-[#FAF7F3] rounded-xl p-3.5 border border-[#E5E2DD] space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[#8A8177]">Стоимость проживания:</span>
                    <span className="font-serif font-medium text-sm text-[#241E1A]">
                      {selectedBookingForModal.amount}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[#8A8177]">Оплата:</span>
                    <span className="text-[#3D7C52] font-medium">
                      Предоплата подтверждена
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setSelectedBookingForModal(null)}
                  className="w-full bg-[#241E1A] hover:bg-black text-white py-3 rounded-xl font-sans font-medium text-xs shadow-xs transition-colors cursor-pointer text-center"
                >
                  Закрыть
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ================= MODAL: ЗАБРОНИРОВАТЬ УСЛУГУ ================= */}
        {bookingServiceModalItem && (
          <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-[2px] flex items-end sm:items-center justify-center p-0 sm:p-4">
            <div className="bg-white w-full sm:max-w-md rounded-t-3xl sm:rounded-2xl border border-[#E5E2DD] shadow-xl overflow-hidden max-h-[85vh] flex flex-col animate-in slide-in-from-bottom duration-200">
              <div className="p-4.5 border-b border-[#E5E2DD] flex items-center justify-between bg-[#FAF7F3]">
                <div>
                  <h3 className="font-serif font-medium text-base text-[#241E1A]">
                    Заказ услуги
                  </h3>
                  <p className="text-[11px] text-[#8A8177] font-sans mt-0.5">
                    {bookingServiceModalItem.title} · {bookingServiceModalItem.price}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setBookingServiceModalItem(null)}
                  className="p-1.5 text-[#8A8177] hover:text-[#241E1A] rounded-xl hover:bg-slate-100 transition-colors cursor-pointer"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="p-5 overflow-y-auto space-y-4 no-scrollbar text-xs">
                <div>
                  <label className="block text-[11px] font-sans text-[#8A8177] mb-1.5">
                    Выберите гостя / номер
                  </label>
                  <select
                    value={serviceBookingGuest}
                    onChange={(e) => setServiceBookingGuest(e.target.value)}
                    className="w-full bg-white border border-[#E5E2DD] rounded-xl px-3.5 py-2.5 text-xs text-[#241E1A] focus:outline-none focus:border-[#C2410C]"
                  >
                    <option value="Тимур Беков · №101">Тимур Беков · №101</option>
                    <option value="Салтанат Абдрахманова · №303">Салтанат Абдрахманова · №303</option>
                    <option value="Алия Нуржанова · №201">Алия Нуржанова · №201</option>
                    <option value="Данияр Амиров · №202">Данияр Амиров · №202</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-sans text-[#8A8177] mb-1.5">
                    Время оказания услуги
                  </label>
                  <input
                    type="text"
                    value={serviceBookingTime}
                    onChange={(e) => setServiceBookingTime(e.target.value)}
                    placeholder="18:00"
                    className="w-full bg-white border border-[#E5E2DD] rounded-xl px-3.5 py-2.5 text-xs text-[#241E1A] focus:outline-none focus:border-[#C2410C]"
                  />
                </div>

                <div className="pt-2 flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      const guestParts = serviceBookingGuest.split(' · ');
                      const guestName = guestParts[0];
                      const roomNumber = guestParts[1] || '№101';
                      const newOrder: ServiceOrderItem = {
                        id: `so-${Date.now()}`,
                        orderNumber: `№${80 + serviceOrders.length + 1}`,
                        serviceTitle: bookingServiceModalItem.title,
                        guestName,
                        roomNumber,
                        dateTimeText: `16 нояб. · ${serviceBookingTime}`,
                        price: bookingServiceModalItem.price,
                        numericPrice: bookingServiceModalItem.numericPrice,
                        status: 'CONFIRMED',
                        statusRu: 'Подтверждена',
                        isPaid: false,
                      };
                      setServiceOrders([newOrder, ...serviceOrders]);
                      setBookingServiceModalItem(null);
                      setActionAlert(`Услуга «${newOrder.serviceTitle}» забронирована (${newOrder.orderNumber})`);
                      setTimeout(() => setActionAlert(null), 3000);
                    }}
                    className="flex-1 bg-[#C2410C] hover:bg-[#A93A0C] text-white py-3 rounded-xl font-sans font-medium text-xs shadow-xs transition-colors cursor-pointer text-center"
                  >
                    Подтвердить бронь услуги
                  </button>
                  <button
                    type="button"
                    onClick={() => setBookingServiceModalItem(null)}
                    className="px-4 bg-white hover:bg-slate-50 border border-[#E5E2DD] text-[#8A8177] py-3 rounded-xl font-sans text-xs transition-colors cursor-pointer"
                  >
                    Отмена
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // =========================================================================
  // TAB 4: СКЛАД (MANAGER_WAREHOUSE) - SCREENSHOTS 1 & 2
  // =========================================================================
  if (activeTab === 'MANAGER_WAREHOUSE') {
    const totalPositionsCount = warehouseItems.length;
    const replenishItems = warehouseItems.filter(
      (item) => item.currentQuantity < item.minQuantity
    );
    const replenishPositionsCount = replenishItems.length;

    // Filter items based on active subtab, search query, and category filter
    const baseList =
      warehouseSubTab === 'ALL' ? warehouseItems : replenishItems;

    const filteredWarehouseItems = baseList.filter((item) => {
      if (
        warehouseCategoryFilter !== 'Все категории' &&
        item.category !== warehouseCategoryFilter
      ) {
        return false;
      }
      if (warehouseSearch.trim()) {
        const q = warehouseSearch.toLowerCase();
        const matchesName = item.name.toLowerCase().includes(q);
        const matchesCategory = item.category.toLowerCase().includes(q);
        const matchesLocation = item.location.toLowerCase().includes(q);
        if (!matchesName && !matchesCategory && !matchesLocation) return false;
      }
      return true;
    });

    return (
      <div className="flex-1 flex flex-col bg-[#FAF7F3] overflow-hidden select-none">
        {/* Action toast alert */}
        {actionAlert && (
          <div className="fixed top-5 left-1/2 -translate-x-1/2 z-50 bg-[#241E1A] text-white text-xs font-sans px-4 py-2.5 rounded-xl shadow-lg border border-white/10 flex items-center gap-2 max-w-[90vw]">
            <CheckCircle2 className="h-4 w-4 text-[#3D7C52] shrink-0" />
            <span>{actionAlert}</span>
            <button
              onClick={() => setActionAlert(null)}
              className="text-white/60 hover:text-white cursor-pointer ml-1"
            >
              ✕
            </button>
          </div>
        )}

        {/* Scrollable Container */}
        <div className="flex-1 overflow-y-auto px-5 pt-7 pb-6 space-y-4 no-scrollbar">
          {/* Header: Title + Dynamic Subtitle (Screenshots 1 & 2) */}
          <div>
            <h1 className="text-2xl font-serif font-medium text-[#241E1A] leading-tight">
              {t('Склад', 'Warehouse')}
            </h1>
            <p className="text-xs text-[#8A8177] font-sans mt-0.5">
              {warehouseSubTab === 'ALL'
                ? t('Запасы отеля', 'Hotel inventory')
                : t('Требует пополнения', 'Needs replenish')}
            </p>
          </div>

          {/* Top Metric Cards: 2 Columns (Screenshots 1 & 2) */}
          <div className="grid grid-cols-2 gap-2.5">
            {/* Card 1: 6 позиций */}
            <div className="bg-white rounded-2xl border border-[#E5E2DD] p-4 shadow-2xs">
              <div className="text-3xl font-serif font-medium text-[#241E1A] leading-none">
                {totalPositionsCount}
              </div>
              <div className="text-xs text-[#8A8177] font-sans mt-2">
                {t('позиций', 'positions')}
              </div>
            </div>

            {/* Card 2: 3 нужно пополнить */}
            <div className="bg-white rounded-2xl border border-[#E5E2DD] p-4 shadow-2xs">
              <div className="text-3xl font-serif font-medium text-[#C2410C] leading-none">
                {replenishPositionsCount}
              </div>
              <div className="text-xs text-[#8A8177] font-sans mt-2">
                {t('нужно пополнить', 'need refill')}
              </div>
            </div>
          </div>

          {/* Secondary Sub-Tabs: [Все остатки] [Пополнить · 3] */}
          <div className="flex items-center gap-6 border-b border-[#E5E2DD]/70 pt-1">
            <button
              type="button"
              onClick={() => setWarehouseSubTab('ALL')}
              className={`text-xs font-sans pb-2 transition-all cursor-pointer relative ${
                warehouseSubTab === 'ALL'
                  ? 'text-[#C2410C] font-medium border-b-2 border-[#C2410C]'
                  : 'text-[#8A8177] hover:text-[#241E1A] font-normal'
              }`}
            >
              {t('Все остатки', 'All stock')}
            </button>
            <button
              type="button"
              onClick={() => setWarehouseSubTab('REPLENISH')}
              className={`text-xs font-sans pb-2 transition-all cursor-pointer relative ${
                warehouseSubTab === 'REPLENISH'
                  ? 'text-[#C2410C] font-medium border-b-2 border-[#C2410C]'
                  : 'text-[#8A8177] hover:text-[#241E1A] font-normal'
              }`}
            >
              {t('Пополнить', 'Replenish')} · {replenishPositionsCount}
            </button>
          </div>

          {/* Search bar with Filter icon INSIDE at the end (as requested by user) */}
          <div className="relative">
            <Search className="h-4 w-4 text-[#8A8177] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={warehouseSearch}
              onChange={(e) => setWarehouseSearch(e.target.value)}
              placeholder={t('Название, категория или склад', 'Title, category or storage')}
              className="w-full bg-white border border-[#E5E2DD] rounded-xl pl-10 pr-10 py-3 text-xs text-[#241E1A] placeholder:text-[#8A8177]/70 focus:outline-none focus:border-[#C2410C] shadow-2xs"
            />
            <button
              type="button"
              onClick={() => setShowWarehouseFilter(!showWarehouseFilter)}
              className={`absolute right-2.5 top-1/2 -translate-y-1/2 p-1.5 rounded-lg transition-colors cursor-pointer ${
                showWarehouseFilter || warehouseCategoryFilter !== 'Все категории'
                  ? 'text-[#C2410C] bg-[#FAF7F3]'
                  : 'text-[#8A8177] hover:text-[#241E1A]'
              }`}
              title="Фильтр по категориям"
            >
              <Filter className="h-4 w-4" />
            </button>
          </div>

          {/* Expandable Category Filter (Screenshots 1 & 2) */}
          {showWarehouseFilter && (
            <div className="animate-in fade-in duration-200">
              <label className="block text-[11px] font-sans text-[#8A8177] mb-1">
                Категория
              </label>
              <div className="relative">
                <select
                  value={warehouseCategoryFilter}
                  onChange={(e) => setWarehouseCategoryFilter(e.target.value)}
                  className="w-full bg-white border border-[#E5E2DD] rounded-xl px-3.5 py-3 text-xs text-[#241E1A] focus:outline-none focus:border-[#C2410C] appearance-none pr-8 cursor-pointer shadow-2xs"
                >
                  <option value="Все категории">Все категории</option>
                  <option value="Текстиль">Текстиль</option>
                  <option value="Косметика">Косметика</option>
                  <option value="Мини-бар">Мини-бар</option>
                  <option value="Расходники">Расходники</option>
                </select>
                <ChevronDown className="h-4 w-4 text-[#8A8177] absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            </div>
          )}

          {/* Replenish notice line (Screenshot 2) */}
          {warehouseSubTab === 'REPLENISH' && (
            <p className="text-xs text-[#8A8177] font-sans pt-0.5">
              Позиции ниже минимального запаса.
            </p>
          )}

          {/* Items Cards List */}
          <div className="space-y-3 pt-0.5">
            {filteredWarehouseItems.length === 0 ? (
              <div className="bg-white rounded-2xl border border-[#E5E2DD] p-6 text-center shadow-2xs">
                <p className="text-xs text-[#8A8177] font-sans">
                  {warehouseSubTab === 'REPLENISH'
                    ? 'Все позиции в достаточном количестве'
                    : 'Позиций по заданным критериям не найдено'}
                </p>
              </div>
            ) : (
              filteredWarehouseItems.map((item) => {
                const isDeficient = item.currentQuantity < item.minQuantity;
                const deficiency = item.minQuantity - item.currentQuantity;

                return (
                  <div
                    key={item.id}
                    className="bg-white rounded-2xl border border-[#E5E2DD] p-4.5 shadow-2xs space-y-2.5 transition-all"
                  >
                    {/* Top Row: Name & Button Пополнить */}
                    <div className="flex items-start justify-between gap-2">
                      <h4 className="font-sans font-medium text-sm text-[#241E1A]">
                        {item.name}
                      </h4>
                      <button
                        type="button"
                        onClick={() => {
                          setReplenishModalItem(item);
                          const def = Math.max(1, isDeficient ? deficiency : 10);
                          setReplenishAmount(def.toString());
                        }}
                        className="bg-[#FDF3E3] text-[#A66E22] hover:bg-[#FBE8CD] text-xs font-medium px-3 py-1 rounded-lg cursor-pointer transition-colors active:scale-95 shrink-0"
                      >
                        Пополнить
                      </button>
                    </div>

                    {/* Subtitle: Category · Location */}
                    <div className="text-xs text-[#8A8177] font-sans">
                      {item.category} · {item.location}
                    </div>

                    {/* Quantities Row */}
                    <div className="flex items-baseline justify-between pt-1">
                      <div className="flex items-baseline gap-1">
                        <span className="text-2xl font-serif font-medium text-[#241E1A]">
                          {item.currentQuantity}
                        </span>
                        <span className="text-xs text-[#8A8177] font-sans">
                          {item.unit}
                        </span>
                      </div>
                      <span className="text-xs text-[#8A8177] font-sans">
                        Минимум {item.minQuantity} {item.unit}
                      </span>
                    </div>

                    {/* Deficiency alert text if below minimum */}
                    {isDeficient && (
                      <div className="text-xs text-[#C2410C] font-sans pt-0.5">
                        До минимума не хватает {deficiency} {item.unit}
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* ================= MODAL: ПОПОЛНЕНИЕ ЗАПАСОВ ================= */}
        {replenishModalItem && (
          <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-[2px] flex items-end sm:items-center justify-center p-0 sm:p-4">
            <div className="bg-white w-full sm:max-w-md rounded-t-3xl sm:rounded-2xl border border-[#E5E2DD] shadow-xl overflow-hidden max-h-[85vh] flex flex-col animate-in slide-in-from-bottom duration-200">
              {/* Modal Header */}
              <div className="p-4.5 border-b border-[#E5E2DD] flex items-center justify-between bg-[#FAF7F3]">
                <div>
                  <h3 className="font-serif font-medium text-base text-[#241E1A]">
                    Пополнение запасов
                  </h3>
                  <p className="text-[11px] text-[#8A8177] font-sans mt-0.5">
                    {replenishModalItem.name} · {replenishModalItem.location}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setReplenishModalItem(null)}
                  className="p-1.5 text-[#8A8177] hover:text-[#241E1A] rounded-xl hover:bg-slate-100 transition-colors cursor-pointer"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Modal Content */}
              <div className="p-5 space-y-4 text-xs">
                {/* Stock Details */}
                <div className="bg-[#FAF7F3] rounded-xl p-3.5 border border-[#E5E2DD] space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[#8A8177]">Текущий остаток:</span>
                    <span className="font-medium text-[#241E1A]">
                      {replenishModalItem.currentQuantity} {replenishModalItem.unit}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[#8A8177]">Минимальный порог:</span>
                    <span className="text-[#241E1A]">
                      {replenishModalItem.minQuantity} {replenishModalItem.unit}
                    </span>
                  </div>
                  {replenishModalItem.currentQuantity < replenishModalItem.minQuantity && (
                    <div className="flex items-center justify-between text-[#C2410C]">
                      <span>Дефицит:</span>
                      <span className="font-medium">
                        {replenishModalItem.minQuantity - replenishModalItem.currentQuantity}{' '}
                        {replenishModalItem.unit}
                      </span>
                    </div>
                  )}
                </div>

                {/* Amount to Replenish */}
                <div>
                  <label className="block text-[11px] font-sans text-[#8A8177] mb-1.5">
                    Количество для оприходования ({replenishModalItem.unit})
                  </label>
                  <input
                    type="number"
                    value={replenishAmount}
                    onChange={(e) => setReplenishAmount(e.target.value)}
                    placeholder="0"
                    className="w-full bg-white border border-[#E5E2DD] rounded-xl px-3.5 py-2.5 text-xs text-[#241E1A] focus:outline-none focus:border-[#C2410C]"
                  />
                </div>

                {/* Action Buttons */}
                <div className="pt-2 flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      const qty = parseInt(replenishAmount, 10) || 0;
                      if (qty <= 0) {
                        setActionAlert('Введите корректное количество');
                        setTimeout(() => setActionAlert(null), 3000);
                        return;
                      }

                      setWarehouseItems(
                        warehouseItems.map((item) =>
                          item.id === replenishModalItem.id
                            ? { ...item, currentQuantity: item.currentQuantity + qty }
                            : item
                        )
                      );

                      setActionAlert(
                        `Товар «${replenishModalItem.name}» пополнен на +${qty} ${replenishModalItem.unit}`
                      );
                      setTimeout(() => setActionAlert(null), 3000);
                      setReplenishModalItem(null);
                    }}
                    className="flex-1 bg-[#C2410C] hover:bg-[#A93A0C] text-white py-3 rounded-xl font-sans font-medium text-xs shadow-xs transition-colors cursor-pointer text-center"
                  >
                    Оформить поступление
                  </button>
                  <button
                    type="button"
                    onClick={() => setReplenishModalItem(null)}
                    className="px-4 bg-white hover:bg-slate-50 border border-[#E5E2DD] text-[#8A8177] py-3 rounded-xl font-sans text-xs transition-colors cursor-pointer"
                  >
                    Отмена
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // =========================================================================
  // TAB 5: ПРОФИЛЬ (MANAGER_PROFILE) - SCREENSHOTS 1 TO 6
  // =========================================================================

  // Helper counts
  const unreadNotifsCount = managerNotifs.filter((n) => n.unread).length;
  const unreadChatsCount = managerChats.reduce(
    (sum, c) => sum + c.unreadCount,
    0
  );

  // ==================== SUB-SCREEN: SETTINGS (Screenshots 5 & 6) ====================
  if (showSettings) {
    return (
      <div className="flex-1 flex flex-col bg-[#FAF7F3] overflow-hidden select-none font-sans relative">
        {/* Toast Alert */}
        {actionAlert && (
          <div className="absolute top-3 left-4 right-4 bg-[#241E1A] text-white text-xs px-4 py-2.5 rounded-xl shadow-lg z-50 flex items-center justify-between animate-in fade-in duration-200">
            <span>{actionAlert}</span>
            <button
              onClick={() => setActionAlert(null)}
              className="text-white/60 hover:text-white cursor-pointer ml-2 text-xs"
            >
              ✕
            </button>
          </div>
        )}

        {/* Header */}
        <div className="px-5 pt-7 pb-3 bg-[#FAF7F3] shrink-0 border-b border-[#E5E2DD]/70">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setShowSettings(false)}
              className="text-[#241E1A] hover:text-black p-1 -ml-1 transition-colors cursor-pointer"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <h1 className="text-2xl font-serif font-medium text-[#241E1A] leading-tight">
              {t('Настройки', 'Settings')}
            </h1>
          </div>
          <p className="text-xs text-[#8A8177] font-sans mt-0.5 ml-8">
            {t('Приложение и учётная запись', 'Application and account')}
          </p>
        </div>

        {/* Scrollable Settings Groups */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-5 no-scrollbar">
          {/* GROUP 1: ПРИЛОЖЕНИЕ */}
          <div className="space-y-2">
            <h3 className="text-[10px] text-[#8A8177] font-sans font-medium tracking-widest uppercase px-1">
              {t('ПРИЛОЖЕНИЕ', 'APPLICATION')}
            </h3>

            <div className="bg-white rounded-2xl border border-[#E5E2DD] divide-y divide-[#E5E2DD]/60 shadow-2xs overflow-hidden">
              {/* Язык интерфейса */}
              <div className="p-4 flex items-center justify-between">
                <div>
                  <span className="text-xs font-sans text-[#241E1A] font-medium block">
                    {t('Язык интерфейса', 'Interface language')}
                  </span>
                  <span className="text-[10px] text-[#8A8177] font-sans mt-0.5 block">
                    {lang === 'RU' ? 'Русский' : 'English'}
                  </span>
                </div>

                {/* RU / EN segmented switch */}
                <div className="bg-[#FAF7F3] border border-[#E5E2DD] rounded-xl p-0.5 flex items-center">
                  <button
                    type="button"
                    onClick={() => onLanguageChange && onLanguageChange('RU')}
                    className={`px-3 py-1 rounded-lg text-xs font-sans font-medium transition-all cursor-pointer ${
                      lang === 'RU'
                        ? 'bg-[#241E1A] text-white shadow-xs'
                        : 'text-[#8A8177] hover:text-[#241E1A]'
                    }`}
                  >
                    RU
                  </button>
                  <button
                    type="button"
                    onClick={() => onLanguageChange && onLanguageChange('EN')}
                    className={`px-3 py-1 rounded-lg text-xs font-sans font-medium transition-all cursor-pointer ${
                      lang === 'EN'
                        ? 'bg-[#241E1A] text-white shadow-xs'
                        : 'text-[#8A8177] hover:text-[#241E1A]'
                    }`}
                  >
                    EN
                  </button>
                </div>
              </div>

              {/* Офлайн-режим */}
              <div className="p-4 flex items-center justify-between">
                <div>
                  <span className="text-xs font-sans text-[#241E1A] font-medium block">
                    {t('Офлайн-режим', 'Offline mode')}
                  </span>
                  <span className="text-[10px] text-[#8A8177] font-sans mt-0.5 block">
                    {t('данные синхронизируются при сети', 'data syncs when connected')}
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
                  <span className="text-xs font-sans text-[#241E1A] font-medium block">
                    {t('Push-уведомления', 'Push notifications')}
                  </span>
                  <span className="text-[10px] text-[#8A8177] font-sans mt-0.5 block">
                    {t('новые брони, заезды и сообщения', 'new bookings, check-ins & messages')}
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
                  <span className="text-xs font-sans text-[#241E1A] font-medium block">
                    {t('Звук при новой брони', 'Sound on new booking')}
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

          {/* GROUP 2: СИНХРОНИЗАЦИЯ */}
          <div className="space-y-2">
            <h3 className="text-[10px] text-[#8A8177] font-sans font-medium tracking-widest uppercase px-1">
              {t('СИНХРОНИЗАЦИЯ', 'SYNCHRONIZATION')}
            </h3>

            <div
              onClick={() => {
                const now = new Date().toLocaleTimeString(lang === 'EN' ? 'en-US' : 'ru-RU', {
                  hour: '2-digit',
                  minute: '2-digit',
                });
                setLastSyncedTime(now);
                setActionAlert(
                  t(
                    `Данные отеля успешно синхронизированы в ${now}`,
                    `Hotel data successfully synchronized at ${now}`
                  )
                );
                setTimeout(() => setActionAlert(null), 3000);
              }}
              className="bg-white rounded-2xl border border-[#E5E2DD] p-4 shadow-2xs flex items-center justify-between cursor-pointer hover:bg-slate-50 transition-colors"
            >
              <div className="flex items-center gap-3">
                <RefreshCw className="h-4.5 w-4.5 text-[#8A8177]" />
                <div>
                  <span className="text-xs font-sans font-medium text-[#241E1A] block">
                    {t('Обновить данные', 'Sync data')}
                  </span>
                  <span className="text-[10px] font-sans text-[#8A8177] block mt-0.5">
                    {t('последняя синхронизация', 'last synchronized')} {lastSyncedTime}
                  </span>
                </div>
              </div>
              <ChevronRight className="h-4 w-4 text-[#8A8177]" />
            </div>
          </div>

          {/* GROUP 3: УЧЁТНАЯ ЗАПИСЬ */}
          <div className="space-y-2">
            <h3 className="text-[10px] text-[#8A8177] font-sans font-medium tracking-widest uppercase px-1">
              {t('УЧЁТНАЯ ЗАПИСЬ', 'ACCOUNT')}
            </h3>

            <div className="bg-white rounded-2xl border border-[#E5E2DD] overflow-hidden divide-y divide-[#E5E2DD]/60 shadow-2xs">
              {/* Личные данные */}
              <div
                onClick={() => setIsEditingProfile(true)}
                className="p-4 flex items-center justify-between cursor-pointer hover:bg-slate-50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <User className="h-4 w-4 text-[#8A8177]" />
                  <span className="text-xs font-sans text-[#241E1A]">
                    {t('Личные данные', 'Personal details')}
                  </span>
                </div>
                <ChevronRight className="h-4 w-4 text-[#8A8177]" />
              </div>

              {/* Сменить пароль */}
              <div
                onClick={() => {
                  setPasswordError(null);
                  setCurrentPassword('');
                  setNewPassword('');
                  setConfirmPassword('');
                  setIsChangingPassword(true);
                }}
                className="p-4 flex items-center justify-between cursor-pointer hover:bg-slate-50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <Lock className="h-4 w-4 text-[#8A8177]" />
                  <span className="text-xs font-sans text-[#241E1A]">
                    {t('Сменить пароль', 'Change password')}
                  </span>
                </div>
                <ChevronRight className="h-4 w-4 text-[#8A8177]" />
              </div>

              {/* Служба поддержки */}
              <div
                onClick={() => setIsSupportModalOpen(true)}
                className="p-4 flex items-center justify-between cursor-pointer hover:bg-slate-50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <HelpCircle className="h-4 w-4 text-[#8A8177]" />
                  <span className="text-xs font-sans text-[#241E1A]">
                    {t('Служба поддержки', 'Customer support')}
                  </span>
                </div>
                <ChevronRight className="h-4 w-4 text-[#8A8177]" />
              </div>
            </div>
          </div>

          {/* STANDALONE LOG OUT BUTTON (Screenshot 6) */}
          <div
            onClick={onLogout}
            className="bg-white rounded-2xl border border-[#E5E2DD] p-4 shadow-2xs flex items-center gap-3 cursor-pointer text-[#8A8177] hover:text-[#B3261E] hover:bg-rose-50/50 transition-all active:scale-[0.99]"
          >
            <LogOut className="h-4 w-4 text-[#8A8177]" />
            <span className="text-xs font-sans font-medium text-[#241E1A]">
              {t('Выйти из аккаунта', 'Log out')}
            </span>
          </div>
        </div>

        {/* ================= MODAL 1: Личные данные (inside Settings) ================= */}
        {isEditingProfile && (
          <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-[2px] flex items-center justify-center p-4">
            <div className="bg-white w-full max-w-sm rounded-2xl border border-[#E5E2DD] p-5 shadow-xl space-y-4 animate-in fade-in zoom-in duration-200">
              <div className="flex items-center justify-between border-b border-[#E5E2DD]/60 pb-2">
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 text-[#C2410C]" />
                  <h3 className="text-sm font-serif font-medium text-[#241E1A]">
                    {t('Личные данные', 'Personal Details')}
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setIsEditingProfile(false)}
                  className="text-[#8A8177] hover:text-[#241E1A] p-1 cursor-pointer"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              {/* Avatar & Role Info */}
              <div className="flex items-center gap-3 bg-[#FAF7F3] p-3 rounded-xl border border-[#E5E2DD]">
                <img
                  src={cleanerProfile.avatarUrl}
                  alt={cleanerProfile.fullNameRu}
                  className="h-11 w-11 rounded-full object-cover border border-[#E5E2DD]"
                />
                <div className="min-w-0">
                  <div className="text-xs font-sans font-medium text-[#241E1A] truncate">
                    {editFullNameRu || cleanerProfile.fullNameRu}
                  </div>
                  <div className="text-[11px] text-[#8A8177] font-sans">
                    {t('Руководитель отеля', 'Hotel Manager')} · {cleanerProfile.badgeId || 'SLV-1001'}
                  </div>
                </div>
              </div>

              <div className="space-y-3 text-xs">
                <div>
                  <label className="block text-[11px] font-sans text-[#8A8177] mb-1">
                    {t('ФИО руководителя', 'Full Name')}
                  </label>
                  <input
                    type="text"
                    value={editFullNameRu}
                    onChange={(e) => setEditFullNameRu(e.target.value)}
                    className="w-full bg-white border border-[#E5E2DD] rounded-xl px-3 py-2 text-xs text-[#241E1A] focus:outline-none focus:border-[#C2410C]"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-sans text-[#8A8177] mb-1">
                    {t('Контактный телефон', 'Contact Phone')}
                  </label>
                  <input
                    type="text"
                    value={editPhone}
                    onChange={(e) => setEditPhone(e.target.value)}
                    className="w-full bg-white border border-[#E5E2DD] rounded-xl px-3 py-2 text-xs text-[#241E1A] focus:outline-none focus:border-[#C2410C]"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-sans text-[#8A8177] mb-1">
                    {t('Электронная почта', 'Email Address')}
                  </label>
                  <input
                    type="email"
                    value={editEmail}
                    onChange={(e) => setEditEmail(e.target.value)}
                    className="w-full bg-white border border-[#E5E2DD] rounded-xl px-3 py-2 text-xs text-[#241E1A] focus:outline-none focus:border-[#C2410C]"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    onUpdateCleanerProfile({
                      ...cleanerProfile,
                      fullNameRu: editFullNameRu,
                      fullName: editFullNameRu,
                    });
                    setIsEditingProfile(false);
                    setActionAlert(t('Данные профиля обновлены', 'Profile details updated'));
                    setTimeout(() => setActionAlert(null), 3000);
                  }}
                  className="flex-1 bg-[#C2410C] hover:bg-[#A93A0C] text-white py-2.5 rounded-xl text-xs font-sans font-medium transition-colors cursor-pointer text-center"
                >
                  {t('Сохранить', 'Save Changes')}
                </button>
                <button
                  type="button"
                  onClick={() => setIsEditingProfile(false)}
                  className="px-4 bg-white border border-[#E5E2DD] text-[#8A8177] py-2.5 rounded-xl text-xs font-sans hover:bg-slate-50 transition-colors cursor-pointer"
                >
                  {t('Отмена', 'Cancel')}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ================= MODAL 2: Сменить пароль (inside Settings) ================= */}
        {isChangingPassword && (
          <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-[2px] flex items-center justify-center p-4">
            <div className="bg-white w-full max-w-sm rounded-2xl border border-[#E5E2DD] p-5 shadow-xl space-y-4 animate-in fade-in zoom-in duration-200">
              <div className="flex items-center justify-between border-b border-[#E5E2DD]/60 pb-2">
                <div className="flex items-center gap-2">
                  <Lock className="h-4 w-4 text-[#C2410C]" />
                  <h3 className="text-sm font-serif font-medium text-[#241E1A]">
                    {t('Сменить пароль', 'Change Password')}
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setIsChangingPassword(false)}
                  className="text-[#8A8177] hover:text-[#241E1A] p-1 cursor-pointer"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <p className="text-[11px] text-[#8A8177] font-sans leading-relaxed">
                {t(
                  'Новый пароль должен содержать не менее 6 символов.',
                  'New password must contain at least 6 characters.'
                )}
              </p>

              {passwordError && (
                <div className="p-2.5 bg-[#FDF0EB] border border-[#F5D6D5] text-[#B3261E] rounded-xl text-xs font-sans flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  <span>{passwordError}</span>
                </div>
              )}

              <div className="space-y-3 text-xs">
                <div>
                  <label className="block text-[11px] font-sans text-[#8A8177] mb-1">
                    {t('Текущий пароль', 'Current Password')}
                  </label>
                  <input
                    type="password"
                    placeholder="••••••••"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    className="w-full bg-white border border-[#E5E2DD] rounded-xl px-3 py-2 text-xs text-[#241E1A] focus:outline-none focus:border-[#C2410C]"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-sans text-[#8A8177] mb-1">
                    {t('Новый пароль', 'New Password')}
                  </label>
                  <input
                    type="password"
                    placeholder="••••••••"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full bg-white border border-[#E5E2DD] rounded-xl px-3 py-2 text-xs text-[#241E1A] focus:outline-none focus:border-[#C2410C]"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-sans text-[#8A8177] mb-1">
                    {t('Подтвердите новый пароль', 'Confirm New Password')}
                  </label>
                  <input
                    type="password"
                    placeholder="••••••••"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full bg-white border border-[#E5E2DD] rounded-xl px-3 py-2 text-xs text-[#241E1A] focus:outline-none focus:border-[#C2410C]"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    if (!currentPassword.trim()) {
                      setPasswordError(t('Введите текущий пароль', 'Please enter your current password'));
                      return;
                    }
                    if (newPassword.length < 6) {
                      setPasswordError(
                        t('Новый пароль должен содержать от 6 символов', 'New password must be at least 6 characters')
                      );
                      return;
                    }
                    if (newPassword !== confirmPassword) {
                      setPasswordError(t('Пароли не совпадают', 'Passwords do not match'));
                      return;
                    }
                    setPasswordError(null);
                    setIsChangingPassword(false);
                    setCurrentPassword('');
                    setNewPassword('');
                    setConfirmPassword('');
                    setActionAlert(t('Пароль успешно обновлён', 'Password successfully updated'));
                    setTimeout(() => setActionAlert(null), 3000);
                  }}
                  className="flex-1 bg-[#C2410C] hover:bg-[#A93A0C] text-white py-2.5 rounded-xl text-xs font-sans font-medium transition-colors cursor-pointer text-center"
                >
                  {t('Сменить пароль', 'Update Password')}
                </button>
                <button
                  type="button"
                  onClick={() => setIsChangingPassword(false)}
                  className="px-4 bg-white border border-[#E5E2DD] text-[#8A8177] py-2.5 rounded-xl text-xs font-sans hover:bg-slate-50 transition-colors cursor-pointer"
                >
                  {t('Отмена', 'Cancel')}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ================= MODAL 3: Служба поддержки (inside Settings) ================= */}
        {isSupportModalOpen && (
          <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-[2px] flex items-center justify-center p-4">
            <div className="bg-white w-full max-w-sm rounded-2xl border border-[#E5E2DD] p-5 shadow-xl space-y-4 animate-in fade-in zoom-in duration-200 max-h-[90vh] overflow-y-auto no-scrollbar">
              <div className="flex items-center justify-between border-b border-[#E5E2DD]/60 pb-2">
                <div className="flex items-center gap-2">
                  <HelpCircle className="h-4 w-4 text-[#C2410C]" />
                  <h3 className="text-sm font-serif font-medium text-[#241E1A]">
                    {t('Служба поддержки', 'Customer Support')}
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setIsSupportModalOpen(false)}
                  className="text-[#8A8177] hover:text-[#241E1A] p-1 cursor-pointer"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <p className="text-[11px] text-[#8A8177] font-sans leading-relaxed">
                {t(
                  'Круглосуточная линия помощи для отелей сети Sollviera. Мы на связи 24/7 по любым техническим и операционным вопросам.',
                  '24/7 dedicated support desk for Sollviera hotels. We are available around the clock for technical and operational questions.'
                )}
              </p>

              {/* Support Contacts Cards */}
              <div className="space-y-2.5">
                {/* Contact 1: Hotline */}
                <div className="p-3 bg-[#FAF7F3] rounded-xl border border-[#E5E2DD] flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-lg bg-white border border-[#E5E2DD] flex items-center justify-center text-[#241E1A]">
                      <Phone className="h-4 w-4" />
                    </div>
                    <div>
                      <span className="text-[10px] text-[#8A8177] block font-sans">
                        {t('Горячая линия (24/7)', 'Hotline (24/7)')}
                      </span>
                      <span className="text-xs font-sans font-medium text-[#241E1A] block">
                        +7 (800) 100-20-30
                      </span>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard?.writeText('+78001002030');
                      setActionAlert(t('Номер скопирован: +7 (800) 100-20-30', 'Phone copied: +7 (800) 100-20-30'));
                      setTimeout(() => setActionAlert(null), 3000);
                    }}
                    className="px-2.5 py-1 bg-white border border-[#E5E2DD] rounded-lg text-[11px] text-[#241E1A] font-medium hover:border-[#C2410C] transition-colors cursor-pointer"
                  >
                    {t('Копировать', 'Copy')}
                  </button>
                </div>

                {/* Contact 2: Telegram */}
                <div className="p-3 bg-[#FAF7F3] rounded-xl border border-[#E5E2DD] flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-lg bg-[#EBF4FE] text-[#0088cc] flex items-center justify-center">
                      <Send className="h-4 w-4" />
                    </div>
                    <div>
                      <span className="text-[10px] text-[#8A8177] block font-sans">
                        Telegram
                      </span>
                      <span className="text-xs font-sans font-medium text-[#241E1A] block">
                        @sollviera_support
                      </span>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard?.writeText('@sollviera_support');
                      setActionAlert(
                        t(
                          'Telegram контакт скопирован: @sollviera_support',
                          'Telegram handle copied: @sollviera_support'
                        )
                      );
                      setTimeout(() => setActionAlert(null), 3000);
                    }}
                    className="px-2.5 py-1 bg-white border border-[#E5E2DD] rounded-lg text-[11px] text-[#241E1A] font-medium hover:border-[#C2410C] transition-colors cursor-pointer"
                  >
                    {t('Копировать', 'Copy')}
                  </button>
                </div>

                {/* Contact 3: Email */}
                <div className="p-3 bg-[#FAF7F3] rounded-xl border border-[#E5E2DD] flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-lg bg-[#FAF0E6] text-[#C2410C] flex items-center justify-center">
                      <FileText className="h-4 w-4" />
                    </div>
                    <div>
                      <span className="text-[10px] text-[#8A8177] block font-sans">
                        Email
                      </span>
                      <span className="text-xs font-sans font-medium text-[#241E1A] block">
                        support@sollviera.kz
                      </span>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard?.writeText('support@sollviera.kz');
                      setActionAlert(t('Email скопирован: support@sollviera.kz', 'Email copied: support@sollviera.kz'));
                      setTimeout(() => setActionAlert(null), 3000);
                    }}
                    className="px-2.5 py-1 bg-white border border-[#E5E2DD] rounded-lg text-[11px] text-[#241E1A] font-medium hover:border-[#C2410C] transition-colors cursor-pointer"
                  >
                    {t('Копировать', 'Copy')}
                  </button>
                </div>
              </div>

              {/* Quick message form */}
              <div className="space-y-1.5 pt-1">
                <label className="block text-[11px] font-sans text-[#8A8177]">
                  {t('Быстрое обращение', 'Quick Support Request')}
                </label>
                <textarea
                  rows={3}
                  value={supportMessageText}
                  onChange={(e) => setSupportMessageText(e.target.value)}
                  placeholder={t(
                    'Опишите ваш вопрос или проблему...',
                    'Describe your question or issue...'
                  )}
                  className="w-full bg-[#FAF7F3] border border-[#E5E2DD] rounded-xl p-3 text-xs text-[#241E1A] placeholder:text-[#8A8177]/70 focus:outline-none focus:border-[#C2410C] resize-none"
                />
              </div>

              <div className="flex items-center gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => {
                    if (!supportMessageText.trim()) {
                      setActionAlert(t('Пожалуйста, введите текст сообщения', 'Please enter your message'));
                      setTimeout(() => setActionAlert(null), 2500);
                      return;
                    }
                    setSupportMessageText('');
                    setIsSupportModalOpen(false);
                    setActionAlert(
                      t(
                        'Обращение #SUP-9402 отправлено! Оператор свяжется с вами в течение 5 минут.',
                        'Request #SUP-9402 submitted! A support agent will contact you shortly.'
                      )
                    );
                    setTimeout(() => setActionAlert(null), 4500);
                  }}
                  className="flex-1 bg-[#241E1A] hover:bg-black text-white py-2.5 rounded-xl text-xs font-sans font-medium transition-colors cursor-pointer text-center"
                >
                  {t('Отправить обращение', 'Submit Request')}
                </button>
                <button
                  type="button"
                  onClick={() => setIsSupportModalOpen(false)}
                  className="px-4 bg-white border border-[#E5E2DD] text-[#8A8177] py-2.5 rounded-xl text-xs font-sans hover:bg-slate-50 transition-colors cursor-pointer"
                >
                  {t('Закрыть', 'Close')}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // ==================== SUB-SCREEN: NOTIFICATIONS (Screenshot 4) ====================
  if (showNotifications) {
    const filteredNotifs = managerNotifs.filter((item) => {
      if (notifFilter === 'ALL') return true;
      return item.category === notifFilter;
    });

    const todayList = filteredNotifs.filter((n) => n.dayGroup === 'TODAY');
    const yesterdayList = filteredNotifs.filter((n) => n.dayGroup === 'YESTERDAY');

    const renderNotifIcon = (iconType: ManagerNotification['iconType']) => {
      switch (iconType) {
        case 'CLOCK_URGENT':
          return <Clock className="h-4.5 w-4.5 text-[#B3261E] shrink-0 mt-0.5" />;
        case 'WRENCH':
          return <Wrench className="h-4.5 w-4.5 text-[#8A8177] shrink-0 mt-0.5" />;
        case 'MESSAGE':
          return <MessageSquare className="h-4.5 w-4.5 text-[#8A8177] shrink-0 mt-0.5" />;
        case 'CHECK':
          return <CheckCircle2 className="h-4.5 w-4.5 text-[#8A8177] shrink-0 mt-0.5" />;
        default:
          return <Clock className="h-4.5 w-4.5 text-[#8A8177] shrink-0 mt-0.5" />;
      }
    };

    return (
      <div className="flex-1 flex flex-col bg-[#FAF7F3] overflow-hidden select-none font-sans">
        {/* Header */}
        <div className="px-5 pt-7 pb-3 bg-[#FAF7F3] shrink-0">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setShowNotifications(false)}
              className="text-[#241E1A] hover:text-black p-1 -ml-1 transition-colors cursor-pointer"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <h1 className="text-2xl font-serif font-medium text-[#241E1A] leading-tight">
              {t('Уведомления', 'Notifications')}
            </h1>
          </div>
          <div className="flex items-center gap-2 text-xs text-[#8A8177] font-sans mt-0.5 ml-8">
            <span className="font-medium text-[#241E1A]">
              {unreadNotifsCount} {t('новых', 'new')}
            </span>
            <span>·</span>
            <button
              type="button"
              onClick={() => {
                setManagerNotifs(managerNotifs.map((n) => ({ ...n, unread: false })));
                setActionAlert(t('Все уведомления отмечены как прочитанные', 'All notifications marked as read'));
                setTimeout(() => setActionAlert(null), 2500);
              }}
              className="text-[#C2410C] hover:underline cursor-pointer"
            >
              {t('отметить все прочитанными', 'mark all read')}
            </button>
          </div>
        </div>

        {/* Filter Pills */}
        <div className="px-5 pb-3 flex items-center gap-1.5 overflow-x-auto no-scrollbar shrink-0">
          {[
            { id: 'ALL', label: t('Все', 'All') },
            { id: 'BOOKINGS', label: t('Бронирования', 'Bookings') },
            { id: 'ROOMS', label: t('Номера и службы', 'Rooms & Services') },
            { id: 'FINANCE', label: t('Смена', 'Shift') },
          ].map((f) => {
            const isSelected = notifFilter === f.id;
            return (
              <button
                key={f.id}
                type="button"
                onClick={() => setNotifFilter(f.id as any)}
                className={`px-4 py-1.5 rounded-full text-xs font-sans transition-all cursor-pointer whitespace-nowrap border ${
                  isSelected
                    ? 'bg-[#241E1A] text-white border-[#241E1A] font-medium shadow-xs'
                    : 'bg-white text-[#8A8177] border-[#E5E2DD] hover:bg-slate-50'
                }`}
              >
                {f.label}
              </button>
            );
          })}
        </div>

        {/* Notifications Feed */}
        <div className="flex-1 overflow-y-auto px-5 pb-6 space-y-4 no-scrollbar">
          {filteredNotifs.length === 0 ? (
            <div className="text-center py-12 text-[#8A8177] font-sans text-xs bg-white rounded-2xl border border-[#E5E2DD] shadow-2xs">
              <Bell className="h-6 w-6 mx-auto text-[#8A8177] mb-1.5" />
              <p>{t('Уведомлений по данному фильтру нет', 'No notifications matching this filter')}</p>
            </div>
          ) : (
            <>
              {todayList.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-[10px] text-[#8A8177] font-sans font-medium tracking-widest uppercase px-1">
                    {t('СЕГОДНЯ', 'TODAY')}
                  </h4>
                  <div className="space-y-2">
                    {todayList.map((item) => (
                      <div
                        key={item.id}
                        onClick={() =>
                          setManagerNotifs((prev) =>
                            prev.map((n) =>
                              n.id === item.id ? { ...n, unread: false } : n
                            )
                          )
                        }
                        className={`bg-white border border-[#E5E2DD] rounded-2xl p-4 shadow-2xs relative transition-all cursor-pointer flex gap-3 ${
                          item.urgent && item.unread
                            ? 'border-l-4 border-l-[#B3261E]'
                            : ''
                        }`}
                      >
                        {renderNotifIcon(item.iconType)}
                        <div className="flex-1 text-left min-w-0">
                          <span className="text-xs font-sans font-medium text-[#241E1A] block">
                            {item.title}
                          </span>
                          <span className="text-[11px] font-sans text-[#8A8177] block mt-0.5">
                            {item.sub}
                          </span>
                        </div>
                        {item.unread && (
                          <span className="h-2 w-2 rounded-full bg-[#C2410C] mt-1.5 self-start ml-auto shrink-0" />
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {yesterdayList.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-[10px] text-[#8A8177] font-sans font-medium tracking-widest uppercase px-1">
                    {t('ВЧЕРА', 'YESTERDAY')}
                  </h4>
                  <div className="space-y-2">
                    {yesterdayList.map((item) => (
                      <div
                        key={item.id}
                        onClick={() =>
                          setManagerNotifs((prev) =>
                            prev.map((n) =>
                              n.id === item.id ? { ...n, unread: false } : n
                            )
                          )
                        }
                        className="bg-white border border-[#E5E2DD] rounded-2xl p-4 shadow-2xs relative transition-all cursor-pointer flex gap-3"
                      >
                        {renderNotifIcon(item.iconType)}
                        <div className="flex-1 text-left min-w-0">
                          <span className="text-xs font-sans font-medium text-[#241E1A] block">
                            {item.title}
                          </span>
                          <span className="text-[11px] font-sans text-[#8A8177] block mt-0.5">
                            {item.sub}
                          </span>
                        </div>
                        {item.unread && (
                          <span className="h-2 w-2 rounded-full bg-[#C2410C] mt-1.5 self-start ml-auto shrink-0" />
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    );
  }

  // ==================== SUB-SCREEN: CHATS (Screenshot 3 & Conversation View) ====================
  if (showChats) {
    const activeChat = managerChats.find((c) => c.id === activeChatId);

    return (
      <div className="flex-1 flex flex-col bg-[#FAF7F3] overflow-hidden select-none font-sans">
        {activeChatId === null ? (
          /* ================= CHATS LIST ================= */
          <div className="flex-1 flex flex-col overflow-hidden">
            {/* Header */}
            <div className="px-5 pt-7 pb-3 bg-[#FAF7F3] shrink-0 border-b border-[#E5E2DD]/70">
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setShowChats(false)}
                  className="text-[#241E1A] hover:text-black p-1 -ml-1 transition-colors cursor-pointer"
                >
                  <ChevronLeft className="h-5 w-5" />
                </button>
                <h1 className="text-2xl font-serif font-medium text-[#241E1A] leading-tight">
                  {t('Чаты', 'Chats')}
                </h1>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3.5 no-scrollbar">
              {/* Search Bar (Screenshot 3) */}
              <div className="relative">
                <Search className="h-4 w-4 text-[#8A8177] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  value={chatSearchQuery}
                  onChange={(e) => setChatSearchQuery(e.target.value)}
                  placeholder={t('Поиск по имени', 'Search by name')}
                  className="w-full bg-white border border-[#E5E2DD] rounded-xl pl-10 pr-3.5 py-3 text-xs text-[#241E1A] placeholder:text-[#8A8177]/70 focus:outline-none focus:border-[#C2410C] shadow-2xs"
                />
              </div>

              {/* Chats List Card (Screenshot 3) */}
              <div className="bg-white rounded-2xl border border-[#E5E2DD] divide-y divide-[#E5E2DD]/60 shadow-2xs overflow-hidden">
                {managerChats
                  .filter((chat) => {
                    if (!chatSearchQuery.trim()) return true;
                    const q = chatSearchQuery.toLowerCase();
                    return (
                      chat.contactName.toLowerCase().includes(q) ||
                      chat.contactRole.toLowerCase().includes(q)
                    );
                  })
                  .map((chat) => {
                    const lastMsg = chat.messages[chat.messages.length - 1];

                    return (
                      <div
                        key={chat.id}
                        onClick={() => {
                          setActiveChatId(chat.id);
                          // Mark as read
                          setManagerChats((prev) =>
                            prev.map((c) =>
                              c.id === chat.id ? { ...c, unreadCount: 0 } : c
                            )
                          );
                        }}
                        className="p-3.5 flex items-center gap-3 hover:bg-slate-50 transition-colors cursor-pointer"
                      >
                        {/* Avatar */}
                        <div className="h-10 w-10 rounded-full bg-[#EAE6DE] text-[#241E1A] flex items-center justify-center font-medium text-xs shrink-0 font-sans">
                          {chat.avatarInitials}
                        </div>

                        {/* Middle info */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5">
                            <span className="font-sans font-medium text-xs text-[#241E1A] truncate">
                              {chat.contactName}
                            </span>
                            {chat.isPinned && (
                              <Pin className="h-3 w-3 text-[#C2410C] shrink-0 fill-[#C2410C]" />
                            )}
                            <span className="text-[10px] text-[#8A8177] font-sans truncate">
                              {chat.contactRole}
                            </span>
                          </div>

                          <p className="text-[11px] text-[#8A8177] font-sans truncate mt-0.5">
                            {lastMsg ? lastMsg.text : 'Нет сообщений'}
                          </p>
                        </div>

                        {/* Right: time + badge */}
                        <div className="flex flex-col items-end gap-1 shrink-0">
                          <span className="text-[10px] text-[#8A8177] font-sans">
                            {chat.time}
                          </span>
                          {chat.unreadCount > 0 && (
                            <span className="h-4 w-4 rounded-full bg-[#C2410C] text-white text-[9px] font-medium flex items-center justify-center">
                              {chat.unreadCount}
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
              </div>
            </div>
          </div>
        ) : (
          /* ================= ACTIVE CHAT CONVERSATION ================= */
          <div className="flex-1 flex flex-col overflow-hidden">
            {/* Conversation Header (Clean, NO DUPLICATE NAME) */}
            <div className="px-4 pt-7 pb-3 bg-white border-b border-[#E5E2DD] flex items-center justify-between shrink-0 shadow-2xs">
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setActiveChatId(null)}
                  className="text-[#241E1A] hover:text-black p-1 -ml-1 transition-colors cursor-pointer"
                >
                  <ChevronLeft className="h-5 w-5" />
                </button>

                <div className="h-9 w-9 rounded-full bg-[#EAE6DE] text-[#241E1A] flex items-center justify-center font-medium text-xs shrink-0 font-sans">
                  {activeChat?.avatarInitials}
                </div>

                <div>
                  <h3 className="font-sans font-medium text-sm text-[#241E1A] leading-tight">
                    {activeChat?.contactName}
                  </h3>
                  <span className="text-[10px] text-[#3D7C52] font-sans block mt-0.5 flex items-center gap-1">
                    <span className="h-1.5 w-1.5 rounded-full bg-[#3D7C52]" />
                    {activeChat?.contactRole} · {t('В сети', 'Online')}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <a
                  href="tel:+77015553311"
                  className="p-2 text-[#8A8177] hover:text-[#C2410C] rounded-xl hover:bg-slate-50 transition-colors"
                  title={t('Позвонить', 'Call')}
                >
                  <Phone className="h-4 w-4" />
                </a>
              </div>
            </div>

            {/* Messages Feed */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3 no-scrollbar bg-[#FAF7F3]">
              {activeChat?.messages.map((m) => {
                const isMe = m.sender === 'ME';

                return (
                  <div
                    key={m.id}
                    className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}
                  >
                    <div
                      className={`max-w-[78%] rounded-2xl px-4 py-2.5 text-xs font-sans shadow-2xs leading-relaxed ${
                        isMe
                          ? 'bg-[#241E1A] text-white rounded-br-xs'
                          : 'bg-white text-[#241E1A] border border-[#E5E2DD] rounded-bl-xs'
                      }`}
                    >
                      {m.text}
                    </div>
                    <span className="text-[9px] text-[#8A8177] font-sans mt-1 px-1">
                      {m.time}
                    </span>
                  </div>
                );
              })}
            </div>

            {/* Input Bar */}
            <div className="p-3 bg-white border-t border-[#E5E2DD] flex items-center gap-2 shrink-0">
              <input
                type="text"
                value={newMessageText}
                onChange={(e) => setNewMessageText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && newMessageText.trim() && activeChatId) {
                    const newMsg = {
                      id: `msg-${Date.now()}`,
                      sender: 'ME' as const,
                      text: newMessageText.trim(),
                      time: new Date().toLocaleTimeString(lang === 'EN' ? 'en-US' : 'ru-RU', {
                        hour: '2-digit',
                        minute: '2-digit',
                      }),
                    };
                    setManagerChats((prev) =>
                      prev.map((c) =>
                        c.id === activeChatId
                          ? { ...c, messages: [...c.messages, newMsg] }
                          : c
                      )
                    );
                    setNewMessageText('');
                  }
                }}
                placeholder={t('Написать сообщение...', 'Type a message...')}
                className="flex-1 bg-[#FAF7F3] border border-[#E5E2DD] rounded-xl px-3.5 py-2.5 text-xs text-[#241E1A] placeholder:text-[#8A8177]/70 focus:outline-none focus:border-[#C2410C]"
              />

              <button
                type="button"
                onClick={() => {
                  if (!newMessageText.trim() || !activeChatId) return;
                  const newMsg = {
                    id: `msg-${Date.now()}`,
                    sender: 'ME' as const,
                    text: newMessageText.trim(),
                    time: new Date().toLocaleTimeString('ru-RU', {
                      hour: '2-digit',
                      minute: '2-digit',
                    }),
                  };
                  setManagerChats((prev) =>
                    prev.map((c) =>
                      c.id === activeChatId
                        ? { ...c, messages: [...c.messages, newMsg] }
                        : c
                    )
                  );
                  setNewMessageText('');
                }}
                className="bg-[#C2410C] hover:bg-[#A93A0C] text-white p-2.5 rounded-xl shrink-0 transition-transform active:scale-95 cursor-pointer shadow-xs"
              >
                <Send className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    );
  }

  // ==================== MAIN PROFILE VIEW (Screenshot 2) ====================
  return (
    <div className="flex-1 flex flex-col bg-[#FAF7F3] overflow-hidden select-none font-sans">
      {/* Toast Alert */}
      {actionAlert && (
        <div className="fixed top-5 left-1/2 -translate-x-1/2 z-50 bg-[#241E1A] text-white text-xs font-sans px-4 py-2.5 rounded-xl shadow-lg border border-white/10 flex items-center gap-2 max-w-[90vw]">
          <CheckCircle2 className="h-4 w-4 text-[#3D7C52] shrink-0" />
          <span>{actionAlert}</span>
          <button
            onClick={() => setActionAlert(null)}
            className="text-white/60 hover:text-white cursor-pointer ml-1"
          >
            ✕
          </button>
        </div>
      )}

      {/* Header: Title + 3 Quick Action Buttons (Screenshot 2) */}
      <div className="px-5 pt-7 pb-3 bg-[#FAF7F3] shrink-0 flex items-center justify-between">
        <h1 className="text-2xl font-serif font-medium text-[#241E1A] leading-tight">
          {t('Профиль', 'Profile')}
        </h1>

        {/* Action Buttons: [Chats] [Notifications] [Settings] */}
        <div className="flex items-center gap-2">
          {/* Chat Icon Button */}
          <button
            type="button"
            onClick={() => setShowChats(true)}
            className="h-10 w-10 bg-white border border-[#E5E2DD] rounded-xl flex items-center justify-center relative shadow-2xs hover:bg-slate-50 transition-colors cursor-pointer"
            title={t('Чаты', 'Chats')}
          >
            <MessageSquare className="h-4.5 w-4.5 text-[#241E1A]" />
            {unreadChatsCount > 0 && (
              <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-[#C2410C] text-white text-[9px] font-medium flex items-center justify-center">
                {unreadChatsCount}
              </span>
            )}
          </button>

          {/* Notifications Icon Button */}
          <button
            type="button"
            onClick={() => setShowNotifications(true)}
            className="h-10 w-10 bg-white border border-[#E5E2DD] rounded-xl flex items-center justify-center relative shadow-2xs hover:bg-slate-50 transition-colors cursor-pointer"
            title={t('Уведомления', 'Notifications')}
          >
            <Bell className="h-4.5 w-4.5 text-[#241E1A]" />
            {unreadNotifsCount > 0 && (
              <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-[#C2410C] text-white text-[9px] font-medium flex items-center justify-center">
                {unreadNotifsCount}
              </span>
            )}
          </button>

          {/* Settings Icon Button */}
          <button
            type="button"
            onClick={() => setShowSettings(true)}
            className="h-10 w-10 bg-white border border-[#E5E2DD] rounded-xl flex items-center justify-center shadow-2xs hover:bg-slate-50 transition-colors cursor-pointer"
            title={t('Настройки', 'Settings')}
          >
            <Settings className="h-4.5 w-4.5 text-[#241E1A]" />
          </button>
        </div>
      </div>

      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto px-5 py-3 space-y-4 no-scrollbar">
        {/* User Card (Screenshot 2) */}
        <div className="bg-white rounded-2xl border border-[#E5E2DD] p-4.5 shadow-2xs flex items-center gap-3.5">
          <img
            src={cleanerProfile.avatarUrl}
            alt={cleanerProfile.fullNameRu}
            className="h-14 w-14 rounded-full object-cover border border-[#E5E2DD]"
          />
          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-sans font-medium text-[#241E1A] truncate">
              {cleanerProfile.fullNameRu || 'Арман Нурланов'}
            </h3>
            <p className="text-xs text-[#8A8177] font-sans mt-0.5">
              {t('Руководитель отеля', 'Hotel Manager')}
            </p>
            <span className="text-[10px] text-[#C2410C] font-mono mt-1 block">
              ID: {cleanerProfile.badgeId || 'SLV-1001'}
            </span>
          </div>
        </div>

        {/* Section: ТЕКУЩАЯ СМЕНА (Screenshot 2) */}
        <div className="space-y-1.5">
          <h4 className="text-[10px] text-[#8A8177] font-sans font-medium tracking-widest uppercase px-1">
            {t('ТЕКУЩАЯ СМЕНА', 'CURRENT SHIFT')}
          </h4>

          <div className="bg-white rounded-2xl border border-[#E5E2DD] p-4.5 shadow-2xs space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-sans font-medium text-sm text-[#241E1A]">
                {t('Смена активна', 'Shift active')}
              </span>
              <span className="text-xs text-[#8A8177] font-sans">
                {t('19 нояб. · 08:00—20:00', '19 Nov · 08:00—20:00')}
              </span>
            </div>

            <p className="text-xs text-[#8A8177] font-sans leading-relaxed">
              {t(
                'Операционный контроль номерного фонда, кассы и служб отеля.',
                'Operational control of room inventory, cash register, and hotel departments.'
              )}
            </p>

            {/* Quick Action / Status */}
            <div className="w-full bg-[#FAF7F3] border border-[#E5E2DD] py-2.5 px-3.5 rounded-xl flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-[#3D7C52] animate-pulse" />
                <span className="font-medium text-[#241E1A]">
                  {t('Статус руководителя', 'Manager status')}
                </span>
              </div>
              <span className="text-[#3D7C52] font-medium">
                {t('На рабочем месте', 'On duty')}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
