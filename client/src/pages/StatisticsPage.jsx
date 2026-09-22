import React, { useState, useEffect } from 'react';
import { Flame, BarChart2, BookOpen, FileText, CheckSquare, Smile, Calendar, TrendingUp } from 'lucide-react';
import { api } from '../api/client';
import { MOOD_OPTIONS } from '../components/notes/MoodSelector';

export default function StatisticsPage() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadStats() {
      try {
        setLoading(true);
        const res = await api.getStatistics();
        setStats(res);
      } catch (err) {
        console.error('Error fetching stats:', err);
      } finally {
        setLoading(false);
      }
    }
    loadStats();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96 text-slate-400 text-sm">
        Memuat statistik...
      </div>
    );
  }

  const summary = stats?.summary || {};
  const moodDistribution = stats?.mood_distribution || {};
  const writingActivity = stats?.writing_activity || [];

  const totalMoodRecorded = Object.values(moodDistribution).reduce((a, b) => a + b, 0);

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="pb-2 border-b border-slate-200 dark:border-slate-800">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight flex items-center gap-2.5">
          <BarChart2 className="w-6 h-6 text-sky-500" />
          Statistik & Refleksi Harian
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
          Pantau konsistensi journaling, target checklist, dan refleksi mood Anda
        </p>
      </div>

      {/* Hero Streak Card (PRD Section 23) */}
      <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-r from-amber-500 via-orange-500 to-rose-500 text-white shadow-xl shadow-orange-500/20 relative overflow-hidden">
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
          <div className="space-y-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-white/20 backdrop-blur-md">
              <Flame className="w-4 h-4 fill-white animate-bounce" />
              Daily Consistency
            </span>
            <h2 className="text-3xl sm:text-5xl font-black tracking-tight">
              {summary.current_streak || 0} Hari Berturut-turut!
            </h2>
            <p className="text-sm sm:text-base text-white/90 max-w-lg">
              {summary.current_streak > 0
                ? 'Luar biasa! Pertahankan kebiasaan menulis setiap hari untuk refleksi diri yang lebih jernih.'
                : 'Mulai buat catatan hari ini untuk membangun streak konsistensi journaling Anda!'}
            </p>
          </div>

          <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl bg-white/15 backdrop-blur-md flex flex-col items-center justify-center border border-white/30 shrink-0">
            <Flame className="w-10 h-10 mb-1" />
            <span className="text-xs font-bold uppercase tracking-widest">STREAK</span>
          </div>
        </div>

        {/* Decorative background circle */}
        <div className="absolute -right-10 -bottom-10 w-48 h-48 rounded-full bg-white/10 blur-2xl pointer-events-none" />
      </div>

      {/* Metric Cards (PRD Section 24) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Notes */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Total Catatan
            </span>
            <div className="w-9 h-9 rounded-xl bg-sky-50 dark:bg-sky-950 text-sky-600 dark:text-sky-400 flex items-center justify-center">
              <BookOpen className="w-4 h-4" />
            </div>
          </div>
          <h3 className="text-2xl font-black text-slate-900 dark:text-white">
            {summary.notes_total || 0}
          </h3>
          <p className="text-xs text-sky-600 dark:text-sky-400">
            +{summary.notes_this_month || 0} dibuat bulan ini
          </p>
        </div>

        {/* Total Words */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Total Kata
            </span>
            <div className="w-9 h-9 rounded-xl bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
              <FileText className="w-4 h-4" />
            </div>
          </div>
          <h3 className="text-2xl font-black text-slate-900 dark:text-white">
            {(summary.words_total || 0).toLocaleString()}
          </h3>
          <p className="text-xs text-indigo-600 dark:text-indigo-400">
            {(summary.words_this_month || 0).toLocaleString()} kata bulan ini
          </p>
        </div>

        {/* Checklists Total */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Tugas Checklist
            </span>
            <div className="w-9 h-9 rounded-xl bg-emerald-50 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <CheckSquare className="w-4 h-4" />
            </div>
          </div>
          <h3 className="text-2xl font-black text-slate-900 dark:text-white">
            {summary.checklists_total || 0}
          </h3>
          <p className="text-xs text-emerald-600 dark:text-emerald-400">
            {summary.checklists_completed || 0} tugas diselesaikan
          </p>
        </div>

        {/* Checklist Completion Rate */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Penyelesaian Tugas
            </span>
            <div className="w-9 h-9 rounded-xl bg-purple-50 dark:bg-purple-950 text-purple-600 dark:text-purple-400 flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <h3 className="text-2xl font-black text-slate-900 dark:text-white">
            {summary.checklists_total > 0
              ? `${Math.round((summary.checklists_completed / summary.checklists_total) * 100)}%`
              : '0%'}
          </h3>
          <p className="text-xs text-slate-400">
            Tingkat produktivitas target
          </p>
        </div>
      </div>

      {/* Mood Distribution (PRD Section 24) */}
      <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Smile className="w-5 h-5 text-sky-500" />
            Distribusi Mood Harian
          </h3>
          <span className="text-xs text-slate-400 font-medium">
            {totalMoodRecorded} catatan dengan mood
          </span>
        </div>

        <div className="space-y-3">
          {MOOD_OPTIONS.map((mood) => {
            const count = moodDistribution[mood.value] || 0;
            const percentage = totalMoodRecorded > 0 ? Math.round((count / totalMoodRecorded) * 100) : 0;
            return (
              <div key={mood.value} className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="flex items-center gap-1.5 font-medium text-slate-700 dark:text-slate-300">
                    <span className="text-base">{mood.emoji}</span>
                    <span>{mood.value} ({mood.label})</span>
                  </span>
                  <span className="font-semibold text-slate-500">
                    {count} ({percentage}%)
                  </span>
                </div>
                <div className="w-full h-2.5 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-sky-400 to-indigo-500 transition-all duration-500"
                    style={{ width: `${percentage}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Writing Activity Chart (PRD Section 24: "jumlah note per hari") */}
      <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Calendar className="w-5 h-5 text-sky-500" />
            Aktivitas Menulis 14 Hari Terakhir
          </h3>
        </div>

        <div className="grid grid-cols-7 sm:grid-cols-14 gap-2 pt-2">
          {writingActivity.map((day) => {
            const dateObj = new Date(day.date);
            const dayNum = dateObj.getDate();
            const monthShort = dateObj.toLocaleDateString('id-ID', { month: 'short' });
            return (
              <div
                key={day.date}
                className="flex flex-col items-center justify-end gap-1.5 p-2 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 text-center"
              >
                <div
                  className={`w-full rounded-lg transition-all ${
                    day.count > 0
                      ? 'bg-gradient-to-t from-sky-500 to-indigo-500 shadow-sm'
                      : 'bg-slate-200 dark:bg-slate-700/60'
                  }`}
                  style={{ height: `${Math.max(day.count * 24, 8)}px` }}
                />
                <span className="text-[10px] font-semibold text-slate-700 dark:text-slate-300">
                  {dayNum}
                </span>
                <span className="text-[9px] text-slate-400">
                  {monthShort}
                </span>
                {day.count > 0 && (
                  <span className="text-[9px] font-bold text-sky-600 dark:text-sky-400">
                    {day.count} note
                  </span>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

