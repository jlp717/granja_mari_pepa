/**
 * SERVICIO DE EMAIL - NODEMAILER
 *
 * Servicio para envío de emails transaccionales usando nodemailer
 * Configuración SMTP de Mari Pepa
 */

const nodemailer = require('nodemailer');
const path = require('path');
const logger = require('../utils/logger');

// Logo real de la marca para la cabecera de los correos. Se incrusta en el
// propio mensaje (CID) para que se vea sin depender de un servidor externo.
const EMAIL_LOGO_PATH = path.join(__dirname, '..', '..', 'assets', 'email', 'logo-maripepa.png');
const EMAIL_LOGO_CID = 'maripepa-logo@maripepa.es';

function emailLogoAttachment() {
    return {
        filename: 'maripepa.png',
        path: EMAIL_LOGO_PATH,
        cid: EMAIL_LOGO_CID,
        contentDisposition: 'inline'
    };
}

// Configuración SMTP desde variables de entorno
const SMTP_CONFIG = {
    host: process.env.SMTP_HOST || '_dc-mx.bef93564e202.mari-pepa.com',
    port: 465, // FORZADO: Siempre usar 465 (SSL) para evitar conflictos con .env (587)
    secure: true, // FORZADO: Siempre SSL
    auth: {
        user: process.env.SMTP_USER || 'noreply@mari-pepa.com',
        pass: process.env.SMTP_PASSWORD
    },
    // Timeouts to prevent freezing
    connectionTimeout: 20000, // Increased to 20s
    greetingTimeout: 10000,
    socketTimeout: 20000,
    // TLS options - Handle certificate hostname mismatch
    // NOTE: The mail server (mail.mari-pepa.com) returns a certificate for 'clientes61.dnspropio.com'
    // This is a server-side configuration issue but we handle it here to allow email sending
    tls: {
        rejectUnauthorized: true,
        minVersion: 'TLSv1.2'
    }
};

const FROM_EMAIL = process.env.SMTP_FROM || 'noreply@mari-pepa.com';
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:3000';

function escapeHtml(value) {
    return String(value ?? '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

// Crear transportador de nodemailer
let transporter = null;

/**
 * Inicializar transporter
 */
function initializeTransporter() {
    if (!transporter) {
        if (!SMTP_CONFIG.auth.pass) {
            throw new Error('SMTP_PASSWORD no configurada: no se puede enviar correo');
        }
        transporter = nodemailer.createTransport(SMTP_CONFIG);
        logger.info('✅ Email service initializing...', {
            host: SMTP_CONFIG.host,
            port: SMTP_CONFIG.port,
            secure: SMTP_CONFIG.secure,
            user: SMTP_CONFIG.auth.user,
            // Mask password in logs
            message: 'Using hardcoded Port 465 settings'
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
            from: `"Mari Pepa - Soporte" <${FROM_EMAIL}>`,
            to: to,
            subject: 'Recuperación de Contraseña - Mari Pepa',
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f8f9fa;">
                    <div style="background-color: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                        <div style="text-align: center; margin-bottom: 30px;">
                            <h1 style="color: #2c5530; margin: 0;">🔒 Recuperación de Contraseña</h1>
                        </div>

                        <p style="font-size: 16px; color: #333; line-height: 1.6;">
                            Hola <strong>${escapeHtml(customerName)}</strong>,
                        </p>

                        <p style="font-size: 14px; color: #666; line-height: 1.6;">
                            Hemos recibido una solicitud para restablecer tu contraseña en <strong>Mari Pepa</strong>.
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
                            <strong>Mari Pepa</strong><br>
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
            from: `"Mari Pepa - Seguridad" <${FROM_EMAIL}>`,
            to: to,
            subject: 'Código de Verificación - Mari Pepa',
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f8f9fa;">
                    <div style="background-color: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                        <div style="text-align: center; margin-bottom: 30px;">
                            <h1 style="color: #2c5530; margin: 0;">🔐 Código de Verificación</h1>
                        </div>

                        <p style="font-size: 16px; color: #333; line-height: 1.6;">
                            Hola <strong>${escapeHtml(customerName)}</strong>,
                        </p>

                        <p style="font-size: 14px; color: #666; line-height: 1.6;">
                            Tu código de verificación para <strong>Mari Pepa</strong> es:
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
                            <strong>Mari Pepa</strong><br>
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

/**
 * Aviso interno de nueva candidatura.
 */
/**
 * Transporte dedicado para los avisos de candidaturas.
 * Usa su propio buzón (SMTP_RRHH_*) para no tocar el canal de noreply
 * que envían los correos de recuperación de contraseña.
 */
function createRrhhTransporter() {
    if (!process.env.SMTP_RRHH_HOST) return null;
    return nodemailer.createTransport({
        host: process.env.SMTP_RRHH_HOST,
        port: Number(process.env.SMTP_RRHH_PORT || 465),
        secure: String(process.env.SMTP_RRHH_SECURE || 'true') === 'true',
        auth: {
            user: process.env.SMTP_RRHH_USER,
            pass: process.env.SMTP_RRHH_PASSWORD,
        },
        connectionTimeout: 15000,
        greetingTimeout: 15000,
        socketTimeout: 20000,
    });
}

async function sendApplicationNotification(application, to) {
    const dedicated = createRrhhTransporter();
    try {
        const transporter = dedicated || initializeTransporter();
        const senderAddress = dedicated
            ? process.env.SMTP_RRHH_FROM || process.env.SMTP_RRHH_USER
            : FROM_EMAIL;
        const esc = (value) =>
            String(value)
                .replace(/&/g, '&amp;')
                .replace(/</g, '&lt;')
                .replace(/>/g, '&gt;')
                .replace(/"/g, '&quot;');
        const row = (label, value) =>
            value
                ? `<tr>
                     <td style="padding:9px 14px 9px 0;border-bottom:1px solid #ece8df;font-family:Arial,Helvetica,sans-serif;font-size:10px;letter-spacing:1.4px;text-transform:uppercase;color:#8a8578;width:36%;vertical-align:top;">${label}</td>
                     <td style="padding:9px 0;border-bottom:1px solid #ece8df;font-family:Arial,Helvetica,sans-serif;font-size:13px;color:#1a1a1a;vertical-align:top;">${esc(value)}</td>
                   </tr>`
                : '';

        const mailOptions = {
            from: `"Mari Pepa - Empleo" <${senderAddress}>`,
            to,
            replyTo: application.email,
            subject: `Nueva candidatura: ${application.name}${application.jobTitle ? ` - ${application.jobTitle}` : ''}`,
            html: `
                <div style="margin:0;padding:0;background:#f2f1ee;">
                  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f2f1ee;padding:28px 12px;">
                    <tr>
                      <td align="center">
                        <table role="presentation" width="560" cellpadding="0" cellspacing="0" style="width:560px;max-width:100%;background:#ffffff;border:1px solid #e3ded3;">
                          <tr><td style="height:3px;background:#cf3700;font-size:0;line-height:0;">&nbsp;</td></tr>
                          <tr>
                            <td style="padding:26px 30px 0;">
                              <p style="margin:0;font-family:Arial,Helvetica,sans-serif;font-size:10px;letter-spacing:2.4px;text-transform:uppercase;color:#8a8578;">Maripepa &middot; Empleo</p>
                              <h1 style="margin:8px 0 0;font-family:Georgia,'Times New Roman',serif;font-size:24px;font-weight:normal;color:#1a1a1a;">Nueva candidatura recibida</h1>
                              <p style="margin:6px 0 0;font-family:Arial,Helvetica,sans-serif;font-size:12px;color:#6b6b6b;">${esc(application.receivedAt || new Date().toLocaleString('es-ES', { timeZone: 'Europe/Madrid' }))}</p>
                            </td>
                          </tr>
                          <tr>
                            <td style="padding:20px 30px 0;">
                              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;">
                                ${row('Nombre', application.name)}
                                ${row('Email', application.email)}
                                ${row('Teléfono', application.phone)}
                                ${row('Sector', application.sector)}
                                ${row('Puesto', application.jobTitle)}
                                ${row('Currículum', application.cvName)}
                              </table>
                            </td>
                          </tr>
                          ${
                            application.message
                              ? `<tr><td style="padding:18px 30px 0;"><table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><td style="padding:12px 14px;background:#faf9f6;border-left:2px solid #d8d2c5;font-family:Arial,Helvetica,sans-serif;font-size:12.5px;line-height:1.65;color:#3d3d3d;">${esc(application.message)}</td></tr></table></td></tr>`
                              : ''
                          }
                          <tr>
                            <td style="padding:24px 30px 0;">
                              <a href="https://maripepa.es/admin" style="display:inline-block;padding:12px 22px;background:#1a1a1a;color:#ffffff;font-family:Arial,Helvetica,sans-serif;font-size:11px;letter-spacing:1.4px;text-transform:uppercase;text-decoration:none;">Abrir la consola</a>
                              <p style="margin:10px 0 0;font-family:Arial,Helvetica,sans-serif;font-size:11px;color:#8a8578;">https://maripepa.es/admin</p>
                            </td>
                          </tr>
                          <tr>
                            <td style="padding:22px 30px 0;">
                              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#faf7f1;border-left:2px solid #cf3700;">
                                <tr>
                                  <td style="padding:13px 15px;font-family:Arial,Helvetica,sans-serif;font-size:11.5px;line-height:1.65;color:#4a4a4a;">
                                    <strong style="color:#1a1a1a;">Acceso restringido.</strong> La consola solo funciona desde la red de la empresa o conectado a la VPN. Si no carga, comprueba la conexión antes de avisar.
                                  </td>
                                </tr>
                              </table>
                            </td>
                          </tr>
                          <tr>
                            <td style="padding:20px 30px 26px;">
                              <p style="margin:0;padding-top:16px;border-top:1px solid #ece8df;font-family:Arial,Helvetica,sans-serif;font-size:10.5px;line-height:1.6;color:#9a958a;">Aviso automático del sistema de empleo de Maripepa. No respondas a este correo.</p>
                            </td>
                          </tr>
                        </table>
                      </td>
                    </tr>
                  </table>
                </div>`,
        };

        const info = await transporter.sendMail(mailOptions);
        logger.info('Aviso de candidatura enviado', { to, messageId: info.messageId });
        return { success: true, messageId: info.messageId };
    } catch (error) {
        logger.error('Error enviando aviso de candidatura', { message: error.message });
        return { success: false, error: error.message };
    } finally {
        if (dedicated) dedicated.close();
    }
}

async function sendInvoiceEmail({ to, subject, text, html, pdfBuffer, filename }) {
    if (!to) {
        const error = new Error('Destinatario de email vacío');
        error.code = 'NO_EMAIL';
        throw error;
    }

    const transporter = initializeTransporter();
    const info = await transporter.sendMail({
        from: `"Mari Pepa" <${FROM_EMAIL}>`,
        to,
        subject,
        text,
        html,
        attachments: pdfBuffer
            ? [{
                filename: filename || 'factura.pdf',
                content: pdfBuffer,
                contentType: 'application/pdf'
            }]
            : []
    });

    const accepted = (info.accepted || []).map(String);
    const rejected = (info.rejected || []).map(String);

    if (!accepted.length || rejected.length > 0) {
        const error = new Error(`SMTP no aceptó el destinatario: ${rejected.join(', ') || 'sin aceptados'}`);
        error.code = 'SMTP_REJECTED';
        throw error;
    }

    logger.info('Factura enviada por email', {
        to,
        messageId: info.messageId
    });

    return {
        success: true,
        messageId: info.messageId,
        accepted,
        rejected
    };
}

/**
 * Respuesta al candidato según el estado de su candidatura.
 * Una plantilla por estado: revisión, entrevista, descartada y contratada.
 */
async function sendApplicationStatusEmail(application, status) {
    const templates = {
        new: {
            subject: 'Tu candidatura está registrada — Mari Pepa',
            title: 'Candidatura registrada',
            body: 'Hemos registrado tu candidatura. El equipo de selección la revisará y te escribirá si avanza el proceso.'
        },
        review: {
            subject: 'Tu candidatura está en revisión — Maripepa',
            title: 'Candidatura en revisión',
            body: 'Hemos recibido tu candidatura y ya la está revisando el equipo de selección. Si necesitamos algún dato adicional, nos pondremos en contacto contigo por este mismo correo.'
        },
        interview: {
            subject: `Entrevista${application.jobTitle ? ` — ${application.jobTitle}` : ''} — Maripepa`,
            title: 'Queremos conocerte',
            body: 'Tu candidatura ha pasado a la fase de entrevista. El equipo de Recursos Humanos se pondrá en contacto contigo para concretar fecha, hora y formato de la conversación.'
        },
        rejected: {
            subject: 'Resolución de tu candidatura — Maripepa',
            title: 'Candidatura revisada',
            body: 'Gracias por el tiempo que has dedicado a tu candidatura. En esta ocasión no vamos a continuar con el proceso, pero conservamos tu currículum para futuras vacantes que encajen con tu perfil.'
        },
        hired: {
            subject: 'Siguiente paso en tu candidatura — Maripepa',
            title: 'Seguimos adelante',
            body: 'Nos alegra comunicarte que queremos dar el siguiente paso contigo. El equipo de Recursos Humanos se pondrá en contacto para concretar las condiciones y la incorporación.'
        }
    };
    const template = templates[status];
    if (!template) return { success: false, skipped: true };

    const dedicated = createRrhhTransporter();
    try {
        const transporter = dedicated || initializeTransporter();
        const senderAddress = dedicated
            ? process.env.SMTP_RRHH_FROM || process.env.SMTP_RRHH_USER
            : FROM_EMAIL;
        const esc = (value) =>
            String(value || '')
                .replace(/&/g, '&amp;')
                .replace(/</g, '&lt;')
                .replace(/>/g, '&gt;')
                .replace(/"/g, '&quot;');
        const name = esc(application.name || '');
        const job = esc(application.jobTitle || '');

        const info = await transporter.sendMail({
            from: `"Mari Pepa - Empleo" <${senderAddress}>`,
            to: application.email,
            replyTo: process.env.SMTP_RRHH_REPLY_TO || 'cv.rrhh@maripepa.es',
            subject: template.subject,
            html: `
                <div style="margin:0;padding:0;background:#f2f1ee;">
                  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f2f1ee;padding:28px 12px;">
                    <tr><td align="center">
                      <table role="presentation" width="560" cellpadding="0" cellspacing="0" style="width:560px;max-width:100%;background:#ffffff;border:1px solid #e3ded3;">
                        <tr><td style="height:3px;background:#cf3700;font-size:0;line-height:0;">&nbsp;</td></tr>
                        <tr><td style="padding:26px 30px 0;">
                          <img src="cid:${EMAIL_LOGO_CID}" alt="Mari Pepa" width="180" style="display:block;width:180px;max-width:180px;height:auto;border:0;outline:none;text-decoration:none;" />
                          <p style="margin:16px 0 0;font-family:Arial,Helvetica,sans-serif;font-size:10px;letter-spacing:2.4px;text-transform:uppercase;color:#8a8578;">Maripepa &middot; Empleo</p>
                          <h1 style="margin:8px 0 0;font-family:Georgia,'Times New Roman',serif;font-size:24px;font-weight:normal;color:#1a1a1a;">${template.title}</h1>
                        </td></tr>
                        <tr><td style="padding:18px 30px 0;font-family:Arial,Helvetica,sans-serif;font-size:14px;line-height:1.7;color:#3d3d3d;">
                          <p style="margin:0 0 12px;">Hola${name ? ` ${name}` : ''},</p>
                          <p style="margin:0 0 12px;">${template.body}</p>
                          ${job ? `<p style="margin:0 0 12px;padding:12px 14px;background:#faf9f6;border-left:2px solid #cf3700;font-size:13px;">Puesto: ${job}</p>` : ''}
                          <p style="margin:0;">Si tienes cualquier duda, responde a este correo o escribe a <a href="mailto:cv.rrhh@maripepa.es" style="color:#cf3700;">cv.rrhh@maripepa.es</a>.</p>
                        </td></tr>
                        <tr><td style="padding:26px 30px;font-family:Arial,Helvetica,sans-serif;font-size:11px;color:#8a8578;">
                          Maripepa, S.L. &middot; Lorca, Murcia &middot; 968 46 75 14
                        </td></tr>
                      </table>
                    </td></tr>
                  </table>
                </div>
            `,
            attachments: [emailLogoAttachment()]
        });
        logger.info('Respuesta de candidatura enviada', {
            to: application.email,
            status,
            messageId: info && info.messageId
        });
        return { success: true, messageId: (info && info.messageId) || null };
    } catch (error) {
        logger.error('Error enviando respuesta de candidatura', {
            message: error.message,
            status
        });
        return { success: false, message: error.message };
    }
}


/**
 * Confirmación al candidato de que su candidatura ha entrado.
 * Sale desde el buzón de RRHH con el logo de la marca.
 */
async function sendApplicationReceivedEmail({ name, email, jobTitle }) {
    const esc = (value) =>
        String(value || '')
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;');
    const dedicated = createRrhhTransporter();
    try {
        const transporter = dedicated || initializeTransporter();
        const senderAddress = dedicated
            ? process.env.SMTP_RRHH_FROM || process.env.SMTP_RRHH_USER
            : FROM_EMAIL;
        const job = esc(jobTitle);
        const info = await transporter.sendMail({
            from: `"Mari Pepa - Empleo" <${senderAddress}>`,
            to: email,
            replyTo: process.env.SMTP_RRHH_REPLY_TO || 'cv.rrhh@maripepa.es',
            subject: job
                ? `Hemos recibido tu candidatura — ${job} — Mari Pepa`
                : 'Hemos recibido tu candidatura — Mari Pepa',
            html: `
                <div style="margin:0;padding:0;background:#f2f1ee;">
                  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f2f1ee;padding:28px 12px;">
                    <tr><td align="center">
                      <table role="presentation" width="560" cellpadding="0" cellspacing="0" style="width:560px;max-width:100%;background:#ffffff;border:1px solid #e3ded3;">
                        <tr><td style="height:3px;background:#cf3700;font-size:0;line-height:0;">&nbsp;</td></tr>
                        <tr><td style="padding:26px 30px 0;">
                          <img src="cid:${EMAIL_LOGO_CID}" alt="Mari Pepa" width="180" style="display:block;width:180px;max-width:180px;height:auto;border:0;outline:none;text-decoration:none;" />
                          <h1 style="margin:18px 0 0;font-family:Georgia,'Times New Roman',serif;font-size:24px;font-weight:normal;color:#1a1a1a;">Candidatura recibida</h1>
                        </td></tr>
                        <tr><td style="padding:18px 30px 0;font-family:Arial,Helvetica,sans-serif;font-size:14px;line-height:1.7;color:#3d3d3d;">
                          <p style="margin:0 0 12px;">Hola${name ? ` ${esc(name)}` : ''},</p>
                          <p style="margin:0 0 12px;">Tu candidatura ha quedado registrada. El equipo de Recursos Humanos la revisará y te escribirá a este mismo correo.</p>
                          ${job ? `<p style="margin:0 0 12px;padding:12px 14px;background:#faf9f6;border-left:2px solid #cf3700;font-size:13px;">Puesto: ${job}</p>` : ''}
                          <p style="margin:0 0 12px;">No es necesario que envíes otra candidatura mientras esta esté en curso. Si finalmente no encajas, podrás volver a aplicar a partir de 20 días naturales.</p>
                          <p style="margin:0;">Si tienes cualquier duda, responde a este correo.</p>
                        </td></tr>
                        <tr><td style="padding:26px 30px;font-family:Arial,Helvetica,sans-serif;font-size:11px;line-height:1.7;color:#8a8578;">
                          Maripepa, S.L. &middot; Avenida Francisco Jimeno Sola, 3 &middot; 30817 Lorca, Murcia<br />
                          968 46 75 14 &middot; cv.rrhh@maripepa.es
                        </td></tr>
                      </table>
                    </td></tr>
                  </table>
                </div>
            `,
            attachments: [emailLogoAttachment()]
        });
        logger.info('Confirmación de candidatura enviada', {
            to: email,
            hasJob: Boolean(jobTitle),
            messageId: info && info.messageId
        });
        return { success: true, messageId: (info && info.messageId) || null };
    } catch (error) {
        logger.error('Error enviando confirmación de candidatura', { message: error.message });
        return { success: false, message: error.message };
    }
}

/**
 * Acuse de recibo al visitante del formulario de contacto.
 * Sale desde noreply con el logo de la marca y respuestas a pedidos.
 */
async function sendContactAcknowledgment({ to, name }) {
    const esc = (value) =>
        String(value || '')
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;');
    try {
        const transport = initializeTransporter();
        const inbox = process.env.CONTACT_EMAIL || 'pedidos@mari-pepa.com';
        const info = await transport.sendMail({
            from: `"Mari Pepa" <${FROM_EMAIL}>`,
            to,
            replyTo: inbox,
            subject: 'Hemos recibido tu mensaje — Mari Pepa',
            html: `
                <div style="margin:0;padding:0;background:#f2f1ee;">
                  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f2f1ee;padding:28px 12px;">
                    <tr><td align="center">
                      <table role="presentation" width="560" cellpadding="0" cellspacing="0" style="width:560px;max-width:100%;background:#ffffff;border:1px solid #e3ded3;">
                        <tr><td style="height:3px;background:#cf3700;font-size:0;line-height:0;">&nbsp;</td></tr>
                        <tr><td style="padding:26px 30px 0;">
                          <img src="cid:${EMAIL_LOGO_CID}" alt="Mari Pepa" width="180" style="display:block;width:180px;max-width:180px;height:auto;border:0;outline:none;text-decoration:none;" />
                          <h1 style="margin:18px 0 0;font-family:Georgia,'Times New Roman',serif;font-size:24px;font-weight:normal;color:#1a1a1a;">Hemos recibido tu mensaje</h1>
                        </td></tr>
                        <tr><td style="padding:18px 30px 0;font-family:Arial,Helvetica,sans-serif;font-size:14px;line-height:1.7;color:#3d3d3d;">
                          <p style="margin:0 0 12px;">Hola${name ? ` ${esc(name)}` : ''},</p>
                          <p style="margin:0 0 12px;">Gracias por escribir a Mari Pepa. Tu mensaje ya está en manos del equipo correspondiente y te responderemos a este mismo correo lo antes posible.</p>
                          <p style="margin:0 0 12px;padding:12px 14px;background:#faf9f6;border-left:2px solid #cf3700;font-size:13px;">Si necesitas algo urgente, llámanos al <a href="tel:+34968467514" style="color:#cf3700;text-decoration:none;">968 46 75 14</a>.</p>
                          <p style="margin:0;">Puedes responder a este correo y llegará directamente a <a href="mailto:${inbox}" style="color:#cf3700;">${inbox}</a>.</p>
                        </td></tr>
                        <tr><td style="padding:26px 30px;font-family:Arial,Helvetica,sans-serif;font-size:11px;line-height:1.7;color:#8a8578;">
                          Maripepa, S.L. &middot; Avenida Francisco Jimeno Sola, 3 &middot; 30817 Lorca, Murcia<br />
                          968 46 75 14 &middot; pedidos@granjamaripepa.com
                        </td></tr>
                      </table>
                    </td></tr>
                  </table>
                </div>
            `,
            attachments: [emailLogoAttachment()]
        });
        logger.info('Acuse de contacto enviado', {
            to,
            messageId: info && info.messageId
        });
        return { success: true, messageId: (info && info.messageId) || null };
    } catch (error) {
        logger.error('Error enviando acuse de contacto', { message: error.message });
        return { success: false, message: error.message };
    }
}

async function sendInternalNotification({ to, subject, text, replyTo }) {
    const recipient = to || process.env.CHATBOT_HANDOFF_EMAIL || 'pedidos@mari-pepa.com';
    try {
        const transport = initializeTransporter();
        const info = await transport.sendMail({
            from: FROM_EMAIL,
            to: recipient,
            subject,
            text,
            ...(replyTo ? { replyTo } : {})
        });
        logger.info('Notificacion interna enviada', {
            to: recipient,
            messageId: info && info.messageId
        });
        return { success: true, messageId: (info && info.messageId) || null };
    } catch (error) {
        logger.error('Error enviando notificacion interna', {
            message: error.message
        });
        return { success: false, message: error.message };
    }
}

module.exports = {
    sendPasswordResetEmail,
    sendVerificationCodeEmail,
    sendApplicationNotification,
    sendApplicationStatusEmail,
    sendApplicationReceivedEmail,
    sendContactAcknowledgment,
    sendInvoiceEmail,
    sendInternalNotification,
    verifyConnection
};
