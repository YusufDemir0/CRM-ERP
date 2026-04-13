import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { authAPI } from '../services/api';

interface User {
  id: number;
  username: string;
  fullName: string;
  email: string;
  departmentId: number | null;
  roles: string[];
  permissions: string[];
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
  isLoading: boolean;
  hasPermission: (key: string) => boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

function normalizeRoles(roles: any): string[] {
  if (!roles || !Array.isArray(roles)) return [];
  return roles.map((r: any) => typeof r === 'string' ? r : r.name || '');
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check if user is logged in by fetching profile
    authAPI.profile()
      .then((res) => {
        const u = res.data;
        setUser({ 
          ...u, 
          roles: normalizeRoles(u.roles),
          permissions: u.permissions || []
        });
      })
      .catch(() => {
        setUser(null);
      })
      .finally(() => setIsLoading(false));
  }, []);

  const login = async (username: string, password: string) => {
    const res = await authAPI.login({ username, password });
    const { user: userData } = res.data;
    
    setUser({ 
      ...userData, 
      roles: normalizeRoles(userData.roles),
      permissions: userData.permissions || []
    });
  };

  const logout = async () => {
    try {
      await authAPI.logout();
    } catch (err) {
      console.error('Logout error:', err);
    } finally {
      setUser(null);
      window.location.href = '/login';
    }
  };

  const hasPermission = (key: string): boolean => {
    if (!user) return false;
    if (user.roles.some(r => ['admin', 'superadmin'].includes(r.toLowerCase()))) return true;
    return user.permissions.includes(key);
  };

  return (
    <AuthContext.Provider value={{ user, token: null, login, logout, isLoading, hasPermission }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
