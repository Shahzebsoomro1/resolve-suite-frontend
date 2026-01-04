import React from 'react';
import { Formik, Form, Field } from 'formik';
import * as Yup from 'yup';
import { Building, AlertCircle, Loader } from 'lucide-react';

const DepartmentForm = ({ initialValues, onSubmit, isEdit }) => {
  const defaultValues = {
    name: '',
    description: '',
    isActive: true,
    ...initialValues
  };

  const validationSchema = Yup.object({
    name: Yup.string()
      .required('Department name is required')
      .min(2, 'Name must be at least 2 characters')
      .max(50, 'Name must not exceed 50 characters'),
    description: Yup.string()
      .required('Description is required')
      .min(10, 'Description must be at least 10 characters')
      .max(200, 'Description must not exceed 200 characters'),
    isActive: Yup.boolean()
  });

  return (
    <Formik
      initialValues={defaultValues}
      validationSchema={validationSchema}
      onSubmit={onSubmit}
      enableReinitialize
    >
      {({ errors, touched, isSubmitting }) => (
        <Form className="space-y-4">
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-[#254E58] mb-1">
              Department Name
            </label>
            <div className="relative">
              <Building className="absolute left-3 top-1/2 -translate-y-1/2 text-[#254E58]" size={20} />
              <Field
                type="text"
                id="name"
                name="name"
                className={`w-full pl-10 pr-4 py-2 border ${
                  errors.name && touched.name ? 'border-red-500' : 'border-[#254E58]'
                } rounded-lg focus:outline-none focus:ring-2 focus:ring-[#88BDBC] transition-all duration-300`}
                placeholder="Enter department name"
              />
            </div>
            {errors.name && touched.name && (
              <div className="text-red-500 text-xs mt-1 flex items-center">
                <AlertCircle size={14} className="mr-1" />
                {errors.name}
              </div>
            )}
          </div>

          <div>
            <label htmlFor="description" className="block text-sm font-medium text-[#254E58] mb-1">
              Description
            </label>
            <Field
              as="textarea"
              id="description"
              name="description"
              rows="4"
              className={`w-full px-4 py-2 border ${
                errors.description && touched.description ? 'border-red-500' : 'border-[#254E58]'
              } rounded-lg focus:outline-none focus:ring-2 focus:ring-[#88BDBC] transition-all duration-300`}
              placeholder="Enter department description"
            />
            {errors.description && touched.description && (
              <div className="text-red-500 text-xs mt-1 flex items-center">
                <AlertCircle size={14} className="mr-1" />
                {errors.description}
              </div>
            )}
          </div>

          <div className="flex items-center">
            <Field
              type="checkbox"
              name="isActive"
              className="h-4 w-4 text-[#254E58] focus:ring-[#254E58] border-gray-300 rounded"
            />
            <label htmlFor="isActive" className="ml-2 block text-sm text-gray-700">
              Active
            </label>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-gradient-to-r from-[#254E58] to-[#112D32] text-[#88BDBC] font-bold py-2 px-4 rounded-lg hover:from-[#112D32] hover:to-[#254E58] focus:outline-none focus:ring-2 focus:ring-[#88BDBC] focus:ring-opacity-50 transition-all duration-300 flex items-center justify-center"
          >
            {isSubmitting ? (
              <>
                <Loader className="animate-spin -ml-1 mr-3 h-5 w-5" />
                {isEdit ? 'Updating...' : 'Creating...'}
              </>
            ) : (
              <>{isEdit ? 'Update Department' : 'Create Department'}</>
            )}
          </button>
        </Form>
      )}
    </Formik>
  );
};

export default DepartmentForm;