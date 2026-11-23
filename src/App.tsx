import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { ErrorBoundary } from './components/common/ErrorBoundary.tsx';
import { AuthProvider } from './hooks/useAuth.tsx';
import { AdminLogin } from './pages/admin/AdminLogin.tsx';
import { Dashboard } from './pages/admin/Dashboard.tsx';
import { Registrations } from './pages/admin/Registrations.tsx';
import { Scanner } from './pages/admin/Scanner.tsx';
import { VerificationPage } from './pages/public/VerificationPage.tsx';
import { WelcomePage } from './pages/public/WelcomePage.tsx';

export default function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            {/* Public Student & QR Verification Routes */}
            <Route path="/" element={<WelcomePage />} />
            <Route path="/verify" element={<VerificationPage />} />

            {/* Admin Auth & Dashboard Routes */}
            <Route path="/admin/login" element={<AdminLogin />} />
            <Route path="/admin" element={<Dashboard />} />
            <Route path="/admin/scanner" element={<Scanner />} />
            <Route path="/admin/registrations" element={<Registrations />} />
            <Route path="/admin/exports" element={<Navigate to="/admin" replace />} />
            <Route path="/admin/coordinators" element={<Navigate to="/admin" replace />} />

            {/* Fallback */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </ErrorBoundary>
  );
}
