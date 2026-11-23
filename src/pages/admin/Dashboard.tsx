import { useCallback, useEffect, useRef, useState } from 'react';
import { Leaf, UserCheck, Users, Utensils } from 'lucide-react';
import { AdminLayout } from '../../components/admin/AdminLayout.tsx';
import { ExportCenter } from '../../components/admin/ExportCenter.tsx';
import { StatCard } from '../../components/admin/StatCard.tsx';
import { useEventSettings } from '../../hooks/useEventSettings.ts';
import {
  fetchAdminOverview,
  getCachedAdminOverview,
} from '../../services/adminService.ts';
import type { AdminOverviewSummary } from '../../types/database.types.ts';

export function Dashboard() {
  const { settings } = useEventSettings();
  const initialCached = getCachedAdminOverview();
  const [data, setData] = useState<AdminOverviewSummary | null>(initialCached);
  const [loading, setLoading] = useState(!initialCached);
  const [loadError, setLoadError] = useState<string | null>(null);
  const pollInFlightRef = useRef(false);

  const loadOverview = useCallback(async (silent = false) => {
    if (silent && pollInFlightRef.current) return;
    pollInFlightRef.current = true;
    if (!silent && !getCachedAdminOverview()) {
      setLoading(true);
    }
    try {
      const res = await fetchAdminOverview();
      if (res && typeof res === 'object') {
        const next: AdminOverviewSummary = {
          ...res,
          recent_registrations: Array.isArray(res.recent_registrations)
            ? res.recent_registrations
            : [],
        };
        setData((prev) =>
          prev && JSON.stringify(prev) === JSON.stringify(next) ? prev : next
        );
        setLoadError(null);
      }
    } catch (err) {
      if (!silent && !getCachedAdminOverview()) {
        setLoadError(
          err instanceof Error ? err.message : 'Unable to load overview data.'
        );
      }
    } finally {
      pollInFlightRef.current = false;
      if (!silent) setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadOverview(Boolean(getCachedAdminOverview()));
  }, [loadOverview]);

  useEffect(() => {
    const intervalId = window.setInterval(() => {
      if (document.visibilityState === 'visible') {
        void loadOverview(true);
      }
    }, 1000);
    return () => window.clearInterval(intervalId);
  }, [loadOverview]);

  return (
    <AdminLayout pageTitle="Overview">
      <div className="space-y-6">
        {loading && !data ? (
          <div className="grid grid-cols-2 gap-3 sm:gap-4">
            {Array.from({ length: 4 }).map((_, idx) => (
              <div
                key={idx}
                className="h-24 animate-pulse rounded-2xl border-2 border-[#1b1b1b] bg-[#fffaf0]"
              />
            ))}
          </div>
        ) : loadError && !data ? (
          <div className="rounded-2xl border-2 border-[#c8221a] bg-[#fffaf0] p-5 text-sm font-bold text-[#c8221a] shadow-[4px_4px_0_0_#1b1b1b]">
            <p>{loadError}</p>
            <button
              type="button"
              onClick={() => void loadOverview(false)}
              className="btn-craft-primary mt-3 rounded-xl px-4 py-2 text-xs font-bold uppercase"
            >
              Retry
            </button>
          </div>
        ) : data ? (
          <>
            {/* 2-Column Count Summary Grid */}
            <div className="grid grid-cols-2 gap-3 sm:gap-4">
              <StatCard
                label="Total Registrations"
                value={data.total_registrations}
                icon={<Users className="h-5 w-5" />}
                accentClass="text-[#8e1b1b]"
              />
              <StatCard
                label="Events Joined"
                value={data.checked_in_count}
                icon={<UserCheck className="h-5 w-5" />}
                accentClass="text-[#3e9b47]"
              />
              <StatCard
                label="Vegetarian"
                value={data.vegetarian_count}
                icon={<Leaf className="h-5 w-5" />}
                accentClass="text-[#3e9b47]"
              />
              <StatCard
                label="Non-Vegetarian"
                value={data.non_vegetarian_count}
                icon={<Utensils className="h-5 w-5" />}
                accentClass="text-[#d97706]"
              />
            </div>

            {/* Integrated Data Export Center */}
            <ExportCenter
              settings={settings}
              sourceRecords={data.recent_registrations}
            />
          </>
        ) : null}
      </div>
    </AdminLayout>
  );
}
