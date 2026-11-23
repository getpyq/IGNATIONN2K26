import { useState, type RefObject } from 'react';
import { Check, Download, Loader2 } from 'lucide-react';
import { downloadNodeAsPng, sanitizeFilename } from '../../lib/exportHelpers.ts';

export function PosterDownload({
  posterRef,
  posterImageUrl,
  studentName,
  eventName,
}: {
  posterRef?: RefObject<HTMLDivElement | null>;
  posterImageUrl?: string;
  studentName: string;
  passNumber?: string;
  eventName: string;
}) {
  const [downloading, setDownloading] = useState(false);
  const [downloaded, setDownloaded] = useState(false);

  const fileName = posterImageUrl
    ? `${sanitizeFilename(eventName)}-event-poster.png`
    : `${sanitizeFilename(eventName)}-poster-${sanitizeFilename(studentName)}.png`;

  const handleDownloadPoster = async () => {
    if (downloading) return;
    setDownloading(true);
    try {
      if (posterImageUrl) {
        const link = document.createElement('a');
        if (posterImageUrl.startsWith('data:')) {
          link.href = posterImageUrl;
          link.download = fileName;
          document.body.appendChild(link);
          link.click();
          link.remove();
        } else {
          const res = await fetch(posterImageUrl);
          const blob = await res.blob();
          const url = URL.createObjectURL(blob);
          link.href = url;
          link.download = fileName;
          document.body.appendChild(link);
          link.click();
          link.remove();
          URL.revokeObjectURL(url);
        }
      } else if (posterRef?.current) {
        await downloadNodeAsPng(posterRef.current, fileName);
      }
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
        onClick={handleDownloadPoster}
        className="btn-craft-turmeric inline-flex min-h-[52px] w-full items-center justify-center gap-2.5 rounded-xl px-6 py-3.5 font-heading text-sm font-extrabold tracking-wider uppercase disabled:opacity-55 whitespace-nowrap"
      >
        {downloading ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin text-[#1b1b1b]" />
            <span>Preparing Poster...</span>
          </>
        ) : (
          <>
            <Download className="h-4 w-4 text-[#1b1b1b]" />
            <span>Download Poster</span>
          </>
        )}
      </button>

      {downloaded && (
        <p className="flex items-center justify-center gap-1.5 text-xs font-bold text-[#3e9b47]">
          <Check className="h-3.5 w-3.5" />
          Poster saved to your device
        </p>
      )}
    </div>
  );
}
