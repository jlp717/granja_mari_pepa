/**
 * REGENERADOR MASIVO DE HASHES PARA USUARIOS LEGACY
 * =================================================
 * Este script busca todos los usuarios en la tabla de credenciales que
 * están marcados como "Legacy" (IS_LEGACY_PASSWORD = 1) y regenera
 * su hash de contraseña usando su NIF actual.
 * 
 * Útil para corregir masivamente usuarios que pudieron haber sido
 * inicializados con contraseñas genéricas (ej: "TEST_JAVIER").
 * 
 * Uso: node scripts/fix/regenerate-legacy-hashes.js
 */

require('dotenv').config();
const odbc = require('odbc');
const bcrypt = require('bcryptjs');

async function regenerateLegacyHashes() {
    console.log('=============================================');
    console.log('🔄 REGENERACIÓN MASIVA DE HASHES (LEGACY)');
    console.log('=============================================\n');

    const connectionString = process.env.ODBC_CONNECTION_STRING || 'DSN=GMP;UID=JAVIER;PWD=JAVIER';
    let cn;

    try {
        cn = await odbc.connect(connectionString);

        // 1. Obtener usuarios legacy
        console.log('1️⃣ Buscando usuarios marcados como Legacy...');
        const usersQuery = `
      SELECT CUSTOMER_CODE 
      FROM JAVIER.CUSTOMER_CREDENTIALS 
      WHERE IS_LEGACY_PASSWORD = 1
    `;
        const users = await cn.query(usersQuery);

        if (!users || users.length === 0) {
            console.log('   ✅ No hay usuarios legacy pendientes de corrección.');
            return;
        }

        console.log(`   🔸 Encontrados ${users.length} usuarios para procesar.\n`);

        // 2. Procesar cada usuario
        console.log('2️⃣ Procesando actualizaciones...');
        let successCount = 0;
        let errorCount = 0;

        for (const user of users) {
            const codigo = user.CUSTOMER_CODE.trim();

            try {
                // Obtener NIF
                const nifQuery = `SELECT NIF FROM DSEDAC.CLI WHERE TRIM(CODIGOCLIENTE) = ?`;
                const nifResult = await cn.query(nifQuery, [codigo]);

                if (!nifResult || nifResult.length === 0 || !nifResult[0].NIF) {
                    console.warn(`   ⚠️ Usuario ${codigo}: No se encontró NIF en DSEDAC.CLI. Saltando.`);
                    errorCount++;
                    continue;
                }

                const nif = nifResult[0].NIF.trim();

                // Generar Hash
                const salt = await bcrypt.genSalt(12);
                const hash = await bcrypt.hash(nif, salt);

                // Actualizar
                const updateQuery = `
          UPDATE JAVIER.CUSTOMER_CREDENTIALS
          SET PASSWORD_HASH = ?, UPDATED_AT = CURRENT_TIMESTAMP
          WHERE TRIM(CUSTOMER_CODE) = ?
        `;
                await cn.query(updateQuery, [hash, codigo]);

                process.stdout.write('.'); // Progress indicator
                successCount++;

            } catch (err) {
                console.error(`\n   ❌ Error procesando ${codigo}: ${err.message}`);
                errorCount++;
            }
        }

        console.log('\n\n=============================================');
        console.log('✅ PROCESO FINALIZADO');
        console.log(`   - Procesados con éxito: ${successCount}`);
        console.log(`   - Errores / Saltados: ${errorCount}`);
        console.log('=============================================');

    } catch (error) {
        console.error('❌ Error general:', error);
    } finally {
        if (cn) await cn.close();
    }
}

regenerateLegacyHashes();
