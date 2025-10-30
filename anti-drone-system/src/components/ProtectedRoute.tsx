import React from 'react';
import { Navigate } from 'react-router-dom';

interface ProtectedRouteProps {
  token: string | null;
  children: React.ReactNode;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ token, children }) => {
  if (!token) {
    return <Navigate to="/login" replace />;
  }
  return <>{children}</>;
};

export default ProtectedRoute;
