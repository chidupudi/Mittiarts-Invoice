import api from './axiosConfig';

const API_URL = '/bills';

const createBill = async (billData) => {
  const response = await api.post(API_URL, billData);
  return response.data;
};

const getBills = async (params) => {
  const response = await api.get(API_URL, { params });
  return response.data;
};

const getBill = async (id) => {
  const response = await api.get(`${API_URL}/${id}`);
  return response.data;
};

const updateBill = async (id, billData) => {
  const response = await api.patch(`${API_URL}/${id}`, billData);
  return response.data;
};

const billService = {
  createBill,
  getBills,
  getBill,
  updateBill
};

export default billService;