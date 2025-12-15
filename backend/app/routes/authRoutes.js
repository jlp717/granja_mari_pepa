/**
 * RUTAS DE AUTENTICACIÓN
 * =======================
 * Endpoints para login, logout y verificación
 */

const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { authenticateToken } = require('../middleware/authMiddleware');
const { strictRateLimiter } = require('../middleware/rateLimitMiddleware');

/**
 * POST /api/auth/login
 * Login con código de cliente y email
 */
router.post('/login', strictRateLimiter, authController.login);

/**
 * POST /api/auth/verify
 * Verificar validez de un token
 */
router.post('/verify', authController.verifyTokenEndpoint);

/**
 * GET /api/auth/me
 * Obtener información del usuario autenticado
 */
router.get('/me', authenticateToken, authController.getCurrentUser);

/**
 * POST /api/auth/logout
 * Logout del sistema
 */
router.post('/logout', authenticateToken, authController.logout);

/**
 * GET /api/auth/estadisticas/:codigoCliente
 * Obtener estadísticas del cliente
 */
router.get('/estadisticas/:codigoCliente', authenticateToken, authController.obtenerEstadisticas);

/**
 * GET /api/auth/top-productos/:codigoCliente
 * Obtener top productos del cliente
 */
router.get('/top-productos/:codigoCliente', authenticateToken, authController.obtenerTopProductos);

/**
 * GET /api/auth/perfil
 * Obtener perfil completo del cliente
 */
router.get('/perfil', authenticateToken, authController.obtenerPerfil);

module.exports = router;
