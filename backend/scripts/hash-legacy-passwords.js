/**
 * SCRIPT DE POST-MIGRACIÓN: Hashear contraseñas legacy con Argon2id
 *
 * Este script debe ejecutarse DESPUÉS de la migración SQL.
 * Lee los NIFs desde DSEDAC.CLI y actualiza los hashes en CUSTOMER_CREDENTIALS
 * con hashes Argon2id reales siguiendo NIST SP 800-63B.
 */

const argon2 = require('argon2');
const ibmdb = require('ibm_db');
const dotenv = require('dotenv');

dotenv.config();

// Configuración Argon2id según NIST SP 800-63B
const ARGON2_CONFIG = {
    type: argon2.argon2id,
    memoryCost: 65536,      // 64 MB (recomendado para servidores)
    timeCost: 3,            // 3 iteraciones
    parallelism: 4,         // 4 threads paralelos
    hashLength: 64          // 64 bytes de hash
};

// Conexión a IBM i
const connStr = `DATABASE=${process.env.IBM_I_DATABASE};` +
                `HOSTNAME=${process.env.IBM_I_HOST};` +
                `PORT=${process.env.IBM_I_PORT};` +
                `PROTOCOL=TCPIP;` +
                `UID=${process.env.IBM_I_USER};` +
                `PWD=${process.env.IBM_I_PASSWORD};`;

let totalProcessed = 0;
let totalSuccess = 0;
let totalErrors = 0;

async function hashPassword(password) {
    try {
        return await argon2.hash(password, ARGON2_CONFIG);
    } catch (error) {
        console.error('Error hashing password:', error);
        throw error;
    }
}

async function processLegacyCustomers(conn) {
    console.log('\n🔄 Iniciando procesamiento de contraseñas legacy...\n');

    // Obtener todos los clientes legacy que necesitan actualización
    const queryLegacy = `
        SELECT
            cc.CUSTOMER_ID,
            cc.CUSTOMER_CODE,
            cc.FULL_NAME,
            cli.NIF
        FROM JAVIER.CUSTOMER_CREDENTIALS cc
        INNER JOIN DSEDAC.CLI cli ON TRIM(cli.CLI) = cc.CUSTOMER_CODE
        WHERE cc.PASSWORD_ALGORITHM = 'LEGACY'
            AND cc.PASSWORD_HASH LIKE 'LEGACY_%'
        ORDER BY cc.CUSTOMER_ID
    `;

    return new Promise((resolve, reject) => {
        conn.query(queryLegacy, async (err, customers) => {
            if (err) {
                console.error('❌ Error al obtener clientes legacy:', err);
                return reject(err);
            }

            console.log(`📊 Total de clientes a procesar: ${customers.length}\n`);

            // Procesar en lotes de 50 para no saturar
            const batchSize = 50;
            for (let i = 0; i < customers.length; i += batchSize) {
                const batch = customers.slice(i, i + batchSize);
                await processBatch(conn, batch, i);
            }

            console.log('\n✅ Procesamiento completado!');
            console.log(`   Total procesados: ${totalProcessed}`);
            console.log(`   Exitosos: ${totalSuccess}`);
            console.log(`   Errores: ${totalErrors}`);

            resolve({
                total: totalProcessed,
                success: totalSuccess,
                errors: totalErrors
            });
        });
    });
}

async function processBatch(conn, customers, startIndex) {
    console.log(`\n🔧 Procesando lote ${Math.floor(startIndex / 50) + 1}...`);

    for (const customer of customers) {
        totalProcessed++;

        try {
            // Hashear el NIF con Argon2id
            const nif = customer.NIF.trim();
            const hashedPassword = await hashPassword(nif);
            const hashedNIF = await hashPassword(nif); // Para NIF_HASH también

            // Actualizar en base de datos
            const updateQuery = `
                UPDATE JAVIER.CUSTOMER_CREDENTIALS
                SET PASSWORD_HASH = ?,
                    PASSWORD_ALGORITHM = 'ARGON2ID',
                    NIF_HASH = ?,
                    UPDATED_AT = CURRENT_TIMESTAMP
                WHERE CUSTOMER_ID = ?
            `;

            await new Promise((resolve, reject) => {
                conn.query(updateQuery, [hashedPassword, hashedNIF, customer.CUSTOMER_ID], (err) => {
                    if (err) {
                        console.error(`   ❌ Error actualizando cliente ${customer.CUSTOMER_CODE}:`, err.message);
                        totalErrors++;
                        reject(err);
                    } else {
                        totalSuccess++;
                        if (totalSuccess % 10 === 0) {
                            console.log(`   ✓ Procesados: ${totalSuccess}/${totalProcessed}`);
                        }
                        resolve();
                    }
                });
            });

            // Insertar en historial de contraseñas
            const historyQuery = `
                INSERT INTO JAVIER.CUSTOMER_PASSWORDS (
                    CUSTOMER_ID,
                    PASSWORD_HASH,
                    PASSWORD_ALGORITHM,
                    STRENGTH_SCORE,
                    CRACK_TIME_DISPLAY,
                    CHANGE_REASON
                ) VALUES (?, ?, 'ARGON2ID', 0, 'Contraseña legacy (NIF)', 'MIGRATION')
            `;

            await new Promise((resolve, reject) => {
                conn.query(historyQuery, [customer.CUSTOMER_ID, hashedPassword], (err) => {
                    if (err) {
                        console.warn(`   ⚠️  No se pudo insertar en historial para ${customer.CUSTOMER_CODE}`);
                    }
                    resolve();
                });
            });

        } catch (error) {
            console.error(`   ❌ Error procesando cliente ${customer.CUSTOMER_CODE}:`, error.message);
            totalErrors++;
        }

        // Pequeña pausa para no saturar el sistema
        if (totalProcessed % 100 === 0) {
            await new Promise(resolve => setTimeout(resolve, 100));
        }
    }
}

async function auditMigration(conn, stats) {
    console.log('\n📝 Registrando auditoría de migración...');

    const auditQuery = `
        INSERT INTO JAVIER.SECURITY_AUDIT (
            EVENT_TYPE,
            EVENT_CATEGORY,
            SEVERITY,
            EVENT_DESCRIPTION,
            EVENT_DATA,
            RESULT
        ) VALUES (
            'LEGACY_PASSWORD_HASH_UPDATE',
            'SECURITY',
            'INFO',
            'Actualización masiva de hashes legacy a Argon2id',
            ?,
            'SUCCESS'
        )
    `;

    const eventData = JSON.stringify({
        total_processed: stats.total,
        successful: stats.success,
        errors: stats.errors,
        timestamp: new Date().toISOString()
    });

    return new Promise((resolve, reject) => {
        conn.query(auditQuery, [eventData], (err) => {
            if (err) {
                console.error('❌ Error registrando auditoría:', err);
                return reject(err);
            }
            console.log('✅ Auditoría registrada correctamente');
            resolve();
        });
    });
}

async function verifyMigration(conn) {
    console.log('\n🔍 Verificando migración...\n');

    const verifyQuery = `
        SELECT
            COUNT(*) AS TOTAL,
            SUM(CASE WHEN PASSWORD_ALGORITHM = 'ARGON2ID' THEN 1 ELSE 0 END) AS ARGON2_COUNT,
            SUM(CASE WHEN PASSWORD_ALGORITHM = 'LEGACY' THEN 1 ELSE 0 END) AS LEGACY_COUNT
        FROM JAVIER.CUSTOMER_CREDENTIALS
        WHERE IS_LEGACY_PASSWORD = '1'
    `;

    return new Promise((resolve, reject) => {
        conn.query(verifyQuery, (err, results) => {
            if (err) {
                console.error('❌ Error en verificación:', err);
                return reject(err);
            }

            const stats = results[0];
            console.log('📊 Resultados de verificación:');
            console.log(`   Total de clientes legacy: ${stats.TOTAL}`);
            console.log(`   Con Argon2id: ${stats.ARGON2_COUNT} ✅`);
            console.log(`   Aún en legacy: ${stats.LEGACY_COUNT} ${stats.LEGACY_COUNT > 0 ? '⚠️' : '✅'}`);

            if (stats.LEGACY_COUNT === 0) {
                console.log('\n🎉 ¡Migración 100% completa! Todos los hashes están en Argon2id.');
            }

            resolve(stats);
        });
    });
}

// Función principal
async function main() {
    console.log('\n═══════════════════════════════════════════════════════════');
    console.log('  MIGRACIÓN DE HASHES LEGACY A ARGON2ID');
    console.log('  IBM i Database: ' + process.env.IBM_I_DATABASE);
    console.log('═══════════════════════════════════════════════════════════\n');

    let conn;

    try {
        // Conectar a IBM i
        console.log('🔌 Conectando a IBM i...');
        conn = await new Promise((resolve, reject) => {
            ibmdb.open(connStr, (err, connection) => {
                if (err) {
                    console.error('❌ Error de conexión:', err);
                    return reject(err);
                }
                console.log('✅ Conexión establecida\n');
                resolve(connection);
            });
        });

        // Procesar clientes
        const stats = await processLegacyCustomers(conn);

        // Auditar
        await auditMigration(conn, stats);

        // Verificar
        await verifyMigration(conn);

        console.log('\n✅ Proceso completado exitosamente');
        process.exit(0);

    } catch (error) {
        console.error('\n❌ Error fatal:', error);
        process.exit(1);
    } finally {
        if (conn) {
            conn.close((err) => {
                if (err) console.error('Error cerrando conexión:', err);
            });
        }
    }
}

// Validar variables de entorno antes de ejecutar
const requiredEnvVars = [
    'IBM_I_DATABASE',
    'IBM_I_HOST',
    'IBM_I_PORT',
    'IBM_I_USER',
    'IBM_I_PASSWORD'
];

const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);

if (missingVars.length > 0) {
    console.error('❌ Variables de entorno faltantes:');
    missingVars.forEach(varName => console.error(`   - ${varName}`));
    console.error('\nConfigura estas variables en tu archivo .env');
    process.exit(1);
}

// Ejecutar
main();
