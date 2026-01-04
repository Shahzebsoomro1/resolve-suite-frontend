import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Clock, CheckCircle2, AlertTriangle, Filter, LogOut, X } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import {
  getComplaints,
  getAllDepartments,
  createComplaint,
  updateComplaintStatus,
  addCommentToComplaint as addCommentAPI,
  getComplaintById,
} from '../services/api';

// Import existing components
import ComplaintList from '../components/Complaint/ComplaintList';
import ComplaintDetail from '../components/Complaint/ComplaintDetail';
import ComplaintForm from '../components/Complaint/ComplaintForm';
import ComplaintFilters from '../components/Complaint/ComplaintFilters';
import NotificationCenter from '../components/common/NotificationCenter';
import NotificationSidebar from '../components/common/NotificationSidebar';

const StudentDashboard = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [complaints, setComplaints] = useState([]);
  const [selectedComplaint, setSelectedComplaint] = useState(null);
  const [showComplaintForm, setShowComplaintForm] = useState(false);
  const [departments, setDepartments] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshingComplaint, setIsRefreshingComplaint] = useState(false);
  const [error, setError] = useState(null);
  const [isNotificationSidebarOpen, setIsNotificationSidebarOpen] = useState(false);
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    resolved: 0,
    urgent: 0
  });
  const [filters, setFilters] = useState({
    status: '',
    priority: '',
    department: '',
    search: '',
    dateRange: ''
  });

  useEffect(() => {
    loadComplaints();
    loadDepartments();
  }, [filters]);

  const loadComplaints = async () => {
    try {
      setIsLoading(true);
      const data = await getComplaints(filters);
      setComplaints(data);
      
      // Calculate statistics
      const stats = {
        total: data.length,
        pending: data.filter(c => c.status === 'Open' || c.status === 'In Progress').length,
        resolved: data.filter(c => c.status === 'Resolved' || c.status === 'Closed').length,
        urgent: data.filter(c => c.priority === 'Urgent').length
      };
      setStats(stats);
      
      // If there's a selected complaint, refresh its data
      if (selectedComplaint) {
        const updatedComplaint = data.find(c => c._id === selectedComplaint._id);
        if (updatedComplaint) {
          setSelectedComplaint(updatedComplaint);
        }
      }
      
      setError(null);
    } catch (err) {
      setError('Failed to load complaints');
      console.error('Error loading complaints:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const loadDepartments = async () => {
    try {
      const data = await getAllDepartments();
      setDepartments(data);
    } catch (err) {
      console.error('Error loading departments:', err);
    }
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const handleCreateComplaint = async (complaintData) => {
    try {
      await createComplaint(complaintData);
      setShowComplaintForm(false);
      await loadComplaints();
    } catch (err) {
      setError('Failed to create complaint');
      console.error('Error creating complaint:', err);
    }
  };

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

  const handleAddComment = async (complaintId, commentData) => {
    try {
      setIsRefreshingComplaint(true);
      await addCommentAPI(complaintId, commentData);
      
      // Refresh the selected complaint with the new comment
      if (selectedComplaint && selectedComplaint._id === complaintId) {
        const updatedComplaint = await getComplaintById(complaintId);
        setSelectedComplaint(updatedComplaint);
      }
      
      // Also refresh the complaints list to update any UI elements
      await loadComplaints();
      setIsRefreshingComplaint(false);
      return true;
    } catch (err) {
      console.error('Error adding comment:', err);
      setIsRefreshingComplaint(false);
      throw err;
    }
  };

  const handleSelectComplaint = async (complaintId) => {
    try {
      setIsRefreshingComplaint(true);
      // Always fetch fresh data
      const complaintData = await getComplaintById(complaintId);
      setSelectedComplaint(complaintData);
      setIsRefreshingComplaint(false);
    } catch (err) {
      console.error('Error loading complaint details:', err);
      setError('Failed to load complaint details');
      setIsRefreshingComplaint(false);
    }
  };

  const StatCard = ({ title, value, icon: Icon, color }) => (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center">
        <div className={`p-3 rounded-full ${color} bg-opacity-10 mr-4`}>
          <Icon className={color} size={24} />
        </div>
        <div>
          <p className="text-gray-500 text-sm">{title}</p>
          <h3 className="text-2xl font-bold text-gray-900">{value}</h3>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <header className="bg-gradient-to-r from-[#254E58] to-[#112D32] shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <h1 className="text-2xl font-bold text-[#88BDBC]">
                Student Dashboard
              </h1>
            </div>
            <div className="flex items-center space-x-4">
              {/* Update NotificationCenter to include onOpenSidebar */}
              <NotificationCenter onOpenSidebar={() => setIsNotificationSidebarOpen(true)} />
              
              <span className="text-[#88BDBC]">
                {user?.firstName ? `${user.firstName} ${user.lastName}` : user?.email}
              </span>
              <button
                onClick={handleLogout}
                className="flex items-center px-4 py-2 bg-[#FFA62B] text-[#112D32] rounded-lg hover:bg-[#FF9500] transition-all duration-300 shadow-md hover:shadow-lg font-medium"
              >
                <LogOut className="mr-2" size={20} />
                Logout
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="flex-1 container mx-auto px-4 py-4">
        {/* Statistics Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
          <StatCard
            title="Total Complaints"
            value={stats.total}
            icon={Filter}
            color="text-blue-600"
          />
          <StatCard
            title="Pending"
            value={stats.pending}
            icon={Clock}
            color="text-yellow-600"
          />
          <StatCard
            title="Resolved"
            value={stats.resolved}
            icon={CheckCircle2}
            color="text-green-600"
          />
          <StatCard
            title="Urgent"
            value={stats.urgent}
            icon={AlertTriangle}
            color="text-red-600"
          />
        </div>

        {/* Actions and Filters */}
        <div className="bg-white rounded-lg shadow-sm p-4 mb-4">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold text-gray-900">My Complaints</h2>
            <button
              onClick={() => setShowComplaintForm(true)}
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-[#254E58] hover:bg-[#112D32] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#254E58]"
            >
              <Plus className="-ml-1 mr-2 h-5 w-5" />
              New Complaint
            </button>
          </div>
          <ComplaintFilters
            filters={filters}
            onFilterChange={handleFilterChange}
            departments={departments}
          />
        </div>

        {/* Error Display */}
        {error && (
          <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded relative">
            {error}
          </div>
        )}

        {/* Complaints Section */}
        <div className="flex flex-col lg:flex-row gap-4 h-[calc(100vh-24rem)]">
          <div className={`${selectedComplaint ? 'lg:w-2/5' : 'w-full'} transition-all duration-300 flex flex-col`}>
            <div className="bg-white rounded-lg shadow flex-1 flex flex-col">
              <div className="p-4 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-900">My Complaints</h2>
              </div>
              <div className="flex-1 overflow-auto">
                <ComplaintList
                  complaints={complaints}
                  isLoading={isLoading}
                  error={error}
                  onViewComplaint={handleSelectComplaint}
                  currentUser={user}
                  currentFilters={filters} 
                />
              </div>
            </div>
          </div>

          {selectedComplaint && (
            <div className="lg:w-3/5 transition-all duration-300 flex flex-col">
              <div className="bg-white rounded-lg shadow flex-1 flex flex-col">
                <div className="p-4 border-b border-gray-200 flex justify-between items-center">
                  <h2 className="text-lg font-semibold text-gray-900">Complaint Details</h2>
                  <button
                    onClick={() => setSelectedComplaint(null)}
                    className="text-gray-400 hover:text-gray-500"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>
                <div className="flex-1 overflow-auto">
                  <ComplaintDetail
                    complaint={selectedComplaint}
                    onUpdateStatus={null}
                    onAddComment={handleAddComment}
                    onEscalate={null}
                    currentUser={user}
                    key={selectedComplaint._id} // Add key to force re-render on complaint change
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* New Complaint Modal */}
        {showComplaintForm && (
          <div className="fixed inset-0 z-50 overflow-y-auto">
            <div className="flex min-h-screen items-end justify-center px-4 pt-4 pb-20 text-center sm:block sm:p-0">
              <div 
                className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" 
                onClick={() => setShowComplaintForm(false)}
              />
              <div className="inline-block transform overflow-hidden rounded-lg bg-white text-left align-bottom shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-lg sm:align-middle">
                <ComplaintForm
                  departments={departments}
                  onSubmit={handleCreateComplaint}
                  onCancel={() => setShowComplaintForm(false)}
                />
              </div>
            </div>
          </div>
        )}
      </main>

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

export default StudentDashboard;