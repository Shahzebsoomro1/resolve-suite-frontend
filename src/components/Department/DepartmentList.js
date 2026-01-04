import React from 'react';
import { Edit2, Trash2, Users, AlertCircle } from 'lucide-react';

const DepartmentList = ({ 
  departments, 
  onEdit, 
  onDelete, 
  onViewUsers,
  isLoading,
  error 
}) => {
  if (isLoading) {
    return (
      <div className="bg-white shadow rounded-lg p-6">
        <div className="animate-pulse space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-16 bg-gray-200 rounded"></div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center text-red-700">
        <AlertCircle className="mr-2" size={20} />
        <span>{error}</span>
      </div>
    );
  }

  if (!departments?.length) {
    return (
      <div className="bg-white shadow rounded-lg p-6 text-center text-gray-500">
        No departments found. Create your first department to get started.
      </div>
    );
  }

  return (
    <div className="overflow-x-auto bg-white shadow rounded-lg">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Department Name
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Description
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Users
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Status
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Actions
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {departments.map((department) => (
            <tr key={department._id} className="hover:bg-gray-50">
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="text-sm font-medium text-[#254E58]">
                  {department.name}
                </div>
              </td>
              <td className="px-6 py-4">
                <div className="text-sm text-gray-500 line-clamp-2">
                  {department.description}
                </div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <button
                  onClick={() => onViewUsers(department)}
                  className="inline-flex items-center text-sm text-[#254E58] hover:text-[#112D32]"
                >
                  <Users size={16} className="mr-1" />
                  {department.userCount || 0}
                </button>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                  department.isActive
                    ? 'bg-green-100 text-green-800'
                    : 'bg-red-100 text-red-800'
                }`}>
                  {department.isActive ? 'Active' : 'Inactive'}
                </span>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm font-bold">
                <button
                  onClick={() => onEdit(department)}
                  className="text-indigo-600 hover:text-indigo-900 mr-4"
                  title="Edit Department"
                >
                  <Edit2 size={16} />
                </button>
                <button
                  onClick={() => onDelete(department)}
                  className="text-red-600 hover:text-red-900"
                  title="Delete Department"
                >
                  <Trash2 size={16} />
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default DepartmentList;