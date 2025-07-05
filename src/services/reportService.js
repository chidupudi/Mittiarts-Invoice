import api from './axiosConfig';

const reportService = {
  getReport: async (params) => {
    try {
      const response = await api.get('/reports/sales', { params });
      return response.data;
    } catch (error) {
      throw error;
    }
  }
};

export default reportService;