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
  CleanerProfile,
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
  ApiUser,
  clearSession,
  createRecord,
  getDashboard,
  getMe,
  getStoredSession,
  listHousekeeping,
  listMinibarItems,
  listRecord,
  listRooms,
  login as apiLogin,
  updateHousekeepingStatus,
  updateRecord,
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

interface AppState {
  lang: Language;
  setLang: (lang: Language) => void;

  isLoggedIn: boolean;
  authReady: boolean;
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

function mapMaintenance(item: any): MaintenanceRequest {
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
  };
}

const AppContext = createContext<AppState | null>(null);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLang] = useState<Language>('RU');
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false);
  const [authReady, setAuthReady] = useState<boolean>(false);
  const [cleanerProfile, setCleanerProfile] = useState<CleanerProfile>(mockCleaners[0]);
  const initialProfile = useRef(cleanerProfile);
  const [rooms, setRooms] = useState<HotelRoom[]>(mockRooms);
  const [supplies, setSupplies] = useState<SupplyItem[]>(mockSupplyItems);
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
    setCleanerProfile(mockCleaners[0]);
  }, []);

  const refreshFromApi = useCallback(async () => {
    const [tasksResponse, roomsResponse, supplyRecords, minibarItems, maintenanceRecords, historyRecords, checklistRecordsResponse, dashboard, me] = await Promise.all([
      listHousekeeping(),
      listRooms().catch(() => []),
      listRecord('supply').catch(() => []),
      listMinibarItems().catch(() => []),
      listRecord('maintenance').catch(() => []),
      listRecord('shift_history').catch(() => []),
      listRecord('room_checklist').catch(() => []),
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
    const apiRooms = asList<any>(tasksResponse).map((task) => mapHousekeepingTask(task, roomsByNumber.get(String(task.room?.number || task.roomNumber)), checklistByTaskId.get(String(task.id))));
    setRooms(apiRooms);
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
    setMaintenanceRequests(asList<any>(maintenanceRecords).map(mapMaintenance));
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
  }, [playTaskSound]);

  const authenticate = useCallback(async (email: string, password: string, tenantSlug?: string) => {
    try {
      const result = await apiLogin(email, password, tenantSlug);
      const role = `${result.user.role || ''} ${result.user.roleCode || ''}`.toLowerCase();
      const isCleaner = role.includes('cleaner') || role.includes('housekeeper') || role.includes('housekeeping');
      if (!isCleaner) {
        clearSession();
        throw new Error('This mobile app is currently available for cleaners only.');
      }
      login(initialProfile.current, result.user);
      await refreshFromApi();
    } catch (error) {
      clearSession();
      setIsLoggedIn(false);
      throw error;
    }
  }, [login, refreshFromApi]);

  useEffect(() => {
    let active = true;
    const restore = async () => {
      const stored = getStoredSession();
      if (!stored) {
        if (active) setAuthReady(true);
        return;
      }
      try {
        const me = await getMe();
        const role = `${me.role || stored.user.role || ''} ${me.roleCode || stored.user.roleCode || ''}`.toLowerCase();
        if (!role.includes('cleaner') && !role.includes('housekeeper') && !role.includes('housekeeping')) throw new Error('Cleaner role required');
        if (!active) return;
        login(initialProfile.current, me);
        await refreshFromApi();
      } catch {
        clearSession();
        if (active) setIsLoggedIn(false);
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
