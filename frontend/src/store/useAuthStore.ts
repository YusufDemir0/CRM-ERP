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
  } | null;
  roles: string[];
  permissions: string[];
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
      set({
        user: {
          ...u,
          roles: normalizeRoles(u.roles),
          permissions: u.permissions || [],
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

    set({
      user: {
        ...userData,
        roles: normalizeRoles(userData.roles),
        permissions: userData.permissions || [],
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
