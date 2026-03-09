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

  // Extended timeouts for long-running operations (bulk PDF download)
  server.timeout = 300000;          // 5 minutes
  server.keepAliveTimeout = 120000;  // 2 minutes
  server.headersTimeout = 305000;    // slightly above timeout

  server.listen(port, () => {
    console.log(`> Next.js ready on http://localhost:${port}`);
  });
});
