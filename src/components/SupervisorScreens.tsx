import React, { useState, useEffect } from 'react';
import { 
  Users, Award, Wrench, ShieldCheck, LayoutDashboard, ChevronRight, ChevronDown, ChevronLeft, Check, X,
  AlertTriangle, Play, Pause, Trash2, Edit2, ShieldAlert, WifiOff, Globe, LogOut, CheckCircle2, User,
  Calendar, Layers, Clock, Camera, FileText, Smartphone, Monitor, Search, Sparkles, ArrowLeft, Package, Coffee, MessageSquare, Bell, Settings,
  RotateCw, Lock, HelpCircle, Send, Pin, BarChart3, Sliders, Plus, Minus, Info, GripVertical, UserMinus, UserPlus, Download, Share2, CheckSquare, DoorClosed, Wine, Tag, Filter, CheckCheck
} from 'lucide-react';
import { Language, HotelRoom, RoomStatus, CleanerProfile, MaintenanceRequest, RoomPriority } from '../types';
import { mockCleaners, mockShiftHistory } from '../data/mockData';
import { SollvieraLogo } from './SollvieraLogo';

interface SupervisorScreensProps {
  lang: Language;
  rooms: HotelRoom[];
  onUpdateRooms: React.Dispatch<React.SetStateAction<HotelRoom[]>>;
  maintenanceRequests: MaintenanceRequest[];
  onUpdateMaintenanceRequests: React.Dispatch<React.SetStateAction<MaintenanceRequest[]>>;
  systemLogs: string[];
  cleanerProfile: CleanerProfile;
  onUpdateCleanerProfile: (profile: CleanerProfile) => void;
  onLogout: () => void;
  offlineMode: boolean;
  onToggleOffline: () => void;
  activeTab: 'SV_DASHBOARD' | 'SV_INSPECTION' | 'SV_MAINTENANCE' | 'SV_TEAM' | 'SV_PROFILE';
  onLanguageChange?: (lang: Language) => void;
}

export const SupervisorScreens: React.FC<SupervisorScreensProps> = ({
  lang,
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
  activeTab,
  onLanguageChange,
}) => {
  // Filters & State
  const [selectedFloor, setSelectedFloor] = useState<string>('ALL');
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  
  // Assign Cleaner Modal & Reject Audit Modal states
  const [showAssignModal, setShowAssignModal] = useState<boolean>(false);
  const [assignRoomId, setAssignRoomId] = useState<string | null>(null);
  const [rejectRoomId, setRejectRoomId] = useState<string | null>(null);
  const [rejectComment, setRejectComment] = useState<string>('');
  const [inspectRoomId, setInspectRoomId] = useState<string | null>(null);
  const [isReassigning, setIsReassigning] = useState<boolean>(false);
  const [inspectMinibarOpen, setInspectMinibarOpen] = useState<boolean>(true);
  const [inspectMaterialsOpen, setInspectMaterialsOpen] = useState<boolean>(true);
  const [inspectBedroomOpen, setInspectBedroomOpen] = useState<boolean>(true);
  const [inspectBathroomOpen, setInspectBathroomOpen] = useState<boolean>(true);
  const [auditFilter, setAuditFilter] = useState<'WAITING' | 'ACCEPTED' | 'REJECTED'>('WAITING');
  const [activeTeamMemberId, setActiveTeamMemberId] = useState<string | null>(null);
  const [cleaners, setCleaners] = useState<CleanerProfile[]>(mockCleaners);

  // Reallocate Workload State
  const [showReallocateModal, setShowReallocateModal] = useState<boolean>(false);
  const [sourceCleanerId, setSourceCleanerId] = useState<string>('');
  const [targetCleanerId, setTargetCleanerId] = useState<string>('');

  // Supervisor Profile & Settings States
  const [showSettings, setShowSettings] = useState<boolean>(false);
  const [showNotifications, setShowNotifications] = useState<boolean>(false);
  const [isEditingProfile, setIsEditingProfile] = useState<boolean>(false);
  const [editFullName, setEditFullName] = useState<string>(cleanerProfile.fullName);
  const [editFullNameRu, setEditFullNameRu] = useState<string>(cleanerProfile.fullNameRu);
  const [editBadgeId, setEditBadgeId] = useState<string>(cleanerProfile.badgeId);
  const [editAvatarUrl, setEditAvatarUrl] = useState<string>(cleanerProfile.avatarUrl);

  // Settings States
  const [pushNotifications, setPushNotifications] = useState<boolean>(true);
  const [soundOnNewTask, setSoundOnNewTask] = useState<boolean>(false);
  const [lastSyncTime, setLastSyncTime] = useState<string>('09:41');
  const [isSyncing, setIsSyncing] = useState<boolean>(false);

  // Supervisor Profile Subscreens Navigation & State
  const [svActiveSubscreen, setSvActiveSubscreen] = useState<
    | 'NONE'
    | 'SHIFT_REPORT'
    | 'STAFF_MANAGEMENT'
    | 'EMPLOYEE_CARD'
    | 'APP_CONFIG'
    | 'CHECKLIST_CONFIG'
    | 'MINIBAR_CONFIG'
    | 'ROOMS_CONFIG'
    | 'TIME_NORMS_CONFIG'
    | 'DEFECTS_CONFIG'
  >('NONE');

  // Staff Management (Screen 11 & 12) States
  const [staffSearchQuery, setStaffSearchQuery] = useState<string>('');
  const [staffRoleFilter, setStaffRoleFilter] = useState<'ALL' | 'CLEANERS' | 'SUPERVISORS' | 'TECHS'>('ALL');
  const [selectedStaffMember, setSelectedStaffMember] = useState<any>({
    id: 'cln-002',
    name: 'Маркус Броди',
    nameEn: 'Marcus Brody',
    initials: 'МБ',
    roleTitleRu: 'Клинер · 2 этаж',
    position: 'SENIOR_CLEANER', // CLEANER | SENIOR_CLEANER | SUPERVISOR
    zone: '2 этаж, 201–218',
    phone: '+7 701 555 81 05',
    badgeId: 'SLV-8105',
    shiftStatus: 'ON_BREAK', // ON_SHIFT | ON_BREAK | OFF_SHIFT
    shiftStart: '08:00',
    schedule: '2 через 2',
    personalNormMin: 25,
    permissions: {
      ownRooms: true,
      allRooms: false,
      inspection: false,
      maintenanceRequests: true,
      staffManagement: false,
      appSettings: false
    }
  });

  const [showAddStaffModal, setShowAddStaffModal] = useState<boolean>(false);
  const [newStaffPhone, setNewStaffPhone] = useState<string>('');
  const [newStaffName, setNewStaffName] = useState<string>('');
  const [newStaffRole, setNewStaffRole] = useState<'CLEANER' | 'SUPERVISOR' | 'TECH'>('CLEANER');
  const [showFireConfirmModal, setShowFireConfirmModal] = useState<boolean>(false);

  const [invitedStaffList, setInvitedStaffList] = useState([
    { id: 'inv-1', phone: '+7 701 555 20 14', role: 'Клинер', sentDate: '26 авг' }
  ]);

  const [supervisorStaffList, setSupervisorStaffList] = useState([
    {
      id: 'cln-001',
      name: 'Елена Вэнс',
      nameEn: 'Elena Vance',
      initials: 'ЕВ',
      roleTitleRu: 'Старший клинер · 3 этаж',
      position: 'SENIOR_CLEANER',
      zone: '3 этаж, 301–320',
      phone: '+7 701 555 12 34',
      badgeId: 'SLV-4011',
      shiftStatus: 'ON_SHIFT',
      shiftStart: '08:00',
      schedule: '2 через 2',
      personalNormMin: 22,
      permissions: { ownRooms: true, allRooms: true, inspection: false, maintenanceRequests: true, staffManagement: false, appSettings: false }
    },
    {
      id: 'cln-002',
      name: 'Маркус Броди',
      nameEn: 'Marcus Brody',
      initials: 'МБ',
      roleTitleRu: 'Клинер · 2 этаж',
      position: 'CLEANER',
      zone: '2 этаж, 201–218',
      phone: '+7 701 555 81 05',
      badgeId: 'SLV-8105',
      shiftStatus: 'ON_BREAK',
      shiftStart: '08:00',
      schedule: '2 через 2',
      personalNormMin: 25,
      permissions: { ownRooms: true, allRooms: false, inspection: false, maintenanceRequests: true, staffManagement: false, appSettings: false }
    },
    {
      id: 'cln-003',
      name: 'Айгуль Мукан',
      nameEn: 'Aigul Mukan',
      initials: 'АМ',
      roleTitleRu: 'Клинер · 4 этаж',
      position: 'CLEANER',
      zone: '4 этаж, 401–418',
      phone: '+7 701 555 90 22',
      badgeId: 'SLV-4033',
      shiftStatus: 'ON_SHIFT',
      shiftStart: '08:00',
      schedule: '5 через 2',
      personalNormMin: 20,
      permissions: { ownRooms: true, allRooms: false, inspection: false, maintenanceRequests: true, staffManagement: false, appSettings: false }
    },
    {
      id: 'tech-001',
      name: 'Олег Петров',
      nameEn: 'Oleg Petrov',
      initials: 'ОП',
      roleTitleRu: 'Техник · все этажи',
      position: 'SUPERVISOR',
      zone: 'Все этажи и зоны',
      phone: '+7 701 555 44 88',
      badgeId: 'SLV-7701',
      shiftStatus: 'ON_SHIFT',
      shiftStart: '08:00',
      schedule: '1 через 3',
      personalNormMin: 30,
      permissions: { ownRooms: true, allRooms: true, inspection: false, maintenanceRequests: true, staffManagement: false, appSettings: false }
    },
    {
      id: 'cln-004',
      name: 'Нурлан Темиров',
      nameEn: 'Nurlan Temirov',
      initials: 'НТ',
      roleTitleRu: 'Клинер · 1 этаж',
      position: 'CLEANER',
      zone: '1 этаж, 101–115',
      phone: '+7 701 555 33 11',
      badgeId: 'SLV-3019',
      shiftStatus: 'OFF_SHIFT',
      shiftStart: '08:00',
      schedule: '2 через 2',
      personalNormMin: 25,
      permissions: { ownRooms: true, allRooms: false, inspection: false, maintenanceRequests: true, staffManagement: false, appSettings: false }
    },
    {
      id: 'sv-002',
      name: 'Жанна Абаева',
      nameEn: 'Zhanna Abaeva',
      initials: 'ЖА',
      roleTitleRu: 'Супервайзер · все этажи',
      position: 'SUPERVISOR',
      zone: 'Все этажи',
      phone: '+7 701 555 60 70',
      badgeId: 'SLV-1002',
      shiftStatus: 'OFF_SHIFT',
      shiftStart: '08:00',
      schedule: '2 через 2',
      personalNormMin: 25,
      permissions: { ownRooms: true, allRooms: true, inspection: true, maintenanceRequests: true, staffManagement: true, appSettings: true }
    }
  ]);

  // App Config (Screen 13) States
  const [objectType, setObjectType] = useState<'HOTEL' | 'INN' | 'APARTMENTS' | 'CABINS'>('HOTEL');
  const [objectName, setObjectName] = useState<string>('Rixos Borovoe');
  const [timeZone, setTimeZone] = useState<string>('GMT+5 · Алматы');
  const [floorsCount, setFloorsCount] = useState<number>(5);
  const [mandatoryPhotoReport, setMandatoryPhotoReport] = useState<boolean>(true);
  const [supervisorAuditRequired, setSupervisorAuditRequired] = useState<boolean>(true);

  // Room Type Checklist (Screen 14) States
  const [deluxeChecklist, setDeluxeChecklist] = useState({
    name: 'Deluxe Suite',
    bedrooms: 2,
    bathrooms: 2,
    hasLivingRoom: true,
    hasKitchen: false,
    hasMinibar: true,
    normMinutes: 40,
    photoEachZone: true,
    bedroomTasks: [
      'Смена белья и наволочек',
      'Пылесос ковров и влажная уборка',
      'Протереть поверхности и зеркала'
    ],
    bathroomTasks: [
      'Дезинфекция санузла',
      'Замена полотенец и косметики'
    ]
  });

  // Minibar & Inventory (Screen 15) States
  const [minibarTab, setMinibarTab] = useState<'MINIBAR' | 'SUPPLIES' | 'TROLLEY'>('MINIBAR');
  const [minibarDrinks, setMinibarDrinks] = useState([
    { id: 'mb-1', name: 'Вода 0,5 л', qty: 4 },
    { id: 'mb-2', name: 'Сок яблочный', qty: 2 },
    { id: 'mb-3', name: 'Газированный напиток', qty: 2 }
  ]);
  const [minibarTeaCoffee, setMinibarTeaCoffee] = useState([
    { id: 'tc-1', name: 'Чай чёрный, пакет', qty: 4 },
    { id: 'tc-2', name: 'Кофе растворимый, стик', qty: 4 },
    { id: 'tc-3', name: 'Сахар, стик', qty: 6 }
  ]);
  const [minibarSnacks, setMinibarSnacks] = useState([
    { id: 'sn-1', name: 'Орехи, пакет', qty: 2 }
  ]);

  const [trolleyLinens, setTrolleyLinens] = useState([
    { id: 'ln-1', name: 'Простыня односпальная', qty: 15 },
    { id: 'ln-2', name: 'Пододеяльник', qty: 10 },
    { id: 'ln-3', name: 'Наволочка', qty: 20 }
  ]);
  const [trolleyCosmetics, setTrolleyCosmetics] = useState([
    { id: 'cs-1', name: 'Шампунь 50мл', qty: 25 },
    { id: 'cs-2', name: 'Мыло', qty: 30 },
    { id: 'cs-3', name: 'Зубной набор', qty: 15 }
  ]);
  const [trolleyTools, setTrolleyTools] = useState([
    { id: 'tl-1', name: 'Салфетка микрофибра', qty: 6 },
    { id: 'tl-2', name: 'Перчатки', qty: 10 },
    { id: 'tl-3', name: 'Пульверизатор', qty: 2 }
  ]);

  // Supervisor Notifications Filter & Data
  const [notificationFilter, setNotificationFilter] = useState<'ALL' | 'TASKS' | 'MAINTENANCE' | 'SHIFT'>('ALL');
  const [supervisorNotifications, setSupervisorNotifications] = useState([
    {
      id: 'notif-1',
      category: 'TASKS',
      dateGroup: 'TODAY',
      titleRu: '№ 312 просрочен на 24 минуты',
      titleEn: 'Room 312 overdue by 24 minutes',
      subRu: 'Дедлайн был 13:00 · выездная уборка',
      subEn: 'Deadline was 13:00 · departure cleaning',
      time: '13:24',
      unread: true,
      urgent: true,
      icon: 'clock'
    },
    {
      id: 'notif-2',
      category: 'MAINTENANCE',
      dateGroup: 'TODAY',
      titleRu: 'Техник выехал на № 315',
      titleEn: 'Technician dispatched to Room 315',
      subRu: 'Олег Петров · 08:51',
      subEn: 'Oleg Petrov · 08:51',
      time: '08:51',
      unread: true,
      urgent: false,
      icon: 'wrench'
    },
    {
      id: 'notif-3',
      category: 'TASKS',
      dateGroup: 'TODAY',
      titleRu: 'Сообщение от старшей горничной',
      titleEn: 'Message from Senior Maid',
      subRu: 'Светлана Ким · 09:32',
      subEn: 'Svetlana Kim · 09:32',
      time: '09:32',
      unread: true,
      urgent: false,
      icon: 'message'
    },
    {
      id: 'notif-4',
      category: 'SHIFT',
      dateGroup: 'TODAY',
      titleRu: 'Пополнение тележки готово',
      titleEn: 'Cart replenishment ready',
      subRu: 'Забрать на складе 1 этажа · 08:15',
      subEn: 'Pick up at 1st floor storage · 08:15',
      time: '08:15',
      unread: true,
      urgent: false,
      icon: 'package'
    },
    {
      id: 'notif-5',
      category: 'TASKS',
      dateGroup: 'YESTERDAY',
      titleRu: '№ 301 проверен супервайзером',
      titleEn: 'Room 301 verified by supervisor',
      subRu: 'Замечаний нет · 16:40',
      subEn: 'No remarks · 16:40',
      time: '16:40',
      unread: false,
      urgent: false,
      icon: 'check'
    },
    {
      id: 'notif-6',
      category: 'SHIFT',
      dateGroup: 'YESTERDAY',
      titleRu: 'Смена завершена',
      titleEn: 'Shift completed',
      subRu: '8 номеров за 7 ч 12 мин · 17:05',
      subEn: '8 rooms in 7h 12m · 17:05',
      time: '17:05',
      unread: false,
      urgent: false,
      icon: 'clock'
    }
  ]);

  // Supervisor Chats States
  const [showChats, setShowChats] = useState<boolean>(false);
  const [activeChatContactId, setActiveChatContactId] = useState<string | null>(null);
  const [typedMessage, setTypedMessage] = useState<string>('');
  const [chatSearchQuery, setChatSearchQuery] = useState<string>('');
  const [teamSearchQuery, setTeamSearchQuery] = useState<string>('');
  const [maintenanceFilter, setMaintenanceFilter] = useState<'ALL' | 'IN_PROGRESS' | 'RESOLVED'>('ALL');
  const [chatContacts, setChatContacts] = useState([
    { 
      id: 'cleaner-ap', 
      name: 'Anna Peterson', 
      nameRu: 'Анна Петерсон', 
      initials: 'АП', 
      role: 'Supervisor', 
      roleRu: 'супервайзер', 
      isPinned: true, 
      unreadCount: 0, 
      lastMsgRu: 'Доброе утро! Ваша смена активирована. Проверьте эта...', 
      lastMsgEn: 'Good morning! Your shift is active. Check the fl...', 
      time: '08:00' 
    },
    { 
      id: 'cleaner-2', 
      name: 'Marcus Brody', 
      nameRu: 'Маркус Броди', 
      initials: 'МБ', 
      role: 'Maid', 
      roleRu: 'горничная', 
      isPinned: false, 
      unreadCount: 1, 
      lastMsgRu: 'Привет, у тебя есть лишние большие простыни на 3 эта...', 
      lastMsgEn: 'Hi, do you have spare large bedsheets on 3rd fl...', 
      time: '13:02' 
    },
    { 
      id: 'cleaner-sk', 
      name: 'Svetlana Kim', 
      nameRu: 'Светлана Ким', 
      initials: 'СК', 
      role: 'Senior Maid', 
      roleRu: 'старшая горничная', 
      isPinned: true, 
      unreadCount: 0, 
      lastMsgRu: 'Пожалуйста, сверьте стандарты по 304 номеру до 13:45.', 
      lastMsgEn: 'Please verify standards for room 304 before 13:45.', 
      time: '12:45' 
    },
    { 
      id: 'cleaner-ov', 
      name: 'Oleg Voronov', 
      nameRu: 'Олег Воронов', 
      initials: 'ОВ', 
      role: 'Head of Service', 
      roleRu: 'руководитель службы', 
      isPinned: false, 
      unreadCount: 0, 
      lastMsgRu: 'Отличная работа по аудитам 3 этажа на этой неделе.', 
      lastMsgEn: 'Great job on the 3rd floor audits this week.', 
      time: 'Вчера' 
    },
    { 
      id: 'cleaner-1', 
      name: 'Elena Vance', 
      nameRu: 'Елена Вэнс', 
      initials: 'ЕВ', 
      role: 'Maid', 
      roleRu: 'горничная', 
      isPinned: false, 
      unreadCount: 0, 
      lastMsgRu: 'Номер 301 готов к инспекции. Завершила уборку.', 
      lastMsgEn: 'Room 301 is ready for inspection. Finished cleaning.', 
      time: '12:05' 
    },
    { 
      id: 'tech-op', 
      name: 'Oleg Petrov', 
      nameRu: 'Олег Петров', 
      initials: 'ОП', 
      role: 'Technician', 
      roleRu: 'техник', 
      isPinned: false, 
      unreadCount: 0, 
      lastMsgRu: 'Заявка по кондиционеру в 315 принята в работу.', 
      lastMsgEn: 'AC request in room 315 accepted into progress.', 
      time: '11:30' 
    }
  ]);
  const [supervisorChatMessages, setSupervisorChatMessages] = useState<Record<string, Array<{ sender: 'CLEANER' | 'SUPERVISOR'; text: string; time: string }>>>({
    'cleaner-ap': [
      { sender: 'CLEANER', text: 'Доброе утро! Ваша смена активирована. Проверьте этажи 3 и 4.', time: '08:00' },
      { sender: 'SUPERVISOR', text: 'Доброе утро! Принято, приступаю.', time: '08:02' }
    ],
    'cleaner-2': [
      { sender: 'CLEANER', text: 'Привет, у тебя есть лишние большие простыни на 3 этаже?', time: '13:02' }
    ],
    'cleaner-sk': [
      { sender: 'CLEANER', text: 'Пожалуйста, сверьте стандарты по 304 номеру до 13:45.', time: '12:45' }
    ],
    'cleaner-ov': [
      { sender: 'CLEANER', text: 'Отличная работа по аудитам 3 этажа на этой неделе.', time: 'Вчера' },
      { sender: 'SUPERVISOR', text: 'Спасибо! Команда отлично справляется.', time: 'Вчера' }
    ],
    'cleaner-1': [
      { sender: 'CLEANER', text: 'Здравствуйте, закончила номер 301, отправляю на проверку.', time: '12:02' },
      { sender: 'SUPERVISOR', text: 'Хорошо, сейчас проверю.', time: '12:03' },
      { sender: 'CLEANER', text: 'Спасибо!', time: '12:05' }
    ],
    'tech-op': [
      { sender: 'CLEANER', text: 'Заявка по кондиционеру в 315 принята в работу.', time: '11:30' }
    ]
  });

  const [selectedMaintenanceId, setSelectedMaintenanceId] = useState<string | null>(null);
  const [selectedDashboardRoomId, setSelectedDashboardRoomId] = useState<string | null>(null);

  useEffect(() => {
    setInspectRoomId(null);
    setAssignRoomId(null);
    setShowAssignModal(false);
    setRejectRoomId(null);
    setRejectComment('');
    setIsReassigning(false);
    setShowChats(false);
    setActiveChatContactId(null);
    setSelectedMaintenanceId(null);
    setSelectedDashboardRoomId(null);
  }, [activeTab]);

  useEffect(() => {
    const topSpacer = document.getElementById('phone-top-spacer');
    if (!topSpacer) return;
    if ((activeTab === 'SV_MAINTENANCE' && selectedMaintenanceId) || 
        (activeTab === 'SV_DASHBOARD' && selectedDashboardRoomId) ||
        (activeTab === 'SV_INSPECTION' && inspectRoomId)) {
      topSpacer.classList.remove('bg-[#FAF7F3]');
      topSpacer.classList.add('bg-[#241E1A]');
    } else if (activeTab === 'SV_MAINTENANCE' || activeTab === 'SV_DASHBOARD' || activeTab === 'SV_INSPECTION' || activeTab === 'SV_TEAM' || activeTab === 'SV_PROFILE') {
      topSpacer.classList.remove('bg-[#241E1A]');
      topSpacer.classList.add('bg-[#FAF7F3]');
    }
  }, [selectedMaintenanceId, selectedDashboardRoomId, inspectRoomId, activeTab]);

  // Helpers
  const getStatusLabel = (status: RoomStatus) => {
    switch (status) {
      case 'PENDING': return lang === 'RU' ? 'Ожидает' : 'Pending';
      case 'IN_PROGRESS': return lang === 'RU' ? 'В процессе' : 'In Progress';
      case 'READY': return lang === 'RU' ? 'На проверке' : 'Inspection';
      case 'PROBLEM': return lang === 'RU' ? 'Проблема' : 'Problem';
      case 'VERIFIED': return lang === 'RU' ? 'Проверено' : 'Verified';
      default: return status;
    }
  };

  const getStatusBadgeColor = (status: RoomStatus) => {
    switch (status) {
      case 'PENDING': return 'bg-[#FAF2E6] text-[#E4762B] border-[#F5E0C2]';
      case 'IN_PROGRESS': return 'bg-[#FAF0EB] text-[#A93A0C] border-[#F1DDD3] animate-pulse';
      case 'READY': return 'bg-[#F6F5F4] text-[#A69C8F] border-[#E8E6E3]';
      case 'PROBLEM': return 'bg-[#FAF0EF] text-[#B3261E] border-[#F5D6D5]';
      case 'VERIFIED': return 'bg-[#F0F5F2] text-[#5B8C6E] border-[#D5E2D9]';
    }
  };

  const getGuestPreferences = (roomNumber: string) => {
    switch (roomNumber) {
      case '304':
        return lang === 'RU' 
          ? 'Разбудить в 7:00. Принести дополнительные гипоаллергенные подушки и фруктовую корзину.'
          : 'Wake up at 7:00. Bring extra hypoallergenic pillows and a fruit basket.';
      case '312':
        return lang === 'RU'
          ? 'Не беспокоить (DND) до 12:00. Попросил не менять постельное белье.'
          : 'Do not disturb (DND) until 12:00. Requested not to change bed linen.';
      case '308':
        return lang === 'RU'
          ? 'Требуется дополнительная бутылка минеральной воды и набор зубных щеток.'
          : 'Requires an extra bottle of mineral water and a dental kit.';
      case '301':
        return lang === 'RU'
          ? 'Ранний заезд в 11:00. Подготовить детскую кроватку.'
          : 'Early check-in at 11:00. Prepare a baby cot.';
      case '315':
        return lang === 'RU'
          ? 'Пожаловался на плохой слив в душевой кабине.'
          : 'Complained about poor water drainage in the shower cabin.';
      default:
        return lang === 'RU' 
          ? 'Особых пожеланий не зарегистрировано. Стандартное обслуживание.' 
          : 'No special preferences registered. Standard stayover care.';
    }
  };

  // Actions
  const handleAssignCleaner = (roomId: string, cleanerName: string) => {
    onUpdateRooms(prev => prev.map(r => {
      if (r.id === roomId) {
        return { 
          ...r, 
          notesRu: `Назначен клинер: ${cleanerName}.`, 
          notesEn: `Assigned cleaner: ${cleanerName}.` 
        };
      }
      return r;
    }));
    setShowAssignModal(false);
    setAssignRoomId(null);
  };

  const handleApproveInspection = (roomId: string) => {
    onUpdateRooms(prev => prev.map(r => {
      if (r.id === roomId) {
        return { ...r, status: 'VERIFIED' };
      }
      return r;
    }));
  };

  const handleRejectInspection = (roomId: string, reason: string) => {
    onUpdateRooms(prev => prev.map(r => {
      if (r.id === roomId) {
        return { 
          ...r, 
          status: 'PENDING', 
          notesRu: `Проверка отклонена: ${reason || 'недоработки по стандартам'}`, 
          notesEn: `Inspection failed: ${reason || 'does not meet hotel standards'}` 
        };
      }
      return r;
    }));
    setRejectRoomId(null);
    setRejectComment('');
  };

  const handleUpdateMaintenanceStatus = (id: string, newStatus: any) => {
    onUpdateMaintenanceRequests(prev => prev.map(m => {
      if (m.id === id) {
        // If resolved, update corresponding room status
        if (newStatus === 'RESOLVED') {
          const room = rooms.find(r => r.roomNumber === m.roomNumber);
          if (room) {
            onUpdateRooms(prevRooms => prevRooms.map(pr => {
              if (pr.id === room.id) {
                return { ...pr, status: 'PENDING' };
              }
              return pr;
            }));
          }
        }
        return { ...m, status: newStatus };
      }
      return m;
    }));
  };

  const handleReallocateWorkload = () => {
    if (!sourceCleanerId || !targetCleanerId) return;
    
    // Find target cleaner's name
    const targetCleaner = cleaners.find(c => c.id === targetCleanerId);
    const sourceCleaner = cleaners.find(c => c.id === sourceCleanerId);
    if (!targetCleaner || !sourceCleaner) return;

    // Shift all PENDING rooms assigned to source cleaner to target cleaner
    const sourceName = lang === 'RU' ? sourceCleaner.fullNameRu : sourceCleaner.fullName;
    const targetName = lang === 'RU' ? targetCleaner.fullNameRu : targetCleaner.fullName;

    onUpdateRooms(prev => prev.map(r => {
      // If room notes mention source cleaner and room is not verified/completed, reassign it
      if (r.status === 'PENDING' && (r.notesRu?.includes(sourceName) || r.notesEn?.includes(sourceCleaner.fullName))) {
        return {
          ...r,
          notesRu: `Переназначен от ${sourceName} к ${targetName}.`,
          notesEn: `Reassigned from ${sourceCleaner.fullName} to ${targetCleaner.fullName}.`
        };
      }
      return r;
    }));

    setShowReallocateModal(false);
    setSourceCleanerId('');
    setTargetCleanerId('');
    alert(lang === 'RU' ? `Задачи успешно перераспределены к ${targetName}!` : `Tasks successfully reallocated to ${targetName}!`);
  };

  // Rendering Tabs
  const renderDashboard = () => {
    const filteredRooms = rooms.filter(r => {
      // Floor filter
      if (selectedFloor !== 'ALL' && r.floor.toString() !== selectedFloor) return false;
      // Status filter
      if (selectedStatus !== 'ALL' && r.status !== selectedStatus) return false;
      // Search filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const cleanerMatch = r.notesRu?.match(/клинер:\s*([^.]+)/) || r.notesEn?.match(/cleaner:\s*([^.]+)/);
        const assignedCleaner = cleanerMatch ? cleanerMatch[1] : (r.floor === 3 ? 'Елена Вэнс' : 'Маркус Броди');
        
        const matchesRoom = r.roomNumber.toLowerCase().includes(query);
        const matchesCleaner = assignedCleaner.toLowerCase().includes(query);
        const matchesCategory = r.category.toLowerCase().includes(query);
        
        if (!matchesRoom && !matchesCleaner && !matchesCategory) return false;
      }
      return true;
    });

    const getStatusDotColor = (room: HotelRoom) => {
      if (room.status === 'PROBLEM' || room.priority === 'URGENT') return 'bg-[#B3261E]';
      if (room.status === 'IN_PROGRESS') return 'bg-[#E4732C]';
      if (room.status === 'READY') return 'bg-[#4A5E78]';
      return 'bg-[#FAF2E6] border border-[#E5E2DD]';
    };

    const getStatusDetailText = (room: HotelRoom) => {
      if (room.isOverdue) return lang === 'RU' ? '+24 мин' : '+24 min';
      if (room.status === 'PROBLEM') return lang === 'RU' ? 'заблокирован' : 'blocked';
      if (room.status === 'IN_PROGRESS') {
        const mins = room.roomNumber === '304' ? 12 : 6;
        return lang === 'RU' ? `в уборке · ${mins} мин` : `cleaning · ${mins} min`;
      }
      if (room.status === 'READY') {
        const time = room.roomNumber === '301' ? '12:05' : '10:48';
        return lang === 'RU' ? `на проверке · ${time}` : `audit · ${time}`;
      }
      if (room.status === 'PENDING') {
        const time = room.roomNumber === '402' ? '14:00' : '15:00';
        return lang === 'RU' ? `до ${time}` : `by ${time}`;
      }
      return lang === 'RU' ? 'готово' : 'verified';
    };

    const totalCount = rooms.length;
    const problemCount = rooms.filter(r => r.status === 'PROBLEM').length;
    const floorLabel = selectedFloor === 'ALL'
      ? (lang === 'RU' ? 'Все этажи' : 'All Floors')
      : (lang === 'RU' ? `${selectedFloor} этаж` : `Floor ${selectedFloor}`);

    return (
      <div className="flex-1 flex flex-col min-h-0 bg-[#FAF7F3]">
        {/* 1. LARGE CUSTOM HEADER */}
        <div className="bg-[#FAF7F3] pt-6 pb-3.5 px-4.5 space-y-3.5 border-b border-[#E5E2DD]/60 shrink-0">
          <div>
            <h1 className="text-2xl font-serif font-medium text-[#241E1A] leading-tight select-none">
              {lang === 'RU' ? 'Мониторинг номеров' : 'Rooms Dashboard'}
            </h1>
            <p className="text-[11px] font-sans font-normal text-[#8A8177] mt-1.5 select-none">
              {floorLabel} · <span className="text-[#241E1A] font-medium">{totalCount} {lang === 'RU' ? 'номера' : 'rooms'}</span> · <span className="text-[#B3261E] font-medium">{problemCount} {lang === 'RU' ? (problemCount === 1 ? 'проблема' : problemCount < 5 ? 'проблемы' : 'проблем') : 'problems'}</span>
            </p>
          </div>

          {/* Translucent Search Input */}
          <div className="relative">
            <input
              type="text"
              placeholder={lang === 'RU' ? 'Поиск по номеру или клинеру' : 'Search by room or staff'}
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full bg-white border border-[#E5E2DD] rounded-xl pl-9 pr-9 py-2 text-xs text-[#241E1A] placeholder-[#8A8177]/80 focus:outline-none focus:ring-1 focus:ring-[#C2410C] font-sans font-normal h-10 transition-all"
            />
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[#8A8177]" />
            {searchQuery && (
              <button 
                onClick={() => setSearchQuery('')} 
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#8A8177] hover:text-[#241E1A] font-black text-sm cursor-pointer h-5 w-5 flex items-center justify-center rounded-full hover:bg-slate-100"
              >
                ×
              </button>
            )}
          </div>
        </div>

        {/* Filters and List */}
        <div className="p-3.5 space-y-3.5 flex-1 flex flex-col min-h-0 overflow-y-auto no-scrollbar">
          
          {/* Status Chips (Horizontal Scroll) */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1.5 no-scrollbar shrink-0">
            {/* Floor filter select pill */}
            <div className="flex items-center gap-1 bg-white px-3 py-1 rounded-full border border-[#E5E2DD] text-[11px] font-sans font-medium text-[#241E1A] shrink-0 cursor-pointer">
              <select
                value={selectedFloor}
                onChange={(e) => setSelectedFloor(e.target.value)}
                className="bg-transparent text-[#241E1A] focus:outline-none cursor-pointer text-[11px]"
              >
                <option value="ALL">{lang === 'RU' ? 'Все этажи' : 'All Floors'}</option>
                <option value="2">2 {lang === 'RU' ? 'этаж' : 'floor'}</option>
                <option value="3">3 {lang === 'RU' ? 'этаж' : 'floor'}</option>
                <option value="4">4 {lang === 'RU' ? 'этаж' : 'floor'}</option>
              </select>
            </div>

            {/* Status chips mapping */}
            {(['ALL', 'IN_PROGRESS', 'READY', 'PROBLEM', 'PENDING', 'VERIFIED'] as const).map((status) => {
              const isSelected = selectedStatus === status;
              const count = status === 'ALL' ? rooms.length : rooms.filter(r => r.status === status).length;
              
              let label = lang === 'RU' ? 'Все' : 'All';
              if (status === 'IN_PROGRESS') label = lang === 'RU' ? 'В работе' : 'In Work';
              if (status === 'READY') label = lang === 'RU' ? 'На проверке' : 'On Inspection';
              if (status === 'PROBLEM') label = lang === 'RU' ? 'Проблема' : 'Problem';
              if (status === 'PENDING') label = lang === 'RU' ? 'Ожидают' : 'Pending';
              if (status === 'VERIFIED') label = lang === 'RU' ? 'Проверено' : 'Verified';

              return (
                <button
                  key={status}
                  type="button"
                  onClick={() => setSelectedStatus(status)}
                  className={`px-3 py-1 rounded-full text-[11px] font-sans font-medium whitespace-nowrap transition-all border cursor-pointer shrink-0 ${
                    isSelected
                      ? 'bg-[#241E1A] text-white border-[#241E1A] shadow-xs'
                      : 'bg-white text-[#8A8177] border-[#E5E2DD] hover:bg-slate-50'
                  }`}
                >
                  {label} <span className={`text-[9px] ml-0.5 font-normal ${isSelected ? 'text-white/80' : 'text-[#8A8177]'}`}>{count}</span>
                </button>
              );
            })}
          </div>

          {/* Rooms Map list inside single card */}
          <div className="flex-1 overflow-y-auto no-scrollbar pb-6 shrink-0">
            {filteredRooms.length === 0 ? (
              <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center text-slate-400 font-bold text-xs">
                {lang === 'RU' ? 'Нет номеров по выбранным фильтрам' : 'No rooms matching selected filters'}
              </div>
            ) : (
              <div className="bg-white rounded-[18px] border border-[#E5E2DD] divide-y divide-[#E5E2DD]/50 overflow-hidden shadow-2xs">
                {filteredRooms.map(room => {
                  return (
                    <div
                      key={room.id}
                      onClick={() => {
                        setSelectedDashboardRoomId(room.id);
                      }}
                      className="p-3.5 flex items-center justify-between gap-3 cursor-pointer hover:bg-slate-50 transition-colors select-none"
                    >
                      {/* Left section: Dot, Room Number, Badges */}
                      <div className="flex items-center gap-3 min-w-0 flex-1">
                        {/* Colored Status Dot */}
                        <div className={`h-2.5 w-2.5 rounded-full shrink-0 ${getStatusDotColor(room)}`} />

                        <div className="flex items-center gap-2 flex-wrap min-w-0">
                          {/* Room Number */}
                          <span className="text-[17px] font-sans font-medium text-[#241E1A] leading-none">
                            № {room.roomNumber}
                          </span>
                          {/* Badges */}
                          {room.priority === 'VIP' && (
                            <span className="bg-[#FAF7F3] text-amber-800 border border-amber-200/50 font-sans font-medium text-[8px] px-2 py-0.5 rounded-md uppercase tracking-wider leading-none">
                              VIP
                            </span>
                          )}
                          {room.priority === 'URGENT' && (
                            <span className="bg-rose-50 text-rose-700 border border-rose-100 font-sans font-medium text-[8px] px-2 py-0.5 rounded-md uppercase tracking-wider leading-none">
                              {lang === 'RU' ? 'СРОЧНО' : 'URGENT'}
                            </span>
                          )}
                          {room.status === 'PROBLEM' && (
                            <span className="bg-rose-50 text-rose-700 border border-rose-100 font-sans font-medium text-[8px] px-2 py-0.5 rounded-md uppercase tracking-wider leading-none">
                              {lang === 'RU' ? 'ПРОБЛЕМА' : 'PROBLEM'}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Right section: Status Detail and Chevron */}
                      <div className="shrink-0 flex items-center gap-2">
                        <span className={`text-xs font-sans font-normal ${
                          room.isOverdue ? 'text-rose-700 font-medium' : 'text-[#8A8177]'
                        }`}>
                          {getStatusDetailText(room)}
                        </span>
                        <ChevronRight className="h-4 w-4 text-[#8A8177] shrink-0" />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  const renderInspection = () => {
    const readyRooms = rooms.filter(r => r.status === 'READY');
    const waitingCount = readyRooms.length;

    const acceptedHistory = [
      { roomNumber: '306', type: 'Standard Twin', cleaner: lang === 'RU' ? 'Елена Вэнс' : 'Elena Vance', comment: lang === 'RU' ? 'без замечаний' : 'no remarks' },
      { roomNumber: '404', type: 'Deluxe Twin', cleaner: lang === 'RU' ? 'Айгуль Мукан' : 'Aigul Mukan', comment: lang === 'RU' ? 'без замечаний' : 'no remarks' },
      { roomNumber: '302', type: 'Deluxe Suite', cleaner: lang === 'RU' ? 'Елена Вэнс' : 'Elena Vance', comment: lang === 'RU' ? 'без замечаний' : 'no remarks' },
      { roomNumber: '204', type: 'Standard Twin', cleaner: lang === 'RU' ? 'Маркус Броди' : 'Marcus Brody', comment: lang === 'RU' ? 'без замечаний' : 'no remarks' },
      { roomNumber: '105', type: 'Junior Suite', cleaner: lang === 'RU' ? 'Елена Вэнс' : 'Elena Vance', comment: lang === 'RU' ? 'без замечаний' : 'no remarks' },
      { roomNumber: '108', type: 'Standard Twin', cleaner: lang === 'RU' ? 'Маркус Броди' : 'Marcus Brody', comment: lang === 'RU' ? 'без замечаний' : 'no remarks' },
      { roomNumber: '310', type: 'Executive King', cleaner: lang === 'RU' ? 'Елена Вэнс' : 'Elena Vance', comment: lang === 'RU' ? 'без замечаний' : 'no remarks' },
      { roomNumber: '212', type: 'Deluxe Suite', cleaner: lang === 'RU' ? 'Маркус Броди' : 'Marcus Brody', comment: lang === 'RU' ? 'без замечаний' : 'no remarks' }
    ];

    const rejectedHistory = [
      { roomNumber: '210', type: 'Junior Suite', cleaner: lang === 'RU' ? 'Маркус Броди' : 'Marcus Brody', comment: lang === 'RU' ? 'пыль на поверхностях' : 'dust on surfaces' },
      { roomNumber: '305', type: 'Deluxe Suite', cleaner: lang === 'RU' ? 'Елена Вэнс' : 'Elena Vance', comment: lang === 'RU' ? 'пятна на зеркале' : 'spots on mirror' }
    ];

    return (
      <div className="flex-1 flex flex-col min-h-0 bg-[#FAF7F3]">
        {/* Header */}
        <div className="bg-[#FAF7F3] pt-6 pb-3.5 px-4.5 space-y-3.5 border-b border-[#E5E2DD]/60 shrink-0">
          <div>
            <h1 className="text-2xl font-serif font-medium text-[#241E1A] leading-tight select-none">
              {lang === 'RU' ? 'Инспекция' : 'Inspection'}
            </h1>
            <p className="text-[11px] font-sans font-normal text-[#8A8177] mt-1.5 select-none">
              {waitingCount} {lang === 'RU'
                ? (waitingCount === 1 ? 'номер ждет проверки' : waitingCount < 5 ? 'номера ждут проверки' : 'номеров ждут проверки')
                : 'rooms awaiting audit'}
            </p>
          </div>

          {/* Chips/Filters */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5 no-scrollbar shrink-0">
            <button
              onClick={() => setAuditFilter('WAITING')}
              className={`px-4 py-2 rounded-full text-[11px] font-sans font-medium whitespace-nowrap transition-all border cursor-pointer ${
                auditFilter === 'WAITING'
                  ? 'bg-[#241E1A] text-white border-[#241E1A] shadow-xs'
                  : 'bg-white text-[#8A8177] border-[#E5E2DD] hover:bg-slate-50'
              }`}
            >
              {lang === 'RU' ? 'Ждут проверки' : 'Awaiting Audit'}{' '}
              <span className={`text-[9px] ml-0.5 font-normal ${auditFilter === 'WAITING' ? 'text-white/80' : 'text-[#8A8177]'}`}>
                {waitingCount}
              </span>
            </button>
            <button
              onClick={() => setAuditFilter('ACCEPTED')}
              className={`px-4 py-2 rounded-full text-[11px] font-sans font-medium whitespace-nowrap transition-all border cursor-pointer ${
                auditFilter === 'ACCEPTED'
                  ? 'bg-[#241E1A] text-white border-[#241E1A] shadow-xs'
                  : 'bg-white text-[#8A8177] border-[#E5E2DD] hover:bg-slate-50'
              }`}
            >
              {lang === 'RU' ? 'Принятые' : 'Accepted'}{' '}
              <span className={`text-[9px] ml-0.5 font-normal ${auditFilter === 'ACCEPTED' ? 'text-white/80' : 'text-[#8A8177]'}`}>
                {acceptedHistory.length}
              </span>
            </button>
            <button
              onClick={() => setAuditFilter('REJECTED')}
              className={`px-4 py-2 rounded-full text-[11px] font-sans font-medium whitespace-nowrap transition-all border cursor-pointer ${
                auditFilter === 'REJECTED'
                  ? 'bg-[#241E1A] text-white border-[#241E1A] shadow-xs'
                  : 'bg-white text-[#8A8177] border-[#E5E2DD] hover:bg-slate-50'
              }`}
            >
              {lang === 'RU' ? 'Отклонённые' : 'Rejected'}{' '}
              <span className={`text-[9px] ml-0.5 font-normal ${auditFilter === 'REJECTED' ? 'text-white/80' : 'text-[#8A8177]'}`}>
                {rejectedHistory.length}
              </span>
            </button>
          </div>
        </div>

        {/* List Body */}
        <div className="p-4.5 pt-2 space-y-5 flex-1 flex flex-col min-h-0 overflow-y-auto no-scrollbar">
          
          {/* WAITING LIST (Shown when WAITING tab is selected) */}
          {auditFilter === 'WAITING' && (
            <div className="space-y-2">
              <span className="text-[10px] font-sans font-medium tracking-[0.08em] text-[#8A8177] uppercase block select-none">
                {lang === 'RU' ? 'ЖДУТ ПРОВЕРКИ' : 'AWAITING INSPECTION'}
              </span>
              {readyRooms.length === 0 ? (
                <div className="bg-white rounded-2xl border border-[#E5E2DD] p-8 text-center text-[#8A8177]/80 font-sans font-normal text-xs">
                  {lang === 'RU' ? 'Все чисто! Нет номеров на проверку.' : 'All clear! No rooms awaiting audit.'}
                </div>
              ) : (
                <div className="bg-white rounded-[18px] border border-[#E5E2DD] divide-y divide-[#E5E2DD]/50 overflow-hidden shadow-2xs">
                  {readyRooms.map(room => {
                    const cleanerMatch = room.notesRu?.match(/клинер:\s*([^.]+)/) || room.notesEn?.match(/cleaner:\s*([^.]+)/);
                    const assignedCleaner = cleanerMatch ? cleanerMatch[1] : (room.floor === 3 ? 'Елена Вэнс' : 'Маркус Броди');
                    const durationLabel = room.roomNumber === '301' ? (lang === 'RU' ? '14 мин' : '14 min') : room.roomNumber === '205' ? (lang === 'RU' ? '18 мин' : '18 min') : (lang === 'RU' ? '21 мин' : '21 min');
                    return (
                      <div
                        key={room.id}
                        onClick={() => setInspectRoomId(room.id)}
                        className="p-3.5 flex items-center justify-between gap-3 cursor-pointer hover:bg-slate-50 transition-colors select-none"
                      >
                        <div className="flex items-center gap-3 min-w-0 flex-1">
                          <div className="h-2.5 w-2.5 rounded-full shrink-0 bg-[#4A5E78]" />
                          <div className="min-w-0 flex-1 space-y-1">
                            <span className="text-[17px] font-sans font-medium text-[#241E1A] leading-none">
                              № {room.roomNumber}
                            </span>
                            <p className="text-[11px] font-sans font-normal text-[#8A8177] leading-tight truncate">
                              {room.category} · {assignedCleaner} · {durationLabel}
                            </p>
                          </div>
                        </div>
                        <div className="shrink-0 flex items-center gap-2">
                          <span className="text-xs font-sans font-normal text-[#8A8177]">
                            {lang === 'RU' ? `сдан ${room.endTime || '12:05'}` : `submitted ${room.endTime || '12:05'}`}
                          </span>
                          <ChevronRight className="h-4 w-4 text-[#8A8177] shrink-0" />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* ACCEPTED HISTORY LIST */}
          {(auditFilter === 'WAITING' || auditFilter === 'ACCEPTED') && (
            <div className="space-y-2">
              <span className="text-[10px] font-sans font-medium tracking-[0.08em] text-[#8A8177] uppercase block select-none">
                {auditFilter === 'ACCEPTED' ? (lang === 'RU' ? 'ПРИНЯТЫЕ СЕГОДНЯ' : 'ACCEPTED TODAY') : (lang === 'RU' ? 'ПРОВЕРЕНЫ СЕГОДНЯ' : 'VERIFIED TODAY')}
              </span>
              <div className="bg-white rounded-[18px] border border-[#E5E2DD] divide-y divide-[#E5E2DD]/50 overflow-hidden shadow-2xs">
                {(auditFilter === 'ACCEPTED' ? acceptedHistory : acceptedHistory.slice(0, 2)).map(item => (
                  <div key={item.roomNumber} className="p-3.5 flex items-center justify-between gap-3 select-none">
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <div className="h-2.5 w-2.5 rounded-full shrink-0 bg-[#5B8C6E]" />
                      <div className="min-w-0 flex-1 space-y-1">
                        <span className="text-[17px] font-sans font-medium text-[#241E1A] leading-none">№ {item.roomNumber}</span>
                        <p className="text-[11px] font-sans font-normal text-[#8A8177] leading-tight truncate">
                          {item.type} · {item.cleaner} · {item.comment}
                        </p>
                      </div>
                    </div>
                    <div className="shrink-0 flex items-center gap-2">
                      <span className="text-xs font-sans font-medium text-[#5B8C6E]">
                        {lang === 'RU' ? 'принят' : 'accepted'}
                      </span>
                    </div>
                  </div>
                ))}

                {/* Render the declined one inline if in WAITING view */}
                {auditFilter === 'WAITING' && (
                  <div className="p-3.5 flex items-center justify-between gap-3 select-none">
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <div className="h-2.5 w-2.5 rounded-full shrink-0 bg-[#B3261E]" />
                      <div className="min-w-0 flex-1 space-y-1">
                        <span className="text-[17px] font-sans font-medium text-[#241E1A] leading-none">№ 210</span>
                        <p className="text-[11px] font-sans font-normal text-[#8A8177] leading-tight truncate">
                          Junior Suite · {lang === 'RU' ? 'Маркус Броди · пыль на поверхностях' : 'Marcus Brody · dust on surfaces'}
                        </p>
                      </div>
                    </div>
                    <div className="shrink-0 flex items-center gap-2">
                      <span className="text-xs font-sans font-medium text-rose-600">
                        {lang === 'RU' ? 'отклонён' : 'declined'}
                      </span>
                    </div>
                  </div>
                )}

                {/* Show the rest of the accepted rooms if we are in ACCEPTED view */}
                {auditFilter === 'ACCEPTED' && acceptedHistory.slice(2).map(item => (
                  <div key={item.roomNumber} className="p-3.5 flex items-center justify-between gap-3 select-none">
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <div className="h-2.5 w-2.5 rounded-full shrink-0 bg-[#5B8C6E]" />
                      <div className="min-w-0 flex-1 space-y-1">
                        <span className="text-[17px] font-sans font-medium text-[#241E1A] leading-none">№ {item.roomNumber}</span>
                        <p className="text-[11px] font-sans font-normal text-[#8A8177] leading-tight truncate">
                          {item.type} · {item.cleaner} · {item.comment}
                        </p>
                      </div>
                    </div>
                    <div className="shrink-0 flex items-center gap-2">
                      <span className="text-xs font-sans font-medium text-[#5B8C6E]">
                        {lang === 'RU' ? 'принят' : 'accepted'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
{/* REJECTED LIST VIEW */}
          {auditFilter === 'REJECTED' && (
            <div className="space-y-2">
              <span className="text-[10px] font-sans font-medium tracking-[0.08em] text-[#8A8177] uppercase block select-none">
                {lang === 'RU' ? 'ОТКЛОНЁННЫЕ СЕГОДНЯ' : 'DECLINED TODAY'}
              </span>
              <div className="bg-white rounded-[18px] border border-[#E5E2DD] divide-y divide-[#E5E2DD]/50 overflow-hidden shadow-2xs">
                {rejectedHistory.map(item => (
                  <div key={item.roomNumber} className="p-3.5 flex items-center justify-between gap-3 select-none">
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <div className="h-2.5 w-2.5 rounded-full shrink-0 bg-[#B3261E]" />
                      <div className="min-w-0 flex-1 space-y-1">
                        <span className="text-[17px] font-sans font-medium text-[#241E1A] leading-none">№ {item.roomNumber}</span>
                        <p className="text-[11px] font-sans font-normal text-[#8A8177] leading-tight truncate">
                          {item.type} · {item.cleaner} · {item.comment}
                        </p>
                      </div>
                    </div>
                    <div className="shrink-0 flex items-center gap-2">
                      <span className="text-xs font-sans font-medium text-rose-600">
                        {lang === 'RU' ? 'отклонён' : 'declined'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderMaintenance = () => {
    const inProgressRequests = maintenanceRequests.filter(r => r.status !== 'RESOLVED');
    const resolvedRequests = maintenanceRequests.filter(r => r.status === 'RESOLVED');
    const inProgressCount = inProgressRequests.length;
    const blocksCount = inProgressRequests.filter(r => r.blocksCleaning).length;

    const filteredRequests = maintenanceRequests.filter(req => {
      if (maintenanceFilter === 'IN_PROGRESS') return req.status !== 'RESOLVED';
      if (maintenanceFilter === 'RESOLVED') return req.status === 'RESOLVED';
      return true;
    });

    const activeList = filteredRequests.filter(req => req.status !== 'RESOLVED');
    const resolvedList = filteredRequests.filter(req => req.status === 'RESOLVED');

    return (
      <div className="flex-1 flex flex-col min-h-0 bg-[#FAF7F3]">
        {/* Header */}
        <div className="bg-[#FAF7F3] pt-6 pb-3.5 px-4.5 space-y-3.5 border-b border-[#E5E2DD]/60 shrink-0">
          <div>
            <h1 className="text-2xl font-serif font-medium text-[#241E1A] leading-tight select-none">
              {lang === 'RU' ? 'Техслужба' : 'Maintenance'}
            </h1>
            <p className="text-[11px] font-sans font-normal text-[#8A8177] mt-1.5 select-none">
              <span className="text-[#241E1A] font-medium">{inProgressCount}</span> {lang === 'RU' ? 'заявки в работе' : 'issues active'} · <span className="text-[#B3261E] font-medium">{blocksCount}</span> {lang === 'RU' ? 'блокирует уборку' : 'blocking cleaning'}
            </p>
          </div>

          {/* Filter Pills */}
          <div className="flex gap-2 overflow-x-auto no-scrollbar py-0.5 select-none">
            <button
              onClick={() => setMaintenanceFilter('ALL')}
              className={`px-3 py-1.5 rounded-full border text-[11px] font-sans font-medium transition-all cursor-pointer whitespace-nowrap ${
                maintenanceFilter === 'ALL'
                  ? 'bg-[#241E1A] border-[#241E1A] text-white'
                  : 'bg-white border-[#E5E2DD] text-[#8A8177] hover:text-[#241E1A]'
              }`}
            >
              {lang === 'RU' ? `Все ${maintenanceRequests.length}` : `All ${maintenanceRequests.length}`}
            </button>
            <button
              onClick={() => setMaintenanceFilter('IN_PROGRESS')}
              className={`px-3 py-1.5 rounded-full border text-[11px] font-sans font-medium transition-all cursor-pointer whitespace-nowrap ${
                maintenanceFilter === 'IN_PROGRESS'
                  ? 'bg-[#241E1A] border-[#241E1A] text-white'
                  : 'bg-white border-[#E5E2DD] text-[#8A8177] hover:text-[#241E1A]'
              }`}
            >
              {lang === 'RU' ? `В работе ${inProgressCount}` : `In progress ${inProgressCount}`}
            </button>
            <button
              onClick={() => setMaintenanceFilter('RESOLVED')}
              className={`px-3 py-1.5 rounded-full border text-[11px] font-sans font-medium transition-all cursor-pointer whitespace-nowrap ${
                maintenanceFilter === 'RESOLVED'
                  ? 'bg-[#241E1A] border-[#241E1A] text-white'
                  : 'bg-white border-[#E5E2DD] text-[#8A8177] hover:text-[#241E1A]'
              }`}
            >
              {lang === 'RU' ? `Устранённые ${resolvedRequests.length}` : `Resolved ${resolvedRequests.length}`}
            </button>
          </div>
        </div>

        {/* Scrollable Body */}
        <div className="p-3.5 space-y-5 flex-1 flex flex-col min-h-0 overflow-y-auto no-scrollbar">
          {filteredRequests.length === 0 ? (
            <div className="bg-white rounded-[18px] border border-[#E5E2DD] p-8 text-center text-[#8A8177]/80 font-sans font-normal text-xs">
              {lang === 'RU' ? 'Нет заявок по этому фильтру' : 'No requests for this filter'}
            </div>
          ) : (
            <>
              {/* ACTIVE ISSUES */}
              {activeList.length > 0 && (
                <div className="space-y-2">
                  <span className="text-[10px] font-sans font-medium tracking-[0.08em] text-[#8A8177] uppercase block select-none">
                    {lang === 'RU' ? 'В РАБОТЕ' : 'ACTIVE'}
                  </span>
                  <div className="bg-white rounded-[18px] border border-[#E5E2DD] divide-y divide-[#E5E2DD]/50 overflow-hidden shadow-2xs">
                    {activeList.map(req => {
                      const desc = lang === 'RU' ? req.descriptionRu || req.description : req.descriptionEn || req.description;
                      const catLabel = req.category === 'PLUMBING' ? (lang === 'RU' ? 'Сантехника' : 'Plumbing')
                        : req.category === 'ELECTRICAL' ? (lang === 'RU' ? 'Электрика' : 'Electrical')
                        : req.category === 'FURNITURE' ? (lang === 'RU' ? 'Мебель' : 'Furniture')
                        : req.category === 'APPLIANCES' ? (lang === 'RU' ? 'Бытовая техника' : 'Appliances')
                        : req.category === 'CLEANLINESS' ? (lang === 'RU' ? 'Чистота / Грязь' : 'Cleanliness')
                        : (lang === 'RU' ? 'Другое' : 'Other');

                      const dotColor = req.blocksCleaning ? 'bg-[#B3261E]' : 'bg-[#E4732C]';

                      return (
                        <div
                          key={req.id}
                          onClick={() => setSelectedMaintenanceId(req.id)}
                          className="p-3.5 flex items-center justify-between gap-3 cursor-pointer hover:bg-slate-50 transition-colors select-none"
                        >
                          <div className="flex items-center gap-3 min-w-0 flex-1">
                            <div className={`h-2.5 w-2.5 rounded-full shrink-0 ${dotColor}`} />
                            <div className="min-w-0 flex-1 space-y-1">
                              <div className="flex items-center gap-1.5">
                                <span className="text-[17px] font-sans font-medium text-[#241E1A] leading-none">
                                  № {req.roomNumber}
                                </span>
                                {req.blocksCleaning && (
                                  <span className="bg-[#FDF2F2] text-[#B3261E] border border-[#F5C2C2]/30 text-[9px] rounded px-1.5 py-0.5 leading-none font-sans font-normal uppercase tracking-wider scale-95">
                                    {lang === 'RU' ? 'БЛОКИРУЕТ' : 'BLOCKS'}
                                  </span>
                                )}
                              </div>
                              <p className="text-[11px] font-sans font-normal text-[#8A8177] leading-tight truncate">
                                {catLabel} · {desc}
                              </p>
                            </div>
                          </div>
                          <div className="shrink-0 flex items-center gap-2">
                            <span className="text-xs font-sans font-normal text-[#8A8177]">
                              {req.timestamp.substring(0, 12)}
                            </span>
                            <ChevronRight className="h-4 w-4 text-[#8A8177] shrink-0" />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* RESOLVED ISSUES */}
              {resolvedList.length > 0 && (
                <div className="space-y-2">
                  <span className="text-[10px] font-sans font-medium tracking-[0.08em] text-[#8A8177] uppercase block select-none">
                    {lang === 'RU' ? 'УСТРАНЕНЫ' : 'RESOLVED'}
                  </span>
                  <div className="bg-white rounded-[18px] border border-[#E5E2DD] divide-y divide-[#E5E2DD]/50 overflow-hidden shadow-2xs">
                    {resolvedList.map(req => {
                      const desc = lang === 'RU' ? req.descriptionRu || req.description : req.descriptionEn || req.description;
                      const catLabel = req.category === 'PLUMBING' ? (lang === 'RU' ? 'Сантехника' : 'Plumbing')
                        : req.category === 'ELECTRICAL' ? (lang === 'RU' ? 'Электрика' : 'Electrical')
                        : req.category === 'FURNITURE' ? (lang === 'RU' ? 'Мебель' : 'Furniture')
                        : req.category === 'APPLIANCES' ? (lang === 'RU' ? 'Бытовая техника' : 'Appliances')
                        : req.category === 'CLEANLINESS' ? (lang === 'RU' ? 'Чистота / Грязь' : 'Cleanliness')
                        : (lang === 'RU' ? 'Другое' : 'Other');

                      return (
                        <div
                          key={req.id}
                          onClick={() => setSelectedMaintenanceId(req.id)}
                          className="p-3.5 flex items-center justify-between gap-3 cursor-pointer hover:bg-slate-50 transition-colors select-none"
                        >
                          <div className="flex items-center gap-3 min-w-0 flex-1">
                            <div className="h-2.5 w-2.5 rounded-full shrink-0 bg-[#5B8C6E]" />
                            <div className="min-w-0 flex-1 space-y-1">
                              <span className="text-[17px] font-sans font-medium text-[#241E1A] leading-none">
                                № {req.roomNumber}
                              </span>
                              <p className="text-[11px] font-sans font-normal text-[#8A8177] leading-tight truncate">
                                {catLabel} · {desc}
                              </p>
                            </div>
                          </div>
                          <div className="shrink-0 flex items-center gap-2">
                            <span className="text-xs font-sans font-normal text-[#5B8C6E]">
                              {lang === 'RU' ? 'устранена' : 'resolved'}
                            </span>
                            <ChevronRight className="h-4 w-4 text-[#8A8177] shrink-0" />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    );
  };

  const renderTeam = () => {
    if (activeTeamMemberId) {
      const cleaner = cleaners.find(c => c.id === activeTeamMemberId);
      if (!cleaner) {
        setActiveTeamMemberId(null);
        return null;
      }

      const cleanerRooms = rooms.filter(r => {
        const cleanerName = lang === 'RU' ? cleaner.fullNameRu : cleaner.fullName;
        const firstName = cleanerName.split(' ')[0];
        return r.notesRu?.includes(firstName) || r.notesEn?.includes(cleaner.fullName.split(' ')[0]);
      });

      let shiftStatusColorClass = 'text-[#8A8177]';
      if (cleaner.currentShift.status === 'ON_SHIFT') {
        shiftStatusColorClass = 'text-[#5B8C6E]';
      } else if (cleaner.currentShift.status === 'ON_BREAK') {
        shiftStatusColorClass = 'text-[#E4732C]';
      }

      return (
        <div className="flex-1 flex flex-col min-h-0 bg-[#FAF7F3]">
          {/* Header */}
          <div className="bg-[#FAF7F3] pt-6 pb-3.5 px-4.5 space-y-2 border-b border-[#E5E2DD]/60 shrink-0">
            <div className="flex items-center gap-2">
              <button 
                onClick={() => setActiveTeamMemberId(null)}
                className="h-9 w-9 -ml-2 rounded-full text-[#8A8177] hover:bg-slate-100 flex items-center justify-center cursor-pointer transition-colors"
              >
                <ArrowLeft className="h-5 w-5 text-[#241E1A]" />
              </button>
              <h1 className="text-2xl font-serif font-medium text-[#241E1A] leading-tight select-none">
                {lang === 'RU' ? cleaner.fullNameRu : cleaner.fullName}
              </h1>
            </div>
            
            <p className="text-[11px] font-sans font-normal text-[#8A8177] leading-normal flex items-center gap-1 flex-wrap pl-1 select-none">
              <span>
                {cleaner.role === 'SENIOR_CLEANER' ? (lang === 'RU' ? 'Старший клинер' : 'Senior housekeeper') : (lang === 'RU' ? 'Клинер' : 'Housekeeper')}
              </span>
              <span>·</span>
              
              {/* Floor assignment dropdown select */}
              <select
                value={cleaner.floorAssigned}
                onChange={(e) => {
                  const newFloor = e.target.value;
                  setCleaners(prev => prev.map(c => {
                    if (c.id === cleaner.id) {
                      return { ...c, floorAssigned: newFloor };
                    }
                    return c;
                  }));
                }}
                className="bg-transparent text-[#241E1A] focus:outline-none cursor-pointer underline decoration-[#8A8177]/40 underline-offset-2 font-sans font-normal text-[11px] py-0 border-none outline-none"
              >
                <option value="Floor 2 (Rooms 201-220)">{lang === 'RU' ? '2 этаж, 201–220' : 'Floor 2, 201–220'}</option>
                <option value="Floor 3 (Rooms 301-320)">{lang === 'RU' ? '3 этаж, 301–320' : 'Floor 3, 301–320'}</option>
                <option value="Floor 4 (Rooms 401-420)">{lang === 'RU' ? '4 этаж, 401–420' : 'Floor 4, 401–420'}</option>
              </select>

              <span>·</span>

              {/* Shift status dropdown select */}
              <select
                value={cleaner.currentShift.status}
                onChange={(e) => {
                  const newStatus = e.target.value as any;
                  setCleaners(prev => prev.map(c => {
                    if (c.id === cleaner.id) {
                      return {
                        ...c,
                        currentShift: {
                          ...c.currentShift,
                          status: newStatus
                        }
                      };
                    }
                    return c;
                  }));
                }}
                className={`bg-transparent ${shiftStatusColorClass} font-medium focus:outline-none cursor-pointer underline underline-offset-2 font-sans text-[11px] py-0 border-none outline-none`}
              >
                <option value="ON_SHIFT">{lang === 'RU' ? 'на смене' : 'on shift'}</option>
                <option value="ON_BREAK">{lang === 'RU' ? 'перерыв' : 'on break'}</option>
                <option value="OFF_SHIFT">{lang === 'RU' ? 'не на смене' : 'off shift'}</option>
              </select>
            </p>
          </div>

          {/* Body Section */}
          <div className="p-4.5 pt-4.5 space-y-5 flex-1 flex flex-col min-h-0 overflow-y-auto no-scrollbar">
            {/* Stats Box */}
            <div className="bg-white rounded-[18px] border border-[#E5E2DD] p-4.5 grid grid-cols-3 gap-2.5 divide-x divide-[#E5E2DD]/50 text-center select-none shadow-2xs">
              <div className="space-y-1">
                <div className="text-[17px] font-sans font-medium text-[#241E1A]">
                  {cleaner.currentShift.roomsCompleted} <span className="text-[#8A8177] font-normal text-xs">/ {cleaner.currentShift.roomsTotal}</span>
                </div>
                <span className="block text-[10px] font-sans font-normal text-[#8A8177] uppercase tracking-wider">{lang === 'RU' ? 'убрано' : 'cleaned'}</span>
              </div>
              <div className="space-y-1">
                <div className="text-[17px] font-sans font-medium text-[#241E1A]">
                  {cleaner.currentShift.avgTimePerRoom}
                </div>
                <span className="block text-[10px] font-sans font-normal text-[#8A8177] uppercase tracking-wider">{lang === 'RU' ? 'на номер' : 'per room'}</span>
              </div>
              <div className="space-y-1">
                <div className="text-[17px] font-sans font-medium text-[#241E1A]">
                  {cleaner.roomNumber === '304' ? '5:44' : '4:30'}
                </div>
                <span className="block text-[10px] font-sans font-normal text-[#8A8177] uppercase tracking-wider">{lang === 'RU' ? 'на смене' : 'on shift'}</span>
              </div>
            </div>

            {/* Current Tasks */}
            <div className="space-y-2">
              <span className="text-[10px] font-sans font-medium tracking-[0.08em] text-[#8A8177] uppercase block select-none">
                {lang === 'RU' ? 'ТЕКУЩИЕ ЗАДАЧИ' : 'CURRENT TASKS'}
              </span>
              {cleanerRooms.length === 0 ? (
                <div className="bg-white rounded-[18px] border border-[#E5E2DD] p-8 text-center text-[#8A8177]/80 font-sans font-normal text-xs">
                  {lang === 'RU' ? 'Нет активных задач' : 'No active tasks'}
                </div>
              ) : (
                <div className="bg-white rounded-[18px] border border-[#E5E2DD] divide-y divide-[#E5E2DD]/50 overflow-hidden shadow-2xs">
                  {cleanerRooms.map(room => {
                    const isOverdue = room.isOverdue;
                    
                    let dotColor = 'bg-[#FAF2E6] border border-[#E5E2DD]';
                    if (room.status === 'PROBLEM' || room.priority === 'URGENT') dotColor = 'bg-[#B3261E]';
                    else if (room.status === 'IN_PROGRESS') dotColor = 'bg-[#E4732C]';
                    else if (room.status === 'READY') dotColor = 'bg-[#4A5E78]';

                    let statusText = '';
                    if (isOverdue) statusText = lang === 'RU' ? '+24 мин' : '+24 min';
                    else if (room.status === 'PROBLEM') statusText = lang === 'RU' ? 'заблокирован' : 'blocked';
                    else if (room.status === 'IN_PROGRESS') {
                      const mins = room.roomNumber === '304' ? 12 : 6;
                      statusText = lang === 'RU' ? `в уборке · ${mins} мин` : `cleaning · ${mins} min`;
                    } else if (room.status === 'READY') {
                      statusText = lang === 'RU' ? 'на проверке' : 'audit';
                    } else {
                      const time = room.roomNumber === '316' ? '16:30' : '14:00';
                      statusText = lang === 'RU' ? `до ${time}` : `by ${time}`;
                    }

                    return (
                      <div
                        key={room.id}
                        onClick={() => {
                          setSelectedDashboardRoomId(room.id);
                        }}
                        className="p-3.5 flex items-center justify-between gap-3 cursor-pointer hover:bg-slate-50 transition-colors select-none"
                      >
                        <div className="flex items-center gap-3 min-w-0 flex-1">
                          <div className={`h-2.5 w-2.5 rounded-full shrink-0 ${dotColor}`} />
                          <div className="min-w-0 flex-1 space-y-1">
                            <span className="text-[17px] font-sans font-medium text-[#241E1A] leading-none">
                              № {room.roomNumber}
                            </span>
                            <p className="text-[11px] font-sans font-normal text-[#8A8177] leading-tight truncate">
                              {room.category} · {room.type === 'CHECK_OUT' ? (lang === 'RU' ? 'выездная' : 'check-out') : (lang === 'RU' ? 'текущая' : 'stay-over')}
                            </p>
                          </div>
                        </div>
                        <div className="shrink-0 flex items-center gap-2">
                          <span className={`text-xs font-sans font-normal ${isOverdue ? 'text-rose-700 font-medium' : 'text-[#8A8177]'}`}>
                            {statusText}
                          </span>
                          <ChevronRight className="h-4 w-4 text-[#8A8177] shrink-0" />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Bottom Controls */}
          <div className="p-4.5 bg-[#FAF7F3] border-t border-[#E5E2DD]/30 grid grid-cols-2 gap-3 shrink-0">
            <button
              onClick={() => {
                const contact = chatContacts.find(c => c.name.toLowerCase().includes(cleaner.fullName.toLowerCase().split(' ')[0]));
                if (contact) {
                  setActiveChatContactId(contact.id);
                  setShowChats(true);
                }
              }}
              className="w-full bg-white hover:bg-slate-50 border border-[#E5E2DD] text-[#241E1A] font-sans font-medium text-xs py-3 rounded-xl transition-all cursor-pointer text-center"
            >
              {lang === 'RU' ? 'Написать' : 'Message'}
            </button>
            <button
              onClick={() => {
                setSourceCleanerId(cleaner.id);
                setShowReallocateModal(true);
              }}
              className="w-full bg-[#C2410C] hover:bg-[#A93A0C] text-white font-sans font-medium text-xs py-3 rounded-xl shadow-xs transition-colors cursor-pointer text-center"
            >
              {lang === 'RU' ? 'Передать задачи' : 'Transfer tasks'}
            </button>
          </div>
        </div>
      );
    }

    const onShiftCount = cleaners.filter(c => c.currentShift.status === 'ON_SHIFT').length;
    const onBreakCount = cleaners.filter(c => c.currentShift.status === 'ON_BREAK').length;

    const filteredCleaners = cleaners.filter(c => {
      const name = lang === 'RU' ? c.fullNameRu : c.fullName;
      return name.toLowerCase().includes(teamSearchQuery.toLowerCase());
    });

    return (
      <div className="flex-1 flex flex-col min-h-0 bg-[#FAF7F3]">
        {/* Header */}
        <div className="bg-[#FAF7F3] pt-6 pb-3.5 px-4.5 space-y-3.5 border-b border-[#E5E2DD]/60 shrink-0">
          <div>
            <h1 className="text-2xl font-serif font-medium text-[#241E1A] leading-tight select-none">
              {lang === 'RU' ? 'Команда' : 'Team'}
            </h1>
            <p className="text-[11px] font-sans font-normal text-[#8A8177] mt-1.5 select-none">
              <span className="text-[#241E1A] font-medium">{onShiftCount}</span> {lang === 'RU' ? 'на смене' : 'on shift'} · <span className="text-[#241E1A] font-medium">{onBreakCount}</span> {lang === 'RU' ? 'на перерыве' : 'on break'}
            </p>
          </div>

          {/* Search bar */}
          <div className="relative">
            <input
              type="text"
              placeholder={lang === 'RU' ? 'Поиск по имени' : 'Search by name'}
              value={teamSearchQuery}
              onChange={e => setTeamSearchQuery(e.target.value)}
              className="w-full bg-white border border-[#E5E2DD] rounded-xl pl-9 pr-9 py-2 text-xs text-[#241E1A] placeholder-[#8A8177]/80 focus:outline-none focus:ring-1 focus:ring-[#C2410C] font-sans font-normal h-10 transition-all"
            />
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[#8A8177]" />
            {teamSearchQuery && (
              <button 
                onClick={() => setTeamSearchQuery('')} 
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#8A8177] hover:text-[#241E1A] font-black text-sm cursor-pointer h-5 w-5 flex items-center justify-center rounded-full hover:bg-slate-100"
              >
                ×
              </button>
            )}
          </div>
        </div>

        {/* List Body */}
        <div className="p-3.5 space-y-3.5 flex-1 flex flex-col min-h-0 overflow-y-auto no-scrollbar">
          <div className="bg-white rounded-[18px] border border-[#E5E2DD] divide-y divide-[#E5E2DD]/50 overflow-hidden shadow-2xs">
            {filteredCleaners.map(cleaner => {
              const initials = cleaner.fullName.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2);
              
              let statusLabel = lang === 'RU' ? 'не на смене' : 'off shift';
              let statusColorClass = 'text-[#8A8177]';
              if (cleaner.currentShift.status === 'ON_SHIFT') {
                statusLabel = lang === 'RU' ? 'на смене' : 'on shift';
                statusColorClass = 'text-[#5B8C6E]';
              } else if (cleaner.currentShift.status === 'ON_BREAK') {
                statusLabel = lang === 'RU' ? 'перерыв' : 'break';
                statusColorClass = 'text-[#E4732C]';
              }

              return (
                <div
                  key={cleaner.id}
                  onClick={() => setActiveTeamMemberId(cleaner.id)}
                  className="p-3.5 flex items-center justify-between gap-3 cursor-pointer hover:bg-slate-50 transition-colors select-none"
                >
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    {/* Initials bubble */}
                    <div className="h-10 w-10 rounded-full bg-[#FAF6F0] border border-[#E5E2DD]/40 flex items-center justify-center text-[13px] font-sans font-medium text-[#241E1A] shrink-0 shadow-inner">
                      {initials}
                    </div>
                    <div className="min-w-0 flex-1">
                      <span className="text-[15px] font-sans font-medium text-[#241E1A]">
                        {lang === 'RU' ? cleaner.fullNameRu : cleaner.fullName}
                      </span>
                    </div>
                  </div>
                  <div className="shrink-0 flex items-center gap-2">
                    <span className={`text-xs font-sans font-normal ${statusColorClass}`}>
                      {statusLabel}
                    </span>
                    <ChevronRight className="h-4 w-4 text-[#8A8177] shrink-0" />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
        {/* Bottom Button */}
        <div className="p-4.5 bg-[#FAF7F3] border-t border-[#E5E2DD]/30 shrink-0">
          <button
            onClick={() => setShowReallocateModal(true)}
            className="w-full bg-[#C2410C] hover:bg-[#A93A0C] text-white font-sans font-medium text-xs py-3 rounded-xl shadow-xs transition-colors cursor-pointer text-center"
          >
            {lang === 'RU' ? 'Перераспределить задачи' : 'Reallocate workload'}
          </button>
        </div>
      </div>
    );
  };

  // =========================================================================
  // SCREEN 10: ОТЧЁТ ПО СМЕНЕ
  // =========================================================================
  const renderShiftReportScreen = () => {
    return (
      <div className="flex-1 flex flex-col min-h-0 bg-[#FAF7F3] font-sans">
        <div className="flex-1 overflow-y-auto no-scrollbar p-4.5 space-y-4">
          {/* Header */}
          <div className="pt-2 pb-1">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setSvActiveSubscreen('NONE')}
                className="h-8 w-8 -ml-1 rounded-full flex items-center justify-center text-[#241E1A] hover:bg-black/5 transition-colors cursor-pointer"
              >
                <ChevronLeft className="h-6 w-6" />
              </button>
              <h1 className="font-serif font-medium text-2xl text-[#241E1A] leading-tight">
                {lang === 'RU' ? 'Отчёт по смене' : 'Shift Report'}
              </h1>
            </div>
            <p className="text-xs font-sans font-normal text-[#8A8177] pt-1 pl-8">
              SH-4092 · 27 авг · с 08:00
            </p>
          </div>

          {/* ИТОГИ СМЕНЫ */}
          <div className="space-y-2 pt-1">
            <span className="text-[10px] font-sans font-medium tracking-[0.08em] text-[#8A8177] uppercase block select-none">
              {lang === 'RU' ? 'ИТОГИ СМЕНЫ' : 'SHIFT SUMMARY'}
            </span>

            <div className="bg-white rounded-[20px] border border-[#E5E2DD] p-4 shadow-2xs">
              <div className="grid grid-cols-3 divide-x divide-[#E5E2DD]/50 text-center">
                <div className="px-1">
                  <div className="text-lg font-sans font-medium text-[#241E1A]">
                    14 <span className="text-xs font-normal text-[#8A8177]">/ 24</span>
                  </div>
                  <p className="text-[10px] font-sans font-normal text-[#8A8177] mt-0.5">
                    {lang === 'RU' ? 'сдано' : 'accepted'}
                  </p>
                </div>

                <div className="px-1">
                  <div className="text-lg font-sans font-medium text-[#241E1A]">
                    21 <span className="text-xs font-normal text-[#8A8177]">мин</span>
                  </div>
                  <p className="text-[10px] font-sans font-normal text-[#8A8177] mt-0.5">
                    {lang === 'RU' ? 'в среднем' : 'avg time'}
                  </p>
                </div>

                <div className="px-1">
                  <div className="text-lg font-sans font-medium text-[#241E1A]">
                    92<span className="text-xs font-normal text-[#8A8177]">%</span>
                  </div>
                  <p className="text-[10px] font-sans font-normal text-[#8A8177] mt-0.5">
                    {lang === 'RU' ? 'принято сразу' : 'first pass'}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* ПО СОТРУДНИКАМ */}
          <div className="space-y-2 pt-1">
            <span className="text-[10px] font-sans font-medium tracking-[0.08em] text-[#8A8177] uppercase block select-none">
              {lang === 'RU' ? 'ПО СОТРУДНИКАМ' : 'BY HOUSEKEEPER'}
            </span>

            <div className="bg-white rounded-[20px] border border-[#E5E2DD] divide-y divide-[#E5E2DD]/50 shadow-2xs overflow-hidden">
              {/* Elena Vance */}
              <div
                onClick={() => {
                  const staff = supervisorStaffList.find(s => s.id === 'cln-001');
                  if (staff) setSelectedStaffMember(staff);
                  setSvActiveSubscreen('EMPLOYEE_CARD');
                }}
                className="p-3.5 flex items-center justify-between hover:bg-slate-50/70 transition-colors cursor-pointer"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="h-9 w-9 rounded-full bg-[#E5E0D8] text-[#8A8177] text-xs font-sans font-medium flex items-center justify-center shrink-0">
                    ЕВ
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-sans font-medium text-[#241E1A]">Елена Вэнс</span>
                      <span className="text-xs font-sans text-[#8A8177]">8 из 12</span>
                    </div>
                    <p className="text-xs font-sans font-normal text-[#8A8177] mt-0.5">
                      22 мин на номер · без отклонений
                    </p>
                  </div>
                </div>
                <ChevronRight className="h-4 w-4 text-[#8A8177] shrink-0" />
              </div>

              {/* Marcus Brody */}
              <div
                onClick={() => {
                  const staff = supervisorStaffList.find(s => s.id === 'cln-002');
                  if (staff) setSelectedStaffMember(staff);
                  setSvActiveSubscreen('EMPLOYEE_CARD');
                }}
                className="p-3.5 flex items-center justify-between hover:bg-slate-50/70 transition-colors cursor-pointer"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="h-9 w-9 rounded-full bg-[#E5E0D8] text-[#8A8177] text-xs font-sans font-medium flex items-center justify-center shrink-0">
                    МБ
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-sans font-medium text-[#241E1A]">Маркус Броди</span>
                      <span className="text-xs font-sans text-[#8A8177]">5 из 10</span>
                    </div>
                    <p className="text-xs font-sans font-normal text-[#8A8177] mt-0.5">
                      25 мин на номер · <span className="text-[#B3261E] font-medium">1 отклонение</span>
                    </p>
                  </div>
                </div>
                <ChevronRight className="h-4 w-4 text-[#8A8177] shrink-0" />
              </div>

              {/* Aigul Mukan */}
              <div
                onClick={() => {
                  const staff = supervisorStaffList.find(s => s.id === 'cln-003');
                  if (staff) setSelectedStaffMember(staff);
                  setSvActiveSubscreen('EMPLOYEE_CARD');
                }}
                className="p-3.5 flex items-center justify-between hover:bg-slate-50/70 transition-colors cursor-pointer"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="h-9 w-9 rounded-full bg-[#E5E0D8] text-[#8A8177] text-xs font-sans font-medium flex items-center justify-center shrink-0">
                    АМ
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-sans font-medium text-[#241E1A]">Айгуль Мукан</span>
                      <span className="text-xs font-sans text-[#8A8177]">6 из 8</span>
                    </div>
                    <p className="text-xs font-sans font-normal text-[#8A8177] mt-0.5">
                      19 мин на номер · без отклонений
                    </p>
                  </div>
                </div>
                <ChevronRight className="h-4 w-4 text-[#8A8177] shrink-0" />
              </div>

              {/* Dana Kasymova */}
              <div
                onClick={() => {
                  setSvActiveSubscreen('EMPLOYEE_CARD');
                }}
                className="p-3.5 flex items-center justify-between hover:bg-slate-50/70 transition-colors cursor-pointer"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="h-9 w-9 rounded-full bg-[#E5E0D8] text-[#8A8177] text-xs font-sans font-medium flex items-center justify-center shrink-0">
                    ДК
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-sans font-medium text-[#241E1A]">Дана Касымова</span>
                      <span className="text-xs font-sans text-[#8A8177]">4 из 9</span>
                    </div>
                    <p className="text-xs font-sans font-normal text-[#8A8177] mt-0.5">
                      28 мин на номер · без отклонений
                    </p>
                  </div>
                </div>
                <ChevronRight className="h-4 w-4 text-[#8A8177] shrink-0" />
              </div>
            </div>
          </div>

          {/* ДЛИТЕЛЬНОСТЬ ПО НОМЕРАМ */}
          <div className="space-y-2 pt-1">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-sans font-medium tracking-[0.08em] text-[#8A8177] uppercase block select-none">
                {lang === 'RU' ? 'ДЛИТЕЛЬНОСТЬ ПО НОМЕРАМ' : 'ROOM CLEANING TIME'}
              </span>
              <span className="text-xs font-sans font-normal text-[#8A8177]">
                {lang === 'RU' ? 'норма 25 мин' : 'target 25 min'}
              </span>
            </div>

            <div className="bg-white rounded-[20px] border border-[#E5E2DD] p-4 space-y-3 shadow-2xs">
              <div className="flex items-center gap-3 text-xs font-sans">
                <span className="w-12 text-[#8A8177]">№ 301</span>
                <div className="flex-1 h-1.5 bg-[#EFECE6] rounded-full overflow-hidden">
                  <div className="h-full bg-[#E4762B] rounded-full" style={{ width: '56%' }} />
                </div>
                <span className="w-12 text-right font-medium text-[#241E1A]">14 мин</span>
              </div>

              <div className="flex items-center gap-3 text-xs font-sans">
                <span className="w-12 text-[#8A8177]">№ 205</span>
                <div className="flex-1 h-1.5 bg-[#EFECE6] rounded-full overflow-hidden">
                  <div className="h-full bg-[#E4762B] rounded-full" style={{ width: '72%' }} />
                </div>
                <span className="w-12 text-right font-medium text-[#241E1A]">18 мин</span>
              </div>

              <div className="flex items-center gap-3 text-xs font-sans">
                <span className="w-12 text-[#8A8177]">№ 306</span>
                <div className="flex-1 h-1.5 bg-[#EFECE6] rounded-full overflow-hidden">
                  <div className="h-full bg-[#E4762B] rounded-full" style={{ width: '80%' }} />
                </div>
                <span className="w-12 text-right font-medium text-[#241E1A]">20 мин</span>
              </div>

              <div className="flex items-center gap-3 text-xs font-sans">
                <span className="w-12 text-[#8A8177]">№ 310</span>
                <div className="flex-1 h-1.5 bg-[#EFECE6] rounded-full overflow-hidden">
                  <div className="h-full bg-[#B3261E] rounded-full" style={{ width: '100%' }} />
                </div>
                <span className="w-12 text-right font-medium text-[#B3261E]">31 мин</span>
              </div>

              <div className="flex items-center gap-3 text-xs font-sans">
                <span className="w-12 text-[#8A8177]">№ 410</span>
                <div className="flex-1 h-1.5 bg-[#EFECE6] rounded-full overflow-hidden">
                  <div className="h-full bg-[#E4762B] rounded-full" style={{ width: '84%' }} />
                </div>
                <span className="w-12 text-right font-medium text-[#241E1A]">21 мин</span>
              </div>
            </div>
          </div>

          {/* СОБЫТИЯ СМЕНЫ */}
          <div className="space-y-2 pt-1 pb-4">
            <span className="text-[10px] font-sans font-medium tracking-[0.08em] text-[#8A8177] uppercase block select-none">
              {lang === 'RU' ? 'СОБЫТИЯ СМЕНЫ' : 'SHIFT TIMELINE'}
            </span>

            <div className="bg-white rounded-[20px] border border-[#E5E2DD] divide-y divide-[#E5E2DD]/50 shadow-2xs overflow-hidden">
              <div className="p-3.5 flex items-start gap-3">
                <span className="h-2 w-2 rounded-full bg-[#B3261E] shrink-0 mt-1" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-sans font-medium text-[#241E1A]">
                      № 210 отклонён при проверке
                    </span>
                    <span className="text-xs font-sans text-[#8A8177]">13:20</span>
                  </div>
                  <p className="text-[10px] font-sans text-[#8A8177] mt-0.5">
                    Маркус Броди · пыль на поверхностях
                  </p>
                </div>
              </div>

              <div className="p-3.5 flex items-start gap-3">
                <span className="h-2 w-2 rounded-full bg-[#B3261E] shrink-0 mt-1" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-sans font-medium text-[#241E1A]">
                      № 312 просрочен
                    </span>
                    <span className="text-xs font-sans text-[#8A8177]">13:24</span>
                  </div>
                  <p className="text-[10px] font-sans text-[#8A8177] mt-0.5">
                    Елена Вэнс · +24 мин к нормативу
                  </p>
                </div>
              </div>

              <div className="p-3.5 flex items-start gap-3">
                <span className="h-2 w-2 rounded-full bg-[#E4762B] shrink-0 mt-1" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-sans font-medium text-[#241E1A]">
                      № 315 заблокирован
                    </span>
                    <span className="text-xs font-sans text-[#8A8177]">17:40</span>
                  </div>
                  <p className="text-[10px] font-sans text-[#8A8177] mt-0.5">
                    Заявка в техслужбу · протечка в душе
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom CTAs */}
        <div className="p-4 bg-[#FAF7F3] border-t border-[#E5E2DD] shrink-0 flex gap-2.5">
          <button
            type="button"
            onClick={() => alert(lang === 'RU' ? 'Отчёт сформирован и отправлен в чат руководителя' : 'Report sent to manager chat')}
            className="flex-1 bg-white hover:bg-slate-50 border border-[#E5E2DD] text-[#241E1A] font-sans font-medium text-xs py-3.5 rounded-xl shadow-2xs transition-all cursor-pointer text-center"
          >
            {lang === 'RU' ? 'Отправить руководителю' : 'Send to Manager'}
          </button>
          <button
            type="button"
            onClick={() => alert(lang === 'RU' ? 'PDF отчёт успешно выгружен в файлы устройства' : 'PDF Report downloaded')}
            className="flex-1 bg-[#C2410C] hover:bg-[#A93A0C] active:scale-[0.99] text-white font-sans font-medium text-xs py-3.5 rounded-xl shadow-xs transition-all cursor-pointer text-center"
          >
            {lang === 'RU' ? 'Выгрузить отчёт' : 'Export PDF'}
          </button>
        </div>
      </div>
    );
  };

  // =========================================================================
  // SCREEN 11: УПРАВЛЕНИЕ ПЕРСОНАЛОМ
  // =========================================================================
  const renderStaffManagementScreen = () => {
    const filteredStaff = supervisorStaffList.filter(s => {
      const q = staffSearchQuery.toLowerCase();
      const matchQuery = s.name.toLowerCase().includes(q) || s.phone.includes(q) || s.badgeId.toLowerCase().includes(q) || s.roleTitleRu.toLowerCase().includes(q);
      if (!matchQuery) return false;
      if (staffRoleFilter === 'CLEANERS') return s.position === 'CLEANER' || s.position === 'SENIOR_CLEANER';
      if (staffRoleFilter === 'SUPERVISORS') return s.position === 'SUPERVISOR' && s.id.startsWith('sv');
      if (staffRoleFilter === 'TECHS') return s.id.startsWith('tech');
      return true;
    });

    return (
      <div className="flex-1 flex flex-col min-h-0 bg-[#FAF7F3] font-sans">
        <div className="flex-1 overflow-y-auto no-scrollbar p-4.5 space-y-4">
          {/* Header */}
          <div className="pt-2 pb-1">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setSvActiveSubscreen('NONE')}
                className="h-8 w-8 -ml-1 rounded-full flex items-center justify-center text-[#241E1A] hover:bg-black/5 transition-colors cursor-pointer"
              >
                <ChevronLeft className="h-6 w-6" />
              </button>
              <h1 className="font-serif font-medium text-2xl text-[#241E1A] leading-tight">
                {lang === 'RU' ? 'Персонал' : 'Staff'}
              </h1>
            </div>
            <p className="text-xs font-sans font-normal text-[#8A8177] pt-1 pl-8">
              <b>12</b> {lang === 'RU' ? 'сотрудников · 5 на смене' : 'staff · 5 on shift'}
            </p>
          </div>

          {/* Search bar */}
          <div className="bg-white rounded-2xl border border-[#E5E2DD] px-3.5 py-2.5 flex items-center gap-2.5 shadow-2xs">
            <Search className="h-4 w-4 text-[#8A8177] shrink-0" />
            <input
              type="text"
              placeholder={lang === 'RU' ? 'Поиск по имени или роли' : 'Search name or role'}
              value={staffSearchQuery}
              onChange={(e) => setStaffSearchQuery(e.target.value)}
              className="w-full bg-transparent text-xs text-[#241E1A] placeholder-[#8A8177] focus:outline-none font-sans font-normal"
            />
          </div>

          {/* Role Filter Chips */}
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar">
            <button
              type="button"
              onClick={() => setStaffRoleFilter('ALL')}
              className={`px-3.5 py-1.5 rounded-full text-xs font-sans transition-all cursor-pointer ${
                staffRoleFilter === 'ALL'
                  ? 'bg-[#241E1A] text-white font-medium shadow-xs'
                  : 'bg-white border border-[#E5E2DD] text-[#8A8177] hover:text-[#241E1A] font-normal'
              }`}
            >
              {lang === 'RU' ? 'Все' : 'All'} <span className="opacity-60 ml-1">12</span>
            </button>
            <button
              type="button"
              onClick={() => setStaffRoleFilter('CLEANERS')}
              className={`px-3.5 py-1.5 rounded-full text-xs font-sans transition-all cursor-pointer ${
                staffRoleFilter === 'CLEANERS'
                  ? 'bg-[#241E1A] text-white font-medium shadow-xs'
                  : 'bg-white border border-[#E5E2DD] text-[#8A8177] hover:text-[#241E1A] font-normal'
              }`}
            >
              {lang === 'RU' ? 'Клинеры' : 'Cleaners'} <span className="opacity-60 ml-1">8</span>
            </button>
            <button
              type="button"
              onClick={() => setStaffRoleFilter('SUPERVISORS')}
              className={`px-3.5 py-1.5 rounded-full text-xs font-sans transition-all cursor-pointer ${
                staffRoleFilter === 'SUPERVISORS'
                  ? 'bg-[#241E1A] text-white font-medium shadow-xs'
                  : 'bg-white border border-[#E5E2DD] text-[#8A8177] hover:text-[#241E1A] font-normal'
              }`}
            >
              {lang === 'RU' ? 'Супервайзеры' : 'Supervisors'} <span className="opacity-60 ml-1">2</span>
            </button>
            <button
              type="button"
              onClick={() => setStaffRoleFilter('TECHS')}
              className={`px-3.5 py-1.5 rounded-full text-xs font-sans transition-all cursor-pointer ${
                staffRoleFilter === 'TECHS'
                  ? 'bg-[#241E1A] text-white font-medium shadow-xs'
                  : 'bg-white border border-[#E5E2DD] text-[#8A8177] hover:text-[#241E1A] font-normal'
              }`}
            >
              {lang === 'RU' ? 'Техники' : 'Techs'} <span className="opacity-60 ml-1">2</span>
            </button>
          </div>

          {/* СОТРУДНИКИ */}
          <div className="space-y-2 pt-1">
            <span className="text-[10px] font-sans font-medium tracking-[0.08em] text-[#8A8177] uppercase block select-none">
              {lang === 'RU' ? 'СОТРУДНИКИ' : 'EMPLOYEES'}
            </span>

            <div className="bg-white rounded-[20px] border border-[#E5E2DD] divide-y divide-[#E5E2DD]/50 shadow-2xs overflow-hidden">
              {filteredStaff.map((staff) => {
                const isShiftOn = staff.shiftStatus === 'ON_SHIFT';
                const isBreak = staff.shiftStatus === 'ON_BREAK';

                return (
                  <div
                    key={staff.id}
                    onClick={() => {
                      setSelectedStaffMember(staff);
                      setSvActiveSubscreen('EMPLOYEE_CARD');
                    }}
                    className="p-3.5 flex items-center justify-between hover:bg-slate-50/70 transition-colors cursor-pointer"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="h-9 w-9 rounded-full bg-[#E5E0D8] text-[#8A8177] text-xs font-sans font-medium flex items-center justify-center shrink-0">
                        {staff.initials}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-sans font-medium text-[#241E1A]">
                            {lang === 'RU' ? staff.name : staff.nameEn}
                          </span>
                          <span
                            className={`text-[10px] font-sans font-medium px-1.5 py-0.5 rounded ${
                              isShiftOn
                                ? 'bg-[#E9F0EB] text-[#3D6A50]'
                                : isBreak
                                ? 'bg-[#FAF0E4] text-[#8A5210]'
                                : 'bg-[#F1ECE5] text-[#8A8177]'
                            }`}
                          >
                            {isShiftOn ? (lang === 'RU' ? 'на смене' : 'on shift') : isBreak ? (lang === 'RU' ? 'перерыв' : 'break') : (lang === 'RU' ? 'не на смене' : 'off shift')}
                          </span>
                        </div>
                        <p className="text-xs font-sans font-normal text-[#8A8177] mt-0.5 truncate">
                          {staff.roleTitleRu}
                        </p>
                      </div>
                    </div>
                    <ChevronRight className="h-4 w-4 text-[#8A8177] shrink-0" />
                  </div>
                );
              })}
            </div>
          </div>

          {/* ПРИГЛАШЕНИЯ */}
          <div className="space-y-2 pt-1 pb-4">
            <span className="text-[10px] font-sans font-medium tracking-[0.08em] text-[#8A8177] uppercase block select-none">
              {lang === 'RU' ? 'ПРИГЛАШЕНИЯ' : 'PENDING INVITATIONS'}
            </span>

            <div className="bg-white rounded-[20px] border border-[#E5E2DD] divide-y divide-[#E5E2DD]/50 shadow-2xs overflow-hidden">
              {invitedStaffList.map((inv) => (
                <div key={inv.id} className="p-3.5 flex items-center justify-between">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="h-9 w-9 rounded-full bg-[#F1ECE5] text-[#8A8177] text-xs font-sans font-medium flex items-center justify-center shrink-0">
                      ?
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-sans font-medium text-[#241E1A]">{inv.phone}</span>
                        <span className="bg-[#FAF0E4] text-[#8A5210] text-[10px] font-sans font-medium px-1.5 py-0.5 rounded">
                          {lang === 'RU' ? 'ждёт входа' : 'pending login'}
                        </span>
                      </div>
                      <p className="text-xs font-sans font-normal text-[#8A8177] mt-0.5">
                        {inv.role} · {lang === 'RU' ? `приглашение от ${inv.sentDate}` : `invited ${inv.sentDate}`}
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      if (confirm(lang === 'RU' ? 'Отозвать приглашение?' : 'Revoke invitation?')) {
                        setInvitedStaffList(prev => prev.filter(i => i.id !== inv.id));
                      }
                    }}
                    className="h-8 w-8 rounded-full flex items-center justify-center text-[#8A8177] hover:text-[#B3261E] hover:bg-black/5 transition-colors cursor-pointer"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Bottom CTA */}
        <div className="p-4 bg-[#FAF7F3] border-t border-[#E5E2DD] shrink-0">
          <button
            type="button"
            onClick={() => setShowAddStaffModal(true)}
            className="w-full bg-[#C2410C] hover:bg-[#A93A0C] active:scale-[0.99] text-white font-sans font-medium text-xs py-3.5 rounded-xl shadow-xs transition-all cursor-pointer text-center"
          >
            {lang === 'RU' ? 'Добавить сотрудника' : 'Add Employee'}
          </button>
        </div>
      </div>
    );
  };

  // =========================================================================
  // SCREEN 12: КАРТОЧКА СОТРУДНИКА И ДОСТУПЫ
  // =========================================================================
  const renderEmployeeCardScreen = () => {
    const s = selectedStaffMember;

    return (
      <div className="flex-1 flex flex-col min-h-0 bg-[#FAF7F3] font-sans">
        <div className="flex-1 overflow-y-auto no-scrollbar p-4.5 space-y-4">
          {/* Header */}
          <div className="pt-2 pb-1">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setSvActiveSubscreen('STAFF_MANAGEMENT')}
                className="h-8 w-8 -ml-1 rounded-full flex items-center justify-center text-[#241E1A] hover:bg-black/5 transition-colors cursor-pointer"
              >
                <ChevronLeft className="h-6 w-6" />
              </button>
              <h1 className="font-serif font-medium text-2xl text-[#241E1A] leading-tight">
                {lang === 'RU' ? s.name : s.nameEn}
              </h1>
            </div>
            <p className="text-xs font-sans font-normal text-[#8A8177] pt-1 pl-8">
              {s.badgeId} · {lang === 'RU' ? `на смене с ${s.shiftStart}` : `on shift from ${s.shiftStart}`}
            </p>
          </div>

          {/* ДОЛЖНОСТЬ */}
          <div className="space-y-2 pt-1">
            <span className="text-[10px] font-sans font-medium tracking-[0.08em] text-[#8A8177] uppercase block select-none">
              {lang === 'RU' ? 'ДОЛЖНОСТЬ' : 'POSITION'}
            </span>

            <div className="bg-white rounded-[20px] border border-[#E5E2DD] p-4.5 space-y-3.5 shadow-2xs">
              {/* Position Segment Pills */}
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setSelectedStaffMember((prev: any) => ({
                      ...prev,
                      position: 'CLEANER',
                      permissions: {
                        ownRooms: true,
                        allRooms: false,
                        inspection: false,
                        maintenanceRequests: true,
                        staffManagement: false,
                        appSettings: false
                      }
                    }));
                  }}
                  className={`py-2 rounded-xl text-xs font-sans transition-all cursor-pointer text-center ${
                    s.position === 'CLEANER'
                      ? 'bg-[#241E1A] text-white font-medium shadow-xs'
                      : 'bg-white border border-[#E5E2DD] text-[#8A8177] hover:text-[#241E1A] font-normal'
                  }`}
                >
                  {lang === 'RU' ? 'Клинер' : 'Cleaner'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedStaffMember((prev: any) => ({
                      ...prev,
                      position: 'SENIOR_CLEANER',
                      permissions: {
                        ownRooms: true,
                        allRooms: true,
                        inspection: false,
                        maintenanceRequests: true,
                        staffManagement: false,
                        appSettings: false
                      }
                    }));
                  }}
                  className={`py-2 rounded-xl text-xs font-sans transition-all cursor-pointer text-center ${
                    s.position === 'SENIOR_CLEANER'
                      ? 'bg-[#241E1A] text-white font-medium shadow-xs'
                      : 'bg-white border border-[#E5E2DD] text-[#8A8177] hover:text-[#241E1A] font-normal'
                  }`}
                >
                  {lang === 'RU' ? 'Ст. клинер' : 'Sr Cleaner'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedStaffMember((prev: any) => ({
                      ...prev,
                      position: 'SUPERVISOR',
                      permissions: {
                        ownRooms: true,
                        allRooms: true,
                        inspection: true,
                        maintenanceRequests: true,
                        staffManagement: true,
                        appSettings: true
                      }
                    }));
                  }}
                  className={`py-2 rounded-xl text-xs font-sans transition-all cursor-pointer text-center ${
                    s.position === 'SUPERVISOR'
                      ? 'bg-[#241E1A] text-white font-medium shadow-xs'
                      : 'bg-white border border-[#E5E2DD] text-[#8A8177] hover:text-[#241E1A] font-normal'
                  }`}
                >
                  {lang === 'RU' ? 'Супервайзер' : 'Supervisor'}
                </button>
              </div>

              <div className="divide-y divide-[#E5E2DD]/50 text-xs font-sans">
                <div className="py-2.5 flex items-center justify-between">
                  <span className="text-[#8A8177]">{lang === 'RU' ? 'Зона ответственности' : 'Assigned Zone'}</span>
                  <div className="flex items-center gap-1 font-medium text-[#241E1A]">
                    <span>{s.zone}</span>
                    <ChevronRight className="h-3.5 w-3.5 text-[#8A8177]" />
                  </div>
                </div>

                <div className="py-2.5 flex items-center justify-between">
                  <span className="text-[#8A8177]">{lang === 'RU' ? 'Телефон' : 'Phone'}</span>
                  <span className="font-medium text-[#241E1A]">{s.phone}</span>
                </div>

                <div className="py-2.5 flex items-center justify-between">
                  <span className="text-[#8A8177]">{lang === 'RU' ? 'Табельный номер' : 'Badge ID'}</span>
                  <span className="font-medium text-[#241E1A]">{s.badgeId}</span>
                </div>
              </div>
            </div>
          </div>

          {/* ДОСТУП В ПРИЛОЖЕНИИ */}
          <div className="space-y-2 pt-1">
            <span className="text-[10px] font-sans font-medium tracking-[0.08em] text-[#8A8177] uppercase block select-none">
              {lang === 'RU' ? 'ДОСТУП В ПРИЛОЖЕНИИ' : 'APP PERMISSIONS'}
            </span>

            <div className="bg-white rounded-[20px] border border-[#E5E2DD] divide-y divide-[#E5E2DD]/50 shadow-2xs overflow-hidden">
              <div className="p-3.5 flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-sans font-medium text-[#241E1A]">{lang === 'RU' ? 'Свои номера' : 'My Rooms'}</h4>
                  <p className="text-xs font-sans font-normal text-[#8A8177] mt-0.5">{lang === 'RU' ? 'список задач и чек-листы' : 'task list & checklists'}</p>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedStaffMember((p: any) => ({ ...p, permissions: { ...p.permissions, ownRooms: !p.permissions.ownRooms } }))}
                  className={`w-11 h-6 rounded-full transition-colors relative cursor-pointer ${s.permissions.ownRooms ? 'bg-[#5B8C6E]' : 'bg-[#E5E2DD]'}`}
                >
                  <span className={`h-5 w-5 rounded-full bg-white block shadow-xs transition-transform transform ${s.permissions.ownRooms ? 'translate-x-5.5' : 'translate-x-0.5'} mt-0.5`} />
                </button>
              </div>

              <div className="p-3.5 flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-sans font-medium text-[#241E1A]">{lang === 'RU' ? 'Все номера отеля' : 'All Hotel Rooms'}</h4>
                  <p className="text-xs font-sans font-normal text-[#8A8177] mt-0.5">{lang === 'RU' ? 'мониторинг чужих задач' : 'monitoring other tasks'}</p>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedStaffMember((p: any) => ({ ...p, permissions: { ...p.permissions, allRooms: !p.permissions.allRooms } }))}
                  className={`w-11 h-6 rounded-full transition-colors relative cursor-pointer ${s.permissions.allRooms ? 'bg-[#5B8C6E]' : 'bg-[#E5E2DD]'}`}
                >
                  <span className={`h-5 w-5 rounded-full bg-white block shadow-xs transition-transform transform ${s.permissions.allRooms ? 'translate-x-5.5' : 'translate-x-0.5'} mt-0.5`} />
                </button>
              </div>

              <div className="p-3.5 flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-sans font-medium text-[#241E1A]">{lang === 'RU' ? 'Инспекция и приёмка' : 'Inspection & Audits'}</h4>
                  <p className="text-xs font-sans font-normal text-[#8A8177] mt-0.5">{lang === 'RU' ? 'принимать и отклонять номера' : 'accept & reject rooms'}</p>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedStaffMember((p: any) => ({ ...p, permissions: { ...p.permissions, inspection: !p.permissions.inspection } }))}
                  className={`w-11 h-6 rounded-full transition-colors relative cursor-pointer ${s.permissions.inspection ? 'bg-[#5B8C6E]' : 'bg-[#E5E2DD]'}`}
                >
                  <span className={`h-5 w-5 rounded-full bg-white block shadow-xs transition-transform transform ${s.permissions.inspection ? 'translate-x-5.5' : 'translate-x-0.5'} mt-0.5`} />
                </button>
              </div>

              <div className="p-3.5 flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-sans font-medium text-[#241E1A]">{lang === 'RU' ? 'Заявки в техслужбу' : 'Maintenance Tickets'}</h4>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedStaffMember((p: any) => ({ ...p, permissions: { ...p.permissions, maintenanceRequests: !p.permissions.maintenanceRequests } }))}
                  className={`w-11 h-6 rounded-full transition-colors relative cursor-pointer ${s.permissions.maintenanceRequests ? 'bg-[#5B8C6E]' : 'bg-[#E5E2DD]'}`}
                >
                  <span className={`h-5 w-5 rounded-full bg-white block shadow-xs transition-transform transform ${s.permissions.maintenanceRequests ? 'translate-x-5.5' : 'translate-x-0.5'} mt-0.5`} />
                </button>
              </div>

              <div className="p-3.5 flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-sans font-medium text-[#241E1A]">{lang === 'RU' ? 'Управление персоналом' : 'Staff Management'}</h4>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedStaffMember((p: any) => ({ ...p, permissions: { ...p.permissions, staffManagement: !p.permissions.staffManagement } }))}
                  className={`w-11 h-6 rounded-full transition-colors relative cursor-pointer ${s.permissions.staffManagement ? 'bg-[#5B8C6E]' : 'bg-[#E5E2DD]'}`}
                >
                  <span className={`h-5 w-5 rounded-full bg-white block shadow-xs transition-transform transform ${s.permissions.staffManagement ? 'translate-x-5.5' : 'translate-x-0.5'} mt-0.5`} />
                </button>
              </div>

              <div className="p-3.5 flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-sans font-medium text-[#241E1A]">{lang === 'RU' ? 'Настройки приложения' : 'App Settings'}</h4>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedStaffMember((p: any) => ({ ...p, permissions: { ...p.permissions, appSettings: !p.permissions.appSettings } }))}
                  className={`w-11 h-6 rounded-full transition-colors relative cursor-pointer ${s.permissions.appSettings ? 'bg-[#5B8C6E]' : 'bg-[#E5E2DD]'}`}
                >
                  <span className={`h-5 w-5 rounded-full bg-white block shadow-xs transition-transform transform ${s.permissions.appSettings ? 'translate-x-5.5' : 'translate-x-0.5'} mt-0.5`} />
                </button>
              </div>
            </div>
          </div>

          {/* СМЕНЫ */}
          <div className="space-y-2 pt-1">
            <span className="text-[10px] font-sans font-medium tracking-[0.08em] text-[#8A8177] uppercase block select-none">
              {lang === 'RU' ? 'СМЕНЫ' : 'SHIFTS & SCHEDULE'}
            </span>

            <div className="bg-white rounded-[20px] border border-[#E5E2DD] divide-y divide-[#E5E2DD]/50 p-4 space-y-2 text-xs font-sans shadow-2xs">
              <div className="flex items-center justify-between py-1">
                <span className="text-[#8A8177]">{lang === 'RU' ? 'График' : 'Schedule'}</span>
                <div className="flex items-center gap-1 font-medium text-[#241E1A]">
                  <span>{s.schedule}</span>
                  <ChevronRight className="h-3.5 w-3.5 text-[#8A8177]" />
                </div>
              </div>

              <div className="flex items-center justify-between pt-2">
                <span className="text-[#8A8177]">{lang === 'RU' ? 'Норматив на номер' : 'Target Per Room'}</span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setSelectedStaffMember((p: any) => ({ ...p, personalNormMin: Math.max(10, p.personalNormMin - 5) }))}
                    className="h-6 w-6 rounded bg-[#F1ECE5] flex items-center justify-center text-xs font-bold text-[#241E1A] cursor-pointer"
                  >
                    -
                  </button>
                  <span className="font-medium text-[#241E1A] w-12 text-center">{s.personalNormMin} мин</span>
                  <button
                    type="button"
                    onClick={() => setSelectedStaffMember((p: any) => ({ ...p, personalNormMin: p.personalNormMin + 5 }))}
                    className="h-6 w-6 rounded bg-[#F1ECE5] flex items-center justify-center text-xs font-bold text-[#241E1A] cursor-pointer"
                  >
                    +
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* УВОЛЬНЕНИЕ */}
          <div className="pt-1 pb-4">
            <div
              onClick={() => setShowFireConfirmModal(true)}
              className="bg-white rounded-[20px] border border-[#E5E2DD] p-4 shadow-2xs cursor-pointer hover:bg-rose-50/40 transition-colors flex items-center gap-3"
            >
              <UserMinus className="h-4.5 w-4.5 text-[#B3261E] shrink-0" />
              <span className="text-xs font-sans font-medium text-[#B3261E]">
                {lang === 'RU' ? 'Уволить сотрудника' : 'Dismiss Employee'}
              </span>
            </div>
          </div>
        </div>

        {/* Bottom CTAs */}
        <div className="p-4 bg-[#FAF7F3] border-t border-[#E5E2DD] shrink-0 flex gap-2.5">
          <button
            type="button"
            onClick={() => {
              setShowChats(true);
            }}
            className="flex-1 bg-white hover:bg-slate-50 border border-[#E5E2DD] text-[#241E1A] font-sans font-medium text-xs py-3.5 rounded-xl shadow-2xs transition-all cursor-pointer text-center"
          >
            {lang === 'RU' ? 'Написать' : 'Message'}
          </button>
          <button
            type="button"
            onClick={() => {
              alert(lang === 'RU' ? 'Изменения профиля и прав сотрудника успешно сохранены' : 'Employee permissions saved');
              setSvActiveSubscreen('STAFF_MANAGEMENT');
            }}
            className="flex-1 bg-[#C2410C] hover:bg-[#A93A0C] active:scale-[0.99] text-white font-sans font-medium text-xs py-3.5 rounded-xl shadow-xs transition-all cursor-pointer text-center"
          >
            {lang === 'RU' ? 'Сохранить' : 'Save'}
          </button>
        </div>
      </div>
    );
  };

  // =========================================================================
  // SCREEN 13: НАСТРОИТЬ ПРИЛОЖЕНИЕ (КОНСТРУКТОР)
  // =========================================================================
  const renderAppConfigScreen = () => {
    return (
      <div className="flex-1 flex flex-col min-h-0 bg-[#FAF7F3] font-sans">
        <div className="flex-1 overflow-y-auto no-scrollbar p-4.5 space-y-4">
          {/* Header */}
          <div className="pt-2 pb-1">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setSvActiveSubscreen('NONE')}
                className="h-8 w-8 -ml-1 rounded-full flex items-center justify-center text-[#241E1A] hover:bg-black/5 transition-colors cursor-pointer"
              >
                <ChevronLeft className="h-6 w-6" />
              </button>
              <h1 className="font-serif font-medium text-2xl text-[#241E1A] leading-tight">
                {lang === 'RU' ? 'Настроить приложение' : 'App Settings'}
              </h1>
            </div>
            <p className="text-xs font-sans font-normal text-[#8A8177] pt-1 pl-8">
              {lang === 'RU' ? 'Конструктор объекта и чек-листов' : 'Property & Checklist Configurator'}
            </p>
          </div>

          {/* ТИП ОБЪЕКТА */}
          <div className="space-y-2 pt-1">
            <span className="text-[10px] font-sans font-medium tracking-[0.08em] text-[#8A8177] uppercase block select-none">
              {lang === 'RU' ? 'ТИП ОБЪЕКТА' : 'PROPERTY TYPE'}
            </span>

            {/* Chips */}
            <div className="flex items-center gap-2 overflow-x-auto no-scrollbar">
              {(['HOTEL', 'INN', 'APARTMENTS', 'CABINS'] as const).map((t) => {
                const labels: Record<string, string> = {
                  HOTEL: 'Отель',
                  INN: 'Гостиница',
                  APARTMENTS: 'Апартаменты',
                  CABINS: 'Домики'
                };
                return (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setObjectType(t)}
                    className={`px-3.5 py-1.5 rounded-full text-xs font-sans transition-all cursor-pointer ${
                      objectType === t
                        ? 'bg-[#241E1A] text-white font-medium shadow-xs'
                        : 'bg-white border border-[#E5E2DD] text-[#8A8177] hover:text-[#241E1A] font-normal'
                    }`}
                  >
                    {labels[t]}
                  </button>
                );
              })}
            </div>

            <div className="bg-white rounded-[20px] border border-[#E5E2DD] divide-y divide-[#E5E2DD]/50 p-4 space-y-2 text-xs font-sans shadow-2xs">
              <div className="flex items-center justify-between py-1">
                <span className="text-[#8A8177]">{lang === 'RU' ? 'Название' : 'Property Name'}</span>
                <div className="flex items-center gap-1 font-medium text-[#241E1A]">
                  <span>{objectName}</span>
                  <ChevronRight className="h-3.5 w-3.5 text-[#8A8177]" />
                </div>
              </div>
              <div className="flex items-center justify-between pt-2">
                <span className="text-[#8A8177]">{lang === 'RU' ? 'Часовой пояс' : 'Time Zone'}</span>
                <span className="font-medium text-[#241E1A]">{timeZone}</span>
              </div>
            </div>
          </div>

          {/* НОМЕРНОЙ ФОНД */}
          <div className="space-y-2 pt-1">
            <span className="text-[10px] font-sans font-medium tracking-[0.08em] text-[#8A8177] uppercase block select-none">
              {lang === 'RU' ? 'НОМЕРНОЙ ФОНД' : 'ROOM INVENTORY'}
            </span>

            <div className="bg-white rounded-[20px] border border-[#E5E2DD] divide-y divide-[#E5E2DD]/50 shadow-2xs overflow-hidden">
              <div className="p-3.5 flex items-center justify-between text-xs font-sans">
                <span className="text-sm font-medium text-[#241E1A]">{lang === 'RU' ? 'Этажей в отеле' : 'Total Floors'}</span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setFloorsCount(Math.max(1, floorsCount - 1))}
                    className="h-6 w-6 rounded bg-[#F1ECE5] flex items-center justify-center text-xs font-bold text-[#241E1A] cursor-pointer"
                  >
                    -
                  </button>
                  <span className="font-medium text-[#241E1A] w-6 text-center">{floorsCount}</span>
                  <button
                    type="button"
                    onClick={() => setFloorsCount(floorsCount + 1)}
                    className="h-6 w-6 rounded bg-[#F1ECE5] flex items-center justify-center text-xs font-bold text-[#241E1A] cursor-pointer"
                  >
                    +
                  </button>
                </div>
              </div>

              <div
                onClick={() => setSvActiveSubscreen('ROOMS_CONFIG')}
                className="p-3.5 flex items-center justify-between hover:bg-slate-50/70 transition-colors cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <DoorClosed className="h-4 w-4 text-[#8A8177]" />
                  <div>
                    <h4 className="text-xs font-sans font-medium text-[#241E1A]">{lang === 'RU' ? 'Номера' : 'Rooms'}</h4>
                    <p className="text-[10px] font-sans font-normal text-[#8A8177] mt-0.5">24 номера на 5 этажах</p>
                  </div>
                </div>
                <ChevronRight className="h-4 w-4 text-[#8A8177]" />
              </div>

              <div
                onClick={() => setSvActiveSubscreen('CHECKLIST_CONFIG')}
                className="p-3.5 flex items-center justify-between hover:bg-slate-50/70 transition-colors cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <Layers className="h-4 w-4 text-[#8A8177]" />
                  <div>
                    <h4 className="text-xs font-sans font-medium text-[#241E1A]">{lang === 'RU' ? 'Типы номеров' : 'Room Types'}</h4>
                    <p className="text-[10px] font-sans font-normal text-[#8A8177] mt-0.5">Standard, Twin, Junior, Deluxe, Executive, Presidential</p>
                  </div>
                </div>
                <ChevronRight className="h-4 w-4 text-[#8A8177]" />
              </div>
            </div>
          </div>

          {/* УБОРКА */}
          <div className="space-y-2 pt-1">
            <span className="text-[10px] font-sans font-medium tracking-[0.08em] text-[#8A8177] uppercase block select-none">
              {lang === 'RU' ? 'УБОРКА' : 'CLEANING CONFIG'}
            </span>

            <div className="bg-white rounded-[20px] border border-[#E5E2DD] divide-y divide-[#E5E2DD]/50 shadow-2xs overflow-hidden">
              <div
                onClick={() => setSvActiveSubscreen('CHECKLIST_CONFIG')}
                className="p-3.5 flex items-center justify-between hover:bg-slate-50/70 transition-colors cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <CheckSquare className="h-4 w-4 text-[#8A8177]" />
                  <div>
                    <h4 className="text-xs font-sans font-medium text-[#241E1A]">{lang === 'RU' ? 'Чек-листы по типам номеров' : 'Checklists by Room Type'}</h4>
                    <p className="text-[10px] font-sans font-normal text-[#8A8177] mt-0.5">6 шаблонов · зоны и задачи</p>
                  </div>
                </div>
                <ChevronRight className="h-4 w-4 text-[#8A8177]" />
              </div>

              <div
                onClick={() => setSvActiveSubscreen('TIME_NORMS_CONFIG')}
                className="p-3.5 flex items-center justify-between hover:bg-slate-50/70 transition-colors cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <Clock className="h-4 w-4 text-[#8A8177]" />
                  <div>
                    <h4 className="text-xs font-sans font-medium text-[#241E1A]">{lang === 'RU' ? 'Нормативы времени' : 'Time Norms'}</h4>
                    <p className="text-[10px] font-sans font-normal text-[#8A8177] mt-0.5">от 18 до 40 мин по типу номера</p>
                  </div>
                </div>
                <ChevronRight className="h-4 w-4 text-[#8A8177]" />
              </div>

              <div className="p-3.5 flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-sans font-medium text-[#241E1A]">{lang === 'RU' ? 'Обязательный фотоотчёт' : 'Mandatory Photo Report'}</h4>
                  <p className="text-[10px] font-sans font-normal text-[#8A8177] mt-0.5">{lang === 'RU' ? 'фото до и после в каждом номере' : 'before & after photos'}</p>
                </div>
                <button
                  type="button"
                  onClick={() => setMandatoryPhotoReport(!mandatoryPhotoReport)}
                  className={`w-11 h-6 rounded-full transition-colors relative cursor-pointer ${mandatoryPhotoReport ? 'bg-[#5B8C6E]' : 'bg-[#E5E2DD]'}`}
                >
                  <span className={`h-5 w-5 rounded-full bg-white block shadow-xs transition-transform transform ${mandatoryPhotoReport ? 'translate-x-5.5' : 'translate-x-0.5'} mt-0.5`} />
                </button>
              </div>

              <div className="p-3.5 flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-sans font-medium text-[#241E1A]">{lang === 'RU' ? 'Приёмка супервайзером' : 'Supervisor Audit Required'}</h4>
                  <p className="text-[10px] font-sans font-normal text-[#8A8177] mt-0.5">{lang === 'RU' ? 'номер сдаётся только после проверки' : 'rooms require approval'}</p>
                </div>
                <button
                  type="button"
                  onClick={() => setSupervisorAuditRequired(!supervisorAuditRequired)}
                  className={`w-11 h-6 rounded-full transition-colors relative cursor-pointer ${supervisorAuditRequired ? 'bg-[#5B8C6E]' : 'bg-[#E5E2DD]'}`}
                >
                  <span className={`h-5 w-5 rounded-full bg-white block shadow-xs transition-transform transform ${supervisorAuditRequired ? 'translate-x-5.5' : 'translate-x-0.5'} mt-0.5`} />
                </button>
              </div>
            </div>
          </div>

          {/* НАПОЛНЕНИЕ */}
          <div className="space-y-2 pt-1 pb-4">
            <span className="text-[10px] font-sans font-medium tracking-[0.08em] text-[#8A8177] uppercase block select-none">
              {lang === 'RU' ? 'НАПОЛНЕНИЕ' : 'PROVISIONS & INVENTORY'}
            </span>

            <div className="bg-white rounded-[20px] border border-[#E5E2DD] divide-y divide-[#E5E2DD]/50 shadow-2xs overflow-hidden">
              <div
                onClick={() => {
                  setMinibarTab('MINIBAR');
                  setSvActiveSubscreen('MINIBAR_CONFIG');
                }}
                className="p-3.5 flex items-center justify-between hover:bg-slate-50/70 transition-colors cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <Wine className="h-4 w-4 text-[#8A8177]" />
                  <div>
                    <h4 className="text-xs font-sans font-medium text-[#241E1A]">{lang === 'RU' ? 'Мини-бар' : 'Minibar'}</h4>
                    <p className="text-[10px] font-sans font-normal text-[#8A8177] mt-0.5">12 позиций</p>
                  </div>
                </div>
                <ChevronRight className="h-4 w-4 text-[#8A8177]" />
              </div>

              <div
                onClick={() => {
                  setMinibarTab('SUPPLIES');
                  setSvActiveSubscreen('MINIBAR_CONFIG');
                }}
                className="p-3.5 flex items-center justify-between hover:bg-slate-50/70 transition-colors cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <Package className="h-4 w-4 text-[#8A8177]" />
                  <div>
                    <h4 className="text-xs font-sans font-medium text-[#241E1A]">{lang === 'RU' ? 'Инвентарь и расходники' : 'Supplies & Linen'}</h4>
                    <p className="text-[10px] font-sans font-normal text-[#8A8177] mt-0.5">18 позиций · нормативы тележки</p>
                  </div>
                </div>
                <ChevronRight className="h-4 w-4 text-[#8A8177]" />
              </div>

              <div
                onClick={() => setSvActiveSubscreen('DEFECTS_CONFIG')}
                className="p-3.5 flex items-center justify-between hover:bg-slate-50/70 transition-colors cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <Wrench className="h-4 w-4 text-[#8A8177]" />
                  <div>
                    <h4 className="text-xs font-sans font-medium text-[#241E1A]">{lang === 'RU' ? 'Категории неполадок' : 'Defect Categories'}</h4>
                    <p className="text-[10px] font-sans font-normal text-[#8A8177] mt-0.5">Сантехника, электрика, мебель, климат</p>
                  </div>
                </div>
                <ChevronRight className="h-4 w-4 text-[#8A8177]" />
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // =========================================================================
  // SCREEN 14: ЧЕК-ЛИСТ ТИПА НОМЕРА (DELUXE SUITE)
  // =========================================================================
  const renderChecklistConfigScreen = () => {
    return (
      <div className="flex-1 flex flex-col min-h-0 bg-[#FAF7F3] font-sans">
        <div className="flex-1 overflow-y-auto no-scrollbar p-4.5 space-y-4">
          {/* Header */}
          <div className="pt-2 pb-1">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setSvActiveSubscreen('APP_CONFIG')}
                className="h-8 w-8 -ml-1 rounded-full flex items-center justify-center text-[#241E1A] hover:bg-black/5 transition-colors cursor-pointer"
              >
                <ChevronLeft className="h-6 w-6" />
              </button>
              <h1 className="font-serif font-medium text-2xl text-[#241E1A] leading-tight">
                {deluxeChecklist.name}
              </h1>
            </div>
            <p className="text-xs font-sans font-normal text-[#8A8177] pt-1 pl-8">
              {lang === 'RU' ? 'Шаблон уборки · применён к 6 номерам' : 'Cleaning template · applied to 6 rooms'}
            </p>
          </div>

          {/* СОСТАВ НОМЕРА */}
          <div className="space-y-2 pt-1">
            <span className="text-[10px] font-sans font-medium tracking-[0.08em] text-[#8A8177] uppercase block select-none">
              {lang === 'RU' ? 'СОСТАВ НОМЕРА' : 'ROOM COMPOSITION'}
            </span>

            <div className="bg-white rounded-[20px] border border-[#E5E2DD] divide-y divide-[#E5E2DD]/50 shadow-2xs overflow-hidden">
              <div className="p-3.5 flex items-center justify-between text-xs font-sans">
                <span className="text-sm font-medium text-[#241E1A]">{lang === 'RU' ? 'Спален' : 'Bedrooms'}</span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setDeluxeChecklist(p => ({ ...p, bedrooms: Math.max(1, p.bedrooms - 1) }))}
                    className="h-6 w-6 rounded bg-[#F1ECE5] flex items-center justify-center text-xs font-bold text-[#241E1A] cursor-pointer"
                  >
                    -
                  </button>
                  <span className="font-medium text-[#241E1A] w-6 text-center">{deluxeChecklist.bedrooms}</span>
                  <button
                    type="button"
                    onClick={() => setDeluxeChecklist(p => ({ ...p, bedrooms: p.bedrooms + 1 }))}
                    className="h-6 w-6 rounded bg-[#F1ECE5] flex items-center justify-center text-xs font-bold text-[#241E1A] cursor-pointer"
                  >
                    +
                  </button>
                </div>
              </div>

              <div className="p-3.5 flex items-center justify-between text-xs font-sans">
                <span className="text-sm font-medium text-[#241E1A]">{lang === 'RU' ? 'Санузлов' : 'Bathrooms'}</span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setDeluxeChecklist(p => ({ ...p, bathrooms: Math.max(1, p.bathrooms - 1) }))}
                    className="h-6 w-6 rounded bg-[#F1ECE5] flex items-center justify-center text-xs font-bold text-[#241E1A] cursor-pointer"
                  >
                    -
                  </button>
                  <span className="font-medium text-[#241E1A] w-6 text-center">{deluxeChecklist.bathrooms}</span>
                  <button
                    type="button"
                    onClick={() => setDeluxeChecklist(p => ({ ...p, bathrooms: p.bathrooms + 1 }))}
                    className="h-6 w-6 rounded bg-[#F1ECE5] flex items-center justify-center text-xs font-bold text-[#241E1A] cursor-pointer"
                  >
                    +
                  </button>
                </div>
              </div>

              <div className="p-3.5 flex items-center justify-between">
                <span className="text-sm font-medium text-[#241E1A]">{lang === 'RU' ? 'Гостиная' : 'Living Room'}</span>
                <button
                  type="button"
                  onClick={() => setDeluxeChecklist(p => ({ ...p, hasLivingRoom: !p.hasLivingRoom }))}
                  className={`w-11 h-6 rounded-full transition-colors relative cursor-pointer ${deluxeChecklist.hasLivingRoom ? 'bg-[#5B8C6E]' : 'bg-[#E5E2DD]'}`}
                >
                  <span className={`h-5 w-5 rounded-full bg-white block shadow-xs transition-transform transform ${deluxeChecklist.hasLivingRoom ? 'translate-x-5.5' : 'translate-x-0.5'} mt-0.5`} />
                </button>
              </div>

              <div className="p-3.5 flex items-center justify-between">
                <span className="text-sm font-medium text-[#241E1A]">{lang === 'RU' ? 'Кухня' : 'Kitchen'}</span>
                <button
                  type="button"
                  onClick={() => setDeluxeChecklist(p => ({ ...p, hasKitchen: !p.hasKitchen }))}
                  className={`w-11 h-6 rounded-full transition-colors relative cursor-pointer ${deluxeChecklist.hasKitchen ? 'bg-[#5B8C6E]' : 'bg-[#E5E2DD]'}`}
                >
                  <span className={`h-5 w-5 rounded-full bg-white block shadow-xs transition-transform transform ${deluxeChecklist.hasKitchen ? 'translate-x-5.5' : 'translate-x-0.5'} mt-0.5`} />
                </button>
              </div>

              <div className="p-3.5 flex items-center justify-between">
                <span className="text-sm font-medium text-[#241E1A]">{lang === 'RU' ? 'Мини-бар' : 'Minibar'}</span>
                <button
                  type="button"
                  onClick={() => setDeluxeChecklist(p => ({ ...p, hasMinibar: !p.hasMinibar }))}
                  className={`w-11 h-6 rounded-full transition-colors relative cursor-pointer ${deluxeChecklist.hasMinibar ? 'bg-[#5B8C6E]' : 'bg-[#E5E2DD]'}`}
                >
                  <span className={`h-5 w-5 rounded-full bg-white block shadow-xs transition-transform transform ${deluxeChecklist.hasMinibar ? 'translate-x-5.5' : 'translate-x-0.5'} mt-0.5`} />
                </button>
              </div>
            </div>

            {/* Explanatory Note */}
            <div className="bg-[#FDF6E8] border border-[#EFE0C4] rounded-2xl p-3.5 flex items-start gap-2.5 text-xs text-[#6B5A3E] leading-relaxed">
              <Info className="h-4 w-4 text-[#E4762B] shrink-0 mt-0.5" />
              <span>
                {lang === 'RU'
                  ? 'В чек-листе клинера появятся две спальни и два санузла — по отдельному блоку задач на каждую.'
                  : 'Two bedrooms and two bathrooms will multiply task blocks automatically.'}
              </span>
            </div>
          </div>

          {/* СПАЛЬНЯ */}
          <div className="space-y-2 pt-1">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-sans font-medium tracking-[0.08em] text-[#8A8177] uppercase block select-none">
                {lang === 'RU' ? 'СПАЛЬНЯ' : 'BEDROOM'}
              </span>
              <span className="text-xs font-sans font-normal text-[#8A8177]">
                {deluxeChecklist.bedroomTasks.length} {lang === 'RU' ? 'задачи' : 'tasks'}
              </span>
            </div>

            <div className="bg-white rounded-[20px] border border-[#E5E2DD] divide-y divide-[#E5E2DD]/50 shadow-2xs overflow-hidden">
              {deluxeChecklist.bedroomTasks.map((t, idx) => (
                <div key={idx} className="p-3.5 flex items-center justify-between">
                  <div className="flex items-center gap-3 min-w-0">
                    <GripVertical className="h-4 w-4 text-[#8A8177] cursor-grab" />
                    <span className="text-xs font-sans font-medium text-[#241E1A]">{t}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setDeluxeChecklist(p => ({ ...p, bedroomTasks: p.bedroomTasks.filter((_, i) => i !== idx) }))}
                    className="h-6 w-6 rounded-full flex items-center justify-center text-[#8A8177] hover:text-[#B3261E] cursor-pointer"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))}
              <div
                onClick={() => {
                  const newTask = prompt(lang === 'RU' ? 'Название задачи:' : 'Task name:');
                  if (newTask) setDeluxeChecklist(p => ({ ...p, bedroomTasks: [...p.bedroomTasks, newTask] }));
                }}
                className="p-3.5 flex items-center gap-2 text-xs font-sans font-medium text-[#C2410C] hover:bg-slate-50 cursor-pointer"
              >
                <Plus className="h-4 w-4" />
                <span>{lang === 'RU' ? 'Добавить задачу' : 'Add Task'}</span>
              </div>
            </div>
          </div>

          {/* ВАННАЯ КОМНАТА */}
          <div className="space-y-2 pt-1">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-sans font-medium tracking-[0.08em] text-[#8A8177] uppercase block select-none">
                {lang === 'RU' ? 'ВАННАЯ КОМНАТА' : 'BATHROOM'}
              </span>
              <span className="text-xs font-sans font-normal text-[#8A8177]">
                {deluxeChecklist.bathroomTasks.length} {lang === 'RU' ? 'задачи' : 'tasks'}
              </span>
            </div>

            <div className="bg-white rounded-[20px] border border-[#E5E2DD] divide-y divide-[#E5E2DD]/50 shadow-2xs overflow-hidden">
              {deluxeChecklist.bathroomTasks.map((t, idx) => (
                <div key={idx} className="p-3.5 flex items-center justify-between">
                  <div className="flex items-center gap-3 min-w-0">
                    <GripVertical className="h-4 w-4 text-[#8A8177] cursor-grab" />
                    <span className="text-xs font-sans font-medium text-[#241E1A]">{t}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setDeluxeChecklist(p => ({ ...p, bathroomTasks: p.bathroomTasks.filter((_, i) => i !== idx) }))}
                    className="h-6 w-6 rounded-full flex items-center justify-center text-[#8A8177] hover:text-[#B3261E] cursor-pointer"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))}
              <div
                onClick={() => {
                  const newTask = prompt(lang === 'RU' ? 'Название задачи:' : 'Task name:');
                  if (newTask) setDeluxeChecklist(p => ({ ...p, bathroomTasks: [...p.bathroomTasks, newTask] }));
                }}
                className="p-3.5 flex items-center gap-2 text-xs font-sans font-medium text-[#C2410C] hover:bg-slate-50 cursor-pointer"
              >
                <Plus className="h-4 w-4" />
                <span>{lang === 'RU' ? 'Добавить задачу' : 'Add Task'}</span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-[20px] border border-[#E5E2DD] p-3.5 flex items-center gap-2 text-xs font-sans font-medium text-[#C2410C] hover:bg-slate-50 cursor-pointer shadow-2xs">
            <Plus className="h-4 w-4" />
            <span>{lang === 'RU' ? 'Добавить зону' : 'Add Zone'}</span>
          </div>

          {/* ПАРАМЕТРЫ */}
          <div className="space-y-2 pt-1 pb-4">
            <span className="text-[10px] font-sans font-medium tracking-[0.08em] text-[#8A8177] uppercase block select-none">
              {lang === 'RU' ? 'ПАРАМЕТРЫ' : 'PARAMETERS'}
            </span>

            <div className="bg-white rounded-[20px] border border-[#E5E2DD] divide-y divide-[#E5E2DD]/50 shadow-2xs overflow-hidden">
              <div className="p-3.5 flex items-center justify-between text-xs font-sans">
                <span className="text-sm font-medium text-[#241E1A]">{lang === 'RU' ? 'Норматив, мин' : 'Norm, min'}</span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setDeluxeChecklist(p => ({ ...p, normMinutes: Math.max(10, p.normMinutes - 5) }))}
                    className="h-6 w-6 rounded bg-[#F1ECE5] flex items-center justify-center text-xs font-bold text-[#241E1A] cursor-pointer"
                  >
                    -
                  </button>
                  <span className="font-medium text-[#241E1A] w-8 text-center">{deluxeChecklist.normMinutes}</span>
                  <button
                    type="button"
                    onClick={() => setDeluxeChecklist(p => ({ ...p, normMinutes: p.normMinutes + 5 }))}
                    className="h-6 w-6 rounded bg-[#F1ECE5] flex items-center justify-center text-xs font-bold text-[#241E1A] cursor-pointer"
                  >
                    +
                  </button>
                </div>
              </div>

              <div className="p-3.5 flex items-center justify-between">
                <span className="text-sm font-medium text-[#241E1A]">{lang === 'RU' ? 'Фото каждой зоны' : 'Photo Required for Each Zone'}</span>
                <button
                  type="button"
                  onClick={() => setDeluxeChecklist(p => ({ ...p, photoEachZone: !p.photoEachZone }))}
                  className={`w-11 h-6 rounded-full transition-colors relative cursor-pointer ${deluxeChecklist.photoEachZone ? 'bg-[#5B8C6E]' : 'bg-[#E5E2DD]'}`}
                >
                  <span className={`h-5 w-5 rounded-full bg-white block shadow-xs transition-transform transform ${deluxeChecklist.photoEachZone ? 'translate-x-5.5' : 'translate-x-0.5'} mt-0.5`} />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom CTA */}
        <div className="p-4 bg-[#FAF7F3] border-t border-[#E5E2DD] shrink-0">
          <button
            type="button"
            onClick={() => {
              alert(lang === 'RU' ? 'Шаблон чек-листа успешно сохранён!' : 'Template saved!');
              setSvActiveSubscreen('APP_CONFIG');
            }}
            className="w-full bg-[#C2410C] hover:bg-[#A93A0C] active:scale-[0.99] text-white font-sans font-medium text-xs py-3.5 rounded-xl shadow-xs transition-all cursor-pointer text-center"
          >
            {lang === 'RU' ? 'Сохранить шаблон' : 'Save Template'}
          </button>
        </div>
      </div>
    );
  };

  // =========================================================================
  // SCREEN 15: МИНИ-БАР И ИНВЕНТАРЬ
  // =========================================================================
  const renderMinibarConfigScreen = () => {
    return (
      <div className="flex-1 flex flex-col min-h-0 bg-[#FAF7F3] font-sans">
        <div className="flex-1 overflow-y-auto no-scrollbar p-4.5 space-y-4">
          {/* Header */}
          <div className="pt-2 pb-1">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setSvActiveSubscreen('APP_CONFIG')}
                className="h-8 w-8 -ml-1 rounded-full flex items-center justify-center text-[#241E1A] hover:bg-black/5 transition-colors cursor-pointer"
              >
                <ChevronLeft className="h-6 w-6" />
              </button>
              <h1 className="font-serif font-medium text-2xl text-[#241E1A] leading-tight">
                {lang === 'RU' ? 'Наполнение' : 'Provisions & Inventory'}
              </h1>
            </div>
            <p className="text-xs font-sans font-normal text-[#8A8177] pt-1 pl-8">
              {lang === 'RU' ? 'Позиции и нормативы' : 'Items & Target Norms'}
            </p>
          </div>

          {/* Chips */}
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar">
            <button
              type="button"
              onClick={() => setMinibarTab('MINIBAR')}
              className={`px-3.5 py-1.5 rounded-full text-xs font-sans transition-all cursor-pointer ${
                minibarTab === 'MINIBAR'
                  ? 'bg-[#241E1A] text-white font-medium shadow-xs'
                  : 'bg-white border border-[#E5E2DD] text-[#8A8177] hover:text-[#241E1A] font-normal'
              }`}
            >
              {lang === 'RU' ? 'Мини-бар' : 'Minibar'}
            </button>
            <button
              type="button"
              onClick={() => setMinibarTab('SUPPLIES')}
              className={`px-3.5 py-1.5 rounded-full text-xs font-sans transition-all cursor-pointer ${
                minibarTab === 'SUPPLIES'
                  ? 'bg-[#241E1A] text-white font-medium shadow-xs'
                  : 'bg-white border border-[#E5E2DD] text-[#8A8177] hover:text-[#241E1A] font-normal'
              }`}
            >
              {lang === 'RU' ? 'Расходники' : 'Supplies & Linen'}
            </button>
            <button
              type="button"
              onClick={() => setMinibarTab('TROLLEY')}
              className={`px-3.5 py-1.5 rounded-full text-xs font-sans transition-all cursor-pointer ${
                minibarTab === 'TROLLEY'
                  ? 'bg-[#241E1A] text-white font-medium shadow-xs'
                  : 'bg-white border border-[#E5E2DD] text-[#8A8177] hover:text-[#241E1A] font-normal'
              }`}
            >
              {lang === 'RU' ? 'Инвентарь тележки' : 'Trolley Equipment'}
            </button>
          </div>

          {minibarTab === 'MINIBAR' && (
            <>
              {/* НАПИТКИ */}
              <div className="space-y-2 pt-1">
                <span className="text-[10px] font-sans font-medium tracking-[0.08em] text-[#8A8177] uppercase block select-none">
                  {lang === 'RU' ? 'НАПИТКИ' : 'DRINKS'}
                </span>

                <div className="bg-white rounded-[20px] border border-[#E5E2DD] divide-y divide-[#E5E2DD]/50 shadow-2xs overflow-hidden">
                  {minibarDrinks.map((item) => (
                    <div key={item.id} className="p-3.5 flex items-center justify-between text-xs font-sans">
                      <span className="text-sm font-medium text-[#241E1A]">{item.name}</span>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => setMinibarDrinks(p => p.map(x => x.id === item.id ? { ...x, qty: Math.max(0, x.qty - 1) } : x))}
                          className="h-6 w-6 rounded bg-[#F1ECE5] flex items-center justify-center text-xs font-bold text-[#241E1A] cursor-pointer"
                        >
                          -
                        </button>
                        <span className="font-medium text-[#241E1A] w-6 text-center">{item.qty}</span>
                        <button
                          type="button"
                          onClick={() => setMinibarDrinks(p => p.map(x => x.id === item.id ? { ...x, qty: x.qty + 1 } : x))}
                          className="h-6 w-6 rounded bg-[#F1ECE5] flex items-center justify-center text-xs font-bold text-[#241E1A] cursor-pointer"
                        >
                          +
                        </button>
                      </div>
                    </div>
                  ))}
                  <div
                    onClick={() => {
                      const name = prompt(lang === 'RU' ? 'Название напитка:' : 'Drink name:');
                      if (name) setMinibarDrinks(p => [...p, { id: `mb-${Date.now()}`, name, qty: 2 }]);
                    }}
                    className="p-3.5 flex items-center gap-2 text-xs font-sans font-medium text-[#C2410C] hover:bg-slate-50 cursor-pointer"
                  >
                    <Plus className="h-4 w-4" />
                    <span>{lang === 'RU' ? 'Добавить позицию' : 'Add Item'}</span>
                  </div>
                </div>
              </div>

              {/* ЧАЙ И КОФЕ */}
              <div className="space-y-2 pt-1">
                <span className="text-[10px] font-sans font-medium tracking-[0.08em] text-[#8A8177] uppercase block select-none">
                  {lang === 'RU' ? 'ЧАЙ И КОФЕ' : 'TEA & COFFEE'}
                </span>

                <div className="bg-white rounded-[20px] border border-[#E5E2DD] divide-y divide-[#E5E2DD]/50 shadow-2xs overflow-hidden">
                  {minibarTeaCoffee.map((item) => (
                    <div key={item.id} className="p-3.5 flex items-center justify-between text-xs font-sans">
                      <span className="text-sm font-medium text-[#241E1A]">{item.name}</span>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => setMinibarTeaCoffee(p => p.map(x => x.id === item.id ? { ...x, qty: Math.max(0, x.qty - 1) } : x))}
                          className="h-6 w-6 rounded bg-[#F1ECE5] flex items-center justify-center text-xs font-bold text-[#241E1A] cursor-pointer"
                        >
                          -
                        </button>
                        <span className="font-medium text-[#241E1A] w-6 text-center">{item.qty}</span>
                        <button
                          type="button"
                          onClick={() => setMinibarTeaCoffee(p => p.map(x => x.id === item.id ? { ...x, qty: x.qty + 1 } : x))}
                          className="h-6 w-6 rounded bg-[#F1ECE5] flex items-center justify-center text-xs font-bold text-[#241E1A] cursor-pointer"
                        >
                          +
                        </button>
                      </div>
                    </div>
                  ))}
                  <div
                    onClick={() => {
                      const name = prompt(lang === 'RU' ? 'Название позиции:' : 'Item name:');
                      if (name) setMinibarTeaCoffee(p => [...p, { id: `tc-${Date.now()}`, name, qty: 4 }]);
                    }}
                    className="p-3.5 flex items-center gap-2 text-xs font-sans font-medium text-[#C2410C] hover:bg-slate-50 cursor-pointer"
                  >
                    <Plus className="h-4 w-4" />
                    <span>{lang === 'RU' ? 'Добавить позицию' : 'Add Item'}</span>
                  </div>
                </div>
              </div>

              {/* СНЕКИ */}
              <div className="space-y-2 pt-1">
                <span className="text-[10px] font-sans font-medium tracking-[0.08em] text-[#8A8177] uppercase block select-none">
                  {lang === 'RU' ? 'СНЕКИ' : 'SNACKS'}
                </span>

                <div className="bg-white rounded-[20px] border border-[#E5E2DD] divide-y divide-[#E5E2DD]/50 shadow-2xs overflow-hidden">
                  {minibarSnacks.map((item) => (
                    <div key={item.id} className="p-3.5 flex items-center justify-between text-xs font-sans">
                      <span className="text-sm font-medium text-[#241E1A]">{item.name}</span>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => setMinibarSnacks(p => p.map(x => x.id === item.id ? { ...x, qty: Math.max(0, x.qty - 1) } : x))}
                          className="h-6 w-6 rounded bg-[#F1ECE5] flex items-center justify-center text-xs font-bold text-[#241E1A] cursor-pointer"
                        >
                          -
                        </button>
                        <span className="font-medium text-[#241E1A] w-6 text-center">{item.qty}</span>
                        <button
                          type="button"
                          onClick={() => setMinibarSnacks(p => p.map(x => x.id === item.id ? { ...x, qty: x.qty + 1 } : x))}
                          className="h-6 w-6 rounded bg-[#F1ECE5] flex items-center justify-center text-xs font-bold text-[#241E1A] cursor-pointer"
                        >
                          +
                        </button>
                      </div>
                    </div>
                  ))}
                  <div
                    onClick={() => {
                      const name = prompt(lang === 'RU' ? 'Название снека:' : 'Snack name:');
                      if (name) setMinibarSnacks(p => [...p, { id: `sn-${Date.now()}`, name, qty: 2 }]);
                    }}
                    className="p-3.5 flex items-center gap-2 text-xs font-sans font-medium text-[#C2410C] hover:bg-slate-50 cursor-pointer"
                  >
                    <Plus className="h-4 w-4" />
                    <span>{lang === 'RU' ? 'Добавить позицию' : 'Add Item'}</span>
                  </div>
                </div>
              </div>
            </>
          )}

          {minibarTab === 'SUPPLIES' && (
            <>
              {/* ПОСТЕЛЬНОЕ БЕЛЬЁ */}
              <div className="space-y-2 pt-1">
                <span className="text-[10px] font-sans font-medium tracking-[0.08em] text-[#8A8177] uppercase block select-none">
                  {lang === 'RU' ? 'ПОСТЕЛЬНОЕ БЕЛЬЁ' : 'BED LINEN'}
                </span>

                <div className="bg-white rounded-[20px] border border-[#E5E2DD] divide-y divide-[#E5E2DD]/50 shadow-2xs overflow-hidden">
                  {trolleyLinens.map((item) => (
                    <div key={item.id} className="p-3.5 flex items-center justify-between text-xs font-sans">
                      <span className="text-sm font-medium text-[#241E1A]">{item.name}</span>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => setTrolleyLinens(p => p.map(x => x.id === item.id ? { ...x, qty: Math.max(0, x.qty - 1) } : x))}
                          className="h-6 w-6 rounded bg-[#F1ECE5] flex items-center justify-center text-xs font-bold text-[#241E1A] cursor-pointer"
                        >
                          -
                        </button>
                        <span className="font-medium text-[#241E1A] w-6 text-center">{item.qty}</span>
                        <button
                          type="button"
                          onClick={() => setTrolleyLinens(p => p.map(x => x.id === item.id ? { ...x, qty: x.qty + 1 } : x))}
                          className="h-6 w-6 rounded bg-[#F1ECE5] flex items-center justify-center text-xs font-bold text-[#241E1A] cursor-pointer"
                        >
                          +
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* КОСМЕТИКА И ГИГИЕНА */}
              <div className="space-y-2 pt-1">
                <span className="text-[10px] font-sans font-medium tracking-[0.08em] text-[#8A8177] uppercase block select-none">
                  {lang === 'RU' ? 'КОСМЕТИКА И ГИГИЕНА' : 'AMENITIES'}
                </span>

                <div className="bg-white rounded-[20px] border border-[#E5E2DD] divide-y divide-[#E5E2DD]/50 shadow-2xs overflow-hidden">
                  {trolleyCosmetics.map((item) => (
                    <div key={item.id} className="p-3.5 flex items-center justify-between text-xs font-sans">
                      <span className="text-sm font-medium text-[#241E1A]">{item.name}</span>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => setTrolleyCosmetics(p => p.map(x => x.id === item.id ? { ...x, qty: Math.max(0, x.qty - 1) } : x))}
                          className="h-6 w-6 rounded bg-[#F1ECE5] flex items-center justify-center text-xs font-bold text-[#241E1A] cursor-pointer"
                        >
                          -
                        </button>
                        <span className="font-medium text-[#241E1A] w-6 text-center">{item.qty}</span>
                        <button
                          type="button"
                          onClick={() => setTrolleyCosmetics(p => p.map(x => x.id === item.id ? { ...x, qty: x.qty + 1 } : x))}
                          className="h-6 w-6 rounded bg-[#F1ECE5] flex items-center justify-center text-xs font-bold text-[#241E1A] cursor-pointer"
                        >
                          +
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}

          {minibarTab === 'TROLLEY' && (
            <div className="space-y-2 pt-1">
              <span className="text-[10px] font-sans font-medium tracking-[0.08em] text-[#8A8177] uppercase block select-none">
                {lang === 'RU' ? 'ИНВЕНТАРЬ И ОБОРУДОВАНИЕ' : 'CLEANING TOOLS'}
              </span>

              <div className="bg-white rounded-[20px] border border-[#E5E2DD] divide-y divide-[#E5E2DD]/50 shadow-2xs overflow-hidden">
                {trolleyTools.map((item) => (
                  <div key={item.id} className="p-3.5 flex items-center justify-between text-xs font-sans">
                    <span className="text-sm font-medium text-[#241E1A]">{item.name}</span>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setTrolleyTools(p => p.map(x => x.id === item.id ? { ...x, qty: Math.max(0, x.qty - 1) } : x))}
                        className="h-6 w-6 rounded bg-[#F1ECE5] flex items-center justify-center text-xs font-bold text-[#241E1A] cursor-pointer"
                      >
                        -
                      </button>
                      <span className="font-medium text-[#241E1A] w-6 text-center">{item.qty}</span>
                      <button
                        type="button"
                        onClick={() => setTrolleyTools(p => p.map(x => x.id === item.id ? { ...x, qty: x.qty + 1 } : x))}
                        className="h-6 w-6 rounded bg-[#F1ECE5] flex items-center justify-center text-xs font-bold text-[#241E1A] cursor-pointer"
                      >
                        +
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="bg-white rounded-[20px] border border-[#E5E2DD] p-3.5 flex items-center gap-2 text-xs font-sans font-medium text-[#C2410C] hover:bg-slate-50 cursor-pointer shadow-2xs">
            <Plus className="h-4 w-4" />
            <span>{lang === 'RU' ? 'Добавить категорию' : 'Add Category'}</span>
          </div>

          {/* Note Card */}
          <div className="bg-[#FDF6E8] border border-[#EFE0C4] rounded-2xl p-3.5 flex items-start gap-2.5 text-xs text-[#6B5A3E] leading-relaxed">
            <Info className="h-4 w-4 text-[#E4762B] shrink-0 mt-0.5" />
            <span>
              {lang === 'RU'
                ? 'Нормативы подставляются в чек-лист мини-бара и в списание расходников у клинера.'
                : 'Target norms are automatically synced with housekeeping checklists and supply consumption.'}
            </span>
          </div>
        </div>

        {/* Bottom CTA */}
        <div className="p-4 bg-[#FAF7F3] border-t border-[#E5E2DD] shrink-0">
          <button
            type="button"
            onClick={() => {
              alert(lang === 'RU' ? 'Нормативы наполнения сохранены!' : 'Inventory norms saved!');
              setSvActiveSubscreen('APP_CONFIG');
            }}
            className="w-full bg-[#C2410C] hover:bg-[#A93A0C] active:scale-[0.99] text-white font-sans font-medium text-xs py-3.5 rounded-xl shadow-xs transition-all cursor-pointer text-center"
          >
            {lang === 'RU' ? 'Сохранить' : 'Save'}
          </button>
        </div>
      </div>
    );
  };

  // =========================================================================
  // AUXILIARY CONFIG SCREENS (ROOMS, TIME NORMS, DEFECTS)
  // =========================================================================
  const renderRoomsConfigScreen = () => {
    return (
      <div className="flex-1 flex flex-col min-h-0 bg-[#FAF7F3] font-sans">
        <div className="flex-1 overflow-y-auto no-scrollbar p-4.5 space-y-4">
          <div className="pt-2 pb-1">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setSvActiveSubscreen('APP_CONFIG')}
                className="h-8 w-8 -ml-1 rounded-full flex items-center justify-center text-[#241E1A] hover:bg-black/5 transition-colors cursor-pointer"
              >
                <ChevronLeft className="h-6 w-6" />
              </button>
              <h1 className="font-serif font-medium text-2xl text-[#241E1A] leading-tight">
                {lang === 'RU' ? 'Номера отеля' : 'Hotel Rooms'}
              </h1>
            </div>
            <p className="text-xs font-sans font-normal text-[#8A8177] pt-1 pl-8">
              24 {lang === 'RU' ? 'номера на 5 этажах' : 'rooms across 5 floors'}
            </p>
          </div>

          <div className="bg-white rounded-[20px] border border-[#E5E2DD] divide-y divide-[#E5E2DD]/50 shadow-2xs overflow-hidden">
            {rooms.slice(0, 10).map((rm) => (
              <div key={rm.id} className="p-3.5 flex items-center justify-between">
                <div>
                  <span className="text-sm font-medium text-[#241E1A]">{rm.number}</span>
                  <p className="text-[10px] text-[#8A8177]">{rm.type} · {rm.floor} {lang === 'RU' ? 'этаж' : 'floor'}</p>
                </div>
                <span className="text-xs text-[#8A8177] font-normal">{rm.priority === 'VIP' ? 'VIP' : 'Standard'}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="p-4 bg-[#FAF7F3] border-t border-[#E5E2DD] shrink-0">
          <button
            type="button"
            onClick={() => alert(lang === 'RU' ? 'Добавление диапазона номеров...' : 'Add rooms range...')}
            className="w-full bg-[#C2410C] hover:bg-[#A93A0C] text-white font-sans font-medium text-xs py-3.5 rounded-xl shadow-xs transition-all cursor-pointer text-center"
          >
            {lang === 'RU' ? 'Добавить номер / диапазон' : 'Add Room Range'}
          </button>
        </div>
      </div>
    );
  };

  const renderTimeNormsConfigScreen = () => {
    return (
      <div className="flex-1 flex flex-col min-h-0 bg-[#FAF7F3] font-sans">
        <div className="flex-1 overflow-y-auto no-scrollbar p-4.5 space-y-4">
          <div className="pt-2 pb-1">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setSvActiveSubscreen('APP_CONFIG')}
                className="h-8 w-8 -ml-1 rounded-full flex items-center justify-center text-[#241E1A] hover:bg-black/5 transition-colors cursor-pointer"
              >
                <ChevronLeft className="h-6 w-6" />
              </button>
              <h1 className="font-serif font-medium text-2xl text-[#241E1A] leading-tight">
                {lang === 'RU' ? 'Нормативы времени' : 'Time Norms Matrix'}
              </h1>
            </div>
            <p className="text-xs font-sans font-normal text-[#8A8177] pt-1 pl-8">
              {lang === 'RU' ? 'Время уборки (минут) по типам номеров' : 'Cleaning targets (min) by room type'}
            </p>
          </div>

          <div className="bg-white rounded-[20px] border border-[#E5E2DD] divide-y divide-[#E5E2DD]/50 shadow-2xs overflow-hidden text-xs">
            <div className="p-3.5 flex justify-between items-center">
              <span className="font-medium text-[#241E1A]">Standard Twin / King</span>
              <span className="font-medium">20 мин</span>
            </div>
            <div className="p-3.5 flex justify-between items-center">
              <span className="font-medium text-[#241E1A]">Junior Suite</span>
              <span className="font-medium">25 мин</span>
            </div>
            <div className="p-3.5 flex justify-between items-center">
              <span className="font-medium text-[#241E1A]">Deluxe Suite</span>
              <span className="font-medium">35 мин</span>
            </div>
            <div className="p-3.5 flex justify-between items-center">
              <span className="font-medium text-[#241E1A]">Executive King</span>
              <span className="font-medium">40 мин</span>
            </div>
            <div className="p-3.5 flex justify-between items-center">
              <span className="font-medium text-[#241E1A]">Presidential Suite</span>
              <span className="font-medium">60 мин</span>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderDefectsConfigScreen = () => {
    return (
      <div className="flex-1 flex flex-col min-h-0 bg-[#FAF7F3] font-sans">
        <div className="flex-1 overflow-y-auto no-scrollbar p-4.5 space-y-4">
          <div className="pt-2 pb-1">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setSvActiveSubscreen('APP_CONFIG')}
                className="h-8 w-8 -ml-1 rounded-full flex items-center justify-center text-[#241E1A] hover:bg-black/5 transition-colors cursor-pointer"
              >
                <ChevronLeft className="h-6 w-6" />
              </button>
              <h1 className="font-serif font-medium text-2xl text-[#241E1A] leading-tight">
                {lang === 'RU' ? 'Категории неполадок' : 'Defect Categories'}
              </h1>
            </div>
            <p className="text-xs font-sans font-normal text-[#8A8177] pt-1 pl-8">
              {lang === 'RU' ? 'Справочник для заявок в техслужбу' : 'Categories for maintenance requests'}
            </p>
          </div>

          <div className="bg-white rounded-[20px] border border-[#E5E2DD] divide-y divide-[#E5E2DD]/50 shadow-2xs overflow-hidden text-xs">
            <div className="p-3.5 flex justify-between items-center font-medium"><span>Сантехника</span><span className="text-[#8A8177]">12 видов</span></div>
            <div className="p-3.5 flex justify-between items-center font-medium"><span>Электрика</span><span className="text-[#8A8177]">8 видов</span></div>
            <div className="p-3.5 flex justify-between items-center font-medium"><span>Мебель и фурнитура</span><span className="text-[#8A8177]">6 видов</span></div>
            <div className="p-3.5 flex justify-between items-center font-medium"><span>Климат / Кондиционер</span><span className="text-[#8A8177]">4 вида</span></div>
            <div className="p-3.5 flex justify-between items-center font-medium"><span>ТВ и Интернет</span><span className="text-[#8A8177]">5 видов</span></div>
          </div>
        </div>
      </div>
    );
  };

  const renderProfile = () => {
    // Route to sub-screens if active
    if (svActiveSubscreen === 'SHIFT_REPORT') return renderShiftReportScreen();
    if (svActiveSubscreen === 'STAFF_MANAGEMENT') return renderStaffManagementScreen();
    if (svActiveSubscreen === 'EMPLOYEE_CARD') return renderEmployeeCardScreen();
    if (svActiveSubscreen === 'APP_CONFIG') return renderAppConfigScreen();
    if (svActiveSubscreen === 'CHECKLIST_CONFIG') return renderChecklistConfigScreen();
    if (svActiveSubscreen === 'MINIBAR_CONFIG') return renderMinibarConfigScreen();
    if (svActiveSubscreen === 'ROOMS_CONFIG') return renderRoomsConfigScreen();
    if (svActiveSubscreen === 'TIME_NORMS_CONFIG') return renderTimeNormsConfigScreen();
    if (svActiveSubscreen === 'DEFECTS_CONFIG') return renderDefectsConfigScreen();

    const readyForCheckCount = rooms.filter(r => r.status === 'READY').length;
    const activeCleanersCount = cleaners.filter(c => c.currentShift.status === 'ON_SHIFT').length;

    return (
      <div className="flex-1 flex flex-col min-h-0 bg-[#FAF7F3]">
        {/* Header Section */}
        <div className="bg-[#FAF7F3] pt-6 pb-3.5 px-4.5 flex items-center justify-between border-b border-[#E5E2DD]/60 shrink-0 select-none">
          <h1 className="text-2xl font-serif font-medium text-[#241E1A] leading-tight">
            {lang === 'RU' ? 'Профиль' : 'Profile'}
          </h1>
          <div className="flex items-center gap-3">
            {/* Chats Icon */}
            {(() => {
              const unreadChats = chatContacts.reduce((acc, c) => acc + (c.unreadCount || 0), 0);
              return (
                <button
                  onClick={() => setShowChats(true)}
                  className="h-9 w-9 bg-white border border-[#E5E2DD] rounded-xl flex items-center justify-center text-[#241E1A] hover:bg-slate-50 transition-all cursor-pointer relative animate-in fade-in duration-200"
                >
                  <MessageSquare className="h-4.5 w-4.5" />
                  {unreadChats > 0 && (
                    <span className="absolute -top-1.5 -right-1.5 bg-[#C2410C] text-white text-[9px] font-sans font-medium h-4 w-4 rounded-full flex items-center justify-center ring-2 ring-white">
                      {unreadChats}
                    </span>
                  )}
                </button>
              );
            })()}

            {/* Notifications Icon */}
            {(() => {
              const unreadNotifs = supervisorNotifications.filter(n => n.unread).length;
              return (
                <button
                  onClick={() => setShowNotifications(true)}
                  className="h-9 w-9 bg-white border border-[#E5E2DD] rounded-xl flex items-center justify-center text-[#241E1A] hover:bg-slate-50 transition-all cursor-pointer relative animate-in fade-in duration-200"
                >
                  <Bell className="h-4.5 w-4.5" />
                  {unreadNotifs > 0 && (
                    <span className="absolute -top-1.5 -right-1.5 bg-[#C2410C] text-white text-[9px] font-sans font-medium h-4 w-4 rounded-full flex items-center justify-center ring-2 ring-white">
                      {unreadNotifs}
                    </span>
                  )}
                </button>
              );
            })()}

            {/* Settings Icon */}
            <button
              onClick={() => setShowSettings(true)}
              className="h-9 w-9 bg-white border border-[#E5E2DD] rounded-xl flex items-center justify-center text-[#241E1A] hover:bg-slate-50 transition-all cursor-pointer"
            >
              <Settings className="h-4.5 w-4.5" />
            </button>
          </div>
        </div>

        {/* Scrollable Content */}
        <div className="p-4.5 space-y-5 flex-1 overflow-y-auto no-scrollbar">
          {/* User Info Row */}
          <div className="flex items-center gap-4.5 select-none">
            <div className="h-14 w-14 rounded-full bg-[#FAF6F0] border border-[#E5E2DD] flex items-center justify-center text-[17px] font-sans font-medium text-[#241E1A] shrink-0 shadow-inner">
              CK
            </div>
            <div className="min-w-0 flex-1 space-y-1">
              <h2 className="text-[21px] font-serif font-medium text-[#241E1A] leading-tight">
                {lang === 'RU' ? 'Светлана Ким' : 'Svetlana Kim'}
              </h2>
              <p className="text-xs font-sans font-normal text-[#8A8177]">
                {lang === 'RU' ? 'Супервайзер · все этажи, VIP и контроль' : 'Supervisor · all floors, VIP & audit'}
              </p>
            </div>
          </div>

          {/* Section: Текущая смена */}
          <div className="space-y-2.5">
            <span className="text-[10px] font-sans font-medium tracking-[0.08em] text-[#8A8177] uppercase block select-none">
              {lang === 'RU' ? 'ТЕКУЩАЯ СМЕНА' : 'CURRENT SHIFT'}
            </span>
            <div className="bg-white rounded-[18px] border border-[#E5E2DD] p-4.5 space-y-4 shadow-2xs">
              <div className="flex justify-between items-center text-xs font-sans select-none">
                <span className="font-medium text-[#241E1A]">SH-4092</span>
                <span className="text-[#8A8177] font-normal">27 авг · с 08:00</span>
              </div>

              {/* Status Switcher Buttons */}
              <div className="grid grid-cols-3 gap-2">
                <button className="bg-[#241E1A] text-white font-sans font-normal text-xs py-2 rounded-xl text-center cursor-pointer select-none">
                  {lang === 'RU' ? 'На смене' : 'On shift'}
                </button>
                <button className="bg-white hover:bg-slate-50 border border-[#E5E2DD] text-[#8A8177] font-sans font-normal text-xs py-2 rounded-xl text-center cursor-pointer select-none">
                  {lang === 'RU' ? 'Перерыв' : 'Break'}
                </button>
                <button 
                  onClick={onLogout}
                  className="bg-white hover:bg-slate-50 border border-[#E5E2DD] text-[#8A8177] font-sans font-normal text-xs py-2 rounded-xl text-center cursor-pointer select-none"
                >
                  {lang === 'RU' ? 'Завершить' : 'End shift'}
                </button>
              </div>

              <hr className="border-[#E5E2DD]/50" />

              {/* Metrics Grid */}
              <div className="grid grid-cols-3 gap-2 text-center select-none">
                <div className="space-y-1">
                  <div className="text-[17px] font-sans font-medium text-[#241E1A]">
                    14 <span className="text-[#8A8177] font-normal text-xs">/ 24</span>
                  </div>
                  <span className="block text-[10px] font-sans font-normal text-[#8A8177] leading-tight">
                    {lang === 'RU' ? 'номеров сдано' : 'rooms checked'}
                  </span>
                </div>

                <div className="space-y-1">
                  <div className="text-[17px] font-sans font-medium text-[#241E1A]">
                    {readyForCheckCount}
                  </div>
                  <span className="block text-[10px] font-sans font-normal text-[#8A8177] leading-tight">
                    {lang === 'RU' ? 'ждут проверки' : 'pending audit'}
                  </span>
                </div>

                <div className="space-y-1">
                  <div className="text-[17px] font-sans font-medium text-[#241E1A]">
                    {activeCleanersCount}
                  </div>
                  <span className="block text-[10px] font-sans font-normal text-[#8A8177] leading-tight">
                    {lang === 'RU' ? 'клинеров' : 'housekeepers'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Section: Работа (Screen 08 matching ТЗ) */}
          <div className="space-y-2.5">
            <span className="text-[10px] font-sans font-medium tracking-[0.08em] text-[#8A8177] uppercase block select-none">
              {lang === 'RU' ? 'РАБОТА' : 'JOB CONTROLS'}
            </span>
            <div className="bg-white rounded-[18px] border border-[#E5E2DD] divide-y divide-[#E5E2DD]/50 overflow-hidden shadow-2xs select-none">
              {/* 1. Отчёты по смене -> Screen 10 */}
              <div 
                onClick={() => setSvActiveSubscreen('SHIFT_REPORT')}
                className="p-3.5 flex items-center justify-between gap-3 cursor-pointer hover:bg-slate-50 transition-colors"
              >
                <div className="flex items-center gap-3 text-[#241E1A]">
                  <BarChart3 className="h-4.5 w-4.5 text-[#8A8177]" />
                  <span className="text-[14px] font-sans font-normal">
                    {lang === 'RU' ? 'Отчёты по смене' : 'Shift reports'}
                  </span>
                </div>
                <ChevronRight className="h-4 w-4 text-[#8A8177]" />
              </div>

              {/* 2. Перераспределение задач */}
              <div 
                onClick={() => setShowReallocateModal(true)}
                className="p-3.5 flex items-center justify-between gap-3 cursor-pointer hover:bg-slate-50 transition-colors"
              >
                <div className="flex items-center gap-3 text-[#241E1A]">
                  <Layers className="h-4.5 w-4.5 text-[#8A8177]" />
                  <span className="text-[14px] font-sans font-normal">
                    {lang === 'RU' ? 'Перераспределение задач' : 'Reallocate workload'}
                  </span>
                </div>
                <ChevronRight className="h-4 w-4 text-[#8A8177]" />
              </div>

              {/* 3. Управление персоналом -> Screen 11 */}
              <div 
                onClick={() => setSvActiveSubscreen('STAFF_MANAGEMENT')}
                className="p-3.5 flex items-center justify-between gap-3 cursor-pointer hover:bg-slate-50 transition-colors"
              >
                <div className="flex items-center gap-3 text-[#241E1A]">
                  <Users className="h-4.5 w-4.5 text-[#8A8177]" />
                  <span className="text-[14px] font-sans font-normal">
                    {lang === 'RU' ? 'Управление персоналом' : 'Staff management'}
                  </span>
                </div>
                <ChevronRight className="h-4 w-4 text-[#8A8177]" />
              </div>

              {/* 4. Настроить приложение -> Screen 13 */}
              <div 
                onClick={() => setSvActiveSubscreen('APP_CONFIG')}
                className="p-3.5 flex items-center justify-between gap-3 cursor-pointer hover:bg-slate-50 transition-colors"
              >
                <div className="flex items-center gap-3 text-[#241E1A]">
                  <Sliders className="h-4.5 w-4.5 text-[#8A8177]" />
                  <span className="text-[14px] font-sans font-normal">
                    {lang === 'RU' ? 'Настроить приложение' : 'App configuration'}
                  </span>
                </div>
                <ChevronRight className="h-4 w-4 text-[#8A8177]" />
              </div>
            </div>
          </div>

          {/* Section: Выйти из аккаунта */}
          <div className="pt-1 pb-4">
            <div
              onClick={onLogout}
              className="bg-white rounded-[18px] border border-[#E5E2DD] p-3.5 flex items-center gap-3 text-[#8A8177] hover:text-[#241E1A] hover:bg-slate-50 transition-colors cursor-pointer shadow-2xs"
            >
              <LogOut className="h-4.5 w-4.5 text-[#8A8177]" />
              <span className="text-[14px] font-sans font-normal">
                {lang === 'RU' ? 'Выйти из аккаунта' : 'Log out'}
              </span>
            </div>
            <p className="text-[11px] font-sans font-normal text-[#8A8177] text-center pt-3 select-none">
              Sollviera PMS v2.4 · Rixos Borovoe
            </p>
          </div>
        </div>
      </div>
    );
  };

  const getHeaderInfo = () => {
    switch (activeTab) {
      case 'SV_DASHBOARD':
      case 'SV_INSPECTION':
      case 'SV_TEAM':
      case 'SV_MAINTENANCE':
      case 'SV_PROFILE':
        return null; // Large custom headers are rendered inside the components!
      default:
        return null;
    }
  };

  const getHeaderIcon = () => {
    switch (activeTab) {
      case 'SV_INSPECTION':
        return <ShieldCheck className="h-4.5 w-4.5 text-white" />;
      case 'SV_MAINTENANCE':
        return <Wrench className="h-4.5 w-4.5 text-white" />;
      case 'SV_TEAM':
        return <Users className="h-4.5 w-4.5 text-white" />;
      case 'SV_PROFILE':
        return <User className="h-4.5 w-4.5 text-white" />;
      default:
        return <LayoutDashboard className="h-4.5 w-4.5 text-white" />;
    }
  };

  const headerInfo = getHeaderInfo();

  return (
    <div className="flex-1 flex flex-col min-h-0 bg-slate-50 relative">
      {/* Header */}
      {headerInfo && (
        <header className="bg-[#241E1A] text-white p-3.5 pb-3 flex items-center justify-between border-b border-[#E7DFD5]/15 sticky top-0 z-30 shadow-sm shrink-0">
          {activeTab === 'SV_PROFILE' ? (
            <>
              <div className="flex items-center gap-2.5">
                <div className="h-8 w-8 rounded-lg bg-[#FAF7F3] flex items-center justify-center shadow-inner border border-white/10 shrink-0">
                  <SollvieraLogo className="h-5 w-5" />
                </div>
                <div>
                  <h1 className="text-sm font-extrabold tracking-tight text-white font-serif leading-none pt-0.5">Sollviera</h1>
                  <span className="text-[10px] text-[#8A8177] font-medium mt-1 block">
                    {headerInfo.title}
                  </span>
                </div>
              </div>

              {/* Minimalist Top Control Buttons (same as cleaner) */}
              <div className="flex items-center gap-1.5">
                {/* Chats Button */}
                <button
                  onClick={() => setShowChats(true)}
                  className="h-8 w-8 bg-white/10 hover:bg-white/20 border border-white/10 text-white rounded-lg flex items-center justify-center transition-all cursor-pointer relative"
                  title={lang === 'RU' ? 'Чаты' : 'Chats'}
                >
                  <MessageSquare className="h-4 w-4" />
                </button>

                {/* Bell/Notifications Button */}
                <button
                  onClick={() => setShowNotifications(!showNotifications)}
                  className="h-8 w-8 bg-white/10 hover:bg-white/20 border border-white/10 text-white rounded-lg flex items-center justify-center transition-all cursor-pointer relative"
                  title={lang === 'RU' ? 'Уведомления' : 'Notifications'}
                >
                  <Bell className="h-4 w-4" />
                  <span className="absolute top-1 right-1 h-1.5 w-1.5 bg-rose-600 rounded-full animate-ping" />
                </button>

                {/* Gear/Settings Button */}
                <button
                  onClick={() => {
                    setEditFullName(cleanerProfile.fullName);
                    setEditFullNameRu(cleanerProfile.fullNameRu);
                    setEditBadgeId(cleanerProfile.badgeId);
                    setEditAvatarUrl(cleanerProfile.avatarUrl);
                    setShowSettings(true);
                  }}
                  className="h-8 w-8 bg-white/10 hover:bg-white/20 border border-white/10 text-white rounded-lg flex items-center justify-center transition-all cursor-pointer"
                  title={lang === 'RU' ? 'Настройки' : 'Settings'}
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
                  <h1 className="text-sm font-extrabold tracking-tight text-white font-serif leading-none pt-0.5">
                    {headerInfo.title}
                  </h1>
                  {headerInfo.subtitle && (
                    <span className="text-[10px] text-[#8A8177] font-medium mt-1 block">
                      {headerInfo.subtitle}
                    </span>
                  )}
                </div>
              </div>
              {/* Spacer on the right */}
              <div />
            </>
          )}
        </header>
      )}

      {/* Tab Area content switcher */}
      {activeTab === 'SV_DASHBOARD' && renderDashboard()}
      {activeTab === 'SV_INSPECTION' && renderInspection()}
      {activeTab === 'SV_MAINTENANCE' && renderMaintenance()}
      {activeTab === 'SV_TEAM' && renderTeam()}
      {activeTab === 'SV_PROFILE' && renderProfile()}

      {/* 2. FAIL INSPECTION REJECTION MODAL */}
      {rejectRoomId && (
        <div 
          className="absolute inset-0 bg-black/60 z-[60] flex items-center justify-center p-4"
          onClick={() => {
            setRejectRoomId(null);
            setRejectComment('');
          }}
        >
          <div 
            className="bg-white rounded-3xl w-full max-w-sm p-5 shadow-2xl border border-slate-200 space-y-4 animate-in fade-in zoom-in duration-200"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <h3 className="text-xs font-black text-rose-700 uppercase tracking-wide">
                {lang === 'RU' ? 'Зафиксировать недочеты' : 'Audit Refusal Notes'}
              </h3>
              <button
                onClick={() => {
                  setRejectRoomId(null);
                  setRejectComment('');
                }}
                className="h-6 w-6 rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 flex items-center justify-center font-bold text-xs cursor-pointer"
              >
                ×
              </button>
            </div>

            <div className="space-y-3.5 text-[11px]">
              <span className="text-[10px] font-semibold text-slate-500 leading-normal block">
                {lang === 'RU' 
                  ? 'Опишите, какие зоны убраны неудовлетворительно. Комната вернется в статус «Ожидает» с вашим комментарием.' 
                  : 'Specify deficiencies. The room will be failed back to Pending state.'}
              </span>

              <textarea
                rows={3}
                placeholder={lang === 'RU' ? 'Например: пыль под кроватью, пятна на зеркале в ванной...' : 'e.g. dust on mirror, towels not folded...'}
                value={rejectComment}
                onChange={e => setRejectComment(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2 text-xs focus:outline-none focus:ring-1 focus:ring-rose-500 font-medium"
              />

              <div className="flex gap-2 pt-1 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => {
                    setRejectRoomId(null);
                    setRejectComment('');
                  }}
                  className="flex-1 py-1.5 border rounded-lg font-bold text-slate-500 hover:bg-slate-50 cursor-pointer"
                >
                  {lang === 'RU' ? 'Отмена' : 'Cancel'}
                </button>
                <button
                  type="button"
                  onClick={() => handleRejectInspection(rejectRoomId, rejectComment)}
                  className="flex-1 py-1.5 bg-rose-600 text-white rounded-lg font-bold hover:bg-rose-700 shadow-xs cursor-pointer"
                >
                  {lang === 'RU' ? 'Вернуть на доработку' : 'Send back to Pending'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 3. REALLOCATE WORKLOAD MODAL */}
      {showReallocateModal && (
        <div 
          className="absolute inset-0 bg-black/50 backdrop-blur-[2px] z-[70] flex items-center justify-center p-4 select-none font-sans"
          onClick={() => setShowReallocateModal(false)}
        >
          <div 
            className="bg-white rounded-[24px] w-full max-w-[340px] p-5 shadow-2xl border border-[#E5E2DD] space-y-4 animate-in fade-in zoom-in duration-200 text-[#241E1A]"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-[#E5E2DD]/40 pb-3">
              <h3 className="text-xs font-sans font-medium text-[#241E1A] uppercase tracking-[0.08em]">
                {lang === 'RU' ? 'Перераспределить уборки' : 'Reallocate Workload'}
              </h3>
              <button
                onClick={() => setShowReallocateModal(false)}
                className="h-6 w-6 rounded-full bg-[#FAF7F3] border border-[#E5E2DD]/50 text-[#8A8177] hover:text-[#241E1A] hover:bg-[#F3EDE2] flex items-center justify-center text-xs transition-colors cursor-pointer"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div className="space-y-1.5">
                <label className="block text-[10px] font-sans font-medium text-[#8A8177] uppercase tracking-[0.05em]">
                  {lang === 'RU' ? 'От кого перенести (Источник)' : 'Transfer From (Source)'}
                </label>
                <div className="relative">
                  <select
                    value={sourceCleanerId}
                    onChange={e => setSourceCleanerId(e.target.value)}
                    className="w-full bg-[#FAF7F3] border border-[#E5E2DD] rounded-xl px-3.5 py-2.5 pr-9 text-xs text-[#241E1A] font-sans font-normal focus:outline-none focus:border-[#C2410C] transition-colors cursor-pointer appearance-none"
                  >
                    <option value="">{lang === 'RU' ? '-- Выберите клинера --' : '-- Select cleaner --'}</option>
                    {cleaners.map(c => (
                      <option key={c.id} value={c.id}>{lang === 'RU' ? c.fullNameRu : c.fullName}</option>
                    ))}
                  </select>
                  <ChevronDown className="h-4 w-4 text-[#8A8177] pointer-events-none absolute right-3 top-1/2 -translate-y-1/2" />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="block text-[10px] font-sans font-medium text-[#8A8177] uppercase tracking-[0.05em]">
                  {lang === 'RU' ? 'Кому назначить (Получатель)' : 'Transfer To (Target)'}
                </label>
                <div className="relative">
                  <select
                    value={targetCleanerId}
                    onChange={e => setTargetCleanerId(e.target.value)}
                    className="w-full bg-[#FAF7F3] border border-[#E5E2DD] rounded-xl px-3.5 py-2.5 pr-9 text-xs text-[#241E1A] font-sans font-normal focus:outline-none focus:border-[#C2410C] transition-colors cursor-pointer appearance-none"
                  >
                    <option value="">{lang === 'RU' ? '-- Выберите клинера --' : '-- Select cleaner --'}</option>
                    {cleaners.map(c => (
                      <option key={c.id} value={c.id}>{lang === 'RU' ? c.fullNameRu : c.fullName}</option>
                    ))}
                  </select>
                  <ChevronDown className="h-4 w-4 text-[#8A8177] pointer-events-none absolute right-3 top-1/2 -translate-y-1/2" />
                </div>
              </div>

              <div className="flex gap-3 pt-2 border-t border-[#E5E2DD]/40">
                <button
                  type="button"
                  onClick={() => setShowReallocateModal(false)}
                  className="flex-1 py-2.5 border border-[#E5E2DD] rounded-xl font-sans font-medium text-xs text-[#241E1A] hover:bg-slate-50 transition-colors cursor-pointer text-center"
                >
                  {lang === 'RU' ? 'Отмена' : 'Cancel'}
                </button>
                <button
                  type="button"
                  disabled={!sourceCleanerId || !targetCleanerId || sourceCleanerId === targetCleanerId}
                  onClick={handleReallocateWorkload}
                  className="flex-1 py-2.5 bg-[#C2410C] hover:bg-[#A93A0C] disabled:opacity-40 disabled:hover:bg-[#C2410C] text-white rounded-xl font-sans font-medium text-xs shadow-xs transition-colors cursor-pointer text-center"
                >
                  {lang === 'RU' ? 'Подтвердить перевод' : 'Transfer Tasks'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 4. FULL-SCREEN DETAILED INSPECTION AUDIT WORKSPACE */}
      {inspectRoomId && (
        <div 
          className="absolute inset-0 bg-[#FAF7F3] z-[60] flex flex-col h-full w-full overflow-hidden font-sans animate-in slide-in-from-right duration-200"
          onClick={e => e.stopPropagation()}
        >
          {(() => {
            const room = rooms.find(r => r.id === inspectRoomId);
            if (!room) return null;
            
            const cleanerMatch = room.notesRu?.match(/клинер:\s*([^.]+)/) || room.notesEn?.match(/cleaner:\s*([^.]+)/);
            const assignedCleaner = cleanerMatch ? cleanerMatch[1] : (room.floor === 3 ? 'Елена Вэнс' : 'Маркус Броди');
            const submitTime = room.roomNumber === '301' ? '12:05' : '10:48';
            const elapsedMins = room.roomNumber === '301' ? '14' : '18';
            const standardMins = room.category.includes('Suite') || room.category.includes('Presidential') ? '30' : '25';

            const guestWishes = room.notesRu || (lang === 'RU'
              ? 'Убран и готов. Ожидает проверки супервайзером.'
              : 'Cleaned and ready. Waiting for supervisor inspection.');

            const cleanerComment = lang === 'RU'
              ? 'Комментарий клинера: ковёр под кроватью требует химчистки.'
              : 'Cleaner notes: carpet under the bed requires dry cleaning.';

            const roomRequests = maintenanceRequests.filter(req => req.roomNumber === room.roomNumber);

            return (
              <>
                {/* 1. Header (Dark bar #241E1A) */}
                <div className="bg-[#241E1A] text-white pt-6 pb-4 px-4.5 space-y-3 shrink-0 select-none">
                  {/* Top row: Back button + Submit time */}
                  <div className="flex items-center justify-between">
                    <button 
                      onClick={() => {
                        setInspectRoomId(null);
                        setRejectComment('');
                        setRejectRoomId(null);
                      }}
                      className="flex items-center gap-1.5 text-[#8A8177] hover:text-white transition-colors text-xs font-sans font-normal cursor-pointer"
                    >
                      <ArrowLeft className="h-4 w-4 text-[#8A8177]" />
                      <span>{lang === 'RU' ? 'Инспекция' : 'Inspection'}</span>
                    </button>
                    <span className="text-xs text-[#8A8177] font-sans font-normal">
                      {lang === 'RU' ? `сдан в ${submitTime}` : `submitted at ${submitTime}`}
                    </span>
                  </div>

                  {/* Title & Time row */}
                  <div className="flex items-baseline justify-between pt-1">
                    <h1 className="text-2xl font-sans font-medium text-white leading-none">
                      № {room.roomNumber}
                    </h1>
                    <span className="text-sm font-sans font-normal text-[#8A8177] leading-none">
                      {elapsedMins} {lang === 'RU' ? 'мин' : 'min'} · {lang === 'RU' ? 'норма' : 'norm'} {standardMins}
                    </span>
                  </div>

                  {/* Subtitle row: Category & Cleaner */}
                  <div className="text-xs text-[#8A8177] font-sans font-normal pt-0.5">
                    {room.category} · {assignedCleaner}
                  </div>
                </div>

                {/* 2. Scrollable Body */}
                <div className="p-4.5 space-y-5 flex-1 overflow-y-auto no-scrollbar select-none">
                  
                  {/* Section 1: ОСОБЫЕ УКАЗАНИЯ */}
                  <div className="space-y-2">
                    <span className="text-[10px] font-sans font-medium tracking-[0.08em] text-[#8A8177] uppercase block">
                      {lang === 'RU' ? 'ОСОБЫЕ УКАЗАНИЯ' : 'SPECIAL INSTRUCTIONS'}
                    </span>
                    <div className="bg-[#FDF9F0] border border-[#F3EAD5] rounded-[18px] p-4 text-xs font-sans font-normal text-[#241E1A] leading-relaxed shadow-2xs">
                      {guestWishes}
                    </div>
                  </div>

                  {/* Section 2: СПАЛЬНЯ */}
                  <div className="bg-white rounded-[18px] border border-[#E5E2DD] shadow-2xs overflow-hidden select-none">
                    <div 
                      onClick={() => setInspectBedroomOpen(!inspectBedroomOpen)}
                      className="p-4 flex justify-between items-center cursor-pointer hover:bg-slate-50 transition-colors"
                    >
                      <span className="text-[10px] font-sans font-medium tracking-[0.08em] text-[#8A8177] uppercase">
                        {lang === 'RU' ? 'СПАЛЬНЯ' : 'BEDROOM'}
                      </span>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-sans font-normal text-[#8A8177]">
                          2 {lang === 'RU' ? 'из' : 'of'} 2
                        </span>
                        <ChevronDown className={`h-4 w-4 text-[#8A8177] transition-transform duration-200 ${inspectBedroomOpen ? 'rotate-180' : ''}`} />
                      </div>
                    </div>

                    {inspectBedroomOpen && (
                      <div className="divide-y divide-[#E5E2DD]/50 border-t border-[#E5E2DD]/50 animate-in fade-in duration-150">
                        <div className="p-3.5 flex items-center gap-3">
                          <div className="h-5 w-5 rounded-md bg-[#5B8C6E] text-white flex items-center justify-center text-xs shrink-0 shadow-2xs">
                            <Check className="h-3.5 w-3.5 stroke-[3]" />
                          </div>
                          <span className="text-xs font-sans font-normal text-[#6B6B6B] line-through decoration-[#8A8177]/40 flex-1">
                            {lang === 'RU' ? 'Смена белья и наволочек' : 'Change bed linen & pillowcases'}
                          </span>
                        </div>

                        <div className="p-3.5 flex items-center gap-3">
                          <div className="h-5 w-5 rounded-md bg-[#5B8C6E] text-white flex items-center justify-center text-xs shrink-0 shadow-2xs">
                            <Check className="h-3.5 w-3.5 stroke-[3]" />
                          </div>
                          <span className="text-xs font-sans font-normal text-[#6B6B6B] line-through decoration-[#8A8177]/40 flex-1">
                            {lang === 'RU' ? 'Пылесос ковров и влажная уборка' : 'Vacuum carpets & wet cleaning'}
                          </span>
                        </div>

                        <div className="p-3.5 space-y-3">
                          <div className="flex items-center justify-between gap-3">
                            <div className="flex items-center gap-2.5 text-[#241E1A]">
                              <Camera className="h-4 w-4 text-[#8A8177] shrink-0" />
                              <span className="text-xs font-sans font-normal">
                                {lang === 'RU' ? 'Фотофиксация зоны' : 'Zone photo record'}
                              </span>
                            </div>
                            <span className="bg-[#EBF3EF] text-[#3D7A5A] border border-[#3D7A5A]/15 text-[10px] font-sans font-medium px-2 py-0.5 rounded-md">
                              2 {lang === 'RU' ? 'ФОТО' : 'PHOTOS'}
                            </span>
                          </div>

                          {/* Checklist Photos for Bedroom */}
                          <div className="grid grid-cols-2 gap-2 pt-1">
                            <div className="space-y-1">
                              <div className="h-24 w-full rounded-xl overflow-hidden border border-[#E5E2DD] bg-slate-100 shadow-2xs">
                                <img 
                                  src="https://images.unsplash.com/photo-1590490360182-c33d57733427?w=350&auto=format&fit=crop&q=80" 
                                  alt="Bedroom photo 1" 
                                  className="w-full h-full object-cover"
                                />
                              </div>
                              <span className="text-[10px] font-sans font-normal text-[#8A8177] block truncate">
                                {lang === 'RU' ? 'Заправленная кровать' : 'Made bed'}
                              </span>
                            </div>
                            <div className="space-y-1">
                              <div className="h-24 w-full rounded-xl overflow-hidden border border-[#E5E2DD] bg-slate-100 shadow-2xs">
                                <img 
                                  src="https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=350&auto=format&fit=crop&q=80" 
                                  alt="Bedroom photo 2" 
                                  className="w-full h-full object-cover"
                                />
                              </div>
                              <span className="text-[10px] font-sans font-normal text-[#8A8177] block truncate">
                                {lang === 'RU' ? 'Чистый пол и ковер' : 'Clean floor & rug'}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Section 3: ВАННАЯ КОМНАТА */}
                  <div className="bg-white rounded-[18px] border border-[#E5E2DD] shadow-2xs overflow-hidden select-none">
                    <div 
                      onClick={() => setInspectBathroomOpen(!inspectBathroomOpen)}
                      className="p-4 flex justify-between items-center cursor-pointer hover:bg-slate-50 transition-colors"
                    >
                      <span className="text-[10px] font-sans font-medium tracking-[0.08em] text-[#8A8177] uppercase">
                        {lang === 'RU' ? 'ВАННАЯ КОМНАТА' : 'BATHROOM'}
                      </span>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-sans font-normal text-[#8A8177]">
                          1 {lang === 'RU' ? 'из' : 'of'} 1
                        </span>
                        <ChevronDown className={`h-4 w-4 text-[#8A8177] transition-transform duration-200 ${inspectBathroomOpen ? 'rotate-180' : ''}`} />
                      </div>
                    </div>

                    {inspectBathroomOpen && (
                      <div className="divide-y divide-[#E5E2DD]/50 border-t border-[#E5E2DD]/50 animate-in fade-in duration-150">
                        <div className="p-3.5 flex items-center gap-3">
                          <div className="h-5 w-5 rounded-md bg-[#5B8C6E] text-white flex items-center justify-center text-xs shrink-0 shadow-2xs">
                            <Check className="h-3.5 w-3.5 stroke-[3]" />
                          </div>
                          <span className="text-xs font-sans font-normal text-[#6B6B6B] line-through decoration-[#8A8177]/40 flex-1">
                            {lang === 'RU' ? 'Дезинфекция санузла и замена полотенец' : 'Disinfect bathroom & replace towels'}
                          </span>
                        </div>

                        <div className="p-3.5 space-y-3">
                          <div className="flex items-center justify-between gap-3">
                            <div className="flex items-center gap-2.5 text-[#241E1A]">
                              <Camera className="h-4 w-4 text-[#8A8177] shrink-0" />
                              <span className="text-xs font-sans font-normal">
                                {lang === 'RU' ? 'Фотофиксация зоны' : 'Zone photo record'}
                              </span>
                            </div>
                            <span className="bg-[#EBF3EF] text-[#3D7A5A] border border-[#3D7A5A]/15 text-[10px] font-sans font-medium px-2 py-0.5 rounded-md">
                              1 {lang === 'RU' ? 'ФОТО' : 'PHOTO'}
                            </span>
                          </div>

                          {/* Checklist Photo for Bathroom */}
                          <div className="w-1/2 pr-1 pt-1">
                            <div className="space-y-1">
                              <div className="h-24 w-full rounded-xl overflow-hidden border border-[#E5E2DD] bg-slate-100 shadow-2xs">
                                <img 
                                  src="https://images.unsplash.com/photo-1584622650111-993a426fbf0a?w=350&auto=format&fit=crop&q=80" 
                                  alt="Bathroom photo" 
                                  className="w-full h-full object-cover"
                                />
                              </div>
                              <span className="text-[10px] font-sans font-normal text-[#8A8177] block truncate">
                                {lang === 'RU' ? 'Санузел и полотенца' : 'Sanitized & towels'}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Section 4: МИНИ-БАР И ЧАЙ */}
                  <div className="bg-white rounded-[18px] border border-[#E5E2DD] shadow-2xs overflow-hidden select-none">
                    <div 
                      onClick={() => setInspectMinibarOpen(!inspectMinibarOpen)}
                      className="p-4 flex justify-between items-center cursor-pointer hover:bg-slate-50 transition-colors"
                    >
                      <span className="text-[10px] font-sans font-medium tracking-[0.08em] text-[#8A8177] uppercase">
                        {lang === 'RU' ? 'МИНИ-БАР И ЧАЙ' : 'MINIBAR & TEA'}
                      </span>
                      <div className="flex items-center gap-2">
                        <span className="bg-[#FAF0EB] text-[#C2410C] border border-[#F1DDD3] text-[9px] font-sans font-medium px-2 py-0.5 rounded-full">
                          +5 шт
                        </span>
                        <ChevronDown className={`h-4 w-4 text-[#8A8177] transition-transform duration-200 ${inspectMinibarOpen ? 'rotate-180' : ''}`} />
                      </div>
                    </div>

                    {inspectMinibarOpen && (
                      <div className="divide-y divide-[#E5E2DD]/50 border-t border-[#E5E2DD]/50 animate-in fade-in duration-150">
                        <div className="p-3.5 flex justify-between items-center text-xs">
                          <span className="text-[#241E1A] font-sans font-normal">{lang === 'RU' ? 'Кока-Кола (банка)' : 'Coca-Cola (Can)'}</span>
                          <span className="text-[#241E1A] font-sans font-medium">+2 шт</span>
                        </div>
                        <div className="p-3.5 flex justify-between items-center text-xs">
                          <span className="text-[#241E1A] font-sans font-normal">{lang === 'RU' ? 'Минеральная вода (без газа)' : 'Mineral Water'}</span>
                          <span className="text-[#241E1A] font-sans font-medium">+2 шт</span>
                        </div>
                        <div className="p-3.5 flex justify-between items-center text-xs">
                          <span className="text-[#241E1A] font-sans font-normal">{lang === 'RU' ? 'Шоколадный батончик' : 'Chocolate Bar'}</span>
                          <span className="text-[#241E1A] font-sans font-medium">+1 шт</span>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Section 5: РАСХОД МАТЕРИАЛОВ */}
                  <div className="bg-white rounded-[18px] border border-[#E5E2DD] shadow-2xs overflow-hidden select-none">
                    <div 
                      onClick={() => setInspectMaterialsOpen(!inspectMaterialsOpen)}
                      className="p-4 flex justify-between items-center cursor-pointer hover:bg-slate-50 transition-colors"
                    >
                      <span className="text-[10px] font-sans font-medium tracking-[0.08em] text-[#8A8177] uppercase">
                        {lang === 'RU' ? 'РАСХОД МАТЕРИАЛОВ' : 'SPENT CONSUMABLES'}
                      </span>
                      <div className="flex items-center gap-2">
                        <span className="bg-[#F0F5F2] text-[#5B8C6E] border border-[#D5E2D9] text-[9px] font-sans font-medium px-2 py-0.5 rounded-full">
                          4 набора
                        </span>
                        <ChevronDown className={`h-4 w-4 text-[#8A8177] transition-transform duration-200 ${inspectMaterialsOpen ? 'rotate-180' : ''}`} />
                      </div>
                    </div>

                    {inspectMaterialsOpen && (
                      <div className="divide-y divide-[#E5E2DD]/50 border-t border-[#E5E2DD]/50 animate-in fade-in duration-150">
                        <div className="p-3.5 flex justify-between items-center text-xs">
                          <span className="text-[#241E1A] font-sans font-normal">{lang === 'RU' ? 'Зубной набор' : 'Dental Kit'}</span>
                          <span className="text-[#241E1A] font-sans font-medium">2 шт</span>
                        </div>
                        <div className="p-3.5 flex justify-between items-center text-xs">
                          <span className="text-[#241E1A] font-sans font-normal">{lang === 'RU' ? 'Шампунь и кондиционер' : 'Shampoo & Conditioner'}</span>
                          <span className="text-[#241E1A] font-sans font-medium">2 шт</span>
                        </div>
                        <div className="p-3.5 flex justify-between items-center text-xs">
                          <span className="text-[#241E1A] font-sans font-normal">{lang === 'RU' ? 'Гель для душа' : 'Shower Gel'}</span>
                          <span className="text-[#241E1A] font-sans font-medium">2 шт</span>
                        </div>
                        <div className="p-3.5 flex justify-between items-center text-xs">
                          <span className="text-[#241E1A] font-sans font-normal">{lang === 'RU' ? 'Тапочки (пара)' : 'Slippers (pair)'}</span>
                          <span className="text-[#241E1A] font-sans font-medium">2 пары</span>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Section 6: ФОТООТЧЁТ СОСТОЯНИЯ КОМНАТЫ (Matching Reference) */}
                  <div className="space-y-2">
                    <span className="text-[10px] font-sans font-medium tracking-[0.08em] text-[#8A8177] uppercase block">
                      {lang === 'RU' ? 'ФОТООТЧЁТ СОСТОЯНИЯ КОМНАТЫ' : 'ROOM PHOTO REPORT'}
                    </span>
                    <div className="bg-white rounded-[18px] border border-[#E5E2DD] p-4 space-y-3.5 shadow-2xs">
                      {/* Photo before and after grid */}
                      <div className="grid grid-cols-2 gap-3">
                        {/* Photo Before */}
                        <div className="border border-dashed border-[#E5E2DD] rounded-2xl p-2 flex flex-col items-center justify-center space-y-1.5 bg-[#FAF7F3]/40">
                          <div className="h-20 w-full rounded-xl overflow-hidden border border-[#E5E2DD] bg-slate-100">
                            <img 
                              src="https://images.unsplash.com/photo-1590490360182-c33d57733427?w=350&auto=format&fit=crop&q=80" 
                              alt="Room before housekeeping" 
                              className="w-full h-full object-cover"
                            />
                          </div>
                          <div className="flex items-center gap-1.5 text-[#8A8177] text-xs font-sans font-normal pt-0.5">
                            <Camera className="h-3.5 w-3.5" />
                            <span>{lang === 'RU' ? 'Фото до' : 'Photo before'}</span>
                          </div>
                        </div>

                        {/* Photo After */}
                        <div className="border border-dashed border-[#E5E2DD] rounded-2xl p-2 flex flex-col items-center justify-center space-y-1.5 bg-[#FAF7F3]/40">
                          <div className="h-20 w-full rounded-xl overflow-hidden border border-[#E5E2DD] bg-slate-100">
                            <img 
                              src="https://images.unsplash.com/photo-1618773928121-c32242e63f39?w=350&auto=format&fit=crop&q=80" 
                              alt="Room after housekeeping" 
                              className="w-full h-full object-cover"
                            />
                          </div>
                          <div className="flex items-center gap-1.5 text-[#8A8177] text-xs font-sans font-normal pt-0.5">
                            <Camera className="h-3.5 w-3.5" />
                            <span>{lang === 'RU' ? 'Фото после' : 'Photo after'}</span>
                          </div>
                        </div>
                      </div>

                      {/* Cleaner's comment */}
                      <p className="text-xs font-sans font-normal text-[#241E1A] pt-1 leading-relaxed">
                        {cleanerComment}
                      </p>
                    </div>
                  </div>

                  {/* Section 7: НЕПОЛАДКИ (Matching Reference) */}
                  <div className="space-y-2">
                    <span className="text-[10px] font-sans font-medium tracking-[0.08em] text-[#8A8177] uppercase block">
                      {lang === 'RU' ? 'НЕПОЛАДКИ' : 'DEFECTS'}
                    </span>
                    <div className="bg-white rounded-[18px] border border-[#E5E2DD] p-4 shadow-2xs">
                      {roomRequests.length === 0 ? (
                        <div className="flex items-center gap-2.5 text-[#241E1A] text-xs font-sans font-normal">
                          <CheckCircle2 className="h-4.5 w-4.5 text-[#5B8C6E] shrink-0" />
                          <span>{lang === 'RU' ? 'Неполадок не зафиксировано' : 'No defects recorded'}</span>
                        </div>
                      ) : (
                        <div className="space-y-2">
                          {roomRequests.map(req => (
                            <div key={req.id} className="flex items-center justify-between text-xs text-[#B3261E]">
                              <div className="flex items-center gap-2">
                                <Wrench className="h-4 w-4 shrink-0" />
                                <span className="font-medium">{req.description}</span>
                              </div>
                              <span className="text-[10px] bg-[#FAF0EF] px-2 py-0.5 rounded border border-[#F5D6D5]">
                                {req.status}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Section 8: КОММЕНТАРИЙ ПРОВЕРЯЮЩЕГО (Matching Reference) */}
                  <div className="space-y-2">
                    <span className="text-[10px] font-sans font-medium tracking-[0.08em] text-[#8A8177] uppercase block">
                      {lang === 'RU' ? 'КОММЕНТАРИЙ ПРОВЕРЯЮЩЕГО' : 'AUDITOR COMMENT'}
                    </span>
                    <div className="bg-white rounded-[18px] border border-[#E5E2DD] p-3 shadow-2xs">
                      <textarea
                        rows={2}
                        value={rejectComment}
                        onChange={e => setRejectComment(e.target.value)}
                        placeholder={lang === 'RU' ? 'Замечания, если номер отклоняется' : 'Notes if room is rejected'}
                        className="w-full bg-transparent border-none text-xs text-[#241E1A] placeholder-[#8A8177]/70 focus:outline-none font-sans font-normal resize-none leading-relaxed"
                      />
                    </div>
                  </div>

                </div>

                {/* 3. Bottom Action Buttons (Matching Reference) */}
                <div className="p-4.5 bg-[#FAF7F3] border-t border-[#E5E2DD]/30 grid grid-cols-2 gap-3 shrink-0 select-none">
                  <button
                    type="button"
                    onClick={() => {
                      if (!rejectComment) {
                        setRejectComment('Требуется доработка по чек-листу.');
                      }
                      handleRejectInspection(room.id, rejectComment || 'Требуется доработка.');
                      setInspectRoomId(null);
                    }}
                    className="w-full bg-[#FAF0EF] hover:bg-[#F5D6D5] text-[#B3261E] border border-[#F5D6D5] font-sans font-medium text-xs py-3 rounded-xl transition-all cursor-pointer text-center"
                  >
                    {lang === 'RU' ? 'Отклонить' : 'Reject'}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      handleApproveInspection(room.id);
                      setInspectRoomId(null);
                    }}
                    className="w-full bg-[#009b72] hover:bg-[#008460] text-white font-sans font-medium text-xs py-3 rounded-xl shadow-xs transition-colors cursor-pointer text-center flex items-center justify-center gap-1.5"
                  >
                    <Check className="h-4 w-4 text-white" />
                    <span>{lang === 'RU' ? 'Принять' : 'Approve'}</span>
                  </button>
                </div>
              </>
            );
          })()}
        </div>
      )}

      {/* 5. SETTINGS OVERLAY SUB-SCREEN */}
      {showSettings && (
        <div className="absolute inset-0 bg-[#FAF7F3] z-50 flex flex-col animate-in slide-in-from-right duration-200 select-none font-sans">
          {/* Header */}
          <div className="p-4 flex items-center justify-between shrink-0">
            <button 
              onClick={() => {
                setShowSettings(false);
                setIsEditingProfile(false);
              }}
              className="h-9 w-9 rounded-full bg-white border border-[#E5E2DD] text-[#241E1A] hover:bg-slate-50 flex items-center justify-center transition-colors cursor-pointer shadow-2xs"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <div className="w-9" />
          </div>

          <div className="px-4 pb-2">
            <h1 className="font-serif font-medium text-2xl text-[#241E1A]">
              {lang === 'RU' ? 'Настройки' : 'Settings'}
            </h1>
            <p className="text-xs font-sans font-normal text-[#8A8177] pt-0.5">
              {lang === 'RU' ? 'Приложение и учётная запись' : 'App & Account Settings'}
            </p>
          </div>

          {/* Scrollable Settings Panel */}
          <div className="flex-1 p-4 pt-2 space-y-5 overflow-y-auto no-scrollbar">
            
            {/* Section: ПРИЛОЖЕНИЕ */}
            <div className="space-y-2">
              <span className="text-[10px] font-sans font-medium tracking-[0.08em] text-[#8A8177] uppercase block">
                {lang === 'RU' ? 'ПРИЛОЖЕНИЕ' : 'APPLICATION'}
              </span>

              <div className="bg-white rounded-[20px] border border-[#E5E2DD] divide-y divide-[#E5E2DD]/50 shadow-2xs overflow-hidden">
                {/* Row 1: Language */}
                <div className="p-4 flex items-center justify-between">
                  <div>
                    <h4 className="text-xs font-sans font-medium text-[#241E1A]">
                      {lang === 'RU' ? 'Язык интерфейса' : 'Interface Language'}
                    </h4>
                    <p className="text-[11px] font-sans font-normal text-[#8A8177] pt-0.5">
                      {lang === 'RU' ? 'Русский' : 'English'}
                    </p>
                  </div>

                  <div className="flex bg-[#FAF7F3] p-0.5 rounded-xl border border-[#E5E2DD] text-[11px] font-sans font-medium">
                    <button
                      type="button"
                      onClick={() => onLanguageChange && onLanguageChange('RU')}
                      className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${
                        lang === 'RU' ? 'bg-[#241E1A] text-white shadow-xs' : 'text-[#8A8177] hover:text-[#241E1A]'
                      }`}
                    >
                      RU
                    </button>
                    <button
                      type="button"
                      onClick={() => onLanguageChange && onLanguageChange('EN')}
                      className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${
                        lang === 'EN' ? 'bg-[#241E1A] text-white shadow-xs' : 'text-[#8A8177] hover:text-[#241E1A]'
                      }`}
                    >
                      EN
                    </button>
                  </div>
                </div>

                {/* Row 2: Offline Mode */}
                <div className="p-4 flex items-center justify-between">
                  <div>
                    <h4 className="text-xs font-sans font-medium text-[#241E1A]">
                      {lang === 'RU' ? 'Офлайн-режим' : 'Offline Mode'}
                    </h4>
                    <p className="text-[11px] font-sans font-normal text-[#8A8177] pt-0.5">
                      {lang === 'RU' ? 'данные синхронизируются при сети' : 'data syncs when online'}
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={onToggleOffline}
                    className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                      offlineMode ? 'bg-[#5B8C6E]' : 'bg-[#E5E2DD]'
                    }`}
                  >
                    <span
                      className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
                        offlineMode ? 'translate-x-5' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>

                {/* Row 3: Push Notifications */}
                <div className="p-4 flex items-center justify-between">
                  <div>
                    <h4 className="text-xs font-sans font-medium text-[#241E1A]">
                      {lang === 'RU' ? 'Push-уведомления' : 'Push Notifications'}
                    </h4>
                    <p className="text-[11px] font-sans font-normal text-[#8A8177] pt-0.5">
                      {lang === 'RU' ? 'новые задачи и сообщения' : 'new tasks & messages'}
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => setPushNotifications(!pushNotifications)}
                    className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                      pushNotifications ? 'bg-[#5B8C6E]' : 'bg-[#E5E2DD]'
                    }`}
                  >
                    <span
                      className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
                        pushNotifications ? 'translate-x-5' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>

                {/* Row 4: Sound on Task */}
                <div className="p-4 flex items-center justify-between">
                  <div>
                    <h4 className="text-xs font-sans font-medium text-[#241E1A]">
                      {lang === 'RU' ? 'Звук при новой задаче' : 'Sound on New Task'}
                    </h4>
                  </div>

                  <button
                    type="button"
                    onClick={() => setSoundOnNewTask(!soundOnNewTask)}
                    className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                      soundOnNewTask ? 'bg-[#5B8C6E]' : 'bg-[#E5E2DD]'
                    }`}
                  >
                    <span
                      className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
                        soundOnNewTask ? 'translate-x-5' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>
              </div>
            </div>

            {/* Section: СИНХРОНИЗАЦИЯ */}
            <div className="space-y-2">
              <span className="text-[10px] font-sans font-medium tracking-[0.08em] text-[#8A8177] uppercase block">
                {lang === 'RU' ? 'СИНХРОНИЗАЦИЯ' : 'SYNCHRONIZATION'}
              </span>

              <div 
                onClick={() => {
                  setIsSyncing(true);
                  setTimeout(() => {
                    const now = new Date().toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
                    setLastSyncTime(now);
                    setIsSyncing(false);
                  }, 600);
                }}
                className="bg-white rounded-[20px] border border-[#E5E2DD] p-4 flex items-center justify-between shadow-2xs hover:bg-slate-50 transition-colors cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <div className="h-9 w-9 rounded-full bg-[#FAF7F3] border border-[#E5E2DD]/50 text-[#8A8177] flex items-center justify-center shrink-0">
                    <RotateCw className={`h-4 w-4 ${isSyncing ? 'animate-spin text-[#C2410C]' : ''}`} />
                  </div>
                  <div>
                    <h4 className="text-xs font-sans font-medium text-[#241E1A]">
                      {lang === 'RU' ? 'Обновить данные' : 'Sync Data'}
                    </h4>
                    <p className="text-[11px] font-sans font-normal text-[#8A8177] pt-0.5">
                      {lang === 'RU' ? `последняя синхронизация ${lastSyncTime}` : `last sync ${lastSyncTime}`}
                    </p>
                  </div>
                </div>
                <ChevronRight className="h-4 w-4 text-[#8A8177]" />
              </div>
            </div>

            {/* Section: УЧЁТНАЯ ЗАПИСЬ */}
            <div className="space-y-2">
              <span className="text-[10px] font-sans font-medium tracking-[0.08em] text-[#8A8177] uppercase block">
                {lang === 'RU' ? 'УЧЁТНАЯ ЗАПИСЬ' : 'ACCOUNT'}
              </span>

              <div className="bg-white rounded-[20px] border border-[#E5E2DD] divide-y divide-[#E5E2DD]/50 shadow-2xs overflow-hidden">
                <div 
                  onClick={() => {
                    setEditFullName(cleanerProfile.fullName);
                    setEditFullNameRu(cleanerProfile.fullNameRu);
                    setEditBadgeId(cleanerProfile.badgeId);
                    setEditAvatarUrl(cleanerProfile.avatarUrl);
                    setIsEditingProfile(true);
                  }}
                  className="p-4 flex items-center justify-between hover:bg-slate-50 transition-colors cursor-pointer"
                >
                  <div className="flex items-center gap-3 text-[#241E1A]">
                    <User className="h-4 w-4 text-[#8A8177] shrink-0" />
                    <span className="text-xs font-sans font-normal">
                      {lang === 'RU' ? 'Личные данные' : 'Personal Data'}
                    </span>
                  </div>
                  <ChevronRight className="h-4 w-4 text-[#8A8177]" />
                </div>

                <div className="p-4 flex items-center justify-between hover:bg-slate-50 transition-colors cursor-pointer">
                  <div className="flex items-center gap-3 text-[#241E1A]">
                    <Lock className="h-4 w-4 text-[#8A8177] shrink-0" />
                    <span className="text-xs font-sans font-normal">
                      {lang === 'RU' ? 'Сменить пароль' : 'Change Password'}
                    </span>
                  </div>
                  <ChevronRight className="h-4 w-4 text-[#8A8177]" />
                </div>

                <div className="p-4 flex items-center justify-between hover:bg-slate-50 transition-colors cursor-pointer">
                  <div className="flex items-center gap-3 text-[#241E1A]">
                    <HelpCircle className="h-4 w-4 text-[#8A8177] shrink-0" />
                    <span className="text-xs font-sans font-normal">
                      {lang === 'RU' ? 'Служба поддержки' : 'Support Service'}
                    </span>
                  </div>
                  <ChevronRight className="h-4 w-4 text-[#8A8177]" />
                </div>
              </div>
            </div>

            {/* Logout Row */}
            <div 
              onClick={onLogout}
              className="bg-white rounded-[20px] border border-[#E5E2DD] p-4 flex items-center justify-between shadow-2xs hover:bg-rose-50/40 transition-colors cursor-pointer"
            >
              <div className="flex items-center gap-3 text-[#241E1A]">
                <LogOut className="h-4 w-4 text-[#8A8177] shrink-0" />
                <span className="text-xs font-sans font-normal">
                  {lang === 'RU' ? 'Выйти из аккаунта' : 'Log Out'}
                </span>
              </div>
              <ChevronRight className="h-4 w-4 text-[#8A8177]" />
            </div>

          </div>
        </div>
      )}

      {/* 6. NOTIFICATIONS OVERLAY SUB-SCREEN */}
      {showNotifications && (
        <div className="absolute inset-0 bg-[#FAF7F3] z-50 flex flex-col animate-in slide-in-from-right duration-200 select-none font-sans">
          {/* Header */}
          <div className="p-4 flex items-center justify-between shrink-0">
            <button 
              onClick={() => setShowNotifications(false)}
              className="h-9 w-9 rounded-full bg-white border border-[#E5E2DD] text-[#241E1A] hover:bg-slate-50 flex items-center justify-center transition-colors cursor-pointer shadow-2xs"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <div className="w-9" />
          </div>

          <div className="px-4 pb-3">
            <h1 className="font-serif font-medium text-2xl text-[#241E1A]">
              {lang === 'RU' ? 'Уведомления' : 'Notifications'}
            </h1>
            <div className="text-xs font-sans font-normal text-[#8A8177] pt-0.5 flex items-center gap-1.5">
              <span>
                {supervisorNotifications.filter(n => n.unread).length} {lang === 'RU' ? 'новых' : 'new'}
              </span>
              <span>·</span>
              <button
                type="button"
                onClick={() => {
                  setSupervisorNotifications(prev => prev.map(n => ({ ...n, unread: false })));
                }}
                className="text-[#C2410C] hover:underline cursor-pointer"
              >
                {lang === 'RU' ? 'отметить все прочитанными' : 'mark all as read'}
              </button>
            </div>
          </div>

          {/* Filter Pills */}
          <div className="px-4 pb-3 flex items-center gap-2 overflow-x-auto no-scrollbar shrink-0">
            {(['ALL', 'TASKS', 'MAINTENANCE', 'SHIFT'] as const).map(tabKey => {
              const labels = {
                ALL: lang === 'RU' ? 'Все' : 'All',
                TASKS: lang === 'RU' ? 'Задачи' : 'Tasks',
                MAINTENANCE: lang === 'RU' ? 'Техслужба' : 'Tech',
                SHIFT: lang === 'RU' ? 'Смена' : 'Shift'
              };
              const active = notificationFilter === tabKey;
              return (
                <button
                  key={tabKey}
                  type="button"
                  onClick={() => setNotificationFilter(tabKey)}
                  className={`text-xs font-sans px-4 py-1.5 rounded-full transition-all cursor-pointer shrink-0 ${
                    active 
                      ? 'bg-[#241E1A] text-white font-medium shadow-xs' 
                      : 'bg-white border border-[#E5E2DD] text-[#8A8177] hover:text-[#241E1A] font-normal shadow-2xs'
                  }`}
                >
                  {labels[tabKey]}
                </button>
              );
            })}
          </div>

          {/* List of Notification Cards */}
          <div className="flex-1 p-4 pt-1 space-y-4 overflow-y-auto no-scrollbar">
            {/* TODAY Group */}
            {(() => {
              const todayList = supervisorNotifications
                .filter(n => notificationFilter === 'ALL' || n.category === notificationFilter)
                .filter(n => n.dateGroup === 'TODAY');

              if (todayList.length === 0) return null;

              return (
                <div className="space-y-2.5">
                  <span className="text-[10px] font-sans font-medium tracking-[0.08em] text-[#8A8177] uppercase block">
                    {lang === 'RU' ? 'СЕГОДНЯ' : 'TODAY'}
                  </span>

                  {todayList.map(n => {
                    const title = lang === 'RU' ? n.titleRu : n.titleEn;
                    const sub = lang === 'RU' ? n.subRu : n.subEn;
                    return (
                      <div
                        key={n.id}
                        onClick={() => {
                          setSupervisorNotifications(prev => prev.map(item => item.id === n.id ? { ...item, unread: false } : item));
                        }}
                        className={`bg-white rounded-[18px] border p-4 flex items-center justify-between shadow-2xs cursor-pointer transition-colors ${
                          n.urgent ? 'border-l-4 border-l-[#C2410C] border-t-[#E5E2DD] border-r-[#E5E2DD] border-b-[#E5E2DD]' : 'border-[#E5E2DD]'
                        }`}
                      >
                        <div className="flex items-center gap-3.5 min-w-0">
                          <div className={`h-8 w-8 rounded-full flex items-center justify-center shrink-0 ${
                            n.urgent ? 'text-[#C2410C]' : 'text-[#8A8177]'
                          }`}>
                            {n.icon === 'clock' && <Clock className="h-4.5 w-4.5" />}
                            {n.icon === 'wrench' && <Wrench className="h-4.5 w-4.5" />}
                            {n.icon === 'message' && <MessageSquare className="h-4.5 w-4.5" />}
                            {n.icon === 'package' && <Package className="h-4.5 w-4.5" />}
                            {n.icon === 'check' && <CheckCircle2 className="h-4.5 w-4.5 text-[#5B8C6E]" />}
                          </div>

                          <div className="min-w-0">
                            <h4 className="text-xs font-sans font-medium text-[#241E1A] truncate">
                              {title}
                            </h4>
                            <p className="text-[11px] font-sans font-normal text-[#8A8177] pt-0.5 truncate">
                              {sub}
                            </p>
                          </div>
                        </div>

                        {n.unread && (
                          <div className="h-2 w-2 rounded-full bg-[#C2410C] shrink-0 ml-2" />
                        )}
                      </div>
                    );
                  })}
                </div>
              );
            })()}

            {/* YESTERDAY Group */}
            {(() => {
              const yesterdayList = supervisorNotifications
                .filter(n => notificationFilter === 'ALL' || n.category === notificationFilter)
                .filter(n => n.dateGroup === 'YESTERDAY');

              if (yesterdayList.length === 0) return null;

              return (
                <div className="space-y-2.5 pt-1">
                  <span className="text-[10px] font-sans font-medium tracking-[0.08em] text-[#8A8177] uppercase block">
                    {lang === 'RU' ? 'ВЧЕРА' : 'YESTERDAY'}
                  </span>

                  {yesterdayList.map(n => {
                    const title = lang === 'RU' ? n.titleRu : n.titleEn;
                    const sub = lang === 'RU' ? n.subRu : n.subEn;
                    return (
                      <div
                        key={n.id}
                        onClick={() => {
                          setSupervisorNotifications(prev => prev.map(item => item.id === n.id ? { ...item, unread: false } : item));
                        }}
                        className="bg-white rounded-[18px] border border-[#E5E2DD] p-4 flex items-center justify-between shadow-2xs cursor-pointer transition-colors"
                      >
                        <div className="flex items-center gap-3.5 min-w-0">
                          <div className="h-8 w-8 rounded-full flex items-center justify-center text-[#8A8177] shrink-0">
                            {n.icon === 'clock' && <Clock className="h-4.5 w-4.5" />}
                            {n.icon === 'check' && <CheckCircle2 className="h-4.5 w-4.5 text-[#5B8C6E]" />}
                          </div>

                          <div className="min-w-0">
                            <h4 className="text-xs font-sans font-medium text-[#241E1A] truncate">
                              {title}
                            </h4>
                            <p className="text-[11px] font-sans font-normal text-[#8A8177] pt-0.5 truncate">
                              {sub}
                            </p>
                          </div>
                        </div>

                        {n.unread && (
                          <div className="h-2 w-2 rounded-full bg-[#C2410C] shrink-0 ml-2" />
                        )}
                      </div>
                    );
                  })}
                </div>
              );
            })()}

          </div>
        </div>
      )}

      {/* 7. PROFILE EDIT BACKDROP MODAL */}
      {isEditingProfile && (
        <div className="absolute inset-0 bg-black/60 z-[60] flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-sm p-5 shadow-2xl border border-[#E5E2DD] space-y-4 animate-in fade-in zoom-in duration-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <h3 className="text-xs font-black text-[#2B2B2B] uppercase tracking-wide">
                {lang === 'RU' ? 'Редактировать профиль' : 'Edit Profile'}
              </h3>
              <button
                onClick={() => setIsEditingProfile(false)}
                className="h-6 w-6 rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 flex items-center justify-center font-bold text-xs cursor-pointer"
              >
                ×
              </button>
            </div>

            <div className="space-y-3.5 text-[11px]">
              {/* Avatar picker */}
              <div className="flex flex-col items-center gap-2">
                <img 
                  src={editAvatarUrl} 
                  className="h-16 w-16 rounded-full object-cover border-2 border-[#C2410C] shadow-md" 
                  alt="" 
                />
                <div>
                  <input 
                    type="file" 
                    accept="image/*" 
                    id="modal-avatar-upload" 
                    className="hidden" 
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        const reader = new FileReader();
                        reader.onload = () => {
                          if (typeof reader.result === 'string') {
                            setEditAvatarUrl(reader.result);
                          }
                        };
                        reader.readAsDataURL(file);
                      }
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => document.getElementById('modal-avatar-upload')?.click()}
                    className="px-3 py-1.5 bg-[#FAF7F3] hover:bg-[#E5E2DD] text-[#2B2B2B] text-[10px] font-bold rounded-lg cursor-pointer transition-colors border border-[#E5E2DD]"
                  >
                    {lang === 'RU' ? 'Изменить фото' : 'Change photo'}
                  </button>
                </div>
              </div>

              {/* Inputs */}
              <div className="space-y-2">
                {lang === 'RU' ? (
                  <div>
                    <label className="block text-[9px] text-[#8A8177] uppercase font-bold mb-0.5">ФИО</label>
                    <input
                      type="text"
                      value={editFullNameRu}
                      onChange={(e) => {
                        setEditFullNameRu(e.target.value);
                        setEditFullName(e.target.value);
                      }}
                      className="w-full bg-[#FAF7F3] border border-[#E5E2DD] rounded-lg px-2.5 py-1.5 text-[#2B2B2B] focus:outline-none focus:ring-1 focus:ring-[#C2410C] font-medium"
                    />
                  </div>
                ) : (
                  <div>
                    <label className="block text-[9px] text-[#8A8177] uppercase font-bold mb-0.5">Full name</label>
                    <input
                      type="text"
                      value={editFullName}
                      onChange={(e) => {
                        setEditFullName(e.target.value);
                        setEditFullNameRu(e.target.value);
                      }}
                      className="w-full bg-[#FAF7F3] border border-[#E5E2DD] rounded-lg px-2.5 py-1.5 text-[#2B2B2B] focus:outline-none focus:ring-1 focus:ring-[#C2410C] font-medium"
                    />
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsEditingProfile(false)}
                  className="flex-1 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl border border-slate-200 cursor-pointer text-center text-xs"
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
                  className="flex-1 py-2 bg-[#C2410C] hover:bg-[#A93A0C] text-white font-bold rounded-xl shadow-xs cursor-pointer text-center text-xs"
                >
                  {lang === 'RU' ? 'Сохранить' : 'Save'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 8. CHATS OVERLAY SUB-SCREEN */}
      {showChats && (
        <div className="absolute inset-0 bg-[#FAF7F3] z-50 flex flex-col animate-in slide-in-from-right duration-200 select-none font-sans">
          {/* Header */}
          <div className="p-4 flex items-center justify-between shrink-0">
            <button 
              onClick={() => {
                if (activeChatContactId) {
                  setActiveChatContactId(null);
                } else {
                  setShowChats(false);
                }
              }}
              className="h-9 w-9 rounded-full bg-white border border-[#E5E2DD] text-[#241E1A] hover:bg-slate-50 flex items-center justify-center transition-colors cursor-pointer shadow-2xs"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <div className="w-9" />
          </div>

          {activeChatContactId === null ? (
            /* Contact List View */
            <div className="flex-1 flex flex-col min-h-0 px-4 space-y-4">
              <div>
                <h1 className="font-serif font-medium text-2xl text-[#241E1A]">
                  {lang === 'RU' ? 'Чаты' : 'Chats'}
                </h1>
              </div>

              {/* Search Bar */}
              <div className="bg-white border border-[#E5E2DD] rounded-2xl px-3.5 py-2.5 flex items-center gap-2.5 shadow-2xs">
                <Search className="h-4 w-4 text-[#8A8177] shrink-0" />
                <input
                  type="text"
                  placeholder={lang === 'RU' ? 'Поиск по имени' : 'Search by name'}
                  value={chatSearchQuery}
                  onChange={e => setChatSearchQuery(e.target.value)}
                  className="w-full bg-transparent border-none text-xs font-sans font-normal text-[#241E1A] placeholder-[#8A8177] focus:outline-none"
                />
              </div>

              {/* Contacts Card Container */}
              <div className="flex-1 overflow-y-auto no-scrollbar bg-white rounded-[20px] border border-[#E5E2DD] divide-y divide-[#E5E2DD]/50 shadow-2xs mb-4">
                {chatContacts
                  .filter(c => {
                    const q = chatSearchQuery.toLowerCase();
                    return c.name.toLowerCase().includes(q) || c.nameRu.toLowerCase().includes(q) || c.roleRu.toLowerCase().includes(q);
                  })
                  .map(c => {
                    const name = lang === 'RU' ? c.nameRu : c.name;
                    const role = lang === 'RU' ? c.roleRu : c.role;
                    const lastMsg = lang === 'RU' ? c.lastMsgRu : c.lastMsgEn;
                    return (
                      <div
                        key={c.id}
                        onClick={() => {
                          setActiveChatContactId(c.id);
                          setChatContacts(prev => prev.map(item => item.id === c.id ? { ...item, unreadCount: 0 } : item));
                        }}
                        className="p-4 flex items-center justify-between hover:bg-slate-50/60 transition-colors cursor-pointer"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          {/* Initials Avatar */}
                          <div className="h-10 w-10 rounded-full bg-[#FAF7F3] border border-[#E5E2DD] text-[#8A8177] font-sans font-medium text-xs flex items-center justify-center shrink-0">
                            {c.initials}
                          </div>

                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5">
                              <h4 className="text-xs font-sans font-medium text-[#241E1A] truncate">
                                {name}
                              </h4>
                              {c.isPinned && (
                                <span className="text-[11px] leading-none">📌</span>
                              )}
                              <span className="text-[11px] font-sans font-normal text-[#8A8177] truncate">
                                {role}
                              </span>
                            </div>

                            <p className="text-xs font-sans font-normal text-[#8A8177] pt-0.5 truncate leading-tight">
                              {lastMsg}
                            </p>
                          </div>
                        </div>

                        <div className="flex flex-col items-end gap-1 shrink-0 pl-2">
                          <span className="text-[11px] font-sans font-normal text-[#8A8177]">
                            {c.time}
                          </span>
                          {c.unreadCount > 0 && (
                            <span className="h-4.5 w-4.5 rounded-full bg-[#C2410C] text-white text-[10px] font-sans font-medium flex items-center justify-center shadow-xs">
                              {c.unreadCount}
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
              </div>
            </div>
          ) : (
            /* Active Conversation View */
            <div className="flex-1 flex flex-col min-h-0">
              {/* Contact Header Subtitle */}
              {(() => {
                const contact = chatContacts.find(c => c.id === activeChatContactId);
                const name = contact ? (lang === 'RU' ? contact.nameRu : contact.name) : '';
                const role = contact ? (lang === 'RU' ? contact.roleRu : contact.role) : '';
                return (
                  <div className="px-4 pb-3 border-b border-[#E5E2DD]/50">
                    <h2 className="font-serif font-medium text-xl text-[#241E1A]">
                      {name}
                    </h2>
                    <p className="text-xs font-sans font-normal text-[#8A8177] pt-0.5">
                      {role}
                    </p>
                  </div>
                );
              })()}

              {/* Messages Scroller */}
              <div className="flex-1 overflow-y-auto no-scrollbar p-4 space-y-3">
                {(supervisorChatMessages[activeChatContactId] || []).map((msg, idx) => {
                  const isMe = msg.sender === 'SUPERVISOR';
                  return (
                    <div 
                      key={idx}
                      className={`flex ${isMe ? 'justify-end' : 'justify-start'} animate-in fade-in duration-100`}
                    >
                      <div className={`max-w-[80%] rounded-[18px] p-3 shadow-2xs text-xs font-sans font-normal ${
                        isMe 
                          ? 'bg-[#C2410C] text-white rounded-tr-xs' 
                          : 'bg-white border border-[#E5E2DD] text-[#241E1A] rounded-tl-xs'
                      }`}>
                        <p className="leading-relaxed break-words">{msg.text}</p>
                        <span className={`block text-[10px] mt-1 text-right ${isMe ? 'text-white/75' : 'text-[#8A8177]'}`}>
                          {msg.time}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Chat Input Bar */}
              <div className="p-3 bg-white border-t border-[#E5E2DD] flex items-center gap-2">
                <input
                  type="text"
                  placeholder={lang === 'RU' ? 'Ваше сообщение..' : 'Type message..'}
                  value={typedMessage}
                  onChange={e => setTypedMessage(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === 'Enter' && typedMessage.trim()) {
                      const text = typedMessage.trim();
                      const time = new Date().toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
                      const newMsg = { sender: 'SUPERVISOR' as const, text, time };
                      
                      setSupervisorChatMessages(prev => ({
                        ...prev,
                        [activeChatContactId]: [...(prev[activeChatContactId] || []), newMsg]
                      }));
                      setTypedMessage('');

                      setChatContacts(prev => prev.map(item => item.id === activeChatContactId ? { ...item, lastMsgRu: text, lastMsgEn: text, time } : item));

                      setTimeout(() => {
                        const repTime = new Date().toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
                        const repText = lang === 'RU' ? 'Принято, спасибо!' : 'Understood, thank you!';
                        const repMsg = { sender: 'CLEANER' as const, text: repText, time: repTime };
                        
                        setSupervisorChatMessages(prev => ({
                          ...prev,
                          [activeChatContactId]: [...(prev[activeChatContactId] || []), repMsg]
                        }));

                        setChatContacts(prev => prev.map(item => item.id === activeChatContactId ? { ...item, lastMsgRu: repText, lastMsgEn: repText, time: repTime } : item));
                      }, 1000);
                    }
                  }}
                  className="flex-1 bg-[#FAF7F3] border border-[#E5E2DD] rounded-xl px-3.5 py-2.5 text-xs text-[#241E1A] font-sans font-normal placeholder-[#8A8177] focus:outline-none focus:border-[#C2410C]"
                />
                <button
                  type="button"
                  onClick={() => {
                    if (typedMessage.trim()) {
                      const text = typedMessage.trim();
                      const time = new Date().toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
                      const newMsg = { sender: 'SUPERVISOR' as const, text, time };
                      
                      setSupervisorChatMessages(prev => ({
                        ...prev,
                        [activeChatContactId]: [...(prev[activeChatContactId] || []), newMsg]
                      }));
                      setTypedMessage('');

                      setChatContacts(prev => prev.map(item => item.id === activeChatContactId ? { ...item, lastMsgRu: text, lastMsgEn: text, time } : item));

                      setTimeout(() => {
                        const repTime = new Date().toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
                        const repText = lang === 'RU' ? 'Принято, спасибо!' : 'Understood, thank you!';
                        const repMsg = { sender: 'CLEANER' as const, text: repText, time: repTime };
                        
                        setSupervisorChatMessages(prev => ({
                          ...prev,
                          [activeChatContactId]: [...(prev[activeChatContactId] || []), repMsg]
                        }));

                        setChatContacts(prev => prev.map(item => item.id === activeChatContactId ? { ...item, lastMsgRu: repText, lastMsgEn: repText, time: repTime } : item));
                      }, 1000);
                    }
                  }}
                  className="h-10 w-10 rounded-xl bg-[#C2410C] hover:bg-[#A93A0C] text-white flex items-center justify-center transition-colors cursor-pointer shadow-xs shrink-0"
                >
                  <Send className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      )}
      {/* 9. MAINTENANCE DETAIL POPUP MODAL */}
      {selectedMaintenanceId && (
        <div 
          className="absolute inset-0 bg-[#FAF7F3] z-[60] flex flex-col h-full w-full overflow-hidden font-sans animate-in slide-in-from-right duration-200"
          onClick={e => e.stopPropagation()}
        >
          {(() => {
            const req = maintenanceRequests.find(m => m.id === selectedMaintenanceId);
            if (!req) return null;

            const desc = lang === 'RU' ? req.descriptionRu || req.description : req.descriptionEn || req.description;
            const catLabel = req.category === 'PLUMBING' ? (lang === 'RU' ? 'Сантехника' : 'Plumbing')
              : req.category === 'ELECTRICAL' ? (lang === 'RU' ? 'Электрика' : 'Electrical')
              : req.category === 'FURNITURE' ? (lang === 'RU' ? 'Мебель' : 'Furniture')
              : req.category === 'APPLIANCES' ? (lang === 'RU' ? 'Бытовая техника' : 'Appliances')
              : req.category === 'CLEANLINESS' ? (lang === 'RU' ? 'Чистота / Грязь' : 'Cleanliness')
              : (lang === 'RU' ? 'Другое' : 'Other');

            const priorityLabel = req.priority === 'LOW' ? (lang === 'RU' ? 'НИЗКИЙ' : 'LOW')
              : req.priority === 'MEDIUM' ? (lang === 'RU' ? 'СРЕДНИЙ' : 'MEDIUM')
              : req.priority === 'HIGH' ? (lang === 'RU' ? 'ВЫСОКИЙ' : 'HIGH')
              : (lang === 'RU' ? 'КРИТИЧЕСКИЙ' : 'CRITICAL');

            const roomObj = rooms.find(r => r.roomNumber === req.roomNumber);
            const categoryName = roomObj ? roomObj.category : 'Deluxe Suite';

            const authorName = req.roomNumber.startsWith('3') ? (lang === 'RU' ? 'Елена Вэнс' : 'Elena Vance') : (lang === 'RU' ? 'Айгуль Мукан' : 'Aigul Mukan');
            const authorInitials = authorName.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2);
            
            const performerName = lang === 'RU' ? 'Олег Петров' : 'Oleg Petrov';
            const performerInitials = performerName.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2);

            return (
              <>
                {/* Header (Dark bar #241E1A) */}
                <div className="bg-[#241E1A] text-white pt-6 pb-4 px-4.5 space-y-3 shrink-0 select-none">
                  <div className="flex items-center justify-between">
                    <button 
                      onClick={() => setSelectedMaintenanceId(null)}
                      className="flex items-center gap-1 text-[#8A8177] hover:text-white transition-colors text-xs font-sans font-normal cursor-pointer"
                    >
                      <ArrowLeft className="h-4 w-4" />
                      <span>{lang === 'RU' ? 'Техслужба' : 'Maintenance'}</span>
                    </button>
                    {req.blocksCleaning && (
                      <span className="bg-[#FDF2F2] text-[#B3261E] border border-[#F5C2C2]/30 text-[9px] rounded px-2 py-0.5 font-sans font-normal uppercase tracking-wider">
                        {lang === 'RU' ? 'БЛОКИРУЕТ' : 'BLOCKS'}
                      </span>
                    )}
                  </div>

                  <div>
                    <h1 className="text-2xl font-serif font-medium text-white leading-tight">
                      {lang === 'RU' ? `Заявка № ${req.roomNumber}` : `Request № ${req.roomNumber}`}
                    </h1>
                    <div className="flex justify-between items-center text-[11px] text-[#8A8177] pt-1">
                      <span>{req.timestamp}</span>
                      <span>
                        {req.status === 'RESOLVED' ? (lang === 'RU' ? 'устранена' : 'resolved') : (lang === 'RU' ? 'в работе' : 'in progress')}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Scrollable Body */}
                <div className="p-4.5 pt-4.5 space-y-5 flex-1 flex flex-col min-h-0 overflow-y-auto no-scrollbar">
                  {/* Info table container */}
                  <div className="bg-white rounded-[18px] border border-[#E5E2DD] divide-y divide-[#E5E2DD]/50 overflow-hidden shadow-2xs select-none">
                    <div className="p-3.5 flex justify-between items-center gap-2">
                      <span className="text-[13px] font-sans font-normal text-[#8A8177]">
                        {lang === 'RU' ? 'Номер' : 'Room'}
                      </span>
                      <span className="text-[13px] font-sans font-medium text-[#241E1A]">
                        № {req.roomNumber} · {categoryName}
                      </span>
                    </div>

                    <div className="p-3.5 flex justify-between items-center gap-2">
                      <span className="text-[13px] font-sans font-normal text-[#8A8177]">
                        {lang === 'RU' ? 'Категория' : 'Category'}
                      </span>
                      <span className="text-[13px] font-sans font-medium text-[#241E1A]">
                        {catLabel}
                      </span>
                    </div>

                    <div className="p-3.5 flex justify-between items-center gap-2">
                      <span className="text-[13px] font-sans font-normal text-[#8A8177]">
                        {lang === 'RU' ? 'Приоритет' : 'Priority'}
                      </span>
                      <span className="bg-[#FDF2F2] text-[#B3261E] border border-[#F5C2C2]/30 px-2 py-0.5 rounded text-[10px] font-sans font-normal tracking-wide">
                        {priorityLabel}
                      </span>
                    </div>

                    <div className="p-3.5 flex justify-between items-center gap-2">
                      <span className="text-[13px] font-sans font-normal text-[#8A8177]">
                        {lang === 'RU' ? 'Автор' : 'Author'}
                      </span>
                      <div className="flex items-center gap-1.5">
                        <span className="text-[13px] font-sans font-medium text-[#241E1A]">{authorName}</span>
                        <div className="h-6 w-6 rounded-full bg-[#FAF6F0] border border-[#E5E2DD]/40 flex items-center justify-center text-[10px] font-sans font-medium text-[#241E1A]">
                          {authorInitials}
                        </div>
                      </div>
                    </div>

                    <div className="p-3.5 flex justify-between items-center gap-2">
                      <span className="text-[13px] font-sans font-normal text-[#8A8177]">
                        {lang === 'RU' ? 'Исполнитель' : 'Performer'}
                      </span>
                      <div className="flex items-center gap-1.5">
                        <span className="text-[13px] font-sans font-medium text-[#241E1A]">{performerName}</span>
                        <div className="h-6 w-6 rounded-full bg-[#FAF6F0] border border-[#E5E2DD]/40 flex items-center justify-center text-[10px] font-sans font-medium text-[#241E1A]">
                          {performerInitials}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Description Box */}
                  <div className="space-y-2 select-none">
                    <span className="text-[10px] font-sans font-medium tracking-[0.08em] text-[#8A8177] uppercase block">
                      {lang === 'RU' ? 'ОПИСАНИЕ' : 'DESCRIPTION'}
                    </span>
                    <div className="bg-white rounded-[18px] border border-[#E5E2DD] p-4 text-[13px] leading-relaxed text-[#241E1A] font-sans font-normal shadow-2xs">
                      {desc}
                    </div>
                  </div>

                  {/* Blocking Alert */}
                  {req.blocksCleaning && (
                    <div className="bg-[#FDF2F2] border border-[#F5C2C2]/40 rounded-[18px] p-4 flex gap-3 items-center text-[#B3261E] shadow-2xs select-none">
                      <AlertTriangle className="h-5 w-5 shrink-0" />
                      <div className="text-xs font-sans font-normal leading-snug">
                        {lang === 'RU' ? 'Номер заблокирован для уборки до устранения поломки.' : 'Room is blocked for cleaning until issue resolved.'}
                      </div>
                    </div>
                  )}

                  {/* Photo details */}
                  {req.photoUrl && (
                    <div className="space-y-2 select-none">
                      <span className="text-[10px] font-sans font-medium tracking-[0.08em] text-[#8A8177] uppercase block">
                        {lang === 'RU' ? 'ФОТОФИКСАЦИЯ ДЕФЕКТА' : 'PHOTO EVIDENCE'}
                      </span>
                      <div className="rounded-[18px] overflow-hidden border border-[#E5E2DD] bg-white p-1 shadow-2xs w-full">
                        <img src={req.photoUrl} alt="defect detail" className="w-full h-44 object-cover rounded-[14px]" />
                      </div>
                    </div>
                  )}
                </div>

                {/* Bottom controls */}
                <div className="p-4.5 bg-[#FAF7F3] border-t border-[#E5E2DD]/30 grid grid-cols-2 gap-3 shrink-0 select-none">
                  <button
                    onClick={() => {
                      const contact = chatContacts.find(c => c.name.toLowerCase().includes('brody') || c.name.toLowerCase().includes('броди'));
                      if (contact) {
                        setActiveChatContactId(contact.id);
                        setShowChats(true);
                      } else {
                        setShowChats(true);
                      }
                    }}
                    className="w-full bg-white hover:bg-slate-50 border border-[#E5E2DD] text-[#241E1A] font-sans font-medium text-xs py-3 rounded-xl transition-all cursor-pointer text-center"
                  >
                    {lang === 'RU' ? 'Написать технику' : 'Message Tech'}
                  </button>
                  
                  {req.status !== 'RESOLVED' ? (
                    <button
                      onClick={() => {
                        handleUpdateMaintenanceStatus(req.id, 'RESOLVED');
                        setSelectedMaintenanceId(null);
                      }}
                      className="w-full bg-[#C2410C] hover:bg-[#A93A0C] text-white font-sans font-medium text-xs py-3 rounded-xl shadow-xs transition-colors cursor-pointer text-center"
                    >
                      {lang === 'RU' ? 'Устранено' : 'Resolved'}
                    </button>
                  ) : (
                    <button
                      onClick={() => {
                        handleUpdateMaintenanceStatus(req.id, 'IN_PROGRESS');
                        setSelectedMaintenanceId(null);
                      }}
                      className="w-full bg-emerald-700 hover:bg-emerald-800 text-white font-sans font-medium text-xs py-3 rounded-xl shadow-xs transition-colors cursor-pointer text-center"
                    >
                      {lang === 'RU' ? 'Открыть заново' : 'Reopen'}
                    </button>
                  )}
                </div>
              </>
            );
          })()}
        </div>
      )}

      {/* 10. FULL-SCREEN DASHBOARD ROOM DETAIL VIEW */}
      {selectedDashboardRoomId && (
        <div 
          className="absolute inset-0 bg-[#FAF7F3] z-[60] flex flex-col h-full w-full overflow-hidden font-sans animate-in slide-in-from-right duration-200"
          onClick={e => e.stopPropagation()}
        >
          {(() => {
            const room = rooms.find(r => r.id === selectedDashboardRoomId);
            if (!room) return null;

            // Cleaner details
            const cleanerMatch = room.notesRu?.match(/клинер:\s*([^.]+)/) || room.notesEn?.match(/cleaner:\s*([^.]+)/);
            const assignedCleaner = cleanerMatch ? cleanerMatch[1] : (room.floor === 3 ? 'Елена Вэнс' : 'Маркус Броди');
            const cleanerInitials = assignedCleaner.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2);

            // Cleaning standard / type
            const standardTime = room.category.includes('Suite') || room.category.includes('Presidential') ? '30 мин' : '25 мин';
            const cleaningTypeLabel = room.type === 'CHECK_OUT' || room.cleaningType === 'CHECKOUT' 
              ? (lang === 'RU' ? 'Выездная' : 'Check-out')
              : room.cleaningType === 'DEEP_CLEAN'
              ? (lang === 'RU' ? 'Генеральная' : 'Deep Clean')
              : (lang === 'RU' ? 'Текущая' : 'Stay-over');

            const startTime = room.startTime || (room.roomNumber === '304' ? '12:29' : '11:45');
            const currentTimeStr = room.roomNumber === '304' ? '12:41' : (room.isOverdue ? '+24 мин' : '13:15');

            // Status label for header right
            let statusSubtitle = lang === 'RU' ? 'в уборке' : 'cleaning';
            if (room.status === 'READY') statusSubtitle = lang === 'RU' ? 'на проверке' : 'audit';
            else if (room.status === 'PROBLEM') statusSubtitle = lang === 'RU' ? 'заблокирован' : 'blocked';
            else if (room.status === 'PENDING') statusSubtitle = lang === 'RU' ? 'ожидает' : 'pending';
            else if (room.status === 'VERIFIED') statusSubtitle = lang === 'RU' ? 'готово' : 'verified';

            // Completed checklist items count
            const doneChecklistCount = room.checklist.filter(c => c.done).length;
            const totalChecklistCount = room.checklist.length || 4;
            const checklistDoneDisplay = room.roomNumber === '304' ? 2 : (doneChecklistCount || 2);
            const checklistTotalDisplay = room.roomNumber === '304' ? 4 : (totalChecklistCount || 4);
            const checklistPercent = Math.min(100, Math.round((checklistDoneDisplay / checklistTotalDisplay) * 100));

            // Guest preferences text
            const guestWishes = room.notesRu || (lang === 'RU' 
              ? 'Разбудить в 7:00. Принести дополнительные полотенца и воду.' 
              : 'Wake up call at 7:00 AM. Extra towels and bottled water requested.');

            return (
              <>
                {/* Header (Dark bar #241E1A) */}
                <div className="bg-[#241E1A] text-white pt-6 pb-4 px-4.5 space-y-3 shrink-0 select-none">
                  {/* Top row: Back button + Badges */}
                  <div className="flex items-center justify-between">
                    <button 
                      onClick={() => setSelectedDashboardRoomId(null)}
                      className="flex items-center gap-1.5 text-[#8A8177] hover:text-white transition-colors text-xs font-sans font-normal cursor-pointer"
                    >
                      <ArrowLeft className="h-4 w-4 text-[#8A8177]" />
                      <span>{lang === 'RU' ? 'Номера' : 'Rooms'}</span>
                    </button>
                    <div className="flex items-center gap-1.5">
                      {room.priority === 'VIP' && (
                        <span className="bg-[#FAF7F3]/10 text-amber-300 border border-amber-400/30 text-[9px] rounded-md px-2 py-0.5 font-sans font-medium uppercase tracking-wider">
                          VIP
                        </span>
                      )}
                      {room.priority === 'URGENT' && (
                        <span className="bg-rose-950/60 text-rose-300 border border-rose-500/40 text-[9px] rounded-md px-2 py-0.5 font-sans font-medium uppercase tracking-wider">
                          {lang === 'RU' ? 'СРОЧНО' : 'URGENT'}
                        </span>
                      )}
                      {room.status === 'PROBLEM' && (
                        <span className="bg-rose-950/60 text-rose-300 border border-rose-500/40 text-[9px] rounded-md px-2 py-0.5 font-sans font-medium uppercase tracking-wider">
                          {lang === 'RU' ? 'ПРОБЛЕМА' : 'PROBLEM'}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Middle row: Room number + Time */}
                  <div className="flex items-baseline justify-between pt-1">
                    <h1 className="text-2xl font-serif font-medium text-white leading-none">
                      № {room.roomNumber}
                    </h1>
                    <span className="text-2xl font-sans font-medium text-[#E4732C] leading-none">
                      {currentTimeStr}
                    </span>
                  </div>

                  {/* Subtitle row: Category & Floor + Status */}
                  <div className="flex items-center justify-between text-xs text-[#8A8177] font-sans font-normal pt-0.5">
                    <span>{room.category} · {lang === 'RU' ? `${room.floor} этаж` : `Floor ${room.floor}`}</span>
                    <span>{statusSubtitle}</span>
                  </div>
                </div>

                {/* Scrollable Body */}
                <div className="p-4.5 pt-4.5 space-y-5 flex-1 flex flex-col min-h-0 overflow-y-auto no-scrollbar">
                  {/* Table Box (General Info) */}
                  <div className="bg-white rounded-[18px] border border-[#E5E2DD] divide-y divide-[#E5E2DD]/50 overflow-hidden shadow-2xs select-none">
                    <div className="px-4 py-2.5 min-h-[48px] flex justify-between items-center gap-2">
                      <span className="text-[13px] font-sans font-normal text-[#8A8177]">
                        {lang === 'RU' ? 'Исполнитель' : 'Cleaner'}
                      </span>
                      <div className="flex items-center gap-2">
                        <span className="text-[13px] font-sans font-medium text-[#241E1A]">{assignedCleaner}</span>
                        <div className="h-6 w-6 rounded-full bg-[#FAF6F0] border border-[#E5E2DD]/40 flex items-center justify-center text-[10px] font-sans font-medium text-[#241E1A] shrink-0">
                          {cleanerInitials}
                        </div>
                      </div>
                    </div>

                    <div className="px-4 py-2.5 min-h-[48px] flex justify-between items-center gap-2">
                      <span className="text-[13px] font-sans font-normal text-[#8A8177]">
                        {lang === 'RU' ? 'Начата' : 'Started'}
                      </span>
                      <span className="text-[13px] font-sans font-medium text-[#241E1A]">
                        {startTime}
                      </span>
                    </div>

                    <div className="px-4 py-2.5 min-h-[48px] flex justify-between items-center gap-2">
                      <span className="text-[13px] font-sans font-normal text-[#8A8177]">
                        {lang === 'RU' ? 'Норматив' : 'Standard'}
                      </span>
                      <span className="text-[13px] font-sans font-medium text-[#241E1A]">
                        {standardTime}
                      </span>
                    </div>

                    <div className="px-4 py-2.5 min-h-[48px] flex justify-between items-center gap-2">
                      <span className="text-[13px] font-sans font-normal text-[#8A8177]">
                        {lang === 'RU' ? 'Тип уборки' : 'Cleaning type'}
                      </span>
                      <span className="text-[13px] font-sans font-medium text-[#241E1A]">
                        {cleaningTypeLabel}
                      </span>
                    </div>
                  </div>

                  {/* Section: ВЫПОЛНЕНИЕ (Checklist Progress) */}
                  <div className="space-y-2 select-none">
                    <span className="text-[10px] font-sans font-medium tracking-[0.08em] text-[#8A8177] uppercase block">
                      {lang === 'RU' ? 'ВЫПОЛНЕНИЕ' : 'PROGRESS'}
                    </span>
                    <div className="bg-white rounded-[18px] border border-[#E5E2DD] p-4 space-y-2.5 shadow-2xs">
                      <div className="flex justify-between items-center text-[13px] font-sans">
                        <span className="text-[#8A8177] font-normal">
                          {lang === 'RU' ? 'Задачи чек-листа' : 'Checklist tasks'}
                        </span>
                        <span className="font-medium text-[#241E1A]">
                          {checklistDoneDisplay} {lang === 'RU' ? 'из' : 'of'} {checklistTotalDisplay}
                        </span>
                      </div>
                      <div className="h-1.5 w-full bg-[#E5E2DD]/40 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-[#5B8C6E] rounded-full transition-all duration-300"
                          style={{ width: `${checklistPercent}%` }}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Section: Warning / Delay Notice */}
                  {(room.isOverdue || room.status === 'PROBLEM' || room.roomNumber === '304' || room.roomNumber === '312') && (
                    <div className="bg-[#FDF2F2] border border-[#F5C2C2]/40 rounded-[18px] p-4 space-y-1 shadow-2xs select-none">
                      <div className="flex items-center gap-2 text-[#B3261E]">
                        <AlertTriangle className="h-4 w-4 shrink-0" />
                        <span className="text-xs font-sans font-medium">
                          {lang === 'RU' ? 'Опаздывает от графика на 8 минут.' : '8 minutes behind schedule.'}
                        </span>
                      </div>
                      <p className="text-[11px] font-sans font-normal text-[#B3261E]/90 pl-6">
                        {lang === 'RU' ? 'Рекомендуется подключить второго клинера.' : 'Recommended to assign a second cleaner.'}
                      </p>
                    </div>
                  )}

                  {/* Section: ПОЖЕЛАНИЯ ГОСТЯ */}
                  <div className="space-y-2 select-none">
                    <span className="text-[10px] font-sans font-medium tracking-[0.08em] text-[#8A8177] uppercase block">
                      {lang === 'RU' ? 'ПОЖЕЛАНИЯ ГОСТЯ' : 'GUEST PREFERENCES'}
                    </span>
                    <div className="bg-[#FDF9F0] border border-[#F3EAD5] rounded-[18px] p-4 text-xs font-sans font-normal text-[#241E1A] leading-relaxed shadow-2xs">
                      {guestWishes}
                    </div>
                  </div>
                </div>

                {/* Bottom Controls */}
                <div className="p-4.5 bg-[#FAF7F3] border-t border-[#E5E2DD]/30 grid grid-cols-2 gap-3 shrink-0 select-none">
                  <button
                    onClick={() => {
                      const contact = chatContacts.find(c => c.name.toLowerCase().includes(assignedCleaner.toLowerCase().split(' ')[0]));
                      if (contact) {
                        setActiveChatContactId(contact.id);
                        setShowChats(true);
                      } else {
                        setShowChats(true);
                      }
                    }}
                    className="w-full bg-white hover:bg-slate-50 border border-[#E5E2DD] text-[#241E1A] font-sans font-medium text-xs py-3 rounded-xl transition-all cursor-pointer text-center"
                  >
                    {lang === 'RU' ? 'Написать клинеру' : 'Message Cleaner'}
                  </button>
                  <button
                    onClick={() => {
                      setSourceCleanerId(assignedCleaner.toLowerCase().includes('елена') || assignedCleaner.toLowerCase().includes('elena') ? 'cleaner-1' : 'cleaner-2');
                      setShowReallocateModal(true);
                    }}
                    className="w-full bg-[#C2410C] hover:bg-[#A93A0C] text-white font-sans font-medium text-xs py-3 rounded-xl shadow-xs transition-colors cursor-pointer text-center"
                  >
                    {lang === 'RU' ? 'Передать задачу' : 'Transfer Task'}
                  </button>
                </div>
              </>
            );
          })()}
        </div>
      )}

      {/* ADD STAFF MODAL */}
      {showAddStaffModal && (
        <div
          className="absolute inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 select-none font-sans"
          onClick={() => setShowAddStaffModal(false)}
        >
          <div
            className="bg-[#FAF7F3] rounded-t-[24px] sm:rounded-[24px] w-full max-w-sm p-4.5 space-y-4 border border-[#E5E2DD] shadow-2xl animate-in slide-in-from-bottom-6 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-1 border-b border-[#E5E2DD]/50">
              <h3 className="font-serif font-medium text-lg text-[#241E1A]">
                {lang === 'RU' ? 'Добавить сотрудника' : 'Add Employee'}
              </h3>
              <button
                type="button"
                onClick={() => setShowAddStaffModal(false)}
                className="h-7 w-7 rounded-full bg-white border border-[#E5E2DD] text-[#8A8177] hover:text-[#241E1A] text-xs flex items-center justify-center cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs font-sans">
              <div>
                <label className="block text-[10px] font-medium text-[#8A8177] uppercase tracking-wider mb-1">
                  {lang === 'RU' ? 'Телефон (логин)' : 'Phone (login)'}
                </label>
                <input
                  type="tel"
                  placeholder="+7 (701) 000-00-00"
                  value={newStaffPhone}
                  onChange={(e) => setNewStaffPhone(e.target.value)}
                  className="w-full bg-white border border-[#E5E2DD] rounded-xl px-3 py-2.5 text-xs text-[#241E1A] focus:outline-none focus:border-[#C2410C]"
                />
              </div>

              <div>
                <label className="block text-[10px] font-medium text-[#8A8177] uppercase tracking-wider mb-1">
                  {lang === 'RU' ? 'Имя и фамилия' : 'Full Name'}
                </label>
                <input
                  type="text"
                  placeholder={lang === 'RU' ? 'Например: Сабина Алиева' : 'e.g. Sabina Aliyeva'}
                  value={newStaffName}
                  onChange={(e) => setNewStaffName(e.target.value)}
                  className="w-full bg-white border border-[#E5E2DD] rounded-xl px-3 py-2.5 text-xs text-[#241E1A] focus:outline-none focus:border-[#C2410C]"
                />
              </div>

              <div>
                <label className="block text-[10px] font-medium text-[#8A8177] uppercase tracking-wider mb-1.5">
                  {lang === 'RU' ? 'Роль' : 'Role'}
                </label>
                <div className="grid grid-cols-3 gap-1.5">
                  <button
                    type="button"
                    onClick={() => setNewStaffRole('CLEANER')}
                    className={`py-2 rounded-xl text-xs font-sans transition-all cursor-pointer text-center ${
                      newStaffRole === 'CLEANER'
                        ? 'bg-[#241E1A] text-white font-medium shadow-xs'
                        : 'bg-white border border-[#E5E2DD] text-[#8A8177] hover:text-[#241E1A] font-normal'
                    }`}
                  >
                    {lang === 'RU' ? 'Клинер' : 'Cleaner'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setNewStaffRole('SUPERVISOR')}
                    className={`py-2 rounded-xl text-xs font-sans transition-all cursor-pointer text-center ${
                      newStaffRole === 'SUPERVISOR'
                        ? 'bg-[#241E1A] text-white font-medium shadow-xs'
                        : 'bg-white border border-[#E5E2DD] text-[#8A8177] hover:text-[#241E1A] font-normal'
                    }`}
                  >
                    {lang === 'RU' ? 'Супервайзер' : 'Supervisor'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setNewStaffRole('TECH')}
                    className={`py-2 rounded-xl text-xs font-sans transition-all cursor-pointer text-center ${
                      newStaffRole === 'TECH'
                        ? 'bg-[#241E1A] text-white font-medium shadow-xs'
                        : 'bg-white border border-[#E5E2DD] text-[#8A8177] hover:text-[#241E1A] font-normal'
                    }`}
                  >
                    {lang === 'RU' ? 'Техник' : 'Tech'}
                  </button>
                </div>
              </div>

              <div className="bg-[#FAF0E4] border border-[#EFE0C4] rounded-xl p-3 text-[11px] text-[#8A5210] leading-relaxed">
                {lang === 'RU'
                  ? 'Сотруднику будет отправлено SMS со ссылкой и одноразовым паролем. Приглашение действует 7 дней.'
                  : 'An SMS invite with one-time code will be dispatched. Valid for 7 days.'}
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddStaffModal(false)}
                  className="flex-1 bg-white border border-[#E5E2DD] text-[#8A8177] font-medium py-3 rounded-xl hover:bg-slate-50 cursor-pointer text-center"
                >
                  {lang === 'RU' ? 'Отмена' : 'Cancel'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (!newStaffPhone.trim() || !newStaffName.trim()) {
                      alert(lang === 'RU' ? 'Пожалуйста, заполните телефон и имя сотрудника' : 'Please enter phone and name');
                      return;
                    }
                    setInvitedStaffList((prev) => [
                      ...prev,
                      {
                        id: `inv-${Date.now()}`,
                        phone: newStaffPhone,
                        role: newStaffRole === 'CLEANER' ? 'Клинер' : newStaffRole === 'SUPERVISOR' ? 'Супервайзер' : 'Техник',
                        sentDate: 'сегодня'
                      }
                    ]);
                    alert(lang === 'RU' ? `Приглашение отправлено на ${newStaffPhone}` : `Invitation dispatched to ${newStaffPhone}`);
                    setNewStaffPhone('');
                    setNewStaffName('');
                    setShowAddStaffModal(false);
                  }}
                  className="flex-1 bg-[#C2410C] hover:bg-[#A93A0C] text-white font-medium py-3 rounded-xl shadow-xs cursor-pointer text-center"
                >
                  {lang === 'RU' ? 'Отправить' : 'Send Invite'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* FIRE CONFIRM MODAL */}
      {showFireConfirmModal && (
        <div
          className="absolute inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 select-none font-sans"
          onClick={() => setShowFireConfirmModal(false)}
        >
          <div
            className="bg-[#FAF7F3] rounded-t-[24px] sm:rounded-[24px] w-full max-w-sm p-4.5 space-y-4 border border-[#E5E2DD] shadow-2xl animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-1 border-b border-[#E5E2DD]/50">
              <h3 className="font-serif font-medium text-lg text-[#B3261E]">
                {lang === 'RU' ? 'Увольнение сотрудника' : 'Dismiss Employee'}
              </h3>
              <button
                type="button"
                onClick={() => setShowFireConfirmModal(false)}
                className="h-7 w-7 rounded-full bg-white border border-[#E5E2DD] text-[#8A8177] hover:text-[#241E1A] text-xs flex items-center justify-center cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs font-sans text-[#241E1A]">
              <p className="font-medium text-sm">
                {lang === 'RU'
                  ? `Вы действительно хотите уволить сотрудника ${selectedStaffMember?.name || ''}?`
                  : `Are you sure you want to dismiss ${selectedStaffMember?.nameEn || ''}?`}
              </p>

              <div className="bg-[#FBEAEA] border border-[#EFCFCF] rounded-xl p-3 text-[11px] text-[#8F1F19] space-y-1.5 leading-relaxed">
                <p>• {lang === 'RU' ? 'Учётная запись переводится в архив, вход блокируется немедленно.' : 'Account archived and login disabled immediately.'}</p>
                <p>• {lang === 'RU' ? 'Незавершённые задачи переходят в состояние «требует переназначения».' : 'Unfinished tasks marked as requiring reallocation.'}</p>
                <p>• {lang === 'RU' ? 'История уборок и отчёты сохраняются в системе.' : 'Historical cleaning audits and shift reports remain saved.'}</p>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowFireConfirmModal(false)}
                  className="flex-1 bg-white border border-[#E5E2DD] text-[#8A8177] font-medium py-3 rounded-xl hover:bg-slate-50 cursor-pointer text-center"
                >
                  {lang === 'RU' ? 'Отмена' : 'Cancel'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setSupervisorStaffList((prev) => prev.filter((st) => st.id !== selectedStaffMember?.id));
                    alert(lang === 'RU' ? 'Сотрудник переведён в архив. Задачи отправлены на перераспределение.' : 'Employee archived.');
                    setShowFireConfirmModal(false);
                    setSvActiveSubscreen('STAFF_MANAGEMENT');
                  }}
                  className="flex-1 bg-[#B3261E] hover:bg-[#8F1F19] text-white font-medium py-3 rounded-xl shadow-xs cursor-pointer text-center"
                >
                  {lang === 'RU' ? 'Уволить' : 'Dismiss'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
