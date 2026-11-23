import { ArrowLeft, ArrowRight } from 'lucide-react';
import { motion } from 'motion/react';
import { EventLogo } from '../common/EventLogo.tsx';

export function PersonalizedWelcome({
  studentName,
  eventName,
  onContinue,
  onBack,
}: {
  studentName: string;
  eventName: string;
  onContinue: () => void;
  onBack: () => void;
}) {
  return (
    <div className="relative flex h-[100dvh] sm:min-h-[100dvh] sm:h-auto flex-col items-center justify-center overflow-hidden px-4 py-4 text-center sm:px-6 sm:py-10">
      <div className="w-full max-w-2xl rounded-2xl border-2 border-[#1b1b1b] bg-[#fffaf0] p-6 shadow-[6px_6px_0_0_#1b1b1b] sm:p-12 sm:shadow-[8px_8px_0_0_#1b1b1b]">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
          className="mx-auto flex justify-center"
        >
          <EventLogo
            eventName={eventName}
            className="h-16 w-16 sm:h-20 sm:w-20"
          />
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.14, ease: [0.16, 1, 0.3, 1] }}
          className="mt-5 font-display text-[clamp(1.75rem,5vw,3.4rem)] font-extrabold leading-tight tracking-tight text-[#5a0f14] text-balance sm:mt-6"
        >
          Welcome, <span className="text-[#8e1b1b]">{studentName}!</span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, delay: 0.28 }}
          className="mx-auto mt-3.5 max-w-xl text-sm leading-relaxed text-[#4a4642] sm:mt-5 sm:text-lg"
        >
          &ldquo;Get ready for an unforgettable celebration at {eventName}.
          Let&apos;s discover your talents!&rdquo;
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, delay: 0.38 }}
          className="mt-6 flex flex-col-reverse items-center justify-center gap-3 sm:mt-9 sm:flex-row"
        >
          <button
            type="button"
            onClick={onBack}
            className="group inline-flex min-h-[46px] w-full items-center justify-center gap-2.5 rounded-xl border-2 border-[#1b1b1b] bg-white px-8 py-3 font-heading text-sm font-extrabold tracking-wider uppercase text-[#1b1b1b] shadow-[3px_3px_0_0_#1b1b1b] transition-all hover:bg-[#f6efe2] active:translate-x-[2px] active:translate-y-[2px] active:shadow-[1px_1px_0_0_#1b1b1b] sm:min-h-[48px] sm:w-auto sm:py-3.5 whitespace-nowrap"
          >
            <ArrowLeft className="h-4 w-4 text-[#8e1b1b] transition-transform group-hover:-translate-x-1" />
            <span>BACK</span>
          </button>

          <button
            type="button"
            onClick={onContinue}
            className="btn-craft-primary group inline-flex min-h-[46px] w-full items-center justify-center gap-2.5 rounded-xl px-8 py-3 font-heading text-sm font-extrabold tracking-wider uppercase sm:min-h-[48px] sm:w-auto sm:py-3.5 whitespace-nowrap"
          >
            <span>CONTINUE</span>
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
          </button>
        </motion.div>
      </div>
    </div>
  );
}
