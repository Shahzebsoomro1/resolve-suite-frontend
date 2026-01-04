import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Formik, Form, Field } from 'formik';
import * as Yup from 'yup';
import { Eye, EyeOff, User, Mail, Lock } from 'lucide-react';
import API from '../services/api';

const validationSchema = Yup.object({
  firstName: Yup.string()
    .required('First name is required')
    .min(2, 'Must be at least 2 characters'),
  lastName: Yup.string()
    .required('Last name is required')
    .min(2, 'Must be at least 2 characters'),
  email: Yup.string()
    .email('Invalid email address')
    .required('Email is required'),
  password: Yup.string()
    .required('Password is required')
    .min(8, 'Must be at least 8 characters'),
  confirmPassword: Yup.string()
    .oneOf([Yup.ref('password')], 'Passwords must match')
    .required('Please confirm your password')
});

const FormField = ({ name, type, icon: Icon, error, ...props }) => {
  const [showPassword, setShowPassword] = useState(false);

  return (
    <div className="space-y-1">
      <div className="relative">
        <Icon className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={20} />
        <Field
          name={name}
          type={type === "password" ? (showPassword ? "text" : "password") : type}
          className="w-full pl-10 pr-10 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#254E58]"
          {...props}
        />
        {type === "password" && (
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
          >
            {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
          </button>
        )}
      </div>
      {error && (
        <div className="text-red-500 text-xs">{error}</div>
      )}
    </div>
  );
};

const SuperAdminRegistration = () => {
  const [organizationName, setOrganizationName] = useState('');
  const navigate = useNavigate();
  const location = useLocation();
  const organizationId = new URLSearchParams(location.search).get('organizationId');

  useEffect(() => {
    const fetchOrganization = async () => {
      if (!organizationId) {
        navigate('/organisation-registration');
        return;
      }

      try {
        const { data } = await API.get(`/organizations/${organizationId}`);
        setOrganizationName(data.name);
      } catch (err) {
        console.error('Error fetching organization:', err);
        navigate('/organisation-registration');
      }
    };

    fetchOrganization();
  }, [organizationId, navigate]);

  const handleSubmit = async (values, { setSubmitting }) => {
    try {
      await API.post('/auth/register-superadmin', {
        ...values,
        organizationId
      });
      navigate('/login', {
        state: { 
          successMessage: 'Registration successful! Please log in.',
          email: values.email 
        }
      });
    } catch (err) {
      console.error('Registration error:', err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#254E58] via-[#88BDBC] to-[#112D32] p-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-lg overflow-hidden">
        <div className="bg-[#254E58] p-8 text-center">
          <h2 className="text-[#88BDBC] text-2xl font-bold">Complete Registration</h2>
          <p className="text-gray-400 mt-2">Setting up SuperAdmin account for</p>
          <p className="text-[#88BDBC] font-medium">{organizationName}</p>
        </div>

        <Formik
          initialValues={{
            firstName: '',
            lastName: '',
            email: '',
            password: '',
            confirmPassword: ''
          }}
          validationSchema={validationSchema}
          onSubmit={handleSubmit}
        >
          {({ errors, touched, isSubmitting }) => (
            <Form className="p-8 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  name="firstName"
                  placeholder="First Name"
                  icon={User}
                  error={touched.firstName && errors.firstName}
                />
                <FormField
                  name="lastName"
                  placeholder="Last Name"
                  icon={User}
                  error={touched.lastName && errors.lastName}
                />
              </div>

              <FormField
                name="email"
                type="email"
                placeholder="Email"
                icon={Mail}
                error={touched.email && errors.email}
              />

              <FormField
                name="password"
                type="password"
                placeholder="Password"
                icon={Lock}
                error={touched.password && errors.password}
              />

              <FormField
                name="confirmPassword"
                type="password"
                placeholder="Confirm Password"
                icon={Lock}
                error={touched.confirmPassword && errors.confirmPassword}
              />

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-[#254E58] text-white py-2 rounded-lg hover:bg-[#1a3940] transition-colors duration-200"
              >
                Complete Registration
              </button>
            </Form>
          )}
        </Formik>
      </div>
    </div>
  );
};

export default SuperAdminRegistration;