import { useState, type FormEvent } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  Database,
  Loader2,
  RefreshCw,
  ShieldCheck,
} from 'lucide-react';
import { AnimatedBackground } from '../../components/common/AnimatedBackground.tsx';
import { EventLogo } from '../../components/common/EventLogo.tsx';
import { LoadingScreen } from '../../components/common/LoadingScreen.tsx';
import { PasscodeBoxes } from '../../components/common/PasscodeBoxes.tsx';
import { useAuth } from '../../hooks/useAuth.tsx';
import { useEventSettings } from '../../hooks/useEventSettings.ts';
import {
  adminBootstrapSchema,
  adminLoginSchema,
} from '../../lib/validation.ts';

export function AdminLogin() {
  const {
    admin,
    loading,
    configured,
    initialized,
    refreshAuth,
    login,
    bootstrap,
  } = useAuth();
  const { settings } = useEventSettings();
  const navigate = useNavigate();

  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [passcode, setPasscode] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [rechecking, setRechecking] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#fff4e2] text-[#5a0f14]">
        <AnimatedBackground intensity="subtle" />
        <div className="relative z-10 flex min-h-screen items-center justify-center">
          <LoadingScreen message="Checking Google Sheets organizer access..." />
        </div>
      </div>
    );
  }

  if (admin) {
    return <Navigate to="/admin" replace />;
  }

  const handleRecheck = async () => {
    setRechecking(true);
    setError(null);
    try {
      await refreshAuth();
    } finally {
      setRechecking(false);
    }
  };

  const handleLogin = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    const parsed = adminLoginSchema.safeParse({
      phone_number: phone,
      passcode,
    });
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message || 'Invalid credentials.');
      return;
    }

    setSubmitting(true);
    try {
      await login(parsed.data.phone_number, parsed.data.passcode);
      navigate('/admin', { replace: true });
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Login failed. Please verify your phone number and passcode.'
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleBootstrap = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    const parsed = adminBootstrapSchema.safeParse({
      full_name: fullName,
      phone_number: phone,
      passcode,
    });
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message || 'Check setup fields.');
      return;
    }

    setSubmitting(true);
    try {
      await bootstrap(parsed.data);
      navigate('/admin', { replace: true });
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Unable to initialize Super Admin.'
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center bg-[#fff4e2] px-5 py-10 text-[#5a0f14]">
      <AnimatedBackground intensity="subtle" />

      <div className="relative z-10 w-full max-w-md">
        <div className="mb-6 text-center">
          <div className="mx-auto flex items-center justify-center">
            <EventLogo
              eventName={settings.event_name}
              className="h-14 w-14"
            />
          </div>
          <p className="mt-3 font-brand text-xs font-bold tracking-[0.26em] uppercase text-[#8e1b1b]">
            {settings.event_name}
          </p>
          <h1 className="mt-1 font-heading text-2xl font-extrabold tracking-tight text-[#5a0f14]">
            {!configured
              ? 'GOOGLE SHEETS SETUP REQUIRED'
              : initialized
                ? 'ADMIN & COORDINATOR LOGIN'
                : 'FIRST-TIME SUPER ADMIN SETUP'}
          </h1>
          <p className="mt-1.5 text-sm text-[#4a4642]">
            {!configured
              ? 'Connect your Google Apps Script Web App URL to activate real-time sheet storage.'
              : initialized
                ? 'Sign in with your organizer phone number and 6-digit passcode.'
                : 'No Super Admin exists yet. Create the primary Super Admin account once to unlock organizer tools.'}
          </p>
        </div>

        {!configured ? (
          <div className="rounded-2xl border-2 border-[#1b1b1b] bg-[#fffaf0] p-6 shadow-[8px_8px_0_0_#1b1b1b] sm:p-7">
            <div className="flex items-start gap-3 rounded-xl border-2 border-[#c8221a] bg-white p-4">
              <Database className="mt-0.5 h-5 w-5 shrink-0 text-[#c8221a]" />
              <div className="space-y-1.5 text-xs text-[#4a4642]">
                <p className="font-heading text-sm font-extrabold text-[#5a0f14]">
                  Apps Script Web App Not Connected
                </p>
                <p>
                  Set <code className="font-mono-tabular font-bold text-[#8e1b1b]">APPS_SCRIPT_URL</code> in your environment to your deployed Google Apps Script Web App URL (<code className="font-mono-tabular">https://script.google.com/macros/s/.../exec</code>).
                </p>
                <p>
                  Sheet tabs (<strong>Registrations</strong> and{' '}
                  <strong>AdminAccounts</strong>) and headers are created automatically on first request.
                </p>
              </div>
            </div>

            <button
              type="button"
              disabled={rechecking}
              onClick={() => void handleRecheck()}
              className="btn-craft-primary mt-5 flex min-h-[48px] w-full items-center justify-center gap-2 rounded-xl px-6 py-3 font-heading text-sm font-bold tracking-wider uppercase disabled:opacity-60"
            >
              {rechecking ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>CHECKING CONNECTION...</span>
                </>
              ) : (
                <>
                  <RefreshCw className="h-4 w-4" />
                  <span>RECHECK GOOGLE SHEETS CONNECTION</span>
                </>
              )}
            </button>
          </div>
        ) : (
          <form
            onSubmit={(e) =>
              void (initialized ? handleLogin(e) : handleBootstrap(e))
            }
            noValidate
            className="rounded-2xl border-2 border-[#1b1b1b] bg-[#fffaf0] p-6 shadow-[8px_8px_0_0_#1b1b1b] sm:p-7"
          >
            {!initialized && (
              <div className="mb-4 flex items-center gap-2.5 rounded-xl border-2 border-[#1b1b1b] bg-[#ffe066]/40 px-3.5 py-2.5 text-xs font-bold text-[#5a0f14]">
                <ShieldCheck className="h-4 w-4 shrink-0 text-[#8e1b1b]" />
                <span>
                  First-time setup only — disappears permanently once created.
                </span>
              </div>
            )}

            <div className="space-y-4">
              {!initialized && (
                <div>
                  <label
                    htmlFor="admin-full-name"
                    className="block text-xs font-bold tracking-wider uppercase text-[#5a0f14]"
                  >
                    Full Name
                  </label>
                  <input
                    id="admin-full-name"
                    type="text"
                    autoComplete="name"
                    value={fullName}
                    onChange={(e) => {
                      setFullName(e.target.value);
                      if (error) setError(null);
                    }}
                    placeholder="Head Organizer Name"
                    className="mt-1.5 w-full rounded-xl border-2 border-[#1b1b1b] bg-white px-4 py-3 text-base font-medium text-[#1b1b1b] placeholder:text-[#4a4642]/45 focus:outline-none"
                  />
                </div>
              )}

              <div>
                <label
                  htmlFor="admin-phone"
                  className="block text-xs font-bold tracking-wider uppercase text-[#5a0f14]"
                >
                  Phone Number
                </label>
                <input
                  id="admin-phone"
                  type="tel"
                  inputMode="tel"
                  autoComplete="tel"
                  value={phone}
                  onChange={(e) => {
                    setPhone(e.target.value);
                    if (error) setError(null);
                  }}
                  placeholder="Enter 10-digit phone number"
                  className="mt-1.5 w-full rounded-xl border-2 border-[#1b1b1b] bg-white px-4 py-3 font-mono-tabular text-base font-medium text-[#1b1b1b] placeholder:text-[#4a4642]/45 focus:outline-none"
                />
              </div>

              <PasscodeBoxes
                idPrefix="admin-passcode"
                label="Six-Digit Passcode"
                value={passcode}
                onChange={(val) => {
                  setPasscode(val);
                  if (error) setError(null);
                }}
                disabled={submitting}
              />

              {error && (
                <p
                  role="alert"
                  className="flex items-start gap-2 rounded-xl border-2 border-[#c8221a] bg-white p-3 text-xs font-bold text-[#c8221a]"
                >
                  <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-[#c8221a]" />
                  <span>{error}</span>
                </p>
              )}

              <button
                type="submit"
                disabled={submitting}
                className="btn-craft-primary group flex min-h-[48px] w-full items-center justify-center gap-2 rounded-xl px-6 py-3.5 font-heading text-sm font-bold tracking-wider uppercase disabled:opacity-60"
              >
                {submitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>VERIFYING...</span>
                  </>
                ) : (
                  <>
                    <span>
                      {initialized
                        ? 'LOGIN TO ORGANIZER PORTAL'
                        : 'CREATE SUPER ADMIN & LOGIN'}
                    </span>
                    <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                  </>
                )}
              </button>
            </div>
          </form>
        )}

        <div className="mt-6 text-center">
          <Link
            to="/"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-[#8e1b1b] hover:text-[#5a0f14]"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Back to Student Registration
          </Link>
        </div>
      </div>
    </div>
  );
}
