/**
 * BACKUP COMPLETO DEL ESQUEMA JAVIER (Versión Robusta con Paginación)
 * ===================================================================
 * - Exporta Vistas (DDL)
 * - Exporta Tablas (Datos) con paginación para evitar bloqueos
 * - Limite de seguridad: 100,000 registros por tabla (configurable)
 */
const db = require('./app/config/odbcConfig');
const fs = require('fs');
const path = require('path');

const BATCH_SIZE = 1000;
const MAX_ROWS = 500000; // Límite de seguridad

async function fullBackup() {
    try {
        await db.initialize();

        const timestamp = new Date().toISOString().replace(/[:.]/g, '-').replace('T', '_').slice(0, 19);
        const baseDir = path.join(__dirname, 'backups');
        if (!fs.existsSync(baseDir)) fs.mkdirSync(baseDir);

        const backupDir = path.join(baseDir, `JAVIER_FULL_V2_${timestamp}`);
        if (!fs.existsSync(backupDir)) fs.mkdirSync(backupDir);

        console.log(`📂 Iniciando backup V2 en: ${backupDir}\n`);

        // 1. BACKUP DE VISTAS
        console.log("=== EXPORTANDO VISTAS ===");
        const views = await db.query(`SELECT TABLE_NAME, VIEW_DEFINITION FROM QSYS2.SYSVIEWS WHERE TABLE_SCHEMA = 'JAVIER'`);

        for (const v of views) {
            fs.writeFileSync(path.join(backupDir, `VIEW_${v.TABLE_NAME}.sql`),
                `-- VISTA: JAVIER.${v.TABLE_NAME}\n${v.VIEW_DEFINITION};\n`);
            console.log(`  👁️  ${v.TABLE_NAME}`);
        }

        // 2. BACKUP DE TABLAS
        console.log("\n=== EXPORTANDO TABLAS ===");
        const tables = await db.query(`SELECT TABLE_NAME FROM QSYS2.SYSTABLES WHERE TABLE_SCHEMA = 'JAVIER' AND TABLE_TYPE IN ('T', 'P')`);

        for (const t of tables) {
            const tableName = t.TABLE_NAME;
            process.stdout.write(`  📦 ${tableName}: `);

            try {
                // Contar filas
                const countRes = await db.query(`SELECT COUNT(*) AS CNT FROM JAVIER.${tableName}`);
                const totalRows = Number(countRes[0].CNT);

                if (totalRows === 0) {
                    console.log("Vacía");
                    continue;
                }

                console.log(`${totalRows} filas.`);

                const fileName = path.join(backupDir, `TABLE_${tableName}_DATA.sql`);
                let fd = fs.openSync(fileName, 'w');
                fs.writeSync(fd, `-- DATOS TABLA: JAVIER.${tableName}\n-- TOTAL: ${totalRows}\n\n`);

                let processed = 0;
                while (processed < totalRows && processed < MAX_ROWS) {
                    // Paginación DB2
                    const limit = Math.min(BATCH_SIZE, totalRows - processed);
                    const rows = await db.query(`
                        SELECT * FROM JAVIER.${tableName} 
                        ORDER BY 1 
                        OFFSET ${processed} ROWS
                        FETCH NEXT ${limit} ROWS ONLY
                    `); // ASUME que la tabla tiene clave primaria o orden estable, si no, ORDER BY 1 es mejor que nada

                    if (rows.length === 0) break;

                    const cols = Object.keys(rows[0]);
                    const colList = cols.join(', ');

                    let batchSQL = '';
                    rows.forEach(row => {
                        const values = cols.map(c => {
                            const val = row[c];
                            if (val === null) return 'NULL';
                            if (typeof val === 'number') return val;
                            return `'${String(val).replace(/'/g, "''").replace(/\r\n/g, '\\n')}'`;
                        }).join(', ');
                        batchSQL += `INSERT INTO JAVIER.${tableName} (${colList}) VALUES (${values});\n`;
                    });

                    fs.writeSync(fd, batchSQL);
                    processed += rows.length;
                    process.stdout.write(`\r     ... Exportando ${processed}/${totalRows}`);
                }

                fs.closeSync(fd);
                console.log(" ✅ Completado.");

            } catch (e) {
                console.log(` ❌ Error: ${e.message}`);
                fs.appendFileSync(path.join(backupDir, `ERRORS.txt`), `${tableName}: ${e.message}\n`);
            }
        }

        console.log(`\n✅ BACKUP V2 FINALIZADO.`);

    } catch (error) {
        console.error("Error fatal:", error);
    } finally {
        await db.closePool();
    }
}

fullBackup();
