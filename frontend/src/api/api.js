import axios from 'axios';

const API_BASE_URL = 'http://localhost:5000/api';
const IMAGE_BASE_URL = 'http://localhost:5000/images';

const api = axios.create({
  baseURL: API_BASE_URL,
});

export { IMAGE_BASE_URL };

export const productsAPI = {
  getAll: () => api.get('/products'),
  getById: (id) => api.get(`/products/${id}`),
  create: (data) => api.post('/products', data),
  update: (id, data) => api.put(`/products/${id}`, data),
  delete: (id) => api.delete(`/products/${id}`),
};

export const ordersAPI = {
  getAll: (params) => api.get('/orders', { params }),
  getById: (id) => api.get(`/orders/${id}`),
  create: (data) => api.post('/orders', data),
  getTodayStats: () => api.get('/orders/today/stats'),
};

export const inventoryAPI = {
  getAll: () => api.get('/inventory'),
  getLowStock: (threshold) => api.get('/inventory/low-stock', { params: { threshold } }),
  update: (id, data) => api.put(`/inventory/${id}`, data),
  restock: (data) => api.post('/inventory/restock', data),
};

export const reportsAPI = {
  getDaily: (date) => api.get('/reports/daily', { params: { date } }),
  getMonthly: (month) => api.get('/reports/monthly', { params: { month } }),
  getYearly: (year) => api.get('/reports/yearly', { params: { year } }),
  getSalesByCategory: (params) => api.get('/reports/sales-by-category', { params }),
  getTopProducts: (params) => api.get('/reports/top-products', { params }),
  getMonthlyRevenue: (year) => api.get('/reports/monthly-revenue', { params: { year } }),
  getProfitAnalysis: (params) => api.get('/reports/profit-analysis', { params }),
};

export const paymentsAPI = {
  createPayment: (amount) => api.post('/payments/create', { amount }),
  checkStatus: (token) => api.get(`/payments/status/${token}`),
};

export const authAPI = {
  login: (credentials) => api.post('/auth/login', credentials),
  verify: () => api.get('/auth/verify'),
};

export default api;
