import React, { useState, useEffect } from 'react';
import { Globe, Check, AlertCircle, RefreshCw, X, Smartphone, Cloud } from 'lucide-react';
import { api } from '../../api/client';

export default function ServerConfigModal({ isOpen, onClose, onServerSaved }) {
  const [url, setUrl] = useState('');
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState(null); // { ok: boolean, message: string }

  useEffect(() => {
    if (isOpen) {
      setUrl(api.getServerUrl() || '');
      setTestResult(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleTest = async () => {
    if (!url.trim()) {
      setTestResult({ ok: false, message: 'Harap masukkan URL server terlebih dahulu.' });
      return;
    }
    setTesting(true);
    setTestResult(null);
    const res = await api.testConnection(url.trim());
    setTesting(false);
    if (res.ok) {
      setTestResult({ ok: true, message: 'Berhasil terhubung ke server website DailyNote!' });
    } else {
      setTestResult({
        ok: false,
        message: res.error || 'Gagal terhubung. Pastikan URL benar dan dapat diakses dari internet.'
      });
    }
  };

  const handleSave = () => {
    api.setServerUrl(url.trim());
    if (onServerSaved) onServerSaved(url.trim());
    onClose();
  };

  const handleOfflineMode = () => {
    api.setServerUrl('');
    setUrl('');
    if (onServerSaved) onServerSaved('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-sky-100 dark:bg-sky-950/60 text-sky-600 dark:text-sky-400 flex items-center justify-center">
              <Globe className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 dark:text-white text-base">
                Hubungkan Server Website
              </h3>
              <p className="text-xs text-slate-400">
                Sinkronisasi akun HP Android dengan Web
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Description */}
        <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 text-xs text-slate-600 dark:text-slate-300 space-y-1.5">
          <p className="font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
            <Cloud className="w-4 h-4 text-sky-500" />
            Ingin login dengan akun website Anda?
          </p>
          <p>
            Masukkan alamat domain website DailyNote Anda (misal link Vercel). Jika dibiarkan kosong, aplikasi otomatis bekerja dalam <strong>Mode Offline</strong> di HP Anda.
          </p>
        </div>

        {/* Input */}
        <div className="space-y-2">
          <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
            Alamat URL Server / Website (Vercel)
          </label>
          <div className="relative">
            <input
              type="url"
              placeholder="https://daily-note-xxx.vercel.app"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              className="w-full pl-3 pr-24 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
            />
            <button
              type="button"
              onClick={handleTest}
              disabled={testing || !url.trim()}
              className="absolute right-1.5 top-1.5 bottom-1.5 px-3 rounded-lg bg-sky-500 hover:bg-sky-600 disabled:opacity-50 text-white text-xs font-medium flex items-center gap-1 transition"
            >
              {testing ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : null}
              <span>{testing ? 'Uji...' : 'Uji Koneksi'}</span>
            </button>
          </div>
        </div>

        {/* Test Result Message */}
        {testResult && (
          <div
            className={`p-3 rounded-xl border text-xs flex items-start gap-2 ${
              testResult.ok
                ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300'
                : 'bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300'
            }`}
          >
            {testResult.ok ? (
              <Check className="w-4 h-4 shrink-0 text-emerald-500 mt-0.5" />
            ) : (
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-500 mt-0.5" />
            )}
            <span>{testResult.message}</span>
          </div>
        )}

        {/* Actions */}
        <div className="pt-2 flex flex-col gap-2">
          <button
            type="button"
            onClick={handleSave}
            className="w-full py-2.5 rounded-xl bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-600 hover:to-indigo-700 text-white text-sm font-semibold shadow-lg shadow-sky-500/20 transition"
          >
            Simpan & Gunakan Server Ini
          </button>
          <button
            type="button"
            onClick={handleOfflineMode}
            className="w-full py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-sm font-medium flex items-center justify-center gap-1.5 transition"
          >
            <Smartphone className="w-4 h-4" />
            <span>Gunakan Mode Offline (Penyimpanan HP Saja)</span>
          </button>
        </div>
      </div>
    </div>
  );
}

