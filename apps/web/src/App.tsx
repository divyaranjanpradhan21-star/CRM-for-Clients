import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { GatewayPage } from './pages/GatewayPage';
import { SuperAdminLoginPage } from './pages/super-admin/SuperAdminLoginPage';
import { SuperAdminDashboard } from './pages/super-admin/SuperAdminDashboard';
import { AdminLoginPage } from './pages/admin/AdminLoginPage';
import { AdminDashboard } from './pages/admin/AdminDashboard';
import { StaffLoginPage } from './pages/staff/StaffLoginPage';
import { StaffDashboard } from './pages/staff/StaffDashboard';
import { NotFoundPage } from './pages/NotFoundPage';
import { ProtectedRoute } from './routes/ProtectedRoute';

export const App: React.FC = () => {
  return (
    <BrowserRouter>
      <Routes>
        {/* Main Public Gateway / Portal Selector */}
        <Route path="/" element={<GatewayPage />} />

        {/* Portal 1: Super Admin */}
        <Route path="/super-admin/login" element={<SuperAdminLoginPage />} />
        <Route
          path="/super-admin/dashboard"
          element={
            <ProtectedRoute requiredRole="SUPER_ADMIN" loginPath="/super-admin/login">
              <SuperAdminDashboard />
            </ProtectedRoute>
          }
        />

        {/* Portal 2: Restaurant Admin */}
        <Route path="/admin/login" element={<AdminLoginPage />} />
        <Route
          path="/admin/dashboard"
          element={
            <ProtectedRoute requiredRole="RESTAURANT_ADMIN" loginPath="/admin/login">
              <AdminDashboard />
            </ProtectedRoute>
          }
        />

        {/* Portal 3: Staff Service Terminal */}
        <Route path="/staff/login" element={<StaffLoginPage />} />
        <Route
          path="/staff/dashboard"
          element={
            <ProtectedRoute requiredRole="STAFF" loginPath="/staff/login">
              <StaffDashboard />
            </ProtectedRoute>
          }
        />

        {/* Redirect generic /login to Admin login */}
        <Route path="/login" element={<Navigate to="/admin/login" replace />} />
        <Route path="/dashboard" element={<Navigate to="/admin/dashboard" replace />} />

        {/* 404 Catch-All */}
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </BrowserRouter>
  );
};

export default App;
