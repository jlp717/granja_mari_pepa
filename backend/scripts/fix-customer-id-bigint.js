/**
 * Script para cambiar CUSTOMER_ID de INTEGER a BIGINT en todas las tablas
 * Soluciona el error "Valor numérico fuera de rango" cuando CUSTOMER_ID > 2,147,483,647
 */

const databaseService = require('../app/services/databaseService');

const tables = [
    'CUSTOMER_PASSWORDS',
    'CUSTOMER_EMAILS',
    'PASSWORD_RESET_TOKENS',
    'VERIFICATION_CODES',
    'REFRESH_TOKENS',
    'LOGIN_ATTEMPTS',
    'SECURITY_AUDIT'
];

async function fixCustomerIdBigint() {
    console.log('='.repeat(80));
    console.log('FIX: Cambiar CUSTOMER_ID de INTEGER a BIGINT');
    console.log('='.repeat(80));

    try {
        // 1. Verificar estado actual
        console.log('\n📋 Estado actual de las columnas CUSTOMER_ID:');
        console.log('-'.repeat(80));

        const checkQuery = `
            SELECT
                TABLE_NAME,
                COLUMN_NAME,
                DATA_TYPE,
                NUMERIC_PRECISION
            FROM QSYS2.SYSCOLUMNS
            WHERE TABLE_SCHEMA = 'JAVIER'
                AND COLUMN_NAME = 'CUSTOMER_ID'
            ORDER BY TABLE_NAME
        `;

        const currentState = await databaseService.executeQuery(checkQuery);

        currentState.forEach(col => {
            const status = col.DATA_TYPE === 'BIGINT' ? '✅' : '⚠️ ';
            console.log(`${status} ${col.TABLE_NAME.padEnd(30)} | Tipo: ${col.DATA_TYPE}`);
        });

        // 2. Aplicar cambios
        console.log('\n🔧 Aplicando cambios...');
        console.log('-'.repeat(80));

        for (const table of tables) {
            try {
                console.log(`\n   Modificando ${table}...`);

                const alterQuery = `
                    ALTER TABLE JAVIER.${table}
                        ALTER COLUMN CUSTOMER_ID SET DATA TYPE BIGINT
                `;

                await databaseService.executeQuery(alterQuery);
                console.log(`   ✅ ${table} actualizado correctamente`);

            } catch (error) {
                if (error.message && error.message.includes('ya está definida')) {
                    console.log(`   ℹ️  ${table} ya tiene CUSTOMER_ID como BIGINT`);
                } else {
                    console.error(`   ❌ Error en ${table}:`, error.message);
                }
            }
        }

        // 3. Verificar cambios
        console.log('\n📊 Estado final de las columnas CUSTOMER_ID:');
        console.log('-'.repeat(80));

        const finalState = await databaseService.executeQuery(checkQuery);

        let allFixed = true;
        finalState.forEach(col => {
            const status = col.DATA_TYPE === 'BIGINT' ? '✅' : '❌';
            console.log(`${status} ${col.TABLE_NAME.padEnd(30)} | Tipo: ${col.DATA_TYPE}`);

            if (col.DATA_TYPE !== 'BIGINT') {
                allFixed = false;
            }
        });

        console.log('\n' + '='.repeat(80));
        if (allFixed) {
            console.log('✅ ÉXITO: Todas las columnas CUSTOMER_ID son ahora BIGINT');
        } else {
            console.log('⚠️  ADVERTENCIA: Algunas columnas no se pudieron actualizar');
        }
        console.log('='.repeat(80));

    } catch (error) {
        console.error('\n❌ Error aplicando fix:', error);
    } finally {
        process.exit(0);
    }
}

fixCustomerIdBigint();
