// src/services/apiService.js
import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

// Helper functions to get stored credentials
const getStoredPassword = () => {
  return sessionStorage.getItem('userPasskey') || '';
};

const getStoredToken = () => {
  return sessionStorage.getItem('token') || '';
};

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  }
});

// Add auth headers to every request
api.interceptors.request.use(
  (config) => {
    const token = getStoredToken();
    const passkey = getStoredPassword();
    
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    // Add passkey header for authenticated requests
    if (passkey) {
      config.headers['X-User-Passkey'] = passkey;
    }
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Unauthorized - clear session and redirect to login
      sessionStorage.clear();
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// ==================== AUTH API ====================

export const authAPI = {
  register: async (email, password) => {
    try {
      const response = await axios.post(`${API_BASE_URL}/register`, {
        email,
        password
      });
      return response.data;
    } catch (error) {
      throw error.response?.data?.error || 'Registration failed';
    }
  },

  login: async (email, password) => {
    try {
      const response = await axios.post(`${API_BASE_URL}/login`, {
        email,
        password
      });
      
      if (response.data.token) {
        // Store credentials for future API calls
        sessionStorage.setItem('token', response.data.token);
        sessionStorage.setItem('userPasskey', password);
        sessionStorage.setItem('userEmail', email);
        sessionStorage.setItem('userId', response.data.user_id);
      }
      
      return response.data;
    } catch (error) {
      throw error.response?.data?.error || 'Login failed';
    }
  },

  logout: () => {
    sessionStorage.clear();
  },

  isAuthenticated: () => {
    return !!getStoredToken() && !!getStoredPassword();
  },

  getCurrentUser: () => {
    return {
      email: sessionStorage.getItem('userEmail'),
      userId: sessionStorage.getItem('userId'),
      token: getStoredToken()
    };
  }
};

// ==================== TRANSACTION API ====================

export const transactionAPI = {
  getAll: async () => {
    try {
      const response = await api.get('/transactions');
      return response.data;
    } catch (error) {
      throw error.response?.data?.error || 'Failed to fetch transactions';
    }
  },

  add: async (transaction) => {
    try {
      const response = await api.post('/transactions', transaction);
      return response.data;
    } catch (error) {
      throw error.response?.data?.error || 'Failed to add transaction';
    }
  },

  addBulk: async (transactions) => {
    try {
      const response = await api.post('/transactions', transactions);
      return response.data;
    } catch (error) {
      throw error.response?.data?.error || 'Failed to add transactions';
    }
  },

  update: async (id, data) => {
    try {
      const response = await api.put(`/transactions/${id}`, data);
      return response.data;
    } catch (error) {
      throw error.response?.data?.error || 'Failed to update transaction';
    }
  },

  delete: async (id) => {
    try {
      const response = await api.delete(`/transactions/${id}`);
      return response.data;
    } catch (error) {
      throw error.response?.data?.error || 'Failed to delete transaction';
    }
  }
};

// ==================== BUDGET API ====================

export const budgetAPI = {
  get: async (month) => {
    try {
      const params = month ? { month } : {};
      const response = await api.get('/budgets', { params });
      return response.data;
    } catch (error) {
      throw error.response?.data?.error || 'Failed to fetch budgets';
    }
  },

  set: async (month, budgets) => {
    try {
      const response = await api.post('/budgets', { month, budgets });
      return response.data;
    } catch (error) {
      throw error.response?.data?.error || 'Failed to save budgets';
    }
  }
};

// ==================== STATS API ====================

export const statsAPI = {
  get: async () => {
    try {
      const response = await api.get('/stats');
      return response.data;
    } catch (error) {
      throw error.response?.data?.error || 'Failed to fetch stats';
    }
  },

  clearAll: async () => {
    try {
      const response = await api.post('/clear');
      return response.data;
    } catch (error) {
      throw error.response?.data?.error || 'Failed to clear data';
    }
  }
};

// ==================== SYSTEM API ====================

export const systemAPI = {
  healthCheck: async () => {
    try {
      const response = await axios.get('http://localhost:5000/');
      return response.data;
    } catch (error) {
      throw 'Backend is not running';
    }
  },

  getSystemStats: async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/system/stats`);
      return response.data;
    } catch (error) {
      throw error.response?.data?.error || 'Failed to fetch system stats';
    }
  }
};

export default api;
