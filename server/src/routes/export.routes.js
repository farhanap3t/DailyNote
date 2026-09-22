const express = require('express');
const router = express.Router();
const db = require('../database/db');
const authMiddleware = require('../middleware/auth');

router.use(authMiddleware);

// GET /api/export?format=json
router.get('/', (req, res) => {
  const userId = req.user.id;
  const { format = 'json' } = req.query;

  const user = db.prepare('SELECT id, name, email, created_at FROM users WHERE id = ?').get(userId);
  const notes = db.prepare('SELECT * FROM notes WHERE user_id = ? AND is_deleted = 0 ORDER BY note_date DESC').all(userId);

  const fullNotes = notes.map(note => {
    const tags = db.prepare(`
      SELECT t.name FROM tags t
      JOIN note_tags nt ON t.id = nt.tag_id
      WHERE nt.note_id = ?
    `).all(note.id).map(t => t.name);

    const checklists = db.prepare('SELECT content, is_completed, position FROM checklists WHERE note_id = ? ORDER BY position ASC').all(note.id);
    const attachments = db.prepare('SELECT file_name, file_url, file_type, file_size FROM attachments WHERE note_id = ?').all(note.id);

    return {
      id: note.id,
      date: note.note_date,
      title: note.title,
      mood: note.mood,
      content: note.content,
      is_favorite: Boolean(note.is_favorite),
      is_archived: Boolean(note.is_archived),
      tags,
      checklists: checklists.map(c => ({ content: c.content, completed: Boolean(c.is_completed) })),
      attachments,
      created_at: note.created_at,
      updated_at: note.updated_at
    };
  });

  if (format === 'markdown') {
    let mdContent = `# DailyNote Export - ${user.name}\nExported at: ${new Date().toISOString()}\n\n---\n\n`;
    fullNotes.forEach(n => {
      mdContent += `## ${n.date} — ${n.title}\n`;
      if (n.mood) mdContent += `**Mood:** ${n.mood}\n`;
      if (n.tags.length) mdContent += `**Tags:** ${n.tags.map(t => '#' + t).join(' ')}\n`;
      mdContent += `\n${n.content.replace(/<[^>]*>/g, '')}\n\n`;

      if (n.checklists.length) {
        mdContent += `### Checklists:\n`;
        n.checklists.forEach(c => {
          mdContent += `- [${c.completed ? 'x' : ' '}] ${c.content}\n`;
        });
        mdContent += `\n`;
      }
      mdContent += `---\n\n`;
    });

    res.setHeader('Content-Disposition', `attachment; filename="dailynote-export-${Date.now()}.md"`);
    res.setHeader('Content-Type', 'text/markdown; charset=utf-8');
    return res.send(mdContent);
  }

  // Default JSON export
  const exportPayload = {
    app: 'DailyNote',
    version: '1.0.0',
    export_date: new Date().toISOString(),
    user,
    total_notes: fullNotes.length,
    notes: fullNotes
  };

  res.setHeader('Content-Disposition', `attachment; filename="dailynote-export-${Date.now()}.json"`);
  res.setHeader('Content-Type', 'application/json');
  res.send(JSON.stringify(exportPayload, null, 2));
});

module.exports = router;

