export type FoodPreference = 'vegetarian' | 'non_vegetarian';

export type AdminRole = 'super_admin' | 'coordinator';

export const TALENT_OPTIONS = [
  {
    id: 'Singing',
    label: 'Singing',
    description: 'Solo vocals, acoustic melodies, or classical & modern tracks.',
    icon: 'Mic2',
  },
  {
    id: 'Dancing',
    label: 'Dancing',
    description: 'Freestyle, hip-hop, contemporary, or traditional choreography.',
    icon: 'Music2',
  },
  {
    id: 'Acting',
    label: 'Acting',
    description: 'Monologues, stage skits, mime, and dramatic storytelling.',
    icon: 'Drama',
  },
  {
    id: 'Poetry/Shayari',
    label: 'Poetry/Shayari',
    description: 'Spoken word, shayari, slam poetry, and original verses.',
    icon: 'Feather',
  },
  {
    id: 'Stand-up Comedy',
    label: 'Stand-up Comedy',
    description: 'Original observational humor, crowd work, and wit.',
    icon: 'Laugh',
  },
  {
    id: 'Anchoring',
    label: 'Anchoring',
    description: 'Stage hosting, crowd engagement, and live event emceeing.',
    icon: 'Mic',
  },
  {
    id: 'Other',
    label: 'Other',
    description: 'Beatboxing, magic, art, mimicry, or any unique showcase.',
    icon: 'Sparkles',
  },
] as const;

export type TalentName = (typeof TALENT_OPTIONS)[number]['id'];

export interface RegistrationRecord {
  id: string;
  student_name: string;
  selected_talents: string[];
  other_talent_description: string | null;
  food_preference: FoodPreference;
  event_expectations?: string | null;
  pass_number: string;
  created_at: string;
  checked_in?: boolean;
  checkin_time?: string | null;
  checked_in_by?: string | null;
  admin_qr_token?: string;
}

export interface RegistrationSubmitResponse {
  id: string;
  student_name: string;
  selected_talents: string[];
  other_talent_description: string | null;
  food_preference: FoodPreference;
  pass_number: string;
  verification_token: string;
  created_at: string;
  checked_in?: boolean;
  checkin_time?: string | null;
  checked_in_by?: string | null;
  deduplicated?: boolean;
}

export interface AdminAccountPublic {
  id: string;
  full_name: string;
  phone_number: string;
  role: AdminRole;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface EventSettings {
  id: string;
  event_name: string;
  event_tagline: string;
  department_name: string;
  institution_name: string;
  event_date: string;
  event_venue: string;
  event_description: string;
  registration_open: boolean;
  maximum_registrations: number;
  updated_at: string;
  current_registrations?: number;
}

export interface AdminOverviewSummary {
  total_registrations: number;
  checked_in_count: number;
  vegetarian_count: number;
  non_vegetarian_count: number;
  recent_registrations: RegistrationRecord[];
}

export interface CheckInScanResponse {
  record: RegistrationRecord;
  newly_checked_in: boolean;
  already_checked_in: boolean;
}

export interface CheckInListResponse {
  checked_in_list: RegistrationRecord[];
  all_students: RegistrationRecord[];
  checked_in_count: number;
  total_count: number;
}

export interface PassVerificationResult {
  verified: boolean;
  pass_number?: string;
  student_name?: string;
  event_name?: string;
  event_tagline?: string;
  department_name?: string;
  institution_name?: string;
  error?: string;
}
