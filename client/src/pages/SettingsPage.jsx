import React, { useState, useEffect } from 'react';
import {
  Settings,
  Globe,
  Palette,
  Bell,
  Shield,
  Download,
  Trash2,
  Check,
  AlertTriangle,
  Sun,
  Moon,
  Monitor
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { api } from '../api/client';

export default function SettingsPage() {
  const { logout } = useAuth();
  const { theme, setTheme } = useTheme();

  const [language, setLanguage] = useState('id');
  const [dateFormat, setDateFormat] = useState('YYYY-MM-DD');
  const [timeFormat, setTimeFormat] = useState('24h');
  const [reminderEnabled, setReminderEnabled] = useState(false);
  const [reminderTime, setReminderTime] = useState('20:00');

  const [saving, setSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  useEffect(() => {
    async function loadSettings() {
      try {
        const res = await api.getSettings();
        const s = res.settings;
        if (s) {
          setLanguage(s.language || 'id');
          setDateFormat(s.date_format || 'YYYY-MM-DD');
          setTimeFormat(s.time_format || '24h');
          setReminderEnabled(Boolean(s.reminder_enabled));
          setReminderTime(s.reminder_time || '20:00');
          if (s.theme) setTheme(s.theme);
        }
      } catch (err) {
        console.error('Error loading settings:', err);
      }
    }
    loadSettings();
  }, [setTheme]);

  const handleSaveSettings = async (updatedTheme = theme) => {
    setSaving(true);
    setSavedSuccess(false);
    try {
      await api.updateSettings({
        language,
        date_format: dateFormat,
        time_format: timeFormat,
        theme: updatedTheme,
        reminder_enabled: reminderEnabled,
        reminder_time: reminderTime
      });
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 3000);
    } catch (err) {
      console.error('Error saving settings:', err);
    } finally {
      setSaving(false);
    }
  };

  const handleThemeChange = (newTheme) => {
    setTheme(newTheme);
    handleSaveSettings(newTheme);
  };

  const handleTestNotification = async () => {
    if (!('Notification' in window)) {
      alert('Browser Anda tidak mendukung Web Notifications.');
      return;
    }

    if (Notification.permission === 'granted') {
      new Notification('DailyNote Pengingat Harian 📝', {
        body: 'Waktunya mencatat aktivitas dan refleksi mood Anda hari ini!',
        icon: '/favicon.ico'
      });
    } else if (Notification.permission !== 'denied') {
      const permission = await Notification.requestPermission();
      if (permission === 'granted') {
        new Notification('DailyNote Pengingat Harian 📝', {
          body: 'Notifikasi berhasil diaktifkan!',
          icon: '/favicon.ico'
        });
      }
    } else {
      alert('Izin notifikasi diblokir oleh browser. Silakan izinkan di pengaturan browser Anda.');
    }
  };

  const handleDeleteAccount = async () => {
    const confirmation = window.prompt(
      'PERINGATAN: Tindakan ini tidak dapat dibatalkan. Seluruh catatan, riwayat mood, dan lampiran Anda akan dihapus permanen.\n\nKetik "HAPUS" untuk mengonfirmasi:'
    );

    if (confirmation === 'HAPUS') {
      try {
        await api.deleteAccount();
        logout();
      } catch (err) {
        alert('Gagal menghapus akun: ' + err.message);
      }
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-slate-800">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight flex items-center gap-2.5">
            <Settings className="w-6 h-6 text-sky-500" />
            Pengaturan Aplikasi
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            Sesuaikan preferensi tampilan, bahasa, pengingat harian, dan ekspor data
          </p>
        </div>

        {savedSuccess && (
          <span className="text-xs text-emerald-600 font-semibold flex items-center gap-1 animate-in fade-in">
            <Check className="w-4 h-4" /> Tersimpan
          </span>
        )}
      </div>

      {/* 1. GENERAL (PRD Section 26) */}
      <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
        <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
          <Globe className="w-4 h-4 text-sky-500" />
          Umum (General)
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5">
              Bahasa Antarmuka
            </label>
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              className="w-full text-xs sm:text-sm px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 focus:outline-none"
            >
              <option value="id">Bahasa Indonesia</option>
              <option value="en">English (US)</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5">
              Format Tanggal
            </label>
            <select
              value={dateFormat}
              onChange={(e) => setDateFormat(e.target.value)}
              className="w-full text-xs sm:text-sm px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 focus:outline-none"
            >
              <option value="YYYY-MM-DD">YYYY-MM-DD (2026-09-22)</option>
              <option value="DD/MM/YYYY">DD/MM/YYYY (22/09/2026)</option>
              <option value="MM/DD/YYYY">MM/DD/YYYY (09/22/2026)</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5">
              Format Jam
            </label>
            <select
              value={timeFormat}
              onChange={(e) => setTimeFormat(e.target.value)}
              className="w-full text-xs sm:text-sm px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 focus:outline-none"
            >
              <option value="24h">24 Jam (20:00)</option>
              <option value="12h">12 Jam (08:00 PM)</option>
            </select>
          </div>
        </div>
      </div>

      {/* 2. APPEARANCE (PRD Section 26: Light Mode, Dark Mode, System Default) */}
      <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
        <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
          <Palette className="w-4 h-4 text-sky-500" />
          Tampilan (Appearance)
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <button
            type="button"
            onClick={() => handleThemeChange('light')}
            className={`p-4 rounded-xl border flex flex-col items-center gap-2 transition-all ${
              theme === 'light'
                ? 'border-sky-500 bg-sky-50/50 dark:bg-sky-950/30 text-sky-600 dark:text-sky-400 ring-2 ring-sky-400/40'
                : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50 text-slate-700 dark:text-slate-300'
            }`}
          >
            <Sun className="w-6 h-6 text-amber-500" />
            <span className="text-xs font-bold">Light Mode</span>
          </button>

          <button
            type="button"
            onClick={() => handleThemeChange('dark')}
            className={`p-4 rounded-xl border flex flex-col items-center gap-2 transition-all ${
              theme === 'dark'
                ? 'border-sky-500 bg-sky-50/50 dark:bg-sky-950/30 text-sky-600 dark:text-sky-400 ring-2 ring-sky-400/40'
                : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50 text-slate-700 dark:text-slate-300'
            }`}
          >
            <Moon className="w-6 h-6 text-indigo-400" />
            <span className="text-xs font-bold">Dark Mode</span>
          </button>

          <button
            type="button"
            onClick={() => handleThemeChange('system')}
            className={`p-4 rounded-xl border flex flex-col items-center gap-2 transition-all ${
              theme === 'system'
                ? 'border-sky-500 bg-sky-50/50 dark:bg-sky-950/30 text-sky-600 dark:text-sky-400 ring-2 ring-sky-400/40'
                : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50 text-slate-700 dark:text-slate-300'
            }`}
          >
            <Monitor className="w-6 h-6 text-slate-500" />
            <span className="text-xs font-bold">System Default</span>
          </button>
        </div>
      </div>

      {/* 3. NOTIFICATION & DAILY REMINDER (PRD Section 26 & 27) */}
      <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
        <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
          <Bell className="w-4 h-4 text-sky-500" />
          Pengingat Harian (Daily Reminder)
        </h3>
        <p className="text-xs text-slate-400">
          DailyNote akan mengingatkan Anda untuk menulis jurnal harian pada waktu yang Anda tentukan.
        </p>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              id="reminder_toggle"
              checked={reminderEnabled}
              onChange={(e) => setReminderEnabled(e.target.checked)}
              className="w-4 h-4 rounded text-sky-600 focus:ring-sky-500 cursor-pointer"
            />
            <label htmlFor="reminder_toggle" className="text-xs sm:text-sm font-semibold text-slate-800 dark:text-slate-200 cursor-pointer">
              Aktifkan Pengingat Harian
            </label>
          </div>

          <div className="flex items-center gap-3">
            <input
              type="time"
              value={reminderTime}
              disabled={!reminderEnabled}
              onChange={(e) => setReminderTime(e.target.value)}
              className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-800 dark:text-slate-200 disabled:opacity-50"
            />

            <button
              type="button"
              onClick={handleTestNotification}
              className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-sky-50 dark:bg-sky-950 text-sky-600 dark:text-sky-400 hover:bg-sky-100 dark:hover:bg-sky-900 transition-colors"
            >
              Uji Notifikasi Browser
            </button>
          </div>
        </div>
      </div>

      {/* 4. PRIVACY & DATA EXPORT (PRD Section 26) */}
      <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
        <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
          <Shield className="w-4 h-4 text-sky-500" />
          Privasi & Ekspor Data
        </h3>
        <p className="text-xs text-slate-400">
          Seluruh data catatan harian Anda sepenuhnya milik Anda. Unduh salinan cadangan kapan saja.
        </p>

        <div className="flex flex-wrap items-center gap-3">
          <a
            href={api.exportNotesUrl('json')}
            download="dailynote-export.json"
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700/60 transition-colors shadow-sm"
          >
            <Download className="w-4 h-4 text-sky-500" />
            <span>Ekspor Semua Catatan (JSON)</span>
          </a>

          <a
            href={api.exportNotesUrl('markdown')}
            download="dailynote-export.md"
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700/60 transition-colors shadow-sm"
          >
            <Download className="w-4 h-4 text-indigo-500" />
            <span>Ekspor Semua Catatan (Markdown)</span>
          </a>
        </div>
      </div>

      {/* 5. ACCOUNT & DANGER ZONE (PRD Section 26) */}
      <div className="p-6 rounded-2xl bg-rose-50/40 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900/60 space-y-4">
        <h3 className="text-sm font-bold text-rose-700 dark:text-rose-400 uppercase tracking-wider flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-rose-500" />
          Zona Bahaya (Danger Zone)
        </h3>
        <p className="text-xs text-rose-600/80 dark:text-rose-400/80">
          Menghapus akun Anda akan menghapus semua data, streak, dan catatan secara permanen dari server.
        </p>

        <button
          type="button"
          onClick={handleDeleteAccount}
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold bg-rose-600 hover:bg-rose-700 text-white shadow-sm transition-all"
        >
          <Trash2 className="w-4 h-4" />
          <span>Hapus Akun & Seluruh Data</span>
        </button>
      </div>

      {/* Save Button */}
      <div className="flex justify-end pt-2">
        <button
          type="button"
          onClick={() => handleSaveSettings()}
          disabled={saving}
          className="px-6 py-2.5 bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-600 hover:to-indigo-700 text-white text-sm font-semibold rounded-xl shadow-md shadow-sky-500/20 disabled:opacity-50 transition-all active:scale-95"
        >
          {saving ? 'Menyimpan...' : 'Simpan Pengaturan'}
        </button>
      </div>
    </div>
  );
}

