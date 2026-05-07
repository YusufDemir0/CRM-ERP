import { Outlet, Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import Sidebar from './Sidebar';
import Navbar from './Navbar';
import { useState, useCallback, useMemo, useEffect } from 'react';
import { authEvents } from '../services/authEvents';
import { useAuthStore } from '../store/useAuthStore';

export default function Layout() {
  const { user, isLoading } = useAuth();
  const location = useLocation();

  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  
  // Close mobile menu on route change
  useEffect(() => {
    setIsMobileOpen(false);
  }, [location.pathname]);

  // Listen for session-expired events
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

  const toggleSidebar = useCallback(() => {
    if (window.innerWidth <= 768) {
      setIsMobileOpen(prev => !prev);
    } else {
      setIsCollapsed(prev => !prev);
    }
  }, []);

  const sidebarWidth = useMemo(() => {
    // In mobile view, we want CSS to control the width (0px base)
    if (typeof window !== 'undefined' && window.innerWidth <= 768) return '0px';
    return isCollapsed ? '80px' : '256px';
  }, [isCollapsed]);

  const layoutStyle = useMemo(() => ({ '--sidebar-w': sidebarWidth } as React.CSSProperties), [sidebarWidth]);

  return (
    <div className="app-layout" style={layoutStyle}>
      <Sidebar 
        isCollapsed={isCollapsed} 
        isMobileOpen={isMobileOpen} 
        onClose={() => setIsMobileOpen(false)} 
      />
      
      {/* Mobile Backdrop */}
      {isMobileOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[95] lg:hidden animate-fade-in"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      <div className="flex flex-col flex-1 min-h-screen">
        <Navbar onToggleSidebar={toggleSidebar} />
        <main className="main-content">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
