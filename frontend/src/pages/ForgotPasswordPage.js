import React, { useState } from 'react';
import { Formik, Form, Field } from 'formik';
import * as Yup from 'yup';
import { useNavigate, Link } from 'react-router-dom';
import { Mail, Lock, ChevronRight, AlertCircle, ArrowLeft, Eye, EyeOff } from 'lucide-react';
import { requestPasswordReset, verifyOTP, resetPassword } from '../services/api';

// Progress bar component for steps
const ProgressSteps = ({ currentStep }) => (
  <div className="flex justify-between mb-8 relative">
    {[1, 2, 3].map((step) => (
      <div key={step} className="flex flex-col items-center z-10">
        <div
          className={`w-8 h-8 flex items-center justify-center rounded-full transition-all duration-500 ${
            step === currentStep
              ? 'bg-[#254E58] text-white scale-110'
              : step < currentStep
              ? 'bg-green-500 text-white'
              : 'bg-gray-200 text-gray-500'
          }`}
        >
          {step < currentStep ? '✓' : step}
        </div>
        <span className="text-xs mt-1 text-gray-500">
          {step === 1 ? 'Email' : step === 2 ? 'Verify' : 'Reset'}
        </span>
      </div>
    ))}
    <div
      className="absolute top-4 left-0 h-[2px] w-full bg-gray-200 -z-0"
      style={{ transform: 'translateY(-50%)' }}
    >
      <div
        className="h-full bg-green-500 transition-all duration-500"
        style={{ width: `${((currentStep - 1) / 2) * 100}%` }}
      />
    </div>
  </div>
);

// Loading spinner component
const LoadingSpinner = () => (
  <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
    <circle
      className="opacity-25"
      cx="12"
      cy="12"
      r="10"
      stroke="currentColor"
      strokeWidth="4"
    />
    <path
      className="opacity-75"
      fill="currentColor"
      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
    />
  </svg>
);

const ForgotPasswordPage = () => {
  const [step, setStep] = useState(1);
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const navigate = useNavigate();

  const validationSchemas = {
    email: Yup.object({
      email: Yup.string()
        .email('Invalid email address')
        .required('Email is required'),
    }),
    otp: Yup.object({
      otp: Yup.string()
        .matches(/^\d{6}$/, 'OTP must be 6 digits')
        .required('OTP is required'),
    }),
    password: Yup.object({
      password: Yup.string()
        .min(8, 'Password must be at least 8 characters')
        .matches(
          /^(?=.*[A-Z])(?=.*[a-z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/,
          'Password must contain uppercase, lowercase, number and special character'
        )
        .required('Password is required'),
      confirmPassword: Yup.string()
        .oneOf([Yup.ref('password'), null], 'Passwords must match')
        .required('Confirm Password is required'),
    }),
  };

  const handleSubmit = async (values, { resetForm }) => {
    setError('');
    setSuccess('');
    setIsLoading(true);

    try {
      // eslint-disable-next-line default-case
      switch (step) {
        case 1:
          await requestPasswordReset(values.email);
          setEmail(values.email);
          setSuccess('OTP has been sent to your email');
          resetForm();
          setStep(2);
          break;
        case 2:
          await verifyOTP(email, values.otp);
          setSuccess('OTP verified successfully');
          resetForm();
          setStep(3);
          break;
        case 3:
          await resetPassword(email, values.password);
          setSuccess('Redirecting to login page...');
          setTimeout(() => navigate('/login'), 2000);
          break;
      }
    } catch (err) {
      setError(err.response?.data?.msg || err.message);
    } finally {
      setIsLoading(false);
    }
  };

  // Function to go back to previous step
  const handleBack = () => {
    setStep((prev) => Math.max(1, prev - 1));
    setError('');
    setSuccess('');
  };

  const renderForm = () => {
    const getInitialValues = () => {
      switch (step) {
        case 1:
          return { email: '' };
        case 2:
          return { otp: '' };
        case 3:
          return { password: '', confirmPassword: '' };
        default:
          return {};
      }
    };

    return (
      <Formik
        initialValues={getInitialValues()}
        validationSchema={validationSchemas[step === 1 ? 'email' : step === 2 ? 'otp' : 'password']}
        onSubmit={handleSubmit}
      >
        {({ errors, touched, values, handleChange }) => (
          <Form className="space-y-6">
            {step > 1 && (
              <div className="text-sm text-gray-500 mb-4">
                <span>Email: </span>
                <span className="font-medium text-[#254E58]">{email}</span>
              </div>
            )}

            {step === 1 && (
              <div className="relative">
                <Mail className="absolute top-3 left-3 text-[#254E58]" size={20} />
                <Field
                  type="email"
                  name="email"
                  placeholder="Enter your email"
                  className="w-full pl-10 pr-4 py-3 border border-[#254E58] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#88BDBC] transition-all duration-300"
                />
                {errors.email && touched.email && (
                  <div className="text-red-500 text-sm mt-1 flex items-center">
                    <AlertCircle size={16} className="mr-1" />
                    {errors.email}
                  </div>
                )}
              </div>
            )}

            {step === 2 && (
              <div className="relative">
                <Lock className="absolute top-3 left-3 text-[#254E58]" size={20} />
                <Field
                  type="text"
                  name="otp"
                  maxLength="6"
                  placeholder="Enter 6-digit OTP"
                  className="w-full pl-10 pr-4 py-3 border border-[#254E58] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#88BDBC] transition-all duration-300 tracking-widest text-center font-mono"
                />
                {errors.otp && touched.otp && (
                  <div className="text-red-500 text-sm mt-1 flex items-center">
                    <AlertCircle size={16} className="mr-1" />
                    {errors.otp}
                  </div>
                )}
              </div>
            )}

            {step === 3 && (
              <>
                <div className="relative">
                  <Lock className="absolute top-3 left-3 text-[#254E58]" size={20} />
                  <Field
                    type={showPassword ? "text" : "password"}
                    name="password"
                    placeholder="New Password"
                    className="w-full pl-10 pr-12 py-3 border border-[#254E58] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#88BDBC] transition-all duration-300"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-3 text-gray-500 hover:text-gray-700"
                  >
                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                  {errors.password && touched.password && (
                    <div className="text-red-500 text-sm mt-1 flex items-center">
                      <AlertCircle size={16} className="mr-1" />
                      {errors.password}
                    </div>
                  )}
                </div>

                <div className="relative">
                  <Lock className="absolute top-3 left-3 text-[#254E58]" size={20} />
                  <Field
                    type={showConfirmPassword ? "text" : "password"}
                    name="confirmPassword"
                    placeholder="Confirm Password"
                    className="w-full pl-10 pr-12 py-3 border border-[#254E58] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#88BDBC] transition-all duration-300"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-3 text-gray-500 hover:text-gray-700"
                  >
                    {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                  {errors.confirmPassword && touched.confirmPassword && (
                    <div className="text-red-500 text-sm mt-1 flex items-center">
                      <AlertCircle size={16} className="mr-1" />
                      {errors.confirmPassword}
                    </div>
                  )}
                </div>
              </>
            )}

            <div className="flex gap-4">
              {step > 1 && (
                <button
                  type="button"
                  onClick={handleBack}
                  className="flex-1 flex items-center justify-center px-4 py-3 border border-[#254E58] text-[#254E58] rounded-lg hover:bg-gray-50 transition-all duration-300"
                >
                  <ArrowLeft size={20} className="mr-2" />
                  Back
                </button>
              )}

              <button
                type="submit"
                disabled={isLoading}
                className={`flex-1 bg-gradient-to-r from-[#254E58] to-[#112D32] text-[#88BDBC] font-bold py-3 px-4 rounded-lg hover:from-[#112D32] hover:to-[#254E58] transition-all duration-300 flex items-center justify-center ${
                  isLoading ? 'opacity-75 cursor-not-allowed' : ''
                }`}
              >
                {isLoading ? (
                  <LoadingSpinner />
                ) : (
                  <>
                    {step === 1 && 'Send OTP'}
                    {step === 2 && 'Verify OTP'}
                    {step === 3 && 'Reset Password'}
                    <ChevronRight className="ml-2" size={20} />
                  </>
                )}
              </button>
            </div>
          </Form>
        )}
      </Formik>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#254E58] via-[#88BDBC] to-[#112D32] flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-2xl overflow-hidden transition-all duration-500">
          <div className="bg-gradient-to-r from-[#254E58] to-[#112D32] p-8 text-center">
            <h2 className="text-[#88BDBC] text-3xl font-bold">Reset Password</h2>
            <p className="text-gray-400 mt-2">
              {step === 1 && "Enter your email to reset password"}
              {step === 2 && "Enter the OTP sent to your email"}
              {step === 3 && "Create your new password"}
            </p>
          </div>

          <div className="p-8">
            <ProgressSteps currentStep={step} />

            {renderForm()}

            {(error || success) && (
              <div
                className={`mt-4 p-4 rounded-lg flex items-center ${
                  error
                    ? 'bg-red-50 text-red-700 border border-red-200'
                    : 'bg-green-50 text-green-700 border border-green-200'
                }`}
              >
                <AlertCircle size={20} className="mr-2 flex-shrink-0" />
                <span className="text-sm">{error || success}</span>
              </div>
            )}

            <div className="mt-6 text-center">
              <Link
                to="/login"
                className="text-sm text-[#254E58] hover:text-[#112D32] transition-colors duration-300"
              >
                Remember your password? Login
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ForgotPasswordPage;