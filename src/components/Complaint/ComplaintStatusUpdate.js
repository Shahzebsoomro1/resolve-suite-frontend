import React, { useState } from 'react';
import { X, Loader, AlertCircle, Clock, CheckCircle2, AlertTriangle } from 'lucide-react';

const ComplaintStatusUpdate = ({
  complaint,
  onUpdate,
  onClose,
  currentUser
}) => {
  // Define valid status transitions
  const getValidTransitions = (currentStatus, userRole) => {
    const transitions = {
      'DepartmentUser': {
        'Open': ['In Progress'],
        'In Progress': ['Resolved', 'Open'],
        'Resolved': ['Closed', 'In Progress'],
        'Closed': []
      },
      'SuperAdmin': {
        'Open': ['In Progress'],
        'In Progress': ['Resolved'],
        'Resolved': ['Closed', 'In Progress'],
        'Closed': []
      }
    };

    // Get appropriate transition map based on role
    const roleTransitions = userRole === 'DepartmentUser' 
      ? transitions.DepartmentUser 
      : transitions.SuperAdmin;

    // Return array of valid next statuses for current status
    return roleTransitions[currentStatus] || [];
  };

  // Get available status options based on current status
  const availableStatuses = getValidTransitions(complaint.status, currentUser?.role);
  
  // Initialize with first available transition if any exist
  const [status, setStatus] = useState(availableStatuses[0] || complaint.status);
  const [comment, setComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const getStatusColor = (statusValue) => {
    const colors = {
      'Open': 'bg-blue-100 text-blue-800',
      'In Progress': 'bg-yellow-100 text-yellow-800',
      'Resolved': 'bg-green-100 text-green-800',
      'Closed': 'bg-gray-100 text-gray-800'
    };
    return colors[statusValue] || 'bg-gray-100 text-gray-800';
  };

  const getStatusIcon = (statusValue) => {
    switch(statusValue) {
      case 'Resolved':
        return <CheckCircle2 className="mr-1" size={16} />;
      case 'In Progress':
        return <Clock className="mr-1" size={16} />;
      case 'Open':
        return <AlertTriangle className="mr-1" size={16} />;
      default:
        return <Clock className="mr-1" size={16} />;
    }
  };

  // If no valid transitions are available, show info modal
  if (availableStatuses.length === 0) {
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
                  <AlertTriangle className="h-6 w-6 text-yellow-600" />
                </div>
                <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
                  <h3 className="text-lg font-medium leading-6 text-gray-900">
                    Cannot Update Status
                  </h3>
                  <div className="mt-2">
                    <p className="text-sm text-gray-500">
                      No status updates are available for complaints in the {complaint.status} state.
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!comment.trim()) {
      setError('Please provide a comment explaining the status change');
      return;
    }

    try {
      setIsSubmitting(true);
      setError('');
      await onUpdate({
        status,
        comment: comment.trim()
      });
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to update status. Please try again.');
      setIsSubmitting(false);
    }
  };

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
                  Update Complaint Status
                </h3>
                <button
                  type="button"
                  onClick={onClose}
                  className="text-gray-400 hover:text-gray-500 transition-colors"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>

              {/* Current Status Display */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Current Status
                </label>
                <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(complaint.status)}`}>
                  {getStatusIcon(complaint.status)}
                  {complaint.status}
                </div>
              </div>

              {/* Status Selection */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  New Status
                </label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  className="w-full rounded-md border-gray-300 shadow-sm focus:border-[#254E58] focus:ring-[#254E58] sm:text-sm"
                  required
                >
                  {availableStatuses.map((statusOption) => (
                    <option key={statusOption} value={statusOption}>
                      {statusOption}
                    </option>
                  ))}
                </select>
              </div>

              {/* Comment Section */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Status Update Comment
                  <span className="text-red-500 ml-1">*</span>
                </label>
                <textarea
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  rows={4}
                  className="w-full rounded-md border-gray-300 shadow-sm focus:border-[#254E58] focus:ring-[#254E58] sm:text-sm"
                  placeholder="Please explain why you're changing the status..."
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
                disabled={isSubmitting || !comment.trim()}
                className="inline-flex w-full justify-center rounded-md border border-transparent bg-[#254E58] px-4 py-2 text-base font-medium text-white shadow-sm hover:bg-[#112D32] focus:outline-none focus:ring-2 focus:ring-[#254E58] focus:ring-offset-2 sm:ml-3 sm:w-auto sm:text-sm disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? (
                  <>
                    <Loader className="animate-spin -ml-1 mr-2 h-5 w-5" />
                    Updating...
                  </>
                ) : (
                  'Update Status'
                )}
              </button>
              <button
                type="button"
                onClick={onClose}
                disabled={isSubmitting}
                className="mt-3 inline-flex w-full justify-center rounded-md border border-gray-300 bg-white px-4 py-2 text-base font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-[#254E58] focus:ring-offset-2 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
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

export default ComplaintStatusUpdate;