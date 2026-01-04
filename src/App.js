import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import SignupPage from './pages/SignupPage';
import OrganizationRegistrationPage from './pages/OrganisationRegistrationPage';
import SuperAdminRegistrationPage from './pages/SuperAdminRegistrationPage';
import SuperAdminDashboard from './pages/SuperAdminDashboard';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import ProtectedRoute from './components/common/ProtectedRoute';
import ComplaintManagement from './pages/ComplaintManagement';
import StudentDashboard from './pages/StudentDashboard';
import DepartmentDashboard from './pages/DepartmentDashboard';
import WorkflowManagement from './pages/WorkflowManagement';
import NotificationsPage from './pages/NotificationsPage';

const App = () => {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/organisation-registration" element={<OrganizationRegistrationPage />} />
          <Route path="/register-superadmin" element={<SuperAdminRegistrationPage />} />
          <Route path="/signup" element={<SignupPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/admin/dashboard" element={
            <ProtectedRoute requiredRoles={['SuperAdmin']}>
              <SuperAdminDashboard />
            </ProtectedRoute>
          } />
          <Route path="/complaints" element={
            <ProtectedRoute>
              <ComplaintManagement />
            </ProtectedRoute>
          } />
          <Route path="/student/dashboard" element={
            <ProtectedRoute requiredRoles={['Student']}>
              <StudentDashboard />
            </ProtectedRoute>
          } />
          <Route path="/department/dashboard" element={
            <ProtectedRoute requiredRoles={['DepartmentUser']}>
              <DepartmentDashboard />
            </ProtectedRoute>
          } />
          <Route path="/workflows" element={
            <ProtectedRoute requiredRoles={['SuperAdmin']}>
              <WorkflowManagement />
            </ProtectedRoute>
          } />
          <Route path="/notifications" element={
            <ProtectedRoute>
              <NotificationsPage />
            </ProtectedRoute>
          } />
        </Routes>
      </Router>
    </AuthProvider>
  );
};

export default App;