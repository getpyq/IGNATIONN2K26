import crypto from 'node:crypto';
import type { AdminRole } from '../src/types/database.types.ts';

declare global {
  var _ignitionSigningKey: string | undefined;
  var _ignitionRateLimits: Map<string, number[]> | undefined;
}

function getSigningKey(): string {
  const envSecret = process.env.SESSION_SECRET?.trim();
  if (envSecret) {
    return crypto.createHash('sha256').update(envSecret).digest('hex');
  }
  if (!globalThis._ignitionSigningKey) {
    globalThis._ignitionSigningKey = crypto.randomBytes(32).toString('hex');
  }
  return globalThis._ignitionSigningKey;
}

export interface SessionPayload {
  sub: string;
  role: AdminRole;
  iat: number;
}

export function signSessionToken(adminId: string, role: AdminRole): string {
  const payload: SessionPayload = {
    sub: adminId,
    role,
    iat: Date.now(),
  };
  const encoded = Buffer.from(JSON.stringify(payload), 'utf8').toString('base64url');
  const sig = crypto
    .createHmac('sha256', getSigningKey())
    .update(encoded)
    .digest('base64url');
  return `${encoded}.${sig}`;
}

export function verifySessionToken(token: string): SessionPayload | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 2) return null;
    const [encoded, sig] = parts;
    if (!encoded || !sig) return null;

    const expectedSig = crypto
      .createHmac('sha256', getSigningKey())
      .update(encoded)
      .digest('base64url');

    const sigBuf = Buffer.from(sig);
    const expBuf = Buffer.from(expectedSig);
    if (sigBuf.length !== expBuf.length) return null;
    if (!crypto.timingSafeEqual(sigBuf, expBuf)) return null;

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
    const retryAfterSec = Math.max(1, Math.ceil((windowMs - (now - oldest)) / 1000));
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
