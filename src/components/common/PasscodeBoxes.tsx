import { useRef, useState, type ClipboardEvent, type KeyboardEvent } from 'react';
import { Eye, EyeOff } from 'lucide-react';

export function PasscodeBoxes({
  idPrefix,
  label,
  value,
  onChange,
  disabled = false,
  autoFocus = false,
}: {
  idPrefix: string;
  label: string;
  value: string;
  onChange: (next: string) => void;
  disabled?: boolean;
  autoFocus?: boolean;
}) {
  const [showDigits, setShowDigits] = useState(true);
  const inputsRef = useRef<Array<HTMLInputElement | null>>([]);

  const digits = Array.from({ length: 6 }, (_, i) => value[i] || '');

  const setDigitAt = (index: number, char: string) => {
    const clean = char.replace(/\D/g, '');
    if (!clean) return;
    const arr = Array.from({ length: 6 }, (_, i) => value[i] || '');

    if (clean.length > 1) {
      for (let i = 0; i < 6 && index + i < 6; i += 1) {
        if (clean[i]) arr[index + i] = clean[i];
      }
      const next = arr.join('').slice(0, 6);
      onChange(next);
      const focusIdx = Math.min(5, index + clean.length);
      inputsRef.current[focusIdx]?.focus();
      return;
    }

    arr[index] = clean;
    onChange(arr.join(''));
    if (index < 5) {
      inputsRef.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace') {
      e.preventDefault();
      const arr = Array.from({ length: 6 }, (_, i) => value[i] || '');
      if (arr[index]) {
        arr[index] = '';
        onChange(arr.join(''));
      } else if (index > 0) {
        arr[index - 1] = '';
        onChange(arr.join(''));
        inputsRef.current[index - 1]?.focus();
      }
    } else if (e.key === 'ArrowLeft' && index > 0) {
      e.preventDefault();
      inputsRef.current[index - 1]?.focus();
    } else if (e.key === 'ArrowRight' && index < 5) {
      e.preventDefault();
      inputsRef.current[index + 1]?.focus();
    }
  };

  const handlePaste = (e: ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pasted = e.clipboardData
      .getData('text')
      .replace(/\D/g, '')
      .slice(0, 6);
    if (!pasted) return;
    onChange(pasted);
    const focusIdx = Math.min(5, pasted.length - 1);
    inputsRef.current[Math.max(0, focusIdx)]?.focus();
  };

  return (
    <div>
      <div className="flex items-center justify-between">
        <label
          htmlFor={`${idPrefix}-0`}
          className="block text-xs font-bold tracking-wider uppercase text-[#5a0f14]"
        >
          {label}
        </label>
        <button
          type="button"
          onClick={() => setShowDigits((prev) => !prev)}
          className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-[11px] font-bold text-[#8e1b1b] hover:bg-[#f6efe2]"
        >
          {showDigits ? (
            <>
              <EyeOff className="h-3.5 w-3.5" />
              <span>Hide</span>
            </>
          ) : (
            <>
              <Eye className="h-3.5 w-3.5" />
              <span>Show</span>
            </>
          )}
        </button>
      </div>

      <div className="mt-2 grid grid-cols-6 gap-2 sm:gap-2.5">
        {digits.map((digit, idx) => (
          <input
            key={idx}
            ref={(el) => {
              inputsRef.current[idx] = el;
            }}
            id={`${idPrefix}-${idx}`}
            type={showDigits ? 'text' : 'password'}
            inputMode="numeric"
            pattern="[0-9]*"
            maxLength={6}
            autoFocus={autoFocus && idx === 0}
            disabled={disabled}
            aria-label={`Passcode digit ${idx + 1}`}
            value={digit}
            onChange={(e) => {
              const raw = e.target.value;
              if (!raw) {
                const arr = Array.from({ length: 6 }, (_, i) => value[i] || '');
                arr[idx] = '';
                onChange(arr.join(''));
                return;
              }
              setDigitAt(idx, raw);
            }}
            onKeyDown={(e) => handleKeyDown(idx, e)}
            onPaste={handlePaste}
            onFocus={(e) => e.currentTarget.select()}
            className="h-12 w-full rounded-xl border-2 border-[#1b1b1b] bg-white text-center font-mono-tabular text-lg font-extrabold text-[#1b1b1b] shadow-[2px_2px_0_0_#1b1b1b] transition-all focus:-translate-y-0.5 focus:border-[#8e1b1b] focus:shadow-[3px_3px_0_0_#8e1b1b] focus:outline-none disabled:opacity-50"
          />
        ))}
      </div>
    </div>
  );
}
