/**
 * BACKUP COMPLETO DEL ESQUEMA JAVIER
 * ==================================
 * Genera una carpeta con:
 * 1. Definiciones de VISTAS (.sql)
 * 2. Datos de TABLAS (INSERT INTO ... .sql)
 */
const db = require('./app/config/odbcConfig');
const fs = require('fs');
const path = require('path');

async function fullBackup() {
    try {
        await db.initialize();

        // Crear carpeta de backup con timestamp
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-').replace('T', '_').slice(0, 19);
        const baseDir = path.join(__dirname, 'backups');
        if (!fs.existsSync(baseDir)) fs.mkdirSync(baseDir);

        const backupDir = path.join(baseDir, `JAVIER_FULL_${timestamp}`);
        if (!fs.existsSync(backupDir)) fs.mkdirSync(backupDir);

        console.log(`📂 Iniciando backup en: ${backupDir}\n`);

        // 1. BACKUP DE VISTAS (DDL)
        console.log("=== EXPORTANDO VISTAS ===");
        const views = await db.query(`
            SELECT TABLE_NAME, VIEW_DEFINITION 
            FROM QSYS2.SYSVIEWS 
            WHERE TABLE_SCHEMA = 'JAVIER'
        `);

        if (views.length === 0) console.log("(No hay vistas)");

        for (const v of views) {
            const fileName = path.join(backupDir, `VIEW_${v.TABLE_NAME}.sql`);
            let content = `-- VISTA: JAVIER.${v.TABLE_NAME}\n`;
            content += `-- FECHA: ${new Date().toISOString()}\n\n`;
            content += `${v.VIEW_DEFINITION};\n`;

            fs.writeFileSync(fileName, content);
            console.log(`  👁️  Guardada: ${v.TABLE_NAME}`);
        }

        // 2. BACKUP DE TABLAS (DATOS)
        console.log("\n=== EXPORTANDO TABLAS (DATOS) ===");
        const tables = await db.query(`
            SELECT TABLE_NAME 
            FROM QSYS2.SYSTABLES 
            WHERE TABLE_SCHEMA = 'JAVIER' AND TABLE_TYPE IN ('T', 'P')
        `);

        for (const t of tables) {
            const tableName = t.TABLE_NAME;
            process.stdout.write(`  📦 Procesando ${tableName}... `);

            try {
                // Obtener datos
                const rows = await db.query(`SELECT * FROM JAVIER.${tableName}`);

                if (rows.length === 0) {
                    console.log(" (Vacía)");
                    continue;
                }

                const fileName = path.join(backupDir, `TABLE_${tableName}_DATA.sql`);
                let content = `-- DATOS TABLA: JAVIER.${tableName}\n`;
                content += `-- REGISTROS: ${rows.length}\n`;
                content += `-- FECHA: ${new Date().toISOString()}\n\n`;

                // Generar INSERTs
                // Detectar columnas del primer registro
                const cols = Object.keys(rows[0]);
                const colList = cols.join(', ');

                // Generar bloques de inserts (batch de 100 para no saturar)
                rows.forEach(row => {
                    const values = cols.map(c => {
                        const val = row[c];
                        if (val === null) return 'NULL';
                        if (typeof val === 'number') return val;
                        // Escapar comillas simples
                        return `'${String(val).replace(/'/g, "''").replace(/\r\n/g, '\\n')}'`;
                    }).join(', ');

                    content += `INSERT INTO JAVIER.${tableName} (${colList}) VALUES (${values});\n`;
                });

                fs.writeFileSync(fileName, content);
                console.log(`✅ ${rows.length} regs.`);

            } catch (e) {
                console.log(`❌ Error: ${e.message}`);
                // Guardar log de error
                fs.writeFileSync(path.join(backupDir, `ERROR_${tableName}.txt`), e.message);
            }
        }

        console.log(`\n✅ BACKUP COMPLETO FINALIZADO.`);
        console.log(`   Ubicación: ${backupDir}`);

    } catch (error) {
        console.error("Error fatal:", error);
    } finally {
        await db.closePool();
    }
}

fullBackup();
