import { useCallback, useEffect, useRef, useState } from 'react';
import { AdminLayout } from '../../components/admin/AdminLayout.tsx';
import { CoordinatorManagement } from '../../components/admin/CoordinatorManagement.tsx';
import {
  createCoordinator,
  fetchCoordinators,
  resetCoordinatorPasscode,
  updateCoordinator,
} from '../../services/adminService.ts';
import type { AdminAccountPublic } from '../../types/database.types.ts';

export function Coordinators() {
  const [accounts, setAccounts] = useState<AdminAccountPublic[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const hasLoadedOnceRef = useRef(false);
  const pollInFlightRef = useRef(false);

  const load = useCallback(async (silent = false) => {
    if (silent && pollInFlightRef.current) return;
    pollInFlightRef.current = true;
    if (!silent && !hasLoadedOnceRef.current) {
      setLoading(true);
    }
    try {
      const items = await fetchCoordinators();
      setAccounts((prev) =>
        JSON.stringify(prev) === JSON.stringify(items) ? prev : items
      );
      setError(null);
      hasLoadedOnceRef.current = true;
    } catch (err) {
      if (!silent) {
        setError(
          err instanceof Error ? err.message : 'Unable to load coordinators.'
        );
      }
    } finally {
      pollInFlightRef.current = false;
      if (!silent) setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load(false);
  }, [load]);

  useEffect(() => {
    const intervalId = window.setInterval(() => {
      if (document.visibilityState === 'visible') {
        void load(true);
      }
    }, 3000);
    return () => window.clearInterval(intervalId);
  }, [load]);

  const handleCreate = async (payload: {
    full_name: string;
    phone_number: string;
    passcode: string;
  }) => {
    const created = await createCoordinator(payload);
    setAccounts((prev) => [...prev, created]);
    return created;
  };

  const handleUpdate = async (
    id: string,
    payload: {
      full_name?: string;
      phone_number?: string;
      is_active?: boolean;
    }
  ) => {
    const updated = await updateCoordinator(id, payload);
    setAccounts((prev) => prev.map((a) => (a.id === id ? updated : a)));
    return updated;
  };

  const handleResetPasscode = async (id: string, passcode: string) => {
    await resetCoordinatorPasscode(id, passcode);
  };

  return (
    <AdminLayout pageTitle="Coordinator Management" requireSuperAdmin={true}>
      <div className="space-y-4">
        <div>
          <h2 className="font-heading text-2xl font-extrabold text-[#5a0f14]">
            Coordinator Management
          </h2>
          <p className="mt-1 text-sm text-[#4a4642]">
            Only the Primary Admin can add or manage coordinators. Coordinators receive Overview, Check-In Scanner, and Registration view/edit access without deletion rights.
          </p>
        </div>

        {error && (
          <div className="rounded-xl border-2 border-[#c8221a] bg-white p-3 text-xs font-bold text-[#c8221a]">
            {error}
          </div>
        )}

        <CoordinatorManagement
          accounts={accounts}
          loading={loading}
          onCreateCoordinator={handleCreate}
          onUpdateCoordinator={handleUpdate}
          onResetPasscode={handleResetPasscode}
        />
      </div>
    </AdminLayout>
  );
}
