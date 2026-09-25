let cachedBaseUrl = null;

export const getApiBaseUrl = () => {
  if (cachedBaseUrl) return cachedBaseUrl;

  // 1. If running in browser and on local machine or local LAN
  if (typeof window !== 'undefined') {
    const host = window.location.hostname;
    if (host === 'localhost' || host === '127.0.0.1' || host === '0.0.0.0') {
      cachedBaseUrl = 'http://localhost:5000/api';
      return cachedBaseUrl;
    }
    // LAN IP support for mobile testing on local network (192.168.x.x, 10.x.x.x, 172.x.x.x)
    if (/^(192\.168\.|10\.|172\.(1[6-9]|2\d|3[01])\.)/.test(host)) {
      cachedBaseUrl = `http://${host}:5000/api`;
      return cachedBaseUrl;
    }
  }

  // 2. If environment variable is explicitly configured
  const envUrl = import.meta.env.VITE_API_BASE_URL;
  if (
    envUrl &&
    typeof envUrl === 'string' &&
    envUrl.startsWith('http') &&
    !envUrl.includes('localhost') &&
    !envUrl.includes('127.0.0.1')
  ) {
    cachedBaseUrl = envUrl.replace(/\/+$/, '');
    return cachedBaseUrl;
  }

  // 3. Default to live deployed backend
  cachedBaseUrl = 'https://task-flow-backend-f0gp.onrender.com/api';
  return cachedBaseUrl;
};

const getBaseUrl = () => getApiBaseUrl();

// Immediate non-blocking background server pre-warming (wakes up cold-starting Render instances)
let isPrewarmed = false;
export const prewarmBackend = async () => {
  if (isPrewarmed || typeof window === 'undefined') return;
  try {
    const url = `${getBaseUrl()}/health`;
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 12000);
    fetch(url, { method: 'GET', signal: controller.signal, mode: 'cors' })
      .then(() => {
        isPrewarmed = true;
        clearTimeout(timer);
      })
      .catch(() => {
        clearTimeout(timer);
      });
  } catch {
    // non-blocking
  }
};

// Trigger prewarm immediately on script evaluation
if (typeof window !== 'undefined') {
  setTimeout(() => {
    prewarmBackend();
  }, 10);
}

// Fast, timeout-protected fetch helper with 15s timeout
const fetchWithTimeout = async (url, options = {}, timeoutMs = 15000) => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    // If session expired or token rejected on protected routes, notify AuthContext
    if (response.status === 401 && !url.includes('/auth/login') && !url.includes('/auth/forgot-password')) {
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('taskflow:unauthorized'));
      }
    }

    return response;
  } catch (err) {
    clearTimeout(timeoutId);
    if (err.name === 'AbortError') {
      throw new Error('Request timed out. Please check your internet connection.');
    }
    throw err;
  }
};

const getAuthHeaders = () => {
  const token =
    (typeof window !== 'undefined' &&
      (localStorage.getItem('taskflow_token') || sessionStorage.getItem('taskflow_token'))) ||
    null;
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
};

export const api = {
  // Auth API
  async register(userData) {
    const res = await fetchWithTimeout(`${getBaseUrl()}/auth/register`, {
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
    const res = await fetchWithTimeout(`${getBaseUrl()}/auth/login`, {
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
    const res = await fetchWithTimeout(`${getBaseUrl()}/auth/forgot-password`, {
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
    const res = await fetchWithTimeout(`${getBaseUrl()}/auth/verify-otp`, {
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
    const res = await fetchWithTimeout(`${getBaseUrl()}/auth/reset-password`, {
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
    const res = await fetchWithTimeout(`${getBaseUrl()}/auth/me`, {
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

  async updateProfile(profileData) {
    const res = await fetchWithTimeout(`${getBaseUrl()}/auth/profile`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(profileData),
    });
    const data = await res.json();
    if (!res.ok) {
      const err = new Error(data.message || 'Failed to update profile details');
      err.status = res.status;
      throw err;
    }
    if (data.token) {
      sessionStorage.setItem('taskflow_token', data.token);
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
    const res = await fetchWithTimeout(`${getBaseUrl()}/tasks${queryString}`, {
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

    const res = await fetchWithTimeout(`${getBaseUrl()}/tasks/stats${queryString}`, {
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
    const res = await fetchWithTimeout(`${getBaseUrl()}/tasks`, {
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
    const res = await fetchWithTimeout(`${getBaseUrl()}/tasks/${id}`, {
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
    const res = await fetchWithTimeout(`${getBaseUrl()}/tasks/${id}/status`, {
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
    const res = await fetchWithTimeout(`${getBaseUrl()}/tasks/${id}`, {
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
    const res = await fetchWithTimeout(`${getBaseUrl()}/notifications`, {
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
    const res = await fetchWithTimeout(`${getBaseUrl()}/notifications/${id}/read`, {
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
    const res = await fetchWithTimeout(`${getBaseUrl()}/notifications/mark-all-read`, {
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
    const res = await fetchWithTimeout(`${getBaseUrl()}/notifications/${id}`, {
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
    const res = await fetchWithTimeout(`${getBaseUrl()}/notifications`, {
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
    const res = await fetchWithTimeout(`${getBaseUrl()}/users${queryString}`, {
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
    const res = await fetchWithTimeout(`${getBaseUrl()}/users`, {
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
    const res = await fetchWithTimeout(`${getBaseUrl()}/users/${id}`, {
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
    const res = await fetchWithTimeout(`${getBaseUrl()}/users/${id}`, {
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
    const res = await fetchWithTimeout(`${getBaseUrl()}/users/approvals${queryString}`, {
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
    const res = await fetchWithTimeout(`${getBaseUrl()}/users/${id}/approval`, {
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

  // Leads API
  async getLeads(params = {}) {
    const query = new URLSearchParams();
    if (params.search) query.append('search', params.search);
    if (params.status && params.status !== 'all') query.append('status', params.status);
    if (params.priority && params.priority !== 'all') query.append('priority', params.priority);
    if (params.source && params.source !== 'all') query.append('source', params.source);
    if (params.assignedTo && params.assignedTo !== 'all') query.append('assignedTo', params.assignedTo);
    if (params.myLeadsOnly) query.append('myLeadsOnly', 'true');

    const queryString = query.toString() ? `?${query.toString()}` : '';
    const res = await fetchWithTimeout(`${getBaseUrl()}/leads${queryString}`, {
      method: 'GET',
      headers: getAuthHeaders(),
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.message || 'Failed to fetch leads');
    }
    return data;
  },

  async getLeadStats() {
    const res = await fetchWithTimeout(`${getBaseUrl()}/leads/stats`, {
      method: 'GET',
      headers: getAuthHeaders(),
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.message || 'Failed to fetch lead statistics');
    }
    return data;
  },

  async getLead(id) {
    const res = await fetchWithTimeout(`${getBaseUrl()}/leads/${id}`, {
      method: 'GET',
      headers: getAuthHeaders(),
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.message || 'Failed to fetch lead details');
    }
    return data;
  },

  async createLead(leadData) {
    const res = await fetchWithTimeout(`${getBaseUrl()}/leads`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(leadData),
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.message || 'Failed to create lead');
    }
    return data;
  },

  async updateLead(id, leadData) {
    const res = await fetchWithTimeout(`${getBaseUrl()}/leads/${id}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(leadData),
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.message || 'Failed to update lead');
    }
    return data;
  },

  async updateLeadStatus(id, status) {
    const res = await fetchWithTimeout(`${getBaseUrl()}/leads/${id}/status`, {
      method: 'PATCH',
      headers: getAuthHeaders(),
      body: JSON.stringify({ status }),
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.message || 'Failed to update lead status');
    }
    return data;
  },

  async convertLeadToOpportunity(id, conversionData = {}) {
    const res = await fetchWithTimeout(`${getBaseUrl()}/leads/${id}/convert`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(conversionData),
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.message || 'Failed to convert lead to opportunity');
    }
    return data;
  },

  async deleteLead(id) {
    const res = await fetchWithTimeout(`${getBaseUrl()}/leads/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.message || 'Failed to delete lead');
    }
    return data;
  },

  // Opportunities API
  async getOpportunities(params = {}) {
    const query = new URLSearchParams();
    if (params.search) query.append('search', params.search);
    if (params.stage && params.stage !== 'all') query.append('stage', params.stage);
    if (params.priority && params.priority !== 'all') query.append('priority', params.priority);
    if (params.assignedTo && params.assignedTo !== 'all') query.append('assignedTo', params.assignedTo);
    if (params.myOpportunitiesOnly) query.append('myOpportunitiesOnly', 'true');

    const queryString = query.toString() ? `?${query.toString()}` : '';
    const res = await fetchWithTimeout(`${getBaseUrl()}/opportunities${queryString}`, {
      method: 'GET',
      headers: getAuthHeaders(),
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.message || 'Failed to fetch opportunities');
    }
    return data;
  },

  async getOpportunityStats() {
    const res = await fetchWithTimeout(`${getBaseUrl()}/opportunities/stats`, {
      method: 'GET',
      headers: getAuthHeaders(),
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.message || 'Failed to fetch opportunity statistics');
    }
    return data;
  },

  async getOpportunity(id) {
    const res = await fetchWithTimeout(`${getBaseUrl()}/opportunities/${id}`, {
      method: 'GET',
      headers: getAuthHeaders(),
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.message || 'Failed to fetch opportunity details');
    }
    return data;
  },

  async createOpportunity(oppData) {
    const res = await fetchWithTimeout(`${getBaseUrl()}/opportunities`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(oppData),
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.message || 'Failed to create opportunity');
    }
    return data;
  },

  async updateOpportunity(id, oppData) {
    const res = await fetchWithTimeout(`${getBaseUrl()}/opportunities/${id}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(oppData),
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.message || 'Failed to update opportunity');
    }
    return data;
  },

  async updateOpportunityStage(id, stage, probability) {
    const res = await fetchWithTimeout(`${getBaseUrl()}/opportunities/${id}/stage`, {
      method: 'PATCH',
      headers: getAuthHeaders(),
      body: JSON.stringify({ stage, probability }),
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.message || 'Failed to update opportunity stage');
    }
    return data;
  },

  async deleteOpportunity(id) {
    const res = await fetchWithTimeout(`${getBaseUrl()}/opportunities/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.message || 'Failed to delete opportunity');
    }
    return data;
  },
};

// ==========================================
// Subscriptions & Module Pricing API Service
// ==========================================
export const subscriptionApi = {
  async getSubscription() {
    const res = await fetchWithTimeout(`${getBaseUrl()}/subscriptions`, {
      method: 'GET',
      headers: getAuthHeaders(),
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.message || 'Failed to fetch subscription data');
    }
    return data;
  },

  async updateModules(activeModules) {
    const res = await fetchWithTimeout(`${getBaseUrl()}/subscriptions/modules`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify({ activeModules }),
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.message || 'Failed to update modules');
    }
    return data;
  },

  async updateSeats(userSeats) {
    const res = await fetchWithTimeout(`${getBaseUrl()}/subscriptions/seats`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify({ userSeats }),
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.message || 'Failed to update user seats');
    }
    return data;
  },

  async updateCurrency(currency) {
    const res = await fetchWithTimeout(`${getBaseUrl()}/subscriptions/currency`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify({ currency }),
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.message || 'Failed to update currency');
    }
    return data;
  },

  async calculatePricing(params) {
    const res = await fetchWithTimeout(`${getBaseUrl()}/subscriptions/calculate`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(params),
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.message || 'Failed to calculate pricing');
    }
    return data;
  },
};

// ==========================================
// Complaints & SLA API Service
// ==========================================
export const complaintApi = {
  async getComplaints(params = {}) {
    const query = new URLSearchParams();
    if (params.search) query.append('search', params.search);
    if (params.status && params.status !== 'all') query.append('status', params.status);
    if (params.category && params.category !== 'all') query.append('category', params.category);
    if (params.priority && params.priority !== 'all') query.append('priority', params.priority);
    if (params.slaStatus && params.slaStatus !== 'all') query.append('slaStatus', params.slaStatus);
    if (params.assignedTo && params.assignedTo !== 'all') query.append('assignedTo', params.assignedTo);
    if (params.page) query.append('page', params.page);
    if (params.limit) query.append('limit', params.limit);

    const qs = query.toString() ? `?${query.toString()}` : '';
    const res = await fetchWithTimeout(`${getBaseUrl()}/complaints${qs}`, {
      method: 'GET',
      headers: getAuthHeaders(),
    });
    const data = await res.json();
    if (!res.ok) {
      const err = new Error(data.message || 'Failed to fetch complaints');
      err.moduleDisabled = data.moduleDisabled;
      throw err;
    }
    return data;
  },

  async getComplaint(id) {
    const res = await fetchWithTimeout(`${getBaseUrl()}/complaints/${id}`, {
      method: 'GET',
      headers: getAuthHeaders(),
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.message || 'Failed to fetch complaint');
    }
    return data;
  },

  async createComplaint(complaintData) {
    const res = await fetchWithTimeout(`${getBaseUrl()}/complaints`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(complaintData),
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.message || 'Failed to create complaint ticket');
    }
    return data;
  },

  async updateComplaint(id, complaintData) {
    const res = await fetchWithTimeout(`${getBaseUrl()}/complaints/${id}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(complaintData),
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.message || 'Failed to update complaint ticket');
    }
    return data;
  },

  async resolveComplaint(id, resolveData) {
    const res = await fetchWithTimeout(`${getBaseUrl()}/complaints/${id}/resolve`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(resolveData),
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.message || 'Failed to resolve complaint');
    }
    return data;
  },

  async deleteComplaint(id) {
    const res = await fetchWithTimeout(`${getBaseUrl()}/complaints/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.message || 'Failed to delete complaint ticket');
    }
    return data;
  },
};

// ==========================================
// Projects & Milestones API Service
// ==========================================
export const projectApi = {
  async getProjects(params = {}) {
    const query = new URLSearchParams();
    if (params.search) query.append('search', params.search);
    if (params.status && params.status !== 'all') query.append('status', params.status);
    if (params.priority && params.priority !== 'all') query.append('priority', params.priority);
    if (params.category && params.category !== 'all') query.append('category', params.category);
    if (params.manager && params.manager !== 'all') query.append('manager', params.manager);
    if (params.page) query.append('page', params.page);
    if (params.limit) query.append('limit', params.limit);

    const qs = query.toString() ? `?${query.toString()}` : '';
    const res = await fetchWithTimeout(`${getBaseUrl()}/projects${qs}`, {
      method: 'GET',
      headers: getAuthHeaders(),
    });
    const data = await res.json();
    if (!res.ok) {
      const err = new Error(data.message || 'Failed to fetch projects');
      err.moduleDisabled = data.moduleDisabled;
      throw err;
    }
    return data;
  },

  async getProject(id) {
    const res = await fetchWithTimeout(`${getBaseUrl()}/projects/${id}`, {
      method: 'GET',
      headers: getAuthHeaders(),
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.message || 'Failed to fetch project');
    }
    return data;
  },

  async createProject(projectData) {
    const res = await fetchWithTimeout(`${getBaseUrl()}/projects`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(projectData),
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.message || 'Failed to create project');
    }
    return data;
  },

  async updateProject(id, projectData) {
    const res = await fetchWithTimeout(`${getBaseUrl()}/projects/${id}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(projectData),
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.message || 'Failed to update project');
    }
    return data;
  },

  async toggleMilestone(projectId, milestoneIndex) {
    const res = await fetchWithTimeout(`${getBaseUrl()}/projects/${projectId}/milestones/${milestoneIndex}/toggle`, {
      method: 'PUT',
      headers: getAuthHeaders(),
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.message || 'Failed to toggle milestone');
    }
    return data;
  },

  async deleteProject(id) {
    const res = await fetchWithTimeout(`${getBaseUrl()}/projects/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.message || 'Failed to delete project');
    }
    return data;
  },
};

// ==========================================
// Hierarchy API Service
// ==========================================
export const hierarchyApi = {
  async getOrganizationHierarchy() {
    const res = await fetchWithTimeout(`${getBaseUrl()}/hierarchy`, {
      method: 'GET',
      headers: getAuthHeaders(),
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.message || 'Failed to fetch organizational hierarchy');
    }
    return data;
  },

  async getReportingChain(userId) {
    const res = await fetchWithTimeout(`${getBaseUrl()}/hierarchy/chain/${userId}`, {
      method: 'GET',
      headers: getAuthHeaders(),
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.message || 'Failed to fetch reporting chain');
    }
    return data;
  },

  async getSubordinates(userId) {
    const res = await fetchWithTimeout(`${getBaseUrl()}/hierarchy/subordinates/${userId}`, {
      method: 'GET',
      headers: getAuthHeaders(),
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.message || 'Failed to fetch subordinates');
    }
    return data;
  },
};

