import { AxiosError, AxiosRequestConfig, create } from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

const API_BASE_URL = (process.env.EXPO_PUBLIC_API_BASE_URL || 'https://api.sollviera.com/api').replace(/\/$/, '');
const DEFAULT_TENANT_SLUG = process.env.EXPO_PUBLIC_TENANT_SLUG || 'demo';

export interface ApiSession {
  accessToken: string;
  user: ApiUser;
}

export interface ApiUser {
  id: string;
  email: string;
  fullName?: string;
  role?: string;
  roleCode?: string;
  department?: string;
  badgeNumber?: string;
  tenantSlug?: string;
  tenantId?: string;
  isActive?: boolean;
  permissions?: string[];
}

type Json = Record<string, unknown>;

const http = create({
  baseURL: API_BASE_URL,
  headers: { 'Content-Type': 'application/json' },
});

// In-memory cache so every other call in this file can read the session synchronously
// (the axios interceptor below, tenantSlug(), etc.). AsyncStorage itself is async and
// works on both web (IndexedDB-backed) and native (unlike the old plain `localStorage`,
// which silently doesn't exist in the native runtime — sessions never survived an app
// restart there). `hydrateSession()` fills this cache once at startup; see its call in
// app-store.tsx's restore effect, gated behind `authReady`.
let session: ApiSession | null = null;
let tenant: string = DEFAULT_TENANT_SLUG;
let hydrated = false;

const STORAGE_KEYS = {
  token: 'sollviera_access_token',
  user: 'sollviera_user',
  tenant: 'sollviera_tenant',
};

export async function hydrateSession(): Promise<ApiSession | null> {
  if (hydrated) return session;
  hydrated = true;
  try {
    const [[, token], [, userJson], [, storedTenant]] = await AsyncStorage.multiGet([
      STORAGE_KEYS.token,
      STORAGE_KEYS.user,
      STORAGE_KEYS.tenant,
    ]);
    if (storedTenant) tenant = storedTenant;
    if (token && userJson) {
      session = { accessToken: token, user: JSON.parse(userJson) as ApiUser };
    }
  } catch {
    session = null;
  }
  return session;
}

export function getStoredSession(): ApiSession | null {
  return session;
}

export function clearSession() {
  session = null;
  tenant = DEFAULT_TENANT_SLUG;
  void AsyncStorage.multiRemove([STORAGE_KEYS.token, STORAGE_KEYS.user, STORAGE_KEYS.tenant]);
}

function saveSession(value: ApiSession) {
  session = value;
  tenant = value.user.tenantSlug || DEFAULT_TENANT_SLUG;
  void AsyncStorage.multiSet([
    [STORAGE_KEYS.token, value.accessToken],
    [STORAGE_KEYS.user, JSON.stringify(value.user)],
    [STORAGE_KEYS.tenant, tenant],
  ]);
}

function tenantSlug() {
  return tenant;
}

http.interceptors.request.use((config) => {
  const current = getStoredSession();
  config.headers.set('X-Tenant-Slug', config.headers.get('X-Tenant-Slug') || tenantSlug());
  if (current?.accessToken) config.headers.set('Authorization', `Bearer ${current.accessToken}`);
  return config;
});

export class ApiRequestError extends Error {
  // undefined status means the request never got a response at all (offline, timeout,
  // CORS, server unreachable) — not the same as the server rejecting the token.
  status?: number;
  constructor(message: string, status?: number) {
    super(message);
    this.status = status;
  }
}

async function request<T>(path: string, config: AxiosRequestConfig = {}) {
  try {
    const response = await http.request<T>({ ...config, url: path });
    return response.data;
  } catch (error) {
    const axiosError = error as AxiosError<Json>;
    const status = axiosError.response?.status;
    if (status === 401) clearSession();
    const responseMessage = axiosError.response?.data?.message;
    const message = Array.isArray(responseMessage)
      ? responseMessage.join(', ')
      : responseMessage || axiosError.message || 'Network request failed';
    throw new ApiRequestError(String(message), status);
  }
}

export async function login(email: string, password: string, requestedTenantSlug = DEFAULT_TENANT_SLUG) {
  const body = await request<ApiSession>('/auth/login', {
    method: 'POST',
    headers: { 'X-Tenant-Slug': requestedTenantSlug },
    data: { email, password, tenantSlug: requestedTenantSlug },
  });
  saveSession(body);
  return body;
}

export const getMe = () => request<ApiUser>('/staff/me');
export const listHousekeeping = () => request<unknown[]>('/housekeeping');
export const listRooms = () => request<unknown[]>('/rooms');
export const getDashboard = () => request<Json>('/dashboard');
export const listRecord = (kind: string) => request<unknown[]>(`/records/${encodeURIComponent(kind)}`);
export const listMinibarItems = () => request<unknown[]>('/minibar/items');
export const listStaff = () => request<unknown[]>('/staff');

export const updateRoomFields = (id: string, payload: Json) =>
  request<Json>(`/rooms/${encodeURIComponent(id)}`, { method: 'PATCH', data: payload });

export const updateRoomStatusField = (id: string, payload: Json) =>
  request<Json>(`/rooms/${encodeURIComponent(id)}/status`, { method: 'PATCH', data: payload });

// The upload response shape is undocumented: take the last URL-looking string it carries
// (a bare url, or the last entry of a photos/files/urls list, as strings or {url}).
function lastUploadedUrl(body: unknown): string | undefined {
  if (!body) return undefined;
  if (typeof body === 'string') return /^(https?:\/\/|\/)/.test(body) ? body : undefined;
  if (Array.isArray(body)) {
    for (let i = body.length - 1; i >= 0; i -= 1) {
      const url = lastUploadedUrl(body[i]);
      if (url) return url;
    }
    return undefined;
  }
  if (typeof body === 'object') {
    const obj = body as Record<string, unknown>;
    for (const key of ['url', 'path', 'photos', 'files', 'urls', 'images', 'data']) {
      const url = lastUploadedUrl(obj[key]);
      if (url) return url;
    }
  }
  return undefined;
}

// Housekeeping/maintenance photos go to POST /rooms/:id/photos (multipart field `files`,
// allowed for housekeeping staff). `stage` is only used in the file name ('before',
// 'after', a checklist zone like 'BEDROOM', 'maintenance_after'…). Resolves to the stored
// photo's URL so it can be saved in records and seen on other devices.
export const uploadRoomPhoto = async (roomId: string, uri: string, stage: string) => {
  const formData = new FormData();
  formData.append('files', { uri, name: `room-${roomId}-${stage}-${Date.now()}.jpg`, type: 'image/jpeg' } as unknown as Blob);
  const body = await request<Json>(`/rooms/${encodeURIComponent(roomId)}/photos`, {
    method: 'POST',
    // Do NOT set 'multipart/form-data' explicitly: without the boundary parameter
    // (which only the native FormData/XHR layer can compute) the server can't parse the
    // body. Clearing the instance's default 'application/json' lets it be auto-set.
    headers: { 'Content-Type': undefined },
    data: formData,
  });
  return lastUploadedUrl(body);
};

export const updateHousekeepingStatus = (id: string, payload: Json) =>
  request<Json>(`/housekeeping/${encodeURIComponent(id)}/status`, {
    method: 'PATCH',
    data: payload,
  });

export const createHousekeeping = (payload: Json) =>
  request<Json>('/housekeeping', { method: 'POST', data: payload });

export const createRecord = (kind: string, payload: Json) =>
  request<Json>(`/records/${encodeURIComponent(kind)}`, { method: 'POST', data: payload });

// The backend's ChargeDto is untyped in the API spec (no documented fields), so this
// payload shape is a best-effort guess following the camelCase convention used by the
// backend's other DTOs (e.g. OpenCashShiftDto). Callers should treat failures as
// non-fatal until the real shape is confirmed against a live account.
export const chargeMinibar = (payload: Json) =>
  request<Json>('/minibar/charges', { method: 'POST', data: payload });

export const updateRecord = (kind: string, id: string, payload: Json) =>
  request<Json>(`/records/${encodeURIComponent(kind)}/${encodeURIComponent(id)}`, {
    method: 'PATCH',
    data: payload,
  });

export const deleteRecord = (kind: string, id: string) =>
  request<Json>(`/records/${encodeURIComponent(kind)}/${encodeURIComponent(id)}`, { method: 'DELETE' });

// Front desk. Response shapes aren't in the OpenAPI spec; field names follow the web PMS.
export const getBookingsTimeline = (from: string, to: string) =>
  request<{ rooms?: unknown[]; bookings?: unknown[] }>(`/bookings/timeline?from=${from}&to=${to}`);
export const getBooking = (id: string) => request<unknown>(`/bookings/${encodeURIComponent(id)}`);
export const listRoomTypes = () => request<unknown[]>('/rooms/types');
export const checkInBooking = (id: string, payload: { roomId?: string; earlyCheckIn?: boolean } = {}) =>
  request<unknown>(`/bookings/${encodeURIComponent(id)}/check-in`, { method: 'POST', data: payload });
export const checkOutBooking = (id: string, payload: Record<string, unknown> = {}) =>
  request<unknown>(`/bookings/${encodeURIComponent(id)}/check-out`, { method: 'POST', data: payload });
export const cancelBooking = (id: string, payload: Record<string, unknown> = {}) =>
  request<unknown>(`/bookings/${encodeURIComponent(id)}/cancel`, { method: 'POST', data: payload });
// Booking documents (web PMS: bookings → «Документы»). An issue is a saved copy of a rendered template.
export interface DocumentIssue {
  id: string;
  code: string;
  title?: string;
  html: string;
  bookingId?: string | null;
  createdAt?: string;
  issuedByName?: string;
}
export const listDocumentIssues = (bookingId: string) =>
  request<DocumentIssue[]>(`/documents/issues?bookingId=${encodeURIComponent(bookingId)}`);
export const issueDocuments = (payload: { code?: string; codes?: string[]; bookingId: string; html?: string }) =>
  request<DocumentIssue[]>('/documents/issue', { method: 'POST', data: payload });
export const renderDocument = (payload: { code: string; bookingId: string }) =>
  request<{ html: string }>('/documents/render', { method: 'POST', data: payload });
export const updateDocumentIssue = (id: string, html: string) =>
  request<DocumentIssue>(`/documents/issues/${encodeURIComponent(id)}`, { method: 'PATCH', data: { html } });
export const getAvailableRoomIds = (checkIn: string, checkOut: string) =>
  request<string[]>(`/bookings/available-rooms?checkIn=${checkIn}&checkOut=${checkOut}`);
// { allocations: [{ roomId, roomNumber, floor, capacity, guestsCount }], guestsPlaced, guestsUnplaced }
export const suggestGroupRooms = (checkIn: string, checkOut: string, guests: number, roomsNeeded?: number) =>
  request<unknown>('/bookings/suggest-group-rooms', {
    params: { checkIn, checkOut, guests: String(guests), ...(roomsNeeded ? { roomsNeeded: String(roomsNeeded) } : {}) },
  });
export const createBooking = (payload: Record<string, unknown>) => request<unknown>('/bookings', { method: 'POST', data: payload });
// Body as the web PMS sends it: group fields + contact* + allocations[{ roomId, guestsCount, adults, children, guests }].
export const createGroupBooking = (payload: Record<string, unknown>) =>
  request<unknown>('/bookings/group', { method: 'POST', data: payload });
export const listTariffs = () => request<unknown[]>('/catalogs/tariffs');
export const listServicesCatalog = () => request<unknown[]>('/catalogs/services');
export const listCompanies = () => request<unknown[]>('/companies');
export const searchGuests = (q: string) => request<unknown[]>('/guests', { params: { q } });
export const updateBooking = (id: string, payload: Record<string, unknown>) =>
  request<unknown>(`/bookings/${encodeURIComponent(id)}`, { method: 'PATCH', data: payload });

// Payment towards the booking balance; an amount above the balance is kept as a deposit.
export const payBooking = (id: string, payload: { amount: number; accountId: string; recordDeposit?: boolean }) =>
  request<unknown>(`/bookings/${encodeURIComponent(id)}/payments`, { method: 'POST', data: payload });

export const updateGuestProfile = (id: string, payload: Record<string, unknown>) =>
  request<unknown>(`/guests/${encodeURIComponent(id)}`, { method: 'PATCH', data: payload });

export const listParkingSpots = () => request<unknown[]>('/parking/spots');

export const listParkingTickets = (status: 'OPEN' | 'CLOSED' = 'OPEN') =>
  request<unknown[]>(`/parking/tickets?status=${status}`);

// Confirmed live against the real API: only plateNumber is required, the rest are
// optional. See ParkingSession/ParkingSpot in types/index.ts for the mapped shape.
export const checkInParking = (payload: { plateNumber: string; spotId?: string; guestName?: string; notes?: string }) =>
  request<Json>('/parking/tickets', { method: 'POST', data: payload });

export const checkOutParking = (ticketId: string) =>
  request<Json>(`/parking/tickets/${encodeURIComponent(ticketId)}/checkout`, { method: 'POST' });

// CreateStaffDto / UpdateStaffDto — fully documented in /docs-json (unlike most of this
// file's other DTOs). `position` drives the coarse role; `appAccess` is the per-module
// permission set shown as toggles on the staff-member screen.
export const createStaff = (payload: Json) => request<Json>('/staff', { method: 'POST', data: payload });

export const updateStaff = (id: string, payload: Json) =>
  request<Json>(`/staff/${encodeURIComponent(id)}`, { method: 'PATCH', data: payload });

export const deleteStaff = (id: string) =>
  request<Json>(`/staff/${encodeURIComponent(id)}`, { method: 'DELETE' });

// Response shapes for these three are undocumented in /docs-json (no schema on the 200),
// so mapRestaurantToday/mapRestaurantHall in app-store.tsx read them defensively.
export const getRestaurantToday = (date: string) => request<Json>(`/restaurant/today?date=${encodeURIComponent(date)}`);

export const getRestaurantHall = (date: string, meal: 'breakfast' | 'lunch' | 'dinner') =>
  request<Json>(`/restaurant/hall?date=${encodeURIComponent(date)}&meal=${meal}`);

export const saveMealAttendance = (payload: {
  bookingId: string;
  attended: boolean;
  date?: string;
  meal?: 'breakfast' | 'lunch' | 'dinner';
  guestsCount?: number;
}) => request<Json>('/restaurant/attendance', { method: 'PUT', data: payload });

// Staff chat. Response shapes are undocumented in /docs-json; they're taken from the web
// PMS client (app.sollviera.com), which maps the same endpoints:
//   GET  /chat/inbox → { currentUserId, staff: [{ user, conversationId|null, lastMessage|null,
//        unreadCount }], groups: [{ id, title, members, lastMessage|null, unreadCount }] }
//   POST /chat/direct { userId } → conversation { id, kind: 'DIRECT'|'GROUP', title, members, peer }
//   GET  /chat/conversations/:id/messages → [{ id, conversationId, senderId, senderName, body,
//        createdAt, attachments }]
// There is no realtime channel (no socket.io on the API), so callers poll.
export const getChatInbox = () => request<Json>('/chat/inbox');

export const openDirectChat = (userId: string) =>
  request<Json>('/chat/direct', { method: 'POST', data: { userId } });

export const listChatMessages = (conversationId: string) =>
  request<unknown[]>(`/chat/conversations/${encodeURIComponent(conversationId)}/messages`);

// The endpoint is multipart (it also accepts `files`), same Content-Type caveat as
// uploadRoomPhoto above.
export const sendChatMessage = (conversationId: string, body: string, photoUris: string[] = []) => {
  const formData = new FormData();
  if (body) formData.append('body', body);
  photoUris.forEach((uri, i) => {
    formData.append('files', { uri, name: `photo-${Date.now()}-${i}.jpg`, type: 'image/jpeg' } as unknown as Blob);
  });
  return request<Json>(`/chat/conversations/${encodeURIComponent(conversationId)}/messages`, {
    method: 'POST',
    headers: { 'Content-Type': undefined },
    data: formData,
  });
};

export const markChatRead = (conversationId: string) =>
  request<Json>(`/chat/conversations/${encodeURIComponent(conversationId)}/read`, { method: 'POST' });

// ── Shifts (attendance) ────────────────────────────────────────────────────────
// A shift is opened/closed by scanning the rotating QR on the front-desk screen (POST
// /staff/attendance/scan). Inside an open shift the employee can go on break and come back
// (presence). Without an attendance shift, the coarse staff.shiftStatus flag (PATCH
// /staff/me) is what the web PMS shows as "на смене/перерыв".
export type ShiftStatusValue = 'ON_SHIFT' | 'ON_BREAK' | 'SHIFT_ENDED';

// Desk QR payloads start with this; personal login QRs start with LOGIN_QR_PREFIX.
export const SHIFT_QR_PREFIX = 'RHPMS-ATT|';
export const LOGIN_QR_PREFIX = 'RHPMS-LOGIN|';

// A scanned QR is either the bare payload or a link carrying it in a query parameter.
// Returns the payload when it has the given prefix.
export function qrPayloadFrom(raw: string, prefix: string): string | null {
  const value = raw.trim();
  if (value.startsWith(prefix)) return value;
  try {
    return Array.from(new URL(value).searchParams.values()).map((v) => v.trim()).find((v) => v.startsWith(prefix)) ?? null;
  } catch {
    return null; // Not a URL.
  }
}

// Personal login QR (issued in the PMS: Settings → Staff), RHPMS-LOGIN|1.<tenant>.… — the
// code itself names the hotel. Unlike login() this doesn't save the session: the app first
// shows whose account it is, and startSession() runs once the employee confirms.
export async function qrLogin(token: string): Promise<ApiSession> {
  const qrTenant = token.slice(LOGIN_QR_PREFIX.length).split('.')[1];
  const body = await request<ApiSession>('/auth/qr-login', {
    method: 'POST',
    headers: qrTenant ? { 'X-Tenant-Slug': qrTenant } : {},
    data: { token },
  });
  // The login response has no name; /staff/me does (but its tenantSlug is null, so only
  // the profile fields are taken from it).
  const me = await request<ApiUser>('/staff/me', {
    headers: { Authorization: `Bearer ${body.accessToken}`, 'X-Tenant-Slug': body.user.tenantSlug || qrTenant || DEFAULT_TENANT_SLUG },
  }).catch(() => null);
  return {
    ...body,
    user: {
      ...body.user,
      fullName: me?.fullName || body.user.fullName,
      department: me?.department || body.user.department,
      badgeNumber: me?.badgeNumber || body.user.badgeNumber,
    },
  };
}

export const startSession = (value: ApiSession) => saveSession(value);

// Response (from the web PMS client): { action: 'opened' | 'closed', shiftStatus, … }.
export const scanAttendanceQr = (token: string, action: 'open' | 'close' | 'toggle' = 'toggle') =>
  request<Json>('/staff/attendance/scan', { method: 'POST', data: { token, action } });

export const getMyAttendance = () => request<Json | null>('/staff/attendance/mine');

export const setAttendancePresence = (status: 'ON_SHIFT' | 'ON_BREAK') =>
  request<Json>('/staff/attendance/presence', { method: 'POST', data: { status } });

// Open shifts of the whole team: [{ id, employee_id, employee: { name, position },
// start_time, opened_at, shiftStatus }] (shape from the web PMS mapper).
export const listOnShift = () => request<unknown[]>('/staff/attendance/on-shift');

// ── Own profile ────────────────────────────────────────────────────────────────
export const updateMe = (payload: { fullName?: string; email?: string; phone?: string; shiftStatus?: ShiftStatusValue }) =>
  request<Json>('/staff/me', { method: 'PATCH', data: payload });

export const changeMyPassword = (currentPassword: string, newPassword: string) =>
  request<Json>('/staff/me/password', { method: 'POST', data: { currentPassword, newPassword } });

// ── Password reset (no session) ────────────────────────────────────────────────
// forgot-password emails a 6-digit code; reset-password exchanges it for a new password.
export const requestPasswordReset = (email: string, requestedTenantSlug = DEFAULT_TENANT_SLUG) =>
  request<Json>('/auth/forgot-password', {
    method: 'POST',
    headers: { 'X-Tenant-Slug': requestedTenantSlug },
    data: { email, tenantSlug: requestedTenantSlug },
  });

export const resetPassword = (email: string, code: string, newPassword: string, requestedTenantSlug = DEFAULT_TENANT_SLUG) =>
  request<Json>('/auth/reset-password', {
    method: 'POST',
    headers: { 'X-Tenant-Slug': requestedTenantSlug },
    data: { email, code, newPassword, tenantSlug: requestedTenantSlug },
  });

// ── Bookings ───────────────────────────────────────────────────────────────────
// Bookings overlapping [from, to] (YYYY-MM-DD). Each: { id, roomId, room, guest,
// checkInDate, checkOutDate, status, adults, children, specialRequests, … }.
export const listBookings = (from: string, to: string) =>
  request<unknown>(`/bookings?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`);

// Lunchbox orders: [{ id, bookingId, readyAt, quantity, notes, … }]
export const listLunchboxOrders = (bookingId: string) =>
  request<unknown>(`/bookings/${encodeURIComponent(bookingId)}/lunchbox-orders`);

export const createLunchboxOrder = (bookingId: string, payload: { readyAt: string; quantity: number; notes?: string }) =>
  request<Json>(`/bookings/${encodeURIComponent(bookingId)}/lunchbox-orders`, { method: 'POST', data: payload });

export const cancelLunchboxOrder = (bookingId: string, orderId: string) =>
  request<Json>(`/bookings/${encodeURIComponent(bookingId)}/lunchbox-orders/${encodeURIComponent(orderId)}`, { method: 'DELETE' });

// ── Chat extras ────────────────────────────────────────────────────────────────
export const createChatGroup = (title: string, memberIds: string[]) =>
  request<Json>('/chat/groups', { method: 'POST', data: { title, memberIds } });

// Chat attachment URLs may come back relative to the API host ("/uploads/…"); they are
// served behind the same auth, so images need the bearer token too.
// Image source for a photo that is either a file on this device (just taken/picked) or a
// server URL (needs the auth headers, see fileSource).
export function photoSource(uri: string) {
  return /^(file|content|ph|assets-library|data|blob):/.test(uri) ? { uri } : fileSource(uri);
}

export function fileSource(url: string) {
  const absolute = /^https?:\/\//.test(url) ? url : `${API_BASE_URL.replace(/\/api$/, '')}${url.startsWith('/') ? '' : '/'}${url}`;
  const token = getStoredSession()?.accessToken;
  return token ? { uri: absolute, headers: { Authorization: `Bearer ${token}`, 'X-Tenant-Slug': tenantSlug() } } : { uri: absolute };
}
