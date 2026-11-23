import { useState, type RefObject } from 'react';
import { Check, Download, Loader2 } from 'lucide-react';
import { downloadNodeAsPng, sanitizeFilename } from '../../lib/exportHelpers.ts';

export function PassDownload({
  passRef,
  passNumber,
  eventName,
}: {
  passRef: RefObject<HTMLDivElement | null>;
  studentName?: string;
  passNumber: string;
  verificationToken?: string;
  eventName: string;
}) {
  const [downloading, setDownloading] = useState(false);
  const [downloaded, setDownloaded] = useState(false);

  const baseName = `${sanitizeFilename(eventName)}-pass-${sanitizeFilename(passNumber)}`;

  const handleDownloadPass = async () => {
    if (!passRef.current || downloading) return;
    setDownloading(true);
    try {
      await downloadNodeAsPng(passRef.current, `${baseName}.png`);
      setDownloaded(true);
      window.setTimeout(() => setDownloaded(false), 3000);
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="space-y-2.5">
      <button
        type="button"
        disabled={downloading}
        onClick={handleDownloadPass}
        className="btn-craft-turmeric inline-flex min-h-[52px] w-full items-center justify-center gap-2.5 rounded-xl px-6 py-3.5 font-heading text-sm font-extrabold tracking-wider uppercase disabled:opacity-55 whitespace-nowrap"
      >
        {downloading ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin text-[#1b1b1b]" />
            <span>Preparing Event Pass...</span>
          </>
        ) : (
          <>
            <Download className="h-4 w-4 text-[#1b1b1b]" />
            <span>Download My Event Pass</span>
          </>
        )}
      </button>

      {downloaded && (
        <p className="flex items-center justify-center gap-1.5 text-xs font-bold text-[#3e9b47]">
          <Check className="h-3.5 w-3.5" />
          Event pass saved to your device
        </p>
      )}
    </div>
  );
}
