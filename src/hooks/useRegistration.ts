import { useCallback, useState } from 'react';
import { submitStudentRegistration } from '../services/registrationService.ts';
import type {
  FoodPreference,
  RegistrationSubmitResponse,
} from '../types/database.types.ts';

export type StudentJourneyStep =
  | 'welcome'
  | 'personalized_welcome'
  | 'talents'
  | 'food'
  | 'review'
  | 'celebration'
  | 'poster'
  | 'pass';

export interface RegistrationDraft {
  student_name: string;
  selected_talents: string[];
  other_talent_description: string;
  food_preference: FoodPreference | null;
}

function createDraft(): RegistrationDraft {
  return {
    student_name: '',
    selected_talents: [],
    other_talent_description: '',
    food_preference: null,
  };
}

export function useRegistration() {
  const [step, setStep] = useState<StudentJourneyStep>('welcome');
  const [draft, setDraft] = useState<RegistrationDraft>(createDraft);
  const [submittedRecord, setSubmittedRecord] =
    useState<RegistrationSubmitResponse | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const updateDraft = useCallback((patch: Partial<RegistrationDraft>) => {
    setDraft((prev) => ({ ...prev, ...patch }));
  }, []);

  const toggleTalent = useCallback((talent: string) => {
    setDraft((prev) => {
      const exists = prev.selected_talents.includes(talent);
      const next = exists
        ? prev.selected_talents.filter((t) => t !== talent)
        : [...prev.selected_talents, talent];
      return {
        ...prev,
        selected_talents: next,
        other_talent_description:
          talent === 'Other' && exists ? '' : prev.other_talent_description,
      };
    });
  }, []);

  const submit = useCallback(async () => {
    if (!draft.food_preference) {
      setSubmitError('Please select a food preference.');
      return null;
    }
    setSubmitting(true);
    setSubmitError(null);
    try {
      const response = await submitStudentRegistration({
        student_name: draft.student_name.trim().replace(/\s+/g, ' '),
        selected_talents: draft.selected_talents,
        other_talent_description: draft.selected_talents.includes('Other')
          ? draft.other_talent_description.trim() || null
          : null,
        food_preference: draft.food_preference,
      });
      if (!response || typeof response !== 'object' || !response.pass_number) {
        throw new Error(
          'Unexpected response while saving registration. Please try again.'
        );
      }
      setSubmittedRecord(response);
      setStep('celebration');
      return response;
    } catch (err) {
      const msg =
        err instanceof Error
          ? err.message
          : 'Registration failed. Please check your connection and retry.';
      setSubmitError(msg);
      return null;
    } finally {
      setSubmitting(false);
    }
  }, [draft]);

  const resetJourney = useCallback(() => {
    setDraft(createDraft());
    setSubmittedRecord(null);
    setSubmitError(null);
    setStep('welcome');
  }, []);

  return {
    step,
    setStep,
    draft,
    updateDraft,
    toggleTalent,
    submittedRecord,
    submitting,
    submitError,
    submit,
    resetJourney,
  };
}
