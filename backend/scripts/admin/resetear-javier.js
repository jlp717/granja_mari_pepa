/**
 * RESETEAR TABLAS JAVIER A ESTADO LIMPIO
 * =======================================
 * Este script deja todas las tablas como si ningún cliente hubiera
 * configurado nada (sin emails, sin teléfonos, sin cambios de contraseña)
 * 
 * IMPORTANTE: Ejecutar solo cuando se quiera resetear todo para producción
 * 
 * USO: node scripts/admin/resetear-javier.js
 */

const odbc = require('odbc');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });

// Configuración de lo que se va a resetear
const CONFIG = {
    // Si true, solo muestra qué haría sin ejecutar cambios
    DRY_RUN: false,

    // Resetear emails y teléfonos en CUSTOMER_CREDENTIALS
    RESET_CONTACT_INFO: true,

    // Resetear flags de contraseña (IS_LEGACY_PASSWORD = 1, etc.)
    RESET_PASSWORD_FLAGS: true,

    // Resetear contador de dismissals del modal
    RESET_MODAL_DISMISSALS: true,

    // Eliminar historial de contraseñas
    DELETE_PASSWORD_HISTORY: true,

    // Eliminar intentos de login
    DELETE_LOGIN_ATTEMPTS: true,

    // Eliminar auditoría de seguridad
    DELETE_SECURITY_AUDIT: true,

    // Eliminar tokens de refresco (cierra todas las sesiones)
    DELETE_REFRESH_TOKENS: true,

    // Eliminar tokens de reseteo de contraseña
    DELETE_PASSWORD_RESET_TOKENS: true,

    // Eliminar emails guardados aparte
    DELETE_CUSTOMER_EMAILS: true
};

async function main() {
    console.log('╔══════════════════════════════════════════════════════════════════╗');
    console.log('║       RESETEAR TABLAS JAVIER A ESTADO LIMPIO                      ║');
    console.log('╚══════════════════════════════════════════════════════════════════╝\n');

    if (CONFIG.DRY_RUN) {
        console.log('⚠️  MODO DRY_RUN: No se ejecutarán cambios reales\n');
    } else {
        console.log('🔴 MODO REAL: Los cambios SE EJECUTARÁN\n');
    }

    const connectionString = process.env.ODBC_CONNECTION_STRING;
    let connection = await odbc.connect(connectionString);

    let totalChanges = 0;

    // 1. Resetear CUSTOMER_CREDENTIALS
    if (CONFIG.RESET_CONTACT_INFO || CONFIG.RESET_PASSWORD_FLAGS || CONFIG.RESET_MODAL_DISMISSALS) {
        console.log('1️⃣ RESETEAR CUSTOMER_CREDENTIALS:');
        console.log('─'.repeat(50));

        const updateQuery = `
            UPDATE JAVIER.CUSTOMER_CREDENTIALS
            SET 
                ${CONFIG.RESET_CONTACT_INFO ? `EMAIL = NULL, PHONE = NULL, EMAIL_VERIFIED = '0', PHONE_VERIFIED = '0',` : ''}
                ${CONFIG.RESET_PASSWORD_FLAGS ? `IS_LEGACY_PASSWORD = '1', LAST_PASSWORD_CHANGE = NULL, PASSWORD_CHANGE_COUNT = 0, PASSWORD_LAST_CHANGED = NULL, FAILED_LOGIN_ATTEMPTS = 0, LAST_FAILED_LOGIN = NULL,` : ''}
                ${CONFIG.RESET_MODAL_DISMISSALS ? `PASSWORD_WARNING_DISMISSALS = 0,` : ''}
                LAST_LOGIN_AT = NULL,
                LAST_LOGIN_IP = NULL,
                LAST_LOGIN_USER_AGENT = NULL,
                UPDATED_AT = CURRENT_TIMESTAMP
        `.replace(/,\s*$/, ''); // Quitar última coma

        if (CONFIG.DRY_RUN) {
            console.log('   [DRY RUN] Ejecutaría UPDATE para todos los clientes');
        } else {
            try {
                await connection.query(updateQuery);
                console.log('   ✅ CUSTOMER_CREDENTIALS reseteado');
                totalChanges++;
            } catch (e) {
                console.log(`   ❌ Error: ${e.message}`);
            }
        }
    }

    // 2. DELETE CUSTOMER_EMAILS
    if (CONFIG.DELETE_CUSTOMER_EMAILS) {
        console.log('\n2️⃣ ELIMINAR CUSTOMER_EMAILS:');
        console.log('─'.repeat(50));

        if (CONFIG.DRY_RUN) {
            const count = await connection.query('SELECT COUNT(*) AS TOTAL FROM JAVIER.CUSTOMER_EMAILS');
            console.log(`   [DRY RUN] Eliminaría ${count[0].TOTAL} registros`);
        } else {
            try {
                await connection.query('DELETE FROM JAVIER.CUSTOMER_EMAILS');
                console.log('   ✅ CUSTOMER_EMAILS eliminados');
                totalChanges++;
            } catch (e) {
                console.log(`   ❌ Error: ${e.message}`);
            }
        }
    }

    // 3. DELETE CUSTOMER_PASSWORDS
    if (CONFIG.DELETE_PASSWORD_HISTORY) {
        console.log('\n3️⃣ ELIMINAR CUSTOMER_PASSWORDS (historial):');
        console.log('─'.repeat(50));

        if (CONFIG.DRY_RUN) {
            const count = await connection.query('SELECT COUNT(*) AS TOTAL FROM JAVIER.CUSTOMER_PASSWORDS');
            console.log(`   [DRY RUN] Eliminaría ${count[0].TOTAL} registros`);
        } else {
            try {
                await connection.query('DELETE FROM JAVIER.CUSTOMER_PASSWORDS');
                console.log('   ✅ CUSTOMER_PASSWORDS eliminados');
                totalChanges++;
            } catch (e) {
                console.log(`   ❌ Error: ${e.message}`);
            }
        }
    }

    // 4. DELETE LOGIN_ATTEMPTS
    if (CONFIG.DELETE_LOGIN_ATTEMPTS) {
        console.log('\n4️⃣ ELIMINAR LOGIN_ATTEMPTS:');
        console.log('─'.repeat(50));

        if (CONFIG.DRY_RUN) {
            const count = await connection.query('SELECT COUNT(*) AS TOTAL FROM JAVIER.LOGIN_ATTEMPTS');
            console.log(`   [DRY RUN] Eliminaría ${count[0].TOTAL} registros`);
        } else {
            try {
                await connection.query('DELETE FROM JAVIER.LOGIN_ATTEMPTS');
                console.log('   ✅ LOGIN_ATTEMPTS eliminados');
                totalChanges++;
            } catch (e) {
                console.log(`   ❌ Error: ${e.message}`);
            }
        }
    }

    // 5. DELETE SECURITY_AUDIT
    if (CONFIG.DELETE_SECURITY_AUDIT) {
        console.log('\n5️⃣ ELIMINAR SECURITY_AUDIT:');
        console.log('─'.repeat(50));

        if (CONFIG.DRY_RUN) {
            const count = await connection.query('SELECT COUNT(*) AS TOTAL FROM JAVIER.SECURITY_AUDIT');
            console.log(`   [DRY RUN] Eliminaría ${count[0].TOTAL} registros`);
        } else {
            try {
                await connection.query('DELETE FROM JAVIER.SECURITY_AUDIT');
                console.log('   ✅ SECURITY_AUDIT eliminados');
                totalChanges++;
            } catch (e) {
                console.log(`   ❌ Error: ${e.message}`);
            }
        }
    }

    // 6. DELETE REFRESH_TOKENS
    if (CONFIG.DELETE_REFRESH_TOKENS) {
        console.log('\n6️⃣ ELIMINAR REFRESH_TOKENS (cierra todas las sesiones):');
        console.log('─'.repeat(50));

        if (CONFIG.DRY_RUN) {
            const count = await connection.query('SELECT COUNT(*) AS TOTAL FROM JAVIER.REFRESH_TOKENS');
            console.log(`   [DRY RUN] Eliminaría ${count[0].TOTAL} registros`);
        } else {
            try {
                await connection.query('DELETE FROM JAVIER.REFRESH_TOKENS');
                console.log('   ✅ REFRESH_TOKENS eliminados');
                totalChanges++;
            } catch (e) {
                console.log(`   ❌ Error: ${e.message}`);
            }
        }
    }

    // 7. DELETE PASSWORD_RESET_TOKENS
    if (CONFIG.DELETE_PASSWORD_RESET_TOKENS) {
        console.log('\n7️⃣ ELIMINAR PASSWORD_RESET_TOKENS:');
        console.log('─'.repeat(50));

        if (CONFIG.DRY_RUN) {
            const count = await connection.query('SELECT COUNT(*) AS TOTAL FROM JAVIER.PASSWORD_RESET_TOKENS');
            console.log(`   [DRY RUN] Eliminaría ${count[0].TOTAL} registros`);
        } else {
            try {
                await connection.query('DELETE FROM JAVIER.PASSWORD_RESET_TOKENS');
                console.log('   ✅ PASSWORD_RESET_TOKENS eliminados');
                totalChanges++;
            } catch (e) {
                console.log(`   ❌ Error: ${e.message}`);
            }
        }
    }

    console.log('\n═══════════════════════════════════════════════════════════════');
    if (CONFIG.DRY_RUN) {
        console.log('📊 RESUMEN: Modo DRY_RUN - No se ejecutaron cambios');
        console.log('   Para ejecutar cambios reales, edita DRY_RUN = false');
    } else {
        console.log(`📊 RESUMEN: ${totalChanges} operaciones completadas`);
        console.log('');
        console.log('   ✅ Todos los clientes ahora:');
        console.log('      - Sin email ni teléfono configurado');
        console.log('      - Con contraseña = NIF (legacy)');
        console.log('      - Sin modal de cambio descartado (lo verán las primeras 3 veces)');
        console.log('      - Sin historial de cambios de contraseña');
        console.log('      - Sesiones cerradas (necesitan volver a loguearse)');
    }
    console.log('═══════════════════════════════════════════════════════════════');

    await connection.close();
    console.log('\n✅ Proceso completado');
}

main().catch(e => console.error('Error:', e));
