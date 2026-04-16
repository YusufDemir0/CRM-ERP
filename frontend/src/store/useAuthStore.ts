import { create } from 'zustand';
import { authAPI } from '../services/api';
import type { Role } from '../types';

// ────── AUTH USER TYPE ──────

export interface AuthUser {
  id: number;
  username: string;
  fullName: string;
  email: string;
  departmentId: number | null;
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
  setRedirectToLogin: (fn: () => void) => void;
}

// ────── HELPERS ──────

function normalizeRoles(roles: (string | Role)[] | undefined): string[] {
  if (!roles || !Array.isArray(roles)) return [];
  return roles.map((r) => typeof r === 'string' ? r : r.name || '');
}

// Store a redirect function (set by NavigationManager inside Router context)
let _redirectToLogin: (() => void) | null = null;

// ────── ZUSTAND STORE ──────

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  isLoading: true,
  isAuthenticated: false,

  setRedirectToLogin: (fn: () => void) => {
    _redirectToLogin = fn;
  },

  fetchProfile: async () => {
    // Don't fetch profile on login page (avoids unnecessary 401)
    if (window.location.pathname === '/login') {
      set({ isLoading: false });
      return;
    }

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
    });
  },

  logout: async () => {
    try {
      await authAPI.logout();
    } catch (err) {
      console.error('Logout error:', err);
    } finally {
      set({ user: null, isAuthenticated: false });
      // Navigate to login via the router-context redirect function
      _redirectToLogin?.();
    }
  },

  hasPermission: (key: string): boolean => {
    const { user } = get();
    if (!user) return false;
    if (user.roles.some(r => ['admin', 'superadmin'].includes(r.toLowerCase()))) return true;
    return user.permissions.includes(key);
  },
}));
