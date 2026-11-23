import { useCallback, useEffect, useRef, useState } from 'react';
import { AdminLayout } from '../../components/admin/AdminLayout.tsx';
import { RegistrationTable } from '../../components/admin/RegistrationTable.tsx';
import { useAuth } from '../../hooks/useAuth.tsx';
import { useEventSettings } from '../../hooks/useEventSettings.ts';
import {
  deleteRegistrationByAdmin,
  fetchRegistrations,
  updateRegistrationBySuperAdmin,
} from '../../services/adminService.ts';
import type {
  FoodPreference,
  RegistrationRecord,
} from '../../types/database.types.ts';

export function Registrations() {
  const { admin } = useAuth();
  const { settings } = useEventSettings();

  const [items, setItems] = useState<RegistrationRecord[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);

  const [q, setQ] = useState('');
  const [food, setFood] = useState('');
  const [talent, setTalent] = useState('');
  const [sortBy, setSortBy] = useState('created_at');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');

  const hasLoadedOnceRef = useRef(false);
  const pollInFlightRef = useRef(false);

  const load = useCallback(
    async (silent = false) => {
      if (silent && pollInFlightRef.current) return;
      pollInFlightRef.current = true;
      if (!silent && !hasLoadedOnceRef.current) {
        setLoading(true);
      }
      try {
        const res = await fetchRegistrations({
          q: q || undefined,
          food: food || undefined,
          talent: talent || undefined,
          sortBy,
          sortDir,
          page,
          pageSize: 15,
        });
        if (res && typeof res === 'object') {
          const nextItems = Array.isArray(res.items) ? res.items : [];
          const nextTotal = typeof res.total === 'number' ? res.total : 0;
          const nextTotalPages =
            typeof res.totalPages === 'number' ? res.totalPages : 1;
          setItems((prev) =>
            JSON.stringify(prev) === JSON.stringify(nextItems) ? prev : nextItems
          );
          setTotal((prev) => (prev === nextTotal ? prev : nextTotal));
          setTotalPages((prev) =>
            prev === nextTotalPages ? prev : nextTotalPages
          );
          hasLoadedOnceRef.current = true;
        }
      } catch {
        // retain current rows cleanly during silent background refresh
      } finally {
        pollInFlightRef.current = false;
        if (!silent) setLoading(false);
      }
    },
    [q, food, talent, sortBy, sortDir, page]
  );

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void load(false);
    }, 150);
    return () => window.clearTimeout(timer);
  }, [load]);

  useEffect(() => {
    const intervalId = window.setInterval(() => {
      if (document.visibilityState === 'visible') {
        void load(true);
      }
    }, 1000);
    return () => window.clearInterval(intervalId);
  }, [load]);

  const handleSortChange = (col: string) => {
    if (sortBy === col) {
      setSortDir((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortBy(col);
      setSortDir('asc');
    }
    setPage(1);
  };

  const handleResetFilters = () => {
    setQ('');
    setFood('');
    setTalent('');
    setPage(1);
  };

  const handleSaveEdit = async (
    id: string,
    payload: {
      student_name: string;
      selected_talents: string[];
      other_talent_description: string | null;
      food_preference: FoodPreference;
    }
  ) => {
    const updated = await updateRegistrationBySuperAdmin(id, payload);
    setItems((prev) => prev.map((r) => (r.id === id ? updated : r)));
  };

  const handleDeleteRecord = async (id: string) => {
    await deleteRegistrationByAdmin(id);
    const shouldStepBack = items.length <= 1 && page > 1;
    setItems((prev) => prev.filter((r) => r.id !== id));
    setTotal((prev) => Math.max(0, prev - 1));
    if (shouldStepBack) {
      setPage((prev) => Math.max(1, prev - 1));
    } else {
      void load(true);
    }
  };

  return (
    <AdminLayout pageTitle="Registrations">
      <div className="space-y-4">
        <div>
          <h2 className="font-heading text-2xl font-extrabold text-[#5a0f14]">
            Registration Management
          </h2>
          <p className="mt-1 text-sm text-[#4a4642]">
            Search, filter, edit, or permanently delete student registration records.
          </p>
        </div>

        <RegistrationTable
          items={items}
          total={total}
          page={page}
          totalPages={totalPages}
          loading={loading}
          isSuperAdmin={admin?.role === 'super_admin'}
          settings={settings}
          q={q}
          food={food}
          talent={talent}
          sortBy={sortBy}
          sortDir={sortDir}
          onQueryChange={(val) => {
            setQ(val);
            setPage(1);
          }}
          onFoodChange={(val) => {
            setFood(val);
            setPage(1);
          }}
          onTalentChange={(val) => {
            setTalent(val);
            setPage(1);
          }}
          onSortChange={handleSortChange}
          onPageChange={setPage}
          onResetFilters={handleResetFilters}
          onSaveEdit={handleSaveEdit}
          onDeleteRecord={handleDeleteRecord}
        />
      </div>
    </AdminLayout>
  );
}
