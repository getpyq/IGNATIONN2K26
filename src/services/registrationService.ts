import { apiFetch } from './apiClient.ts';
import type {
  EventSettings,
  FoodPreference,
  RegistrationSubmitResponse,
} from '../types/database.types.ts';

export interface SubmitRegistrationInput {
  student_name: string;
  selected_talents: string[];
  other_talent_description: string | null;
  food_preference: FoodPreference;
}

export async function fetchPublicEventSettings(): Promise<EventSettings> {
  return apiFetch<EventSettings>('/api/settings/public');
}

export async function submitStudentRegistration(
  payload: SubmitRegistrationInput
): Promise<RegistrationSubmitResponse> {
  return apiFetch<RegistrationSubmitResponse>('/api/registrations', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}
