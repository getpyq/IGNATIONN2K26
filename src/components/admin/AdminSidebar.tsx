import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  LogOut,
  QrCode,
  Users,
  X,
} from 'lucide-react';
import type { AdminAccountPublic } from '../../types/database.types.ts';

interface NavItem {
  to: string;
  label: string;
  icon: typeof LayoutDashboard;
  end?: boolean;
}

const NAV_ITEMS: NavItem[] = [
  { to: '/admin', label: 'Overview', icon: LayoutDashboard, end: true },
  { to: '/admin/scanner', label: 'Check-In Scanner', icon: QrCode },
  { to: '/admin/registrations', label: 'Registrations', icon: Users },
];

export function AdminSidebar({
  admin,
  eventName,
  mobileOpen,
  onCloseMobile,
  onLogout,
}: {
  admin: AdminAccountPublic;
  eventName: string;
  mobileOpen: boolean;
  onCloseMobile: () => void;
  onLogout: () => void;
}) {
  const visibleItems = NAV_ITEMS;

  const sidebarContent = (
    <div className="halftone flex h-full flex-col justify-between border-r-2 border-[#1b1b1b] bg-[#8e1b1b] px-4 py-6 text-[#fff4e2]">
      <div>
        <div className="flex items-center justify-between px-2">
          <div>
            <p className="font-brand text-lg font-extrabold tracking-tight text-[#fff4e2]">
              {eventName}
            </p>
            <p className="mt-0.5 text-[11px] font-semibold text-[#ffe066]">
              Admin Console
            </p>
          </div>
          <button
            type="button"
            onClick={onCloseMobile}
            aria-label="Close navigation menu"
            className="rounded-lg border-2 border-[#1b1b1b] bg-[#fffaf0] p-1.5 text-[#1b1b1b] lg:hidden"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <nav className="mt-7 space-y-1.5" aria-label="Admin navigation">
          {visibleItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                onClick={onCloseMobile}
                className={({ isActive }) =>
                  `flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-bold transition-all whitespace-nowrap ${
                    isActive
                      ? 'border-2 border-[#1b1b1b] bg-[#e0a526] text-[#1b1b1b] shadow-[3px_3px_0_0_#1b1b1b]'
                      : 'border-2 border-transparent text-[#fff4e2]/90 hover:bg-[#1b1b1b]/20 hover:text-[#fff4e2]'
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    <Icon
                      className={`h-4 w-4 shrink-0 ${
                        isActive ? 'text-[#1b1b1b]' : 'text-[#ffe066]'
                      }`}
                    />
                    <span className="truncate">{item.label}</span>
                  </>
                )}
              </NavLink>
            );
          })}
        </nav>
      </div>

      <div className="space-y-3 border-t-2 border-[#1b1b1b]/40 pt-4">
        <div className="px-2">
          <p className="truncate text-sm font-bold text-[#fff4e2]">
            {admin.full_name}
          </p>
          <p className="mt-0.5 font-mono-tabular text-xs text-[#fff4e2]/80">
            {admin.phone_number}
          </p>
        </div>

        <button
          type="button"
          onClick={onLogout}
          className="btn-craft-secondary flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-bold whitespace-nowrap"
        >
          <LogOut className="h-4 w-4 shrink-0 text-[#c8221a]" />
          <span>Logout</span>
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Fixed Sidebar */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-[260px] lg:block">
        {sidebarContent}
      </aside>

      {/* Mobile Drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="fixed inset-0 bg-[#1b1b1b]/65 backdrop-blur-xs"
            onClick={onCloseMobile}
          />
          <aside className="fixed inset-y-0 left-0 z-50 w-[270px] max-w-[85vw]">
            {sidebarContent}
          </aside>
        </div>
      )}
    </>
  );
}
