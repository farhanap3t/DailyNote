const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const db = require('../database/db');
const config = require('../config');
const authMiddleware = require('../middleware/auth');

// POST /api/auth/register
router.post('/register', (req, res) => {
  const { name, email, password, confirmPassword } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({ error: 'Nama, email, dan password wajib diisi.' });
  }

  if (confirmPassword && password !== confirmPassword) {
    return res.status(400).json({ error: 'Konfirmasi password tidak cocok.' });
  }

  if (password.length < 6) {
    return res.status(400).json({ error: 'Password minimal 6 karakter.' });
  }

  const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(email.toLowerCase().trim());
  if (existing) {
    return res.status(400).json({ error: 'Email sudah terdaftar.' });
  }

  const userId = crypto.randomUUID();
  const passwordHash = bcrypt.hashSync(password, 10);
  const now = new Date().toISOString();

  const insertUser = db.prepare(`
    INSERT INTO users (id, name, email, password_hash, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?)
  `);

  const insertSettings = db.prepare(`
    INSERT INTO settings (user_id, language, date_format, time_format, theme, reminder_enabled, reminder_time, updated_at)
    VALUES (?, 'id', 'YYYY-MM-DD', '24h', 'system', 0, '20:00', ?)
  `);

  const createTransaction = db.transaction(() => {
    insertUser.run(userId, name.trim(), email.toLowerCase().trim(), passwordHash, now, now);
    insertSettings.run(userId, now);
  });

  try {
    createTransaction();

    const token = jwt.sign({ id: userId, email: email.toLowerCase().trim(), name: name.trim() }, config.JWT_SECRET, {
      expiresIn: config.JWT_EXPIRES_IN
    });

    res.status(201).json({
      message: 'Pendaftaran berhasil.',
      token,
      user: {
        id: userId,
        name: name.trim(),
        email: email.toLowerCase().trim(),
        profile_image: null,
        created_at: now
      }
    });
  } catch (err) {
    res.status(500).json({ error: 'Gagal mendaftar: ' + err.message });
  }
});

// POST /api/auth/login
router.post('/login', (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email dan password harus diisi.' });
  }

  const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email.toLowerCase().trim());
  if (!user) {
    return res.status(401).json({ error: 'Email atau password salah.' });
  }

  const isMatch = bcrypt.compareSync(password, user.password_hash);
  if (!isMatch) {
    return res.status(401).json({ error: 'Email atau password salah.' });
  }

  const token = jwt.sign({ id: user.id, email: user.email, name: user.name }, config.JWT_SECRET, {
    expiresIn: config.JWT_EXPIRES_IN
  });

  res.json({
    message: 'Login berhasil.',
    token,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      profile_image: user.profile_image,
      created_at: user.created_at
    }
  });
});

// POST /api/auth/logout
router.post('/logout', (req, res) => {
  // Stateless JWT: client clears token
  res.json({ message: 'Logout berhasil.' });
});

// POST /api/auth/forgot-password
router.post('/forgot-password', (req, res) => {
  const { email } = req.body;
  if (!email) {
    return res.status(400).json({ error: 'Email wajib diisi.' });
  }

  const user = db.prepare('SELECT id, email FROM users WHERE email = ?').get(email.toLowerCase().trim());
  if (!user) {
    // For security reasons, still return success message
    return res.json({ message: 'Instruksi reset password telah dikirim jika email terdaftar.' });
  }

  // Generate demo reset token
  const resetToken = crypto.randomBytes(20).toString('hex');
  res.json({
    message: 'Instruksi reset password telah dikirim ke email Anda.',
    resetToken // Provided for MVP convenience
  });
});

// POST /api/auth/reset-password
router.post('/reset-password', (req, res) => {
  const { email, newPassword } = req.body;
  if (!email || !newPassword) {
    return res.status(400).json({ error: 'Email dan password baru wajib diisi.' });
  }

  if (newPassword.length < 6) {
    return res.status(400).json({ error: 'Password minimal 6 karakter.' });
  }

  const user = db.prepare('SELECT id FROM users WHERE email = ?').get(email.toLowerCase().trim());
  if (!user) {
    return res.status(404).json({ error: 'User tidak ditemukan.' });
  }

  const passwordHash = bcrypt.hashSync(newPassword, 10);
  db.prepare('UPDATE users SET password_hash = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?').run(passwordHash, user.id);

  res.json({ message: 'Password berhasil diperbarui. Silakan login kembali.' });
});

// GET /api/auth/me
router.get('/me', authMiddleware, (req, res) => {
  const user = db.prepare('SELECT id, name, email, profile_image, created_at FROM users WHERE id = ?').get(req.user.id);
  if (!user) {
    return res.status(404).json({ error: 'Pengguna tidak ditemukan.' });
  }
  res.json({ user });
});

module.exports = router;

