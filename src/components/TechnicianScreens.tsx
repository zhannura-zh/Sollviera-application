import React, { useState, useEffect } from 'react';
import { 
  Wrench, Play, Pause, CheckSquare, Layers, ShieldAlert, Users, Settings, 
  Bell, MessageSquare, PlusCircle, ArrowLeft, Camera, Check, CheckCircle2, 
  History, User, HelpCircle, Activity, FileText, ChevronRight, ChevronLeft, ChevronDown, Search, 
  Building, Clock, AlertTriangle, Hammer, ShieldCheck, LogOut, Plus, Minus, Info, Share2, RotateCcw,
  Phone, Calendar, BarChart2, Lock, Headphones, Pin, AlertCircle, Package, Send
} from 'lucide-react';
import { Language, CleanerProfile, HotelRoom, MaintenanceRequest, MaintenanceCategory, MaintenancePriority, MaintenanceStatus } from '../types';
import { SollvieraLogo } from './SollvieraLogo';

interface TechnicianScreensProps {
  lang: Language;
  onLanguageChange: (lang: Language) => void;
  rooms: HotelRoom[];
  onUpdateRooms: (rooms: HotelRoom[]) => void;
  maintenanceRequests: MaintenanceRequest[];
  onUpdateMaintenanceRequests: (requests: MaintenanceRequest[]) => void;
  systemLogs: string[];
  cleanerProfile: CleanerProfile;
  onUpdateCleanerProfile: (profile: CleanerProfile) => void;
  onLogout: () => void;
  offlineMode: boolean;
  onToggleOffline: () => void;
  activeTab: string;
}

export const TechnicianScreens: React.FC<TechnicianScreensProps> = ({
  lang,
  onLanguageChange,
  rooms,
  onUpdateRooms,
  maintenanceRequests,
  onUpdateMaintenanceRequests,
  systemLogs,
  cleanerProfile,
  onUpdateCleanerProfile,
  onLogout,
  offlineMode,
  onToggleOffline,
  activeTab
}) => {
  // ----------------------------------------------------
  // LOCAL STATES & CONFIG
  // ----------------------------------------------------
  
  // Settings & Notifications sub-screens
  const [showSettings, setShowSettings] = useState<boolean>(false);
  const [showNotifications, setShowNotifications] = useState<boolean>(false);
  const [isEditingProfile, setIsEditingProfile] = useState<boolean>(false);
  
  // Profile edit inputs
  const [editFullName, setEditFullName] = useState<string>(cleanerProfile.fullName);
  const [editFullNameRu, setEditFullNameRu] = useState<string>(cleanerProfile.fullNameRu);
  const [editBadgeId, setEditBadgeId] = useState<string>(cleanerProfile.badgeId);
  const [editAvatarUrl, setEditAvatarUrl] = useState<string>(cleanerProfile.avatarUrl);

  // Chats local simulation
  const [showChats, setShowChats] = useState<boolean>(false);
  const [activeChatContactId, setActiveChatContactId] = useState<string | null>(null);
  const [chatSearchQuery, setChatSearchQuery] = useState<string>('');
  const [typedMessage, setTypedMessage] = useState<string>('');
  const [chatContacts, setChatContacts] = useState([
    {
      id: 'chat-tech',
      nameRu: 'Техслужба',
      nameEn: 'Tech Service',
      initials: 'ТС',
      tagRu: 'группа',
      tagEn: 'group',
      isPinned: true,
      unreadCount: 3,
      time: '09:12',
      lastMsgRu: 'Дмитрий: стояк 3 перекрыт до 1...',
      lastMsgEn: 'Dmitry: riser 3 shut off until 1...'
    },
    {
      id: 'chat-reception',
      nameRu: 'Ресепшн',
      nameEn: 'Reception',
      initials: 'РС',
      tagRu: 'диспетчер',
      tagEn: 'front desk',
      isPinned: true,
      unreadCount: 1,
      time: '08:47',
      lastMsgRu: 'В 315 заезд в 14:00, успеете до...',
      lastMsgEn: 'Room 315 check-in at 14:00, can you...'
    },
    {
      id: 'chat-elena',
      nameRu: 'Елена Вэнс',
      nameEn: 'Elena Vance',
      initials: 'ЕВ',
      tagRu: 'клинер · 3 этаж',
      tagEn: 'cleaner · floor 3',
      isPinned: false,
      unreadCount: 0,
      time: '17:52',
      lastMsgRu: 'Отправила фото протечки, вода до ко...',
      lastMsgEn: 'Sent photo of leakage, water reached...'
    },
    {
      id: 'chat-svetlana',
      nameRu: 'Светлана Ким',
      nameEn: 'Svetlana Kim',
      initials: 'СК',
      tagRu: 'супервайзер',
      tagEn: 'supervisor',
      isPinned: false,
      unreadCount: 0,
      time: 'вчера',
      lastMsgRu: '208 после ремонта отдайте сразу на у...',
      lastMsgEn: 'Hand over 208 for cleaning after repair...'
    },
    {
      id: 'chat-dmitry',
      nameRu: 'Дмитрий Соколов',
      nameEn: 'Dmitry Sokolov',
      initials: 'ДС',
      tagRu: 'инженер',
      tagEn: 'engineer',
      isPinned: false,
      unreadCount: 0,
      time: 'вчера',
      lastMsgRu: 'Картриджи привезут в четверг, пока ст...',
      lastMsgEn: 'Cartridges arrive Thursday, install...'
    },
    {
      id: 'chat-supply',
      nameRu: 'Снабжение',
      nameEn: 'Supply',
      initials: 'СН',
      tagRu: 'группа',
      tagEn: 'group',
      isPinned: false,
      unreadCount: 0,
      time: '25 авг',
      lastMsgRu: 'Заказ на фильтры принят, доставка со...',
      lastMsgEn: 'Filter order accepted, delivery with...'
    }
  ]);

  const [chatMessages, setChatMessages] = useState<Record<string, Array<{ sender: 'SENDER' | 'RECEIVER'; text: string; time: string }>>>({
    'chat-tech': [
      { sender: 'RECEIVER', text: 'Коллеги, в 315 номере протечка по стояку.', time: '08:50' },
      { sender: 'RECEIVER', text: 'Дмитрий: стояк 3 перекрыт до 11:00.', time: '09:12' },
      { sender: 'SENDER', text: 'Принял, уже меняю гибкую подводку.', time: '09:14' }
    ],
    'chat-reception': [
      { sender: 'RECEIVER', text: 'Олег, добрый день! В 315 заезд в 14:00, успеете до этого времени?', time: '08:47' },
      { sender: 'SENDER', text: 'Здравствуйте! Да, закончим к 12:00.', time: '08:49' }
    ],
    'chat-elena': [
      { sender: 'RECEIVER', text: 'Отправила фото протечки, вода до коридора не дошла.', time: '17:52' },
      { sender: 'SENDER', text: 'Спасибо, всё перекрыли.', time: '17:55' }
    ],
    'chat-svetlana': [
      { sender: 'RECEIVER', text: '208 после ремонта отдайте сразу на уборку.', time: 'Вчера' },
      { sender: 'SENDER', text: 'Хорошо, лампу заменили.', time: 'Вчера' }
    ],
    'chat-dmitry': [
      { sender: 'RECEIVER', text: 'Картриджи привезут в четверг, пока ставьте ремкомплект.', time: 'Вчера' }
    ],
    'chat-supply': [
      { sender: 'RECEIVER', text: 'Заказ на фильтры принят, доставка со сменой завтра.', time: '25 авг' }
    ]
  });

  // Notifications state matching reference
  const [notifFilter, setNotifFilter] = useState<'ALL' | 'REQUESTS' | 'WAREHOUSE' | 'TO'>('ALL');
  const [techNotifications, setTechNotifications] = useState([
    {
      id: 'notif-1',
      type: 'CRITICAL',
      category: 'REQUESTS',
      titleRu: 'Критическая заявка · № 315',
      titleEn: 'Critical request · № 315',
      subRu: 'Сантехника · номер заблокирован · 17:40',
      subEn: 'Plumbing · room blocked · 17:40',
      isUnread: true,
      timeGroup: 'TODAY',
      icon: 'ALERT'
    },
    {
      id: 'notif-2',
      type: 'NORMAL',
      category: 'REQUESTS',
      titleRu: 'Новая заявка · Лобби',
      titleEn: 'New request · Lobby',
      subRu: 'Электрика · не работает подсветка стойки · 09:05',
      subEn: 'Electrical · counter lighting defect · 09:05',
      isUnread: true,
      timeGroup: 'TODAY',
      icon: 'WRENCH'
    },
    {
      id: 'notif-3',
      type: 'NORMAL',
      category: 'TO',
      titleRu: 'Плановое ТО до 14:00',
      titleEn: 'Planned maintenance until 14:00',
      subRu: 'Осмотр фильтров вентиляции · лобби',
      subEn: 'Ventilation filter inspection · lobby',
      isUnread: true,
      timeGroup: 'TODAY',
      icon: 'CALENDAR'
    },
    {
      id: 'notif-4',
      type: 'NORMAL',
      category: 'WAREHOUSE',
      titleRu: 'Заказ фильтров в пути',
      titleEn: 'Filter order in transit',
      subRu: '10 шт · доставка со сменой · 08:20',
      subEn: '10 pcs · delivery with shift · 08:20',
      isUnread: false,
      timeGroup: 'TODAY',
      icon: 'PACKAGE'
    },
    {
      id: 'notif-5',
      type: 'NORMAL',
      category: 'REQUESTS',
      titleRu: '№ 205 разблокирован',
      titleEn: '№ 205 unblocked',
      subRu: 'Заявка закрыта, номер передан на уборку · 11:20',
      subEn: 'Task closed, room handed over to housekeeping · 11:20',
      isUnread: false,
      timeGroup: 'YESTERDAY',
      icon: 'CHECK'
    }
  ]);

  // Shift Status Oleg Petrov
  const [shiftStatus, setShiftStatus] = useState<'ON_SHIFT' | 'ON_BREAK' | 'SHIFT_ENDED'>('ON_SHIFT');
  
  // Tech Dashboard (Номера) view settings matching reference
  const [techTabFilter, setTechTabFilter] = useState<'WITH_ISSUES' | 'BLOCKED' | 'ALL'>('WITH_ISSUES');
  const [techSearchQuery, setTechSearchQuery] = useState<string>('');
  const [selectedTechRoom, setSelectedTechRoom] = useState<any | null>(null);

  // Issues rooms list matching reference & sync with rooms state
  const [issueRoomsList, setIssueRoomsList] = useState([
    {
      id: 'room-315',
      roomNumber: '315',
      titleRu: '№ 315',
      titleEn: '№ 315',
      typeRu: 'Deluxe Suite',
      typeEn: 'Deluxe Suite',
      floorRu: '3 этаж',
      floorEn: 'Floor 3',
      categoryRu: 'сантехника',
      categoryEn: 'plumbing',
      isBlocked: true,
      requestsCount: 1,
      dotColor: 'bg-[#B3261E]',
      priority: 'HIGH',
      description: 'Протечка смесителя в ванной комнате, перекрыт стояк подачи воды.',
      descriptionEn: 'Bathroom mixer faucet leakage, water supply valve closed.'
    },
    {
      id: 'room-208',
      roomNumber: '208',
      titleRu: '№ 208',
      titleEn: '№ 208',
      typeRu: 'Standard Twin',
      typeEn: 'Standard Twin',
      floorRu: '2 этаж',
      floorEn: 'Floor 2',
      categoryRu: 'электрика',
      categoryEn: 'electrical',
      isBlocked: false,
      requestsCount: 1,
      dotColor: 'bg-[#D97706]',
      priority: 'MEDIUM',
      description: 'Не работает настенный бра и розетка у прикроватной тумбы.',
      descriptionEn: 'Wall sconce light and bedside power outlet not working.'
    },
    {
      id: 'zone-lobby',
      roomNumber: 'Лобби',
      titleRu: 'Лобби',
      titleEn: 'Lobby',
      typeRu: 'Общая зона',
      typeEn: 'Public area',
      floorRu: '1 этаж',
      floorEn: 'Floor 1',
      categoryRu: 'электрика',
      categoryEn: 'electrical',
      isBlocked: false,
      requestsCount: 1,
      dotColor: 'bg-[#D97706]',
      priority: 'MEDIUM',
      description: 'Мерцает потолочный светильник над зоной ресепшн.',
      descriptionEn: 'Flickering ceiling light above reception counter.'
    }
  ]);

  // Recently serviced rooms list matching reference
  const [servicedRoomsList, setServicedRoomsList] = useState([
    {
      id: 'hist-205',
      roomNumber: '205',
      titleRu: '№ 205',
      titleEn: '№ 205',
      typeRu: 'Standard King',
      typeEn: 'Standard King',
      floorRu: '2 этаж',
      floorEn: 'Floor 2',
      actionRu: 'замена лампы',
      actionEn: 'lamp replacement',
      timeLabelRu: 'сегодня',
      timeLabelEn: 'today',
      timeColor: 'text-[#5B8C6E]',
      dotColor: 'bg-[#5B8C6E]',
      materialsRu: 'Лампочка LED 10W - 1 шт.',
      materialsEn: 'LED Bulb 10W - 1 pcs'
    },
    {
      id: 'hist-402',
      roomNumber: '402',
      titleRu: '№ 402',
      titleEn: '№ 402',
      typeRu: 'Presidential Suite',
      typeEn: 'Presidential Suite',
      floorRu: '4 этаж',
      floorEn: 'Floor 4',
      actionRu: 'климат',
      actionEn: 'climate HVAC',
      timeLabelRu: 'сегодня',
      timeLabelEn: 'today',
      timeColor: 'text-[#5B8C6E]',
      dotColor: 'bg-[#5B8C6E]',
      materialsRu: 'Фильтр кондиционера - 1 шт.',
      materialsEn: 'HVAC Filter - 1 pcs'
    },
    {
      id: 'hist-210',
      roomNumber: '210',
      titleRu: '№ 210',
      titleEn: '№ 210',
      typeRu: 'Junior Suite',
      typeEn: 'Junior Suite',
      floorRu: '2 этаж',
      floorEn: 'Floor 2',
      actionRu: 'мебель',
      actionEn: 'furniture',
      timeLabelRu: 'вчера',
      timeLabelEn: 'yesterday',
      timeColor: 'text-[#8A8177]',
      dotColor: 'bg-[#5B8C6E]',
      materialsRu: 'Регулировка петель шкафа',
      materialsEn: 'Wardrobe hinges adjustment'
    }
  ]);

  // Dashboard view settings
  const [activeWorkOrderId, setActiveWorkOrderId] = useState<string | null>('room-315');
  const [filterStatus, setFilterStatus] = useState<string>('ALL');
  const [filterPriority, setFilterPriority] = useState<string>('ALL');
  const [filterScope, setFilterScope] = useState<'MY' | 'ALL'>('MY');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Active Work Order tracking states (matching reference)
  const [isTimerRunning, setIsTimerRunning] = useState<boolean>(true);
  const [elapsedSeconds, setElapsedSeconds] = useState<number>(42);
  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [checklistItems, setChecklistItems] = useState<Array<{ id: string, textRu: string, textEn: string, done: boolean }>>([
    { id: 'c1', textRu: 'Диагностика · причина найдена', textEn: 'Diagnostics · cause found', done: true },
    { id: 'c2', textRu: 'Устранение неисправности', textEn: 'Troubleshooting defect', done: false },
    { id: 'c3', textRu: 'Проверка после ремонта', textEn: 'Post-repair check', done: false }
  ]);
  const [activePartsUsed, setActivePartsUsed] = useState<Array<{ id: string, code: string, nameRu: string, nameEn: string, stockRu: string, stockEn: string, qty: number }>>([
    { id: 'p1', code: 'W2', nameRu: 'Гибкая подводка 1/2', nameEn: 'Flexible pipe 1/2', stockRu: 'на складе 5 шт', stockEn: 'stock 5 pcs', qty: 1 },
    { id: 'p2', code: 'W4', nameRu: 'Фум-лента', nameEn: 'Teflon tape', stockRu: 'на складе 12 рул', stockEn: 'stock 12 rolls', qty: 1 }
  ]);
  const [showAddPartModal, setShowAddPartModal] = useState<boolean>(false);
  const [showTransferModal, setShowTransferModal] = useState<boolean>(false);
  const [usedMaterials, setUsedMaterials] = useState<Array<{ name: string, qty: number }>>([]);
  const [selectedMaterialInput, setSelectedMaterialInput] = useState<string>('');
  const [materialQtyInput, setMaterialQtyInput] = useState<number>(1);
  const [photoBeforeUrl, setPhotoBeforeUrl] = useState<string | null>(null);
  const [photoAfterUrl, setPhotoAfterUrl] = useState<string | null>(null);
  const [closeComment, setCloseComment] = useState<string>('');

  // Create Request input states
  const [createLocation, setCreateLocation] = useState<string>('');
  const [createCategory, setCreateCategory] = useState<MaintenanceCategory>('PLUMBING');
  const [createPriority, setCreatePriority] = useState<MaintenancePriority>('MEDIUM');
  const [createDescription, setCreateDescription] = useState<string>('');
  const [createBlocks, setCreateBlocks] = useState<boolean>(false);
  const [createPhotoUrl, setCreatePhotoUrl] = useState<string | null>(null);
  const [createAssignee, setCreateAssignee] = useState<string>('Взять себе');
  const [createDeadline, setCreateDeadline] = useState<string>('Сегодня, до 18:00');
  const [showAssigneeModal, setShowAssigneeModal] = useState<boolean>(false);
  const [showDeadlineModal, setShowDeadlineModal] = useState<boolean>(false);

  // Warehouse inventory tab state matching reference
  const [inventoryTabFilter, setInventoryTabFilter] = useState<'ALL' | 'PLUMBING' | 'ELECTRICAL' | 'CONSUMABLES'>('ALL');
  const [inventorySearchQuery, setInventorySearchQuery] = useState<string>('');

  const [warehouseInventory, setWarehouseInventory] = useState([
    {
      id: 'inv-1',
      code: 'W1',
      nameRu: 'Лампочка LED 10W',
      nameEn: 'LED Bulb 10W',
      category: 'ELECTRICAL',
      currentStock: 15,
      normStock: 20,
      unit: 'pcs',
      orderQty: 0
    },
    {
      id: 'inv-2',
      code: 'W5',
      nameRu: 'Фильтр кондиционера',
      nameEn: 'HVAC Filter',
      category: 'ELECTRICAL',
      currentStock: 6,
      normStock: 15,
      unit: 'pcs',
      orderQty: 9
    },
    {
      id: 'inv-3',
      code: 'W2',
      nameRu: 'Гибкая подводка 1/2',
      nameEn: 'Flexible pipe 1/2',
      category: 'PLUMBING',
      currentStock: 5,
      normStock: 12,
      unit: 'pcs',
      orderQty: 7
    },
    {
      id: 'inv-4',
      code: 'W3',
      nameRu: 'Картридж смесителя 35мм',
      nameEn: 'Mixer cartridge 35mm',
      category: 'PLUMBING',
      currentStock: 8,
      normStock: 10,
      unit: 'pcs',
      orderQty: 0
    },
    {
      id: 'inv-5',
      code: 'W4',
      nameRu: 'Фум-лента',
      nameEn: 'Teflon tape',
      category: 'PLUMBING',
      currentStock: 12,
      normStock: 15,
      unit: 'rolls',
      orderQty: 0
    }
  ]);

  const [orderHistoryList, setOrderHistoryList] = useState([
    {
      id: 'ord-1',
      titleRu: 'Фильтры кондиционера · 10 шт',
      titleEn: 'HVAC Filters · 10 pcs',
      subRu: 'Заказан 25 авг · доставка со сменой',
      subEn: 'Ordered Aug 25 · shift delivery',
      statusRu: 'в пути',
      statusEn: 'in transit',
      dotColor: 'bg-[#D97706]',
      statusColor: 'text-[#8A8177]'
    },
    {
      id: 'ord-2',
      titleRu: 'Лампы LED · 20 шт',
      titleEn: 'LED Bulbs · 20 pcs',
      subRu: '22 авг',
      subEn: 'Aug 22',
      statusRu: 'получен',
      statusEn: 'received',
      dotColor: 'bg-[#5B8C6E]',
      statusColor: 'text-[#5B8C6E]'
    }
  ]);

  // Warehouse inventories stock
  const [warehouseStock, setWarehouseStock] = useState([
    { id: 'w1', nameEn: 'LED Bulb 10W', nameRu: 'Лампочка LED 10W', stock: 15, unit: 'pcs' },
    { id: 'w2', nameEn: 'Flexible pipe 1/2', nameRu: 'Гибкая подводка 1/2', stock: 5, unit: 'pcs' },
    { id: 'w3', nameEn: 'Mixer cartridge 35mm', nameRu: 'Картридж смесителя 35мм', stock: 8, unit: 'pcs' },
    { id: 'w4', nameEn: 'Teflon tape', nameRu: 'Фум-лента', stock: 12, unit: 'rolls' },
    { id: 'w5', nameEn: 'HVAC Filter', nameRu: 'Фильтр кондиционера', stock: 6, unit: 'pcs' }
  ]);
  const [warehouseRequests, setWarehouseRequests] = useState([
    { id: 'req-101', nameEn: 'Mixer cartridge 35mm', nameRu: 'Картридж смесителя 35мм', qty: 2, urgency: 'HIGH', status: 'PENDING', date: '27.08.2026' }
  ]);
  const [selectedStockId, setSelectedStockId] = useState<string>('');
  const [requestQty, setRequestQty] = useState<number>(1);
  const [requestUrgency, setRequestUrgency] = useState<string>('MEDIUM');

  // Plan ТО checklist
  const [regularTasks, setRegularTasks] = useState([
    { id: 'to-1', nameRu: 'Проверка давления в бойлере', nameEn: 'Boiler pressure check', cycle: 'DAILY', done: true, time: '08:15' },
    { id: 'to-2', nameRu: 'Осмотр фильтров вентиляции · лобби', nameEn: 'Lobby HVAC filter check', cycle: 'WEEKLY', done: false, time: 'до 14:00' },
    { id: 'to-3', nameRu: 'Тест пожарной сигнализации', nameEn: 'Fire alarm testing', cycle: 'MONTHLY', done: false, time: 'до конца недели' }
  ]);

  const [showShiftReportModal, setShowShiftReportModal] = useState<boolean>(false);
  const [showHistoryModal, setShowHistoryModal] = useState<boolean>(false);
  const [showScheduleModal, setShowScheduleModal] = useState<boolean>(false);

  // Settings screen states
  const [pushNotifications, setPushNotifications] = useState<boolean>(true);
  const [soundOnNewTask, setSoundOnNewTask] = useState<boolean>(false);
  const [lastSyncTime, setLastSyncTime] = useState<string>('09:41');
  const [showPersonalDataModal, setShowPersonalDataModal] = useState<boolean>(false);
  const [showChangePasswordModal, setShowChangePasswordModal] = useState<boolean>(false);
  const [showSupportModal, setShowSupportModal] = useState<boolean>(false);

  // Shift History
  const [techResolvedHistory, setTechResolvedHistory] = useState([
    { id: 'h-1', roomNumber: '205', category: 'ELECTRICAL', descRu: 'Замена сгоревшей лампы накаливания в торшере.', descEn: 'Replaced desk lamp bulb.', time: '11:20', materials: 'Лампочка LED 10W - 1 шт.' }
  ]);

  // Clean active overlays when navigation tab changes
  useEffect(() => {
    setShowChats(false);
    setActiveChatContactId(null);
  }, [activeTab]);

  // Timer simulation
  useEffect(() => {
    let interval: any;
    if (isTimerRunning) {
      interval = setInterval(() => {
        setElapsedSeconds(prev => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isTimerRunning]);

  // Format Elapsed Time
  const formatTimer = (totalSeconds: number) => {
    const mm = Math.floor(totalSeconds / 60).toString().padStart(2, '0');
    const ss = (totalSeconds % 60).toString().padStart(2, '0');
    return `${mm}:${ss}`;
  };

  // Helper translations
  const getCategoryLabel = (cat: MaintenanceCategory) => {
    switch (cat) {
      case 'PLUMBING': return lang === 'RU' ? 'Сантехника' : 'Plumbing';
      case 'ELECTRICAL': return lang === 'RU' ? 'Электрика' : 'Electrical';
      case 'FURNITURE': return lang === 'RU' ? 'Мебель' : 'Furniture';
      case 'APPLIANCES': return lang === 'RU' ? 'Бытовая техника' : 'Appliances';
      case 'CLEANLINESS': return lang === 'RU' ? 'Чистота / Грязь' : 'Cleanliness';
      case 'OTHER':
      default: return lang === 'RU' ? 'Другое' : 'Other';
    }
  };

  const getPriorityLabel = (pri: MaintenancePriority) => {
    switch (pri) {
      case 'LOW': return lang === 'RU' ? 'Низкий' : 'Low';
      case 'MEDIUM': return lang === 'RU' ? 'Средний' : 'Medium';
      case 'HIGH': return lang === 'RU' ? 'Высокий' : 'High';
      case 'CRITICAL': return lang === 'RU' ? 'Критический' : 'Critical';
      default: return pri;
    }
  };

  const getStatusLabel = (st: MaintenanceStatus) => {
    switch (st) {
      case 'CREATED': return lang === 'RU' ? 'Новая' : 'New';
      case 'IN_PROGRESS': return lang === 'RU' ? 'В работе' : 'In Progress';
      case 'RESOLVED': return lang === 'RU' ? 'Выполнена' : 'Resolved';
      default: return st;
    }
  };

  const getPriorityColor = (pri: MaintenancePriority) => {
    switch (pri) {
      case 'CRITICAL': return 'bg-rose-50 text-rose-700 border-rose-200';
      case 'HIGH': return 'bg-amber-50 text-amber-800 border-amber-200';
      case 'MEDIUM':
      default: return 'bg-sky-50 text-sky-800 border-sky-200';
    }
  };

  // Initialize checklist for active work order if loaded
  useEffect(() => {
    if (activeWorkOrderId) {
      const order = maintenanceRequests.find(req => req.id === activeWorkOrderId);
      if (order) {
        if (order.category === 'PLUMBING') {
          setChecklistItems([
            { id: 'c1', textRu: 'Перекрыть стояк подачи воды', textEn: 'Close water valve supply', done: false },
            { id: 'c2', textRu: 'Произвести замену уплотнителя', textEn: 'Replace leakage rubber gasket', done: false },
            { id: 'c3', textRu: 'Включить воду и протестировать', textEn: 'Open supply and verify seal', done: false }
          ]);
        } else if (order.category === 'ELECTRICAL') {
          setChecklistItems([
            { id: 'c1', textRu: 'Обесточить электрощиток помещения', textEn: 'Turn off circuit breaker room panel', done: false },
            { id: 'c2', textRu: 'Демонтировать поврежденный элемент', textEn: 'Disassemble damaged bulb/switch', done: false },
            { id: 'c3', textRu: 'Установить новый прибор', textEn: 'Install new device unit', done: false }
          ]);
        } else {
          setChecklistItems([
            { id: 'c1', textRu: 'Осмотреть место неисправности', textEn: 'Inspect the defect location', done: false },
            { id: 'c2', textRu: 'Устранить выявленный дефект', textEn: 'Fix the identified problem', done: false }
          ]);
        }
        setUsedMaterials([]);
        setPhotoBeforeUrl(order.photoUrl || null);
        setPhotoAfterUrl(null);
        setElapsedSeconds(0);
        setIsTimerRunning(order.status === 'IN_PROGRESS');
      }
    }
  }, [activeWorkOrderId]);

  // ----------------------------------------------------
  // SUBMIT HANDLERS
  // ----------------------------------------------------
  
  const handleTakeWorkOrder = (id: string) => {
    onUpdateMaintenanceRequests(
      maintenanceRequests.map(req => req.id === id ? { ...req, status: 'IN_PROGRESS' as const } : req)
    );
    setIsTimerRunning(true);
  };

  const handlePauseWorkOrder = (id: string) => {
    setIsTimerRunning(false);
  };

  const handleNeedParts = (id: string) => {
    setIsTimerRunning(false);
    alert(lang === 'RU' ? 'Заявка переведена в ожидание запчастей. Зайдите во вкладку Склад для заказа.' : 'Status changed to Waiting Parts. Go to Warehouse tab to request.');
  };

  const handleResolveWorkOrder = (id: string) => {
    setIsTimerRunning(false);
    onUpdateMaintenanceRequests(
      maintenanceRequests.map(req => req.id === id ? { ...req, status: 'RESOLVED' as const } : req)
    );
    
    const order = maintenanceRequests.find(req => req.id === id)!;
    const desc = lang === 'RU' ? order.descriptionRu || order.description : order.descriptionEn || order.description;
    setTechResolvedHistory(prev => [
      {
        id: `h-${Date.now()}`,
        roomNumber: order.roomNumber,
        category: order.category,
        descRu: desc,
        descEn: desc,
        time: new Date().toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' }),
        materials: usedMaterials.length > 0 ? usedMaterials.map(m => `${m.name} - ${m.qty} шт.`).join(', ') : (lang === 'RU' ? 'Без запчастей' : 'No materials used')
      },
      ...prev
    ]);

    alert(lang === 'RU' ? 'Заявка успешно выполнена и передана супервайзеру!' : 'Work Order completed successfully & sent to supervisor!');
    setActiveWorkOrderId(null);
  };

  const handleCreateRelatedHousekeeping = (roomNum: string) => {
    alert(
      lang === 'RU'
        ? `Отправлен запрос супервайзеру Светлане Ким на уборку комнаты #${roomNum} после ремонта.`
        : `Housekeeping alert sent to Svetlana Kim: clean up room #${roomNum} post-repair.`
    );
  };

  const handleCreateTicket = (e: React.FormEvent) => {
    e.preventDefault();
    if (!createLocation.trim() || !createDescription.trim()) return;

    const newTicket: MaintenanceRequest = {
      id: `m-${Date.now()}`,
      roomNumber: createLocation.trim(),
      category: createCategory,
      priority: createPriority,
      description: createDescription,
      descriptionEn: createDescription,
      descriptionRu: createDescription,
      blocksCleaning: createBlocks,
      status: 'CREATED',
      timestamp: new Date().toLocaleString('ru-RU', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })
    };

    onUpdateMaintenanceRequests([newTicket, ...maintenanceRequests]);
    
    if (createBlocks) {
      const room = rooms.find(r => r.roomNumber === createLocation.trim());
      if (room) {
        onUpdateRooms(rooms.map(r => r.id === room.id ? { ...r, status: 'PROBLEM' as const } : r));
      }
    }

    alert(lang === 'RU' ? 'Заявка успешно добавлена в PMS!' : 'New ticket created in PMS!');
    setCreateLocation('');
    setCreateDescription('');
    setCreateBlocks(false);
  };

  const handleWarehouseRequest = (e: React.FormEvent) => {
    e.preventDefault();
    const item = warehouseStock.find(w => w.id === selectedStockId);
    if (!item) return;

    setWarehouseRequests(prev => [
      {
        id: `req-${Date.now()}`,
        nameEn: item.nameEn,
        nameRu: item.nameRu,
        qty: requestQty,
        urgency: requestUrgency,
        status: 'PENDING',
        date: new Date().toLocaleDateString('ru-RU')
      },
      ...prev
    ]);

    alert(lang === 'RU' ? 'Запрос на запчасти отправлен на склад!' : 'Supply order sent to warehouse dispatcher!');
    setSelectedStockId('');
    setRequestQty(1);
  };

  // ----------------------------------------------------
  // RENDER SECTIONS
  // ----------------------------------------------------
  
  const getHeaderInfo = () => {
    switch (activeTab) {
      case 'TECH_DASHBOARD':
      case 'TECH_ACTIVE':
      case 'TECH_CREATE':
      case 'TECH_INVENTORY':
      case 'TECH_PROFILE':
        return null; // Header is rendered cleanly inside the screen matching reference!
      default:
        return null;
    }
  };

  const getHeaderIcon = () => {
    switch (activeTab) {
      case 'TECH_DASHBOARD': return <Wrench className="h-4.5 w-4.5 text-white" />;
      case 'TECH_ACTIVE': return <Clock className="h-4.5 w-4.5 text-white" />;
      case 'TECH_CREATE': return <PlusCircle className="h-4.5 w-4.5 text-white" />;
      case 'TECH_INVENTORY': return <Hammer className="h-4.5 w-4.5 text-white" />;
      case 'TECH_PROFILE': return <User className="h-4.5 w-4.5 text-white" />;
      default: return <Wrench className="h-4.5 w-4.5 text-white" />;
    }
  };

  const headerInfo = getHeaderInfo();

  // Filtered lists for TECH_DASHBOARD
  const filteredIssueRooms = issueRoomsList.filter(room => {
    if (techTabFilter === 'BLOCKED' && !room.isBlocked) return false;
    if (techSearchQuery.trim()) {
      const q = techSearchQuery.toLowerCase();
      const numMatch = room.roomNumber.toLowerCase().includes(q);
      const titleMatch = room.titleRu.toLowerCase().includes(q) || room.titleEn.toLowerCase().includes(q);
      const catMatch = room.categoryRu.toLowerCase().includes(q) || room.categoryEn.toLowerCase().includes(q);
      const typeMatch = room.typeRu.toLowerCase().includes(q) || room.typeEn.toLowerCase().includes(q);
      return numMatch || titleMatch || catMatch || typeMatch;
    }
    return true;
  });

  const filteredServicedRooms = servicedRoomsList.filter(room => {
    if (techTabFilter === 'BLOCKED') return false;
    if (techSearchQuery.trim()) {
      const q = techSearchQuery.toLowerCase();
      const numMatch = room.roomNumber.toLowerCase().includes(q);
      const titleMatch = room.titleRu.toLowerCase().includes(q) || room.titleEn.toLowerCase().includes(q);
      const actMatch = room.actionRu.toLowerCase().includes(q) || room.actionEn.toLowerCase().includes(q);
      const typeMatch = room.typeRu.toLowerCase().includes(q) || room.typeEn.toLowerCase().includes(q);
      return numMatch || titleMatch || actMatch || typeMatch;
    }
    return true;
  });

  return (
    <div className="flex-1 flex flex-col min-h-0 bg-[#FAF7F3] relative animate-in fade-in duration-200">
      {/* Header */}
      {headerInfo && (
        <header className="bg-[#241E1A] text-white p-3.5 pb-3 flex items-center justify-between border-b border-[#E7DFD5]/15 sticky top-0 z-30 shadow-sm shrink-0">
          {activeTab === 'TECH_PROFILE' ? (
            <>
              <div className="flex items-center gap-2.5">
                <div className="h-8 w-8 rounded-lg bg-[#FAF7F3] flex items-center justify-center shadow-inner border border-white/10 shrink-0">
                  <SollvieraLogo className="h-5 w-5" />
                </div>
                <div>
                  <h1 className="text-sm font-extrabold tracking-tight text-white font-serif leading-none pt-0.5">Sollviera</h1>
                  <span className="text-[10px] text-[#8A8177] font-medium mt-1 block">{headerInfo.title}</span>
                </div>
              </div>
              <div className="flex items-center gap-1.5">
                <button 
                  onClick={() => setShowChats(true)}
                  className="h-8 w-8 bg-white/10 hover:bg-white/20 border border-white/10 text-white rounded-lg flex items-center justify-center transition-all cursor-pointer relative"
                >
                  <MessageSquare className="h-4 w-4" />
                </button>
                <button 
                  onClick={() => setShowNotifications(true)}
                  className="h-8 w-8 bg-white/10 hover:bg-white/20 border border-white/10 text-white rounded-lg flex items-center justify-center transition-all cursor-pointer relative"
                >
                  <Bell className="h-4 w-4" />
                  <span className="absolute top-1 right-1 h-1.5 w-1.5 bg-rose-600 rounded-full animate-ping" />
                </button>
                <button 
                  onClick={() => setShowSettings(true)}
                  className="h-8 w-8 bg-white/10 hover:bg-white/20 border border-white/10 text-white rounded-lg flex items-center justify-center transition-all cursor-pointer"
                >
                  <Settings className="h-4 w-4" />
                </button>
              </div>
            </>
          ) : (
            <>
              <div className="flex items-center gap-2.5">
                <div className="h-8 w-8 rounded-lg bg-[#C2410C] flex items-center justify-center text-white shadow-inner border border-white/10 shrink-0">
                  {getHeaderIcon()}
                </div>
                <div>
                  <h1 className="text-sm font-extrabold tracking-tight text-white font-serif leading-none pt-0.5">{headerInfo.title}</h1>
                  {headerInfo.subtitle && <span className="text-[10px] text-[#8A8177] font-medium mt-1 block">{headerInfo.subtitle}</span>}
                </div>
              </div>
              <div />
            </>
          )}
        </header>
      )}

      {/* -------------------- TAB CONTENT 1: WORK ORDERS / ROOMS DASHBOARD (MATCHING REFERENCE) -------------------- */}
      {activeTab === 'TECH_DASHBOARD' && (
        <div className="flex-1 flex flex-col min-h-0 bg-[#FAF7F3] select-none font-sans">
          {/* Scrollable Container */}
          <div className="flex-1 overflow-y-auto no-scrollbar p-4.5 space-y-4">
            
            {/* Header */}
            <div className="pt-2 pb-1">
              <h1 className="font-serif font-medium text-2xl text-[#241E1A] leading-tight">
                {lang === 'RU' ? 'Номера' : 'Rooms'}
              </h1>
              <p className="text-xs font-sans font-normal text-[#8A8177] pt-1">
                <strong className="font-medium text-[#241E1A]">3</strong> {lang === 'RU' ? 'номера с неполадками' : 'rooms with issues'} · <span className="text-[#C2410C] font-normal">1 {lang === 'RU' ? 'заблокирован' : 'blocked'}</span>
              </p>
            </div>

            {/* Search Bar */}
            <div className="bg-white rounded-2xl border border-[#E5E2DD] px-3.5 py-2.5 flex items-center gap-2.5 shadow-2xs">
              <Search className="h-4 w-4 text-[#8A8177] shrink-0" />
              <input
                type="text"
                placeholder={lang === 'RU' ? 'Поиск по номеру или зоне' : 'Search by room or zone'}
                value={techSearchQuery}
                onChange={e => setTechSearchQuery(e.target.value)}
                className="w-full bg-transparent border-none text-xs font-sans font-normal text-[#241E1A] placeholder-[#8A8177] focus:outline-none"
              />
            </div>

            {/* Filter Pills */}
            <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pt-0.5 shrink-0">
              <button
                type="button"
                onClick={() => setTechTabFilter('WITH_ISSUES')}
                className={`px-4 py-2 rounded-full text-xs font-sans transition-all cursor-pointer shrink-0 flex items-center gap-1.5 ${
                  techTabFilter === 'WITH_ISSUES'
                    ? 'bg-[#241E1A] text-white font-medium shadow-xs'
                    : 'bg-white border border-[#E5E2DD] text-[#8A8177] hover:text-[#241E1A] font-normal shadow-2xs'
                }`}
              >
                <span>{lang === 'RU' ? 'С неполадками' : 'With issues'}</span>
                <span className={techTabFilter === 'WITH_ISSUES' ? 'text-white/80' : 'text-[#8A8177]'}>3</span>
              </button>

              <button
                type="button"
                onClick={() => setTechTabFilter('BLOCKED')}
                className={`px-4 py-2 rounded-full text-xs font-sans transition-all cursor-pointer shrink-0 flex items-center gap-1.5 ${
                  techTabFilter === 'BLOCKED'
                    ? 'bg-[#241E1A] text-white font-medium shadow-xs'
                    : 'bg-white border border-[#E5E2DD] text-[#8A8177] hover:text-[#241E1A] font-normal shadow-2xs'
                }`}
              >
                <span>{lang === 'RU' ? 'Заблокированные' : 'Blocked'}</span>
                <span className={techTabFilter === 'BLOCKED' ? 'text-white/80' : 'text-[#8A8177]'}>1</span>
              </button>

              <button
                type="button"
                onClick={() => setTechTabFilter('ALL')}
                className={`px-4 py-2 rounded-full text-xs font-sans transition-all cursor-pointer shrink-0 ${
                  techTabFilter === 'ALL'
                    ? 'bg-[#241E1A] text-white font-medium shadow-xs'
                    : 'bg-white border border-[#E5E2DD] text-[#8A8177] hover:text-[#241E1A] font-normal shadow-2xs'
                }`}
              >
                {lang === 'RU' ? 'Все' : 'All'}
              </button>
            </div>

            {/* Section 1: НОМЕРА */}
            {(techTabFilter === 'WITH_ISSUES' || techTabFilter === 'BLOCKED' || techTabFilter === 'ALL') && (
              <div className="space-y-2 pt-1">
                <span className="text-[10px] font-sans font-medium tracking-[0.08em] text-[#8A8177] uppercase block select-none">
                  {lang === 'RU' ? 'НОМЕРА' : 'ROOMS'}
                </span>

                <div className="bg-white rounded-[20px] border border-[#E5E2DD] divide-y divide-[#E5E2DD]/50 shadow-2xs overflow-hidden">
                  {filteredIssueRooms.map((room) => (
                    <div
                      key={room.id}
                      onClick={() => setSelectedTechRoom(room)}
                      className="p-4 flex items-center justify-between hover:bg-slate-50/70 transition-colors cursor-pointer"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className={`h-2 w-2 rounded-full ${room.dotColor} shrink-0`} />
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <h4 className="text-sm font-sans font-medium text-[#241E1A]">
                              {lang === 'RU' ? room.titleRu : room.titleEn}
                            </h4>
                            {room.isBlocked && (
                              <span className="bg-[#FAF0EF] text-[#B3261E] border border-[#F5D6D5] px-2 py-0.5 rounded text-[9px] font-sans font-medium tracking-wide uppercase leading-none">
                                {lang === 'RU' ? 'ЗАБЛОКИРОВАН' : 'BLOCKED'}
                              </span>
                            )}
                          </div>
                          <p className="text-xs font-sans font-normal text-[#8A8177] pt-0.5 truncate">
                            {lang === 'RU' 
                              ? `${room.typeRu} · ${room.floorRu} · ${room.categoryRu}`
                              : `${room.typeEn} · ${room.floorEn} · ${room.categoryEn}`}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0 pl-2">
                        <span className="text-xs font-sans font-normal text-[#8A8177]">
                          {room.requestsCount} {lang === 'RU' ? 'заявка' : 'ticket'}
                        </span>
                        <ChevronRight className="h-4 w-4 text-[#8A8177] shrink-0" />
                      </div>
                    </div>
                  ))}

                  {filteredIssueRooms.length === 0 && (
                    <div className="p-5 text-center text-xs font-sans font-normal text-[#8A8177]">
                      {lang === 'RU' ? 'Нет номеров по выбранному фильтру' : 'No rooms match this filter'}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Section 2: НЕДАВНО ОБСЛУЖЕНЫ */}
            {(techTabFilter === 'WITH_ISSUES' || techTabFilter === 'ALL') && (
              <div className="space-y-2 pt-2">
                <span className="text-[10px] font-sans font-medium tracking-[0.08em] text-[#8A8177] uppercase block select-none">
                  {lang === 'RU' ? 'НЕДАВНО ОБСЛУЖЕНЫ' : 'RECENTLY SERVICED'}
                </span>

                <div className="bg-white rounded-[20px] border border-[#E5E2DD] divide-y divide-[#E5E2DD]/50 shadow-2xs overflow-hidden">
                  {filteredServicedRooms.map((room) => (
                    <div
                      key={room.id}
                      onClick={() => setSelectedTechRoom(room)}
                      className="p-4 flex items-center justify-between hover:bg-slate-50/70 transition-colors cursor-pointer"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className={`h-2 w-2 rounded-full ${room.dotColor} shrink-0`} />
                        <div className="min-w-0">
                          <h4 className="text-sm font-sans font-medium text-[#241E1A]">
                            {lang === 'RU' ? room.titleRu : room.titleEn}
                          </h4>
                          <p className="text-xs font-sans font-normal text-[#8A8177] pt-0.5 truncate">
                            {lang === 'RU' 
                              ? `${room.typeRu} · ${room.floorRu} · ${room.actionRu}`
                              : `${room.typeEn} · ${room.floorEn} · ${room.actionEn}`}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0 pl-2">
                        <span className={`text-xs font-sans font-normal ${room.timeColor}`}>
                          {lang === 'RU' ? room.timeLabelRu : room.timeLabelEn}
                        </span>
                        <ChevronRight className="h-4 w-4 text-[#8A8177] shrink-0" />
                      </div>
                    </div>
                  ))}

                  {filteredServicedRooms.length === 0 && (
                    <div className="p-5 text-center text-xs font-sans font-normal text-[#8A8177]">
                      {lang === 'RU' ? 'Нет недавно обслуженных номеров' : 'No recently serviced rooms'}
                    </div>
                  )}
                </div>
              </div>
            )}

          </div>
        </div>
      )}

      {/* -------------------- TAB CONTENT 2: ACTIVE WORK ORDER DETAILS (MATCHING REFERENCE) -------------------- */}
      {activeTab === 'TECH_ACTIVE' && (
        <div className="flex-1 flex flex-col min-h-0 bg-[#FAF7F3] select-none font-sans relative">
          
          {/* Top Dark Hero Header (Matching Reference) */}
          <div className="bg-[#241E1A] text-white px-5 pt-3.5 pb-5.5 shrink-0 shadow-sm">
            {/* Top Row: Back button & Badge */}
            <div className="flex items-center justify-between">
              <button
                type="button"
                onClick={() => {
                  alert(lang === 'RU' ? 'Возврат к списку заявок' : 'Return to orders list');
                }}
                className="flex items-center gap-1.5 text-xs font-sans font-normal text-[#8A8177] hover:text-[#FAF7F3] transition-colors cursor-pointer"
              >
                <ChevronLeft className="h-4 w-4 text-[#8A8177]" />
                <span>{lang === 'RU' ? 'Заявки' : 'Orders'}</span>
              </button>

              <span className="bg-[#FAF0EF] text-[#B3261E] rounded-md px-2.5 py-0.5 text-[10px] font-sans font-medium tracking-wider uppercase leading-none">
                {lang === 'RU' ? 'БЛОКИРУЕТ' : 'BLOCKING'}
              </span>
            </div>

            {/* Main Info Row */}
            <div className="flex items-end justify-between mt-3.5">
              <div>
                <h1 className="text-3xl font-sans font-bold text-white tracking-tight leading-none">
                  № 315
                </h1>
                <p className="text-xs font-sans font-normal text-[#8A8177] mt-1.5">
                  {lang === 'RU' ? 'Сантехника · засор в душевой' : 'Plumbing · shower drain clog'}
                </p>
              </div>

              <div className="text-right">
                <span className="font-mono text-3xl font-bold text-[#E4762B] tracking-tight leading-none block">
                  {formatTimer(elapsedSeconds)}
                </span>
                <span className="text-xs font-sans font-normal text-[#8A8177] mt-1 block">
                  {isPaused 
                    ? (lang === 'RU' ? 'на паузе' : 'paused') 
                    : (lang === 'RU' ? 'в работе' : 'in work')}
                </span>
              </div>
            </div>
          </div>

          {/* Scrollable Body Content */}
          <div className="flex-1 overflow-y-auto no-scrollbar p-4.5 space-y-4">
            
            {/* Banner / Info Card */}
            <div className="bg-[#FAF6EE] border border-[#EFE5D8] rounded-[20px] p-4 flex items-start gap-2.5 shadow-2xs">
              <Info className="h-4 w-4 text-[#8A8177] shrink-0 mt-0.5" />
              <p className="text-xs font-sans font-normal text-[#241E1A] leading-relaxed">
                {lang === 'RU'
                  ? 'Засор в душевой кабине. Вода протекает на плитку в ванной комнате.'
                  : 'Shower cabin blockage. Water is leaking onto bathroom tiles.'}
              </p>
            </div>

            {/* Section 1: ХОД РАБОТ */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-sans font-medium tracking-[0.08em] text-[#8A8177] uppercase block select-none">
                  {lang === 'RU' ? 'ХОД РАБОТ' : 'WORKFLOW'}
                </span>
                <span className="text-xs font-sans font-normal text-[#8A8177]">
                  {checklistItems.filter(c => c.done).length} {lang === 'RU' ? 'из' : 'of'} {checklistItems.length}
                </span>
              </div>

              <div className="bg-white rounded-[20px] border border-[#E5E2DD] divide-y divide-[#E5E2DD]/50 shadow-2xs overflow-hidden">
                {checklistItems.map((item) => (
                  <div
                    key={item.id}
                    onClick={() => {
                      setChecklistItems(prev => prev.map(c => c.id === item.id ? { ...c, done: !c.done } : c));
                    }}
                    className="p-4 flex items-center gap-3.5 hover:bg-slate-50/70 transition-colors cursor-pointer"
                  >
                    <div className={`h-5 w-5 rounded-md flex items-center justify-center shrink-0 transition-colors ${
                      item.done 
                        ? 'bg-[#5B8C6E] text-white shadow-2xs' 
                        : 'border border-[#D4CECA] bg-white hover:border-[#241E1A]'
                    }`}>
                      {item.done && <Check className="h-3.5 w-3.5 stroke-[2.5]" />}
                    </div>

                    <span className={`text-xs font-sans font-normal transition-colors ${
                      item.done ? 'line-through text-[#8A8177]' : 'text-[#241E1A]'
                    }`}>
                      {lang === 'RU' ? item.textRu : item.textEn}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Section 2: ИСПОЛЬЗОВАННЫЕ ЗАПЧАСТИ */}
            <div className="space-y-2">
              <span className="text-[10px] font-sans font-medium tracking-[0.08em] text-[#8A8177] uppercase block select-none">
                {lang === 'RU' ? 'ИСПОЛЬЗОВАННЫЕ ЗАПЧАСТИ' : 'USED SPARE PARTS'}
              </span>

              <div className="bg-white rounded-[20px] border border-[#E5E2DD] divide-y divide-[#E5E2DD]/50 shadow-2xs overflow-hidden">
                {activePartsUsed.map((part) => (
                  <div key={part.id} className="p-4 flex items-center justify-between">
                    <div className="min-w-0">
                      <h4 className="text-sm font-sans font-medium text-[#241E1A]">
                        {lang === 'RU' ? part.nameRu : part.nameEn}
                      </h4>
                      <p className="text-xs font-sans font-normal text-[#8A8177] mt-0.5">
                        {part.code} · {lang === 'RU' ? part.stockRu : part.stockEn}
                      </p>
                    </div>

                    {/* Stepper */}
                    <div className="border border-[#E5E2DD] rounded-xl px-2.5 py-1.5 flex items-center gap-3 bg-white shadow-2xs">
                      <button
                        type="button"
                        onClick={() => {
                          setActivePartsUsed(prev => prev.map(p => p.id === part.id ? { ...p, qty: Math.max(1, p.qty - 1) } : p));
                        }}
                        className="text-xs text-[#8A8177] hover:text-[#241E1A] font-medium px-1 cursor-pointer select-none"
                      >
                        −
                      </button>
                      <span className="text-xs font-sans font-medium text-[#241E1A] min-w-3 text-center select-none">
                        {part.qty}
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          setActivePartsUsed(prev => prev.map(p => p.id === part.id ? { ...p, qty: p.qty + 1 } : p));
                        }}
                        className="text-xs text-[#8A8177] hover:text-[#241E1A] font-medium px-1 cursor-pointer select-none"
                      >
                        +
                      </button>
                    </div>
                  </div>
                ))}

                {/* Add Part Button */}
                <div
                  onClick={() => setShowAddPartModal(true)}
                  className="p-4 flex items-center gap-1.5 text-xs font-sans font-normal text-[#C2410C] hover:text-[#A93A0C] hover:bg-slate-50/70 transition-colors cursor-pointer"
                >
                  <Plus className="h-4 w-4 text-[#C2410C]" />
                  <span>{lang === 'RU' ? 'Добавить запчасть' : 'Add spare part'}</span>
                </div>
              </div>
            </div>

            {/* Section 3: ФОТООТЧЁТ */}
            <div className="space-y-2">
              <span className="text-[10px] font-sans font-medium tracking-[0.08em] text-[#8A8177] uppercase block select-none">
                {lang === 'RU' ? 'ФОТООТЧЁТ' : 'PHOTO REPORT'}
              </span>

              <div className="bg-white rounded-[20px] border border-[#E5E2DD] p-4 space-y-3.5 shadow-2xs">
                <div className="grid grid-cols-2 gap-3">
                  {/* Photo Before */}
                  <div
                    onClick={() => {
                      if (!photoBeforeUrl) {
                        setPhotoBeforeUrl('https://images.unsplash.com/photo-1584622650111-993a426fbf0a?w=400&auto=format&fit=crop&q=80');
                      } else {
                        setPhotoBeforeUrl(null);
                      }
                    }}
                    className="border border-dashed border-[#D4CECA] rounded-2xl p-4 flex flex-col items-center justify-center gap-1.5 text-[#8A8177] cursor-pointer hover:bg-[#FAF7F3] transition-colors relative overflow-hidden min-h-[90px]"
                  >
                    {photoBeforeUrl ? (
                      <div className="absolute inset-0">
                        <img src={photoBeforeUrl} className="w-full h-full object-cover" alt="Before" />
                        <div className="absolute inset-0 bg-black/30 flex items-center justify-center text-white text-[10px] font-sans font-medium">
                          {lang === 'RU' ? 'До ремонта ✓' : 'Before repair ✓'}
                        </div>
                      </div>
                    ) : (
                      <>
                        <Camera className="h-5 w-5 text-[#8A8177]" />
                        <span className="text-xs font-sans font-normal text-[#8A8177]">
                          {lang === 'RU' ? 'До ремонта' : 'Before repair'}
                        </span>
                      </>
                    )}
                  </div>

                  {/* Photo After */}
                  <div
                    onClick={() => {
                      if (!photoAfterUrl) {
                        setPhotoAfterUrl('https://images.unsplash.com/photo-1585670149967-b4f4da88cc9f?w=400&auto=format&fit=crop&q=80');
                      } else {
                        setPhotoAfterUrl(null);
                      }
                    }}
                    className="border border-dashed border-[#D4CECA] rounded-2xl p-4 flex flex-col items-center justify-center gap-1.5 text-[#8A8177] cursor-pointer hover:bg-[#FAF7F3] transition-colors relative overflow-hidden min-h-[90px]"
                  >
                    {photoAfterUrl ? (
                      <div className="absolute inset-0">
                        <img src={photoAfterUrl} className="w-full h-full object-cover" alt="After" />
                        <div className="absolute inset-0 bg-black/30 flex items-center justify-center text-white text-[10px] font-sans font-medium">
                          {lang === 'RU' ? 'После ремонта ✓' : 'After repair ✓'}
                        </div>
                      </div>
                    ) : (
                      <>
                        <Camera className="h-5 w-5 text-[#8A8177]" />
                        <span className="text-xs font-sans font-normal text-[#8A8177]">
                          {lang === 'RU' ? 'После ремонта' : 'After repair'}
                        </span>
                      </>
                    )}
                  </div>
                </div>

                {/* Comment field */}
                <div className="border border-[#E5E2DD] rounded-2xl p-3 bg-white">
                  <textarea
                    value={closeComment}
                    onChange={e => setCloseComment(e.target.value)}
                    placeholder={lang === 'RU' ? 'Что было сделано и что стоит проверить позже' : 'What was repaired and what to check later'}
                    rows={2}
                    className="w-full bg-transparent border-none text-xs font-sans font-normal text-[#241E1A] placeholder-[#8A8177] focus:outline-none resize-none"
                  />
                </div>
              </div>
            </div>

            {/* Section 4: ЕЩЁ */}
            <div className="space-y-2">
              <span className="text-[10px] font-sans font-medium tracking-[0.08em] text-[#8A8177] uppercase block select-none">
                {lang === 'RU' ? 'ЕЩЁ' : 'MORE'}
              </span>

              <div className="bg-white rounded-[20px] border border-[#E5E2DD] divide-y divide-[#E5E2DD]/50 shadow-2xs overflow-hidden">
                <div
                  onClick={() => {
                    setIsPaused(!isPaused);
                    setIsTimerRunning(!isTimerRunning);
                    alert(isPaused 
                      ? (lang === 'RU' ? 'Таймер возобновлен' : 'Timer resumed') 
                      : (lang === 'RU' ? 'Заявка приостановлена (нужна запчасть)' : 'Order paused (need parts)'));
                  }}
                  className="p-4 flex items-center justify-between hover:bg-slate-50/70 transition-colors cursor-pointer"
                >
                  <div className="flex items-center gap-3">
                    <Pause className="h-4 w-4 text-[#8A8177]" />
                    <span className="text-xs font-sans font-normal text-[#241E1A]">
                      {lang === 'RU' ? 'Приостановить · нужна запчасть' : 'Pause · need spare parts'}
                    </span>
                  </div>
                  <ChevronRight className="h-4 w-4 text-[#8A8177]" />
                </div>

                <div
                  onClick={() => setShowTransferModal(true)}
                  className="p-4 flex items-center justify-between hover:bg-slate-50/70 transition-colors cursor-pointer"
                >
                  <div className="flex items-center gap-3">
                    <Share2 className="h-4 w-4 text-[#8A8177]" />
                    <span className="text-xs font-sans font-normal text-[#241E1A]">
                      {lang === 'RU' ? 'Передать другому технику' : 'Transfer to another technician'}
                    </span>
                  </div>
                  <ChevronRight className="h-4 w-4 text-[#8A8177]" />
                </div>
              </div>
            </div>

          </div>

          {/* Bottom CTA Button */}
          <div className="p-4.5 bg-[#FAF7F3] border-t border-[#E5E2DD]/40 shrink-0 select-none">
            <button
              type="button"
              onClick={() => {
                // Mark as completed & unblock
                const newServiced = {
                  id: `serviced-${Date.now()}`,
                  roomNumber: '315',
                  titleRu: '№ 315',
                  titleEn: '№ 315',
                  typeRu: 'Deluxe Suite',
                  typeEn: 'Deluxe Suite',
                  floorRu: '3 этаж',
                  floorEn: 'Floor 3',
                  actionRu: 'сантехника',
                  actionEn: 'plumbing repair',
                  timeLabelRu: 'только что',
                  timeLabelEn: 'just now',
                  timeColor: 'text-[#5B8C6E]',
                  dotColor: 'bg-[#5B8C6E]',
                  materialsRu: 'Гибкая подводка 1/2, фум-лента',
                  materialsEn: 'Flexible pipe 1/2, teflon tape'
                };

                setServicedRoomsList(prev => [newServiced, ...prev]);
                setIssueRoomsList(prev => prev.filter(r => r.roomNumber !== '315'));
                setIsTimerRunning(false);
                alert(lang === 'RU' ? 'Заявка № 315 успешно завершена! Блокировка номера снята.' : 'Order #315 completed and room unblocked!');
              }}
              className="w-full bg-[#C2410C] hover:bg-[#A93A0C] active:scale-[0.99] text-white font-sans font-medium text-sm py-3.5 rounded-xl shadow-xs transition-all cursor-pointer text-center"
            >
              {lang === 'RU' ? 'Завершить и снять блокировку' : 'Complete and unblock'}
            </button>
          </div>

        </div>
      )}

      {/* -------------------- TAB CONTENT 3: CREATE NEW WORK ORDER REQUEST (MATCHING REFERENCE) -------------------- */}
      {activeTab === 'TECH_CREATE' && (
        <form onSubmit={handleCreateTicket} className="flex-1 flex flex-col min-h-0 bg-[#FAF7F3] select-none font-sans relative">
          
          {/* Scrollable Container */}
          <div className="flex-1 overflow-y-auto no-scrollbar p-4.5 space-y-4">
            
            {/* Header */}
            <div className="pt-2 pb-1 flex items-start gap-3">
              <button
                type="button"
                onClick={() => {
                  alert(lang === 'RU' ? 'Возврат назад' : 'Go back');
                }}
                className="mt-1 text-[#241E1A] hover:text-black cursor-pointer"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
              <div>
                <h1 className="font-serif font-medium text-2xl text-[#241E1A] leading-tight">
                  {lang === 'RU' ? 'Новая заявка' : 'New Ticket'}
                </h1>
                <p className="text-xs font-sans font-normal text-[#8A8177] pt-1">
                  {lang === 'RU' ? 'Регистрация неисправности' : 'Defect registration'}
                </p>
              </div>
            </div>

            {/* Main Form Container Card */}
            <div className="bg-white rounded-[24px] border border-[#E5E2DD] p-4.5 space-y-4 shadow-2xs">
              
              {/* Field 1: Локация */}
              <div>
                <label className="block text-xs font-sans font-normal text-[#8A8177] mb-1.5">
                  {lang === 'RU' ? 'Локация' : 'Location'}
                </label>
                <input
                  type="text"
                  required
                  placeholder={lang === 'RU' ? 'Номер или зона — например, 304 или Лобби' : 'Room or area — e.g. 304 or Lobby'}
                  value={createLocation}
                  onChange={e => setCreateLocation(e.target.value)}
                  className="w-full bg-white border border-[#E5E2DD] rounded-2xl p-3.5 text-xs font-sans font-normal text-[#241E1A] placeholder-[#8A8177]/70 focus:outline-none focus:border-[#241E1A] transition-colors"
                />
              </div>

              {/* Field 2: Категория */}
              <div>
                <label className="block text-xs font-sans font-normal text-[#8A8177] mb-1.5">
                  {lang === 'RU' ? 'Категория' : 'Category'}
                </label>
                <div className="relative">
                  <select
                    value={createCategory}
                    onChange={e => setCreateCategory(e.target.value as any)}
                    className="w-full bg-white border border-[#E5E2DD] rounded-2xl p-3.5 text-xs font-sans font-normal text-[#241E1A] focus:outline-none focus:border-[#241E1A] appearance-none cursor-pointer pr-10"
                  >
                    <option value="PLUMBING">{lang === 'RU' ? 'Сантехника' : 'Plumbing'}</option>
                    <option value="ELECTRICAL">{lang === 'RU' ? 'Электрика' : 'Electrical'}</option>
                    <option value="FURNITURE">{lang === 'RU' ? 'Мебель' : 'Furniture'}</option>
                    <option value="APPLIANCES">{lang === 'RU' ? 'Бытовая техника' : 'Appliances'}</option>
                    <option value="CLEANLINESS">{lang === 'RU' ? 'Чистота / Грязь' : 'Cleanliness'}</option>
                    <option value="OTHER">{lang === 'RU' ? 'Другое' : 'Other'}</option>
                  </select>
                  <ChevronDown className="h-4 w-4 text-[#8A8177] absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>
              </div>

              {/* Field 3: Приоритет */}
              <div>
                <label className="block text-xs font-sans font-normal text-[#8A8177] mb-1.5">
                  {lang === 'RU' ? 'Приоритет' : 'Priority'}
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {[
                    { id: 'LOW', labelRu: 'Низкий', labelEn: 'Low' },
                    { id: 'MEDIUM', labelRu: 'Средний', labelEn: 'Medium' },
                    { id: 'HIGH', labelRu: 'Высокий', labelEn: 'High' },
                    { id: 'CRITICAL', labelRu: 'Критич.', labelEn: 'Crit.' }
                  ].map(pri => (
                    <button
                      key={pri.id}
                      type="button"
                      onClick={() => setCreatePriority(pri.id as any)}
                      className={`py-2.5 rounded-xl text-xs font-sans transition-all cursor-pointer text-center ${
                        createPriority === pri.id
                          ? 'bg-[#241E1A] text-white font-medium shadow-xs'
                          : 'bg-white border border-[#E5E2DD] text-[#8A8177] hover:text-[#241E1A] font-normal'
                      }`}
                    >
                      {lang === 'RU' ? pri.labelRu : pri.labelEn}
                    </button>
                  ))}
                </div>
              </div>

              {/* Field 4: Блокирует эксплуатацию */}
              <div className="border-t border-[#E5E2DD]/50 pt-3.5 flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-sans font-medium text-[#241E1A]">
                    {lang === 'RU' ? 'Блокирует эксплуатацию' : 'Blocks room usage'}
                  </h4>
                  <p className="text-[10px] font-sans font-normal text-[#8A8177] mt-0.5">
                    {lang === 'RU' ? 'номер нельзя убирать и заселять' : 'room cannot be cleaned or checked-in'}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setCreateBlocks(!createBlocks)}
                  className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full p-0.5 transition-colors duration-200 ease-in-out focus:outline-none ${
                    createBlocks ? 'bg-[#C2410C]' : 'bg-[#E5E2DD]'
                  }`}
                >
                  <span className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
                    createBlocks ? 'translate-x-5' : 'translate-x-0'
                  }`} />
                </button>
              </div>

              {/* Field 5: Описание дефекта */}
              <div className="border-t border-[#E5E2DD]/50 pt-3.5">
                <textarea
                  required
                  rows={3}
                  placeholder={lang === 'RU' ? 'Опишите характер неисправности и детали для инженера' : 'Describe defect details for the engineer'}
                  value={createDescription}
                  onChange={e => setCreateDescription(e.target.value)}
                  className="w-full bg-white border border-[#E5E2DD] rounded-2xl p-3.5 text-xs font-sans font-normal text-[#241E1A] placeholder-[#8A8177]/70 focus:outline-none focus:border-[#241E1A] transition-colors resize-none"
                />
              </div>

              {/* Field 6: Сделать снимок дефекта */}
              <div className="border-t border-[#E5E2DD]/50 pt-3.5">
                <div
                  onClick={() => {
                    if (!createPhotoUrl) {
                      setCreatePhotoUrl('https://images.unsplash.com/photo-1584622650111-993a426fbf0a?w=400&auto=format&fit=crop&q=80');
                    } else {
                      setCreatePhotoUrl(null);
                    }
                  }}
                  className="flex items-center justify-between cursor-pointer hover:bg-slate-50/50 py-1 transition-colors"
                >
                  <div className="flex items-center gap-2.5">
                    <Camera className="h-4 w-4 text-[#8A8177] shrink-0" />
                    <span className="text-xs font-sans font-normal text-[#241E1A]">
                      {createPhotoUrl 
                        ? (lang === 'RU' ? 'Снимок дефекта прикреплен ✓' : 'Defect photo attached ✓')
                        : (lang === 'RU' ? 'Сделать снимок дефекта' : 'Take defect photo')}
                    </span>
                  </div>
                  <ChevronRight className="h-4 w-4 text-[#8A8177]" />
                </div>

                {createPhotoUrl && (
                  <div className="mt-2 relative rounded-xl overflow-hidden h-24 border border-[#E5E2DD]">
                    <img src={createPhotoUrl} className="w-full h-full object-cover" alt="Defect" />
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setCreatePhotoUrl(null);
                      }}
                      className="absolute top-1 right-1 bg-black/60 text-white rounded-full h-5 w-5 flex items-center justify-center text-[10px]"
                    >
                      ✕
                    </button>
                  </div>
                )}
              </div>

            </div>

            {/* Section 2: НАЗНАЧЕНИЕ */}
            <div className="space-y-2 pt-1">
              <span className="text-[10px] font-sans font-medium tracking-[0.08em] text-[#8A8177] uppercase block select-none">
                {lang === 'RU' ? 'НАЗНАЧЕНИЕ' : 'ASSIGNMENT'}
              </span>

              <div className="bg-white rounded-[20px] border border-[#E5E2DD] divide-y divide-[#E5E2DD]/50 shadow-2xs overflow-hidden">
                <div
                  onClick={() => setShowAssigneeModal(true)}
                  className="p-4 flex items-center justify-between hover:bg-slate-50/70 transition-colors cursor-pointer"
                >
                  <span className="text-xs font-sans font-normal text-[#8A8177]">
                    {lang === 'RU' ? 'Исполнитель' : 'Assignee'}
                  </span>
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-sans font-medium text-[#241E1A]">
                      {createAssignee}
                    </span>
                    <ChevronRight className="h-4 w-4 text-[#8A8177]" />
                  </div>
                </div>

                <div
                  onClick={() => setShowDeadlineModal(true)}
                  className="p-4 flex items-center justify-between hover:bg-slate-50/70 transition-colors cursor-pointer"
                >
                  <span className="text-xs font-sans font-normal text-[#8A8177]">
                    {lang === 'RU' ? 'Плановый срок' : 'Due date'}
                  </span>
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-sans font-medium text-[#241E1A]">
                      {createDeadline}
                    </span>
                    <ChevronRight className="h-4 w-4 text-[#8A8177]" />
                  </div>
                </div>
              </div>
            </div>

          </div>

          {/* Bottom CTA Button */}
          <div className="p-4.5 bg-[#FAF7F3] border-t border-[#E5E2DD]/40 shrink-0 select-none">
            <button
              type="submit"
              className="w-full bg-[#C2410C] hover:bg-[#A93A0C] active:scale-[0.99] text-white font-sans font-medium text-sm py-3.5 rounded-xl shadow-xs transition-all cursor-pointer text-center"
            >
              {lang === 'RU' ? 'Зарегистрировать' : 'Register Ticket'}
            </button>
          </div>

        </form>
      )}

      {/* -------------------- TAB CONTENT 4: INVENTORY / WAREHOUSE STOCK (MATCHING REFERENCE) -------------------- */}
      {activeTab === 'TECH_INVENTORY' && (
        <div className="flex-1 flex flex-col min-h-0 bg-[#FAF7F3] select-none font-sans relative">
          
          {/* Scrollable Content */}
          <div className="flex-1 overflow-y-auto no-scrollbar p-4.5 space-y-4">
            
            {/* Top Header */}
            <div className="pt-2 pb-1">
              <h1 className="font-serif font-medium text-2xl text-[#241E1A] leading-tight">
                {lang === 'RU' ? 'Склад' : 'Warehouse'}
              </h1>
              <p className="text-xs font-sans font-normal text-[#8A8177] pt-1">
                {lang === 'RU' ? 'Запчасти и материалы · ' : 'Parts & supplies · '}
                <span className="text-[#B3261E] font-medium">
                  {lang === 'RU' ? '2 позиции ниже нормы' : '2 items below norm'}
                </span>
              </p>
            </div>

            {/* Search Bar */}
            <div className="bg-white rounded-2xl border border-[#E5E2DD] px-3.5 py-2.5 flex items-center gap-2.5 shadow-2xs">
              <Search className="h-4 w-4 text-[#8A8177] shrink-0" />
              <input
                type="text"
                value={inventorySearchQuery}
                onChange={(e) => setInventorySearchQuery(e.target.value)}
                placeholder={lang === 'RU' ? 'Поиск по названию или ID' : 'Search by name or ID'}
                className="w-full bg-transparent text-xs font-sans font-normal text-[#241E1A] placeholder-[#8A8177] focus:outline-none"
              />
              {inventorySearchQuery && (
                <button
                  type="button"
                  onClick={() => setInventorySearchQuery('')}
                  className="text-xs text-[#8A8177] hover:text-[#241E1A]"
                >
                  ✕
                </button>
              )}
            </div>

            {/* Filter Pills */}
            <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-0.5">
              {[
                { id: 'ALL', labelRu: 'Все', labelEn: 'All' },
                { id: 'PLUMBING', labelRu: 'Сантехника', labelEn: 'Plumbing' },
                { id: 'ELECTRICAL', labelRu: 'Электрика', labelEn: 'Electrical' },
                { id: 'CONSUMABLES', labelRu: 'Расходники', labelEn: 'Consumables' }
              ].map((tab) => {
                const isActive = inventoryTabFilter === tab.id;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setInventoryTabFilter(tab.id as any)}
                    className={`px-4 py-1.5 rounded-full text-xs font-sans transition-colors cursor-pointer shrink-0 ${
                      isActive
                        ? 'bg-[#241E1A] text-white font-medium shadow-xs'
                        : 'bg-white border border-[#E5E2DD] text-[#8A8177] hover:text-[#241E1A] font-normal shadow-2xs'
                    }`}
                  >
                    {lang === 'RU' ? tab.labelRu : tab.labelEn}
                  </button>
                );
              })}
            </div>

            {/* ---------------- GROUP 1: ЭЛЕКТРИКА ---------------- */}
            {(inventoryTabFilter === 'ALL' || inventoryTabFilter === 'ELECTRICAL') && (
              <div className="space-y-2">
                <span className="text-[10px] font-sans font-medium tracking-[0.08em] text-[#8A8177] uppercase block select-none">
                  {lang === 'RU' ? 'ЭЛЕКТРИКА' : 'ELECTRICAL'}
                </span>

                <div className="bg-white rounded-[20px] border border-[#E5E2DD] divide-y divide-[#E5E2DD]/50 shadow-2xs overflow-hidden">
                  {warehouseInventory
                    .filter(item => item.category === 'ELECTRICAL')
                    .filter(item => {
                      if (!inventorySearchQuery.trim()) return true;
                      const q = inventorySearchQuery.toLowerCase();
                      return item.nameRu.toLowerCase().includes(q) || item.nameEn.toLowerCase().includes(q) || item.code.toLowerCase().includes(q);
                    })
                    .map((item) => {
                      const isLow = item.currentStock < item.normStock * 0.5;
                      const percentage = Math.min(100, Math.round((item.currentStock / item.normStock) * 100));

                      return (
                        <div key={item.id} className="p-4 space-y-3">
                          <div className="flex items-center justify-between">
                            <h4 className="text-xs font-sans font-medium text-[#241E1A]">
                              {lang === 'RU' ? item.nameRu : item.nameEn}
                            </h4>
                            <div className="text-xs font-sans">
                              <span className={`font-medium ${isLow ? 'text-[#B3261E]' : 'text-[#241E1A]'}`}>
                                {item.currentStock}
                              </span>
                              <span className="text-[#8A8177] font-normal">
                                {` / ${item.normStock}`}
                              </span>
                            </div>
                          </div>

                          <div className="flex items-center justify-between gap-3">
                            {/* Progress bar */}
                            <div className="h-1.5 flex-1 bg-[#E5E2DD]/60 rounded-full overflow-hidden">
                              <div
                                className={`h-full rounded-full transition-all duration-300 ${
                                  isLow ? 'bg-[#B3261E]' : 'bg-[#5B8C6E]'
                                }`}
                                style={{ width: `${percentage}%` }}
                              />
                            </div>

                            {/* Stepper for low stock items */}
                            {isLow && (
                              <div className="flex items-center border border-[#E5E2DD] rounded-xl px-2 py-1 bg-white shadow-2xs gap-3 shrink-0">
                                <button
                                  type="button"
                                  onClick={() => {
                                    setWarehouseInventory(prev => prev.map(inv => inv.id === item.id ? { ...inv, orderQty: Math.max(1, inv.orderQty - 1) } : inv));
                                  }}
                                  className="text-[#8A8177] hover:text-[#241E1A] text-xs font-medium px-1 cursor-pointer"
                                >
                                  −
                                </button>
                                <span className="text-xs font-sans font-medium text-[#241E1A] min-w-[12px] text-center">
                                  {item.orderQty}
                                </span>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setWarehouseInventory(prev => prev.map(inv => inv.id === item.id ? { ...inv, orderQty: inv.orderQty + 1 } : inv));
                                  }}
                                  className="text-[#8A8177] hover:text-[#241E1A] text-xs font-medium px-1 cursor-pointer"
                                >
                                  +
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                </div>
              </div>
            )}

            {/* ---------------- GROUP 2: САНТЕХНИКА ---------------- */}
            {(inventoryTabFilter === 'ALL' || inventoryTabFilter === 'PLUMBING') && (
              <div className="space-y-2">
                <span className="text-[10px] font-sans font-medium tracking-[0.08em] text-[#8A8177] uppercase block select-none">
                  {lang === 'RU' ? 'САНТЕХНИКА' : 'PLUMBING'}
                </span>

                <div className="bg-white rounded-[20px] border border-[#E5E2DD] divide-y divide-[#E5E2DD]/50 shadow-2xs overflow-hidden">
                  {warehouseInventory
                    .filter(item => item.category === 'PLUMBING')
                    .filter(item => {
                      if (!inventorySearchQuery.trim()) return true;
                      const q = inventorySearchQuery.toLowerCase();
                      return item.nameRu.toLowerCase().includes(q) || item.nameEn.toLowerCase().includes(q) || item.code.toLowerCase().includes(q);
                    })
                    .map((item) => {
                      const isLow = item.currentStock < item.normStock * 0.5;
                      const percentage = Math.min(100, Math.round((item.currentStock / item.normStock) * 100));

                      return (
                        <div key={item.id} className="p-4 space-y-3">
                          <div className="flex items-center justify-between">
                            <h4 className="text-xs font-sans font-medium text-[#241E1A]">
                              {lang === 'RU' ? item.nameRu : item.nameEn}
                            </h4>
                            <div className="text-xs font-sans">
                              <span className={`font-medium ${isLow ? 'text-[#B3261E]' : 'text-[#241E1A]'}`}>
                                {item.currentStock}
                              </span>
                              <span className="text-[#8A8177] font-normal">
                                {` / ${item.normStock}`}
                              </span>
                            </div>
                          </div>

                          <div className="flex items-center justify-between gap-3">
                            {/* Progress bar */}
                            <div className="h-1.5 flex-1 bg-[#E5E2DD]/60 rounded-full overflow-hidden">
                              <div
                                className={`h-full rounded-full transition-all duration-300 ${
                                  isLow ? 'bg-[#B3261E]' : 'bg-[#5B8C6E]'
                                }`}
                                style={{ width: `${percentage}%` }}
                              />
                            </div>

                            {/* Stepper for low stock items */}
                            {isLow && (
                              <div className="flex items-center border border-[#E5E2DD] rounded-xl px-2 py-1 bg-white shadow-2xs gap-3 shrink-0">
                                <button
                                  type="button"
                                  onClick={() => {
                                    setWarehouseInventory(prev => prev.map(inv => inv.id === item.id ? { ...inv, orderQty: Math.max(1, inv.orderQty - 1) } : inv));
                                  }}
                                  className="text-[#8A8177] hover:text-[#241E1A] text-xs font-medium px-1 cursor-pointer"
                                >
                                  −
                                </button>
                                <span className="text-xs font-sans font-medium text-[#241E1A] min-w-[12px] text-center">
                                  {item.orderQty}
                                </span>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setWarehouseInventory(prev => prev.map(inv => inv.id === item.id ? { ...inv, orderQty: inv.orderQty + 1 } : inv));
                                  }}
                                  className="text-[#8A8177] hover:text-[#241E1A] text-xs font-medium px-1 cursor-pointer"
                                >
                                  +
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                </div>
              </div>
            )}

            {/* ---------------- SECTION 3: ИСТОРИЯ ЗАКАЗОВ ---------------- */}
            <div className="space-y-2 pt-1 pb-4">
              <span className="text-[10px] font-sans font-medium tracking-[0.08em] text-[#8A8177] uppercase block select-none">
                {lang === 'RU' ? 'ИСТОРИЯ ЗАКАЗОВ' : 'ORDER HISTORY'}
              </span>

              <div className="bg-white rounded-[20px] border border-[#E5E2DD] divide-y divide-[#E5E2DD]/50 shadow-2xs overflow-hidden">
                {orderHistoryList.map((order) => (
                  <div key={order.id} className="p-4 flex items-center justify-between">
                    <div className="flex items-start gap-3">
                      <div className={`h-2 w-2 rounded-full ${order.dotColor} mt-1.5 shrink-0`} />
                      <div>
                        <h4 className="text-xs font-sans font-medium text-[#241E1A]">
                          {lang === 'RU' ? order.titleRu : order.titleEn}
                        </h4>
                        <p className="text-[10px] font-sans font-normal text-[#8A8177] mt-0.5">
                          {lang === 'RU' ? order.subRu : order.subEn}
                        </p>
                      </div>
                    </div>
                    <span className={`text-xs font-sans font-normal ${order.statusColor}`}>
                      {lang === 'RU' ? order.statusRu : order.statusEn}
                    </span>
                  </div>
                ))}
              </div>
            </div>

          </div>

          {/* Bottom Fixed CTA */}
          <div className="p-4.5 bg-[#FAF7F3] border-t border-[#E5E2DD]/40 shrink-0 select-none">
            {(() => {
              const totalOrderQty = warehouseInventory.reduce((acc, curr) => acc + (curr.orderQty || 0), 0);
              return (
                <button
                  type="button"
                  onClick={() => {
                    if (totalOrderQty === 0) {
                      alert(lang === 'RU' ? 'Все складские остатки в норме!' : 'All stock levels are normal!');
                      return;
                    }
                    const newOrder = {
                      id: `ord-${Date.now()}`,
                      titleRu: `Заказ запчастей · ${totalOrderQty} шт`,
                      titleEn: `Spare parts order · ${totalOrderQty} pcs`,
                      subRu: `Заказан сегодня · доставка со сменой`,
                      subEn: `Ordered today · shift delivery`,
                      statusRu: 'в пути',
                      statusEn: 'in transit',
                      dotColor: 'bg-[#D97706]',
                      statusColor: 'text-[#8A8177]'
                    };
                    setOrderHistoryList(prev => [newOrder, ...prev]);
                    setWarehouseInventory(prev => prev.map(item => ({ ...item, orderQty: 0 })));
                    alert(lang === 'RU' ? `Заказ на ${totalOrderQty} позиций успешно отправлен на склад!` : `Order for ${totalOrderQty} items sent to warehouse!`);
                  }}
                  className="w-full bg-[#C2410C] hover:bg-[#A93A0C] active:scale-[0.99] text-white font-sans font-medium text-sm py-3.5 rounded-xl shadow-xs transition-all cursor-pointer text-center"
                >
                  {lang === 'RU' ? `Заказать · ${totalOrderQty} позиций` : `Order · ${totalOrderQty} items`}
                </button>
              );
            })()}
          </div>

        </div>
      )}

      {/* -------------------- TAB CONTENT 5: TECHNICIAN CABINET PROFILE (MATCHING REFERENCE) -------------------- */}
      {activeTab === 'TECH_PROFILE' && (
        <div className="flex-1 flex flex-col min-h-0 bg-[#FAF7F3] select-none font-sans relative">
          
          {/* Scrollable Container */}
          <div className="flex-1 overflow-y-auto no-scrollbar p-4.5 space-y-4">
            
            {/* Top Bar with 'Профиль' in Spectral 500 and 3 Action Icons */}
            <div className="pt-2 pb-1 flex items-center justify-between">
              <h1 className="font-serif font-medium text-2xl text-[#241E1A] leading-tight">
                {lang === 'RU' ? 'Профиль' : 'Profile'}
              </h1>

              <div className="flex items-center gap-2">
                {/* Chat button with badge */}
                <button
                  type="button"
                  onClick={() => setShowChats(true)}
                  className="h-10 w-10 bg-white rounded-2xl border border-[#E5E2DD] flex items-center justify-center text-[#241E1A] hover:bg-slate-50 transition-colors shadow-2xs relative cursor-pointer"
                >
                  <MessageSquare className="h-4.5 w-4.5 text-[#241E1A]" />
                  <span className="absolute -top-1 -right-1 bg-[#C2410C] text-white text-[9px] font-sans font-bold rounded-full h-4 w-4 flex items-center justify-center shadow-xs">
                    1
                  </span>
                </button>

                {/* Notifications button with badge */}
                <button
                  type="button"
                  onClick={() => setShowNotifications(true)}
                  className="h-10 w-10 bg-white rounded-2xl border border-[#E5E2DD] flex items-center justify-center text-[#241E1A] hover:bg-slate-50 transition-colors shadow-2xs relative cursor-pointer"
                >
                  <Bell className="h-4.5 w-4.5 text-[#241E1A]" />
                  <span className="absolute -top-1 -right-1 bg-[#C2410C] text-white text-[9px] font-sans font-bold rounded-full h-4 w-4 flex items-center justify-center shadow-xs">
                    3
                  </span>
                </button>

                {/* Settings button */}
                <button
                  type="button"
                  onClick={() => setShowSettings(true)}
                  className="h-10 w-10 bg-white rounded-2xl border border-[#E5E2DD] flex items-center justify-center text-[#241E1A] hover:bg-slate-50 transition-colors shadow-2xs cursor-pointer"
                >
                  <Settings className="h-4.5 w-4.5 text-[#241E1A]" />
                </button>
              </div>
            </div>

            {/* Technician Profile Card Header */}
            <div className="flex items-center gap-3.5 pt-1">
              <div className="h-12 w-12 rounded-full bg-[#E5E0D8] text-[#8A8177] font-serif font-medium text-base flex items-center justify-center shrink-0 select-none">
                ОП
              </div>
              <div className="flex-1 min-w-0">
                <h2 className="font-serif font-medium text-xl text-[#241E1A] leading-tight">
                  {lang === 'RU' ? cleanerProfile.fullNameRu : cleanerProfile.fullName}
                </h2>
                <p className="text-xs font-sans font-normal text-[#8A8177] pt-0.5">
                  {lang === 'RU' ? 'Техник · электрика и сантехника, все этажи' : 'Technician · electrical & plumbing, all floors'}
                </p>
              </div>
            </div>

            {/* ---------------- SECTION 1: ТЕКУЩАЯ СМЕНА ---------------- */}
            <div className="space-y-2 pt-1">
              <span className="text-[10px] font-sans font-medium tracking-[0.08em] text-[#8A8177] uppercase block select-none">
                {lang === 'RU' ? 'ТЕКУЩАЯ СМЕНА' : 'CURRENT SHIFT'}
              </span>

              <div className="bg-white rounded-[24px] border border-[#E5E2DD] p-4.5 space-y-4 shadow-2xs">
                {/* Shift ID & start time */}
                <div className="flex items-center justify-between">
                  <span className="text-sm font-sans font-medium text-[#241E1A]">
                    {cleanerProfile.badgeId ? `SH-${cleanerProfile.badgeId.replace(/\D/g, '') || '4092'}` : 'SH-4092'}
                  </span>
                  <span className="text-xs font-sans font-normal text-[#8A8177]">
                    {lang === 'RU' ? '27 авг · с 08:00' : 'Aug 27 · from 08:00'}
                  </span>
                </div>

                {/* Status Toggle Pills */}
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setShiftStatus('ON_SHIFT')}
                    className={`py-2.5 rounded-xl text-xs font-sans transition-all cursor-pointer text-center ${
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
                    className={`py-2.5 rounded-xl text-xs font-sans transition-all cursor-pointer text-center ${
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
                    className={`py-2.5 rounded-xl text-xs font-sans transition-all cursor-pointer text-center ${
                      shiftStatus === 'SHIFT_ENDED'
                        ? 'bg-[#241E1A] text-white font-medium shadow-xs'
                        : 'bg-white border border-[#E5E2DD] text-[#8A8177] hover:text-[#241E1A] font-normal'
                    }`}
                  >
                    {lang === 'RU' ? 'Завершить' : 'End'}
                  </button>
                </div>

                {/* 3 Shift Metrics */}
                <div className="grid grid-cols-3 divide-x divide-[#E5E2DD]/50 pt-2 border-t border-[#E5E2DD]/50 text-center">
                  <div className="px-1">
                    <div className="text-base font-sans">
                      <span className="font-medium text-[#241E1A]">3</span>
                      <span className="text-xs font-normal text-[#8A8177]"> / 6</span>
                    </div>
                    <p className="text-[10px] font-sans font-normal text-[#8A8177] mt-0.5">
                      {lang === 'RU' ? 'заявок закрыто' : 'orders closed'}
                    </p>
                  </div>

                  <div className="px-1">
                    <div className="text-base font-sans">
                      <span className="font-medium text-[#241E1A]">32</span>
                      <span className="text-xs font-normal text-[#8A8177]"> мин</span>
                    </div>
                    <p className="text-[10px] font-sans font-normal text-[#8A8177] mt-0.5">
                      {lang === 'RU' ? 'на заявку' : 'avg per order'}
                    </p>
                  </div>

                  <div className="px-1">
                    <div className="text-base font-sans">
                      <span className="font-medium text-[#241E1A]">1</span>
                      <span className="text-xs font-normal text-[#8A8177]"> / 3</span>
                    </div>
                    <p className="text-[10px] font-sans font-normal text-[#8A8177] mt-0.5">
                      {lang === 'RU' ? 'плановое ТО' : 'planned TO'}
                    </p>
                  </div>
                </div>

              </div>
            </div>

            {/* ---------------- SECTION 2: ПЛАНОВОЕ ТО ---------------- */}
            <div className="space-y-2 pt-1">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-sans font-medium tracking-[0.08em] text-[#8A8177] uppercase block select-none">
                  {lang === 'RU' ? 'ПЛАНОВОЕ ТО' : 'PLANNED TO'}
                </span>
                <span className="text-xs font-sans font-normal text-[#8A8177]">
                  {`${regularTasks.filter(t => t.done).length} из ${regularTasks.length}`}
                </span>
              </div>

              <div className="bg-white rounded-[20px] border border-[#E5E2DD] divide-y divide-[#E5E2DD]/50 shadow-2xs overflow-hidden">
                {regularTasks.map((task) => (
                  <div
                    key={task.id}
                    onClick={() => {
                      setRegularTasks(prev => prev.map(t => t.id === task.id ? { ...t, done: !t.done } : t));
                    }}
                    className="p-4 flex items-center justify-between hover:bg-slate-50/70 transition-colors cursor-pointer"
                  >
                    <div className="flex items-center gap-3">
                      {task.done ? (
                        <div className="h-5 w-5 rounded-lg bg-[#4A7C59] text-white flex items-center justify-center shrink-0">
                          <Check className="h-3.5 w-3.5" />
                        </div>
                      ) : (
                        <div className="h-5 w-5 rounded-lg border border-[#E5E2DD] bg-white shrink-0" />
                      )}
                      <span className={`text-xs font-sans font-normal ${task.done ? 'text-[#241E1A]' : 'text-[#241E1A]'}`}>
                        {lang === 'RU' ? task.nameRu : task.nameEn}
                      </span>
                    </div>

                    <span className={`text-xs font-sans font-normal ${task.done ? 'line-through text-[#8A8177]' : 'text-[#8A8177]'}`}>
                      {task.time}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* ---------------- SECTION 3: РАБОТА ---------------- */}
            <div className="space-y-2 pt-1">
              <span className="text-[10px] font-sans font-medium tracking-[0.08em] text-[#8A8177] uppercase block select-none">
                {lang === 'RU' ? 'РАБОТА' : 'WORK'}
              </span>

              <div className="bg-white rounded-[20px] border border-[#E5E2DD] divide-y divide-[#E5E2DD]/50 shadow-2xs overflow-hidden">
                <div
                  onClick={() => setShowShiftReportModal(true)}
                  className="p-4 flex items-center justify-between hover:bg-slate-50/70 transition-colors cursor-pointer"
                >
                  <div className="flex items-center gap-3">
                    <BarChart2 className="h-4 w-4 text-[#8A8177]" />
                    <span className="text-xs font-sans font-normal text-[#241E1A]">
                      {lang === 'RU' ? 'Отчёт по смене' : 'Shift Report'}
                    </span>
                  </div>
                  <ChevronRight className="h-4 w-4 text-[#8A8177]" />
                </div>

                <div
                  onClick={() => setShowHistoryModal(true)}
                  className="p-4 flex items-center justify-between hover:bg-slate-50/70 transition-colors cursor-pointer"
                >
                  <div className="flex items-center gap-3">
                    <RotateCcw className="h-4 w-4 text-[#8A8177]" />
                    <span className="text-xs font-sans font-normal text-[#241E1A]">
                      {lang === 'RU' ? 'История заявок' : 'Work Orders History'}
                    </span>
                  </div>
                  <ChevronRight className="h-4 w-4 text-[#8A8177]" />
                </div>

                <div
                  onClick={() => setShowScheduleModal(true)}
                  className="p-4 flex items-center justify-between hover:bg-slate-50/70 transition-colors cursor-pointer"
                >
                  <div className="flex items-center gap-3">
                    <Calendar className="h-4 w-4 text-[#8A8177]" />
                    <span className="text-xs font-sans font-normal text-[#241E1A]">
                      {lang === 'RU' ? 'График планового ТО' : 'Planned TO Schedule'}
                    </span>
                  </div>
                  <ChevronRight className="h-4 w-4 text-[#8A8177]" />
                </div>
              </div>
            </div>

            {/* ---------------- SECTION 4: КОНТАКТЫ ---------------- */}
            <div className="space-y-2 pt-1 pb-6">
              <span className="text-[10px] font-sans font-medium tracking-[0.08em] text-[#8A8177] uppercase block select-none">
                {lang === 'RU' ? 'КОНТАКТЫ' : 'CONTACTS'}
              </span>

              <div className="bg-white rounded-[20px] border border-[#E5E2DD] divide-y divide-[#E5E2DD]/50 shadow-2xs overflow-hidden">
                {/* Svetlana Kim */}
                <div className="p-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="h-9 w-9 rounded-full bg-[#E5E0D8] text-[#8A8177] text-xs font-sans font-medium flex items-center justify-center shrink-0">
                      СК
                    </div>
                    <div>
                      <h4 className="text-xs font-sans font-medium text-[#241E1A]">
                        {lang === 'RU' ? 'Светлана Ким' : 'Svetlana Kim'}
                      </h4>
                      <p className="text-[10px] font-sans font-normal text-[#8A8177] mt-0.5">
                        {lang === 'RU' ? 'Супервайзер' : 'Supervisor'}
                      </p>
                    </div>
                  </div>
                  <a
                    href="tel:+79994501288"
                    className="h-8 w-8 rounded-full bg-slate-50 hover:bg-slate-100 flex items-center justify-center text-[#8A8177] hover:text-[#241E1A] transition-colors cursor-pointer"
                  >
                    <Phone className="h-4 w-4 text-[#8A8177]" />
                  </a>
                </div>

                {/* Dmitry Sokolov */}
                <div className="p-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="h-9 w-9 rounded-full bg-[#E5E0D8] text-[#8A8177] text-xs font-sans font-medium flex items-center justify-center shrink-0">
                      ДС
                    </div>
                    <div>
                      <h4 className="text-xs font-sans font-medium text-[#241E1A]">
                        {lang === 'RU' ? 'Дмитрий Соколов' : 'Dmitry Sokolov'}
                      </h4>
                      <p className="text-[10px] font-sans font-normal text-[#8A8177] mt-0.5">
                        {lang === 'RU' ? 'Инженер' : 'Engineer'}
                      </p>
                    </div>
                  </div>
                  <a
                    href="tel:+79995550199"
                    className="h-8 w-8 rounded-full bg-slate-50 hover:bg-slate-100 flex items-center justify-center text-[#8A8177] hover:text-[#241E1A] transition-colors cursor-pointer"
                  >
                    <Phone className="h-4 w-4 text-[#8A8177]" />
                  </a>
                </div>

                {/* Reception */}
                <div className="p-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="h-9 w-9 rounded-full bg-[#E5E0D8] text-[#8A8177] text-xs font-sans font-medium flex items-center justify-center shrink-0">
                      РС
                    </div>
                    <div>
                      <h4 className="text-xs font-sans font-medium text-[#241E1A]">
                        {lang === 'RU' ? 'Ресепшн' : 'Reception'}
                      </h4>
                      <p className="text-[10px] font-sans font-normal text-[#8A8177] mt-0.5">
                        {lang === 'RU' ? 'Диспетчер · доб. 100' : 'Front desk · Ext. 100'}
                      </p>
                    </div>
                  </div>
                  <a
                    href="tel:100"
                    className="h-8 w-8 rounded-full bg-slate-50 hover:bg-slate-100 flex items-center justify-center text-[#8A8177] hover:text-[#241E1A] transition-colors cursor-pointer"
                  >
                    <Phone className="h-4 w-4 text-[#8A8177]" />
                  </a>
                </div>

              </div>
            </div>

          </div>

        </div>
      )}

      {/* -------------------- SUB-SCREEN OVERLAY: SETTINGS (MATCHING REFERENCE) -------------------- */}
      {showSettings && (
        <div className="absolute inset-0 bg-[#FAF7F3] z-50 flex flex-col animate-in slide-in-from-right duration-200 select-none font-sans">
          
          {/* Scrollable Container */}
          <div className="flex-1 overflow-y-auto no-scrollbar p-4.5 space-y-4">
            
            {/* Header with Back button, Spectral 500 Title & Subtitle */}
            <div className="pt-2 pb-1 flex items-start gap-3">
              <button
                type="button"
                onClick={() => {
                  setShowSettings(false);
                  setIsEditingProfile(false);
                }}
                className="mt-1 text-[#241E1A] hover:text-black cursor-pointer"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
              <div>
                <h1 className="font-serif font-medium text-2xl text-[#241E1A] leading-tight">
                  {lang === 'RU' ? 'Настройки' : 'Settings'}
                </h1>
                <p className="text-xs font-sans font-normal text-[#8A8177] pt-1">
                  {lang === 'RU' ? 'Приложение и учётная запись' : 'App & account settings'}
                </p>
              </div>
            </div>

            {/* ---------------- SECTION 1: ПРИЛОЖЕНИЕ ---------------- */}
            <div className="space-y-2 pt-1">
              <span className="text-[10px] font-sans font-medium tracking-[0.08em] text-[#8A8177] uppercase block select-none">
                {lang === 'RU' ? 'ПРИЛОЖЕНИЕ' : 'APPLICATION'}
              </span>

              <div className="bg-white rounded-[20px] border border-[#E5E2DD] divide-y divide-[#E5E2DD]/50 shadow-2xs overflow-hidden">
                
                {/* Row 1: Язык интерфейса */}
                <div className="p-4 flex items-center justify-between">
                  <div>
                    <h4 className="text-xs font-sans font-medium text-[#241E1A]">
                      {lang === 'RU' ? 'Язык интерфейса' : 'Interface language'}
                    </h4>
                    <p className="text-[10px] font-sans font-normal text-[#8A8177] mt-0.5">
                      {lang === 'RU' ? 'Русский' : 'English'}
                    </p>
                  </div>

                  {/* Language switch pill */}
                  <div className="flex bg-[#EFECE6] p-0.5 rounded-full border border-[#E5E2DD] text-[10px] font-sans shrink-0">
                    <button
                      type="button"
                      onClick={() => onLanguageChange('RU')}
                      className={`px-3 py-1 rounded-full transition-all cursor-pointer font-medium ${
                        lang === 'RU'
                          ? 'bg-[#241E1A] text-white shadow-xs'
                          : 'text-[#8A8177] hover:text-[#241E1A]'
                      }`}
                    >
                      RU
                    </button>
                    <button
                      type="button"
                      onClick={() => onLanguageChange('EN')}
                      className={`px-3 py-1 rounded-full transition-all cursor-pointer font-medium ${
                        lang === 'EN'
                          ? 'bg-[#241E1A] text-white shadow-xs'
                          : 'text-[#8A8177] hover:text-[#241E1A]'
                      }`}
                    >
                      EN
                    </button>
                  </div>
                </div>

                {/* Row 2: Офлайн-режим */}
                <div className="p-4 flex items-center justify-between">
                  <div>
                    <h4 className="text-xs font-sans font-medium text-[#241E1A]">
                      {lang === 'RU' ? 'Офлайн-режим' : 'Offline mode'}
                    </h4>
                    <p className="text-[10px] font-sans font-normal text-[#8A8177] mt-0.5">
                      {lang === 'RU' ? 'данные синхронизируются при сети' : 'data syncs when connected'}
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={onToggleOffline}
                    className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full p-0.5 transition-colors duration-200 ease-in-out focus:outline-none ${
                      offlineMode ? 'bg-[#5B8C6E]' : 'bg-[#E5E2DD]'
                    }`}
                  >
                    <span className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
                      offlineMode ? 'translate-x-5' : 'translate-x-0'
                    }`} />
                  </button>
                </div>

                {/* Row 3: Push-уведомления */}
                <div className="p-4 flex items-center justify-between">
                  <div>
                    <h4 className="text-xs font-sans font-medium text-[#241E1A]">
                      Push-уведомления
                    </h4>
                    <p className="text-[10px] font-sans font-normal text-[#8A8177] mt-0.5">
                      {lang === 'RU' ? 'новые задачи и сообщения' : 'new tasks & messages'}
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => setPushNotifications(!pushNotifications)}
                    className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full p-0.5 transition-colors duration-200 ease-in-out focus:outline-none ${
                      pushNotifications ? 'bg-[#5B8C6E]' : 'bg-[#E5E2DD]'
                    }`}
                  >
                    <span className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
                      pushNotifications ? 'translate-x-5' : 'translate-x-0'
                    }`} />
                  </button>
                </div>

                {/* Row 4: Звук при новой задаче */}
                <div className="p-4 flex items-center justify-between">
                  <h4 className="text-xs font-sans font-medium text-[#241E1A]">
                    {lang === 'RU' ? 'Звук при новой задаче' : 'Sound alert on new task'}
                  </h4>

                  <button
                    type="button"
                    onClick={() => setSoundOnNewTask(!soundOnNewTask)}
                    className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full p-0.5 transition-colors duration-200 ease-in-out focus:outline-none ${
                      soundOnNewTask ? 'bg-[#5B8C6E]' : 'bg-[#E5E2DD]'
                    }`}
                  >
                    <span className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
                      soundOnNewTask ? 'translate-x-5' : 'translate-x-0'
                    }`} />
                  </button>
                </div>

              </div>
            </div>

            {/* ---------------- SECTION 2: СИНХРОНИЗАЦИЯ ---------------- */}
            <div className="space-y-2 pt-1">
              <span className="text-[10px] font-sans font-medium tracking-[0.08em] text-[#8A8177] uppercase block select-none">
                {lang === 'RU' ? 'СИНХРОНИЗАЦИЯ' : 'SYNCHRONIZATION'}
              </span>

              <div
                onClick={() => {
                  const nowStr = new Date().toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
                  setLastSyncTime(nowStr);
                  alert(lang === 'RU' ? `Синхронизация с сервером PMS успешно выполнена (${nowStr})` : `PMS synced successfully (${nowStr})`);
                }}
                className="bg-white rounded-[20px] border border-[#E5E2DD] p-4 shadow-2xs cursor-pointer hover:bg-slate-50/70 transition-colors flex items-center justify-between"
              >
                <div className="flex items-center gap-3">
                  <RotateCcw className="h-4 w-4 text-[#8A8177] shrink-0" />
                  <div>
                    <h4 className="text-xs font-sans font-medium text-[#241E1A]">
                      {lang === 'RU' ? 'Обновить данные' : 'Refresh data'}
                    </h4>
                    <p className="text-[10px] font-sans font-normal text-[#8A8177] mt-0.5">
                      {lang === 'RU' ? `последняя синхронизация ${lastSyncTime}` : `last sync ${lastSyncTime}`}
                    </p>
                  </div>
                </div>
                <ChevronRight className="h-4 w-4 text-[#8A8177]" />
              </div>
            </div>

            {/* ---------------- SECTION 3: УЧЁТНАЯ ЗАПИСЬ ---------------- */}
            <div className="space-y-2 pt-1">
              <span className="text-[10px] font-sans font-medium tracking-[0.08em] text-[#8A8177] uppercase block select-none">
                {lang === 'RU' ? 'УЧЁТНАЯ ЗАПИСЬ' : 'ACCOUNT'}
              </span>

              <div className="bg-white rounded-[20px] border border-[#E5E2DD] divide-y divide-[#E5E2DD]/50 shadow-2xs overflow-hidden">
                {/* Row 1: Личные данные */}
                <div
                  onClick={() => setShowPersonalDataModal(true)}
                  className="p-4 flex items-center justify-between hover:bg-slate-50/70 transition-colors cursor-pointer"
                >
                  <div className="flex items-center gap-3">
                    <User className="h-4 w-4 text-[#8A8177] shrink-0" />
                    <span className="text-xs font-sans font-medium text-[#241E1A]">
                      {lang === 'RU' ? 'Личные данные' : 'Personal info'}
                    </span>
                  </div>
                  <ChevronRight className="h-4 w-4 text-[#8A8177]" />
                </div>

                {/* Row 2: Сменить пароль */}
                <div
                  onClick={() => setShowChangePasswordModal(true)}
                  className="p-4 flex items-center justify-between hover:bg-slate-50/70 transition-colors cursor-pointer"
                >
                  <div className="flex items-center gap-3">
                    <Lock className="h-4 w-4 text-[#8A8177] shrink-0" />
                    <span className="text-xs font-sans font-medium text-[#241E1A]">
                      {lang === 'RU' ? 'Сменить пароль' : 'Change password'}
                    </span>
                  </div>
                  <ChevronRight className="h-4 w-4 text-[#8A8177]" />
                </div>

                {/* Row 3: Служба поддержки */}
                <div
                  onClick={() => setShowSupportModal(true)}
                  className="p-4 flex items-center justify-between hover:bg-slate-50/70 transition-colors cursor-pointer"
                >
                  <div className="flex items-center gap-3">
                    <Headphones className="h-4 w-4 text-[#8A8177] shrink-0" />
                    <span className="text-xs font-sans font-medium text-[#241E1A]">
                      {lang === 'RU' ? 'Служба поддержки' : 'Support service'}
                    </span>
                  </div>
                  <ChevronRight className="h-4 w-4 text-[#8A8177]" />
                </div>
              </div>
            </div>

            {/* ---------------- SECTION 4: ВЫЙТИ ИЗ АККАУНТА ---------------- */}
            <div className="pt-1 pb-6">
              <div
                onClick={onLogout}
                className="bg-white rounded-[20px] border border-[#E5E2DD] p-4 shadow-2xs cursor-pointer hover:bg-slate-50/70 transition-colors flex items-center gap-3"
              >
                <LogOut className="h-4 w-4 text-[#8A8177] shrink-0" />
                <span className="text-xs font-sans font-medium text-[#8A8177] hover:text-[#241E1A]">
                  {lang === 'RU' ? 'Выйти из аккаунта' : 'Log out'}
                </span>
              </div>
            </div>

          </div>

        </div>
      )}

      {/* -------------------- SUB-SCREEN OVERLAY: NOTIFICATIONS (MATCHING REFERENCE) -------------------- */}
      {showNotifications && (
        <div className="absolute inset-0 bg-[#FAF7F3] z-50 flex flex-col animate-in slide-in-from-right duration-200 select-none font-sans">
          
          {/* Scrollable Container */}
          <div className="flex-1 overflow-y-auto no-scrollbar p-4.5 space-y-4">
            
            {/* Header with Back button, Spectral 500 Title & Mark all read */}
            <div className="pt-2 pb-1 flex items-start gap-3">
              <button
                type="button"
                onClick={() => setShowNotifications(false)}
                className="mt-1 text-[#241E1A] hover:text-black cursor-pointer"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
              <div>
                <h1 className="font-serif font-medium text-2xl text-[#241E1A] leading-tight">
                  {lang === 'RU' ? 'Уведомления' : 'Notifications'}
                </h1>
                <div className="pt-1 flex items-center gap-1 text-xs font-sans">
                  <span className="font-medium text-[#241E1A]">
                    {`${techNotifications.filter(n => n.isUnread).length} ${lang === 'RU' ? 'новых' : 'new'}`}
                  </span>
                  <span className="text-[#8A8177]">·</span>
                  <button
                    type="button"
                    onClick={() => {
                      setTechNotifications(prev => prev.map(n => ({ ...n, isUnread: false })));
                    }}
                    className="text-[#C2410C] hover:underline cursor-pointer font-normal"
                  >
                    {lang === 'RU' ? 'отметить все прочитанными' : 'mark all as read'}
                  </button>
                </div>
              </div>
            </div>

            {/* Filter Pills */}
            <div className="flex items-center gap-2 pt-1 overflow-x-auto no-scrollbar">
              <button
                type="button"
                onClick={() => setNotifFilter('ALL')}
                className={`px-4 py-1.5 rounded-full text-xs font-sans transition-all cursor-pointer ${
                  notifFilter === 'ALL'
                    ? 'bg-[#241E1A] text-white font-medium shadow-xs'
                    : 'bg-white border border-[#E5E2DD] text-[#8A8177] hover:text-[#241E1A] font-normal'
                }`}
              >
                {lang === 'RU' ? 'Все' : 'All'}
              </button>

              <button
                type="button"
                onClick={() => setNotifFilter('REQUESTS')}
                className={`px-3.5 py-1.5 rounded-full text-xs font-sans transition-all cursor-pointer ${
                  notifFilter === 'REQUESTS'
                    ? 'bg-[#241E1A] text-white font-medium shadow-xs'
                    : 'bg-white border border-[#E5E2DD] text-[#8A8177] hover:text-[#241E1A] font-normal'
                }`}
              >
                {lang === 'RU' ? 'Заявки' : 'Requests'}
              </button>

              <button
                type="button"
                onClick={() => setNotifFilter('WAREHOUSE')}
                className={`px-3.5 py-1.5 rounded-full text-xs font-sans transition-all cursor-pointer ${
                  notifFilter === 'WAREHOUSE'
                    ? 'bg-[#241E1A] text-white font-medium shadow-xs'
                    : 'bg-white border border-[#E5E2DD] text-[#8A8177] hover:text-[#241E1A] font-normal'
                }`}
              >
                {lang === 'RU' ? 'Склад' : 'Warehouse'}
              </button>

              <button
                type="button"
                onClick={() => setNotifFilter('TO')}
                className={`px-3.5 py-1.5 rounded-full text-xs font-sans transition-all cursor-pointer ${
                  notifFilter === 'TO'
                    ? 'bg-[#241E1A] text-white font-medium shadow-xs'
                    : 'bg-white border border-[#E5E2DD] text-[#8A8177] hover:text-[#241E1A] font-normal'
                }`}
              >
                {lang === 'RU' ? 'ТО' : 'Maintenance'}
              </button>
            </div>

            {/* ---------------- SECTION 1: СЕГОДНЯ ---------------- */}
            {techNotifications.filter(n => (notifFilter === 'ALL' || n.category === notifFilter) && n.timeGroup === 'TODAY').length > 0 && (
              <div className="space-y-2 pt-1">
                <span className="text-[10px] font-sans font-medium tracking-[0.08em] text-[#8A8177] uppercase block select-none">
                  {lang === 'RU' ? 'СЕГОДНЯ' : 'TODAY'}
                </span>

                <div className="space-y-2.5">
                  {techNotifications
                    .filter(n => (notifFilter === 'ALL' || n.category === notifFilter) && n.timeGroup === 'TODAY')
                    .map((item) => (
                      <div
                        key={item.id}
                        onClick={() => {
                          setTechNotifications(prev => prev.map(n => n.id === item.id ? { ...n, isUnread: false } : n));
                        }}
                        className={`bg-white rounded-[20px] border border-[#E5E2DD] p-4 space-y-1 shadow-2xs relative cursor-pointer hover:bg-slate-50/70 transition-colors ${
                          item.type === 'CRITICAL' ? 'border-l-4 border-l-[#C2410C]' : ''
                        }`}
                      >
                        {item.isUnread && (
                          <span className="h-2 w-2 rounded-full bg-[#C2410C] absolute top-4 right-4" />
                        )}

                        <div className="flex items-center gap-2.5 pr-4">
                          {item.icon === 'ALERT' && (
                            <span className="text-[#C2410C] font-black text-sm leading-none shrink-0">!</span>
                          )}
                          {item.icon === 'WRENCH' && (
                            <Wrench className="h-3.5 w-3.5 text-[#8A8177] shrink-0" />
                          )}
                          {item.icon === 'CALENDAR' && (
                            <Calendar className="h-3.5 w-3.5 text-[#8A8177] shrink-0" />
                          )}
                          {item.icon === 'PACKAGE' && (
                            <Package className="h-3.5 w-3.5 text-[#8A8177] shrink-0" />
                          )}
                          {item.icon === 'CHECK' && (
                            <CheckCircle2 className="h-3.5 w-3.5 text-[#8A8177] shrink-0" />
                          )}
                          <h4 className="text-xs font-sans font-medium text-[#241E1A]">
                            {lang === 'RU' ? item.titleRu : item.titleEn}
                          </h4>
                        </div>

                        <p className="text-[10px] font-sans font-normal text-[#8A8177] pl-6">
                          {lang === 'RU' ? item.subRu : item.subEn}
                        </p>
                      </div>
                    ))}
                </div>
              </div>
            )}

            {/* ---------------- SECTION 2: ВЧЕРА ---------------- */}
            {techNotifications.filter(n => (notifFilter === 'ALL' || n.category === notifFilter) && n.timeGroup === 'YESTERDAY').length > 0 && (
              <div className="space-y-2 pt-1 pb-6">
                <span className="text-[10px] font-sans font-medium tracking-[0.08em] text-[#8A8177] uppercase block select-none">
                  {lang === 'RU' ? 'ВЧЕРА' : 'YESTERDAY'}
                </span>

                <div className="space-y-2.5">
                  {techNotifications
                    .filter(n => (notifFilter === 'ALL' || n.category === notifFilter) && n.timeGroup === 'YESTERDAY')
                    .map((item) => (
                      <div
                        key={item.id}
                        onClick={() => {
                          setTechNotifications(prev => prev.map(n => n.id === item.id ? { ...n, isUnread: false } : n));
                        }}
                        className="bg-white rounded-[20px] border border-[#E5E2DD] p-4 space-y-1 shadow-2xs relative cursor-pointer hover:bg-slate-50/70 transition-colors"
                      >
                        {item.isUnread && (
                          <span className="h-2 w-2 rounded-full bg-[#C2410C] absolute top-4 right-4" />
                        )}

                        <div className="flex items-center gap-2.5 pr-4">
                          <CheckCircle2 className="h-3.5 w-3.5 text-[#8A8177] shrink-0" />
                          <h4 className="text-xs font-sans font-medium text-[#241E1A]">
                            {lang === 'RU' ? item.titleRu : item.titleEn}
                          </h4>
                        </div>

                        <p className="text-[10px] font-sans font-normal text-[#8A8177] pl-6">
                          {lang === 'RU' ? item.subRu : item.subEn}
                        </p>
                      </div>
                    ))}
                </div>
              </div>
            )}

          </div>

        </div>
      )}

      {/* -------------------- SUB-SCREEN OVERLAY: CHATS (MATCHING REFERENCE) -------------------- */}
      {showChats && (
        <div className="absolute inset-0 bg-[#FAF7F3] z-50 flex flex-col animate-in slide-in-from-right duration-200 select-none font-sans">
          
          {activeChatContactId === null ? (
            /* Contact List View */
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

              {/* Chat List Container Card */}
              <div className="bg-white rounded-[24px] border border-[#E5E2DD] divide-y divide-[#E5E2DD]/50 shadow-2xs overflow-hidden pb-4">
                {chatContacts
                  .filter(c => {
                    const q = chatSearchQuery.toLowerCase();
                    return c.nameRu.toLowerCase().includes(q) || c.nameEn.toLowerCase().includes(q) || c.lastMsgRu.toLowerCase().includes(q);
                  })
                  .map(c => (
                    <div
                      key={c.id}
                      onClick={() => {
                        setActiveChatContactId(c.id);
                        setChatContacts(prev => prev.map(item => item.id === c.id ? { ...item, unreadCount: 0 } : item));
                      }}
                      className="p-4 flex items-center gap-3 hover:bg-slate-50/70 transition-colors cursor-pointer"
                    >
                      {/* Avatar with Initials */}
                      <div className="h-10 w-10 rounded-full bg-[#E5E0D8] text-[#8A8177] font-sans font-medium text-xs flex items-center justify-center shrink-0">
                        {c.initials}
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-1">
                          <div className="flex items-center gap-1.5 min-w-0">
                            <h4 className="text-xs font-sans font-medium text-[#241E1A] truncate">
                              {lang === 'RU' ? c.nameRu : c.nameEn}
                            </h4>
                            {c.isPinned && (
                              <Pin className="h-3 w-3 text-[#8A8177] shrink-0 rotate-45" />
                            )}
                            <span className="text-[10px] font-sans font-normal text-[#8A8177] truncate">
                              {lang === 'RU' ? c.tagRu : c.tagEn}
                            </span>
                          </div>

                          <div className="flex items-center gap-1.5 shrink-0">
                            <span className="text-[10px] font-sans font-normal text-[#8A8177]">
                              {c.time}
                            </span>
                            {c.unreadCount > 0 && (
                              <span className="h-4.5 w-4.5 rounded-full bg-[#C2410C] text-white text-[10px] font-sans font-medium flex items-center justify-center">
                                {c.unreadCount}
                              </span>
                            )}
                          </div>
                        </div>

                        <p className="text-xs font-sans font-normal text-[#8A8177] mt-0.5 truncate">
                          {lang === 'RU' ? c.lastMsgRu : c.lastMsgEn}
                        </p>
                      </div>
                    </div>
                  ))}
              </div>

            </div>
          ) : (
            /* Active Conversation View */
            <div className="flex-1 flex flex-col min-h-0 bg-[#FAF7F3]">
              
              {/* Active Chat Top Header */}
              <div className="p-4 bg-white border-b border-[#E5E2DD] flex items-center justify-between shrink-0 shadow-2xs">
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setActiveChatContactId(null)}
                    className="text-[#241E1A] hover:text-black cursor-pointer"
                  >
                    <ChevronLeft className="h-5 w-5" />
                  </button>
                  <div className="h-9 w-9 rounded-full bg-[#E5E0D8] text-[#8A8177] font-sans font-medium text-xs flex items-center justify-center shrink-0">
                    {chatContacts.find(c => c.id === activeChatContactId)?.initials || 'ТС'}
                  </div>
                  <div>
                    <h3 className="font-serif font-medium text-sm text-[#241E1A] leading-tight">
                      {lang === 'RU'
                        ? chatContacts.find(c => c.id === activeChatContactId)?.nameRu
                        : chatContacts.find(c => c.id === activeChatContactId)?.nameEn}
                    </h3>
                    <span className="text-[10px] font-sans font-normal text-[#8A8177] mt-0.5 block">
                      {lang === 'RU'
                        ? chatContacts.find(c => c.id === activeChatContactId)?.tagRu
                        : chatContacts.find(c => c.id === activeChatContactId)?.tagEn}
                    </span>
                  </div>
                </div>
              </div>

              {/* Message List */}
              <div className="flex-1 overflow-y-auto no-scrollbar p-4 space-y-3">
                {(chatMessages[activeChatContactId] || []).map((msg, idx) => {
                  const isMe = msg.sender === 'SENDER';
                  return (
                    <div key={idx} className={`flex ${isMe ? 'justify-end' : 'justify-start'} animate-in fade-in`}>
                      <div className={`max-w-[78%] rounded-[18px] p-3 shadow-2xs text-xs font-sans font-normal ${
                        isMe
                          ? 'bg-[#241E1A] text-white rounded-br-xs'
                          : 'bg-white border border-[#E5E2DD] text-[#241E1A] rounded-bl-xs'
                      }`}>
                        <p className="leading-relaxed break-words">{msg.text}</p>
                        <span className={`block text-[9px] mt-1 text-right font-sans ${isMe ? 'text-white/60' : 'text-[#8A8177]'}`}>
                          {msg.time}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Chat Input Bar */}
              <div className="p-3 border-t border-[#E5E2DD] bg-white flex items-center gap-2">
                <input
                  type="text"
                  placeholder={lang === 'RU' ? 'Сообщение...' : 'Type message...'}
                  value={typedMessage}
                  onChange={(e) => setTypedMessage(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      if (typedMessage.trim()) {
                        const text = typedMessage.trim();
                        const time = new Date().toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
                        setChatMessages(prev => ({
                          ...prev,
                          [activeChatContactId]: [...(prev[activeChatContactId] || []), { sender: 'SENDER', text, time }]
                        }));
                        setTypedMessage('');
                        setChatContacts(prev => prev.map(item => item.id === activeChatContactId ? { ...item, lastMsgRu: text, lastMsgEn: text, time } : item));
                        setTimeout(() => {
                          const repTime = new Date().toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
                          const repText = lang === 'RU' ? 'Принято, спасибо!' : 'Got it, thanks!';
                          setChatMessages(prev => ({
                            ...prev,
                            [activeChatContactId]: [...(prev[activeChatContactId] || []), { sender: 'RECEIVER', text: repText, time: repTime }]
                          }));
                          setChatContacts(prev => prev.map(item => item.id === activeChatContactId ? { ...item, lastMsgRu: repText, lastMsgEn: repText, time: repTime } : item));
                        }, 1000);
                      }
                    }
                  }}
                  className="flex-1 bg-[#FAF7F3] border border-[#E5E2DD] rounded-xl px-3.5 py-2.5 text-xs text-[#241E1A] placeholder-[#8A8177] focus:outline-none focus:border-[#241E1A] font-sans font-normal"
                />
                <button
                  type="button"
                  onClick={() => {
                    if (typedMessage.trim()) {
                      const text = typedMessage.trim();
                      const time = new Date().toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
                      setChatMessages(prev => ({
                        ...prev,
                        [activeChatContactId]: [...(prev[activeChatContactId] || []), { sender: 'SENDER', text, time }]
                      }));
                      setTypedMessage('');
                      setChatContacts(prev => prev.map(item => item.id === activeChatContactId ? { ...item, lastMsgRu: text, lastMsgEn: text, time } : item));
                      setTimeout(() => {
                        const repTime = new Date().toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
                        const repText = lang === 'RU' ? 'Принято, спасибо!' : 'Got it, thanks!';
                        setChatMessages(prev => ({
                          ...prev,
                          [activeChatContactId]: [...(prev[activeChatContactId] || []), { sender: 'RECEIVER', text: repText, time: repTime }]
                        }));
                        setChatContacts(prev => prev.map(item => item.id === activeChatContactId ? { ...item, lastMsgRu: repText, lastMsgEn: repText, time: repTime } : item));
                      }, 1000);
                    }
                  }}
                  className="bg-[#241E1A] hover:bg-black text-white p-2.5 rounded-xl transition-all cursor-pointer flex items-center justify-center shrink-0 shadow-xs"
                >
                  <Send className="h-4 w-4" />
                </button>
              </div>

            </div>
          )}

        </div>
      )}

      {/* -------------------- SUB-SCREEN OVERLAY: PROFILE EDIT BACKDROP MODAL -------------------- */}
      {isEditingProfile && (
        <div className="absolute inset-0 bg-black/60 z-[60] flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-sm p-5 shadow-2xl border border-[#E5E2DD] space-y-4 animate-in fade-in zoom-in duration-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <h3 className="text-xs font-black text-[#2B2B2B] uppercase tracking-wide">{lang === 'RU' ? 'Редактировать профиль' : 'Edit Profile'}</h3>
              <button
                onClick={() => setIsEditingProfile(false)}
                className="h-6 w-6 rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 flex items-center justify-center font-bold text-xs cursor-pointer"
              >
                ×
              </button>
            </div>

            <div className="space-y-3.5 text-xs font-semibold">
              <div className="flex flex-col items-center gap-2">
                <img src={editAvatarUrl} className="h-16 w-16 rounded-full object-cover border-2 border-[#C2410C] shadow-md" alt="" />
                <button
                  type="button"
                  onClick={() => alert('Photo upload mocked')}
                  className="px-3 py-1.5 bg-[#FAF7F3] border border-[#E5E2DD] text-[#2B2B2B] text-[10px] font-bold rounded-lg cursor-pointer"
                >
                  {lang === 'RU' ? 'Изменить фото' : 'Change photo'}
                </button>
              </div>

              <div>
                <label className="block text-[9px] text-[#8A8177] uppercase font-bold mb-0.5">{lang === 'RU' ? 'ФИО' : 'Full Name'}</label>
                <input
                  type="text"
                  value={lang === 'RU' ? editFullNameRu : editFullName}
                  onChange={(e) => {
                    if (lang === 'RU') setEditFullNameRu(e.target.value);
                    else setEditFullName(e.target.value);
                  }}
                  className="w-full bg-[#FAF7F3] border border-[#E5E2DD] rounded-lg px-2.5 py-1.5 text-[#2B2B2B] focus:outline-none"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsEditingProfile(false)}
                  className="flex-1 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl border border-slate-200 cursor-pointer text-xs"
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
                      avatarUrl: editAvatarUrl
                    });
                    setIsEditingProfile(false);
                  }}
                  className="flex-1 py-2 bg-[#C2410C] hover:bg-[#A93A0C] text-white font-bold rounded-xl shadow-xs cursor-pointer text-xs"
                >
                  {lang === 'RU' ? 'Сохранить' : 'Save'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      {/* -------------------- SUB-SCREEN OVERLAY: ROOM DEFECT DETAILS MODAL -------------------- */}
      {selectedTechRoom && (
        <div className="absolute inset-0 bg-[#FAF7F3] z-50 flex flex-col animate-in slide-in-from-right duration-200 select-none font-sans">
          {/* Header */}
          <div className="p-4 flex items-center justify-between shrink-0">
            <button 
              onClick={() => setSelectedTechRoom(null)}
              className="h-9 w-9 rounded-full bg-white border border-[#E5E2DD] text-[#241E1A] hover:bg-slate-50 flex items-center justify-center transition-colors cursor-pointer shadow-2xs"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
            <div className="w-9" />
          </div>

          <div className="px-4 pb-2">
            <div className="flex items-center gap-2">
              <h1 className="font-serif font-medium text-2xl text-[#241E1A] leading-tight">
                {lang === 'RU' ? selectedTechRoom.titleRu : selectedTechRoom.titleEn}
              </h1>
              {selectedTechRoom.isBlocked && (
                <span className="bg-[#FAF0EF] text-[#B3261E] border border-[#F5D6D5] px-2 py-0.5 rounded text-[9px] font-sans font-medium tracking-wide uppercase leading-none">
                  {lang === 'RU' ? 'ЗАБЛОКИРОВАН' : 'BLOCKED'}
                </span>
              )}
            </div>
            <p className="text-xs font-sans font-normal text-[#8A8177] pt-0.5">
              {lang === 'RU' 
                ? `${selectedTechRoom.typeRu} · ${selectedTechRoom.floorRu}` 
                : `${selectedTechRoom.typeEn} · ${selectedTechRoom.floorEn}`}
            </p>
          </div>

          {/* Scrollable Content */}
          <div className="flex-1 p-4 pt-2 space-y-4 overflow-y-auto no-scrollbar">
            
            {/* Section: ИНФОРМАЦИЯ О НЕПОЛАДКЕ / ОБСЛУЖИВАНИИ */}
            <div className="space-y-2">
              <span className="text-[10px] font-sans font-medium tracking-[0.08em] text-[#8A8177] uppercase block">
                {lang === 'RU' ? 'ИНФОРМАЦИЯ' : 'DETAILS'}
              </span>

              <div className="bg-white rounded-[20px] border border-[#E5E2DD] divide-y divide-[#E5E2DD]/50 shadow-2xs overflow-hidden">
                <div className="p-4 flex items-center justify-between">
                  <span className="text-xs font-sans font-normal text-[#8A8177]">
                    {lang === 'RU' ? 'Категория' : 'Category'}
                  </span>
                  <span className="text-xs font-sans font-medium text-[#241E1A]">
                    {selectedTechRoom.categoryRu || selectedTechRoom.actionRu || (lang === 'RU' ? 'Техслужба' : 'Maintenance')}
                  </span>
                </div>

                <div className="p-4 flex items-center justify-between">
                  <span className="text-xs font-sans font-normal text-[#8A8177]">
                    {lang === 'RU' ? 'Статус' : 'Status'}
                  </span>
                  <span className="text-xs font-sans font-medium text-[#241E1A] flex items-center gap-1.5">
                    <div className={`h-2 w-2 rounded-full ${selectedTechRoom.dotColor}`} />
                    <span>
                      {selectedTechRoom.isBlocked
                        ? (lang === 'RU' ? 'Заблокирован для заселения' : 'Blocked for check-in')
                        : selectedTechRoom.actionRu
                        ? (lang === 'RU' ? 'Обслужен' : 'Serviced')
                        : (lang === 'RU' ? 'Требуется ремонт' : 'Needs repair')}
                    </span>
                  </span>
                </div>

                {selectedTechRoom.priority && (
                  <div className="p-4 flex items-center justify-between">
                    <span className="text-xs font-sans font-normal text-[#8A8177]">
                      {lang === 'RU' ? 'Приоритет' : 'Priority'}
                    </span>
                    <span className="text-xs font-sans font-medium text-[#241E1A]">
                      {selectedTechRoom.priority === 'HIGH' 
                        ? (lang === 'RU' ? 'Высокий' : 'High') 
                        : (lang === 'RU' ? 'Стандартный' : 'Standard')}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Section: ОПИСАНИЕ */}
            <div className="space-y-2">
              <span className="text-[10px] font-sans font-medium tracking-[0.08em] text-[#8A8177] uppercase block">
                {lang === 'RU' ? 'ОПИСАНИЕ РАБОТ' : 'DESCRIPTION'}
              </span>

              <div className="bg-white rounded-[20px] border border-[#E5E2DD] p-4 shadow-2xs">
                <p className="text-xs font-sans font-normal text-[#241E1A] leading-relaxed">
                  {lang === 'RU'
                    ? (selectedTechRoom.description || selectedTechRoom.materialsRu || 'Плановое обслуживание и устранение дефектов.')
                    : (selectedTechRoom.descriptionEn || selectedTechRoom.materialsEn || 'Routine maintenance and defect correction.')}
                </p>
              </div>
            </div>

            {/* Section: ЗАПЧАСТИ (if serviced) */}
            {selectedTechRoom.materialsRu && (
              <div className="space-y-2">
                <span className="text-[10px] font-sans font-medium tracking-[0.08em] text-[#8A8177] uppercase block">
                  {lang === 'RU' ? 'ИСПОЛЬЗОВАННЫЕ МАТЕРИАЛЫ' : 'USED MATERIALS'}
                </span>

                <div className="bg-white rounded-[20px] border border-[#E5E2DD] p-4 shadow-2xs">
                  <p className="text-xs font-sans font-normal text-[#241E1A]">
                    {lang === 'RU' ? selectedTechRoom.materialsRu : selectedTechRoom.materialsEn}
                  </p>
                </div>
              </div>
            )}

          </div>

          {/* Bottom Actions */}
          <div className="p-4.5 bg-[#FAF7F3] border-t border-[#E5E2DD]/30 shrink-0 select-none">
            {selectedTechRoom.requestsCount ? (
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => {
                    // Find or create request to work on
                    setActiveWorkOrderId(selectedTechRoom.id);
                    setIsTimerRunning(true);
                    setSelectedTechRoom(null);
                    alert(lang === 'RU' ? `Заявка по номеру ${selectedTechRoom.roomNumber} взята в работу!` : `Work order for ${selectedTechRoom.roomNumber} started!`);
                  }}
                  className="w-full bg-[#241E1A] hover:bg-black text-white font-sans font-medium text-xs py-3 rounded-xl shadow-xs transition-colors cursor-pointer text-center"
                >
                  {lang === 'RU' ? 'Взять в работу' : 'Take order'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    // Mark as resolved and move to recently serviced
                    const newServiced = {
                      id: `serviced-${Date.now()}`,
                      roomNumber: selectedTechRoom.roomNumber,
                      titleRu: selectedTechRoom.titleRu,
                      titleEn: selectedTechRoom.titleEn,
                      typeRu: selectedTechRoom.typeRu,
                      typeEn: selectedTechRoom.typeEn,
                      floorRu: selectedTechRoom.floorRu,
                      floorEn: selectedTechRoom.floorEn,
                      actionRu: selectedTechRoom.categoryRu || 'ремонт',
                      actionEn: selectedTechRoom.categoryEn || 'repair',
                      timeLabelRu: 'только что',
                      timeLabelEn: 'just now',
                      timeColor: 'text-[#5B8C6E]',
                      dotColor: 'bg-[#5B8C6E]',
                      materialsRu: 'Ремонт завершен',
                      materialsEn: 'Repair completed'
                    };

                    setServicedRoomsList(prev => [newServiced, ...prev]);
                    setIssueRoomsList(prev => prev.filter(r => r.id !== selectedTechRoom.id));
                    setSelectedTechRoom(null);
                    alert(lang === 'RU' ? 'Заявка успешно выполнена и переведена в обслуженные!' : 'Task marked as resolved!');
                  }}
                  className="w-full bg-[#009b72] hover:bg-[#008460] text-white font-sans font-medium text-xs py-3 rounded-xl shadow-xs transition-colors cursor-pointer text-center flex items-center justify-center gap-1.5"
                >
                  <Check className="h-4 w-4 text-white" />
                  <span>{lang === 'RU' ? 'Выполнено' : 'Resolved'}</span>
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setSelectedTechRoom(null)}
                className="w-full bg-[#241E1A] hover:bg-black text-white font-sans font-medium text-xs py-3 rounded-xl shadow-xs transition-colors cursor-pointer text-center"
              >
                {lang === 'RU' ? 'Закрыть' : 'Close'}
              </button>
            )}
          </div>
        </div>
      )}

      {/* -------------------- MODAL: ADD SPARE PART FROM WAREHOUSE -------------------- */}
      {showAddPartModal && (
        <div className="absolute inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-200">
          <div className="bg-[#FAF7F3] rounded-t-[24px] sm:rounded-[24px] w-full max-w-sm p-4.5 space-y-4 border border-[#E5E2DD] shadow-2xl max-h-[80vh] flex flex-col">
            <div className="flex items-center justify-between pb-1">
              <h3 className="font-serif font-medium text-lg text-[#241E1A]">
                {lang === 'RU' ? 'Добавить запчасть' : 'Add Spare Part'}
              </h3>
              <button
                type="button"
                onClick={() => setShowAddPartModal(false)}
                className="h-7 w-7 rounded-full bg-white border border-[#E5E2DD] text-[#8A8177] hover:text-[#241E1A] flex items-center justify-center cursor-pointer text-xs"
              >
                ✕
              </button>
            </div>

            <div className="flex-1 overflow-y-auto no-scrollbar space-y-2">
              <div className="bg-white rounded-[20px] border border-[#E5E2DD] divide-y divide-[#E5E2DD]/50 shadow-2xs overflow-hidden">
                {warehouseStock.map((w) => (
                  <div
                    key={w.id}
                    onClick={() => {
                      const exists = activePartsUsed.find(p => p.nameRu === w.nameRu || p.code === w.id);
                      if (exists) {
                        setActivePartsUsed(prev => prev.map(p => p.id === exists.id ? { ...p, qty: p.qty + 1 } : p));
                      } else {
                        setActivePartsUsed(prev => [
                          ...prev,
                          {
                            id: `part-${Date.now()}`,
                            code: w.id.toUpperCase(),
                            nameRu: w.nameRu,
                            nameEn: w.nameEn,
                            stockRu: `на складе ${w.stock} ${w.unit}`,
                            stockEn: `stock ${w.stock} ${w.unit}`,
                            qty: 1
                          }
                        ]);
                      }
                      setShowAddPartModal(false);
                    }}
                    className="p-3.5 flex items-center justify-between hover:bg-slate-50/70 transition-colors cursor-pointer"
                  >
                    <div>
                      <h5 className="text-xs font-sans font-medium text-[#241E1A]">{lang === 'RU' ? w.nameRu : w.nameEn}</h5>
                      <span className="text-[10px] text-[#8A8177] font-normal">{w.id.toUpperCase()} · {w.stock} {w.unit}</span>
                    </div>
                    <Plus className="h-4 w-4 text-[#C2410C]" />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* -------------------- MODAL: TRANSFER ORDER TO TECHNICIAN -------------------- */}
      {showTransferModal && (
        <div className="absolute inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-200">
          <div className="bg-[#FAF7F3] rounded-t-[24px] sm:rounded-[24px] w-full max-w-sm p-4.5 space-y-4 border border-[#E5E2DD] shadow-2xl max-h-[80vh] flex flex-col">
            <div className="flex items-center justify-between pb-1">
              <h3 className="font-serif font-medium text-lg text-[#241E1A]">
                {lang === 'RU' ? 'Передать заявку' : 'Transfer Work Order'}
              </h3>
              <button
                type="button"
                onClick={() => setShowTransferModal(false)}
                className="h-7 w-7 rounded-full bg-white border border-[#E5E2DD] text-[#8A8177] hover:text-[#241E1A] flex items-center justify-center cursor-pointer text-xs"
              >
                ✕
              </button>
            </div>

            <div className="space-y-2">
              <span className="text-[10px] font-sans font-medium tracking-[0.08em] text-[#8A8177] uppercase block select-none">
                {lang === 'RU' ? 'ВЫБЕРИТЕ СПЕЦИАЛИСТА' : 'SELECT TECHNICIAN'}
              </span>

              <div className="bg-white rounded-[20px] border border-[#E5E2DD] divide-y divide-[#E5E2DD]/50 shadow-2xs overflow-hidden">
                {[
                  { id: 't1', name: 'Дмитрий Соколов', role: 'Дежурный инженер (на смене)', status: 'online' },
                  { id: 't2', name: 'Алексей Смирнов', role: 'Слесарь-сантехник (свободен)', status: 'online' },
                  { id: 't3', name: 'Сергей Иванов', role: 'Электромонтер (на смене)', status: 'online' }
                ].map((tech) => (
                  <div
                    key={tech.id}
                    onClick={() => {
                      setShowTransferModal(false);
                      setIsTimerRunning(false);
                      setIsPaused(true);
                      alert(lang === 'RU' ? `Заявка № 315 успешно передана технику: ${tech.name}` : `Order #315 transferred to ${tech.name}`);
                    }}
                    className="p-3.5 flex items-center justify-between hover:bg-slate-50/70 transition-colors cursor-pointer"
                  >
                    <div>
                      <h5 className="text-xs font-sans font-medium text-[#241E1A]">{tech.name}</h5>
                      <span className="text-[10px] text-[#8A8177] font-normal">{tech.role}</span>
                    </div>
                    <ChevronRight className="h-4 w-4 text-[#8A8177]" />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* -------------------- MODAL: CHOOSE ASSIGNEE FOR NEW TICKET -------------------- */}
      {showAssigneeModal && (
        <div className="absolute inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-200">
          <div className="bg-[#FAF7F3] rounded-t-[24px] sm:rounded-[24px] w-full max-w-sm p-4.5 space-y-4 border border-[#E5E2DD] shadow-2xl max-h-[80vh] flex flex-col">
            <div className="flex items-center justify-between pb-1">
              <h3 className="font-serif font-medium text-lg text-[#241E1A]">
                {lang === 'RU' ? 'Назначить исполнителя' : 'Assign Specialist'}
              </h3>
              <button
                type="button"
                onClick={() => setShowAssigneeModal(false)}
                className="h-7 w-7 rounded-full bg-white border border-[#E5E2DD] text-[#8A8177] hover:text-[#241E1A] flex items-center justify-center cursor-pointer text-xs"
              >
                ✕
              </button>
            </div>

            <div className="space-y-2">
              <div className="bg-white rounded-[20px] border border-[#E5E2DD] divide-y divide-[#E5E2DD]/50 shadow-2xs overflow-hidden">
                {[
                  { id: 'a1', label: 'Взять себе', sub: 'Олег Петров (Вы)' },
                  { id: 'a2', label: 'Дмитрий Соколов', sub: 'Дежурный инженер' },
                  { id: 'a3', label: 'Алексей Смирнов', sub: 'Слесарь-сантехник' },
                  { id: 'a4', label: 'В общую очередь', sub: 'Свободный специалист' }
                ].map((item) => (
                  <div
                    key={item.id}
                    onClick={() => {
                      setCreateAssignee(item.label);
                      setShowAssigneeModal(false);
                    }}
                    className="p-3.5 flex items-center justify-between hover:bg-slate-50/70 transition-colors cursor-pointer"
                  >
                    <div>
                      <h5 className="text-xs font-sans font-medium text-[#241E1A]">{item.label}</h5>
                      <span className="text-[10px] text-[#8A8177] font-normal">{item.sub}</span>
                    </div>
                    {createAssignee === item.label ? (
                      <Check className="h-4 w-4 text-[#C2410C]" />
                    ) : (
                      <ChevronRight className="h-4 w-4 text-[#8A8177]" />
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* -------------------- MODAL: CHOOSE DEADLINE FOR NEW TICKET -------------------- */}
      {showDeadlineModal && (
        <div className="absolute inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-200">
          <div className="bg-[#FAF7F3] rounded-t-[24px] sm:rounded-[24px] w-full max-w-sm p-4.5 space-y-4 border border-[#E5E2DD] shadow-2xl max-h-[80vh] flex flex-col">
            <div className="flex items-center justify-between pb-1">
              <h3 className="font-serif font-medium text-lg text-[#241E1A]">
                {lang === 'RU' ? 'Плановый срок' : 'Due Date'}
              </h3>
              <button
                type="button"
                onClick={() => setShowDeadlineModal(false)}
                className="h-7 w-7 rounded-full bg-white border border-[#E5E2DD] text-[#8A8177] hover:text-[#241E1A] flex items-center justify-center cursor-pointer text-xs"
              >
                ✕
              </button>
            </div>

            <div className="space-y-2">
              <div className="bg-white rounded-[20px] border border-[#E5E2DD] divide-y divide-[#E5E2DD]/50 shadow-2xs overflow-hidden">
                {[
                  'Срочно (в течение 30 мин)',
                  'Сегодня, до 14:00',
                  'Сегодня, до 18:00',
                  'Сегодня, до конца смены',
                  'Завтра, до 12:00'
                ].map((term) => (
                  <div
                    key={term}
                    onClick={() => {
                      setCreateDeadline(term);
                      setShowDeadlineModal(false);
                    }}
                    className="p-3.5 flex items-center justify-between hover:bg-slate-50/70 transition-colors cursor-pointer"
                  >
                    <span className="text-xs font-sans font-medium text-[#241E1A]">{term}</span>
                    {createDeadline === term ? (
                      <Check className="h-4 w-4 text-[#C2410C]" />
                    ) : (
                      <ChevronRight className="h-4 w-4 text-[#8A8177]" />
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* -------------------- MODAL: SHIFT REPORT -------------------- */}
      {showShiftReportModal && (
        <div className="absolute inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-200">
          <div className="bg-[#FAF7F3] rounded-t-[24px] sm:rounded-[24px] w-full max-w-sm p-4.5 space-y-4 border border-[#E5E2DD] shadow-2xl max-h-[80vh] flex flex-col">
            <div className="flex items-center justify-between pb-1">
              <h3 className="font-serif font-medium text-lg text-[#241E1A]">
                {lang === 'RU' ? 'Отчёт по смене' : 'Shift Report'}
              </h3>
              <button
                type="button"
                onClick={() => setShowShiftReportModal(false)}
                className="h-7 w-7 rounded-full bg-white border border-[#E5E2DD] text-[#8A8177] hover:text-[#241E1A] flex items-center justify-center cursor-pointer text-xs"
              >
                ✕
              </button>
            </div>

            <div className="flex-1 overflow-y-auto no-scrollbar space-y-3">
              <div className="bg-white rounded-[20px] border border-[#E5E2DD] p-4 space-y-3 shadow-2xs">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-[#8A8177]">{lang === 'RU' ? 'Смена' : 'Shift ID'}</span>
                  <span className="font-medium text-[#241E1A]">SH-4092 (27 авг)</span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-[#8A8177]">{lang === 'RU' ? 'Закрыто заявок' : 'Closed orders'}</span>
                  <span className="font-medium text-[#241E1A]">3 из 6</span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-[#8A8177]">{lang === 'RU' ? 'Среднее время' : 'Avg duration'}</span>
                  <span className="font-medium text-[#241E1A]">32 мин</span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-[#8A8177]">{lang === 'RU' ? 'Плановое ТО' : 'Planned TO'}</span>
                  <span className="font-medium text-[#241E1A]">1 из 3 выполнено</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* -------------------- MODAL: WORK ORDERS HISTORY -------------------- */}
      {showHistoryModal && (
        <div className="absolute inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-200">
          <div className="bg-[#FAF7F3] rounded-t-[24px] sm:rounded-[24px] w-full max-w-sm p-4.5 space-y-4 border border-[#E5E2DD] shadow-2xl max-h-[80vh] flex flex-col">
            <div className="flex items-center justify-between pb-1">
              <h3 className="font-serif font-medium text-lg text-[#241E1A]">
                {lang === 'RU' ? 'История заявок' : 'Work Orders History'}
              </h3>
              <button
                type="button"
                onClick={() => setShowHistoryModal(false)}
                className="h-7 w-7 rounded-full bg-white border border-[#E5E2DD] text-[#8A8177] hover:text-[#241E1A] flex items-center justify-center cursor-pointer text-xs"
              >
                ✕
              </button>
            </div>

            <div className="flex-1 overflow-y-auto no-scrollbar space-y-2">
              <div className="bg-white rounded-[20px] border border-[#E5E2DD] divide-y divide-[#E5E2DD]/50 shadow-2xs overflow-hidden">
                {techResolvedHistory.map((item) => (
                  <div key={item.id} className="p-3.5 space-y-1">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-sans font-medium text-[#241E1A]">№ {item.roomNumber}</h4>
                      <span className="text-[10px] text-[#8A8177] font-mono">{item.time}</span>
                    </div>
                    <p className="text-xs font-sans font-normal text-[#8A8177]">{lang === 'RU' ? item.descRu : item.descEn}</p>
                    <p className="text-[10px] text-[#5B8C6E] font-medium">{item.materials}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* -------------------- MODAL: PLANNED TO SCHEDULE -------------------- */}
      {showScheduleModal && (
        <div className="absolute inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-200">
          <div className="bg-[#FAF7F3] rounded-t-[24px] sm:rounded-[24px] w-full max-w-sm p-4.5 space-y-4 border border-[#E5E2DD] shadow-2xl max-h-[80vh] flex flex-col">
            <div className="flex items-center justify-between pb-1">
              <h3 className="font-serif font-medium text-lg text-[#241E1A]">
                {lang === 'RU' ? 'График планового ТО' : 'Planned TO Schedule'}
              </h3>
              <button
                type="button"
                onClick={() => setShowScheduleModal(false)}
                className="h-7 w-7 rounded-full bg-white border border-[#E5E2DD] text-[#8A8177] hover:text-[#241E1A] flex items-center justify-center cursor-pointer text-xs"
              >
                ✕
              </button>
            </div>

            <div className="flex-1 overflow-y-auto no-scrollbar space-y-2">
              <div className="bg-white rounded-[20px] border border-[#E5E2DD] divide-y divide-[#E5E2DD]/50 shadow-2xs overflow-hidden">
                {regularTasks.map((t) => (
                  <div key={t.id} className="p-3.5 flex items-center justify-between">
                    <div>
                      <h4 className="text-xs font-sans font-medium text-[#241E1A]">{lang === 'RU' ? t.nameRu : t.nameEn}</h4>
                      <span className="text-[10px] text-[#8A8177]">
                        {t.cycle === 'DAILY' ? (lang === 'RU' ? 'Ежедневно' : 'Daily') : t.cycle === 'WEEKLY' ? (lang === 'RU' ? 'Еженедельно' : 'Weekly') : (lang === 'RU' ? 'Ежемесячно' : 'Monthly')}
                      </span>
                    </div>
                    <span className="text-xs font-sans text-[#8A8177]">{t.time}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* -------------------- MODAL: PERSONAL DATA -------------------- */}
      {showPersonalDataModal && (
        <div className="absolute inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-200">
          <div className="bg-[#FAF7F3] rounded-t-[24px] sm:rounded-[24px] w-full max-w-sm p-4.5 space-y-4 border border-[#E5E2DD] shadow-2xl max-h-[80vh] flex flex-col">
            <div className="flex items-center justify-between pb-1">
              <h3 className="font-serif font-medium text-lg text-[#241E1A]">
                {lang === 'RU' ? 'Личные данные' : 'Personal Info'}
              </h3>
              <button
                type="button"
                onClick={() => setShowPersonalDataModal(false)}
                className="h-7 w-7 rounded-full bg-white border border-[#E5E2DD] text-[#8A8177] hover:text-[#241E1A] flex items-center justify-center cursor-pointer text-xs"
              >
                ✕
              </button>
            </div>

            <div className="flex-1 overflow-y-auto no-scrollbar space-y-3">
              <div className="bg-white rounded-[20px] border border-[#E5E2DD] divide-y divide-[#E5E2DD]/50 shadow-2xs overflow-hidden">
                <div className="p-3.5 flex justify-between items-center text-xs">
                  <span className="text-[#8A8177]">{lang === 'RU' ? 'ФИО' : 'Full Name'}</span>
                  <span className="font-medium text-[#241E1A]">{cleanerProfile.fullNameRu}</span>
                </div>
                <div className="p-3.5 flex justify-between items-center text-xs">
                  <span className="text-[#8A8177]">{lang === 'RU' ? 'Должность' : 'Position'}</span>
                  <span className="font-medium text-[#241E1A]">{lang === 'RU' ? 'Техник (все этажи)' : 'Facility Technician'}</span>
                </div>
                <div className="p-3.5 flex justify-between items-center text-xs">
                  <span className="text-[#8A8177]">{lang === 'RU' ? 'Табельный номер' : 'Badge ID'}</span>
                  <span className="font-medium text-[#241E1A]">{cleanerProfile.badgeId}</span>
                </div>
                <div className="p-3.5 flex justify-between items-center text-xs">
                  <span className="text-[#8A8177]">{lang === 'RU' ? 'Телефон' : 'Phone'}</span>
                  <span className="font-medium text-[#241E1A]">+7 (999) 321-44-55</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* -------------------- MODAL: CHANGE PASSWORD -------------------- */}
      {showChangePasswordModal && (
        <div className="absolute inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-200">
          <div className="bg-[#FAF7F3] rounded-t-[24px] sm:rounded-[24px] w-full max-w-sm p-4.5 space-y-4 border border-[#E5E2DD] shadow-2xl max-h-[80vh] flex flex-col">
            <div className="flex items-center justify-between pb-1">
              <h3 className="font-serif font-medium text-lg text-[#241E1A]">
                {lang === 'RU' ? 'Сменить пароль' : 'Change Password'}
              </h3>
              <button
                type="button"
                onClick={() => setShowChangePasswordModal(false)}
                className="h-7 w-7 rounded-full bg-white border border-[#E5E2DD] text-[#8A8177] hover:text-[#241E1A] flex items-center justify-center cursor-pointer text-xs"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs text-[#8A8177] mb-1">{lang === 'RU' ? 'Текущий пароль' : 'Current Password'}</label>
                <input
                  type="password"
                  placeholder="••••••••"
                  className="w-full bg-white border border-[#E5E2DD] rounded-xl p-3 text-xs text-[#241E1A] focus:outline-none focus:border-[#241E1A]"
                />
              </div>

              <div>
                <label className="block text-xs text-[#8A8177] mb-1">{lang === 'RU' ? 'Новый пароль' : 'New Password'}</label>
                <input
                  type="password"
                  placeholder="••••••••"
                  className="w-full bg-white border border-[#E5E2DD] rounded-xl p-3 text-xs text-[#241E1A] focus:outline-none focus:border-[#241E1A]"
                />
              </div>

              <button
                type="button"
                onClick={() => {
                  setShowChangePasswordModal(false);
                  alert(lang === 'RU' ? 'Пароль успешно изменён!' : 'Password changed successfully!');
                }}
                className="w-full bg-[#C2410C] hover:bg-[#A93A0C] text-white font-medium text-xs py-3 rounded-xl shadow-xs transition-colors cursor-pointer text-center mt-2"
              >
                {lang === 'RU' ? 'Сохранить новый пароль' : 'Save New Password'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* -------------------- MODAL: SUPPORT SERVICE -------------------- */}
      {showSupportModal && (
        <div className="absolute inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-200">
          <div className="bg-[#FAF7F3] rounded-t-[24px] sm:rounded-[24px] w-full max-w-sm p-4.5 space-y-4 border border-[#E5E2DD] shadow-2xl max-h-[80vh] flex flex-col">
            <div className="flex items-center justify-between pb-1">
              <h3 className="font-serif font-medium text-lg text-[#241E1A]">
                {lang === 'RU' ? 'Служба поддержки' : 'Support Service'}
              </h3>
              <button
                type="button"
                onClick={() => setShowSupportModal(false)}
                className="h-7 w-7 rounded-full bg-white border border-[#E5E2DD] text-[#8A8177] hover:text-[#241E1A] flex items-center justify-center cursor-pointer text-xs"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3">
              <div className="bg-white rounded-[20px] border border-[#E5E2DD] divide-y divide-[#E5E2DD]/50 shadow-2xs overflow-hidden">
                <div className="p-3.5 flex justify-between items-center text-xs">
                  <span className="text-[#8A8177]">{lang === 'RU' ? 'Горячая линия' : 'Hotline'}</span>
                  <a href="tel:88005553535" className="font-medium text-[#C2410C] hover:underline">8 (800) 555-35-35</a>
                </div>
                <div className="p-3.5 flex justify-between items-center text-xs">
                  <span className="text-[#8A8177]">{lang === 'RU' ? 'IT-отдел отеля' : 'Hotel IT Support'}</span>
                  <span className="font-medium text-[#241E1A]">it@sollviera.hotel</span>
                </div>
                <div className="p-3.5 flex justify-between items-center text-xs">
                  <span className="text-[#8A8177]">{lang === 'RU' ? 'Версия системы' : 'System Version'}</span>
                  <span className="font-medium text-[#241E1A]">Sollviera PMS v2.4</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
