/**
 * Custom Next.js server with extended timeouts.
 * Needed for long-running proxy requests (e.g., bulk PDF download through rewrites).
 */
const { createServer } = require('http');
const { parse } = require('url');
const next = require('next');

const dev = process.env.NODE_ENV !== 'production';
const port = parseInt(process.env.PORT || '3001', 10);
const app = next({ dev });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  const server = createServer((req, res) => {
    const parsedUrl = parse(req.url, true);
    handle(req, res, parsedUrl);
  });

  // Extended timeouts for long-running operations (bulk ZIP download 200MB+)
  server.timeout = 720000;          // 12 minutes (must exceed Nginx's 600s)
  server.keepAliveTimeout = 620000;  // ~10 minutes (keep connections alive during transfers)
  server.headersTimeout = 725000;    // slightly above timeout

  server.listen(port, () => {
    console.log(`> Next.js ready on http://localhost:${port}`);
    // Signal PM2 that the app is ready (required when wait_ready: true in ecosystem config)
    if (typeof process.send === 'function') {
      process.send('ready');
    }
  });
});
