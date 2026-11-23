import { useEffect, useRef, useState } from 'react';
import { ArrowRight, CheckCircle2, PartyPopper } from 'lucide-react';
import { motion } from 'motion/react';
import {
  CelebrationEffects,
  playCelebrationChime,
} from '../common/CelebrationEffects.tsx';
import type { RegistrationSubmitResponse } from '../../types/database.types.ts';

export function RegistrationSuccess({
  registration,
  eventName,
  onGeneratePoster,
}: {
  registration: RegistrationSubmitResponse;
  eventName: string;
  onGeneratePoster: () => void;
}) {
  const [secondsLeft, setSecondsLeft] = useState(5);
  const redirectedRef = useRef(false);

  useEffect(() => {
    playCelebrationChime();
  }, []);

  useEffect(() => {
    const interval = window.setInterval(() => {
      setSecondsLeft((prev) => (prev > 1 ? prev - 1 : 0));
    }, 1000);

    const redirectTimer = window.setTimeout(() => {
      if (!redirectedRef.current) {
        redirectedRef.current = true;
        onGeneratePoster();
      }
    }, 5000);

    return () => {
      window.clearInterval(interval);
      window.clearTimeout(redirectTimer);
    };
  }, [onGeneratePoster]);

  const handleManualPosterClick = () => {
    if (!redirectedRef.current) {
      redirectedRef.current = true;
      onGeneratePoster();
    }
  };

  return (
    <div className="halftone relative flex h-[100dvh] sm:min-h-[100dvh] sm:h-auto flex-col items-center justify-center overflow-hidden bg-[#8e1b1b] px-5 py-6 text-center text-[#fff4e2]">
      <CelebrationEffects active={true} />

      <div className="relative z-10 flex w-full max-w-3xl flex-col items-center">
        {/* Chandua Celebration Medallion */}
        <motion.div
          initial={{ scale: 0.4, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          className="relative flex h-20 w-20 sm:h-24 sm:w-24 items-center justify-center"
        >
          <span
            aria-hidden="true"
            className="absolute inset-0 rounded-full border-2 border-[#ffe066]/80 animate-pulse-ring"
          />
          <span
            aria-hidden="true"
            className="absolute -inset-3 rounded-full border-2 border-[#fff4e2]/45 animate-pulse-ring"
            style={{ animationDelay: '0.6s' }}
          />
          <div className="flex h-16 w-16 sm:h-20 sm:w-20 items-center justify-center rounded-full border-2 border-[#1b1b1b] bg-[#e0a526] shadow-[4px_4px_0_0_#1b1b1b]">
            <PartyPopper className="h-8 w-8 sm:h-9 sm:w-9 text-[#1b1b1b]" />
          </div>
        </motion.div>

        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: 0.15 }}
          className="mt-5 sm:mt-7 font-heading text-xs font-extrabold tracking-[0.26em] uppercase text-[#ffe066] sm:text-sm"
        >
          REGISTRATION SUCCESSFUL!
        </motion.p>

        <motion.h1
          initial={{ opacity: 0, scale: 0.94, y: 12 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.45, delay: 0.25, ease: [0.16, 1, 0.3, 1] }}
          className="mt-2.5 sm:mt-3 font-brand text-[clamp(1.85rem,5.5vw,3.8rem)] font-extrabold leading-none tracking-tight text-[#fff4e2]"
        >
          CONGRATULATIONS!
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.38 }}
          className="mt-2.5 sm:mt-3 font-heading text-base font-extrabold tracking-wide text-[#fff4e2]/95 sm:text-2xl"
        >
          YOU&apos;RE PART OF {eventName}!
        </motion.p>

        <motion.h2
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, delay: 0.5 }}
          className="mt-3.5 sm:mt-5 font-display text-2xl font-extrabold text-[#ffe066] sm:text-4xl"
        >
          Welcome, {registration.student_name}!
        </motion.h2>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.65 }}
          className="mt-4 sm:mt-5 flex flex-wrap items-center justify-center gap-x-2.5 gap-y-1 text-sm font-semibold text-[#fff4e2]"
        >
          <span className="inline-flex items-center gap-1.5 text-[#ffe066]">
            <CheckCircle2 className="h-4 w-4" />
            Registration No:
          </span>
          <span className="font-mono-tabular font-bold text-[#fff4e2]">
            {registration.pass_number}
          </span>
        </motion.div>

        {/* 5-Second Auto-Redirect Progress Indicator */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.75 }}
          className="mt-5 sm:mt-7 w-full max-w-sm"
        >
          <p className="font-heading text-sm font-bold text-[#ffe066]">
            {secondsLeft > 0
              ? `Opening your Event Poster in ${secondsLeft}s...`
              : 'Opening your Event Poster...'}
          </p>
          <div className="mt-2.5 h-2.5 w-full overflow-hidden rounded-full border-2 border-[#1b1b1b] bg-[#5a0f14]">
            <motion.div
              initial={{ scaleX: 0 }}
              animate={{ scaleX: 1 }}
              transition={{ duration: 5, ease: 'linear' }}
              style={{ transformOrigin: 'left center' }}
              className="h-full w-full bg-[#e0a526]"
            />
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, delay: 0.85 }}
          className="mt-5 sm:mt-7"
        >
          <button
            type="button"
            onClick={handleManualPosterClick}
            className="btn-craft-turmeric group inline-flex min-h-[48px] sm:min-h-[50px] items-center justify-center gap-3 rounded-xl px-7 py-3 sm:py-3.5 font-heading text-sm font-extrabold tracking-wider uppercase whitespace-nowrap"
          >
            <span>VIEW POSTER NOW</span>
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
          </button>
        </motion.div>
      </div>
    </div>
  );
}
