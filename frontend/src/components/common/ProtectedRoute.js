import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

const ProtectedRoute = ({ children, requiredRoles = [] }) => {
  const { isAuthenticated, user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return <div className="flex justify-center items-center h-screen">Loading...</div>;
  }

  if (!isAuthenticated) {
    // Redirect to login page with the attempted page as a redirect parameter
    return <Navigate to="/login" state={{ from: location.pathname }} />;
  }

  // Check role requirements if specified
  if (requiredRoles.length > 0 && !requiredRoles.includes(user.role)) {
    // Redirect to appropriate dashboard based on user role
    switch (user.role) {
      case 'SuperAdmin':
        return <Navigate to="/admin/dashboard" />;
      case 'DepartmentUser':
        return <Navigate to="/department/dashboard" />;
      case 'Student':
        return <Navigate to="/student/dashboard" />;
      case 'Faculty':
        return <Navigate to="/faculty/dashboard" />;
      default:
        return <Navigate to="/" />;
    }
  }

  return children;
};

export default ProtectedRoute;
