/**
 * CONTROLADOR DE AUTENTICACIÓN V2
 * =================================
 * Versión mejorada con sistema de autenticación segura (nivel bancario)
 * Usa authServiceSecure con CUSTOMER_CREDENTIALS
 */

const authServiceSecure = require('../services/authServiceSecure');
const logger = require('../utils/logger');

/**
 * POST /api/auth/v2/login
 * Login con sistema de autenticación segura
 */
async function loginV2(req, res) {
  try {
    const { codigoCliente, password } = req.body;

    logger.info('🔐 Login V2', { codigoCliente });

    if (!codigoCliente || !password) {
      return res.status(400).json({
        success: false,
        message: 'Código de cliente y contraseña son obligatorios'
      });
    }

    // Obtener IP y User Agent
    const ipAddress = req.ip || req.connection.remoteAddress || '0.0.0.0';
    const userAgent = req.get('user-agent') || 'Unknown';

    // Usar el servicio de autenticación segura
    const result = await authServiceSecure.login(
      codigoCliente,
      password,
      ipAddress,
      userAgent
    );

    // Enviar accessToken en cookie HttpOnly
    res.cookie('accessToken', result.tokens.accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 15 * 60 * 1000 // 15 minutos
    });

    // También enviar refreshToken en cookie
    res.cookie('refreshToken', result.tokens.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000 // 7 días
    });

    logger.success('✅ Login V2 exitoso', { codigoCliente });

    // Devolver en formato compatible con frontend
    const responseData = {
      success: true,
      cliente: {
        id: result.customer.id, // ID numérico para operaciones
        customerId: result.customer.id, // Alias para compatibilidad
        codigoCliente: result.customer.code,
        nombre: result.customer.fullName,
        email: result.customer.email,
        telefono: null,
        nombreAlternativo: null,
        nombreComercial: null
      },
      tokens: result.tokens,
      showPasswordChangeModal: result.showPasswordChangeModal,
      requiresEmailSetup: result.requiresEmailSetup, // MANDATORY EMAIL CONFIGURATION
      message: result.message
    };

    // DEBUG: Log what we're sending to frontend
    logger.info('📤 Sending login response', {
      showPasswordChangeModal: responseData.showPasswordChangeModal,
      requiresEmailSetup: responseData.requiresEmailSetup,
      message: responseData.message
    });

    return res.json(responseData);

  } catch (error) {
    logger.error('❌ Error en loginV2', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Error interno del servidor'
    });
  }
}

/**
 * POST /api/v2/auth/refresh
 * Refrescar access token usando refresh token
 */
async function refreshToken(req, res) {
  try {
    const { refreshToken: token } = req.body;

    if (!token) {
      return res.status(400).json({
        success: false,
        message: 'Refresh token requerido'
      });
    }

    const result = await authService.refreshAccessToken(token);

    if (!result.success) {
      return res.status(401).json(result);
    }

    return res.json(result);
  } catch (error) {
    logger.error('❌ Error refrescando token', error);
    return res.status(500).json({
      success: false,
      message: 'Error refrescando token'
    });
  }
}

/**
 * POST /api/auth/v2/solicitar-codigo
 * Solicitar código de verificación para reset de password
 */
async function solicitarCodigo(req, res) {
  try {
    const { codigoCliente } = req.body;
    const ipAddress = req.ip || req.connection.remoteAddress || '0.0.0.0';

    if (!codigoCliente) {
      return res.status(400).json({
        success: false,
        error: 'Código de cliente es requerido'
      });
    }

    logger.info('📧 Solicitar código de reset', { codigoCliente, ipAddress });

    // 1. Verificar que el cliente existe y obtener su email
    const result = await authServiceSecure.requestPasswordReset(codigoCliente, ipAddress);

    if (!result.success) {
      return res.status(400).json({
        ok: false,
        success: false,
        needsEmail: result.needsEmail || false,
        message: result.message || 'Error procesando solicitud'
      });
    }

    logger.success('✅ Código de reset generado', { codigoCliente, email: result.email });

    // Build response object
    const response = {
      ok: true,
      success: true,
      message: result.message,
      maskedEmail: result.emailMasked // Email parcialmente oculto (e.g., "j***@example.com")
    };

    // Only include verification code in development mode
    if (result.modoDesarrollo && result.codigoVerificacion) {
      response.codigoVerificacion = result.codigoVerificacion;
      logger.warn('⚠️ Verification code returned in response (DEV MODE ONLY)', { code: result.codigoVerificacion });
    }

    return res.json(response);

  } catch (error) {
    logger.error('❌ Error solicitando código', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Error solicitando código'
    });
  }
}

/**
 * POST /api/auth/v2/verificar-codigo
 * Verificar código y cambiar password
 */
async function verificarCodigoYCambiarPassword(req, res) {
  try {
    const { codigoCliente, codigoVerificacion, nuevaPassword } = req.body;
    const ipAddress = req.ip || req.connection.remoteAddress || '0.0.0.0';
    const userAgent = req.get('user-agent') || 'Unknown';

    if (!codigoCliente || !codigoVerificacion || !nuevaPassword) {
      return res.status(400).json({
        success: false,
        error: 'Código de cliente, código de verificación y nueva contraseña son requeridos'
      });
    }

    logger.info('🔐 Verificar código y cambiar password', { codigoCliente });

    // Verificar código y cambiar password
    const result = await authServiceSecure.resetPasswordWithCode(
      codigoCliente,
      codigoVerificacion,
      nuevaPassword,
      ipAddress,
      userAgent
    );

    if (!result.success) {
      return res.status(400).json({
        success: false,
        error: result.message || 'Error verificando código'
      });
    }

    logger.success('✅ Password cambiado exitosamente', { codigoCliente });

    return res.json({
      success: true,
      message: result.message,
      crackTimeDisplay: result.crackTimeDisplay,
      strengthScore: result.strengthScore
    });

  } catch (error) {
    logger.error('❌ Error verificando código', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Error verificando código'
    });
  }
}

/**
 * POST /api/auth/v2/verificar-solo-codigo
 * Verificar solo el código (sin cambiar password)
 * Para el flujo de dos pasos: primero verifica código, luego permite cambiar password
 */
async function verificarSoloCodigo(req, res) {
  try {
    const { codigoCliente, codigoVerificacion } = req.body;
    const ipAddress = req.ip || req.connection.remoteAddress || '0.0.0.0';

    if (!codigoCliente || !codigoVerificacion) {
      return res.status(400).json({
        success: false,
        message: 'Código de cliente y código de verificación son requeridos'
      });
    }

    logger.info('🔐 Verificar solo código', { codigoCliente });

    // Verify the code using the service
    const result = await authServiceSecure.verifyCodeOnly(
      codigoCliente,
      codigoVerificacion,
      ipAddress
    );

    if (!result.success) {
      return res.status(400).json({
        success: false,
        message: result.message || 'Código incorrecto o expirado'
      });
    }

    logger.success('✅ Código verificado correctamente', { codigoCliente });

    return res.json({
      success: true,
      message: 'Código verificado correctamente. Ahora puedes establecer tu nueva contraseña.'
    });

  } catch (error) {
    logger.error('❌ Error verificando código', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Error verificando código'
    });
  }
}

/**
 * GET /api/auth/v2/verificar-cambio/:codigoCliente
 * Verificar si puede cambiar password (restricción 30 días)
 */
async function verificarPermisoCambio(req, res) {
  try {
    const { codigoCliente } = req.params;

    if (!codigoCliente) {
      return res.status(400).json({
        success: false,
        message: 'Código de cliente es requerido'
      });
    }

    logger.info('🔍 Verificar permiso de cambio', { codigoCliente });

    // Verificar última fecha de cambio de password
    const result = await authServiceSecure.canChangePassword(codigoCliente);

    // Prevent caching of this security check
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');

    return res.json({
      success: true,
      // English keys (new standard)
      canChange: result.canChange,
      isFirstChange: result.isFirstChange,
      daysRemaining: result.daysRemaining,
      lastChangeDate: result.lastChangeDate,
      nextAllowedDate: result.nextAllowedDate,
      message: result.message,
      // Spanish aliases (frontend compatibility)
      puedeCambiar: result.canChange,
      esPrimerCambio: result.isFirstChange,
      diasRestantes: result.daysRemaining,
      fechaUltimoCambio: result.lastChangeDate,
      fechaProximoCambio: result.nextAllowedDate
    });

  } catch (error) {
    logger.error('❌ Error verificando permiso', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Error verificando permiso'
    });
  }
}

/**
 * POST /api/auth/v2/cambiar-password
 * Cambiar password (usuario autenticado)
 */
async function cambiarPassword(req, res) {
  try {
    const { currentPassword, newPassword } = req.body;
    const customerId = req.user?.customerId || req.user?.id;

    if (!customerId) {
      return res.status(401).json({
        success: false,
        message: 'Usuario no autenticado'
      });
    }

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Contraseña actual y nueva contraseña son obligatorias'
      });
    }

    logger.info('🔑 Cambiar password', { customerId });

    // Obtener IP y User Agent
    const ipAddress = req.ip || req.connection.remoteAddress || '0.0.0.0';
    const userAgent = req.get('user-agent') || 'Unknown';

    // Usar el servicio de autenticación segura
    const result = await authServiceSecure.changePassword(
      customerId,
      currentPassword,
      newPassword,
      ipAddress,
      userAgent
    );

    logger.success('✅ Password cambiado exitosamente', { customerId });

    return res.json(result);

  } catch (error) {
    logger.error('❌ Error cambiando password', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Error cambiando password'
    });
  }
}

/**
 * POST /api/auth/check-password-pwned
 * Verificar si una contraseña está en HaveIBeenPwned
 */
async function checkPasswordPwned(req, res) {
  try {
    const { password } = req.body;

    if (!password) {
      return res.status(400).json({
        success: false,
        message: 'Contraseña es requerida'
      });
    }

    const crypto = require('crypto');
    const axios = require('axios');

    // Usar k-anonymity: solo enviamos los primeros 5 caracteres del hash SHA-1
    const sha1Hash = crypto.createHash('sha1').update(password).digest('hex').toUpperCase();
    const prefix = sha1Hash.substring(0, 5);
    const suffix = sha1Hash.substring(5);

    try {
      const response = await axios.get(`https://api.pwnedpasswords.com/range/${prefix}`, {
        timeout: 3000
      });

      const hashes = response.data.split('\n');
      const found = hashes.some(line => line.startsWith(suffix));

      return res.json({
        success: true,
        isPwned: found
      });

    } catch (error) {
      // Si falla la API, no bloqueamos (pero logueamos)
      logger.warn('⚠️ HaveIBeenPwned API error:', error.message);
      return res.json({
        success: true,
        isPwned: false
      });
    }

  } catch (error) {
    logger.error('❌ Error checking pwned password', error);
    return res.status(500).json({
      success: false,
      message: 'Error verificando contraseña'
    });
  }
}

/**
 * POST /api/auth/dismiss-password-warning
 * Increment dismissal counter when user declines password change
 */
async function dismissPasswordWarning(req, res) {
  try {
    const customerId = req.user?.customerId || req.user?.id;

    if (!customerId) {
      return res.status(401).json({
        success: false,
        message: 'Usuario no autenticado'
      });
    }

    logger.info('🔕 Dismissing password warning', { customerId });

    // Increment dismissal counter
    await authServiceSecure.incrementPasswordWarningDismissal(customerId);

    // Get updated count
    const dismissalCount = await authServiceSecure.getPasswordWarningDismissalCount(customerId);

    logger.success('✅ Password warning dismissed', { customerId, dismissalCount });

    return res.json({
      success: true,
      message: 'Warning dismissed',
      dismissalCount,
      showAgain: dismissalCount < 2
    });

  } catch (error) {
    logger.error('❌ Error dismissing password warning', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Error dismissing warning'
    });
  }
}

/**
 * POST /api/auth/v2/configure-email
 * Configure email and phone for password reset when user doesn't have them
 */
async function configureEmailForReset(req, res) {
  try {
    const { codigoCliente, email, telefono } = req.body;

    if (!codigoCliente || !email || !telefono) {
      return res.status(400).json({
        ok: false,
        success: false,
        message: 'Código de cliente, email y teléfono son requeridos'
      });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        ok: false,
        success: false,
        message: 'Email inválido'
      });
    }

    // Validate phone format (at least 9 digits)
    const phoneRegex = /^\d{9,}$/;
    if (!phoneRegex.test(telefono.replace(/\s/g, ''))) {
      return res.status(400).json({
        ok: false,
        success: false,
        message: 'Teléfono debe tener al menos 9 dígitos'
      });
    }

    logger.info('📧 Configurar email y teléfono para reset', { codigoCliente, email, telefono });

    // Use authServiceSecure to save email and phone
    const result = await authServiceSecure.saveContactForCustomer(codigoCliente, email, telefono);

    if (!result.success) {
      return res.status(400).json({
        ok: false,
        success: false,
        message: result.message || 'Error al configurar contacto'
      });
    }

    logger.success('✅ Contacto configurado', { codigoCliente, email, telefono });

    return res.json({
      ok: true,
      success: true,
      message: result.message || 'Contacto configurado correctamente'
    });

  } catch (error) {
    logger.error('❌ Error configurando contacto', error);
    return res.status(500).json({
      ok: false,
      success: false,
      message: error.message || 'Error al configurar contacto'
    });
  }
}

module.exports = {
  login: loginV2, // Alias para compatibilidad
  loginV2,
  refreshToken,
  solicitarCodigo,
  verificarCodigoYCambiarPassword,
  verificarSoloCodigo,
  verificarPermisoCambio,
  cambiarPassword,
  checkPasswordPwned,
  dismissPasswordWarning,
  configureEmailForReset
};
