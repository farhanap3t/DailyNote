const express = require('express');
const cors = require('cors');
const path = require('path');
const swaggerUi = require('swagger-ui-express');
const config = require('./config');
const swaggerSpec = require('./docs/swagger');

// Import routes
const authRoutes = require('./routes/auth.routes');
const notesRoutes = require('./routes/notes.routes');
const calendarRoutes = require('./routes/calendar.routes');
const searchRoutes = require('./routes/search.routes');
const tagsRoutes = require('./routes/tags.routes');
const statisticsRoutes = require('./routes/statistics.routes');
const profileRoutes = require('./routes/profile.routes');
const settingsRoutes = require('./routes/settings.routes');
const exportRoutes = require('./routes/export.routes');

const app = express();

// Global Middlewares
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Static directory for uploaded attachments
app.use('/uploads', express.static(config.UPLOAD_DIR));

// Interactive Swagger API Documentation for Android & Web developers
app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
app.get('/api/docs.json', (req, res) => res.json(swaggerSpec));

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/notes', notesRoutes);
app.use('/api/calendar', calendarRoutes);
app.use('/api/search', searchRoutes);
app.use('/api/tags', tagsRoutes);
app.use('/api/statistics', statisticsRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/export', exportRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', service: 'DailyNote Backend API', timestamp: new Date().toISOString() });
});

// Serve frontend SPA in production if built
const clientDist = path.join(__dirname, '../../client/dist');
const fs = require('fs');
if (fs.existsSync(clientDist)) {
  app.use(express.static(clientDist));
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api') || req.path.startsWith('/uploads')) {
      return next();
    }
    res.sendFile(path.join(clientDist, 'index.html'));
  });
}

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('[DailyNote Error]', err.stack || err.message);
  res.status(err.status || 500).json({
    error: err.message || 'Terjadi kesalahan internal pada server.'
  });
});

if (process.env.NODE_ENV !== 'test') {
  app.listen(config.PORT, () => {
    console.log(`🚀 DailyNote Backend API running on http://localhost:${config.PORT}`);
    console.log(`📖 API Documentation available at http://localhost:${config.PORT}/api/docs`);
  });
}

module.exports = app;

