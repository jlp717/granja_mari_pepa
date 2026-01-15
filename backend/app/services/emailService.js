/**
 * SERVICIO DE EMAIL - NODEMAILER
 *
 * Servicio para envío de emails transaccionales usando nodemailer
 * Configuración SMTP de Mari Pepa
 */

const nodemailer = require('nodemailer');
const logger = require('../utils/logger');

// Configuración SMTP desde variables de entorno
const SMTP_CONFIG = {
    host: process.env.SMTP_HOST || 'mail.mari-pepa.com',
    port: 465, // FORZADO: Siempre usar 465 (SSL) para evitar conflictos con .env (587)
    secure: true, // FORZADO: Siempre SSL
    auth: {
        user: process.env.SMTP_USER || 'noreply@mari-pepa.com',
        pass: process.env.SMTP_PASSWORD || '6pVyRf3xptxiN3i'
    },
    // Timeouts to prevent freezing
    connectionTimeout: 10000,
    greetingTimeout: 5000,
    socketTimeout: 10000,
    // TLS options - Handle certificate hostname mismatch
    // NOTE: The mail server (mail.mari-pepa.com) returns a certificate for 'clientes61.dnspropio.com'
    // This is a server-side configuration issue but we handle it here to allow email sending
    tls: {
        rejectUnauthorized: false, // Accept self-signed or mismatched certs
        minVersion: 'TLSv1.2'
    }
};

const FROM_EMAIL = process.env.SMTP_FROM || 'noreply@mari-pepa.com';
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:3000';

// Crear transportador de nodemailer
let transporter = null;

/**
 * Inicializar transporter
 */
function initializeTransporter() {
    if (!transporter) {
        transporter = nodemailer.createTransport(SMTP_CONFIG);
        logger.info('✅ Email service initialized', {
            host: SMTP_CONFIG.host,
            port: SMTP_CONFIG.port,
            secure: SMTP_CONFIG.secure,
            from: FROM_EMAIL
        });
    }
    return transporter;
}

/**
 * Enviar email de recuperación de contraseña
 */
async function sendPasswordResetEmail(to, resetToken, customerName) {
    try {
        const transporter = initializeTransporter();

        const resetLink = `${FRONTEND_URL}/reset-password?token=${resetToken}`;

        const mailOptions = {
            from: `"Granja Mari Pepa - Soporte" <${FROM_EMAIL}>`,
            to: to,
            subject: 'Recuperación de Contraseña - Granja Mari Pepa',
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f8f9fa;">
                    <div style="background-color: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                        <div style="text-align: center; margin-bottom: 30px;">
                            <h1 style="color: #2c5530; margin: 0;">🔒 Recuperación de Contraseña</h1>
                        </div>

                        <p style="font-size: 16px; color: #333; line-height: 1.6;">
                            Hola <strong>${customerName}</strong>,
                        </p>

                        <p style="font-size: 14px; color: #666; line-height: 1.6;">
                            Hemos recibido una solicitud para restablecer tu contraseña en <strong>Granja Mari Pepa</strong>.
                        </p>

                        <div style="background-color: #f0f7f1; padding: 20px; border-radius: 8px; margin: 25px 0;">
                            <p style="font-size: 14px; color: #333; margin: 0 0 15px 0;">
                                Haz clic en el siguiente botón para crear una nueva contraseña:
                            </p>
                            <div style="text-align: center;">
                                <a href="${resetLink}"
                                   style="display: inline-block; background-color: #2c5530; color: white; padding: 14px 35px; text-decoration: none; border-radius: 5px; font-weight: bold; font-size: 16px;">
                                    Restablecer Contraseña
                                </a>
                            </div>
                        </div>

                        <p style="font-size: 13px; color: #999; line-height: 1.6; margin-top: 25px;">
                            O copia y pega este enlace en tu navegador:<br>
                            <span style="color: #666; word-break: break-all;">${resetLink}</span>
                        </p>

                        <div style="background-color: #fff9e6; padding: 15px; border-radius: 8px; border-left: 4px solid #ffc107; margin-top: 25px;">
                            <p style="font-size: 13px; color: #856404; margin: 0; line-height: 1.6;">
                                <strong>⚠️ Importante:</strong> Este enlace expirará en <strong>30 minutos</strong> por seguridad.
                                Si no solicitaste este cambio, ignora este email.
                            </p>
                        </div>

                        <hr style="border: none; border-top: 1px solid #e0e0e0; margin: 30px 0;">

                        <p style="font-size: 12px; color: #999; line-height: 1.5; margin: 0;">
                            <strong>Granja Mari Pepa</strong><br>
                            Pol. Ind. Saprelorca - Parcela D-3<br>
                            30817 Lorca, Murcia<br>
                            📞 639 77 86 56 | 📧 pedidos@mari-pepa.com
                        </p>
                    </div>
                </div>
            `
        };

        const info = await transporter.sendMail(mailOptions);

        logger.info('✅ Email de recuperación enviado', {
            to: to,
            messageId: info.messageId,
            customerName
        });

        return {
            success: true,
            messageId: info.messageId
        };

    } catch (error) {
        logger.error('❌ Error enviando email de recuperación', {
            error: error.message,
            to: to
        });
        throw error;
    }
}

/**
 * Enviar email de código de verificación
 */
async function sendVerificationCodeEmail(to, verificationCode, customerName) {
    try {
        const transporter = initializeTransporter();

        const mailOptions = {
            from: `"Granja Mari Pepa - Seguridad" <${FROM_EMAIL}>`,
            to: to,
            subject: 'Código de Verificación - Granja Mari Pepa',
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f8f9fa;">
                    <div style="background-color: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                        <div style="text-align: center; margin-bottom: 30px;">
                            <h1 style="color: #2c5530; margin: 0;">🔐 Código de Verificación</h1>
                        </div>

                        <p style="font-size: 16px; color: #333; line-height: 1.6;">
                            Hola <strong>${customerName}</strong>,
                        </p>

                        <p style="font-size: 14px; color: #666; line-height: 1.6;">
                            Tu código de verificación para <strong>Granja Mari Pepa</strong> es:
                        </p>

                        <div style="background-color: #f0f7f1; padding: 30px; border-radius: 8px; margin: 25px 0; text-align: center;">
                            <div style="font-size: 48px; font-weight: bold; color: #2c5530; letter-spacing: 8px; font-family: 'Courier New', monospace;">
                                ${verificationCode}
                            </div>
                        </div>

                        <p style="font-size: 14px; color: #666; line-height: 1.6; text-align: center;">
                            Ingresa este código en la aplicación para continuar.
                        </p>

                        <div style="background-color: #fff9e6; padding: 15px; border-radius: 8px; border-left: 4px solid #ffc107; margin-top: 25px;">
                            <p style="font-size: 13px; color: #856404; margin: 0; line-height: 1.6;">
                                <strong>⚠️ Seguridad:</strong> Este código expirará en <strong>10 minutos</strong>.
                                Si no solicitaste este código, ignora este email.
                            </p>
                        </div>

                        <hr style="border: none; border-top: 1px solid #e0e0e0; margin: 30px 0;">

                        <p style="font-size: 12px; color: #999; line-height: 1.5; margin: 0;">
                            <strong>Granja Mari Pepa</strong><br>
                            Pol. Ind. Saprelorca - Parcela D-3<br>
                            30817 Lorca, Murcia<br>
                            📞 639 77 86 56 | 📧 pedidos@mari-pepa.com
                        </p>
                    </div>
                </div>
            `
        };

        const info = await transporter.sendMail(mailOptions);

        logger.info('✅ Email de código de verificación enviado', {
            to: to,
            messageId: info.messageId,
            customerName
        });

        return {
            success: true,
            messageId: info.messageId
        };

    } catch (error) {
        logger.error('❌ Error enviando código de verificación', {
            error: error.message,
            to: to
        });
        throw error;
    }
}

/**
 * Verificar configuración SMTP (health check)
 */
async function verifyConnection() {
    try {
        const transporter = initializeTransporter();
        await transporter.verify();
        logger.info('✅ Conexión SMTP verificada correctamente');
        return { success: true, message: 'SMTP connection verified' };
    } catch (error) {
        logger.error('❌ Error verificando conexión SMTP', error);
        return { success: false, message: error.message };
    }
}

module.exports = {
    sendPasswordResetEmail,
    sendVerificationCodeEmail,
    verifyConnection
};
