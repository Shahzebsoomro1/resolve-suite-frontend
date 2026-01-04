import React, { useState } from 'react';
import { X, AlertTriangle, Loader } from 'lucide-react';

const ComplaintEscalate = ({ 
  complaint, 
  onEscalate, 
  onClose 
}) => {
  const [reason, setReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!reason.trim()) {
      setError('Please provide a reason for escalation');
      return;
    }

    try {
      setIsSubmitting(true);
      setError('');
      await onEscalate({
        reason: reason.trim()
      });
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to escalate complaint. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      'Open': 'bg-blue-100 text-blue-800',
      'In Progress': 'bg-yellow-100 text-yellow-800',
      'Resolved': 'bg-green-100 text-green-800',
      'Closed': 'bg-gray-100 text-gray-800',
      'Escalated': 'bg-red-100 text-red-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
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
              <div className="sm:flex sm:items-start">
                <div className="mx-auto flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-red-100 sm:mx-0 sm:h-10 sm:w-10">
                  <AlertTriangle className="h-6 w-6 text-red-600" />
                </div>
                <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left w-full">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-medium leading-6 text-gray-900">
                      Escalate Complaint
                    </h3>
                    <button
                      type="button"
                      onClick={onClose}
                      className="text-gray-400 hover:text-gray-500 transition-colors"
                    >
                      <X className="h-6 w-6" />
                    </button>
                  </div>

                  {/* Current Status */}
                  <div className="mt-4">
                    <div className="flex items-center space-x-2">
                      <span className="text-sm text-gray-500">Current Status:</span>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(complaint.status)}`}>
                        {complaint.status}
                      </span>
                    </div>
                  </div>

                  {/* Complaint Title */}
                  <div className="mt-2">
                    <p className="text-sm text-gray-500">
                      {complaint.title}
                    </p>
                  </div>

                  <div className="mt-4">
                    <p className="text-sm text-gray-500">
                      Please provide a detailed reason for escalating this complaint. This will notify higher management and increase the priority.
                    </p>
                  </div>

                  {/* Reason Input */}
                  <div className="mt-4">
                    <label 
                      htmlFor="escalation-reason" 
                      className="block text-sm font-medium text-gray-700"
                    >
                      Escalation Reason
                      <span className="text-red-500 ml-1">*</span>
                    </label>
                    <textarea
                      id="escalation-reason"
                      value={reason}
                      onChange={(e) => setReason(e.target.value)}
                      rows={4}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm 
                        focus:border-red-500 focus:ring-red-500 sm:text-sm"
                      placeholder="Explain why this complaint needs to be escalated..."
                      maxLength={1000}
                      required
                    />
                    <div className="mt-1 text-xs text-gray-500 flex justify-between">
                      <span>{reason.length}/1000 characters</span>
                      {error && (
                        <span className="text-red-500">{error}</span>
                      )}
                    </div>
                  </div>

                  {/* Warning Message */}
                  <div className="mt-4 bg-yellow-50 border border-yellow-200 rounded-md p-3">
                    <div className="flex">
                      <AlertTriangle className="h-5 w-5 text-yellow-400" />
                      <div className="ml-3">
                        <h3 className="text-sm font-medium text-yellow-800">
                          Important Note
                        </h3>
                        <div className="mt-1 text-sm text-yellow-700">
                          <p>
                            Escalating a complaint should only be done when:
                          </p>
                          <ul className="list-disc list-inside mt-1">
                            <li>Standard resolution attempts have failed</li>
                            <li>The issue requires immediate attention</li>
                            <li>The complaint involves serious concerns</li>
                          </ul>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="bg-gray-50 px-4 py-3 sm:flex sm:flex-row-reverse sm:px-6">
              <button
                type="submit"
                disabled={isSubmitting || !reason.trim()}
                className="inline-flex w-full justify-center rounded-md border border-transparent 
                  bg-red-600 px-4 py-2 text-base font-medium text-white shadow-sm 
                  hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 
                  focus:ring-offset-2 sm:ml-3 sm:w-auto sm:text-sm
                  disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? (
                  <>
                    <Loader className="animate-spin -ml-1 mr-2 h-5 w-5" />
                    Escalating...
                  </>
                ) : (
                  'Escalate Complaint'
                )}
              </button>
              <button
                type="button"
                onClick={onClose}
                disabled={isSubmitting}
                className="mt-3 inline-flex w-full justify-center rounded-md border 
                  border-gray-300 bg-white px-4 py-2 text-base font-medium text-gray-700 
                  shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 
                  focus:ring-indigo-500 focus:ring-offset-2 sm:mt-0 sm:ml-3 
                  sm:w-auto sm:text-sm"
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

export default ComplaintEscalate;