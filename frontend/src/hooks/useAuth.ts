import { useAuthStore } from '../store/useAuthStore';
import { useShallow } from 'zustand/react/shallow';
import type { AuthUser } from '../store/useAuthStore';

interface AuthHookType {
  user: AuthUser | null;
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
  isLoading: boolean;
  hasPermission: (key: string) => boolean;
  isAuthenticated: boolean;
}

/**
 * Modern useAuth hook that wraps useAuthStore.
 * Replaces the legacy AuthContext shim.
 */
export function useAuth(): AuthHookType {
  return useAuthStore(useShallow((s) => ({
    user: s.user,
    login: s.login,
    logout: s.logout,
    isLoading: s.isLoading,
    hasPermission: s.hasPermission,
    isAuthenticated: s.isAuthenticated
  })));
}
