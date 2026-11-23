import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { FileSpreadsheet, FileText } from 'lucide-react';
import {
  exportRegistrationsExcel,
  exportRegistrationsPdf,
  sanitizeFilename,
} from '../../lib/exportHelpers.ts';
import { fetchExportDataset } from '../../services/exportService.ts';
import {
  TALENT_OPTIONS,
  type EventSettings,
  type RegistrationRecord,
} from '../../types/database.types.ts';

type ReportPreset =
  | 'complete'
  | 'vegetarian'
  | 'non_vegetarian'
  | 'talent_wise'
  | 'custom_talents'
  | 'full_event_report';

const REPORT_LABELS: Record<ReportPreset, string> = {
  complete: 'Complete Student Registration List',
  vegetarian: 'Vegetarian Student List',
  non_vegetarian: 'Non-Vegetarian Student List',
  talent_wise: 'Talent-Wise Student List',
  custom_talents: 'Custom Talent (Other) Responses',
  full_event_report: 'Complete Event Registration Report',
};

export function ExportCenter({
  settings,
  sourceRecords,
}: {
  settings: EventSettings;
  sourceRecords?: RegistrationRecord[];
}) {
  const [preset, setPreset] = useState<ReportPreset>('complete');
  const [foodFilter, setFoodFilter] = useState('');
  const [talentFilter, setTalentFilter] = useState('');
  const [fetchedRecords, setFetchedRecords] = useState<RegistrationRecord[]>([]);
  const [loading, setLoading] = useState(!sourceRecords);
  const [statusMsg, setStatusMsg] = useState<string | null>(null);

  const pollInFlightRef = useRef(false);

  const effectiveFood =
    preset === 'vegetarian'
      ? 'vegetarian'
      : preset === 'non_vegetarian'
        ? 'non_vegetarian'
        : foodFilter;

  const effectiveTalent =
    preset === 'custom_talents' ? 'Other' : talentFilter;

  const loadExportRecords = useCallback(
    async (silent = false) => {
      if (sourceRecords) return;
      if (silent && pollInFlightRef.current) return;
      pollInFlightRef.current = true;
      if (!silent) setLoading(true);
      try {
        const list = await fetchExportDataset({
          food: effectiveFood || undefined,
          talent: effectiveTalent || undefined,
        });
        setFetchedRecords((prev) =>
          JSON.stringify(prev) === JSON.stringify(list) ? prev : list
        );
      } catch {
        // retain existing records cleanly on transient background poll failures
      } finally {
        pollInFlightRef.current = false;
        if (!silent) setLoading(false);
      }
    },
    [sourceRecords, effectiveFood, effectiveTalent]
  );

  useEffect(() => {
    if (sourceRecords) {
      setLoading(false);
      return;
    }
    void loadExportRecords(false);
  }, [sourceRecords, loadExportRecords]);

  useEffect(() => {
    if (sourceRecords) return;
    const intervalId = window.setInterval(() => {
      if (document.visibilityState === 'visible') {
        void loadExportRecords(true);
      }
    }, 1000);
    return () => window.clearInterval(intervalId);
  }, [sourceRecords, loadExportRecords]);

  const records = useMemo(() => {
    const base = sourceRecords ?? fetchedRecords;
    return base.filter((r) => {
      if (effectiveFood && r.food_preference !== effectiveFood) return false;
      if (effectiveTalent && !r.selected_talents.includes(effectiveTalent)) {
        return false;
      }
      if (
        preset === 'custom_talents' &&
        !r.other_talent_description?.trim()
      ) {
        return false;
      }
      return true;
    });
  }, [sourceRecords, fetchedRecords, effectiveFood, effectiveTalent, preset]);

  const runExport = (format: 'excel' | 'pdf') => {
    if (records.length === 0) {
      setStatusMsg('No matching registration records to export.');
      return;
    }
    const base = `${sanitizeFilename(settings.event_name)}-${preset}`;
    if (format === 'excel') {
      exportRegistrationsExcel(records, settings, `${base}.xlsx`);
    } else {
      exportRegistrationsPdf(
        records,
        settings,
        REPORT_LABELS[preset],
        `${base}.pdf`
      );
    }
    setStatusMsg(
      `Exported ${records.length} record${records.length === 1 ? '' : 's'} as ${format.toUpperCase()}.`
    );
  };

  return (
    <div className="space-y-4">
      {/* Report Configuration Card */}
      <div className="rounded-2xl border-2 border-[#1b1b1b] bg-[#fffaf0] p-5 shadow-[4px_4px_0_0_#1b1b1b]">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h2 className="font-heading text-base font-extrabold text-[#5a0f14]">
              Data Export &amp; Reports
            </h2>
            <p className="mt-0.5 text-xs text-[#4a4642]">
              Export filtered student registrations in Excel or PDF.
            </p>
          </div>
          <span className="font-mono-tabular text-xs font-bold text-[#5a0f14]">
            {records.length} matching record{records.length === 1 ? '' : 's'}
          </span>
        </div>

        <div className="mt-4 grid grid-cols-1 gap-3.5 md:grid-cols-3">
          <div>
            <label className="block text-xs font-bold uppercase text-[#5a0f14]">
              Report Type
            </label>
            <select
              value={preset}
              onChange={(e) => setPreset(e.target.value as ReportPreset)}
              className="mt-1.5 w-full rounded-xl border-2 border-[#1b1b1b] bg-white px-3 py-2 text-sm font-medium text-[#1b1b1b] focus:outline-none"
            >
              {Object.entries(REPORT_LABELS).map(([k, label]) => (
                <option key={k} value={k}>
                  {label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase text-[#5a0f14]">
              Food Preference
            </label>
            <select
              disabled={preset === 'vegetarian' || preset === 'non_vegetarian'}
              value={
                preset === 'vegetarian'
                  ? 'vegetarian'
                  : preset === 'non_vegetarian'
                    ? 'non_vegetarian'
                    : foodFilter
              }
              onChange={(e) => setFoodFilter(e.target.value)}
              className="mt-1.5 w-full rounded-xl border-2 border-[#1b1b1b] bg-white px-3 py-2 text-sm font-medium text-[#1b1b1b] focus:outline-none disabled:opacity-50"
            >
              <option value="">All</option>
              <option value="vegetarian">Vegetarian</option>
              <option value="non_vegetarian">Non-Vegetarian</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase text-[#5a0f14]">
              Talent Filter
            </label>
            <select
              disabled={preset === 'custom_talents'}
              value={preset === 'custom_talents' ? 'Other' : talentFilter}
              onChange={(e) => setTalentFilter(e.target.value)}
              className="mt-1.5 w-full rounded-xl border-2 border-[#1b1b1b] bg-white px-3 py-2 text-sm font-medium text-[#1b1b1b] focus:outline-none disabled:opacity-50"
            >
              <option value="">All Talents</option>
              {TALENT_OPTIONS.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Export Format Buttons */}
        <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2">
          <button
            type="button"
            disabled={loading || records.length === 0}
            onClick={() => runExport('excel')}
            className="btn-craft-secondary flex items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-bold disabled:opacity-40"
          >
            <FileSpreadsheet className="h-4 w-4 text-[#3e9b47]" />
            <span>Export Excel</span>
          </button>

          <button
            type="button"
            disabled={loading || records.length === 0}
            onClick={() => runExport('pdf')}
            className="btn-craft-turmeric flex items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-bold disabled:opacity-40"
          >
            <FileText className="h-4 w-4 text-[#8e1b1b]" />
            <span>Export PDF</span>
          </button>
        </div>

        {statusMsg && (
          <p className="mt-3 text-xs font-bold text-[#3e9b47]">{statusMsg}</p>
        )}
      </div>
    </div>
  );
}
