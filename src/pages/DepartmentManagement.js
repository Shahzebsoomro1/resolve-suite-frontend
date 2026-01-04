import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  AlertCircle, 
  Search,
  Building2,
  Users as UsersIcon,
  SlidersHorizontal,
  Loader,
  ChevronDown,
  X
} from 'lucide-react';
import DepartmentForm from '../components/Department/DepartmentForm';
import DepartmentList from '../components/Department/DepartmentList';
import DepartmentEditModal from '../components/Department/DepartmentEditModal';
import DepartmentUsersModal from '../components/Department/DepartmentUserModal';
import {
  createDepartment,
  getAllDepartments,
  updateDepartment,
  deleteDepartment
} from '../services/api';

const DepartmentManagement = () => {
  const [state, setState] = useState({
    departments: [],
    filteredDepartments: [],
    isLoading: true,
    error: null,
    showAddForm: false,
    editDepartment: null,
    selectedDepartment: null,
    showConfirmDelete: false,
    deleteError: null,
    searchQuery: '',
    filterStatus: 'all'
  });

  useEffect(() => {
    loadDepartments();
  }, []);

  useEffect(() => {
    filterDepartments();
  }, [state.searchQuery, state.filterStatus, state.departments]);

  const loadDepartments = async () => {
    try {
      setState(prev => ({ ...prev, isLoading: true, error: null }));
      const data = await getAllDepartments();
      setState(prev => ({
        ...prev,
        departments: data,
        filteredDepartments: data,
        isLoading: false
      }));
    } catch (err) {
      setState(prev => ({
        ...prev,
        error: 'Failed to load departments. Please try again.',
        isLoading: false
      }));
    }
  };

  const filterDepartments = () => {
    let filtered = [...state.departments];

    // Apply search filter
    if (state.searchQuery) {
      filtered = filtered.filter(dept =>
        dept.name.toLowerCase().includes(state.searchQuery.toLowerCase()) ||
        dept.description.toLowerCase().includes(state.searchQuery.toLowerCase())
      );
    }

    // Apply status filter
    if (state.filterStatus !== 'all') {
      filtered = filtered.filter(dept => 
        state.filterStatus === 'active' ? dept.isActive : !dept.isActive
      );
    }

    setState(prev => ({ ...prev, filteredDepartments: filtered }));
  };

  const handleCreateDepartment = async (values, { resetForm, setSubmitting }) => {
    try {
      setState(prev => ({ ...prev, error: null }));
      await createDepartment(values);
      await loadDepartments();
      resetForm();
      setState(prev => ({ ...prev, showAddForm: false }));
    } catch (err) {
      setState(prev => ({
        ...prev,
        error: 'Failed to create department. Please try again.'
      }));
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdateDepartment = async (values, { setSubmitting }) => {
    try {
      setState(prev => ({ ...prev, error: null }));
      await updateDepartment(state.editDepartment._id, values);
      await loadDepartments();
      setState(prev => ({ ...prev, editDepartment: null }));
    } catch (err) {
      setState(prev => ({
        ...prev,
        error: 'Failed to update department'
      }));
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteDepartment = async (department) => {
    try {
      await deleteDepartment(department._id);
      await loadDepartments();
      setState(prev => ({
        ...prev,
        showConfirmDelete: false,
        selectedDepartment: null,
        deleteError: null
      }));
    } catch (err) {
      const errorMessage = err.response?.data?.msg || 'Failed to delete department';
      setState(prev => ({
        ...prev,
        deleteError: errorMessage
      }));
    }
  };

  const handleUserUpdate = async () => {
    await loadDepartments();
  };

  // Stats calculation
  const stats = {
    total: state.departments.length,
    active: state.departments.filter(d => d.isActive).length,
    inactive: state.departments.filter(d => !d.isActive).length,
    totalUsers: state.departments.reduce((acc, dept) => acc + (dept.userCount || 0), 0)
  };

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Department Management</h1>
          <p className="mt-1 text-sm text-gray-500">
            Manage departments and assign users across your organization
          </p>
        </div>

        <button
          onClick={() => setState(prev => ({ ...prev, showAddForm: true }))}
          className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-[#254E58] hover:bg-[#112D32] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#254E58]"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Department
        </button>
      </div>

      {/* Statistics Section */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatCard
          title="Total Departments"
          value={stats.total}
          icon={Building2}
          color="bg-blue-100 text-blue-600"
        />
        <StatCard
          title="Active Departments"
          value={stats.active}
          icon={Building2}
          color="bg-green-100 text-green-600"
        />
        <StatCard
          title="Inactive Departments"
          value={stats.inactive}
          icon={Building2}
          color="bg-red-100 text-red-600"
        />
        <StatCard
          title="Total Users"
          value={stats.totalUsers}
          icon={UsersIcon}
          color="bg-purple-100 text-purple-600"
        />
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search departments..."
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#254E58] focus:border-transparent"
            value={state.searchQuery}
            onChange={(e) => setState(prev => ({ ...prev, searchQuery: e.target.value }))}
          />
        </div>
        <select
          value={state.filterStatus}
          onChange={(e) => setState(prev => ({ ...prev, filterStatus: e.target.value }))}
          className="w-full md:w-48 pl-3 pr-10 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#254E58] focus:border-transparent"
        >
          <option value="all">All Status</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </select>
      </div>

      {/* Error Display */}
      {state.error && (
        <div className="rounded-md bg-red-50 p-4 flex items-center">
          <AlertCircle className="h-5 w-5 text-red-400 mr-2" />
          <span className="text-sm text-red-700">{state.error}</span>
        </div>
      )}

      {/* Department List */}
      <DepartmentList
        departments={state.filteredDepartments}
        onEdit={(dept) => setState(prev => ({ ...prev, editDepartment: dept }))}
        onDelete={(dept) => setState(prev => ({ 
          ...prev, 
          selectedDepartment: dept, 
          showConfirmDelete: true 
        }))}
        onViewUsers={(dept) => setState(prev => ({ ...prev, selectedDepartment: dept }))}
        isLoading={state.isLoading}
        error={state.error}
      />

      {/* Modals */}
      {/* Add/Edit Form Modal */}
      {(state.showAddForm || state.editDepartment) && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex min-h-screen items-center justify-center p-4">
            <div 
              className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" 
              onClick={() => setState(prev => ({ 
                ...prev, 
                showAddForm: false, 
                editDepartment: null 
              }))}
            />
            <div className="relative transform overflow-hidden rounded-lg bg-white shadow-xl w-full max-w-2xl">
              <div className="p-6">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-xl font-semibold text-gray-900">
                    {state.editDepartment ? 'Edit Department' : 'Create New Department'}
                  </h2>
                  <button
                    onClick={() => setState(prev => ({ 
                      ...prev, 
                      showAddForm: false, 
                      editDepartment: null 
                    }))}
                    className="text-gray-400 hover:text-gray-500"
                  >
                    <X className="h-6 w-6" />
                  </button>
                </div>
                <DepartmentForm
                  initialValues={state.editDepartment || {}}
                  onSubmit={state.editDepartment ? handleUpdateDepartment : handleCreateDepartment}
                  isEdit={!!state.editDepartment}
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {state.showConfirmDelete && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex min-h-screen items-center justify-center p-4">
            <div 
              className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" 
              onClick={() => setState(prev => ({ 
                ...prev, 
                showConfirmDelete: false,
                selectedDepartment: null,
                deleteError: null
              }))}
            />
            <div className="relative transform overflow-hidden rounded-lg bg-white shadow-xl w-full max-w-md">
              <div className="p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Delete Department</h3>
                <p className="text-sm text-gray-500 mb-4">
                  Are you sure you want to delete {state.selectedDepartment?.name}? This action cannot be undone.
                </p>
                {state.selectedDepartment?.userCount > 0 && (
                  <div className="mb-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg text-yellow-700 text-sm">
                    <AlertCircle className="inline-block mr-2 h-4 w-4" />
                    This department has {state.selectedDepartment.userCount} assigned users.
                    Please remove all users before deleting.
                  </div>
                )}
                {state.deleteError && (
                  <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                    <AlertCircle className="inline-block mr-2 h-4 w-4" />
                    {state.deleteError}
                  </div>
                )}
                <div className="flex justify-end gap-3">
                  <button
                    onClick={() => setState(prev => ({ 
                      ...prev, 
                      showConfirmDelete: false,
                      selectedDepartment: null,
                      deleteError: null
                    }))}
                    className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#254E58]"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => handleDeleteDepartment(state.selectedDepartment)}
                    disabled={state.selectedDepartment?.userCount > 0}
                    className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Users Modal */}
      <DepartmentUsersModal
        department={state.selectedDepartment}
        isOpen={!!state.selectedDepartment && !state.showConfirmDelete}
        onClose={() => setState(prev => ({ ...prev, selectedDepartment: null }))}
        onUserUpdate={handleUserUpdate}
      />
    </div>
  );
};

// Stat Card Component
const StatCard = ({ title, value, icon: Icon, color }) => (
  <div className="bg-white rounded-lg shadow p-6">
    <div className="flex items-center justify-between">
      <div>
        <p className="text-sm font-medium text-gray-500">{title}</p>
        <p className="mt-2 text-3xl font-semibold text-gray-900">{value}</p>
      </div>
      <div className={`p-3 rounded-full ${color}`}>
        <Icon className="h-6 w-6" />
      </div>
    </div>
  </div>
);

export default DepartmentManagement;