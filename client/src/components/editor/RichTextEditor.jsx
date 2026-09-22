import React, { useRef, useEffect } from 'react';
import {
  Bold,
  Italic,
  Underline as UnderlineIcon,
  Heading1,
  Heading2,
  List,
  ListOrdered,
  Quote,
  Code,
  Link as LinkIcon,
  Image as ImageIcon,
  CheckCircle2,
  CloudOff,
  RefreshCw,
  Clock
} from 'lucide-react';

export default function RichTextEditor({
  content = '',
  onChange,
  autoSaveStatus = 'saved', // 'saving' | 'saved' | 'offline' | 'syncing'
  lastSavedAt = null
}) {
  const editorRef = useRef(null);

  // Sync incoming content with editor without losing cursor position
  useEffect(() => {
    if (editorRef.current && editorRef.current.innerHTML !== content) {
      // Only set if completely different (e.g. initial load or different note loaded)
      if (document.activeElement !== editorRef.current) {
        editorRef.current.innerHTML = content || '';
      }
    }
  }, [content]);

  const handleInput = () => {
    if (editorRef.current) {
      onChange(editorRef.current.innerHTML);
    }
  };

  const format = (command, value = null) => {
    document.execCommand(command, false, value);
    if (editorRef.current) {
      editorRef.current.focus();
      handleInput();
    }
  };

  const promptLink = () => {
    const url = window.prompt('Masukkan URL tautan:', 'https://');
    if (url) {
      format('createLink', url);
    }
  };

  const promptImage = () => {
    const url = window.prompt('Masukkan URL gambar:');
    if (url) {
      format('insertImage', url);
    }
  };

  // Status Badge Indicator (PRD Section 12)
  const renderAutoSaveBadge = () => {
    switch (autoSaveStatus) {
      case 'saving':
        return (
          <span className="inline-flex items-center gap-1.5 text-xs text-amber-500 font-medium animate-pulse">
            <RefreshCw className="w-3.5 h-3.5 animate-spin" />
            Saving...
          </span>
        );
      case 'saved':
        return (
          <span className="inline-flex items-center gap-1.5 text-xs text-emerald-500 dark:text-emerald-400 font-medium">
            <CheckCircle2 className="w-3.5 h-3.5" />
            Saved ✓ {lastSavedAt && <span className="text-[10px] text-slate-400 font-normal">({lastSavedAt})</span>}
          </span>
        );
      case 'offline':
        return (
          <span className="inline-flex items-center gap-1.5 text-xs text-orange-500 font-medium">
            <CloudOff className="w-3.5 h-3.5" />
            Offline — Changes saved locally
          </span>
        );
      case 'syncing':
        return (
          <span className="inline-flex items-center gap-1.5 text-xs text-sky-500 font-medium animate-pulse">
            <RefreshCw className="w-3.5 h-3.5 animate-spin" />
            Syncing...
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <div className="flex flex-col border border-slate-200 dark:border-slate-800 rounded-2xl bg-white dark:bg-slate-900 overflow-hidden shadow-sm transition-colors">
      {/* TOOLBAR */}
      <div className="flex flex-wrap items-center justify-between gap-1 p-2 bg-slate-50/80 dark:bg-slate-800/40 border-b border-slate-200 dark:border-slate-800">
        <div className="flex flex-wrap items-center gap-0.5">
          <button
            type="button"
            onClick={() => format('bold')}
            className="p-2 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-200/70 dark:hover:bg-slate-700/60 transition-colors"
            title="Tebal (Ctrl+B)"
          >
            <Bold className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => format('italic')}
            className="p-2 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-200/70 dark:hover:bg-slate-700/60 transition-colors"
            title="Miring (Ctrl+I)"
          >
            <Italic className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => format('underline')}
            className="p-2 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-200/70 dark:hover:bg-slate-700/60 transition-colors"
            title="Garis Bawah (Ctrl+U)"
          >
            <UnderlineIcon className="w-4 h-4" />
          </button>

          <div className="w-[1px] h-5 bg-slate-300 dark:bg-slate-700 mx-1 self-center" />

          <button
            type="button"
            onClick={() => format('formatBlock', '<h1>')}
            className="p-2 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-200/70 dark:hover:bg-slate-700/60 transition-colors"
            title="Heading 1"
          >
            <Heading1 className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => format('formatBlock', '<h2>')}
            className="p-2 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-200/70 dark:hover:bg-slate-700/60 transition-colors"
            title="Heading 2"
          >
            <Heading2 className="w-4 h-4" />
          </button>

          <div className="w-[1px] h-5 bg-slate-300 dark:bg-slate-700 mx-1 self-center" />

          <button
            type="button"
            onClick={() => format('insertUnorderedList')}
            className="p-2 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-200/70 dark:hover:bg-slate-700/60 transition-colors"
            title="Daftar Poin"
          >
            <List className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => format('insertOrderedList')}
            className="p-2 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-200/70 dark:hover:bg-slate-700/60 transition-colors"
            title="Daftar Angka"
          >
            <ListOrdered className="w-4 h-4" />
          </button>

          <div className="w-[1px] h-5 bg-slate-300 dark:bg-slate-700 mx-1 self-center" />

          <button
            type="button"
            onClick={() => format('formatBlock', '<blockquote>')}
            className="p-2 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-200/70 dark:hover:bg-slate-700/60 transition-colors"
            title="Kutipan (Quote)"
          >
            <Quote className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => format('formatBlock', '<pre>')}
            className="p-2 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-200/70 dark:hover:bg-slate-700/60 transition-colors"
            title="Blok Kode"
          >
            <Code className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={promptLink}
            className="p-2 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-200/70 dark:hover:bg-slate-700/60 transition-colors"
            title="Tautan / Link"
          >
            <LinkIcon className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={promptImage}
            className="p-2 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-200/70 dark:hover:bg-slate-700/60 transition-colors"
            title="Sisipkan Gambar via URL"
          >
            <ImageIcon className="w-4 h-4" />
          </button>
        </div>

        {/* Status Indicator */}
        <div className="flex items-center px-2 py-1">
          {renderAutoSaveBadge()}
        </div>
      </div>

      {/* EDITABLE CONTENT CANVAS */}
      <div
        ref={editorRef}
        contentEditable
        onInput={handleInput}
        className="editor-content p-4 sm:p-6 text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none overflow-y-auto"
        data-placeholder="Tulis ceritamu hari ini, refleksi, atau catatan penting..."
        style={{ minHeight: '300px' }}
      />
    </div>
  );
}

