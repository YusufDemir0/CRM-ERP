import { useEffect } from 'react';
import { useAuthStore } from '../store/useAuthStore';
import type { AuthUser } from '../store/useAuthStore';
import { useShallow } from 'zustand/react/shallow';

// ────── COMPATIBILITY SHIM ──────
// Re-exports useAuthStore as useAuth() for backward compatibility.
// All existing consumers continue to work unchanged.
// AuthProvider is now a thin wrapper that just fetches profile on mount.

interface AuthContextType {
  user: AuthUser | null;
  token: string | null;
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
  isLoading: boolean;
  hasPermission: (key: string) => boolean;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const fetchProfile = useAuthStore((s) => s.fetchProfile);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  return <>{children}</>;
}

export function useAuth(): AuthContextType {
  return useAuthStore(useShallow((s) => ({
    user: s.user,
    token: null, // JWT is in httpOnly cookie, not exposed to client
    login: s.login,
    logout: s.logout,
    isLoading: s.isLoading,
    hasPermission: s.hasPermission,
  })));
}
