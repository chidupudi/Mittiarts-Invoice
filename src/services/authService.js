import axios from 'axios';

const API_URL = 'http://localhost:5000/api';

const authService = {
  login: async (credentials) => {
    const response = await axios.post(`${API_URL}/users/login`, credentials);
    // After successful login:
    localStorage.setItem('token', response.data.token);
    return response.data;
  },

  register: async (userData) => {
    const response = await axios.post(`${API_URL}/users/register`, userData);
    return response.data;
  },

  changePassword: async (passwordData, token) => {
    const response = await axios.post(
      `${API_URL}/users/change-password`,
      passwordData,
      {
        headers: { Authorization: `Bearer ${token}` }
      }
    );
    return response.data;
  },
};

export default authService;