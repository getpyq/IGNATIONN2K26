import { useState } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import {
  AlertCircle,
  ArrowUpDown,
  Check,
  ChevronLeft,
  ChevronRight,
  Copy,
  Edit3,
  Filter,
  Search,
  Trash2,
  Users,
  X,
} from 'lucide-react';
import { ConfirmDialog } from '../common/ConfirmDialog.tsx';
import { EmptyState } from '../common/EmptyState.tsx';
import { formatDateTime, formatFoodLabel } from '../../lib/utils.ts';
import {
  TALENT_OPTIONS,
  type EventSettings,
  type FoodPreference,
  type RegistrationRecord,
} from '../../types/database.types.ts';

export function RegistrationTable({
  items,
  total,
  page,
  totalPages,
  loading,
  isSuperAdmin,
  q,
  food,
  talent,
  sortBy,
  sortDir,
  onQueryChange,
  onFoodChange,
  onTalentChange,
  onSortChange,
  onPageChange,
  onResetFilters,
  onSaveEdit,
  onDeleteRecord,
}: {
  items: RegistrationRecord[];
  total: number;
  page: number;
  totalPages: number;
  loading: boolean;
  isSuperAdmin: boolean;
  settings: EventSettings;
  q: string;
  food: string;
  talent: string;
  sortBy: string;
  sortDir: 'asc' | 'desc';
  onQueryChange: (val: string) => void;
  onFoodChange: (val: string) => void;
  onTalentChange: (val: string) => void;
  onSortChange: (col: string) => void;
  onPageChange: (nextPage: number) => void;
  onResetFilters: () => void;
  onSaveEdit: (
    id: string,
    payload: {
      student_name: string;
      selected_talents: string[];
      other_talent_description: string | null;
      food_preference: FoodPreference;
    }
  ) => Promise<void>;
  onDeleteRecord: (id: string) => Promise<void>;
}) {
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [editing, setEditing] = useState<RegistrationRecord | null>(null);
  const [editForm, setEditForm] = useState<{
    student_name: string;
    selected_talents: string[];
    other_talent_description: string;
    food_preference: FoodPreference;
  }>({
    student_name: '',
    selected_talents: [],
    other_talent_description: '',
    food_preference: 'vegetarian',
  });
  const [editSaving, setEditSaving] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);
  const [deletingTarget, setDeletingTarget] =
    useState<RegistrationRecord | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const handleCopyId = async (regId: string) => {
    try {
      await navigator.clipboard.writeText(regId);
      setCopiedId(regId);
      window.setTimeout(() => setCopiedId(null), 1800);
    } catch {
      // ignore clipboard errors
    }
  };

  const openEditModal = (r: RegistrationRecord) => {
    setEditForm({
      student_name: r.student_name,
      selected_talents: [...r.selected_talents],
      other_talent_description: r.other_talent_description || '',
      food_preference: r.food_preference,
    });
    setEditError(null);
    setEditing(r);
  };

  const handleEditSubmit = async () => {
    if (!editing) return;
    if (editForm.student_name.trim().length < 2) {
      setEditError('Student name must be at least 2 characters.');
      return;
    }
    if (editForm.selected_talents.length === 0) {
      setEditError('Select at least one talent.');
      return;
    }
    if (
      editForm.selected_talents.includes('Other') &&
      editForm.other_talent_description.trim().length < 2
    ) {
      setEditError('Please describe the custom talent for Other.');
      return;
    }
    setEditSaving(true);
    setEditError(null);
    try {
      await onSaveEdit(editing.id, {
        student_name: editForm.student_name.trim(),
        selected_talents: editForm.selected_talents,
        other_talent_description: editForm.selected_talents.includes('Other')
          ? editForm.other_talent_description.trim()
          : null,
        food_preference: editForm.food_preference,
      });
      setEditing(null);
    } catch (err) {
      setEditError(
        err instanceof Error ? err.message : 'Unable to save changes.'
      );
    } finally {
      setEditSaving(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!deletingTarget || deleting) return;
    setDeleting(true);
    setDeleteError(null);
    try {
      await onDeleteRecord(deletingTarget.id);
      setDeletingTarget(null);
    } catch (err) {
      setDeleteError(
        err instanceof Error
          ? err.message
          : 'Failed to permanently delete registration.'
      );
      setDeletingTarget(null);
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="space-y-4">
      {deleteError && (
        <div
          role="alert"
          className="flex items-start justify-between gap-3 rounded-2xl border-2 border-[#c8221a] bg-white p-4 text-xs font-bold text-[#c8221a] shadow-[4px_4px_0_0_#1b1b1b]"
        >
          <div className="flex items-start gap-2">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-[#c8221a]" />
            <span>{deleteError}</span>
          </div>
          <button
            type="button"
            onClick={() => setDeleteError(null)}
            aria-label="Dismiss delete error"
            className="rounded p-0.5 text-[#5a0f14] hover:bg-[#fff4e2]"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}
      {/* Search and Filters Bar */}
      <div className="rounded-2xl border-2 border-[#1b1b1b] bg-[#fffaf0] p-4 shadow-[4px_4px_0_0_#1b1b1b]">
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-4">
          <div className="relative lg:col-span-2">
            <Search className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-[#4a4642]" />
            <input
              type="search"
              value={q}
              onChange={(e) => onQueryChange(e.target.value)}
              placeholder="Search student name or Registration ID (IGNITION26-...)..."
              className="w-full rounded-xl border-2 border-[#1b1b1b] bg-white py-2 pr-3 pl-9 text-sm font-medium text-[#1b1b1b] placeholder:text-[#4a4642]/50 focus:outline-none"
            />
          </div>

          <select
            aria-label="Filter by food preference"
            value={food}
            onChange={(e) => onFoodChange(e.target.value)}
            className="rounded-xl border-2 border-[#1b1b1b] bg-white px-3 py-2 text-sm font-medium text-[#1b1b1b] focus:outline-none"
          >
            <option value="">All Food Preferences</option>
            <option value="vegetarian">Vegetarian</option>
            <option value="non_vegetarian">Non-Vegetarian</option>
          </select>

          <div className="flex items-center gap-2">
            <select
              aria-label="Filter by talent"
              value={talent}
              onChange={(e) => onTalentChange(e.target.value)}
              className="w-full rounded-xl border-2 border-[#1b1b1b] bg-white px-3 py-2 text-sm font-medium text-[#1b1b1b] focus:outline-none"
            >
              <option value="">All Talents</option>
              {TALENT_OPTIONS.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.label}
                </option>
              ))}
            </select>
            {(q || food || talent) && (
              <button
                type="button"
                onClick={onResetFilters}
                title="Reset filters"
                className="btn-craft-secondary rounded-xl px-3 py-2 text-xs font-bold whitespace-nowrap shrink-0"
              >
                Clear
              </button>
            )}
          </div>
        </div>

        <div className="mt-3 flex items-center justify-between text-xs text-[#4a4642]">
          <span className="inline-flex items-center gap-1.5 font-medium">
            <Filter className="h-3.5 w-3.5 text-[#8e1b1b]" />
            Showing{' '}
            <strong className="font-mono-tabular text-[#5a0f14]">
              {items.length}
            </strong>{' '}
            of{' '}
            <strong className="font-mono-tabular text-[#5a0f14]">
              {total}
            </strong>{' '}
            registrations
          </span>
          <span className="font-mono-tabular font-semibold text-[#5a0f14]">
            Page {page} of {totalPages}
          </span>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-2xl border-2 border-[#1b1b1b] bg-[#fffaf0] shadow-[4px_4px_0_0_#1b1b1b]">
        {loading ? (
          <div className="divide-y-2 divide-[#1b1b1b]/10 p-4">
            {Array.from({ length: 6 }).map((_, idx) => (
              <div
                key={idx}
                className="flex h-12 items-center justify-between gap-4 py-3"
              >
                <div className="h-4 w-36 animate-pulse rounded bg-[#1b1b1b]/10" />
                <div className="h-4 w-28 animate-pulse rounded bg-[#1b1b1b]/10" />
                <div className="h-4 w-44 animate-pulse rounded bg-[#1b1b1b]/10" />
                <div className="h-4 w-24 animate-pulse rounded bg-[#1b1b1b]/10" />
              </div>
            ))}
          </div>
        ) : items.length === 0 ? (
          <div className="p-4">
            <EmptyState
              icon={<Users className="h-6 w-6" />}
              title="No matching registrations"
              description="No student registration records match your current search or filter criteria."
              action={
                q || food || talent ? (
                  <button
                    type="button"
                    onClick={onResetFilters}
                    className="btn-craft-primary rounded-xl px-4 py-2 text-xs font-bold"
                  >
                    Clear All Filters
                  </button>
                ) : undefined
              }
            />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[880px] border-collapse text-left text-sm">
              <thead>
                <tr className="border-b-2 border-[#1b1b1b] bg-[#f6efe2] text-xs font-bold tracking-wider uppercase text-[#5a0f14]">
                  <th className="px-4 py-3">
                    <button
                      type="button"
                      onClick={() => onSortChange('pass_number')}
                      className="inline-flex items-center gap-1 hover:text-[#8e1b1b]"
                    >
                      <span>Registration ID</span>
                      <ArrowUpDown
                        className={`h-3 w-3 ${
                          sortBy === 'pass_number' ? 'text-[#8e1b1b]' : ''
                        }`}
                      />
                    </button>
                  </th>
                  <th className="px-4 py-3">
                    <button
                      type="button"
                      onClick={() => onSortChange('student_name')}
                      className="inline-flex items-center gap-1 hover:text-[#8e1b1b]"
                    >
                      <span>Student Name</span>
                      <ArrowUpDown
                        className={`h-3 w-3 ${
                          sortBy === 'student_name' ? 'text-[#8e1b1b]' : ''
                        }`}
                      />
                    </button>
                  </th>
                  <th className="px-4 py-3">Selected Talents</th>
                  <th className="px-4 py-3">Other Talent</th>
                  <th className="px-4 py-3">
                    <button
                      type="button"
                      onClick={() => onSortChange('food_preference')}
                      className="inline-flex items-center gap-1 hover:text-[#8e1b1b]"
                    >
                      <span>Food</span>
                      <ArrowUpDown
                        className={`h-3 w-3 ${
                          sortBy === 'food_preference' ? 'text-[#8e1b1b]' : ''
                        }`}
                      />
                    </button>
                  </th>
                  <th className="px-4 py-3">Check-In</th>
                  <th className="px-4 py-3">
                    <button
                      type="button"
                      onClick={() => onSortChange('created_at')}
                      className="inline-flex items-center gap-1 hover:text-[#8e1b1b]"
                    >
                      <span>Date</span>
                      <ArrowUpDown
                        className={`h-3 w-3 ${
                          sortBy === 'created_at' ? 'text-[#8e1b1b]' : ''
                        }`}
                      />
                    </button>
                  </th>
                  {isSuperAdmin && (
                    <th className="px-4 py-3 text-right">Actions</th>
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1b1b1b]/15 bg-white">
                {items.map((r) => (
                  <tr
                    key={r.id}
                    className="transition-colors hover:bg-[#fff4e2]/65"
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1.5">
                        <span className="font-mono-tabular text-xs font-bold text-[#8e1b1b] whitespace-nowrap">
                          {r.pass_number}
                        </span>
                        <button
                          type="button"
                          onClick={() => void handleCopyId(r.pass_number)}
                          title="Copy Registration ID"
                          className="rounded p-1 text-[#4a4642] hover:bg-[#f6efe2] hover:text-[#1b1b1b]"
                        >
                          {copiedId === r.pass_number ? (
                            <Check className="h-3.5 w-3.5 text-[#3e9b47]" />
                          ) : (
                            <Copy className="h-3.5 w-3.5" />
                          )}
                        </button>
                      </div>
                    </td>
                    <td className="px-4 py-3 font-bold text-[#5a0f14]">
                      {r.student_name}
                    </td>
                    <td className="max-w-[210px] px-4 py-3 text-xs font-semibold text-[#8e1b1b]">
                      {r.selected_talents.join(' · ')}
                    </td>
                    <td className="max-w-[140px] truncate px-4 py-3 text-xs text-[#4a4642]">
                      {r.other_talent_description || '-'}
                    </td>
                    <td className="px-4 py-3 text-xs font-bold whitespace-nowrap">
                      <span
                        className={
                          r.food_preference === 'vegetarian'
                            ? 'text-[#3e9b47]'
                            : 'text-[#8e1b1b]'
                        }
                      >
                        {formatFoodLabel(r.food_preference)}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs font-bold whitespace-nowrap">
                      {r.checked_in ? (
                        <span className="text-[#3e9b47]">
                          Events Joined
                        </span>
                      ) : (
                        <span className="text-[#4a4642]">Pending</span>
                      )}
                    </td>
                    <td className="px-4 py-3 font-mono-tabular text-xs text-[#4a4642] whitespace-nowrap">
                      {formatDateTime(r.created_at)}
                    </td>
                    {isSuperAdmin && (
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => openEditModal(r)}
                            title="Edit registration details"
                            className="inline-flex items-center gap-1 rounded-lg border border-[#1b1b1b]/20 bg-[#fffaf0] px-2.5 py-1.5 text-xs font-bold text-[#5a0f14] hover:border-[#1b1b1b] hover:bg-[#ffe066]/40 hover:text-[#c8221a]"
                          >
                            <Edit3 className="h-3.5 w-3.5" />
                            <span>Edit</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setDeleteError(null);
                              setDeletingTarget(r);
                            }}
                            title="Delete registration permanently from Google Sheet"
                            className="inline-flex items-center gap-1 rounded-lg border border-[#c8221a]/30 bg-white px-2.5 py-1.5 text-xs font-bold text-[#c8221a] hover:border-[#c8221a] hover:bg-[#c8221a] hover:text-white"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                            <span>Delete</span>
                          </button>
                        </div>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between border-t-2 border-[#1b1b1b] bg-[#f6efe2] px-4 py-3 text-xs text-[#4a4642]">
            <span>
              Page <strong className="text-[#5a0f14]">{page}</strong> of{' '}
              <strong className="text-[#5a0f14]">{totalPages}</strong> (
              <span className="font-mono-tabular font-semibold">{total}</span>{' '}
              total)
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={page <= 1}
                onClick={() => onPageChange(page - 1)}
                className="btn-craft-secondary inline-flex items-center gap-1 rounded-lg px-3 py-1.5 font-bold disabled:opacity-40"
              >
                <ChevronLeft className="h-3.5 w-3.5" />
                Previous
              </button>
              <button
                type="button"
                disabled={page >= totalPages}
                onClick={() => onPageChange(page + 1)}
                className="btn-craft-secondary inline-flex items-center gap-1 rounded-lg px-3 py-1.5 font-bold disabled:opacity-40"
              >
                Next
                <ChevronRight className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Super Admin Edit Modal */}
      <Dialog.Root open={Boolean(editing)} onOpenChange={() => setEditing(null)}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 z-50 bg-[#1b1b1b]/65 backdrop-blur-xs" />
          <Dialog.Content className="fixed top-1/2 left-1/2 z-50 max-h-[90vh] w-[92vw] max-w-lg -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-2xl border-2 border-[#1b1b1b] bg-[#fffaf0] p-6 text-[#5a0f14] shadow-[8px_8px_0_0_#1b1b1b] focus:outline-none">
            <div className="flex items-start justify-between">
              <Dialog.Title className="font-heading text-lg font-extrabold text-[#5a0f14]">
                Edit Registration Record
              </Dialog.Title>
              <Dialog.Close asChild>
                <button
                  type="button"
                  aria-label="Close edit dialog"
                  className="rounded-lg border-2 border-[#1b1b1b] bg-[#fff4e2] p-1.5 text-[#1b1b1b]"
                >
                  <X className="h-4 w-4" />
                </button>
              </Dialog.Close>
            </div>

            <div className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase text-[#5a0f14]">
                  Student Name
                </label>
                <input
                  type="text"
                  value={editForm.student_name}
                  onChange={(e) =>
                    setEditForm((prev) => ({
                      ...prev,
                      student_name: e.target.value,
                    }))
                  }
                  className="mt-1.5 w-full rounded-xl border-2 border-[#1b1b1b] bg-white px-3 py-2 text-sm font-medium text-[#1b1b1b] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-[#5a0f14]">
                  Selected Talents
                </label>
                <div className="mt-2 grid grid-cols-2 gap-2">
                  {TALENT_OPTIONS.map((t) => {
                    const active = editForm.selected_talents.includes(t.id);
                    return (
                      <button
                        key={t.id}
                        type="button"
                        onClick={() =>
                          setEditForm((prev) => ({
                            ...prev,
                            selected_talents: active
                              ? prev.selected_talents.filter((x) => x !== t.id)
                              : [...prev.selected_talents, t.id],
                          }))
                        }
                        className={`rounded-xl border-2 border-[#1b1b1b] px-3 py-2 text-left text-xs font-bold transition-colors ${
                          active
                            ? 'bg-[#8e1b1b] text-[#fff4e2]'
                            : 'bg-white text-[#4a4642]'
                        }`}
                      >
                        {t.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {editForm.selected_talents.includes('Other') && (
                <div>
                  <label className="block text-xs font-bold uppercase text-[#5a0f14]">
                    Custom Talent Description
                  </label>
                  <input
                    type="text"
                    value={editForm.other_talent_description}
                    onChange={(e) =>
                      setEditForm((prev) => ({
                        ...prev,
                        other_talent_description: e.target.value,
                      }))
                    }
                    className="mt-1.5 w-full rounded-xl border-2 border-[#1b1b1b] bg-white px-3 py-2 text-sm font-medium text-[#1b1b1b] focus:outline-none"
                  />
                </div>
              )}

              <div>
                <label className="block text-xs font-bold uppercase text-[#5a0f14]">
                  Food Preference
                </label>
                <select
                  value={editForm.food_preference}
                  onChange={(e) =>
                    setEditForm((prev) => ({
                      ...prev,
                      food_preference: e.target.value as FoodPreference,
                    }))
                  }
                  className="mt-1.5 w-full rounded-xl border-2 border-[#1b1b1b] bg-white px-3 py-2 text-sm font-medium text-[#1b1b1b] focus:outline-none"
                >
                  <option value="vegetarian">Vegetarian</option>
                  <option value="non_vegetarian">Non-Vegetarian</option>
                </select>
              </div>

              {editError && (
                <p className="text-xs font-bold text-[#c8221a]">{editError}</p>
              )}

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setEditing(null)}
                  className="btn-craft-secondary rounded-xl px-4 py-2 text-xs font-bold"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={editSaving}
                  onClick={() => void handleEditSubmit()}
                  className="btn-craft-primary rounded-xl px-5 py-2 text-xs font-bold disabled:opacity-50"
                >
                  {editSaving ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>

      {/* Admin Permanent Delete Confirmation */}
      <ConfirmDialog
        open={Boolean(deletingTarget)}
        onOpenChange={(open) => {
          if (!open && !deleting) {
            setDeletingTarget(null);
          }
        }}
        title="Delete Registration Permanently?"
        description={
          deletingTarget
            ? `Permanently delete ${deletingTarget.student_name} (${deletingTarget.pass_number})? This removes the row directly from Google Sheets and cannot be undone.`
            : ''
        }
        confirmLabel="Delete Permanently"
        cancelLabel="Cancel"
        variant="danger"
        loading={deleting}
        onConfirm={() => void handleConfirmDelete()}
      />
    </div>
  );
}
