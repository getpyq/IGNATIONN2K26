import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { ArrowLeft, CheckCircle2, Loader2, ShieldAlert } from 'lucide-react';
import { AnimatedBackground } from '../../components/common/AnimatedBackground.tsx';
import { verifyPassToken } from '../../services/passService.ts';
import type { PassVerificationResult } from '../../types/database.types.ts';

export function VerificationPage() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token') || '';
  const reg = searchParams.get('reg') || '';
  const [loading, setLoading] = useState(true);
  const [result, setResult] = useState<PassVerificationResult | null>(null);

  useEffect(() => {
    let active = true;
    if (!token && !reg) {
      setResult({
        verified: false,
        error: 'No pass verification token was provided.',
      });
      setLoading(false);
      return;
    }

    setLoading(true);
    verifyPassToken(token, reg || undefined)
      .then((res) => {
        if (active) setResult(res);
      })
      .catch((err) => {
        if (active) {
          setResult({
            verified: false,
            error:
              err instanceof Error
                ? err.message
                : 'Unable to verify this welcome pass.',
          });
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [token, reg]);

  return (
    <div className="relative flex min-h-[100dvh] flex-col items-center justify-center bg-[#fff4e2] px-5 py-8 text-[#5a0f14]">
      <AnimatedBackground intensity="subtle" />

      <div className="relative z-10 w-full max-w-md rounded-2xl border-2 border-[#1b1b1b] bg-[#fffaf0] p-6 text-center shadow-[8px_8px_0_0_#1b1b1b] sm:p-7">
        {loading ? (
          <div className="flex flex-col items-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-[#8e1b1b]" />
            <p className="mt-4 text-sm font-semibold text-[#4a4642]">
              Verifying welcome pass...
            </p>
          </div>
        ) : result?.verified ? (
          <div>
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border-2 border-[#1b1b1b] bg-[#3e9b47] text-[#fff4e2] shadow-[3px_3px_0_0_#1b1b1b]">
              <CheckCircle2 className="h-8 w-8" />
            </div>

            <p className="mt-5 font-brand text-xs font-bold tracking-[0.26em] uppercase text-[#8e1b1b]">
              {result.event_name || 'IGNITION 2K26'}
            </p>

            <h1 className="mt-2 font-heading text-lg font-extrabold tracking-wide text-[#3e9b47]">
              PASS VERIFICATION: SUCCESSFUL
            </h1>

            <div className="mt-5 space-y-4 rounded-xl border-2 border-[#1b1b1b] bg-white p-5 text-left">
              <div>
                <p className="text-[11px] font-bold tracking-wider uppercase text-[#4a4642]">
                  Registration ID
                </p>
                <p className="mt-1 font-mono-tabular text-base font-bold text-[#1b1b1b]">
                  {result.pass_number}
                </p>
              </div>
              <div className="border-t-2 border-[#1b1b1b]/15 pt-3">
                <p className="text-[11px] font-bold tracking-wider uppercase text-[#4a4642]">
                  Student Name
                </p>
                <p className="mt-1 font-display text-xl font-extrabold text-[#5a0f14]">
                  {result.student_name}
                </p>
              </div>
            </div>

            <p className="mt-4 text-xs font-medium text-[#4a4642]">
              {result.department_name} · {result.institution_name}
            </p>
          </div>
        ) : (
          <div>
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border-2 border-[#1b1b1b] bg-[#c8221a] text-[#fff4e2] shadow-[3px_3px_0_0_#1b1b1b]">
              <ShieldAlert className="h-8 w-8" />
            </div>
            <h1 className="mt-5 font-heading text-lg font-extrabold text-[#5a0f14]">
              PASS VERIFICATION FAILED
            </h1>
            <p className="mt-2 text-sm text-[#4a4642]">
              {result?.error || 'This verification link is invalid or expired.'}
            </p>
          </div>
        )}

        <div className="mt-6 border-t-2 border-[#1b1b1b]/15 pt-4">
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-xs font-bold text-[#8e1b1b] underline decoration-[#e0a526] decoration-2 underline-offset-4 hover:text-[#5a0f14]"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Return to IGNITION 2K26 Home
          </Link>
        </div>
      </div>
    </div>
  );
}
