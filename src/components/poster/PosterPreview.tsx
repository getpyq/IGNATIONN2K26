import { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import type {
  EventSettings,
  RegistrationSubmitResponse,
} from '../../types/database.types.ts';

const DEFAULT_FRESHERS_POSTER =
  '/assets/aistudio/IGNITION_2K26_a867dbe6.jpeg';

export function PosterPreview({
  settings,
  onContinueToPass,
  onBack,
}: {
  registration: RegistrationSubmitResponse;
  settings: EventSettings;
  onContinueToPass: () => void;
  onBack: () => void;
}) {
  const frameWrapperRef = useRef<HTMLDivElement | null>(null);
  const posterImageUrl = DEFAULT_FRESHERS_POSTER;

  useEffect(() => {
    const prefersReduced =
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReduced) return;

    const ctx = gsap.context(() => {
      if (frameWrapperRef.current) {
        gsap.fromTo(
          frameWrapperRef.current,
          { opacity: 0, scale: 0.94, y: 18 },
          {
            opacity: 1,
            scale: 1,
            y: 0,
            duration: 0.55,
            ease: 'power3.out',
          }
        );
      }
    });

    return () => ctx.revert();
  }, []);

  return (
    <div className="relative mx-auto flex min-h-[100dvh] w-full max-w-xl flex-col items-center justify-center px-5 py-8 sm:px-8">
      <div
        ref={frameWrapperRef}
        className="w-full max-w-[440px] overflow-hidden rounded-2xl border-2 border-[#1b1b1b] bg-[#1b1b1b] shadow-[8px_8px_0_0_#1b1b1b]"
      >
        <img
          src={posterImageUrl}
          alt={`${settings.event_name} Event Poster`}
          referrerPolicy="no-referrer"
          className="block h-auto w-full object-contain"
        />
      </div>

      <div className="mt-6 w-full max-w-[440px] space-y-3">
        <button
          type="button"
          onClick={onContinueToPass}
          className="btn-craft-primary group flex min-h-[50px] w-full items-center justify-center gap-2.5 rounded-xl px-8 py-3.5 font-heading text-sm font-extrabold tracking-wider uppercase whitespace-nowrap"
        >
          <span>CONTINUE TO EVENT PASS</span>
          <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
        </button>

        <button
          type="button"
          onClick={onBack}
          className="btn-craft-secondary flex min-h-[46px] w-full items-center justify-center gap-2 rounded-xl px-6 py-3 font-heading text-sm font-bold tracking-wider uppercase whitespace-nowrap"
        >
          <ArrowLeft className="h-4 w-4 text-[#8e1b1b]" />
          <span>BACK</span>
        </button>
      </div>
    </div>
  );
}
