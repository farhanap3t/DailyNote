const express = require('express');
const router = express.Router();
const db = require('../database/db');
const authMiddleware = require('../middleware/auth');

router.use(authMiddleware);

// GET /api/settings
router.get('/', (req, res) => {
  const userId = req.user.id;
  let settings = db.prepare('SELECT * FROM settings WHERE user_id = ?').get(userId);

  if (!settings) {
    // initialize if missing
    const now = new Date().toISOString();
    db.prepare(`
      INSERT INTO settings (user_id, language, date_format, time_format, theme, reminder_enabled, reminder_time, updated_at)
      VALUES (?, 'id', 'YYYY-MM-DD', '24h', 'system', 0, '20:00', ?)
    `).run(userId, now);

    settings = db.prepare('SELECT * FROM settings WHERE user_id = ?').get(userId);
  }

  res.json({
    settings: {
      ...settings,
      reminder_enabled: Boolean(settings.reminder_enabled)
    }
  });
});

// PUT /api/settings
router.put('/', (req, res) => {
  const userId = req.user.id;
  const {
    language,
    date_format,
    time_format,
    theme,
    reminder_enabled,
    reminder_time
  } = req.body;

  const current = db.prepare('SELECT * FROM settings WHERE user_id = ?').get(userId);

  const updatedLang = language || (current ? current.language : 'id');
  const updatedDateFormat = date_format || (current ? current.date_format : 'YYYY-MM-DD');
  const updatedTimeFormat = time_format || (current ? current.time_format : '24h');
  const updatedTheme = theme || (current ? current.theme : 'system');
  const updatedReminderEnabled = reminder_enabled !== undefined ? (reminder_enabled ? 1 : 0) : (current ? current.reminder_enabled : 0);
  const updatedReminderTime = reminder_time || (current ? current.reminder_time : '20:00');
  const now = new Date().toISOString();

  if (current) {
    db.prepare(`
      UPDATE settings
      SET language = ?, date_format = ?, time_format = ?, theme = ?, reminder_enabled = ?, reminder_time = ?, updated_at = ?
      WHERE user_id = ?
    `).run(updatedLang, updatedDateFormat, updatedTimeFormat, updatedTheme, updatedReminderEnabled, updatedReminderTime, now, userId);
  } else {
    db.prepare(`
      INSERT INTO settings (user_id, language, date_format, time_format, theme, reminder_enabled, reminder_time, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(userId, updatedLang, updatedDateFormat, updatedTimeFormat, updatedTheme, updatedReminderEnabled, updatedReminderTime, now);
  }

  const updated = db.prepare('SELECT * FROM settings WHERE user_id = ?').get(userId);
  res.json({
    message: 'Pengaturan berhasil disimpan.',
    settings: {
      ...updated,
      reminder_enabled: Boolean(updated.reminder_enabled)
    }
  });
});

// DELETE /api/settings/account (Delete Account)
router.delete('/account', (req, res) => {
  const userId = req.user.id;
  db.prepare('DELETE FROM users WHERE id = ?').run(userId);
  res.json({ message: 'Akun dan seluruh data Anda telah berhasil dihapus.' });
});

module.exports = router;

