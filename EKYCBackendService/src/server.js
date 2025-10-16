const http = require('http');
const app = require('./app');

const PORT = Number(process.env.PORT) || 3001; // default to 3001 per acceptance
const HOST = process.env.HOST || '0.0.0.0';

let server;

// Create HTTP server explicitly and listen
try {
  server = http.createServer(app);

  server.listen(PORT, HOST, () => {
    console.log(`[EKYCBackendService] Server listening on http://${HOST}:${PORT}`);
  });

  // Surface server 'error' events (e.g., EADDRINUSE, EACCES)
  server.on('error', (err) => {
    console.error('[EKYCBackendService] HTTP server error:', err && err.message ? err.message : err);
    process.exit(1);
  });
} catch (e) {
  console.error('[EKYCBackendService] Failed to start HTTP server:', e && e.message ? e.message : e);
  process.exit(1);
}

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('[EKYCBackendService] SIGTERM signal received: closing HTTP server');
  if (server) {
    server.close(() => {
      console.log('[EKYCBackendService] HTTP server closed');
      process.exit(0);
    });
  } else {
    process.exit(0);
  }
});

module.exports = server;
