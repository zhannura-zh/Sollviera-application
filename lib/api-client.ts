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

// `stage` tags the photo: 'before'/'after' for the overall room shot, or a checklist zone
// name (e.g. 'BEDROOM') for a per-zone photo — the API doesn't constrain it to an enum.
export const uploadRoomPhoto = (roomId: string, uri: string, stage: string) => {
  const formData = new FormData();
  formData.append('file', { uri, name: `room-${roomId}-${stage}.jpg`, type: 'image/jpeg' } as unknown as Blob);
  formData.append('stage', stage);
  return request<Json>(`/rooms/${encodeURIComponent(roomId)}/photos`, {
    method: 'POST',
    // Do NOT set 'multipart/form-data' explicitly: without the boundary parameter
    // (which only the native FormData/XHR layer can compute) the server can't parse the
    // body. Clearing the instance's default 'application/json' lets it be auto-set.
    headers: { 'Content-Type': undefined },
    data: formData,
  });
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

export const listParkingSpots = () => request<unknown[]>('/parking/spots');

export const listParkingTickets = (status: 'OPEN' | 'CLOSED' = 'OPEN') =>
  request<unknown[]>(`/parking/tickets?status=${status}`);

// Confirmed live against the real API: only plateNumber is required, the rest are
// optional. See ParkingSession/ParkingSpot in types/index.ts for the mapped shape.
export const checkInParking = (payload: { plateNumber: string; spotId?: string; guestName?: string; notes?: string }) =>
  request<Json>('/parking/tickets', { method: 'POST', data: payload });

export const checkOutParking = (ticketId: string) =>
  request<Json>(`/parking/tickets/${encodeURIComponent(ticketId)}/checkout`, { method: 'POST' });
