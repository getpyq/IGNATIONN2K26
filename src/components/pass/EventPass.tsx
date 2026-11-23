import { forwardRef } from 'react';
import { CalendarDays, Leaf, MapPin, Utensils } from 'lucide-react';
import { QRCodeDisplay } from './QRCodeDisplay.tsx';
import { formatFoodLabel } from '../../lib/utils.ts';
import type { EventSettings, FoodPreference } from '../../types/database.types.ts';

export interface PassCardData {
  id: string;
  student_name: string;
  selected_talents: string[];
  other_talent_description: string | null;
  food_preference: FoodPreference;
  pass_number: string;
  verification_token: string;
}

export const EventPass = forwardRef<
  HTMLDivElement,
  {
    data: PassCardData;
    settings: EventSettings;
    className?: string;
  }
>(function EventPass({ data, settings, className = '' }, ref) {
  const talentsText = data.selected_talents
    .map((t) =>
      t === 'Other' && data.other_talent_description
        ? `${t} (${data.other_talent_description})`
        : t
    )
    .join(', ');

  return (
    <div
      ref={ref}
      className={`relative w-full max-w-[400px] overflow-hidden rounded-2xl border-2 border-[#1b1b1b] bg-[#fffaf0] text-[#5a0f14] shadow-[8px_8px_0_0_#1b1b1b] select-none ${className}`}
    >
      {/* Top Pipili Crimson & Turmeric Band */}
      <div className="halftone border-b-2 border-[#1b1b1b] bg-[#8e1b1b] px-5 py-4 text-[#fff4e2]">
        <p className="font-brand text-[10px] font-bold tracking-[0.14em] uppercase text-[#ffe066]">
          {settings.event_tagline}
        </p>
        <div className="mt-1 flex items-center justify-between gap-2">
          <h2 className="font-brand text-xl font-extrabold leading-none tracking-tight text-[#fff4e2] whitespace-nowrap sm:text-2xl">
            {settings.event_name}
          </h2>
          <p className="shrink-0 text-[9px] font-bold tracking-[0.14em] uppercase text-[#ffe066] whitespace-nowrap">
            YOU ARE INVITED!
          </p>
        </div>
      </div>

      {/* Upper Ticket Section */}
      <div className="px-6 pt-5 pb-4">
        <p className="border-b-2 border-[#1b1b1b]/15 pb-2.5 text-[11px] font-bold tracking-[0.2em] uppercase text-[#8e1b1b]">
          OFFICIAL WELCOME EVENT PASS
        </p>

        {/* Student Holder Block */}
        <div className="mt-4">
          <p className="text-[10px] font-bold tracking-widest uppercase text-[#4a4642]">
            Student Name
          </p>
          <p className="mt-1 font-display text-xl font-extrabold text-[#1b1b1b] break-words">
            {data.student_name}
          </p>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-3 text-xs">
          <div>
            <p className="text-[10px] font-bold tracking-wider uppercase text-[#4a4642]">
              Department
            </p>
            <p className="mt-0.5 font-semibold text-[#5a0f14]">
              {settings.department_name}
            </p>
          </div>
          <div>
            <p className="text-[10px] font-bold tracking-wider uppercase text-[#4a4642]">
              Institution
            </p>
            <p className="mt-0.5 font-semibold text-[#5a0f14]">
              {settings.institution_name}
            </p>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-3 text-xs">
          <div>
            <p className="text-[10px] font-bold tracking-wider uppercase text-[#4a4642]">
              Selected Talents
            </p>
            <p className="mt-0.5 font-semibold leading-snug text-[#8e1b1b]">
              {talentsText}
            </p>
          </div>
          <div>
            <p className="text-[10px] font-bold tracking-wider uppercase text-[#4a4642]">
              Food Preference
            </p>
            <p className="mt-0.5 inline-flex items-center gap-1.5 font-bold text-[#1b1b1b]">
              {data.food_preference === 'vegetarian' ? (
                <Leaf className="h-3.5 w-3.5 text-[#3e9b47]" />
              ) : (
                <Utensils className="h-3.5 w-3.5 text-[#8e1b1b]" />
              )}
              {formatFoodLabel(data.food_preference)}
            </p>
          </div>
        </div>

        <div className="mt-4 space-y-1.5 rounded-xl border-2 border-[#1b1b1b] bg-[#f6efe2] p-3 text-xs font-semibold text-[#1b1b1b]">
          <div className="flex items-center gap-2">
            <CalendarDays className="h-3.5 w-3.5 shrink-0 text-[#8e1b1b]" />
            <span>{settings.event_date}</span>
          </div>
          <div className="flex items-center gap-2">
            <MapPin className="h-3.5 w-3.5 shrink-0 text-[#3e9b47]" />
            <span>{settings.event_venue}</span>
          </div>
        </div>
      </div>

      {/* Ticket Perforation Divider */}
      <div className="relative flex items-center py-1">
        <div className="h-6 w-3 rounded-r-full border-y-2 border-r-2 border-[#1b1b1b] bg-[#fff4e2]" />
        <div className="mx-2 flex-1 border-t-2 border-dashed border-[#1b1b1b]/35" />
        <div className="h-6 w-3 rounded-l-full border-y-2 border-l-2 border-[#1b1b1b] bg-[#fff4e2]" />
      </div>

      {/* Lower Stub: Registration No + QR Code */}
      <div className="px-6 pt-3 pb-5">
        <div className="flex items-center justify-between gap-4">
          <div className="min-w-0 flex-1 space-y-1.5">
            <p className="text-[10px] font-bold tracking-wider uppercase text-[#4a4642]">
              Registration ID
            </p>
            <p className="font-mono-tabular text-base font-extrabold tracking-wide text-[#8e1b1b] whitespace-nowrap">
              {data.pass_number}
            </p>
            <p className="text-[11px] font-medium text-[#4a4642]">
              Scan QR code at entry gate
            </p>
          </div>

          <div className="shrink-0">
            <QRCodeDisplay
              token={data.verification_token}
              passNumber={data.pass_number}
              size={104}
            />
          </div>
        </div>

        <p className="mt-4 border-t-2 border-[#1b1b1b]/15 pt-3 text-center font-heading text-[10px] font-extrabold tracking-[0.2em] uppercase text-[#8e1b1b]">
          YOUR JOURNEY. YOUR TALENT. YOUR MOMENT.
        </p>
      </div>
    </div>
  );
});
