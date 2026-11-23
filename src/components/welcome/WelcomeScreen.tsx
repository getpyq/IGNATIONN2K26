import { useRef, useState, type FormEvent } from 'react';
import { AlertCircle, ArrowRight } from 'lucide-react';
import { motion, useReducedMotion } from 'motion/react';
import { studentNameSchema } from '../../lib/validation.ts';
import { EventLogo } from '../common/EventLogo.tsx';
import type { EventSettings } from '../../types/database.types.ts';

export function WelcomeScreen({
  settings,
  initialName,
  onStart,
}: {
  settings: EventSettings;
  initialName: string;
  onStart: (cleanedName: string) => void;
}) {
  const [name, setName] = useState(initialName);
  const [error, setError] = useState<string | null>(null);
  const [focused, setFocused] = useState(false);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const prefersReduced = useReducedMotion();

  const maxRegs =
    typeof settings?.maximum_registrations === 'number'
      ? settings.maximum_registrations
      : 500;
  const currentRegs =
    typeof settings?.current_registrations === 'number'
      ? settings.current_registrations
      : 0;
  const isFull = currentRegs >= maxRegs;
  const isClosed = settings?.registration_open === false || isFull;

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (isClosed) return;
    const parsed = studentNameSchema.safeParse(name);
    if (!parsed.success) {
      setError(
        parsed.error.issues[0]?.message || 'Please enter your full name.'
      );
      inputRef.current?.focus();
      return;
    }
    setError(null);
    onStart(parsed.data);
  };

  return (
    <section className="halftone relative flex min-h-[100dvh] flex-col items-center justify-between bg-[#8e1b1b] px-4 py-10 text-[#fff4e2] sm:px-8 sm:py-16 lg:py-20">
      <div className="hidden sm:block" aria-hidden="true" />

      <main className="mx-auto grid w-full max-w-6xl grid-cols-1 items-center gap-6 sm:gap-10 lg:grid-cols-12 lg:gap-12">
        {/* Left Editorial Introduction */}
        <motion.div
          initial={prefersReduced ? { opacity: 0 } : { opacity: 0, y: 14 }}
          animate={prefersReduced ? { opacity: 1 } : { opacity: 1, y: 0 }}
          transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
          className="lg:col-span-7 text-center lg:text-left"
        >
          <div className="flex justify-center lg:justify-start">
            <EventLogo
              eventName={settings.event_name}
              className="h-20 w-20 sm:h-24 sm:w-24 lg:h-28 lg:w-28"
            />
          </div>

          <h1 className="mt-4 sm:mt-6 font-brand text-[clamp(2.1rem,5.5vw,4.5rem)] font-extrabold leading-[1.03] tracking-tight text-[#fff4e2] text-balance">
            {settings.event_name}
          </h1>

          <p className="mt-1.5 sm:mt-2.5 font-display text-base font-bold text-[#ffe066] sm:text-2xl">
            A New Beginning. A New Energy.
          </p>

          <p className="mx-auto mt-3 sm:mt-5 max-w-xl text-sm font-medium leading-relaxed text-[#fff4e2]/95 lg:mx-0 sm:text-lg">
            {settings.event_description ||
              'Step into a mystery crafted just for you — hidden surprises, live music, thrilling performances, and unforgettable moments await behind the curtain.'}
          </p>
        </motion.div>

        {/* Right Column: Tactile Invitation Registration Card */}
        <motion.div
          initial={
            prefersReduced
              ? { opacity: 0 }
              : { opacity: 0, y: 18, scale: 0.98 }
          }
          animate={
            prefersReduced
              ? { opacity: 1 }
              : { opacity: 1, y: 0, scale: 1 }
          }
          transition={{ duration: 0.5, delay: 0.08, ease: [0.16, 1, 0.3, 1] }}
          className="lg:col-span-5"
        >
          <div className="overflow-hidden rounded-2xl border-2 border-[#1b1b1b] bg-[#fffaf0] text-[#1b1b1b] shadow-[6px_6px_0_0_#1b1b1b] sm:shadow-[8px_8px_0_0_#1b1b1b]">
            <div className="border-b-2 border-[#1b1b1b] bg-[#f6efe2] px-4 py-3 text-center sm:px-6 sm:py-5">
              <h2 className="font-display text-lg font-extrabold tracking-tight text-[#5a0f14] sm:text-2xl">
                HEY! WELCOME, JUNIORS!
              </h2>
              <p className="mt-0.5 text-xs font-medium text-[#4a4642] sm:mt-1 sm:text-sm">
                &ldquo;Something exciting is waiting for you.&rdquo;
              </p>
            </div>

            {isClosed ? (
              <div className="p-5 text-center sm:p-7">
                <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-xl border-2 border-[#1b1b1b] bg-[#e0a526] text-[#1b1b1b] shadow-[3px_3px_0_0_#1b1b1b]">
                  <AlertCircle className="h-5 w-5" />
                </div>
                <h3 className="mt-3 font-heading text-lg font-extrabold text-[#5a0f14] sm:text-xl">
                  {isFull
                    ? 'Registration Capacity Reached'
                    : 'Registrations Currently Closed'}
                </h3>
                <p className="mt-1.5 text-xs leading-relaxed text-[#4a4642] sm:text-sm">
                  {isFull
                    ? 'All available seats for this session have been claimed. Please contact the organizing team for assistance.'
                    : 'Registrations are currently paused by the organizing committee. Please check back shortly.'}
                </p>
              </div>
            ) : (
              <form
                onSubmit={handleSubmit}
                noValidate
                className="p-4 text-left sm:p-7"
              >
                <label
                  htmlFor="student-full-name"
                  className="block font-heading text-xs font-extrabold tracking-wider uppercase text-[#5a0f14]"
                >
                  Enter your full name
                </label>

                <div
                  className={`mt-2 rounded-xl border-2 bg-white p-0.5 transition-all duration-150 sm:mt-2.5 sm:p-1 ${
                    error
                      ? 'border-[#c8221a] shadow-[3px_3px_0_0_#c8221a]'
                      : focused
                        ? 'border-[#1b1b1b] shadow-[4px_4px_0_0_#1b1b1b] -translate-y-0.5'
                        : 'border-[#1b1b1b]/85 hover:border-[#1b1b1b]'
                  }`}
                >
                  <input
                    ref={inputRef}
                    id="student-full-name"
                    type="text"
                    autoComplete="name"
                    placeholder="e.g., Aarav Mohanty"
                    value={name}
                    onFocus={() => setFocused(true)}
                    onBlur={() => setFocused(false)}
                    onChange={(e) => {
                      setName(e.target.value);
                      if (error) setError(null);
                    }}
                    className="w-full bg-transparent px-3 py-2.5 font-display text-base font-extrabold tracking-tight text-[#5a0f14] placeholder:font-heading placeholder:text-sm placeholder:font-medium placeholder:tracking-normal placeholder:text-[#4a4642]/55 focus:outline-none sm:px-3.5 sm:py-3 sm:text-xl"
                  />
                </div>

                {error && (
                  <p
                    role="alert"
                    className="mt-2 flex items-center gap-1.5 text-xs font-bold text-[#c8221a]"
                  >
                    <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                    {error}
                  </p>
                )}

                <button
                  type="submit"
                  className="btn-craft-primary group mt-3.5 flex min-h-[46px] w-full items-center justify-center gap-2.5 rounded-xl px-6 py-3 font-heading text-sm font-extrabold tracking-wider uppercase sm:mt-5 sm:min-h-[52px] sm:py-3.5 whitespace-nowrap"
                >
                  <span>LET&apos;S GET STARTED</span>
                  <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-1" />
                </button>
              </form>
            )}
          </div>
        </motion.div>
      </main>

      <div className="mt-8 sm:mt-12 flex justify-center">
        <p className="inline-flex items-center rounded-xl border-2 border-[#1b1b1b] bg-[#5a0f14] px-4 py-2 text-center font-heading text-xs font-extrabold tracking-wide text-[#ffe066] shadow-[3px_3px_0_0_#1b1b1b] sm:px-5 sm:py-2.5 sm:text-sm">
          Organized by Department of Mechanical Engineering, PMEC, Berhampur
        </p>
      </div>
    </section>
  );
}
