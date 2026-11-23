import { forwardRef } from 'react';
import { CalendarDays, MapPin } from 'lucide-react';
import { ChanduaMedallion } from '../common/PipiliMotif.tsx';
import type { EventSettings } from '../../types/database.types.ts';

export interface PosterData {
  student_name: string;
  selected_talents: string[];
  other_talent_description: string | null;
  pass_number: string;
}

export const EventPoster = forwardRef<
  HTMLDivElement,
  {
    data: PosterData;
    settings: EventSettings;
    className?: string;
  }
>(function EventPoster({ data, settings, className = '' }, ref) {
  const talentItems = data.selected_talents.map((t) =>
    t === 'Other' && data.other_talent_description
      ? `${t} (${data.other_talent_description})`
      : t
  );

  return (
    <div
      ref={ref}
      className={`relative flex aspect-[4/5] w-full max-w-[460px] flex-col overflow-hidden rounded-2xl border-2 border-[#1b1b1b] bg-[#fff4e2] text-[#5a0f14] shadow-[8px_8px_0_0_#1b1b1b] select-none ${className}`}
    >
      {/* Upper Pipili Crimson Halftone Canopy */}
      <div className="halftone shrink-0 border-b-2 border-[#1b1b1b] bg-[#8e1b1b] px-6 pt-5 pb-4 text-center text-[#fff4e2] sm:px-7">
        <div className="mx-auto flex items-center justify-center gap-3">
          <ChanduaMedallion className="h-10 w-10 shrink-0" />
          <div className="text-left">
            <p className="font-heading text-[10px] font-extrabold tracking-[0.22em] uppercase text-[#ffe066]">
              {settings.event_tagline}
            </p>
            <h2 className="font-brand text-2xl font-extrabold leading-none tracking-tight text-[#fff4e2] sm:text-3xl">
              {settings.event_name}
            </h2>
          </div>
        </div>
        <p className="mt-2 font-heading text-[10px] font-bold tracking-[0.2em] uppercase text-[#ffe066]">
          A NEW BEGINNING. A NEW ENERGY.
        </p>
      </div>

      {/* Main Warm Cream Appliqué Canvas */}
      <div className="halftone-ink relative flex flex-1 flex-col justify-between p-5 sm:p-6">
        {/* Center Spotlight: Student Name & Talents */}
        <div className="my-auto flex flex-col items-center py-2 text-center">
          <p className="font-heading text-[11px] font-extrabold tracking-[0.24em] uppercase text-[#8e1b1b]">
            SPECIAL WELCOME
          </p>
          <h3 className="mt-1.5 font-display text-2xl font-extrabold leading-tight tracking-tight text-[#1b1b1b] break-words sm:text-3xl text-balance">
            {data.student_name.toUpperCase()}
          </h3>
          <p className="mt-1.5 text-xs font-semibold italic text-[#4a4642] sm:text-sm">
            &ldquo;Your journey, your talent, your moment!&rdquo;
          </p>

          <div className="mt-4 w-full rounded-xl border-2 border-[#1b1b1b] bg-[#fffaf0] px-4 py-3 shadow-[4px_4px_0_0_#1b1b1b]">
            <p className="font-heading text-[10px] font-extrabold tracking-[0.22em] uppercase text-[#8e1b1b]">
              TALENT SPOTLIGHT
            </p>
            <p className="mt-1 font-heading text-xs font-extrabold leading-relaxed text-[#1b1b1b] sm:text-sm">
              {talentItems.join(' · ')}
            </p>
          </div>
        </div>

        {/* Bottom Organizer & Venue Footer */}
        <div className="shrink-0 border-t-2 border-[#1b1b1b] pt-3 text-center">
          <p className="font-heading text-[10px] font-bold tracking-[0.16em] uppercase text-[#4a4642]">
            Organized by
          </p>
          <p className="mt-0.5 font-heading text-xs font-extrabold text-[#5a0f14] sm:text-sm">
            {settings.department_name}
          </p>
          <p className="text-[11px] font-semibold text-[#4a4642]">
            {settings.institution_name}
          </p>

          <div className="mt-2 flex flex-wrap items-center justify-center gap-x-3 gap-y-1 text-[11px] font-bold text-[#1b1b1b]">
            <span className="inline-flex items-center gap-1">
              <CalendarDays className="h-3 w-3 text-[#8e1b1b]" />
              {settings.event_date}
            </span>
            <span aria-hidden="true" className="text-[#1b1b1b]/35">
              ·
            </span>
            <span className="inline-flex items-center gap-1">
              <MapPin className="h-3 w-3 text-[#3e9b47]" />
              {settings.event_venue}
            </span>
          </div>

          <p className="mt-1.5 font-mono-tabular text-[10px] font-extrabold tracking-widest text-[#8e1b1b]">
            PASS REF: {data.pass_number}
          </p>
        </div>
      </div>
    </div>
  );
});
