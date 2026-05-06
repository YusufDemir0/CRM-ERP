import { Outlet, Navigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import Sidebar from './Sidebar';
import Navbar from './Navbar';
import { useState, useCallback, useMemo, useEffect } from 'react';
import { authEvents } from '../services/authEvents';
import { useAuthStore } from '../store/useAuthStore';

export default function Layout() {
  const { user, isLoading } = useAuth();

  const [isCollapsed, setIsCollapsed] = useState(false);
  
  // Listen for session-expired events from the API layer (decoupled from interceptor)
  useEffect(() => {
    const unsubscribe = authEvents.on('session-expired', () => {
      useAuthStore.getState().setReAuthModal(true);
    });
    return unsubscribe;
  }, []);

  if (isLoading) {
    return (
      <div className="page-loading">
        <div className="spinner" />
        <p>Yükleniyor...</p>
      </div>
    );
  }

  if (!user) return <Navigate to="/login" replace />;

  const toggleSidebar = useCallback(() => setIsCollapsed(prev => !prev), []);
  const sidebarWidth = isCollapsed ? '80px' : '256px';
  const layoutStyle = useMemo(() => ({ '--sidebar-w': sidebarWidth } as React.CSSProperties), [sidebarWidth]);

  return (
    <div className="app-layout" style={layoutStyle}>
      <Sidebar isCollapsed={isCollapsed} />
      <div className="flex flex-col flex-1 min-h-screen">
        <Navbar onToggleSidebar={toggleSidebar} />
        <main className="main-content">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
