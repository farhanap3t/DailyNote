const assert = require('assert');
const http = require('http');

// Set test environment
process.env.NODE_ENV = 'test';
process.env.DB_PATH = ':memory:';

const app = require('../src/index');

let server;
let baseUrl;
let authToken = '';
let testNoteId = '';

function request(method, path, body = null, headers = {}) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, baseUrl);
    const reqHeaders = {
      'Content-Type': 'application/json',
      ...headers
    };

    if (authToken && !reqHeaders['Authorization']) {
      reqHeaders['Authorization'] = `Bearer ${authToken}`;
    }

    const payload = body ? JSON.stringify(body) : null;
    if (payload) {
      reqHeaders['Content-Length'] = Buffer.byteLength(payload);
    }

    const req = http.request(url, {
      method,
      headers: reqHeaders
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const parsed = data ? JSON.parse(data) : {};
          resolve({ status: res.statusCode, body: parsed });
        } catch (e) {
          resolve({ status: res.statusCode, body: data });
        }
      });
    });

    req.on('error', reject);
    if (payload) req.write(payload);
    req.end();
  });
}

async function runTests() {
  console.log('🧪 Starting DailyNote Backend API Tests...\n');

  await new Promise(resolve => {
    server = app.listen(0, () => {
      const port = server.address().port;
      baseUrl = `http://localhost:${port}`;
      console.log(`Test server running at ${baseUrl}`);
      resolve();
    });
  });

  try {
    // 1. Health check
    console.log('1. Testing GET /api/health');
    const health = await request('GET', '/api/health');
    assert.strictEqual(health.status, 200);
    assert.strictEqual(health.body.status, 'ok');
    console.log('   ✓ Health check passed');

    // 2. Auth: Register
    console.log('2. Testing POST /api/auth/register');
    const regRes = await request('POST', '/api/auth/register', {
      name: 'Farhan Daily',
      email: 'farhan@example.com',
      password: 'password123',
      confirmPassword: 'password123'
    });
    assert.strictEqual(regRes.status, 201);
    assert.ok(regRes.body.token);
    assert.strictEqual(regRes.body.user.email, 'farhan@example.com');
    authToken = regRes.body.token;
    console.log('   ✓ Register passed, JWT acquired');

    // 3. Auth: Login
    console.log('3. Testing POST /api/auth/login');
    const loginRes = await request('POST', '/api/auth/login', {
      email: 'farhan@example.com',
      password: 'password123'
    });
    assert.strictEqual(loginRes.status, 200);
    assert.ok(loginRes.body.token);
    console.log('   ✓ Login passed');

    // 4. Create Note (Section 10 PRD)
    console.log('4. Testing POST /api/notes (Daily Note creation with tags, mood, checklist)');
    const createRes = await request('POST', '/api/notes', {
      title: "Today's Work & Reflection",
      content: "<p>Hari ini menyelesaikan MVP DailyNote dengan arsitektur yang solid!</p>",
      note_date: '2026-09-22',
      mood: 'Great',
      is_favorite: true,
      tags: ['work', 'project', 'mvp'],
      checklists: [
        { content: 'Setup Backend Express', is_completed: true, position: 0 },
        { content: 'Setup Frontend React Vite', is_completed: false, position: 1 }
      ]
    });
    assert.strictEqual(createRes.status, 201);
    assert.ok(createRes.body.note);
    assert.strictEqual(createRes.body.note.title, "Today's Work & Reflection");
    assert.strictEqual(createRes.body.note.mood, 'Great');
    assert.strictEqual(createRes.body.note.tags.length, 3);
    assert.strictEqual(createRes.body.note.checklists.length, 2);
    testNoteId = createRes.body.note.id;
    console.log('   ✓ Create Note passed with ID:', testNoteId);

    // 5. Get Note detail
    console.log('5. Testing GET /api/notes/:id');
    const getRes = await request('GET', `/api/notes/${testNoteId}`);
    assert.strictEqual(getRes.status, 200);
    assert.strictEqual(getRes.body.note.id, testNoteId);
    console.log('   ✓ Get Note detail passed');

    // 6. Update Note
    console.log('6. Testing PUT /api/notes/:id');
    const updateRes = await request('PUT', `/api/notes/${testNoteId}`, {
      title: "Today's Work & Reflection (Updated)",
      content: "<p>Updated content with rich text</p>",
      mood: 'Good',
      checklists: [
        { content: 'Setup Backend Express', is_completed: true, position: 0 },
        { content: 'Setup Frontend React Vite', is_completed: true, position: 1 }
      ]
    });
    assert.strictEqual(updateRes.status, 200);
    assert.strictEqual(updateRes.body.note.title, "Today's Work & Reflection (Updated)");
    assert.strictEqual(updateRes.body.note.mood, 'Good');
    console.log('   ✓ Update Note passed');

    // 7. Toggle Favorite & Archive
    console.log('7. Testing Favorite & Archive toggle');
    const favRes = await request('POST', `/api/notes/${testNoteId}/favorite`);
    assert.strictEqual(favRes.status, 200);
    const archRes = await request('POST', `/api/notes/${testNoteId}/archive`);
    assert.strictEqual(archRes.status, 200);
    assert.strictEqual(archRes.body.is_archived, true);
    // Un-archive for subsequent tests
    await request('POST', `/api/notes/${testNoteId}/archive`);
    console.log('   ✓ Favorite and Archive toggles passed');

    // 8. Calendar
    console.log('8. Testing GET /api/calendar?month=2026-09');
    const calRes = await request('GET', '/api/calendar?month=2026-09');
    assert.strictEqual(calRes.status, 200);
    assert.ok(calRes.body.dates['2026-09-22']);
    console.log('   ✓ Calendar route returned dated notes correctly');

    // 9. Search
    console.log('9. Testing GET /api/search?q=Reflection&mood=Good');
    const searchRes = await request('GET', '/api/search?q=Reflection&mood=Good');
    assert.strictEqual(searchRes.status, 200);
    assert.strictEqual(searchRes.body.count, 1);
    console.log('   ✓ Search with multi-filters passed');

    // 10. Tags
    console.log('10. Testing GET /api/tags');
    const tagsRes = await request('GET', '/api/tags');
    assert.strictEqual(tagsRes.status, 200);
    assert.ok(tagsRes.body.tags.length > 0);
    console.log('   ✓ Tags list passed');

    // 11. Statistics & Streak
    console.log('11. Testing GET /api/statistics');
    const statsRes = await request('GET', '/api/statistics');
    assert.strictEqual(statsRes.status, 200);
    assert.strictEqual(statsRes.body.summary.notes_total, 1);
    assert.ok(statsRes.body.summary.current_streak >= 1);
    assert.ok(statsRes.body.mood_distribution.Good >= 1);
    console.log('   ✓ Statistics and Streak passed');

    // 12. Settings
    console.log('12. Testing GET & PUT /api/settings');
    const setRes = await request('GET', '/api/settings');
    assert.strictEqual(setRes.status, 200);
    const updateSet = await request('PUT', '/api/settings', {
      theme: 'dark',
      reminder_enabled: true,
      reminder_time: '21:00'
    });
    assert.strictEqual(updateSet.status, 200);
    assert.strictEqual(updateSet.body.settings.theme, 'dark');
    console.log('   ✓ Settings read/update passed');

    // 13. Export
    console.log('13. Testing GET /api/export');
    const expRes = await request('GET', '/api/export?format=json');
    assert.strictEqual(expRes.status, 200);
    assert.strictEqual(expRes.body.total_notes, 1);
    console.log('   ✓ Data Export passed');

    console.log('\n🎉 ALL 13 BACKEND API TESTS PASSED SUCCESSFULLY!\n');
  } catch (err) {
    console.error('❌ Test failed:', err);
    process.exitCode = 1;
  } finally {
    server.close();
  }
}

runTests();

