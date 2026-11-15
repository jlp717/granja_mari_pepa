import io

PATH = "/var/www/mari-pepa/backend/app/services/emailService.js"

OLD = """    } catch (error) {
        logger.error('Error enviando notificacion interna', {
            message: error.message
        });
        return { success: false, message: error.message };
    }
}"""

NEW = """    } catch (error) {
        logger.error('Error enviando notificacion interna', {
            message: error.message
        });
        // Respaldo: la cuenta RRHH verifica correctamente y evita perder avisos.
        if (process.env.SMTP_RRHH_HOST && process.env.SMTP_RRHH_USER && process.env.SMTP_RRHH_PASSWORD) {
            try {
                const fallback = nodemailer.createTransport({
                    host: process.env.SMTP_RRHH_HOST,
                    port: Number(process.env.SMTP_RRHH_PORT || 465),
                    secure: String(process.env.SMTP_RRHH_SECURE || 'true') === 'true',
                    auth: {
                        user: process.env.SMTP_RRHH_USER,
                        pass: process.env.SMTP_RRHH_PASSWORD
                    }
                });
                const info = await fallback.sendMail({
                    from: process.env.SMTP_RRHH_FROM || FROM_EMAIL,
                    to: recipient,
                    subject,
                    text,
                    ...(replyTo ? { replyTo } : {})
                });
                fallback.close();
                logger.info('Notificacion interna enviada por cuenta RRHH', {
                    to: recipient,
                    messageId: info && info.messageId
                });
                return { success: true, messageId: (info && info.messageId) || null };
            } catch (fallbackError) {
                logger.error('Fallo el envio de respaldo RRHH', {
                    message: fallbackError.message
                });
            }
        }
        return { success: false, message: error.message };
    }
}"""

with io.open(PATH, "r", encoding="utf-8") as handle:
    source = handle.read()

if "Notificacion interna enviada por cuenta RRHH" in source:
    print("already patched")
elif OLD not in source:
    print("anchor not found")
else:
    with io.open(PATH, "w", encoding="utf-8", newline="") as handle:
        handle.write(source.replace(OLD, NEW, 1))
    print("patched")
