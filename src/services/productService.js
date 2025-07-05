import axios from 'axios';

const API_URL = 'http://localhost:5000/api';

const productService = {
  getAllProducts: async (filters = {}, token) => {
    const queryString = new URLSearchParams(filters).toString();
    const response = await axios.get(`${API_URL}/products?${queryString}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
  },

  createProduct: async (productData, token) => {
    const response = await axios.post(`${API_URL}/products`, productData, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
  },

  updateProduct: async (id, productData, token) => {
    const response = await axios.put(`${API_URL}/products/${id}`, productData, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
  },

  deleteProduct: async (id, token) => {
    const response = await axios.delete(`${API_URL}/products/${id}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
  },

  updateStock: async (id, stockData, token) => {
    const response = await axios.patch(`${API_URL}/products/${id}/stock`, stockData, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
  },

  bulkUpload: async (fileData, token) => {
    const formData = new FormData();
    formData.append('file', fileData);
    const response = await axios.post(`${API_URL}/products/bulk`, formData, {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'multipart/form-data'
      }
    });
    return response.data;
  }
};

export default productService;