// components/common/UserManagement.js
import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  Edit2, 
  Trash2, 
  AlertCircle, 
  Search, 
  Users as UsersIcon,
  UserCheck,
  UserX,
  Loader
} from 'lucide-react';
import { fetchUsers, addUser, deleteUser } from '../../services/api';
import AddUserModal from './AddUserModal';
import DeleteConfirmationModal from './DeleteConfirmationModal';

const UserManagement = () => {
  const [state, setState] = useState({
    users: [],
    filteredUsers: [],
    newUser: { email: '', role: 'Student' },
    error: '',
    success: '',
    isLoading: true,
    isSubmitting: false,
    modalError: null,
    searchQuery: '',
    filterRole: 'all',
    showAddForm: false,
    showDeleteConfirm: false,
    userToDelete: null
  });

  useEffect(() => {
    fetchUsersData();
  }, []);

  useEffect(() => {
    filterUsers();
  }, [state.searchQuery, state.filterRole, state.users]);

  const fetchUsersData = async () => {
    try {
      setState(prev => ({ ...prev, isLoading: true }));
      const data = await fetchUsers();
      setState(prev => ({ 
        ...prev, 
        users: data,
        filteredUsers: data,
        error: '' 
      }));
    } catch (err) {
      setState(prev => ({
        ...prev,
        error: `Failed to fetch users: ${err.response?.data?.msg || err.message}`
      }));
    } finally {
      setState(prev => ({ ...prev, isLoading: false }));
    }
  };

  const filterUsers = () => {
    let filtered = [...state.users];

    // Apply search filter
    if (state.searchQuery) {
      filtered = filtered.filter(user =>
        user.email.toLowerCase().includes(state.searchQuery.toLowerCase()) ||
        user.registrationId.toLowerCase().includes(state.searchQuery.toLowerCase())
      );
    }

    // Apply role filter
    if (state.filterRole !== 'all') {
      filtered = filtered.filter(user => user.role === state.filterRole);
    }

    setState(prev => ({ ...prev, filteredUsers: filtered }));
  };

  const handleInputChange = (e) => {
    setState(prev => ({
      ...prev,
      newUser: { ...prev.newUser, [e.target.name]: e.target.value }
    }));
  };

  const handleAddUser = async (e) => {
    e.preventDefault();
    try {
      setState(prev => ({ ...prev, isSubmitting: true, modalError: null }));
      const response = await addUser(state.newUser);
      setState(prev => ({
        ...prev,
        success: `User added successfully. Registration ID: ${response.registrationId}`,
        newUser: { email: '', role: 'Student' },
        showAddForm: false,
        isSubmitting: false,
        modalError: null
      }));
      fetchUsersData();
    } catch (err) {
      setState(prev => ({
        ...prev,
        modalError: err.response?.data?.msg || 'Failed to add user',
        isSubmitting: false
      }));
    }
  };

  const handleDeleteClick = (user) => {
    setState(prev => ({
      ...prev,
      showDeleteConfirm: true,
      userToDelete: user
    }));
  };

  const handleDeleteConfirm = async () => {
    try {
      await deleteUser(state.userToDelete._id);
      setState(prev => ({
        ...prev,
        success: `User ${state.userToDelete.email} deleted successfully`,
        showDeleteConfirm: false,
        userToDelete: null
      }));
      fetchUsersData();
    } catch (err) {
      setState(prev => ({
        ...prev,
        error: err.response?.data?.msg || 'Failed to delete user',
        showDeleteConfirm: false
      }));
    }
  };

  const handleDeleteCancel = () => {
    setState(prev => ({
      ...prev,
      showDeleteConfirm: false,
      userToDelete: null
    }));
  };

  const handleCloseAddModal = () => {
    setState(prev => ({ 
      ...prev, 
      showAddForm: false, 
      modalError: null,
      newUser: { email: '', role: 'Student' }
    }));
  };

  // Calculate statistics
  const stats = {
    total: state.users.length,
    active: state.users.filter(u => u.isActive).length,
    inactive: state.users.filter(u => !u.isActive).length,
    byRole: {
      Student: state.users.filter(u => u.role === 'Student').length,
      DepartmentUser: state.users.filter(u => u.role === 'DepartmentUser').length,
      Faculty: state.users.filter(u => u.role === 'Faculty').length
    }
  };

  if (state.isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader className="h-8 w-8 animate-spin text-[#254E58]" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">User Management</h1>
          <p className="mt-1 text-sm text-gray-500">
            Manage and track all users in your organization
          </p>
        </div>

        <button
          onClick={() => setState(prev => ({ ...prev, showAddForm: true }))}
          className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-[#254E58] hover:bg-[#112D32] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#254E58]"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add User
        </button>
      </div>

      {/* Statistics Section */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatCard
          title="Total Users"
          value={stats.total}
          icon={UsersIcon}
          color="bg-blue-100 text-blue-600"
        />
        <StatCard
          title="Active Users"
          value={stats.active}
          icon={UserCheck}
          color="bg-green-100 text-green-600"
        />
        <StatCard
          title="Inactive Users"
          value={stats.inactive}
          icon={UserX}
          color="bg-red-100 text-red-600"
        />
        <StatCard
          title="Department Users"
          value={stats.byRole.DepartmentUser}
          icon={UsersIcon}
          color="bg-purple-100 text-purple-600"
        />
      </div>

      {/* Success/Error Messages */}
      {(state.error || state.success) && (
        <div className={`rounded-md ${state.error ? 'bg-red-50 text-red-700' : 'bg-green-50 text-green-700'} p-4 flex items-center`}>
          {state.error && <AlertCircle className="h-5 w-5 mr-2" />}
          <span className="text-sm">{state.error || state.success}</span>
        </div>
      )}

      {/* Search and Filters */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search users..."
            value={state.searchQuery}
            onChange={(e) => setState(prev => ({ ...prev, searchQuery: e.target.value }))}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#254E58] focus:border-transparent"
          />
        </div>
        <select
          value={state.filterRole}
          onChange={(e) => setState(prev => ({ ...prev, filterRole: e.target.value }))}
          className="w-full md:w-48 pl-3 pr-10 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#254E58] focus:border-transparent"
        >
          <option value="all">All Roles</option>
          <option value="Student">Students</option>
          <option value="DepartmentUser">Department Users</option>
          <option value="Faculty">Faculty</option>
        </select>
      </div>

      {/* Users Table - Mobile Responsive */}
      <div className="bg-white shadow-sm border border-gray-200 rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden sm:table-cell">Role</th>
                <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden md:table-cell">Registration ID</th>
                <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden sm:table-cell">Status</th>
                <th className="px-4 sm:px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {state.filteredUsers.map((user) => (
                <tr key={user._id} className="hover:bg-gray-50">
                  <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                    <div className="flex flex-col sm:hidden">
                      <span className="text-sm font-medium text-gray-900">{user.email}</span>
                      <span className="text-sm text-gray-500">{user.role}</span>
                      <span className={`inline-flex items-center mt-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        user.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {user.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                    <span className="hidden sm:block text-sm text-gray-900">{user.email}</span>
                  </td>
                  <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-500 hidden sm:table-cell">{user.role}</td>
                  <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 hidden md:table-cell">{user.registrationId}</td>
                  <td className="px-4 sm:px-6 py-4 whitespace-nowrap hidden sm:table-cell">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      user.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }`}>
                      {user.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button
                      onClick={() => handleDeleteClick(user)}
                      className="text-red-600 hover:text-red-900 focus:outline-none"
                      aria-label={`Delete user ${user.email}`}
                    >
                      <Trash2 className="h-5 w-5" />
                    </button>
                  </td>
                </tr>
              ))}
              {state.filteredUsers.length === 0 && (
                <tr>
                  <td colSpan="5" className="px-6 py-12 text-center text-gray-500">
                    <UsersIcon className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No users found</h3>
                    <p className="text-gray-500">
                      {state.searchQuery || state.filterRole !== 'all' 
                        ? 'Try adjusting your search or filter criteria.'
                        : 'Get started by adding your first user.'
                      }
                    </p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add User Modal */}
      <AddUserModal
        isOpen={state.showAddForm}
        onClose={handleCloseAddModal}
        onSubmit={handleAddUser}
        newUser={state.newUser}
        onInputChange={handleInputChange}
        isSubmitting={state.isSubmitting}
        error={state.modalError}
      />

      {/* Delete Confirmation Modal */}
      <DeleteConfirmationModal
        isOpen={state.showDeleteConfirm}
        onClose={handleDeleteCancel}
        onConfirm={handleDeleteConfirm}
        title="Delete User"
        itemName={state.userToDelete?.email}
        isDeleting={false}
      />
    </div>
  );
};

// Statistics Card Component
const StatCard = ({ title, value, icon: Icon, color }) => (
  <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
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

export default UserManagement;