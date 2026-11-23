import { useState } from 'react';
import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  Check,
  Drama,
  Feather,
  Guitar,
  Laugh,
  Mic,
  Mic2,
  Music2,
  Sparkles,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { TALENT_OPTIONS } from '../../types/database.types.ts';

function renderTalentIcon(iconName: string, active: boolean) {
  const cls = `h-5 w-5 transition-colors ${
    active ? 'text-[#fff4e2]' : 'text-[#8e1b1b]'
  }`;
  switch (iconName) {
    case 'Mic2':
      return <Mic2 className={cls} />;
    case 'Music2':
      return <Music2 className={cls} />;
    case 'Drama':
      return <Drama className={cls} />;
    case 'Feather':
      return <Feather className={cls} />;
    case 'Laugh':
      return <Laugh className={cls} />;
    case 'Mic':
      return <Mic className={cls} />;
    case 'Guitar':
      return <Guitar className={cls} />;
    default:
      return <Sparkles className={cls} />;
  }
}

export function TalentSelection({
  selectedTalents,
  otherDescription,
  onToggleTalent,
  onOtherDescriptionChange,
  onContinue,
  onBack,
}: {
  selectedTalents: string[];
  otherDescription: string;
  onToggleTalent: (talent: string) => void;
  onOtherDescriptionChange: (val: string) => void;
  onContinue: () => void;
  onBack: () => void;
}) {
  const [error, setError] = useState<string | null>(null);
  const hasOther = selectedTalents.includes('Other');

  const handleNext = () => {
    if (selectedTalents.length === 0) {
      setError('Please select at least one talent you would like to showcase.');
      return;
    }
    if (hasOther && otherDescription.trim().length < 2) {
      setError('Please describe your custom talent in the field below.');
      return;
    }
    setError(null);
    onContinue();
  };

  return (
    <div className="relative mx-auto flex min-h-screen w-full max-w-5xl flex-col justify-center px-5 py-10 sm:px-8">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="font-heading text-xs font-extrabold tracking-[0.2em] uppercase text-[#8e1b1b]">
            Step 2 of 4 · Showcase
          </p>
          <h1 className="mt-1.5 font-display text-3xl font-extrabold tracking-tight text-[#5a0f14] sm:text-4xl">
            YOUR TALENT
          </h1>
          <p className="mt-1.5 text-sm text-[#4a4642] sm:text-base">
            Select one or more talents you would like to showcase.
          </p>
        </div>

        <p className="font-mono-tabular text-sm font-semibold text-[#4a4642] whitespace-nowrap">
          <span className="font-bold text-[#8e1b1b]">
            {selectedTalents.length}
          </span>{' '}
          {selectedTalents.length === 1 ? 'talent' : 'talents'} selected
        </p>
      </div>

      <div className="mt-7 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        {TALENT_OPTIONS.map((talent) => {
          const isSelected = selectedTalents.includes(talent.id);
          const spanClass = talent.id === 'Other' ? 'col-span-2 lg:col-span-2' : '';
          return (
            <motion.button
              key={talent.id}
              type="button"
              whileTap={{ scale: 0.985 }}
              onClick={() => {
                onToggleTalent(talent.id);
                if (error) setError(null);
              }}
              aria-pressed={isSelected}
              className={`group relative flex flex-col justify-between rounded-2xl border-2 border-[#1b1b1b] p-3.5 text-left transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8e1b1b] sm:p-4 ${spanClass} ${
                isSelected
                  ? 'bg-[#8e1b1b] text-[#fff4e2] shadow-[5px_5px_0_0_#1b1b1b]'
                  : 'bg-[#fffaf0] text-[#5a0f14] shadow-[3px_3px_0_0_#1b1b1b] hover:bg-[#f6efe2]'
              }`}
            >
              <div>
                <div className="flex items-center justify-between gap-2">
                  <div
                    className={`flex h-10 w-10 items-center justify-center rounded-xl border-2 border-[#1b1b1b] transition-colors ${
                      isSelected ? 'bg-[#1b1b1b]' : 'bg-[#fff4e2]'
                    }`}
                  >
                    {renderTalentIcon(talent.icon, isSelected)}
                  </div>
                  <div
                    className={`flex h-6 w-6 items-center justify-center rounded-full border-2 border-[#1b1b1b] transition-all ${
                      isSelected
                        ? 'bg-[#e0a526] text-[#1b1b1b]'
                        : 'bg-white text-transparent'
                    }`}
                  >
                    <Check className="h-3.5 w-3.5 stroke-[3]" />
                  </div>
                </div>

                <h2
                  className={`mt-4 font-heading text-base font-bold ${
                    isSelected ? 'text-[#fff4e2]' : 'text-[#5a0f14]'
                  }`}
                >
                  {talent.label}
                </h2>
                <p
                  className={`mt-1 text-xs leading-relaxed ${
                    isSelected ? 'text-[#fff4e2]/85' : 'text-[#4a4642]'
                  }`}
                >
                  {talent.description}
                </p>
              </div>
            </motion.button>
          );
        })}
      </div>

      <AnimatePresence>
        {hasOther && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="mt-5 rounded-2xl border-2 border-[#1b1b1b] bg-[#fffaf0] p-4 shadow-[4px_4px_0_0_#1b1b1b] sm:p-5">
              <label
                htmlFor="other-talent-input"
                className="block text-xs font-bold tracking-wider uppercase text-[#8e1b1b]"
              >
                Describe your other talent
              </label>
              <input
                id="other-talent-input"
                type="text"
                maxLength={120}
                placeholder="e.g., Beatboxing, Digital Art, Magic Tricks, Mimicry..."
                value={otherDescription}
                onChange={(e) => {
                  onOtherDescriptionChange(e.target.value);
                  if (error) setError(null);
                }}
                className="mt-2 w-full rounded-xl border-2 border-[#1b1b1b] bg-white px-3.5 py-2.5 text-sm font-medium text-[#1b1b1b] placeholder:text-[#4a4642]/50 focus:outline-none"
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {error && (
        <p
          role="alert"
          className="mt-4 flex items-center gap-2 text-sm font-bold text-[#c8221a]"
        >
          <AlertCircle className="h-4 w-4 shrink-0" />
          {error}
        </p>
      )}

      <div className="mt-8 grid grid-cols-2 gap-3">
        <button
          type="button"
          onClick={onBack}
          className="btn-craft-secondary inline-flex min-h-[48px] w-full items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-bold whitespace-nowrap"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Back</span>
        </button>
        <button
          type="button"
          onClick={handleNext}
          className="btn-craft-primary group inline-flex min-h-[48px] w-full items-center justify-center gap-2 rounded-xl px-4 py-3 font-heading text-sm font-bold tracking-wider uppercase whitespace-nowrap"
        >
          <span>CONTINUE</span>
          <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
        </button>
      </div>
    </div>
  );
}
