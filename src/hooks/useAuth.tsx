import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react';
import {
  bootstrapSuperAdmin,
  fetchCurrentAdmin,
  getBootstrapStatus,
  loginAdmin,
  logoutAdmin,
} from '../services/adminService.ts';
import type { AdminAccountPublic } from '../types/database.types.ts';

interface AuthContextValue {
  admin: AdminAccountPublic | null;
  loading: boolean;
  configured: boolean;
  initialized: boolean;
  refreshAuth: () => Promise<void>;
  login: (
    phone_number: string,
    passcode: string
  ) => Promise<AdminAccountPublic>;
  bootstrap: (payload: {
    full_name: string;
    phone_number: string;
    passcode: string;
  }) => Promise<AdminAccountPublic>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [admin, setAdmin] = useState<AdminAccountPublic | null>(null);
  const [loading, setLoading] = useState(true);
  const [configured, setConfigured] = useState(true);
  const [initialized, setInitialized] = useState(true);

  const refreshAuth = useCallback(async () => {
    setLoading(true);
    try {
      const [status, meResult] = await Promise.all([
        getBootstrapStatus(),
        fetchCurrentAdmin().catch(() => null),
      ]);
      setConfigured(status.configured);
      setInitialized(status.initialized);

      if (status.configured && status.initialized && meResult?.admin) {
        setAdmin(meResult.admin);
      } else {
        setAdmin(null);
      }
    } catch {
      setAdmin(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refreshAuth();
  }, [refreshAuth]);

  const login = useCallback(async (phone_number: string, passcode: string) => {
    const res = await loginAdmin({ phone_number, passcode });
    setAdmin(res.admin);
    setConfigured(true);
    setInitialized(true);
    return res.admin;
  }, []);

  const bootstrap = useCallback(
    async (payload: {
      full_name: string;
      phone_number: string;
      passcode: string;
    }) => {
      const res = await bootstrapSuperAdmin(payload);
      setAdmin(res.admin);
      setConfigured(true);
      setInitialized(true);
      return res.admin;
    },
    []
  );

  const logout = useCallback(async () => {
    await logoutAdmin();
    setAdmin(null);
  }, []);

  return (
    <AuthContext.Provider
      value={{
        admin,
        loading,
        configured,
        initialized,
        refreshAuth,
        login,
        bootstrap,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used inside AuthProvider');
  }
  return ctx;
}
