import React from 'react';
import { Star, Paperclip, CheckSquare, Calendar, Archive, Trash2, RotateCcw } from 'lucide-react';
import { MOOD_OPTIONS } from './MoodSelector';

export default function NoteCard({
  note,
  onOpen,
  onToggleFavorite,
  onToggleArchive,
  onDelete,
  onRestore,
  isTrashView = false,
  isArchiveView = false
}) {
  const moodObj = MOOD_OPTIONS.find(m => m.value === note.mood);

  // Strip HTML for plain excerpt
  const plainSnippet = (note.content || '')
    .replace(/<[^>]*>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 140);

  const checklistTotal = note.checklist_stats?.total || (note.checklists ? note.checklists.length : 0);
  const checklistCompleted = note.checklist_stats?.completed || (note.checklists ? note.checklists.filter(c => c.is_completed).length : 0);
  const attachmentCount = note.attachment_count !== undefined ? note.attachment_count : (note.attachments ? note.attachments.length : 0);

  return (
    <div
      onClick={() => onOpen && onOpen(note)}
      className="group relative flex flex-col justify-between p-4 sm:p-5 rounded-2xl border border-slate-200/90 dark:border-slate-800/80 bg-white dark:bg-slate-900/80 hover:border-sky-300 dark:hover:border-sky-700/60 hover:shadow-md transition-all cursor-pointer"
    >
      <div>
        {/* Header: Date, Mood & Favorite */}
        <div className="flex items-center justify-between gap-2 mb-2.5">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1 text-xs font-medium text-slate-500 dark:text-slate-400">
              <Calendar className="w-3.5 h-3.5" />
              {note.note_date}
            </span>

            {moodObj && (
              <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold border ${moodObj.color}`}>
                <span>{moodObj.emoji}</span>
                <span>{moodObj.value}</span>
              </span>
            )}
          </div>

          <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
            {!isTrashView && onToggleFavorite && (
              <button
                type="button"
                onClick={() => onToggleFavorite(note.id)}
                className={`p-1.5 rounded-lg transition-colors ${
                  note.is_favorite
                    ? 'text-amber-500 hover:bg-amber-50 dark:hover:bg-amber-950/30'
                    : 'text-slate-300 dark:text-slate-600 hover:text-amber-400'
                }`}
                title={note.is_favorite ? 'Hapus dari Favorit' : 'Tandai Favorit'}
              >
                <Star className={`w-4 h-4 ${note.is_favorite ? 'fill-amber-400 text-amber-500' : ''}`} />
              </button>
            )}

            {isTrashView ? (
              <>
                <button
                  type="button"
                  onClick={() => onRestore && onRestore(note.id)}
                  className="p-1.5 text-slate-400 hover:text-sky-600 dark:hover:text-sky-400 rounded-lg hover:bg-sky-50 dark:hover:bg-slate-800"
                  title="Pulihkan Catatan"
                >
                  <RotateCcw className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => onDelete && onDelete(note.id, true)}
                  className="p-1.5 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/20"
                  title="Hapus Permanen"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </>
            ) : isArchiveView ? (
              <>
                <button
                  type="button"
                  onClick={() => onToggleArchive && onToggleArchive(note.id)}
                  className="p-1.5 text-slate-400 hover:text-sky-600 dark:hover:text-sky-400 rounded-lg hover:bg-sky-50 dark:hover:bg-slate-800"
                  title="Keluarkan dari Arsip"
                >
                  <Archive className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => onDelete && onDelete(note.id, false)}
                  className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/20"
                  title="Pindahkan ke Sampah"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </>
            ) : (
              <button
                type="button"
                onClick={() => onDelete && onDelete(note.id, false)}
                className="opacity-0 group-hover:opacity-100 p-1.5 text-slate-400 hover:text-rose-600 rounded-lg transition-opacity"
                title="Pindahkan ke Sampah"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Title */}
        <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 line-clamp-1 mb-1.5 group-hover:text-sky-600 dark:group-hover:text-sky-400 transition-colors">
          {note.title}
        </h3>

        {/* Content Snippet */}
        <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed mb-3">
          {plainSnippet || <span className="italic text-slate-400">Tidak ada teks...</span>}
        </p>
      </div>

      {/* Footer: Tags, Checklists & Attachments info */}
      <div className="pt-2 border-t border-slate-100 dark:border-slate-800/60 flex items-center justify-between gap-2 text-xs">
        {/* Tags */}
        <div className="flex flex-wrap items-center gap-1 overflow-hidden">
          {note.tags && note.tags.slice(0, 3).map((t, idx) => (
            <span
              key={idx}
              className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300"
            >
              #{typeof t === 'string' ? t : t.name}
            </span>
          ))}
          {note.tags && note.tags.length > 3 && (
            <span className="text-[10px] text-slate-400">+{note.tags.length - 3}</span>
          )}
        </div>

        {/* Indicators */}
        <div className="flex items-center gap-2.5 text-slate-400 shrink-0">
          {checklistTotal > 0 && (
            <span className="flex items-center gap-1 text-[11px]" title={`Tugas: ${checklistCompleted}/${checklistTotal}`}>
              <CheckSquare className="w-3.5 h-3.5 text-sky-500" />
              <span>{checklistCompleted}/{checklistTotal}</span>
            </span>
          )}

          {attachmentCount > 0 && (
            <span className="flex items-center gap-1 text-[11px]" title={`${attachmentCount} lampiran`}>
              <Paperclip className="w-3.5 h-3.5" />
              <span>{attachmentCount}</span>
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

