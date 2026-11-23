import { apiFetch } from './apiClient.ts';
import type { PassVerificationResult } from '../types/database.types.ts';

export async function verifyPassToken(
  token: string,
  passNumber?: string
): Promise<PassVerificationResult> {
  const params = new URLSearchParams({ token });
  if (passNumber) {
    params.set('reg', passNumber);
  }
  return apiFetch<PassVerificationResult>(`/api/verify?${params.toString()}`);
}
