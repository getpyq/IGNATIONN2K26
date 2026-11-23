import type { ReactNode } from 'react';

export function EmptyState({
  icon,
  title,
  description,
  action,
}: {
  icon: ReactNode;
  title: string;
  description: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-[#1b1b1b] bg-[#fffaf0] px-6 py-12 text-center shadow-[4px_4px_0_0_#1b1b1b]">
      <div className="flex h-12 w-12 items-center justify-center rounded-xl border-2 border-[#1b1b1b] bg-[#fff4e2] text-[#8e1b1b] shadow-[2px_2px_0_0_#1b1b1b]">
        {icon}
      </div>
      <h3 className="mt-4 font-heading text-lg font-bold text-[#5a0f14]">
        {title}
      </h3>
      <p className="mt-1.5 max-w-md text-sm text-[#4a4642]">{description}</p>
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}
