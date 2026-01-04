// components/ComplaintType/ComplaintTypeList.js
import React from "react";
import PropTypes from "prop-types";
import { Building2, Pen, Trash2 } from "lucide-react";

const ComplaintTypeList = ({
  complaintTypes,
  departments,
  onEdit,
  onDelete,
}) => {
  if (!complaintTypes?.length) {
    return (
      <div className="text-center py-12 bg-gray-50 rounded-lg">
        <p className="text-gray-500 text-lg">
          No complaint types found. Create your first type to get started.
        </p>
      </div>
    );
  }
  return (
    <div className="bg-white shadow rounded-lg overflow-hidden">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Type Name
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Description
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Default Department
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {complaintTypes.map((type) => {
              const defaultDept = departments.find(
                d => d._id === type.defaultDepartmentId._id
              );

              return (
                <tr key={type._id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      {type.name}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-500 line-clamp-2">
                      {type.description}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center text-sm text-gray-500">
                      {defaultDept ? (
                        <>
                          <Building2 className="flex-shrink-0 mr-1.5 h-5 w-5 text-[#254E58]" />
                          <span className="font-medium">
                            {defaultDept.name}
                          </span>
                        </>
                      ) : (
                        <span className="text-gray-400 italic">
                          None assigned
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <button
                      onClick={() => onEdit(type)}
                      className="text-indigo-600 hover:text-indigo-900 mr-4"
                      title={`Edit ${type.name}`}
                    >
                      <Pen className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => onDelete(type)}
                      className="text-red-600 hover:text-red-900"
                      title={`Delete ${type.name}`}
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

ComplaintTypeList.propTypes = {
  complaintTypes: PropTypes.arrayOf(
    PropTypes.shape({
      _id: PropTypes.string.isRequired,
      name: PropTypes.string.isRequired,
      description: PropTypes.string.isRequired,
      defaultDepartmentId: PropTypes.string,
    })
  ).isRequired,
  departments: PropTypes.arrayOf(
    PropTypes.shape({
      _id: PropTypes.string.isRequired,
      name: PropTypes.string.isRequired,
    })
  ).isRequired,
  onEdit: PropTypes.func.isRequired,
  onDelete: PropTypes.func.isRequired,
};

export default ComplaintTypeList;
