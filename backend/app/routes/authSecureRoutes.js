/**
 * RUTAS DE AUTENTICACIÓN SEGURA
 */

const express = require('express');
const router = express.Router();
const authController = require('../controllers/authSecureController');
const { authenticateToken } = require('../middleware/authMiddleware');

// Rutas públicas
router.post('/login', authController.login);
router.post('/logout', authController.logout);
router.post('/refresh', authController.refreshToken);
router.post('/check-password-pwned', authController.checkPasswordPwned);
router.post('/validate-password', authController.validatePassword);

// Rutas protegidas (requieren autenticación)
router.post('/change-password', authenticateToken, authController.changePassword);
router.get('/me', authenticateToken, authController.getCurrentUser);

module.exports = router;
