import { useEffect, useState } from 'react';
import {
  buildVerificationUrl,
  generateQrDataUrl,
} from '../../lib/qrHelpers.ts';

export function QRCodeDisplay({
  token,
  passNumber,
  size = 100,
}: {
  token: string;
  passNumber?: string;
  size?: number;
}) {
  const [dataUrl, setDataUrl] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    const url = buildVerificationUrl(token, passNumber);
    generateQrDataUrl(url)
      .then((res) => {
        if (active) setDataUrl(res);
      })
      .catch(() => {
        if (active) setDataUrl(null);
      });
    return () => {
      active = false;
    };
  }, [token, passNumber]);

  if (!dataUrl) {
    return (
      <div
        style={{ width: size, height: size }}
        className="flex items-center justify-center rounded-xl border-2 border-[#1b1b1b] bg-white text-[10px] font-bold text-[#1b1b1b]"
      >
        QR Ready
      </div>
    );
  }

  return (
    <img
      src={dataUrl}
      alt="Pass Verification QR Code"
      width={size}
      height={size}
      className="rounded-xl border-2 border-[#1b1b1b] bg-white p-1 shadow-[2px_2px_0_0_#1b1b1b]"
    />
  );
}
