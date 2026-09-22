import React, { useState } from 'react';
import { Tag as TagIcon, X, Plus } from 'lucide-react';

const COMMON_TAGS = ['work', 'personal', 'project', 'meeting', 'idea', 'study', 'health', 'finance'];

export default function TagInput({ tags = [], onChange }) {
  const [inputVal, setInputVal] = useState('');

  const addTag = (tagName) => {
    const clean = tagName.trim().replace(/^#/, '').toLowerCase();
    if (clean && !tags.includes(clean)) {
      onChange([...tags, clean]);
    }
    setInputVal('');
  };

  const removeTag = (indexToRemove) => {
    onChange(tags.filter((_, idx) => idx !== indexToRemove));
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      addTag(inputVal);
    }
  };

  return (
    <div className="flex flex-col gap-2">
      <label className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
        <TagIcon className="w-3.5 h-3.5" />
        Tags
      </label>

      {/* Selected tags */}
      <div className="flex flex-wrap items-center gap-1.5 min-h-[32px]">
        {tags.map((tag, idx) => (
          <span
            key={idx}
            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-sky-50 dark:bg-sky-950/50 text-sky-700 dark:text-sky-300 border border-sky-200 dark:border-sky-800 animate-in fade-in zoom-in-95"
          >
            #{tag}
            <button
              type="button"
              onClick={() => removeTag(idx)}
              className="text-sky-400 hover:text-sky-700 dark:hover:text-sky-200 focus:outline-none"
            >
              <X className="w-3 h-3" />
            </button>
          </span>
        ))}

        <div className="inline-flex items-center gap-1">
          <input
            type="text"
            value={inputVal}
            onChange={(e) => setInputVal(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Tambah tag... (Tekan Enter)"
            className="text-xs px-2.5 py-1 rounded-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 focus:outline-none focus:border-sky-500 w-36"
          />
          {inputVal && (
            <button
              type="button"
              onClick={() => addTag(inputVal)}
              className="p-1 text-sky-600 dark:text-sky-400 hover:bg-sky-50 dark:hover:bg-slate-700 rounded-full"
            >
              <Plus className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Suggested quick tags */}
      <div className="flex flex-wrap items-center gap-1 pt-1">
        <span className="text-[11px] text-slate-400">Saran:</span>
        {COMMON_TAGS.filter(t => !tags.includes(t)).slice(0, 5).map(t => (
          <button
            key={t}
            type="button"
            onClick={() => addTag(t)}
            className="text-[11px] px-2 py-0.5 rounded text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            +{t}
          </button>
        ))}
      </div>
    </div>
  );
}

