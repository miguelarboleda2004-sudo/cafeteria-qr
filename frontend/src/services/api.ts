import axios from 'axios'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8000',
  headers: { 'Content-Type': 'application/json' }
})

api.interceptors.request.use((config) => {
  // Asegurar entrada directa: si no hay credencial, fija ADMIN
  if (!localStorage.getItem('sb-access-token') && !localStorage.getItem('access_token') && !localStorage.getItem('dev-role')) {
    localStorage.setItem('dev-role', 'ADMIN')
    localStorage.setItem('user-email', 'admin@cafeteria.local')
  }
  const token = localStorage.getItem('sb-access-token') || localStorage.getItem('access_token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  // Siempre enviar X-Dev-Role como fallback para backend (no molesta si hay JWT válido)
  const devRole = localStorage.getItem('dev-role')
  if (devRole) {
    config.headers['X-Dev-Role'] = devRole
  }
  return config
})

export default api

// Public API
export const publicApi = {
  getTable: (code: string) => api.get(`/api/public/tables/${code}`),
  getMenu: (code: string) => api.get(`/api/public/tables/${code}/menu`),
  createOrder: (data: any) => api.post(`/api/public/orders`, data),
  getOrder: (code: string) => api.get(`/api/public/orders/${code}`),
}

// Admin API
export const adminApi = {
  // dashboard
  getDashboard: () => api.get('/api/admin/dashboard'),
  // tables
  listTables: () => api.get('/api/admin/tables'),
  createTable: (data: any) => api.post('/api/admin/tables', data),
  updateTable: (id: string, data: any) => api.put(`/api/admin/tables/${id}`, data),
  deleteTable: (id: string) => api.delete(`/api/admin/tables/${id}`),
  getTable: (id: string) => api.get(`/api/admin/tables/${id}`),
  regenerateQR: (id: string) => api.post(`/api/admin/tables/${id}/regenerate-qr`),
  getQR: (id: string) => api.get(`/api/admin/tables/${id}/qr`),
  // categories
  listCategories: () => api.get('/api/admin/categories'),
  createCategory: (data: any) => api.post('/api/admin/categories', data),
  updateCategory: (id: string, data: any) => api.put(`/api/admin/categories/${id}`, data),
  deleteCategory: (id: string) => api.delete(`/api/admin/categories/${id}`),
  // products
  listProducts: (params?: any) => api.get('/api/admin/products', { params }),
  createProduct: (data: any) => api.post('/api/admin/products', data),
  updateProduct: (id: string, data: any) => api.put(`/api/admin/products/${id}`, data),
  deleteProduct: (id: string) => api.delete(`/api/admin/products/${id}`),
  uploadImage: (id: string, form: FormData) => api.post(`/api/admin/products/${id}/upload-image`, form, { headers: { 'Content-Type': 'multipart/form-data' } }),
  // orders
  listOrders: (params?: any) => api.get('/api/admin/orders', { params }),
  getOrder: (id: string) => api.get(`/api/admin/orders/${id}`),
  payOrder: (id: string, data: any) => api.post(`/api/admin/orders/${id}/pay`, data),
  startPrep: (id: string) => api.post(`/api/admin/orders/${id}/start-preparation`),
  ready: (id: string) => api.post(`/api/admin/orders/${id}/ready`),
  deliver: (id: string) => api.post(`/api/admin/orders/${id}/deliver`),
  cancel: (id: string) => api.post(`/api/admin/orders/${id}/cancel`),
  // sales
  getSales: (params?: any) => api.get('/api/admin/sales', { params }),
  getSalesSummary: (period?: string) => api.get('/api/admin/sales/summary', { params: { period } }),
}
