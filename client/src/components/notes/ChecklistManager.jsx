import React, { useState } from 'react';
import { CheckSquare, Plus, Trash2, GripVertical, Check } from 'lucide-react';

export default function ChecklistManager({ checklists = [], onChange }) {
  const [newItem, setNewItem] = useState('');

  const handleAddItem = (e) => {
    e?.preventDefault();
    if (!newItem.trim()) return;
    const item = {
      id: 'local-' + Date.now() + Math.random().toString(36).substr(2, 4),
      content: newItem.trim(),
      is_completed: false,
      position: checklists.length
    };
    onChange([...checklists, item]);
    setNewItem('');
  };

  const toggleCheck = (index) => {
    const updated = checklists.map((item, idx) => {
      if (idx === index) {
        return { ...item, is_completed: !item.is_completed };
      }
      return item;
    });
    onChange(updated);
  };

  const removeItem = (index) => {
    onChange(checklists.filter((_, idx) => idx !== index));
  };

  const completedCount = checklists.filter(c => c.is_completed).length;

  return (
    <div className="flex flex-col gap-2 pt-2 border-t border-slate-100 dark:border-slate-800/80">
      <div className="flex items-center justify-between">
        <label className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
          <CheckSquare className="w-3.5 h-3.5 text-sky-500" />
          Checklist Tugas / Aktivitas ({completedCount}/{checklists.length})
        </label>
        {checklists.length > 0 && (
          <span className="text-[11px] font-medium text-slate-400">
            {Math.round((completedCount / checklists.length) * 100)}% selesai
          </span>
        )}
      </div>

      {/* Checklist items */}
      <div className="space-y-1.5">
        {checklists.map((item, index) => (
          <div
            key={item.id || index}
            className={`group flex items-center gap-2.5 px-3 py-2 rounded-xl border transition-all ${
              item.is_completed
                ? 'bg-slate-50/70 dark:bg-slate-900/40 border-slate-200/60 dark:border-slate-800/40 text-slate-400'
                : 'bg-white dark:bg-slate-800/70 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200'
            }`}
          >
            <button
              type="button"
              onClick={() => toggleCheck(index)}
              className={`w-5 h-5 rounded-md border flex items-center justify-center transition-colors ${
                item.is_completed
                  ? 'bg-emerald-500 border-emerald-500 text-white'
                  : 'border-slate-300 dark:border-slate-600 hover:border-sky-500'
              }`}
            >
              {item.is_completed && <Check className="w-3.5 h-3.5 stroke-[3]" />}
            </button>

            <span className={`flex-1 text-sm ${item.is_completed ? 'line-through text-slate-400 dark:text-slate-500' : ''}`}>
              {item.content}
            </span>

            <button
              type="button"
              onClick={() => removeItem(index)}
              className="opacity-0 group-hover:opacity-100 p-1 text-slate-400 hover:text-rose-500 rounded transition-opacity"
              title="Hapus tugas"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>

      {/* Add new checklist input */}
      <form onSubmit={handleAddItem} className="flex items-center gap-2 mt-1">
        <input
          type="text"
          value={newItem}
          onChange={(e) => setNewItem(e.target.value)}
          placeholder="Tambah checklist aktivitas baru..."
          className="flex-1 text-xs sm:text-sm px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:border-sky-500 focus:bg-white dark:focus:bg-slate-800"
        />
        <button
          type="submit"
          disabled={!newItem.trim()}
          className="flex items-center gap-1 px-3 py-2 bg-sky-500 hover:bg-sky-600 disabled:opacity-50 text-white text-xs font-medium rounded-xl shadow-sm transition-all"
        >
          <Plus className="w-4 h-4" />
          <span className="hidden sm:inline">Tambah</span>
        </button>
      </form>
    </div>
  );
}

