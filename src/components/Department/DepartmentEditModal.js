import React from 'react';
import { X } from 'lucide-react';
import DepartmentForm from './DepartmentForm';

const DepartmentEditModal = ({ department, onClose, onUpdate, isOpen }) => {
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
        <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
          <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium leading-6 text-[#254E58]">
                Edit Department
              </h3>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-500 transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <DepartmentForm
              initialValues={{
                name: department.name,
                description: department.description,
                isActive: department.isActive
              }}
              onSubmit={async (values, { setSubmitting }) => {
                try {
                  await onUpdate(values);
                  onClose();
                } catch (error) {
                  console.error('Failed to update department:', error);
                } finally {
                  setSubmitting(false);
                }
              }}
              isEdit={true}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default DepartmentEditModal;