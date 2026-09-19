import { create } from 'zustand';
import { authAPI } from '../services/api';
import type { Role } from '../types';

// ────── AUTH USER TYPE ──────

export interface AuthUser {
  id: string;
  username: string;
  fullName: string;
  email: string;
  departmentId: string | null;
  department?: {
    id: string;
    name: string;
    cityId?: string | number | null;
    commercialAccountId?: string | null;
  } | null;
  roles: string[];
  permissions: string[];
  isSystemAdmin?: boolean;
}

// ────── STORE INTERFACE ──────

interface AuthState {
  user: AuthUser | null;
  isLoading: boolean;
  isAuthenticated: boolean;

  // Actions
  login: (username: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  fetchProfile: () => Promise<void>;
  hasPermission: (key: string) => boolean;
  isReAuthModalOpen: boolean;
  setReAuthModal: (isOpen: boolean) => void;
}

// ────── HELPERS ──────

function normalizeRoles(roles: (string | Role)[] | undefined): string[] {
  if (!roles || !Array.isArray(roles)) return [];
  return roles.map((r) => typeof r === 'string' ? r : r.name || '');
}

function checkIsSystemAdmin(roles: string[], permissions: string[] = []): boolean {
  return (
    roles.some(r => ['ADMIN', 'SYSTEM_ADMIN', 'SUPER_ADMIN'].includes(r.toUpperCase())) ||
    (permissions.includes('SALES_VIEW_ALL') && permissions.includes('SYSTEM_PAGE'))
  );
}

// ────── ZUSTAND STORE ──────

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  isLoading: true,
  isAuthenticated: false,
  isReAuthModalOpen: false,

  setReAuthModal: (isOpen: boolean) => set({ isReAuthModalOpen: isOpen }),

  fetchProfile: async () => {
    try {
      const res = await authAPI.profile();
      const u = res.data;
      const roles = normalizeRoles(u.roles);
      const permissions = u.permissions || [];
      const isSystemAdmin = checkIsSystemAdmin(roles, permissions);

      set({
        user: {
          ...u,
          roles,
          permissions,
          isSystemAdmin,
        },
        isAuthenticated: true,
        isLoading: false,
      });
    } catch {
      set({ user: null, isAuthenticated: false, isLoading: false });
    }
  },

  login: async (username: string, password: string) => {
    const res = await authAPI.login({ username, password });
    const { user: userData } = res.data;
    const roles = normalizeRoles(userData.roles);
    const permissions = userData.permissions || [];
    const isSystemAdmin = checkIsSystemAdmin(roles, permissions);

    set({
      user: {
        ...userData,
        roles,
        permissions,
        isSystemAdmin,
      },
      isAuthenticated: true,
      isLoading: false,
      isReAuthModalOpen: false,
    });
  },

  logout: async () => {
    try {
      await authAPI.logout();
    } catch (err) {
      console.error('Logout error:', err);
    } finally {
      set({ user: null, isAuthenticated: false, isReAuthModalOpen: false });
      // Clean logout with full page reload to clear memory
      window.location.href = '/login';
    }
  },

  hasPermission: (key: string): boolean => {
    const { user } = get();
    if (!user) return false;
    return user.permissions.includes(key);
  },
}));
