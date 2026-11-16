import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { UnifiedLoginPage } from './pages/UnifiedLoginPage';
import { SuperAdminDashboard } from './pages/super-admin/SuperAdminDashboard';
import { AdminDashboard } from './pages/admin/AdminDashboard';
import { StaffDashboard } from './pages/staff/StaffDashboard';
import { NotFoundPage } from './pages/NotFoundPage';
import { ProtectedRoute } from './routes/ProtectedRoute';

export const App: React.FC = () => {
  return (
    <BrowserRouter>
      <Routes>
        {/* Single Unified Login Page for ALL portals (Super Admin, Admin, and Staff) */}
        <Route path="/" element={<UnifiedLoginPage />} />
        <Route path="/login" element={<UnifiedLoginPage />} />

        {/* Legacy / Direct login redirects -> all go to the single login page */}
        <Route path="/super-admin/login" element={<Navigate to="/login" replace />} />
        <Route path="/admin/login" element={<Navigate to="/login" replace />} />
        <Route path="/staff/login" element={<Navigate to="/login" replace />} />

        {/* Portal 1: Super Admin Dashboard (Protected) */}
        <Route
          path="/super-admin/dashboard"
          element={
            <ProtectedRoute requiredRole="SUPER_ADMIN" loginPath="/login">
              <SuperAdminDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/super-admin/organizations"
          element={
            <ProtectedRoute requiredRole="SUPER_ADMIN" loginPath="/login">
              <SuperAdminDashboard />
            </ProtectedRoute>
          }
        />

        {/* Portal 2: Restaurant Admin Dashboard (Protected) */}
        <Route
          path="/admin/dashboard"
          element={
            <ProtectedRoute requiredRole="RESTAURANT_ADMIN" loginPath="/login">
              <AdminDashboard />
            </ProtectedRoute>
          }
        />

        {/* Portal 3: Staff Service Terminal Dashboard (Protected) */}
        <Route
          path="/staff/dashboard"
          element={
            <ProtectedRoute requiredRole="STAFF" loginPath="/login">
              <StaffDashboard />
            </ProtectedRoute>
          }
        />

        {/* Generic Dashboard redirect -> defaults to Admin */}
        <Route path="/dashboard" element={<Navigate to="/admin/dashboard" replace />} />

        {/* 404 Catch-All */}
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </BrowserRouter>
  );
};

export default App;
