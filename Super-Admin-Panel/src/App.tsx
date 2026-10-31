import React, { Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AdminLayout } from './layouts/AdminLayout';
import { PageSkeleton } from './components/PageSkeleton';
import { ProtectedRoute } from './components/ProtectedRoute';
import { LoginPage } from './pages/LoginPage';

// Route-based Code Splitting: Lazy loading pages on-demand for maximum performance
const DashboardPage = lazy(() => import('./pages/DashboardPage').then(m => ({ default: m.DashboardPage })));
const ClinicsPage = lazy(() => import('./pages/ClinicsPage').then(m => ({ default: m.ClinicsPage })));
const SubscriptionsPage = lazy(() => import('./pages/SubscriptionsPage').then(m => ({ default: m.SubscriptionsPage })));
const SmsManagementPage = lazy(() => import('./pages/SmsManagementPage').then(m => ({ default: m.SmsManagementPage })));
const PlansPage = lazy(() => import('./pages/PlansPage').then(m => ({ default: m.PlansPage })));
const PaymentsPage = lazy(() => import('./pages/PaymentsPage').then(m => ({ default: m.PaymentsPage })));
const UsersPage = lazy(() => import('./pages/UsersPage').then(m => ({ default: m.UsersPage })));
const BranchesPage = lazy(() => import('./pages/BranchesPage').then(m => ({ default: m.BranchesPage })));
const ServicesPage = lazy(() => import('./pages/ServicesPage').then(m => ({ default: m.ServicesPage })));
const SettingsPage = lazy(() => import('./pages/SettingsPage').then(m => ({ default: m.SettingsPage })));
const AuditLogsPage = lazy(() => import('./pages/AuditLogsPage').then(m => ({ default: m.AuditLogsPage })));
const ReportsPage = lazy(() => import('./pages/ReportsPage').then(m => ({ default: m.ReportsPage })));
const SupportPage = lazy(() => import('./pages/SupportPage').then(m => ({ default: m.SupportPage })));
const PromoPage = lazy(() => import('./pages/PromoPage').then(m => ({ default: m.PromoPage })));
const ApiKeysPage = lazy(() => import('./pages/ApiKeysPage').then(m => ({ default: m.ApiKeysPage })));
const SystemStatusPage = lazy(() => import('./pages/SystemStatusPage').then(m => ({ default: m.SystemStatusPage })));

export const App: React.FC = () => {
  return (
    <BrowserRouter>
      <Routes>
        {/* Ochiq kirish sahifasi */}
        <Route path="/login" element={<LoginPage />} />

        {/* Himoyalangan Super Admin sahifalari */}
        <Route element={<ProtectedRoute />}>
          <Route path="/" element={<AdminLayout />}>
            <Route index element={<Suspense fallback={<PageSkeleton />}><DashboardPage /></Suspense>} />
            <Route path="clinics" element={<Suspense fallback={<PageSkeleton />}><ClinicsPage /></Suspense>} />
            <Route path="subscriptions" element={<Suspense fallback={<PageSkeleton />}><SubscriptionsPage /></Suspense>} />
            <Route path="sms" element={<Suspense fallback={<PageSkeleton />}><SmsManagementPage /></Suspense>} />
            <Route path="plans" element={<Suspense fallback={<PageSkeleton />}><PlansPage /></Suspense>} />
            <Route path="payments" element={<Suspense fallback={<PageSkeleton />}><PaymentsPage /></Suspense>} />
            <Route path="users" element={<Suspense fallback={<PageSkeleton />}><UsersPage /></Suspense>} />
            <Route path="branches" element={<Suspense fallback={<PageSkeleton />}><BranchesPage /></Suspense>} />
            <Route path="services" element={<Suspense fallback={<PageSkeleton />}><ServicesPage /></Suspense>} />
            <Route path="settings" element={<Suspense fallback={<PageSkeleton />}><SettingsPage /></Suspense>} />
            <Route path="notifications" element={<Suspense fallback={<PageSkeleton />}><SmsManagementPage /></Suspense>} />
            <Route path="audit" element={<Suspense fallback={<PageSkeleton />}><AuditLogsPage /></Suspense>} />
            <Route path="reports" element={<Suspense fallback={<PageSkeleton />}><ReportsPage /></Suspense>} />
            <Route path="support" element={<Suspense fallback={<PageSkeleton />}><SupportPage /></Suspense>} />
            <Route path="promo" element={<Suspense fallback={<PageSkeleton />}><PromoPage /></Suspense>} />
            <Route path="api-keys" element={<Suspense fallback={<PageSkeleton />}><ApiKeysPage /></Suspense>} />
            <Route path="system-status" element={<Suspense fallback={<PageSkeleton />}><SystemStatusPage /></Suspense>} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        </Route>
      </Routes>
    </BrowserRouter>
  );
};
