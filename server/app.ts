import express, { type Request, type Response, type NextFunction } from 'express';
import dotenv from 'dotenv';
import {
  checkRateLimit,
  clearRateLimit,
  signSessionToken,
  verifySessionToken,
} from './security.ts';
import {
  AppsScriptError,
  callAppsScript,
} from './googleSheetsBridge.ts';
import {
  adminBootstrapSchema,
  adminLoginSchema,
  createCoordinatorSchema,
  registrationSubmissionSchema,
  resetPasscodeSchema,
  updateCoordinatorSchema,
} from '../src/lib/validation.ts';
import type {
  AdminAccountPublic,
  AdminOverviewSummary,
  AdminRole,
  CheckInScanResponse,
  EventSettings,
  FoodPreference,
  PassVerificationResult,
  RegistrationRecord,
} from '../src/types/database.types.ts';

dotenv.config();

const SESSION_COOKIE_NAME = 'ignition_admin_session';

const WEBSITE_EVENT_SETTINGS: Omit<EventSettings, 'current_registrations'> = {
  id: 'default',
  event_name: 'IGNITION 2K26',
  event_tagline: 'THE FRESHERS WELCOME CELEBRATION',
  department_name: 'Department of Mechanical Engineering',
  institution_name: 'Parala Maharaja Engineering College',
  event_date: '5 December 2026 · 10:00 AM',
  event_venue: 'Seminar Hall (Room No-217)',
  event_description:
    'Step into a mystery crafted just for you — hidden surprises, live music, thrilling performances, and unforgettable moments await behind the curtain.',
  registration_open: true,
  maximum_registrations: 500,
  updated_at: '2026-11-01T00:00:00.000Z',
};

interface SheetAdminRow {
  id: string;
  full_name: string;
  phone_number: string;
  passcode?: string;
  role: AdminRole;
  is_active: boolean | number;
  created_at: string;
  updated_at: string;
}

interface SheetRegistrationRow {
  id: string;
  student_name: string;
  selected_talents: string | string[];
  other_talent_description: string | null;
  food_preference: FoodPreference;
  pass_number: string;
  created_at: string;
  checked_in?: boolean | number;
  checkin_time?: string | null;
  checked_in_by?: string | null;
}

interface AuthenticatedRequest extends Request {
  admin?: AdminAccountPublic;
}

function sanitizeAdmin(row: SheetAdminRow): AdminAccountPublic {
  return {
    id: row.id,
    full_name: row.full_name,
    phone_number: row.phone_number,
    role: row.role,
    is_active: Boolean(row.is_active),
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
}

function mapRegistrationRow(
  row: SheetRegistrationRow,
  includeAdminQr = false
): RegistrationRecord {
  let talents: string[] = [];
  if (Array.isArray(row.selected_talents)) {
    talents = row.selected_talents;
  } else {
    try {
      talents = JSON.parse(row.selected_talents);
    } catch {
      talents = [];
    }
  }
  const record: RegistrationRecord = {
    id: row.id,
    student_name: row.student_name,
    selected_talents: Array.isArray(talents) ? talents : [],
    other_talent_description: row.other_talent_description || null,
    food_preference: row.food_preference,
    pass_number: row.pass_number,
    created_at: row.created_at,
    checked_in: Boolean(row.checked_in),
    checkin_time: row.checkin_time || null,
    checked_in_by: row.checked_in_by || null,
  };
  if (includeAdminQr) {
    record.admin_qr_token = row.pass_number;
  }
  return record;
}

function parseCookies(
  cookieHeader: string | undefined
): Record<string, string> {
  if (!cookieHeader) return {};
  const result: Record<string, string> = {};
  for (const part of cookieHeader.split(';')) {
    const idx = part.indexOf('=');
    if (idx > 0) {
      const k = part.slice(0, idx).trim();
      const v = part.slice(idx + 1).trim();
      result[k] = decodeURIComponent(v);
    }
  }
  return result;
}

function setSessionCookie(req: Request, res: Response, token: string): void {
  const isHttps =
    req.secure || req.headers['x-forwarded-proto'] === 'https';
  const parts = [
    `${SESSION_COOKIE_NAME}=${encodeURIComponent(token)}`,
    'Path=/',
    'HttpOnly',
    'Max-Age=315360000',
  ];
  if (isHttps) {
    parts.push('Secure', 'SameSite=None', 'Partitioned');
  } else {
    parts.push('SameSite=Lax');
  }
  res.setHeader('Set-Cookie', parts.join('; '));
}

function clearSessionCookie(req: Request, res: Response): void {
  const isHttps =
    req.secure || req.headers['x-forwarded-proto'] === 'https';
  const parts = [
    `${SESSION_COOKIE_NAME}=`,
    'Path=/',
    'HttpOnly',
    'Max-Age=0',
  ];
  if (isHttps) {
    parts.push('Secure', 'SameSite=None', 'Partitioned');
  } else {
    parts.push('SameSite=Lax');
  }
  res.setHeader('Set-Cookie', parts.join('; '));
}

function getClientIp(req: Request): string {
  const forwarded = req.headers['x-forwarded-for'];
  if (typeof forwarded === 'string' && forwarded.length > 0) {
    return forwarded.split(',')[0].trim();
  }
  return req.ip || 'unknown';
}

function handleRouteError(
  res: Response,
  err: unknown,
  fallbackMessage: string
) {
  if (err instanceof AppsScriptError) {
    return res.status(err.status).json({ error: err.message });
  }
  console.error(fallbackMessage, err);
  return res.status(500).json({ error: fallbackMessage });
}

function parseScannedCode(rawInput: string): {
  id?: string;
  pass_number?: string;
} {
  const raw = rawInput.trim();
  if (!raw) return {};

  let tokenCandidate = raw;
  let regCandidate = '';

  if (raw.startsWith('{') && raw.endsWith('}')) {
    try {
      const parsedJson = JSON.parse(raw) as {
        token?: string;
        pass_number?: string;
        reg?: string;
        id?: string;
      };
      if (parsedJson.reg || parsedJson.pass_number) {
        regCandidate = String(parsedJson.reg || parsedJson.pass_number).trim();
      }
      if (parsedJson.token) {
        tokenCandidate = String(parsedJson.token).trim();
      } else if (parsedJson.id) {
        tokenCandidate = String(parsedJson.id).trim();
      }
    } catch {
      // fall through
    }
  }

  const queryIdx = raw.indexOf('?');
  if (queryIdx !== -1) {
    const qs = raw.slice(queryIdx + 1).split('#')[0];
    const params = new URLSearchParams(qs);
    const t = params.get('token')?.trim();
    const r = params.get('reg')?.trim() || params.get('pass_number')?.trim();
    const idParam = params.get('id')?.trim();
    if (t) tokenCandidate = t;
    if (r) regCandidate = r;
    if (!t && !r && idParam) tokenCandidate = idParam;
  }

  if (tokenCandidate.startsWith('adm.')) {
    try {
      const parts = tokenCandidate.split('.');
      if (parts.length >= 2 && parts[1]) {
        const decoded = Buffer.from(parts[1], 'base64url').toString('utf8');
        const sepIdx = decoded.indexOf(':');
        if (sepIdx > 0) {
          const decodedId = decoded.slice(0, sepIdx).trim();
          const decodedPass = decoded.slice(sepIdx + 1).trim().toUpperCase();
          if (/^(IGNITION26-|IGN26-ME-)\d+$/i.test(decodedPass)) {
            return {
              id: decodedId,
              pass_number: decodedPass,
            };
          }
        }
      }
    } catch {
      // fall through
    }
  }

  if (regCandidate && /^(IGNITION26-|IGN26-ME-)\d+$/i.test(regCandidate)) {
    return { pass_number: regCandidate.toUpperCase() };
  }

  const passMatch =
    tokenCandidate.match(/\b(IGNITION26-|IGN26-ME-)\d+\b/i) ||
    raw.match(/\b(IGNITION26-|IGN26-ME-)\d+\b/i);
  if (passMatch?.[0]) {
    return { pass_number: passMatch[0].toUpperCase() };
  }

  if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(tokenCandidate)) {
    return { id: tokenCandidate };
  }

  return {};
}

async function requireAdmin(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) {
  try {
    const authHeader = req.headers.authorization;
    let token: string | undefined;
    let usedCookie = false;

    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.slice(7).trim();
    } else {
      const cookies = parseCookies(req.headers.cookie);
      token = cookies[SESSION_COOKIE_NAME];
      usedCookie = Boolean(token);
    }

    if (!token) {
      return res.status(401).json({ error: 'Authentication required.' });
    }

    if (usedCookie && ['POST', 'PUT', 'PATCH', 'DELETE'].includes(req.method)) {
      const origin = req.headers.origin;
      const host = (req.headers['x-forwarded-host'] || req.headers.host) as
        | string
        | undefined;
      const hasCustomHeader =
        req.headers['x-requested-with'] === 'IGNITION-Admin';
      if (origin && host) {
        try {
          const originHost = new URL(origin).host;
          if (originHost !== host && !hasCustomHeader) {
            return res.status(403).json({ error: 'Invalid request origin.' });
          }
        } catch {
          return res.status(403).json({ error: 'Invalid request origin.' });
        }
      } else if (!hasCustomHeader) {
        return res.status(403).json({ error: 'Missing CSRF header.' });
      }
    }

    const payload = verifySessionToken(token);
    if (!payload) {
      return res.status(401).json({ error: 'Invalid authentication token. Please sign in again.' });
    }

    const adminRow = await callAppsScript<SheetAdminRow | null>(
      'adminFindById',
      { id: payload.sub }
    );
    if (!adminRow || !adminRow.is_active) {
      return res.status(403).json({ error: 'Account inactive or revoked.' });
    }
    req.admin = sanitizeAdmin(adminRow);
    return next();
  } catch (err) {
    return handleRouteError(res, err, 'Authentication verification failed.');
  }
}

function requireSuperAdmin(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) {
  if (!req.admin || req.admin.role !== 'super_admin') {
    return res.status(403).json({
      error: 'Forbidden: Only the Super Admin can perform this action.',
    });
  }
  next();
}

function filterAndSortRegistrations(
  rows: RegistrationRecord[],
  opts: {
    q?: string;
    food?: string;
    talent?: string;
    from?: string;
    to?: string;
    sortBy?: string;
    sortDir?: 'asc' | 'desc';
    ids?: string[];
  }
): RegistrationRecord[] {
  let list = [...rows];
  if (opts.ids && opts.ids.length > 0) {
    const idSet = new Set(opts.ids);
    list = list.filter((r) => idSet.has(r.id));
  }
  if (opts.q) {
    const needle = opts.q.toLowerCase();
    list = list.filter(
      (r) =>
        r.student_name.toLowerCase().includes(needle) ||
        r.pass_number.toLowerCase().includes(needle) ||
        r.id.toLowerCase().includes(needle)
    );
  }
  if (opts.food === 'vegetarian' || opts.food === 'non_vegetarian') {
    list = list.filter((r) => r.food_preference === opts.food);
  }
  if (opts.talent) {
    list = list.filter((r) => r.selected_talents.includes(opts.talent!));
  }
  if (opts.from) {
    const fromIso =
      opts.from.length === 10 ? `${opts.from}T00:00:00.000Z` : opts.from;
    list = list.filter((r) => r.created_at >= fromIso);
  }
  if (opts.to) {
    const toIso =
      opts.to.length === 10 ? `${opts.to}T23:59:59.999Z` : opts.to;
    list = list.filter((r) => r.created_at <= toIso);
  }

  const dir = opts.sortDir === 'asc' ? 1 : -1;
  const col = opts.sortBy || 'created_at';
  list.sort((a, b) => {
    const av = String((a as unknown as Record<string, unknown>)[col] ?? '');
    const bv = String((b as unknown as Record<string, unknown>)[col] ?? '');
    return av.localeCompare(bv) * dir;
  });

  return list;
}

function computeOverview(rows: RegistrationRecord[]): AdminOverviewSummary {
  let vegCount = 0;
  let nonVegCount = 0;
  let checkedInCount = 0;

  for (const row of rows) {
    if (row.food_preference === 'vegetarian') vegCount += 1;
    else nonVegCount += 1;
    if (row.checked_in) checkedInCount += 1;
  }

  const recent = [...rows].sort((a, b) =>
    b.created_at.localeCompare(a.created_at)
  );

  return {
    total_registrations: rows.length,
    checked_in_count: checkedInCount,
    vegetarian_count: vegCount,
    non_vegetarian_count: nonVegCount,
    recent_registrations: recent,
  };
}

const REGISTRATIONS_CACHE_TTL_MS = 850;
let cachedRegistrations: { data: RegistrationRecord[]; fetchedAt: number } | null = null;
let inflightRegistrationsFetch: Promise<RegistrationRecord[]> | null = null;

function invalidateRegistrationsCache() {
  cachedRegistrations = null;
}

async function fetchAllRegistrations(forceRefresh = false): Promise<RegistrationRecord[]> {
  const now = Date.now();
  if (
    !forceRefresh &&
    cachedRegistrations &&
    now - cachedRegistrations.fetchedAt < REGISTRATIONS_CACHE_TTL_MS
  ) {
    return cachedRegistrations.data;
  }

  if (inflightRegistrationsFetch) {
    return inflightRegistrationsFetch;
  }

  inflightRegistrationsFetch = callAppsScript<SheetRegistrationRow[]>('listRegistrations')
    .then((rows) => {
      const mapped = (rows || []).map((r) => mapRegistrationRow(r, true));
      cachedRegistrations = { data: mapped, fetchedAt: Date.now() };
      return mapped;
    })
    .finally(() => {
      inflightRegistrationsFetch = null;
    });

  return inflightRegistrationsFetch;
}

export function createApp() {
  const app = express();
  app.set('trust proxy', 1);
  app.use(express.json({ limit: '4mb' }));

  app.get('/api/health', (_req, res) => {
    res.json({
      ok: true,
      configured: true,
      backend: 'google_sheets',
    });
  });

  // Public event settings sourced from website code + live Google Sheets registration count
  app.get('/api/settings/public', async (_req, res) => {
    try {
      const counts = await callAppsScript<{ current_registrations?: number }>(
        'getRegistrationCount'
      );
      const currentRegistrations =
        typeof counts?.current_registrations === 'number' &&
        Number.isFinite(counts.current_registrations)
          ? counts.current_registrations
          : Number(counts?.current_registrations) || 0;

      const settings: EventSettings = {
        ...WEBSITE_EVENT_SETTINGS,
        current_registrations: currentRegistrations,
      };
      return res.json(settings);
    } catch (err) {
      return handleRouteError(res, err, 'Failed to load event information.');
    }
  });

  // Student registration submission (real-time Google Sheets + atomic IGNITION26-XXXXX)
  app.post('/api/registrations', async (req, res) => {
    const ip = getClientIp(req);
    const rate = checkRateLimit(`reg:${ip}`, 30, 10 * 60 * 1000);
    if (!rate.allowed) {
      return res.status(429).json({
        error: `Too many requests. Please wait ${rate.retryAfterSec}s and try again.`,
      });
    }

    const parsed = registrationSubmissionSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({
        error: parsed.error.issues[0]?.message || 'Invalid registration data.',
        issues: parsed.error.issues,
      });
    }

    const data = parsed.data;

    try {
      const created = await callAppsScript<SheetRegistrationRow>(
        'registerStudent',
        {
          student_name: data.student_name,
          selected_talents: data.selected_talents,
          other_talent_description: data.selected_talents.includes('Other')
            ? data.other_talent_description
            : null,
          food_preference: data.food_preference,
          registration_open: WEBSITE_EVENT_SETTINGS.registration_open,
          maximum_registrations: WEBSITE_EVENT_SETTINGS.maximum_registrations,
        }
      );

      invalidateRegistrationsCache();
      const cleanRecord = mapRegistrationRow(created, false);
      return res.status(201).json({
        ...cleanRecord,
        verification_token: cleanRecord.pass_number,
      });
    } catch (err) {
      return handleRouteError(
        res,
        err,
        'Unable to complete registration right now. Please retry.'
      );
    }
  });

  // Public minimal QR pass verification endpoint
  app.get('/api/verify', async (req, res) => {
    const ip = getClientIp(req);
    const rate = checkRateLimit(`verify:${ip}`, 60, 5 * 60 * 1000);
    if (!rate.allowed) {
      return res.status(429).json({
        verified: false,
        error: 'Too many verification checks. Please try again shortly.',
      });
    }

    const token =
      typeof req.query.token === 'string' ? req.query.token.trim() : '';
    const reg =
      typeof req.query.reg === 'string' ? req.query.reg.trim().toUpperCase() : '';

    if (!token && !reg) {
      return res.status(400).json({
        verified: false,
        error: 'Invalid or missing verification token.',
      });
    }

    try {
      let lookupPayload = token ? parseScannedCode(token) : {};
      if (!lookupPayload.id && !lookupPayload.pass_number && reg) {
        lookupPayload = parseScannedCode(reg);
      }

      if (!lookupPayload.id && !lookupPayload.pass_number) {
        return res.status(400).json({
          verified: false,
          error: 'Invalid verification token format.',
        });
      }

      const verifiedResult = await callAppsScript<PassVerificationResult | null>(
        'verifyPass',
        lookupPayload
      );

      if (!verifiedResult || !verifiedResult.verified) {
        return res.status(404).json({
          verified: false,
          error: 'Pass verification failed. Record not found or token invalid.',
        });
      }

      return res.json({
        ...verifiedResult,
        event_name: WEBSITE_EVENT_SETTINGS.event_name,
        event_tagline: WEBSITE_EVENT_SETTINGS.event_tagline,
        department_name: WEBSITE_EVENT_SETTINGS.department_name,
        institution_name: WEBSITE_EVENT_SETTINGS.institution_name,
      });
    } catch (err) {
      if (err instanceof AppsScriptError) {
        return res
          .status(err.status)
          .json({ verified: false, error: err.message });
      }
      console.error('Pass verification error:', err);
      return res.status(500).json({
        verified: false,
        error: 'Verification service temporarily unavailable.',
      });
    }
  });

  // Admin bootstrap status
  app.get('/api/admin/bootstrap-status', async (_req, res) => {
    try {
      const status = await callAppsScript<{ initialized: boolean }>(
        'adminBootstrapStatus'
      );
      return res.json({
        configured: true,
        initialized: Boolean(status?.initialized),
      });
    } catch (err) {
      return handleRouteError(res, err, 'Unable to check admin status.');
    }
  });

  // One-time initial Super Admin setup (locks permanently once created)
  app.post('/api/admin/bootstrap', async (req, res) => {
    const ip = getClientIp(req);
    const rate = checkRateLimit(`bootstrap:${ip}`, 10, 15 * 60 * 1000);
    if (!rate.allowed) {
      return res.status(429).json({
        error: `Too many attempts. Retry in ${rate.retryAfterSec}s.`,
      });
    }

    const parsed = adminBootstrapSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({
        error: parsed.error.issues[0]?.message || 'Invalid setup fields.',
      });
    }

    try {
      const admin = await callAppsScript<AdminAccountPublic>(
        'adminBootstrap',
        {
          full_name: parsed.data.full_name,
          phone_number: parsed.data.phone_number,
          passcode: parsed.data.passcode,
        }
      );
      const token = signSessionToken(admin.id, admin.role);
      setSessionCookie(req, res, token);
      return res.status(201).json({ admin, token });
    } catch (err) {
      return handleRouteError(res, err, 'Failed to create Super Admin account.');
    }
  });

  // Admin & Coordinator login (rate-limited, plain-text verification against Google Sheets)
  app.post('/api/admin/login', async (req, res) => {
    const ip = getClientIp(req);
    const parsed = adminLoginSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({
        error: parsed.error.issues[0]?.message || 'Invalid login credentials.',
      });
    }

    const { phone_number, passcode } = parsed.data;
    const ipLimit = checkRateLimit(`login-ip:${ip}`, 10, 15 * 60 * 1000);
    const phoneLimit = checkRateLimit(
      `login-phone:${phone_number}`,
      6,
      15 * 60 * 1000
    );

    if (!ipLimit.allowed || !phoneLimit.allowed) {
      const wait = Math.max(ipLimit.retryAfterSec, phoneLimit.retryAfterSec);
      return res.status(429).json({
        error: `Too many failed login attempts. Please wait ${wait} seconds.`,
      });
    }

    try {
      const found = await callAppsScript<SheetAdminRow | null>(
        'adminFindByPhone',
        { phone_number }
      );
      const adminRow = found ?? undefined;

      const storedPasscode = String(adminRow?.passcode ?? '').trim();

      if (!adminRow || storedPasscode !== passcode.trim()) {
        return res.status(401).json({
          error: 'Invalid phone number or six-digit passcode.',
        });
      }

      if (!adminRow.is_active) {
        return res.status(403).json({
          error: 'This coordinator account has been deactivated by the Super Admin.',
        });
      }

      clearRateLimit(`login-ip:${ip}`);
      clearRateLimit(`login-phone:${phone_number}`);

      const token = signSessionToken(adminRow.id, adminRow.role);
      setSessionCookie(req, res, token);

      return res.json({
        admin: sanitizeAdmin(adminRow),
        token,
      });
    } catch (err) {
      return handleRouteError(res, err, 'Authentication service failed.');
    }
  });

  app.post('/api/admin/logout', (req, res) => {
    clearSessionCookie(req, res);
    res.json({ ok: true });
  });

  app.get('/api/admin/me', requireAdmin, (req: AuthenticatedRequest, res) => {
    res.json({ admin: req.admin });
  });

  // Overview counts + registrations list
  app.get('/api/admin/overview', requireAdmin, async (_req, res) => {
    try {
      const allRecords = await fetchAllRegistrations();
      return res.json(computeOverview(allRecords));
    } catch (err) {
      return handleRouteError(res, err, 'Failed to load dashboard summary.');
    }
  });

  // QR Code Scan Lookup + Auto Check-In (Both Super Admin & Coordinator)
  app.post(
    '/api/admin/checkin/scan',
    requireAdmin,
    async (req: AuthenticatedRequest, res) => {
      const code = typeof req.body?.code === 'string' ? req.body.code.trim() : '';
      const autoCheckin =
        req.body?.auto_checkin !== undefined
          ? Boolean(req.body.auto_checkin)
          : true;

      if (!code) {
        return res
          .status(400)
          .json({ error: 'Please scan or enter a valid QR code or Registration ID.' });
      }

      const lookup = parseScannedCode(code);
      if (!lookup.id && !lookup.pass_number) {
        return res.status(400).json({
          error: 'Unrecognized QR code or Registration ID format.',
        });
      }

      try {
        const result = await callAppsScript<{
          record: SheetRegistrationRow;
          newly_checked_in: boolean;
          already_checked_in: boolean;
        }>('lookupAndCheckIn', {
          ...lookup,
          auto_checkin: autoCheckin,
          checked_in_by: req.admin?.full_name || 'Organizer',
        });

        invalidateRegistrationsCache();
        const response: CheckInScanResponse = {
          record: mapRegistrationRow(result.record, true),
          newly_checked_in: Boolean(result.newly_checked_in),
          already_checked_in: Boolean(result.already_checked_in),
        };
        return res.json(response);
      } catch (err) {
        return handleRouteError(res, err, 'Unable to verify or check in student.');
      }
    }
  );

  // Manual Check-In by selected student ID (when student has no QR code)
  app.post(
    '/api/admin/checkin/manual',
    requireAdmin,
    async (req: AuthenticatedRequest, res) => {
      const id = typeof req.body?.id === 'string' ? req.body.id.trim() : '';
      if (!id) {
        return res.status(400).json({ error: 'Please select a student record.' });
      }

      try {
        const result = await callAppsScript<{
          record: SheetRegistrationRow;
          newly_checked_in: boolean;
          already_checked_in: boolean;
        }>('lookupAndCheckIn', {
          id,
          auto_checkin: true,
          checked_in_by: req.admin?.full_name || 'Organizer',
        });

        invalidateRegistrationsCache();
        const response: CheckInScanResponse = {
          record: mapRegistrationRow(result.record, true),
          newly_checked_in: Boolean(result.newly_checked_in),
          already_checked_in: Boolean(result.already_checked_in),
        };
        return res.json(response);
      } catch (err) {
        return handleRouteError(res, err, 'Failed to mark student as Events Joined.');
      }
    }
  );

  // Checked-in students list + all students for manual fallback lookup
  app.get('/api/admin/checkin/list', requireAdmin, async (_req, res) => {
    try {
      const allRecords = await fetchAllRegistrations();
      const checkedInList = allRecords
        .filter((r) => r.checked_in)
        .sort((a, b) =>
          (b.checkin_time || b.created_at).localeCompare(
            a.checkin_time || a.created_at
          )
        );
      const allSorted = [...allRecords].sort((a, b) =>
        a.student_name.localeCompare(b.student_name)
      );

      return res.json({
        checked_in_list: checkedInList,
        all_students: allSorted,
        checked_in_count: checkedInList.length,
        total_count: allRecords.length,
      });
    } catch (err) {
      return handleRouteError(res, err, 'Failed to load check-in list.');
    }
  });

  // Paginated, searchable, filterable registrations table
  app.get('/api/admin/registrations', requireAdmin, async (req, res) => {
    try {
      const q = typeof req.query.q === 'string' ? req.query.q.trim() : '';
      const food =
        typeof req.query.food === 'string' ? req.query.food.trim() : '';
      const talent =
        typeof req.query.talent === 'string' ? req.query.talent.trim() : '';
      const from =
        typeof req.query.from === 'string' ? req.query.from.trim() : '';
      const to = typeof req.query.to === 'string' ? req.query.to.trim() : '';
      const sortBy =
        typeof req.query.sortBy === 'string' ? req.query.sortBy : 'created_at';
      const sortDir = req.query.sortDir === 'asc' ? 'asc' : 'desc';

      const page = Math.max(1, Number(req.query.page) || 1);
      const pageSize = Math.min(
        100,
        Math.max(5, Number(req.query.pageSize) || 15)
      );

      const allRecords = await fetchAllRegistrations();
      const filtered = filterAndSortRegistrations(allRecords, {
        q,
        food,
        talent,
        from,
        to,
        sortBy,
        sortDir,
      });

      const total = filtered.length;
      const totalPages = Math.max(1, Math.ceil(total / pageSize));
      const offset = (page - 1) * pageSize;

      res.json({
        items: filtered.slice(offset, offset + pageSize),
        total,
        page,
        pageSize,
        totalPages,
      });
    } catch (err) {
      return handleRouteError(res, err, 'Failed to load registrations.');
    }
  });

  // Filtered export dataset
  app.get(
    '/api/admin/registrations/export',
    requireAdmin,
    async (req, res) => {
      try {
        const food =
          typeof req.query.food === 'string' ? req.query.food.trim() : '';
        const talent =
          typeof req.query.talent === 'string' ? req.query.talent.trim() : '';
        const from =
          typeof req.query.from === 'string' ? req.query.from.trim() : '';
        const to = typeof req.query.to === 'string' ? req.query.to.trim() : '';
        const idsParam =
          typeof req.query.ids === 'string' ? req.query.ids.trim() : '';
        const ids = idsParam
          ? idsParam
              .split(',')
              .map((s) => s.trim())
              .filter(Boolean)
              .slice(0, 500)
          : undefined;

        const allRecords = await fetchAllRegistrations();
        const filtered = filterAndSortRegistrations(allRecords, {
          food,
          talent,
          from,
          to,
          ids,
        });

        res.json({ items: filtered.slice(0, 10000) });
      } catch (err) {
        return handleRouteError(
          res,
          err,
          'Failed to prepare export dataset.'
        );
      }
    }
  );

  // Super Admin ONLY: Edit student registration details
  app.patch(
    '/api/admin/registrations/:id',
    requireAdmin,
    requireSuperAdmin,
    async (req, res) => {
      const id = String(req.params.id || '');
      const parsed = registrationSubmissionSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({
          error:
            parsed.error.issues[0]?.message || 'Invalid registration update.',
        });
      }

      const data = parsed.data;
      const otherDescription = data.selected_talents.includes('Other')
        ? data.other_talent_description
        : null;

      try {
        const updated = await callAppsScript<SheetRegistrationRow>(
          'updateRegistration',
          {
            id,
            student_name: data.student_name,
            selected_talents: data.selected_talents,
            other_talent_description: otherDescription,
            food_preference: data.food_preference,
          }
        );
        invalidateRegistrationsCache();
        return res.json(mapRegistrationRow(updated, true));
      } catch (err) {
        return handleRouteError(
          res,
          err,
          'Failed to update registration record.'
        );
      }
    }
  );

  // Super Admin ONLY: Coordinator Management
  app.get(
    '/api/admin/coordinators',
    requireAdmin,
    requireSuperAdmin,
    async (_req, res) => {
      try {
        const items = await callAppsScript<AdminAccountPublic[]>(
          'listCoordinators'
        );
        return res.json({ items: items || [] });
      } catch (err) {
        return handleRouteError(res, err, 'Failed to load coordinators.');
      }
    }
  );

  app.post(
    '/api/admin/coordinators',
    requireAdmin,
    requireSuperAdmin,
    async (req, res) => {
      const parsed = createCoordinatorSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({
          error:
            parsed.error.issues[0]?.message || 'Invalid coordinator details.',
        });
      }

      try {
        const created = await callAppsScript<AdminAccountPublic>(
          'createCoordinator',
          {
            full_name: parsed.data.full_name,
            phone_number: parsed.data.phone_number,
            passcode: parsed.data.passcode,
          }
        );
        return res.status(201).json(created);
      } catch (err) {
        return handleRouteError(res, err, 'Failed to create coordinator.');
      }
    }
  );

  app.patch(
    '/api/admin/coordinators/:id',
    requireAdmin,
    requireSuperAdmin,
    async (req, res) => {
      const id = String(req.params.id || '');
      const parsed = updateCoordinatorSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({
          error: parsed.error.issues[0]?.message || 'Invalid update fields.',
        });
      }

      try {
        const updated = await callAppsScript<AdminAccountPublic>(
          'updateCoordinator',
          {
            id,
            full_name: parsed.data.full_name,
            phone_number: parsed.data.phone_number,
            is_active: parsed.data.is_active,
          }
        );
        return res.json(updated);
      } catch (err) {
        return handleRouteError(res, err, 'Failed to update coordinator.');
      }
    }
  );

  app.post(
    '/api/admin/coordinators/:id/reset-passcode',
    requireAdmin,
    requireSuperAdmin,
    async (req, res) => {
      const id = String(req.params.id || '');
      const parsed = resetPasscodeSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({
          error: parsed.error.issues[0]?.message || 'Invalid passcode.',
        });
      }

      try {
        await callAppsScript<{ ok: boolean }>('resetCoordinatorPasscode', {
          id,
          passcode: parsed.data.passcode,
        });
        return res.json({ ok: true });
      } catch (err) {
        return handleRouteError(res, err, 'Failed to reset passcode.');
      }
    }
  );

  return app;
}
