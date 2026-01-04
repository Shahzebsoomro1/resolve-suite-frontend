import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Clock, 
  CheckCircle2, 
  AlertTriangle, 
  Filter, 
  LogOut,
  UserCog,
  BarChart3,
  Users,
  AlertCircle,
  MessageSquare,
  Star
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import {
  getComplaints,
  updateComplaintStatus,
  addCommentToComplaint,
  escalateComplaint,
  getDepartmentById,
  getDepartmentUsers,
  getComplaintById,
  getFeedbackStats,
  getFeedbackStatsByDepartment
} from '../services/api';

// Import existing components
import ComplaintList from '../components/Complaint/ComplaintList';
import ComplaintDetail from '../components/Complaint/ComplaintDetail';
import ComplaintFilters from '../components/Complaint/ComplaintFilters';
import NotificationCenter from '../components/common/NotificationCenter';
import NotificationSidebar from '../components/common/NotificationSidebar';
import FeedbackStats from '../components/Feedback/FeedbackStats';

const DepartmentDashboard = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  
  // State management
  const [complaints, setComplaints] = useState([]);
  const [selectedComplaint, setSelectedComplaint] = useState(null);
  const [departmentInfo, setDepartmentInfo] = useState(null);
  const [departmentUsers, setDepartmentUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshingComplaint, setIsRefreshingComplaint] = useState(false);
  const [error, setError] = useState(null);
  const [isNotificationSidebarOpen, setIsNotificationSidebarOpen] = useState(false);
  
  // Statistics state
  const [stats, setStats] = useState({
    total: 0,
    inProgress: 0,
    resolved: 0,
    urgent: 0,
    averageResolutionTime: 0,
    activeUsers: 0
  });

  // Add feedback stats state
  const [feedbackStats, setFeedbackStats] = useState({
    totalFeedback: 0,
    averageRating: 0,
    ratingDistribution: []
  });

  // Filters state
  const [filters, setFilters] = useState({
    status: '',
    priority: '',
    search: '',
    dateRange: ''
  });

  // Load initial data
  useEffect(() => {
    if (user?.departmentId) {
      loadDepartmentData();
      loadFeedbackStats();
    }
  }, [user]);

  useEffect(() => {
    loadComplaints();
  }, [filters, user]);

  // Data loading functions
  const loadDepartmentData = async () => {
    try {
      const [deptInfo, users] = await Promise.all([
        getDepartmentById(user.departmentId),
        getDepartmentUsers(user.departmentId)
      ]);
      
      setDepartmentInfo(deptInfo);
      setDepartmentUsers(users);
      
      // Update stats with user info
      setStats(prev => ({
        ...prev,
        activeUsers: users.filter(u => u.isActive).length
      }));
    } catch (err) {
      console.error('Error loading department data:', err);
      setError('Failed to load department information');
    }
  };

  const loadComplaints = async () => {
    try {
      setIsLoading(true);
      // Add department filter automatically
      const departmentFilters = { 
        ...filters, 
        department: user?.departmentId 
      };
      
      const data = await getComplaints(departmentFilters);
      setComplaints(data);
      
      // If there's a selected complaint, refresh its data
      if (selectedComplaint) {
        const updatedComplaint = data.find(c => c._id === selectedComplaint._id);
        if (updatedComplaint) {
          setSelectedComplaint(updatedComplaint);
        }
      }
      
      // Calculate statistics
      calculateStats(data, departmentUsers);
      setError(null);
    } catch (err) {
      setError('Failed to load complaints');
      console.error('Error loading complaints:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // Add feedback stats loading function
  const loadFeedbackStats = async () => {
    try {
      if (user?.departmentId) {
        const data = await getFeedbackStatsByDepartment(user.departmentId);
        setFeedbackStats(data);
      }
    } catch (err) {
      console.error('Error loading feedback stats:', err);
      // Don't show error for feedback stats, it's not critical
      setFeedbackStats({
        totalFeedback: 0,
        averageRating: 0,
        ratingDistribution: []
      });
    }
  };

  // Helper functions
  const calculateStats = (complaints, departmentUsers) => {
    const now = new Date();
    const resolvedComplaints = complaints.filter(c => c.resolvedAt);
    
    const averageTime = resolvedComplaints.length > 0 
      ? resolvedComplaints.reduce((sum, complaint) => {
          const created = new Date(complaint.createdAt);
          const resolved = new Date(complaint.resolvedAt);
          return sum + (resolved - created);
        }, 0) / resolvedComplaints.length / (1000 * 60 * 60 * 24) // Convert to days
      : 0;

    setStats({
      total: complaints.length,
      inProgress: complaints.filter(c => c.status === 'In Progress').length,
      resolved: complaints.filter(c => ['Resolved', 'Closed'].includes(c.status)).length,
      urgent: complaints.filter(c => c.priority === 'Urgent').length,
      averageResolutionTime: Math.round(averageTime),
      activeUsers: departmentUsers.filter(u => u.isActive).length
    });
  };

  // Handle selecting a complaint - fetch fresh data
  const handleSelectComplaint = async (complaintId) => {
    try {
      setIsRefreshingComplaint(true);
      // Always fetch fresh data
      const complaintData = await getComplaintById(complaintId);
      setSelectedComplaint(complaintData);
      
      // Refresh feedback stats when viewing resolved complaints
      if (['Resolved', 'Closed'].includes(complaintData.status)) {
        loadFeedbackStats();
      }
      
      setIsRefreshingComplaint(false);
    } catch (err) {
      console.error('Error loading complaint details:', err);
      setError('Failed to load complaint details');
      setIsRefreshingComplaint(false);
    }
  };

  // Event handlers
  const handleStatusUpdate = async (complaintId, statusData) => {
    try {
      setIsRefreshingComplaint(true);
      await updateComplaintStatus(complaintId, statusData);
      
      // Fetch the updated complaint
      if (selectedComplaint && selectedComplaint._id === complaintId) {
        const updatedComplaint = await getComplaintById(complaintId);
        setSelectedComplaint(updatedComplaint);
      }
      
      // Refresh the complaints list
      await loadComplaints();
      setIsRefreshingComplaint(false);
    } catch (err) {
      setError('Failed to update complaint status');
      console.error('Error updating status:', err);
      setIsRefreshingComplaint(false);
    }
  };

  const handleAddComment = async (complaintId, commentData) => {
    try {
      setIsRefreshingComplaint(true);
      await addCommentToComplaint(complaintId, commentData);
      
      // Refresh the selected complaint with the new comment
      if (selectedComplaint && selectedComplaint._id === complaintId) {
        const updatedComplaint = await getComplaintById(complaintId);
        setSelectedComplaint(updatedComplaint);
      }
      
      // Also refresh the complaints list
      await loadComplaints();
      setIsRefreshingComplaint(false);
      return true;
    } catch (err) {
      console.error('Error adding comment:', err);
      setIsRefreshingComplaint(false);
      throw err;
    }
  };

  const handleEscalate = async (complaintId, escalationData) => {
    try {
      setIsRefreshingComplaint(true);
      await escalateComplaint(complaintId, escalationData);
      
      // Refresh the selected complaint
      if (selectedComplaint && selectedComplaint._id === complaintId) {
        const updatedComplaint = await getComplaintById(complaintId);
        setSelectedComplaint(updatedComplaint);
      }
      
      // Refresh the complaints list
      await loadComplaints();
      setIsRefreshingComplaint(false);
    } catch (err) {
      setError('Failed to escalate complaint');
      console.error('Error escalating complaint:', err);
      setIsRefreshingComplaint(false);
    }
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({
      ...prev,
      [key]: value
    }));
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

  // Enhanced Stat Card Component
  const StatCard = ({ title, value, icon: Icon, color, subtitle, rating }) => (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center">
        <div className={`p-3 rounded-full ${color} bg-opacity-10 mr-4`}>
          <Icon className={color} size={24} />
        </div>
        <div className="flex-1">
          <p className="text-gray-500 text-sm">{title}</p>
          <h3 className="text-2xl font-bold text-gray-900">{value}</h3>
          {subtitle && (
            <p className="text-sm text-gray-500 mt-1">{subtitle}</p>
          )}
          {rating && (
            <div className="flex items-center mt-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <Star
                  key={star}
                  size={12}
                  className={`${
                    star <= Math.round(rating)
                      ? 'text-yellow-400 fill-current'
                      : 'text-gray-300'
                  }`}
                />
              ))}
              <span className="ml-1 text-xs text-gray-500">({rating}/5)</span>
            </div>
          )}
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
                {departmentInfo?.name || 'Department'} Dashboard
              </h1>
            </div>
            
            <div className="flex items-center space-x-4">
              {/* Update NotificationCenter to include onOpenSidebar */}
              <NotificationCenter onOpenSidebar={() => setIsNotificationSidebarOpen(true)} />
              
              <div className="text-[#88BDBC]">
                <span className="font-medium">{user?.firstName} {user?.lastName}</span>
                <span className="mx-2">|</span>
                <span className="text-sm opacity-75">{user?.email}</span>
              </div>
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
        {/* Enhanced Statistics Grid with Feedback */}
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-4">
          <StatCard
            title="Total Complaints"
            value={stats.total}
            icon={Filter}
            color="text-blue-600"
          />
          <StatCard
            title="In Progress"
            value={stats.inProgress}
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
          <StatCard
            title="Active Team Members"
            value={stats.activeUsers}
            icon={Users}
            color="text-indigo-600"
          />
          <StatCard
            title="Avg. Resolution Time"
            value={stats.averageResolutionTime}
            subtitle="days"
            icon={BarChart3}
            color="text-purple-600"
          />
        </div>

        {/* Additional Feedback Stats Row */}
        {feedbackStats.totalFeedback > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
            <StatCard
              title="Feedback Received"
              value={feedbackStats.totalFeedback}
              icon={MessageSquare}
              color="text-purple-600"
              subtitle="total responses"
            />
            <StatCard
              title="Average Rating"
              value={feedbackStats.averageRating}
              icon={Star}
              color="text-yellow-600"
              rating={feedbackStats.averageRating}
            />
            <StatCard
              title="Positive Reviews"
              value={feedbackStats.ratingDistribution?.filter(r => r.rating >= 4).reduce((sum, r) => sum + r.count, 0) || 0}
              icon={CheckCircle2}
              color="text-green-600"
              subtitle="4+ stars"
            />
          </div>
        )}

        {/* Enhanced Complaints Section */}
        <div className="flex flex-col lg:flex-row gap-4 h-[calc(100vh-24rem)]">
          <div className={`${selectedComplaint ? 'lg:w-2/5' : 'w-full'} transition-all duration-300 flex flex-col`}>
            <div className="bg-white rounded-lg shadow flex-1 flex flex-col">
              <div className="p-4 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-900">Department Complaints</h2>
                <div className="mt-2">
                  <ComplaintFilters
                    filters={filters}
                    onFilterChange={handleFilterChange}
                  />
                </div>
              </div>
              <div className="flex-1 overflow-auto">
                <ComplaintList
                  complaints={complaints}
                  isLoading={isLoading}
                  error={error}
                  onViewComplaint={handleSelectComplaint}
                  currentUser={user}
                />
              </div>
            </div>
          </div>

          {selectedComplaint && (
            <div className="lg:w-3/5 transition-all duration-300 flex flex-col">
              <div className="bg-white rounded-lg shadow flex-1 flex flex-col">
                <div className="p-4 border-b border-gray-200">
                  <h2 className="text-lg font-semibold text-gray-900">Complaint Details</h2>
                </div>
                <div className="flex-1 overflow-auto">
                  <ComplaintDetail
                    complaint={selectedComplaint}
                    onUpdateStatus={handleStatusUpdate}
                    onAddComment={handleAddComment}
                    onEscalate={handleEscalate}
                    currentUser={user}
                    onClose={() => setSelectedComplaint(null)}
                    key={selectedComplaint._id} // Add key to force re-render on complaint change
                  />
                </div>
              </div>
            </div>
          )}
        </div>
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

export default DepartmentDashboard;