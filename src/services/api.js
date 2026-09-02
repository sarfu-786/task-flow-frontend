export const getApiBaseUrl = () => {
  // 1. If running in browser and on local machine
  if (
    typeof window !== 'undefined' &&
    (window.location.hostname === 'localhost' ||
      window.location.hostname === '127.0.0.1' ||
      window.location.hostname === '0.0.0.0')
  ) {
    return 'http://localhost:5000/api';
  }

  // 2. If an environment variable is explicitly set to a valid remote HTTPS URL
  const envUrl = import.meta.env.VITE_API_BASE_URL;
  if (
    envUrl &&
    typeof envUrl === 'string' &&
    envUrl.startsWith('https://') &&
    !envUrl.includes('localhost') &&
    !envUrl.includes('127.0.0.1')
  ) {
    return envUrl.replace(/\/+$/, '');
  }

  // 3. Default to live deployed Render backend for Vercel and all production domains
};

const getBaseUrl = () => getApiBaseUrl();
const API_BASE_URL = getApiBaseUrl();

const getAuthHeaders = () => {
  const token = localStorage.getItem('taskflow_token');
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
};

export const api = {
  // Auth API
  async register(userData) {
    const res = await fetch(`${getBaseUrl()}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(userData),
    });
    const data = await res.json();
    if (!res.ok) {
      const err = new Error(data.message || 'Registration failed. Please check your inputs.');
      err.status = res.status;
      throw err;
    }
    return data;
  },

  async login(usernameOrEmail, password) {
    const res = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ usernameOrEmail, password }),
    });
    const data = await res.json();
    if (!res.ok) {
      const err = new Error(data.message || 'Login failed. Please check your credentials.');
      err.status = res.status;
      err.approvalStatus = data.approvalStatus;
      throw err;
    }
    return data;
  },

  async forgotPassword(usernameOrEmail) {
    const res = await fetch(`${API_BASE_URL}/auth/forgot-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ usernameOrEmail }),
    });
    const data = await res.json();
    if (!res.ok) {
      const err = new Error(data.message || 'Failed to generate OTP');
      err.status = res.status;
      throw err;
    }
    return data;
  },

  async verifyOtp(usernameOrEmail, otp) {
    const res = await fetch(`${API_BASE_URL}/auth/verify-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ usernameOrEmail, otp }),
    });
    const data = await res.json();
    if (!res.ok) {
      const err = new Error(data.message || 'Invalid or expired OTP');
      err.status = res.status;
      throw err;
    }
    return data;
  },

  async resetPassword(usernameOrEmail, otp, newPassword) {
    const res = await fetch(`${API_BASE_URL}/auth/reset-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ usernameOrEmail, otp, newPassword }),
    });
    const data = await res.json();
    if (!res.ok) {
      const err = new Error(data.message || 'Failed to reset password');
      err.status = res.status;
      throw err;
    }
    return data;
  },

  async getProfile() {
    const res = await fetch(`${API_BASE_URL}/auth/me`, {
      method: 'GET',
      headers: getAuthHeaders(),
    });
    const data = await res.json();
    if (!res.ok) {
      const err = new Error(data.message || 'Failed to fetch user profile');
      err.status = res.status;
      throw err;
    }
    return data;
  },

  // Task API
  async getTasks(params = {}) {
    const query = new URLSearchParams();
    if (params.search) query.append('search', params.search);
    if (params.taskType && params.taskType !== 'all') query.append('taskType', params.taskType);
    if (params.status && params.status !== 'all') query.append('status', params.status);
    if (params.assignedTo && params.assignedTo !== 'all') query.append('assignedTo', params.assignedTo);
    if (params.myTasksOnly) query.append('myTasksOnly', 'true');

    const queryString = query.toString() ? `?${query.toString()}` : '';
    const res = await fetch(`${API_BASE_URL}/tasks${queryString}`, {
      method: 'GET',
      headers: getAuthHeaders(),
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.message || 'Failed to fetch tasks');
    }
    return data;
  },

  async getStats(params = {}) {
    const query = new URLSearchParams();
    if (params.myTasksOnly) query.append('myTasksOnly', 'true');
    const queryString = query.toString() ? `?${query.toString()}` : '';

    const res = await fetch(`${API_BASE_URL}/tasks/stats${queryString}`, {
      method: 'GET',
      headers: getAuthHeaders(),
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.message || 'Failed to fetch task statistics');
    }
    return data;
  },

  async createTask(taskData) {
    const res = await fetch(`${API_BASE_URL}/tasks`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(taskData),
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.message || 'Failed to create task');
    }
    return data;
  },

  async updateTask(id, taskData) {
    const res = await fetch(`${API_BASE_URL}/tasks/${id}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(taskData),
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.message || 'Failed to update task');
    }
    return data;
  },

  async updateTaskStatus(id, status, completionRemark = '') {
    const res = await fetch(`${API_BASE_URL}/tasks/${id}/status`, {
      method: 'PATCH',
      headers: getAuthHeaders(),
      body: JSON.stringify({ status, completionRemark }),
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.message || 'Failed to update task status');
    }
    return data;
  },

  async completeTaskWithRemark(id, completionRemark) {
    return this.updateTaskStatus(id, 'Completed', completionRemark);
  },

  async deleteTask(id) {
    const res = await fetch(`${API_BASE_URL}/tasks/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.message || 'Failed to delete task');
    }
    return data;
  },

  // Notification / Manager Inbox API
  async getNotifications() {
    const res = await fetch(`${API_BASE_URL}/notifications`, {
      method: 'GET',
      headers: getAuthHeaders(),
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.message || 'Failed to fetch notifications');
    }
    return data;
  },

  async markNotificationRead(id) {
    const res = await fetch(`${API_BASE_URL}/notifications/${id}/read`, {
      method: 'PATCH',
      headers: getAuthHeaders(),
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.message || 'Failed to update notification');
    }
    return data;
  },

  async markAllNotificationsRead() {
    const res = await fetch(`${API_BASE_URL}/notifications/mark-all-read`, {
      method: 'PATCH',
      headers: getAuthHeaders(),
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.message || 'Failed to update all notifications');
    }
    return data;
  },

  async deleteNotification(id) {
    const res = await fetch(`${API_BASE_URL}/notifications/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.message || 'Failed to delete notification');
    }
    return data;
  },

  async clearNotifications() {
    const res = await fetch(`${API_BASE_URL}/notifications`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.message || 'Failed to clear notifications');
    }
    return data;
  },

  async clearAllNotifications() {
    return this.clearNotifications();
  },

  // User Management API
  async getUsers(params = {}) {
    const query = new URLSearchParams();
    if (params.search) query.append('search', params.search);
    if (params.role && params.role !== 'all') query.append('role', params.role);
    if (params.department && params.department !== 'all') query.append('department', params.department);

    const queryString = query.toString() ? `?${query.toString()}` : '';
    const res = await fetch(`${API_BASE_URL}/users${queryString}`, {
      method: 'GET',
      headers: getAuthHeaders(),
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.message || 'Failed to fetch users');
    }
    return data;
  },

  async createUser(userData) {
    const res = await fetch(`${API_BASE_URL}/users`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(userData),
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.message || 'Failed to create user');
    }
    return data;
  },

  async updateUser(id, userData) {
    const res = await fetch(`${API_BASE_URL}/users/${id}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(userData),
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.message || 'Failed to update user');
    }
    return data;
  },

  async deleteUser(id) {
    const res = await fetch(`${API_BASE_URL}/users/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.message || 'Failed to remove user');
    }
    return data;
  },

  // Registration Approvals API
  async getUserApprovals(params = {}) {
    const query = new URLSearchParams();
    if (params.status && params.status !== 'all') query.append('status', params.status);
    if (params.search) query.append('search', params.search);

    const queryString = query.toString() ? `?${query.toString()}` : '';
    const res = await fetch(`${API_BASE_URL}/users/approvals${queryString}`, {
      method: 'GET',
      headers: getAuthHeaders(),
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.message || 'Failed to fetch user approvals');
    }
    return data;
  },

  async updateUserApproval(id, approvalData) {
    const res = await fetch(`${API_BASE_URL}/users/${id}/approval`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(approvalData),
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.message || 'Failed to update approval status');
    }
    return data;
  },
};
