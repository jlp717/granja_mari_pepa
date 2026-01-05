/**
 * DIAGNÓSTICO FINAL: TABLA IVA Y UBICACIÓN EMAIL
 * ==============================================
 */

require('dotenv').config();

async function diagnosticoFinal() {
    let pool;

    try {
        console.log('\n╔══════════════════════════════════════════════════════════════════╗');
        console.log('║  DIAGNÓSTICO LIMPIO: IVA Y EMAIL                                ║');
        console.log('╚══════════════════════════════════════════════════════════════════╝\n');

        pool = require('../../app/config/odbcConfig');
        await pool.initialize();

        // 1. ANALIZAR TABLA IVA (Determinar origen del 7%)
        console.log('--- 1. CONTENIDO TABLA DSEDAC.IVA ---');
        const ivaData = await pool.query('SELECT * FROM DSEDAC.IVA ORDER BY IVA');
        console.table(ivaData);

        // 2. BUSCAR EMAIL EN TODO EL ESQUEMA (Usando el valor conocido)
        const emailTarget = 'sundayespecial88@gmail.com';
        console.log(`\n--- 2. BUSCANDO "${emailTarget}" EN TABLAS DE CLIENTES ---`);

        // Obtener todas las tablas de DSEDAC
        const tables = await pool.query(`
        SELECT TABLE_NAME 
        FROM QSYS2.SYSTABLES 
        WHERE TABLE_SCHEMA = 'DSEDAC' 
          AND TABLE_TYPE = 'T'
          AND (TABLE_NAME LIKE 'CLI%' OR TABLE_NAME LIKE '%MAIL%' OR TABLE_NAME LIKE 'DIR%')
    `);

        for (const t of tables) {
            const tableName = t.TABLE_NAME;
            // Obtener columnas de texto
            const columns = await pool.query(`
            SELECT COLUMN_NAME 
            FROM QSYS2.SYSCOLUMNS 
            WHERE TABLE_SCHEMA = 'DSEDAC' 
              AND TABLE_NAME = '${tableName}'
              AND DATA_TYPE IN ('CHAR', 'VARCHAR')
              AND LENGTH >= 10
        `);

            if (columns.length === 0) continue;

            // Construir query de búsqueda
            const whereClause = columns.map(c => `UPPER(${c.COLUMN_NAME}) LIKE '%SUNDAYESPECIAL88%'`).join(' OR ');
            const query = `SELECT * FROM DSEDAC.${tableName} WHERE ${whereClause}`;

            try {
                const found = await pool.query(query);
                if (found.length > 0) {
                    console.log(`✅ ¡ENCONTRADO EN TABLA ${tableName}!`);
                    console.log(found[0]);
                }
            } catch (e) {
                // Ignorar errores de acceso
            }
        }

        console.log('\n✓ Diagnóstico completado\n');

    } catch (error) {
        console.error(error);
    } finally {
        if (pool) await pool.close();
    }
}

diagnosticoFinal();
