import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AdminLayout } from './layouts/AdminLayout';
import { DashboardPage } from './pages/DashboardPage';
import { ClinicsPage } from './pages/ClinicsPage';
import { SubscriptionsPage } from './pages/SubscriptionsPage';
import { SmsManagementPage } from './pages/SmsManagementPage';
import { PlansPage } from './pages/PlansPage';
import { PaymentsPage } from './pages/PaymentsPage';
import { AuditLogsPage } from './pages/AuditLogsPage';
import { UsersPage } from './pages/UsersPage';
import { BranchesPage } from './pages/BranchesPage';
import { ServicesPage } from './pages/ServicesPage';
import { SettingsPage } from './pages/SettingsPage';
import { ReportsPage } from './pages/ReportsPage';
import { SupportPage } from './pages/SupportPage';
import { PromoPage } from './pages/PromoPage';
import { ApiKeysPage } from './pages/ApiKeysPage';
import { SystemStatusPage } from './pages/SystemStatusPage';

export const App: React.FC = () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<AdminLayout />}>
          <Route index element={<DashboardPage />} />
          <Route path="clinics" element={<ClinicsPage />} />
          <Route path="subscriptions" element={<SubscriptionsPage />} />
          <Route path="sms" element={<SmsManagementPage />} />
          <Route path="plans" element={<PlansPage />} />
          <Route path="payments" element={<PaymentsPage />} />
          <Route path="users" element={<UsersPage />} />
          <Route path="branches" element={<BranchesPage />} />
          <Route path="services" element={<ServicesPage />} />
          <Route path="settings" element={<SettingsPage />} />
          <Route path="notifications" element={<SmsManagementPage />} />
          <Route path="audit" element={<AuditLogsPage />} />
          <Route path="reports" element={<ReportsPage />} />
          <Route path="support" element={<SupportPage />} />
          <Route path="promo" element={<PromoPage />} />
          <Route path="api-keys" element={<ApiKeysPage />} />
          <Route path="system-status" element={<SystemStatusPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
};

