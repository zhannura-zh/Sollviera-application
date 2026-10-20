import React, { useState, useEffect } from 'react';
import {
  LayoutDashboard, CheckSquare, Clock, User, Search, ChevronRight, ChevronLeft,
  ChevronDown, MessageSquare, Bell, Settings, BarChart3, RefreshCw, Lock,
  HelpCircle, LogOut, Send, Pin, CheckCircle2, AlertTriangle, Sparkles,
  ConciergeBell, QrCode, Check, RotateCcw, Calendar, ListTodo
} from 'lucide-react';
import { Language, CleanerProfile } from '../types';

export type ServiceRequestStatus = 'NEW' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
export type ServiceCategory = 'SPA' | 'ROOM_SERVICE' | 'LAUNDRY' | 'BAR' | 'TRANSFER' | 'CONCIERGE';

export interface ServiceRequest {
  id: string;
  code: string;
  roomNumber: string;
  titleRu: string;
  titleEn: string;
  category: ServiceCategory;
  categoryLabelRu: string;
  categoryLabelEn: string;
  guestNameRu: string;
  guestNameEn: string;
  timeSlot: string;
  deadline: string;
  overdueTextRu?: string;
  overdueTextEn?: string;
  overdueDetailRu?: string;
  overdueDetailEn?: string;
  price: string;
  paymentStatusRu: string;
  paymentStatusEn: string;
  status: ServiceRequestStatus;
  isUrgent: boolean;
  isOverdue: boolean;
  assigneeRu: string;
  assigneeEn: string;
  isAssignedToMe: boolean;
  descriptionRu: string;
  descriptionEn: string;
  dateRu: string;
  dateEn: string;
  completedTime?: string;
}

interface ServicesScreensProps {
  lang: Language;
  onLanguageChange: (lang: Language) => void;
  cleanerProfile: CleanerProfile;
  onUpdateCleanerProfile: (profile: CleanerProfile) => void;
  onLogout: () => void;
  offlineMode: boolean;
  onToggleOffline: () => void;
  activeTab: 'SERVICES_HOME' | 'SERVICES_TASKS' | 'SERVICES_HISTORY' | 'SERVICES_PROFILE';
  onNavigateTab: (tab: 'SERVICES_HOME' | 'SERVICES_TASKS' | 'SERVICES_HISTORY' | 'SERVICES_PROFILE') => void;
}

const INITIAL_SERVICE_REQUESTS: ServiceRequest[] = [
  {
    id: 'sr-1048',
    code: 'SR-1048',
    roomNumber: '302',
    titleRu: 'Массаж спины 40 мин',
    titleEn: 'Back Massage 40 min',
    category: 'SPA',
    categoryLabelRu: 'SPA и массаж',
    categoryLabelEn: 'SPA & Massage',
    guestNameRu: 'Нуржанов Ербол',
    guestNameEn: 'Yerbol Nurzhanov',
    timeSlot: '13:00–13:40',
    deadline: '13:00',
    overdueTextRu: '13:00 · +24 мин',
    overdueTextEn: '13:00 · +24 min',
    overdueDetailRu: 'до 13:00 · +24 мин',
    overdueDetailEn: 'due 13:00 · +24 min',
    price: '15 000 ₸',
    paymentStatusRu: 'Оплачено',
    paymentStatusEn: 'Paid',
    status: 'NEW',
    isUrgent: true,
    isOverdue: true,
    assigneeRu: 'Не назначен',
    assigneeEn: 'Unassigned',
    isAssignedToMe: false,
    descriptionRu: 'Классический массаж спины в SPA-зоне. Запись на 40 минут; гость ожидает начала сеанса.',
    descriptionEn: 'Classic back massage in the SPA zone. 40-minute session; guest is waiting for the session to start.',
    dateRu: '19 октября',
    dateEn: 'October 19',
  },
  {
    id: 'sr-1049',
    code: 'SR-1049',
    roomNumber: '208',
    titleRu: 'Room Service',
    titleEn: 'Room Service',
    category: 'ROOM_SERVICE',
    categoryLabelRu: 'Room Service',
    categoryLabelEn: 'Room Service',
    guestNameRu: 'Серикбаева Ботагоз',
    guestNameEn: 'Botagoz Serikbayeva',
    timeSlot: '13:45–14:15',
    deadline: '13:45',
    price: '18 500 ₸',
    paymentStatusRu: 'На счёт номера',
    paymentStatusEn: 'Room Charge',
    status: 'IN_PROGRESS',
    isUrgent: false,
    isOverdue: false,
    assigneeRu: 'Алина Садыкова',
    assigneeEn: 'Alina Sadykova',
    isAssignedToMe: true,
    descriptionRu: 'Доставка обеда в номер на 2 персоны (сет горячих блюд и авторский чай). Гость просил подать к 13:45.',
    descriptionEn: 'Lunch delivery for 2 persons (hot dishes set and signature tea). Guest requested delivery by 13:45.',
    dateRu: '19 октября',
    dateEn: 'October 19',
  },
  {
    id: 'sr-1050',
    code: 'SR-1050',
    roomNumber: '102',
    titleRu: 'Прачечная (экспресс)',
    titleEn: 'Laundry (Express)',
    category: 'LAUNDRY',
    categoryLabelRu: 'Прачечная',
    categoryLabelEn: 'Laundry',
    guestNameRu: 'Ким Александр',
    guestNameEn: 'Alexander Kim',
    timeSlot: '16:00–16:30',
    deadline: '16:30',
    price: '9 000 ₸',
    paymentStatusRu: 'Оплачено',
    paymentStatusEn: 'Paid',
    status: 'IN_PROGRESS',
    isUrgent: false,
    isOverdue: false,
    assigneeRu: 'Алина Садыкова',
    assigneeEn: 'Alina Sadykova',
    isAssignedToMe: true,
    descriptionRu: 'Экспресс-стирка и отпаривание делового костюма и 2 сорочек. Вернуть на вешалке в чехле до 16:30.',
    descriptionEn: 'Express laundry and steaming of business suit and 2 shirts. Return on hanger in garment bag by 16:30.',
    dateRu: '19 октября',
    dateEn: 'October 19',
  },
  {
    id: 'sr-1051',
    code: 'SR-1051',
    roomNumber: '401',
    titleRu: 'Трансфер в аэропорт (VIP)',
    titleEn: 'Airport Transfer (VIP)',
    category: 'TRANSFER',
    categoryLabelRu: 'Трансфер',
    categoryLabelEn: 'Transfer',
    guestNameRu: 'Абдиров Канат',
    guestNameEn: 'Kanat Abdirov',
    timeSlot: '14:00–15:00',
    deadline: '14:00',
    price: '25 000 ₸',
    paymentStatusRu: 'Оплачено',
    paymentStatusEn: 'Paid',
    status: 'NEW',
    isUrgent: true,
    isOverdue: false,
    assigneeRu: 'Алина Садыкова',
    assigneeEn: 'Alina Sadykova',
    isAssignedToMe: true,
    descriptionRu: 'Индивидуальный трансфер на представительском классе S-Class ко главному входу отеля. Помощь с багажом (3 чемодана).',
    descriptionEn: 'Private S-Class executive transfer at the main hotel entrance. Luggage assistance required (3 suitcases).',
    dateRu: '19 октября',
    dateEn: 'October 19',
  },
  {
    id: 'sr-1052',
    code: 'SR-1052',
    roomNumber: '315',
    titleRu: 'Арома-сауна и хамам 90 мин',
    titleEn: 'Aroma Sauna & Hammam 90 min',
    category: 'SPA',
    categoryLabelRu: 'SPA и массаж',
    categoryLabelEn: 'SPA & Massage',
    guestNameRu: 'Ибрагимова Динара',
    guestNameEn: 'Dinara Ibragimova',
    timeSlot: '15:00–16:30',
    deadline: '15:00',
    price: '32 000 ₸',
    paymentStatusRu: 'Оплачено',
    paymentStatusEn: 'Paid',
    status: 'NEW',
    isUrgent: false,
    isOverdue: false,
    assigneeRu: 'Не назначен',
    assigneeEn: 'Unassigned',
    isAssignedToMe: false,
    descriptionRu: 'Подготовка VIP-зоны хамама на 2 персоны, эвкалиптовое аромамасло, травяной чай и комплект халатов.',
    descriptionEn: 'Prepare VIP hammam zone for 2 guests, eucalyptus essential oil, herbal tea, and bathrobes set.',
    dateRu: '19 октября',
    dateEn: 'October 19',
  },
  {
    id: 'sr-1053',
    code: 'SR-1053',
    roomNumber: '214',
    titleRu: 'Бар (коктейли в номер)',
    titleEn: 'Bar (Cocktails to Room)',
    category: 'BAR',
    categoryLabelRu: 'Бар',
    categoryLabelEn: 'Bar',
    guestNameRu: 'Смагулов Тимур',
    guestNameEn: 'Timur Smagulov',
    timeSlot: '17:15–17:30',
    deadline: '17:15',
    price: '14 000 ₸',
    paymentStatusRu: 'На счёт номера',
    paymentStatusEn: 'Room Charge',
    status: 'NEW',
    isUrgent: false,
    isOverdue: false,
    assigneeRu: 'Марат Оспанов',
    assigneeEn: 'Marat Ospanov',
    isAssignedToMe: false,
    descriptionRu: 'Подача 2 авторских коктейлей и сырной тарелки со льдом в номер.',
    descriptionEn: 'Serve 2 signature cocktails and cheese platter with ice to the room.',
    dateRu: '19 октября',
    dateEn: 'October 19',
  },
  {
    id: 'sr-1054',
    code: 'SR-1054',
    roomNumber: '412',
    titleRu: 'Оформление номера к празднику',
    titleEn: 'Festive Room Decoration',
    category: 'CONCIERGE',
    categoryLabelRu: 'Консьерж-сервис',
    categoryLabelEn: 'Concierge',
    guestNameRu: 'Оспанов Данияр',
    guestNameEn: 'Daniyar Ospanov',
    timeSlot: '18:00–18:45',
    deadline: '18:00',
    price: '28 000 ₸',
    paymentStatusRu: 'Оплачено',
    paymentStatusEn: 'Paid',
    status: 'IN_PROGRESS',
    isUrgent: false,
    isOverdue: false,
    assigneeRu: 'Марат Оспанов',
    assigneeEn: 'Marat Ospanov',
    isAssignedToMe: false,
    descriptionRu: 'Праздничное оформление сюита ко дню рождения гостя, корзина фруктов и охлаждённое просекко.',
    descriptionEn: 'Festive suite decoration for guest birthday, fruit basket and chilled prosecco.',
    dateRu: '19 октября',
    dateEn: 'October 19',
  },
  {
    id: 'sr-1055',
    code: 'SR-1055',
    roomNumber: '110',
    titleRu: 'Химчистка вечернего платья',
    titleEn: 'Evening Dress Dry Cleaning',
    category: 'LAUNDRY',
    categoryLabelRu: 'Прачечная',
    categoryLabelEn: 'Laundry',
    guestNameRu: 'Ахметова Алия',
    guestNameEn: 'Aliya Akhmetova',
    timeSlot: '18:30–19:00',
    deadline: '18:30',
    price: '12 000 ₸',
    paymentStatusRu: 'На счёт номера',
    paymentStatusEn: 'Room Charge',
    status: 'NEW',
    isUrgent: false,
    isOverdue: false,
    assigneeRu: 'Не назначен',
    assigneeEn: 'Unassigned',
    isAssignedToMe: false,
    descriptionRu: 'Деликатная паровая чистка шёлкового платья к вечернему банкету.',
    descriptionEn: 'Delicate steam cleaning of silk evening dress before the banquet.',
    dateRu: '19 октября',
    dateEn: 'October 19',
  },
  {
    id: 'sr-1056',
    code: 'SR-1056',
    roomNumber: '308',
    titleRu: 'Стоун-терапия 60 мин',
    titleEn: 'Hot Stone Therapy 60 min',
    category: 'SPA',
    categoryLabelRu: 'SPA и массаж',
    categoryLabelEn: 'SPA & Massage',
    guestNameRu: 'Вэнс Роберт',
    guestNameEn: 'Robert Vance',
    timeSlot: '19:00–20:00',
    deadline: '19:00',
    price: '22 000 ₸',
    paymentStatusRu: 'Оплачено',
    paymentStatusEn: 'Paid',
    status: 'NEW',
    isUrgent: false,
    isOverdue: false,
    assigneeRu: 'Не назначен',
    assigneeEn: 'Unassigned',
    isAssignedToMe: false,
    descriptionRu: 'Расслабляющий массаж горячими базальтовыми камнями в SPA-кабинете № 2.',
    descriptionEn: 'Relaxing hot basalt stone massage in SPA room #2.',
    dateRu: '19 октября',
    dateEn: 'October 19',
  },
  {
    id: 'sr-1057',
    code: 'SR-1057',
    roomNumber: '204',
    titleRu: 'Детская кроватка и радионяня',
    titleEn: 'Baby Crib & Monitor Setup',
    category: 'CONCIERGE',
    categoryLabelRu: 'Консьерж-сервис',
    categoryLabelEn: 'Concierge',
    guestNameRu: 'Сулейменова Айнур',
    guestNameEn: 'Ainur Suleimenova',
    timeSlot: '19:30–20:00',
    deadline: '19:30',
    price: '5 000 ₸',
    paymentStatusRu: 'Оплачено',
    paymentStatusEn: 'Paid',
    status: 'NEW',
    isUrgent: false,
    isOverdue: false,
    assigneeRu: 'Не назначен',
    assigneeEn: 'Unassigned',
    isAssignedToMe: false,
    descriptionRu: 'Доставка и установка детского манежа с гипоаллергенным бельём и комплектом радионяни.',
    descriptionEn: 'Delivery and setup of baby crib with hypoallergenic linen and baby monitor.',
    dateRu: '19 октября',
    dateEn: 'October 19',
  },
  // History requests (Completed & Cancelled)
  {
    id: 'sr-1041',
    code: 'SR-1041',
    roomNumber: '302',
    titleRu: 'Массаж спины 40 мин',
    titleEn: 'Back Massage 40 min',
    category: 'SPA',
    categoryLabelRu: 'SPA и массаж',
    categoryLabelEn: 'SPA & Massage',
    guestNameRu: 'Нуржанов Ербол',
    guestNameEn: 'Yerbol Nurzhanov',
    timeSlot: '11:30–12:10',
    deadline: '12:10',
    completedTime: '12:10',
    price: '15 000 ₸',
    paymentStatusRu: 'Оплачено',
    paymentStatusEn: 'Paid',
    status: 'COMPLETED',
    isUrgent: false,
    isOverdue: false,
    assigneeRu: 'Алина Садыкова',
    assigneeEn: 'Alina Sadykova',
    isAssignedToMe: true,
    descriptionRu: 'Классический массаж спины в SPA-зоне. Сеанс проведён по расписанию, гость оставил положительный отзыв.',
    descriptionEn: 'Classic back massage in SPA zone. Session completed on schedule, guest left positive feedback.',
    dateRu: '19 октября',
    dateEn: 'October 19',
  },
  {
    id: 'sr-1039',
    code: 'SR-1039',
    roomNumber: '205',
    titleRu: 'Бар',
    titleEn: 'Bar',
    category: 'BAR',
    categoryLabelRu: 'Бар',
    categoryLabelEn: 'Bar',
    guestNameRu: 'Дмитриев Сергей',
    guestNameEn: 'Sergey Dmitriev',
    timeSlot: '11:20–11:40',
    deadline: '11:40',
    completedTime: '11:40',
    price: '11 500 ₸',
    paymentStatusRu: 'На счёт номера',
    paymentStatusEn: 'Room Charge',
    status: 'COMPLETED',
    isUrgent: false,
    isOverdue: false,
    assigneeRu: 'Алина Садыкова',
    assigneeEn: 'Alina Sadykova',
    isAssignedToMe: true,
    descriptionRu: 'Доставка прохладительных напитков и снеков из лобби-бара в номер 205.',
    descriptionEn: 'Delivery of refreshments and snacks from the lobby bar to room 205.',
    dateRu: '19 октября',
    dateEn: 'October 19',
  },
  {
    id: 'sr-1035',
    code: 'SR-1035',
    roomNumber: '301',
    titleRu: 'Трансфер из аэропорта',
    titleEn: 'Airport Pickup Transfer',
    category: 'TRANSFER',
    categoryLabelRu: 'Трансфер',
    categoryLabelEn: 'Transfer',
    guestNameRu: 'Крейг Дэвид',
    guestNameEn: 'David Craig',
    timeSlot: '10:30–11:15',
    deadline: '10:45',
    completedTime: '10:45',
    price: '20 000 ₸',
    paymentStatusRu: 'Возврат оформлен',
    paymentStatusEn: 'Refunded',
    status: 'CANCELLED',
    isUrgent: false,
    isOverdue: false,
    assigneeRu: 'Алина Садыкова',
    assigneeEn: 'Alina Sadykova',
    isAssignedToMe: true,
    descriptionRu: 'Гость отменил встречу в аэропорту в связи с переносом рейса на следующий день.',
    descriptionEn: 'Guest cancelled airport pickup due to flight rescheduling to the next day.',
    dateRu: '19 октября',
    dateEn: 'October 19',
  },
  {
    id: 'sr-1028',
    code: 'SR-1028',
    roomNumber: '402',
    titleRu: 'Room Service (завтрак в номер)',
    titleEn: 'Room Service (Breakfast in Room)',
    category: 'ROOM_SERVICE',
    categoryLabelRu: 'Room Service',
    categoryLabelEn: 'Room Service',
    guestNameRu: 'Абдиров Канат',
    guestNameEn: 'Kanat Abdirov',
    timeSlot: '09:00–09:30',
    deadline: '09:30',
    completedTime: '09:25',
    price: '16 000 ₸',
    paymentStatusRu: 'Оплачено',
    paymentStatusEn: 'Paid',
    status: 'COMPLETED',
    isUrgent: false,
    isOverdue: false,
    assigneeRu: 'Алина Садыкова',
    assigneeEn: 'Alina Sadykova',
    isAssignedToMe: true,
    descriptionRu: 'Континентальный завтрак на 2 персоны со свежевыжатым апельсиновым соком и круассанами.',
    descriptionEn: 'Continental breakfast for 2 with freshly squeezed orange juice and croissants.',
    dateRu: '18 октября',
    dateEn: 'October 18',
  },
];

export const ServicesScreens: React.FC<ServicesScreensProps> = ({
  lang,
  onLanguageChange,
  cleanerProfile,
  onUpdateCleanerProfile,
  onLogout,
  offlineMode,
  onToggleOffline,
  activeTab,
  onNavigateTab,
}) => {
  const [requests, setRequests] = useState<ServiceRequest[]>(INITIAL_SERVICE_REQUESTS);
  const [selectedRequestId, setSelectedRequestId] = useState<string | null>(null);

  // Filters for HOME (Главная)
  const [homeSearch, setHomeSearch] = useState<string>('');
  const [homeStatusFilter, setHomeStatusFilter] = useState<'ALL' | 'NEW' | 'IN_PROGRESS' | 'URGENT'>('ALL');
  const [homeCategoryFilter, setHomeCategoryFilter] = useState<string>('ALL');
  const [homeStaffFilter, setHomeStaffFilter] = useState<string>('ALL');

  // Filters for MY TASKS (Мои задачи)
  const [myTasksFilter, setMyTasksFilter] = useState<'ACTIVE' | 'ASSIGNED'>('ACTIVE');

  // Filters for HISTORY (История заявок)
  const [historySearch, setHistorySearch] = useState<string>('');
  const [historyFilter, setHistoryFilter] = useState<'ALL' | 'COMPLETED' | 'CANCELLED'>('ALL');

  // Profile & Overlays states
  const [shiftStatus, setShiftStatus] = useState<'ON_SHIFT' | 'ON_BREAK' | 'SHIFT_ENDED'>('SHIFT_ENDED');
  const [showQrShiftModal, setShowQrShiftModal] = useState<boolean>(false);
  const [showChats, setShowChats] = useState<boolean>(false);
  const [showNotifications, setShowNotifications] = useState<boolean>(false);
  const [showSettings, setShowSettings] = useState<boolean>(false);
  const [showReportsOverlay, setShowReportsOverlay] = useState<boolean>(false);
  const [showShiftHistoryModal, setShowShiftHistoryModal] = useState<boolean>(false);
  const [showPersonalDataModal, setShowPersonalDataModal] = useState<boolean>(false);
  const [showChangePasswordModal, setShowChangePasswordModal] = useState<boolean>(false);
  const [showSupportModal, setShowSupportModal] = useState<boolean>(false);

  // Settings toggles
  const [pushNotifications, setPushNotifications] = useState<boolean>(true);
  const [soundOnNewTask, setSoundOnNewTask] = useState<boolean>(false);
  const [lastSyncTime, setLastSyncTime] = useState<string>('12:40');

  // Chats state
  const [chatSearchQuery, setChatSearchQuery] = useState<string>('');
  const [activeChatContactId, setActiveChatContactId] = useState<string | null>(null);
  const [typedMessage, setTypedMessage] = useState<string>('');

  const [serviceChatContacts, setServiceChatContacts] = useState([
    {
      id: 'sc-reception',
      nameRu: 'Ресепшн · Консьерж',
      nameEn: 'Reception · Concierge',
      initials: 'РК',
      tagRu: 'диспетчер услуг',
      tagEn: 'service desk',
      isPinned: true,
      unreadCount: 2,
      time: '12:55',
      lastMsgRu: 'Гость из № 302 уже спустился в SPA-зону, ожидает массаж.',
      lastMsgEn: 'Guest from #302 is already at the SPA zone waiting for massage.'
    },
    {
      id: 'sc-supervisor',
      nameRu: 'Светлана Ким',
      nameEn: 'Svetlana Kim',
      initials: 'СК',
      tagRu: 'супервайзер',
      tagEn: 'supervisor',
      isPinned: true,
      unreadCount: 1,
      time: '12:15',
      lastMsgRu: 'Алина, проверь готовность VIP-трансфера для № 401 к 14:00.',
      lastMsgEn: 'Alina, please check VIP transfer readiness for #401 by 14:00.'
    },
    {
      id: 'sc-spa',
      nameRu: 'SPA & Wellness смена',
      nameEn: 'SPA & Wellness Shift',
      initials: 'SP',
      tagRu: 'группа',
      tagEn: 'group',
      isPinned: false,
      unreadCount: 0,
      time: '11:30',
      lastMsgRu: 'Марат: хамам прогрет, масла и полотенца пополнены.',
      lastMsgEn: 'Marat: hammam is heated, oils and towels restocked.'
    },
    {
      id: 'sc-laundry',
      nameRu: 'Прачечная и химчистка',
      nameEn: 'Laundry & Dry Cleaning',
      initials: 'ПХ',
      tagRu: 'отдел',
      tagEn: 'department',
      isPinned: false,
      unreadCount: 0,
      time: '10:50',
      lastMsgRu: 'Заказ для № 102 (экспресс) будет готов к выдаче в 16:15.',
      lastMsgEn: 'Express order for #102 will be ready for pickup at 16:15.'
    }
  ]);

  const [serviceChatMessages, setServiceChatMessages] = useState<Record<string, Array<{ sender: 'SENDER' | 'RECEIVER'; text: string; time: string }>>>({
    'sc-reception': [
      { sender: 'RECEIVER', text: 'Добрый день! Новая срочная заявка SR-1048: № 302 Массаж спины 40 мин.', time: '12:50' },
      { sender: 'RECEIVER', text: 'Гость из № 302 уже спустился в SPA-зону, ожидает массаж.', time: '12:55' }
    ],
    'sc-supervisor': [
      { sender: 'RECEIVER', text: 'Алина, проверь готовность VIP-трансфера для № 401 к 14:00.', time: '12:15' },
      { sender: 'SENDER', text: 'Принято, водитель уже подтвердил подачу к 13:50.', time: '12:17' }
    ],
    'sc-spa': [
      { sender: 'RECEIVER', text: 'Марат: хамам прогрет, масла и полотенца пополнены.', time: '11:30' }
    ],
    'sc-laundry': [
      { sender: 'RECEIVER', text: 'Заказ для № 102 (экспресс) будет готов к выдаче в 16:15.', time: '10:50' }
    ]
  });

  // Notifications state
  const [notifFilter, setNotifFilter] = useState<'ALL' | 'URGENT' | 'NEW_SERVICE' | 'SHIFT'>('ALL');
  const [serviceNotifications, setServiceNotifications] = useState([
    {
      id: 'sn-1',
      category: 'URGENT',
      period: 'TODAY',
      titleRu: 'Заявка № 302 просрочена на 24 мин',
      titleEn: 'Request #302 overdue by 24 min',
      subRu: 'Массаж спины 40 мин · дедлайн 13:00',
      subEn: 'Back Massage 40 min · deadline 13:00',
      isUnread: true,
      isAlert: true,
      icon: 'TIMER'
    },
    {
      id: 'sn-2',
      category: 'NEW_SERVICE',
      period: 'TODAY',
      titleRu: 'Новая заявка: № 401 Трансфер в аэропорт',
      titleEn: 'New request: #401 Airport Transfer',
      subRu: 'Назначена вам · подача к 14:00',
      subEn: 'Assigned to you · pickup at 14:00',
      isUnread: true,
      isAlert: false,
      icon: 'SERVICE'
    },
    {
      id: 'sn-3',
      category: 'NEW_SERVICE',
      period: 'TODAY',
      titleRu: 'Оплата подтверждена · SR-1050 (№ 102)',
      titleEn: 'Payment confirmed · SR-1050 (#102)',
      subRu: 'Прачечная (экспресс) · 9 000 ₸',
      subEn: 'Laundry (Express) · 9,000 ₸',
      isUnread: true,
      isAlert: false,
      icon: 'CHECK'
    },
    {
      id: 'sn-4',
      category: 'SHIFT',
      period: 'TODAY',
      titleRu: 'Сообщение от супервайзера',
      titleEn: 'Message from supervisor',
      subRu: 'Светлана Ким · 12:15',
      subEn: 'Svetlana Kim · 12:15',
      isUnread: true,
      isAlert: false,
      icon: 'CHAT'
    },
    {
      id: 'sn-5',
      category: 'NEW_SERVICE',
      period: 'YESTERDAY',
      titleRu: 'Заявка SR-1028 успешно закрыта',
      titleEn: 'Request SR-1028 completed',
      subRu: '№ 402 · Room Service · оценка 5.0',
      subEn: '#402 · Room Service · rating 5.0',
      isUnread: false,
      isAlert: false,
      icon: 'CHECK'
    },
    {
      id: 'sn-6',
      category: 'SHIFT',
      period: 'YESTERDAY',
      titleRu: 'Смена SH-4091 завершена',
      titleEn: 'Shift SH-4091 completed',
      subRu: '11 услуг выполнено · 17:00',
      subEn: '11 services completed · 17:00',
      isUnread: false,
      isAlert: false,
      icon: 'CLOCK'
    }
  ]);

  // Reset sub-screens when changing bottom nav tab
  useEffect(() => {
    setSelectedRequestId(null);
    setShowChats(false);
    setShowNotifications(false);
    setShowSettings(false);
    setShowReportsOverlay(false);
    setActiveChatContactId(null);
  }, [activeTab]);

  const totalUnreadChats = serviceChatContacts.reduce((acc, c) => acc + c.unreadCount, 0);
  const unreadNotifsCount = serviceNotifications.filter(n => n.isUnread).length;

  // Active requests (NEW or IN_PROGRESS)
  const activeRequests = requests.filter(r => r.status === 'NEW' || r.status === 'IN_PROGRESS');
  const newCount = activeRequests.filter(r => r.status === 'NEW').length;
  const inProgressCount = activeRequests.filter(r => r.status === 'IN_PROGRESS').length;
  const overdueCount = activeRequests.filter(r => r.isOverdue).length;
  const urgentCount = activeRequests.filter(r => r.isUrgent).length;

  // Handlers for updating request status
  const handleAcceptRequest = (reqId: string) => {
    setRequests(prev =>
      prev.map(r =>
        r.id === reqId
          ? {
              ...r,
              status: 'IN_PROGRESS',
              assigneeRu: cleanerProfile.fullNameRu || 'Алина Садыкова',
              assigneeEn: cleanerProfile.fullName || 'Alina Sadykova',
              isAssignedToMe: true,
            }
          : r
      )
    );
  };

  const handleCompleteRequest = (reqId: string) => {
    const nowStr = new Date().toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
    setRequests(prev =>
      prev.map(r =>
        r.id === reqId
          ? {
              ...r,
              status: 'COMPLETED',
              isOverdue: false,
              completedTime: nowStr,
              assigneeRu: cleanerProfile.fullNameRu || 'Алина Садыкова',
              assigneeEn: cleanerProfile.fullName || 'Alina Sadykova',
              isAssignedToMe: true,
            }
          : r
      )
    );
    setSelectedRequestId(null);
  };

  const handleCancelRequest = (reqId: string) => {
    const nowStr = new Date().toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
    setRequests(prev =>
      prev.map(r =>
        r.id === reqId
          ? {
              ...r,
              status: 'CANCELLED',
              isOverdue: false,
              completedTime: nowStr,
            }
          : r
      )
    );
    setSelectedRequestId(null);
  };

  const handleReopenRequest = (reqId: string) => {
    setRequests(prev =>
      prev.map(r =>
        r.id === reqId
          ? {
              ...r,
              status: 'IN_PROGRESS',
              assigneeRu: cleanerProfile.fullNameRu || 'Алина Садыкова',
              assigneeEn: cleanerProfile.fullName || 'Alina Sadykova',
              isAssignedToMe: true,
            }
          : r
      )
    );
  };

  // ============================================================================
  // DETAIL SCREEN: КАРТОЧКА ЗАЯВКИ (< Заявка SR-1048)
  // ============================================================================
  const selectedRequest = requests.find(r => r.id === selectedRequestId) || null;

  if (selectedRequest) {
    const isOverdue = selectedRequest.isOverdue && (selectedRequest.status === 'NEW' || selectedRequest.status === 'IN_PROGRESS');
    const borderClass = isOverdue
      ? 'border-l-[3px] border-l-[#B3261E]'
      : selectedRequest.status === 'IN_PROGRESS'
      ? 'border-l-[3px] border-l-[#C2410C]'
      : selectedRequest.status === 'COMPLETED'
      ? 'border-l-[3px] border-l-[#5B8C6E]'
      : 'border-l-[3px] border-l-[#8A8177]';

    const statusText =
      selectedRequest.status === 'NEW'
        ? lang === 'RU' ? 'Новая' : 'New'
        : selectedRequest.status === 'IN_PROGRESS'
        ? lang === 'RU' ? 'В работе' : 'In Progress'
        : selectedRequest.status === 'COMPLETED'
        ? lang === 'RU' ? 'Выполнена' : 'Completed'
        : lang === 'RU' ? 'Отменена' : 'Cancelled';

    return (
      <div className="flex-1 flex flex-col min-h-0 bg-[#FAF7F3] font-sans select-none animate-in slide-in-from-right duration-200">
        {/* Scrollable area */}
        <div className="flex-1 overflow-y-auto no-scrollbar px-5 pt-4 pb-6 space-y-4">
          {/* Header */}
          <div className="space-y-1">
            <div className="flex items-center gap-2 -ml-1">
              <button
                type="button"
                onClick={() => setSelectedRequestId(null)}
                className="flex items-center justify-center text-[#241E1A] hover:opacity-75 transition-opacity cursor-pointer"
              >
                <ChevronLeft className="h-6 w-6" />
              </button>
              <h1 className="font-serif font-medium text-2xl text-[#241E1A] leading-tight">
                {lang === 'RU' ? `Заявка ${selectedRequest.code}` : `Request ${selectedRequest.code}`}
              </h1>
            </div>
            <p className="text-xs font-sans font-normal text-[#8A8177]">
              {lang === 'RU'
                ? `Услуги отеля · ${selectedRequest.dateRu}`
                : `Hotel Services · ${selectedRequest.dateEn}`}
            </p>
          </div>

          {/* Main Details Card */}
          <div className={`bg-white rounded-[18px] border border-[#E5E2DD] shadow-2xs overflow-hidden divide-y divide-[#E5E2DD]/60 ${borderClass}`}>
            {/* Top Summary Block */}
            <div className="p-4.5 space-y-1.5">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="text-xl font-sans font-semibold text-[#241E1A]">
                    № {selectedRequest.roomNumber}
                  </span>
                  {selectedRequest.isUrgent && (
                    <span className="px-2.5 py-0.5 rounded-md bg-[#FBEAE9] text-[#B3261E] text-[10px] font-sans font-semibold uppercase tracking-wide">
                      {lang === 'RU' ? 'СРОЧНО' : 'URGENT'}
                    </span>
                  )}
                </div>

                {isOverdue ? (
                  <span className="text-xs font-sans font-medium text-[#B3261E]">
                    {lang === 'RU'
                      ? selectedRequest.overdueDetailRu || `до ${selectedRequest.deadline} · +24 мин`
                      : selectedRequest.overdueDetailEn || `due ${selectedRequest.deadline} · +24 min`}
                  </span>
                ) : selectedRequest.status === 'COMPLETED' ? (
                  <span className="text-xs font-sans font-medium text-[#5B8C6E]">
                    {selectedRequest.completedTime || selectedRequest.deadline} · {lang === 'RU' ? 'выполнена' : 'completed'}
                  </span>
                ) : selectedRequest.status === 'CANCELLED' ? (
                  <span className="text-xs font-sans font-normal text-[#8A8177]">
                    {selectedRequest.completedTime || selectedRequest.deadline} · {lang === 'RU' ? 'отменена' : 'cancelled'}
                  </span>
                ) : (
                  <span className="text-xs font-sans font-normal text-[#8A8177]">
                    {lang === 'RU' ? `до ${selectedRequest.deadline}` : `due ${selectedRequest.deadline}`}
                  </span>
                )}
              </div>

              <h2 className="text-sm font-sans font-medium text-[#241E1A]">
                {lang === 'RU' ? selectedRequest.titleRu : selectedRequest.titleEn}
              </h2>
              <p className="text-xs font-sans font-normal text-[#8A8177]">
                {lang === 'RU' ? selectedRequest.guestNameRu : selectedRequest.guestNameEn}
              </p>
            </div>

            {/* Key-Value Rows */}
            <div className="px-4.5 py-3.5 flex items-center justify-between text-xs">
              <span className="text-[#8A8177]">{lang === 'RU' ? 'Запись' : 'Time Slot'}</span>
              <span className="text-[#241E1A] font-normal">{selectedRequest.timeSlot}</span>
            </div>

            <div className="px-4.5 py-3.5 flex items-center justify-between text-xs">
              <span className="text-[#8A8177]">{lang === 'RU' ? 'Стоимость' : 'Price'}</span>
              <span className="text-[#241E1A] font-normal">{selectedRequest.price}</span>
            </div>

            <div className="px-4.5 py-3.5 flex items-center justify-between text-xs">
              <span className="text-[#8A8177]">{lang === 'RU' ? 'Статус оплаты' : 'Payment Status'}</span>
              <span className="text-[#241E1A] font-normal">
                {lang === 'RU' ? selectedRequest.paymentStatusRu : selectedRequest.paymentStatusEn}
              </span>
            </div>

            <div className="px-4.5 py-3.5 flex items-center justify-between text-xs">
              <span className="text-[#8A8177]">{lang === 'RU' ? 'Статус' : 'Status'}</span>
              <span className="text-[#241E1A] font-normal">{statusText}</span>
            </div>

            <div className="px-4.5 py-3.5 flex items-center justify-between text-xs">
              <span className="text-[#8A8177]">{lang === 'RU' ? 'Исполнитель' : 'Assignee'}</span>
              <span className="text-[#241E1A] font-normal">
                {lang === 'RU' ? selectedRequest.assigneeRu : selectedRequest.assigneeEn}
              </span>
            </div>
          </div>

          {/* Description Section */}
          <div className="space-y-2 pt-1">
            <h3 className="text-[10px] font-sans font-normal tracking-widest uppercase text-[#8A8177] px-1">
              {lang === 'RU' ? 'ОПИСАНИЕ' : 'DESCRIPTION'}
            </h3>
            <div className="bg-white rounded-[16px] border border-[#E5E2DD] p-4 shadow-2xs">
              <p className="text-xs font-sans font-normal text-[#241E1A] leading-relaxed">
                {lang === 'RU' ? selectedRequest.descriptionRu : selectedRequest.descriptionEn}
              </p>
            </div>
          </div>
        </div>

        {/* Sticky Bottom Action Bar */}
        <div className="px-5 py-3.5 bg-[#FAF7F3] border-t border-[#E5E2DD]/80 shrink-0 space-y-2">
          {selectedRequest.status === 'NEW' && (
            <button
              type="button"
              onClick={() => handleAcceptRequest(selectedRequest.id)}
              className="w-full bg-[#C2410C] hover:bg-[#A93A0C] text-white py-3.5 rounded-xl font-sans font-medium text-xs cursor-pointer text-center active:scale-[0.98] transition-all shadow-xs"
            >
              {lang === 'RU' ? 'Принять заявку' : 'Accept Request'}
            </button>
          )}

          {selectedRequest.status === 'IN_PROGRESS' && (
            <div className="space-y-2">
              <button
                type="button"
                onClick={() => handleCompleteRequest(selectedRequest.id)}
                className="w-full bg-[#C2410C] hover:bg-[#A93A0C] text-white py-3.5 rounded-xl font-sans font-medium text-xs cursor-pointer text-center active:scale-[0.98] transition-all shadow-xs"
              >
                {lang === 'RU' ? 'Завершить заявку' : 'Complete Request'}
              </button>
              <button
                type="button"
                onClick={() => handleCancelRequest(selectedRequest.id)}
                className="w-full bg-white hover:bg-slate-50 text-[#8A8177] hover:text-[#B3261E] border border-[#E5E2DD] py-2.5 rounded-xl font-sans font-normal text-xs cursor-pointer text-center transition-all"
              >
                {lang === 'RU' ? 'Отменить заявку' : 'Cancel Request'}
              </button>
            </div>
          )}

          {(selectedRequest.status === 'COMPLETED' || selectedRequest.status === 'CANCELLED') && (
            <button
              type="button"
              onClick={() => handleReopenRequest(selectedRequest.id)}
              className="w-full bg-white hover:bg-slate-50 text-[#241E1A] border border-[#E5E2DD] py-3.5 rounded-xl font-sans font-normal text-xs cursor-pointer text-center active:scale-[0.98] transition-all"
            >
              {lang === 'RU' ? 'Вернуть в работу' : 'Reopen Request'}
            </button>
          )}
        </div>
      </div>
    );
  }

  // ============================================================================
  // MAIN TABS CONTENT
  // ============================================================================
  return (
    <div className="flex-1 flex flex-col min-h-0 bg-[#FAF7F3] relative font-sans select-none">

      {/* ========================================================================= */}
      {/* -------------------- TAB 1: ГЛАВНАЯ (SERVICES_HOME) -------------------- */}
      {/* ========================================================================= */}
      {activeTab === 'SERVICES_HOME' && (() => {
        const filteredHome = activeRequests.filter(req => {
          // Status pill filter
          if (homeStatusFilter === 'NEW' && req.status !== 'NEW') return false;
          if (homeStatusFilter === 'IN_PROGRESS' && req.status !== 'IN_PROGRESS') return false;
          if (homeStatusFilter === 'URGENT' && !req.isUrgent) return false;

          // Category dropdown filter
          if (homeCategoryFilter !== 'ALL' && req.category !== homeCategoryFilter) return false;

          // Staff dropdown filter
          if (homeStaffFilter === 'ME' && !req.isAssignedToMe) return false;
          if (homeStaffFilter === 'UNASSIGNED' && req.assigneeRu !== 'Не назначен') return false;
          if (homeStaffFilter === 'MARAT' && req.assigneeRu !== 'Марат Оспанов') return false;

          // Search query
          if (homeSearch.trim()) {
            const q = homeSearch.toLowerCase().trim();
            const matchRoom = req.roomNumber.toLowerCase().includes(q);
            const matchTitle = req.titleRu.toLowerCase().includes(q) || req.titleEn.toLowerCase().includes(q);
            const matchGuest = req.guestNameRu.toLowerCase().includes(q) || req.guestNameEn.toLowerCase().includes(q);
            const matchCode = req.code.toLowerCase().includes(q);
            return matchRoom || matchTitle || matchGuest || matchCode;
          }
          return true;
        });

        const overdueItems = filteredHome.filter(r => r.isOverdue);
        const todayItems = filteredHome.filter(r => !r.isOverdue);

        return (
          <div className="flex-1 overflow-y-auto no-scrollbar px-5 pt-3 pb-6 space-y-3.5">
            {/* Greeting & Title */}
            <div className="space-y-1">
              <p className="text-[10px] font-sans font-normal tracking-[0.1em] text-[#8A8177] uppercase">
                {lang === 'RU' ? 'ПРИВЕТ, АЛИНА' : 'HELLO, ALINA'}
              </p>
              <h1 className="font-serif font-medium text-2xl text-[#241E1A] leading-tight">
                {lang === 'RU' ? 'Услуги отеля' : 'Hotel Services'}
              </h1>
              <p className="text-xs font-sans text-[#8A8177]">
                <span className="font-semibold text-[#241E1A]">{newCount}</span> {lang === 'RU' ? 'новых' : 'new'}
                {' · '}
                <span className="font-semibold text-[#241E1A]">{inProgressCount}</span> {lang === 'RU' ? 'в работе' : 'in progress'}
                {' · '}
                <span className="text-[#B3261E] font-normal">
                  {overdueCount} {lang === 'RU' ? 'просрочена' : 'overdue'}
                </span>
              </p>
            </div>

            {/* Search Input */}
            <div className="bg-white rounded-2xl border border-[#E5E2DD] px-3.5 py-2.5 flex items-center gap-2.5 shadow-2xs">
              <Search className="h-4 w-4 text-[#8A8177] shrink-0" />
              <input
                type="text"
                value={homeSearch}
                onChange={(e) => setHomeSearch(e.target.value)}
                placeholder={lang === 'RU' ? 'Поиск по номеру или услуге' : 'Search by room or service'}
                className="w-full bg-transparent text-xs text-[#241E1A] placeholder-[#8A8177] focus:outline-none font-sans font-normal"
              />
            </div>

            {/* Status Filter Pills */}
            <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-0.5">
              {[
                { id: 'ALL' as const, label: lang === 'RU' ? 'Все' : 'All', count: activeRequests.length },
                { id: 'NEW' as const, label: lang === 'RU' ? 'Новые' : 'New', count: newCount },
                { id: 'IN_PROGRESS' as const, label: lang === 'RU' ? 'В работе' : 'In Progress', count: inProgressCount },
                { id: 'URGENT' as const, label: lang === 'RU' ? 'Срочные' : 'Urgent', count: urgentCount },
              ].map(tab => {
                const isSelected = homeStatusFilter === tab.id;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setHomeStatusFilter(tab.id)}
                    className={`px-3.5 py-1.5 rounded-full text-xs font-sans whitespace-nowrap transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-[#241E1A] text-white font-medium shadow-xs'
                        : 'bg-white border border-[#E5E2DD] text-[#8A8177] hover:text-[#241E1A] font-normal'
                    }`}
                  >
                    <span>{tab.label}</span>{' '}
                    <span className={isSelected ? 'text-white/75 font-normal' : 'text-[#8A8177]'}>{tab.count}</span>
                  </button>
                );
              })}
            </div>

            {/* 2 Dropdowns: Category & Staff */}
            <div className="grid grid-cols-2 gap-2">
              <div className="relative">
                <select
                  value={homeCategoryFilter}
                  onChange={(e) => setHomeCategoryFilter(e.target.value)}
                  className="w-full appearance-none bg-white border border-[#E5E2DD] rounded-xl pl-3.5 pr-8 py-2.5 text-xs font-sans text-[#241E1A] focus:outline-none shadow-2xs cursor-pointer"
                >
                  <option value="ALL">{lang === 'RU' ? 'Все услуги' : 'All Services'}</option>
                  <option value="SPA">{lang === 'RU' ? 'SPA и массаж' : 'SPA & Massage'}</option>
                  <option value="ROOM_SERVICE">Room Service</option>
                  <option value="LAUNDRY">{lang === 'RU' ? 'Прачечная' : 'Laundry'}</option>
                  <option value="BAR">{lang === 'RU' ? 'Бар' : 'Bar'}</option>
                  <option value="TRANSFER">{lang === 'RU' ? 'Трансфер' : 'Transfer'}</option>
                  <option value="CONCIERGE">{lang === 'RU' ? 'Консьерж' : 'Concierge'}</option>
                </select>
                <ChevronDown className="h-4 w-4 text-[#241E1A] absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>

              <div className="relative">
                <select
                  value={homeStaffFilter}
                  onChange={(e) => setHomeStaffFilter(e.target.value)}
                  className="w-full appearance-none bg-white border border-[#E5E2DD] rounded-xl pl-3.5 pr-8 py-2.5 text-xs font-sans text-[#241E1A] focus:outline-none shadow-2xs cursor-pointer"
                >
                  <option value="ALL">{lang === 'RU' ? 'Все сотрудники' : 'All Staff'}</option>
                  <option value="ME">{lang === 'RU' ? 'Алина Садыкова' : 'Alina Sadykova'}</option>
                  <option value="MARAT">{lang === 'RU' ? 'Марат Оспанов' : 'Marat Ospanov'}</option>
                  <option value="UNASSIGNED">{lang === 'RU' ? 'Не назначен' : 'Unassigned'}</option>
                </select>
                <ChevronDown className="h-4 w-4 text-[#241E1A] absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            </div>

            {/* OVERDUE SECTION (ПРОСРОЧЕНО) */}
            {overdueItems.length > 0 && (
              <div className="space-y-2 pt-1">
                <h3 className="text-[10px] font-sans font-normal tracking-[0.08em] text-[#8A8177] uppercase px-1">
                  {lang === 'RU' ? 'ПРОСРОЧЕНО' : 'OVERDUE'}
                </h3>

                <div className="space-y-2.5">
                  {overdueItems.map(item => (
                    <div
                      key={item.id}
                      onClick={() => setSelectedRequestId(item.id)}
                      className="bg-white rounded-[18px] border border-[#E5E2DD] border-l-[3px] border-l-[#B3261E] p-4 shadow-2xs space-y-3.5 cursor-pointer hover:bg-slate-50/40 transition-colors"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <span className="text-lg font-sans font-semibold text-[#241E1A]">
                              № {item.roomNumber}
                            </span>
                            {item.isUrgent && (
                              <span className="px-2 py-0.5 rounded-md bg-[#FBEAE9] text-[#B3261E] text-[10px] font-sans font-medium uppercase">
                                {lang === 'RU' ? 'СРОЧНО' : 'URGENT'}
                              </span>
                            )}
                          </div>
                          <span className="text-xs font-sans font-medium text-[#B3261E]">
                            {lang === 'RU' ? item.overdueTextRu || `${item.deadline} · +24 мин` : item.overdueTextEn || `${item.deadline} · +24 min`}
                          </span>
                        </div>
                        <p className="text-xs font-sans font-normal text-[#8A8177]">
                          {lang === 'RU' ? item.titleRu : item.titleEn}
                        </p>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedRequestId(item.id);
                          }}
                          className="flex-1 bg-[#C2410C] hover:bg-[#A93A0C] text-white py-3 rounded-xl text-xs font-sans font-medium text-center cursor-pointer transition-colors"
                        >
                          {lang === 'RU' ? 'Открыть заявку' : 'Open Request'}
                        </button>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedRequestId(item.id);
                          }}
                          className="h-10 w-10 rounded-xl border border-[#E5E2DD] bg-white flex items-center justify-center text-[#8A8177] hover:text-[#241E1A] shrink-0 cursor-pointer"
                        >
                          <ChevronRight className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* TODAY SECTION (СЕГОДНЯ) */}
            {todayItems.length > 0 && (
              <div className="space-y-2 pt-1">
                <h3 className="text-[10px] font-sans font-normal tracking-[0.08em] text-[#8A8177] uppercase px-1">
                  {lang === 'RU' ? 'СЕГОДНЯ' : 'TODAY'}
                </h3>

                <div className="space-y-2.5">
                  {todayItems.map(item => (
                    <div
                      key={item.id}
                      onClick={() => setSelectedRequestId(item.id)}
                      className={`bg-white rounded-[18px] border border-[#E5E2DD] p-4 shadow-2xs space-y-3.5 cursor-pointer hover:bg-slate-50/40 transition-colors ${
                        item.status === 'IN_PROGRESS'
                          ? 'border-l-[3px] border-l-[#C2410C]'
                          : 'border-l-[3px] border-l-[#D97706]/60'
                      }`}
                    >
                      <div className="space-y-1">
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <span className="text-lg font-sans font-semibold text-[#241E1A]">
                              № {item.roomNumber}
                            </span>
                            {item.isUrgent && (
                              <span className="px-2 py-0.5 rounded-md bg-[#FBEAE9] text-[#B3261E] text-[10px] font-sans font-medium uppercase">
                                {lang === 'RU' ? 'СРОЧНО' : 'URGENT'}
                              </span>
                            )}
                          </div>
                          <span className="text-xs font-sans font-normal text-[#8A8177]">
                            {item.deadline}
                          </span>
                        </div>
                        <p className="text-xs font-sans font-normal text-[#8A8177]">
                          {lang === 'RU' ? item.titleRu : item.titleEn}
                        </p>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedRequestId(item.id);
                          }}
                          className="flex-1 bg-white hover:bg-[#FAF7F3] text-[#241E1A] border border-[#E5E2DD] py-3 rounded-xl text-xs font-sans font-normal text-center cursor-pointer transition-colors"
                        >
                          {lang === 'RU' ? 'Открыть заявку' : 'Open Request'}
                        </button>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedRequestId(item.id);
                          }}
                          className="h-10 w-10 rounded-xl border border-[#E5E2DD] bg-white flex items-center justify-center text-[#8A8177] hover:text-[#241E1A] shrink-0 cursor-pointer"
                        >
                          <ChevronRight className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {overdueItems.length === 0 && todayItems.length === 0 && (
              <div className="bg-white rounded-[16px] border border-[#E5E2DD] p-8 text-center text-xs text-[#8A8177]">
                {lang === 'RU' ? 'Заявки по выбранным фильтрам не найдены' : 'No requests match the selected filters'}
              </div>
            )}
          </div>
        );
      })()}

      {/* ========================================================================= */}
      {/* ----------------- TAB 2: МОИ ЗАДАЧИ (SERVICES_TASKS) ------------------- */}
      {/* ========================================================================= */}
      {activeTab === 'SERVICES_TASKS' && (() => {
        const myActiveList = requests.filter(r => r.isAssignedToMe && r.status === 'IN_PROGRESS');
        const myAssignedList = requests.filter(r => r.isAssignedToMe && r.status === 'NEW');
        const displayedTasks = myTasksFilter === 'ACTIVE' ? myActiveList : myAssignedList;

        return (
          <div className="flex-1 overflow-y-auto no-scrollbar px-5 pt-4 pb-6 space-y-4">
            {/* Header */}
            <div className="space-y-1">
              <h1 className="font-serif font-medium text-2xl text-[#241E1A] leading-tight">
                {lang === 'RU' ? 'Мои заявки' : 'My Tasks'}
              </h1>
              <p className="text-xs font-sans text-[#8A8177]">
                <span className="font-semibold text-[#241E1A]">{myActiveList.length}</span>{' '}
                {lang === 'RU' ? 'в работе' : 'in progress'}
                {' · '}
                <span className="font-semibold text-[#241E1A]">{myAssignedList.length}</span>{' '}
                {lang === 'RU' ? 'назначена' : 'assigned'}
              </p>
            </div>

            {/* Filter Pills */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setMyTasksFilter('ACTIVE')}
                className={`px-4 py-2 rounded-full text-xs font-sans transition-all cursor-pointer ${
                  myTasksFilter === 'ACTIVE'
                    ? 'bg-[#241E1A] text-white font-medium shadow-xs'
                    : 'bg-white border border-[#E5E2DD] text-[#8A8177] hover:text-[#241E1A] font-normal'
                }`}
              >
                {lang === 'RU' ? 'Активные' : 'Active'}
              </button>
              <button
                type="button"
                onClick={() => setMyTasksFilter('ASSIGNED')}
                className={`px-4 py-2 rounded-full text-xs font-sans transition-all cursor-pointer ${
                  myTasksFilter === 'ASSIGNED'
                    ? 'bg-[#241E1A] text-white font-medium shadow-xs'
                    : 'bg-white border border-[#E5E2DD] text-[#8A8177] hover:text-[#241E1A] font-normal'
                }`}
              >
                {lang === 'RU' ? 'Назначенные' : 'Assigned'}
              </button>
            </div>

            {/* Section Label */}
            <div className="space-y-2.5 pt-1">
              <h3 className="text-[10px] font-sans font-normal tracking-[0.08em] text-[#8A8177] uppercase px-1">
                {myTasksFilter === 'ACTIVE'
                  ? lang === 'RU' ? 'В РАБОТЕ' : 'IN PROGRESS'
                  : lang === 'RU' ? 'НАЗНАЧЕННЫЕ МНЕ' : 'ASSIGNED TO ME'}
              </h3>

              {displayedTasks.length === 0 ? (
                <div className="bg-white rounded-[16px] border border-[#E5E2DD] p-8 text-center text-xs text-[#8A8177]">
                  {lang === 'RU' ? 'Нет задач в этой категории' : 'No tasks in this category'}
                </div>
              ) : (
                displayedTasks.map((task, idx) => (
                  <div
                    key={task.id}
                    onClick={() => setSelectedRequestId(task.id)}
                    className="bg-white rounded-[18px] border border-[#E5E2DD] border-l-[3px] border-l-[#C2410C] p-4 shadow-2xs space-y-3.5 cursor-pointer hover:bg-slate-50/40 transition-colors"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <span className="text-lg font-sans font-semibold text-[#241E1A]">
                            № {task.roomNumber}
                          </span>
                          {task.isUrgent && (
                            <span className="px-2 py-0.5 rounded-md bg-[#FBEAE9] text-[#B3261E] text-[10px] font-sans font-medium uppercase">
                              {lang === 'RU' ? 'СРОЧНО' : 'URGENT'}
                            </span>
                          )}
                        </div>
                        <span className="text-xs font-sans font-normal text-[#8A8177]">
                          {task.deadline}
                        </span>
                      </div>
                      <p className="text-xs font-sans font-normal text-[#8A8177]">
                        {lang === 'RU' ? task.titleRu : task.titleEn}
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedRequestId(task.id);
                        }}
                        className={`flex-1 py-3 rounded-xl text-xs font-sans text-center cursor-pointer transition-colors ${
                          idx === 0
                            ? 'bg-[#C2410C] hover:bg-[#A93A0C] text-white font-medium'
                            : 'bg-white hover:bg-[#FAF7F3] text-[#241E1A] border border-[#E5E2DD] font-normal'
                        }`}
                      >
                        {task.status === 'IN_PROGRESS'
                          ? lang === 'RU' ? 'Продолжить' : 'Continue'
                          : lang === 'RU' ? 'Открыть задачу' : 'Open Task'}
                      </button>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedRequestId(task.id);
                        }}
                        className="h-10 w-10 rounded-xl border border-[#E5E2DD] bg-white flex items-center justify-center text-[#8A8177] hover:text-[#241E1A] shrink-0 cursor-pointer"
                      >
                        <ChevronRight className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        );
      })()}

      {/* ========================================================================= */}
      {/* --------------- TAB 3: ИСТОРИЯ ЗАЯВОК (SERVICES_HISTORY) --------------- */}
      {/* ========================================================================= */}
      {activeTab === 'SERVICES_HISTORY' && (() => {
        const historyItems = requests.filter(r => {
          if (r.status !== 'COMPLETED' && r.status !== 'CANCELLED') return false;
          if (historyFilter === 'COMPLETED' && r.status !== 'COMPLETED') return false;
          if (historyFilter === 'CANCELLED' && r.status !== 'CANCELLED') return false;

          if (historySearch.trim()) {
            const q = historySearch.toLowerCase().trim();
            return (
              r.roomNumber.toLowerCase().includes(q) ||
              r.titleRu.toLowerCase().includes(q) ||
              r.titleEn.toLowerCase().includes(q) ||
              r.guestNameRu.toLowerCase().includes(q)
            );
          }
          return true;
        });

        const oct19Items = historyItems.filter(r => r.dateRu === '19 октября');
        const oct18Items = historyItems.filter(r => r.dateRu !== '19 октября');

        const renderHistoryCard = (item: ServiceRequest) => {
          const isCompleted = item.status === 'COMPLETED';
          return (
            <div
              key={item.id}
              onClick={() => setSelectedRequestId(item.id)}
              className={`bg-white rounded-[18px] border border-[#E5E2DD] p-4 shadow-2xs space-y-1.5 cursor-pointer hover:bg-slate-50/50 transition-colors ${
                isCompleted
                  ? 'border-l-[3px] border-l-[#5B8C6E]'
                  : 'border-l-[3px] border-l-[#8A8177]'
              }`}
            >
              <div className="flex items-center justify-between gap-2">
                <span className="text-lg font-sans font-semibold text-[#241E1A]">
                  № {item.roomNumber}
                </span>
                <span
                  className={`text-xs font-sans font-normal ${
                    isCompleted ? 'text-[#5B8C6E]' : 'text-[#8A8177]'
                  }`}
                >
                  {item.completedTime || item.deadline} ·{' '}
                  {isCompleted
                    ? lang === 'RU' ? 'выполнена' : 'completed'
                    : lang === 'RU' ? 'отменена' : 'cancelled'}
                </span>
              </div>
              <p className="text-xs font-sans font-normal text-[#8A8177]">
                {lang === 'RU' ? item.titleRu : item.titleEn}
              </p>
            </div>
          );
        };

        return (
          <div className="flex-1 overflow-y-auto no-scrollbar px-5 pt-4 pb-6 space-y-4">
            {/* Header */}
            <div className="space-y-1">
              <h1 className="font-serif font-medium text-2xl text-[#241E1A] leading-tight">
                {lang === 'RU' ? 'История заявок' : 'Request History'}
              </h1>
              <p className="text-xs font-sans font-normal text-[#8A8177]">
                {lang === 'RU' ? 'Выполненные и отменённые услуги' : 'Completed and cancelled services'}
              </p>
            </div>

            {/* Search */}
            <div className="bg-white rounded-2xl border border-[#E5E2DD] px-3.5 py-2.5 flex items-center gap-2.5 shadow-2xs">
              <Search className="h-4 w-4 text-[#8A8177] shrink-0" />
              <input
                type="text"
                value={historySearch}
                onChange={(e) => setHistorySearch(e.target.value)}
                placeholder={lang === 'RU' ? 'Поиск по номеру или услуге' : 'Search by room or service'}
                className="w-full bg-transparent text-xs text-[#241E1A] placeholder-[#8A8177] focus:outline-none font-sans font-normal"
              />
            </div>

            {/* Filter Pills */}
            <div className="flex items-center gap-2 overflow-x-auto no-scrollbar">
              {[
                { id: 'ALL' as const, label: lang === 'RU' ? 'Все' : 'All' },
                { id: 'COMPLETED' as const, label: lang === 'RU' ? 'Завершённые' : 'Completed' },
                { id: 'CANCELLED' as const, label: lang === 'RU' ? 'Отменённые' : 'Cancelled' },
              ].map(tab => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setHistoryFilter(tab.id)}
                  className={`px-4 py-1.5 rounded-full text-xs font-sans whitespace-nowrap transition-all cursor-pointer ${
                    historyFilter === tab.id
                      ? 'bg-[#241E1A] text-white font-medium shadow-xs'
                      : 'bg-white border border-[#E5E2DD] text-[#8A8177] hover:text-[#241E1A] font-normal'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* 19 ОКТЯБРЯ */}
            {oct19Items.length > 0 && (
              <div className="space-y-2.5 pt-1">
                <h3 className="text-[10px] font-sans font-normal tracking-[0.08em] text-[#8A8177] uppercase px-1">
                  {lang === 'RU' ? '19 ОКТЯБРЯ' : 'OCTOBER 19'}
                </h3>
                <div className="space-y-2.5">
                  {oct19Items.map(renderHistoryCard)}
                </div>
              </div>
            )}

            {/* 18 ОКТЯБРЯ */}
            {oct18Items.length > 0 && (
              <div className="space-y-2.5 pt-1">
                <h3 className="text-[10px] font-sans font-normal tracking-[0.08em] text-[#8A8177] uppercase px-1">
                  {lang === 'RU' ? '18 ОКТЯБРЯ' : 'OCTOBER 18'}
                </h3>
                <div className="space-y-2.5">
                  {oct18Items.map(renderHistoryCard)}
                </div>
              </div>
            )}

            {historyItems.length === 0 && (
              <div className="bg-white rounded-[16px] border border-[#E5E2DD] p-8 text-center text-xs text-[#8A8177]">
                {lang === 'RU' ? 'История заявок пуста' : 'No history items found'}
              </div>
            )}
          </div>
        );
      })()}

      {/* ========================================================================= */}
      {/* ------------------ TAB 4: ПРОФИЛЬ (SERVICES_PROFILE) ------------------- */}
      {/* ========================================================================= */}
      {activeTab === 'SERVICES_PROFILE' && (
        <div className="flex-1 overflow-y-auto no-scrollbar px-5 pt-4 pb-6 space-y-4">
          {/* Header with Top Action Buttons (Chats, Notifications, Settings) */}
          <div className="flex items-center justify-between">
            <h1 className="font-serif font-medium text-2xl text-[#241E1A] leading-tight">
              {lang === 'RU' ? 'Профиль' : 'Profile'}
            </h1>

            <div className="flex items-center gap-1.5">
              {/* Chats Button */}
              <button
                type="button"
                onClick={() => setShowChats(true)}
                className="h-10 w-10 bg-white rounded-xl border border-[#E5E2DD] flex items-center justify-center text-[#241E1A] hover:bg-slate-50 transition-colors shadow-2xs relative cursor-pointer"
              >
                <MessageSquare className="h-4 w-4 text-[#241E1A]" />
                {totalUnreadChats > 0 && (
                  <span className="absolute -top-1 -right-1 bg-[#C2410C] text-white text-[9px] font-sans font-bold rounded-full h-4 w-4 flex items-center justify-center shadow-xs">
                    {totalUnreadChats}
                  </span>
                )}
              </button>

              {/* Notifications Button */}
              <button
                type="button"
                onClick={() => setShowNotifications(true)}
                className="h-10 w-10 bg-white rounded-xl border border-[#E5E2DD] flex items-center justify-center text-[#241E1A] hover:bg-slate-50 transition-colors shadow-2xs relative cursor-pointer"
              >
                <Bell className="h-4 w-4 text-[#241E1A]" />
                {unreadNotifsCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-[#C2410C] text-white text-[9px] font-sans font-bold rounded-full h-4 w-4 flex items-center justify-center shadow-xs">
                    {unreadNotifsCount}
                  </span>
                )}
              </button>

              {/* Settings Button */}
              <button
                type="button"
                onClick={() => setShowSettings(true)}
                className="h-10 w-10 bg-white rounded-xl border border-[#E5E2DD] flex items-center justify-center text-[#241E1A] hover:bg-slate-50 transition-colors shadow-2xs cursor-pointer"
              >
                <Settings className="h-4 w-4 text-[#241E1A]" />
              </button>
            </div>
          </div>

          {/* Employee Info Row */}
          <div className="flex items-center gap-3.5 pt-1">
            <div className="h-13 w-13 rounded-full bg-[#E5E0D8] text-[#5C544D] font-sans font-medium text-sm flex items-center justify-center shrink-0">
              {lang === 'RU' ? 'АС' : 'AS'}
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="font-serif font-medium text-xl text-[#241E1A] leading-tight truncate">
                {lang === 'RU' ? cleanerProfile.fullNameRu : cleanerProfile.fullName}
              </h2>
              <p className="text-xs font-sans font-normal text-[#8A8177] mt-0.5 truncate">
                {lang === 'RU' ? 'Работа с услугами · Служба сервиса' : 'Hotel Services · Guest Services'}
              </p>
            </div>
          </div>

          {/* Section 1: ТЕКУЩАЯ СМЕНА */}
          <div className="space-y-2 pt-1">
            <span className="text-[10px] font-sans font-normal tracking-[0.08em] text-[#8A8177] uppercase block px-1">
              {lang === 'RU' ? 'ТЕКУЩАЯ СМЕНА' : 'CURRENT SHIFT'}
            </span>

            {shiftStatus === 'SHIFT_ENDED' ? (
              <div className="bg-white rounded-[18px] border border-[#E5E2DD] p-4.5 space-y-3.5 shadow-2xs">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-sans font-medium text-[#241E1A]">
                    {lang === 'RU' ? 'Смена не начата' : 'Shift not started'}
                  </span>
                  <span className="text-xs font-sans font-normal text-[#8A8177]">
                    {lang === 'RU' ? '19 окт · 08:00–17:00' : 'Oct 19 · 08:00–17:00'}
                  </span>
                </div>
                <p className="text-xs font-sans font-normal text-[#8A8177] leading-relaxed">
                  {lang === 'RU'
                    ? 'Начните смену, отсканировав QR-код на рабочем месте.'
                    : 'Start your shift by scanning the QR code at your workplace.'}
                </p>
                <button
                  type="button"
                  onClick={() => setShowQrShiftModal(true)}
                  className="w-full bg-[#C2410C] hover:bg-[#A93A0C] text-white py-3.5 rounded-xl text-xs font-sans font-medium flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-[0.98]"
                >
                  <QrCode className="h-4 w-4" />
                  <span>{lang === 'RU' ? 'Начать смену по QR' : 'Start Shift via QR'}</span>
                </button>
              </div>
            ) : (
              <div className="bg-white rounded-[18px] border border-[#E5E2DD] p-4.5 space-y-4 shadow-2xs">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-sans font-medium text-[#241E1A]">
                    SH-4098
                  </span>
                  <span className="text-xs font-sans font-normal text-[#8A8177]">
                    {lang === 'RU' ? '19 окт · с 08:00' : 'Oct 19 · from 08:00'}
                  </span>
                </div>

                {/* Shift Status Toggle Buttons */}
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setShiftStatus('ON_SHIFT')}
                    className={`py-2 rounded-xl text-xs font-sans transition-all cursor-pointer text-center ${
                      shiftStatus === 'ON_SHIFT'
                        ? 'bg-[#241E1A] text-white font-medium shadow-xs'
                        : 'bg-white border border-[#E5E2DD] text-[#8A8177] hover:text-[#241E1A] font-normal'
                    }`}
                  >
                    {lang === 'RU' ? 'На смене' : 'On Shift'}
                  </button>

                  <button
                    type="button"
                    onClick={() => setShiftStatus('ON_BREAK')}
                    className={`py-2 rounded-xl text-xs font-sans transition-all cursor-pointer text-center ${
                      shiftStatus === 'ON_BREAK'
                        ? 'bg-[#241E1A] text-white font-medium shadow-xs'
                        : 'bg-white border border-[#E5E2DD] text-[#8A8177] hover:text-[#241E1A] font-normal'
                    }`}
                  >
                    {lang === 'RU' ? 'Перерыв' : 'Break'}
                  </button>

                  <button
                    type="button"
                    onClick={() => setShiftStatus('SHIFT_ENDED')}
                    className="py-2 rounded-xl text-xs font-sans bg-white border border-[#E5E2DD] text-[#8A8177] hover:text-[#241E1A] font-normal transition-all cursor-pointer text-center"
                  >
                    {lang === 'RU' ? 'Завершить' : 'End'}
                  </button>
                </div>

                {/* 3 Shift Metrics */}
                <div className="grid grid-cols-3 divide-x divide-[#E5E2DD]/50 pt-2 border-t border-[#E5E2DD]/50 text-center">
                  <div className="px-1">
                    <div className="text-base font-sans">
                      <span className="font-medium text-[#241E1A]">
                        {requests.filter(r => r.status === 'COMPLETED').length + 6}
                      </span>
                      <span className="text-xs font-normal text-[#8A8177]"> / 12</span>
                    </div>
                    <p className="text-[10px] font-sans font-normal text-[#8A8177] mt-0.5">
                      {lang === 'RU' ? 'выполнено' : 'completed'}
                    </p>
                  </div>

                  <div className="px-1">
                    <div className="text-base font-sans">
                      <span className="font-medium text-[#241E1A]">18</span>
                      <span className="text-xs font-normal text-[#8A8177]"> {lang === 'RU' ? 'мин' : 'min'}</span>
                    </div>
                    <p className="text-[10px] font-sans font-normal text-[#8A8177] mt-0.5">
                      {lang === 'RU' ? 'на услугу' : 'per service'}
                    </p>
                  </div>

                  <div className="px-1">
                    <div className="text-base font-sans">
                      <span className="font-medium text-[#241E1A]">5:44</span>
                    </div>
                    <p className="text-[10px] font-sans font-normal text-[#8A8177] mt-0.5">
                      {lang === 'RU' ? 'на смене' : 'on shift'}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Section 2: РАБОТА */}
          <div className="space-y-2 pt-1">
            <span className="text-[10px] font-sans font-normal tracking-[0.08em] text-[#8A8177] uppercase block px-1">
              {lang === 'RU' ? 'РАБОТА' : 'WORK'}
            </span>

            <div className="bg-white rounded-[18px] border border-[#E5E2DD] divide-y divide-[#E5E2DD]/50 shadow-2xs overflow-hidden">
              <div
                onClick={() => onNavigateTab('SERVICES_TASKS')}
                className="p-4 flex items-center justify-between hover:bg-slate-50/70 transition-colors cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <ListTodo className="h-4 w-4 text-[#8A8177]" />
                  <span className="text-xs font-sans font-normal text-[#241E1A]">
                    {lang === 'RU' ? 'Мои заявки' : 'My Tasks'}
                  </span>
                </div>
                <ChevronRight className="h-4 w-4 text-[#8A8177]" />
              </div>

              <div
                onClick={() => setShowReportsOverlay(true)}
                className="p-4 flex items-center justify-between hover:bg-slate-50/70 transition-colors cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <BarChart3 className="h-4 w-4 text-[#8A8177]" />
                  <span className="text-xs font-sans font-normal text-[#241E1A]">
                    {lang === 'RU' ? 'Мои отчёты' : 'My Reports'}
                  </span>
                </div>
                <ChevronRight className="h-4 w-4 text-[#8A8177]" />
              </div>

              <div
                onClick={() => setShowShiftHistoryModal(true)}
                className="p-4 flex items-center justify-between hover:bg-slate-50/70 transition-colors cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <RotateCcw className="h-4 w-4 text-[#8A8177]" />
                  <span className="text-xs font-sans font-normal text-[#241E1A]">
                    {lang === 'RU' ? 'История смен' : 'Shift History'}
                  </span>
                </div>
                <ChevronRight className="h-4 w-4 text-[#8A8177]" />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* -------------------- OVERLAY: МОИ ОТЧЁТЫ (REPORTS) ---------------------- */}
      {/* ========================================================================= */}
      {showReportsOverlay && (
        <div className="absolute inset-0 bg-[#FAF7F3] z-50 flex flex-col min-h-0 font-sans animate-in slide-in-from-right duration-200">
          <div className="flex-1 overflow-y-auto no-scrollbar p-5 space-y-4">
            <div className="flex items-center gap-2 -ml-1">
              <button
                type="button"
                onClick={() => setShowReportsOverlay(false)}
                className="flex items-center justify-center text-[#241E1A] hover:opacity-75 transition-opacity cursor-pointer"
              >
                <ChevronLeft className="h-6 w-6" />
              </button>
              <div>
                <h1 className="font-serif font-medium text-2xl text-[#241E1A] leading-tight">
                  {lang === 'RU' ? 'Мои отчёты' : 'My Reports'}
                </h1>
                <p className="text-xs font-sans text-[#8A8177]">
                  {lang === 'RU' ? 'Статистика выполнения платных услуг' : 'Paid services performance'}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              <div className="bg-white rounded-[16px] border border-[#E5E2DD] p-4 shadow-2xs">
                <span className="text-[10px] text-[#8A8177] uppercase tracking-wider block">
                  {lang === 'RU' ? 'ЗА СЕГОДНЯ' : 'TODAY'}
                </span>
                <div className="text-2xl font-serif font-medium text-[#241E1A] mt-1">9</div>
                <span className="text-xs text-[#5B8C6E] font-normal">
                  {lang === 'RU' ? 'услуг выполнено' : 'services completed'}
                </span>
              </div>
              <div className="bg-white rounded-[16px] border border-[#E5E2DD] p-4 shadow-2xs">
                <span className="text-[10px] text-[#8A8177] uppercase tracking-wider block">
                  {lang === 'RU' ? 'СУММА УСЛУГ' : 'REVENUE'}
                </span>
                <div className="text-2xl font-serif font-medium text-[#241E1A] mt-1">146 500 ₸</div>
                <span className="text-xs text-[#8A8177] font-normal">
                  {lang === 'RU' ? 'средний чек 16 200 ₸' : 'avg check 16,200 ₸'}
                </span>
              </div>
            </div>

            <div className="bg-white rounded-[18px] border border-[#E5E2DD] p-4 shadow-2xs space-y-3">
              <h3 className="text-xs font-sans font-medium text-[#241E1A]">
                {lang === 'RU' ? 'По категориям за смену' : 'By Category This Shift'}
              </h3>
              <div className="space-y-2.5 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-[#8A8177]">{lang === 'RU' ? 'SPA и массаж' : 'SPA & Massage'}</span>
                  <span className="font-medium text-[#241E1A]">4 заявки · 69 000 ₸</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[#8A8177]">Room Service</span>
                  <span className="font-medium text-[#241E1A]">2 заявки · 34 500 ₸</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[#8A8177]">{lang === 'RU' ? 'Трансфер' : 'Transfer'}</span>
                  <span className="font-medium text-[#241E1A]">1 заявка · 25 000 ₸</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[#8A8177]">{lang === 'RU' ? 'Прачечная и Бар' : 'Laundry & Bar'}</span>
                  <span className="font-medium text-[#241E1A]">2 заявки · 18 000 ₸</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* -------------------- OVERLAY: ЧАТЫ (FULL SCREEN) ------------------------ */}
      {/* ========================================================================= */}
      {showChats && (
        <div className="absolute inset-0 bg-[#FAF7F3] z-50 flex flex-col min-h-0 font-sans animate-in slide-in-from-right duration-200">
          {!activeChatContactId ? (
            <div className="flex-1 flex flex-col min-h-0 p-4.5 space-y-3.5 overflow-y-auto no-scrollbar">
              <div className="pt-2 flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setShowChats(false)}
                  className="h-9 w-9 -ml-2 rounded-full flex items-center justify-center text-[#241E1A] hover:bg-slate-200/60 transition-colors cursor-pointer"
                >
                  <ChevronLeft className="h-6 w-6 text-[#241E1A]" />
                </button>
                <h1 className="font-serif font-medium text-2xl text-[#241E1A] leading-tight">
                  {lang === 'RU' ? 'Чаты' : 'Chats'}
                </h1>
              </div>

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

              <div className="bg-white rounded-[20px] border border-[#E5E2DD] divide-y divide-[#E5E2DD]/50 shadow-2xs overflow-hidden">
                {serviceChatContacts
                  .filter(c =>
                    c.nameRu.toLowerCase().includes(chatSearchQuery.toLowerCase()) ||
                    c.nameEn.toLowerCase().includes(chatSearchQuery.toLowerCase())
                  )
                  .map((contact) => (
                    <div
                      key={contact.id}
                      onClick={() => {
                        setActiveChatContactId(contact.id);
                        setServiceChatContacts(prev =>
                          prev.map(item => item.id === contact.id ? { ...item, unreadCount: 0 } : item)
                        );
                      }}
                      className="p-3.5 flex items-start gap-3 hover:bg-slate-50/70 transition-colors cursor-pointer"
                    >
                      <div className="h-9 w-9 rounded-full bg-[#E5E0D8] text-[#8A8177] text-xs font-sans font-medium flex items-center justify-center shrink-0 mt-0.5">
                        {contact.initials}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs font-sans font-medium text-[#241E1A] truncate">
                            {lang === 'RU' ? contact.nameRu : contact.nameEn}
                          </span>
                          {contact.isPinned && (
                            <Pin className="h-3 w-3 text-[#8A8177] rotate-45 shrink-0" />
                          )}
                          <span className="text-[10px] font-sans text-[#8A8177] truncate">
                            {lang === 'RU' ? contact.tagRu : contact.tagEn}
                          </span>
                          <span className="text-[10px] font-sans text-[#8A8177] ml-auto shrink-0">
                            {contact.time}
                          </span>
                        </div>
                        <p className="text-xs font-sans font-normal text-[#8A8177] mt-0.5 truncate">
                          {lang === 'RU' ? contact.lastMsgRu : contact.lastMsgEn}
                        </p>
                      </div>
                      {contact.unreadCount > 0 && (
                        <span className="bg-[#C2410C] text-white text-[10px] font-bold rounded-full h-4 min-w-4 px-1 flex items-center justify-center shrink-0 mt-0.5">
                          {contact.unreadCount}
                        </span>
                      )}
                    </div>
                  ))}
              </div>
            </div>
          ) : (
            <div className="flex-1 flex flex-col min-h-0">
              <div className="p-4 bg-white border-b border-[#E5E2DD] flex items-center gap-3 shrink-0">
                <button
                  type="button"
                  onClick={() => setActiveChatContactId(null)}
                  className="h-8 w-8 -ml-1 rounded-full flex items-center justify-center text-[#241E1A] hover:bg-slate-100 transition-colors cursor-pointer"
                >
                  <ChevronLeft className="h-5 w-5 text-[#241E1A]" />
                </button>
                <div>
                  <h3 className="text-sm font-sans font-medium text-[#241E1A]">
                    {lang === 'RU'
                      ? serviceChatContacts.find(c => c.id === activeChatContactId)?.nameRu
                      : serviceChatContacts.find(c => c.id === activeChatContactId)?.nameEn}
                  </h3>
                  <p className="text-[10px] font-sans text-[#8A8177]">
                    {lang === 'RU'
                      ? serviceChatContacts.find(c => c.id === activeChatContactId)?.tagRu
                      : serviceChatContacts.find(c => c.id === activeChatContactId)?.tagEn}{' '}
                    · онлайн
                  </p>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto no-scrollbar p-4 space-y-3">
                {(serviceChatMessages[activeChatContactId] || []).map((msg, idx) => (
                  <div
                    key={idx}
                    className={`flex flex-col ${msg.sender === 'SENDER' ? 'items-end' : 'items-start'}`}
                  >
                    <div
                      className={`max-w-[80%] rounded-2xl px-3.5 py-2.5 text-xs font-sans ${
                        msg.sender === 'SENDER'
                          ? 'bg-[#C2410C] text-white rounded-br-xs'
                          : 'bg-white border border-[#E5E2DD] text-[#241E1A] rounded-bl-xs shadow-2xs'
                      }`}
                    >
                      <p className="leading-relaxed">{msg.text}</p>
                    </div>
                    <span className="text-[9px] text-[#8A8177] mt-1 px-1">{msg.time}</span>
                  </div>
                ))}
              </div>

              <div className="p-3 bg-white border-t border-[#E5E2DD] flex items-center gap-2 shrink-0">
                <input
                  type="text"
                  placeholder={lang === 'RU' ? 'Написать сообщение...' : 'Type a message...'}
                  value={typedMessage}
                  onChange={(e) => setTypedMessage(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && typedMessage.trim()) {
                      const timeNow = new Date().toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
                      setServiceChatMessages(prev => ({
                        ...prev,
                        [activeChatContactId]: [
                          ...(prev[activeChatContactId] || []),
                          { sender: 'SENDER', text: typedMessage.trim(), time: timeNow }
                        ]
                      }));
                      setTypedMessage('');
                    }
                  }}
                  className="flex-1 bg-[#FAF7F3] border border-[#E5E2DD] rounded-full px-4 py-2 text-xs text-[#241E1A] placeholder-[#8A8177] focus:outline-none"
                />
                <button
                  type="button"
                  onClick={() => {
                    if (!typedMessage.trim()) return;
                    const timeNow = new Date().toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
                    setServiceChatMessages(prev => ({
                      ...prev,
                      [activeChatContactId]: [
                        ...(prev[activeChatContactId] || []),
                        { sender: 'SENDER', text: typedMessage.trim(), time: timeNow }
                      ]
                    }));
                    setTypedMessage('');
                  }}
                  className="h-9 w-9 rounded-full bg-[#C2410C] text-white flex items-center justify-center shrink-0 cursor-pointer shadow-xs"
                >
                  <Send className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* ----------------- OVERLAY: УВЕДОМЛЕНИЯ (FULL SCREEN) -------------------- */}
      {/* ========================================================================= */}
      {showNotifications && (
        <div className="absolute inset-0 bg-[#FAF7F3] z-50 flex flex-col min-h-0 font-sans animate-in slide-in-from-right duration-200">
          <div className="flex-1 overflow-y-auto no-scrollbar p-4.5 space-y-4">
            <div className="pt-2">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setShowNotifications(false)}
                  className="h-9 w-9 -ml-2 rounded-full flex items-center justify-center text-[#241E1A] hover:bg-slate-200/60 transition-colors cursor-pointer"
                >
                  <ChevronLeft className="h-6 w-6 text-[#241E1A]" />
                </button>
                <h1 className="font-serif font-medium text-2xl text-[#241E1A] leading-tight">
                  {lang === 'RU' ? 'Уведомления' : 'Notifications'}
                </h1>
              </div>
              <div className="text-xs font-sans text-[#8A8177] pt-1 pl-7 flex items-center gap-1.5">
                <span><b>{unreadNotifsCount}</b> {lang === 'RU' ? 'новых' : 'new'}</span>
                <span>·</span>
                <button
                  type="button"
                  onClick={() => setServiceNotifications(prev => prev.map(n => ({ ...n, isUnread: false })))}
                  className="text-[#C2410C] hover:underline font-medium cursor-pointer"
                >
                  {lang === 'RU' ? 'отметить все прочитанными' : 'mark all as read'}
                </button>
              </div>
            </div>

            <div className="flex items-center gap-2 overflow-x-auto no-scrollbar">
              {[
                { id: 'ALL' as const, label: lang === 'RU' ? 'Все' : 'All' },
                { id: 'URGENT' as const, label: lang === 'RU' ? 'Срочные' : 'Urgent' },
                { id: 'NEW_SERVICE' as const, label: lang === 'RU' ? 'Услуги' : 'Services' },
                { id: 'SHIFT' as const, label: lang === 'RU' ? 'Смена' : 'Shift' },
              ].map(tab => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setNotifFilter(tab.id)}
                  className={`px-3.5 py-1.5 rounded-full text-xs font-sans transition-all cursor-pointer whitespace-nowrap ${
                    notifFilter === tab.id
                      ? 'bg-[#241E1A] text-white font-medium shadow-xs'
                      : 'bg-white border border-[#E5E2DD] text-[#8A8177] hover:text-[#241E1A] font-normal'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* СЕГОДНЯ */}
            <div className="space-y-2 pt-1">
              <span className="text-[10px] font-sans font-medium tracking-[0.08em] text-[#8A8177] uppercase block">
                {lang === 'RU' ? 'СЕГОДНЯ' : 'TODAY'}
              </span>
              <div className="space-y-2">
                {serviceNotifications
                  .filter(n => n.period === 'TODAY' && (notifFilter === 'ALL' || n.category === notifFilter))
                  .map(notif => (
                    <div
                      key={notif.id}
                      onClick={() =>
                        setServiceNotifications(prev =>
                          prev.map(item => item.id === notif.id ? { ...item, isUnread: false } : item)
                        )
                      }
                      className={`bg-white rounded-[14px] border border-[#E5E2DD] p-3.5 flex items-start gap-3 shadow-2xs cursor-pointer hover:bg-slate-50/70 transition-colors ${
                        notif.isAlert ? 'border-l-2 border-l-[#B3261E]' : ''
                      }`}
                    >
                      {notif.icon === 'TIMER' && <Clock className="h-4.5 w-4.5 text-[#B3261E] shrink-0 mt-0.5" />}
                      {notif.icon === 'SERVICE' && <ConciergeBell className="h-4.5 w-4.5 text-[#8A8177] shrink-0 mt-0.5" />}
                      {notif.icon === 'CHECK' && <CheckCircle2 className="h-4.5 w-4.5 text-[#8A8177] shrink-0 mt-0.5" />}
                      {notif.icon === 'CHAT' && <MessageSquare className="h-4.5 w-4.5 text-[#8A8177] shrink-0 mt-0.5" />}

                      <div className="flex-1 min-w-0">
                        <h4 className={`text-xs font-sans font-medium ${notif.isUnread ? 'text-[#241E1A]' : 'text-[#8A8177]'}`}>
                          {lang === 'RU' ? notif.titleRu : notif.titleEn}
                        </h4>
                        <p className="text-[10px] font-sans text-[#8A8177] mt-0.5">
                          {lang === 'RU' ? notif.subRu : notif.subEn}
                        </p>
                      </div>

                      {notif.isUnread && (
                        <span className="h-2 w-2 rounded-full bg-[#C2410C] shrink-0 mt-1" />
                      )}
                    </div>
                  ))}
              </div>
            </div>

            {/* ВЧЕРА */}
            <div className="space-y-2 pt-2 pb-6">
              <span className="text-[10px] font-sans font-medium tracking-[0.08em] text-[#8A8177] uppercase block">
                {lang === 'RU' ? 'ВЧЕРА' : 'YESTERDAY'}
              </span>
              <div className="space-y-2">
                {serviceNotifications
                  .filter(n => n.period === 'YESTERDAY' && (notifFilter === 'ALL' || n.category === notifFilter))
                  .map(notif => (
                    <div
                      key={notif.id}
                      className="bg-white rounded-[14px] border border-[#E5E2DD] p-3.5 flex items-start gap-3 shadow-2xs"
                    >
                      {notif.icon === 'CHECK' && <CheckCircle2 className="h-4.5 w-4.5 text-[#8A8177] shrink-0 mt-0.5" />}
                      {notif.icon === 'CLOCK' && <Clock className="h-4.5 w-4.5 text-[#8A8177] shrink-0 mt-0.5" />}

                      <div className="flex-1 min-w-0">
                        <h4 className="text-xs font-sans font-medium text-[#8A8177]">
                          {lang === 'RU' ? notif.titleRu : notif.titleEn}
                        </h4>
                        <p className="text-[10px] font-sans text-[#8A8177] mt-0.5">
                          {lang === 'RU' ? notif.subRu : notif.subEn}
                        </p>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* ------------------ OVERLAY: НАСТРОЙКИ (FULL SCREEN) --------------------- */}
      {/* ========================================================================= */}
      {showSettings && (
        <div className="absolute inset-0 bg-[#FAF7F3] z-50 flex flex-col min-h-0 font-sans animate-in slide-in-from-right duration-200">
          <div className="flex-1 overflow-y-auto no-scrollbar p-4.5 space-y-4">
            <div className="pt-2">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setShowSettings(false)}
                  className="h-9 w-9 -ml-2 rounded-full flex items-center justify-center text-[#241E1A] hover:bg-slate-200/60 transition-colors cursor-pointer"
                >
                  <ChevronLeft className="h-6 w-6 text-[#241E1A]" />
                </button>
                <h1 className="font-serif font-medium text-2xl text-[#241E1A] leading-tight">
                  {lang === 'RU' ? 'Настройки' : 'Settings'}
                </h1>
              </div>
              <p className="text-xs font-sans text-[#8A8177] pt-1 pl-7">
                {lang === 'RU' ? 'Приложение и учётная запись' : 'App & Account settings'}
              </p>
            </div>

            {/* ПРИЛОЖЕНИЕ */}
            <div className="space-y-2 pt-1">
              <span className="text-[10px] font-sans font-medium tracking-[0.08em] text-[#8A8177] uppercase block">
                {lang === 'RU' ? 'ПРИЛОЖЕНИЕ' : 'APPLICATION'}
              </span>

              <div className="bg-white rounded-[14px] border border-[#E5E2DD] divide-y divide-[#E5E2DD]/50 shadow-2xs overflow-hidden text-xs">
                <div className="p-3.5 flex items-center justify-between">
                  <div>
                    <div className="font-sans text-xs font-medium text-[#241E1A]">
                      {lang === 'RU' ? 'Язык интерфейса' : 'Interface Language'}
                    </div>
                    <div className="text-[10px] text-[#8A8177] mt-0.5">
                      {lang === 'RU' ? 'Русский' : 'English'}
                    </div>
                  </div>
                  <div className="flex bg-[#EFECE6] p-0.5 rounded-full border border-[#E5E2DD] text-xs">
                    <button
                      type="button"
                      onClick={() => onLanguageChange('RU')}
                      className={`px-3 py-1 rounded-full transition-all cursor-pointer font-medium ${
                        lang === 'RU' ? 'bg-[#241E1A] text-white shadow-xs' : 'text-[#8A8177]'
                      }`}
                    >
                      RU
                    </button>
                    <button
                      type="button"
                      onClick={() => onLanguageChange('EN')}
                      className={`px-3 py-1 rounded-full transition-all cursor-pointer font-medium ${
                        lang === 'EN' ? 'bg-[#241E1A] text-white shadow-xs' : 'text-[#8A8177]'
                      }`}
                    >
                      EN
                    </button>
                  </div>
                </div>

                <div className="p-3.5 flex items-center justify-between">
                  <div>
                    <div className="font-sans text-xs font-medium text-[#241E1A]">
                      {lang === 'RU' ? 'Офлайн-режим' : 'Offline Mode'}
                    </div>
                    <div className="text-[10px] text-[#8A8177] mt-0.5">
                      {lang === 'RU' ? 'данные синхронизируются при сети' : 'data synced when online'}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={onToggleOffline}
                    className={`w-11 h-6 rounded-full transition-colors relative cursor-pointer ${
                      offlineMode ? 'bg-[#5B8C6E]' : 'bg-[#E5E2DD]'
                    }`}
                  >
                    <span
                      className={`absolute top-0.5 h-5 w-5 rounded-full bg-white transition-transform ${
                        offlineMode ? 'left-5.5' : 'left-0.5'
                      }`}
                    />
                  </button>
                </div>

                <div className="p-3.5 flex items-center justify-between">
                  <div>
                    <div className="font-sans text-xs font-medium text-[#241E1A]">
                      {lang === 'RU' ? 'Push-уведомления' : 'Push Notifications'}
                    </div>
                    <div className="text-[10px] text-[#8A8177] mt-0.5">
                      {lang === 'RU' ? 'новые заявки и сообщения' : 'new requests & messages'}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setPushNotifications(!pushNotifications)}
                    className={`w-11 h-6 rounded-full transition-colors relative cursor-pointer ${
                      pushNotifications ? 'bg-[#5B8C6E]' : 'bg-[#E5E2DD]'
                    }`}
                  >
                    <span
                      className={`absolute top-0.5 h-5 w-5 rounded-full bg-white transition-transform ${
                        pushNotifications ? 'left-5.5' : 'left-0.5'
                      }`}
                    />
                  </button>
                </div>

                <div className="p-3.5 flex items-center justify-between">
                  <div>
                    <div className="font-sans text-xs font-medium text-[#241E1A]">
                      {lang === 'RU' ? 'Звук при новой заявке' : 'Sound on New Request'}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setSoundOnNewTask(!soundOnNewTask)}
                    className={`w-11 h-6 rounded-full transition-colors relative cursor-pointer ${
                      soundOnNewTask ? 'bg-[#5B8C6E]' : 'bg-[#E5E2DD]'
                    }`}
                  >
                    <span
                      className={`absolute top-0.5 h-5 w-5 rounded-full bg-white transition-transform ${
                        soundOnNewTask ? 'left-5.5' : 'left-0.5'
                      }`}
                    />
                  </button>
                </div>
              </div>
            </div>

            {/* СИНХРОНИЗАЦИЯ */}
            <div className="space-y-2 pt-1">
              <span className="text-[10px] font-sans font-medium tracking-[0.08em] text-[#8A8177] uppercase block">
                {lang === 'RU' ? 'СИНХРОНИЗАЦИЯ' : 'SYNC'}
              </span>

              <div className="bg-white rounded-[14px] border border-[#E5E2DD] shadow-2xs overflow-hidden text-xs">
                <div
                  onClick={() => {
                    setLastSyncTime(new Date().toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' }));
                    alert(lang === 'RU' ? 'Данные успешно синхронизированы!' : 'Data synced!');
                  }}
                  className="p-3.5 flex items-center justify-between hover:bg-slate-50/70 transition-colors cursor-pointer"
                >
                  <div className="flex items-center gap-3">
                    <RefreshCw className="h-4 w-4 text-[#8A8177]" />
                    <div>
                      <div className="font-sans text-xs font-medium text-[#241E1A]">
                        {lang === 'RU' ? 'Обновить данные' : 'Refresh Data'}
                      </div>
                      <div className="text-[10px] text-[#8A8177] mt-0.5">
                        {lang === 'RU' ? `последняя синхронизация ${lastSyncTime}` : `last sync ${lastSyncTime}`}
                      </div>
                    </div>
                  </div>
                  <ChevronRight className="h-4 w-4 text-[#8A8177]" />
                </div>
              </div>
            </div>

            {/* УЧЁТНАЯ ЗАПИСЬ */}
            <div className="space-y-2 pt-1">
              <span className="text-[10px] font-sans font-medium tracking-[0.08em] text-[#8A8177] uppercase block">
                {lang === 'RU' ? 'УЧЁТНАЯ ЗАПИСЬ' : 'ACCOUNT'}
              </span>

              <div className="bg-white rounded-[14px] border border-[#E5E2DD] divide-y divide-[#E5E2DD]/50 shadow-2xs overflow-hidden text-xs">
                <div
                  onClick={() => setShowPersonalDataModal(true)}
                  className="p-3.5 flex items-center justify-between hover:bg-slate-50/70 transition-colors cursor-pointer"
                >
                  <div className="flex items-center gap-3">
                    <User className="h-4 w-4 text-[#8A8177]" />
                    <span className="font-medium text-[#241E1A]">
                      {lang === 'RU' ? 'Личные данные' : 'Personal Data'}
                    </span>
                  </div>
                  <ChevronRight className="h-4 w-4 text-[#8A8177]" />
                </div>

                <div
                  onClick={() => setShowChangePasswordModal(true)}
                  className="p-3.5 flex items-center justify-between hover:bg-slate-50/70 transition-colors cursor-pointer"
                >
                  <div className="flex items-center gap-3">
                    <Lock className="h-4 w-4 text-[#8A8177]" />
                    <span className="font-medium text-[#241E1A]">
                      {lang === 'RU' ? 'Сменить пароль' : 'Change Password'}
                    </span>
                  </div>
                  <ChevronRight className="h-4 w-4 text-[#8A8177]" />
                </div>

                <div
                  onClick={() => setShowSupportModal(true)}
                  className="p-3.5 flex items-center justify-between hover:bg-slate-50/70 transition-colors cursor-pointer"
                >
                  <div className="flex items-center gap-3">
                    <HelpCircle className="h-4 w-4 text-[#8A8177]" />
                    <span className="font-medium text-[#241E1A]">
                      {lang === 'RU' ? 'Служба поддержки' : 'Support Desk'}
                    </span>
                  </div>
                  <ChevronRight className="h-4 w-4 text-[#8A8177]" />
                </div>
              </div>
            </div>

            {/* Выйти из аккаунта */}
            <div className="pt-1">
              <div
                onClick={onLogout}
                className="bg-white rounded-[14px] border border-[#E5E2DD] p-3.5 shadow-2xs cursor-pointer hover:bg-slate-50/70 transition-colors flex items-center gap-3 text-xs"
              >
                <LogOut className="h-4 w-4 text-[#8A8177] shrink-0" />
                <span className="font-medium text-[#8A8177] hover:text-[#B3261E]">
                  {lang === 'RU' ? 'Выйти из аккаунта' : 'Log out'}
                </span>
              </div>
            </div>

            <div className="py-2 text-center text-[11px] font-sans text-[#8A8177]">
              Sollviera PMS v2.4 · Rixos Borovoe
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* ------------------------------ MODALS ----------------------------------- */}
      {/* ========================================================================= */}
      {showQrShiftModal && (
        <div className="absolute inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-[#FAF7F3] rounded-[24px] w-full max-w-xs p-5 space-y-4 border border-[#E5E2DD] shadow-2xl">
            <div className="flex items-center justify-between">
              <h3 className="font-serif font-medium text-lg text-[#241E1A]">
                {lang === 'RU' ? 'Начать смену по QR' : 'Start Shift via QR'}
              </h3>
              <button
                type="button"
                onClick={() => setShowQrShiftModal(false)}
                className="h-7 w-7 rounded-full bg-white border border-[#E5E2DD] text-xs cursor-pointer"
              >
                ✕
              </button>
            </div>
            <div className="w-full aspect-square bg-[#221C18] rounded-[18px] relative flex items-center justify-center">
              <div className="absolute top-[16%] left-[16%] w-8 h-8 border-t-2 border-l-2 border-[#C86428] rounded-tl-[8px]" />
              <div className="absolute top-[16%] right-[16%] w-8 h-8 border-t-2 border-r-2 border-[#C86428] rounded-tr-[8px]" />
              <div className="absolute bottom-[16%] left-[16%] w-8 h-8 border-b-2 border-l-2 border-[#C86428] rounded-bl-[8px]" />
              <div className="absolute bottom-[16%] right-[16%] w-8 h-8 border-b-2 border-r-2 border-[#C86428] rounded-br-[8px]" />
              <QrCode className="h-12 w-12 text-[#8A8177]" />
            </div>
            <button
              type="button"
              onClick={() => {
                setShiftStatus('ON_SHIFT');
                setShowQrShiftModal(false);
              }}
              className="w-full bg-[#C2410C] hover:bg-[#A93A0C] text-white py-3 rounded-xl text-xs font-medium cursor-pointer"
            >
              {lang === 'RU' ? 'Подтвердить начало смены' : 'Confirm Shift Start'}
            </button>
          </div>
        </div>
      )}

      {showShiftHistoryModal && (
        <div className="absolute inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="bg-[#FAF7F3] rounded-t-[24px] sm:rounded-[24px] w-full max-w-sm p-4.5 space-y-4 border border-[#E5E2DD] shadow-2xl">
            <div className="flex items-center justify-between pb-1">
              <h3 className="font-serif font-medium text-lg text-[#241E1A]">
                {lang === 'RU' ? 'История смен' : 'Shift History'}
              </h3>
              <button
                type="button"
                onClick={() => setShowShiftHistoryModal(false)}
                className="h-7 w-7 rounded-full bg-white border border-[#E5E2DD] text-xs cursor-pointer"
              >
                ✕
              </button>
            </div>
            <div className="bg-white rounded-[20px] border border-[#E5E2DD] divide-y divide-[#E5E2DD]/50 shadow-2xs overflow-hidden text-xs">
              <div className="p-3.5 flex items-center justify-between">
                <div>
                  <div className="font-medium text-[#241E1A]">SH-4091 · 18 окт</div>
                  <div className="text-[10px] text-[#8A8177]">08:00–17:00 · 11 услуг выполнено</div>
                </div>
                <span className="text-[#5B8C6E] font-medium">100%</span>
              </div>
              <div className="p-3.5 flex items-center justify-between">
                <div>
                  <div className="font-medium text-[#241E1A]">SH-4084 · 16 окт</div>
                  <div className="text-[10px] text-[#8A8177]">08:00–17:00 · 10 услуг выполнено</div>
                </div>
                <span className="text-[#5B8C6E] font-medium">98%</span>
              </div>
              <div className="p-3.5 flex items-center justify-between">
                <div>
                  <div className="font-medium text-[#241E1A]">SH-4075 · 15 окт</div>
                  <div className="text-[10px] text-[#8A8177]">08:00–17:00 · 12 услуг выполнено</div>
                </div>
                <span className="text-[#5B8C6E] font-medium">99%</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {showPersonalDataModal && (
        <div className="absolute inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="bg-[#FAF7F3] rounded-t-[24px] sm:rounded-[24px] w-full max-w-sm p-4.5 space-y-4 border border-[#E5E2DD] shadow-2xl">
            <div className="flex items-center justify-between pb-1">
              <h3 className="font-serif font-medium text-lg text-[#241E1A]">
                {lang === 'RU' ? 'Личные данные' : 'Personal Data'}
              </h3>
              <button
                type="button"
                onClick={() => setShowPersonalDataModal(false)}
                className="h-7 w-7 rounded-full bg-white border border-[#E5E2DD] text-xs cursor-pointer"
              >
                ✕
              </button>
            </div>
            <div className="bg-white rounded-[20px] border border-[#E5E2DD] divide-y divide-[#E5E2DD]/50 shadow-2xs overflow-hidden text-xs">
              <div className="p-3.5 flex justify-between">
                <span className="text-[#8A8177]">{lang === 'RU' ? 'ФИО' : 'Full Name'}</span>
                <span className="font-medium text-[#241E1A]">{cleanerProfile.fullNameRu}</span>
              </div>
              <div className="p-3.5 flex justify-between">
                <span className="text-[#8A8177]">{lang === 'RU' ? 'Роль' : 'Role'}</span>
                <span className="font-medium text-[#241E1A]">{lang === 'RU' ? 'Работа с услугами' : 'Hotel Services'}</span>
              </div>
              <div className="p-3.5 flex justify-between">
                <span className="text-[#8A8177]">{lang === 'RU' ? 'Табельный номер' : 'Staff ID'}</span>
                <span className="font-medium text-[#241E1A]">{cleanerProfile.badgeId}</span>
              </div>
              <div className="p-3.5 flex justify-between">
                <span className="text-[#8A8177]">{lang === 'RU' ? 'Отель' : 'Hotel'}</span>
                <span className="font-medium text-[#241E1A]">Rixos Borovoe</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {showChangePasswordModal && (
        <div className="absolute inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="bg-[#FAF7F3] rounded-t-[24px] sm:rounded-[24px] w-full max-w-sm p-4.5 space-y-4 border border-[#E5E2DD] shadow-2xl">
            <div className="flex items-center justify-between pb-1">
              <h3 className="font-serif font-medium text-lg text-[#241E1A]">
                {lang === 'RU' ? 'Сменить пароль' : 'Change Password'}
              </h3>
              <button
                type="button"
                onClick={() => setShowChangePasswordModal(false)}
                className="h-7 w-7 rounded-full bg-white border border-[#E5E2DD] text-xs cursor-pointer"
              >
                ✕
              </button>
            </div>
            <div className="space-y-3 text-xs">
              <input
                type="password"
                placeholder={lang === 'RU' ? 'Текущий пароль' : 'Current password'}
                className="w-full bg-white border border-[#E5E2DD] rounded-xl p-3 focus:outline-none"
              />
              <input
                type="password"
                placeholder={lang === 'RU' ? 'Новый пароль' : 'New password'}
                className="w-full bg-white border border-[#E5E2DD] rounded-xl p-3 focus:outline-none"
              />
              <button
                type="button"
                onClick={() => setShowChangePasswordModal(false)}
                className="w-full bg-[#C2410C] text-white py-3 rounded-xl font-medium cursor-pointer"
              >
                {lang === 'RU' ? 'Сохранить' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      )}

      {showSupportModal && (
        <div className="absolute inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="bg-[#FAF7F3] rounded-t-[24px] sm:rounded-[24px] w-full max-w-sm p-4.5 space-y-4 border border-[#E5E2DD] shadow-2xl">
            <div className="flex items-center justify-between pb-1">
              <h3 className="font-serif font-medium text-lg text-[#241E1A]">
                {lang === 'RU' ? 'Служба поддержки' : 'Support Desk'}
              </h3>
              <button
                type="button"
                onClick={() => setShowSupportModal(false)}
                className="h-7 w-7 rounded-full bg-white border border-[#E5E2DD] text-xs cursor-pointer"
              >
                ✕
              </button>
            </div>
            <div className="bg-white rounded-[20px] border border-[#E5E2DD] p-4 space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-[#8A8177]">{lang === 'RU' ? 'Диспетчерская' : 'Service Desk'}</span>
                <span className="font-medium text-[#C2410C]">+7 (800) 100-20-30</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#8A8177]">IT Helpdesk</span>
                <span className="font-medium text-[#241E1A]">support@sollviera.com</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
