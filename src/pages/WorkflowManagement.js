// pages/WorkflowManagement.js
import React, { useState, useEffect, useCallback } from 'react';
import { 
  Plus, 
  AlertCircle, 
  Filter as FilterIcon, 
  Search,
  Loader,
  PenSquare,
  Trash2,
  Building2,
  Tag,
  MoreHorizontal,
  Check,
  Workflow as WorkflowIcon,
  X,
  Book
} from 'lucide-react';

import { 
  getWorkflows, 
  createWorkflow, 
  updateWorkflow, 
  deleteWorkflow,
  getAllDepartments,
  getComplaintTypes
} from '../services/api';

import WorkflowBuilder from '../components/Workflow/WorkflowBuilder';
import DeleteConfirmationModal from '../components/common/DeleteConfirmationModal';

const WorkflowManagement = () => {
  const [state, setState] = useState({
    workflows: [],
    filteredWorkflows: [],
    departments: [],
    complaintTypes: [],
    isLoading: true,
    error: null,
    showWorkflowBuilder: false,
    editingWorkflow: null,
    deleteConfirmOpen: false,
    workflowToDelete: null,
    isDeleting: false,
    searchQuery: '',
    filterDepartment: '',
    filterType: '',
    filterActive: 'all',
    fromTemplate: false
  });

  // Fetch data on component mount
  useEffect(() => {
    loadData();
  }, []);

  // Apply filters when filtering criteria change
  useEffect(() => {
    filterWorkflows();
  }, [
    state.searchQuery, 
    state.filterDepartment, 
    state.filterType, 
    state.filterActive, 
    state.workflows
  ]);

  // Load all required data
  const loadData = async () => {
    try {
      setState(prev => ({ ...prev, isLoading: true, error: null }));
      
      const [workflows, departments, complaintTypes] = await Promise.all([
        getWorkflows(),
        getAllDepartments(),
        getComplaintTypes()
      ]);

      setState(prev => ({
        ...prev,
        workflows,
        filteredWorkflows: workflows,
        departments,
        complaintTypes,
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
  };

  // Filter workflows based on current filter criteria
  const filterWorkflows = useCallback(() => {
    let filtered = [...state.workflows];

    // Apply search filter
    if (state.searchQuery) {
      const query = state.searchQuery.toLowerCase();
      filtered = filtered.filter(workflow => 
        workflow.name.toLowerCase().includes(query) || 
        workflow.description?.toLowerCase().includes(query)
      );
    }

    // Apply department filter
    if (state.filterDepartment) {
      filtered = filtered.filter(workflow => 
        workflow.departmentId?._id === state.filterDepartment || 
        workflow.departmentId === state.filterDepartment
      );
    }

    // Apply complaint type filter
    if (state.filterType) {
      filtered = filtered.filter(workflow => 
        workflow.complaintTypeId?._id === state.filterType || 
        workflow.complaintTypeId === state.filterType
      );
    }

    // Apply active/inactive filter
    if (state.filterActive !== 'all') {
      const isActive = state.filterActive === 'active';
      filtered = filtered.filter(workflow => workflow.isActive === isActive);
    }

    setState(prev => ({ ...prev, filteredWorkflows: filtered }));
  }, [state.workflows, state.searchQuery, state.filterDepartment, state.filterType, state.filterActive]);

  // Handle workflow creation or update
  const handleSaveWorkflow = async (workflowData) => {
    try {
      setState(prev => ({ ...prev, isLoading: true, error: null }));
      
      if (state.editingWorkflow) {
        await updateWorkflow(state.editingWorkflow._id, workflowData);
      } else {
        await createWorkflow(workflowData);
      }
      
      await loadData();
      setState(prev => ({
        ...prev,
        showWorkflowBuilder: false,
        editingWorkflow: null,
        isLoading: false
      }));
    } catch (err) {
      console.error('Error saving workflow:', err);
      setState(prev => ({
        ...prev,
        error: `Failed to ${state.editingWorkflow ? 'update' : 'create'} workflow.`,
        isLoading: false
      }));
    }
  };

  // Handle workflow deletion
  const handleDeleteWorkflow = async () => {
    try {
      setState(prev => ({ ...prev, isDeleting: true }));
      await deleteWorkflow(state.workflowToDelete._id);
      await loadData();
      setState(prev => ({
        ...prev,
        deleteConfirmOpen: false,
        workflowToDelete: null,
        isDeleting: false
      }));
    } catch (err) {
      console.error('Error deleting workflow:', err);
      setState(prev => ({
        ...prev,
        error: 'Failed to delete workflow. It may be in use by active complaints.',
        isDeleting: false
      }));
    }
  };

  // Function to create workflow from template
  const createFromTemplate = () => {
    setState(prev => ({ 
      ...prev, 
      showWorkflowBuilder: true,
      editingWorkflow: null,
      fromTemplate: true
    }));
  };

  // Calculate statistics
  const stats = {
    total: state.workflows.length,
    active: state.workflows.filter(w => w.isActive).length,
    typeCount: new Set(state.workflows.map(w => 
      w.complaintTypeId?._id || w.complaintTypeId
    )).size,
    departmentCount: new Set(state.workflows.map(w => 
      w.departmentId?._id || w.departmentId
    )).size
  };

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Workflow Management</h1>
          <p className="mt-1 text-sm text-gray-500">
            Create and manage custom workflows for complaint resolution
          </p>
        </div>

        <div className="flex space-x-2">
          <button
            onClick={() => setState(prev => ({ 
              ...prev, 
              showWorkflowBuilder: true,
              editingWorkflow: null,
              fromTemplate: false
            }))}
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-[#254E58] hover:bg-[#112D32] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#254E58]"
          >
            <Plus className="h-4 w-4 mr-2" />
            New Workflow
          </button>
          
          <button
            onClick={createFromTemplate}
            className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#254E58]"
          >
            <Book className="h-4 w-4 mr-2" />
            Use Template
          </button>
        </div>
      </div>

      {/* Statistics Section */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Total Workflows</p>
              <p className="mt-1 text-2xl font-semibold text-gray-900">{stats.total}</p>
            </div>
            <div className="p-3 rounded-full bg-blue-100 text-blue-600">
              <WorkflowIcon className="h-5 w-5" />
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Active Workflows</p>
              <p className="mt-1 text-2xl font-semibold text-gray-900">{stats.active}</p>
            </div>
            <div className="p-3 rounded-full bg-green-100 text-green-600">
              <Check className="h-5 w-5" />
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Complaint Types</p>
              <p className="mt-1 text-2xl font-semibold text-gray-900">{stats.typeCount}</p>
            </div>
            <div className="p-3 rounded-full bg-purple-100 text-purple-600">
              <Tag className="h-5 w-5" />
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Departments</p>
              <p className="mt-1 text-2xl font-semibold text-gray-900">{stats.departmentCount}</p>
            </div>
            <div className="p-3 rounded-full bg-orange-100 text-orange-600">
              <Building2 className="h-5 w-5" />
            </div>
          </div>
        </div>
      </div>

      {/* Filters Section */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search workflows..."
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#254E58] focus:border-transparent"
            value={state.searchQuery}
            onChange={(e) => setState(prev => ({ ...prev, searchQuery: e.target.value }))}
          />
        </div>
        <select
          value={state.filterDepartment}
          onChange={(e) => setState(prev => ({ ...prev, filterDepartment: e.target.value }))}
          className="w-full md:w-48 pl-3 pr-10 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#254E58] focus:border-transparent"
        >
          <option value="">All Departments</option>
          {state.departments.map(dept => (
            <option key={dept._id} value={dept._id}>{dept.name}</option>
          ))}
        </select>
        <select
          value={state.filterType}
          onChange={(e) => setState(prev => ({ ...prev, filterType: e.target.value }))}
          className="w-full md:w-48 pl-3 pr-10 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#254E58] focus:border-transparent"
        >
          <option value="">All Complaint Types</option>
          {state.complaintTypes.map(type => (
            <option key={type._id} value={type._id}>{type.name}</option>
          ))}
        </select>
        <select
          value={state.filterActive}
          onChange={(e) => setState(prev => ({ ...prev, filterActive: e.target.value }))}
          className="w-full md:w-40 pl-3 pr-10 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#254E58] focus:border-transparent"
        >
          <option value="all">All Status</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </select>
      </div>

      {/* Error Display */}
      {state.error && (
        <div className="rounded-md bg-red-50 border border-red-200 p-4 flex items-center text-red-700">
          <AlertCircle className="h-5 w-5 mr-2" />
          <span>{state.error}</span>
        </div>
      )}

      {/* Workflow List */}
      <div className="bg-white shadow-sm rounded-lg">
        {state.isLoading ? (
          <div className="flex justify-center items-center h-64">
            <Loader className="h-8 w-8 animate-spin text-[#254E58]" />
          </div>
        ) : state.filteredWorkflows.length === 0 ? (
          <div className="text-center py-12">
            <WorkflowIcon className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No workflows found</h3>
            <p className="mt-1 text-sm text-gray-500">
              {state.searchQuery || state.filterDepartment || state.filterType || state.filterActive !== 'all'
                ? 'Try changing your search or filter criteria'
                : 'Get started by creating a new workflow'}
            </p>
            <div className="mt-6">
              <button
                onClick={() => setState(prev => ({ 
                  ...prev, 
                  showWorkflowBuilder: true,
                  editingWorkflow: null
                }))}
                className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-[#254E58] hover:bg-[#112D32] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#254E58]"
              >
                <Plus className="h-4 w-4 mr-2" />
                New Workflow
              </button>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Workflow Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Complaint Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Department
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Stages
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {state.filteredWorkflows.map((workflow) => (
                  <tr key={workflow._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{workflow.name}</div>
                      {workflow.description && (
                        <div className="text-sm text-gray-500 truncate max-w-xs">{workflow.description}</div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <Tag className="flex-shrink-0 mr-1.5 h-5 w-5 text-purple-500" />
                        <div className="text-sm text-gray-900">
                          {workflow.complaintTypeId?.name || 'Unknown Type'}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <Building2 className="flex-shrink-0 mr-1.5 h-5 w-5 text-orange-500" />
                        <div className="text-sm text-gray-900">
                          {workflow.departmentId?.name || 'Unknown Department'}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {workflow.stages?.length || 0} stage{workflow.stages?.length !== 1 ? 's' : ''}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        workflow.isActive 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {workflow.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-bold">
                      <button
                        onClick={() => setState(prev => ({ 
                          ...prev, 
                          showWorkflowBuilder: true, 
                          editingWorkflow: workflow 
                        }))}
                        className="text-indigo-600 hover:text-indigo-900 mr-4"
                        title="Edit Workflow"
                      >
                        <PenSquare size={16} />
                      </button>
                      <button
                        onClick={() => setState(prev => ({
                          ...prev,
                          deleteConfirmOpen: true,
                          workflowToDelete: workflow
                        }))}
                        className="text-red-600 hover:text-red-900"
                        title="Delete Workflow"
                      >
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Workflow Builder Modal */}
      {state.showWorkflowBuilder && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex min-h-screen items-center justify-center p-4">
            <div 
              className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" 
              onClick={() => setState(prev => ({ ...prev, showWorkflowBuilder: false, editingWorkflow: null }))}
            />
            <div className="relative transform overflow-hidden rounded-lg bg-white shadow-xl w-full max-w-6xl">
              <div className="p-6 max-h-[90vh] overflow-y-auto">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-xl font-semibold text-gray-900">
                    {state.editingWorkflow ? 'Edit Workflow' : 'Create New Workflow'}
                  </h2>
                  <button
                    onClick={() => setState(prev => ({ ...prev, showWorkflowBuilder: false, editingWorkflow: null }))}
                    className="text-gray-400 hover:text-gray-500"
                  >
                    <X className="h-6 w-6" />
                  </button>
                </div>
                <WorkflowBuilder
                  workflow={state.editingWorkflow}
                  complaintTypes={state.complaintTypes}
                  departments={state.departments}
                  onSave={handleSaveWorkflow}
                  onCancel={() => setState(prev => ({ ...prev, showWorkflowBuilder: false, editingWorkflow: null }))}
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <DeleteConfirmationModal
        isOpen={state.deleteConfirmOpen}
        onClose={() => setState(prev => ({ ...prev, deleteConfirmOpen: false, workflowToDelete: null }))}
        onConfirm={handleDeleteWorkflow}
        title="Delete Workflow"
        message={`Are you sure you want to delete the workflow "${state.workflowToDelete?.name}"? This action cannot be undone.`}
        isDeleting={state.isDeleting}
      />
    </div>
  );
};

export default WorkflowManagement;