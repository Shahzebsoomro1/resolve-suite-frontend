import React, { useCallback, useEffect, useState } from 'react';
import { debounce } from 'lodash';
import { Formik, Field, Form, ErrorMessage } from 'formik';
import * as Yup from 'yup';
import { useNavigate } from 'react-router-dom';
import { fetchAddressSuggestions, registerOrganization, checkOrganizationName } from '../services/api';
import { Building, Mail, Phone, MapPin, Loader, AlertCircle, Check } from 'lucide-react';

// Component for form section headers
const SectionHeader = ({ children }) => (
  <h3 className="text-[#254E58] font-semibold text-lg mb-4 border-b border-[#254E58]/20 pb-2">
    {children}
  </h3>
);

// Base form field component
const FormField = ({ label, name, type = "text", icon: Icon }) => {
  if (name === "organizationType") {
    return (
      <div className="flex flex-col">
        <label htmlFor={name} className="text-[#254E58] font-medium mb-1 text-sm">{label}</label>
        <div className="relative">
          <Icon className="absolute top-3 left-3 text-[#254E58]" size={20} />
          <Field
            as="select"
            id={name}
            name={name}
            className="w-full pl-10 pr-4 py-2 border border-[#254E58] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FFA62B] focus:border-transparent transition-all duration-300 text-sm appearance-none"
          >
            <option value="">Select Organization Type</option>
            <option value="school">School</option>
            <option value="institute">Institute</option>
            <option value="university">University</option>
          </Field>
        </div>
        <ErrorMessage name={name} component="div" className="text-red-500 text-sm mt-1 bg-red-50 border border-red-200 p-2 rounded" />
      </div>
    );
  }

  return (
    <div className="flex flex-col">
      <label htmlFor={name} className="text-[#254E58] font-medium mb-1 text-sm">{label}</label>
      <div className="relative">
        <Icon className="absolute top-3 left-3 text-[#254E58]" size={20} />
        <Field
          type={type}
          id={name}
          name={name}
          className="w-full pl-10 pr-4 py-2 border border-[#254E58] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FFA62B] focus:border-transparent transition-all duration-300 text-sm"
        />
      </div>
      <ErrorMessage name={name} component="div" className="text-red-500 text-sm mt-1 bg-red-50 border border-red-200 p-2 rounded" />
    </div>
  );
};

// New OrganizationNameField component using React.memo
const OrganizationNameField = React.memo(({ name, value, onChange, onBlur, error, touched, isChecking, isAvailable, availabilityMessage }) => (
  <div className="flex flex-col">
    <label htmlFor={name} className="text-[#254E58] font-medium mb-1 text-sm">
      Organization Name
    </label>
    <div className="relative">
      <Building className="absolute top-3 left-3 text-[#254E58]" size={20} />
      <input
        id={name}
        name={name}
        type="text"
        value={value}
        onChange={onChange}
        onBlur={onBlur}
        className={`w-full pl-10 pr-10 py-2 border ${
          isAvailable === false ? 'border-red-500' : 'border-[#254E58]'
        } rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FFA62B] focus:border-transparent transition-all duration-300 text-sm`}
      />
      <div className="absolute top-3 right-3">
        {isChecking ? (
          <Loader className="animate-spin text-[#254E58]" size={20} />
        ) : isAvailable === true ? (
          <Check className="text-green-500" size={20} />
        ) : isAvailable === false ? (
          <AlertCircle className="text-red-500" size={20} />
        ) : null}
      </div>
    </div>
    {availabilityMessage && (
      <div
        className={`text-sm mt-1 ${
          isAvailable ? 'text-green-600' : 'text-red-600'
        }`}
      >
        {availabilityMessage}
      </div>
    )}
    {touched && error && (
      <div className="text-red-500 text-sm mt-1 bg-red-50 border border-red-200 p-2 rounded">
        {error}
      </div>
    )}
  </div>
));

// Address fields component
const AddressFields = ({ handleChange, setFieldValue, suggestions, handleSuggestionSelect, debouncedFetchSuggestions }) => (
  <div className="space-y-4">
    <div className="relative">
      <label className="text-[#254E58] font-medium mb-1 text-sm">Street Address</label>
      <div className="relative">
        <MapPin className="absolute top-3 left-3 text-[#254E58]" size={20} />
        <Field
          type="text"
          name="street"
          onChange={(e) => {
            handleChange(e);
            debouncedFetchSuggestions(e.target.value);
          }}
          placeholder="Enter street address"
          className="w-full pl-10 pr-4 py-2 border border-[#254E58] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FFA62B] focus:border-transparent transition-all duration-300 text-sm"
        />
      </div>
      <ErrorMessage name="street" component="div" className="text-red-500 text-sm mt-1 bg-red-50 border border-red-200 p-2 rounded" />
      {suggestions.length > 0 && (
        <ul className="absolute z-10 mt-1 w-full bg-white border border-[#254E58] rounded-lg shadow-lg max-h-40 overflow-y-auto">
          {suggestions.map((suggestion, index) => (
            <li
              key={index}
              className="p-2 hover:bg-[#F4F7F7] cursor-pointer text-sm"
              onClick={() => handleSuggestionSelect(suggestion, setFieldValue)}
            >
              {suggestion.formatted}
            </li>
          ))}
        </ul>
      )}
    </div>

    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <FormField label="City" name="city" icon={MapPin} />
      <FormField label="Province" name="province" icon={MapPin} />
      <FormField label="Country" name="country" icon={MapPin} />
      <FormField label="Zip Code" name="zipCode" icon={MapPin} />
    </div>
  </div>
);

// Validation schema
const validationSchema = Yup.object({
  organizationName: Yup.string()
    .required('Organization Name is required')
    .min(2, 'Organization name must be at least 2 characters')
    .max(100, 'Organization name must not exceed 100 characters')
    .matches(/^[^\d].*$/, 'Organization name cannot start with a number'),
  organizationType: Yup.string()
    .required('Organization Type is required'),
  street: Yup.string()
    .required('Street address is required')
    .min(5, 'Street address is too short'),
  city: Yup.string()
    .required('City is required')
    .min(2, 'City name is too short'),
  province: Yup.string()
    .required('Province is required'),
  country: Yup.string()
    .required('Country is required'),
  zipCode: Yup.string()
    .required('Zip Code is required')
    .matches(/^[0-9A-Za-z\s-]{4,10}$/, 'Invalid zip code format'),
  email: Yup.string()
    .email('Invalid email address')
    .required('Email is required'),
  phone: Yup.string()
    .required('Phone is required')
    .matches(/^[+]?[(]?[0-9]{3}[)]?[-\s.]?[0-9]{3}[-\s.]?[0-9]{4,6}$/, 'Invalid phone number format'),
});

// Main component
const OrganizationRegistrationPage = () => {
  const [suggestions, setSuggestions] = useState([]);
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const [nameAvailability, setNameAvailability] = useState({
    isChecking: false,
    isAvailable: null,
    message: ''
  });

  // Updated debouncedCheckName function
  const debouncedCheckName = useCallback(
    debounce(async (name, setFieldError) => {
      if (!name || name.length < 2) {
        setNameAvailability(prev => ({
          ...prev,
          isChecking: false,
          isAvailable: null,
          message: ''
        }));
        return;
      }

      try {
        setNameAvailability(prev => ({ ...prev, isChecking: true }));
        const response = await checkOrganizationName(name);
        
        setNameAvailability({
          isChecking: false,
          isAvailable: response.isAvailable,
          message: response.message
        });

        if (!response.isAvailable) {
          setFieldError('organizationName', 'This organization name is already taken');
        }
      } catch (error) {
        setNameAvailability({
          isChecking: false,
          isAvailable: null,
          message: 'Error checking organization name'
        });
      }
    }, 500),
    []
  );

  const debouncedFetchSuggestions = useCallback(
    debounce(async (input) => {
      if (!input) return;
      try {
        const results = await fetchAddressSuggestions(input);
        setSuggestions(results);
        setError(null);
      } catch (error) {
        setError(error.message);
        setSuggestions([]);
      }
    }, 300),
    [setSuggestions, setError]
  );

  // Add cleanup effect
  useEffect(() => {
    return () => {
      debouncedFetchSuggestions.cancel();
      debouncedCheckName.cancel();
    };
  }, [debouncedFetchSuggestions, debouncedCheckName]);

  const handleSuggestionSelect = (result, setFieldValue) => {
    const { components, formatted } = result;
    setFieldValue('street', formatted);
    setFieldValue('city', components.city || components.town || components.village || '');
    setFieldValue('province', components.state || '');
    setFieldValue('country', components.country || '');
    setFieldValue('zipCode', components.postcode || '');
    setSuggestions([]);
  };

  const handleSubmit = async (values, { setSubmitting, setFieldError }) => {
    if (!nameAvailability.isAvailable) {
      setFieldError('organizationName', 'Please choose a different organization name');
      setSubmitting(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await registerOrganization(values);

      if (response.organizationId) {
        navigate(`/register-superadmin?organizationId=${response.organizationId}`, {
          state: { organizationName: values.organizationName }
        });
      } else {
        throw new Error('Organization ID not received from server');
      }
    } catch (error) {
      const errorMessage = error.response?.data?.msg || error.message || 'Failed to register organization';
      setError(errorMessage);
      setSubmitting(false);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#254E58] via-[#88BDBC] to-[#112D32] font-sans p-4 flex items-center justify-center">
      <div className="w-full max-w-4xl bg-white rounded-xl shadow-2xl overflow-hidden">
        <div className="flex flex-col md:flex-row">
          {/* Left side banner */}
          <div className="bg-gradient-to-br from-[#254E58] to-[#112D32] text-white p-8 md:w-1/3 flex flex-col justify-center items-center md:items-start">
            <h1 className="text-3xl md:text-4xl font-bold mb-2">ResolveSuite</h1>
            <p className="text-xl md:text-xl text-[#88BDBC]">Organization Registration</p>
          </div>

          {/* Form section */}
          <div className="p-8 md:w-2/3">
            <Formik
              initialValues={{
                organizationName: '',
                organizationType: '',
                street: '',
                city: '',
                province: '',
                country: '',
                zipCode: '',
                email: '',
                phone: '',
              }}
              validationSchema={validationSchema}
              onSubmit={handleSubmit}
            >
              {({ 
                values, 
                handleChange, 
                handleBlur, 
                errors, 
                touched, 
                setFieldError, 
                setFieldValue,
                isSubmitting
              }) => (
                <Form className="space-y-6">
                  {/* Organization Details Section */}
                  <div>
                    <SectionHeader>Organization Details</SectionHeader>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <OrganizationNameField
                        name="organizationName"
                        value={values.organizationName}
                        onChange={(e) => {
                          handleChange(e);
                          debouncedCheckName(e.target.value, setFieldError);
                        }}
                        onBlur={handleBlur}
                        error={errors.organizationName}
                        touched={touched.organizationName}
                        isChecking={nameAvailability.isChecking}
                        isAvailable={nameAvailability.isAvailable}
                        availabilityMessage={nameAvailability.message}
                      />
                      <FormField label="Organization Type" name="organizationType" icon={Building} />
                    </div>
                  </div>

                  {/* Address Section */}
                  <div>
                    <SectionHeader>Address Information</SectionHeader>
                    <AddressFields
                      handleChange={handleChange}
                      setFieldValue={setFieldValue}
                      suggestions={suggestions}
                      debouncedFetchSuggestions={debouncedFetchSuggestions}
                      handleSuggestionSelect={handleSuggestionSelect}
                    />
                  </div>

                  {/* Contact Section */}
                  <div>
                    <SectionHeader>Contact Information</SectionHeader>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField label="Contact Email" name="email" type="email" icon={Mail} />
                      <FormField label="Contact Phone" name="phone" type="tel" icon={Phone} />
                    </div>
                  </div>

                  {/* Submit Button */}
                  <button
                    type="submit"
                    disabled={isLoading || isSubmitting || nameAvailability.isAvailable === false}
                    className="w-full bg-gradient-to-r from-[#FFA62B] to-[#FF9500] text-[#112D32] px-6 py-3 rounded-full font-semibold transition-all duration-300 transform hover:scale-105 hover:shadow-lg text-lg disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none mt-6"
                  >
                    {isLoading || isSubmitting ? (
                      <div className="flex items-center justify-center">
                        <Loader className="animate-spin -ml-1 mr-3 h-5 w-5" />
                        Registering...
                      </div>
                    ) : (
                      'Register Now'
                    )}
                  </button>

                  {/* Error Display */}
                  {error && (
                    <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mt-4" role="alert">
                      <strong className="font-bold">Error: </strong>
                      <span className="block sm:inline">{error}</span>
                    </div>
                  )}
                </Form>
              )}
            </Formik>
          </div>
        </div>
      </div>
    </div>
  );
};

// PropTypes for type checking (optional but recommended)
OrganizationRegistrationPage.propTypes = {
  // Add prop types if needed
};

// Default props (optional)
OrganizationRegistrationPage.defaultProps = {
  // Add default props if needed
};

export default OrganizationRegistrationPage;