import { useState, type ReactNode } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { AdminHeader } from './AdminHeader.tsx';
import { AdminSidebar } from './AdminSidebar.tsx';
import { LoadingScreen } from '../common/LoadingScreen.tsx';
import { useAuth } from '../../hooks/useAuth.tsx';
import { useEventSettings } from '../../hooks/useEventSettings.ts';

export function AdminLayout({
  children,
  pageTitle,
  requireSuperAdmin = false,
}: {
  children: ReactNode;
  pageTitle?: string;
  requireSuperAdmin?: boolean;
}) {
  const { admin, loading, logout } = useAuth();
  const { settings } = useEventSettings();
  const [mobileOpen, setMobileOpen] = useState(false);
  const navigate = useNavigate();

  if (loading) {
    return (
      <div className="halftone-ink min-h-screen bg-[#fff4e2] text-[#5a0f14]">
        <LoadingScreen message="Verifying portal session..." />
      </div>
    );
  }

  if (!admin) {
    return <Navigate to="/admin/login" replace />;
  }

  if (requireSuperAdmin && admin.role !== 'super_admin') {
    return <Navigate to="/admin" replace />;
  }

  const handleLogout = async () => {
    await logout();
    navigate('/admin/login', { replace: true });
  };

  return (
    <div className="halftone-ink min-h-screen bg-[#fff4e2] text-[#5a0f14]">
      <AdminSidebar
        admin={admin}
        eventName={settings.event_name}
        mobileOpen={mobileOpen}
        onCloseMobile={() => setMobileOpen(false)}
        onLogout={() => {
          void handleLogout();
        }}
      />

      <div className="flex min-h-screen flex-col lg:pl-[260px]">
        <AdminHeader
          eventName={settings.event_name}
          pageTitle={pageTitle}
          onOpenMobileMenu={() => setMobileOpen(true)}
        />
        <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-6 sm:px-6 lg:px-8">
          {children}
        </main>
      </div>
    </div>
  );
}
