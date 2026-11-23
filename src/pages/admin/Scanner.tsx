import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  Html5Qrcode,
  Html5QrcodeSupportedFormats,
} from 'html5-qrcode';
import {
  AlertCircle,
  Camera,
  CameraOff,
  CheckCircle2,
  ExternalLink,
  Loader2,
  QrCode,
  Search,
  UserCheck,
} from 'lucide-react';
import { AdminLayout } from '../../components/admin/AdminLayout.tsx';
import { EmptyState } from '../../components/common/EmptyState.tsx';
import { formatDateTime, formatFoodLabel } from '../../lib/utils.ts';
import {
  fetchCheckInList,
  getCachedCheckInList,
  manualCheckInStudent,
  scanCheckInCode,
} from '../../services/adminService.ts';
import type { RegistrationRecord } from '../../types/database.types.ts';

const SCANNER_ELEMENT_ID = 'ignition-qr-reader';

function extractCameraErrorMessage(err: unknown): string {
  const raw =
    typeof err === 'string'
      ? err
      : err instanceof Error
        ? err.message
        : 'Unable to access device camera.';
  const lower = raw.toLowerCase();

  if (
    lower.includes('notallowed') ||
    lower.includes('permission denied') ||
    lower.includes('permission dismissed') ||
    lower.includes('permissions policy') ||
    lower.includes('not allowed')
  ) {
    return 'Camera access was blocked by this browser or embedded preview. Allow camera permissions or click Open in New Tab below.';
  }
  if (lower.includes('notfound') || lower.includes('requested device not found')) {
    return 'No camera hardware was detected on this device. Use student name search on the right.';
  }
  if (lower.includes('notreadable') || lower.includes('trackstarterror')) {
    return 'Your camera is currently being used by another app or tab. Close other camera apps and try again.';
  }
  if (lower.includes('secure') || lower.includes('https')) {
    return 'Camera scanning requires an HTTPS connection.';
  }
  return raw;
}

function parseClientScanLookup(rawInput: string): {
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
        const b64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
        const decoded = atob(b64);
        const sepIdx = decoded.indexOf(':');
        if (sepIdx > 0) {
          const decodedId = decoded.slice(0, sepIdx).trim();
          const decodedPass = decoded.slice(sepIdx + 1).trim().toUpperCase();
          if (/^(IGNITION26-|IGN26-ME-)\d+$/i.test(decodedPass)) {
            return { id: decodedId, pass_number: decodedPass };
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

export function Scanner() {
  const initialCached = getCachedCheckInList();
  const [checkedInList, setCheckedInList] = useState<RegistrationRecord[]>(
    initialCached?.checked_in_list ?? []
  );
  const [allStudents, setAllStudents] = useState<RegistrationRecord[]>(
    initialCached?.all_students ?? []
  );
  const [checkedInCount, setCheckedInCount] = useState(
    initialCached?.checked_in_count ?? 0
  );
  const [totalCount, setTotalCount] = useState(initialCached?.total_count ?? 0);
  const [listLoading, setListLoading] = useState(!initialCached);

  const [cameraActive, setCameraActive] = useState(false);
  const [cameraStarting, setCameraStarting] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);

  const [studentQuery, setStudentQuery] = useState('');
  const [checkinFilter, setCheckinFilter] = useState('');

  const [processingId, setProcessingId] = useState<string | null>(null);
  const [scanBanner, setScanBanner] = useState<{
    type: 'success' | 'info' | 'error';
    message: string;
    detail?: string;
  } | null>(null);

  const scannerRef = useRef<Html5Qrcode | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const allStudentsRef = useRef<RegistrationRecord[]>(allStudents);
  allStudentsRef.current = allStudents;

  const recentScansRef = useRef<Map<string, number>>(new Map());
  const pollInFlightRef = useRef(false);

  const joinedPercentage = useMemo(() => {
    if (totalCount <= 0) return '0';
    return ((checkedInCount / totalCount) * 100)
      .toFixed(1)
      .replace(/\.0$/, '');
  }, [checkedInCount, totalCount]);

  const loadCheckInList = useCallback(async (silent = false) => {
    if (silent && pollInFlightRef.current) return;
    pollInFlightRef.current = true;
    if (!silent && !getCachedCheckInList()) setListLoading(true);
    try {
      const res = await fetchCheckInList();
      if (!res || typeof res !== 'object') return;
      const nextCheckedIn = Array.isArray(res.checked_in_list)
        ? res.checked_in_list
        : [];
      const nextAll = Array.isArray(res.all_students) ? res.all_students : [];
      const nextCheckedCount =
        typeof res.checked_in_count === 'number' ? res.checked_in_count : 0;
      const nextTotalCount =
        typeof res.total_count === 'number' ? res.total_count : 0;

      setCheckedInList((prev) =>
        JSON.stringify(prev) === JSON.stringify(nextCheckedIn)
          ? prev
          : nextCheckedIn
      );
      setAllStudents((prev) =>
        JSON.stringify(prev) === JSON.stringify(nextAll) ? prev : nextAll
      );
      setCheckedInCount((prev) =>
        prev === nextCheckedCount ? prev : nextCheckedCount
      );
      setTotalCount((prev) => (prev === nextTotalCount ? prev : nextTotalCount));
    } catch (err) {
      if (!silent && !getCachedCheckInList()) {
        setScanBanner({
          type: 'error',
          message:
            err instanceof Error
              ? err.message
              : 'Unable to sync check-in records.',
        });
      }
    } finally {
      pollInFlightRef.current = false;
      if (!silent) setListLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadCheckInList(Boolean(getCachedCheckInList()));
  }, [loadCheckInList]);

  useEffect(() => {
    const intervalId = window.setInterval(() => {
      if (document.visibilityState === 'visible') {
        void loadCheckInList(true);
      }
    }, 1000);
    return () => window.clearInterval(intervalId);
  }, [loadCheckInList]);

  const stopCamera = useCallback(async () => {
    const instance = scannerRef.current;
    scannerRef.current = null;
    setCameraActive(false);
    if (!instance) return;
    try {
      await instance.stop();
    } catch {
      // ignore if already stopped
    }
    try {
      instance.clear();
    } catch {
      // ignore cleanup errors
    }
  }, []);

  useEffect(() => {
    return () => {
      void stopCamera();
    };
  }, [stopCamera]);

  const unlockAudio = useCallback(() => {
    try {
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext })
          .webkitAudioContext;
      if (!AudioCtx) return;
      if (!audioCtxRef.current || audioCtxRef.current.state === 'closed') {
        audioCtxRef.current = new AudioCtx();
      }
      if (audioCtxRef.current.state === 'suspended') {
        void audioCtxRef.current.resume();
      }
    } catch {
      // ignore audio unlock errors
    }
  }, []);

  const playScanBeep = useCallback(() => {
    try {
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext })
          .webkitAudioContext;
      if (!AudioCtx) return;
      if (!audioCtxRef.current || audioCtxRef.current.state === 'closed') {
        audioCtxRef.current = new AudioCtx();
      }
      const ctx = audioCtxRef.current;
      if (ctx.state === 'suspended') {
        void ctx.resume();
      }
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(880, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(1240, ctx.currentTime + 0.1);
      gain.gain.setValueAtTime(0.14, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.16);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.17);
    } catch {
      // ignore audio errors
    }
  }, []);

  const applyCheckInResult = useCallback(
    (
      record: RegistrationRecord,
      newlyCheckedIn: boolean,
      alreadyCheckedIn: boolean,
      silentBeep = false
    ) => {
      if (!silentBeep) {
        playScanBeep();
      }

      setAllStudents((prev) =>
        prev.map((item) => (item.id === record.id ? record : item))
      );

      setCheckedInList((prev) => {
        const exists = prev.some((item) => item.id === record.id);
        const next = exists
          ? prev.map((item) => (item.id === record.id ? record : item))
          : [record, ...prev];
        setCheckedInCount(next.length);
        return next;
      });

      const detailText = `${record.pass_number} · ${formatFoodLabel(
        record.food_preference
      )} · ${record.selected_talents.join(', ')}`;

      if (newlyCheckedIn) {
        setScanBanner({
          type: 'success',
          message: `${record.student_name} checked in — Events Joined!`,
          detail: detailText,
        });
      } else if (alreadyCheckedIn) {
        setScanBanner({
          type: 'info',
          message: `${record.student_name} is already marked Events Joined`,
          detail: detailText,
        });
      } else {
        setScanBanner({
          type: 'info',
          message: `Found registration for ${record.student_name}`,
          detail: detailText,
        });
      }
    },
    [playScanBeep]
  );

  const handleScannedString = useCallback(
    (rawCode: string) => {
      const code = rawCode.trim();
      if (!code) return;

      const now = Date.now();
      const lastAt = recentScansRef.current.get(code) ?? 0;
      if (now - lastAt < 1800) {
        return;
      }
      recentScansRef.current.set(code, now);

      // 1) Play scan sound IMMEDIATELY when QR code is decoded
      playScanBeep();

      // 2) Optimistic local match so check-in feedback is instant
      const lookup = parseClientScanLookup(code);
      const localMatch = allStudentsRef.current.find((s) => {
        if (lookup.pass_number && s.pass_number.toUpperCase() === lookup.pass_number) {
          return true;
        }
        if (
          lookup.id &&
          (s.id === lookup.id || s.pass_number.toUpperCase() === lookup.id.toUpperCase())
        ) {
          return true;
        }
        return false;
      });

      if (localMatch) {
        const wasCheckedIn = Boolean(localMatch.checked_in);
        const optimisticRecord: RegistrationRecord = wasCheckedIn
          ? localMatch
          : {
              ...localMatch,
              checked_in: true,
              checkin_time: new Date().toISOString(),
            };
        applyCheckInResult(optimisticRecord, !wasCheckedIn, wasCheckedIn, true);
      } else {
        setScanBanner({
          type: 'info',
          message: 'Pass scanned — syncing check-in in background...',
        });
      }

      // 3) Perform actual backend check-in in background without blocking scanner
      void scanCheckInCode(code, true)
        .then((res) => {
          if (res?.record) {
            applyCheckInResult(
              res.record,
              Boolean(res.newly_checked_in),
              Boolean(res.already_checked_in),
              true
            );
          }
        })
        .catch((err) => {
          if (localMatch && !localMatch.checked_in) {
            // Revert optimistic state if server rejected the scan
            setAllStudents((prev) =>
              prev.map((item) => (item.id === localMatch.id ? localMatch : item))
            );
            setCheckedInList((prev) => {
              const next = prev.filter((item) => item.id !== localMatch.id);
              setCheckedInCount(next.length);
              return next;
            });
          }
          setScanBanner({
            type: 'error',
            message:
              err instanceof Error
                ? err.message
                : 'No matching student pass found for this code.',
          });
        });
    },
    [applyCheckInResult, playScanBeep]
  );

  const startCamera = useCallback(async () => {
    unlockAudio();
    setCameraError(null);
    setCameraStarting(true);

    try {
      if (
        typeof navigator === 'undefined' ||
        !navigator.mediaDevices ||
        typeof navigator.mediaDevices.getUserMedia !== 'function'
      ) {
        throw new Error(
          'Live camera API is unavailable in this browser context. Open this page in a new HTTPS tab.'
        );
      }

      await stopCamera();

      const scanner = new Html5Qrcode(SCANNER_ELEMENT_ID, {
        formatsToSupport: [Html5QrcodeSupportedFormats.QR_CODE],
        experimentalFeatures: {
          useBarCodeDetectorIfSupported: true,
        },
        verbose: false,
      });
      scannerRef.current = scanner;

      const squareQrBox = (viewfinderWidth: number, viewfinderHeight: number) => {
        const edge = Math.max(
          200,
          Math.floor(Math.min(viewfinderWidth, viewfinderHeight) * 0.72)
        );
        return { width: edge, height: edge };
      };

      const hdConfig = {
        fps: 20,
        disableFlip: false,
        qrbox: squareQrBox,
        videoConstraints: {
          facingMode: { ideal: 'environment' },
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
      };

      const fallbackConfig = {
        fps: 20,
        disableFlip: false,
        qrbox: squareQrBox,
      };

      const attempts: Array<{
        target: string | { facingMode: string };
        config: typeof hdConfig | typeof fallbackConfig;
      }> = [
        { target: { facingMode: 'environment' }, config: hdConfig },
        { target: { facingMode: 'environment' }, config: fallbackConfig },
        { target: { facingMode: 'user' }, config: fallbackConfig },
      ];

      let started = false;
      let lastErr: unknown = null;
      for (const attempt of attempts) {
        try {
          await scanner.start(
            attempt.target,
            attempt.config,
            (decodedText) => {
              handleScannedString(decodedText);
            },
            () => {
              // ignore per-frame decode misses
            }
          );
          started = true;
          break;
        } catch (attemptErr) {
          lastErr = attemptErr;
          const msg =
            attemptErr instanceof Error
              ? attemptErr.message.toLowerCase()
              : String(attemptErr).toLowerCase();
          if (
            msg.includes('notallowed') ||
            msg.includes('permission') ||
            msg.includes('denied')
          ) {
            break;
          }
        }
      }

      if (!started) {
        try {
          const deviceList = await Html5Qrcode.getCameras();
          const preferred =
            deviceList.find((c) => /back|rear|environment/i.test(c.label || '')) ||
            deviceList[0];
          if (preferred) {
            await scanner.start(
              preferred.id,
              fallbackConfig,
              (decodedText) => {
                handleScannedString(decodedText);
              },
              () => {}
            );
            started = true;
          }
        } catch (enumErr) {
          lastErr = lastErr || enumErr;
        }
      }

      if (!started) {
        throw lastErr || new Error('Unable to start any available camera.');
      }

      setCameraActive(true);
    } catch (err) {
      await stopCamera();
      setCameraError(extractCameraErrorMessage(err));
    } finally {
      setCameraStarting(false);
    }
  }, [handleScannedString, stopCamera, unlockAudio]);

  const handleManualCheckIn = async (student: RegistrationRecord) => {
    unlockAudio();
    setProcessingId(student.id);
    try {
      const res = await manualCheckInStudent(student.id);
      applyCheckInResult(
        res.record,
        res.newly_checked_in,
        res.already_checked_in
      );
    } catch (err) {
      setScanBanner({
        type: 'error',
        message:
          err instanceof Error
            ? err.message
            : 'Unable to mark student as Events Joined.',
      });
    } finally {
      setProcessingId(null);
    }
  };

  const matchingStudents = useMemo(() => {
    const term = studentQuery.trim().toLowerCase();
    const list = term
      ? allStudents.filter(
          (s) =>
            s.student_name.toLowerCase().includes(term) ||
            s.pass_number.toLowerCase().includes(term)
        )
      : allStudents;
    return list.slice(0, 12);
  }, [allStudents, studentQuery]);

  const filteredCheckInList = useMemo(() => {
    const term = checkinFilter.trim().toLowerCase();
    if (!term) return checkedInList;
    return checkedInList.filter(
      (s) =>
        s.student_name.toLowerCase().includes(term) ||
        s.pass_number.toLowerCase().includes(term)
    );
  }, [checkedInList, checkinFilter]);

  return (
    <AdminLayout pageTitle="Check-In Scanner">
      <div className="space-y-6">
        {/* Compact Summary Header */}
        <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border-2 border-[#1b1b1b] bg-[#fffaf0] p-4 shadow-[4px_4px_0_0_#1b1b1b]">
          <div>
            <h2 className="font-heading text-lg font-extrabold text-[#5a0f14]">
              QR Code Event Check-In
            </h2>
            <p className="text-xs text-[#4a4642]">
              Scan student QR codes to automatically mark{' '}
              <strong className="text-[#3e9b47]">Events Joined</strong>.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="rounded-xl border-2 border-[#1b1b1b] bg-white px-4 py-2 text-center">
              <p className="text-[10px] font-bold tracking-wider uppercase text-[#4a4642]">
                Events Joined
              </p>
              <p className="font-mono-tabular text-lg font-extrabold text-[#3e9b47]">
                {checkedInCount} / {totalCount}
              </p>
            </div>

            <div className="rounded-xl border-2 border-[#1b1b1b] bg-[#ffe066]/45 px-4 py-2 text-center">
              <p className="text-[10px] font-bold tracking-wider uppercase text-[#4a4642]">
                Percentage Joined
              </p>
              <p className="font-mono-tabular text-lg font-extrabold text-[#8e1b1b]">
                {joinedPercentage}%
              </p>
            </div>
          </div>
        </div>

        {/* Instant Scan Result Feedback */}
        {scanBanner && (
          <div
            role="status"
            className={`flex items-start gap-3 rounded-xl border-2 px-4 py-3 text-sm font-bold shadow-[3px_3px_0_0_#1b1b1b] ${
              scanBanner.type === 'success'
                ? 'border-[#1b1b1b] bg-[#3e9b47] text-white'
                : scanBanner.type === 'error'
                  ? 'border-[#1b1b1b] bg-[#c8221a] text-white'
                  : 'border-[#1b1b1b] bg-[#ffe066] text-[#1b1b1b]'
            }`}
          >
            {scanBanner.type === 'error' ? (
              <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" />
            ) : (
              <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0" />
            )}
            <div className="min-w-0">
              <p>{scanBanner.message}</p>
              {scanBanner.detail && (
                <p className="mt-0.5 text-xs font-semibold opacity-95">
                  {scanBanner.detail}
                </p>
              )}
            </div>
          </div>
        )}

        {/* Main 2-Column Check-In Workspace */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
          {/* Left: Embedded Camera QR Scanner */}
          <div className="lg:col-span-6">
            <div className="rounded-2xl border-2 border-[#1b1b1b] bg-[#fffaf0] p-4 shadow-[4px_4px_0_0_#1b1b1b] sm:p-5">
              {/* Single QR Scan Viewport */}
              <div className="relative min-h-[290px] overflow-hidden rounded-xl border-2 border-[#1b1b1b] bg-[#1b1b1b]">
                <div id={SCANNER_ELEMENT_ID} className="w-full" />

                {!cameraActive && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-[#1b1b1b]/95 p-6 text-center">
                    <div className="flex h-14 w-14 items-center justify-center rounded-2xl border-2 border-[#e0a526] bg-[#5a0f14] text-[#ffe066]">
                      <QrCode className="h-7 w-7" />
                    </div>
                    <div>
                      <p className="font-heading text-sm font-extrabold text-[#fff4e2]">
                        QR Code Scanner
                      </p>
                      <p className="mt-1 text-xs text-[#fff4e2]/75">
                        Point camera at student QR code for instant check-in.
                      </p>
                    </div>
                    <button
                      type="button"
                      disabled={cameraStarting}
                      onClick={() => void startCamera()}
                      className="btn-craft-turmeric inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-xs font-extrabold uppercase disabled:opacity-50"
                    >
                      {cameraStarting ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Camera className="h-4 w-4" />
                      )}
                      <span>
                        {cameraStarting ? 'Starting Camera...' : 'Start Camera'}
                      </span>
                    </button>
                  </div>
                )}

                {cameraActive && (
                  <div className="absolute right-3 bottom-3 left-3 z-10 flex items-center justify-between gap-2">
                    <span className="inline-flex items-center gap-1.5 rounded-lg border border-[#1b1b1b] bg-[#3e9b47]/95 px-2.5 py-1 text-[11px] font-extrabold text-white">
                      <span className="h-2 w-2 rounded-full bg-[#ffe066]" />
                      <span>Scanning Live</span>
                    </span>

                    <button
                      type="button"
                      onClick={() => void stopCamera()}
                      className="btn-craft-secondary inline-flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-[11px] font-bold text-[#c8221a]"
                    >
                      <CameraOff className="h-3.5 w-3.5" />
                      <span>Stop Camera</span>
                    </button>
                  </div>
                )}
              </div>

              {cameraError && (
                <div className="mt-3 space-y-2.5 rounded-xl border-2 border-[#c8221a] bg-white p-3 text-xs text-[#c8221a]">
                  <p className="font-bold">{cameraError}</p>
                  {typeof window !== 'undefined' && (
                    <div className="flex flex-wrap items-center gap-2">
                      <a
                        href={window.location.href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="btn-craft-turmeric inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[11px] font-extrabold uppercase text-[#1b1b1b]"
                      >
                        <ExternalLink className="h-3.5 w-3.5" />
                        <span>Open in New Tab</span>
                      </a>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Right: No QR Code? Select Student by Name */}
          <div className="lg:col-span-6">
            <div className="flex h-full flex-col rounded-2xl border-2 border-[#1b1b1b] bg-[#fffaf0] p-4 shadow-[4px_4px_0_0_#1b1b1b] sm:p-5">
              <h3 className="font-heading text-base font-extrabold text-[#5a0f14]">
                No QR Code? Select Student by Name
              </h3>
              <p className="mt-0.5 text-xs text-[#4a4642]">
                Search registered students by name or Registration ID to mark Events Joined.
              </p>

              <div className="relative mt-3">
                <Search className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-[#4a4642]" />
                <input
                  type="search"
                  value={studentQuery}
                  onChange={(e) => setStudentQuery(e.target.value)}
                  placeholder="Type student name or IGNITION26-..."
                  className="w-full rounded-xl border-2 border-[#1b1b1b] bg-white py-2.5 pr-3 pl-9 text-sm font-medium text-[#1b1b1b] placeholder:text-[#4a4642]/50 focus:outline-none"
                />
              </div>

              <div className="mt-3 max-h-[260px] flex-1 divide-y divide-[#1b1b1b]/15 overflow-y-auto rounded-xl border-2 border-[#1b1b1b] bg-white">
                {listLoading ? (
                  <div className="p-4 text-center text-xs text-[#4a4642]">
                    Loading registered students...
                  </div>
                ) : matchingStudents.length === 0 ? (
                  <div className="p-4 text-center text-xs text-[#4a4642]">
                    No students match &ldquo;{studentQuery}&rdquo;.
                  </div>
                ) : (
                  matchingStudents.map((s) => (
                    <div
                      key={s.id}
                      className="flex items-center justify-between gap-3 px-3.5 py-2.5 hover:bg-[#fff4e2]/70"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-bold text-[#5a0f14]">
                          {s.student_name}
                        </p>
                        <p className="font-mono-tabular text-[11px] text-[#4a4642]">
                          {s.pass_number} · {formatFoodLabel(s.food_preference)}
                        </p>
                      </div>

                      {s.checked_in ? (
                        <span className="inline-flex items-center gap-1 rounded-lg border-2 border-[#1b1b1b] bg-[#3e9b47] px-2.5 py-1 text-[11px] font-bold text-white shrink-0">
                          <CheckCircle2 className="h-3 w-3" />
                          <span>Joined</span>
                        </span>
                      ) : (
                        <button
                          type="button"
                          disabled={processingId === s.id}
                          onClick={() => void handleManualCheckIn(s)}
                          className="btn-craft-primary rounded-lg px-3 py-1.5 text-[11px] font-bold uppercase shrink-0 disabled:opacity-50"
                        >
                          {processingId === s.id ? 'Joining...' : 'Mark Joined'}
                        </button>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Checked-In Students List & Time */}
        <div className="overflow-hidden rounded-2xl border-2 border-[#1b1b1b] bg-[#fffaf0] shadow-[4px_4px_0_0_#1b1b1b]">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b-2 border-[#1b1b1b] bg-[#f6efe2] px-5 py-4">
            <div>
              <h3 className="font-heading text-base font-extrabold text-[#5a0f14]">
                Checked-In Students List &amp; Time ({checkedInList.length})
              </h3>
              <p className="mt-0.5 text-xs text-[#4a4642]">
                Real-time log of students marked as Events Joined
              </p>
            </div>

            <div className="relative w-full sm:w-64">
              <Search className="pointer-events-none absolute top-1/2 left-3 h-3.5 w-3.5 -translate-y-1/2 text-[#4a4642]" />
              <input
                type="search"
                value={checkinFilter}
                onChange={(e) => setCheckinFilter(e.target.value)}
                placeholder="Filter checked-in students..."
                className="w-full rounded-xl border-2 border-[#1b1b1b] bg-white py-2 pr-3 pl-8 text-xs font-medium text-[#1b1b1b] focus:outline-none"
              />
            </div>
          </div>

          {listLoading ? (
            <div className="p-8 text-center text-sm text-[#4a4642]">
              Loading checked-in students...
            </div>
          ) : filteredCheckInList.length === 0 ? (
            <div className="p-5">
              <EmptyState
                icon={<UserCheck className="h-6 w-6" />}
                title="No checked-in students yet"
                description="Scanned or manually checked-in students will appear here with their check-in timestamps."
              />
            </div>
          ) : (
            <div className="overflow-x-auto bg-white">
              <table className="w-full min-w-[760px] border-collapse text-left text-sm">
                <thead>
                  <tr className="border-b-2 border-[#1b1b1b] bg-[#f6efe2]/70 text-xs font-bold uppercase text-[#5a0f14]">
                    <th className="px-4 py-3">Registration ID</th>
                    <th className="px-4 py-3">Student Name</th>
                    <th className="px-4 py-3">Talents</th>
                    <th className="px-4 py-3">Food</th>
                    <th className="px-4 py-3">Check-In Time</th>
                    <th className="px-4 py-3">Checked In By</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#1b1b1b]/15">
                  {filteredCheckInList.map((r) => (
                    <tr key={r.id} className="hover:bg-[#fff4e2]/75">
                      <td className="px-4 py-3 font-mono-tabular text-xs font-bold text-[#8e1b1b]">
                        {r.pass_number}
                      </td>
                      <td className="px-4 py-3 font-bold text-[#5a0f14]">
                        {r.student_name}
                      </td>
                      <td className="max-w-[220px] truncate px-4 py-3 text-xs font-semibold text-[#4a4642]">
                        {r.selected_talents.join(' · ')}
                      </td>
                      <td className="px-4 py-3 text-xs font-bold">
                        <span
                          className={
                            r.food_preference === 'vegetarian'
                              ? 'text-[#3e9b47]'
                              : 'text-[#8e1b1b]'
                          }
                        >
                          {formatFoodLabel(r.food_preference)}
                        </span>
                      </td>
                      <td className="px-4 py-3 font-mono-tabular text-xs font-semibold text-[#1b1b1b]">
                        {r.checkin_time ? formatDateTime(r.checkin_time) : '-'}
                      </td>
                      <td className="px-4 py-3 text-xs text-[#4a4642]">
                        {r.checked_in_by || '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}
