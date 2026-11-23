import * as Dialog from '@radix-ui/react-dialog';
import { X } from 'lucide-react';

export function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  variant = 'primary',
  loading = false,
  onConfirm,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: 'primary' | 'danger';
  loading?: boolean;
  onConfirm: () => void;
}) {
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-[#1b1b1b]/65 backdrop-blur-xs" />
        <Dialog.Content className="fixed top-1/2 left-1/2 z-50 w-[92vw] max-w-md -translate-x-1/2 -translate-y-1/2 rounded-2xl border-2 border-[#1b1b1b] bg-[#fffaf0] p-6 text-[#5a0f14] shadow-[6px_6px_0_0_#1b1b1b] focus:outline-none">
          <div className="flex items-start justify-between gap-4">
            <Dialog.Title className="font-heading text-xl font-bold text-[#5a0f14]">
              {title}
            </Dialog.Title>
            <Dialog.Close asChild>
              <button
                type="button"
                aria-label="Close dialog"
                className="rounded-lg border-2 border-[#1b1b1b] bg-[#fff4e2] p-1.5 text-[#1b1b1b] transition-colors hover:bg-[#f6efe2]"
              >
                <X className="h-4 w-4" />
              </button>
            </Dialog.Close>
          </div>
          <Dialog.Description className="mt-2.5 text-sm leading-relaxed text-[#4a4642]">
            {description}
          </Dialog.Description>
          <div className="mt-6 flex items-center justify-end gap-3">
            <Dialog.Close asChild>
              <button
                type="button"
                disabled={loading}
                className="btn-craft-secondary rounded-xl px-4 py-2 text-sm font-semibold whitespace-nowrap shrink-0"
              >
                {cancelLabel}
              </button>
            </Dialog.Close>
            <button
              type="button"
              disabled={loading}
              onClick={onConfirm}
              className={`rounded-xl border-2 border-[#1b1b1b] px-4 py-2 text-sm font-bold text-[#fff4e2] shadow-[3px_3px_0_0_#1b1b1b] transition-all active:translate-x-[2px] active:translate-y-[2px] active:shadow-[1px_1px_0_0_#1b1b1b] whitespace-nowrap shrink-0 disabled:opacity-50 ${
                variant === 'danger'
                  ? 'bg-[#c8221a] hover:brightness-105'
                  : 'bg-[#8a1717] hover:brightness-105'
              }`}
            >
              {loading ? 'Processing...' : confirmLabel}
            </button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
