// components/ComplaintForm.js
import React, { useState, useEffect } from 'react';
import { Formik, Form, Field } from 'formik';
import * as Yup from 'yup';
import { AlertCircle, Upload, X, Loader } from 'lucide-react';
import { getAllDepartments, getComplaintTypes } from '../../services/api';

const validationSchema = Yup.object({
  title: Yup.string()
    .required('Title is required')
    .min(5, 'Title must be at least 5 characters')
    .max(100, 'Title must not exceed 100 characters'),
  description: Yup.string()
    .required('Description is required')
    .min(20, 'Description must be at least 20 characters'),
  complaintTypeId: Yup.string()
    .required('Complaint type is required'),
  departmentId: Yup.string()
    .required('Department is required'),
  priority: Yup.string()
    .required('Priority is required')
    .oneOf(['Low', 'Medium', 'High', 'Urgent']),
});

const FormField = ({ label, error, touched, children }) => (
  <div className="space-y-1">
    <label className="block text-sm font-medium text-gray-700">
      {label}
    </label>
    {children}
    {error && touched && (
      <p className="mt-1 text-sm text-red-500 flex items-center">
        <AlertCircle size={16} className="mr-1 flex-shrink-0" />
        {error}
      </p>
    )}
  </div>
);

const ComplaintForm = ({ onSubmit, onClose, initialValues = null }) => {
  const [departments, setDepartments] = useState([]);
  const [complaintTypes, setComplaintTypes] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [attachments, setAttachments] = useState([]);

  const loadFormData = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const [deptResponse, typeResponse] = await Promise.allSettled([
        getAllDepartments(),
        getComplaintTypes()
      ]);

      if (deptResponse.status === 'fulfilled') {
        setDepartments(deptResponse.value);
      } else {
        console.error('Failed to load departments:', deptResponse.reason);
      }

      if (typeResponse.status === 'fulfilled') {
        setComplaintTypes(typeResponse.value);
      } else {
        console.error('Failed to load complaint types:', typeResponse.reason);
      }

    } catch (err) {
      setError('Failed to load form data. Please try again.');
      console.error('Error loading form data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadFormData();
  }, []);

  const handleFileChange = (event) => {
    const files = Array.from(event.target.files);
    const maxSize = 10 * 1024 * 1024; // 10MB
    const validTypes = ['image/jpeg', 'image/png', 'application/pdf'];

    const validFiles = files.filter(file => {
      if (!validTypes.includes(file.type)) {
        setError(`${file.name} is not a supported file type`);
        return false;
      }
      if (file.size > maxSize) {
        setError(`${file.name} is too large. Maximum size is 10MB`);
        return false;
      }
      return true;
    });

    const newAttachments = validFiles.map(file => ({
      file,
      preview: URL.createObjectURL(file)
    }));

    setAttachments(prev => [...prev, ...newAttachments]);
  };

  const removeAttachment = (index) => {
    setAttachments(prev => {
      const newAttachments = [...prev];
      URL.revokeObjectURL(newAttachments[index].preview);
      newAttachments.splice(index, 1);
      return newAttachments;
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader className="animate-spin mr-2" />
        <span>Loading form data...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 text-center">
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4">
          {error}
        </div>
        <button
          onClick={loadFormData}
          className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-[#254E58] hover:bg-[#112D32]"
        >
          Retry Loading Form
        </button>
      </div>
    );
  }

  return (
    <div className="bg-white px-4 pt-5 pb-4 sm:p-6">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-lg font-medium leading-6 text-gray-900">
          Submit New Complaint
        </h3>
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className="text-gray-400 hover:text-gray-500"
          >
            <X className="h-6 w-6" />
          </button>
        )}
      </div>

      <Formik
        initialValues={{
          title: '',
          description: '',
          complaintTypeId: '',
          departmentId: '',
          priority: '',
          ...initialValues
        }}
        validationSchema={validationSchema}
        onSubmit={async (values, { setSubmitting }) => {
          try {
            setError(null);

            // Create base complaint data
            const complaintData = {
              title: values.title,
              description: values.description,
              complaintTypeId: values.complaintTypeId,
              departmentId: values.departmentId,
              priority: values.priority
            };

            // Only use FormData if there are attachments
            if (attachments.length > 0) {
              const formData = new FormData();

              // Append basic fields
              Object.keys(complaintData).forEach(key => {
                formData.append(key, complaintData[key]);
              });

              // Append attachments
              attachments.forEach(({ file }) => {
                formData.append('attachments', file);
              });

              await onSubmit(formData);
            } else {
              // Send plain JSON if no attachments
              await onSubmit(complaintData);
            }
          } catch (error) {
            setError(error.message || 'Failed to submit complaint. Please try again.');
          } finally {
            setSubmitting(false);
          }
        }}
      >
        {({ errors, touched, isSubmitting }) => (
          <Form className="space-y-6">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-center">
                <AlertCircle size={20} className="mr-2" />
                {error}
              </div>
            )}

            <FormField label="Title" error={errors.title} touched={touched.title}>
              <Field
                type="text"
                name="title"
                className={`mt-1 block w-full rounded-lg shadow-sm border ${errors.title && touched.title
                    ? 'border-red-300 focus:border-red-500 focus:ring-red-500'
                    : 'border-gray-300 focus:border-[#254E58] focus:ring-[#254E58]'
                  } px-4 py-2 text-gray-900`}
                placeholder="Enter complaint title"
              />
            </FormField>

            <FormField label="Description" error={errors.description} touched={touched.description}>
              <Field
                as="textarea"
                name="description"
                rows={4}
                className={`mt-1 block w-full rounded-lg shadow-sm border ${errors.description && touched.description
                    ? 'border-red-300 focus:border-red-500 focus:ring-red-500'
                    : 'border-gray-300 focus:border-[#254E58] focus:ring-[#254E58]'
                  } px-4 py-2 text-gray-900`}
                placeholder="Provide detailed description of your complaint"
              />
            </FormField>

            <FormField
              label="Complaint Type"
              error={errors.complaintTypeId}
              touched={touched.complaintTypeId}
            >
              <Field
                as="select"
                name="complaintTypeId"
                className={`mt-1 block w-full rounded-lg shadow-sm border ${errors.complaintTypeId && touched.complaintTypeId
                    ? 'border-red-300 focus:border-red-500 focus:ring-red-500'
                    : 'border-gray-300 focus:border-[#254E58] focus:ring-[#254E58]'
                  } px-4 py-2 text-gray-900`}
              >
                <option value="">Select Complaint Type</option>
                {complaintTypes.map(type => (
                  <option key={type._id} value={type._id}>
                    {type.name}
                  </option>
                ))}
              </Field>
            </FormField>

            <FormField label="Department" error={errors.departmentId} touched={touched.departmentId}>
              <Field
                as="select"
                name="departmentId"
                className={`mt-1 block w-full rounded-lg shadow-sm border ${errors.departmentId && touched.departmentId
                    ? 'border-red-300 focus:border-red-500 focus:ring-red-500'
                    : 'border-gray-300 focus:border-[#254E58] focus:ring-[#254E58]'
                  } px-4 py-2 text-gray-900`}
              >
                <option value="">Select Department</option>
                {departments.map(dept => (
                  <option key={dept._id} value={dept._id}>
                    {dept.name}
                  </option>
                ))}
              </Field>
            </FormField>

            <FormField label="Priority" error={errors.priority} touched={touched.priority}>
              <Field
                as="select"
                name="priority"
                className={`mt-1 block w-full rounded-lg shadow-sm border ${errors.priority && touched.priority
                    ? 'border-red-300 focus:border-red-500 focus:ring-red-500'
                    : 'border-gray-300 focus:border-[#254E58] focus:ring-[#254E58]'
                  } px-4 py-2 text-gray-900`}
              >
                <option value="">Select Priority</option>
                <option value="Low">Low</option>
                <option value="Medium">Medium</option>
                <option value="High">High</option>
                <option value="Urgent">Urgent</option>
              </Field>
            </FormField>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Attachments
              </label>
              <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-lg hover:border-[#254E58] transition-colors">
                <div className="space-y-1 text-center">
                  <Upload className="mx-auto h-12 w-12 text-gray-400" />
                  <div className="flex text-sm">
                    <label
                      htmlFor="file-upload"
                      className="relative cursor-pointer rounded-md font-medium text-[#254E58] hover:text-[#112D32] focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-[#254E58]"
                    >
                      <span>Upload files</span>
                      <input
                        id="file-upload"
                        name="file-upload"
                        type="file"
                        className="sr-only"
                        multiple
                        accept=".jpg,.jpeg,.png,.pdf"
                        onChange={handleFileChange}
                      />
                    </label>
                    <p className="pl-1 text-gray-600">or drag and drop</p>
                  </div>
                  <p className="text-xs text-gray-500">
                    PNG, JPG, PDF up to 10MB each
                  </p>
                </div>
              </div>

              {attachments.length > 0 && (
                <div className="mt-4 grid grid-cols-2 gap-4">
                  {attachments.map((attachment, index) => (
                    <div
                      key={index}
                      className="relative group border rounded-lg p-3 hover:border-[#254E58] bg-gray-50"
                    >
                      <button
                        type="button"
                        onClick={() => removeAttachment(index)}
                        className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X size={16} />
                      </button>
                      <p className="text-sm truncate">{attachment.file.name}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="mt-6">
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-[#254E58] hover:bg-[#112D32] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#254E58] disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-150"
              >
                {isSubmitting ? (
                  <div className="flex items-center">
                    <Loader className="animate-spin h-5 w-5 mr-2" />
                    Submitting...
                  </div>
                ) : (
                  'Submit Complaint'
                )}
              </button>
            </div>
          </Form>
        )}
      </Formik>
    </div>
  );
};

export default ComplaintForm;