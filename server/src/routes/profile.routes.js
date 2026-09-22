const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const db = require('../database/db');
const authMiddleware = require('../middleware/auth');
const upload = require('../middleware/upload');

router.use(authMiddleware);

// GET /api/profile
router.get('/', (req, res) => {
  const user = db.prepare(`
    SELECT id, name, email, profile_image, created_at, updated_at
    FROM users 
    WHERE id = ?
  `).get(req.user.id);

  if (!user) {
    return res.status(404).json({ error: 'Pengguna tidak ditemukan.' });
  }

  res.json({ profile: user });
});

// PUT /api/profile
router.put('/', upload.single('profile_image'), (req, res) => {
  const userId = req.user.id;
  const { name, email, current_password, new_password } = req.body;

  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(userId);
  if (!user) {
    return res.status(404).json({ error: 'Pengguna tidak ditemukan.' });
  }

  let updatedName = name ? name.trim() : user.name;
  let updatedEmail = email ? email.toLowerCase().trim() : user.email;
  let updatedImage = req.file ? `/uploads/${req.file.filename}` : user.profile_image;
  let updatedPasswordHash = user.password_hash;

  // If changing email, check uniqueness
  if (updatedEmail !== user.email) {
    const emailConflict = db.prepare('SELECT id FROM users WHERE email = ? AND id != ?').get(updatedEmail, userId);
    if (emailConflict) {
      return res.status(400).json({ error: 'Email sudah digunakan oleh akun lain.' });
    }
  }

  // If changing password
  if (new_password) {
    if (!current_password) {
      return res.status(400).json({ error: 'Password saat ini harus diisi untuk mengubah password.' });
    }
    const isCurrentMatch = bcrypt.compareSync(current_password, user.password_hash);
    if (!isCurrentMatch) {
      return res.status(400).json({ error: 'Password saat ini salah.' });
    }
    if (new_password.length < 6) {
      return res.status(400).json({ error: 'Password baru minimal 6 karakter.' });
    }
    updatedPasswordHash = bcrypt.hashSync(new_password, 10);
  }

  const now = new Date().toISOString();
  db.prepare(`
    UPDATE users 
    SET name = ?, email = ?, profile_image = ?, password_hash = ?, updated_at = ?
    WHERE id = ?
  `).run(updatedName, updatedEmail, updatedImage, updatedPasswordHash, now, userId);

  const updatedUser = db.prepare(`
    SELECT id, name, email, profile_image, created_at, updated_at
    FROM users 
    WHERE id = ?
  `).get(userId);

  res.json({
    message: 'Profil berhasil diperbarui.',
    profile: updatedUser
  });
});

module.exports = router;

