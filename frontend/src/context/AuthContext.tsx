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
  const [token, setToken] = useState<string | null>(localStorage.getItem('erp_token'));
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (token) {
      authAPI.profile()
        .then((res) => {
          const u = res.data;
          setUser({ 
            ...u, 
            roles: normalizeRoles(u.roles),
            permissions: u.permissions || []
          });
        })
        .catch(() => { logout(); })
        .finally(() => setIsLoading(false));
    } else {
      setIsLoading(false);
    }
  }, [token]);

  const login = async (username: string, password: string) => {
    const res = await authAPI.login({ username, password });
    const { access_token, user: userData } = res.data;
    localStorage.setItem('erp_token', access_token);
    
    // Login might not return all permissions immediately, profile fetch will fill it
    const normalized = { 
      ...userData, 
      roles: normalizeRoles(userData.roles),
      permissions: userData.permissions || []
    };
    
    localStorage.setItem('erp_user', JSON.stringify(normalized));
    setToken(access_token);
    setUser(normalized);
  };

  const logout = () => {
    localStorage.removeItem('erp_token');
    localStorage.removeItem('erp_user');
    setToken(null);
    setUser(null);
  };

  const hasPermission = (key: string): boolean => {
    if (!user) return false;
    // Superadmin bypass (roles include 'admin' or 'superadmin')
    if (user.roles.some(r => ['admin', 'superadmin'].includes(r.toLowerCase()))) return true;
    return user.permissions.includes(key);
  };

  return (
    <AuthContext.Provider value={{ user, token, login, logout, isLoading, hasPermission }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
