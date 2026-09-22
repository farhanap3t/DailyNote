import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  ArrowLeft,
  Calendar as CalendarIcon,
  Star,
  Archive,
  Trash2,
  Share2,
  Check,
  Save,
  RotateCcw
} from 'lucide-react';
import { api } from '../api/client';
import MoodSelector from '../components/notes/MoodSelector';
import TagInput from '../components/notes/TagInput';
import ChecklistManager from '../components/notes/ChecklistManager';
import AttachmentManager from '../components/notes/AttachmentManager';
import RichTextEditor from '../components/editor/RichTextEditor';

export default function NoteEditorPage({ noteId, initialDate, onBack, onSaveSuccess }) {
  const [id, setId] = useState(noteId || null);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [noteDate, setNoteDate] = useState(initialDate || new Date().toISOString().split('T')[0]);
  const [mood, setMood] = useState(null);
  const [isFavorite, setIsFavorite] = useState(false);
  const [isArchived, setIsArchived] = useState(false);
  const [tags, setTags] = useState([]);
  const [checklists, setChecklists] = useState([]);
  const [attachments, setAttachments] = useState([]);

  const [autoSaveStatus, setAutoSaveStatus] = useState('saved'); // 'saving' | 'saved' | 'offline' | 'syncing'
  const [lastSavedAt, setLastSavedAt] = useState(null);
  const [loading, setLoading] = useState(Boolean(noteId));

  const saveTimerRef = useRef(null);
  const isFirstLoad = useRef(true);

  // Load existing note if editing
  useEffect(() => {
    if (!noteId) {
      isFirstLoad.current = false;
      return;
    }

    async function fetchNote() {
      try {
        setLoading(true);
        const data = await api.getNote(noteId);
        const n = data.note;
        setId(n.id);
        setTitle(n.title || '');
        setContent(n.content || '');
        setNoteDate(n.note_date || new Date().toISOString().split('T')[0]);
        setMood(n.mood || null);
        setIsFavorite(Boolean(n.is_favorite));
        setIsArchived(Boolean(n.is_archived));
        setTags(n.tags ? n.tags.map(t => (typeof t === 'string' ? t : t.name)) : []);
        setChecklists(n.checklists || []);
        setAttachments(n.attachments || []);
        setAutoSaveStatus('saved');
      } catch (err) {
        console.error('Error fetching note:', err);
      } finally {
        setLoading(false);
        setTimeout(() => {
          isFirstLoad.current = false;
        }, 300);
      }
    }

    fetchNote();
  }, [noteId]);

  // Execute Save function
  const performSave = useCallback(async () => {
    if (!title.trim() && !content.trim()) return;

    setAutoSaveStatus('saving');

    const notePayload = {
      title: title.trim() || 'Catatan Tanpa Judul',
      content,
      note_date: noteDate,
      mood,
      is_favorite: isFavorite,
      is_archived: isArchived,
      tags,
      checklists
    };

    // Offline cache backup
    try {
      localStorage.setItem(`dailynote_offline_backup_${noteDate}`, JSON.stringify(notePayload));
    } catch (e) {}

    // Check online status
    if (!navigator.onLine) {
      setAutoSaveStatus('offline');
      return;
    }

    try {
      let savedNote;
      if (id) {
        const res = await api.updateNote(id, notePayload);
        savedNote = res.note;
      } else {
        const res = await api.createNote(notePayload);
        savedNote = res.note;
        setId(savedNote.id);
      }

      setAutoSaveStatus('saved');
      const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      setLastSavedAt(timeStr);
      if (onSaveSuccess) onSaveSuccess(savedNote);
    } catch (err) {
      console.warn('Auto save error:', err.message);
      setAutoSaveStatus('offline');
    }
  }, [id, title, content, noteDate, mood, isFavorite, isArchived, tags, checklists, onSaveSuccess]);

  // Debounced auto-save on change
  useEffect(() => {
    if (isFirstLoad.current) return;
    if (!title && !content) return;

    if (saveTimerRef.current) {
      clearTimeout(saveTimerRef.current);
    }

    saveTimerRef.current = setTimeout(() => {
      performSave();
    }, 1200);

    return () => {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    };
  }, [title, content, noteDate, mood, isFavorite, isArchived, tags, checklists, performSave]);

  const handleManualSave = () => {
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    performSave();
  };

  const handleToggleFavorite = () => {
    setIsFavorite(prev => !prev);
  };

  const handleToggleArchive = () => {
    setIsArchived(prev => !prev);
  };

  const handleAttachmentAdded = (newAtt) => {
    setAttachments(prev => [newAtt, ...prev]);
  };

  const handleAttachmentDeleted = (attId) => {
    setAttachments(prev => prev.filter(a => a.id !== attId));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96 text-slate-400">
        <p className="text-sm">Memuat catatan...</p>
      </div>
    );
  }

  return (
    <div className="p-3 sm:p-6 lg:p-8 max-w-5xl mx-auto space-y-4">
      {/* Top action header */}
      <div className="flex items-center justify-between gap-3 pb-3 border-b border-slate-200 dark:border-slate-800">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onBack}
            className="p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            title="Kembali"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>

          {/* Date Picker */}
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-medium text-slate-700 dark:text-slate-200 shadow-sm">
            <CalendarIcon className="w-3.5 h-3.5 text-sky-500" />
            <input
              type="date"
              value={noteDate}
              onChange={(e) => setNoteDate(e.target.value)}
              className="bg-transparent text-xs focus:outline-none cursor-pointer"
            />
          </div>
        </div>

        {/* Right action icons */}
        <div className="flex items-center gap-1 sm:gap-2">
          <button
            type="button"
            onClick={handleToggleFavorite}
            className={`p-2 rounded-xl border transition-all ${
              isFavorite
                ? 'bg-amber-50 dark:bg-amber-950/40 text-amber-500 border-amber-200 dark:border-amber-800'
                : 'border-slate-200 dark:border-slate-700 text-slate-400 hover:text-amber-500'
            }`}
            title="Favorit"
          >
            <Star className={`w-4 h-4 ${isFavorite ? 'fill-amber-400 text-amber-500' : ''}`} />
          </button>

          <button
            type="button"
            onClick={handleToggleArchive}
            className={`p-2 rounded-xl border transition-all ${
              isArchived
                ? 'bg-sky-50 dark:bg-sky-950/40 text-sky-600 border-sky-200 dark:border-sky-800'
                : 'border-slate-200 dark:border-slate-700 text-slate-400 hover:text-sky-600'
            }`}
            title={isArchived ? 'Batal Arsipkan' : 'Arsipkan'}
          >
            <Archive className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={handleManualSave}
            className="flex items-center gap-1.5 px-3 py-2 bg-sky-500 hover:bg-sky-600 text-white text-xs font-semibold rounded-xl shadow-sm transition-all active:scale-95"
          >
            <Save className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Simpan</span>
          </button>
        </div>
      </div>

      {/* Note Title Input */}
      <div>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Judul Catatan..."
          className="w-full text-xl sm:text-2xl lg:text-3xl font-extrabold bg-transparent text-slate-900 dark:text-white placeholder:text-slate-300 dark:placeholder:text-slate-600 focus:outline-none"
        />
      </div>

      {/* Mood Selector (PRD Section 13) */}
      <MoodSelector selectedMood={mood} onChange={setMood} />

      {/* Tags Input (PRD Section 15) */}
      <TagInput tags={tags} onChange={setTags} />

      {/* Rich Text Editor Canvas (PRD Section 11 & 12) */}
      <RichTextEditor
        content={content}
        onChange={setContent}
        autoSaveStatus={autoSaveStatus}
        lastSavedAt={lastSavedAt}
      />

      {/* Checklist Manager (PRD Section 14) */}
      <ChecklistManager checklists={checklists} onChange={setChecklists} />

      {/* Attachment Manager (PRD Section 21) */}
      <AttachmentManager
        noteId={id}
        attachments={attachments}
        onAttachmentAdded={handleAttachmentAdded}
        onAttachmentDeleted={handleAttachmentDeleted}
      />
    </div>
  );
}

