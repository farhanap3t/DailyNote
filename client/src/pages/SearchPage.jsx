import React, { useState, useEffect } from 'react';
import { Search as SearchIcon, Filter, X, Calendar, Tag as TagIcon, Smile } from 'lucide-react';
import { api } from '../api/client';
import NoteCard from '../components/notes/NoteCard';
import { MOOD_OPTIONS } from '../components/notes/MoodSelector';

export default function SearchPage({ onOpenNote }) {
  const [q, setQ] = useState('');
  const [selectedMood, setSelectedMood] = useState('');
  const [selectedTag, setSelectedTag] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [tagsList, setTagsList] = useState([]);

  useEffect(() => {
    // Load available tags for quick filter
    api.getTags().then(res => setTagsList(res.tags || [])).catch(() => {});
  }, []);

  const performSearch = async () => {
    try {
      setLoading(true);
      const res = await api.searchNotes({
        q,
        mood: selectedMood,
        tag: selectedTag,
        startDate,
        endDate
      });
      setResults(res.results || []);
    } catch (err) {
      console.error('Error in search:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      performSearch();
    }, 300);
    return () => clearTimeout(timer);
  }, [q, selectedMood, selectedTag, startDate, endDate]);

  const clearFilters = () => {
    setQ('');
    setSelectedMood('');
    setSelectedTag('');
    setStartDate('');
    setEndDate('');
  };

  const hasActiveFilters = Boolean(q || selectedMood || selectedTag || startDate || endDate);

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="pb-2 border-b border-slate-200 dark:border-slate-800">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight flex items-center gap-2.5">
          <SearchIcon className="w-6 h-6 text-sky-500" />
          Pencarian Catatan
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
          Cari berdasarkan judul, isi, tag, tanggal, dan mood
        </p>
      </div>

      {/* Main Search Input */}
      <div className="relative">
        <SearchIcon className="w-5 h-5 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Ketik kata kunci judul atau isi catatan..."
          className="w-full pl-12 pr-10 py-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:border-sky-500 shadow-sm text-sm sm:text-base transition-colors"
        />
        {q && (
          <button
            onClick={() => setQ('')}
            className="absolute right-4 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600 rounded-full"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Filter Options (Mood, Tags, Date) */}
      <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-4 shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            <Filter className="w-3.5 h-3.5" />
            <span>Filter Tambahan</span>
          </div>

          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              className="text-xs font-semibold text-rose-500 hover:underline flex items-center gap-1"
            >
              <X className="w-3.5 h-3.5" /> Reset Semua Filter
            </button>
          )}
        </div>

        {/* Mood filter */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-medium text-slate-400 flex items-center gap-1">
            <Smile className="w-3.5 h-3.5" /> Mood:
          </span>
          <button
            onClick={() => setSelectedMood('')}
            className={`text-xs px-2.5 py-1 rounded-full border transition-all ${
              !selectedMood
                ? 'bg-slate-800 text-white dark:bg-white dark:text-slate-900 font-semibold'
                : 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700'
            }`}
          >
            Semua
          </button>
          {MOOD_OPTIONS.map(m => (
            <button
              key={m.value}
              onClick={() => setSelectedMood(selectedMood === m.value ? '' : m.value)}
              className={`text-xs px-2.5 py-1 rounded-full border flex items-center gap-1 transition-all ${
                selectedMood === m.value
                  ? `${m.color} ring-2 ring-sky-400 font-bold`
                  : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700'
              }`}
            >
              <span>{m.emoji}</span>
              <span>{m.value}</span>
            </button>
          ))}
        </div>

        {/* Tag filter */}
        {tagsList.length > 0 && (
          <div className="flex flex-wrap items-center gap-1.5 pt-2 border-t border-slate-100 dark:border-slate-800/80">
            <span className="text-xs font-medium text-slate-400 flex items-center gap-1">
              <TagIcon className="w-3.5 h-3.5" /> Tags:
            </span>
            {tagsList.slice(0, 10).map(t => (
              <button
                key={t.id}
                onClick={() => setSelectedTag(selectedTag === t.name ? '' : t.name)}
                className={`text-xs px-2.5 py-1 rounded-full border transition-all ${
                  selectedTag === t.name
                    ? 'bg-sky-500 border-sky-500 text-white font-bold'
                    : 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                }`}
              >
                #{t.name}
              </button>
            ))}
          </div>
        )}

        {/* Date Range filters */}
        <div className="flex flex-wrap items-center gap-3 pt-2 border-t border-slate-100 dark:border-slate-800/80 text-xs">
          <span className="text-xs font-medium text-slate-400 flex items-center gap-1">
            <Calendar className="w-3.5 h-3.5" /> Rentang Tanggal:
          </span>
          <div className="flex items-center gap-1.5">
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="px-2.5 py-1 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 focus:outline-none"
            />
            <span className="text-slate-400">s/d</span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="px-2.5 py-1 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 focus:outline-none"
            />
          </div>
        </div>
      </div>

      {/* Results Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between text-sm">
          <span className="font-semibold text-slate-700 dark:text-slate-300">
            Hasil Pencarian ({results.length})
          </span>
        </div>

        {loading ? (
          <div className="py-20 text-center text-slate-400 text-sm">
            Mencari catatan...
          </div>
        ) : results.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {results.map((note) => (
              <NoteCard
                key={note.id}
                note={note}
                onOpen={onOpenNote}
              />
            ))}
          </div>
        ) : (
          <div className="p-12 rounded-2xl border border-dashed border-slate-300 dark:border-slate-800 text-center text-slate-500 dark:text-slate-400 text-sm">
            Tidak ada catatan yang cocok dengan kata kunci atau filter yang dipilih.
          </div>
        )}
      </div>
    </div>
  );
}

