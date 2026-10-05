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
      (sessionStorage.getItem('taskflow_token') || localStorage.getItem('taskflow_token'))) ||
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
  async getAssignableUsers() {
    const res = await fetchWithTimeout(`${getBaseUrl()}/users/assignable`, {
      method: 'GET',
      headers: getAuthHeaders(),
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.message || 'Failed to fetch assignable users');
    }
    return data;
  },

  async getUsers(params = {}) {
    const query = new URLSearchParams();
    if (params.search) query.append('search', params.search);
    if (params.role && params.role !== 'all') query.append('role', params.role);
    if (params.department && params.department !== 'all') query.append('department', params.department);
    if (params.status && params.status !== 'all') query.append('status', params.status);
    if (params.scope) query.append('scope', params.scope);
    if (params.all) query.append('all', 'true');

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

  async updateLeadStatus(id, status, details = {}) {
    const res = await fetchWithTimeout(`${getBaseUrl()}/leads/${id}/status`, {
      method: 'PATCH',
      headers: getAuthHeaders(),
      body: JSON.stringify({ status, ...details }),
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.message || 'Failed to update lead status');
    }
    return data;
  },

  async qualifyLead(id, qualificationData = {}) {
    const res = await fetchWithTimeout(`${getBaseUrl()}/leads/${id}/qualify`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(qualificationData),
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.message || 'Failed to qualify lead');
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

  // Lead Call & Communication Log APIs
  async recordLeadCall(id, callData) {
    const res = await fetchWithTimeout(`${getBaseUrl()}/leads/${id}/calls`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(callData),
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.message || 'Failed to record call log');
    }
    return data;
  },

  async getLeadCalls(id) {
    const res = await fetchWithTimeout(`${getBaseUrl()}/leads/${id}/calls`, {
      method: 'GET',
      headers: getAuthHeaders(),
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.message || 'Failed to fetch call logs');
    }
    return data;
  },

  // Lead Follow-Up Management APIs
  async scheduleLeadFollowUp(id, followupData) {
    const res = await fetchWithTimeout(`${getBaseUrl()}/leads/${id}/followups`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(followupData),
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.message || 'Failed to schedule follow-up');
    }
    return data;
  },

  async getLeadFollowUps(id) {
    const res = await fetchWithTimeout(`${getBaseUrl()}/leads/${id}/followups`, {
      method: 'GET',
      headers: getAuthHeaders(),
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.message || 'Failed to fetch follow-ups');
    }
    return data;
  },

  async updateLeadFollowUp(leadId, followUpId, followupData) {
    const res = await fetchWithTimeout(`${getBaseUrl()}/leads/${leadId}/followups/${followUpId}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(followupData),
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.message || 'Failed to update follow-up');
    }
    return data;
  },

  // Enterprise LMS: 1-Click Disposition Matrix Logging
  async logLeadDisposition(id, dispositionData) {
    const res = await fetchWithTimeout(`${getBaseUrl()}/leads/${id}/disposition`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(dispositionData),
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.message || 'Failed to log disposition');
    }
    return data;
  },

  // Enterprise LMS: Advanced Multi-Dimensional Filtration Engine
  async filterLeadsAdvanced(rules = [], logic = 'AND') {
    const res = await fetchWithTimeout(`${getBaseUrl()}/leads/filter`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ rules, logic }),
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.message || 'Failed to execute advanced filter');
    }
    return data;
  },

  // Enterprise LMS: Claim High-Priority Unassigned Lead
  async claimUnassignedLead(id) {
    const res = await fetchWithTimeout(`${getBaseUrl()}/leads/${id}/claim`, {
      method: 'POST',
      headers: getAuthHeaders(),
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.message || 'Failed to claim unassigned lead');
    }
    return data;
  },

  // Enterprise Lead Excel & CSV Suite (.xlsx, .xls, .csv)
  async downloadLeadExcelTemplate(format = 'xlsx') {
    const res = await fetchWithTimeout(`${getBaseUrl()}/leads/excel/template?format=${format}`, {
      method: 'GET',
      headers: getAuthHeaders(),
    });
    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      throw new Error(errData.message || 'Failed to download Lead template');
    }
    return await res.blob();
  },

  async previewLeadExcel(fileData, fileName, mapping = null) {
    const res = await fetchWithTimeout(`${getBaseUrl()}/leads/excel/preview`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ fileData, fileBase64: fileData, fileName, filename: fileName, mapping }),
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.message || 'Failed to parse file preview');
    }
    return data;
  },

  async importLeadExcel(payload) {
    const res = await fetchWithTimeout(`${getBaseUrl()}/leads/excel/import`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.message || 'Failed to import Lead Excel data');
    }
    return data;
  },

  async exportLeadExcel(payload = {}) {
    const res = await fetchWithTimeout(`${getBaseUrl()}/leads/excel/export`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      throw new Error(errData.message || 'Failed to export Lead Excel data');
    }
    return await res.blob();
  },

  async getLeadExcelHistory() {
    const res = await fetchWithTimeout(`${getBaseUrl()}/leads/excel/history`, {
      method: 'GET',
      headers: getAuthHeaders(),
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.message || 'Failed to fetch Lead Excel history');
    }
    return data;
  },

  // Enterprise LMS: MIS Reports & Analytical Dashboard API
  async getMISAnalytics() {
    const res = await fetchWithTimeout(`${getBaseUrl()}/mis/analytics`, {
      method: 'GET',
      headers: getAuthHeaders(),
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.message || 'Failed to fetch MIS analytics');
    }
    return data;
  },

  async getMISReport(reportId) {
    const endpointMap = {
      'MIS-01': 'funnel-velocity',
      'MIS-02': 'agent-efficiency',
      'MIS-03': 'disposition-distribution',
      'MIS-04': 'pipeline-aging',
      'MIS-05': 'attribution-roi',
    };
    const path = endpointMap[reportId] || reportId;
    const res = await fetchWithTimeout(`${getBaseUrl()}/mis/reports/${path}`, {
      method: 'GET',
      headers: getAuthHeaders(),
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.message || 'Failed to fetch MIS report');
    }
    return data;
  },

  getMISExportUrl(reportId, format = 'csv') {
    return `${getBaseUrl()}/mis/export/${reportId}?format=${format}`;
  },

  // Enterprise LMS: Immutable Audit Trail API
  async getAuditLogs(params = {}) {
    const query = new URLSearchParams();
    if (params.entity_type && params.entity_type !== 'all') query.append('entity_type', params.entity_type);
    if (params.action && params.action !== 'all') query.append('action', params.action);
    if (params.entity_id) query.append('entity_id', params.entity_id);
    if (params.search) query.append('search', params.search);
    if (params.limit) query.append('limit', params.limit);

    const queryString = query.toString() ? `?${query.toString()}` : '';
    const res = await fetchWithTimeout(`${getBaseUrl()}/audit-logs${queryString}`, {
      method: 'GET',
      headers: getAuthHeaders(),
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.message || 'Failed to fetch audit logs');
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

  async getOpportunityById(id) {
    return this.getOpportunity(id);
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

  async updateOpportunityStage(id, stage, probability, lostReason = '', lostReasonDetails = '') {
    const payload = { stage };
    if (probability !== undefined && probability !== null) payload.probability = probability;
    if (lostReason) payload.lostReason = lostReason;
    if (lostReasonDetails) payload.lostReasonDetails = lostReasonDetails;

    const res = await fetchWithTimeout(`${getBaseUrl()}/opportunities/${id}/stage`, {
      method: 'PATCH',
      headers: getAuthHeaders(),
      body: JSON.stringify(payload),
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
    if (params.subCategory && params.subCategory !== 'all') query.append('subCategory', params.subCategory);
    if (params.priority && params.priority !== 'all') query.append('priority', params.priority);
    if (params.severity && params.severity !== 'all') query.append('severity', params.severity);
    if (params.slaStatus && params.slaStatus !== 'all') query.append('slaStatus', params.slaStatus);
    if (params.assignedTo && params.assignedTo !== 'all') query.append('assignedTo', params.assignedTo);
    if (params.team && params.team !== 'all') query.append('team', params.team);
    if (params.metric && params.metric !== 'total') query.append('metric', params.metric);
    if (params.page) query.append('page', params.page);
    if (params.limit) query.append('limit', params.limit);
    if (params.sortBy) query.append('sortBy', params.sortBy);
    if (params.sortOrder) query.append('sortOrder', params.sortOrder);

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
      throw new Error(data.message || 'Failed to fetch complaint details');
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

  async updateComplaintStatus(id, status, notes) {
    const res = await fetchWithTimeout(`${getBaseUrl()}/complaints/${id}/status`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify({ status, notes }),
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.message || 'Failed to update complaint status');
    }
    return data;
  },

  async assignComplaint(id, assignData) {
    const res = await fetchWithTimeout(`${getBaseUrl()}/complaints/${id}/assign`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(assignData),
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.message || 'Failed to assign complaint');
    }
    return data;
  },

  async reassignComplaint(id, assignData) {
    const res = await fetchWithTimeout(`${getBaseUrl()}/complaints/${id}/assign`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(assignData),
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.message || 'Failed to reassign complaint');
    }
    return data;
  },

  async escalateComplaint(id, escalateData) {
    const res = await fetchWithTimeout(`${getBaseUrl()}/complaints/${id}/escalate`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(escalateData),
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.message || 'Failed to escalate complaint');
    }
    return data;
  },

  async investigateComplaint(id, investigateData) {
    const res = await fetchWithTimeout(`${getBaseUrl()}/complaints/${id}/investigate`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(investigateData),
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.message || 'Failed to update investigation');
    }
    return data;
  },

  async updateInvestigation(id, investigateData) {
    const res = await fetchWithTimeout(`${getBaseUrl()}/complaints/${id}/investigate`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(investigateData),
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.message || 'Failed to update investigation');
    }
    return data;
  },

  async addComplaintActivity(id, activityData) {
    const res = await fetchWithTimeout(`${getBaseUrl()}/complaints/${id}/activities`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(activityData),
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.message || 'Failed to record activity');
    }
    return data;
  },

  async addActivity(id, activityData) {
    const res = await fetchWithTimeout(`${getBaseUrl()}/complaints/${id}/activities`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(activityData),
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.message || 'Failed to add activity');
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

  async closeComplaint(id, closeData) {
    const res = await fetchWithTimeout(`${getBaseUrl()}/complaints/${id}/close`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(closeData),
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.message || 'Failed to close complaint');
    }
    return data;
  },

  async reopenComplaint(id, reopenData) {
    const res = await fetchWithTimeout(`${getBaseUrl()}/complaints/${id}/reopen`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(reopenData),
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.message || 'Failed to reopen complaint');
    }
    return data;
  },

  async linkComplaint(id, linkData) {
    const res = await fetchWithTimeout(`${getBaseUrl()}/complaints/${id}/link`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(linkData),
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.message || 'Failed to link items to complaint');
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

  // Complaint MIS Analytics & Reporting
  async getComplaintMISAnalytics() {
    const res = await fetchWithTimeout(`${getBaseUrl()}/complaints/mis/analytics`, {
      method: 'GET',
      headers: getAuthHeaders(),
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.message || 'Failed to fetch Complaint MIS analytics');
    }
    return data;
  },

  async getComplaintMISReport(reportId, params = {}) {
    const query = new URLSearchParams();
    if (params.startDate) query.append('startDate', params.startDate);
    if (params.endDate) query.append('endDate', params.endDate);
    if (params.category && params.category !== 'all') query.append('category', params.category);
    if (params.priority && params.priority !== 'all') query.append('priority', params.priority);
    if (params.severity && params.severity !== 'all') query.append('severity', params.severity);

    const qs = query.toString() ? `?${query.toString()}` : '';
    const res = await fetchWithTimeout(`${getBaseUrl()}/complaints/mis/reports/${reportId}${qs}`, {
      method: 'GET',
      headers: getAuthHeaders(),
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.message || `Failed to fetch MIS report ${reportId}`);
    }
    return data;
  },

  getComplaintMISExportUrl(reportId, format = 'xlsx') {
    const token =
      (typeof window !== 'undefined' &&
        (sessionStorage.getItem('taskflow_token') || localStorage.getItem('taskflow_token'))) ||
      '';
    return `${getBaseUrl()}/complaints/mis/export/${reportId}?format=${format}&token=${encodeURIComponent(token)}`;
  },

  // Complaint Excel Suite (.xlsx only)
  async downloadComplaintExcelTemplate() {
    const res = await fetchWithTimeout(`${getBaseUrl()}/complaints/excel/template`, {
      method: 'GET',
      headers: getAuthHeaders(),
    });
    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      throw new Error(errData.message || 'Failed to download Complaint Excel template');
    }
    return await res.blob();
  },

  async previewComplaintExcel(fileData, fileName) {
    const res = await fetchWithTimeout(`${getBaseUrl()}/complaints/excel/preview`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ fileData, fileName }),
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.message || 'Failed to parse Complaint Excel file preview');
    }
    return data;
  },

  async importComplaintExcel(payload) {
    const res = await fetchWithTimeout(`${getBaseUrl()}/complaints/excel/import`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.message || 'Failed to import Complaint Excel data');
    }
    return data;
  },

  async exportComplaintExcel(payload = {}) {
    const res = await fetchWithTimeout(`${getBaseUrl()}/complaints/excel/export`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      throw new Error(errData.message || 'Failed to export Complaint Excel data');
    }
    return await res.blob();
  },

  async getComplaintExcelHistory() {
    const res = await fetchWithTimeout(`${getBaseUrl()}/complaints/excel/history`, {
      method: 'GET',
      headers: getAuthHeaders(),
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.message || 'Failed to fetch Complaint Excel history');
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
    if (params.dateFilter && params.dateFilter !== 'all') query.append('dateFilter', params.dateFilter);
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

  async updateProjectStatus(id, status, remarks = '') {
    const res = await fetchWithTimeout(`${getBaseUrl()}/projects/${id}/status`, {
      method: 'PATCH',
      headers: getAuthHeaders(),
      body: JSON.stringify({ status, remarks }),
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.message || 'Failed to update project status');
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

  // Templates
  async getProjectTemplates() {
    const res = await fetchWithTimeout(`${getBaseUrl()}/projects/templates`, {
      method: 'GET',
      headers: getAuthHeaders(),
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.message || 'Failed to fetch templates');
    }
    return data;
  },

  // MIS Analytics
  async getProjectMISStats() {
    const res = await fetchWithTimeout(`${getBaseUrl()}/projects/stats/mis`, {
      method: 'GET',
      headers: getAuthHeaders(),
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.message || 'Failed to fetch project MIS analytics');
    }
    return data;
  },

  // Reports
  async getReport(reportType, params = {}) {
    const query = new URLSearchParams();
    if (params.category) query.append('category', params.category);
    if (params.status && params.status !== 'all') query.append('status', params.status);
    const qs = query.toString() ? `?${query.toString()}` : '';
    const res = await fetchWithTimeout(`${getBaseUrl()}/projects/reports/${reportType}${qs}`, {
      method: 'GET',
      headers: getAuthHeaders(),
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.message || 'Failed to fetch project report');
    }
    return data;
  },

  async getProjectReport(reportType, params = {}) {
    return this.getReport(reportType, params);
  },

  // Tasks
  async createProjectTask(projectId, taskData) {
    const res = await fetchWithTimeout(`${getBaseUrl()}/projects/${projectId}/tasks`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(taskData),
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.message || 'Failed to add project task');
    }
    return data;
  },

  async updateProjectTaskStatus(projectId, taskId, status, progress) {
    const res = await fetchWithTimeout(`${getBaseUrl()}/projects/${projectId}/tasks/${taskId}/status`, {
      method: 'PATCH',
      headers: getAuthHeaders(),
      body: JSON.stringify({ status, progress }),
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.message || 'Failed to update task status');
    }
    return data;
  },

  // Issues
  async createProjectIssue(projectId, issueData) {
    const res = await fetchWithTimeout(`${getBaseUrl()}/projects/${projectId}/issues`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(issueData),
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.message || 'Failed to create issue');
    }
    return data;
  },

  async updateProjectIssueStatus(projectId, issueId, status, resolution = '') {
    const res = await fetchWithTimeout(`${getBaseUrl()}/projects/${projectId}/issues/${issueId}/status`, {
      method: 'PATCH',
      headers: getAuthHeaders(),
      body: JSON.stringify({ status, resolution }),
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.message || 'Failed to update issue status');
    }
    return data;
  },

  // Risks
  async createProjectRisk(projectId, riskData) {
    const res = await fetchWithTimeout(`${getBaseUrl()}/projects/${projectId}/risks`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(riskData),
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.message || 'Failed to add risk');
    }
    return data;
  },

  // Timesheets
  async createTimesheet(projectId, timesheetData) {
    const res = await fetchWithTimeout(`${getBaseUrl()}/projects/${projectId}/timesheets`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(timesheetData),
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.message || 'Failed to log timesheet');
    }
    return data;
  },

  async updateTimesheetStatus(projectId, timesheetId, status, rejectionReason = '') {
    const res = await fetchWithTimeout(`${getBaseUrl()}/projects/${projectId}/timesheets/${timesheetId}/status`, {
      method: 'PATCH',
      headers: getAuthHeaders(),
      body: JSON.stringify({ status, rejectionReason }),
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.message || 'Failed to update timesheet status');
    }
    return data;
  },

  // Comments
  async addProjectComment(projectId, commentData) {
    const res = await fetchWithTimeout(`${getBaseUrl()}/projects/${projectId}/comments`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(commentData),
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.message || 'Failed to add comment');
    }
    return data;
  },

  // Excel / CSV Import & Export
  async previewProjectExcel(fileData, fileName) {
    const res = await fetchWithTimeout(`${getBaseUrl()}/projects/excel/preview`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ fileData, fileName }),
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.message || 'Failed to preview Excel file');
    }
    return data;
  },

  async importProjectExcel(payload) {
    const res = await fetchWithTimeout(`${getBaseUrl()}/projects/excel/import`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.message || 'Failed to import projects');
    }
    return data;
  },

  async exportProjectExcel(payload = {}) {
    const res = await fetchWithTimeout(`${getBaseUrl()}/projects/excel/export`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      throw new Error(errData.message || 'Failed to export projects');
    }
    return await res.blob();
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



