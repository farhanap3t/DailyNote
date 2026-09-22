const API_BASE = (import.meta.env.VITE_API_BASE_URL || '') + '/api';

class ApiClient {
  getToken() {
    return localStorage.getItem('dailynote_token');
  }

  setToken(token) {
    if (token) {
      localStorage.setItem('dailynote_token', token);
    } else {
      localStorage.removeItem('dailynote_token');
    }
  }

  async request(endpoint, options = {}) {
    const token = this.getToken();
    const headers = {
      ...(options.isFormData ? {} : { 'Content-Type': 'application/json' }),
      ...options.headers,
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const config = {
      ...options,
      headers,
    };

    if (options.body && !options.isFormData && typeof options.body === 'object') {
      config.body = JSON.stringify(options.body);
    }

    try {
      const response = await fetch(`${API_BASE}${endpoint}`, config);
      
      if (response.status === 401) {
        // Unauthorized
        this.setToken(null);
        window.dispatchEvent(new CustomEvent('auth:unauthorized'));
        throw new Error('Sesi berakhir. Silakan login kembali.');
      }

      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        const data = await response.json();
        if (!response.ok) {
          throw new Error(data.error || 'Terjadi kesalahan pada permintaan.');
        }
        return data;
      } else {
        if (!response.ok) {
          throw new Error('Terjadi kesalahan pada server.');
        }
        return response;
      }
    } catch (error) {
      console.warn(`[API] Error on ${endpoint}:`, error.message);
      throw error;
    }
  }

  // Auth
  login(email, password) {
    return this.request('/auth/login', {
      method: 'POST',
      body: { email, password },
    });
  }

  register(name, email, password, confirmPassword) {
    return this.request('/auth/register', {
      method: 'POST',
      body: { name, email, password, confirmPassword },
    });
  }

  getMe() {
    return this.request('/auth/me');
  }

  forgotPassword(email) {
    return this.request('/auth/forgot-password', {
      method: 'POST',
      body: { email },
    });
  }

  resetPassword(email, newPassword) {
    return this.request('/auth/reset-password', {
      method: 'POST',
      body: { email, newPassword },
    });
  }

  // Notes
  getNotes(filter = 'all', date = null) {
    const params = new URLSearchParams();
    if (filter) params.append('filter', filter);
    if (date) params.append('date', date);
    return this.request(`/notes?${params.toString()}`);
  }

  getNote(id) {
    return this.request(`/notes/${id}`);
  }

  createNote(data) {
    return this.request('/notes', {
      method: 'POST',
      body: data,
    });
  }

  updateNote(id, data) {
    return this.request(`/notes/${id}`, {
      method: 'PUT',
      body: data,
    });
  }

  deleteNote(id) {
    return this.request(`/notes/${id}`, {
      method: 'DELETE',
    });
  }

  toggleFavorite(id) {
    return this.request(`/notes/${id}/favorite`, {
      method: 'POST',
    });
  }

  toggleArchive(id) {
    return this.request(`/notes/${id}/archive`, {
      method: 'POST',
    });
  }

  restoreNote(id) {
    return this.request(`/notes/${id}/restore`, {
      method: 'POST',
    });
  }

  uploadAttachment(noteId, file) {
    const formData = new FormData();
    formData.append('file', file);
    return this.request(`/notes/${noteId}/attachments`, {
      method: 'POST',
      body: formData,
      isFormData: true,
    });
  }

  deleteAttachment(noteId, attachmentId) {
    return this.request(`/notes/${noteId}/attachments/${attachmentId}`, {
      method: 'DELETE',
    });
  }

  // Calendar
  getCalendar(month) {
    return this.request(`/calendar?month=${month || ''}`);
  }

  // Search
  searchNotes({ q, tag, mood, startDate, endDate }) {
    const params = new URLSearchParams();
    if (q) params.append('q', q);
    if (tag) params.append('tag', tag);
    if (mood) params.append('mood', mood);
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);
    return this.request(`/search?${params.toString()}`);
  }

  // Tags
  getTags() {
    return this.request('/tags');
  }

  createTag(name) {
    return this.request('/tags', {
      method: 'POST',
      body: { name },
    });
  }

  // Statistics
  getStatistics() {
    return this.request('/statistics');
  }

  // Profile
  getProfile() {
    return this.request('/profile');
  }

  updateProfile(formData) {
    return this.request('/profile', {
      method: 'PUT',
      body: formData,
      isFormData: true,
    });
  }

  // Settings
  getSettings() {
    return this.request('/settings');
  }

  updateSettings(settings) {
    return this.request('/settings', {
      method: 'PUT',
      body: settings,
    });
  }

  deleteAccount() {
    return this.request('/settings/account', {
      method: 'DELETE',
    });
  }

  // Export
  exportNotesUrl(format = 'json') {
    return `${API_BASE}/export?format=${format}`;
  }
}

export const api = new ApiClient();

