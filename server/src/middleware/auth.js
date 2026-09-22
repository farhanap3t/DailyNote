const jwt = require('jsonwebtoken');
const config = require('../config');

function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Akses ditolak. Token tidak disediakan.' });
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, config.JWT_SECRET);
    req.user = decoded; // contains { id, email }
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Token tidak valid atau telah kedaluwarsa.' });
  }
}

module.exports = authMiddleware;

