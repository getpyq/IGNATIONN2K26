import { Loader2 } from 'lucide-react';

export function LoadingScreen({
  message = 'Loading IGNITION 2K26...',
}: {
  message?: string;
}) {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 px-6 text-center">
      <div className="flex h-12 w-12 items-center justify-center rounded-xl border-2 border-[#1b1b1b] bg-[#fffaf0] shadow-[3px_3px_0_0_#1b1b1b]">
        <Loader2 className="h-6 w-6 animate-spin text-[#8e1b1b]" />
      </div>
      <p className="text-sm font-semibold text-[#5a0f14]">{message}</p>
    </div>
  );
}
