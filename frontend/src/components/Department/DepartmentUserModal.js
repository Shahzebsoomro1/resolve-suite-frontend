import React, { useState, useEffect } from 'react';
import { X, Search, UserPlus, UserMinus, Loader, AlertCircle } from 'lucide-react';
import { 
  getDepartmentUsers, 
  fetchUsers, 
  assignUsersToDepartment,
  removeUserFromDepartment,
  fetchDepartmentEligibleUsers
} from '../../services/api';

// User Item Component
const UserItem = ({ user, onAction, actionType }) => (
  <div className="flex items-center justify-between p-2 hover:bg-gray-50 rounded-lg">
    <div>
      <div className="flex items-center">
        <div className="text-sm font-medium text-gray-900">
          {user.email}
        </div>
        <span className={`ml-2 px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
          user.isActive 
            ? 'bg-green-100 text-green-800' 
            : 'bg-red-100 text-red-800'
        }`}>
          {user.isActive ? 'Active' : 'Inactive'}
        </span>
      </div>
    </div>
    {user.isActive && (
      <button
        onClick={() => onAction(user._id)}
        className={`p-1 ${
          actionType === 'assign' 
            ? 'text-[#254E58] hover:text-[#112D32]' 
            : 'text-red-600 hover:text-red-700'
        }`}
        title={actionType === 'assign' ? 'Assign to department' : 'Remove from department'}
        disabled={!user.isActive}
      >
        {actionType === 'assign' ? <UserPlus size={20} /> : <UserMinus size={20} />}
      </button>
    )}
  </div>
);

const DepartmentUsersModal = ({ department, isOpen, onClose, onUserUpdate }) => {
  const [users, setUsers] = useState([]);
  const [departmentUsers, setDepartmentUsers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (isOpen && department) {
      loadData();
    }
  }, [isOpen, department]);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [eligibleUsers, deptUsers] = await Promise.all([
        fetchDepartmentEligibleUsers(),
        getDepartmentUsers(department._id)
      ]);
      
      setUsers(eligibleUsers);
      setDepartmentUsers(deptUsers);
    } catch (err) {
      setError('Failed to load users');
      console.error('Error loading users:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAssignUser = async (userId) => {
    try {
      await assignUsersToDepartment(department._id, [userId]);
      await loadData();
      onUserUpdate && onUserUpdate();
    } catch (err) {
      setError('Failed to assign user');
      console.error('Error assigning user:', err);
    }
  };

  const handleRemoveUser = async (userId) => {
    try {
      await removeUserFromDepartment(department._id, userId);
      await loadData();
      onUserUpdate && onUserUpdate();
    } catch (err) {
      setError('Failed to remove user');
      console.error('Error removing user:', err);
    }
  };

  const filteredUsers = users.filter(user => 
    !departmentUsers.find(du => du._id === user._id) &&
    user.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
        {/* Background overlay */}
        <div 
          className="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75" 
          onClick={onClose}
        ></div>

        {/* Modal panel */}
        <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-4xl sm:w-full">
          <div className="bg-white px-4 pt-5 pb-4 sm:p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium leading-6 text-[#254E58]">
                Manage Users - {department.name}
              </h3>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-500 transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            {/* Search input */}
            <div className="mb-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                <input
                  type="text"
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#88BDBC] focus:border-transparent"
                  placeholder="Search users by email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>

            {error && (
              <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded relative flex items-center">
                <AlertCircle size={20} className="mr-2" />
                {error}
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Available Users */}
              <div className="border rounded-lg p-4">
                <h4 className="text-sm font-medium text-gray-500 mb-2">Available Users</h4>
                {loading ? (
                  <div className="flex justify-center items-center h-40">
                    <Loader className="animate-spin" size={24} />
                  </div>
                ) : (
                  <div className="space-y-2 max-h-96 overflow-y-auto">
                    {filteredUsers.map(user => (
                      <UserItem 
                        key={user._id} 
                        user={user} 
                        onAction={handleAssignUser} 
                        actionType="assign"
                      />
                    ))}
                    {filteredUsers.length === 0 && (
                      <div className="text-center text-gray-500 py-4">
                        No available users found
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Department Users */}
              <div className="border rounded-lg p-4">
                <h4 className="text-sm font-medium text-gray-500 mb-2">Department Users</h4>
                {loading ? (
                  <div className="flex justify-center items-center h-40">
                    <Loader className="animate-spin" size={24} />
                  </div>
                ) : (
                  <div className="space-y-2 max-h-96 overflow-y-auto">
                    {departmentUsers.map(user => (
                      <UserItem 
                        key={user._id} 
                        user={user} 
                        onAction={handleRemoveUser} 
                        actionType="remove"
                      />
                    ))}
                    {departmentUsers.length === 0 && (
                      <div className="text-center text-gray-500 py-4">
                        No users in this department
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DepartmentUsersModal;