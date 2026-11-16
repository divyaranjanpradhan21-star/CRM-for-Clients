import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { getCurrentUser, UserRole } from '../lib/auth';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole: UserRole;
  loginPath?: string;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  requiredRole,
  loginPath = '/login',
}) => {
  const location = useLocation();
  const user = getCurrentUser();
  const storedRole = localStorage.getItem('portal_role');

  // Verify both active user session and role match
  if (!user || !storedRole || storedRole !== requiredRole) {
    // Save attempt location for return after authentication
    return <Navigate to={loginPath} state={{ from: location }} replace />;
  }

  return <>{children}</>;
};
