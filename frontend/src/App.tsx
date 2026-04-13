import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './context/AuthContext';
import { SettingsProvider } from './context/SettingsContext';
import { QuickCreateProvider } from './context/QuickCreateContext';
import Layout from './components/Layout';
import LoginPage from './pages/modules/LoginPage';
import DashboardPage from './pages/modules/DashboardPage';
import UsersPage from './pages/modules/UsersPage';
import SettingsPage from './pages/modules/SettingsPage';
import { RolesPage } from './pages/modules/RolesPage';
import DepartmentsPage from "./pages/modules/DepartmentsPage"
import PartiesPage  from './pages/modules/PartiesPage';
import ItemsPage from './pages/modules/ItemsPage';
import {StocksPage} from './pages/modules/StocksPage';
import SalesPage from './pages/SalesPage';
import AccountsPage from './pages/modules/AccountsPage';
import TransactionsPage from './pages/modules/TransactionsPage';
import {BomsPage} from './pages/modules/BomsPage';
import {ProductionPage} from './pages/modules/ProductionPage';
import ProtectedRoute from './components/ProtectedRoute';
import GlobalLoader from './components/GlobalLoader';

import NotesPage from './pages/modules/NotesPage';
import LogsPage from './pages/modules/LogsPage';

export default function App() {
  return (
    <SettingsProvider>
      <AuthProvider>
        <QuickCreateProvider>
          <BrowserRouter>
          <GlobalLoader />
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
              <Route index element={<DashboardPage />} />
              <Route path="users" element={<UsersPage />} />
              <Route path="roles" element={<ProtectedRoute allowedRoles={['Admin']}><RolesPage /></ProtectedRoute>} />
              <Route path="departments" element={<DepartmentsPage />} />
              <Route path="parties" element={<PartiesPage />} />
              <Route path="items" element={<ItemsPage />} />
              <Route path="stocks" element={<StocksPage />} />
              <Route path="sales" element={<SalesPage />} />

              <Route path="accounts" element={<AccountsPage />} />
              <Route path="transactions" element={<TransactionsPage />} />
              <Route path="boms" element={<BomsPage />} />
              <Route path="production" element={<ProductionPage />} />
              <Route path="settings" element={<SettingsPage />} />
              <Route path="logs" element={<ProtectedRoute allowedRoles={['Admin']}><LogsPage /></ProtectedRoute>} />
              <Route path="notes" element={<NotesPage />} />
            </Route>
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
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
        </QuickCreateProvider>
      </AuthProvider>
    </SettingsProvider>
  );
}
