const express = require('express');
const router = express.Router();
const db = require('../database/db');
const authMiddleware = require('../middleware/auth');

router.use(authMiddleware);

// GET /api/calendar?month=YYYY-MM
router.get('/', (req, res) => {
  const userId = req.user.id;
  const { month } = req.query; // format 'YYYY-MM', e.g. '2026-09'

  let query = `
    SELECT id, title, note_date, mood, is_favorite 
    FROM notes 
    WHERE user_id = ? AND is_deleted = 0
  `;
  const params = [userId];

  if (month) {
    query += ` AND note_date LIKE ?`;
    params.push(`${month}%`);
  }

  query += ` ORDER BY note_date ASC`;

  const notes = db.prepare(query).all(...params);

  // Group by date
  const calendarMap = {};
  notes.forEach(note => {
    if (!calendarMap[note.note_date]) {
      calendarMap[note.note_date] = [];
    }
    calendarMap[note.note_date].push({
      id: note.id,
      title: note.title,
      mood: note.mood,
      is_favorite: Boolean(note.is_favorite)
    });
  });

  res.json({
    month: month || new Date().toISOString().slice(0, 7),
    dates: calendarMap
  });
});

module.exports = router;

