import { useState, type FormEvent } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import {
  CheckCircle2,
  Edit3,
  KeyRound,
  Plus,
  ShieldCheck,
  UserCheck,
  UserX,
  X,
} from 'lucide-react';
import { ConfirmDialog } from '../common/ConfirmDialog.tsx';
import { PasscodeBoxes } from '../common/PasscodeBoxes.tsx';
import { formatDateTime } from '../../lib/utils.ts';
import {
  createCoordinatorSchema,
  resetPasscodeSchema,
} from '../../lib/validation.ts';
import type { AdminAccountPublic } from '../../types/database.types.ts';

export function CoordinatorManagement({
  accounts,
  loading,
  onCreate,
  onUpdate,
  onResetPasscode,
}: {
  accounts: AdminAccountPublic[];
  loading: boolean;
  onCreate: (payload: {
    full_name: string;
    phone_number: string;
    passcode: string;
  }) => Promise<void>;
  onUpdate: (
    id: string,
    payload: { full_name?: string; phone_number?: string; is_active?: boolean }
  ) => Promise<void>;
  onResetPasscode: (
    id: string,
    payload: { passcode: string }
  ) => Promise<void>;
}) {
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [passcode, setPasscode] = useState('');
  const [createError, setCreateError] = useState<string | null>(null);
  const [createSuccess, setCreateSuccess] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);

  const [editing, setEditing] = useState<AdminAccountPublic | null>(null);
  const [editName, setEditName] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editError, setEditError] = useState<string | null>(null);
  const [savingEdit, setSavingEdit] = useState(false);

  const [resetTarget, setResetTarget] = useState<AdminAccountPublic | null>(
    null
  );
  const [newPasscode, setNewPasscode] = useState('');
  const [resetError, setResetError] = useState<string | null>(null);
  const [savingReset, setSavingReset] = useState(false);

  const [toggleTarget, setToggleTarget] = useState<AdminAccountPublic | null>(
    null
  );
  const [toggling, setToggling] = useState(false);

  const handleCreate = async (e: FormEvent) => {
    e.preventDefault();
    setCreateError(null);
    setCreateSuccess(null);

    const parsed = createCoordinatorSchema.safeParse({
      full_name: fullName,
      phone_number: phone,
      passcode,
    });

    if (!parsed.success) {
      setCreateError(
        parsed.error.issues[0]?.message || 'Check coordinator form fields.'
      );
      return;
    }

    setCreating(true);
    try {
      await onCreate(parsed.data);
      setFullName('');
      setPhone('');
      setPasscode('');
      setCreateSuccess('Coordinator account created successfully.');
    } catch (err) {
      setCreateError(
        err instanceof Error ? err.message : 'Unable to create coordinator.'
      );
    } finally {
      setCreating(false);
    }
  };

  const handleSaveEdit = async () => {
    if (!editing) return;
    setEditError(null);
    setSavingEdit(true);
    try {
      await onUpdate(editing.id, {
        full_name: editName.trim(),
        phone_number: editPhone.trim(),
      });
      setEditing(null);
    } catch (err) {
      setEditError(
        err instanceof Error ? err.message : 'Failed to update coordinator.'
      );
    } finally {
      setSavingEdit(false);
    }
  };

  const handleResetPasscode = async () => {
    if (!resetTarget) return;
    setResetError(null);
    const parsed = resetPasscodeSchema.safeParse({
      passcode: newPasscode,
    });
    if (!parsed.success) {
      setResetError(parsed.error.issues[0]?.message || 'Invalid passcode.');
      return;
    }
    setSavingReset(true);
    try {
      await onResetPasscode(resetTarget.id, parsed.data);
      setResetTarget(null);
      setNewPasscode('');
      setCreateSuccess(`Passcode updated for ${resetTarget.full_name}.`);
    } catch (err) {
      setResetError(
        err instanceof Error ? err.message : 'Unable to reset passcode.'
      );
    } finally {
      setSavingReset(false);
    }
  };

  const handleConfirmToggle = async () => {
    if (!toggleTarget) return;
    setToggling(true);
    try {
      await onUpdate(toggleTarget.id, { is_active: !toggleTarget.is_active });
      setToggleTarget(null);
    } finally {
      setToggling(false);
    }
  };

  return (
    <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
      {/* Create Coordinator Form */}
      <form
        onSubmit={(e) => void handleCreate(e)}
        className="rounded-2xl border-2 border-[#1b1b1b] bg-[#fffaf0] p-5 shadow-[4px_4px_0_0_#1b1b1b] xl:col-span-1"
      >
        <div className="flex items-center gap-2.5">
          <Plus className="h-5 w-5 text-[#8e1b1b]" />
          <h2 className="font-heading text-base font-extrabold text-[#5a0f14]">
            Create Coordinator
          </h2>
        </div>
        <p className="mt-1 text-xs text-[#4a4642]">
          Provision a coordinator account with phone number and 6-digit numeric passcode.
        </p>

        <div className="mt-5 space-y-4">
          <div>
            <label className="block text-xs font-bold uppercase text-[#5a0f14]">
              Full Name
            </label>
            <input
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="e.g., Riya Panda"
              className="mt-1.5 w-full rounded-xl border-2 border-[#1b1b1b] bg-white px-3.5 py-2.5 text-sm font-medium text-[#1b1b1b] focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase text-[#5a0f14]">
              Phone Number
            </label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="10-digit mobile number"
              className="mt-1.5 w-full rounded-xl border-2 border-[#1b1b1b] bg-white px-3.5 py-2.5 font-mono-tabular text-sm font-medium text-[#1b1b1b] focus:outline-none"
            />
          </div>

          <PasscodeBoxes
            idPrefix="coord-create-passcode"
            label="Six-Digit Passcode"
            value={passcode}
            onChange={(val) => {
              setPasscode(val);
              if (createError) setCreateError(null);
            }}
            disabled={creating}
          />

          {createError && (
            <p className="text-xs font-bold text-[#c8221a]">{createError}</p>
          )}
          {createSuccess && (
            <p className="flex items-center gap-1.5 text-xs font-bold text-[#3e9b47]">
              <CheckCircle2 className="h-4 w-4 shrink-0" />
              {createSuccess}
            </p>
          )}

          <button
            type="submit"
            disabled={creating}
            className="btn-craft-primary w-full rounded-xl px-5 py-3 font-heading text-xs font-bold tracking-wider uppercase disabled:opacity-50"
          >
            {creating ? 'CREATING...' : 'CREATE COORDINATOR →'}
          </button>
        </div>
      </form>

      {/* Accounts Table */}
      <div className="overflow-hidden rounded-2xl border-2 border-[#1b1b1b] bg-[#fffaf0] shadow-[4px_4px_0_0_#1b1b1b] xl:col-span-2">
        <div className="border-b-2 border-[#1b1b1b] bg-[#f6efe2] px-5 py-4">
          <h2 className="font-heading text-base font-extrabold text-[#5a0f14]">
            Organizer Accounts
          </h2>
          <p className="mt-0.5 text-xs text-[#4a4642]">
            Manage coordinators, reset passcodes, and control account activation.
          </p>
        </div>

        {loading ? (
          <div className="p-8 text-center text-sm text-[#4a4642]">
            Loading organizer accounts...
          </div>
        ) : (
          <div className="overflow-x-auto bg-white">
            <table className="w-full min-w-[640px] border-collapse text-left text-sm">
              <thead>
                <tr className="border-b-2 border-[#1b1b1b] bg-[#f6efe2]/70 text-xs font-bold uppercase text-[#5a0f14]">
                  <th className="px-4 py-3">Name</th>
                  <th className="px-4 py-3">Phone Number</th>
                  <th className="px-4 py-3">Role</th>
                  <th className="px-4 py-3">Created</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1b1b1b]/15">
                {accounts.map((acc) => {
                  const isSuper = acc.role === 'super_admin';
                  return (
                    <tr key={acc.id} className="hover:bg-[#fff4e2]/65">
                      <td className="px-4 py-3 font-bold text-[#5a0f14]">
                        {acc.full_name}
                      </td>
                      <td className="px-4 py-3 font-mono-tabular text-xs text-[#4a4642]">
                        {acc.phone_number}
                      </td>
                      <td className="px-4 py-3 text-xs font-bold">
                        <span
                          className={
                            isSuper ? 'text-[#8e1b1b]' : 'text-[#1b1b1b]'
                          }
                        >
                          {isSuper ? 'SUPER ADMIN' : 'COORDINATOR'}
                        </span>
                      </td>
                      <td className="px-4 py-3 font-mono-tabular text-xs text-[#4a4642]">
                        {formatDateTime(acc.created_at)}
                      </td>
                      <td className="px-4 py-3 text-xs font-bold">
                        <span
                          className={
                            acc.is_active ? 'text-[#3e9b47]' : 'text-[#c8221a]'
                          }
                        >
                          {acc.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            type="button"
                            title="Edit organizer info"
                            onClick={() => {
                              setEditing(acc);
                              setEditName(acc.full_name);
                              setEditPhone(acc.phone_number);
                              setEditError(null);
                            }}
                            className="rounded-lg p-1.5 text-[#4a4642] hover:bg-[#f6efe2] hover:text-[#1b1b1b]"
                          >
                            <Edit3 className="h-4 w-4" />
                          </button>

                          {!isSuper ? (
                            <>
                              <button
                                type="button"
                                title="Reset 6-digit passcode"
                                onClick={() => {
                                  setResetTarget(acc);
                                  setNewPasscode('');
                                  setResetError(null);
                                }}
                                className="rounded-lg p-1.5 text-[#4a4642] hover:bg-[#f6efe2] hover:text-[#8e1b1b]"
                              >
                                <KeyRound className="h-4 w-4" />
                              </button>
                              <button
                                type="button"
                                title={
                                  acc.is_active
                                    ? 'Deactivate coordinator'
                                    : 'Activate coordinator'
                                }
                                onClick={() => setToggleTarget(acc)}
                                className={`rounded-lg p-1.5 hover:bg-[#f6efe2] ${
                                  acc.is_active
                                    ? 'text-[#4a4642] hover:text-[#c8221a]'
                                    : 'text-[#4a4642] hover:text-[#3e9b47]'
                                }`}
                              >
                                {acc.is_active ? (
                                  <UserX className="h-4 w-4" />
                                ) : (
                                  <UserCheck className="h-4 w-4" />
                                )}
                              </button>
                            </>
                          ) : (
                            <span
                              title="Primary Super Admin"
                              className="p-1.5 text-[#e0a526]"
                            >
                              <ShieldCheck className="h-4 w-4" />
                            </span>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Edit Coordinator Modal */}
      <Dialog.Root open={Boolean(editing)} onOpenChange={() => setEditing(null)}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 z-50 bg-[#1b1b1b]/65 backdrop-blur-xs" />
          <Dialog.Content className="fixed top-1/2 left-1/2 z-50 w-[92vw] max-w-md -translate-x-1/2 -translate-y-1/2 rounded-2xl border-2 border-[#1b1b1b] bg-[#fffaf0] p-6 text-[#5a0f14] shadow-[8px_8px_0_0_#1b1b1b] focus:outline-none">
            <div className="flex items-center justify-between">
              <Dialog.Title className="font-heading text-base font-extrabold text-[#5a0f14]">
                Edit Organizer Details
              </Dialog.Title>
              <Dialog.Close asChild>
                <button
                  type="button"
                  aria-label="Close"
                  className="rounded-lg border-2 border-[#1b1b1b] bg-[#fff4e2] p-1.5 text-[#1b1b1b]"
                >
                  <X className="h-4 w-4" />
                </button>
              </Dialog.Close>
            </div>
            <div className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase text-[#5a0f14]">
                  Full Name
                </label>
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="mt-1.5 w-full rounded-xl border-2 border-[#1b1b1b] bg-white px-3 py-2 text-sm font-medium text-[#1b1b1b] focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-bold uppercase text-[#5a0f14]">
                  Phone Number
                </label>
                <input
                  type="tel"
                  value={editPhone}
                  onChange={(e) => setEditPhone(e.target.value)}
                  className="mt-1.5 w-full rounded-xl border-2 border-[#1b1b1b] bg-white px-3 py-2 text-sm font-medium text-[#1b1b1b] focus:outline-none"
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
                  type="button"
                  disabled={savingEdit}
                  onClick={() => void handleSaveEdit()}
                  className="btn-craft-primary rounded-xl px-4 py-2 text-xs font-bold"
                >
                  {savingEdit ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>

      {/* Reset Passcode Modal */}
      <Dialog.Root
        open={Boolean(resetTarget)}
        onOpenChange={() => setResetTarget(null)}
      >
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 z-50 bg-[#1b1b1b]/65 backdrop-blur-xs" />
          <Dialog.Content className="fixed top-1/2 left-1/2 z-50 w-[92vw] max-w-md -translate-x-1/2 -translate-y-1/2 rounded-2xl border-2 border-[#1b1b1b] bg-[#fffaf0] p-6 text-[#5a0f14] shadow-[8px_8px_0_0_#1b1b1b] focus:outline-none">
            <div className="flex items-center justify-between">
              <Dialog.Title className="font-heading text-base font-extrabold text-[#5a0f14]">
                Reset Passcode — {resetTarget?.full_name}
              </Dialog.Title>
              <Dialog.Close asChild>
                <button
                  type="button"
                  aria-label="Close"
                  className="rounded-lg border-2 border-[#1b1b1b] bg-[#fff4e2] p-1.5 text-[#1b1b1b]"
                >
                  <X className="h-4 w-4" />
                </button>
              </Dialog.Close>
            </div>
            <div className="mt-4 space-y-4">
              <PasscodeBoxes
                idPrefix="coord-reset-passcode"
                label="New Six-Digit Passcode"
                value={newPasscode}
                onChange={(val) => {
                  setNewPasscode(val);
                  if (resetError) setResetError(null);
                }}
                disabled={savingReset}
              />

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
                  type="button"
                  disabled={savingReset}
                  onClick={() => void handleResetPasscode()}
                  className="btn-craft-primary rounded-xl px-4 py-2 text-xs font-bold"
                >
                  {savingReset ? 'Updating...' : 'Update Passcode'}
                </button>
              </div>
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>

      {/* Activate / Deactivate Confirmation */}
      <ConfirmDialog
        open={Boolean(toggleTarget)}
        onOpenChange={(open) => !open && setToggleTarget(null)}
        title={
          toggleTarget?.is_active
            ? 'Deactivate Coordinator Account?'
            : 'Activate Coordinator Account?'
        }
        description={
          toggleTarget?.is_active
            ? `${toggleTarget?.full_name} will immediately lose access to the IGNITION 2K26 organizer dashboard.`
            : `${toggleTarget?.full_name} will regain access to the organizer dashboard.`
        }
        confirmLabel={toggleTarget?.is_active ? 'Deactivate' : 'Activate'}
        variant={toggleTarget?.is_active ? 'danger' : 'primary'}
        loading={toggling}
        onConfirm={() => void handleConfirmToggle()}
      />
    </div>
  );
}
