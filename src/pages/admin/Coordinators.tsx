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
  const pollInFlightRef = useRef(false);

  const load = useCallback(async (silent = false) => {
    if (silent && pollInFlightRef.current) return;
    pollInFlightRef.current = true;
    if (!silent) setLoading(true);
    try {
      const res = await fetchCoordinators();
      if (res && Array.isArray(res.items)) {
        const nextItems = res.items;
        setAccounts((prev) =>
          JSON.stringify(prev) === JSON.stringify(nextItems) ? prev : nextItems
        );
      }
    } catch {
      // ignore transient silent poll failures
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
    }, 1000);
    return () => window.clearInterval(intervalId);
  }, [load]);

  const handleCreate = async (payload: {
    full_name: string;
    phone_number: string;
    passcode: string;
  }) => {
    const created = await createCoordinator(payload);
    setAccounts((prev) => [created, ...prev]);
  };

  const handleUpdate = async (
    id: string,
    payload: { full_name?: string; phone_number?: string; is_active?: boolean }
  ) => {
    const updated = await updateCoordinator(id, payload);
    setAccounts((prev) => prev.map((a) => (a.id === id ? updated : a)));
  };

  const handleResetPasscode = async (
    id: string,
    payload: { passcode: string }
  ) => {
    await resetCoordinatorPasscode(id, payload);
  };

  return (
    <AdminLayout pageTitle="Coordinator Management" requireSuperAdmin={true}>
      <div className="space-y-4">
        <div>
          <h2 className="font-heading text-2xl font-extrabold text-[#5a0f14]">
            Coordinator Management
          </h2>
          <p className="mt-1 text-sm text-[#4a4642]">
            Create coordinator accounts, reset 6-digit passcodes, and manage active organizer access.
          </p>
        </div>

        <CoordinatorManagement
          accounts={accounts}
          loading={loading}
          onCreate={handleCreate}
          onUpdate={handleUpdate}
          onResetPasscode={handleResetPasscode}
        />
      </div>
    </AdminLayout>
  );
}
