const express = require('express');
const router = express.Router();
const db = require('../database/db');
const authMiddleware = require('../middleware/auth');

router.use(authMiddleware);

// Helper to count words in plain text / html content
function countWords(str = '') {
  if (!str) return 0;
  // Strip html tags
  const plainText = str.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
  if (!plainText) return 0;
  return plainText.split(/\s+/).length;
}

// Calculate streak
function calculateStreak(datesSet) {
  if (!datesSet || datesSet.size === 0) return 0;

  const today = new Date();
  const todayStr = today.toISOString().split('T')[0];

  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);
  const yesterdayStr = yesterday.toISOString().split('T')[0];

  let currentStreak = 0;
  let checkDate = new Date();

  // If user hasn't written today yet, check if yesterday was written to keep streak active
  if (!datesSet.has(todayStr)) {
    if (!datesSet.has(yesterdayStr)) {
      return 0;
    }
    checkDate = yesterday;
  }

  while (true) {
    const dateStr = checkDate.toISOString().split('T')[0];
    if (datesSet.has(dateStr)) {
      currentStreak++;
      checkDate.setDate(checkDate.getDate() - 1);
    } else {
      break;
    }
  }

  return currentStreak;
}

// GET /api/statistics
router.get('/', (req, res) => {
  const userId = req.user.id;

  const now = new Date();
  const currentMonth = now.toISOString().slice(0, 7); // 'YYYY-MM'

  // Fetch all non-deleted notes for word count and streaks
  const allNotes = db.prepare(`
    SELECT id, title, content, note_date, mood, created_at
    FROM notes
    WHERE user_id = ? AND is_deleted = 0
    ORDER BY note_date DESC
  `).all(userId);

  let totalWords = 0;
  let monthWords = 0;
  let notesThisMonth = 0;
  const uniqueDates = new Set();
  const writingActivityMap = {};

  const moodCounts = {
    Great: 0,
    Good: 0,
    Okay: 0,
    Bad: 0,
    Terrible: 0
  };

  allNotes.forEach(note => {
    uniqueDates.add(note.note_date);

    const words = countWords(note.title) + countWords(note.content);
    totalWords += words;

    if (note.note_date.startsWith(currentMonth)) {
      notesThisMonth++;
      monthWords += words;
    }

    if (note.mood && moodCounts[note.mood] !== undefined) {
      moodCounts[note.mood]++;
    }

    // Daily activity
    writingActivityMap[note.note_date] = (writingActivityMap[note.note_date] || 0) + 1;
  });

  const currentStreak = calculateStreak(uniqueDates);

  // Checklists stats
  const checklistStats = db.prepare(`
    SELECT 
      COUNT(c.id) as total,
      SUM(CASE WHEN c.is_completed = 1 THEN 1 ELSE 0 END) as completed
    FROM checklists c
    JOIN notes n ON c.note_id = n.id
    WHERE n.user_id = ? AND n.is_deleted = 0
  `).get(userId);

  const totalChecklists = checklistStats.total || 0;
  const completedChecklists = checklistStats.completed || 0;

  // Writing activity for last 14 days
  const activityDays = [];
  for (let i = 13; i >= 0; i--) {
    const d = new Date();
    d.setDate(now.getDate() - i);
    const dStr = d.toISOString().split('T')[0];
    activityDays.push({
      date: dStr,
      count: writingActivityMap[dStr] || 0
    });
  }

  res.json({
    summary: {
      notes_total: allNotes.length,
      notes_this_month: notesThisMonth,
      words_total: totalWords,
      words_this_month: monthWords,
      current_streak: currentStreak,
      checklists_total: totalChecklists,
      checklists_completed: completedChecklists
    },
    mood_distribution: moodCounts,
    writing_activity: activityDays
  });
});

module.exports = router;

