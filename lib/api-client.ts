import { AxiosError, AxiosRequestConfig, create } from 'axios';

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

let session: ApiSession | null = null;

function storage() {
  if (typeof globalThis === 'undefined' || !('localStorage' in globalThis)) return null;
  return globalThis.localStorage;
}

export function getStoredSession(): ApiSession | null {
  if (session) return session;
  const store = storage();
  if (!store) return null;
  const token = store.getItem('sollviera_access_token');
  const userJson = store.getItem('sollviera_user');
  if (!token || !userJson) return null;
  try {
    const user = JSON.parse(userJson) as ApiUser;
    session = { accessToken: token, user };
    return session;
  } catch {
    clearSession();
    return null;
  }
}

export function clearSession() {
  session = null;
  const store = storage();
  store?.removeItem('sollviera_access_token');
  store?.removeItem('sollviera_user');
  store?.removeItem('sollviera_tenant');
}

function saveSession(value: ApiSession) {
  session = value;
  const store = storage();
  store?.setItem('sollviera_access_token', value.accessToken);
  store?.setItem('sollviera_user', JSON.stringify(value.user));
  store?.setItem('sollviera_tenant', value.user.tenantSlug || DEFAULT_TENANT_SLUG);
}

function tenantSlug() {
  return storage()?.getItem('sollviera_tenant') || getStoredSession()?.user.tenantSlug || DEFAULT_TENANT_SLUG;
}

http.interceptors.request.use((config) => {
  const current = getStoredSession();
  config.headers.set('X-Tenant-Slug', config.headers.get('X-Tenant-Slug') || tenantSlug());
  if (current?.accessToken) config.headers.set('Authorization', `Bearer ${current.accessToken}`);
  return config;
});

async function request<T>(path: string, config: AxiosRequestConfig = {}) {
  try {
    const response = await http.request<T>({ ...config, url: path });
    return response.data;
  } catch (error) {
    const axiosError = error as AxiosError<Json>;
    if (axiosError.response?.status === 401) clearSession();
    const responseMessage = axiosError.response?.data?.message;
    const message = Array.isArray(responseMessage)
      ? responseMessage.join(', ')
      : responseMessage || axiosError.message || 'Network request failed';
    throw new Error(String(message));
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

export const updateRecord = (kind: string, id: string, payload: Json) =>
  request<Json>(`/records/${encodeURIComponent(kind)}/${encodeURIComponent(id)}`, {
    method: 'PATCH',
    data: payload,
  });
