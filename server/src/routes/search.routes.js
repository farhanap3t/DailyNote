const express = require('express');
const router = express.Router();
const db = require('../database/db');
const authMiddleware = require('../middleware/auth');

router.use(authMiddleware);

// GET /api/search?q=...&tag=...&mood=...&startDate=...&endDate=...
router.get('/', (req, res) => {
  const userId = req.user.id;
  const { q, tag, mood, startDate, endDate } = req.query;

  let query = `
    SELECT DISTINCT n.* 
    FROM notes n
    LEFT JOIN note_tags nt ON n.id = nt.note_id
    LEFT JOIN tags t ON nt.tag_id = t.id
    WHERE n.user_id = ? AND n.is_deleted = 0
  `;
  const params = [userId];

  if (q && q.trim()) {
    query += ` AND (n.title LIKE ? OR n.content LIKE ?)`;
    const searchPattern = `%${q.trim()}%`;
    params.push(searchPattern, searchPattern);
  }

  if (tag && tag.trim()) {
    const cleanTag = tag.trim().replace(/^#/, '').toLowerCase();
    query += ` AND LOWER(t.name) = ?`;
    params.push(cleanTag);
  }

  if (mood && mood.trim()) {
    query += ` AND n.mood = ?`;
    params.push(mood.trim());
  }

  if (startDate) {
    query += ` AND n.note_date >= ?`;
    params.push(startDate);
  }

  if (endDate) {
    query += ` AND n.note_date <= ?`;
    params.push(endDate);
  }

  query += ` ORDER BY n.note_date DESC, n.updated_at DESC`;

  const notes = db.prepare(query).all(...params);

  const populated = notes.map(note => {
    const noteTags = db.prepare(`
      SELECT t.id, t.name 
      FROM tags t
      JOIN note_tags nt ON t.id = nt.tag_id
      WHERE nt.note_id = ?
    `).all(note.id);

    return {
      ...note,
      is_favorite: Boolean(note.is_favorite),
      is_archived: Boolean(note.is_archived),
      is_deleted: Boolean(note.is_deleted),
      tags: noteTags
    };
  });

  res.json({ count: populated.length, results: populated });
});

module.exports = router;

