/**
 * CONTROLADOR DE AUTENTICACIÓN SEGURA
 *
 * Endpoints para el sistema de autenticación de nivel bancario
 */

const authService = require('../services/authServiceSecure');

/**
 * POST /api/auth/login
 * Login principal
 */
exports.login = async (req, res) => {
    try {
        const { customerCode, password } = req.body;
        const ipAddress = req.ip || req.connection.remoteAddress;
        const userAgent = req.get('user-agent') || '';

        if (!customerCode || !password) {
            return res.status(400).json({
                success: false,
                message: 'Código de cliente y contraseña requeridos'
            });
        }

        const result = await authService.login(customerCode, password, ipAddress, userAgent);

        // Configurar cookies seguras para tokens
        res.cookie('refreshToken', result.tokens.refreshToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            maxAge: 7 * 24 * 60 * 60 * 1000 // 7 días
        });

        return res.status(200).json({
            success: true,
            message: result.message,
            customer: result.customer,
            accessToken: result.tokens.accessToken,
            expiresIn: result.tokens.expiresIn,
            showPasswordChangeModal: result.showPasswordChangeModal
        });

    } catch (error) {
        console.error('Login error:', error);
        return res.status(401).json({
            success: false,
            message: error.message || 'Error de autenticación'
        });
    }
};

/**
 * POST /api/auth/change-password
 * Cambiar contraseña (desde perfil o modal de recomendación)
 */
exports.changePassword = async (req, res) => {
    try {
        const { customerId, currentPassword, newPassword } = req.body;
        const ipAddress = req.ip || req.connection.remoteAddress;
        const userAgent = req.get('user-agent') || '';

        if (!customerId || !currentPassword || !newPassword) {
            return res.status(400).json({
                success: false,
                message: 'Todos los campos son requeridos'
            });
        }

        const result = await authService.changePassword(
            customerId,
            currentPassword,
            newPassword,
            ipAddress,
            userAgent
        );

        return res.status(200).json(result);

    } catch (error) {
        console.error('Change password error:', error);
        return res.status(400).json({
            success: false,
            message: error.message || 'Error al cambiar contraseña'
        });
    }
};

/**
 * POST /api/auth/validate-password
 * Validar contraseña en tiempo real (para feedback del frontend)
 */
exports.validatePassword = async (req, res) => {
    try {
        const { password, customerId } = req.body;

        if (!password) {
            return res.status(400).json({
                success: false,
                message: 'Contraseña requerida'
            });
        }

        const validation = await authService.validatePasswordRealtime(password, customerId);

        return res.status(200).json({
            success: true,
            validation
        });

    } catch (error) {
        console.error('Validate password error:', error);
        return res.status(500).json({
            success: false,
            message: 'Error al validar contraseña'
        });
    }
};

/**
 * POST /api/auth/logout
 * Cerrar sesión (revocar refresh token)
 */
exports.logout = async (req, res) => {
    try {
        const { customerId } = req.body;
        const refreshToken = req.cookies.refreshToken;

        if (customerId && refreshToken) {
            // Aquí podrías implementar la revocación del token específico
            // Por ahora solo limpiamos la cookie
        }

        res.clearCookie('refreshToken');

        return res.status(200).json({
            success: true,
            message: 'Sesión cerrada exitosamente'
        });

    } catch (error) {
        console.error('Logout error:', error);
        return res.status(500).json({
            success: false,
            message: 'Error al cerrar sesión'
        });
    }
};

/**
 * POST /api/auth/refresh
 * Refrescar access token usando refresh token
 */
exports.refreshToken = async (req, res) => {
    try {
        const refreshToken = req.cookies.refreshToken;

        if (!refreshToken) {
            return res.status(401).json({
                success: false,
                message: 'Refresh token no proporcionado'
            });
        }

        // Implementar lógica de refresh token
        // (verificar en DB, generar nuevo access token, etc.)

        return res.status(200).json({
            success: true,
            accessToken: 'new_access_token',
            expiresIn: 900
        });

    } catch (error) {
        console.error('Refresh token error:', error);
        return res.status(401).json({
            success: false,
            message: 'Token inválido o expirado'
        });
    }
};

/**
 * GET /api/auth/me
 * Obtener información del usuario autenticado
 */
exports.getCurrentUser = async (req, res) => {
    try {
        // Asumiendo que tienes middleware de autenticación que agrega req.user
        const customerId = req.user?.customerId;

        if (!customerId) {
            return res.status(401).json({
                success: false,
                message: 'No autenticado'
            });
        }

        const customer = await authService.getCustomerById(customerId);

        if (!customer) {
            return res.status(404).json({
                success: false,
                message: 'Usuario no encontrado'
            });
        }

        return res.status(200).json({
            success: true,
            customer: {
                id: customer.CUSTOMER_ID,
                code: customer.CUSTOMER_CODE,
                fullName: customer.FULL_NAME,
                email: customer.EMAIL,
                isLegacyPassword: customer.IS_LEGACY_PASSWORD === '1',
                lastLogin: customer.LAST_LOGIN_AT
            }
        });

    } catch (error) {
        console.error('Get current user error:', error);
        return res.status(500).json({
            success: false,
            message: 'Error al obtener información del usuario'
        });
    }
};

/**
 * POST /api/auth/check-password-pwned
 * Verificar si una contraseña está en HaveIBeenPwned
 */
exports.checkPasswordPwned = async (req, res) => {
    try {
        const { password } = req.body;

        if (!password) {
            return res.status(400).json({
                success: false,
                message: 'Contraseña requerida'
            });
        }

        const isPwned = await authService.checkPasswordPwned(password);

        return res.status(200).json({
            success: true,
            isPwned,
            message: isPwned
                ? 'Esta contraseña ha sido comprometida'
                : 'Contraseña segura'
        });

    } catch (error) {
        console.error('Check pwned error:', error);
        return res.status(500).json({
            success: false,
            message: 'Error al verificar contraseña',
            isPwned: false // Fallback seguro
        });
    }
};

module.exports = exports;
