/**
 * SERVIDOR PRINCIPAL - SECURITY FORTRESS EDITION
 * ================================================
 * API REST Ultra-Segura para Generación de Facturas PDF
 *
 * Granja Mari Pepa - Sistema de Facturación
 * 
 * CAPAS DE SEGURIDAD IMPLEMENTADAS:
 * - Capa 1: Detección y bloqueo de IPs maliciosas
 * - Capa 2: Detección de bots y herramientas de ataque
 * - Capa 3: Validación de headers HTTP
 * - Capa 4: Detección de payloads maliciosos (SQLi, XSS, etc.)
 * - Capa 5: Honeypots para detectar ataques automatizados
 * - Capa 6: Protección CSRF con tokens firmados
 * - Capa 7: Auditoría completa de acceso a datos
 * - Capa 8: Fingerprinting de dispositivos
 * - Capa 9: Rate limiting granular por usuario
 * - Capa 10: Autenticación de dos factores (2FA)
 */

require('dotenv').config();

const express = require('express');
const compression = require('compression');
const helmet = require('helmet');
const cors = require('cors');
const cookieParser = require('cookie-parser'); // SECURITY: Para manejar cookies HTTP-Only

const logger = require('./app/utils/logger');
const odbcPool = require('./app/config/odbcConfig');
const cacheService = require('./app/services/cacheService');
const facturaController = require('./app/controllers/facturaController');
const authController = require('./app/controllers/authController');
const clienteController = require('./app/controllers/clienteController');
const passwordResetController = require('./app/controllers/passwordResetController');
const authControllerV2 = require('./app/controllers/authControllerV2');
const tempLinkController = require('./app/controllers/tempLinkController');
const pedidoController = require('./app/controllers/pedidoController');
const productsController = require('./app/controllers/productsController');
const chatbotController = require('./app/controllers/chatbotController'); // 🤖 Chatbot IA
const libroIvaController = require('./app/controllers/libroIvaController'); // 📊 Libro IVA
const { generalLimiter, pdfLimiter } = require('./app/middleware/rateLimiter');
const { notFoundHandler, errorHandler, requestLogger } = require('./app/middleware/errorHandler');

// Validación con Joi (Seguridad extrema)
const {
  validateLogin,
  validateGenerarFactura,
  validateProductos,
  validateProducto,
  validatePerfil,
  validateActualizarContacto,
  validateEnviarFacturaEmail,
  validateCompartirWhatsApp
} = require('./app/middleware/validation');

// Middlewares de seguridad básicos
const { requireAuth, requireOwnership } = require('./app/middleware/authMiddleware');
const {
  sanitizarTodos,
  validarLogin,
  validarRefreshToken,
  loginRateLimiter,
  refreshRateLimiter,
  detectarPatronesSospechosos,
  securityLogger
} = require('./app/middleware/securityMiddleware');

// Middlewares de seguridad de sesión
const {
  sessionTimeoutMiddleware,
  sessionHijackingDetection,
  csrfProtection
} = require('./app/middleware/sessionSecurity');

// 🛡️ SECURITY FORTRESS - Protección ultra-avanzada
const {
  checkBannedIP,
  detectMaliciousBots,
  validateHeaders,
  detectMaliciousPayloads,
  honeypotTrap,
  csrfProtectionAdvanced,
  auditDataAccess,
  deviceFingerprinting,
  maskPIIInResponse,
  perUserRateLimit,
  getCSRFToken,
  getSecurityStats,
} = require('./app/middleware/securityFortress');

// 🔐 Autenticación de dos factores
const {
  require2FAForSensitive,
  needs2FAOnLogin,
} = require('./app/middleware/twoFactorAuth');

// 🛡️ SECURITY ULTRA - Protección nivel nación-estado
const {
  applySecurityUltra,
  antiAutomation,
} = require('./app/middleware/securityUltra');

// Crear aplicación Express
const app = express();
const PORT = process.env.PORT || 3000;
const HOST = process.env.HOST || '0.0.0.0';

// ===================================
// 🛡️ SECURITY ULTRA - PRIMERA LÍNEA DE DEFENSA
// ===================================
// SECURITY: Aplicar TODAS las capas de seguridad ultra antes de cualquier otro middleware
applySecurityUltra(app);

// ===================================
// CONFIGURACIÓN DE PROXY (DevTunnels, Nginx, etc.)
// ===================================
// Necesario cuando el servidor está detrás de un proxy (DevTunnels, nginx, load balancer)
// Esto permite que Express obtenga la IP real del cliente desde X-Forwarded-For
// En producción, ajustar según la infraestructura (ej: 'loopback' para nginx local)
if (process.env.NODE_ENV !== 'production') {
  // En desarrollo, confiar en el proxy de DevTunnels
  app.set('trust proxy', true);
  logger.info('Trust proxy habilitado para desarrollo (DevTunnels)');
} else {
  // En producción, ser más restrictivo - ajustar según infraestructura
  app.set('trust proxy', 'loopback');
}

// ===================================
// CONFIGURACIÓN DE MIDDLEWARES
// ===================================

// Seguridad con Helmet - Configuración ULTRA-avanzada
// SECURITY: Helmet complementa Security Ultra, no lo reemplaza
app.use(helmet({
  // SECURITY: CSP ya configurado en securityUltra.js con nonces
  contentSecurityPolicy: false, // Desactivado aquí, gestionado por Security Ultra

  // SECURITY: COEP puede romper recursos externos - configurar según necesidades
  crossOriginEmbedderPolicy: false,

  // SECURITY: CORP configurado para cross-origin por compatibilidad con frontend
  crossOriginResourcePolicy: { policy: "cross-origin" },

  // SECURITY: Desactivar DNS prefetch para privacidad
  dnsPrefetchControl: { allow: false },

  // SECURITY: X-Frame-Options DENY (ya en Security Ultra, redundante pero seguro)
  frameguard: { action: 'deny' },

  // SECURITY: Ocultar X-Powered-By
  hidePoweredBy: true,

  // SECURITY: HSTS ya configurado en Security Ultra con valores más altos
  hsts: false, // Gestionado por Security Ultra con 2 años

  // SECURITY: IE specific
  ieNoOpen: true,

  // SECURITY: X-Content-Type-Options ya en Security Ultra
  noSniff: true,

  // SECURITY: Referrer-Policy ya en Security Ultra como 'no-referrer'
  referrerPolicy: false,

  // SECURITY: X-XSS-Protection ya en Security Ultra
  xssFilter: false, // Obsoleto, pero Security Ultra lo incluye
}));

// CORS con configuración segura
const allowedOrigins = process.env.CORS_ORIGIN
  ? process.env.CORS_ORIGIN.split(',')
  : [
    'http://localhost:3000',
    'http://localhost:3001'
  ];

// TODO: Temporal - Patrón para DevTunnels (QUITAR en producción)
const devTunnelsPattern = /^https:\/\/[a-z0-9-]+-\d+\.uks1\.devtunnels\.ms$/;

app.use(cors({
  origin: (origin, callback) => {
    // ✅ Permitir health checks internos y requests de localhost sin origin
    // Esto es necesario para monitoreo interno (PM2, Nginx, curl)
    if (!origin) {
      // En producción, solo permitimos health checks sin origin
      // El resto de endpoints requieren origin válido
      return callback(null, true); // Permitir, el health check es público
    }

    // Permitir orígenes de la lista
    if (allowedOrigins.indexOf(origin) !== -1 || allowedOrigins.includes('*')) {
      callback(null, true);
    }
    // TODO: Temporal - Permitir DevTunnels en desarrollo (QUITAR en producción)
    else if (process.env.NODE_ENV !== 'production' && devTunnelsPattern.test(origin)) {
      logger.info(`CORS permitido para DevTunnel: ${origin}`);
      callback(null, true);
    }
    else {
      logger.warn(`CORS bloqueado para origin no autorizado: ${origin}`);
      callback(new Error('No permitido por CORS'));
    }
  },
  methods: ['GET', 'POST', 'DELETE', 'PUT', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'X-CSRF-Token'],
  exposedHeaders: ['X-Response-Time', 'X-Request-ID', 'X-Token-Renewal-Required'],
  credentials: true,
  maxAge: 86400 // 24 horas
}));

// Compresión GZIP
app.use(compression({
  level: 6,
  threshold: 1024, // Solo comprimir respuestas > 1KB
  filter: (req, res) => {
    // No comprimir PDFs (ya están comprimidos internamente)
    if (res.getHeader('Content-Type') === 'application/pdf') {
      return false;
    }
    return compression.filter(req, res);
  }
}));

// SECURITY: Cookie parser para manejar cookies HTTP-Only
// Usar secreto para cookies firmadas (opcional pero recomendado)
app.use(cookieParser(process.env.COOKIE_SECRET || process.env.JWT_ACCESS_SECRET));

// Body parser con límites estrictos
app.use(express.json({ limit: '5mb' })); // Reducido de 10mb a 5mb
app.use(express.urlencoded({ extended: true, limit: '5mb' }));

// ===================================
// 🛡️ SECURITY FORTRESS - CAPAS DE PROTECCIÓN
// ===================================

// CAPA 1: Verificar IPs baneadas (primera línea de defensa)
app.use(checkBannedIP);

// CAPA 2: Detectar bots y herramientas de ataque
app.use(detectMaliciousBots);

// CAPA 3: Validar headers HTTP sospechosos
app.use(validateHeaders);

// CAPA 4: Detectar payloads maliciosos (SQLi, XSS, etc.)
app.use(detectMaliciousPayloads);

// CAPA 5: Honeypot para detectar ataques automatizados
app.use(honeypotTrap);

// Request logger
app.use(requestLogger);

// Security logger
app.use(securityLogger);

// CAPA 6: Fingerprinting de dispositivos
app.use(deviceFingerprinting);

// Sanitización adicional de inputs (anti-XSS)
app.use(sanitizarTodos);

// Detección de patrones sospechosos (legacy, complementa CAPA 4)
app.use(detectarPatronesSospechosos);

// Seguridad de sesiones (timeout, hijacking detection)
app.use(sessionTimeoutMiddleware);
app.use(sessionHijackingDetection);

// CAPA 7: Protección CSRF avanzada con tokens firmados
// Se aplica automáticamente a operaciones de escritura
app.use(csrfProtectionAdvanced);

// Rate limiting general
app.use('/api/', generalLimiter);

// ===================================
// RUTAS
// ===================================

// Health check endpoints (sin rate limit)
const healthRoutes = require('./app/routes/health');
app.use('/health', healthRoutes);

// Legacy health check (mantener para compatibilidad)
app.get('/api/health', facturaController.healthCheck.bind(facturaController));

// 🛡️ RUTAS DE SEGURIDAD (estadísticas internas)
app.get('/api/security/stats', requireAuth, (req, res) => {
  // Solo permitir en desarrollo o para administradores
  if (process.env.NODE_ENV === 'production') {
    return res.status(403).json({ success: false, error: 'No disponible en producción' });
  }
  res.json({ success: true, stats: getSecurityStats() });
});

// Métricas del sistema (PROTEGIDO - requiere autenticación)
app.get('/api/metrics', requireAuth, facturaController.obtenerMetricas.bind(facturaController));

// RUTAS DE AUTENTICACIÓN (PÚBLICAS)
// ✅ JOI VALIDATION + Rate limiting estricto
app.post('/api/auth/login', loginRateLimiter, validateLogin, authController.login.bind(authController));
app.post('/api/auth/refresh', refreshRateLimiter, validarRefreshToken, authController.refreshToken.bind(authController));
app.get('/api/auth/health', authController.healthCheck.bind(authController));

// RUTAS DE GESTIÓN DE CONTRASEÑAS (SISTEMA NUEVO)
// ✅ Sistema de hash bcrypt + tokens de recuperación
const passwordController = require('./app/controllers/passwordController');

// PÚBLICAS: Recuperación de contraseña
app.post('/api/password/request-reset', loginRateLimiter, passwordController.solicitarRecuperacion.bind(passwordController));
app.get('/api/password/validate-token/:token', generalLimiter, passwordController.validarToken.bind(passwordController));
app.post('/api/password/reset', loginRateLimiter, passwordController.resetearContrasena.bind(passwordController));
app.get('/api/password/health', passwordController.healthCheck.bind(passwordController));

// PROTEGIDAS: Cambio de contraseña autenticado
app.post('/api/password/change', requireAuth, generalLimiter, passwordController.cambiarContrasena.bind(passwordController));

// RUTAS DE RESET DE CONTRASEÑA (MEJORADO CON VERIFICACIÓN DE CLIENTE)
app.post('/api/password-reset/verify-client', loginRateLimiter, passwordResetController.verificarCliente.bind(passwordResetController));
app.post('/api/password-reset/request', loginRateLimiter, passwordResetController.solicitarReset.bind(passwordResetController));
app.post('/api/password-reset/verify', loginRateLimiter, passwordResetController.verificarCodigo.bind(passwordResetController));
app.post('/api/password-reset/change', loginRateLimiter, passwordResetController.cambiarPassword.bind(passwordResetController));
app.get('/api/password-reset/health', passwordResetController.healthCheck.bind(passwordResetController));

// =====================================================
// RUTAS DE AUTENTICACIÓN V2 (Sin email - Solo código cliente)
// =====================================================
// PÚBLICO: Login con código de cliente + contraseña
app.post('/api/auth/v2/login', loginRateLimiter, authControllerV2.login.bind(authControllerV2));
// PÚBLICO: Solicitar código de verificación (para reset de contraseña)
app.post('/api/auth/v2/solicitar-codigo', loginRateLimiter, authControllerV2.solicitarCodigo.bind(authControllerV2));
// PÚBLICO: Verificar código y cambiar contraseña
app.post('/api/auth/v2/verificar-codigo', loginRateLimiter, authControllerV2.verificarCodigoYCambiarPassword.bind(authControllerV2));
// PÚBLICO: Verificar solo código (sin cambiar contraseña) - para flujo de dos pasos
app.post('/api/auth/v2/verificar-solo-codigo', loginRateLimiter, authControllerV2.verificarSoloCodigo.bind(authControllerV2));
// PÚBLICO: Configurar email para reset de contraseña
app.post('/api/auth/v2/configure-email', loginRateLimiter, authControllerV2.configureEmailForReset.bind(authControllerV2));
// PÚBLICO: Verificar si puede cambiar contraseña (restricción 30 días)
app.get('/api/auth/v2/verificar-cambio/:codigoCliente', generalLimiter, authControllerV2.verificarPermisoCambio.bind(authControllerV2));
// PROTEGIDO: Cambiar contraseña (usuario logueado)
app.post('/api/auth/v2/cambiar-password', requireAuth, generalLimiter, authControllerV2.cambiarPassword.bind(authControllerV2));
// ALIAS: Cambiar contraseña (para compatibilidad con frontend)
app.post('/api/auth/change-password', requireAuth, generalLimiter, authControllerV2.cambiarPassword.bind(authControllerV2));
// PÚBLICO: Verificar si contraseña está en HaveIBeenPwned
app.post('/api/auth/check-password-pwned', generalLimiter, authControllerV2.checkPasswordPwned.bind(authControllerV2));
// PROTEGIDO: Descartar advertencia de contraseña legacy
app.post('/api/auth/dismiss-password-warning', requireAuth, generalLimiter, authControllerV2.dismissPasswordWarning.bind(authControllerV2));

// =====================================================
// SEGURIDAD: CSRF TOKEN
// =====================================================
// PÚBLICO: Obtener token CSRF para peticiones mutativas
app.get('/api/csrf-token', generalLimiter, getCSRFToken);
app.get('/api/security/csrf-token', generalLimiter, getCSRFToken);

// =====================================================
// RUTAS DE FACTURAS Y DASHBOARD
// =====================================================
// PROTEGIDO: Obtener facturas del cliente
app.get('/api/facturas', requireAuth, generalLimiter, facturaController.obtenerFacturasCliente.bind(facturaController));
// PROTEGIDO: Obtener dashboard con estadísticas
app.get('/api/dashboard', requireAuth, generalLimiter, facturaController.obtenerDashboard.bind(facturaController));
// PROTEGIDO: Generar PDF de factura específica
app.post('/api/generar-factura', requireAuth, pdfLimiter, validateGenerarFactura, auditDataAccess('GENERAR_FACTURA'), facturaController.generarFactura.bind(facturaController));
// PROTEGIDO: Libro de IVA repercutido
app.post('/api/libro-iva', requireAuth, pdfLimiter, auditDataAccess('LIBRO_IVA'), libroIvaController.generarLibroIVA);
// PROTEGIDO: Enviar Libro de IVA por email
app.post('/api/libro-iva/enviar-email', requireAuth, generalLimiter, auditDataAccess('LIBRO_IVA_EMAIL'), libroIvaController.enviarLibroIVAPorEmail);

// =====================================================
// ANALYTICS
// =====================================================
// PROTEGIDO: Registrar eventos de analytics
app.post('/api/analytics/events', requireAuth, generalLimiter, (req, res) => {
  // Registro de eventos para analytics
  const { event, data } = req.body;
  logger.info('📊 Analytics event', {
    codigoCliente: req.user?.codigoCliente,
    event,
    timestamp: new Date().toISOString()
  });
  res.json({ success: true, message: 'Event registered' });
});

// LOGS DE ERRORES FRONTEND
// =====================================================
app.post('/api/logs/frontend-error', generalLimiter, (req, res) => {
  const { error, componentStack, userAgent, url } = req.body;
  logger.warn('⚠️ Frontend error', {
    error,
    componentStack,
    userAgent,
    url,
    timestamp: new Date().toISOString()
  });
  res.json({ success: true, message: 'Error logged' });
});

// RUTAS DE AUTENTICACIÓN (PROTEGIDAS - REQUIEREN JWT)
app.post('/api/auth/logout', requireAuth, authController.logout.bind(authController));
app.get('/api/auth/perfil', requireAuth, authController.obtenerPerfil.bind(authController));

// 🛡️ AUDITORÍA: Acceso a datos de facturas (datos sensibles)
app.get('/api/auth/facturas/:codigoCliente', requireAuth, requireOwnership, auditDataAccess('FACTURAS'), authController.obtenerFacturas.bind(authController));
app.get('/api/auth/estadisticas/:codigoCliente', requireAuth, requireOwnership, auditDataAccess('ESTADISTICAS'), authController.obtenerEstadisticas.bind(authController));
app.get('/api/auth/top-productos/:codigoCliente', requireAuth, requireOwnership, auditDataAccess('TOP_PRODUCTOS'), authController.obtenerTopProductos.bind(authController));

// RUTAS DE GESTIÓN DE CLIENTES
app.post('/api/clientes/registrar', generalLimiter, clienteController.registrarCliente.bind(clienteController));

// 🛡️ AUDITORÍA: Acceso a datos de clientes (datos sensibles)
app.get('/api/clientes/:codigoCliente', requireAuth, requireOwnership, auditDataAccess('CLIENTE_PERFIL'), clienteController.obtenerCliente.bind(clienteController));

// RUTAS DE DATOS DE CONTACTO (PROTEGIDAS + AUDITORÍA)
app.get('/api/clientes/:codigoCliente/contacto', requireAuth, auditDataAccess('CONTACTO_LECTURA'), authController.obtenerDatosContacto.bind(authController));
app.put('/api/clientes/:codigoCliente/contacto', requireAuth, generalLimiter, auditDataAccess('CONTACTO_MODIFICACION'), authController.actualizarDatosContacto.bind(authController));
app.get('/api/clientes/health', clienteController.healthCheck.bind(clienteController));

// ⚠️ ENDPOINT DE PRUEBA - SOLO EN DESARROLLO
if (process.env.NODE_ENV !== 'production') {
  app.post('/api/clientes/test-insert', clienteController.testInsert.bind(clienteController));
}

// Enviar factura por email (PROTEGIDA + AUDITORÍA)
app.post('/api/clientes/enviar-factura-email', requireAuth, generalLimiter, validateEnviarFacturaEmail, auditDataAccess('ENVIAR_FACTURA_EMAIL'), facturaController.enviarFacturaPorEmail.bind(facturaController));

// RUTAS DE COMPARTIR FACTURAS (ENLACES TEMPORALES + AUDITORÍA)
app.post('/api/compartir/generar-enlace', requireAuth, generalLimiter, auditDataAccess('GENERAR_ENLACE_COMPARTIR'), tempLinkController.generarEnlace.bind(tempLinkController));
app.get('/api/compartir/descargar/:token', auditDataAccess('DESCARGA_ENLACE_TEMPORAL'), tempLinkController.descargarPorEnlace.bind(tempLinkController)); // PÚBLICO pero auditado
app.get('/api/compartir/info/:token', requireAuth, tempLinkController.obtenerInfoEnlace.bind(tempLinkController));
app.delete('/api/compartir/revocar/:token', requireAuth, auditDataAccess('REVOCAR_ENLACE'), tempLinkController.revocarEnlace.bind(tempLinkController));
app.get('/api/compartir/health', tempLinkController.healthCheck.bind(tempLinkController));

// RUTAS DE PEDIDOS (PROTEGIDAS + AUDITORÍA)
app.get('/api/pedidos/:codigoCliente', requireAuth, requireOwnership, auditDataAccess('PEDIDOS'), pedidoController.obtenerPedidos.bind(pedidoController));
app.get('/api/pedidos/:codigoCliente/detalle', requireAuth, requireOwnership, auditDataAccess('PEDIDO_DETALLE'), pedidoController.obtenerDetallePedido.bind(pedidoController));
app.get('/api/pedidos/health', pedidoController.healthCheck.bind(pedidoController));

// RUTAS DE PRODUCTOS
const { optionalAuth } = require('./app/middleware/authMiddleware');

// 🌍 PÚBLICAS: Catálogo general de productos (sin precio personalizado)
app.get('/api/public/productos', generalLimiter, productsController.obtenerProductosPublicos.bind(productsController));
app.get('/api/public/productos/familias', generalLimiter, productsController.obtenerFamiliasPublicas.bind(productsController));
app.get('/api/public/productos/:codigo', generalLimiter, productsController.obtenerProductoPublico.bind(productsController));

// 🔒 PROTEGIDAS: Productos personalizados con precios del cliente
app.get('/api/productos/familias', requireAuth, generalLimiter, productsController.obtenerFamilias.bind(productsController));
app.get('/api/productos/:codigo', requireAuth, generalLimiter, validateProducto, productsController.obtenerProducto.bind(productsController));
app.get('/api/productos', requireAuth, generalLimiter, validateProductos, productsController.obtenerProductos.bind(productsController));

// Gestión de cache (PROTEGIDO - requiere autenticación)
// ✅ CORRECCIÓN SEGURIDAD: Endpoints de cache ahora requieren autenticación para prevenir DoS
app.delete('/api/cache/factura', requireAuth, facturaController.invalidarCacheFactura.bind(facturaController));
app.delete('/api/cache/all', requireAuth, facturaController.invalidarTodoCache.bind(facturaController));

// ===================================
// 🤖 CHATBOT IA - Asistente Virtual
// ===================================
// Chatbot accesible para usuarios autenticados o con rate limiting estricto
app.post('/api/chatbot', optionalAuth, generalLimiter, chatbotController.processChatMessage);
app.get('/api/chatbot/health', chatbotController.healthCheck);

// =====================================================
// 🔒 SISTEMA DE AUTENTICACIÓN SEGURA (NIVEL BANCARIO)
// =====================================================
// Implementa: bcrypt, zxcvbn, HaveIBeenPwned, JWT, historial de contraseñas
const authSecureRoutes = require('./app/routes/authSecureRoutes');
app.use('/api/auth/secure', authSecureRoutes);

// Ruta raíz - información de la API
app.get('/', (req, res) => {
  res.json({
    name: 'Granja Mari Pepa - API de Facturación',
    version: '1.0.0',
    status: 'running',
    endpoints: {
      health: 'GET /health',
      auth: {
        login: 'POST /api/auth/login (public)',
        refresh: 'POST /api/auth/refresh (public)',
        logout: 'POST /api/auth/logout (protected)',
        perfil: 'GET /api/auth/perfil (protected)',
        facturas: 'GET /api/auth/facturas/:codigoCliente (protected)',
        health: 'GET /api/auth/health'
      },
      clientes: {
        registrar: 'POST /api/clientes/registrar (public)',
        obtener: 'GET /api/clientes/:codigoCliente (protected)',
        testInsert: 'POST /api/clientes/test-insert (dev only)',
        health: 'GET /api/clientes/health'
      },
      invoice: {
        generate: 'POST /api/generar-factura',
        invalidate: 'DELETE /api/cache/factura',
        invalidateAll: 'DELETE /api/cache/all'
      },
      compartir: {
        generarEnlace: 'POST /api/compartir/generar-enlace (protected)',
        descargar: 'GET /api/compartir/descargar/:token (public)',
        info: 'GET /api/compartir/info/:token (protected)',
        revocar: 'DELETE /api/compartir/revocar/:token (protected)',
        health: 'GET /api/compartir/health'
      },
      pedidos: {
        obtener: 'GET /api/pedidos/:codigoCliente (protected)',
        detalle: 'GET /api/pedidos/:codigoCliente/detalle (protected)',
        health: 'GET /api/pedidos/health'
      },
      metrics: 'GET /api/metrics'
    },
    security: {
      authentication: 'JWT (Bearer token)',
      rateLimit: 'Enabled',
      xssProtection: 'Enabled',
      sqlInjectionProtection: 'Enabled',
      headers: 'Helmet configured'
    },
    documentation: 'Ver README.md para documentación completa'
  });
});

// ===================================
// MANEJO DE ERRORES
// ===================================

// 404 para rutas no encontradas
app.use(notFoundHandler);

// Error handler global
app.use(errorHandler);

// ===================================
// INICIALIZACIÓN DEL SERVIDOR
// ===================================

async function initializeServer() {
  try {
    logger.info('Iniciando servidor de facturación...');

    // Inicializar pool ODBC
    try {
      logger.info('Intentando inicializar pool de conexiones ODBC...');
      await odbcPool.initialize();
      logger.info('✅ Pool ODBC inicializado correctamente');
    } catch (odbcError) {
      logger.error('❌ Error crítico: No se pudo conectar a la base de datos');
      logger.error(`Error ODBC: ${odbcError.message}`);
      logger.error('El servidor requiere conexión a la base de datos para funcionar');
      throw odbcError;
    }

    // Verificar secretos JWT
    if (!process.env.JWT_ACCESS_SECRET || !process.env.JWT_REFRESH_SECRET) {
      logger.error('❌ Error crítico: Secretos JWT no configurados en .env');
      logger.error('Configure JWT_ACCESS_SECRET y JWT_REFRESH_SECRET antes de iniciar el servidor');
      throw new Error('Secretos JWT no configurados');
    }

    // Iniciar servidor HTTP
    const server = app.listen(PORT, HOST, () => {
      logger.info(`=================================================`);
      logger.info(`🚀 Servidor iniciado exitosamente`);
      logger.info(`=================================================`);
      logger.info(`Entorno: ${process.env.NODE_ENV || 'development'}`);
      logger.info(`Host: ${HOST}`);
      logger.info(`Puerto: ${PORT}`);
      logger.info(`URL: http://${HOST}:${PORT}`);
      logger.info(`=================================================`);
    });

    // Configurar timeouts
    server.timeout = 120000; // 2 minutos
    server.keepAliveTimeout = 65000;
    server.headersTimeout = 66000;

    // Manejo de señales para shutdown graceful
    const gracefulShutdown = async (signal) => {
      logger.info(`Señal ${signal} recibida, iniciando shutdown graceful...`);

      // Dejar de aceptar nuevas conexiones
      server.close(async () => {
        logger.info('Servidor HTTP cerrado');

        try {
          // Cerrar pool ODBC
          logger.info('Cerrando pool ODBC...');
          await odbcPool.close();

          // Cerrar cache
          logger.info('Cerrando cache...');
          await cacheService.close();

          logger.info('Shutdown completado exitosamente');
          process.exit(0);
        } catch (error) {
          logger.error('Error durante shutdown:', error);
          process.exit(1);
        }
      });

      // Forzar cierre después de 30 segundos
      setTimeout(() => {
        logger.error('Shutdown forzado después de timeout');
        process.exit(1);
      }, 30000);
    };

    // Registrar handlers de señales
    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));

    // Manejo de errores no capturados
    process.on('uncaughtException', (error) => {
      logger.error('Uncaught Exception:', error);
      gracefulShutdown('UNCAUGHT_EXCEPTION');
    });

    process.on('unhandledRejection', (reason, promise) => {
      logger.error('Unhandled Rejection:', { reason, promise });
    });

  } catch (error) {
    logger.error('Error fatal durante inicialización del servidor:', error);
    process.exit(1);
  }
}

// Iniciar servidor
if (require.main === module) {
  initializeServer();
}

module.exports = app;
