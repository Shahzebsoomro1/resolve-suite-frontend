import React, { useState, useEffect, useCallback } from 'react';
import { 
  Clock, 
  CheckCircle2, 
  AlertTriangle, 
  Filter,
  X,
  RefreshCw,
  Loader
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import {
  getComplaints,
  getAllDepartments,
  updateComplaintStatus,
  addCommentToComplaint,
  escalateComplaint,
  getComplaintTypes,
  getComplaintById
} from '../services/api';
import workflowService from '../services/workflowService';

// Import components
import ComplaintList from '../components/Complaint/ComplaintList';
import ComplaintDetail from '../components/Complaint/ComplaintDetail';
import ComplaintFilters from '../components/Complaint/ComplaintFilters';

const ComplaintManagement = () => {
  const { user } = useAuth();
  
  // Core state management
  const [complaints, setComplaints] = useState([]);
  const [selectedComplaint, setSelectedComplaint] = useState(null);
  const [departments, setDepartments] = useState([]);
  const [complaintTypes, setComplaintTypes] = useState([]);
  
  // UI state management
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState(null);
  
  // Filters state
  const [filters, setFilters] = useState({
    status: '',
    priority: '',
    department: '',
    search: '',
    dateRange: ''
  });
  
  // Analytics state
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    resolved: 0,
    urgent: 0
  });

  // Load initial data
  useEffect(() => {
    Promise.all([
      loadComplaints(),
      loadDepartments(),
      loadComplaintTypes()
    ]).catch(err => {
      console.error('Error loading initial data:', err);
      setError('Failed to load required data. Please try again.');
    });
  }, []);

  // Reload complaints when filters change
  useEffect(() => {
    loadComplaints();
  }, [filters]);

  // Load complaints with applied filters
  const loadComplaints = async () => {
    try {
      setIsLoading(true);
      const data = await getComplaints(filters);
      setComplaints(data);
      
      // Calculate statistics
      updateStats(data);
      setError(null);
    } catch (err) {
      console.error('Error loading complaints:', err);
      setError('Failed to load complaints. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Load departments for filtering and assignments
  const loadDepartments = async () => {                 
    try {
      const data = await getAllDepartments();
      setDepartments(data);
    } catch (err) {
      console.error('Error loading departments:', err);
      // Don't set error to avoid UI disruption
    }
  };
  
  // Load complaint types for filtering and form
  const loadComplaintTypes = async () => {
    try {
      const data = await getComplaintTypes();
      setComplaintTypes(data);
    } catch (err) {
      console.error('Error loading complaint types:', err);
      // Don't set error to avoid UI disruption
    }
  };

  // Calculate and update statistics based on complaints
  const updateStats = (complaintsData) => {
    const stats = {
      total: complaintsData.length,
      pending: complaintsData.filter(c => c.status === 'Open' || c.status === 'In Progress').length,
      resolved: complaintsData.filter(c => c.status === 'Resolved' || c.status === 'Closed').length,
      urgent: complaintsData.filter(c => c.priority === 'Urgent').length
    };
    setStats(stats);
  };

  // Handle form filter changes
  const handleFilterChange = (key, value) => {
    setFilters(prev => ({
      ...prev,
      [key]: value
    }));
  };

  // Handle complaint status update
  const handleStatusUpdate = async (complaintId, statusData) => {
    try {
      setIsRefreshing(true);
      await updateComplaintStatus(complaintId, statusData);
      const updatedComplaint = await refreshComplaintData(complaintId);
      await loadComplaints(); // Reload all complaints for updated stats
      setIsRefreshing(false);
      return updatedComplaint;
    } catch (err) {
      console.error('Error updating status:', err);
      setIsRefreshing(false);
      throw err; // Propagate to calling component for display
    }
  };

  // Handle comment addition
  const handleAddComment = async (complaintId, commentData) => {
    try {
      setIsRefreshing(true);
      const result = await addCommentToComplaint(complaintId, commentData);
      
      // If the selected complaint is the one being commented on, refresh it
      if (selectedComplaint && selectedComplaint._id === complaintId) {
        await refreshComplaintData(complaintId);
      }
      
      setIsRefreshing(false);
      return result;
    } catch (err) {
      console.error('Error adding comment:', err);
      setIsRefreshing(false);
      throw err;
    }
  };

  // Handle complaint escalation
  const handleEscalate = async (complaintId, escalationData) => {
    try {
      setIsRefreshing(true);
      await escalateComplaint(complaintId, escalationData);
      const updatedComplaint = await refreshComplaintData(complaintId);
      await loadComplaints(); // Reload all complaints for updated stats
      setIsRefreshing(false);
      return updatedComplaint;
    } catch (err) {
      console.error('Error escalating complaint:', err);
      setIsRefreshing(false);
      throw err;
    }
  };

  // Refresh a specific complaint's data - always fetch from server
  const refreshComplaintData = async (complaintId) => {
    if (!complaintId) return;
    
    setIsRefreshing(true);
    try {
      // Get the updated complaint with a direct API call to ensure fresh data
      const updatedComplaint = await getComplaintById(complaintId);
      
      if (updatedComplaint) {
        // Try to get workflow data if it exists
        try {
          const workflowData = await workflowService.getWorkflowForComplaint(complaintId);
          if (workflowData) {
            updatedComplaint.workflowData = workflowData;
          }
        } catch (workflowError) {
          console.error('Error loading workflow data:', workflowError);
          // Continue without workflow data
        }
        
        // Update the selected complaint if it's the one we're refreshing
        if (selectedComplaint && selectedComplaint._id === complaintId) {
          // Important: Completely replace the selected complaint with the fresh data
          setSelectedComplaint({...updatedComplaint});
        }
        
        // Also update the complaint in the main list
        setComplaints(prev => 
          prev.map(c => c._id === complaintId ? {...updatedComplaint} : c)
        );
        
        return updatedComplaint;
      }
      return null;
    } catch (err) {
      console.error('Error refreshing complaint data:', err);
      // Don't set error state to avoid disrupting UI
      return null;
    } finally {
      setIsRefreshing(false);
    }
  };

  // Handle complaint selection - always fetch fresh data from the server
  const handleSelectComplaint = async (complaintId) => {
    try {
      setIsRefreshing(true);
      
      // Always fetch fresh data from the server when selecting a complaint
      const complaintData = await getComplaintById(complaintId);
      
      if (complaintData) {
        // Try to load workflow data
        try {
          const workflowData = await workflowService.getWorkflowForComplaint(complaintId);
          if (workflowData) {
            complaintData.workflowData = workflowData;
          }
        } catch (workflowError) {
          console.error('Error loading workflow data:', workflowError);
          // Continue without workflow data
        }
        
        // Set the selected complaint with fresh data
        setSelectedComplaint({...complaintData});
        
        // Also update this complaint in the list if it exists there
        setComplaints(prev => 
          prev.map(c => c._id === complaintId ? {...complaintData} : c)
        );
      }
    } catch (err) {
      console.error('Error selecting complaint:', err);
      setError('Failed to load complaint details');
    } finally {
      setIsRefreshing(false);
    }
  };

  // Handle manual refresh - trigger a full data reload
  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      // Reload all complaints
      await loadComplaints();
      
      // If a complaint is selected, fetch its latest data directly from the server
      if (selectedComplaint) {
        const complaintId = selectedComplaint._id;
        await refreshComplaintData(complaintId);
      }
    } catch (err) {
      console.error('Error refreshing data:', err);
      setError('Failed to refresh data');
    } finally {
      setIsRefreshing(false);
    }
  };
  
  // Handle complaint update (used by child components)
  const handleComplaintUpdated = (updatedComplaint) => {
    // Update the complaint in the list
    setComplaints(prev => 
      prev.map(c => c._id === updatedComplaint._id ? updatedComplaint : c)
    );
    
    // Update stats based on the updated list
    updateStats([
      ...complaints.filter(c => c._id !== updatedComplaint._id),
      updatedComplaint
    ]);
  };

  // StatCard component for statistics display
  const StatCard = ({ title, value, icon: Icon, color }) => (
    <div className="bg-white rounded-lg shadow p-4 border border-gray-100">
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
    <div className="space-y-6">
      {/* Header Section */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Complaints</h1>
        <p className="mt-1 text-sm text-gray-500">
          Track and manage all complaints across the system
        </p>
      </div>

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
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-4">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-medium text-gray-900 flex items-center">
            Complaint Management
            {isRefreshing && (
              <Loader className="ml-2 h-4 w-4 animate-spin text-gray-500" />
            )}
          </h2>

        </div>
        <ComplaintFilters
          filters={filters}
          onFilterChange={handleFilterChange}
          departments={departments}
        />
      </div>

      {/* Error Display */}
      {error && (
        <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-center">
          <AlertTriangle className="mr-2" size={20} />
          {error}
          <button
            onClick={() => setError(null)}
            className="ml-auto text-red-700 hover:text-red-900"
          >
            <X size={20} />
          </button>
        </div>
      )}

      {/* Complaints Section - Modified layout for a more spacious complaint detail */}
      <div className="flex flex-col lg:flex-row gap-6 h-[calc(100vh-22rem)]">
        {/* Complaint List - Reduced width when complaint is selected */}
        <div className={`${selectedComplaint ? 'lg:w-1/3' : 'w-full'} transition-all duration-300 flex flex-col`}>
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 flex-1 flex flex-col">
            <div className="p-4 border-b border-gray-200">
              <h2 className="text-lg font-medium text-gray-900">All Complaints</h2>
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

        {/* Complaint Detail - Increased width for more space */}
        {selectedComplaint && (
          <div className="lg:w-2/3 transition-all duration-300 flex flex-col">
            <ComplaintDetail
              complaint={selectedComplaint}
              onUpdateStatus={handleStatusUpdate}
              onAddComment={handleAddComment}
              onEscalate={handleEscalate}
              onClose={() => setSelectedComplaint(null)}
              currentUser={user}
              onComplaintUpdated={handleComplaintUpdated}
              key={selectedComplaint._id} /* CRITICAL: Add a key based on the complaint ID */
              isRefreshing={isRefreshing}
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default ComplaintManagement;