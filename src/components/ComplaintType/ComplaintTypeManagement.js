import React, { useState, useEffect, useCallback } from 'react';
import { AlertCircle, Plus, Filter } from 'lucide-react';
import {
  createComplaintType,
  getComplaintTypes,
  updateComplaintType,
  deleteComplaintType,
  getAllDepartments
} from '../../services/api';

import ComplaintTypeForm from './ComplaintTypeForm';
import ComplaintTypeList from './ComplaintTypeList';
import DeleteConfirmationModal from '../common/DeleteConfirmationModal';
import LoadingSpinner from '../common/LoadingSpinner';

const ComplaintTypeManagement = () => {
  const [state, setState] = useState({
    complaintTypes: [],
    departments: [],
    isLoading: true,
    error: null,
    showForm: false,
    editingType: null,
    deleteConfirmOpen: false,
    typeToDelete: null,
    isDeleting: false
  });

  const loadData = useCallback(async () => {
    try {
      setState(prev => ({ ...prev, isLoading: true, error: null }));
      
      const [types, depts] = await Promise.all([
        getComplaintTypes(),
        getAllDepartments()
      ]);

      setState(prev => ({
        ...prev,
        complaintTypes: types,
        departments: depts,
        isLoading: false
      }));
    } catch (err) {
      console.error('Error loading data:', err);
      setState(prev => ({
        ...prev,
        error: 'Failed to load data. Please try again.',
        isLoading: false
      }));
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleSubmit = async (values, { setSubmitting }) => {
    try {
      setState(prev => ({ ...prev, error: null }));
      
      if (state.editingType) {
        await updateComplaintType(state.editingType._id, values);
      } else {
        await createComplaintType(values);
      }
      
      await loadData();
      handleCloseForm();
    } catch (err) {
      console.error('Error saving complaint type:', err);
      setState(prev => ({
        ...prev,
        error: `Failed to ${state.editingType ? 'update' : 'create'} complaint type.`
      }));
    } finally {
      setSubmitting(false);
    }
  };

  const handleCloseForm = () => {
    setState(prev => ({
      ...prev,
      showForm: false,
      editingType: null,
      error: null
    }));
  };

  const handleDelete = async () => {
    try {
      setState(prev => ({ ...prev, isDeleting: true, error: null }));
      await deleteComplaintType(state.typeToDelete._id);
      await loadData();
      setState(prev => ({
        ...prev,
        deleteConfirmOpen: false,
        typeToDelete: null,
        isDeleting: false
      }));
    } catch (err) {
      console.error('Error deleting complaint type:', err);
      setState(prev => ({
        ...prev,
        error: 'Failed to delete complaint type.',
        isDeleting: false
      }));
    }
  };

  if (state.isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <LoadingSpinner />
      </div>
    );
  }

  // Calculate statistics
  const stats = {
    total: state.complaintTypes.length,
    active: state.complaintTypes.filter(type => type.isActive).length,
    withDepartment: state.complaintTypes.filter(type => type.defaultDepartmentId).length
  };

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Complaint Types</h1>
          <p className="mt-1 text-sm text-gray-500">
            Manage and organize complaint categories
          </p>
        </div>

        <button
          onClick={() => setState(prev => ({ ...prev, showForm: true }))}
          className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-[#254E58] hover:bg-[#112D32] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#254E58]"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Complaint Type
        </button>
      </div>

      {/* Statistics Section */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Total Types</p>
              <p className="mt-1 text-2xl font-semibold text-gray-900">{stats.total}</p>
            </div>
            <div className="p-3 rounded-full bg-blue-100 text-blue-600">
              <Filter className="h-5 w-5" />
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Active Types</p>
              <p className="mt-1 text-2xl font-semibold text-gray-900">{stats.active}</p>
            </div>
            <div className="p-3 rounded-full bg-green-100 text-green-600">
              <Filter className="h-5 w-5" />
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">With Department</p>
              <p className="mt-1 text-2xl font-semibold text-gray-900">{stats.withDepartment}</p>
            </div>
            <div className="p-3 rounded-full bg-purple-100 text-purple-600">
              <Filter className="h-5 w-5" />
            </div>
          </div>
        </div>
      </div>

      {/* Error Display */}
      {state.error && (
        <div className="rounded-md bg-red-50 p-4 flex items-center border border-red-200">
          <AlertCircle className="h-5 w-5 text-red-400 mr-2" />
          <span className="text-sm text-red-700">{state.error}</span>
        </div>
      )}

      {/* Form Modal */}
      {state.showForm && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex min-h-screen items-center justify-center p-4">
            <div 
              className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" 
              onClick={handleCloseForm}
            />
            <div className="relative transform overflow-hidden rounded-lg bg-white shadow-xl w-full max-w-2xl">
              <div className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  {state.editingType ? 'Edit Complaint Type' : 'Create New Complaint Type'}
                </h3>
                <ComplaintTypeForm
                  onSubmit={handleSubmit}
                  onCancel={handleCloseForm}
                  initialValues={state.editingType}
                  departments={state.departments}
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* List Section */}
      <div className="bg-white shadow-sm border border-gray-200 rounded-lg">
        <ComplaintTypeList
          complaintTypes={state.complaintTypes}
          departments={state.departments}
          onEdit={(type) => setState(prev => ({
            ...prev,
            editingType: type,
            showForm: true
          }))}
          onDelete={(type) => setState(prev => ({
            ...prev,
            typeToDelete: type,
            deleteConfirmOpen: true
          }))}
        />
      </div>

      {/* Delete Confirmation Modal */}
      <DeleteConfirmationModal
        isOpen={state.deleteConfirmOpen}
        onClose={() => setState(prev => ({
          ...prev,
          deleteConfirmOpen: false,
          typeToDelete: null
        }))}
        onConfirm={handleDelete}
        title="Delete Complaint Type"
        itemName={state.typeToDelete?.name}
        isDeleting={state.isDeleting}
      />
    </div>
  );
};

export default ComplaintTypeManagement;