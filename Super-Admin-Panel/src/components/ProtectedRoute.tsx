import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { ApiClient } from '../api/client';

export const ProtectedRoute: React.FC = () => {
  const token = ApiClient.getToken();

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
};
