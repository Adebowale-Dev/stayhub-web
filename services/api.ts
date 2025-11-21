import axios from 'axios';
import useAuthStore from '../store/useAuthStore';

// Create axios instance
const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api',
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000, // 10 second timeout
});

// Request interceptor - Add auth token
api.interceptors.request.use(
  (config) => {
    const token = useAuthStore.getState().token;
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor - Handle auth errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid
      useAuthStore.getState().logout();
      if (typeof window !== 'undefined') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

// Auth API methods
export const authAPI = {
  login: (credentials: { identifier: string; password: string }) =>
    api.post('/auth/login', credentials),

  logout: () => api.post('/auth/logout'),

  getProfile: () => api.get('/auth/profile'),

  forgotPassword: (email: string) => api.post('/auth/forgot-password', { email }),

  resetPassword: (token: string, newPassword: string) =>
    api.post('/auth/reset-password', { token, newPassword }),

  changePassword: (oldPassword: string, newPassword: string) =>
    api.post('/auth/change-password', { oldPassword, newPassword }),
};

// Admin API methods
export const adminAPI = {
  getDashboard: () => api.get('/admin/dashboard'),
  search: (params: Record<string, unknown>) => api.get('/admin/search', { params }),

  // Colleges
  getColleges: () => api.get('/admin/colleges'),
  getCollegeStatistics: () => api.get('/admin/colleges/statistics'),
  createCollege: (data: Record<string, unknown>) => api.post('/admin/colleges', data),
  updateCollege: (id: string, data: Record<string, unknown>) => api.put(`/admin/colleges/${id}`, data),
  deleteCollege: (id: string, force?: boolean) => api.delete(`/admin/colleges/${id}?force=${force || false}`),

  // Departments
  getDepartments: () => api.get('/admin/departments'),
  getDepartmentsByCollege: (collegeId: string) => api.get(`/admin/colleges/${collegeId}/departments`),
  createDepartment: (collegeId: string, data: Record<string, unknown>) => api.post(`/admin/colleges/${collegeId}/departments`, data),
  updateDepartment: (collegeId: string, deptId: string, data: Record<string, unknown>) => api.put(`/admin/colleges/${collegeId}/departments/${deptId}`, data),
  deleteDepartment: (collegeId: string, deptId: string, force?: boolean) => api.delete(`/admin/colleges/${collegeId}/departments/${deptId}?force=${force || false}`),

  // Students
  getStudentsByCollege: (collegeId: string, params?: Record<string, unknown>) => api.get(`/admin/colleges/${collegeId}/students`, { params }),
  getStudentsByDepartment: (collegeId: string, deptId: string, params?: Record<string, unknown>) => api.get(`/admin/colleges/${collegeId}/departments/${deptId}/students`, { params }),

  // Students
  getStudents: () => api.get('/admin/students'),
  createStudent: (data: Record<string, unknown>) => api.post('/admin/students', data),
  updateStudent: (id: string, data: Record<string, unknown>) => api.put(`/admin/students/${id}`, data),
  deleteStudent: (id: string, permanent?: boolean) => api.delete(`/admin/students/${id}?permanent=${permanent || false}`),
  bulkUploadStudents: (formData: FormData) =>
    api.post('/admin/students/bulk-upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),

  // Hostels
  getHostels: () => api.get('/admin/hostels'),
  createHostel: (data: Record<string, unknown>) => api.post('/admin/hostels', data),
  updateHostel: (id: string, data: Record<string, unknown>) => api.put(`/admin/hostels/${id}`, data),
  deleteHostel: (id: string) => api.delete(`/admin/hostels/${id}`),

  // Rooms
  getRooms: () => api.get('/admin/rooms'),
  createRoom: (data: Record<string, unknown>) => api.post('/admin/rooms', data),
  updateRoom: (id: string, data: Record<string, unknown>) => api.put(`/admin/rooms/${id}`, data),
  deleteRoom: (id: string) => api.delete(`/admin/rooms/${id}`),

  // Porters
  getPorters: () => api.get('/admin/porters'),
  approvePorter: (porterId: string, hostelId: string) =>
    api.post('/admin/porters/approve', { porterId, hostelId }),

  // Payments
  getPayments: (params?: Record<string, unknown>) => api.get('/admin/payments', { params }),
  getPaymentStats: () => api.get('/admin/payment/stats'),
  getPaymentAmount: () => api.get('/admin/payment/amount'),
  setPaymentAmount: (amount: number) => api.post('/admin/payment/set-amount', { amount }),
};

// Student API methods
export const studentAPI = {
  getDashboard: () => api.get('/student/dashboard'),
  getHostels: () => api.get('/student/hostels'),
  getRooms: (hostelId: string) => api.get(`/student/hostels/${hostelId}/rooms`),
  getBunks: (roomId: string) => api.get(`/student/rooms/${roomId}/bunks`),
  reserveRoom: (data: Record<string, unknown>) => api.post('/student/reserve', data),
  getReservation: () => api.get('/student/reservation'),
};

// Porter API methods
export const porterAPI = {
  apply: (data: Record<string, unknown>) => api.post('/porter/apply', data),
  getDashboard: () => api.get('/porter/dashboard'),
  getStudents: () => api.get('/porter/students'),
  getRooms: () => api.get('/porter/rooms'),
  checkInStudent: (studentId: string) => api.post(`/porter/checkin/${studentId}`),
  releaseExpired: () => api.post('/porter/release-expired'),
};

// Payment API methods
export const paymentAPI = {
  getAmount: () => api.get('/payment/amount'),
  initialize: (amount: number) => api.post('/payment/initialize', { amount }),
  getStatus: () => api.get('/payment/status'),
  verify: (reference: string) => api.get(`/payment/verify/${reference}`),
};

export default api;
