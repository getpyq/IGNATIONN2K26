import { useState } from 'react';
import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  Check,
  Leaf,
  Utensils,
} from 'lucide-react';
import { motion } from 'motion/react';
import type { FoodPreference as FoodPreferenceType } from '../../types/database.types.ts';

export function FoodPreference({
  selected,
  onSelect,
  onContinue,
  onBack,
}: {
  selected: FoodPreferenceType | null;
  onSelect: (pref: FoodPreferenceType) => void;
  onContinue: () => void;
  onBack: () => void;
}) {
  const [error, setError] = useState<string | null>(null);

  const handleNext = () => {
    if (!selected) {
      setError('Please select your food preference to continue.');
      return;
    }
    setError(null);
    onContinue();
  };

  const options: Array<{
    value: FoodPreferenceType;
    label: string;
    description: string;
    icon: 'leaf' | 'utensils';
  }> = [
    {
      value: 'vegetarian',
      label: 'VEGETARIAN',
      description: 'I prefer vegetarian food.',
      icon: 'leaf',
    },
    {
      value: 'non_vegetarian',
      label: 'NON-VEGETARIAN',
      description: 'I prefer non-vegetarian food.',
      icon: 'utensils',
    },
  ];

  return (
    <div className="relative mx-auto flex min-h-[100dvh] w-full max-w-3xl flex-col justify-between px-4 py-5 sm:justify-center sm:px-8 sm:py-10">
      <div>
        <div>
          <p className="font-heading text-xs font-extrabold tracking-[0.2em] uppercase text-[#8e1b1b]">
            Step 3 of 4 · Hospitality
          </p>
          <h1 className="mt-1 font-display text-2xl font-extrabold tracking-tight text-[#5a0f14] sm:text-4xl">
            YOUR FOOD PREFERENCE
          </h1>
          <p className="mt-1 text-xs text-[#4a4642] sm:text-base">
            Help us prepare for your celebration.
          </p>
        </div>

        {/* Reduced container height (~10%+ shorter than original p-6/mt-6) */}
        <div className="mt-5 grid grid-cols-1 gap-3.5 sm:mt-7 sm:grid-cols-2 sm:gap-5">
          {options.map((opt) => {
            const isSelected = selected === opt.value;
            const isVeg = opt.value === 'vegetarian';

            return (
              <motion.button
                key={opt.value}
                type="button"
                whileTap={{ scale: 0.985 }}
                onClick={() => {
                  onSelect(opt.value);
                  if (error) setError(null);
                }}
                aria-pressed={isSelected}
                className={`relative flex flex-col justify-between rounded-2xl border-2 border-[#1b1b1b] p-4 text-left transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8e1b1b] sm:p-5 ${
                  isSelected
                    ? isVeg
                      ? 'bg-[#3e9b47] text-[#fff4e2] shadow-[5px_5px_0_0_#1b1b1b]'
                      : 'bg-[#e0a526] text-[#1b1b1b] shadow-[5px_5px_0_0_#1b1b1b]'
                    : 'bg-[#fffaf0] text-[#5a0f14] shadow-[4px_4px_0_0_#1b1b1b] hover:bg-[#f6efe2]'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div
                    className={`flex h-10 w-10 items-center justify-center rounded-xl border-2 border-[#1b1b1b] sm:h-11 sm:w-11 ${
                      isSelected
                        ? 'bg-[#fffaf0] text-[#1b1b1b]'
                        : isVeg
                          ? 'bg-[#fff4e2] text-[#3e9b47]'
                          : 'bg-[#fff4e2] text-[#8e1b1b]'
                    }`}
                  >
                    {opt.icon === 'leaf' ? (
                      <Leaf className="h-5 w-5" />
                    ) : (
                      <Utensils className="h-5 w-5" />
                    )}
                  </div>

                  <div
                    className={`flex h-6 w-6 items-center justify-center rounded-full border-2 border-[#1b1b1b] transition-all sm:h-7 sm:w-7 ${
                      isSelected
                        ? 'bg-[#1b1b1b] text-[#fff4e2]'
                        : 'bg-white text-transparent'
                    }`}
                  >
                    <Check className="h-3.5 w-3.5 stroke-[3]" />
                  </div>
                </div>

                <div className="mt-3.5 sm:mt-4">
                  <h2 className="font-heading text-lg font-extrabold tracking-wide sm:text-xl">
                    {opt.label}
                  </h2>
                  <p
                    className={`mt-1 text-xs font-medium sm:text-sm ${
                      isSelected
                        ? isVeg
                          ? 'text-[#fff4e2]/90'
                          : 'text-[#1b1b1b]/85'
                        : 'text-[#4a4642]'
                    }`}
                  >
                    {opt.description}
                  </p>
                </div>
              </motion.button>
            );
          })}
        </div>

        {error && (
          <p
            role="alert"
            className="mt-3 flex items-center gap-2 text-xs font-bold text-[#c8221a] sm:text-sm"
          >
            <AlertCircle className="h-4 w-4 shrink-0" />
            {error}
          </p>
        )}
      </div>

      <div className="mt-5 grid grid-cols-2 gap-3 pt-1 sm:mt-7 sm:flex sm:items-center sm:justify-between">
        <button
          type="button"
          onClick={onBack}
          className="btn-craft-secondary inline-flex min-h-[46px] w-full items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-bold sm:w-auto sm:px-5 whitespace-nowrap"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Back</span>
        </button>
        <button
          type="button"
          onClick={handleNext}
          className="btn-craft-primary group inline-flex min-h-[46px] w-full items-center justify-center gap-2 rounded-xl px-5 py-2.5 font-heading text-sm font-bold tracking-wider uppercase sm:w-auto sm:px-8 whitespace-nowrap"
        >
          <span>CONTINUE</span>
          <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
        </button>
      </div>
    </div>
  );
}
