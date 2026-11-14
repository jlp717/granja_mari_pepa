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

// El proxy de /api puede recibir ECONNREFUSED si el backend se reinicia. Ese
// fallo debe devolver un 502, no tumbar el proceso que sirve la web pública.
process.on('uncaughtException', (error) => {
  const code = error && error.code;
  const message = String((error && error.message) || '');
  // Bug conocido de Next 16 con pestañas antiguas tras un despliegue: el
  // cliente envía un router-state con formato viejo. La petición RSC falla,
  // pero el servidor debe seguir vivo y dejar que el cliente recargue.
  if (message.includes('router state header')) {
    console.error('[router] estado de cliente antiguo ignorado:', message);
    return;
  }
  if (code === 'ECONNREFUSED' || code === 'ECONNRESET' || code === 'ETIMEDOUT') {
    console.error('[proxy] backend no disponible:', error.message);
    return;
  }
  console.error('[fatal]', error);
  process.exit(1);
});
process.on('unhandledRejection', (reason) => {
  console.error('[unhandledRejection]', reason);
});

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
