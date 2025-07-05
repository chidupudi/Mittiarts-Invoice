import api from './axiosConfig';

const customerService = {
  // Get all customers with filters
  getCustomers: async (params) => {
    const response = await api.get('/customers', { params });
    return response.data;
  },

  // Get single customer
  getCustomer: async (id) => {
    const response = await api.get(`/customers/${id}`);
    return response.data;
  },

  // Update customer
  updateCustomer: async (id, customerData) => {
    const response = await api.patch(`/customers/${id}`, customerData);
    return response.data;
  },

  // Delete customer
  deleteCustomer: async (id) => {
    const response = await api.delete(`/customers/${id}`);
    return response.data;
  }
};

export default customerService;