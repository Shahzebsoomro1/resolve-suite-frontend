import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  LogOut,
  MessageSquare,
  ChevronDown,
  Menu as MenuIcon,
  X,
  Users,
  Building2,
  FolderGit,
  ChevronRight,
  Workflow
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

import ComplaintTypeManagement from '../components/ComplaintType/ComplaintTypeManagement';
import UserManagement from '../components/common/UserManagement';
import DepartmentManagement from './DepartmentManagement';
import ComplaintPage from './ComplaintManagement';
import WorkflowManagement from './WorkflowManagement';
import NotificationCenter from '../components/common/NotificationCenter';
import NotificationSidebar from '../components/common/NotificationSidebar';
import FeedbackStats from '../components/Feedback/FeedbackStats';
import Sidebar from '../components/Layout/Sidebar';

const SuperAdminDashboard = () => {
  const [activeTab, setActiveTab] = useState('users');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isNotificationSidebarOpen, setIsNotificationSidebarOpen] = useState(false);
  const navigate = useNavigate();
  const { user, logout } = useAuth(); // Added logout from useAuth hook

  // Get user initials for avatar
  const getInitials = () => {
    if (user?.firstName && user?.lastName) {
      return `${user.firstName[0]}${user.lastName[0]}`.toUpperCase();
    }
    return 'SA';
  };

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (!event.target.closest('.profile-dropdown')) {
        setIsProfileDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (err) {
      console.error('Failed to logout:', err);
      // Force navigate even if logout API fails
      navigate('/login');
    }
  };

  const tabs = [
    {
      id: 'users',
      name: 'User Management',
      icon: Users,
      description: 'Manage users and permissions',
      count: 0
    },
    {
      id: 'departments',
      name: 'Departments',
      icon: Building2,
      description: 'Manage organizational departments',
      count: 0
    },
    {
      id: 'complaintTypes',
      name: 'Complaint Types',
      icon: FolderGit,
      description: 'Manage complaint categories and types',
      count: 0
    },
    {
      id: 'complaints',
      name: 'Complaints',
      icon: MessageSquare,
      description: 'Manage and track complaints'
    },
    {
      id: 'workflows',
      name: 'Workflows',
      icon: Workflow,
      description: 'Configure complaint resolution workflows',
      count: 0
    },
    {
      id: 'feedback',
      name: 'Feedback',
      icon: MessageSquare, // or you can use Star from lucide-react
      description: 'View customer feedback and analytics',
      count: 0
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <Sidebar
        navigationItems={tabs}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        isSidebarCollapsed={isSidebarCollapsed}
        onToggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
        isMobileMenuOpen={isMobileMenuOpen}
        onMobileMenuToggle={setIsMobileMenuOpen}
        brandName="ResolveSuite"
        showSettings={true}
      />

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <header className="bg-white shadow-lg sticky top-0 z-40">
          <div className="flex items-center justify-between h-16 px-4">
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="md:hidden text-gray-600 hover:text-gray-900 transition-colors"
            >
              {isMobileMenuOpen ? (
                <X className="h-6 w-6" />
              ) : (
                <MenuIcon className="h-6 w-6" />
              )}
            </button>

            {/* Breadcrumb */}
            <div className="hidden md:flex items-center space-x-2 text-sm text-gray-600">
              <span>Dashboard</span>
              <ChevronRight className="h-4 w-4" />
              <span className="font-medium text-gray-900">
                {tabs.find(t => t.id === activeTab)?.name}
              </span>
            </div>

            {/* Right Section */}
            <div className="flex items-center space-x-4">
              {/* Update NotificationCenter to include onOpenSidebar */}
              <NotificationCenter onOpenSidebar={() => setIsNotificationSidebarOpen(true)} />

              <div className="relative profile-dropdown">
                <button
                  onClick={() => setIsProfileDropdownOpen(!isProfileDropdownOpen)}
                  className="flex items-center space-x-3 text-gray-700 hover:text-gray-900 focus:outline-none transition-colors"
                >
                  <div className="w-8 h-8 rounded-full bg-[#254E58] text-[#88BDBC] flex items-center justify-center font-medium">
                    {getInitials()}
                  </div>
                  <span className="hidden md:block font-medium">
                    {user?.firstName ? `${user.firstName} ${user.lastName}` : 'Super Admin'}
                  </span>
                  <ChevronDown className={`h-4 w-4 transform transition-transform duration-200 ${isProfileDropdownOpen ? 'rotate-180' : ''}`} />
                </button>

                {/* Dropdown Menu */}
                {isProfileDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-48 rounded-lg shadow-lg bg-white ring-1 ring-black ring-opacity-5 py-1 focus:outline-none">
                    <div className="px-4 py-2 border-b border-gray-100">
                      <p className="text-sm font-medium text-gray-900">
                        {user?.firstName ? `${user.firstName} ${user.lastName}` : 'Super Admin'}
                      </p>
                      <p className="text-sm text-gray-500 truncate">
                        {user?.email || 'admin@resolvesuite.com'}
                      </p>
                    </div>
                    <button
                      onClick={handleLogout}
                      className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center transition-colors"
                    >
                      <LogOut className="mr-2 h-4 w-4" />
                      Sign out
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </header>

        {/* Main Content Area */}
        <main className="flex-1 p-6 overflow-x-hidden min-h-[calc(100vh-10rem)]">
          {activeTab === 'users' && <UserManagement />}
          {activeTab === 'departments' && <DepartmentManagement />}
          {activeTab === 'complaints' && <ComplaintPage />}
          {activeTab === 'complaintTypes' && <ComplaintTypeManagement />}
          {activeTab === 'workflows' && <WorkflowManagement />}
          {activeTab === 'feedback' && <FeedbackStats />}
        </main>
      </div>

      {/* Mobile Overlay */}
      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 md:hidden z-40 transition-opacity duration-300"
          onClick={() => setIsMobileMenuOpen(false)}
        ></div>
      )}

      {/* Notification Sidebar */}
      <NotificationSidebar
        isOpen={isNotificationSidebarOpen}
        onClose={() => setIsNotificationSidebarOpen(false)}
      />

      {/* Overlay for notification sidebar on mobile */}
      {isNotificationSidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 md:bg-opacity-25 z-40 transition-opacity duration-300"
          onClick={() => setIsNotificationSidebarOpen(false)}
        ></div>
      )}
    </div>
  );
};

export default SuperAdminDashboard;