import { Outlet, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Sidebar from './Sidebar';
import Navbar from './Navbar';
import { useState } from 'react';

export default function Layout() {
  const { user, isLoading } = useAuth();

  const [isCollapsed, setIsCollapsed] = useState(false);

  if (isLoading) {
    return (
      <div className="page-loading">
        <div className="spinner" />
        <p>Yükleniyor...</p>
      </div>
    );
  }

  if (!user) return <Navigate to="/login" replace />;

  const sidebarWidth = isCollapsed ? '80px' : '256px';

  return (
    <div className="app-layout" style={{ '--sidebar-w': sidebarWidth } as any}>
      <Sidebar isCollapsed={isCollapsed} />
      <div className="flex flex-col flex-1 min-h-screen">
        <Navbar onToggleSidebar={() => setIsCollapsed(!isCollapsed)} />
        <main className="main-content">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
