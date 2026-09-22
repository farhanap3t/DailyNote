import React, { useState, useEffect } from 'react';
import {
  Flame,
  BookOpen,
  FileText,
  Plus,
  Calendar as CalendarIcon,
  ArrowRight,
  Smile,
  CheckCircle,
  Sparkles,
  RefreshCw
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { api } from '../api/client';
import NoteCard from '../components/notes/NoteCard';

export default function DashboardPage({ onNavigate, onOpenNote }) {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [todayNote, setTodayNote] = useState(null);
  const [recentNotes, setRecentNotes] = useState([]);
  const [loading, setLoading] = useState(true);

  const todayStr = new Date().toISOString().split('T')[0];

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 11) return 'Selamat Pagi';
    if (hour < 15) return 'Selamat Siang';
    if (hour < 19) return 'Selamat Sore';
    return 'Selamat Malam';
  };

  const formattedDate = new Intl.DateTimeFormat('id-ID', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  }).format(new Date());

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const [statsRes, todayRes, allRes] = await Promise.all([
        api.getStatistics().catch(() => null),
        api.getNotes('all', todayStr).catch(() => ({ notes: [] })),
        api.getNotes('all').catch(() => ({ notes: [] }))
      ]);

      if (statsRes) setStats(statsRes);
      if (todayRes && todayRes.notes.length > 0) {
        setTodayNote(todayRes.notes[0]);
      } else {
        setTodayNote(null);
      }
      if (allRes && allRes.notes) {
        setRecentNotes(allRes.notes.slice(0, 6));
      }
    } catch (err) {
      console.error('Error loading dashboard:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, []);

  const handleToggleFav = async (noteId) => {
    await api.toggleFavorite(noteId);
    loadDashboardData();
  };

  const handleDelete = async (noteId) => {
    await api.deleteNote(noteId);
    loadDashboardData();
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
      {/* 1. HEADER (PRD Section 9) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-sky-600 dark:text-sky-400 mb-1">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Daily Overview</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            {getGreeting()}, {user?.name || 'Pengguna'}!
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            {formattedDate}
          </p>
        </div>

        {/* Quick Add CTA */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => onNavigate('new-note')}
            className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-600 hover:to-indigo-700 text-white text-sm font-semibold rounded-xl shadow-md shadow-sky-500/20 transition-all active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>Catatan Baru</span>
          </button>
        </div>
      </div>

      {/* 2. STATISTICS CARDS (PRD Section 9: Notes This Month, Current Streak, Words Written) */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Streak Widget */}
        <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-br from-amber-50 to-orange-50/60 dark:from-amber-950/30 dark:to-orange-950/20 border border-amber-200/60 dark:border-amber-800/40 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-amber-500 to-orange-500 text-white flex items-center justify-center shadow-md shadow-amber-500/20 shrink-0">
            <Flame className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <p className="text-xs font-semibold text-amber-700 dark:text-amber-300 uppercase tracking-wider">
              Current Streak
            </p>
            <h3 className="text-2xl font-black text-slate-900 dark:text-white">
              {stats?.summary?.current_streak || 0} <span className="text-sm font-medium text-slate-500">Hari</span>
            </h3>
            <p className="text-[11px] text-amber-600/80 dark:text-amber-400/80">
              Konsistensi menulis harian
            </p>
          </div>
        </div>

        {/* Notes This Month */}
        <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-br from-sky-50 to-blue-50/60 dark:from-sky-950/30 dark:to-blue-950/20 border border-sky-200/60 dark:border-sky-800/40 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-sky-500 to-blue-600 text-white flex items-center justify-center shadow-md shadow-sky-500/20 shrink-0">
            <BookOpen className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-semibold text-sky-700 dark:text-sky-300 uppercase tracking-wider">
              Notes Bulan Ini
            </p>
            <h3 className="text-2xl font-black text-slate-900 dark:text-white">
              {stats?.summary?.notes_this_month || 0} <span className="text-sm font-medium text-slate-500">Catatan</span>
            </h3>
            <p className="text-[11px] text-sky-600/80 dark:text-sky-400/80">
              Total {stats?.summary?.notes_total || 0} catatan tersimpan
            </p>
          </div>
        </div>

        {/* Words Written */}
        <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-br from-indigo-50 to-purple-50/60 dark:from-indigo-950/30 dark:to-purple-950/20 border border-indigo-200/60 dark:border-indigo-800/40 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-indigo-500 to-purple-600 text-white flex items-center justify-center shadow-md shadow-indigo-500/20 shrink-0">
            <FileText className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-semibold text-indigo-700 dark:text-indigo-300 uppercase tracking-wider">
              Words Written
            </p>
            <h3 className="text-2xl font-black text-slate-900 dark:text-white">
              {(stats?.summary?.words_total || 0).toLocaleString()} <span className="text-sm font-medium text-slate-500">Kata</span>
            </h3>
            <p className="text-[11px] text-indigo-600/80 dark:text-indigo-400/80">
              {stats?.summary?.words_this_month || 0} kata bulan ini
            </p>
          </div>
        </div>
      </div>

      {/* 3. TODAY'S NOTE HERO CARD (PRD Section 9) */}
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden shadow-sm">
        <div className="px-5 py-4 bg-gradient-to-r from-sky-50/70 to-indigo-50/50 dark:from-sky-950/30 dark:to-indigo-950/20 border-b border-slate-100 dark:border-slate-800/80 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CalendarIcon className="w-4 h-4 text-sky-500" />
            <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100">Catatan Hari Ini</h2>
          </div>
          <span className="text-xs font-mono text-slate-500 dark:text-slate-400">{todayStr}</span>
        </div>

        <div className="p-5 sm:p-6">
          {todayNote ? (
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="space-y-1.5 flex-1">
                <div className="flex items-center gap-2">
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                    {todayNote.title}
                  </h3>
                  {todayNote.mood && (
                    <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-sky-100 dark:bg-sky-900 text-sky-700 dark:text-sky-300">
                      Mood: {todayNote.mood}
                    </span>
                  )}
                </div>
                <p className="text-sm text-slate-600 dark:text-slate-300 line-clamp-2">
                  {(todayNote.content || '').replace(/<[^>]*>/g, ' ') || 'Catatan telah dibuat hari ini.'}
                </p>
              </div>
              <button
                onClick={() => onOpenNote(todayNote)}
                className="inline-flex items-center justify-center gap-2 px-4 py-2 text-sm font-semibold rounded-xl bg-sky-500 hover:bg-sky-600 text-white shadow-sm transition-all shrink-0"
              >
                <span>Lanjutkan Menulis</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="text-center py-6 sm:py-8 space-y-3">
              <div className="w-12 h-12 rounded-full bg-sky-100 dark:bg-sky-950 text-sky-600 dark:text-sky-400 flex items-center justify-center mx-auto">
                <FileText className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-800 dark:text-slate-200">
                  Belum ada catatan hari ini
                </h3>
                <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 max-w-md mx-auto mt-1">
                  Luangkan waktu sejenak untuk mendokumentasikan kegiatan, pikiran, atau target harian Anda.
                </p>
              </div>
              <button
                onClick={() => onNavigate('new-note', { date: todayStr })}
                className="inline-flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-sky-500 to-indigo-600 text-white text-sm font-semibold rounded-xl shadow-sm hover:from-sky-600 hover:to-indigo-700 transition-all"
              >
                <Plus className="w-4 h-4" />
                <span>Mulai Menulis Hari Ini (Start Writing)</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* 4. RECENT NOTES (PRD Section 9) */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">
            Catatan Terbaru (Recent Notes)
          </h2>
          <button
            onClick={() => onNavigate('notes')}
            className="text-xs font-semibold text-sky-600 dark:text-sky-400 hover:underline flex items-center gap-1"
          >
            <span>Lihat Semua</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {recentNotes.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {recentNotes.map((note) => (
              <NoteCard
                key={note.id}
                note={note}
                onOpen={onOpenNote}
                onToggleFavorite={handleToggleFav}
                onDelete={handleDelete}
              />
            ))}
          </div>
        ) : (
          <div className="p-8 rounded-2xl border border-dashed border-slate-300 dark:border-slate-800 text-center text-slate-400 text-sm">
            Belum ada catatan. Klik tombol <strong>Catatan Baru</strong> untuk memulai!
          </div>
        )}
      </div>
    </div>
  );
}

