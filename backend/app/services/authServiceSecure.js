/**
 * SERVICIO DE AUTENTICACIÓN SEGURA - NIVEL BANCARIO
 *
 * Implementa autenticación moderna siguiendo:
 * - NIST SP 800-63B (rev. 3 + actualizaciones 2025)
 * - OWASP Authentication Cheat Sheet
 * - Política de contraseñas basada en fortaleza real (zxcvbn), no reglas obsoletas
 */

const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const zxcvbn = require('zxcvbn');
const axios = require('axios');
const databaseService = require('./databaseService');
const logger = require('../utils/logger');
const emailService = require('./emailService');

// Configuración Bcrypt según OWASP
// 12 rounds proporciona un buen balance entre seguridad y rendimiento (~250-350ms)
const BCRYPT_ROUNDS = 12;

// Configuración JWT
const JWT_ACCESS_SECRET = process.env.JWT_ACCESS_SECRET || 'CHANGE_THIS_IN_PRODUCTION';
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'CHANGE_REFRESH_SECRET';
const JWT_ACCESS_EXPIRY = '15m';
const JWT_REFRESH_EXPIRY = '7d';

// Límites de seguridad
const MAX_FAILED_ATTEMPTS = 5;
const ACCOUNT_LOCK_DURATION_MINUTES = 30;
const PASSWORD_HISTORY_COUNT = 10;
const MIN_PASSWORD_LENGTH = 12;
const MIN_ZXCVBN_SCORE = 4; // Muy fuerte
const PASSWORD_CHANGE_COOLDOWN_DAYS = 30;

class AuthServiceSecure {
    /**
     * LOGIN PRINCIPAL
     */
    async login(customerCode, password, ipAddress, userAgent) {
        const auditData = {
            customerCode,
            ipAddress,
            userAgent,
            eventType: 'LOGIN_ATTEMPT'
        };

        try {
            // 1. Buscar cliente
            const customer = await this.getCustomerByCode(customerCode);

            if (!customer) {
                await this.recordFailedLogin(null, customerCode, 'CUSTOMER_NOT_FOUND', ipAddress, userAgent);
                throw new Error('Credenciales inválidas');
            }

            // 2. Verificar si la cuenta está bloqueada
            if (customer.ACCOUNT_STATUS === 'LOCKED') {
                if (customer.ACCOUNT_LOCKED_UNTIL && new Date() < new Date(customer.ACCOUNT_LOCKED_UNTIL)) {
                    await this.recordFailedLogin(Number(customer.CUSTOMER_ID), customerCode, 'ACCOUNT_LOCKED', ipAddress, userAgent);
                    throw new Error('Cuenta bloqueada temporalmente. Intente más tarde.');
                }
                // Desbloquear si ya pasó el tiempo
                await this.unlockAccount(Number(customer.CUSTOMER_ID));
            }

            // 3. Verificar contraseña
            const isPasswordValid = await this.verifyPassword(password, customer.PASSWORD_HASH, customer.PASSWORD_ALGORITHM);

            if (!isPasswordValid) {
                await this.handleFailedLogin(Number(customer.CUSTOMER_ID), customerCode, ipAddress, userAgent);
                throw new Error('Credenciales inválidas');
            }

            // 4. Resetear intentos fallidos
            await this.resetFailedAttempts(Number(customer.CUSTOMER_ID));

            // 5. Generar tokens
            const tokens = await this.generateTokens(customer, ipAddress, userAgent);

            // 6. Actualizar último login
            await this.updateLastLogin(Number(customer.CUSTOMER_ID), ipAddress, userAgent);

            // 7. Registrar login exitoso
            await this.recordSuccessfulLogin(Number(customer.CUSTOMER_ID), ipAddress, userAgent);

            // 8. Determinar si mostrar modal de cambio de contraseña
            // Solo mostrar si es legacy Y no ha sido descartado 3 veces
            const dismissalCount = Number(customer.PASSWORD_WARNING_DISMISSALS || 0);
            const showPasswordChangeModal = customer.IS_LEGACY_PASSWORD == 1 && dismissalCount < 3;

            // 9. CHECK MANDATORY EMAIL AND PHONE
            const email = customer.EMAIL ? customer.EMAIL.trim() : null;
            const phone = customer.PHONE ? customer.PHONE.trim() : null;

            // Strict validation: Must format as email AND not be the internal placeholder
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            const hasValidEmail = email && emailRegex.test(email) && !email.endsWith('@granja.local');

            // Phone validation: Must have at least 9 digits
            const phoneRegex = /^\d{9,}$/;
            const hasValidPhone = phone && phoneRegex.test(phone.replace(/\s/g, ''));

            const requiresContactSetup = !hasValidEmail || !hasValidPhone;

            if (requiresContactSetup) {
                logger.info('⚠️ Login exitoso pero usuario sin contacto completo - Requiere configuración', {
                    customerCode,
                    hasEmail: hasValidEmail,
                    hasPhone: hasValidPhone
                });
            }

            return {
                success: true,
                requiresEmailSetup: requiresContactSetup, // BLOCKING FLAG (renamed but keeping for compatibility)
                requiresContactSetup, // New explicit name
                customer: {
                    id: Number(customer.CUSTOMER_ID), // Convertir BigInt a Number
                    code: customer.CUSTOMER_CODE,
                    fullName: customer.FULL_NAME,
                    email: email, // Keep sanitized email
                    phone: phone, // Keep sanitized phone
                    isLegacyPassword: customer.IS_LEGACY_PASSWORD == 1
                },
                tokens,
                showPasswordChangeModal,
                message: (requiresContactSetup)
                    ? 'Configuración de email y teléfono requerida'
                    : (showPasswordChangeModal ? 'Login exitoso. Se recomienda cambiar tu contraseña.' : 'Login exitoso')
            };
        } catch (error) {
            await this.auditSecurityEvent({
                ...auditData,
                severity: 'WARNING',
                result: 'FAILURE',
                errorMessage: error.message
            });
            throw error;
        }
    }

    /**
     * CAMBIO DE CONTRASEÑA (desde perfil o modal)
     */
    async changePassword(customerId, currentPassword, newPassword, ipAddress, userAgent) {
        try {
            // 1. Obtener cliente
            const customer = await this.getCustomerById(customerId);

            if (!customer) {
                throw new Error('Cliente no encontrado');
            }

            // 2. Verificar contraseña actual
            const isCurrentPasswordValid = await this.verifyPassword(
                currentPassword,
                customer.PASSWORD_HASH,
                customer.PASSWORD_ALGORITHM
            );

            if (!isCurrentPasswordValid) {
                await this.auditSecurityEvent({
                    customerId,
                    eventType: 'PASSWORD_CHANGE_FAILED',
                    severity: 'WARNING',
                    result: 'FAILURE',
                    errorMessage: 'Contraseña actual incorrecta',
                    ipAddress,
                    userAgent
                });
                throw new Error('Contraseña actual incorrecta');
            }

            // 3. Verificar cooldown (excepto si es legacy o primer cambio)
            if (customer.IS_LEGACY_PASSWORD === '0' && customer.LAST_ALLOWED_PASSWORD_CHANGE) {
                const daysSinceLastChange = this.daysBetween(
                    new Date(customer.LAST_ALLOWED_PASSWORD_CHANGE),
                    new Date()
                );

                if (daysSinceLastChange < PASSWORD_CHANGE_COOLDOWN_DAYS) {
                    const daysRemaining = PASSWORD_CHANGE_COOLDOWN_DAYS - daysSinceLastChange;
                    throw new Error(`Debes esperar ${daysRemaining} días más para cambiar tu contraseña voluntariamente.`);
                }
            }

            // 4. Validar nueva contraseña
            const validation = await this.validatePassword(newPassword, customer);

            if (!validation.isValid) {
                throw new Error(validation.message);
            }

            // 5. Hashear nueva contraseña con bcrypt
            const newPasswordHash = await bcrypt.hash(newPassword, BCRYPT_ROUNDS);

            // 6. Actualizar en base de datos
            await this.updatePassword(customerId, newPasswordHash, validation.score, validation.crackTimeDisplay, ipAddress);

            // 7. Revocar todos los refresh tokens (cerrar sesiones en otros dispositivos)
            await this.revokeAllRefreshTokens(customerId, 'PASSWORD_CHANGED');

            // 8. Registrar en auditoría
            // Reset password warning dismissals since user changed password
            await this.resetPasswordWarningDismissals(customerId);

            await this.auditSecurityEvent({
                customerId,
                eventType: 'PASSWORD_CHANGED',
                eventCategory: 'PASSWORD',
                severity: 'INFO',
                result: 'SUCCESS',
                eventDescription: `Password changed successfully. Score: ${validation.score}, Crack time: ${validation.crackTimeDisplay}`,
                ipAddress,
                userAgent
            });

            return {
                success: true,
                message: `¡Contraseña cambiada exitosamente! Ahora tardaría ${validation.crackTimeDisplay} en ser crackeada.`,
                crackTimeDisplay: validation.crackTimeDisplay,
                strengthScore: validation.score
            };

        } catch (error) {
            throw error;
        }
    }

    /**
     * VALIDACIÓN DE CONTRASEÑA EN TIEMPO REAL (para feedback frontend)
     */
    async validatePasswordRealtime(password, customerId = null) {
        const result = {
            lengthValid: password.length >= MIN_PASSWORD_LENGTH,
            score: 0,
            feedback: {},
            crackTimeDisplay: '',
            isPwned: false,
            isValid: false
        };

        if (!result.lengthValid) {
            return {
                ...result,
                feedback: {
                    warning: `Mínimo ${MIN_PASSWORD_LENGTH} caracteres`,
                    suggestions: []
                }
            };
        }

        // Evaluar con zxcvbn
        const zxcvbnResult = zxcvbn(password, [
            'granjamaripepa',
            'granja',
            'maripepa'
        ]);

        result.score = zxcvbnResult.score;
        result.feedback = zxcvbnResult.feedback;
        result.crackTimeDisplay = zxcvbnResult.crack_times_display.offline_slow_hashing_1e4_per_second;

        // Check pwned (solo si la puntuación es buena para no hacer request innecesarios)
        if (result.score >= 3) {
            result.isPwned = await this.checkPasswordPwned(password);
        }

        result.isValid = result.score >= MIN_ZXCVBN_SCORE && !result.isPwned;

        return result;
    }

    /**
     * VALIDACIÓN DE CONTRASEÑA COMPLETA (política moderna 2025)
     */
    async validatePassword(password, customer) {
        // 1. Longitud mínima
        if (password.length < MIN_PASSWORD_LENGTH) {
            return {
                isValid: false,
                message: `La contraseña debe tener al menos ${MIN_PASSWORD_LENGTH} caracteres.`,
                score: 0
            };
        }

        // 2. Evaluar con zxcvbn (fortaleza real)
        const result = zxcvbn(password, [
            customer.CUSTOMER_CODE,
            customer.FULL_NAME,
            customer.EMAIL || '',
            'granjamaripepa',
            'granja',
            'maripepa'
        ]);

        if (result.score < MIN_ZXCVBN_SCORE) {
            return {
                isValid: false,
                message: `Esta contraseña es demasiado débil. Puntuación: ${result.score}/4. ${result.feedback.warning || ''} ${result.feedback.suggestions.join(' ')}`,
                score: result.score,
                feedback: result.feedback,
                crackTimeDisplay: result.crack_times_display.offline_slow_hashing_1e4_per_second
            };
        }

        // 3. Comprobar contra HaveIBeenPwned
        const isPwned = await this.checkPasswordPwned(password);

        if (isPwned) {
            return {
                isValid: false,
                message: 'Esta contraseña ha sido comprometida en filtraciones de datos. Por favor, elige otra.',
                score: result.score
            };
        }

        // 4. Verificar que no sea una de las últimas 10 contraseñas
        const isReused = await this.checkPasswordHistory(Number(customer.CUSTOMER_ID), password);

        if (isReused) {
            return {
                isValid: false,
                message: `No puedes reutilizar ninguna de tus últimas ${PASSWORD_HISTORY_COUNT} contraseñas.`,
                score: result.score
            };
        }

        // ✅ Contraseña válida
        return {
            isValid: true,
            score: result.score,
            crackTimeDisplay: result.crack_times_display.offline_slow_hashing_1e4_per_second,
            feedback: result.feedback,
            message: '¡Excelente! Esta contraseña es muy segura.'
        };
    }

    /**
     * VERIFICAR CONTRASEÑA COMPROMETIDA (HaveIBeenPwned API)
     */
    async checkPasswordPwned(password) {
        try {
            // Usar k-anonymity: solo enviamos los primeros 5 caracteres del hash SHA-1
            const sha1Hash = crypto.createHash('sha1').update(password).digest('hex').toUpperCase();
            const prefix = sha1Hash.substring(0, 5);
            const suffix = sha1Hash.substring(5);

            const response = await axios.get(`https://api.pwnedpasswords.com/range/${prefix}`, {
                timeout: 3000
            });

            const hashes = response.data.split('\n');
            const found = hashes.some(line => line.startsWith(suffix));

            return found;

        } catch (error) {
            // Si falla la API, no bloqueamos (pero logueamos)
            console.warn('HaveIBeenPwned API error:', error.message);
            return false;
        }
    }

    /**
     * VERIFICAR HISTORIAL DE CONTRASEÑAS
     */
    async checkPasswordHistory(customerId, newPassword) {
        const query = `
            SELECT PASSWORD_HASH
            FROM JAVIER.CUSTOMER_PASSWORDS
            WHERE CUSTOMER_ID = ?
            ORDER BY CHANGED_AT DESC
            FETCH FIRST ${PASSWORD_HISTORY_COUNT} ROWS ONLY
        `;

        try {
            const history = await databaseService.executeQuery(query, [customerId]);

            for (const record of history) {
                const matches = await bcrypt.compare(newPassword, record.PASSWORD_HASH);
                if (matches) {
                    return true;
                }
            }

            return false;
        } catch (error) {
            console.warn('Error checking password history:', error);
            return false;
        }
    }

    /**
     * VERIFICAR CONTRASEÑA (soporta legacy y Argon2id)
     */
    async verifyPassword(plainPassword, storedHash, algorithm) {
        try {
            if (algorithm === 'LEGACY') {
                // Comparación temporal para contraseñas legacy (durante migración)
                // Primero intenta comparación directa, luego bcrypt si ya fue hasheado
                return storedHash === `LEGACY_${plainPassword}` || await bcrypt.compare(plainPassword, storedHash);
            }

            if (algorithm === 'ARGON2ID' || algorithm === 'BCRYPT') {
                // Soportamos tanto ARGON2ID (legacy) como BCRYPT (nuevo)
                return await bcrypt.compare(plainPassword, storedHash);
            }

            return false;
        } catch (error) {
            logger.error('Error verifying password:', error);
            return false;
        }
    }

    /**
     * GENERAR TOKENS JWT
     */
    async generateTokens(customer, ipAddress, userAgent) {
        const payload = {
            customerId: Number(customer.CUSTOMER_ID), // Convertir BigInt a Number
            customerCode: customer.CUSTOMER_CODE,
            email: customer.EMAIL || null // Manejar emails vacíos
        };

        // Access token (corta duración)
        const accessToken = jwt.sign(payload, JWT_ACCESS_SECRET, {
            expiresIn: JWT_ACCESS_EXPIRY
        });

        // Refresh token (larga duración)
        const refreshToken = crypto.randomBytes(64).toString('hex');
        const refreshTokenHash = await bcrypt.hash(refreshToken, BCRYPT_ROUNDS);

        // Guardar refresh token en DB
        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + 7);

        await this.saveRefreshToken(
            Number(customer.CUSTOMER_ID), // Convertir BigInt a Number
            refreshTokenHash,
            ipAddress,
            userAgent,
            expiresAt
        );

        return {
            accessToken,
            refreshToken,
            expiresIn: 900 // 15 minutos en segundos
        };
    }

    /**
     * HELPERS DE BASE DE DATOS
     */
    async getCustomerByCode(customerCode) {
        const query = `
            SELECT *
            FROM JAVIER.CUSTOMER_CREDENTIALS
            WHERE CUSTOMER_CODE = ?
        `;
        try {
            const results = await databaseService.executeQuery(query, [customerCode]);
            return results[0] || null;
        } catch (error) {
            console.error('Error getting customer by code:', error);
            return null;
        }
    }

    async getCustomerById(customerId) {
        const query = `
            SELECT *
            FROM JAVIER.CUSTOMER_CREDENTIALS
            WHERE CUSTOMER_ID = ?
        `;
        try {
            const results = await databaseService.executeQuery(query, [customerId]);
            return results[0] || null;
        } catch (error) {
            console.error('Error getting customer by ID:', error);
            return null;
        }
    }

    async updatePassword(customerId, passwordHash, strengthScore, crackTimeDisplay, ipAddress) {
        // Actualizar contraseña principal
        const updateQuery = `
            UPDATE JAVIER.CUSTOMER_CREDENTIALS
            SET PASSWORD_HASH = ?,
                PASSWORD_ALGORITHM = 'BCRYPT',
                IS_LEGACY_PASSWORD = '0',
                PASSWORD_LAST_CHANGED = CURRENT_TIMESTAMP,
                PASSWORD_WARNING_DISMISSALS = 0,
                UPDATED_AT = CURRENT_TIMESTAMP
            WHERE CUSTOMER_ID = ?
        `;

        await databaseService.executeQuery(updateQuery, [passwordHash, customerId]);

        // Insertar en historial
        const historyQuery = `
            INSERT INTO JAVIER.CUSTOMER_PASSWORDS (
                CUSTOMER_ID,
                PASSWORD_HASH,
                PASSWORD_ALGORITHM,
                STRENGTH_SCORE,
                CRACK_TIME_DISPLAY,
                CHANGED_FROM_IP,
                CHANGE_REASON
            ) VALUES (?, ?, 'BCRYPT', ?, ?, ?, 'USER_INITIATED')
        `;

        await databaseService.executeQuery(historyQuery, [
            customerId,
            passwordHash,
            strengthScore,
            crackTimeDisplay,
            ipAddress
        ]);
    }

    async handleFailedLogin(customerId, customerCode, ipAddress, userAgent) {
        // Incrementar contador de fallos
        const updateQuery = `
            UPDATE JAVIER.CUSTOMER_CREDENTIALS
            SET FAILED_LOGIN_ATTEMPTS = FAILED_LOGIN_ATTEMPTS + 1,
                LAST_FAILED_LOGIN = CURRENT_TIMESTAMP
            WHERE CUSTOMER_ID = ?
        `;

        await databaseService.executeQuery(updateQuery, [customerId]);

        // Registrar intento fallido
        await this.recordFailedLogin(customerId, customerCode, 'INVALID_PASSWORD', ipAddress, userAgent);

        // Verificar si debe bloquearse
        const customer = await this.getCustomerById(customerId);

        if (customer && customer.FAILED_LOGIN_ATTEMPTS + 1 >= MAX_FAILED_ATTEMPTS) {
            await this.lockAccount(customerId);
        }
    }

    async lockAccount(customerId) {
        const lockUntil = new Date();
        lockUntil.setMinutes(lockUntil.getMinutes() + ACCOUNT_LOCK_DURATION_MINUTES);

        const query = `
            UPDATE JAVIER.CUSTOMER_CREDENTIALS
            SET ACCOUNT_STATUS = 'LOCKED',
                ACCOUNT_LOCKED_UNTIL = ?
            WHERE CUSTOMER_ID = ?
        `;

        await databaseService.executeQuery(query, [this.formatDateForIBMi(lockUntil), customerId]);

        await this.auditSecurityEvent({
            customerId,
            eventType: 'ACCOUNT_LOCKED',
            eventCategory: 'SECURITY',
            severity: 'WARNING',
            result: 'SUCCESS',
            eventDescription: `Account locked for ${ACCOUNT_LOCK_DURATION_MINUTES} minutes due to failed login attempts`
        });
    }

    async unlockAccount(customerId) {
        const query = `
            UPDATE JAVIER.CUSTOMER_CREDENTIALS
            SET ACCOUNT_STATUS = 'ACTIVE',
                ACCOUNT_LOCKED_UNTIL = NULL,
                FAILED_LOGIN_ATTEMPTS = 0
            WHERE CUSTOMER_ID = ?
        `;

        await databaseService.executeQuery(query, [customerId]);
    }

    async resetFailedAttempts(customerId) {
        const query = `
            UPDATE JAVIER.CUSTOMER_CREDENTIALS
            SET FAILED_LOGIN_ATTEMPTS = 0
            WHERE CUSTOMER_ID = ?
        `;

        await databaseService.executeQuery(query, [customerId]);
    }

    async updateLastLogin(customerId, ipAddress, userAgent) {
        const query = `
            UPDATE JAVIER.CUSTOMER_CREDENTIALS
            SET LAST_LOGIN_AT = CURRENT_TIMESTAMP,
                LAST_LOGIN_IP = ?,
                LAST_LOGIN_USER_AGENT = ?
            WHERE CUSTOMER_ID = ?
        `;

        await databaseService.executeQuery(query, [ipAddress, userAgent, customerId]);
    }

    async recordSuccessfulLogin(customerId, ipAddress, userAgent) {
        const query = `
            INSERT INTO JAVIER.LOGIN_ATTEMPTS (
                CUSTOMER_ID,
                SUCCESS,
                IP_ADDRESS,
                USER_AGENT
            ) VALUES (?, '1', ?, ?)
        `;

        await databaseService.executeQuery(query, [customerId, ipAddress, userAgent]);
    }

    async recordFailedLogin(customerId, customerCode, failureReason, ipAddress, userAgent) {
        const query = `
            INSERT INTO JAVIER.LOGIN_ATTEMPTS (
                CUSTOMER_ID,
                CUSTOMER_CODE,
                SUCCESS,
                FAILURE_REASON,
                IP_ADDRESS,
                USER_AGENT
            ) VALUES (?, ?, '0', ?, ?, ?)
        `;

        await databaseService.executeQuery(query, [customerId, customerCode, failureReason, ipAddress, userAgent]);
    }

    async saveRefreshToken(customerId, tokenHash, ipAddress, userAgent, expiresAt) {
        const query = `
            INSERT INTO JAVIER.REFRESH_TOKENS (
                CUSTOMER_ID,
                TOKEN_HASH,
                IP_ADDRESS,
                USER_AGENT,
                EXPIRES_AT
            ) VALUES (?, ?, ?, ?, ?)
        `;

        // Formatear fecha para IBM i: YYYY-MM-DD HH:MM:SS
        const formattedDate = this.formatDateForIBMi(expiresAt);

        await databaseService.executeQuery(query, [
            customerId,
            tokenHash,
            ipAddress,
            userAgent,
            formattedDate
        ]);
    }

    /**
     * Formatea fecha para IBM i DB2
     */
    formatDateForIBMi(date) {
        if (!date) return null;

        const d = new Date(date);
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        const hours = String(d.getHours()).padStart(2, '0');
        const minutes = String(d.getMinutes()).padStart(2, '0');
        const seconds = String(d.getSeconds()).padStart(2, '0');

        return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
    }

    async revokeAllRefreshTokens(customerId, reason) {
        const query = `
            UPDATE JAVIER.REFRESH_TOKENS
            SET IS_REVOKED = '1',
                REVOKED_AT = CURRENT_TIMESTAMP,
                REVOKE_REASON = ?
            WHERE CUSTOMER_ID = ?
                AND IS_REVOKED = '0'
        `;

        await databaseService.executeQuery(query, [reason, customerId]);
    }

    async auditSecurityEvent(event) {
        const query = `
            INSERT INTO JAVIER.SECURITY_AUDIT (
                CUSTOMER_ID,
                EVENT_TYPE,
                EVENT_CATEGORY,
                SEVERITY,
                EVENT_DESCRIPTION,
                IP_ADDRESS,
                USER_AGENT,
                RESULT,
                ERROR_MESSAGE
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;

        try {
            // Ensure all values are properly formatted and not null where required
            // Fixes ODBC -545 (Check constraint violation) by guaranteeing numeric ID
            const customerId = !isNaN(Number(event.customerId)) ? Number(event.customerId) : 0;

            const eventType = (event.eventType || 'UNKNOWN').substring(0, 50);
            const eventCategory = (event.eventCategory || 'GENERAL').substring(0, 50);
            const severity = (event.severity || 'INFO').substring(0, 20);
            const eventDescription = (event.eventDescription || '').substring(0, 500);
            const ipAddress = (event.ipAddress || '0.0.0.0').substring(0, 50);
            const userAgent = (event.userAgent || '').substring(0, 500);
            const result = (event.result || 'SUCCESS').substring(0, 20);
            const errorMessage = (event.errorMessage || '').substring(0, 500);

            await databaseService.executeQuery(query, [
                customerId,
                eventType,
                eventCategory,
                severity,
                eventDescription,
                ipAddress,
                userAgent,
                result,
                errorMessage
            ]);
        } catch (error) {
            // Never fail the main operation due to audit error
            console.error('Error auditing security event:', error);
        }
    }

    daysBetween(date1, date2) {
        const diffTime = Math.abs(date2 - date1);
        return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    }

    /**
     * INCREMENT PASSWORD WARNING DISMISSAL COUNTER
     * Called when user dismisses the legacy password warning
     */
    async incrementPasswordWarningDismissal(customerId) {
        const query = `
            UPDATE JAVIER.CUSTOMER_CREDENTIALS
            SET PASSWORD_WARNING_DISMISSALS = COALESCE(PASSWORD_WARNING_DISMISSALS, 0) + 1
            WHERE CUSTOMER_ID = ?
        `;

        try {
            await databaseService.executeQuery(query, [customerId]);

            // Audit the dismissal
            await this.auditSecurityEvent({
                customerId,
                eventType: 'PASSWORD_WARNING_DISMISSED',
                eventCategory: 'PASSWORD_MANAGEMENT',
                severity: 'INFO',
                eventDescription: 'User dismissed legacy password warning',
                result: 'SUCCESS'
            });

            logger.info('🔔 Password warning dismissal incremented', { customerId });
        } catch (error) {
            logger.error('❌ Error incrementing password warning dismissal', error);
            throw error;
        }
    }

    /**
     * RESET PASSWORD WARNING DISMISSALS
     * Called when user successfully changes their password
     */
    async resetPasswordWarningDismissals(customerId) {
        const query = `
            UPDATE JAVIER.CUSTOMER_CREDENTIALS
            SET PASSWORD_WARNING_DISMISSALS = 0
            WHERE CUSTOMER_ID = ?
        `;

        try {
            await databaseService.executeQuery(query, [customerId]);
            logger.info('🔄 Password warning dismissals reset', { customerId });
        } catch (error) {
            logger.error('❌ Error resetting password warning dismissals', error);
            // Don't throw - this is non-critical
        }
    }

    /**
     * GET DISMISSAL COUNT
     * Check how many times user has dismissed the warning
     */
    async getPasswordWarningDismissalCount(customerId) {
        const query = `
            SELECT PASSWORD_WARNING_DISMISSALS
            FROM JAVIER.CUSTOMER_CREDENTIALS
            WHERE CUSTOMER_ID = ?
        `;

        try {
            const result = await databaseService.executeQuery(query, [customerId]);
            return result && result[0] ? Number(result[0].PASSWORD_WARNING_DISMISSALS || 0) : 0;
        } catch (error) {
            logger.error('❌ Error getting dismissal count', error);
            return 0; // Default to 0 on error
        }
    }

    /**
     * REQUEST PASSWORD RESET
     * Generate verification code and send to user's email
     */
    async requestPasswordReset(customerCode, ipAddress) {
        try {
            // 1. Get customer and their email/phone from CUSTOMER_CREDENTIALS
            const customerQuery = `
                SELECT 
                    cred.CUSTOMER_ID,
                    cred.CUSTOMER_CODE,
                    cred.FULL_NAME,
                    cred.EMAIL,
                    cred.PHONE
                FROM JAVIER.CUSTOMER_CREDENTIALS cred
                WHERE TRIM(cred.CUSTOMER_CODE) = ?
                    AND cred.ACCOUNT_STATUS = 'ACTIVE'
            `;

            const customers = await databaseService.executeQuery(customerQuery, [customerCode.trim()]);

            if (!customers || customers.length === 0) {
                return {
                    success: false,
                    message: 'Cliente no encontrado o cuenta inactiva'
                };
            }

            const customer = customers[0];

            // Check if email is valid
            const hasValidEmail = customer.EMAIL &&
                customer.EMAIL.trim() !== '' &&
                !customer.EMAIL.includes('@granja.local') &&
                customer.EMAIL.includes('@');

            // Check if phone is valid (at least 9 digits)
            const hasValidPhone = customer.PHONE &&
                customer.PHONE.replace(/\D/g, '').length >= 9;

            // If neither email nor phone configured, return error
            if (!hasValidEmail && !hasValidPhone) {
                return {
                    success: false,
                    needsContact: true,
                    message: 'No hay email ni teléfono configurado. Por favor, configura tus datos de contacto en el área de clientes antes de solicitar el cambio de contraseña.'
                };
            }

            // Return available methods for user to choose
            // NOTE: For now, we only support email. SMS/WhatsApp can be added later.
            if (!hasValidEmail) {
                return {
                    success: false,
                    needsEmail: true,
                    message: 'No hay email configurado. Por favor, configura tu email para poder recuperar tu contraseña.'
                };
            }

            // 2. Generate 6-digit code
            const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();

            // Hash the verification code for storage (more secure)
            const bcrypt = require('bcryptjs');
            const codeHash = await bcrypt.hash(verificationCode, 10);

            try {
                // Use CURRENT_TIMESTAMP + 1 HOUR directly in SQL for DB2
                const saveTokenQuery = `
                    INSERT INTO JAVIER.VERIFICATION_CODES (
                        CUSTOMER_ID,
                        CODE_HASH,
                        CODE_TYPE,
                        DELIVERY_METHOD,
                        DELIVERY_TARGET,
                        EXPIRES_AT,
                        IS_USED,
                        ATTEMPTS,
                        CREATED_AT,
                        CREATED_IP
                    ) VALUES (?, ?, 'PASSWORD_RESET', 'EMAIL', ?, CURRENT_TIMESTAMP + 1 HOUR, 0, 0, CURRENT_TIMESTAMP, ?)
                `;

                await databaseService.executeQuery(saveTokenQuery, [
                    Number(customer.CUSTOMER_ID),
                    codeHash,
                    customer.EMAIL,
                    ipAddress || '0.0.0.0'
                ]);
            } catch (tokenError) {
                logger.error('❌ Error saving password reset token', tokenError);
                // If table doesn't exist, return specific error
                if (tokenError.message &&
                    (tokenError.message.includes('SQL0204') ||
                        tokenError.message.includes('SQL0206') ||
                        tokenError.odbcErrors?.[0]?.code === -204 ||
                        tokenError.odbcErrors?.[0]?.code === -206)) {
                    return {
                        success: false,
                        message: 'Sistema de recuperación de contraseña no disponible. Contacta con soporte técnico.'
                    };
                }
                throw tokenError;
            }

            // 4. Audit event
            await this.auditSecurityEvent({
                customerId: Number(customer.CUSTOMER_ID) || 0,
                eventType: 'PASSWORD_RESET_REQUESTED',
                eventCategory: 'PASSWORD_MANAGEMENT',
                severity: 'INFO',
                eventDescription: `Password reset requested for ${customerCode}`,
                ipAddress,
                result: 'SUCCESS'
            });

            // 5. Send email with verification code
            logger.info('📧 Preparing to send verification code email', { customerCode, email: customer.EMAIL });

            // Mask email for security (e.g., j***@example.com)
            const emailParts = customer.EMAIL.split('@');
            const emailMasked = `${emailParts[0][0]}***@${emailParts[1]}`;

            // Send verification code email
            let emailSent = false;
            try {
                logger.info('📤 Sending verification code email...', { to: emailMasked });

                // Use email service directly without extra race timeout (service handles its own timeouts)
                const emailResult = await emailService.sendVerificationCodeEmail(
                    customer.EMAIL,
                    verificationCode,
                    customer.FULL_NAME || customerCode
                );

                if (emailResult && emailResult.success) {
                    logger.success('✅ Verification code email sent', {
                        email: emailMasked,
                        messageId: emailResult.messageId
                    });
                    emailSent = true;
                }
            } catch (emailError) {
                logger.error('❌ Failed to send email', {
                    error: emailError.message,
                    email: emailMasked
                });

                // Return error to user if email fails - they need the code!
                // Don't expose internal connection errors
                return {
                    success: false,
                    message: 'No se pudo enviar el correo electrónico. Por favor verifica tu conexión o intenta más tarde.'
                };
            }

            logger.info('🔑 Password reset code generated and sent', {
                customerCode,
                email: emailMasked,
                emailSent
            });

            return {
                success: true,
                message: `Hemos enviado un código de verificación a ${emailMasked}. Revisa tu bandeja de entrada y spam.`,
                emailMasked
                // NOTE: Never return the verification code to the frontend in production!
            };

        } catch (error) {
            logger.error('❌ Error requesting password reset', error);

            // Return error instead of throwing to allow controller to handle it properly
            return {
                success: false,
                message: error.message || 'Error procesando solicitud de reset'
            };
        }
    }

    /**
     * RESET PASSWORD WITH CODE
     * Verify code and change password
     */
    async resetPasswordWithCode(customerCode, code, newPassword, ipAddress, userAgent) {
        try {
            // 1. Get customer first to get CUSTOMER_ID
            const customer = await this.getCustomerByCode(customerCode);
            if (!customer) {
                return {
                    success: false,
                    message: 'Cliente no encontrado'
                };
            }

            // 2. Verify code exists and is valid
            const verifyQuery = `
                SELECT 
                    CODE_ID,
                    CUSTOMER_ID,
                    CODE_HASH,
                    EXPIRES_AT,
                    IS_USED,
                    ATTEMPTS
                FROM JAVIER.VERIFICATION_CODES
                WHERE CUSTOMER_ID = ?
                    AND CODE_TYPE = 'PASSWORD_RESET'
                    AND IS_USED = 0
                ORDER BY CREATED_AT DESC
                FETCH FIRST 1 ROW ONLY
            `;

            const tokens = await databaseService.executeQuery(verifyQuery, [Number(customer.CUSTOMER_ID)]);

            if (!tokens || tokens.length === 0) {
                await this.auditSecurityEvent({
                    customerId: Number(customer.CUSTOMER_ID),
                    eventType: 'PASSWORD_RESET_FAILED',
                    eventCategory: 'PASSWORD_MANAGEMENT',
                    severity: 'WARNING',
                    eventDescription: `Invalid reset code for ${customerCode}`,
                    ipAddress,
                    result: 'FAILURE'
                });

                return {
                    success: false,
                    message: 'Código de verificación inválido o ya utilizado'
                };
            }

            const token = tokens[0];

            // Check expiration
            const expirationDate = new Date(token.EXPIRES_AT);
            if (new Date() > expirationDate) {
                return {
                    success: false,
                    message: 'El código de verificación ha expirado. Solicita uno nuevo.'
                };
            }

            // Verify the code matches (compare with hash)
            const bcrypt = require('bcryptjs');
            const codeMatches = await bcrypt.compare(code, token.CODE_HASH);

            if (!codeMatches) {
                // Increment attempts
                await databaseService.executeQuery(
                    'UPDATE JAVIER.VERIFICATION_CODES SET ATTEMPTS = ATTEMPTS + 1 WHERE CODE_ID = ?',
                    [token.CODE_ID]
                );

                await this.auditSecurityEvent({
                    customerId: Number(customer.CUSTOMER_ID),
                    eventType: 'PASSWORD_RESET_FAILED',
                    eventCategory: 'PASSWORD_MANAGEMENT',
                    severity: 'WARNING',
                    eventDescription: `Invalid code attempt for ${customerCode}`,
                    ipAddress,
                    result: 'FAILURE'
                });

                return {
                    success: false,
                    message: 'Código de verificación incorrecto'
                };
            }

            // 3. Validate new password
            const validation = await this.validatePassword(newPassword, customer);
            if (!validation.isValid) {
                return {
                    success: false,
                    message: validation.message
                };
            }

            // 4. Change password
            const passwordHash = await bcrypt.hash(newPassword, BCRYPT_ROUNDS);

            const updateQuery = `
                UPDATE JAVIER.CUSTOMER_CREDENTIALS
                SET PASSWORD_HASH = ?,
                    PASSWORD_ALGORITHM = 'BCRYPT',
                    IS_LEGACY_PASSWORD = '0',
                    PASSWORD_LAST_CHANGED = CURRENT_TIMESTAMP,
                    PASSWORD_WARNING_DISMISSALS = 0
                WHERE CUSTOMER_ID = ?
            `;

            await databaseService.executeQuery(updateQuery, [passwordHash, Number(customer.CUSTOMER_ID)]);

            // 5. Save to password history
            const historyQuery = `
                INSERT INTO JAVIER.CUSTOMER_PASSWORDS (
                    CUSTOMER_ID,
                    PASSWORD_HASH,
                    PASSWORD_ALGORITHM,
                    STRENGTH_SCORE,
                    CRACK_TIME_DISPLAY,
                    CHANGED_FROM_IP,
                    CHANGE_REASON
                ) VALUES (?, ?, 'BCRYPT', ?, ?, ?, 'PASSWORD_RESET')
            `;

            await databaseService.executeQuery(historyQuery, [
                Number(customer.CUSTOMER_ID),
                passwordHash,
                validation.score,
                validation.crackTimeDisplay,
                ipAddress
            ]);

            // 6. Mark token as used
            const markUsedQuery = `
                UPDATE JAVIER.VERIFICATION_CODES
                SET IS_USED = 1,
                    USED_AT = CURRENT_TIMESTAMP
                WHERE CODE_ID = ?
            `;

            await databaseService.executeQuery(markUsedQuery, [token.CODE_ID]);

            // 7. Audit event
            await this.auditSecurityEvent({
                customerId: Number(customer.CUSTOMER_ID),
                eventType: 'PASSWORD_RESET_COMPLETED',
                eventCategory: 'PASSWORD_MANAGEMENT',
                severity: 'INFO',
                eventDescription: `Password reset completed via verification code`,
                ipAddress,
                userAgent,
                result: 'SUCCESS'
            });

            logger.success('✅ Password reset successful', { customerCode });

            return {
                success: true,
                message: '¡Contraseña cambiada exitosamente!',
                crackTimeDisplay: validation.crackTimeDisplay,
                strengthScore: validation.score
            };

        } catch (error) {
            logger.error('❌ Error resetting password', error);
            throw new Error('Error cambiando contraseña');
        }
    }

    /**
     * VERIFY CODE ONLY (without changing password)
     * For two-step password recovery flow
     */
    async verifyCodeOnly(customerCode, code, ipAddress) {
        try {
            // 1. Get customer first to get CUSTOMER_ID
            const customer = await this.getCustomerByCode(customerCode);
            if (!customer) {
                return {
                    success: false,
                    message: 'Cliente no encontrado'
                };
            }

            // 2. Verify code exists and is valid
            const verifyQuery = `
                SELECT 
                    CODE_ID,
                    CUSTOMER_ID,
                    CODE_HASH,
                    EXPIRES_AT,
                    IS_USED,
                    ATTEMPTS
                FROM JAVIER.VERIFICATION_CODES
                WHERE CUSTOMER_ID = ?
                    AND CODE_TYPE = 'PASSWORD_RESET'
                    AND IS_USED = 0
                ORDER BY CREATED_AT DESC
                FETCH FIRST 1 ROW ONLY
            `;

            const tokens = await databaseService.executeQuery(verifyQuery, [Number(customer.CUSTOMER_ID)]);

            if (!tokens || tokens.length === 0) {
                return {
                    success: false,
                    message: 'Código de verificación inválido o ya utilizado'
                };
            }

            const token = tokens[0];

            // Check expiration
            const expirationDate = new Date(token.EXPIRES_AT);
            if (new Date() > expirationDate) {
                return {
                    success: false,
                    message: 'El código de verificación ha expirado. Solicita uno nuevo.'
                };
            }

            // Verify the code matches (compare with hash)
            const bcrypt = require('bcryptjs');
            const codeMatches = await bcrypt.compare(code, token.CODE_HASH);

            if (!codeMatches) {
                // Increment attempts
                await databaseService.executeQuery(
                    'UPDATE JAVIER.VERIFICATION_CODES SET ATTEMPTS = ATTEMPTS + 1 WHERE CODE_ID = ?',
                    [token.CODE_ID]
                );

                return {
                    success: false,
                    message: 'Código de verificación incorrecto'
                };
            }

            // Code is valid! (but don't mark as used yet - that happens when password is changed)
            logger.info('✅ Code verified successfully', { customerCode });

            return {
                success: true,
                message: 'Código verificado correctamente'
            };

        } catch (error) {
            logger.error('❌ Error verifying code', error);
            return {
                success: false,
                message: 'Error verificando código'
            };
        }
    }

    /**
     * CAN CHANGE PASSWORD
     * Check if user can change password (30-day cooldown)
     */
    async canChangePassword(customerCode) {
        try {
            const query = `
                SELECT 
                    c.CUSTOMER_ID,
                    c.PASSWORD_LAST_CHANGED,
                    c.IS_LEGACY_PASSWORD
                FROM JAVIER.CUSTOMER_CREDENTIALS c
                WHERE TRIM(c.CUSTOMER_CODE) = ?
            `;

            const customers = await databaseService.executeQuery(query, [customerCode.trim()]);

            if (!customers || customers.length === 0) {
                return {
                    canChange: false,
                    message: 'Cliente no encontrado'
                };
            }

            const customer = customers[0];

            // If legacy password or never changed, allow
            if (customer.IS_LEGACY_PASSWORD == 1 || !customer.PASSWORD_LAST_CHANGED) {
                return {
                    canChange: true,
                    isFirstChange: true,
                    message: 'Puedes cambiar tu contraseña'
                };
            }

            // Check 30-day cooldown
            const lastChanged = new Date(customer.PASSWORD_LAST_CHANGED);
            const now = new Date();
            const daysSinceChange = this.daysBetween(lastChanged, now);
            const daysRemaining = Math.max(0, PASSWORD_CHANGE_COOLDOWN_DAYS - daysSinceChange);

            if (daysRemaining > 0) {
                const nextAllowedDate = new Date(lastChanged);
                nextAllowedDate.setDate(nextAllowedDate.getDate() + PASSWORD_CHANGE_COOLDOWN_DAYS);

                return {
                    canChange: false,
                    isFirstChange: false,
                    daysRemaining,
                    lastChangeDate: lastChanged.toISOString(),
                    nextAllowedDate: nextAllowedDate.toISOString(),
                    message: `Debes esperar ${daysRemaining} días más para cambiar tu contraseña`
                };
            }

            return {
                canChange: true,
                isFirstChange: false,
                daysRemaining: 0,
                message: 'Puedes cambiar tu contraseña'
            };

        } catch (error) {
            logger.error('❌ Error checking password change permission', error);
            // Allow change on error (fail open for better UX)
            return {
                canChange: true,
                message: 'Error verificando permisos, puedes intentar cambiar'
            };
        }
    }

    /**
     * Save email for customer (for password reset)
     * Only modifies JAVIER.CUSTOMER_EMAILS table
     */
    async saveEmailForCustomer(customerCode, email) {
        try {
            logger.info('💾 Saving email for customer', { customerCode, email });

            // 1. Check if customer exists in security system
            const customerQuery = `
                SELECT CUSTOMER_ID, CUSTOMER_CODE
                FROM JAVIER.CUSTOMER_CREDENTIALS
                WHERE TRIM(CUSTOMER_CODE) = ?
            `;

            const customers = await databaseService.executeQuery(customerQuery, [customerCode.trim()]);

            if (!customers || customers.length === 0) {
                logger.warn('⚠️ Customer not found in security system', { customerCode });
                return {
                    success: false,
                    message: 'Cliente no encontrado en el sistema de seguridad'
                };
            }

            const customerId = Number(customers[0].CUSTOMER_ID);

            // 2. Insert or update email in JAVIER.CUSTOMER_EMAILS
            // Check if email already exists for this customer
            const checkEmailQuery = `
                SELECT EMAIL_ID, CUSTOMER_ID, EMAIL_ADDRESS
                FROM JAVIER.CUSTOMER_EMAILS
                WHERE CUSTOMER_ID = ?
            `;

            const existingEmails = await databaseService.executeQuery(checkEmailQuery, [customerId]);

            if (existingEmails && existingEmails.length > 0) {
                // Update existing email
                const updateQuery = `
                    UPDATE JAVIER.CUSTOMER_EMAILS
                    SET EMAIL_ADDRESS = ?,
                        IS_VERIFIED = 'N'
                    WHERE CUSTOMER_ID = ?
                `;

                await databaseService.executeQuery(updateQuery, [email.toLowerCase(), customerId]);
                logger.success('✅ Email actualizado', { customerCode, email });

            } else {
                // Insert new email
                const insertQuery = `
                    INSERT INTO JAVIER.CUSTOMER_EMAILS 
                    (CUSTOMER_ID, EMAIL_ADDRESS, IS_PRIMARY, IS_VERIFIED, CREATED_AT)
                    VALUES (?, ?, 'Y', 'N', CURRENT_TIMESTAMP)
                `;

                await databaseService.executeQuery(insertQuery, [customerId, email.toLowerCase()]);
                logger.success('✅ Email insertado', { customerCode, email });
            }

            // 3. Audit event
            await this.auditSecurityEvent({
                customerId,
                eventType: 'EMAIL_CONFIGURED',
                eventCategory: 'ACCOUNT_MANAGEMENT',
                severity: 'INFO',
                eventDescription: `Email configured for password reset: ${email}`,
                ipAddress: '0.0.0.0', // No IP available in this context
                result: 'SUCCESS'
            });


            return {
                success: true,
                message: 'Email guardado correctamente'
            };

        } catch (error) {
            logger.error('❌ Error saving email for customer', error);
            return {
                success: false,
                message: error.message || 'Error al guardar email'
            };
        }
    }

    /**
     * Save contact (email and phone) for customer
     * Updates CUSTOMER_CREDENTIALS table directly
     */
    async saveContactForCustomer(customerCode, email, phone) {
        try {
            logger.info('💾 Saving contact for customer', { customerCode, email, phone });

            // Update CUSTOMER_CREDENTIALS with email and phone
            const updateQuery = `
                UPDATE JAVIER.CUSTOMER_CREDENTIALS
                SET EMAIL = ?,
                    PHONE = ?,
                    EMAIL_VERIFIED = 1,
                    PHONE_VERIFIED = 1,
                    UPDATED_AT = CURRENT_TIMESTAMP
                WHERE TRIM(CUSTOMER_CODE) = ?
            `;

            await databaseService.executeQuery(updateQuery, [email.trim(), phone.trim(), customerCode.trim()]);
            logger.success('✅ Contacto actualizado en CUSTOMER_CREDENTIALS', { customerCode, email, phone });

            // Audit event
            await this.auditSecurityEvent({
                customerCode,
                eventType: 'CONTACT_CONFIGURED',
                eventCategory: 'ACCOUNT_MANAGEMENT',
                severity: 'INFO',
                eventDescription: `Email and phone configured: ${email}, ${phone}`,
                ipAddress: '0.0.0.0',
                result: 'SUCCESS'
            });

            return {
                success: true,
                message: 'Contacto guardado correctamente'
            };

        } catch (error) {
            logger.error('❌ Error saving contact for customer', error);
            return {
                success: false,
                message: error.message || 'Error al guardar contacto'
            };
        }
    }
}

module.exports = new AuthServiceSecure();
