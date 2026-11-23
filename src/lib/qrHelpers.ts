import QRCode from 'qrcode';

export function buildVerificationUrl(token: string, passNumber?: string): string {
  const origin =
    typeof window !== 'undefined' &&
    window.location?.origin &&
    window.location.origin !== 'null'
      ? window.location.origin
      : 'https://ignition2026.app';
  const params = new URLSearchParams({ token });
  if (passNumber) {
    params.set('reg', passNumber);
  }
  return `${origin}/verify?${params.toString()}`;
}

export async function generateQrDataUrl(value: string): Promise<string> {
  return QRCode.toDataURL(value, {
    width: 320,
    margin: 2,
    errorCorrectionLevel: 'M',
    color: {
      dark: '#1b1b1b',
      light: '#FFFFFF',
    },
  });
}

export function extractScanTarget(raw: string): {
  token?: string;
  passNumber?: string;
  query: string;
} {
  const trimmed = raw.trim();
  if (!trimmed) return { query: '' };

  // JSON QR payloads if any
  if (trimmed.startsWith('{') && trimmed.endsWith('}')) {
    try {
      const parsed = JSON.parse(trimmed) as {
        token?: string;
        pass_number?: string;
        reg?: string;
      };
      return {
        token: parsed.token,
        passNumber: parsed.pass_number || parsed.reg,
        query: parsed.pass_number || parsed.reg || parsed.token || trimmed,
      };
    } catch {
      // fall through
    }
  }

  // URL with query or hash query (?token=...&reg=...)
  const queryIdx = trimmed.indexOf('?');
  if (queryIdx !== -1) {
    const qs = trimmed.slice(queryIdx + 1);
    const params = new URLSearchParams(qs);
    const token = params.get('token')?.trim() || undefined;
    const reg = params.get('reg')?.trim() || undefined;
    if (token || reg) {
      return {
        token,
        passNumber: reg,
        query: reg || token || trimmed,
      };
    }
  }

  // Direct Registration ID (e.g. IGNITION26-00001 or IGN26-ME-00001)
  if (/^(IGNITION26|IGN26-ME)-\d+$/i.test(trimmed)) {
    return {
      passNumber: trimmed.toUpperCase(),
      query: trimmed.toUpperCase(),
    };
  }

  return {
    token: trimmed.length >= 12 ? trimmed : undefined,
    query: trimmed,
  };
}
