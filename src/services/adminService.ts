import { apiFetch, setInMemoryAuthToken } from './apiClient.ts';
import type {
  AdminAccountPublic,
  AdminOverviewSummary,
  CheckInListResponse,
  CheckInScanResponse,
  RegistrationRecord,
} from '../types/database.types.ts';

export interface AuthResponse {
  admin: AdminAccountPublic;
  token: string;
}

export async function getBootstrapStatus(): Promise<{
  configured: boolean;
  initialized: boolean;
}> {
  return apiFetch('/api/admin/bootstrap-status');
}

export async function bootstrapSuperAdmin(payload: {
  full_name: string;
  phone_number: string;
  passcode: string;
}): Promise<AuthResponse> {
  const res = await apiFetch<AuthResponse>('/api/admin/bootstrap', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
  setInMemoryAuthToken(res.token);
  return res;
}

export async function loginAdmin(payload: {
  phone_number: string;
  passcode: string;
}): Promise<AuthResponse> {
  const res = await apiFetch<AuthResponse>('/api/admin/login', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
  setInMemoryAuthToken(res.token);
  return res;
}

export async function logoutAdmin(): Promise<void> {
  try {
    await apiFetch('/api/admin/logout', { method: 'POST' });
  } finally {
    setInMemoryAuthToken(null);
  }
}

export async function fetchCurrentAdmin(): Promise<{
  admin: AdminAccountPublic;
  token?: string;
}> {
  const res = await apiFetch<{ admin: AdminAccountPublic; token?: string }>(
    '/api/admin/me'
  );
  if (res.token) {
    setInMemoryAuthToken(res.token);
  }
  return res;
}

let cachedOverview: AdminOverviewSummary | null = null;
let cachedCheckInList: CheckInListResponse | null = null;

export function getCachedAdminOverview(): AdminOverviewSummary | null {
  return cachedOverview;
}

export function getCachedCheckInList(): CheckInListResponse | null {
  return cachedCheckInList;
}

export async function fetchAdminOverview(): Promise<AdminOverviewSummary> {
  const data = await apiFetch<AdminOverviewSummary>('/api/admin/overview');
  cachedOverview = data;
  return data;
}

export interface RegistrationsQuery {
  q?: string;
  food?: string;
  talent?: string;
  from?: string;
  to?: string;
  sortBy?: string;
  sortDir?: 'asc' | 'desc';
  page?: number;
  pageSize?: number;
}

export interface PaginatedRegistrations {
  items: RegistrationRecord[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export async function fetchRegistrations(
  query: RegistrationsQuery
): Promise<PaginatedRegistrations> {
  const params = new URLSearchParams();
  if (query.q) params.set('q', query.q);
  if (query.food) params.set('food', query.food);
  if (query.talent) params.set('talent', query.talent);
  if (query.from) params.set('from', query.from);
  if (query.to) params.set('to', query.to);
  if (query.sortBy) params.set('sortBy', query.sortBy);
  if (query.sortDir) params.set('sortDir', query.sortDir);
  if (query.page) params.set('page', String(query.page));
  if (query.pageSize) params.set('pageSize', String(query.pageSize));

  return apiFetch<PaginatedRegistrations>(
    `/api/admin/registrations?${params.toString()}`
  );
}

export async function updateRegistrationBySuperAdmin(
  id: string,
  payload: {
    student_name: string;
    selected_talents: string[];
    other_talent_description: string | null;
    food_preference: 'vegetarian' | 'non_vegetarian';
  }
): Promise<RegistrationRecord> {
  return apiFetch<RegistrationRecord>(`/api/admin/registrations/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  });
}

export async function scanCheckInCode(
  code: string,
  autoCheckin = true
): Promise<CheckInScanResponse> {
  return apiFetch<CheckInScanResponse>('/api/admin/checkin/scan', {
    method: 'POST',
    body: JSON.stringify({ code, auto_checkin: autoCheckin }),
  });
}

export async function manualCheckInStudent(
  id: string
): Promise<CheckInScanResponse> {
  return apiFetch<CheckInScanResponse>('/api/admin/checkin/manual', {
    method: 'POST',
    body: JSON.stringify({ id }),
  });
}

export async function fetchCheckInList(): Promise<CheckInListResponse> {
  const data = await apiFetch<CheckInListResponse>('/api/admin/checkin/list');
  cachedCheckInList = data;
  return data;
}

export async function fetchCoordinators(): Promise<{
  items: AdminAccountPublic[];
}> {
  return apiFetch('/api/admin/coordinators');
}

export async function createCoordinator(payload: {
  full_name: string;
  phone_number: string;
  passcode: string;
}): Promise<AdminAccountPublic> {
  return apiFetch('/api/admin/coordinators', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function updateCoordinator(
  id: string,
  payload: {
    full_name?: string;
    phone_number?: string;
    is_active?: boolean;
  }
): Promise<AdminAccountPublic> {
  return apiFetch(`/api/admin/coordinators/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  });
}

export async function resetCoordinatorPasscode(
  id: string,
  payload: { passcode: string }
): Promise<{ ok: boolean }> {
  return apiFetch(`/api/admin/coordinators/${id}/reset-passcode`, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}
