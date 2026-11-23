import { useState, type FormEvent } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import {
  AlertCircle,
  Check,
  Copy,
  Edit3,
  KeyRound,
  Loader2,
  Phone,
  Power,
  ShieldCheck,
  Sparkles,
  UserPlus,
  Users,
  X,
} from 'lucide-react';
import { ConfirmDialog } from '../common/ConfirmDialog.tsx';
import { EmptyState } from '../common/EmptyState.tsx';
import { PasscodeBoxes } from '../common/PasscodeBoxes.tsx';
import {
  createCoordinatorSchema,
  resetPasscodeSchema,
  updateCoordinatorSchema,
} from '../../lib/validation.ts';
import { formatDateTime } from '../../lib/utils.ts';
import type { AdminAccountPublic } from '../../types/database.types.ts';

function generateSixDigitCode(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.getRandomValues === 'function') {
    const arr = new Uint32Array(1);
    crypto.getRandomValues(arr);
    return String(100000 + (arr[0] % 900000));
  }
  return String(Math.floor(100000 + Math.random() * 900000));
}

export function CoordinatorManagement({
  accounts,
  loading,
  onCreateCoordinator,
  onUpdateCoordinator,
  onResetPasscode,
}: {
  accounts: AdminAccountPublic[];
  loading: boolean;
  onCreateCoordinator: (payload: {
    full_name: string;
    phone_number: string;
    passcode: string;
  }) => Promise<AdminAccountPublic>;
  onUpdateCoordinator: (
    id: string,
    payload: {
      full_name?: string;
      phone_number?: string;
      is_active?: boolean;
    }
  ) => Promise<AdminAccountPublic>;
  onResetPasscode: (id: string, passcode: string) => Promise<void>;
}) {
  const [fullName, setFullName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [passcode, setPasscode] = useState('');
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
  const [handoffCreds, setHandoffCreds] = useState<{
    full_name: string;
    phone_number: string;
    passcode: string;
    label: string;
  } | null>(null);
  const [copiedHandoff, setCopiedHandoff] = useState(false);

  const [editing, setEditing] = useState<AdminAccountPublic | null>(null);
  const [editName, setEditName] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editSaving, setEditSaving] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);

  const [resetTarget, setResetTarget] = useState<AdminAccountPublic | null>(null);
  const [newPasscode, setNewPasscode] = useState('');
  const [resetting, setResetting] = useState(false);
  const [resetError, setResetError] = useState<string | null>(null);

  const [deactivateTarget, setDeactivateTarget] =
    useState<AdminAccountPublic | null>(null);
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const coordinators = accounts.filter((a) => a.role === 'coordinator');
  const superAdmins = accounts.filter((a) => a.role === 'super_admin');
  const orderedAccounts = [...superAdmins, ...coordinators];

  const handleCreate = async (e: FormEvent) => {
    e.preventDefault();
    setCreateError(null);
    setActionError(null);

    const parsed = createCoordinatorSchema.safeParse({
      full_name: fullName,
      phone_number: phoneNumber,
      passcode,
    });
    if (!parsed.success) {
      setCreateError(
        parsed.error.issues[0]?.message || 'Please check all coordinator fields.'
      );
      return;
    }

    setCreating(true);
    try {
      const created = await onCreateCoordinator(parsed.data);
      setHandoffCreds({
        full_name: created.full_name,
        phone_number: created.phone_number,
        passcode: parsed.data.passcode,
        label: 'Coordinator Added Successfully',
      });
      setCopiedHandoff(false);
      setFullName('');
      setPhoneNumber('');
      setPasscode('');
    } catch (err) {
      setCreateError(
        err instanceof Error ? err.message : 'Unable to create coordinator.'
      );
    } finally {
      setCreating(false);
    }
  };

  const handleCopyHandoff = async () => {
    if (!handoffCreds) return;
    const text = `IGNITION 2K26 Coordinator Login\nName: ${handoffCreds.full_name}\nMobile: ${handoffCreds.phone_number}\nPasscode: ${handoffCreds.passcode}`;
    try {
      await navigator.clipboard.writeText(text);
      setCopiedHandoff(true);
      window.setTimeout(() => setCopiedHandoff(false), 2000);
    } catch {
      // ignore clipboard errors
    }
  };

  const openEdit = (acc: AdminAccountPublic) => {
    setEditName(acc.full_name);
    setEditPhone(acc.phone_number);
    setEditError(null);
    setEditing(acc);
  };

  const handleSaveEdit = async (e: FormEvent) => {
    e.preventDefault();
    if (!editing) return;
    setEditError(null);

    const parsed = updateCoordinatorSchema.safeParse({
      full_name: editName,
      phone_number: editPhone,
    });
    if (!parsed.success) {
      setEditError(
        parsed.error.issues[0]?.message || 'Please enter valid coordinator details.'
      );
      return;
    }

    setEditSaving(true);
    try {
      await onUpdateCoordinator(editing.id, parsed.data);
      setEditing(null);
    } catch (err) {
      setEditError(
        err instanceof Error ? err.message : 'Unable to update coordinator.'
      );
    } finally {
      setEditSaving(false);
    }
  };

  const openResetModal = (acc: AdminAccountPublic) => {
    setNewPasscode('');
    setResetError(null);
    setResetTarget(acc);
  };

  const handleConfirmReset = async (e: FormEvent) => {
    e.preventDefault();
    if (!resetTarget) return;
    setResetError(null);

    const parsed = resetPasscodeSchema.safeParse({ passcode: newPasscode });
    if (!parsed.success) {
      setResetError(
        parsed.error.issues[0]?.message || 'Enter a valid 6-digit passcode.'
      );
      return;
    }

    setResetting(true);
    try {
      await onResetPasscode(resetTarget.id, parsed.data.passcode);
      setHandoffCreds({
        full_name: resetTarget.full_name,
        phone_number: resetTarget.phone_number,
        passcode: parsed.data.passcode,
        label: 'One-Time 6-Digit Passcode Updated',
      });
      setCopiedHandoff(false);
      setResetTarget(null);
    } catch (err) {
      setResetError(
        err instanceof Error ? err.message : 'Failed to reset passcode.'
      );
    } finally {
      setResetting(false);
    }
  };

  const handleToggleActive = async (acc: AdminAccountPublic) => {
    setActionError(null);
    setTogglingId(acc.id);
    try {
      await onUpdateCoordinator(acc.id, { is_active: !acc.is_active });
      setDeactivateTarget(null);
    } catch (err) {
      setActionError(
        err instanceof Error
          ? err.message
          : 'Failed to update coordinator status.'
      );
      setDeactivateTarget(null);
    } finally {
      setTogglingId(null);
    }
  };

  return (
    <div className="space-y-6">
      {handoffCreds && (
        <div className="rounded-2xl border-2 border-[#1b1b1b] bg-[#ffe066]/45 p-5 shadow-[5px_5px_0_0_#1b1b1b]">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="space-y-1">
              <p className="inline-flex items-center gap-1.5 text-xs font-extrabold tracking-wider uppercase text-[#3e9b47]">
                <Check className="h-4 w-4" />
                <span>{handoffCreds.label}</span>
              </p>
              <p className="font-heading text-base font-extrabold text-[#5a0f14]">
                Share login details with {handoffCreds.full_name}
              </p>
              <div className="flex flex-wrap items-center gap-x-5 gap-y-1 pt-1 text-xs font-bold text-[#1b1b1b]">
                <span>
                  Mobile:{' '}
                  <code className="rounded border border-[#1b1b1b]/25 bg-white px-2 py-0.5 font-mono-tabular text-[#8e1b1b]">
                    {handoffCreds.phone_number}
                  </code>
                </span>
                <span>
                  One-Time Passcode:{' '}
                  <code className="rounded border border-[#1b1b1b]/25 bg-white px-2 py-0.5 font-mono-tabular text-[#8e1b1b]">
                    {handoffCreds.passcode}
                  </code>
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={() => void handleCopyHandoff()}
                className="btn-craft-secondary inline-flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-bold"
              >
                {copiedHandoff ? (
                  <>
                    <Check className="h-3.5 w-3.5 text-[#3e9b47]" />
                    <span>Copied</span>
                  </>
                ) : (
                  <>
                    <Copy className="h-3.5 w-3.5" />
                    <span>Copy Login Details</span>
                  </>
                )}
              </button>
              <button
                type="button"
                onClick={() => setHandoffCreds(null)}
                aria-label="Dismiss credentials banner"
                className="rounded-xl border-2 border-[#1b1b1b] bg-white p-2 text-[#1b1b1b] hover:bg-[#f6efe2]"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {actionError && (
        <div
          role="alert"
          className="flex items-start justify-between gap-3 rounded-2xl border-2 border-[#c8221a] bg-white p-4 text-xs font-bold text-[#c8221a] shadow-[4px_4px_0_0_#1b1b1b]"
        >
          <div className="flex items-start gap-2">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-[#c8221a]" />
            <span>{actionError}</span>
          </div>
          <button
            type="button"
            onClick={() => setActionError(null)}
            aria-label="Dismiss error"
            className="rounded p-0.5 text-[#5a0f14] hover:bg-[#fff4e2]"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* Create Coordinator Form */}
        <section className="lg:col-span-5">
          <form
            onSubmit={(e) => void handleCreate(e)}
            noValidate
            className="rounded-2xl border-2 border-[#1b1b1b] bg-[#fffaf0] p-6 shadow-[6px_6px_0_0_#1b1b1b]"
          >
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border-2 border-[#1b1b1b] bg-[#e0a526] text-[#1b1b1b] shadow-[2px_2px_0_0_#1b1b1b]">
                <UserPlus className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-heading text-lg font-extrabold text-[#5a0f14]">
                  Add New Coordinator
                </h3>
                <p className="mt-0.5 text-xs text-[#4a4642]">
                  Coordinators get full portal access (Overview, Scanner, View & Edit) excluding registration deletion.
                </p>
              </div>
            </div>

            <div className="mt-5 space-y-4">
              <div>
                <label
                  htmlFor="coord-full-name"
                  className="block text-xs font-bold tracking-wider uppercase text-[#5a0f14]"
                >
                  Coordinator Name
                </label>
                <input
                  id="coord-full-name"
                  type="text"
                  value={fullName}
                  onChange={(e) => {
                    setFullName(e.target.value);
                    if (createError) setCreateError(null);
                  }}
                  placeholder="e.g., Ritu Das"
                  disabled={creating}
                  className="mt-1.5 w-full rounded-xl border-2 border-[#1b1b1b] bg-white px-3.5 py-2.5 text-sm font-medium text-[#1b1b1b] placeholder:text-[#4a4642]/45 focus:outline-none disabled:opacity-60"
                />
              </div>

              <div>
                <label
                  htmlFor="coord-phone"
                  className="block text-xs font-bold tracking-wider uppercase text-[#5a0f14]"
                >
                  Mobile Number
                </label>
                <input
                  id="coord-phone"
                  type="tel"
                  inputMode="tel"
                  value={phoneNumber}
                  onChange={(e) => {
                    setPhoneNumber(e.target.value);
                    if (createError) setCreateError(null);
                  }}
                  placeholder="10-digit mobile number"
                  disabled={creating}
                  className="mt-1.5 w-full rounded-xl border-2 border-[#1b1b1b] bg-white px-3.5 py-2.5 font-mono-tabular text-sm font-medium text-[#1b1b1b] placeholder:text-[#4a4642]/45 focus:outline-none disabled:opacity-60"
                />
              </div>

              <div className="space-y-2">
                <PasscodeBoxes
                  idPrefix="coord-create-passcode"
                  label="One-Time 6-Digit Passcode"
                  value={passcode}
                  onChange={(val) => {
                    setPasscode(val);
                    if (createError) setCreateError(null);
                  }}
                  disabled={creating}
                />
                <div className="flex justify-end">
                  <button
                    type="button"
                    disabled={creating}
                    onClick={() => {
                      setPasscode(generateSixDigitCode());
                      if (createError) setCreateError(null);
                    }}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-[#1b1b1b]/25 bg-white px-2.5 py-1 text-[11px] font-bold text-[#8e1b1b] hover:border-[#1b1b1b] hover:bg-[#ffe066]/40"
                  >
                    <Sparkles className="h-3 w-3" />
                    <span>Auto-Generate 6-Digit</span>
                  </button>
                </div>
              </div>

              {createError && (
                <p
                  role="alert"
                  className="flex items-start gap-2 rounded-xl border-2 border-[#c8221a] bg-white p-3 text-xs font-bold text-[#c8221a]"
                >
                  <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-[#c8221a]" />
                  <span>{createError}</span>
                </p>
              )}

              <button
                type="submit"
                disabled={creating}
                className="btn-craft-primary flex min-h-[46px] w-full items-center justify-center gap-2 rounded-xl px-5 py-3 font-heading text-xs font-bold tracking-wider uppercase disabled:opacity-60"
              >
                {creating ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>CREATING COORDINATOR...</span>
                  </>
                ) : (
                  <>
                    <UserPlus className="h-4 w-4" />
                    <span>CREATE COORDINATOR</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </section>

        {/* Staff Directory */}
        <section className="lg:col-span-7">
          <div className="rounded-2xl border-2 border-[#1b1b1b] bg-[#fffaf0] p-6 shadow-[6px_6px_0_0_#1b1b1b]">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b-2 border-[#1b1b1b]/15 pb-4">
              <div className="flex items-center gap-2.5">
                <Users className="h-5 w-5 text-[#8e1b1b]" />
                <h3 className="font-heading text-lg font-extrabold text-[#5a0f14]">
                  Authorized Portal Accounts
                </h3>
              </div>
              <span className="rounded-lg border border-[#1b1b1b] bg-[#f6efe2] px-2.5 py-1 font-mono-tabular text-xs font-bold text-[#5a0f14]">
                {coordinators.length}{' '}
                {coordinators.length === 1 ? 'Coordinator' : 'Coordinators'}
              </span>
            </div>

            {loading ? (
              <div className="mt-4 space-y-3">
                {Array.from({ length: 3 }).map((_, idx) => (
                  <div
                    key={idx}
                    className="h-20 animate-pulse rounded-xl border-2 border-[#1b1b1b]/15 bg-white"
                  />
                ))}
              </div>
            ) : orderedAccounts.length === 0 ? (
              <div className="mt-4">
                <EmptyState
                  icon={<Users className="h-6 w-6" />}
                  title="No portal accounts found"
                  description="Add a coordinator using the form on the left."
                />
              </div>
            ) : (
              <div className="mt-4 space-y-3">
                {orderedAccounts.map((acc) => {
                  const isSuper = acc.role === 'super_admin';
                  const isBusy = togglingId === acc.id;

                  return (
                    <div
                      key={acc.id}
                      className={`rounded-xl border-2 border-[#1b1b1b] p-4 transition-colors ${
                        acc.is_active ? 'bg-white' : 'bg-[#f6efe2]/75 opacity-80'
                      }`}
                    >
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                        <div className="min-w-0 space-y-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <p className="truncate font-heading text-base font-extrabold text-[#5a0f14]">
                              {acc.full_name}
                            </p>
                            {isSuper ? (
                              <span className="inline-flex items-center gap-1 rounded-md border border-[#1b1b1b] bg-[#ffe066] px-2 py-0.5 text-[10px] font-extrabold tracking-wider uppercase text-[#1b1b1b]">
                                <ShieldCheck className="h-3 w-3 text-[#8e1b1b]" />
                                Primary Admin
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 rounded-md border border-[#1b1b1b]/30 bg-[#f6efe2] px-2 py-0.5 text-[10px] font-extrabold tracking-wider uppercase text-[#5a0f14]">
                                Coordinator (No Delete)
                              </span>
                            )}
                            <span
                              className={`rounded-md px-2 py-0.5 text-[10px] font-extrabold tracking-wider uppercase ${
                                acc.is_active
                                  ? 'bg-[#3e9b47]/15 text-[#3e9b47]'
                                  : 'bg-[#c8221a]/15 text-[#c8221a]'
                              }`}
                            >
                              {acc.is_active ? 'Active' : 'Deactivated'}
                            </span>
                          </div>

                          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-[#4a4642]">
                            <span className="inline-flex items-center gap-1 font-mono-tabular font-bold text-[#8e1b1b]">
                              <Phone className="h-3.5 w-3.5" />
                              {acc.phone_number}
                            </span>
                            <span className="text-[11px]">
                              Added {formatDateTime(acc.created_at)}
                            </span>
                          </div>
                        </div>

                        {!isSuper && (
                          <div className="flex flex-wrap items-center gap-2 shrink-0">
                            <button
                              type="button"
                              onClick={() => openEdit(acc)}
                              className="inline-flex items-center gap-1 rounded-lg border border-[#1b1b1b]/25 bg-[#fffaf0] px-2.5 py-1.5 text-xs font-bold text-[#5a0f14] hover:border-[#1b1b1b] hover:bg-[#ffe066]/40"
                            >
                              <Edit3 className="h-3.5 w-3.5" />
                              <span>Edit</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => openResetModal(acc)}
                              className="inline-flex items-center gap-1 rounded-lg border border-[#1b1b1b]/25 bg-[#fffaf0] px-2.5 py-1.5 text-xs font-bold text-[#8e1b1b] hover:border-[#1b1b1b] hover:bg-[#ffe066]/40"
                            >
                              <KeyRound className="h-3.5 w-3.5" />
                              <span>Reset Passcode</span>
                            </button>

                            <button
                              type="button"
                              disabled={isBusy}
                              onClick={() => {
                                if (acc.is_active) {
                                  setDeactivateTarget(acc);
                                } else {
                                  void handleToggleActive(acc);
                                }
                              }}
                              className={`inline-flex items-center gap-1 rounded-lg border px-2.5 py-1.5 text-xs font-bold disabled:opacity-50 ${
                                acc.is_active
                                  ? 'border-[#c8221a]/30 bg-white text-[#c8221a] hover:border-[#c8221a] hover:bg-[#c8221a] hover:text-white'
                                  : 'border-[#3e9b47]/40 bg-white text-[#3e9b47] hover:border-[#3e9b47] hover:bg-[#3e9b47] hover:text-white'
                              }`}
                            >
                              <Power className="h-3.5 w-3.5" />
                              <span>
                                {isBusy
                                  ? 'Updating...'
                                  : acc.is_active
                                    ? 'Deactivate'
                                    : 'Activate'}
                              </span>
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </section>
      </div>

      {/* Edit Coordinator Modal */}
      <Dialog.Root
        open={Boolean(editing)}
        onOpenChange={(open) => {
          if (!open && !editSaving) setEditing(null);
        }}
      >
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 z-50 bg-[#1b1b1b]/65 backdrop-blur-xs" />
          <Dialog.Content className="fixed top-1/2 left-1/2 z-50 w-[92vw] max-w-md -translate-x-1/2 -translate-y-1/2 rounded-2xl border-2 border-[#1b1b1b] bg-[#fffaf0] p-6 text-[#5a0f14] shadow-[8px_8px_0_0_#1b1b1b] focus:outline-none">
            <div className="flex items-start justify-between">
              <Dialog.Title className="font-heading text-lg font-extrabold text-[#5a0f14]">
                Edit Coordinator
              </Dialog.Title>
              <Dialog.Close asChild>
                <button
                  type="button"
                  aria-label="Close edit coordinator dialog"
                  className="rounded-lg border-2 border-[#1b1b1b] bg-[#fff4e2] p-1.5 text-[#1b1b1b]"
                >
                  <X className="h-4 w-4" />
                </button>
              </Dialog.Close>
            </div>

            <form
              onSubmit={(e) => void handleSaveEdit(e)}
              noValidate
              className="mt-4 space-y-4"
            >
              <div>
                <label className="block text-xs font-bold uppercase text-[#5a0f14]">
                  Coordinator Name
                </label>
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => {
                    setEditName(e.target.value);
                    if (editError) setEditError(null);
                  }}
                  className="mt-1.5 w-full rounded-xl border-2 border-[#1b1b1b] bg-white px-3.5 py-2.5 text-sm font-medium text-[#1b1b1b] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-[#5a0f14]">
                  Mobile Number
                </label>
                <input
                  type="tel"
                  inputMode="tel"
                  value={editPhone}
                  onChange={(e) => {
                    setEditPhone(e.target.value);
                    if (editError) setEditError(null);
                  }}
                  className="mt-1.5 w-full rounded-xl border-2 border-[#1b1b1b] bg-white px-3.5 py-2.5 font-mono-tabular text-sm font-medium text-[#1b1b1b] focus:outline-none"
                />
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
                  type="submit"
                  disabled={editSaving}
                  className="btn-craft-primary rounded-xl px-5 py-2 text-xs font-bold disabled:opacity-50"
                >
                  {editSaving ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>

      {/* Reset Coordinator Passcode Modal */}
      <Dialog.Root
        open={Boolean(resetTarget)}
        onOpenChange={(open) => {
          if (!open && !resetting) setResetTarget(null);
        }}
      >
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 z-50 bg-[#1b1b1b]/65 backdrop-blur-xs" />
          <Dialog.Content className="fixed top-1/2 left-1/2 z-50 w-[92vw] max-w-md -translate-x-1/2 -translate-y-1/2 rounded-2xl border-2 border-[#1b1b1b] bg-[#fffaf0] p-6 text-[#5a0f14] shadow-[8px_8px_0_0_#1b1b1b] focus:outline-none">
            <div className="flex items-start justify-between">
              <div>
                <Dialog.Title className="font-heading text-lg font-extrabold text-[#5a0f14]">
                  Reset Coordinator Passcode
                </Dialog.Title>
                <Dialog.Description className="mt-1 text-xs text-[#4a4642]">
                  Assign a new 6-digit passcode for{' '}
                  <strong>{resetTarget?.full_name}</strong>. Previous sessions will be signed out immediately.
                </Dialog.Description>
              </div>
              <Dialog.Close asChild>
                <button
                  type="button"
                  aria-label="Close reset passcode dialog"
                  className="rounded-lg border-2 border-[#1b1b1b] bg-[#fff4e2] p-1.5 text-[#1b1b1b]"
                >
                  <X className="h-4 w-4" />
                </button>
              </Dialog.Close>
            </div>

            <form
              onSubmit={(e) => void handleConfirmReset(e)}
              noValidate
              className="mt-4 space-y-4"
            >
              <div className="space-y-2">
                <PasscodeBoxes
                  idPrefix="coord-reset-passcode"
                  label="New 6-Digit Passcode"
                  value={newPasscode}
                  onChange={(val) => {
                    setNewPasscode(val);
                    if (resetError) setResetError(null);
                  }}
                  disabled={resetting}
                  autoFocus
                />
                <div className="flex justify-end">
                  <button
                    type="button"
                    disabled={resetting}
                    onClick={() => {
                      setNewPasscode(generateSixDigitCode());
                      if (resetError) setResetError(null);
                    }}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-[#1b1b1b]/25 bg-white px-2.5 py-1 text-[11px] font-bold text-[#8e1b1b] hover:border-[#1b1b1b] hover:bg-[#ffe066]/40"
                  >
                    <Sparkles className="h-3 w-3" />
                    <span>Auto-Generate 6-Digit</span>
                  </button>
                </div>
              </div>

              {resetError && (
                <p className="text-xs font-bold text-[#c8221a]">{resetError}</p>
              )}

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setResetTarget(null)}
                  className="btn-craft-secondary rounded-xl px-4 py-2 text-xs font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={resetting}
                  className="btn-craft-primary rounded-xl px-5 py-2 text-xs font-bold disabled:opacity-50"
                >
                  {resetting ? 'Updating...' : 'Update Passcode'}
                </button>
              </div>
            </form>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>

      {/* Deactivate Confirmation */}
      <ConfirmDialog
        open={Boolean(deactivateTarget)}
        onOpenChange={(open) => {
          if (!open && !togglingId) {
            setDeactivateTarget(null);
          }
        }}
        title="Deactivate Coordinator?"
        description={
          deactivateTarget
            ? `Deactivate ${deactivateTarget.full_name} (${deactivateTarget.phone_number})? They will immediately lose portal and scanner access until reactivated.`
            : ''
        }
        confirmLabel="Deactivate Access"
        cancelLabel="Cancel"
        variant="danger"
        loading={Boolean(deactivateTarget && togglingId === deactivateTarget.id)}
        onConfirm={() => {
          if (deactivateTarget) {
            void handleToggleActive(deactivateTarget);
          }
        }}
      />
    </div>
  );
}
