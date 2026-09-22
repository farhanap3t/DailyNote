import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Plus, BookOpen } from 'lucide-react';
import { api } from '../api/client';
import { MOOD_OPTIONS } from '../components/notes/MoodSelector';

export default function CalendarPage({ onNavigate, onOpenNote }) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [calendarData, setCalendarData] = useState({});
  const [loading, setLoading] = useState(true);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth(); // 0-indexed

  const monthString = `${year}-${String(month + 1).padStart(2, '0')}`;

  const fetchCalendar = async () => {
    try {
      setLoading(true);
      const res = await api.getCalendar(monthString);
      setCalendarData(res.dates || {});
    } catch (err) {
      console.error('Error fetching calendar:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCalendar();
  }, [monthString]);

  const prevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  const todayMonth = () => {
    setCurrentDate(new Date());
  };

  // Calendar math
  const firstDayIndex = new Date(year, month, 1).getDay(); // 0 = Sunday
  const totalDays = new Date(year, month + 1, 0).getDate();

  const daysArray = [];
  for (let i = 0; i < firstDayIndex; i++) {
    daysArray.push(null);
  }
  for (let i = 1; i <= totalDays; i++) {
    daysArray.push(i);
  }

  const monthNames = [
    'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
  ];

  const todayFormatted = new Date().toISOString().split('T')[0];

  const handleDayClick = (day) => {
    if (!day) return;
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    const notesForDate = calendarData[dateStr];

    if (notesForDate && notesForDate.length > 0) {
      // Open existing note
      onOpenNote({ id: notesForDate[0].id, note_date: dateStr, title: notesForDate[0].title });
    } else {
      // Create new note for this date
      onNavigate('new-note', { date: dateStr });
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200 dark:border-slate-800">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight flex items-center gap-2.5">
            <CalendarIcon className="w-6 h-6 text-sky-500" />
            Kalender Catatan
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            Lihat riwayat catatan harian dan mood berdasarkan tanggal
          </p>
        </div>

        {/* Month Navigation Controls */}
        <div className="flex items-center gap-2">
          <button
            onClick={todayMonth}
            className="px-3 py-1.5 text-xs font-semibold rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700/70 transition-colors shadow-sm"
          >
            Hari Ini
          </button>
          <div className="flex items-center rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 overflow-hidden shadow-sm">
            <button
              onClick={prevMonth}
              className="p-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
              title="Bulan Sebelumnya"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="px-4 text-xs font-bold text-slate-800 dark:text-slate-200 min-w-[130px] text-center">
              {monthNames[month]} {year}
            </span>
            <button
              onClick={nextMonth}
              className="p-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
              title="Bulan Berikutnya"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Calendar Grid Container */}
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm overflow-hidden">
        {/* Day Header (Sun - Sat) */}
        <div className="grid grid-cols-7 border-b border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40 text-center py-2.5 text-xs font-bold text-slate-500 dark:text-slate-400">
          <div className="text-rose-500">Min</div>
          <div>Sen</div>
          <div>Sel</div>
          <div>Rab</div>
          <div>Kam</div>
          <div>Jum</div>
          <div>Sab</div>
        </div>

        {/* Days cells */}
        <div className="grid grid-cols-7 auto-rows-fr divide-x divide-y divide-slate-100 dark:divide-slate-800/60 border-b border-slate-100 dark:border-slate-800">
          {daysArray.map((day, idx) => {
            if (day === null) {
              return <div key={`empty-${idx}`} className="bg-slate-50/30 dark:bg-slate-950/20 min-h-[90px] sm:min-h-[115px]" />;
            }

            const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
            const notes = calendarData[dateStr] || [];
            const hasNotes = notes.length > 0;
            const isToday = dateStr === todayFormatted;
            const primaryNote = notes[0];
            const moodObj = primaryNote?.mood ? MOOD_OPTIONS.find(m => m.value === primaryNote.mood) : null;

            return (
              <div
                key={dateStr}
                onClick={() => handleDayClick(day)}
                className={`min-h-[90px] sm:min-h-[115px] p-2 flex flex-col justify-between transition-all cursor-pointer hover:bg-sky-50/40 dark:hover:bg-sky-950/20 group relative ${
                  isToday ? 'bg-sky-50/30 dark:bg-sky-950/10' : ''
                }`}
              >
                {/* Date header */}
                <div className="flex items-center justify-between">
                  <span
                    className={`inline-flex items-center justify-center text-xs font-semibold w-6 h-6 rounded-full ${
                      isToday
                        ? 'bg-sky-500 text-white shadow-sm'
                        : 'text-slate-700 dark:text-slate-300 group-hover:text-sky-600'
                    }`}
                  >
                    {day}
                  </span>

                  {/* Mood badge if recorded */}
                  {moodObj && (
                    <span className="text-sm" title={`Mood: ${moodObj.value}`}>
                      {moodObj.emoji}
                    </span>
                  )}
                </div>

                {/* Note Indicator / Preview */}
                <div className="mt-1 flex-1 flex flex-col justify-end">
                  {hasNotes ? (
                    <div className="p-1.5 rounded-lg bg-sky-50/80 dark:bg-sky-950/60 border border-sky-100 dark:border-sky-900/60 text-[11px] leading-tight text-sky-800 dark:text-sky-300 font-medium group-hover:shadow-sm transition-all">
                      <p className="truncate font-semibold">{primaryNote.title}</p>
                      {notes.length > 1 && (
                        <p className="text-[9px] text-sky-600 dark:text-sky-400 mt-0.5">
                          +{notes.length - 1} catatan lain
                        </p>
                      )}
                    </div>
                  ) : (
                    <div className="opacity-0 group-hover:opacity-100 flex items-center justify-center py-1 text-[11px] text-slate-400 font-medium transition-opacity">
                      <Plus className="w-3 h-3 mr-0.5" /> Tulis
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

