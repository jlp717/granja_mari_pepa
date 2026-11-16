/**
 * Canales de eventos del panel y de la web pública.
 *
 * El panel y las páginas públicas se suscriben por SSE. Cualquier mutación
 * publicada aquí llega al instante a todos los clientes conectados, sin
 * recargar la página. Los eventos públicos no contienen datos personales.
 */

const { EventEmitter } = require('events');

const adminBus = new EventEmitter();
const publicBus = new EventEmitter();
adminBus.setMaxListeners(0);
publicBus.setMaxListeners(0);

function event(type, action, data) {
  return {
    type,
    action,
    at: new Date().toISOString(),
    ...(data ? { data } : {}),
  };
}

function publishAdmin(type, action = 'updated', data) {
  adminBus.emit('event', event(type, action, data));
}

function publishPublic(type, action = 'updated', data) {
  publicBus.emit('event', event(type, action, data));
}

function stream(req, res, bus) {
  res.status(200);
  res.setHeader('Content-Type', 'text/event-stream; charset=utf-8');
  res.setHeader('Cache-Control', 'no-cache, no-transform');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no');
  if (typeof res.flushHeaders === 'function') res.flushHeaders();
  res.write(': connected\n\n');

  const send = (payload) => {
    try {
      res.write(`data: ${JSON.stringify(payload)}\n\n`);
    } catch {
      /* El cliente ya se ha desconectado. */
    }
  };
  bus.on('event', send);

  const ping = setInterval(() => {
    try {
      res.write(': ping\n\n');
    } catch {
      /* ignore */
    }
  }, 20000);

  const close = () => {
    clearInterval(ping);
    bus.removeListener('event', send);
    try {
      res.end();
    } catch {
      /* ignore */
    }
  };
  req.on('close', close);
  req.on('aborted', close);
}

function streamAdmin(req, res) {
  stream(req, res, adminBus);
}

function streamPublic(req, res) {
  stream(req, res, publicBus);
}

module.exports = {
  publishAdmin,
  publishPublic,
  streamAdmin,
  streamPublic,
};
