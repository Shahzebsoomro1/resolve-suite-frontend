import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Formik, Field, Form, ErrorMessage } from 'formik';
import * as Yup from 'yup';
import { Eye, EyeOff, User, Mail, Lock, ChevronRight, AlertCircle } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { getOrganizations, loginUser } from '../services/api';
import Navbar from '../components/common/Navbar';
const validationSchema = Yup.object({
  organizationId: Yup.string().required('Organization is required'),
  email: Yup.string().email('Invalid email address').required('Email is required'),
  password: Yup.string().required('Password is required'),
});
//Github Push Test 

const LoginPage = () => {
  const [error, setError] = useState('');
  const [organizations, setOrganizations] = useState([]);
  const [selectedOrganization, setSelectedOrganization] = useState('ResolveSuite');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { login } = useAuth();

  useEffect(() => {
    const fetchOrganizations = async () => {
      try {
        const data = await getOrganizations();
        setOrganizations(data);
      } catch (err) {
        console.error('Error fetching organizations:', err);
        setError('Unable to load organizations. Please try again later.');
      }
    };

    fetchOrganizations();
  }, []);

  const handleSubmit = async (values) => {
    try {
      setError('');
      setIsLoading(true);

      const response = await loginUser(values.email, values.password, values.organizationId);
      
      // Enhanced login with more user data
      login(response);

      // Role-based navigation
      switch (response.role) {
        case 'SuperAdmin':
          navigate('/admin/dashboard');
          break;
        case 'DepartmentUser':
          navigate('/department/dashboard');
          break;
        case 'Student':
          navigate('/student/dashboard');
          break;
        case 'Faculty':
          navigate('/faculty/dashboard');
          break;
        default:
          navigate('/');
      }
    } catch (err) {
      console.error('Login error:', err);
      setError(err.response?.data?.msg || 'Failed to login. Please check your credentials.');
    } finally {
      setIsLoading(false);
    }
  };

  const InputField = ({ icon: Icon, name, type, placeholder }) => (
    <div className="relative mb-4">
      <Icon className="absolute top-1/2 -translate-y-1/2 left-3 text-[#254E58]" size={20} />
      <Field
        type={type === 'password' ? (showPassword ? 'text' : 'password') : type}
        id={name}
        name={name}
        className="w-full pl-10 pr-12 py-3 border border-[#254E58] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#88BDBC] bg-white text-[#112D32] transition-all duration-300 text-sm"
        placeholder={placeholder}
      />
      {type === 'password' && (
        <button
          type="button"
          onClick={() => setShowPassword(!showPassword)}
          className="absolute top-1/2 -translate-y-1/2 right-3 text-[#254E58] hover:text-[#112D32] transition-colors"
        >
          {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
        </button>
      )}
      <ErrorMessage name={name}>
        {msg => (
          <div className="absolute -bottom-5 left-0 text-red-500 text-xs flex items-center">
            <AlertCircle size={14} className="mr-1" />
            {msg}
          </div>
        )}
      </ErrorMessage>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#f5f7fa] text-[#112D32] flex flex-col">
      <Navbar />
      <div className="flex-grow bg-[#e4e7eb] flex items-center justify-center p-4 md:p-6 lg:p-8">
        <div className="w-full max-w-md bg-white rounded-lg shadow-md">
          <div className="bg-[#254E58] px-8 py-8">
            <h2 className="text-white text-2xl font-semibold mb-2">{selectedOrganization}</h2>
            <p className="text-gray-300 text-base">Login to your account</p>
          </div>

          <Formik
            initialValues={{ organizationId: '', email: '', password: '' }}
            validationSchema={validationSchema}
            onSubmit={handleSubmit}
          >
            {({ handleChange }) => (
              <Form className="px-8 py-10 space-y-8">
                <div className="relative mb-6">
                  <User className="absolute top-1/2 -translate-y-1/2 left-3 text-[#254E58]" size={20} />
                  <Field
                    as="select"
                    name="organizationId"
                    className="w-full pl-10 pr-4 py-3 border border-[#254E58] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#88BDBC] bg-white text-[#112D32] transition-all duration-300 text-sm appearance-none"
                    onChange={(e) => {
                      handleChange(e);
                      const selectedOrg = organizations.find(org => org._id === e.target.value);
                      setSelectedOrganization(selectedOrg?.name || 'ResolveSuite');
                    }}
                  >
                    <option value="">Select your organization</option>
                    {organizations.map((org) => (
                      <option key={org._id} value={org._id}>
                        {org.name}
                      </option>
                    ))}
                  </Field>
                  <ErrorMessage name="organizationId">
                    {msg => (
                      <div className="absolute -bottom-5 left-0 text-red-500 text-xs flex items-center">
                        <AlertCircle size={14} className="mr-1" />
                        {msg}
                      </div>
                    )}
                  </ErrorMessage>
                </div>

                <InputField icon={Mail} name="email" type="email" placeholder="Email" />
                <InputField icon={Lock} name="password" type="password" placeholder="Password" />

                <div className="text-right -mt-4">
                  <Link 
                    to="/forgot-password" 
                    className="text-[#254E58] hover:text-[#112D32] text-sm font-medium transition-colors duration-200"
                  >
                    Forgot Password?
                  </Link>
                </div>

                {error && (
                  <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-center mt-6">
                    <AlertCircle size={20} className="mr-2 flex-shrink-0" />
                    <span className="text-sm">{error}</span>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={isLoading}
                  className={`w-full bg-[#254E58] text-white font-semibold py-3 px-6 rounded-lg hover:bg-[#1e3f47] focus:outline-none focus:ring-2 focus:ring-[#254E58] focus:ring-opacity-50 transition-all duration-300 flex items-center justify-center ${
                    isLoading ? 'opacity-50 cursor-not-allowed' : ''
                  }`}
                >
                  {isLoading ? (
                    <svg className="animate-spin h-5 w-5 mr-3" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                  ) : (
                    <>
                      Login <ChevronRight className="ml-2" size={20} />
                    </>
                  )}
                </button>
              </Form>
            )}
          </Formik>

          <div className="text-center pb-10">
            <p className="text-[#254E58] text-sm">
              Don't have an account?{' '}
              <Link to="/signup" className="text-[#FFA62B] hover:text-[#FF9500] font-semibold">
                Sign Up
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;