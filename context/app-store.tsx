import React, { createContext, useContext, useState, useCallback, useEffect, useMemo, useRef } from 'react';
import { Alert, AppState as RNAppState } from 'react-native';
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
  StaffAppAccess,
  RejectedInspection,
  ParkingSpot,
  ParkingSession,
} from '@/types';
import {
  mockCleaners,
} from '@/data/mockData';
import {
  ApiRequestError,
  ApiUser,
  ApiSession,
  qrLogin as apiQrLogin,
  startSession,
  chargeMinibar,
  clearSession,
  createRecord,
  getDashboard,
  getMe,
  getStoredSession,
  hydrateSession,
  checkInParking,
  checkOutParking,
  createStaff,
  deleteStaff,
  getRestaurantHall,
  getRestaurantToday,
  listHousekeeping,
  listMinibarItems,
  listParkingSpots,
  listParkingTickets,
  listRecord,
  listRooms,
  listStaff,
  login as apiLogin,
  saveMealAttendance,
  updateHousekeepingStatus,
  updateRecord,
  updateRoomFields,
  updateRoomStatusField,
  updateStaff,
  uploadRoomPhoto,
  getMyAttendance,
  setAttendancePresence,
  scanAttendanceQr,
  listOnShift,
  updateMe,
  changeMyPassword,
  listBookings,
  ShiftStatusValue,
} from '@/lib/api-client';

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

function isoToClock(iso: unknown): string | null {
  if (typeof iso !== 'string' || !iso) return null;
  const m = /^(\d{1,2}):(\d{2})/.exec(iso);
  if (m) return `${m[1].padStart(2, '0')}:${m[2]}`;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

function localDateIso(d = new Date()) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

// GET /staff/attendance/mine — undocumented response; read defensively. Either the open
// shift itself ({ id, opened_at, shiftStatus }) or a wrapper ({ shift, shiftStatus }).
function mapMyAttendance(raw: any): { status: ShiftStatusValue | null; openedAt: string | null; open: boolean } {
  if (!raw || typeof raw !== 'object') return { status: null, openedAt: null, open: false };
  // GET /staff/attendance/mine → { openShift: {…} | null, shiftStatus } (checked on stage).
  const nested = raw.openShift ?? raw.shift;
  const shift = nested && typeof nested === 'object' ? nested : raw.id ? raw : null;
  const s = String(raw.shiftStatus ?? raw.status ?? shift?.shiftStatus ?? '').toUpperCase();
  const status = s === 'ON_SHIFT' || s === 'ON_BREAK' || s === 'SHIFT_ENDED' ? (s as ShiftStatusValue) : null;
  const openedAt = isoToClock(shift?.opened_at ?? shift?.openedAt ?? shift?.start_time ?? shift?.startTime ?? shift?.created_at ?? shift?.createdAt);
  return { status, openedAt, open: Boolean(shift) && status !== 'SHIFT_ENDED' };
}

function bookingRoomKeys(b: any): string[] {
  const keys: string[] = [];
  const roomId = b?.roomId ?? b?.room?.id;
  const number = b?.room?.number ?? b?.roomNumber;
  if (roomId) keys.push(`id:${roomId}`);
  if (number) keys.push(`no:${number}`);
  return keys;
}

// Attach today's departures/arrivals from GET /bookings to housekeeping rooms, matched by
// physical room id (or room number as a fallback). Cancelled/no-show bookings are ignored.
function applyBookingsToRooms(rooms: HotelRoom[], bookings: any[], today: string): HotelRoom[] {
  const departures = new Map<string, any>();
  const arrivals = new Map<string, any>();
  for (const b of bookings) {
    const status = String(b?.status ?? '').toUpperCase();
    if (status === 'CANCELLED' || status === 'NO_SHOW') continue;
    const checkIn = String(b?.checkInDate ?? '').slice(0, 10);
    const checkOut = String(b?.checkOutDate ?? '').slice(0, 10);
    for (const key of bookingRoomKeys(b)) {
      if (checkOut === today) departures.set(key, b);
      if (checkIn === today) arrivals.set(key, b);
    }
  }
  const guestName = (b: any) => String(b?.guest?.fullName ?? b?.guest?.name ?? [b?.guest?.lastName, b?.guest?.firstName].filter(Boolean).join(' ') ?? '').trim();
  return rooms.map((room) => {
    const keys = [room.physicalRoomId ? `id:${room.physicalRoomId}` : '', `no:${room.roomNumber}`].filter(Boolean);
    const dep = keys.map((k) => departures.get(k)).find(Boolean);
    const arr = keys.map((k) => arrivals.get(k)).find(Boolean);
    if (!dep && !arr) return { ...room, departureGuest: undefined, arrivalGuest: undefined, arrivalRequests: undefined };
    return {
      ...room,
      departureGuest: dep ? guestName(dep) || '—' : undefined,
      arrivalGuest: arr ? guestName(arr) || '—' : undefined,
      arrivalRequests: arr?.specialRequests ? String(arr.specialRequests) : undefined,
      adults: arr ? Number(arr.adults ?? room.adults) : room.adults,
      children: arr ? Number(arr.children ?? room.children) : room.children,
    };
  });
}

// Housekeeping API error codes → text a cleaner understands; unknown codes pass through.
function housekeepingErrorText(error: unknown, lang: Language): string {
  const message = error instanceof Error ? error.message : String(error ?? '');
  const ru = lang === 'RU';
  switch (message.trim()) {
    case 'CLEANING_END_BEFORE_START':
      return ru ? 'Сервер считает, что уборка закончилась раньше, чем началась.' : 'The server thinks cleaning ended before it started.';
    default:
      return message;
  }
}

function timeNow() {
  return new Date().toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
}

export type StaffRole = 'CLEANER' | 'TECHNICIAN' | 'SUPERVISOR' | 'WAITER' | 'PARKING' | 'RECEPTION';

// Classifies an API user into one of the roles this app supports, from the free-text
// role/roleCode the backend returns. Returns null when neither matches, so callers can
// reject unsupported roles without guessing. Checked via roleCode primarily — the
// backend's demo supervisor account carries role:"RECEPTION" but roleCode:"supervisor".
// Message for accounts whose role has no screens in this app (e.g. a hotel admin).
export const UNSUPPORTED_ROLE = 'This mobile app does not support this staff role yet.';

function classifyRole(user: Pick<ApiUser, 'role' | 'roleCode'>): StaffRole | null {
  const role = `${user.role || ''} ${user.roleCode || ''}`.toLowerCase();
  if (role.includes('technician')) return 'TECHNICIAN';
  if (role.includes('supervisor')) return 'SUPERVISOR';
  if (role.includes('waiter') || role.includes('host') || role.includes('maitre')) return 'WAITER';
  if (role.includes('parking') || role.includes('valet')) return 'PARKING';
  if (role.includes('cleaner') || role.includes('housekeeper') || role.includes('housekeeping')) return 'CLEANER';
  // The hotel admin is the front-desk administrator; a bare RECEPTION role is not enough
  // (porters and parking share it), only the admin or an explicit receptionist code.
  if (/hotel_admin|admin|owner|receptionist|reception\b/.test(`${user.role || ''}`.toLowerCase()) && !user.roleCode) return 'RECEPTION';
  if (/admin|receptionist|^reception$/.test(`${user.roleCode || ''}`.toLowerCase())) return 'RECEPTION';
  return null;
}

interface AppState {
  lang: Language;
  setLang: (lang: Language) => void;

  isLoggedIn: boolean;
  authReady: boolean;
  role: StaffRole | null;
  login: (profile: CleanerProfile, sessionUser?: ApiUser) => void;
  authenticate: (email: string, password: string, tenantSlug?: string) => Promise<void>;
  // Personal login QR: checks the code and returns the account (and its role in this app)
  // without signing in; completeQrLogin signs in once the employee confirms it's them.
  previewQrLogin: (token: string) => Promise<{ session: ApiSession; role: StaffRole }>;
  completeQrLogin: (session: ApiSession) => Promise<void>;
  logout: () => void;

  cleanerProfile: CleanerProfile;
  updateCleanerProfile: (profile: CleanerProfile) => void;
  // Saves name/email/phone to PATCH /staff/me (the rest of CleanerProfile is local).
  saveMyProfile: (values: { fullName: string; email: string; phone: string }) => Promise<void>;
  changePassword: (currentPassword: string, newPassword: string) => Promise<void>;
  // Break / resume / finish. Uses the attendance shift (opened by the desk QR) when there
  // is one, otherwise the staff.shiftStatus flag. Throws on failure (state is reverted).
  setShiftStatus: (status: ShiftStatusValue) => Promise<void>;
  // True while an attendance shift opened at the front desk is still open — finishing it
  // needs the desk QR, so "Завершить" only signs out of the app in that case.
  hasOpenDeskShift: boolean;
  // Opens or closes the attendance shift with the front-desk QR payload (see
  // components/shift-qr-scanner.tsx). Resolves to the new state; throws with the API message.
  scanShiftQr: (token: string, action: 'open' | 'close') => Promise<'opened' | 'closed'>;

  rooms: HotelRoom[];
  // Every room number in the hotel (GET /rooms), for pickers — `rooms` holds only the
  // housekeeping tasks, which technicians don't load at all.
  hotelRoomNumbers: string[];
  updateRoomStatus: (roomId: string, status: RoomStatus) => boolean;
  updateRoomChecklist: (roomId: string, checklist: RoomCheckitem[]) => void;
  uploadRoomPhoto: (roomId: string, uri: string, stage: string) => Promise<void>;
  activeRoom: HotelRoom | null;
  verifyRoom: (roomId: string) => void;
  rejectRoomInspection: (roomId: string, note: string) => void;
  reassignRooms: (fromName: string, toName: string) => number;

  staffList: StaffMember[];
  rejectedInspections: RejectedInspection[];
  inviteStaffMember: (payload: {
    email: string;
    fullName: string;
    position: string;
    phone?: string;
    zone?: string;
  }) => Promise<void>;
  updateStaffMember: (
    id: string,
    payload: Partial<{
      fullName: string;
      position: string;
      zone: string;
      phone: string;
      badgeNumber: string;
      appAccess: StaffAppAccess;
      schedule: string;
      normMinutes: number;
      status: 'active' | 'on_leave' | 'dismissed';
    }>
  ) => Promise<void>;
  dismissStaffMember: (id: string) => Promise<void>;

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

  shiftHistory: ShiftHistoryItem[];
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
    // PENDING on the server means not started (fresh, or sent back for re-cleaning), so no
    // start time even if an old startedAt lingers; PAUSED without startedAt still counts as
    // started ('—'), so the room shows "Возобновить" rather than "Начать уборку".
    startTime: String(task.status || '').toUpperCase() === 'PENDING'
      ? undefined
      : task.startedAt
        ? new Date(task.startedAt).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })
        : String(task.status || '').toUpperCase() === 'PAUSED' ? '—' : undefined,
    endTime: task.completedAt ? new Date(task.completedAt).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' }) : undefined,
    startedAtMs: task.startedAt && !Number.isNaN(Date.parse(task.startedAt)) ? Date.parse(task.startedAt) : undefined,
    // Server PAUSED → local paused room; the exact pause start is refined from local state.
    pausedAtMs: String(task.status || '').toUpperCase() === 'PAUSED' ? Date.now() : undefined,
    assignedTo: task.assignedTo ? String(task.assignedTo) : undefined,
    // Server copies saved by saveRoomPhoto, so other devices (the supervisor) see them too.
    photoBeforeUrl: checklistRecord?.photo_before_url ? String(checklistRecord.photo_before_url) : undefined,
    photoAfterUrl: checklistRecord?.photo_after_url ? String(checklistRecord.photo_after_url) : undefined,
    zonePhotos: checklistRecord?.zone_photos && typeof checklistRecord.zone_photos === 'object' ? checklistRecord.zone_photos : undefined,
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

function repairMinutesOf(startIso: unknown, endIso: unknown): number | undefined {
  if (typeof startIso !== 'string' || typeof endIso !== 'string') return undefined;
  const ms = new Date(endIso).getTime() - new Date(startIso).getTime();
  return Number.isFinite(ms) && ms >= 0 ? Math.round(ms / 60000) : undefined;
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
    photoUrl: Array.isArray(item.photos) && item.photos[0] ? String(item.photos[0]) : undefined,
    photosBefore: Array.isArray(item.photos_before) ? item.photos_before.map((p: unknown) => String(p)) : undefined,
    photosAfter: Array.isArray(item.photos_after) ? item.photos_after.map((p: unknown) => String(p)) : undefined,
    steps: Array.isArray(item.steps) ? item.steps : undefined,
    floor: item.floor !== undefined ? Number(item.floor) : roomFallback?.floor !== undefined ? Number(roomFallback.floor) : undefined,
    roomCategory: item.room_category ? String(item.room_category) : roomFallback?.roomType?.name ? String(roomFallback.roomType.name) : undefined,
    startedAt: item.started_at ? new Date(item.started_at).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' }) : undefined,
    repairMinutes: repairMinutesOf(item.started_at, item.finished_at ?? item.completed_at),
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

function mapStaffAppAccess(item: any): StaffAppAccess | undefined {
  if (!item || typeof item !== 'object') return undefined;
  return {
    ownRooms: Boolean(item.ownRooms),
    allRooms: Boolean(item.allRooms),
    inspection: Boolean(item.inspection),
    maintenanceRequests: Boolean(item.maintenanceRequests),
    staffManagement: Boolean(item.staffManagement),
    appSettings: Boolean(item.appSettings),
  };
}

function mapStaff(item: any): StaffMember {
  return {
    id: String(item.id),
    fullName: String(item.fullName || item.email || 'Staff'),
    email: item.email ? String(item.email) : undefined,
    department: item.department ? String(item.department) : undefined,
    roleCode: item.roleCode ? String(item.roleCode) : undefined,
    position: item.position ? String(item.position) : undefined,
    role: item.role ? String(item.role) : undefined,
    phone: item.phone ? String(item.phone) : undefined,
    shiftStatus: item.shiftStatus ? String(item.shiftStatus) : undefined,
    isActive: Boolean(item.isActive),
    zone: item.zone ? String(item.zone) : undefined,
    badgeNumber: item.badgeNumber ? String(item.badgeNumber) : undefined,
    schedule: item.schedule ? String(item.schedule) : undefined,
    normMinutes: item.normMinutes !== undefined ? Number(item.normMinutes) : undefined,
    status: item.status ? (String(item.status) as StaffMember['status']) : undefined,
    appAccess: mapStaffAppAccess(item.appAccess),
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

function mapParkingSpot(item: any): ParkingSpot {
  return {
    id: String(item.id),
    code: String(item.code || '—'),
    zone: String(item.zone || ''),
  };
}

// GET /parking/tickets?status=OPEN returns only open tickets — "checked in" is simply
// "exists in this list", there's no separate boolean.
function mapParkingSession(item: any): ParkingSession {
  return {
    id: String(item.id),
    spotId: item.spotId ? String(item.spotId) : '',
    plate: String(item.plateNumber || '—'),
    guestName: String(item.guestName || ''),
    note: item.notes ? String(item.notes) : undefined,
    checkedInAt: item.parkedAt ? new Date(item.parkedAt).toLocaleString('ru-RU') : timeNow(),
    checkedInAtIso: item.parkedAt ? String(item.parkedAt) : new Date().toISOString(),
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
  const [rooms, setRooms] = useState<HotelRoom[]>([]);
  const [supplies, setSupplies] = useState<SupplyItem[]>([]);
  const [parts, setParts] = useState<PartItem[]>([]);
  const [partOrders, setPartOrders] = useState<PartOrder[]>([]);
  const [staffList, setStaffList] = useState<StaffMember[]>([]);
  const [rejectedInspections, setRejectedInspections] = useState<RejectedInspection[]>([]);
  const [parkingSpots, setParkingSpots] = useState<ParkingSpot[]>([]);
  const [parkingSessions, setParkingSessions] = useState<ParkingSession[]>([]);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [maintenanceRequests, setMaintenanceRequests] = useState<MaintenanceRequest[]>([]);
  const [shiftHistory, setShiftHistory] = useState<ShiftHistoryItem[]>([]);
  const [hotelRoomNumbers, setHotelRoomNumbers] = useState<string[]>([]);
  // Room number → room id (GET /rooms), for photo uploads on maintenance tickets.
  const roomIdByNumber = useRef(new Map<string, string>());
  // room_checklist record per housekeeping task. A pending create is stored as its promise,
  // so a second quick write waits for it instead of creating a duplicate record.
  const roomRecordIds = useRef<Record<string, string | Promise<string | undefined>>>({});
  // Server URLs of a room's photos (POST /rooms/:id/photos), saved on that record. The
  // local file stays on the room for the preview on this phone.
  const roomPhotoUrls = useRef<Record<string, { before?: string; after?: string; zones?: Record<string, string> }>>({});
  const roomsRef = useRef(rooms);
  useEffect(() => {
    roomsRef.current = rooms;
  }, [rooms]);
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
  const hasLoadedNotificationsOnce = useRef(false);
  const [lastSyncedAt, setLastSyncedAt] = useState<string | null>(null);
  const [hasOpenDeskShift, setHasOpenDeskShift] = useState(false);
  const hasOpenDeskShiftRef = useRef(false);
  // scanShiftQr is declared before refreshFromApi, so it reaches it through this ref.
  const refreshFromApiRef = useRef<(() => Promise<void>) | null>(null);
  hasOpenDeskShiftRef.current = hasOpenDeskShift;

  // Every role's data lives in this one store; each sign-in loads only its own role's part.
  // Clearing it on sign-in and sign-out keeps one account from seeing (and acting on) what
  // the previous account loaded — e.g. a front desk pausing a cleaner's room on break.
  const clearRoleData = useCallback(() => {
    setRooms([]);
    setSupplies([]);
    setParts([]);
    setPartOrders([]);
    setStaffList([]);
    setRejectedInspections([]);
    setParkingSpots([]);
    setParkingSessions([]);
    setNotifications([]);
    setMaintenanceRequests([]);
    setShiftHistory([]);
    setHotelRoomNumbers([]);
    setHasOpenDeskShift(false);
    setLastSyncedAt(null);
    roomIdByNumber.current = new Map();
    roomRecordIds.current = {};
    roomPhotoUrls.current = {};
    hasLoadedNotificationsOnce.current = false;
  }, []);

  const login = useCallback((profile: CleanerProfile, sessionUser?: ApiUser) => {
    clearRoleData();
    // No backend concept of a housekeeper "shift clock-in" exists yet, so this session's
    // start is the closest honest proxy for "on shift since" — real time, not a mock value.
    // Counters start empty (not the demo profile's numbers) until the first sync fills them.
    setCleanerProfile({
      ...profile,
      currentShift: { ...profile.currentShift, startTime: timeNow(), roomsCompleted: 0, roomsTotal: 0, avgTimePerRoom: '— min' },
    });
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
  }, [clearRoleData]);

  const logout = useCallback(() => {
    clearSession();
    setIsLoggedIn(false);
    setRole(null);
    setCleanerProfile(mockCleaners[0]);
    clearRoleData();
  }, [clearRoleData]);

  const setShiftStatus = useCallback(async (status: ShiftStatusValue) => {
    let previous: ShiftStatusValue | undefined;
    setCleanerProfile((current) => {
      previous = current.currentShift.status;
      return { ...current, currentShift: { ...current.currentShift, status } };
    });
    try {
      if (status !== 'SHIFT_ENDED' && hasOpenDeskShiftRef.current) {
        await setAttendancePresence(status);
      } else {
        await updateMe({ shiftStatus: status });
      }
    } catch (error) {
      if (previous) {
        const restore = previous;
        setCleanerProfile((current) => ({ ...current, currentShift: { ...current.currentShift, status: restore } }));
      }
      throw error;
    }
  }, []);

  const scanShiftQr = useCallback(async (token: string, action: 'open' | 'close') => {
    const result: any = await scanAttendanceQr(token, action).catch((error: unknown) => {
      // The shift was already closed on the server (e.g. from the desk) — closing is done.
      if (action === 'close' && error instanceof Error && error.message === 'SHIFT_NOT_OPEN') {
        return { action: 'closed', shiftStatus: 'SHIFT_ENDED' };
      }
      throw error;
    });
    const opened = String(result?.action ?? '').toLowerCase() === 'opened'
      || String(result?.shiftStatus ?? '').toUpperCase() === 'ON_SHIFT'
      || (!result?.action && !result?.shiftStatus && action === 'open');
    setHasOpenDeskShift(opened);
    // Keep the coarse staff flag in step (the web PMS and /staff/me read it); best effort.
    if (!opened) await updateMe({ shiftStatus: 'SHIFT_ENDED' }).catch(() => undefined);
    setCleanerProfile((current) => ({
      ...current,
      currentShift: {
        ...current.currentShift,
        status: opened ? 'ON_SHIFT' : 'SHIFT_ENDED',
        startTime: opened ? timeNow() : current.currentShift.startTime,
      },
    }));
    // Pull the server's view of the shift (exact open time, status) and the work lists.
    void refreshFromApiRef.current?.().catch(() => undefined);
    return opened ? 'opened' as const : 'closed' as const;
  }, []);

  const saveMyProfile = useCallback(async (values: { fullName: string; email: string; phone: string }) => {
    const updated: any = await updateMe({
      fullName: values.fullName.trim() || undefined,
      email: values.email.trim() || undefined,
      phone: values.phone.trim() || undefined,
    });
    setCleanerProfile((current) => ({
      ...current,
      fullName: String(updated?.fullName ?? values.fullName) || current.fullName,
      fullNameRu: String(updated?.fullName ?? values.fullName) || current.fullNameRu,
      email: String(updated?.email ?? values.email) || current.email,
      phone: String(updated?.phone ?? values.phone) || undefined,
    }));
  }, []);

  const changePassword = useCallback(async (currentPassword: string, newPassword: string) => {
    await changeMyPassword(currentPassword, newPassword);
  }, []);

  const refreshFromApi = useCallback(async (roleArg?: StaffRole) => {
    const activeRole = roleArg ?? role;
    const isCleaner = activeRole === 'CLEANER';
    const isTechnician = activeRole === 'TECHNICIAN';
    const isSupervisor = activeRole === 'SUPERVISOR';
    const isParking = activeRole === 'PARKING';
    const needsHousekeeping = isCleaner || isSupervisor;
    const [
      tasksResponse, roomsResponse, supplyRecords, minibarItems, maintenanceRecords, historyRecords,
      checklistRecordsResponse, partRecords, partOrderRecords, staffRecords, dashboard, me,
      parkingSpotRecords, parkingTicketRecords,
    ] = await Promise.all([
      needsHousekeeping ? listHousekeeping().catch(() => []) : Promise.resolve([]),
      listRooms().catch(() => []),
      isCleaner ? listRecord('supply').catch(() => []) : Promise.resolve([]),
      isCleaner ? listMinibarItems().catch(() => []) : Promise.resolve([]),
      listRecord('maintenance').catch(() => []),
      isCleaner ? listRecord('shift_history').catch(() => []) : Promise.resolve([]),
      needsHousekeeping ? listRecord('room_checklist').catch(() => []) : Promise.resolve([]),
      isTechnician ? listRecord('parts').catch(() => []) : Promise.resolve([]),
      isTechnician ? listRecord('parts_order').catch(() => []) : Promise.resolve([]),
      isSupervisor ? listStaff().catch(() => []) : Promise.resolve([]),
      getDashboard().catch(() => ({})),
      getMe().catch(() => null),
      isParking ? listParkingSpots().catch(() => []) : Promise.resolve([]),
      isParking ? listParkingTickets('OPEN').catch(() => []) : Promise.resolve([]),
    ]);

    const roomsByNumber = new Map(asList<any>(roomsResponse).map((room) => [String(room.number), room]));
    if (roomsByNumber.size > 0) {
      roomIdByNumber.current = new Map([...roomsByNumber].filter(([, room]) => room?.id).map(([number, room]) => [number, String(room.id)]));
      setHotelRoomNumbers([...roomsByNumber.keys()].sort((a, b) => a.localeCompare(b, undefined, { numeric: true })));
    }
    const checklistRecords = asList<any>(checklistRecordsResponse);
    const checklistByTaskId = new Map(checklistRecords.map((record) => [String(record.housekeeping_id || record.housekeepingId || record.task_id || ''), record]));
    checklistRecords.forEach((record) => {
      const taskId = String(record.housekeeping_id || record.housekeepingId || record.task_id || '');
      if (!taskId || !record.id) return;
      if (typeof roomRecordIds.current[taskId] !== 'object') roomRecordIds.current[taskId] = String(record.id);
      roomPhotoUrls.current[taskId] = {
        before: record.photo_before_url || roomPhotoUrls.current[taskId]?.before,
        after: record.photo_after_url || roomPhotoUrls.current[taskId]?.after,
        zones: { ...record.zone_photos, ...roomPhotoUrls.current[taskId]?.zones },
      };
    });
    if (needsHousekeeping) {
      const apiRooms = asList<any>(tasksResponse).map((task) => mapHousekeepingTask(task, roomsByNumber.get(String(task.room?.number || task.roomNumber)), checklistByTaskId.get(String(task.id))));
      // Keep what only this device knows: photo files taken here (the server has copies,
      // but the local file is already on screen) and the pause bookkeeping, so a refresh
      // doesn't swap photos or reset the timer.
      setRooms((prev) => {
        const byId = new Map(prev.map((r) => [r.id, r]));
        return apiRooms.map((r) => {
          const old = byId.get(r.id);
          if (!old) return r;
          const photos = {
            photoBeforeUrl: old.photoBeforeUrl ?? r.photoBeforeUrl,
            photoAfterUrl: old.photoAfterUrl ?? r.photoAfterUrl,
            zonePhotos: old.zonePhotos || r.zonePhotos ? { ...r.zonePhotos, ...old.zonePhotos } : undefined,
          };
          const serverPaused = !!r.pausedAtMs;
          // Paused here a moment ago and the server hasn't caught up yet.
          const pauseInFlight = r.status === 'PENDING' && !!old.pausedAtMs;
          // Server says not started (e.g. sent back for re-cleaning): start over, drop the timer.
          if (r.status === 'PENDING' && !serverPaused && !pauseInFlight) return { ...r, ...photos };
          return {
            ...r,
            ...photos,
            startTime: r.startTime && r.startTime !== '—' ? r.startTime : old.startTime ?? r.startTime,
            startedAtMs: old.startedAtMs ?? r.startedAtMs,
            pausedMs: old.pausedMs,
            pausedAtMs: serverPaused || pauseInFlight ? old.pausedAtMs ?? r.pausedAtMs : undefined,
          };
        });
      });
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
    if (isParking) {
      setParkingSpots(asList<any>(parkingSpotRecords).map(mapParkingSpot));
      setParkingSessions(asList<any>(parkingTicketRecords).map(mapParkingSession));
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
          kind: kind || undefined,
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
          // The API has no read flag, and this runs every 30 s: keep what was read here, and
          // the app's own notices (addSystemNotification, ids "n-…").
          const readIds = new Set(prev.filter((n) => n.isRead).map((n) => n.id));
          const local = prev.filter((n) => n.id.startsWith('n-'));
          return [...local, ...notifications.map((n) => (readIds.has(n.id) ? { ...n, isRead: true } : n))];
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
        phone: (me as any).phone ? String((me as any).phone) : current.phone,
        currentShift: {
          ...current.currentShift,
          status: ['ON_SHIFT', 'ON_BREAK', 'SHIFT_ENDED'].includes(String((me as any).shiftStatus))
            ? ((me as any).shiftStatus as ShiftStatusValue)
            : me.isActive === false ? 'SHIFT_ENDED' : 'ON_SHIFT',
        },
      }));
    }

    // Real shift (front-desk attendance), today's bookings for room cards, and — for the
    // supervisor — who is on shift / on break right now. All optional: failures leave the
    // previous values.
    const today = localDateIso();
    const [attendanceRaw, bookingsRaw, onShiftRaw] = await Promise.all([
      getMyAttendance().catch(() => undefined),
      needsHousekeeping ? listBookings(today, today).catch(() => undefined) : Promise.resolve(undefined),
      isSupervisor ? listOnShift().catch(() => undefined) : Promise.resolve(undefined),
    ]);
    if (attendanceRaw !== undefined) {
      const att = mapMyAttendance(attendanceRaw);
      setHasOpenDeskShift(att.open);
      // Shifts are opened and closed with the desk QR, so the attendance shift decides: no
      // open shift means the shift is over, whatever the staff.shiftStatus flag (/staff/me,
      // read above) still says — it can lag behind and is ON_SHIFT by default.
      setCleanerProfile((current) => ({
        ...current,
        currentShift: {
          ...current.currentShift,
          status: att.open ? att.status ?? 'ON_SHIFT' : 'SHIFT_ENDED',
          startTime: att.openedAt ?? current.currentShift.startTime,
        },
      }));
    }
    if (bookingsRaw !== undefined) {
      const bookings = asList<any>(bookingsRaw);
      setRooms((prev) => applyBookingsToRooms(prev, bookings, today));
    }
    if (onShiftRaw !== undefined) {
      const statusByKey = new Map<string, string>();
      for (const s of asList<any>(onShiftRaw)) {
        const status = String(s?.shiftStatus ?? 'ON_SHIFT');
        const id = String(s?.employee_id ?? s?.employeeId ?? s?.userId ?? s?.employee?.id ?? '');
        const name = String(s?.employee?.name ?? s?.employee?.fullName ?? '').trim().toLowerCase();
        if (id) statusByKey.set(`id:${id}`, status);
        if (name) statusByKey.set(`name:${name}`, status);
      }
      setStaffList((prev) => {
        const lookup = (m: StaffMember) => statusByKey.get(`id:${m.id}`) ?? statusByKey.get(`name:${m.fullName.trim().toLowerCase()}`);
        // Attendance employees may be keyed differently from /staff users; if nothing lines
        // up, keep the staff flags rather than marking the whole team off shift.
        if (statusByKey.size > 0 && !prev.some((m) => lookup(m))) return prev;
        // Anyone without an open shift is off shift, whatever their stale staff flag says.
        return prev.map((m) => ({ ...m, shiftStatus: lookup(m) ?? 'SHIFT_ENDED' }));
      });
    }
    setLastSyncedAt(timeNow());
  }, [playTaskSound, role]);
  useEffect(() => {
    refreshFromApiRef.current = () => refreshFromApi();
  }, [refreshFromApi]);

  // Signs in with a session whose token is already saved; undoes it all on failure.
  const enterSession = useCallback(async (result: ApiSession) => {
    try {
      const resolvedRole = classifyRole(result.user);
      if (!resolvedRole) throw new Error(UNSUPPORTED_ROLE);
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

  const authenticate = useCallback(async (email: string, password: string, tenantSlug?: string) => {
    await enterSession(await apiLogin(email, password, tenantSlug));
  }, [enterSession]);

  const previewQrLogin = useCallback(async (token: string) => {
    const session = await apiQrLogin(token);
    const resolvedRole = classifyRole(session.user);
    if (!resolvedRole) throw new Error(UNSUPPORTED_ROLE);
    return { session, role: resolvedRole };
  }, []);

  const completeQrLogin = useCallback(async (session: ApiSession) => {
    startSession(session);
    await enterSession(session);
  }, [enterSession]);

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

  // Changes made elsewhere (the web PMS, a supervisor's phone) are picked up when the app
  // comes back to the foreground; otherwise screens re-sync on pull-to-refresh.
  // There is no push/realtime channel on the API.
  useEffect(() => {
    if (!isLoggedIn || !role) return;
    const subscription = RNAppState.addEventListener('change', (state) => {
      if (state === 'active' && getStoredSession()) void refreshFromApi().catch(() => undefined);
    });
    return () => subscription.remove();
  }, [isLoggedIn, role, refreshFromApi]);

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
      const nowMs = Date.now();
      const timeStr = new Date(nowMs).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
      setRooms((prev) =>
        prev.map((r) => {
          if (r.id !== roomId) return r;
          const updated: HotelRoom = { ...r, status };
          // Close an open pause on resume/finish, so the timer excludes it.
          if (status !== 'PENDING' && r.pausedAtMs) {
            updated.pausedMs = (r.pausedMs ?? 0) + Math.max(0, nowMs - r.pausedAtMs);
            updated.pausedAtMs = undefined;
          }
          if (status === 'IN_PROGRESS' && !r.startTime) {
            updated.startTime = timeStr;
            updated.startedAtMs = nowMs;
          }
          if (status === 'PENDING' && r.startTime && !r.pausedAtMs) updated.pausedAtMs = nowMs;
          if ((status === 'READY' || status === 'VERIFIED') && !r.endTime) updated.endTime = timeStr;
          return updated;
        })
      );
      const requestSession = getStoredSession();
      if (requestSession) {
        // A started room going back to PENDING is a pause: the API has its own PAUSED status
        // for that ("started task on hold"), distinct from PENDING ("not started"). The
        // assignee stays — pausing doesn't hand the room back.
        const wasStarted = !!rooms.find((r) => r.id === roomId)?.startTime;
        const apiStatus =
          status === 'IN_PROGRESS' ? 'IN_PROGRESS'
          : status === 'READY' || status === 'VERIFIED' ? 'DONE'
          : status === 'PENDING' ? (wasStarted ? 'PAUSED' : 'PENDING')
          : null;
        if (apiStatus) {
          void updateHousekeepingStatus(roomId, {
            status: apiStatus,
            // No startedAt/completedAt from the phone: the server stamps both itself, and the
            // phone's clock can lag the server's — then a finish right after a (re)start was
            // rejected with CLEANING_END_BEFORE_START. The local timer keeps its own times.
            ...(apiStatus === 'IN_PROGRESS' ? { assignedTo: cleanerProfile.fullName || cleanerProfile.email } : {}),
          }).catch((error) => {
            // The user signed out or into another account meanwhile: this answer is about
            // the previous session, so there is nothing to tell the current one.
            if (getStoredSession() !== requestSession) return;
            // Don't silently snap back to the server state — say what didn't go through
            // (e.g. "sent for inspection" when the room was never actually marked done).
            Alert.alert(
              lang === 'RU' ? 'Статус номера не сохранён' : 'Room status not saved',
              `${housekeepingErrorText(error, lang)}\n${lang === 'RU' ? 'Показано актуальное состояние с сервера. Повторите действие.' : 'Showing the current server state. Please try again.'}`.trim()
            );
            void refreshFromApi();
          });
        }
      }
      return true;
    },
    [rooms, cleanerProfile.email, cleanerProfile.fullName, refreshFromApi, lang]
  );

  // Writes the room's room_checklist record: the checklist plus the server photo URLs, sent
  // together every time so neither overwrites the other.
  const saveRoomRecord = useCallback(async (roomId: string, checklist: RoomCheckitem[] | undefined) => {
    const room = roomsRef.current.find((r) => r.id === roomId);
    const photos = roomPhotoUrls.current[roomId] ?? {};
    const payload = {
      housekeeping_id: roomId,
      room_id: room?.physicalRoomId,
      room_number: room?.roomNumber,
      checklist: checklist ?? room?.checklist,
      photo_before_url: photos.before,
      photo_after_url: photos.after,
      zone_photos: photos.zones,
      updated_at: new Date().toISOString(),
    };
    const recordId = await Promise.resolve(roomRecordIds.current[roomId]).catch(() => undefined);
    if (recordId) {
      await updateRecord('room_checklist', recordId, payload);
      return;
    }
    const creating = createRecord('room_checklist', payload).then((created: any) => (created?.id ? String(created.id) : undefined));
    roomRecordIds.current[roomId] = creating;
    const id = await creating.catch(() => undefined);
    if (id) roomRecordIds.current[roomId] = id;
    else delete roomRecordIds.current[roomId];
  }, []);

  const updateRoomChecklist = useCallback((roomId: string, checklist: RoomCheckitem[]) => {
    setRooms((prev) => prev.map((r) => (r.id === roomId ? { ...r, checklist } : r)));
    if (getStoredSession()) void saveRoomRecord(roomId, checklist).catch(() => undefined);
  }, [saveRoomRecord]);

  // `roomId` is the housekeeping task id (room.id), matching every other room action in
  // this file — the physicalRoomId the API actually wants is resolved internally, same
  // pattern as verifyRoom below. Stores the photo on the room itself (not just the
  // server) so it's still there if the cleaner navigates away and back; the API call is
  // best-effort (see the 403-permission note where this is called from).
  const saveRoomPhoto = useCallback(
    async (roomId: string, uri: string, stage: string) => {
      const room = rooms.find((r) => r.id === roomId);
      setRooms((prev) =>
        prev.map((r) => {
          if (r.id !== roomId) return r;
          if (stage === 'before') return { ...r, photoBeforeUrl: uri };
          if (stage === 'after') return { ...r, photoAfterUrl: uri };
          return { ...r, zonePhotos: { ...r.zonePhotos, [stage]: uri } };
        })
      );
      const url = await uploadRoomPhoto(room?.physicalRoomId || roomId, uri, stage);
      if (!url) return;
      const current = roomPhotoUrls.current[roomId] ?? {};
      roomPhotoUrls.current[roomId] =
        stage === 'before' ? { ...current, before: url }
        : stage === 'after' ? { ...current, after: url }
        : { ...current, zones: { ...current.zones, [stage]: url } };
      await saveRoomRecord(roomId, undefined);
    },
    [rooms, saveRoomRecord]
  );

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
      // Sent back for re-cleaning = a fresh start: clear the old timer and finish time so
      // the cleaner sees "Начать уборку", not "Возобновить".
      setRooms((prev) =>
        prev.map((r) =>
          r.id === roomId
            ? { ...r, status: 'PENDING', startTime: undefined, endTime: undefined, startedAtMs: undefined, pausedAtMs: undefined, pausedMs: undefined }
            : r
        )
      );
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

  const inviteStaffMember = useCallback(
    async (payload: { email: string; fullName: string; position: string; phone?: string; zone?: string }) => {
      const created = await createStaff(payload);
      setStaffList((prev) => [mapStaff(created), ...prev]);
      addSystemNotification(
        `${payload.fullName} added to staff`,
        `${payload.fullName} добавлен(а) в персонал`,
        'SYSTEM'
      );
    },
    [addSystemNotification]
  );

  const updateStaffMember = useCallback(
    async (id: string, payload: Record<string, unknown>) => {
      const updated = await updateStaff(id, payload);
      setStaffList((prev) => prev.map((s) => (s.id === id ? mapStaff(updated) : s)));
    },
    []
  );

  const dismissStaffMember = useCallback(async (id: string) => {
    await deleteStaff(id);
    setStaffList((prev) => prev.filter((s) => s.id !== id));
  }, []);

  const checkInVehicle = useCallback(
    (plate: string, guestName: string, spotId: string, note?: string) => {
      const tempId = `ps-${Date.now()}`;
      setParkingSessions((prev) => [...prev, { id: tempId, spotId, plate, guestName, note, checkedInAt: timeNow(), checkedInAtIso: new Date().toISOString() }]);
      addSystemNotification(
        `Vehicle ${plate} checked in`,
        `Заезд на парковку: ${plate}`,
        'SYSTEM'
      );
      if (getStoredSession()) {
        void checkInParking({ plateNumber: plate, spotId: spotId || undefined, guestName: guestName || undefined, notes: note })
          .then((created) => {
            setParkingSessions((prev) => prev.map((s) => (s.id === tempId ? mapParkingSession(created) : s)));
          })
          .catch(() => {
            setParkingSessions((prev) => prev.filter((s) => s.id !== tempId));
            void refreshFromApi();
          });
      }
    },
    [addSystemNotification, refreshFromApi]
  );

  const checkOutVehicle = useCallback(
    (sessionId: string) => {
      setParkingSessions((prev) => prev.filter((s) => s.id !== sessionId));
      if (getStoredSession()) {
        void checkOutParking(sessionId).catch(() => refreshFromApi());
      }
    },
    [refreshFromApi]
  );

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
      const writes = Object.entries(deductions).flatMap(([id, ded]) => {
        if (ded <= 0) return [];
        const item = supplies.find((s) => s.id === id);
        // MINIBAR items live in a separate catalog (/minibar/items), not in records/supply,
        // so their trolleyQty isn't a writable field there.
        if (!item || item.category === 'MINIBAR') return [];
        const next = Math.max(0, item.trolleyQty - ded);
        return [updateRecord('supply', id, { trolleyQty: next })];
      });
      // A failed write used to vanish silently and the next refresh put the old count back.
      void Promise.all(writes).catch((error) => {
        Alert.alert(
          lang === 'RU' ? 'Списание не сохранено' : 'Deduction not saved',
          `${error instanceof Error ? error.message : ''}\n${lang === 'RU' ? 'Остатки на тележке обновятся с сервера.' : 'Trolley stock will be reloaded from the server.'}`.trim()
        );
        void refreshFromApi();
      });
    }
    setSupplies((prev) =>
      prev.map((s) => {
        const ded = deductions[s.id] || 0;
        return ded > 0 ? { ...s, trolleyQty: Math.max(0, s.trolleyQty - ded) } : s;
      })
    );
  }, [supplies, lang, refreshFromApi]);

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
        const roomId = rooms.find((room) => room.roomNumber === req.roomNumber)?.physicalRoomId || roomIdByNumber.current.get(req.roomNumber);
        void (async () => {
          // The record keeps the server copy of the photo (a phone file path means nothing to
          // the technician's or supervisor's device).
          const photo = req.photoUrl && roomId ? await uploadRoomPhoto(roomId, req.photoUrl, 'defect').catch(() => undefined) : undefined;
          await createRecord('maintenance', {
            room_id: roomId,
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
            photos: photo ? [photo] : [],
          });
        })().catch(() => undefined);
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
      const key = stage === 'before' ? 'photosBefore' : 'photosAfter';
      // Show the local file right away; it's swapped for the server copy once uploaded.
      setMaintenanceRequests((prev) => prev.map((r) => (r.id === ticketId ? { ...r, [key]: [...(r[key] || []), uri] } : r)));
      if (!getStoredSession()) return;
      const roomId = rooms.find((r) => r.roomNumber === ticket?.roomNumber)?.physicalRoomId || roomIdByNumber.current.get(ticket?.roomNumber ?? '');
      const url = roomId ? await uploadRoomPhoto(roomId, uri, `maintenance_${stage}`).catch(() => undefined) : undefined;
      if (!url) {
        Alert.alert(
          lang === 'RU' ? 'Фото не загружено' : 'Photo not uploaded',
          lang === 'RU' ? 'Фото видно только на этом телефоне. Проверьте интернет и добавьте его ещё раз.' : 'The photo is only on this phone. Check your connection and add it again.'
        );
        return;
      }
      // Only server URLs go into the record — file paths from this phone mean nothing elsewhere.
      const saved = [...(ticket?.[key] || []).filter((p) => /^(https?:)?\//.test(p)), url];
      setMaintenanceRequests((prev) => prev.map((r) => (r.id === ticketId ? { ...r, [key]: (r[key] || []).map((p) => (p === uri ? url : p)) } : r)));
      await updateRecord('maintenance', ticketId, { [`photos_${stage}`]: saved }).catch(() => undefined);
    },
    [maintenanceRequests, rooms, lang]
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

  const activeRoom = useMemo(() => rooms.find((r) => r.status === 'IN_PROGRESS') || null, [rooms]);

  const value: AppState = {
    lang,
    setLang,
    isLoggedIn,
    authReady,
    role,
    login,
    authenticate,
    previewQrLogin,
    completeQrLogin,
    logout,
    cleanerProfile,
    updateCleanerProfile: setCleanerProfile,
    saveMyProfile,
    changePassword,
    setShiftStatus,
    hasOpenDeskShift,
    scanShiftQr,
    rooms,
    hotelRoomNumbers,
    updateRoomStatus,
    updateRoomChecklist,
    uploadRoomPhoto: saveRoomPhoto,
    activeRoom,
    verifyRoom,
    rejectRoomInspection,
    reassignRooms,
    staffList,
    rejectedInspections,
    inviteStaffMember,
    updateStaffMember,
    dismissStaffMember,
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
    shiftHistory,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within an AppProvider');
  return ctx;
}
