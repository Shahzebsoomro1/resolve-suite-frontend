// components/common/AddUserModal.js
import React, { useCallback, useEffect } from 'react';
import PropTypes from 'prop-types';
import { X, UserPlus, Loader } from 'lucide-react';

const AddUserModal = ({ 
  isOpen, 
  onClose, 
  onSubmit,
  newUser,
  onInputChange,
  isSubmitting = false,
  error = null
}) => {
  const handleEscape = useCallback((event) => {
    if (event.key === 'Escape' && !isSubmitting) {
      onClose();
    }
  }, [onClose, isSubmitting]);

  useEffect(() => {
    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      return () => {
        document.removeEventListener('keydown', handleEscape);
      };
    }
  }, [isOpen, handleEscape]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!isSubmitting && newUser.email.trim()) {
      onSubmit(e);
    }
  };

  const handleClose = () => {
    if (!isSubmitting) {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-50 overflow-y-auto"
      aria-labelledby="modal-title"
      role="dialog"
      aria-modal="true"
    >
      {/* Responsive centered modal structure */}
      <div className="flex min-h-screen items-center justify-center p-4">
        <div 
          className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" 
          aria-hidden="true"
          onClick={handleClose}
        />

        {/* Modal Panel - Responsive */}
        <div className="relative transform overflow-hidden rounded-lg bg-white text-left shadow-xl transition-all w-full max-w-sm sm:max-w-md lg:max-w-lg">
          <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
            <div className="sm:flex sm:items-start">
              <div className="mx-auto flex h-10 w-10 sm:h-12 sm:w-12 flex-shrink-0 items-center justify-center rounded-full bg-blue-100 sm:mx-0">
                <UserPlus className="h-5 w-5 sm:h-6 sm:w-6 text-blue-600" aria-hidden="true" />
              </div>
              <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left w-full">
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-4">
                  <h3 
                    className="text-lg font-medium leading-6 text-gray-900 mb-2 sm:mb-0"
                    id="modal-title"
                  >
                    Add New User
                  </h3>
                  <button
                    onClick={handleClose}
                    disabled={isSubmitting}
                    className="self-end sm:self-auto text-gray-400 hover:text-gray-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed p-1"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>

                {/* Error Message */}
                {error && (
                  <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                    <p className="text-sm text-red-700">{error}</p>
                  </div>
                )}
                
                <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-5">
                  <div>
                    <label 
                      htmlFor="user-email" 
                      className="block text-sm font-medium text-gray-700 mb-1"
                    >
                      Email Address
                    </label>
                    <input
                      type="email"
                      id="user-email"
                      name="email"
                      value={newUser.email}
                      onChange={onInputChange}
                      disabled={isSubmitting}
                      className="w-full px-3 py-2 sm:py-2.5 border border-gray-300 rounded-md shadow-sm text-sm sm:text-base focus:outline-none focus:ring-[#254E58] focus:border-[#254E58] disabled:opacity-50 disabled:cursor-not-allowed"
                      placeholder="Enter user email address"
                      required
                      autoComplete="email"
                    />
                  </div>
                  
                  <div>
                    <label 
                      htmlFor="user-role" 
                      className="block text-sm font-medium text-gray-700 mb-1"
                    >
                      User Role
                    </label>
                    <select
                      id="user-role"
                      name="role"
                      value={newUser.role}
                      onChange={onInputChange}
                      disabled={isSubmitting}
                      className="w-full px-3 py-2 sm:py-2.5 border border-gray-300 rounded-md shadow-sm text-sm sm:text-base focus:outline-none focus:ring-[#254E58] focus:border-[#254E58] disabled:opacity-50 disabled:cursor-not-allowed"
                      required
                    >
                      <option value="Student">Student</option>
                      <option value="DepartmentUser">Department User</option>
                      <option value="Faculty">Faculty</option>
                    </select>
                  </div>
                </form>
              </div>
            </div>
          </div>
          
          <div className="bg-gray-50 px-4 py-3 sm:flex sm:flex-row-reverse sm:px-6">
            <button
              type="submit"
              onClick={handleSubmit}
              disabled={isSubmitting || !newUser.email.trim()}
              className="w-full sm:w-auto inline-flex justify-center rounded-md border border-transparent bg-[#254E58] px-4 py-2 text-sm sm:text-base font-medium text-white shadow-sm hover:bg-[#112D32] focus:outline-none focus:ring-2 focus:ring-[#254E58] focus:ring-offset-2 sm:ml-3 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                <>
                  <Loader className="animate-spin -ml-1 mr-2 h-4 w-4 sm:h-5 sm:w-5" />
                  <span className="text-sm sm:text-base">Adding User...</span>
                </>
              ) : (
                <span className="text-sm sm:text-base">Add User</span>
              )}
            </button>
            <button
              type="button"
              onClick={handleClose}
              disabled={isSubmitting}
              className="mt-3 sm:mt-0 w-full sm:w-auto inline-flex justify-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm sm:text-base font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-[#254E58] focus:ring-offset-2 sm:ml-3 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

AddUserModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  onSubmit: PropTypes.func.isRequired,
  newUser: PropTypes.shape({
    email: PropTypes.string.isRequired,
    role: PropTypes.string.isRequired
  }).isRequired,
  onInputChange: PropTypes.func.isRequired,
  isSubmitting: PropTypes.bool,
  error: PropTypes.string
};

export default AddUserModal;