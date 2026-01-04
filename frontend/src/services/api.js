import axios from 'axios';

const OPENCAGE_API_URL = 'https://api.opencagedata.com/geocode/v1/json';

// Determine the correct API base URL
const getApiBaseUrl = () => {
  // Check if we're in production (deployed on Vercel)
  if (process.env.NODE_ENV === 'production') {
    // In production, use relative path (same domain)
    return '/api';
  }
  
  // In development, use environment variable or default to localhost
  return process.env.REACT_APP_API_URL || 'http://localhost:5000/api';
};

const API_BASE_URL = getApiBaseUrl();

console.log('🌐 API Configuration:', {
  environment: process.env.NODE_ENV,
  baseURL: API_BASE_URL
});

// Create an instance of Axios
const API = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
  timeout: 30000, // 30 seconds timeout
  headers: {
    'Content-Type': 'application/json',
  }
});

// Add a request interceptor to include the JWT token in requests
API.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = token.startsWith('Bearer ') 
        ? token 
        : `Bearer ${token}`;
    }
    
    // Log request in development
    if (process.env.NODE_ENV === 'development') {
      console.log('📤 API Request:', {
        method: config.method?.toUpperCase(),
        url: config.url,
        fullURL: `${config.baseURL}${config.url}`
      });
    }
    
    return config;
  },
  (error) => {
    console.error('❌ Request Error:', error);
    return Promise.reject(error);
  }
);

// Add a response interceptor for global error handling
API.interceptors.response.use(
  (response) => {
    // Log response in development
    if (process.env.NODE_ENV === 'development') {
      console.log('✅ API Response:', {
        status: response.status,
        url: response.config.url
      });
    }
    return response;
  },
  (error) => {
    console.error('❌ API Error:', {
      status: error.response?.status,
      message: error.response?.data?.msg || error.message,
      url: error.config?.url
    });
    
    // Handle 401 Unauthorized
    if (error.response?.status === 401) {
      handleUnauthorized();
    }
    
    // Handle network errors
    if (!error.response) {
      console.error('🔌 Network Error - Cannot reach server');
      if (process.env.NODE_ENV === 'development') {
        console.log('💡 Tip: Make sure your backend server is running on port 5000');
      }
    }
    
    return Promise.reject(error);
  }
);

// Handle unauthorized access
export const handleUnauthorized = () => {
  console.log('🚫 Unauthorized access detected. Redirecting to login.');
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  delete API.defaults.headers.common['Authorization'];
  window.location.href = '/login';
};

// ========== ORGANIZATION APIs ==========
export const getOrganizations = async () => {
  try {
    const response = await API.get('/organizations');
    return response.data;
  } catch (error) {
    console.error('Error fetching organizations:', error);
    throw error;
  }
};

export const registerOrganization = async (organizationData) => {
  try {
    const response = await API.post('/organizations/register', organizationData);
    console.log('Organization registration response:', response.data);
    
    if (!response.data.organizationId) {
      throw new Error('Organization ID not received in response');
    }
    
    return response.data;
  } catch (error) {
    console.error('Organization registration error:', error);
    if (error.response?.data?.msg) {
      throw new Error(error.response.data.msg);
    }
    throw new Error('Failed to register organization. Please try again.');
  }
};

export const fetchOrganizationById = async (id) => {
  try {
    const response = await API.get(`/organizations/${id}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching organization:', error);
    throw error;
  }
};

export const checkOrganizationName = async (name) => {
  try {
    const response = await API.get(`/organizations/check-name/${encodeURIComponent(name)}`);
    return response.data;
  } catch (error) {
    console.error('Error checking organization name:', error);
    throw error;
  }
};

// ========== AUTH APIs ==========
export const loginUser = async (email, password, organizationId) => {
  try {
    const response = await API.post('/auth/login', { email, password, organizationId });
    const { token, role, userId, firstName, lastName, departmentId } = response.data;
    
    // Store token in localStorage
    const fullToken = `Bearer ${token}`;
    localStorage.setItem('token', fullToken);
    
    // Return user data for context
    return {
      token: fullToken,
      role,
      email,
      userId,
      firstName,
      lastName,
      organizationId,
      departmentId,
      isAuthenticated: true
    };
  } catch (error) {
    console.error('Login failed:', error.response?.data || error.message);
    throw error;
  }
};

export const logoutUser = async () => {
  try {
    await API.post('/auth/logout');
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    delete API.defaults.headers.common['Authorization'];
    console.log('User logged out successfully');
  } catch (error) {
    console.error('Error logging out:', error.response?.data || error.message);
    // Still remove token and user data even if the API call fails
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    delete API.defaults.headers.common['Authorization'];
    throw error;
  }
};

export const signupUser = async (userData) => {
  try {
    const response = await API.post('/auth/signup', userData);
    console.log('User signed up successfully:', response.data);
    return response.data;
  } catch (error) {
    console.error('Error signing up:', error.response?.data || error.message);
    throw error;
  }
};

export const registerSuperAdmin = async (superAdminData) => {
  try {
    const response = await API.post('/auth/register-superadmin', superAdminData);
    console.log('SuperAdmin registered successfully:', response.data);
    return response.data;
  } catch (error) {
    console.error('Error registering SuperAdmin:', error.response?.data || error.message);
    throw error;
  }
};

export const requestPasswordReset = async (email) => {
  try {
    const response = await API.post('/auth/forgot-password', { email });
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};

export const verifyOTP = async (email, otp) => {
  try {
    const response = await API.post('/auth/verify-otp', { email, otp });
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};

export const resetPassword = async (email, password) => {
  try {
    const response = await API.post('/auth/reset-password', { email, password });
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};

// ========== USER APIs ==========
export const addUser = async (userData) => {
  try {
    const response = await API.post('/users/add', userData);
    console.log('User added successfully:', response.data);
    return response.data;
  } catch (error) {
    console.error('Error adding user:', error.response?.data || error.message);
    throw error;
  }
};

export const fetchUsers = async () => {
  try {
    const response = await API.get('/users');
    console.log('Users fetched successfully:', response.data);
    return response.data;
  } catch (error) {
    console.error('Error fetching users:', error.response?.data || error.message);
    throw error;
  }
};

export const deleteUser = async (userId) => {
  try {
    const response = await API.delete(`/users/${userId}`);
    console.log('User deleted successfully:', response.data);
    return response.data;
  } catch (error) {
    console.error('Error deleting user:', error.response?.data || error.message);
    throw error;
  }
};

export const fetchDepartmentEligibleUsers = async () => {
  try {
    const response = await API.get('/users/department-eligible');
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};

// ========== DEPARTMENT APIs ==========
export const createDepartment = async (departmentData) => {
  try {
    const response = await API.post('/departments', departmentData);
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};

export const getAllDepartments = async () => {
  try {
    const response = await API.get('/departments');
    return response.data;
  } catch (error) {
    if (error.response?.status === 403) {
      throw new Error('You do not have permission to view departments');
    }
    throw error;
  }
};

export const getDepartmentById = async (id) => {
  try {
    const response = await API.get(`/departments/${id}`);
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};

export const updateDepartment = async (id, departmentData) => {
  try {
    const response = await API.put(`/departments/${id}`, departmentData);
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};

export const deleteDepartment = async (id) => {
  try {
    const response = await API.delete(`/departments/${id}`);
    return response.data;
  } catch (error) {
    const errorMessage = error.response?.data?.msg || error.message;
    throw new Error(errorMessage);
  }
};

export const assignUsersToDepartment = async (departmentId, userIds) => {
  try {
    const response = await API.post(`/departments/${departmentId}/users`, { userIds });
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};

export const getDepartmentUsers = async (departmentId) => {
  try {
    const response = await API.get(`/departments/${departmentId}/users`);
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};

export const removeUserFromDepartment = async (departmentId, userId) => {
  try {
    const response = await API.delete(`/departments/${departmentId}/users/${userId}`);
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};

// ========== COMPLAINT APIs ==========
export const createComplaint = async (complaintData) => {
  try {
    const config = {
      headers: {
        'Content-Type': complaintData instanceof FormData 
          ? 'multipart/form-data'
          : 'application/json'
      }
    };

    const response = await API.post('/complaints', complaintData, config);
    return response.data;
  } catch (error) {
    console.error('Complaint creation error:', {
      status: error.response?.status,
      data: error.response?.data
    });
    throw error;
  }
};

export const getComplaints = async (filters = {}) => {
  try {
    const response = await API.get('/complaints', { params: filters });
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};

export const getComplaintById = async (id) => {
  try {
    const response = await API.get(`/complaints/${id}`);
    return response.data;
  } catch (error) {
    throw error.response?.data?.msg || 'Failed to fetch complaint details';
  }
};

export const updateComplaintStatus = async (id, statusData) => {
  try {
    const response = await API.put(`/complaints/${id}/status`, statusData);
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};

export const fetchComplaintComments = async (complaintId) => {
  try {
    const response = await API.get(`/complaints/${complaintId}/comments`);
    return response.data;
  } catch (error) {
    console.error('Error fetching comments:', error);
    throw error.response?.data?.msg || 'Failed to fetch comments';
  }
};

export const addCommentToComplaint = async (complaintId, commentData) => {
  try {
    const response = await API.post(`/complaints/${complaintId}/comments`, commentData);
    return response.data;
  } catch (error) {
    console.error('Error adding comment:', error);
    throw error.response?.data?.msg || 'Failed to add comment';
  }
};

export const escalateComplaint = async (id, escalationData) => {
  try {
    const response = await API.post(`/complaints/${id}/escalate`, escalationData);
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};

export const assignComplaint = async (id, assignmentData) => {
  try {
    const response = await API.put(`/complaints/${id}/assign`, assignmentData);
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};

// ========== COMPLAINT TYPE APIs ==========
export const createComplaintType = async (data) => {
  try {
    const response = await API.post('/complaints/types', data);
    return response.data;
  } catch (error) {
    throw error.response?.data || error.msg;
  }
};

export const getComplaintTypes = async () => {
  try {
    const response = await API.get('/complaints/types');
    return response.data;
  } catch (error) {
    throw error.response?.data || error.msg;
  }
};

export const updateComplaintType = async (id, complaintTypeData) => {
  try {
    const response = await API.put(`/complaints/types/${id}`, complaintTypeData);
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};

export const deleteComplaintType = async (id) => {
  try {
    const response = await API.delete(`/complaints/types/${id}`);
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};

// ========== WORKFLOW APIs ==========
export const createWorkflow = async (workflowData) => {
  try {
    const response = await API.post('/workflows', workflowData);
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};

export const getWorkflows = async () => {
  try {
    const response = await API.get('/workflows');
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};

export const getWorkflowById = async (id) => {
  try {
    const response = await API.get(`/workflows/${id}`);
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};

export const getWorkflowsByDepartment = async (departmentId) => {
  try {
    const response = await API.get(`/workflows/department/${departmentId}`);
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};

export const getWorkflowsByComplaintType = async (complaintTypeId) => {
  try {
    const response = await API.get(`/workflows/complaint-type/${complaintTypeId}`);
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};

export const getWorkflowForComplaint = async (complaintId) => {
  try {
    const response = await API.get(`/workflows/complaint/${complaintId}`);
    return response.data;
  } catch (error) {
    if (error.response?.status === 404) {
      return null;
    }
    throw error.response?.data || error.message;
  }
};

export const updateWorkflowStage = async (complaintId, stageData) => {
  try {
    const response = await API.put(`/workflows/complaint/${complaintId}/stage`, stageData);
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};

export const updateWorkflow = async (id, workflowData) => {
  try {
    const response = await API.put(`/workflows/${id}`, workflowData);
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};

export const deleteWorkflow = async (id) => {
  try {
    const response = await API.delete(`/workflows/${id}`);
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};

export const getWorkflowTemplates = async () => {
  try {
    const response = await API.get('/workflows/templates');
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};

export const getWorkflowTemplatesByCategory = async (category) => {
  try {
    const response = await API.get(`/workflows/templates/category/${category}`);
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};

export const getWorkflowTemplateById = async (id) => {
  try {
    const response = await API.get(`/workflows/templates/${id}`);
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};

export const createWorkflowFromTemplate = async (templateId, customizations) => {
  try {
    const response = await API.post('/workflows/from-template', {
      templateId,
      ...customizations
    });
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};

export const importWorkflowTemplates = async (data) => {
  try {
    const response = await API.post('/workflows/import-templates', data);
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};

// ========== NOTIFICATION APIs ==========
export const getNotifications = async (params = {}) => {
  try {
    const response = await API.get('/notifications', { params });
    return response.data;
  } catch (error) {
    console.error('Error fetching notifications:', error);
    throw error;
  }
};

export const getUnreadNotificationCount = async () => {
  try {
    const response = await API.get('/notifications/unread-count');
    return response.data.count;
  } catch (error) {
    console.error('Error fetching unread notification count:', error);
    throw error;
  }
};

export const markNotificationAsRead = async (notificationId) => {
  try {
    const response = await API.put(`/notifications/${notificationId}/read`);
    return response.data;
  } catch (error) {
    console.error('Error marking notification as read:', error);
    throw error;
  }
};

export const markAllNotificationsAsRead = async () => {
  try {
    const response = await API.put('/notifications/read-all');
    return response.data;
  } catch (error) {
    console.error('Error marking all notifications as read:', error);
    throw error;
  }
};

export const deleteNotification = async (notificationId) => {
  try {
    const response = await API.delete(`/notifications/${notificationId}`);
    return response.data;
  } catch (error) {
    console.error('Error deleting notification:', error);
    throw error;
  }
};

// ========== FEEDBACK APIs ==========
export const submitFeedback = async (feedbackData) => {
  try {
    const response = await API.post('/feedback', feedbackData);
    console.log('Feedback submitted successfully:', response.data);
    return response.data;
  } catch (error) {
    console.error('Error submitting feedback:', error.response?.data || error.message);
    throw error;
  }
};

export const getFeedbackByComplaint = async (complaintId) => {
  try {
    const response = await API.get(`/feedback/complaint/${complaintId}`);
    console.log('Feedback fetched successfully:', response.data);
    return response.data;
  } catch (error) {
    if (error.response?.status === 404) {
      return null;
    }
    console.error('Error fetching feedback:', error.response?.data || error.message);
    throw error;
  }
};

export const canProvideFeedback = async (complaintId) => {
  try {
    const response = await API.get(`/feedback/can-provide/${complaintId}`);
    console.log('Feedback eligibility checked:', response.data);
    return response.data;
  } catch (error) {
    console.error('Error checking feedback eligibility:', error.response?.data || error.message);
    throw error;
  }
};

export const getAllFeedback = async (params = {}) => {
  try {
    const queryParams = new URLSearchParams();
    
    if (params.page) queryParams.append('page', params.page);
    if (params.limit) queryParams.append('limit', params.limit);
    if (params.rating) queryParams.append('rating', params.rating);
    if (params.department) queryParams.append('department', params.department);

    const response = await API.get(`/feedback?${queryParams.toString()}`);
    console.log('All feedback fetched successfully:', response.data);
    return response.data;
  } catch (error) {
    console.error('Error fetching all feedback:', error.response?.data || error.message);
    throw error;
  }
};

export const getFeedbackStats = async () => {
  try {
    const response = await API.get('/feedback/stats');
    console.log('Feedback statistics fetched successfully:', response.data);
    return response.data;
  } catch (error) {
    console.error('Error fetching feedback statistics:', error.response?.data || error.message);
    throw error;
  }
};

export const getFeedbackStatsByDepartment = async (departmentId) => {
  try {
    const response = await API.get(`/feedback/department/${departmentId}/stats`);
    console.log('Department feedback statistics fetched successfully:', response.data);
    return response.data;
  } catch (error) {
    console.error('Error fetching department feedback statistics:', error.response?.data || error.message);
    throw error;
  }
};

export const getFeedbackByDepartment = async (departmentId, params = {}) => {
  try {
    const queryParams = new URLSearchParams();
    
    if (params.page) queryParams.append('page', params.page);
    if (params.limit) queryParams.append('limit', params.limit);
    if (params.rating) queryParams.append('rating', params.rating);

    const response = await API.get(`/feedback/department/${departmentId}?${queryParams.toString()}`);
    console.log('Department feedback fetched successfully:', response.data);
    return response.data;
  } catch (error) {
    console.error('Error fetching department feedback:', error.response?.data || error.message);
    throw error;
  }
};

// ========== ADDRESS APIs ==========
export const fetchAddressSuggestions = async (input) => {
  try {
    const response = await axios.get(OPENCAGE_API_URL, {
      params: { 
        q: input, 
        key: process.env.REACT_APP_OPENCAGE_API_KEY, 
        limit: 5 
      },
    });
    console.log('Address suggestions fetched successfully:', response.data.results);
    return response.data.results;
  } catch (error) {
    console.error('Error fetching address suggestions:', error.response?.data || error.message);
    throw new Error('Failed to fetch address suggestions. Please try again.');
  }
};

export default API;