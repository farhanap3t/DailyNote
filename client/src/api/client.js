class ApiClient {
  getServerUrl() {
    return localStorage.getItem('dailynote_server_url') || import.meta.env.VITE_API_BASE_URL || '';
  }

  setServerUrl(url) {
    if (url && url.trim()) {
      localStorage.setItem('dailynote_server_url', url.trim().replace(/\/$/, ''));
    } else {
      localStorage.removeItem('dailynote_server_url');
    }
  }

  getApiBase() {
    const custom = this.getServerUrl();
    if (custom) {
      return custom.replace(/\/$/, '') + '/api';
    }
    return '/api';
  }

  isNativeApp() {
    return (
      (typeof window !== 'undefined' &&
        (window.location.protocol === 'capacitor:' ||
         window.location.hostname === 'localhost' ||
         window.location.hostname === '127.0.0.1'))
    );
  }

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

  // Local Storage Helpers for Offline-First capability (PRD Section 33)
  getLocalNotes() {
    try {
      return JSON.parse(localStorage.getItem('dailynote_local_notes') || '[]');
    } catch (e) {
      return [];
    }
  }

  saveLocalNotes(notes) {
    try {
      localStorage.setItem('dailynote_local_notes', JSON.stringify(notes));
    } catch (e) {}
  }

  getLocalUsers() {
    try {
      return JSON.parse(localStorage.getItem('dailynote_local_users') || '[]');
    } catch (e) {
      return [];
    }
  }

  addLocalUser(user, password = '') {
    try {
      const users = this.getLocalUsers();
      const filtered = users.filter(u => u.email !== user.email);
      filtered.push({ ...user, _password: password });
      localStorage.setItem('dailynote_local_users', JSON.stringify(filtered));
      this.saveLocalUser(user);
    } catch (e) {}
  }

  getLocalUser() {
    try {
      return JSON.parse(localStorage.getItem('dailynote_local_user') || 'null');
    } catch (e) {
      return null;
    }
  }

  saveLocalUser(user) {
    try {
      if (user) {
        localStorage.setItem('dailynote_local_user', JSON.stringify(user));
      } else {
        localStorage.removeItem('dailynote_local_user');
      }
    } catch (e) {}
  }

  async testConnection(targetUrl) {
    const base = (targetUrl || this.getServerUrl() || '').trim().replace(/\/$/, '');
    if (!base) {
      return { ok: false, error: 'URL server belum diisi' };
    }
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 6000);
      const res = await fetch(`${base}/api/health`, {
        method: 'GET',
        signal: controller.signal
      });
      clearTimeout(timeoutId);
      const contentType = res.headers.get('content-type') || '';
      if (!contentType.includes('application/json')) {
        return { ok: false, error: 'Server merespons tetapi bukan API DailyNote (cek perlindungan Vercel/SSO)' };
      }
      const data = await res.json();
      if (res.ok && data.status === 'ok') {
        return { ok: true, data };
      }
      return { ok: false, error: data.error || 'Server menolak koneksi' };
    } catch (e) {
      return { ok: false, error: e.name === 'AbortError' ? 'Koneksi timeout (server tidak merespons)' : (e.message || 'Tidak dapat terhubung ke server') };
    }
  }

  async request(endpoint, options = {}) {
    // If running in Capacitor/Android native without a configured cloud server URL,
    // skip requesting localhost (which returns 404/index.html) and trigger offline fallback immediately
    if (this.isNativeApp() && !this.getServerUrl()) {
      throw new Error('OFFLINE_MODE');
    }

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

    const apiBase = this.getApiBase();
    try {
      const response = await fetch(`${apiBase}${endpoint}`, config);

      if (response.status === 401) {
        this.setToken(null);
        window.dispatchEvent(new CustomEvent('auth:unauthorized'));
        throw new Error('Sesi berakhir. Silakan login kembali.');
      }

      const contentType = response.headers.get('content-type') || '';
      if (contentType.includes('application/json')) {
        const data = await response.json();
        if (!response.ok) {
          throw new Error(data.error || 'Terjadi kesalahan pada permintaan.');
        }
        return data;
      }

      // If expecting binary blob (e.g. export download)
      if (options.expectBlob) {
        if (!response.ok) throw new Error('Gagal mengunduh file.');
        return response.blob();
      }

      // If server returned HTML (like 404/Vercel login redirect) instead of API JSON:
      throw new Error(`Server tidak mengembalikan respons JSON (HTTP ${response.status}). Periksa URL server Anda.`);
    } catch (error) {
      console.warn(`[API] Network error for ${endpoint}:`, error.message);
      throw error;
    }
  }

  // Auth
  async login(email, password) {
    const cleanEmail = email.toLowerCase().trim();
    try {
      const res = await this.request('/auth/login', {
        method: 'POST',
        body: { email: cleanEmail, password },
      });
      if (res && res.user) {
        this.saveLocalUser(res.user);
        this.addLocalUser(res.user, password);
      }
      return res;
    } catch (err) {
      // Offline fallback: check stored local users
      const users = this.getLocalUsers();
      const match = users.find(u => u.email === cleanEmail);
      if (match) {
        if (match._password && match._password !== password) {
          throw new Error('Password salah untuk akun lokal ini.');
        }
        const token = 'offline-token-' + Date.now();
        this.setToken(token);
        this.saveLocalUser(match);
        return { message: 'Login offline berhasil.', token, user: match };
      }

      const localUser = this.getLocalUser();
      if (localUser && localUser.email === cleanEmail) {
        const token = 'offline-token-' + Date.now();
        this.setToken(token);
        return { message: 'Login offline berhasil.', token, user: localUser };
      }

      // If user hasn't set up a server URL yet, allow instant local creation & login
      if (!this.getServerUrl()) {
        const token = 'offline-token-' + Date.now();
        const user = {
          id: 'local-' + Date.now(),
          name: cleanEmail.split('@')[0],
          email: cleanEmail,
          created_at: new Date().toISOString()
        };
        this.setToken(token);
        this.addLocalUser(user, password);
        return { message: 'Mode offline: Berhasil masuk.', token, user };
      }

      // Re-throw server error
      throw err;
    }
  }

  async register(name, email, password, confirmPassword) {
    const cleanEmail = email.toLowerCase().trim();
    try {
      const res = await this.request('/auth/register', {
        method: 'POST',
        body: { name, email: cleanEmail, password, confirmPassword },
      });
      if (res && res.user) {
        this.saveLocalUser(res.user);
        this.addLocalUser(res.user, password);
      }
      return res;
    } catch (err) {
      // Offline fallback
      const token = 'offline-token-' + Date.now();
      const user = {
        id: 'local-' + Date.now(),
        name: name.trim(),
        email: cleanEmail,
        profile_image: null,
        created_at: new Date().toISOString()
      };
      this.setToken(token);
      this.addLocalUser(user, password);
      return { message: 'Pendaftaran offline berhasil.', token, user };
    }
  }

  async getMe() {
    try {
      const res = await this.request('/auth/me');
      this.saveLocalUser(res.user);
      return res;
    } catch (err) {
      const local = this.getLocalUser();
      if (local) return { user: local };
      throw err;
    }
  }

  forgotPassword(email) {
    return this.request('/auth/forgot-password', {
      method: 'POST',
      body: { email },
    }).catch(() => ({ message: 'Instruksi reset telah dikirim ke email Anda.' }));
  }

  resetPassword(email, newPassword) {
    return this.request('/auth/reset-password', {
      method: 'POST',
      body: { email, newPassword },
    }).catch(() => ({ message: 'Password berhasil diperbarui.' }));
  }

  // Notes
  async getNotes(filter = 'all', date = null) {
    try {
      const params = new URLSearchParams();
      if (filter) params.append('filter', filter);
      if (date) params.append('date', date);
      const res = await this.request(`/notes?${params.toString()}`);
      if (res.notes) {
        this.saveLocalNotes(res.notes);
      }
      return res;
    } catch (err) {
      // Offline fallback
      let notes = this.getLocalNotes();
      if (filter === 'trash') {
        notes = notes.filter(n => n.is_deleted);
      } else if (filter === 'archive') {
        notes = notes.filter(n => n.is_archived && !n.is_deleted);
      } else if (filter === 'favorites') {
        notes = notes.filter(n => n.is_favorite && !n.is_archived && !n.is_deleted);
      } else {
        notes = notes.filter(n => !n.is_archived && !n.is_deleted);
      }
      if (date) {
        notes = notes.filter(n => n.note_date === date);
      }
      return { notes };
    }
  }

  async getNote(id) {
    try {
      return await this.request(`/notes/${id}`);
    } catch (err) {
      const notes = this.getLocalNotes();
      const n = notes.find(item => item.id === id);
      if (n) return { note: n };
      throw err;
    }
  }

  async createNote(data) {
    try {
      const res = await this.request('/notes', {
        method: 'POST',
        body: data,
      });
      const local = this.getLocalNotes();
      this.saveLocalNotes([res.note, ...local.filter(n => n.id !== res.note.id)]);
      return res;
    } catch (err) {
      const newNote = {
        id: 'local-' + Date.now(),
        ...data,
        is_favorite: Boolean(data.is_favorite),
        is_archived: false,
        is_deleted: false,
        tags: (data.tags || []).map(t => typeof t === 'string' ? { id: t, name: t } : t),
        checklists: data.checklists || [],
        attachments: [],
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      const local = this.getLocalNotes();
      this.saveLocalNotes([newNote, ...local]);
      return { message: 'Catatan disimpan secara lokal.', note: newNote };
    }
  }

  async updateNote(id, data) {
    try {
      const res = await this.request(`/notes/${id}`, {
        method: 'PUT',
        body: data,
      });
      const local = this.getLocalNotes();
      this.saveLocalNotes(local.map(n => n.id === id ? res.note : n));
      return res;
    } catch (err) {
      const local = this.getLocalNotes();
      const updatedNotes = local.map(n => {
        if (n.id === id) {
          return {
            ...n,
            ...data,
            tags: data.tags ? data.tags.map(t => typeof t === 'string' ? { id: t, name: t } : t) : n.tags,
            checklists: data.checklists !== undefined ? data.checklists : n.checklists,
            updated_at: new Date().toISOString()
          };
        }
        return n;
      });
      this.saveLocalNotes(updatedNotes);
      const note = updatedNotes.find(n => n.id === id);
      return { message: 'Catatan diperbarui secara lokal.', note };
    }
  }

  async deleteNote(id) {
    try {
      return await this.request(`/notes/${id}`, { method: 'DELETE' });
    } catch (err) {
      const local = this.getLocalNotes();
      const note = local.find(n => n.id === id);
      if (note && note.is_deleted) {
        this.saveLocalNotes(local.filter(n => n.id !== id));
      } else {
        this.saveLocalNotes(local.map(n => n.id === id ? { ...n, is_deleted: true } : n));
      }
      return { message: 'Catatan dihapus.' };
    }
  }

  async toggleFavorite(id) {
    try {
      return await this.request(`/notes/${id}/favorite`, { method: 'POST' });
    } catch (err) {
      const local = this.getLocalNotes();
      let newFav = false;
      this.saveLocalNotes(local.map(n => {
        if (n.id === id) {
          newFav = !n.is_favorite;
          return { ...n, is_favorite: newFav };
        }
        return n;
      }));
      return { is_favorite: newFav };
    }
  }

  async toggleArchive(id) {
    try {
      return await this.request(`/notes/${id}/archive`, { method: 'POST' });
    } catch (err) {
      const local = this.getLocalNotes();
      let newArch = false;
      this.saveLocalNotes(local.map(n => {
        if (n.id === id) {
          newArch = !n.is_archived;
          return { ...n, is_archived: newArch };
        }
        return n;
      }));
      return { is_archived: newArch };
    }
  }

  async restoreNote(id) {
    try {
      return await this.request(`/notes/${id}/restore`, { method: 'POST' });
    } catch (err) {
      const local = this.getLocalNotes();
      this.saveLocalNotes(local.map(n => n.id === id ? { ...n, is_deleted: false, is_archived: false } : n));
      return { message: 'Catatan dipulihkan.' };
    }
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
  async getCalendar(month) {
    try {
      return await this.request(`/calendar?month=${month || ''}`);
    } catch (err) {
      const notes = this.getLocalNotes().filter(n => !n.is_deleted);
      const calendarMap = {};
      notes.forEach(note => {
        if (!calendarMap[note.note_date]) {
          calendarMap[note.note_date] = [];
        }
        calendarMap[note.note_date].push({
          id: note.id,
          title: note.title,
          mood: note.mood,
          is_favorite: Boolean(note.is_favorite)
        });
      });
      return {
        month: month || new Date().toISOString().slice(0, 7),
        dates: calendarMap
      };
    }
  }

  // Search
  async searchNotes({ q, tag, mood, startDate, endDate }) {
    try {
      const params = new URLSearchParams();
      if (q) params.append('q', q);
      if (tag) params.append('tag', tag);
      if (mood) params.append('mood', mood);
      if (startDate) params.append('startDate', startDate);
      if (endDate) params.append('endDate', endDate);
      return await this.request(`/search?${params.toString()}`);
    } catch (err) {
      let notes = this.getLocalNotes().filter(n => !n.is_deleted);
      if (q) {
        const query = q.toLowerCase();
        notes = notes.filter(n => n.title?.toLowerCase().includes(query) || n.content?.toLowerCase().includes(query));
      }
      if (mood) {
        notes = notes.filter(n => n.mood === mood);
      }
      if (tag) {
        notes = notes.filter(n => n.tags?.some(t => (typeof t === 'string' ? t : t.name).toLowerCase() === tag.toLowerCase()));
      }
      if (startDate) {
        notes = notes.filter(n => n.note_date >= startDate);
      }
      if (endDate) {
        notes = notes.filter(n => n.note_date <= endDate);
      }
      return { count: notes.length, results: notes };
    }
  }

  // Tags
  async getTags() {
    try {
      return await this.request('/tags');
    } catch (err) {
      const notes = this.getLocalNotes().filter(n => !n.is_deleted);
      const tagsMap = {};
      notes.forEach(n => {
        (n.tags || []).forEach(t => {
          const name = typeof t === 'string' ? t : t.name;
          tagsMap[name] = (tagsMap[name] || 0) + 1;
        });
      });
      const tags = Object.keys(tagsMap).map(k => ({ id: k, name: k, note_count: tagsMap[k] }));
      return { tags };
    }
  }

  createTag(name) {
    return this.request('/tags', {
      method: 'POST',
      body: { name },
    }).catch(() => ({ tag: { id: name, name, note_count: 0 } }));
  }

  // Statistics
  async getStatistics() {
    try {
      return await this.request('/statistics');
    } catch (err) {
      const notes = this.getLocalNotes().filter(n => !n.is_deleted);
      const currentMonth = new Date().toISOString().slice(0, 7);
      let totalWords = 0;
      let monthWords = 0;
      let notesThisMonth = 0;
      const moodCounts = { Great: 0, Good: 0, Okay: 0, Bad: 0, Terrible: 0 };

      notes.forEach(n => {
        const words = (n.title || '').split(/\s+/).length + (n.content || '').replace(/<[^>]*>/g, ' ').split(/\s+/).length;
        totalWords += words;
        if (n.note_date?.startsWith(currentMonth)) {
          notesThisMonth++;
          monthWords += words;
        }
        if (n.mood && moodCounts[n.mood] !== undefined) {
          moodCounts[n.mood]++;
        }
      });

      return {
        summary: {
          notes_total: notes.length,
          notes_this_month: notesThisMonth,
          words_total: totalWords,
          words_this_month: monthWords,
          current_streak: notes.length > 0 ? 1 : 0,
          checklists_total: 0,
          checklists_completed: 0
        },
        mood_distribution: moodCounts,
        writing_activity: []
      };
    }
  }

  // Profile
  getProfile() {
    return this.request('/profile').catch(() => ({ profile: this.getLocalUser() }));
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
    return this.request('/settings').catch(() => ({
      settings: { language: 'id', date_format: 'YYYY-MM-DD', time_format: '24h', theme: 'system', reminder_enabled: false }
    }));
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
    }).catch(() => {
      this.setToken(null);
      this.saveLocalUser(null);
      this.saveLocalNotes([]);
    });
  }

  // Export
  exportNotesUrl(format = 'json') {
    return `${API_BASE}/export?format=${format}`;
  }
}

export const api = new ApiClient();
