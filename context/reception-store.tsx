import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { AppState as RNAppState } from 'react-native';
import {
  cancelBooking as apiCancelBooking,
  checkInBooking as apiCheckInBooking,
  checkOutBooking as apiCheckOutBooking,
  createBooking as apiCreateBooking,
  createGroupBooking as apiCreateGroupBooking,
  createRecord,
  deleteRecord,
  getAvailableRoomIds,
  getBooking,
  getBookingsTimeline,
  listCompanies,
  listServicesCatalog,
  listTariffs,
  searchGuests as apiSearchGuests,
  suggestGroupRooms as apiSuggestGroupRooms,
  listRecord,
  listRoomTypes,
  updateRecord,
} from '@/lib/api-client';
import { useApp } from '@/context/app-store';

// Front-desk data (bookings chessboard / list), kept apart from app-store: only the
// reception role needs it. Shapes follow the web PMS — the API spec has no response schemas.

export type ReceptionBookingStatus = 'NEW' | 'CONFIRMED' | 'CHECKED_IN' | 'CHECKED_OUT' | 'CANCELLED' | 'NO_SHOW';

export interface ReceptionBooking {
  id: string;
  bookingNumber: string;
  guestName: string;
  shortName: string;
  phone: string;
  email: string;
  guestId?: string;
  roomId: string;
  roomNumber: string;
  category: string;
  guestsCount: number;
  adults: number;
  children: number;
  checkIn: string; // YYYY-MM-DD
  checkOut: string; // YYYY-MM-DD
  checkInTime: string;
  checkOutTime: string;
  nights: number;
  status: ReceptionBookingStatus;
  source: string;
  totalAmount: number;
  paidAmount: number;
  balance: number;
  isPaid: boolean;
  tariff: string;
  mealPlan: string;
  notes: string;
  specialMarks: string[];
  groupId?: string;
  bookingType: 'INDIVIDUAL' | 'GROUP' | 'QUICK';
  birthDate?: string;
  gender?: string;
  nationality?: string;
  document?: string;
  manager?: string;
}

export interface ReceptionRoom {
  id: string;
  number: string;
  floor: number | null;
  capacity: number;
  category: string;
  categoryCode: string;
  categoryOrder: number;
  propertyId: string;
  // Nightly base price (room's own rate, else its type's) — for showing a total before the
  // server prices the booking by tariff.
  pricePerNight: number;
  cleanStatus: 'CLEAN' | 'DIRTY';
  isOperational: boolean;
}

// Waitlist entries live in the generic records store (/records/waitlist), shared with the
// web PMS. guest_name … comment are the web PMS fields; priority and status are ours (the
// web PMS ignores them), number is a running request number for display.
export type WaitlistPriority = 'HIGH' | 'NORMAL';
export type WaitlistStatus = 'WAITING' | 'OFFERED' | 'BOOKED';

export interface WaitlistEntry {
  id: string;
  number: string;
  guestName: string;
  phone: string;
  checkIn: string; // YYYY-MM-DD
  checkOut: string; // YYYY-MM-DD
  nights: number;
  adults: number;
  children: number;
  guestsCount: number;
  category: string;
  flexibleCategory: boolean;
  comment: string;
  priority: WaitlistPriority;
  status: WaitlistStatus;
  createdAt: string; // ISO
}

export interface WaitlistInput {
  guestName: string;
  phone: string;
  checkIn: string;
  checkOut: string;
  adults: number;
  children: number;
  category: string;
  flexibleCategory: boolean;
  comment: string;
  priority: WaitlistPriority;
  status: WaitlistStatus;
}

export function mapWaitlistEntry(raw: any, index: number): WaitlistEntry {
  const checkIn = dateOnly(raw?.check_in);
  const checkOut = dateOnly(raw?.check_out);
  const adults = num(raw?.adults) || 1;
  const children = num(raw?.children);
  const status = str(raw?.status).toUpperCase();
  return {
    id: str(raw?.id),
    number: str(raw?.number || raw?.request_no) || String(index + 1),
    guestName: str(raw?.guest_name) || '—',
    phone: str(raw?.guest_phone),
    checkIn,
    checkOut,
    nights: nightsBetween(checkIn, checkOut),
    adults,
    children,
    guestsCount: adults + children,
    category: str(raw?.category),
    flexibleCategory: !!raw?.flexible_category,
    comment: str(raw?.comment),
    priority: str(raw?.priority).toUpperCase() === 'HIGH' ? 'HIGH' : 'NORMAL',
    status: status === 'OFFERED' || status === 'BOOKED' ? status : 'WAITING',
    createdAt: str(raw?.created_at || raw?.createdAt),
  };
}

const waitlistPayload = (input: WaitlistInput) => ({
  guest_name: input.guestName.trim(),
  guest_phone: input.phone.trim(),
  check_in: input.checkIn,
  check_out: input.checkOut,
  adults: input.adults,
  children: input.children,
  category: input.category,
  flexible_category: input.flexibleCategory,
  comment: input.comment.trim() || undefined,
  priority: input.priority,
  status: input.status,
});

// ── Booking creation ─────────────────────────────────────────────────────────────
// Field names and values follow the web PMS (CreateBookingDto / POST /bookings/group).

export interface CatalogItem {
  id: string;
  code: string;
  name: string;
  price: number;
}

export interface PaymentAccount {
  id: string;
  name: string;
  type: string; // cash, bank, card… (finance_account.type)
}

// Values the API stores; labels are what the web PMS shows.
export const BOOKING_SOURCES: { value: string; ru: string; en: string }[] = [
  { value: 'direct', ru: 'Прямая бронь', en: 'Direct booking' },
  { value: 'phone', ru: 'Телефон', en: 'Phone' },
  { value: 'website', ru: 'Сайт', en: 'Website' },
  { value: 'booking_com', ru: 'Booking.com', en: 'Booking.com' },
  { value: 'ostrovok', ru: 'Ostrovok', en: 'Ostrovok' },
  { value: 'walk_in', ru: 'От стойки', en: 'Walk-in' },
  { value: 'b2b', ru: 'Корпоративный', en: 'B2B' },
];
export const MEAL_PLANS: { value: string; ru: string; en: string }[] = [
  { value: 'Room only', ru: 'Без питания', en: 'Room only' },
  { value: 'Breakfast', ru: 'Завтрак', en: 'Breakfast' },
  { value: 'Half board', ru: 'Полупансион', en: 'Half board' },
  { value: 'Full board', ru: 'Полный пансион', en: 'Full board' },
];
export const SPECIAL_MARKS: { value: string; ru: string; en: string }[] = [
  { value: 'Early check-in', ru: 'Ранний заезд', en: 'Early check-in' },
  { value: 'Late checkout', ru: 'Поздний выезд', en: 'Late checkout' },
  { value: 'Birthday', ru: 'День рождения', en: 'Birthday' },
  { value: 'Honeymoon', ru: 'Медовый месяц', en: 'Honeymoon' },
  { value: 'Anniversary', ru: 'Юбилей', en: 'Anniversary' },
  { value: 'Allergy', ru: 'Аллергия', en: 'Allergy' },
];

export interface GuestInput {
  lastName: string;
  firstName: string;
  middleName?: string;
  phone?: string;
  email?: string;
  birthDate?: string; // YYYY-MM-DD
  gender?: 'male' | 'female' | 'other';
  documentType?: string;
  documentId?: string;
  nationality?: string;
}

export interface FoundGuest extends GuestInput {
  id: string;
}

export interface CreateBookingInput {
  kind: 'individual' | 'quick';
  roomId: string;
  checkIn: string; // YYYY-MM-DD
  checkOut: string;
  checkInTime?: string; // HH:MM
  checkOutTime?: string;
  adults: number;
  children: number;
  extraBedConfirmed?: boolean;
  guestId?: string; // existing guest from search; otherwise `guest` is created inline
  guest?: GuestInput;
  companions?: GuestInput[];
  source?: string;
  tariffCode?: string;
  mealPlan?: string;
  specialMarks?: string[];
  extraServices?: string[]; // service codes
  specialRequests?: string;
  notes?: string;
  tags?: string[];
  hasPets?: boolean;
  companyId?: string;
  discountPercent?: number;
  // Payment at creation
  paidAmount?: number;
  paymentAccountId?: string;
  manualTotal?: number; // overrides the tariff total
}

export interface GroupAllocationInput {
  roomId: string;
  adults: number;
  children: number;
  extraBedConfirmed?: boolean;
  guests?: GuestInput[];
}

export interface CreateGroupBookingInput {
  groupName: string;
  companyId?: string;
  discountPercent?: number;
  checkIn: string;
  checkOut: string;
  checkInTime?: string;
  checkOutTime?: string;
  mealPlan?: string;
  extraServices?: string[];
  notes?: string;
  contact: { firstName: string; lastName: string; phone?: string; email?: string };
  allocations: GroupAllocationInput[];
  paidAmount?: number;
  paymentAccountId?: string;
  manualTotal?: number;
}

export interface GroupRoomSuggestion {
  roomId: string;
  roomNumber: string;
  floor: number | null;
  capacity: number;
  guestsCount: number;
}

const trimOrUndefined = (v?: string) => (v && v.trim() ? v.trim() : undefined);
export const guestPayload = (g: GuestInput) => ({
  firstName: g.firstName.trim(),
  lastName: g.lastName.trim(),
  middleName: trimOrUndefined(g.middleName),
  phone: trimOrUndefined(g.phone),
  email: trimOrUndefined(g.email),
  birthDate: trimOrUndefined(g.birthDate),
  gender: g.gender || undefined,
  documentType: trimOrUndefined(g.documentType),
  documentId: trimOrUndefined(g.documentId),
  nationality: trimOrUndefined(g.nationality),
});

export interface ReceptionRoomType {
  id: string;
  code: string;
  name: string;
  baseRate: number;
  maxOccupancy: number;
}

const num = (value: unknown) => {
  const n = typeof value === 'number' ? value : parseFloat(String(value ?? ''));
  return Number.isFinite(n) ? n : 0;
};
const str = (value: unknown) => (value === null || value === undefined ? '' : String(value));
const dateOnly = (value: unknown) => str(value).slice(0, 10);
const asList = <T,>(value: unknown): T[] => {
  if (Array.isArray(value)) return value as T[];
  const v = value as { items?: unknown; data?: unknown } | null;
  if (Array.isArray(v?.items)) return v.items as T[];
  if (Array.isArray(v?.data)) return v.data as T[];
  return [];
};

export function toIsoDate(date: Date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function nightsBetween(from: string, to: string) {
  if (!from || !to) return 0;
  const ms = new Date(`${to}T00:00:00`).getTime() - new Date(`${from}T00:00:00`).getTime();
  return Math.max(0, Math.round(ms / 86_400_000));
}

function mapStatus(value: unknown): ReceptionBookingStatus {
  const s = str(value).toUpperCase();
  if (s === 'CONFIRMED' || s === 'CHECKED_IN' || s === 'CHECKED_OUT' || s === 'CANCELLED' || s === 'NO_SHOW') return s;
  if (s === 'IN_HOUSE') return 'CHECKED_IN';
  return 'NEW';
}

function cleanStatusOf(room: any): 'CLEAN' | 'DIRTY' {
  const c = `${room?.cleanliness || ''} ${room?.status || ''}`.toUpperCase();
  return /DIRTY|CLEANING|IN_PROGRESS|NEEDS/.test(c) ? 'DIRTY' : 'CLEAN';
}

export function mapReceptionRoom(room: any): ReceptionRoom {
  return {
    id: str(room?.id),
    number: str(room?.number),
    floor: room?.floor === null || room?.floor === undefined ? null : num(room.floor),
    capacity: num(room?.maxGuests ?? room?.capacity ?? room?.roomType?.maxOccupancy) || 1,
    category: str(room?.roomType?.name || room?.category || '—'),
    categoryCode: str(room?.roomType?.code || room?.roomTypeId),
    categoryOrder: num(room?.roomType?.sortOrder),
    propertyId: str(room?.propertyId),
    pricePerNight: num(room?.pricePerNight) || num(room?.roomType?.baseRate),
    cleanStatus: cleanStatusOf(room),
    isOperational: room?.isOperational !== false,
  };
}

export function mapReceptionBooking(raw: any, roomsById: Map<string, ReceptionRoom>): ReceptionBooking {
  const guest = raw?.guest || raw?.primaryGuest || {};
  const lastName = str(guest.lastName);
  const firstName = str(guest.firstName);
  const middleName = str(guest.middleName);
  const fullName = [lastName, firstName, middleName].filter(Boolean).join(' ') || str(raw?.guestName || guest.fullName || guest.name);
  const roomId = str(raw?.roomId || raw?.room?.id);
  const room = roomsById.get(roomId);
  const checkIn = dateOnly(raw?.checkInDate || raw?.checkIn);
  const checkOut = dateOnly(raw?.checkOutDate || raw?.checkOut);
  const adults = num(raw?.adults) || 1;
  const children = num(raw?.children);
  const total = num(raw?.totalAmount ?? raw?.totalDue);
  const paid = num(raw?.paidAmount ?? raw?.amountPaid);
  const balance = raw?.balance !== undefined || raw?.balanceDue !== undefined ? num(raw?.balance ?? raw?.balanceDue) : Math.max(0, total - paid);
  const kind = str(raw?.bookingKind || raw?.kind).toUpperCase();
  return {
    id: str(raw?.id),
    bookingNumber: str(raw?.confirmationCode || raw?.bookingNumber || raw?.code || raw?.id),
    guestName: fullName || '—',
    shortName: firstName || fullName.split(' ')[0] || '—',
    phone: str(guest.phone),
    email: str(guest.email),
    guestId: str(raw?.guestId || guest.id) || undefined,
    roomId,
    roomNumber: str(raw?.room?.number || room?.number),
    category: str(raw?.room?.roomType?.name || room?.category || '—'),
    guestsCount: adults + children,
    adults,
    children,
    checkIn,
    checkOut,
    checkInTime: str(raw?.checkInTime) || '14:00',
    checkOutTime: str(raw?.checkOutTime) || '12:00',
    nights: num(raw?.nights ?? raw?.totalNights) || nightsBetween(checkIn, checkOut),
    status: mapStatus(raw?.status),
    source: str(raw?.source),
    totalAmount: total,
    paidAmount: paid,
    balance,
    isPaid: total > 0 ? balance <= 0 : false,
    tariff: str(raw?.tariff?.name || raw?.tariffName || raw?.tariffCode),
    mealPlan: str(raw?.mealPlan),
    notes: str(raw?.notes || raw?.specialRequests),
    specialMarks: Array.isArray(raw?.specialMarks) ? raw.specialMarks.map(str) : [],
    groupId: raw?.groupId ? str(raw.groupId) : undefined,
    bookingType: raw?.groupId || kind === 'GROUP' ? 'GROUP' : kind === 'QUICK' ? 'QUICK' : 'INDIVIDUAL',
    birthDate: dateOnly(guest.birthDate) || undefined,
    gender: str(guest.gender) || undefined,
    nationality: str(guest.nationality || guest.citizenship) || undefined,
    document: [str(guest.documentType), str(guest.documentNumber || guest.document)].filter(Boolean).join(' ') || undefined,
    manager: str(raw?.manager?.fullName || raw?.managerName) || undefined,
  };
}

interface ReceptionState {
  rooms: ReceptionRoom[];
  bookings: ReceptionBooking[];
  roomTypes: ReceptionRoomType[];
  // Loaded period, inclusive start / exclusive end (YYYY-MM-DD).
  period: { from: string; to: string };
  setPeriod: (from: string, to: string) => void;
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  refreshBooking: (id: string) => Promise<void>;
  checkIn: (bookingId: string) => Promise<void>;
  checkOut: (bookingId: string) => Promise<void>;
  cancel: (bookingId: string) => Promise<void>;
  waitlist: WaitlistEntry[];
  waitlistLoading: boolean;
  waitlistError: string | null;
  refreshWaitlist: () => Promise<void>;
  createWaitlistEntry: (input: WaitlistInput) => Promise<void>;
  updateWaitlistEntry: (id: string, input: Partial<WaitlistInput>) => Promise<void>;
  deleteWaitlistEntry: (id: string) => Promise<void>;
  // Booking creation
  tariffs: CatalogItem[];
  services: CatalogItem[];
  companies: CatalogItem[];
  paymentAccounts: PaymentAccount[];
  loadCatalogs: () => Promise<void>;
  availableRoomIds: (checkIn: string, checkOut: string) => Promise<string[]>;
  suggestGroupRooms: (checkIn: string, checkOut: string, guests: number, roomsNeeded?: number) => Promise<GroupRoomSuggestion[]>;
  searchGuests: (q: string) => Promise<FoundGuest[]>;
  // Both resolve to the created booking ids and refresh the chessboard.
  createBooking: (input: CreateBookingInput) => Promise<string>;
  createGroupBooking: (input: CreateGroupBookingInput) => Promise<string[]>;
}

const ReceptionContext = createContext<ReceptionState | null>(null);

const defaultPeriod = () => {
  const start = new Date();
  const end = new Date(start);
  end.setDate(end.getDate() + 7);
  return { from: toIsoDate(start), to: toIsoDate(end) };
};

// Mounted for every logged-in role (booking details live outside the reception tabs),
// but only loads anything for the front desk.
export function ReceptionProvider({ children }: { children: React.ReactNode }) {
  const { role, isLoggedIn } = useApp();
  const enabled = isLoggedIn && role === 'RECEPTION';
  const [rooms, setRooms] = useState<ReceptionRoom[]>([]);
  const [bookings, setBookings] = useState<ReceptionBooking[]>([]);
  const [roomTypes, setRoomTypes] = useState<ReceptionRoomType[]>([]);
  const [period, setPeriodState] = useState(defaultPeriod);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [tariffs, setTariffs] = useState<CatalogItem[]>([]);
  const [services, setServices] = useState<CatalogItem[]>([]);
  const [companies, setCompanies] = useState<CatalogItem[]>([]);
  const [paymentAccounts, setPaymentAccounts] = useState<PaymentAccount[]>([]);
  const [waitlist, setWaitlist] = useState<WaitlistEntry[]>([]);
  const [waitlistLoading, setWaitlistLoading] = useState(false);
  const [waitlistError, setWaitlistError] = useState<string | null>(null);
  const periodRef = useRef(period);
  periodRef.current = period;

  const roomsRef = useRef<ReceptionRoom[]>([]);
  roomsRef.current = rooms;

  const refresh = useCallback(async () => {
    const { from, to } = periodRef.current;
    setLoading(true);
    try {
      const [timeline, types] = await Promise.all([getBookingsTimeline(from, to), listRoomTypes().catch(() => [])]);
      const mappedRooms = asList<any>(timeline?.rooms)
        .map(mapReceptionRoom)
        .sort((a, b) => a.categoryOrder - b.categoryOrder || a.number.localeCompare(b.number, undefined, { numeric: true }));
      const byId = new Map(mappedRooms.map((r) => [r.id, r]));
      setRooms(mappedRooms);
      setBookings(asList<any>(timeline?.bookings).map((b) => mapReceptionBooking(b, byId)));
      setRoomTypes(
        asList<any>(types).map((t) => ({ id: str(t.id), code: str(t.code), name: str(t.name), baseRate: num(t.baseRate), maxOccupancy: num(t.maxOccupancy) }))
      );
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (enabled) void refresh();
  }, [enabled, period, refresh]);

  // After editing / paying: reload the period, then the booking itself, so it stays
  // available even when its new dates fall outside the loaded period.
  const refreshBooking = useCallback(
    async (id: string) => {
      await refresh();
      try {
        const raw: any = await getBooking(id);
        const fresh = mapReceptionBooking(raw?.data ?? raw, new Map(roomsRef.current.map((r) => [r.id, r])));
        if (fresh.id) setBookings((prev) => (prev.some((b) => b.id === fresh.id) ? prev.map((b) => (b.id === fresh.id ? fresh : b)) : [...prev, fresh]));
      } catch {
        // the timeline reload above is enough
      }
    },
    [refresh]
  );

  const refreshWaitlist = useCallback(async () => {
    setWaitlistLoading(true);
    try {
      const records = asList<any>(await listRecord('waitlist'));
      const sorted = [...records].sort((a, b) => str(a?.created_at || a?.createdAt).localeCompare(str(b?.created_at || b?.createdAt)));
      setWaitlist(sorted.map(mapWaitlistEntry).reverse());
      setWaitlistError(null);
    } catch (e) {
      setWaitlistError(e instanceof Error ? e.message : String(e));
    } finally {
      setWaitlistLoading(false);
    }
  }, []);

  useEffect(() => {
    if (enabled) void refreshWaitlist();
  }, [enabled, refreshWaitlist]);

  const createWaitlistEntry = useCallback(async (input: WaitlistInput) => {
    await createRecord('waitlist', { ...waitlistPayload(input), created_at: new Date().toISOString() });
    await refreshWaitlist();
  }, [refreshWaitlist]);

  const updateWaitlistEntry = useCallback(async (id: string, input: Partial<WaitlistInput>) => {
    const current = waitlist.find((w) => w.id === id);
    const merged: WaitlistInput = {
      guestName: current?.guestName ?? '',
      phone: current?.phone ?? '',
      checkIn: current?.checkIn ?? '',
      checkOut: current?.checkOut ?? '',
      adults: current?.adults ?? 1,
      children: current?.children ?? 0,
      category: current?.category ?? '',
      flexibleCategory: current?.flexibleCategory ?? false,
      comment: current?.comment ?? '',
      priority: current?.priority ?? 'NORMAL',
      status: current?.status ?? 'WAITING',
      ...input,
    };
    await updateRecord('waitlist', id, waitlistPayload(merged));
    await refreshWaitlist();
  }, [waitlist, refreshWaitlist]);

  const loadCatalogs = useCallback(async () => {
    const toItem = (x: any): CatalogItem => ({ id: str(x?.id), code: str(x?.code || x?.id), name: str(x?.name || x?.code), price: num(x?.price ?? x?.rate ?? x?.amount) });
    const [t, sv, c, acc] = await Promise.all([
      listTariffs().catch(() => []),
      listServicesCatalog().catch(() => []),
      listCompanies().catch(() => []),
      listRecord('finance_account').catch(() => []),
    ]);
    setTariffs(asList<any>(t).filter((x) => x?.isActive !== false).map(toItem));
    setServices(asList<any>(sv).filter((x) => x?.isAvailable !== false).map(toItem));
    setCompanies(asList<any>(c).map(toItem));
    setPaymentAccounts(
      asList<any>(acc)
        .filter((x) => !x?.archived && !x?.is_archived && x?.status !== 'archived')
        .map((x) => ({ id: str(x?.id), name: str(x?.name) || '—', type: str(x?.type) }))
    );
  }, []);

  useEffect(() => {
    if (enabled) void loadCatalogs();
  }, [enabled, loadCatalogs]);

  const availableRoomIds = useCallback(async (checkIn: string, checkOut: string) => {
    return asList<unknown>(await getAvailableRoomIds(checkIn, checkOut)).map(str);
  }, []);

  const suggestGroupRooms = useCallback(async (checkIn: string, checkOut: string, guests: number, roomsNeeded?: number) => {
    const res: any = await apiSuggestGroupRooms(checkIn, checkOut, guests, roomsNeeded);
    return asList<any>(res?.allocations ?? res).map((a) => ({
      roomId: str(a?.roomId),
      roomNumber: str(a?.roomNumber),
      floor: a?.floor === null || a?.floor === undefined ? null : num(a.floor),
      capacity: num(a?.capacity) || 1,
      guestsCount: num(a?.guestsCount),
    }));
  }, []);

  const searchGuests = useCallback(async (q: string) => {
    if (q.trim().length < 2) return [];
    return asList<any>(await apiSearchGuests(q.trim())).map((g) => ({
      id: str(g?.id),
      lastName: str(g?.lastName || g?.last_name),
      firstName: str(g?.firstName || g?.first_name),
      middleName: str(g?.middleName || g?.middle_name) || undefined,
      phone: str(g?.phone) || undefined,
      email: str(g?.email) || undefined,
      birthDate: dateOnly(g?.birthDate || g?.birth_date) || undefined,
      gender: (str(g?.gender) || undefined) as GuestInput['gender'],
      documentType: str(g?.documentType || g?.document_type) || undefined,
      documentId: str(g?.documentId || g?.documentNumber || g?.document_number) || undefined,
      nationality: str(g?.nationality) || undefined,
    }));
  }, []);

  const propertyIdFor = useCallback((roomId?: string) => {
    const room = rooms.find((r) => r.id === roomId) || rooms[0];
    return room?.propertyId || undefined;
  }, [rooms]);

  const createBooking = useCallback(async (input: CreateBookingInput) => {
    const res: any = await apiCreateBooking({
      propertyId: propertyIdFor(input.roomId),
      kind: input.kind,
      roomId: input.roomId,
      checkInDate: input.checkIn,
      checkOutDate: input.checkOut,
      checkInTime: input.checkInTime,
      checkOutTime: input.checkOutTime,
      adults: input.adults,
      children: input.children,
      extraBedConfirmed: input.extraBedConfirmed || undefined,
      guestId: input.guestId,
      guest: input.guestId || !input.guest ? undefined : guestPayload(input.guest),
      companions: input.companions?.length ? input.companions.map(guestPayload) : undefined,
      source: input.source,
      tariffCode: input.tariffCode,
      mealPlan: input.mealPlan,
      specialMarks: input.specialMarks?.length ? input.specialMarks : undefined,
      extraServices: input.extraServices?.length ? input.extraServices : undefined,
      specialRequests: trimOrUndefined(input.specialRequests),
      notes: trimOrUndefined(input.notes),
      tags: input.tags?.length ? input.tags : undefined,
      hasPets: input.hasPets || undefined,
      companyId: input.companyId || undefined,
      discountPercent: input.companyId ? input.discountPercent : undefined,
      paidAmount: input.paidAmount || undefined,
      paymentAccountId: input.paidAmount ? input.paymentAccountId : undefined,
      ...(input.manualTotal !== undefined ? { manualPrice: true, totalAmount: input.manualTotal } : {}),
    });
    await refresh();
    return str(res?.id ?? res?.booking?.id);
  }, [propertyIdFor, refresh]);

  const createGroupBooking = useCallback(async (input: CreateGroupBookingInput) => {
    const res: any = await apiCreateGroupBooking({
      propertyId: propertyIdFor(input.allocations[0]?.roomId),
      groupName: input.groupName.trim(),
      companyId: input.companyId || undefined,
      discountPercent: input.companyId ? input.discountPercent : undefined,
      checkInDate: input.checkIn,
      checkOutDate: input.checkOut,
      checkInTime: input.checkInTime,
      checkOutTime: input.checkOutTime,
      mealPlan: input.mealPlan,
      extraServices: input.extraServices?.length ? input.extraServices : undefined,
      notes: trimOrUndefined(input.notes),
      paidAmount: input.paidAmount || undefined,
      paymentAccountId: input.paidAmount ? input.paymentAccountId : undefined,
      ...(input.manualTotal !== undefined ? { manualPrice: true, totalAmount: input.manualTotal } : {}),
      contactFirstName: input.contact.firstName.trim(),
      contactLastName: input.contact.lastName.trim(),
      contactPhone: trimOrUndefined(input.contact.phone),
      contactEmail: trimOrUndefined(input.contact.email),
      allocations: input.allocations.map((a) => ({
        roomId: a.roomId,
        guestsCount: a.adults + a.children,
        adults: a.adults,
        children: a.children,
        extraBedConfirmed: a.extraBedConfirmed || undefined,
        guests: a.guests?.length ? a.guests.map(guestPayload) : undefined,
      })),
    });
    await refresh();
    return asList<any>(res?.items ?? res?.bookings ?? res).map((b) => str(b?.id)).filter(Boolean);
  }, [propertyIdFor, refresh]);

  const deleteWaitlistEntry = useCallback(async (id: string) => {
    await deleteRecord('waitlist', id);
    await refreshWaitlist();
  }, [refreshWaitlist]);

  useEffect(() => {
    if (!enabled) return;
    const subscription = RNAppState.addEventListener('change', (state) => {
      if (state === 'active') {
        void refresh();
        void refreshWaitlist();
      }
    });
    return () => subscription.remove();
  }, [enabled, refresh, refreshWaitlist]);

  const setPeriod = useCallback((from: string, to: string) => {
    setPeriodState((prev) => (prev.from === from && prev.to === to ? prev : { from, to }));
  }, []);

  const checkIn = useCallback(async (bookingId: string) => {
    await apiCheckInBooking(bookingId);
    await refresh();
  }, [refresh]);

  const checkOut = useCallback(async (bookingId: string) => {
    await apiCheckOutBooking(bookingId);
    await refresh();
  }, [refresh]);

  const cancel = useCallback(async (bookingId: string) => {
    await apiCancelBooking(bookingId);
    await refresh();
  }, [refresh]);

  const value = useMemo(
    () => ({
      rooms, bookings, roomTypes, period, setPeriod, loading, error, refresh, refreshBooking, checkIn, checkOut, cancel,
      waitlist, waitlistLoading, waitlistError, refreshWaitlist, createWaitlistEntry, updateWaitlistEntry, deleteWaitlistEntry,
      tariffs, services, companies, paymentAccounts, loadCatalogs, availableRoomIds, suggestGroupRooms, searchGuests,
      createBooking, createGroupBooking,
    }),
    [
      rooms, bookings, roomTypes, period, setPeriod, loading, error, refresh, refreshBooking, checkIn, checkOut, cancel,
      waitlist, waitlistLoading, waitlistError, refreshWaitlist, createWaitlistEntry, updateWaitlistEntry, deleteWaitlistEntry,
      tariffs, services, companies, paymentAccounts, loadCatalogs, availableRoomIds, suggestGroupRooms, searchGuests,
      createBooking, createGroupBooking,
    ]
  );

  return <ReceptionContext.Provider value={value}>{children}</ReceptionContext.Provider>;
}

export function useReception() {
  const ctx = useContext(ReceptionContext);
  if (!ctx) throw new Error('useReception must be used within ReceptionProvider');
  return ctx;
}
