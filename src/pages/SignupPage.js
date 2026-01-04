import React, { useState, memo } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { signupUser } from '../services/api';
import { Eye, EyeOff, User, Mail, Lock, ChevronRight, HelpCircle, AlertCircle } from 'lucide-react';
import { Popover, PopoverButton, PopoverPanel } from '@headlessui/react';
import Navbar from '../components/common/Navbar';
// Memoized input components
const Input = memo(({ icon: Icon, name, type, placeholder, value, onChange, error }) => {
  const [showPassword, setShowPassword] = useState(false);
  const isPassword = type === 'password';
  
  return (
    <div className="relative">
      <Icon className="absolute top-3 left-3 text-[#254E58]" size={20} />
      <input
        type={isPassword ? (showPassword ? 'text' : 'password') : type}
        id={name}
        name={name}
        value={value}
        onChange={onChange}
        className={`w-full pl-10 ${isPassword ? 'pr-10' : 'pr-3'} py-2 border ${error ? 'border-red-500' : 'border-[#254E58]'} rounded-lg focus:outline-none focus:ring-2 focus:ring-[#88BDBC] bg-white text-[#112D32] transition-all duration-300`}
        placeholder={placeholder}
      />
      {isPassword && (
        <button
          type="button"
          onClick={() => setShowPassword(prev => !prev)}
          className="absolute inset-y-0 right-0 pr-3 flex items-center"
        >
          {showPassword ? (
            <EyeOff className="text-[#254E58]" size={20} />
          ) : (
            <Eye className="text-[#254E58]" size={20} />
          )}
        </button>
      )}
      {error && (
        <p className="text-red-500 text-xs mt-1 flex items-center">
          <AlertCircle size={14} className="mr-1" /> {error}
        </p>
      )}
    </div>
  );
});

const RegistrationIdInput = memo(({ value, onChange, error }) => (
  <div className="relative">
    <User className="absolute top-3 left-3 text-gray-400" size={20} />
    <input
      type="text"
      id="registrationId"
      name="registrationId"
      value={value}
      onChange={onChange}
      required
      className="w-full pl-10 pr-10 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500 transition-all duration-300"
      placeholder="Registration ID"
    />
    <Popover className="absolute inset-y-0 right-0 flex items-center pr-3">
      {({ open }) => (
        <>
          <PopoverButton className="text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-yellow-500">
            <HelpCircle size={20} />
          </PopoverButton>
          <PopoverPanel
            className={`absolute z-10 w-72 bg-white border border-gray-200 rounded-lg shadow-lg p-4 text-sm text-gray-700 ${
              open ? 'visible opacity-100' : 'invisible opacity-0'
            } transition-opacity duration-300 ease-in-out`}
            style={{
              top: 'calc(100% + 10px)',
              right: '-10px',
            }}
          >
            <div className="relative">
              <div className="absolute -top-2 right-4 w-4 h-4 bg-white border-t border-l border-gray-200 transform rotate-45"></div>
              Your Registration ID is provided by the organization where you are pre-registered. If you don't have one, please contact your organization's administrator.
            </div>
          </PopoverPanel>
        </>
      )}
    </Popover>
    {error && (
      <p className="text-red-500 text-xs mt-1 flex items-center">
        <AlertCircle size={14} className="mr-1" /> {error}
      </p>
    )}
  </div>
));

const SignupPage = () => {
  const [formData, setFormData] = useState({
    registrationId: '',
    email: '',
    password: '',
    confirmPassword: '',
    firstName: '',
    lastName: ''
  });
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.registrationId) newErrors.registrationId = 'Registration ID is required';
    if (!formData.email) newErrors.email = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(formData.email)) newErrors.email = 'Email is invalid';
    if (!formData.firstName) newErrors.firstName = 'First name is required';
    if (!formData.lastName) newErrors.lastName = 'Last name is required';
    if (!formData.password) newErrors.password = 'Password is required';
    else if (formData.password.length < 8) newErrors.password = 'Password must be at least 8 characters';
    if (formData.password !== formData.confirmPassword) newErrors.confirmPassword = 'Passwords do not match';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;
    setIsLoading(true);
    try {
      await signupUser(formData);
      navigate('/login');
    } catch (err) {
      setErrors(prev => ({
        ...prev,
        general: err.response?.data?.msg || 'An error occurred during signup'
      }));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f5f7fa] text-[#112D32] flex flex-col">
      <Navbar />
      <div className="flex-grow bg-[#e4e7eb] flex items-center justify-center p-4 md:p-6 lg:p-8">
        <div className="w-full max-w-md bg-white rounded-lg shadow-md">
          <div className="bg-[#254E58] px-8 py-8">
            <h2 className="text-white text-2xl font-semibold mb-2">Join ResolveSuite</h2>
            <p className="text-gray-300 text-base">Create your account</p>
          </div>
          <form onSubmit={handleSubmit} className="px-8 py-10 space-y-6">
            <div className="space-y-4">
              <RegistrationIdInput
                value={formData.registrationId}
                onChange={handleChange}
                error={errors.registrationId}
              />

              <Input
                icon={Mail}
                name="email"
                type="email"
                placeholder="Email"
                value={formData.email}
                onChange={handleChange}
                error={errors.email}
              />
              
              <div className="grid grid-cols-2 gap-4">
                <Input
                  icon={User}
                  name="firstName"
                  type="text"
                  placeholder="First Name"
                  value={formData.firstName}
                  onChange={handleChange}
                  error={errors.firstName}
                />
                <Input
                  icon={User}
                  name="lastName"
                  type="text"
                  placeholder="Last Name"
                  value={formData.lastName}
                  onChange={handleChange}
                  error={errors.lastName}
                />
              </div>

              <Input
                icon={Lock}
                name="password"
                type="password"
                placeholder="Password"
                value={formData.password}
                onChange={handleChange}
                error={errors.password}
              />

              <Input
                icon={Lock}
                name="confirmPassword"
                type="password"
                placeholder="Confirm Password"
                value={formData.confirmPassword}
                onChange={handleChange}
                error={errors.confirmPassword}
              />
            </div>

            {errors.general && (
              <p className="text-red-500 text-sm bg-red-100 border border-red-300 p-2 rounded-lg flex items-center">
                <AlertCircle size={16} className="mr-2" /> {errors.general}
              </p>
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
                  Create Account <ChevronRight className="ml-2" size={20} />
                </>
              )}
            </button>
          </form>

          <div className="text-center pb-10">
            <p className="text-[#254E58] text-sm">
              Already have an account?{' '}
              <Link to="/login" className="text-[#FFA62B] hover:text-[#FF9500] font-semibold">
                Log In
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SignupPage;