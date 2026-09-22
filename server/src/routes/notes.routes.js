const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const db = require('../database/db');
const authMiddleware = require('../middleware/auth');
const upload = require('../middleware/upload');

// Apply auth middleware to all notes routes
router.use(authMiddleware);

// Helper to format a note with tags, checklists, and attachments
function getNoteDetails(noteId, userId) {
  const note = db.prepare(`
    SELECT * FROM notes WHERE id = ? AND user_id = ?
  `).get(noteId, userId);

  if (!note) return null;

  const tags = db.prepare(`
    SELECT t.id, t.name 
    FROM tags t
    JOIN note_tags nt ON t.id = nt.tag_id
    WHERE nt.note_id = ?
  `).all(noteId);

  const checklists = db.prepare(`
    SELECT id, content, is_completed, position
    FROM checklists
    WHERE note_id = ?
    ORDER BY position ASC, id ASC
  `).all(noteId);

  const attachments = db.prepare(`
    SELECT id, file_name, file_url, file_type, file_size, created_at
    FROM attachments
    WHERE note_id = ?
    ORDER BY created_at DESC
  `).all(noteId);

  return {
    ...note,
    is_favorite: Boolean(note.is_favorite),
    is_archived: Boolean(note.is_archived),
    is_deleted: Boolean(note.is_deleted),
    tags,
    checklists: checklists.map(c => ({ ...c, is_completed: Boolean(c.is_completed) })),
    attachments
  };
}

// Helper to save tags
function syncNoteTags(noteId, userId, tagNames = []) {
  // Clear existing note_tags for this note
  db.prepare('DELETE FROM note_tags WHERE note_id = ?').run(noteId);

  const cleanTags = [...new Set(tagNames.map(t => t.replace(/^#/, '').trim().toLowerCase()))].filter(Boolean);

  const getTag = db.prepare('SELECT id FROM tags WHERE user_id = ? AND name = ?');
  const insertTag = db.prepare('INSERT INTO tags (id, user_id, name) VALUES (?, ?, ?)');
  const insertNoteTag = db.prepare('INSERT INTO note_tags (note_id, tag_id) VALUES (?, ?)');

  for (const tagName of cleanTags) {
    let tag = getTag.get(userId, tagName);
    let tagId;
    if (!tag) {
      tagId = crypto.randomUUID();
      insertTag.run(tagId, userId, tagName);
    } else {
      tagId = tag.id;
    }
    insertNoteTag.run(noteId, tagId);
  }
}

// Helper to sync checklists
function syncChecklists(noteId, checklists = []) {
  db.prepare('DELETE FROM checklists WHERE note_id = ?').run(noteId);

  const insertChecklist = db.prepare(`
    INSERT INTO checklists (id, note_id, content, is_completed, position)
    VALUES (?, ?, ?, ?, ?)
  `);

  checklists.forEach((item, index) => {
    const id = item.id || crypto.randomUUID();
    const content = typeof item === 'string' ? item : item.content;
    const isCompleted = typeof item === 'object' && item.is_completed ? 1 : 0;
    const position = typeof item === 'object' && item.position !== undefined ? item.position : index;
    if (content && content.trim()) {
      insertChecklist.run(id, noteId, content.trim(), isCompleted, position);
    }
  });
}

// GET /api/notes
router.get('/', (req, res) => {
  const userId = req.user.id;
  const { filter = 'all', date, search } = req.query;

  let query = 'SELECT * FROM notes WHERE user_id = ?';
  const params = [userId];

  if (filter === 'trash') {
    query += ' AND is_deleted = 1';
  } else if (filter === 'archive') {
    query += ' AND is_archived = 1 AND is_deleted = 0';
  } else if (filter === 'favorites') {
    query += ' AND is_favorite = 1 AND is_archived = 0 AND is_deleted = 0';
  } else {
    // default 'all'
    query += ' AND is_archived = 0 AND is_deleted = 0';
  }

  if (date) {
    query += ' AND note_date = ?';
    params.push(date);
  }

  query += ' ORDER BY note_date DESC, updated_at DESC';

  const notes = db.prepare(query).all(...params);

  // Attach tags and checklist summary to each note
  const populated = notes.map(note => {
    const tags = db.prepare(`
      SELECT t.id, t.name 
      FROM tags t
      JOIN note_tags nt ON t.id = nt.tag_id
      WHERE nt.note_id = ?
    `).all(note.id);

    const checklistStats = db.prepare(`
      SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN is_completed = 1 THEN 1 ELSE 0 END) as completed
      FROM checklists
      WHERE note_id = ?
    `).get(note.id);

    const attachmentCount = db.prepare(`
      SELECT COUNT(*) as count FROM attachments WHERE note_id = ?
    `).get(note.id).count;

    return {
      ...note,
      is_favorite: Boolean(note.is_favorite),
      is_archived: Boolean(note.is_archived),
      is_deleted: Boolean(note.is_deleted),
      tags,
      checklist_stats: {
        total: checklistStats.total || 0,
        completed: checklistStats.completed || 0
      },
      attachment_count: attachmentCount
    };
  });

  res.json({ notes: populated });
});

// GET /api/notes/:id
router.get('/:id', (req, res) => {
  const note = getNoteDetails(req.params.id, req.user.id);
  if (!note) {
    return res.status(404).json({ error: 'Catatan tidak ditemukan.' });
  }
  res.json({ note });
});

// POST /api/notes
router.post('/', (req, res) => {
  const userId = req.user.id;
  const {
    id = crypto.randomUUID(),
    title,
    content = '',
    note_date = new Date().toISOString().split('T')[0],
    mood = null,
    is_favorite = false,
    tags = [],
    checklists = []
  } = req.body;

  if (!title || !title.trim()) {
    return res.status(400).json({ error: 'Judul catatan tidak boleh kosong.' });
  }

  const now = new Date().toISOString();

  const insertNote = db.prepare(`
    INSERT INTO notes (id, user_id, title, content, note_date, mood, is_favorite, is_archived, is_deleted, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, 0, 0, ?, ?)
  `);

  const tx = db.transaction(() => {
    insertNote.run(id, userId, title.trim(), content, note_date, mood, is_favorite ? 1 : 0, now, now);
    if (tags && tags.length) {
      syncNoteTags(id, userId, tags);
    }
    if (checklists && checklists.length) {
      syncChecklists(id, checklists);
    }
  });

  try {
    tx();
    const created = getNoteDetails(id, userId);
    res.status(201).json({ message: 'Catatan berhasil dibuat.', note: created });
  } catch (err) {
    res.status(500).json({ error: 'Gagal membuat catatan: ' + err.message });
  }
});

// PUT /api/notes/:id
router.put('/:id', (req, res) => {
  const userId = req.user.id;
  const noteId = req.params.id;

  const existing = db.prepare('SELECT * FROM notes WHERE id = ? AND user_id = ?').get(noteId, userId);
  if (!existing) {
    return res.status(404).json({ error: 'Catatan tidak ditemukan.' });
  }

  const {
    title = existing.title,
    content = existing.content,
    note_date = existing.note_date,
    mood = existing.mood,
    is_favorite = existing.is_favorite,
    is_archived = existing.is_archived,
    tags,
    checklists
  } = req.body;

  const now = new Date().toISOString();

  const updateNote = db.prepare(`
    UPDATE notes
    SET title = ?, content = ?, note_date = ?, mood = ?, is_favorite = ?, is_archived = ?, updated_at = ?
    WHERE id = ? AND user_id = ?
  `);

  const tx = db.transaction(() => {
    updateNote.run(
      title ? title.trim() : existing.title,
      content !== undefined ? content : existing.content,
      note_date || existing.note_date,
      mood !== undefined ? mood : existing.mood,
      is_favorite ? 1 : 0,
      is_archived ? 1 : 0,
      now,
      noteId,
      userId
    );

    if (tags !== undefined) {
      syncNoteTags(noteId, userId, tags);
    }
    if (checklists !== undefined) {
      syncChecklists(noteId, checklists);
    }
  });

  try {
    tx();
    const updated = getNoteDetails(noteId, userId);
    res.json({ message: 'Catatan berhasil diperbarui.', note: updated });
  } catch (err) {
    res.status(500).json({ error: 'Gagal memperbarui catatan: ' + err.message });
  }
});

// DELETE /api/notes/:id (Soft delete to trash, or permanent delete if already in trash)
router.delete('/:id', (req, res) => {
  const userId = req.user.id;
  const noteId = req.params.id;

  const note = db.prepare('SELECT * FROM notes WHERE id = ? AND user_id = ?').get(noteId, userId);
  if (!note) {
    return res.status(404).json({ error: 'Catatan tidak ditemukan.' });
  }

  if (note.is_deleted === 1) {
    // Hard delete
    // Find attachments to unlink files
    const attachments = db.prepare('SELECT file_url FROM attachments WHERE note_id = ?').all(noteId);
    attachments.forEach(att => {
      const filePath = path.join(__dirname, '../../', att.file_url);
      if (fs.existsSync(filePath)) {
        try { fs.unlinkSync(filePath); } catch (e) {}
      }
    });

    db.prepare('DELETE FROM notes WHERE id = ? AND user_id = ?').run(noteId, userId);
    return res.json({ message: 'Catatan dihapus secara permanen.' });
  } else {
    // Soft delete to trash
    const now = new Date().toISOString();
    db.prepare('UPDATE notes SET is_deleted = 1, deleted_at = ?, updated_at = ? WHERE id = ? AND user_id = ?')
      .run(now, now, noteId, userId);
    return res.json({ message: 'Catatan dipindahkan ke Sampah.' });
  }
});

// POST /api/notes/:id/favorite
router.post('/:id/favorite', (req, res) => {
  const userId = req.user.id;
  const noteId = req.params.id;

  const note = db.prepare('SELECT is_favorite FROM notes WHERE id = ? AND user_id = ?').get(noteId, userId);
  if (!note) {
    return res.status(404).json({ error: 'Catatan tidak ditemukan.' });
  }

  const newStatus = note.is_favorite ? 0 : 1;
  const now = new Date().toISOString();
  db.prepare('UPDATE notes SET is_favorite = ?, updated_at = ? WHERE id = ? AND user_id = ?').run(newStatus, now, noteId, userId);

  res.json({
    message: newStatus ? 'Ditambahkan ke Favorit.' : 'Dihapus dari Favorit.',
    is_favorite: Boolean(newStatus)
  });
});

// POST /api/notes/:id/archive
router.post('/:id/archive', (req, res) => {
  const userId = req.user.id;
  const noteId = req.params.id;

  const note = db.prepare('SELECT is_archived FROM notes WHERE id = ? AND user_id = ?').get(noteId, userId);
  if (!note) {
    return res.status(404).json({ error: 'Catatan tidak ditemukan.' });
  }

  const newStatus = note.is_archived ? 0 : 1;
  const now = new Date().toISOString();
  db.prepare('UPDATE notes SET is_archived = ?, updated_at = ? WHERE id = ? AND user_id = ?').run(newStatus, now, noteId, userId);

  res.json({
    message: newStatus ? 'Catatan diarsipkan.' : 'Catatan dikeluarkan dari arsip.',
    is_archived: Boolean(newStatus)
  });
});

// POST /api/notes/:id/restore
router.post('/:id/restore', (req, res) => {
  const userId = req.user.id;
  const noteId = req.params.id;

  const note = db.prepare('SELECT * FROM notes WHERE id = ? AND user_id = ?').get(noteId, userId);
  if (!note) {
    return res.status(404).json({ error: 'Catatan tidak ditemukan.' });
  }

  const now = new Date().toISOString();
  db.prepare('UPDATE notes SET is_deleted = 0, deleted_at = NULL, is_archived = 0, updated_at = ? WHERE id = ? AND user_id = ?')
    .run(now, noteId, userId);

  res.json({ message: 'Catatan berhasil dipulihkan.' });
});

// POST /api/notes/:id/attachments
router.post('/:id/attachments', upload.single('file'), (req, res) => {
  const userId = req.user.id;
  const noteId = req.params.id;

  const note = db.prepare('SELECT id FROM notes WHERE id = ? AND user_id = ?').get(noteId, userId);
  if (!note) {
    return res.status(404).json({ error: 'Catatan tidak ditemukan.' });
  }

  if (!req.file) {
    return res.status(400).json({ error: 'File tidak ditemukan.' });
  }

  const attachmentId = crypto.randomUUID();
  const fileUrl = `/uploads/${req.file.filename}`;
  const now = new Date().toISOString();

  db.prepare(`
    INSERT INTO attachments (id, note_id, file_name, file_url, file_type, file_size, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(
    attachmentId,
    noteId,
    req.file.originalname,
    fileUrl,
    req.file.mimetype,
    req.file.size,
    now
  );

  res.status(201).json({
    message: 'Lampiran berhasil diunggah.',
    attachment: {
      id: attachmentId,
      file_name: req.file.originalname,
      file_url: fileUrl,
      file_type: req.file.mimetype,
      file_size: req.file.size,
      created_at: now
    }
  });
});

// DELETE /api/notes/:id/attachments/:attachmentId
router.delete('/:id/attachments/:attachmentId', (req, res) => {
  const userId = req.user.id;
  const { id: noteId, attachmentId } = req.params;

  const attachment = db.prepare(`
    SELECT a.* 
    FROM attachments a
    JOIN notes n ON a.note_id = n.id
    WHERE a.id = ? AND a.note_id = ? AND n.user_id = ?
  `).get(attachmentId, noteId, userId);

  if (!attachment) {
    return res.status(404).json({ error: 'Lampiran tidak ditemukan.' });
  }

  const filePath = path.join(__dirname, '../../', attachment.file_url);
  if (fs.existsSync(filePath)) {
    try { fs.unlinkSync(filePath); } catch (e) {}
  }

  db.prepare('DELETE FROM attachments WHERE id = ?').run(attachmentId);

  res.json({ message: 'Lampiran berhasil dihapus.' });
});

module.exports = router;

