import React from 'react';
import { Navigate } from 'react-router-dom';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole: string;
  loginPath: string;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, requiredRole, loginPath }) => {
  const role = localStorage.getItem('portal_role');
  if (role !== requiredRole) {
    return <Navigate to={loginPath} replace />;
  }
  return <>{children}</>;
};
