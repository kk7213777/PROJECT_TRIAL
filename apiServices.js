//This is src/services/apiServices.js


import axios from 'axios';

const API = axios.create({
  baseURL: 'http://localhost:8080/',
});

export const apiService = {
  fetchUserProfile: async (token) => {
    try {
      const response = await API.get('/user-profile', {
        headers: { Authorization: `Bearer ${token}` },
      });
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to fetch user profile');
    }
  },

  // Update user profile
  updateUserProfile: async ({ name, profile_pic }, token) => {
    try {
      const response = await API.put(
        '/update-user',
        { name, profile_pic },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to update user profile');
    }
  },

  // Update password
  updatePassword: async ({ currentPassword, newPassword }, token) => {
    try {
      const response = await API.put(
        '/update-user-password',
        { currentPassword, newPassword },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Password update failed');
    }
  },

  // Login
  login: async ({ email, password }) => {
    try {
      const response = await API.post('/login', { email, password });
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Login failed');
    }
  },

  // Register a new user
  signUp: async ({ name, email, password, profile_pic }) => {
    try {
      const response = await API.post('/register', { name, email, password, profile_pic });
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Sign Up failed');
    }
  },

  // Check if email exists
  checkEmail: async (email) => {
    try {
      const response = await API.post('/check-email', { email });
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Email check failed');
    }
  },

  // Search for a user
  searchUser: async (searchTerm, token) => {
    try {
      const response = await API.get(`/search-user?query=${encodeURIComponent(searchTerm)}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Search failed');
    }
  },

  // Fetch protected route
  fetchProtectedRoute: async (token) => {
    try {
      const response = await API.get('/protected', {
        headers: { Authorization: `Bearer ${token}` },
      });
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Access to protected route failed');
    }
  },

  fetchConversations: async (token) => {
    try {
      const response = await API.get('/conversations', {
        headers: { Authorization: `Bearer ${token}` },
      });
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to fetch conversations');
    }
  },

  // Logout user
  logout: async (token) => {
    try {
      const response = await API.post(
        '/logout',
        {},
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Logout failed');
    }
  },
};
