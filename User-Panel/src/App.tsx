import React from 'react';
import { BrowserRouter, HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { LoginPage } from './pages/LoginPage';
import { ManagerPage } from './pages/ManagerPage';
import { DoctorPage } from './pages/DoctorPage';
import { OperatorPage } from './pages/OperatorPage';
import { ToastContainer } from './components/ToastNotification';
import { SubscriptionGuard } from './components/SubscriptionGuard';

// Auth Protection Helper
const ProtectedRoute: React.FC<{ children: React.ReactElement; allowedRoles?: string[] }> = ({ children, allowedRoles }) => {
  const userJson = localStorage.getItem('sadaf_user');
  if (!userJson) {
    return <Navigate to="/login" replace />;
  }

  try {
    const user = JSON.parse(userJson);
    const userRole = (user.role || '').toUpperCase();
    if (allowedRoles) {
      const effectiveAllowed = [...allowedRoles];
      if (effectiveAllowed.includes('MANAGER') && !effectiveAllowed.includes('OWNER')) {
        effectiveAllowed.push('OWNER');
      }
      if (!effectiveAllowed.includes(userRole)) {
        // Redirect to their default view if they try to access an unauthorized route
        if (userRole === 'CASHIER') return <Navigate to="/cashier" replace />;
        if (userRole === 'DOCTOR') return <Navigate to="/doctor" replace />;
        return <Navigate to="/manager" replace />;
      }
    }
  } catch (e) {
    return <Navigate to="/login" replace />;
  }

  return children;
};

// Root index dispatcher based on role
const RootDispatcher: React.FC = () => {
  const userJson = localStorage.getItem('sadaf_user');
  if (!userJson) {
    return <Navigate to="/login" replace />;
  }

  try {
    const user = JSON.parse(userJson);
    const userRole = (user.role || '').toUpperCase();
    if (userRole === 'CASHIER') return <Navigate to="/cashier" replace />;
    if (userRole === 'DOCTOR') return <Navigate to="/doctor" replace />;
    return <Navigate to="/manager" replace />;
  } catch (e) {
    return <Navigate to="/login" replace />;
  }
};

export const App: React.FC = () => {
  const isFileOrElectron = window.location.protocol === 'file:' || !!window.electronAPI;
  const RouterComponent = isFileOrElectron ? HashRouter : BrowserRouter;

  return (
    <RouterComponent>
      <SubscriptionGuard>
        <ToastContainer />
        <Routes>
        {/* Public Login Route */}
        <Route path="/login" element={<LoginPage />} />

        {/* Root Redirector */}
        <Route path="/" element={<RootDispatcher />} />

        {/* 1. Cashier & Ticket Issuing View (100% 1:1 Documentation/Kassir.png) */}
        <Route
          path="/cashier"
          element={
            <ProtectedRoute allowedRoles={['CASHIER', 'MANAGER', 'ADMIN']}>
              <OperatorPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/operator"
          element={
            <ProtectedRoute allowedRoles={['CASHIER', 'MANAGER', 'ADMIN']}>
              <OperatorPage />
            </ProtectedRoute>
          }
        />

        {/* 2. Doctor Consultation & Queue Control View (100% 1:1 Documentation/Shifokor.png) */}
        <Route
          path="/doctor"
          element={
            <ProtectedRoute allowedRoles={['DOCTOR', 'MANAGER', 'ADMIN']}>
              <DoctorPage />
            </ProtectedRoute>
          }
        />

        {/* 3. Manager Dashboard & Analytics View (100% 1:1 Documentation/Meneger.png) */}
        <Route
          path="/manager"
          element={
            <ProtectedRoute allowedRoles={['MANAGER', 'ADMIN']}>
              <ManagerPage />
            </ProtectedRoute>
          }
        />

        {/* Additional alias routes mapped to Manager view tabs */}
        <Route
          path="/doctors"
          element={
            <ProtectedRoute allowedRoles={['MANAGER', 'ADMIN']}>
              <ManagerPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/services"
          element={
            <ProtectedRoute allowedRoles={['MANAGER', 'ADMIN']}>
              <ManagerPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/patients"
          element={
            <ProtectedRoute allowedRoles={['CASHIER', 'DOCTOR', 'MANAGER', 'ADMIN']}>
              <ManagerPage />
            </ProtectedRoute>
          }
        />

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      </SubscriptionGuard>
    </RouterComponent>
  );
};
