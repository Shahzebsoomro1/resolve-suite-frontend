import React, { useState, useEffect, useCallback, useRef } from 'react';
import { format } from 'date-fns';
import {
  Clock,
  User,
  Building2,
  Calendar,
  CheckCircle2,
  ArrowUpCircle,
  X,
  AlertTriangle,
  FileText,
  Tag,
  Loader,
  ExternalLink,
  RefreshCw,
  MessageSquare
} from 'lucide-react';

import ComplaintComments from './ComplaintComments';
import ComplaintStatusUpdate from './ComplaintStatusUpdate';
import ComplaintEscalate from './ComplaintEscalate';
import WorkflowViewer from '../Workflow/WorkflowViewer';
import WorkflowStageUpdater from '../Workflow/WorkflowStageUpdater';
import FeedbackModal from '../Feedback/FeedbackModal';
import FeedbackDisplay from '../Feedback/FeedbackDisplay';
import { getComplaintById, submitFeedback, getFeedbackByComplaint, canProvideFeedback } from '../../services/api';
import workflowService from '../../services/workflowService';

const priorityConfig = {
  Low: { color: 'bg-blue-100 text-blue-800', icon: Clock },
  Medium: { color: 'bg-yellow-100 text-yellow-800', icon: Clock },
  High: { color: 'bg-orange-100 text-orange-800', icon: AlertTriangle },
  Urgent: { color: 'bg-red-100 text-red-800', icon: AlertTriangle }
};

const statusConfig = {
  Open: { color: 'bg-blue-100 text-blue-800', icon: Clock },
  'In Progress': { color: 'bg-yellow-100 text-yellow-800', icon: Clock },
  Resolved: { color: 'bg-green-100 text-green-800', icon: CheckCircle2 },
  Closed: { color: 'bg-gray-100 text-gray-800', icon: X },
  Escalated: { color: 'bg-red-100 text-red-800', icon: ArrowUpCircle }
};

const ComplaintDetail = ({
  complaint: initialComplaint,
  onUpdateStatus,
  onAddComment,
  onEscalate,
  onClose,
  currentUser,
  onComplaintUpdated,
  isRefreshing
}) => {
  // Refs for tracking data changes
  const previousComplaintIdRef = useRef(null);
  
  // State management
  const [complaint, setComplaint] = useState(initialComplaint);
  const [workflowData, setWorkflowData] = useState(null);
  const [feedback, setFeedback] = useState(null);
  const [canGiveFeedback, setCanGiveFeedback] = useState(false);
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [isSubmittingFeedback, setIsSubmittingFeedback] = useState(false);
  const [state, setState] = useState({
    showStatusModal: false,
    showEscalateModal: false,
    showWorkflowModal: false,
    isLoading: false,
    isRefreshing: false,
    error: null,
    commentRefreshKey: 0,
    activityLogKey: 0
  });
  const [activeTab, setActiveTab] = useState('details');
  
  // Add this function to load feedback data (moved before early return)
  const loadFeedbackData = useCallback(async () => {
    if (!complaint?._id) return;

    try {
      // Load existing feedback
      const feedbackData = await getFeedbackByComplaint(complaint._id);
      setFeedback(feedbackData);

      // Check if user can provide feedback (only if no feedback exists)
      if (!feedbackData) {
        const eligibility = await canProvideFeedback(complaint._id);
        setCanGiveFeedback(eligibility.canProvideFeedback);
      } else {
        setCanGiveFeedback(false);
      }
    } catch (error) {
      console.error('Error loading feedback data:', error);
      setFeedback(null);
      setCanGiveFeedback(false);
    }
  }, [complaint?._id]);

  // Add this to your existing useEffect that loads complaint data (moved before early return)
  useEffect(() => {
    if (complaint?._id) {
      loadFeedbackData();
    }
  }, [complaint?._id, loadFeedbackData]);
  
  // Initialize complaint when prop changes
  useEffect(() => {
    if (initialComplaint && initialComplaint._id) {
      // Critical: Check if we have a new complaint ID before updating state
      if (previousComplaintIdRef.current !== initialComplaint._id) {
        setComplaint(initialComplaint);
        // Reset workflow data when complaint changes
        setWorkflowData(initialComplaint.workflowData || null);
        // Update the previous complaint ID reference
        previousComplaintIdRef.current = initialComplaint._id;
        
        // Always refresh the complete data when a new complaint is selected
        refreshComplaintData(initialComplaint._id);
      } else if (JSON.stringify(initialComplaint) !== JSON.stringify(complaint)) {
        // If it's the same complaint but with updated data, update the state
        setComplaint(initialComplaint);
        
        // If workflow data was updated in the parent
        if (initialComplaint.workflowData && JSON.stringify(initialComplaint.workflowData) !== JSON.stringify(workflowData)) {
          setWorkflowData(initialComplaint.workflowData);
        }
      }
    }
  }, [initialComplaint]);
  
  // Fetch fresh complaint data when the ID changes
  useEffect(() => {
    if (initialComplaint && initialComplaint._id !== previousComplaintIdRef.current) {
      refreshComplaintData(initialComplaint._id);
    }
  }, [initialComplaint?._id]);

  // Load workflow data
  const loadWorkflowData = async (complaintId) => {
    try {
      setState(prev => ({ ...prev, isLoading: true }));
      const data = await workflowService.getWorkflowForComplaint(complaintId);
      setWorkflowData(data);
    } catch (error) {
      console.error('Failed to load workflow data:', error);
      // Don't set error state here to avoid UI disruption
    } finally {
      setState(prev => ({ ...prev, isLoading: false }));
    }
  };

  // Refresh complaint data
  const refreshComplaintData = useCallback(async (complaintId) => {
    if (!complaintId) return;
    
    try {
      setState(prev => ({ ...prev, isRefreshing: true, error: null }));
      const refreshedData = await getComplaintById(complaintId);
      
      // Update local state
      setComplaint(refreshedData);
      
      // If the parent needs to know about the update
      if (onComplaintUpdated) {
        onComplaintUpdated(refreshedData);
      }
      
      // Also refresh workflow data if not already present in refreshed data
      if (!refreshedData.workflowData) {
        await loadWorkflowData(complaintId);
      } else {
        setWorkflowData(refreshedData.workflowData);
      }
      
      // Update refresh keys to trigger child component refreshes
      setState(prev => ({ 
        ...prev, 
        isRefreshing: false,
        commentRefreshKey: prev.commentRefreshKey + 1,
        activityLogKey: prev.activityLogKey + 1
      }));
    } catch (err) {
      console.error('Failed to refresh complaint:', err);
      setState(prev => ({ 
        ...prev, 
        isRefreshing: false,
        error: 'Failed to refresh complaint data'
      }));
    }
  }, [onComplaintUpdated]);

  // Manual refresh handler
  const handleManualRefresh = () => {
    if (complaint?._id) {
      refreshComplaintData(complaint._id);
    }
  };

  // If complaint is missing, show placeholder
  if (!complaint) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader className="animate-spin mr-2" />
        <span>Loading complaint data...</span>
      </div>
    );
  }

  const formatDate = (date) => {
    if (!date) return 'Not set';
    try {
      return format(new Date(date), 'MMM d, yyyy h:mm a');
    } catch {
      return 'Invalid date';
    }
  };

  // Check user permissions
  const canUpdateStatus = ['SuperAdmin', 'DepartmentUser'].includes(currentUser?.role) &&
    complaint.status !== 'Closed';

  const canEscalate = ['SuperAdmin', 'DepartmentUser'].includes(currentUser?.role) &&
    complaint.status !== 'Closed' &&
    !complaint.escalatedAt;
    
  const canUpdateWorkflow = ['SuperAdmin', 'DepartmentUser'].includes(currentUser?.role) &&
    complaint.status !== 'Closed' &&
    workflowData && 
    workflowData.instance && 
    !workflowData.instance.isCompleted;

  // Handle status update
  const handleStatusUpdate = async (data) => {
    try {
      setState(prev => ({ ...prev, isLoading: true, error: null }));
      await onUpdateStatus(complaint._id, data);
      await refreshComplaintData(complaint._id);
      setState(prev => ({ ...prev, showStatusModal: false, isLoading: false }));
    } catch (err) {
      setState(prev => ({
        ...prev,
        error: err.message || 'Failed to update status',
        isLoading: false
      }));
    }
  };

  // Handle escalation
  const handleEscalate = async (data) => {
    try {
      setState(prev => ({ ...prev, isLoading: true, error: null }));
      await onEscalate(complaint._id, data);
      await refreshComplaintData(complaint._id);
      setState(prev => ({ ...prev, showEscalateModal: false, isLoading: false }));
    } catch (err) {
      setState(prev => ({
        ...prev,
        error: err.message || 'Failed to escalate complaint',
        isLoading: false
      }));
    }
  };

  // Handle workflow stage update
  const handleWorkflowStageUpdate = async (stageId, comment) => {
    try {
      setState(prev => ({ ...prev, isLoading: true, error: null }));
      await workflowService.updateWorkflowStage(complaint._id, stageId, comment);
      await refreshComplaintData(complaint._id);
      setState(prev => ({ ...prev, showWorkflowModal: false, isLoading: false }));
    } catch (err) {
      setState(prev => ({
        ...prev,
        error: err.message || 'Failed to update workflow stage',
        isLoading: false
      }));
    }
  };

  // Handle adding comments
  const handleAddComment = async (complaintId, comment) => {
    try {
      setState(prev => ({ ...prev, isLoading: true, error: null }));
      await onAddComment(complaintId, comment);
      
      // Increment the refresh key to trigger a refresh in the comments component
      setState(prev => ({ 
        ...prev, 
        commentRefreshKey: prev.commentRefreshKey + 1,
        isLoading: false
      }));
      
      // Refresh data to get updated comments
      await refreshComplaintData(complaintId);
    } catch (err) {
      setState(prev => ({
        ...prev,
        error: err.message || 'Failed to add comment',
        isLoading: false
      }));
    }
  };

  // Add this function to handle feedback submission
  const handleFeedbackSubmit = async (feedbackData) => {
    setIsSubmittingFeedback(true);
    try {
      await submitFeedback(feedbackData);
      await loadFeedbackData(); // Refresh feedback data
      setShowFeedbackModal(false);
      
      // Show success message or trigger notification
      if (onComplaintUpdated) {
        onComplaintUpdated();
      }
    } catch (error) {
      console.error('Error submitting feedback:', error);
      throw error;
    } finally {
      setIsSubmittingFeedback(false);
    }
  };

  // Render status badge
  const StatusBadge = ({ status }) => {
    const config = statusConfig[status] || statusConfig['Open'];
    const Icon = config.icon;
    
    return (
      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-sm font-medium ${config.color}`}>
        <Icon className="mr-1.5 h-4 w-4" />
        {status}
      </span>
    );
  };

  // Render priority badge
  const PriorityBadge = ({ priority }) => {
    const config = priorityConfig[priority] || priorityConfig['Medium'];
    const Icon = config.icon;
    
    return (
      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-sm font-medium ${config.color}`}>
        <Icon className="mr-1.5 h-4 w-4" />
        {priority} Priority
      </span>
    );
  };

  const MetadataItem = ({ icon: Icon, label, value }) => (
    <div className="flex items-center text-gray-500 space-x-2">
      <Icon className="h-5 w-5 text-gray-400" />
      <span className="text-sm">
        <span className="font-medium text-gray-900">{label}:</span> {value}
      </span>
    </div>
  );

  // Determine if this is an active complaint
  const isActiveComplaint = ['Open', 'In Progress'].includes(complaint.status);

  return (
    <div className="bg-white rounded-lg shadow-lg overflow-hidden flex flex-col h-full">
      {/* Header */}
      <div className="px-8 py-6 border-b border-gray-200 flex justify-between items-start">
        <div className="space-y-3">
          <h2 className="text-2xl font-bold text-gray-900 break-words pr-8">
            {complaint.title}
          </h2>
          <div className="flex flex-wrap gap-3">
            <StatusBadge status={complaint.status} />
            <PriorityBadge priority={complaint.priority} />
          </div>
        </div>
        <div className="flex items-center space-x-4">
          <button
            onClick={handleManualRefresh}
            className="text-gray-400 hover:text-gray-600 p-2 rounded-full hover:bg-gray-100 transition-colors"
            title="Refresh complaint data"
            disabled={state.isRefreshing || isRefreshing}
          >
            <RefreshCw className={`h-5 w-5 ${(state.isRefreshing || isRefreshing) ? 'animate-spin' : ''}`} />
          </button>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-500 transition-colors p-2"
          >
            <X className="h-6 w-6" />
          </button>
        </div>
      </div>

      {/* Complaint ID Display */}
      <div className="px-8 pt-3 text-sm text-gray-500">
        <span className="font-medium">Complaint ID:</span> {complaint._id}
      </div>

      {/* Error Display */}
      {state.error && (
        <div className="mx-8 mt-4 bg-red-50 border border-red-200 text-red-700 px-5 py-4 rounded-lg flex items-center">
          <AlertTriangle className="mr-3" size={22} />
          {state.error}
        </div>
      )}

      {/* Refreshing Indicator */}
      {(state.isRefreshing || isRefreshing) && (
        <div className="mx-8 mt-4 bg-blue-50 border border-blue-200 text-blue-700 px-5 py-4 rounded-lg flex items-center">
          <Loader className="animate-spin mr-3" size={22} />
          Refreshing complaint data...
        </div>
      )}

      {/* Tab Navigation */}
      <div className="px-8 mt-6 border-b border-gray-200">
        <nav className="flex space-x-10 -mb-px">
          <button
            onClick={() => setActiveTab('details')}
            className={`pb-4 font-medium text-base focus:outline-none ${
              activeTab === 'details'
                ? 'text-[#254E58] border-b-2 border-[#254E58]'
                : 'text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Details
          </button>
          {workflowData && (
            <button
              onClick={() => setActiveTab('workflow')}
              className={`pb-4 font-medium text-base flex items-center focus:outline-none ${
                activeTab === 'workflow'
                  ? 'text-[#254E58] border-b-2 border-[#254E58]'
                  : 'text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Workflow 
              {workflowData && (
                <span className="ml-2 bg-gray-100 text-gray-700 px-2.5 py-0.5 rounded-full text-xs">
                  {workflowData.instance?.status || 'Active'}
                </span>
              )}
            </button>
          )}
          <button
            onClick={() => setActiveTab('comments')}
            className={`pb-4 font-medium text-base flex items-center focus:outline-none ${
              activeTab === 'comments'
                ? 'text-[#254E58] border-b-2 border-[#254E58]'
                : 'text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Comments
            {complaint.logs && complaint.logs.length > 0 && (
              <span className="ml-2 bg-gray-100 text-gray-700 px-2.5 py-0.5 rounded-full text-xs">
                {complaint.logs.length-1}
              </span>
            )}
          </button>
          {complaint && ['Resolved', 'Closed'].includes(complaint.status) && (
            <button
              onClick={() => setActiveTab('feedback')}
              className={`pb-4 font-medium text-base flex items-center focus:outline-none ${
                activeTab === 'feedback'
                  ? 'text-[#254E58] border-b-2 border-[#254E58]'
                  : 'text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Feedback
              {feedback && (
                <span className="ml-2 bg-gray-100 text-gray-700 px-2.5 py-0.5 rounded-full text-xs">
                  Provided
                </span>
              )}
            </button>
          )}
        </nav>
      </div>

      {/* Main Content - Scrollable */}
      <div className="flex-1 overflow-y-auto">
        {/* Details Tab */}
        {activeTab === 'details' && (
          <div className="px-8 py-6 space-y-8">
            {/* Metadata Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pb-6 border-b border-gray-200">
              <MetadataItem
                icon={User}
                label="Submitted by"
                value={`${complaint.complainantId?.firstName || ''} ${complaint.complainantId?.lastName || ''}`.trim() || 'Unknown'}
              />
              <MetadataItem
                icon={Building2}
                label="Department"
                value={complaint.departmentId?.name || 'Unassigned'}
              />
              <MetadataItem
                icon={Tag}
                label="Type"
                value={complaint.complaintTypeId?.name || 'Unspecified'}
              />
              <MetadataItem
                icon={Calendar}
                label="Submitted"
                value={formatDate(complaint.createdAt)}
              />
              {complaint.assignedTo && (
                <MetadataItem
                  icon={User}
                  label="Assigned to"
                  value={`${complaint.assignedTo?.firstName || ''} ${complaint.assignedTo?.lastName || ''}`.trim() || 'Unassigned'}
                />
              )}
              {complaint.escalatedAt && (
                <MetadataItem
                  icon={ArrowUpCircle}
                  label="Escalated"
                  value={formatDate(complaint.escalatedAt)}
                />
              )}
              {complaint.resolvedAt && (
                <MetadataItem
                  icon={CheckCircle2}
                  label="Resolved"
                  value={formatDate(complaint.resolvedAt)}
                />
              )}
              {complaint.closedAt && (
                <MetadataItem
                  icon={X}
                  label="Closed"
                  value={formatDate(complaint.closedAt)}
                />
              )}
            </div>

            {/* Description */}
            <div className="space-y-4">
              <h3 className="text-xl font-medium text-gray-900">Description</h3>
              <div className="bg-gray-50 rounded-lg p-5 border border-gray-200">
                <p className="text-gray-700 whitespace-pre-wrap leading-relaxed">
                  {complaint.description}
                </p>
              </div>
            </div>

            {/* Attachments */}
            {complaint.attachments?.length > 0 && (
              <div className="space-y-4">
                <h3 className="text-xl font-medium text-gray-900">Attachments</h3>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  {complaint.attachments.map((attachment, index) => (
                    <div
                      key={index}
                      className="flex items-center p-4 bg-gray-50 border border-gray-200 rounded-lg group hover:bg-gray-100 transition-colors"
                    >
                      <FileText className="h-6 w-6 text-gray-500 mr-3 flex-shrink-0" />
                      <div className="flex flex-col flex-1 truncate">
                        <span className="text-gray-700 truncate font-medium">
                          {attachment.filename}
                        </span>
                        <span className="text-gray-500 text-xs">
                          {(attachment.fileSize / 1024).toFixed(2)} KB
                        </span>
                      </div>
                      {attachment.url && (
                        <a 
                          href={attachment.url} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-[#254E58] hover:text-[#112D32] bg-white p-2 rounded-full shadow-sm border border-gray-200"
                          title="Download attachment"
                        >
                          <ExternalLink className="h-5 w-5" />
                        </a>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Workflow Tab */}
        {activeTab === 'workflow' && workflowData && (
          <div className="px-8 py-6">
            <div className="mb-6 flex items-center justify-between">
              <h3 className="text-xl font-medium text-gray-900">Workflow Progress</h3>
              {canUpdateWorkflow && (
                <button
                  onClick={() => setState(prev => ({ ...prev, showWorkflowModal: true }))}
                  className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  <Clock className="mr-2 h-4 w-4 text-gray-500" />
                  Update Stage
                </button>
              )}
            </div>
            <div className="bg-gray-50 rounded-lg p-6 border border-gray-200">
              <WorkflowViewer 
                workflowData={workflowData} 
                complaint={complaint}
                isFullView={true}
              />
            </div>
          </div>
        )}

        {/* Comments Tab */}
        {activeTab === 'comments' && (
          <div className="px-8 py-6">
            <ComplaintComments
              complaint={complaint}
              currentUser={currentUser}
              onAddComment={handleAddComment}
              refreshTrigger={state.commentRefreshKey}
              initialComments={complaint.logs}
              isDisabled={state.isLoading}
            />
          </div>
        )}

        {/* Feedback Tab */}
        {activeTab === 'feedback' && (
          <div className="px-8 py-6">
            <div className="space-y-6">
              {/* Feedback Display */}
              <FeedbackDisplay 
                feedback={feedback} 
                showComplaintInfo={false}
              />
              
              {/* Feedback Action Button */}
              {canGiveFeedback && (
                <div className="text-center py-4">
                  <button
                    onClick={() => setShowFeedbackModal(true)}
                    className="px-6 py-2 bg-[#254E58] text-white rounded-lg hover:bg-[#1a3940] transition-colors flex items-center mx-auto"
                  >
                    <MessageSquare size={16} className="mr-2" />
                    Provide Feedback
                  </button>
                </div>
              )}
              
              {!canGiveFeedback && !feedback && (
                <div className="text-center py-4 text-gray-500">
                  <p>Feedback can only be provided once the complaint is resolved.</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Action Footer */}
      {(canUpdateStatus || canEscalate || canUpdateWorkflow) && isActiveComplaint && (
        <div className="px-8 py-5 bg-gray-50 border-t border-gray-200 flex justify-end space-x-4">
          {canUpdateWorkflow && (
            <button
              onClick={() => setState(prev => ({ ...prev, showWorkflowModal: true }))}
              disabled={state.isLoading}
              className="inline-flex items-center px-5 py-2.5 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 transition-colors"
            >
              {state.isLoading ? (
                <>
                  <Loader className="animate-spin -ml-1 mr-2 h-4 w-4" />
                  Processing...
                </>
              ) : (
                <>
                  <Clock className="mr-2 -ml-1 h-4 w-4" />
                  Update Workflow
                </>
              )}
            </button>
          )}
          
          {canUpdateStatus && (
            <button
              onClick={() => setState(prev => ({ ...prev, showStatusModal: true }))}
              disabled={state.isLoading}
              className="inline-flex items-center px-5 py-2.5 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-[#254E58] hover:bg-[#112D32] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#254E58] disabled:opacity-50 transition-colors"
            >
              {state.isLoading ? (
                <>
                  <Loader className="animate-spin -ml-1 mr-2 h-4 w-4" />
                  Updating...
                </>
              ) : (
                <>
                  <Clock className="mr-2 -ml-1 h-4 w-4" />
                  Update Status
                </>
              )}
            </button>
          )}

          {canEscalate && (
            <button
              onClick={() => setState(prev => ({ ...prev, showEscalateModal: true }))}
              disabled={state.isLoading}
              className="inline-flex items-center px-5 py-2.5 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50 transition-colors"
            >
              {state.isLoading ? (
                <>
                  <Loader className="animate-spin -ml-1 mr-2 h-4 w-4" />
                  Processing...
                </>
              ) : (
                <>
                  <ArrowUpCircle className="mr-2 -ml-1 h-4 w-4" />
                  Escalate
                </>
              )}
            </button>
          )}
        </div>
      )}

      {/* Modals */}
      {state.showStatusModal && (
        <ComplaintStatusUpdate
          complaint={complaint}
          onUpdate={handleStatusUpdate}
          onClose={() => setState(prev => ({ ...prev, showStatusModal: false }))}
          currentUser={currentUser}
        />
      )}

      {state.showEscalateModal && (
        <ComplaintEscalate
          complaint={complaint}
          onEscalate={handleEscalate}
          onClose={() => setState(prev => ({ ...prev, showEscalateModal: false }))}
        />
      )}
      
      {state.showWorkflowModal && workflowData && (
        <WorkflowStageUpdater
          workflowData={workflowData}
          complaint={complaint}
          onUpdate={handleWorkflowStageUpdate}
          onClose={() => setState(prev => ({ ...prev, showWorkflowModal: false }))}
        />
      )}

      <FeedbackModal
        complaint={complaint}
        isOpen={showFeedbackModal}
        onClose={() => setShowFeedbackModal(false)}
        onSubmit={handleFeedbackSubmit}
        isSubmitting={isSubmittingFeedback}
      />
    </div>
  );
};

export default ComplaintDetail;