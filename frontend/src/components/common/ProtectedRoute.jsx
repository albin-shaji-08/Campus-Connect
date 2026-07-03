import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const ProtectedRoute = ({ children, allowedRoles = [] }) => {
  const { role } = useAuth();

  // If no role (not logged in), redirect to login
  if (!role) {
    return <Navigate to="/login" replace />;
  }

  // If allowedRoles is specified and user's role is not in the list, redirect to home
  if (allowedRoles.length > 0 && !allowedRoles.includes(role)) {
    return <Navigate to="/" replace />;
  }

  // User is authenticated and has the right role
  return children;
};

export default ProtectedRoute;
