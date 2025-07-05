import api from './axiosConfig';

const ORDERS_URL = '/orders';

const createOrder = async (orderData) => {
  const response = await api.post(ORDERS_URL, orderData);
  return response.data;
};

const getOrders = async (params) => {
  const response = await api.get(ORDERS_URL, { params });
  return response.data;
};

const getOrder = async (id) => {
  const response = await api.get(`${ORDERS_URL}/${id}`);
  return response.data;
};

const cancelOrder = async (id) => {
  const response = await api.put(`${ORDERS_URL}/${id}/cancel`);
  return response.data;
};

const orderService = {
  createOrder,
  getOrders,
  getOrder,
  cancelOrder
};

export default orderService;