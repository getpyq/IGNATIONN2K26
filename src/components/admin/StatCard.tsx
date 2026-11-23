import type { ReactNode } from 'react';

export function StatCard({
  label,
  value,
  subtext,
  icon,
  accentClass = 'text-[#8e1b1b]',
  onClick,
}: {
  label: string;
  value: number | string;
  subtext?: string;
  icon: ReactNode;
  accentClass?: string;
  onClick?: () => void;
}) {
  const Tag = onClick ? 'button' : 'div';
  return (
    <Tag
      type={onClick ? 'button' : undefined}
      onClick={onClick}
      className={`flex flex-col justify-between rounded-2xl border-2 border-[#1b1b1b] bg-[#fffaf0] p-4 text-left shadow-[4px_4px_0_0_#1b1b1b] transition-all ${
        onClick ? 'hover:bg-[#f6efe2] cursor-pointer' : ''
      }`}
    >
      <div className="flex items-center justify-between gap-3">
        <p className="truncate text-xs font-bold text-[#4a4642]">{label}</p>
        <div className={`shrink-0 ${accentClass}`}>{icon}</div>
      </div>
      <div className="mt-3">
        <p className="font-mono-tabular text-2xl font-bold tracking-tight text-[#5a0f14]">
          {value}
        </p>
        {subtext && (
          <p className="mt-1 truncate text-[11px] font-medium text-[#4a4642]">
            {subtext}
          </p>
        )}
      </div>
    </Tag>
  );
}
