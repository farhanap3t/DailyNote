import React from 'react';

export const MOOD_OPTIONS = [
  { value: 'Great', emoji: '😄', label: 'Luar Biasa', color: 'bg-emerald-50 text-emerald-600 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-800' },
  { value: 'Good', emoji: '🙂', label: 'Baik', color: 'bg-sky-50 text-sky-600 border-sky-200 dark:bg-sky-950/40 dark:text-sky-400 dark:border-sky-800' },
  { value: 'Okay', emoji: '😐', label: 'Biasa', color: 'bg-amber-50 text-amber-600 border-amber-200 dark:bg-amber-950/40 dark:text-amber-400 dark:border-amber-800' },
  { value: 'Bad', emoji: '🙁', label: 'Kurang Baik', color: 'bg-orange-50 text-orange-600 border-orange-200 dark:bg-orange-950/40 dark:text-orange-400 dark:border-orange-800' },
  { value: 'Terrible', emoji: '😢', label: 'Buruk', color: 'bg-rose-50 text-rose-600 border-rose-200 dark:bg-rose-950/40 dark:text-rose-400 dark:border-rose-800' },
];

export default function MoodSelector({ selectedMood, onChange }) {
  return (
    <div className="flex flex-col gap-2">
      <label className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
        Mood Hari Ini
      </label>
      <div className="flex flex-wrap items-center gap-2">
        {MOOD_OPTIONS.map((mood) => {
          const isSelected = selectedMood === mood.value;
          return (
            <button
              key={mood.value}
              type="button"
              onClick={() => onChange(isSelected ? null : mood.value)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${
                isSelected
                  ? `${mood.color} ring-2 ring-sky-400 dark:ring-sky-500 scale-105 shadow-sm font-semibold`
                  : 'bg-white dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'
              }`}
            >
              <span className="text-sm">{mood.emoji}</span>
              <span>{mood.value}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

