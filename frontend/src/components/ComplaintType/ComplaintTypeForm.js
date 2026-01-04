// components/ComplaintType/ComplaintTypeForm.js
import React from "react";
import PropTypes from "prop-types";
import { Formik, Form } from "formik";
import * as Yup from "yup";
import { Loader } from "lucide-react";
import FormField from "../common/FormField";

const validationSchema = Yup.object({
  name: Yup.string()
    .required("Name is required")
    .min(3, "Name must be at least 3 characters")
    .max(100, "Name must not exceed 100 characters"),
  description: Yup.string()
    .required("Description is required")
    .min(10, "Description must be at least 10 characters"),
  defaultDepartmentId: Yup.string().optional(),
});

const ComplaintTypeForm = ({
  onSubmit,
  onCancel,
  initialValues = null,
  departments = [],
}) => {
  const defaultValues = {
    name: "",
    description: "",
    defaultDepartmentId: "",
    ...initialValues,
  };

  return (
    <Formik
      initialValues={defaultValues}
      validationSchema={validationSchema}
      onSubmit={onSubmit}
      enableReinitialize
    >
      {({ errors, touched, isSubmitting, handleChange, handleBlur }) => (
        <Form className="space-y-6">
          <FormField
            label="Type Name"
            name="name"
            placeholder="Enter complaint type name"
            onChange={handleChange}
            onBlur={handleBlur}
            error={errors.name}
            touched={touched.name}
            required
          />

          <div className="space-y-1">
            <label
              htmlFor="description"
              className="block text-sm font-medium text-gray-700"
            >
              Description <span className="text-red-500">*</span>
            </label>
            <textarea
              id="description"
              name="description"
              rows={4}
              className={`mt-1 block w-full rounded-md shadow-sm 
                ${
                  errors.description && touched.description
                    ? "border-red-300 focus:border-red-500 focus:ring-red-500"
                    : "border-gray-300 focus:border-[#254E58] focus:ring-[#254E58]"
                } sm:text-sm`}
              placeholder="Enter detailed description"
              onChange={handleChange}
              onBlur={handleBlur}
            />
            {errors.description && touched.description && (
              <p className="mt-1 text-sm text-red-500">{errors.description}</p>
            )}
          </div>

          <div className="space-y-1">
            <label
              htmlFor="defaultDepartmentId"
              className="block text-sm font-medium text-gray-700"
            >
              Default Department
            </label>
            <select
              id="defaultDepartmentId"
              name="defaultDepartmentId"
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm 
                focus:border-[#254E58] focus:ring-[#254E58] sm:text-sm"
              onChange={handleChange}
              onBlur={handleBlur}
              value={defaultValues.defaultDepartmentId._id}
            >
              <option value="">Select Department</option>
              {departments.map((dept) => (
                <option key={dept._id} value={dept._id}>
                  {dept.name}
                </option>
              ))}
            </select>
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2 text-gray-700 bg-white border border-gray-300 
                rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 
                focus:ring-offset-2 focus:ring-[#254E58]"
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex items-center px-4 py-2 text-white 
                bg-[#254E58] rounded-lg hover:bg-[#1a3940] 
                focus:outline-none focus:ring-2 focus:ring-offset-2 
                focus:ring-[#254E58] disabled:opacity-50 
                disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                <>
                  <Loader className="w-4 h-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                "Save"
              )}
            </button>
          </div>
        </Form>
      )}
    </Formik>
  );
};

ComplaintTypeForm.propTypes = {
  onSubmit: PropTypes.func.isRequired,
  onCancel: PropTypes.func.isRequired,
  initialValues: PropTypes.shape({
    name: PropTypes.string,
    description: PropTypes.string,
    defaultDepartmentId: PropTypes.string,
  }),
  departments: PropTypes.arrayOf(
    PropTypes.shape({
      _id: PropTypes.string.isRequired,
      name: PropTypes.string.isRequired,
    })
  ).isRequired,
};

export default ComplaintTypeForm;
