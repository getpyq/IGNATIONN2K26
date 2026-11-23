import { AlertCircle, ArrowRight, Edit3, Loader2 } from 'lucide-react';
import { formatFoodLabel } from '../../lib/utils.ts';
import { unlockCelebrationAudio } from '../common/CelebrationEffects.tsx';
import type {
  RegistrationDraft,
  StudentJourneyStep,
} from '../../hooks/useRegistration.ts';

export function RegistrationReview({
  draft,
  submitting,
  submitError,
  onJumpToStep,
  onSubmit,
}: {
  draft: RegistrationDraft;
  submitting: boolean;
  submitError: string | null;
  onJumpToStep: (step: StudentJourneyStep) => void;
  onSubmit: () => void;
}) {
  return (
    <div className="relative mx-auto flex min-h-[100dvh] w-full max-w-3xl flex-col justify-between px-4 py-5 sm:justify-center sm:px-8 sm:py-10">
      <div>
        <div>
          <p className="font-heading text-xs font-extrabold tracking-[0.2em] uppercase text-[#8e1b1b]">
            Step 4 of 4 · Confirmation
          </p>
          <h1 className="mt-1 font-display text-2xl font-extrabold tracking-tight text-[#5a0f14] sm:text-4xl">
            REVIEW YOUR REGISTRATION
          </h1>
          <p className="mt-1 text-xs font-medium text-[#4a4642] sm:text-base">
            Verify your details before generating your event poster and welcome
            pass.
          </p>
        </div>

        <div className="mt-4 divide-y-2 divide-[#1b1b1b]/15 rounded-2xl border-2 border-[#1b1b1b] bg-[#fffaf0] shadow-[6px_6px_0_0_#1b1b1b] sm:mt-6">
          <div className="flex items-start justify-between gap-4 p-3.5 sm:px-6 sm:py-4">
            <div>
              <p className="font-heading text-[11px] font-extrabold tracking-wider uppercase text-[#4a4642]">
                Student Name
              </p>
              <p className="mt-0.5 font-display text-lg font-extrabold text-[#5a0f14] sm:text-xl">
                {draft.student_name}
              </p>
            </div>
            <button
              type="button"
              disabled={submitting}
              onClick={() => onJumpToStep('welcome')}
              className="inline-flex items-center gap-1.5 rounded-lg px-2 py-1 text-xs font-bold text-[#8e1b1b] transition-colors hover:bg-[#f6efe2] hover:text-[#5a0f14] whitespace-nowrap"
            >
              <Edit3 className="h-3.5 w-3.5" />
              <span>Edit</span>
            </button>
          </div>

          <div className="flex items-start justify-between gap-4 p-3.5 sm:px-6 sm:py-4">
            <div>
              <p className="font-heading text-[11px] font-extrabold tracking-wider uppercase text-[#4a4642]">
                Selected Talents
              </p>
              <p className="mt-0.5 text-sm font-bold text-[#5a0f14] sm:text-base">
                {draft.selected_talents.join(' · ')}
              </p>
              {draft.selected_talents.includes('Other') &&
                draft.other_talent_description && (
                  <p className="mt-1 text-xs font-semibold text-[#8e1b1b] sm:text-sm">
                    Custom talent: {draft.other_talent_description}
                  </p>
                )}
            </div>
            <button
              type="button"
              disabled={submitting}
              onClick={() => onJumpToStep('talents')}
              className="inline-flex items-center gap-1.5 rounded-lg px-2 py-1 text-xs font-bold text-[#8e1b1b] transition-colors hover:bg-[#f6efe2] hover:text-[#5a0f14] whitespace-nowrap"
            >
              <Edit3 className="h-3.5 w-3.5" />
              <span>Edit</span>
            </button>
          </div>

          <div className="flex items-start justify-between gap-4 p-3.5 sm:px-6 sm:py-4">
            <div>
              <p className="font-heading text-[11px] font-extrabold tracking-wider uppercase text-[#4a4642]">
                Food Preference
              </p>
              <p className="mt-0.5 text-sm font-bold text-[#5a0f14] sm:text-base">
                {draft.food_preference
                  ? formatFoodLabel(draft.food_preference)
                  : '-'}
              </p>
            </div>
            <button
              type="button"
              disabled={submitting}
              onClick={() => onJumpToStep('food')}
              className="inline-flex items-center gap-1.5 rounded-lg px-2 py-1 text-xs font-bold text-[#8e1b1b] transition-colors hover:bg-[#f6efe2] hover:text-[#5a0f14] whitespace-nowrap"
            >
              <Edit3 className="h-3.5 w-3.5" />
              <span>Edit</span>
            </button>
          </div>
        </div>

        {submitError && (
          <div
            role="alert"
            className="mt-4 flex items-start gap-2.5 rounded-xl border-2 border-[#c8221a] bg-[#fffaf0] p-3 text-xs text-[#5a0f14] shadow-[3px_3px_0_0_#c8221a] sm:text-sm"
          >
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-[#c8221a]" />
            <div>
              <p className="font-bold text-[#c8221a]">Submission issue</p>
              <p className="mt-0.5 text-[#4a4642]">{submitError}</p>
            </div>
          </div>
        )}
      </div>

      <div className="mt-5 flex flex-col-reverse items-center justify-between gap-3 pt-1 sm:mt-7 sm:flex-row">
        <button
          type="button"
          disabled={submitting}
          onClick={() => onJumpToStep('food')}
          className="btn-craft-secondary inline-flex min-h-[46px] w-full items-center justify-center gap-2 rounded-xl px-5 py-2.5 text-sm font-bold disabled:opacity-50 sm:w-auto whitespace-nowrap"
        >
          <Edit3 className="h-4 w-4" />
          <span>Back to Food</span>
        </button>

        <button
          type="button"
          disabled={submitting}
          onClick={() => {
            unlockCelebrationAudio();
            onSubmit();
          }}
          className="btn-craft-primary group inline-flex min-h-[48px] w-full items-center justify-center gap-2.5 rounded-xl px-7 py-3 font-heading text-sm font-extrabold tracking-wider uppercase disabled:opacity-60 sm:w-auto whitespace-nowrap"
        >
          {submitting ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>CONFIRMING REGISTRATION...</span>
            </>
          ) : (
            <>
              <span>
                {submitError ? 'RETRY SUBMISSION' : 'SUBMIT REGISTRATION'}
              </span>
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </>
          )}
        </button>
      </div>
    </div>
  );
}
