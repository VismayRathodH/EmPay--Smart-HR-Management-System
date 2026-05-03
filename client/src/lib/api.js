const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';
const TOKEN_KEY = 'empay_token';
const USER_KEY = 'empay_user';

export const authStorage = {
  getToken() {
    return localStorage.getItem(TOKEN_KEY);
  },
  getUser() {
    const value = localStorage.getItem(USER_KEY);
    return value ? JSON.parse(value) : null;
  },
  setSession({ token, user }) {
    localStorage.setItem(TOKEN_KEY, token);
    localStorage.setItem(USER_KEY, JSON.stringify(user));
  },
  clearSession() {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
  },
};

async function request(path, options = {}) {
  const token = authStorage.getToken();
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {}),
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers,
  });

  const contentType = response.headers.get('content-type') || '';
  const data = contentType.includes('application/json') ? await response.json() : await response.text();

  if (!response.ok) {
    const detail = typeof data === 'object' && data?.detail ? data.detail : 'Request failed';
    throw new Error(Array.isArray(detail) ? detail.map((item) => item.msg).join(', ') : detail);
  }

  return data;
}

export const api = {
  // Health & Auth
  health: () => request('/health', { method: 'GET' }),
  login: (credentials) => request('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify(credentials),
  }),
  logout: () => {
    authStorage.clearSession();
  },
  me: () => request('/api/auth/me', { method: 'GET' }),
  register: (payload) => request('/api/auth/register', {
    method: 'POST',
    body: JSON.stringify(payload),
  }),
  updateProfile: (payload) => request('/api/auth/update-profile', {
    method: 'PATCH',
    body: JSON.stringify(payload),
  }),
  changePassword: (payload) => request('/api/auth/change-password', {
    method: 'POST',
    body: JSON.stringify(payload),
  }),

  // Employees
  employees: (department) => request(`/api/employees${department ? `?department=${encodeURIComponent(department)}` : ''}`),
  getEmployee: (id) => request(`/api/employees/${id}`),
  createEmployee: (payload) => request('/api/employees', {
    method: 'POST',
    body: JSON.stringify(payload),
  }),
  updateEmployee: (id, payload) => request(`/api/employees/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  }),
  deleteEmployee: (id) => request(`/api/employees/${id}`, {
    method: 'DELETE',
  }),

  // Attendance
  attendanceLogs: (params = {}) => {
    const query = new URLSearchParams(
      Object.entries(params).filter(([, value]) => value !== undefined && value !== null && value !== '')
    ).toString();
    return request(`/api/attendance/logs${query ? `?${query}` : ''}`);
  },
  markAttendance: (payload) => request('/api/attendance/mark', {
    method: 'POST',
    body: JSON.stringify(payload),
  }),

  // Leave Management
  leaveRequests: () => request('/api/leave/list'),
  getLeaveBalance: () => request('/api/leave/balance'),
  applyLeave: (payload) => request('/api/leave/apply', {
    method: 'POST',
    body: JSON.stringify(payload),
  }),
  updateLeave: (id, action, remarks = '') => request(`/api/leave/approve/${id}`, {
    method: 'PATCH',
    body: JSON.stringify({ action, remarks }),
  }),

  // Payroll
  payruns: () => request('/api/payroll/payruns'),
  createPayrun: (payload) => request('/api/payroll/payrun', {
    method: 'POST',
    body: JSON.stringify(payload),
  }),
  payslips: () => request('/api/payroll/payslips'),
  getPayslip: (id) => request(`/api/payroll/payslip/${id}`),
  downloadPayslipPdf: async (id) => {
    const token = authStorage.getToken();
    const response = await fetch(`${API_BASE_URL}/api/payroll/payslip/${id}/pdf`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    if (!response.ok) throw new Error('Failed to download PDF');
    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `payslip_${id}.pdf`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  },
  downloadPayrollReport: async (payrunId) => {
    const token = authStorage.getToken();
    const response = await fetch(`${API_BASE_URL}/api/payroll/payrun/${payrunId}/report`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ detail: 'Failed to download report' }));
      throw new Error(errorData.detail || 'Failed to download report');
    }
    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Payroll_Report_${payrunId}.xlsx`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  },

  // AI Insights
  getAISuggestion: (payload) => request('/api/ai/suggest', {
    method: 'POST',
    body: JSON.stringify(payload),
  }),
  checkAIHealth: () => request('/api/ai/health'),
};
