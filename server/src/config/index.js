const path = require('path');
require('dotenv').config();

module.exports = {
  PORT: process.env.PORT || 5000,
  JWT_SECRET: process.env.JWT_SECRET || 'dailynote-secret-key-development-mode-2026',
  JWT_EXPIRES_IN: '7d',
  DB_PATH: process.env.DB_PATH || (process.env.VERCEL ? path.join('/tmp', 'dailynote.db') : path.join(__dirname, '../../../dailynote.db')),
  UPLOAD_DIR: process.env.UPLOAD_DIR || (process.env.VERCEL ? path.join('/tmp', 'uploads') : path.join(__dirname, '../../uploads')),
  MAX_FILE_SIZE: 10 * 1024 * 1024 // 10MB
};

