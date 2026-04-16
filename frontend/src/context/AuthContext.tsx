import { useEffect } from 'react';
import { useAuthStore } from '../store/useAuthStore';
import type { AuthUser } from '../store/useAuthStore';

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
  const user = useAuthStore((s) => s.user);
  const isLoading = useAuthStore((s) => s.isLoading);
  const login = useAuthStore((s) => s.login);
  const logout = useAuthStore((s) => s.logout);
  const hasPermission = useAuthStore((s) => s.hasPermission);

  return {
    user,
    token: null, // JWT is in httpOnly cookie, not exposed to client
    login,
    logout,
    isLoading,
    hasPermission,
  };
}
