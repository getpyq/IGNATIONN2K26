import crypto from 'node:crypto';
import type { AdminRole } from '../src/types/database.types.ts';

declare global {
  var _ignitionRateLimits: Map<string, number[]> | undefined;
}

export interface SessionPayload {
  sub: string;
  role: AdminRole;
  iat: number;
}

function deriveAdminSigningKey(adminId: string, passcode: string): string {
  const envSecret = process.env.SESSION_SECRET?.trim() || '';
  return crypto
    .createHash('sha256')
    .update(`${envSecret}|${adminId.trim()}|${passcode.trim()}`)
    .digest('hex');
}

export function signSessionTokenForAdmin(
  adminId: string,
  role: AdminRole,
  passcode: string
): string {
  const payload: SessionPayload = {
    sub: adminId,
    role,
    iat: Date.now(),
  };
  const encoded = Buffer.from(JSON.stringify(payload), 'utf8').toString(
    'base64url'
  );
  const sig = crypto
    .createHmac('sha256', deriveAdminSigningKey(adminId, passcode))
    .update(encoded)
    .digest('base64url');
  return `${encoded}.${sig}`;
}

export function parseSessionToken(token: string): SessionPayload | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 2) return null;
    const [encoded, sig] = parts;
    if (!encoded || !sig) return null;

    const payload = JSON.parse(
      Buffer.from(encoded, 'base64url').toString('utf8')
    ) as SessionPayload;

    if (!payload.sub || !payload.role) {
      return null;
    }
    return payload;
  } catch {
    return null;
  }
}

export function verifySessionTokenForAdmin(
  token: string,
  passcode: string
): SessionPayload | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 2) return null;
    const [encoded, sig] = parts;
    if (!encoded || !sig) return null;

    const payload = parseSessionToken(token);
    if (!payload) return null;

    const expectedSig = crypto
      .createHmac('sha256', deriveAdminSigningKey(payload.sub, passcode))
      .update(encoded)
      .digest('base64url');

    const sigBuf = Buffer.from(sig);
    const expBuf = Buffer.from(expectedSig);
    if (sigBuf.length !== expBuf.length) return null;
    if (!crypto.timingSafeEqual(sigBuf, expBuf)) return null;

    return payload;
  } catch {
    return null;
  }
}

export function checkRateLimit(
  key: string,
  maxAttempts: number,
  windowMs: number
): { allowed: boolean; retryAfterSec: number } {
  if (!globalThis._ignitionRateLimits) {
    globalThis._ignitionRateLimits = new Map();
  }
  const now = Date.now();
  const timestamps = (globalThis._ignitionRateLimits.get(key) || []).filter(
    (t) => now - t < windowMs
  );

  if (timestamps.length >= maxAttempts) {
    const oldest = timestamps[0] ?? now;
    const retryAfterSec = Math.max(
      1,
      Math.ceil((windowMs - (now - oldest)) / 1000)
    );
    globalThis._ignitionRateLimits.set(key, timestamps);
    return { allowed: false, retryAfterSec };
  }

  timestamps.push(now);
  globalThis._ignitionRateLimits.set(key, timestamps);
  return { allowed: true, retryAfterSec: 0 };
}

export function clearRateLimit(key: string): void {
  globalThis._ignitionRateLimits?.delete(key);
}
