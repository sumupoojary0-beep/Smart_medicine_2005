/**
 * Admin Manage Service (ADMIN role only)
 *
 *  GET  /admin/overview
 *  GET  /admin/users?q=&role=&status=&page=&page_size=
 *  POST /admin/users/:id/status   { status: 'ACTIVE' | 'SUSPENDED' }
 *  POST /admin/users/:id/role     { role: 'USER' | 'ADMIN' }
 *  GET  /admin/medicines?q=&category=&visibility=&page=
 *  POST /admin/medicines            PUT /admin/medicines/:code
 *  POST /admin/medicines/:code/hide | show
 */

import axiosClient from '../config/axiosClient'

const adminManageService = {
  getOverview: () => axiosClient.get('/admin/overview'),

  listUsers: (params) => axiosClient.get('/admin/users', { params }),
  setUserStatus: (id, status) => axiosClient.post(`/admin/users/${id}/status`, { status }),
  setUserRole: (id, role) => axiosClient.post(`/admin/users/${id}/role`, { role }),

  listMedicines: (params) => axiosClient.get('/admin/medicines', { params }),
  createMedicine: (data) => axiosClient.post('/admin/medicines', data),
  updateMedicine: (code, data) => axiosClient.put(`/admin/medicines/${encodeURIComponent(code)}`, data),
  hideMedicine: (code) => axiosClient.post(`/admin/medicines/${encodeURIComponent(code)}/hide`),
  showMedicine: (code) => axiosClient.post(`/admin/medicines/${encodeURIComponent(code)}/show`),

  // Roles, settings, broadcasts, generic mapping
  getRoles: () => axiosClient.get('/admin/roles'),
  getSettings: () => axiosClient.get('/admin/settings'),
  saveSettings: (data) => axiosClient.put('/admin/settings', data),
  listBroadcasts: () => axiosClient.get('/admin/notifications/broadcasts'),
  sendBroadcast: (data) => axiosClient.post('/admin/notifications/broadcast', data),
  listMappings: (q) => axiosClient.get('/admin/generic-mappings', { params: { q: q || undefined } }),
  saveMapping: (data) => axiosClient.put('/admin/generic-mappings', data),
  deleteMapping: (brand) => axiosClient.delete(`/admin/generic-mappings/${encodeURIComponent(brand)}`),
  testMapping: (query) => axiosClient.post('/admin/generic-mappings/test', { query }),
}

export default adminManageService