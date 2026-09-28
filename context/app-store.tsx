import React, { createContext, useContext, useState, useCallback, useEffect, useMemo, useRef } from 'react';
import { useAudioPlayer } from 'expo-audio';
import {
  Language,
  HotelRoom,
  RoomStatus,
  RoomCheckitem,
  ShiftHistoryItem,
  SupplyItem,
  AppNotification,
  MaintenanceRequest,
  MaintenanceStatus,
  MaintenanceStep,
  CleanerProfile,
  PartItem,
  PartOrder,
  StaffMember,
  RejectedInspection,
  ParkingSpot,
  ParkingSession,
} from '@/types';
import {
  mockRooms,
  mockCleaners,
  mockSupplyItems,
  mockNotifications,
  mockMaintenanceRequests,
  mockShiftHistory,
} from '@/data/mockData';
import {
  ApiRequestError,
  ApiUser,
  chargeMinibar,
  clearSession,
  createRecord,
  getDashboard,
  getMe,
  getStoredSession,
  hydrateSession,
  listHousekeeping,
  listMinibarItems,
  listRecord,
  listRooms,
  listStaff,
  login as apiLogin,
  updateHousekeepingStatus,
  updateRecord,
  updateRoomFields,
  updateRoomStatusField,
  uploadRoomPhoto,
} from '@/lib/api-client';

export interface ChatMessage {
  sender: 'CLEANER' | 'OTHER';
  text: string;
  time: string;
}

export interface ChatContact {
  id: string;
  name: string;
  nameRu: string;
  role: string;
  roleRu: string;
  avatarUrl: string;
  phone: string;
  unreadCount: number;
  messages: ChatMessage[];
  quickRepliesRu: string[];
  quickRepliesEn: string[];
}

const INITIAL_CHAT_CONTACTS: ChatContact[] = [
  {
    id: 'super-anna',
    name: 'Anna Peterson',
    nameRu: 'Анна Петерсон',
    role: 'Supervisor',
    roleRu: 'Супервайзер',
    avatarUrl: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150&auto=format&fit=crop&q=80',
    phone: '+7 (999) 450-12-88',
    unreadCount: 0,
    messages: [
      { sender: 'OTHER', text: 'Доброе утро! Ваша смена активирована. Пожалуйста, проверьте этаж 3.', time: '08:00' },
    ],
    quickRepliesRu: ['Сообщение принято. Отправляю дежурного. Спасибо!', 'Поняла вас, проверю в течение 10 минут.', 'Спасибо за отчет!'],
    quickRepliesEn: ['Message received. Directing shift crew. Thank you!', 'Got it, will inspect in 10 minutes.', 'Thanks for the report!'],
  },
  {
    id: 'cleaner-marcus',
    name: 'Marcus Brody',
    nameRu: 'Маркус Броди',
    role: 'Housekeeper',
    roleRu: 'Горничная',
    avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
    phone: '+7 (999) 555-01-99',
    unreadCount: 1,
    messages: [
      { sender: 'OTHER', text: 'Привет, у тебя есть лишние большие простыни на 3 этаже? Нам не хватило для 208 номера.', time: '13:02' },
    ],
    quickRepliesRu: ['Привет! Да, есть 2 штуки на тележке, забирай у лифта.', 'К сожалению, закончились, жду поставку.', 'Спроси у Светланы, у нее был запас.'],
    quickRepliesEn: ['Hey! Yes, I have 2 sheets on my trolley near the elevator.', 'Sorry, ran out, waiting for refill.', 'Ask Svetlana, she had a reserve.'],
  },
  {
    id: 'senior-svetlana',
    name: 'Svetlana Kim',
    nameRu: 'Светлана Ким',
    role: 'Senior Housekeeper',
    roleRu: 'Старшая горничная',
    avatarUrl: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&auto=format&fit=crop&q=80',
    phone: '+7 (800) 100-20-30',
    unreadCount: 0,
    messages: [
      { sender: 'OTHER', text: 'Пожалуйста, сверьте стандарты по 304 номеру до 13:45. Заезд VIP гостя планируется раньше.', time: '12:45' },
    ],
    quickRepliesRu: ['Принято в работу, уже заканчиваю спальню.', 'Всё готово, стандарты подтверждены.', 'Хорошо, сейчас перепроверю мини-бар.'],
    quickRepliesEn: ['Accepted, already finishing the bedroom details.', 'All set, standards verified.', 'Okay, will double check the minibar now.'],
  },
  {
    id: 'head-oleg',
    name: 'Oleg Voronov',
    nameRu: 'Олег Воронов',
    role: 'Head of Housekeeping',
    roleRu: 'Руководитель службы',
    avatarUrl: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&auto=format&fit=crop&q=80',
    phone: '+7 (800) 100-20-30',
    unreadCount: 0,
    messages: [
      { sender: 'OTHER', text: 'Отличная работа по аудитам 3 этажа на этой неделе. Качество 99%. Так держать!', time: 'Вчера' },
    ],
    quickRepliesRu: ['Спасибо большое, Олег! Стараемся всей командой.', 'Спасибо! Будем поддерживать этот уровень.'],
    quickRepliesEn: ['Thank you very much, Oleg! Great team effort.', 'Thank you! We will keep up this standard.'],
  },
];

// Minutes between two "HH:MM" clock readings (see mapHousekeepingTask), assuming both
// fall on the same day; a negative gap means the second one crossed midnight.
function minutesBetweenClock(start: string, end: string): number {
  const parse = (v: string) => {
    const m = /^(\d{1,2}):(\d{2})/.exec(v);
    return m ? Number(m[1]) * 60 + Number(m[2]) : null;
  };
  const s = parse(start);
  const e = parse(end);
  if (s === null || e === null) return 0;
  let diff = e - s;
  if (diff < 0) diff += 24 * 60;
  return diff;
}

function timeNow() {
  return new Date().toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
}

export type StaffRole = 'CLEANER' | 'TECHNICIAN' | 'SUPERVISOR' | 'WAITER' | 'PARKING';

// Classifies an API user into one of the roles this app supports, from the free-text
// role/roleCode the backend returns. Returns null when neither matches, so callers can
// reject unsupported roles without guessing. Checked via roleCode primarily — the
// backend's demo supervisor account carries role:"RECEPTION" but roleCode:"supervisor".
function classifyRole(user: Pick<ApiUser, 'role' | 'roleCode'>): StaffRole | null {
  const role = `${user.role || ''} ${user.roleCode || ''}`.toLowerCase();
  if (role.includes('technician')) return 'TECHNICIAN';
  if (role.includes('supervisor')) return 'SUPERVISOR';
  if (role.includes('waiter') || role.includes('host') || role.includes('maitre')) return 'WAITER';
  if (role.includes('parking') || role.includes('valet')) return 'PARKING';
  if (role.includes('cleaner') || role.includes('housekeeper') || role.includes('housekeeping')) return 'CLEANER';
  return null;
}

const INITIAL_PARKING_SPOTS: ParkingSpot[] = [
  { id: 'a01', code: 'A-01', zone: 'A' },
  { id: 'a02', code: 'A-02', zone: 'A' },
  { id: 'b01', code: 'B-01', zone: 'B' },
  { id: 'b02', code: 'B-02', zone: 'B' },
  { id: 'vip1', code: 'VIP-1', zone: 'VIP' },
];

const INITIAL_PARKING_SESSIONS: ParkingSession[] = [
  { id: 'ps1', spotId: 'b02', plate: '001AAA02', guestName: 'Тест Тестов', checkedInAt: timeNow() },
];

interface AppState {
  lang: Language;
  setLang: (lang: Language) => void;

  isLoggedIn: boolean;
  authReady: boolean;
  role: StaffRole | null;
  login: (profile: CleanerProfile, sessionUser?: ApiUser) => void;
  authenticate: (email: string, password: string, tenantSlug?: string) => Promise<void>;
  logout: () => void;

  cleanerProfile: CleanerProfile;
  updateCleanerProfile: (profile: CleanerProfile) => void;

  rooms: HotelRoom[];
  updateRoomStatus: (roomId: string, status: RoomStatus) => boolean;
  updateRoomChecklist: (roomId: string, checklist: RoomCheckitem[]) => void;
  uploadRoomPhoto: (roomId: string, uri: string, stage: string) => Promise<void>;
  activeRoom: HotelRoom | null;
  verifyRoom: (roomId: string) => void;
  rejectRoomInspection: (roomId: string, note: string) => void;
  reassignRooms: (fromName: string, toName: string) => number;

  staffList: StaffMember[];
  rejectedInspections: RejectedInspection[];

  parkingSpots: ParkingSpot[];
  parkingSessions: ParkingSession[];
  checkInVehicle: (plate: string, guestName: string, spotId: string, note?: string) => void;
  checkOutVehicle: (sessionId: string) => void;

  supplies: SupplyItem[];
  updateSupplyQty: (supplyId: string, diff: number) => void;
  requestSupplyRefill: (supplyId: string, qty: number) => void;
  deductSupplies: (deductions: Record<string, number>) => void;
  confirmMinibarRefill: (roomId: string, refillMap: Record<string, number>) => void;
  submitMinibarCheckout: (
    roomId: string,
    items: { id: string; nameEn: string; nameRu: string; qty: number }[],
    hasDamage: boolean,
    damageDescription: string
  ) => void;

  notifications: AppNotification[];
  addSystemNotification: (msgEn: string, msgRu: string, cat: AppNotification['category']) => void;
  markNotificationAsRead: (id: string) => void;
  markAllNotificationsAsRead: () => void;

  maintenanceRequests: MaintenanceRequest[];
  addMaintenanceRequest: (req: Omit<MaintenanceRequest, 'id' | 'timestamp' | 'status'>) => void;
  updateMaintenanceStatus: (id: string, status: MaintenanceStatus) => void;
  toggleMaintenanceStep: (ticketId: string, stepId: string) => void;
  saveRepairCost: (id: string, cost: number, comment: string) => void;
  addMaintenanceComment: (id: string, text: string) => void;
  addUsedPart: (ticketId: string, part: PartItem, qty: number) => void;
  uploadMaintenancePhoto: (ticketId: string, uri: string, stage: 'before' | 'after') => Promise<void>;

  parts: PartItem[];
  partOrders: PartOrder[];
  orderParts: (items: PartItem[]) => void;

  offlineMode: boolean;
  toggleOffline: () => void;

  // Plays a short chime for new/urgent-task notifications (both locally generated ones
  // and newly-arrived ones from the API) when enabled.
  taskSoundEnabled: boolean;
  toggleTaskSound: () => void;

  // Manual "Refresh data" — re-fetches everything from the API. lastSyncedAt is the real
  // time of the last successful sync (null before the first one), not a placeholder.
  refreshData: () => Promise<void>;
  lastSyncedAt: string | null;

  chatContacts: ChatContact[];
  shiftHistory: ShiftHistoryItem[];
  sendContactMessage: (contactId: string, text: string) => void;
  markContactRead: (contactId: string) => void;
}

function asList<T>(value: unknown): T[] {
  if (Array.isArray(value)) return value as T[];
  if (value && typeof value === 'object' && Array.isArray((value as { data?: unknown }).data)) {
    return (value as { data: T[] }).data;
  }
  return [];
}

function translateRoomStatus(status: string, roomStatus?: string): RoomStatus {
  if (status === 'IN_PROGRESS') return 'IN_PROGRESS';
  if (status === 'DONE') return roomStatus === 'INSPECTED' || roomStatus === 'VACANT_READY' ? 'VERIFIED' : 'READY';
  if (roomStatus === 'REPAIR_REQUIRED' || roomStatus === 'OUT_OF_SERVICE') return 'PROBLEM';
  return 'PENDING';
}

function translateCleaningType(value?: string): HotelRoom['cleaningType'] {
  switch ((value || '').toLowerCase()) {
    case 'stayover':
    case 'daily':
      return 'STAYOVER';
    case 'deep':
    case 'deep_clean':
      return 'DEEP_CLEAN';
    case 'after_maintenance':
    case 'linen':
      return 'AFTER_MAINTENANCE';
    default:
      return 'CHECKOUT';
  }
}

function translatePriority(value?: string | number): HotelRoom['priority'] {
  const priority = typeof value === 'number' ? value : Number(value);
  if (priority >= 4 || String(value).toUpperCase() === 'VIP') return 'VIP';
  if (priority >= 3 || String(value).toUpperCase() === 'URGENT') return 'URGENT';
  return 'NORMAL';
}

function fallbackChecklist(roomNumber: string): RoomCheckitem[] {
  return [
    { id: `${roomNumber}-c1`, textEn: 'Change bed linen & pillowcases', textRu: 'Смена белья и наволочек', done: false, zone: 'BEDROOM' },
    { id: `${roomNumber}-c2`, textEn: 'Disinfect bathroom & replace towels', textRu: 'Дезинфекция санузла и замена полотенец', done: false, zone: 'BATHROOM' },
    { id: `${roomNumber}-c3`, textEn: 'Restock minibar & amenities', textRu: 'Пополнение мини-бара и расходников', done: false, zone: 'MINIBAR' },
  ];
}

function mapHousekeepingTask(task: any, roomFallback?: any, checklistRecord?: any): HotelRoom {
  const room = task.room || {};
  const roomNumber = String(room.number || roomFallback?.number || '—');
  const status = translateRoomStatus(String(task.status || ''), room.status);
  const notes = typeof task.notes === 'string' ? task.notes : typeof room.notes === 'string' ? room.notes : '';
  const checklist = Array.isArray(task.checklist)
    ? task.checklist
    : Array.isArray(checklistRecord?.checklist)
      ? checklistRecord.checklist
      : fallbackChecklist(roomNumber);
  return {
    id: String(task.id),
    physicalRoomId: String(room.id || roomFallback?.id || ''),
    roomNumber,
    floor: Number(room.floor ?? roomFallback?.floor ?? 0),
    category: String(room.roomType?.name || roomFallback?.roomType?.name || roomFallback?.category || 'Room'),
    status,
    cleaningType: translateCleaningType(task.cleaningType),
    priority: translatePriority(task.priority),
    checkoutTime: String(roomFallback?.checkoutTime || '—'),
    checkinTime: String(roomFallback?.checkinTime || '—'),
    adults: Number(roomFallback?.adults ?? 0),
    children: Number(roomFallback?.children ?? 0),
    deadline: String(roomFallback?.deadline || '—'),
    isOverdue: Boolean(roomFallback?.isOverdue),
    notesEn: notes,
    notesRu: notes,
    checklist: status === 'READY' || status === 'VERIFIED' ? checklist.map((item: RoomCheckitem) => ({ ...item, done: true })) : checklist,
    startTime: task.startedAt ? new Date(task.startedAt).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' }) : undefined,
    endTime: task.completedAt ? new Date(task.completedAt).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' }) : undefined,
    assignedTo: task.assignedTo ? String(task.assignedTo) : undefined,
  };
}

function mapSupply(item: any): SupplyItem {
  const category = String(item.category || 'CLEANING').toUpperCase();
  return {
    id: String(item.id),
    nameEn: String(item.nameEn || item.name || item.sku || 'Item'),
    nameRu: String(item.nameRu || item.nameEn || item.name || item.sku || 'Позиция'),
    category: ['LINEN', 'TOWELS', 'AMENITIES', 'CLEANING', 'MINIBAR'].includes(category) ? category as SupplyItem['category'] : 'CLEANING',
    trolleyQty: Number(item.trolleyQty ?? 0),
    neededQty: Number(item.neededQty ?? 0),
    unit: String(item.unit || 'pcs'),
    requestedQty: Number(item.requestedQty ?? 0),
  };
}

function mapMaintenance(item: any, roomFallback?: any): MaintenanceRequest {
  const category = String(item.category || 'OTHER').toUpperCase();
  const priority = String(item.priority || 'MEDIUM').toUpperCase();
  const status = String(item.status || 'NEW').toLowerCase();
  return {
    id: String(item.id),
    roomNumber: String(item.room_number || item.roomNumber || ''),
    category: ['PLUMBING', 'ELECTRICAL', 'FURNITURE', 'APPLIANCES', 'CLEANLINESS', 'OTHER'].includes(category) ? category as MaintenanceRequest['category'] : 'OTHER',
    priority: ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'].includes(priority) ? priority as MaintenanceRequest['priority'] : 'MEDIUM',
    description: String(item.description || ''),
    descriptionEn: String(item.description || ''),
    descriptionRu: String(item.description_ru || item.descriptionRu || item.description || ''),
    blocksCleaning: Boolean(item.blocks_cleaning),
    status: ['in_progress', 'assigned'].includes(status) ? 'IN_PROGRESS' : ['completed', 'verified', 'closed', 'cancelled'].includes(status) ? 'RESOLVED' : 'CREATED',
    timestamp: item.created_at ? new Date(item.created_at).toLocaleString('ru-RU') : '',
    isGuestDamage: Boolean(item.is_guest_damage),
    guestDamageType: item.guest_damage_type ? String(item.guest_damage_type) : undefined,
    repairCost: item.repair_cost !== undefined ? Number(item.repair_cost) : undefined,
    repairComment: item.repair_comment ? String(item.repair_comment) : undefined,
    costCalculated: Boolean(item.cost_calculated),
    comments: Array.isArray(item.comments) ? item.comments.map((c: unknown) => String(c)) : undefined,
    materials: Array.isArray(item.materials) ? item.materials : undefined,
    photosBefore: Array.isArray(item.photos_before) ? item.photos_before.map((p: unknown) => String(p)) : undefined,
    photosAfter: Array.isArray(item.photos_after) ? item.photos_after.map((p: unknown) => String(p)) : undefined,
    steps: Array.isArray(item.steps) ? item.steps : undefined,
    floor: item.floor !== undefined ? Number(item.floor) : roomFallback?.floor !== undefined ? Number(roomFallback.floor) : undefined,
    roomCategory: item.room_category ? String(item.room_category) : roomFallback?.roomType?.name ? String(roomFallback.roomType.name) : undefined,
    startedAt: item.started_at ? new Date(item.started_at).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' }) : undefined,
    reportedBy: item.reported_by_name || item.created_by_name || item.author_name ? String(item.reported_by_name || item.created_by_name || item.author_name) : undefined,
    assignedToName: item.assigned_to_name || item.assignee_name || item.technician_name ? String(item.assigned_to_name || item.assignee_name || item.technician_name) : undefined,
  };
}

// Default 3-step repair workflow shown once a technician starts work on a ticket —
// mirrors the production web app's fixed "diagnose / fix / verify" sequence.
function defaultMaintenanceSteps(): MaintenanceStep[] {
  return [
    { id: 'diagnose', textRu: 'Диагностика · причина найдена', textEn: 'Diagnostics · cause found', done: false },
    { id: 'fix', textRu: 'Устранение неисправности', textEn: 'Fix the issue', done: false },
    { id: 'verify', textRu: 'Проверка после ремонта', textEn: 'Post-repair check', done: false },
  ];
}

function mapPart(item: any): PartItem {
  const category = String(item.category || 'CONSUMABLES').toUpperCase();
  return {
    id: String(item.id),
    nameEn: String(item.nameEn || item.name || item.code || 'Part'),
    nameRu: String(item.nameRu || item.nameEn || item.name || item.code || 'Запчасть'),
    code: String(item.code || item.id),
    category: ['PLUMBING', 'ELECTRICAL', 'CONSUMABLES'].includes(category) ? category as PartItem['category'] : 'CONSUMABLES',
    currentStock: Number(item.currentStock ?? 0),
    normStock: Number(item.normStock ?? 1),
    orderQty: 0,
  };
}

function mapStaff(item: any): StaffMember {
  return {
    id: String(item.id),
    fullName: String(item.fullName || item.email || 'Staff'),
    department: item.department ? String(item.department) : undefined,
    roleCode: item.roleCode ? String(item.roleCode) : undefined,
    phone: item.phone ? String(item.phone) : undefined,
    shiftStatus: item.shiftStatus ? String(item.shiftStatus) : undefined,
    isActive: Boolean(item.isActive),
  };
}

function mapPartOrder(item: any): PartOrder {
  return {
    id: String(item.id),
    titleEn: String(item.title_en || item.title || 'Order'),
    titleRu: String(item.title_ru || item.title_en || item.title || 'Заказ'),
    subEn: String(item.sub_en || ''),
    subRu: String(item.sub_ru || item.sub_en || ''),
    status: String(item.status || 'ordered'),
    createdAt: item.created_at ? new Date(item.created_at).toLocaleString('ru-RU') : '',
  };
}

const AppContext = createContext<AppState | null>(null);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLang] = useState<Language>('RU');
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false);
  const [authReady, setAuthReady] = useState<boolean>(false);
  const [role, setRole] = useState<StaffRole | null>(null);
  const [cleanerProfile, setCleanerProfile] = useState<CleanerProfile>(mockCleaners[0]);
  const initialProfile = useRef(cleanerProfile);
  const [rooms, setRooms] = useState<HotelRoom[]>(mockRooms);
  const [supplies, setSupplies] = useState<SupplyItem[]>(mockSupplyItems);
  const [parts, setParts] = useState<PartItem[]>([]);
  const [partOrders, setPartOrders] = useState<PartOrder[]>([]);
  const [staffList, setStaffList] = useState<StaffMember[]>([]);
  const [rejectedInspections, setRejectedInspections] = useState<RejectedInspection[]>([]);
  const [parkingSpots] = useState<ParkingSpot[]>(INITIAL_PARKING_SPOTS);
  const [parkingSessions, setParkingSessions] = useState<ParkingSession[]>(INITIAL_PARKING_SESSIONS);
  const [notifications, setNotifications] = useState<AppNotification[]>(mockNotifications);
  const [maintenanceRequests, setMaintenanceRequests] = useState<MaintenanceRequest[]>(mockMaintenanceRequests);
  const [shiftHistory, setShiftHistory] = useState<ShiftHistoryItem[]>(mockShiftHistory);
  const [checklistRecordIds, setChecklistRecordIds] = useState<Record<string, string>>({});
  const [offlineMode, setOfflineMode] = useState<boolean>(false);
  const [taskSoundEnabled, setTaskSoundEnabled] = useState<boolean>(false);
  // Kept in a ref (not just the taskSoundEnabled dep) so playTaskSound's identity stays
  // stable — refreshFromApi calls it, and refreshFromApi's identity feeds effects that
  // re-fetch everything, which shouldn't happen just because this preference was toggled.
  const taskSoundEnabledRef = useRef(taskSoundEnabled);
  useEffect(() => {
    taskSoundEnabledRef.current = taskSoundEnabled;
  }, [taskSoundEnabled]);
  const taskSoundPlayer = useAudioPlayer(require('../assets/sounds/task-notification.wav'));
  const playTaskSound = useCallback(() => {
    if (!taskSoundEnabledRef.current) return;
    try {
      taskSoundPlayer.seekTo(0);
      taskSoundPlayer.play();
    } catch {
      // ignore playback failures (e.g. platform/audio-session quirks)
    }
  }, [taskSoundPlayer]);
  const [chatContacts, setChatContacts] = useState<ChatContact[]>(INITIAL_CHAT_CONTACTS);
  const hasLoadedNotificationsOnce = useRef(false);
  const [lastSyncedAt, setLastSyncedAt] = useState<string | null>(null);

  const login = useCallback((profile: CleanerProfile, sessionUser?: ApiUser) => {
    // No backend concept of a housekeeper "shift clock-in" exists yet, so this session's
    // start is the closest honest proxy for "on shift since" — real time, not a mock value.
    setCleanerProfile({ ...profile, currentShift: { ...profile.currentShift, startTime: timeNow() } });
    setIsLoggedIn(true);
    if (sessionUser) {
      setCleanerProfile((current) => ({
        ...current,
        id: sessionUser.id || current.id,
        email: sessionUser.email || current.email,
        fullName: sessionUser.fullName || current.fullName,
        fullNameRu: sessionUser.fullName || current.fullNameRu,
        floorAssigned: sessionUser.department || current.floorAssigned,
      }));
    }
  }, []);

  const logout = useCallback(() => {
    clearSession();
    setIsLoggedIn(false);
    setRole(null);
    setCleanerProfile(mockCleaners[0]);
  }, []);

  const refreshFromApi = useCallback(async (roleArg?: StaffRole) => {
    const activeRole = roleArg ?? role;
    const isCleaner = activeRole === 'CLEANER';
    const isTechnician = activeRole === 'TECHNICIAN';
    const isSupervisor = activeRole === 'SUPERVISOR';
    const needsHousekeeping = isCleaner || isSupervisor;
    const [
      tasksResponse, roomsResponse, supplyRecords, minibarItems, maintenanceRecords, historyRecords,
      checklistRecordsResponse, partRecords, partOrderRecords, staffRecords, dashboard, me,
    ] = await Promise.all([
      needsHousekeeping ? listHousekeeping().catch(() => []) : Promise.resolve([]),
      listRooms().catch(() => []),
      isCleaner ? listRecord('supply').catch(() => []) : Promise.resolve([]),
      isCleaner ? listMinibarItems().catch(() => []) : Promise.resolve([]),
      listRecord('maintenance').catch(() => []),
      isCleaner ? listRecord('shift_history').catch(() => []) : Promise.resolve([]),
      isCleaner ? listRecord('room_checklist').catch(() => []) : Promise.resolve([]),
      isTechnician ? listRecord('parts').catch(() => []) : Promise.resolve([]),
      isTechnician ? listRecord('parts_order').catch(() => []) : Promise.resolve([]),
      isSupervisor ? listStaff().catch(() => []) : Promise.resolve([]),
      getDashboard().catch(() => ({})),
      getMe().catch(() => null),
    ]);

    const roomsByNumber = new Map(asList<any>(roomsResponse).map((room) => [String(room.number), room]));
    const checklistRecords = asList<any>(checklistRecordsResponse);
    const checklistByTaskId = new Map(checklistRecords.map((record) => [String(record.housekeeping_id || record.housekeepingId || record.task_id || ''), record]));
    const nextChecklistIds: Record<string, string> = {};
    checklistRecords.forEach((record) => {
      const taskId = String(record.housekeeping_id || record.housekeepingId || record.task_id || '');
      if (taskId && record.id) nextChecklistIds[taskId] = String(record.id);
    });
    setChecklistRecordIds(nextChecklistIds);
    if (needsHousekeeping) {
      const apiRooms = asList<any>(tasksResponse).map((task) => mapHousekeepingTask(task, roomsByNumber.get(String(task.room?.number || task.roomNumber)), checklistByTaskId.get(String(task.id))));
      setRooms(apiRooms);
      if (isCleaner) {
        // Real shift stats derived from the actual room list, replacing the mock defaults —
        // no dedicated "current shift" endpoint exists for housekeepers, so this is computed
        // client-side from today's assigned rooms.
        const roomsCompletedReal = apiRooms.filter((r) => r.status === 'READY' || r.status === 'VERIFIED').length;
        const completedWithDuration = apiRooms.filter((r) => (r.status === 'READY' || r.status === 'VERIFIED') && r.startTime && r.endTime);
        const avgMinutesReal = completedWithDuration.length > 0
          ? Math.round(
              completedWithDuration.reduce((acc, r) => acc + minutesBetweenClock(r.startTime as string, r.endTime as string), 0) /
                completedWithDuration.length
            )
          : null;
        setCleanerProfile((current) => ({
          ...current,
          currentShift: {
            ...current.currentShift,
            roomsCompleted: roomsCompletedReal,
            roomsTotal: apiRooms.length,
            avgTimePerRoom: avgMinutesReal !== null ? `${avgMinutesReal} min` : '— min',
          },
        }));
      }
    }
    if (isSupervisor) {
      setStaffList(asList<any>(staffRecords).map(mapStaff));
    }
    if (isTechnician) {
      setParts(asList<any>(partRecords).map(mapPart));
      setPartOrders(asList<any>(partOrderRecords).map(mapPartOrder));
    }
    if (isCleaner) {
      setSupplies([...asList<any>(supplyRecords).map(mapSupply), ...asList<any>(minibarItems).map((item) => ({
        id: String(item.id),
        nameEn: String(item.name || 'Item'),
        nameRu: String(item.name || 'Позиция'),
        category: 'MINIBAR' as const,
        trolleyQty: 0,
        neededQty: 2,
        unit: 'pcs',
        requestedQty: 0,
      }))]);
      setShiftHistory(asList<any>(historyRecords).map((item) => ({
        id: String(item.id),
        shiftNumber: String(item.shiftNumber || '—'),
        date: String(item.date || '—'),
        hoursWorked: String(item.hoursWorked || '0'),
        roomsCleaned: Number(item.roomsCleaned ?? 0),
        qualityScore: Number(item.qualityScore ?? 0),
        notes: item.notes ? String(item.notes) : undefined,
        notesRu: item.notesRu ? String(item.notesRu) : undefined,
      })));
    }
    setMaintenanceRequests(asList<any>(maintenanceRecords).map((item) => mapMaintenance(item, roomsByNumber.get(String(item.room_number || item.roomNumber)))));
    if (dashboard && typeof dashboard === 'object') {
      const notifications = asList<any>((dashboard as any).notifications).map((item) => {
        const kind = String(item.kind || '').toLowerCase();
        const category: AppNotification['category'] = kind.includes('overdue') || kind.includes('urgent')
          ? 'URGENT'
          : kind.includes('supervisor') || kind.includes('maintenance')
            ? 'SUPERVISOR'
            : kind.includes('check') || kind.includes('room')
              ? 'NEW_ROOM'
              : 'SYSTEM';
        const message = String(item.message || [item.kind, item.room_number && `Room ${item.room_number}`, item.guest_name].filter(Boolean).join(' · ') || 'Notification');
        return {
          id: String(item.id),
          timestamp: item.created_at ? new Date(item.created_at).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' }) : '—',
          messageEn: message,
          messageRu: String(item.messageRu || message),
          subtitleEn: item.subtitle ? String(item.subtitle) : undefined,
          subtitleRu: item.subtitle ? String(item.subtitle) : undefined,
          category,
          isRead: false,
        } satisfies AppNotification;
      });
      // Play the "new task" chime only for genuinely new NEW_ROOM/URGENT items that
      // weren't already in the list, and never on the very first load after login.
      if (hasLoadedNotificationsOnce.current) {
        setNotifications((prev) => {
          const prevIds = new Set(prev.map((n) => n.id));
          const hasNewImportant = notifications.some(
            (n) => !prevIds.has(n.id) && (n.category === 'NEW_ROOM' || n.category === 'URGENT')
          );
          if (hasNewImportant) playTaskSound();
          return notifications;
        });
      } else {
        setNotifications(notifications);
      }
      hasLoadedNotificationsOnce.current = true;
    }
    if (me) {
      setCleanerProfile((current) => ({
        ...current,
        id: me.id || current.id,
        email: me.email || current.email,
        fullName: me.fullName || current.fullName,
        fullNameRu: me.fullName || current.fullNameRu,
        floorAssigned: me.department || current.floorAssigned,
        currentShift: { ...current.currentShift, status: me.isActive === false ? 'SHIFT_ENDED' : 'ON_SHIFT' },
      }));
    }
    setLastSyncedAt(timeNow());
  }, [playTaskSound, role]);

  const authenticate = useCallback(async (email: string, password: string, tenantSlug?: string) => {
    try {
      const result = await apiLogin(email, password, tenantSlug);
      const resolvedRole = classifyRole(result.user);
      if (!resolvedRole) {
        clearSession();
        throw new Error('This mobile app does not support this staff role yet.');
      }
      setRole(resolvedRole);
      login(initialProfile.current, result.user);
      await refreshFromApi(resolvedRole);
    } catch (error) {
      clearSession();
      setIsLoggedIn(false);
      setRole(null);
      throw error;
    }
  }, [login, refreshFromApi]);

  useEffect(() => {
    let active = true;
    const restore = async () => {
      const stored = await hydrateSession();
      if (!stored) {
        if (active) setAuthReady(true);
        return;
      }
      try {
        const me = await getMe();
        const resolvedRole = classifyRole({ role: me.role || stored.user.role, roleCode: me.roleCode || stored.user.roleCode });
        if (!resolvedRole) {
          // The account itself isn't supported by this app (not a network hiccup) —
          // this is the one case where staying "logged in" would be actively wrong.
          clearSession();
          if (active) setIsLoggedIn(false);
          return;
        }
        if (!active) return;
        setRole(resolvedRole);
        login(initialProfile.current, me);
        await refreshFromApi(resolvedRole);
      } catch (error) {
        // Only a real 401 (server rejected the token) means the session is actually
        // invalid. Anything else — offline, timeout, a flaky backend — should not log
        // the person out from under them; keep the cached session and let them keep
        // working until they tap "Log out" themselves.
        const isUnauthorized = error instanceof ApiRequestError && error.status === 401;
        if (isUnauthorized) {
          clearSession();
          if (active) setIsLoggedIn(false);
        } else if (active) {
          const resolvedRole = classifyRole({ role: stored.user.role, roleCode: stored.user.roleCode });
          if (resolvedRole) {
            setRole(resolvedRole);
            login(initialProfile.current, stored.user);
          } else {
            setIsLoggedIn(false);
          }
        }
      } finally {
        if (active) setAuthReady(true);
      }
    };
    void restore();
    return () => { active = false; };
  }, [login, refreshFromApi]);

  const addSystemNotification = useCallback((msgEn: string, msgRu: string, cat: AppNotification['category']) => {
    const notif: AppNotification = {
      id: `n-${Date.now()}`,
      timestamp: timeNow(),
      messageEn: msgEn,
      messageRu: msgRu,
      category: cat,
      isRead: false,
    };
    setNotifications((prev) => [notif, ...prev]);
  }, []);

  // Returns false if the update was rejected (e.g. another room already active).
  // Business rule: only one room may be IN_PROGRESS at a time — pausing releases a room
  // back to PENDING (freeing the slot for another room) rather than staying "active".
  // room.startTime is preserved across that PENDING trip, so the UI can still tell a
  // "paused" room (PENDING with a startTime) apart from one that was never started.
  const updateRoomStatus = useCallback(
    (roomId: string, status: RoomStatus) => {
      if (status === 'IN_PROGRESS') {
        const currentlyActive = rooms.find((r) => r.status === 'IN_PROGRESS');
        if (currentlyActive && currentlyActive.id !== roomId) {
          return false;
        }
      }
      const timeStr = new Date().toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
      setRooms((prev) =>
        prev.map((r) => {
          if (r.id !== roomId) return r;
          const updated = { ...r, status };
          if (status === 'IN_PROGRESS' && !r.startTime) updated.startTime = timeStr;
          if ((status === 'READY' || status === 'VERIFIED') && !r.endTime) updated.endTime = timeStr;
          return updated;
        })
      );
      if (getStoredSession()) {
        const apiStatus = status === 'IN_PROGRESS' ? 'IN_PROGRESS' : status === 'READY' || status === 'VERIFIED' ? 'DONE' : status === 'PENDING' ? 'PENDING' : null;
        if (apiStatus) {
          void updateHousekeepingStatus(roomId, {
            status: apiStatus,
            ...(apiStatus === 'PENDING' ? { assignedTo: '' } : {}),
            ...(apiStatus === 'IN_PROGRESS' ? { startedAt: new Date().toISOString(), assignedTo: cleanerProfile.fullName || cleanerProfile.email } : {}),
            ...(apiStatus === 'DONE' ? { completedAt: new Date().toISOString() } : {}),
          }).catch(() => refreshFromApi());
        }
      }
      return true;
    },
    [rooms, cleanerProfile.email, cleanerProfile.fullName, refreshFromApi]
  );

  const updateRoomChecklist = useCallback((roomId: string, checklist: RoomCheckitem[]) => {
    setRooms((prev) => prev.map((r) => (r.id === roomId ? { ...r, checklist } : r)));
    if (getStoredSession()) {
      void (async () => {
        const payload = {
          housekeeping_id: roomId,
          room_id: rooms.find((room) => room.id === roomId)?.physicalRoomId,
          room_number: rooms.find((room) => room.id === roomId)?.roomNumber,
          checklist,
          updated_at: new Date().toISOString(),
        };
        const recordId = checklistRecordIds[roomId];
        if (recordId) {
          await updateRecord('room_checklist', recordId, payload);
        } else {
          const created = await createRecord('room_checklist', payload) as { id?: string };
          if (created?.id) setChecklistRecordIds((prev) => ({ ...prev, [roomId]: String(created.id) }));
        }
      })().catch(() => undefined);
    }
  }, [checklistRecordIds, rooms]);

  const saveRoomPhoto = useCallback(async (roomId: string, uri: string, stage: string) => {
    await uploadRoomPhoto(roomId, uri, stage);
  }, []);

  // Supervisor actions — accepting/rejecting a cleaned room. `roomId` here is the
  // housekeeping task id (see mapHousekeepingTask's `id`); the room's own id is
  // `physicalRoomId`, which is what the `/rooms/{id}` endpoints key on.
  const verifyRoom = useCallback(
    (roomId: string) => {
      setRooms((prev) => prev.map((r) => (r.id === roomId ? { ...r, status: 'VERIFIED' } : r)));
      const room = rooms.find((r) => r.id === roomId);
      if (getStoredSession() && room?.physicalRoomId) {
        void updateRoomStatusField(room.physicalRoomId, { status: 'INSPECTED' }).catch(() => refreshFromApi());
      }
      addSystemNotification(
        `Room ${room?.roomNumber || ''} passed inspection`,
        `Номер ${room?.roomNumber || ''} принят после проверки`,
        'SYSTEM'
      );
    },
    [rooms, addSystemNotification, refreshFromApi]
  );

  const rejectRoomInspection = useCallback(
    (roomId: string, note: string) => {
      setRooms((prev) => prev.map((r) => (r.id === roomId ? { ...r, status: 'PENDING' } : r)));
      const room = rooms.find((r) => r.id === roomId);
      setRejectedInspections((prev) => [
        { id: `rej-${Date.now()}`, roomId, roomNumber: room?.roomNumber || '', note, timestamp: timeNow(), assignedTo: room?.assignedTo },
        ...prev,
      ]);
      if (getStoredSession()) {
        void updateHousekeepingStatus(roomId, { status: 'PENDING', assignedTo: '' }).catch(() => refreshFromApi());
        if (room?.physicalRoomId && note.trim()) {
          void updateRoomFields(room.physicalRoomId, { notes: note.trim() }).catch(() => undefined);
        }
      }
      addSystemNotification(
        `Room ${room?.roomNumber || ''} sent back for re-cleaning${note ? `: ${note}` : ''}`,
        `Номер ${room?.roomNumber || ''} возвращён на переуборку${note ? `: ${note}` : ''}`,
        'SUPERVISOR'
      );
    },
    [rooms, addSystemNotification, refreshFromApi]
  );

  const reassignRooms = useCallback(
    (fromName: string, toName: string) => {
      const toReassign = rooms.filter((r) => r.assignedTo === fromName && r.status !== 'VERIFIED');
      if (toReassign.length === 0) return 0;
      const reassignIds = new Set(toReassign.map((r) => r.id));
      setRooms((prev) => prev.map((r) => (reassignIds.has(r.id) ? { ...r, assignedTo: toName } : r)));
      if (getStoredSession()) {
        toReassign.forEach((room) => {
          void updateHousekeepingStatus(room.id, { assignedTo: toName }).catch(() => refreshFromApi());
        });
      }
      addSystemNotification(
        `${toReassign.length} room(s) reassigned from ${fromName} to ${toName}`,
        `${toReassign.length} номер(ов) переданы от ${fromName} к ${toName}`,
        'SUPERVISOR'
      );
      return toReassign.length;
    },
    [rooms, addSystemNotification, refreshFromApi]
  );

  const checkInVehicle = useCallback(
    (plate: string, guestName: string, spotId: string, note?: string) => {
      setParkingSessions((prev) => [...prev, { id: `ps-${Date.now()}`, spotId, plate, guestName, note, checkedInAt: timeNow() }]);
      addSystemNotification(
        `Vehicle ${plate} checked in`,
        `Заезд на парковку: ${plate}`,
        'SYSTEM'
      );
    },
    [addSystemNotification]
  );

  const checkOutVehicle = useCallback((sessionId: string) => {
    setParkingSessions((prev) => prev.filter((s) => s.id !== sessionId));
  }, []);

  const updateSupplyQty = useCallback((supplyId: string, diff: number) => {
    setSupplies((prev) =>
      prev.map((s) => (s.id === supplyId ? { ...s, trolleyQty: Math.max(0, s.trolleyQty + diff) } : s))
    );
  }, []);

  const requestSupplyRefill = useCallback(
    (supplyId: string, qty: number) => {
      setSupplies((prev) =>
        prev.map((s) => (s.id === supplyId ? { ...s, requestedQty: s.requestedQty + qty } : s))
      );
      const item = supplies.find((s) => s.id === supplyId);
      if (item) {
        addSystemNotification(
          `Supply refill requested: ${qty} x ${item.nameEn}`,
          `Запрошено пополнение: ${qty} шт. x ${item.nameRu}`,
          'SYSTEM'
        );
        if (getStoredSession()) {
          void updateRecord('supply', supplyId, { requestedQty: item.requestedQty + qty }).catch(() => undefined);
          void createRecord('supply_request', {
            supply_id: supplyId,
            name_en: item.nameEn,
            name_ru: item.nameRu,
            qty,
            category: item.category,
            source: 'housekeeper',
            status: 'requested',
            requested_at: new Date().toISOString(),
          }).catch(() => undefined);
        }
      }
    },
    [supplies, addSystemNotification]
  );

  const deductSupplies = useCallback((deductions: Record<string, number>) => {
    if (getStoredSession()) {
      Object.entries(deductions).forEach(([id, ded]) => {
        if (ded <= 0) return;
        const item = supplies.find((s) => s.id === id);
        // MINIBAR items live in a separate catalog (/minibar/items), not in records/supply,
        // so their trolleyQty isn't a writable field there.
        if (!item || item.category === 'MINIBAR') return;
        const next = Math.max(0, item.trolleyQty - ded);
        void updateRecord('supply', id, { trolleyQty: next }).catch(() => undefined);
      });
    }
    setSupplies((prev) =>
      prev.map((s) => {
        const ded = deductions[s.id] || 0;
        return ded > 0 ? { ...s, trolleyQty: Math.max(0, s.trolleyQty - ded) } : s;
      })
    );
  }, [supplies]);

  // Records a minibar restock for a room. Minibar items don't carry a meaningful
  // trolleyQty from the API (that endpoint is a catalog, not per-room stock), so this
  // only logs what was refilled rather than trying to decrement a real inventory count.
  const confirmMinibarRefill = useCallback(
    (roomId: string, refillMap: Record<string, number>) => {
      const entries = Object.entries(refillMap).filter(([, qty]) => qty > 0);
      if (entries.length === 0) return;
      const room = rooms.find((r) => r.id === roomId);
      const totalQty = entries.reduce((acc, [, qty]) => acc + qty, 0);
      addSystemNotification(
        `Minibar restocked in Room ${room?.roomNumber || ''}: ${totalQty} item(s)`,
        `Мини-бар пополнен в номере ${room?.roomNumber || ''}: ${totalQty} шт.`,
        'SYSTEM'
      );
      if (getStoredSession()) {
        const items = entries.map(([id, qty]) => {
          const supply = supplies.find((s) => s.id === id);
          return {
            item_id: id,
            name_en: supply?.nameEn || id,
            name_ru: supply?.nameRu || id,
            qty,
          };
        });
        void createRecord('minibar_checkout', {
          room_id: room?.physicalRoomId,
          room_number: room?.roomNumber,
          source: 'housekeeper',
          kind: 'restock',
          items,
          status: 'submitted',
          submitted_at: new Date().toISOString(),
        }).catch(() => undefined);
      }
    },
    [rooms, supplies, addSystemNotification]
  );

  const markNotificationAsRead = useCallback((id: string) => {
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, isRead: true } : n)));
  }, []);

  const markAllNotificationsAsRead = useCallback(() => {
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
  }, []);

  const addMaintenanceRequest = useCallback(
    (req: Omit<MaintenanceRequest, 'id' | 'timestamp' | 'status'>) => {
      const timestamp = new Date().toLocaleString('ru-RU', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
      const newReq: MaintenanceRequest = {
        ...req,
        id: `m-${Date.now()}`,
        status: 'CREATED',
        timestamp,
        descriptionEn: req.descriptionEn || req.description,
        descriptionRu: req.descriptionRu || req.description,
      };
      setMaintenanceRequests((prev) => [newReq, ...prev]);

      if (req.blocksCleaning) {
        const room = rooms.find((r) => r.roomNumber === req.roomNumber);
        if (room) updateRoomStatus(room.id, 'PROBLEM');
      }

      addSystemNotification(
        `Issue reported in Room ${req.roomNumber}: ${req.description}`,
        `Неполадка в номере ${req.roomNumber}: ${req.description}`,
        'URGENT'
      );
      if (getStoredSession()) {
        void createRecord('maintenance', {
          room_id: rooms.find((room) => room.roomNumber === req.roomNumber)?.physicalRoomId,
          room_number: req.roomNumber,
          category: req.category.toLowerCase(),
          source: 'housekeeper',
          kind: 'repair',
          description: req.descriptionEn || req.description,
          description_ru: req.descriptionRu || req.description,
          status: 'new',
          priority: req.priority.toLowerCase(),
          blocks_cleaning: req.blocksCleaning,
          is_guest_damage: Boolean(req.isGuestDamage),
          guest_damage_type: req.guestDamageType,
          photos: req.photoUrl ? [req.photoUrl] : [],
        }).catch(() => undefined);
      }
    },
    [rooms, updateRoomStatus, addSystemNotification]
  );

  // Technician actions — maintenance tickets are the same `records/maintenance` entries
  // housekeepers create above; these just move them through the technician's workflow.
  const updateMaintenanceStatus = useCallback((id: string, status: MaintenanceStatus) => {
    const startTime = new Date().toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
    setMaintenanceRequests((prev) =>
      prev.map((r) => {
        if (r.id !== id) return r;
        // Seed the fixed 3-step repair workflow the first time a ticket is started —
        // mirrors the production app, which always shows this sequence once work begins.
        const steps = status === 'IN_PROGRESS' && !r.steps ? defaultMaintenanceSteps() : r.steps;
        return { ...r, status, steps, startedAt: status === 'IN_PROGRESS' && !r.startedAt ? startTime : r.startedAt };
      })
    );
    if (getStoredSession()) {
      const apiStatus = status === 'IN_PROGRESS' ? 'in_progress' : status === 'RESOLVED' ? 'completed' : 'new';
      const current = maintenanceRequests.find((r) => r.id === id);
      const seededSteps = status === 'IN_PROGRESS' && !current?.steps ? defaultMaintenanceSteps() : undefined;
      void updateRecord('maintenance', id, {
        status: apiStatus,
        ...(apiStatus === 'in_progress' ? { started_at: new Date().toISOString() } : {}),
        ...(apiStatus === 'completed' ? { finished_at: new Date().toISOString() } : {}),
        ...(seededSteps ? { steps: seededSteps } : {}),
      }).catch(() => undefined);
    }
  }, [maintenanceRequests]);

  const toggleMaintenanceStep = useCallback((ticketId: string, stepId: string) => {
    setMaintenanceRequests((prev) =>
      prev.map((r) => {
        if (r.id !== ticketId || !r.steps) return r;
        const steps = r.steps.map((s) => (s.id === stepId ? { ...s, done: !s.done } : s));
        if (getStoredSession()) void updateRecord('maintenance', ticketId, { steps }).catch(() => undefined);
        return { ...r, steps };
      })
    );
  }, []);

  const saveRepairCost = useCallback((id: string, cost: number, comment: string) => {
    setMaintenanceRequests((prev) =>
      prev.map((r) => (r.id === id ? { ...r, repairCost: cost, repairComment: comment, costCalculated: true } : r))
    );
    if (getStoredSession()) {
      void updateRecord('maintenance', id, {
        repair_cost: cost,
        repair_comment: comment,
        cost_calculated: true,
      }).catch(() => undefined);
    }
  }, []);

  const addMaintenanceComment = useCallback((id: string, text: string) => {
    if (!text.trim()) return;
    setMaintenanceRequests((prev) =>
      prev.map((r) => {
        if (r.id !== id) return r;
        const comments = [...(r.comments || []), text.trim()];
        if (getStoredSession()) void updateRecord('maintenance', id, { comments }).catch(() => undefined);
        return { ...r, comments };
      })
    );
  }, []);

  const addUsedPart = useCallback((ticketId: string, part: PartItem, qty: number) => {
    if (qty <= 0) return;
    setMaintenanceRequests((prev) =>
      prev.map((r) => {
        if (r.id !== ticketId) return r;
        const existing = r.materials || [];
        const idx = existing.findIndex((m) => m.id === part.id);
        const materials =
          idx >= 0
            ? existing.map((m, i) => (i === idx ? { ...m, qty: m.qty + qty } : m))
            : [...existing, { id: part.id, nameEn: part.nameEn, nameRu: part.nameRu, qty }];
        if (getStoredSession()) void updateRecord('maintenance', ticketId, { materials }).catch(() => undefined);
        return { ...r, materials };
      })
    );
    setParts((prev) => prev.map((p) => (p.id === part.id ? { ...p, currentStock: Math.max(0, p.currentStock - qty) } : p)));
    if (getStoredSession()) {
      void updateRecord('parts', part.id, { currentStock: Math.max(0, part.currentStock - qty) }).catch(() => undefined);
    }
  }, []);

  const uploadMaintenancePhoto = useCallback(
    async (ticketId: string, uri: string, stage: 'before' | 'after') => {
      const ticket = maintenanceRequests.find((r) => r.id === ticketId);
      const room = rooms.find((r) => r.roomNumber === ticket?.roomNumber);
      if (room?.physicalRoomId) {
        await uploadRoomPhoto(room.physicalRoomId, uri, `maintenance_${stage}`).catch(() => undefined);
      }
      setMaintenanceRequests((prev) =>
        prev.map((r) => {
          if (r.id !== ticketId) return r;
          const key = stage === 'before' ? 'photosBefore' : 'photosAfter';
          const photos = [...(r[key] || []), uri];
          if (getStoredSession()) {
            void updateRecord('maintenance', ticketId, { [`photos_${stage}`]: photos }).catch(() => undefined);
          }
          return { ...r, [key]: photos };
        })
      );
    },
    [maintenanceRequests, rooms]
  );

  const orderParts = useCallback(
    (items: PartItem[]) => {
      const toOrder = items.filter((p) => p.orderQty > 0);
      if (toOrder.length === 0) return;
      const totalQty = toOrder.reduce((acc, p) => acc + p.orderQty, 0);
      const order: PartOrder = {
        id: `po-${Date.now()}`,
        titleEn: `Spare parts order · ${totalQty} pcs`,
        titleRu: `Заказ запчастей · ${totalQty} шт`,
        subEn: 'Ordered today · shift delivery',
        subRu: 'Заказан сегодня · доставка со сменой',
        status: 'in_transit',
        createdAt: new Date().toLocaleString('ru-RU'),
      };
      setPartOrders((prev) => [order, ...prev]);
      setParts((prev) => prev.map((p) => (toOrder.some((o) => o.id === p.id) ? { ...p, orderQty: 0 } : p)));
      if (getStoredSession()) {
        void createRecord('parts_order', {
          title_ru: order.titleRu,
          title_en: order.titleEn,
          sub_ru: order.subRu,
          sub_en: order.subEn,
          status: order.status,
          items: toOrder.map((p) => ({ id: p.id, nameEn: p.nameEn, nameRu: p.nameRu, qty: p.orderQty })),
        }).catch(() => undefined);
      }
      addSystemNotification(
        `Spare parts order sent: ${totalQty} item(s)`,
        `Заказ запчастей отправлен: ${totalQty} шт.`,
        'SYSTEM'
      );
    },
    [addSystemNotification]
  );

  // Sends the front-desk minibar/consumables report for a room (e.g. at guest checkout),
  // mirroring it as a records/minibar_checkout entry, plus a guest-damage maintenance
  // ticket when damage was noted.
  const submitMinibarCheckout = useCallback(
    (
      roomId: string,
      items: { id: string; nameEn: string; nameRu: string; qty: number }[],
      hasDamage: boolean,
      damageDescription: string
    ) => {
      const room = rooms.find((r) => r.id === roomId);
      const chargedItems = items.filter((i) => i.qty > 0);
      if (getStoredSession()) {
        // Real money charge against the guest's folio, tried first — falls back to the
        // records audit log below on failure (e.g. undocumented payload shape rejected,
        // no active booking on the room) so the report still reaches the front desk.
        if (chargedItems.length > 0) {
          void chargeMinibar({
            roomId: room?.physicalRoomId,
            roomNumber: room?.roomNumber,
            items: chargedItems.map((i) => ({ itemId: i.id, nameEn: i.nameEn, nameRu: i.nameRu, qty: i.qty })),
          }).catch(() => undefined);
        }
        void createRecord('minibar_checkout', {
          room_id: room?.physicalRoomId,
          room_number: room?.roomNumber,
          source: 'housekeeper',
          items: chargedItems.map((i) => ({ item_id: i.id, name_en: i.nameEn, name_ru: i.nameRu, qty: i.qty })),
          has_damage: hasDamage,
          damage_description: damageDescription || '',
          status: 'submitted',
          submitted_at: new Date().toISOString(),
        }).catch(() => undefined);
      }
      if (hasDamage && damageDescription.trim()) {
        addMaintenanceRequest({
          roomNumber: room?.roomNumber || '',
          category: 'OTHER',
          priority: 'MEDIUM',
          description: damageDescription.trim(),
          descriptionEn: damageDescription.trim(),
          descriptionRu: damageDescription.trim(),
          blocksCleaning: false,
          isGuestDamage: true,
        });
      }
      addSystemNotification(
        `Front desk report sent for Room ${room?.roomNumber || ''}`,
        `Отчёт отправлен на ресепшн по номеру ${room?.roomNumber || ''}`,
        'SYSTEM'
      );
    },
    [rooms, addMaintenanceRequest, addSystemNotification]
  );

  const toggleOffline = useCallback(() => setOfflineMode((prev) => !prev), []);
  const toggleTaskSound = useCallback(() => {
    setTaskSoundEnabled((prev) => {
      const next = !prev;
      // Play immediately on enable, as a preview — the syncing effect for the ref hasn't
      // committed yet at this point, so set it directly here too.
      if (next) {
        taskSoundEnabledRef.current = true;
        playTaskSound();
      }
      return next;
    });
  }, [playTaskSound]);

  const sendContactMessage = useCallback(
    (contactId: string, text: string) => {
      if (!text.trim()) return;
      const time = timeNow();
      setChatContacts((prev) =>
        prev.map((c) => (c.id === contactId ? { ...c, messages: [...c.messages, { sender: 'CLEANER', text: text.trim(), time }] } : c))
      );

      setTimeout(() => {
        const repTime = timeNow();
        setChatContacts((prev) =>
          prev.map((c) => {
            if (c.id !== contactId) return c;
            const replies = lang === 'RU' ? c.quickRepliesRu : c.quickRepliesEn;
            const reply = replies[Math.floor(Math.random() * replies.length)] || 'Ok';
            return { ...c, messages: [...c.messages, { sender: 'OTHER', text: reply, time: repTime }] };
          })
        );
      }, 1500);
    },
    [lang]
  );

  const markContactRead = useCallback((contactId: string) => {
    setChatContacts((prev) => prev.map((c) => (c.id === contactId ? { ...c, unreadCount: 0 } : c)));
  }, []);

  const activeRoom = useMemo(() => rooms.find((r) => r.status === 'IN_PROGRESS') || null, [rooms]);

  const value: AppState = {
    lang,
    setLang,
    isLoggedIn,
    authReady,
    role,
    login,
    authenticate,
    logout,
    cleanerProfile,
    updateCleanerProfile: setCleanerProfile,
    rooms,
    updateRoomStatus,
    updateRoomChecklist,
    uploadRoomPhoto: saveRoomPhoto,
    activeRoom,
    verifyRoom,
    rejectRoomInspection,
    reassignRooms,
    staffList,
    rejectedInspections,
    parkingSpots,
    parkingSessions,
    checkInVehicle,
    checkOutVehicle,
    supplies,
    updateSupplyQty,
    requestSupplyRefill,
    deductSupplies,
    confirmMinibarRefill,
    submitMinibarCheckout,
    notifications,
    addSystemNotification,
    markNotificationAsRead,
    markAllNotificationsAsRead,
    maintenanceRequests,
    addMaintenanceRequest,
    updateMaintenanceStatus,
    toggleMaintenanceStep,
    saveRepairCost,
    addMaintenanceComment,
    addUsedPart,
    uploadMaintenancePhoto,
    parts,
    partOrders,
    orderParts,
    offlineMode,
    toggleOffline,
    taskSoundEnabled,
    toggleTaskSound,
    refreshData: refreshFromApi,
    lastSyncedAt,
    chatContacts,
    shiftHistory,
    sendContactMessage,
    markContactRead,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within an AppProvider');
  return ctx;
}
