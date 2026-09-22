import React, { useState, useEffect } from 'react';
import { BookOpen, Star, Archive, Trash2, Plus, Search, Filter } from 'lucide-react';
import { api } from '../api/client';
import NoteCard from '../components/notes/NoteCard';

export default function NotesListPage({ initialTab = 'all', onNavigate, onOpenNote }) {
  const [currentTab, setCurrentTab] = useState(initialTab);
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchFilter, setSearchFilter] = useState('');

  const tabs = [
    { id: 'all', label: 'Semua Catatan', icon: BookOpen },
    { id: 'favorites', label: 'Favorit', icon: Star },
    { id: 'archive', label: 'Arsip', icon: Archive },
    { id: 'trash', label: 'Sampah', icon: Trash2 },
  ];

  const fetchNotes = async () => {
    try {
      setLoading(true);
      const res = await api.getNotes(currentTab);
      setNotes(res.notes || []);
    } catch (err) {
      console.error('Error fetching notes list:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotes();
  }, [currentTab]);

  const handleToggleFavorite = async (noteId) => {
    await api.toggleFavorite(noteId);
    fetchNotes();
  };

  const handleToggleArchive = async (noteId) => {
    await api.toggleArchive(noteId);
    fetchNotes();
  };

  const handleDelete = async (noteId, isHardDelete = false) => {
    if (isHardDelete) {
      if (!window.confirm('Yakin ingin menghapus catatan ini secara permanen? Data tidak dapat dipulihkan.')) {
        return;
      }
    }
    await api.deleteNote(noteId);
    fetchNotes();
  };

  const handleRestore = async (noteId) => {
    await api.restoreNote(noteId);
    fetchNotes();
  };

  const filteredNotes = notes.filter(n => {
    if (!searchFilter.trim()) return true;
    const q = searchFilter.toLowerCase();
    const titleMatch = n.title?.toLowerCase().includes(q);
    const contentMatch = n.content?.toLowerCase().includes(q);
    const tagMatch = n.tags?.some(t => (typeof t === 'string' ? t : t.name).toLowerCase().includes(q));
    return titleMatch || contentMatch || tagMatch;
  });

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
      {/* Header & Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200 dark:border-slate-800">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Catatan
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Kelola dan cari seluruh catatan pribadi Anda
          </p>
        </div>

        {currentTab !== 'trash' && (
          <button
            onClick={() => onNavigate('new-note')}
            className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-600 hover:to-indigo-700 text-white text-sm font-semibold rounded-xl shadow-md shadow-sky-500/20 transition-all self-start sm:self-auto"
          >
            <Plus className="w-4 h-4" />
            <span>Catatan Baru</span>
          </button>
        )}
      </div>

      {/* Tabs navigation & Quick Filter */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        {/* Tab Buttons */}
        <div className="flex items-center gap-1.5 p-1 bg-slate-100 dark:bg-slate-800/80 rounded-2xl w-fit overflow-x-auto max-w-full">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = currentTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setCurrentTab(tab.id)}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all whitespace-nowrap ${
                  isActive
                    ? 'bg-white dark:bg-slate-900 text-sky-600 dark:text-sky-400 shadow-sm'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Quick Search */}
        <div className="relative w-full md:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchFilter}
            onChange={(e) => setSearchFilter(e.target.value)}
            placeholder="Saring catatan..."
            className="w-full text-xs sm:text-sm pl-9 pr-4 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200 placeholder:text-slate-400 focus:outline-none focus:border-sky-500"
          />
        </div>
      </div>

      {/* Notes Grid */}
      {loading ? (
        <div className="py-20 text-center text-slate-400 text-sm">
          Memuat catatan...
        </div>
      ) : filteredNotes.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredNotes.map((note) => (
            <NoteCard
              key={note.id}
              note={note}
              onOpen={onOpenNote}
              onToggleFavorite={handleToggleFavorite}
              onToggleArchive={handleToggleArchive}
              onDelete={handleDelete}
              onRestore={handleRestore}
              isTrashView={currentTab === 'trash'}
              isArchiveView={currentTab === 'archive'}
            />
          ))}
        </div>
      ) : (
        <div className="p-12 rounded-2xl border border-dashed border-slate-300 dark:border-slate-800 text-center space-y-2">
          <p className="text-slate-600 dark:text-slate-400 font-medium">
            Tidak ada catatan yang ditemukan di folder ini.
          </p>
          {currentTab === 'all' && (
            <button
              onClick={() => onNavigate('new-note')}
              className="text-xs font-semibold text-sky-600 dark:text-sky-400 hover:underline"
            >
              + Buat catatan pertama Anda sekarang
            </button>
          )}
        </div>
      )}
    </div>
  );
}

