import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './context/AuthContext';
import { SettingsProvider } from './context/SettingsContext';
import Layout from './components/Layout';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import UsersPage from './pages/UsersPage';
import SettingsPage from './pages/SettingsPage';
import {
  DepartmentsPage, PartiesPage, RolesPage,
  CurrenciesPage, AccountsPage, ItemsPage,
  StocksPage, SalesPage, TransactionsPage, ProductionPage, BomsPage
} from './pages/ModulePages';
import ProtectedRoute from './components/ProtectedRoute';

export default function App() {
  return (
    <SettingsProvider>
      <AuthProvider>
        <BrowserRouter>
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
              <Route path="currencies" element={<CurrenciesPage />} />
              <Route path="accounts" element={<AccountsPage />} />
              <Route path="transactions" element={<TransactionsPage />} />
              <Route path="boms" element={<BomsPage />} />
              <Route path="production" element={<ProductionPage />} />
              <Route path="settings" element={<SettingsPage />} />
            </Route>
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
          <Toaster
            position="top-right"
            toastOptions={{
              duration: 3000,
              style: {
                background: '#1c1f2e',
                color: '#e8eaed',
                border: '1px solid #2a2f45',
                fontSize: '14px',
              },
            }}
          />
        </BrowserRouter>
      </AuthProvider>
    </SettingsProvider>
  );
}
