const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const db = require('../database/db');
const authMiddleware = require('../middleware/auth');

router.use(authMiddleware);

// GET /api/tags
router.get('/', (req, res) => {
  const userId = req.user.id;
  const tags = db.prepare(`
    SELECT t.id, t.name, COUNT(nt.note_id) as note_count
    FROM tags t
    LEFT JOIN note_tags nt ON t.id = nt.tag_id
    LEFT JOIN notes n ON nt.note_id = n.id AND n.is_deleted = 0
    WHERE t.user_id = ?
    GROUP BY t.id, t.name
    ORDER BY note_count DESC, t.name ASC
  `).all(userId);

  res.json({ tags });
});

// POST /api/tags
router.post('/', (req, res) => {
  const userId = req.user.id;
  const { name } = req.body;

  if (!name || !name.trim()) {
    return res.status(400).json({ error: 'Nama tag tidak boleh kosong.' });
  }

  const cleanName = name.trim().replace(/^#/, '').toLowerCase();

  const existing = db.prepare('SELECT * FROM tags WHERE user_id = ? AND name = ?').get(userId, cleanName);
  if (existing) {
    return res.json({ message: 'Tag sudah ada.', tag: existing });
  }

  const tagId = crypto.randomUUID();
  db.prepare('INSERT INTO tags (id, user_id, name) VALUES (?, ?, ?)').run(tagId, userId, cleanName);

  res.status(201).json({
    message: 'Tag berhasil ditambahkan.',
    tag: { id: tagId, name: cleanName, note_count: 0 }
  });
});

module.exports = router;

