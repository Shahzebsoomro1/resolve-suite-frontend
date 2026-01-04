import React, { useState, useEffect } from 'react';
import { X, Loader, AlertCircle, Clock, ArrowRight } from 'lucide-react';
import workflowService from '../../services/workflowService';

const WorkflowStageUpdater = ({
  workflowData,
  complaint,
  onUpdate,
  onClose
}) => {
  const [selectedStageId, setSelectedStageId] = useState('');
  const [comment, setComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [transitions, setTransitions] = useState([]);
  const [statusChangeInfo, setStatusChangeInfo] = useState(null);

  // Load available transitions when component mounts
  useEffect(() => {
    if (workflowData) {
      const availableTransitions = workflowService.getAvailableTransitions(workflowData);
      setTransitions(availableTransitions);
      
      // Default to first transition if available
      if (availableTransitions.length > 0) {
        setSelectedStageId(availableTransitions[0].id);
        // Check if this transition causes a status change
        checkStatusChange(availableTransitions[0].id);
      }
    }
  }, [workflowData]);

  // Update status change info when selected stage changes
  const checkStatusChange = (stageId) => {
    if (!workflowData || !workflowData.workflow || !workflowData.currentStage) {
      setStatusChangeInfo(null);
      return;
    }
    
    const changeInfo = workflowService.getStatusChangeForStageTransition(
      workflowData.workflow,
      workflowData.currentStage.id,
      stageId
    );
    
    if (changeInfo) {
      // Update with current complaint status
      setStatusChangeInfo({
        ...changeInfo,
        fromStatus: complaint.status
      });
    } else {
      setStatusChangeInfo(null);
    }
  };

  const handleStageChange = (e) => {
    const stageId = e.target.value;
    setSelectedStageId(stageId);
    checkStatusChange(stageId);
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!selectedStageId) {
      setError('Please select a target stage');
      return;
    }
    
    if (!comment.trim()) {
      setError('Please provide a comment explaining the stage change');
      return;
    }
    
    try {
      setIsSubmitting(true);
      setError('');
      await onUpdate(selectedStageId, comment.trim());
      // Note: onClose should be called by the parent component
      // after successful update and refresh
    } catch (err) {
      setError(err.message || 'Failed to update workflow stage');
      setIsSubmitting(false);
    }
  };
  
  // If no transitions available, show info message
  if (transitions.length === 0) {
    return (
      <div className="fixed inset-0 z-50 overflow-y-auto">
        <div className="flex min-h-screen items-end justify-center px-4 pt-4 pb-20 text-center sm:block sm:p-0">
          <div 
            className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" 
            onClick={onClose}
          />
          <div className="inline-block transform overflow-hidden rounded-lg bg-white text-left align-bottom shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-lg sm:align-middle">
            <div className="bg-white px-4 pt-5 pb-4 sm:p-6">
              <div className="sm:flex sm:items-start">
                <div className="mx-auto flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-yellow-100 sm:mx-0 sm:h-10 sm:w-10">
                  <AlertCircle className="h-6 w-6 text-yellow-600" />
                </div>
                <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
                  <h3 className="text-lg font-medium leading-6 text-gray-900">
                    No Available Transitions
                  </h3>
                  <div className="mt-2">
                    <p className="text-sm text-gray-500">
                      There are no available transitions from the current workflow stage.
                      This could mean this is the final stage or the workflow is not configured
                      with valid transitions.
                    </p>
                  </div>
                </div>
              </div>
            </div>
            <div className="bg-gray-50 px-4 py-3 sm:flex sm:flex-row-reverse sm:px-6">
              <button
                type="button"
                onClick={onClose}
                className="mt-3 inline-flex w-full justify-center rounded-md border border-gray-300 bg-white px-4 py-2 text-base font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 sm:mt-0 sm:w-auto sm:text-sm"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }
  
  // Get the currently selected transition
  const selectedTransition = transitions.find(t => t.id === selectedStageId);
  
  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-screen items-end justify-center px-4 pt-4 pb-20 text-center sm:block sm:p-0">
        {/* Background overlay */}
        <div 
          className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" 
          onClick={onClose}
        />

        {/* Modal panel */}
        <div className="inline-block transform overflow-hidden rounded-lg bg-white text-left align-bottom shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-lg sm:align-middle">
          <form onSubmit={handleSubmit}>
            <div className="bg-white px-4 pt-5 pb-4 sm:p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium leading-6 text-gray-900 flex items-center">
                  <Clock className="mr-2" size={20} />
                  Update Workflow Stage
                </h3>
                <button
                  type="button"
                  onClick={onClose}
                  className="text-gray-400 hover:text-gray-500 transition-colors"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>

              {/* Current and Target Stage */}
              <div className="mb-6">
                <div className="flex items-center justify-center my-4">
                  <div className="bg-blue-100 text-blue-800 px-3 py-1 rounded-lg">
                    {workflowData.currentStage?.name || 'Current Stage'}
                  </div>
                  <ArrowRight className="mx-4 text-gray-400" />
                  <div className="relative w-56">
                    <select
                      value={selectedStageId}
                      onChange={handleStageChange}
                      className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                      required
                    >
                      {transitions.map((transition) => (
                        <option key={transition.id} value={transition.id}>
                          {transition.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                
                {/* Description of selected stage */}
                {selectedTransition && selectedTransition.description && (
                  <div className="mt-2 text-sm text-gray-500 bg-gray-50 p-3 rounded-lg">
                    {selectedTransition.description}
                  </div>
                )}
                
                {/* Status change notification */}
                {statusChangeInfo && (
                  <div className="mt-4 bg-yellow-50 border border-yellow-200 rounded-md p-3 text-sm">
                    <div className="font-medium text-yellow-800">Status Change Notice</div>
                    <p className="mt-1 text-yellow-700">
                      Moving to this stage will automatically change the complaint status from{' '}
                      <span className="font-medium">{statusChangeInfo.fromStatus}</span> to{' '}
                      <span className="font-medium">{statusChangeInfo.toStatus}</span>.
                    </p>
                    {statusChangeInfo.reason && (
                      <p className="mt-1 text-yellow-700">
                        Reason: {statusChangeInfo.reason}
                      </p>
                    )}
                  </div>
                )}
              </div>

              {/* Comment Section */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Stage Change Comment
                  <span className="text-red-500 ml-1">*</span>
                </label>
                <textarea
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  rows={4}
                  className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                  placeholder="Please explain why you're changing the workflow stage..."
                  required
                  maxLength={1000}
                />
                <p className="mt-1 text-sm text-gray-500 flex justify-between">
                  <span>{comment.length}/1000 characters</span>
                </p>
              </div>

              {/* Error Display */}
              {error && (
                <div className="mt-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-center">
                  <AlertCircle size={20} className="mr-2" />
                  {error}
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="bg-gray-50 px-4 py-3 sm:flex sm:flex-row-reverse sm:px-6">
              <button
                type="submit"
                disabled={isSubmitting || !comment.trim() || !selectedStageId}
                className="inline-flex w-full justify-center rounded-md border border-transparent bg-blue-600 px-4 py-2 text-base font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 sm:ml-3 sm:w-auto sm:text-sm disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? (
                  <>
                    <Loader className="animate-spin -ml-1 mr-2 h-5 w-5" />
                    Updating...
                  </>
                ) : (
                  'Update Stage'
                )}
              </button>
              <button
                type="button"
                onClick={onClose}
                disabled={isSubmitting}
                className="mt-3 inline-flex w-full justify-center rounded-md border border-gray-300 bg-white px-4 py-2 text-base font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default WorkflowStageUpdater;