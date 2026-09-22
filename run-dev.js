const { spawn } = require('child_process');
const path = require('path');

console.log('🌟 Starting DailyNote (Backend API + Frontend Web App)...\n');

const isWin = process.platform === 'win32';
const cmdRunner = isWin ? (process.env.ComSpec || 'cmd.exe') : null;

// Start Server (Express on port 5000 using Node directly)
const server = spawn(process.execPath, ['src/index.js'], {
  cwd: path.join(__dirname, 'server'),
  stdio: 'inherit'
});

// Start Client (Vite on port 3000)
const client = isWin
  ? spawn(cmdRunner, ['/c', 'npx', 'vite'], {
      cwd: path.join(__dirname, 'client'),
      stdio: 'inherit'
    })
  : spawn('npx', ['vite'], {
      cwd: path.join(__dirname, 'client'),
      stdio: 'inherit'
    });

server.on('error', (err) => console.error('[Server Process Error]', err));
client.on('error', (err) => console.error('[Client Process Error]', err));

process.on('SIGINT', () => {
  server.kill('SIGINT');
  client.kill('SIGINT');
  process.exit();
});
