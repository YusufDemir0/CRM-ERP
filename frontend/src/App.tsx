import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './context/AuthContext';
import { lazy, Suspense, useEffect } from 'react';

// Layout & Core
import Layout from './components/Layout';
import ProtectedRoute from './components/ProtectedRoute';
import GlobalLoader from './components/GlobalLoader';

// Lazy Loaded Modules
const LoginPage = lazy(() => import('./pages/modules/LoginPage'));
const DashboardPage = lazy(() => import('./pages/modules/DashboardPage'));
const UsersPage = lazy(() => import('./pages/modules/UsersPage'));
const SettingsPage = lazy(() => import('./pages/modules/SettingsPage'));
const RolesPage = lazy(() => import('./pages/modules/RolesPage').then(m => ({ default: m.RolesPage })));
const DepartmentsPage = lazy(() => import('./pages/modules/DepartmentsPage'));
const PartiesPage = lazy(() => import('./pages/modules/PartiesPage'));
const ItemsPage = lazy(() => import('./pages/modules/ItemsPage'));
const StocksPage = lazy(() => import('./pages/modules/StocksPage').then(m => ({ default: m.StocksPage })));
const SalesPage = lazy(() => import('./pages/SalesPage'));
const SaleWizardPage = lazy(() => import('./pages/modules/SalesWizard/SaleWizardPage'));
const AccountsPage = lazy(() => import('./pages/modules/AccountsPage'));
const TransactionsPage = lazy(() => import('./pages/modules/TransactionsPage'));
const BomsPage = lazy(() => import('./pages/modules/BomsPage').then(m => ({ default: m.BomsPage })));
const ProductionPage = lazy(() => import('./pages/modules/ProductionPage').then(m => ({ default: m.ProductionPage })));
const NotesPage = lazy(() => import('./pages/modules/NotesPage'));
const LogsPage = lazy(() => import('./pages/modules/LogsPage'));
const UnauthorizedPage = lazy(() => import('./pages/modules/UnauthorizedPage'));

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
      staleTime: 5 * 60 * 1000,
    },
  },
});
import ErrorBoundary from './components/common/ErrorBoundary';
import { QuickCreateManager } from './components/common/QuickCreateManager';
import { initCsrf } from './services/api';

export default function App() {
  useEffect(() => {
    // SEC-03: Seed CSRF token on startup
    initCsrf();
  }, []);

  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <BrowserRouter>
            <GlobalLoader />
            <Suspense fallback={<GlobalLoader />}>
              <Routes>
                <Route path="/login" element={<LoginPage />} />
                <Route path="/unauthorized" element={<UnauthorizedPage />} />
                <Route path="/" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
                  <Route index element={<ErrorBoundary><DashboardPage /></ErrorBoundary>} />
                  <Route path="users" element={<ErrorBoundary><ProtectedRoute requiredPermission="kullanici_goruntuleme"><UsersPage /></ProtectedRoute></ErrorBoundary>} />
                  <Route path="roles" element={<ErrorBoundary><ProtectedRoute requiredPermission="rol_goruntuleme"><RolesPage /></ProtectedRoute></ErrorBoundary>} />
                  <Route path="departments" element={<ErrorBoundary><ProtectedRoute requiredPermission="system:manage"><DepartmentsPage /></ProtectedRoute></ErrorBoundary>} />
                  <Route path="parties" element={<ErrorBoundary><ProtectedRoute requiredPermission="musteri_goruntuleme"><PartiesPage /></ProtectedRoute></ErrorBoundary>} />
                  <Route path="items" element={<ErrorBoundary><ProtectedRoute requiredPermission="stok_goruntuleme"><ItemsPage /></ProtectedRoute></ErrorBoundary>} />
                  <Route path="stocks" element={<ErrorBoundary><ProtectedRoute requiredPermission="stok_goruntuleme"><StocksPage /></ProtectedRoute></ErrorBoundary>} />
                  <Route path="sales" element={<ErrorBoundary><ProtectedRoute requiredPermission="satis_goruntuleme"><SalesPage /></ProtectedRoute></ErrorBoundary>} />
                  <Route path="sales/wizard" element={<ErrorBoundary><ProtectedRoute requiredPermission="satis_goruntuleme"><SaleWizardPage /></ProtectedRoute></ErrorBoundary>} />

                  <Route path="accounts" element={<ErrorBoundary><ProtectedRoute requiredPermission="finans_goruntuleme"><AccountsPage /></ProtectedRoute></ErrorBoundary>} />
                  <Route path="transactions" element={<ErrorBoundary><ProtectedRoute requiredPermission="finans_goruntuleme"><TransactionsPage /></ProtectedRoute></ErrorBoundary>} />
                  <Route path="boms" element={<ErrorBoundary><ProtectedRoute requiredPermission="uretim_goruntuleme"><BomsPage /></ProtectedRoute></ErrorBoundary>} />
                  <Route path="production" element={<ErrorBoundary><ProtectedRoute requiredPermission="uretim_goruntuleme"><ProductionPage /></ProtectedRoute></ErrorBoundary>} />
                  <Route path="settings" element={<ErrorBoundary><ProtectedRoute requiredPermission="system:manage"><SettingsPage /></ProtectedRoute></ErrorBoundary>} />
                  <Route path="logs" element={<ErrorBoundary><ProtectedRoute requiredPermission="system:manage"><LogsPage /></ProtectedRoute></ErrorBoundary>} />
                  <Route path="notes" element={<ErrorBoundary><NotesPage /></ErrorBoundary>} />
                </Route>
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </Suspense>
            <QuickCreateManager />
            <Toaster
              position="top-right"
              toastOptions={{
                duration: 4000,
                style: {
                  background: 'var(--bg-card)',
                  color: 'var(--text-primary)',
                  border: '1px solid var(--border)',
                  borderRadius: 'var(--radius-md)',
                  fontSize: '14px',
                  fontWeight: '600',
                  padding: '12px 16px',
                  boxShadow: 'var(--shadow-lg)',
                },
                success: {
                  iconTheme: { primary: 'var(--success)', secondary: '#fff' },
                },
                error: {
                  iconTheme: { primary: 'var(--danger)', secondary: '#fff' },
                },
              }}
            />
          </BrowserRouter>
        </AuthProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}

