// components/common/FormField.js
import React from 'react';
import { Field } from 'formik';
import PropTypes from 'prop-types';

const FormField = ({ 
  name, 
  label, 
  error, 
  touched, 
  hint,
  required = false,
  ...props 
}) => (
  <div className="space-y-1">
    <label 
      htmlFor={name} 
      className="block text-sm font-medium text-gray-700"
    >
      {label}
      {required && <span className="text-red-500 ml-1">*</span>}
    </label>
    
    <Field
      id={name}
      name={name}
      className={`
        mt-1 block w-full rounded-lg border px-3 py-2
        ${error && touched
          ? 'border-red-300 focus:border-red-500 focus:ring-red-500'
          : 'border-gray-300 focus:border-[#254E58] focus:ring-[#254E58]'
        }
        focus:ring focus:ring-opacity-50
        disabled:bg-gray-50 disabled:text-gray-500
      `}
      {...props}
    />

    {hint && !error && (
      <p className="mt-1 text-sm text-gray-500">{hint}</p>
    )}

    {error && touched && (
      <p className="mt-1 text-sm text-red-600" role="alert">
        {error}
      </p>
    )}
  </div>
);

FormField.propTypes = {
  name: PropTypes.string.isRequired,
  label: PropTypes.string.isRequired,
  error: PropTypes.string,
  touched: PropTypes.bool,
  hint: PropTypes.string,
  required: PropTypes.bool,
};

export default FormField;