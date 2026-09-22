const swaggerDefinition = {
  openapi: '3.0.0',
  info: {
    title: 'DailyNote REST API',
    version: '1.0.0',
    description: 'API-first backend untuk DailyNote Web Application dan Android Application. Mendukung sinkronisasi multi-device, offline sync queue, dan Last-Write-Wins.',
    contact: {
      name: 'DailyNote Engineering'
    }
  },
  servers: [
    {
      url: 'http://localhost:5000',
      description: 'Development Server'
    }
  ],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT'
      }
    },
    schemas: {
      User: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          name: { type: 'string' },
          email: { type: 'string' },
          profile_image: { type: 'string', nullable: true },
          created_at: { type: 'string', format: 'date-time' }
        }
      },
      Note: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          user_id: { type: 'string' },
          title: { type: 'string' },
          content: { type: 'string' },
          note_date: { type: 'string', format: 'date' },
          mood: { type: 'string', enum: ['Great', 'Good', 'Okay', 'Bad', 'Terrible', null] },
          is_favorite: { type: 'boolean' },
          is_archived: { type: 'boolean' },
          is_deleted: { type: 'boolean' },
          tags: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                id: { type: 'string' },
                name: { type: 'string' }
              }
            }
          },
          checklists: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                id: { type: 'string' },
                content: { type: 'string' },
                is_completed: { type: 'boolean' },
                position: { type: 'integer' }
              }
            }
          },
          attachments: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                id: { type: 'string' },
                file_name: { type: 'string' },
                file_url: { type: 'string' },
                file_type: { type: 'string' },
                file_size: { type: 'integer' }
              }
            }
          },
          created_at: { type: 'string', format: 'date-time' },
          updated_at: { type: 'string', format: 'date-time' }
        }
      }
    }
  },
  paths: {
    '/api/auth/register': {
      post: {
        summary: 'Register new user',
        tags: ['Auth'],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['name', 'email', 'password'],
                properties: {
                  name: { type: 'string' },
                  email: { type: 'string' },
                  password: { type: 'string' },
                  confirmPassword: { type: 'string' }
                }
              }
            }
          }
        },
        responses: {
          201: { description: 'Registration successful' },
          400: { description: 'Bad input or email already exists' }
        }
      }
    },
    '/api/auth/login': {
      post: {
        summary: 'User login',
        tags: ['Auth'],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['email', 'password'],
                properties: {
                  email: { type: 'string' },
                  password: { type: 'string' }
                }
              }
            }
          }
        },
        responses: {
          200: { description: 'Login successful' },
          401: { description: 'Invalid credentials' }
        }
      }
    },
    '/api/notes': {
      get: {
        summary: 'List notes with optional filters',
        tags: ['Notes'],
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: 'filter', in: 'query', schema: { type: 'string', enum: ['all', 'favorites', 'archive', 'trash'] } },
          { name: 'date', in: 'query', schema: { type: 'string' } }
        ],
        responses: {
          200: { description: 'List of notes' }
        }
      },
      post: {
        summary: 'Create note',
        tags: ['Notes'],
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['title'],
                properties: {
                  title: { type: 'string' },
                  content: { type: 'string' },
                  note_date: { type: 'string' },
                  mood: { type: 'string' },
                  tags: { type: 'array', items: { type: 'string' } },
                  checklists: { type: 'array', items: { type: 'object' } }
                }
              }
            }
          }
        },
        responses: {
          201: { description: 'Note created' }
        }
      }
    },
    '/api/notes/{id}': {
      get: {
        summary: 'Get note details',
        tags: ['Notes'],
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: { 200: { description: 'Note detail' } }
      },
      put: {
        summary: 'Update note',
        tags: ['Notes'],
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: { 200: { description: 'Note updated' } }
      },
      delete: {
        summary: 'Soft delete to trash, or hard delete if in trash',
        tags: ['Notes'],
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: { 200: { description: 'Note deleted' } }
      }
    },
    '/api/calendar': {
      get: {
        summary: 'Get notes grouped by date for month',
        tags: ['Calendar'],
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'month', in: 'query', schema: { type: 'string', example: '2026-09' } }],
        responses: { 200: { description: 'Calendar month notes' } }
      }
    },
    '/api/search': {
      get: {
        summary: 'Search notes by query, tags, mood, or dates',
        tags: ['Search'],
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: 'q', in: 'query', schema: { type: 'string' } },
          { name: 'tag', in: 'query', schema: { type: 'string' } },
          { name: 'mood', in: 'query', schema: { type: 'string' } }
        ],
        responses: { 200: { description: 'Search results' } }
      }
    },
    '/api/statistics': {
      get: {
        summary: 'Get user statistics (streak, word count, mood distribution, writing activity)',
        tags: ['Statistics'],
        security: [{ bearerAuth: [] }],
        responses: { 200: { description: 'User statistics' } }
      }
    }
  }
};

module.exports = swaggerDefinition;

