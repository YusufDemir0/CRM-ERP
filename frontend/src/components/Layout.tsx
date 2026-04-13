import { Outlet, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Sidebar from './Sidebar';
import Navbar from './Navbar';
import { QuickCreateManager } from './common/QuickCreateManager';

export default function Layout() {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', background: 'var(--background)', color: 'var(--on-surface)' }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1.5rem', padding: '3rem' }}>
          <div style={{ width: '48px', height: '48px', borderRadius: '16px', background: 'var(--primary-glow)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div className="spinner" style={{ width: '24px', height: '24px', border: '3px solid var(--primary-glow)', borderTopColor: 'var(--primary)', borderRadius: '50%' }} />
          </div>
          <p style={{ fontSize: '0.75rem', fontWeight: 700, letterSpacing: '0.15em', textTransform: 'uppercase', opacity: 0.5 }}>Sistem Yükleniyor...</p>
        </div>
      </div>
    );
  }

  if (!user) return <Navigate to="/login" replace />;

  return (
    <div className="app-layout">
      <Sidebar />
      <Navbar />
      <main className="main-content">
        <Outlet />
      </main>
      <QuickCreateManager />
    </div>
  );
}
