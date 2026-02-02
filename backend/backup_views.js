/**
 * Script para BACKUP DE DEFINICIONES DE VISTAS
 * Extrae el DDL de las vistas creadas y lo guarda en archivo
 */
const db = require('./app/config/odbcConfig');
const fs = require('fs');
const path = require('path');

async function backup() {
    try {
        await db.initialize();

        const backupDir = path.join(__dirname, 'backups');
        if (!fs.existsSync(backupDir)) fs.mkdirSync(backupDir);

        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const fileVal = path.join(backupDir, `vistas_backup_${timestamp}.sql`);

        const views = ['JAVIER.V_DIM_ARTICULO', 'JAVIER.V_FACT_VENTAS', 'JAVIER.V_MEDIOS_POWERBI'];

        let dump = `-- BACKUP DE VISTAS GENERADO AUTOMÁTICAMENTE\n-- FECHA: ${new Date().toISOString()}\n\n`;

        for (const v of views) {
            console.log(`Procesando ${v}...`);
            // En iSeries QSYS2.SYSVIEWS tiene el texto
            try {
                // Separar Schema y Nombre
                const [schema, name] = v.split('.');

                const res = await db.query(`
                    SELECT VIEW_DEFINITION 
                    FROM QSYS2.SYSVIEWS 
                    WHERE TABLE_SCHEMA = '${schema}' AND TABLE_NAME = '${name}'
                `);

                if (res && res.length > 0) {
                    dump += `-- VISTA: ${v}\n`;
                    dump += `${res[0].VIEW_DEFINITIONString || res[0].VIEW_DEFINITION};\n\n`;
                    console.log(`  ✅ Definición extraída.`);
                } else {
                    console.log(`  ⚠️ No se encontró definición en QSYS2.SYSVIEWS.`);
                    // Fallback: Generar un "CREATE VIEW" aproximado si fuera necesario, 
                    // pero aquí solo registramos que no se pudo sacar el DDL exacto.
                    dump += `-- NO SE ENCONTRÓ DDL PARA ${v}\n\n`;
                }
            } catch (e) {
                console.log(`  ❌ Error extrayendo DDL: ${e.message}`);
            }
        }

        fs.writeFileSync(fileVal, dump);
        console.log(`\n\n✅ Backup guardado en: ${fileVal}`);

    } catch (error) {
        console.error("Error:", error);
    } finally {
        await db.closePool();
    }
}

backup();
