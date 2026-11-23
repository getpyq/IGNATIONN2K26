import { apiFetch } from './apiClient.ts';
import type { RegistrationRecord } from '../types/database.types.ts';

export interface ExportFilterParams {
  food?: string;
  talent?: string;
  from?: string;
  to?: string;
  ids?: string[];
}

export async function fetchExportDataset(
  filters: ExportFilterParams
): Promise<RegistrationRecord[]> {
  const params = new URLSearchParams();
  if (filters.food) params.set('food', filters.food);
  if (filters.talent) params.set('talent', filters.talent);
  if (filters.from) params.set('from', filters.from);
  if (filters.to) params.set('to', filters.to);
  if (filters.ids && filters.ids.length > 0) {
    params.set('ids', filters.ids.join(','));
  }
  const res = await apiFetch<{ items: RegistrationRecord[] }>(
    `/api/admin/registrations/export?${params.toString()}`
  );
  return res.items;
}
