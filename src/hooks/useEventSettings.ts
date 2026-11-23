import { useCallback, useEffect, useRef, useState } from 'react';
import { fetchPublicEventSettings } from '../services/registrationService.ts';
import type { EventSettings } from '../types/database.types.ts';

export const DEFAULT_SETTINGS: EventSettings = {
  id: 'default',
  event_name: 'IGNITION 2K26',
  event_tagline: 'THE FRESHERS WELCOME CELEBRATION',
  department_name: 'Department of Mechanical Engineering',
  institution_name: 'Parala Maharaja Engineering College',
  event_date: '5 December 2026 · 10:00 AM',
  event_venue: 'Seminar Hall (Room No-217)',
  event_description:
    'Step into a mystery crafted just for you — hidden surprises, live music, thrilling performances, and unforgettable moments await behind the curtain.',
  registration_open: true,
  maximum_registrations: 500,
  updated_at: new Date().toISOString(),
  current_registrations: 0,
};

export function normalizeEventSettings(raw: unknown): EventSettings {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) {
    return DEFAULT_SETTINGS;
  }
  const obj = raw as Partial<EventSettings>;
  return {
    ...DEFAULT_SETTINGS,
    ...obj,
    event_name: obj.event_name || DEFAULT_SETTINGS.event_name,
    event_tagline: obj.event_tagline || DEFAULT_SETTINGS.event_tagline,
    department_name: obj.department_name || DEFAULT_SETTINGS.department_name,
    institution_name:
      obj.institution_name || DEFAULT_SETTINGS.institution_name,
    event_date: obj.event_date || DEFAULT_SETTINGS.event_date,
    event_venue: obj.event_venue || DEFAULT_SETTINGS.event_venue,
    event_description:
      obj.event_description || DEFAULT_SETTINGS.event_description,
    registration_open:
      typeof obj.registration_open === 'boolean'
        ? obj.registration_open
        : DEFAULT_SETTINGS.registration_open,
    maximum_registrations:
      typeof obj.maximum_registrations === 'number' &&
      Number.isFinite(obj.maximum_registrations)
        ? obj.maximum_registrations
        : DEFAULT_SETTINGS.maximum_registrations,
    current_registrations:
      typeof obj.current_registrations === 'number' &&
      Number.isFinite(obj.current_registrations)
        ? obj.current_registrations
        : 0,
  };
}

let cachedSettings: EventSettings | null = null;

export function useEventSettings() {
  const [settings, setSettingsState] = useState<EventSettings>(
    cachedSettings ?? DEFAULT_SETTINGS
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const pollInFlightRef = useRef(false);

  const setSettings = useCallback((next: EventSettings | null | undefined) => {
    const normalized = normalizeEventSettings(next);
    cachedSettings = normalized;
    setSettingsState((prev) =>
      JSON.stringify(prev) === JSON.stringify(normalized) ? prev : normalized
    );
  }, []);

  const reload = useCallback(async (silent = false) => {
    if (silent && pollInFlightRef.current) return;
    pollInFlightRef.current = true;
    if (!silent) setError(null);
    try {
      const data = await fetchPublicEventSettings();
      const normalized = normalizeEventSettings(data);
      cachedSettings = normalized;
      setSettingsState((prev) =>
        JSON.stringify(prev) === JSON.stringify(normalized) ? prev : normalized
      );
    } catch (err) {
      if (!silent) {
        setError(
          err instanceof Error ? err.message : 'Unable to load event settings.'
        );
      }
    } finally {
      pollInFlightRef.current = false;
      if (!silent) setLoading(false);
    }
  }, []);

  useEffect(() => {
    void reload(false);
  }, [reload]);

  useEffect(() => {
    const intervalId = window.setInterval(() => {
      if (document.visibilityState === 'visible') {
        void reload(true);
      }
    }, 1000);
    return () => window.clearInterval(intervalId);
  }, [reload]);

  return { settings, setSettings, loading, error, reload };
}
