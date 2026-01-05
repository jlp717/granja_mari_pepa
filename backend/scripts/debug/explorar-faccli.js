/**
 * ACCEDER A FACCLI CON SINTAXIS ALTERNATIVA
 * ==========================================
 * El error anterior sugiere problema con nombres de columna
 * Voy a explorar primero las columnas disponibles
 */

require('dotenv').config();

const CODIGO_CLIENTE = '4300013449';
const REF_BASE = 29256.80;

async function explorarFACCLI() {
    let pool;

    try {
        console.log('\n╔══════════════════════════════════════════════════════════════════╗');
        console.log('║  EXPLORAR TABLA FACCLI DETALLADAMENTE                           ║');
        console.log('╚══════════════════════════════════════════════════════════════════╝\n');

        pool = require('../../app/config/odbcConfig');
        await pool.initialize();
        console.log('✓ Pool inicializado\n');

        // ═══════════════════════════════════════════════════════════════
        // 1. OBTENER TODAS LAS COLUMNAS DE FACCLI
        // ═══════════════════════════════════════════════════════════════
        console.log('═══════════════════════════════════════════════════════════════');
        console.log('1. COLUMNAS DE TABLA FACCLI');
        console.log('═══════════════════════════════════════════════════════════════\n');

        const queryColsFACCLI = `
      SELECT COLUMN_NAME, DATA_TYPE, CHARACTER_MAXIMUM_LENGTH, NUMERIC_PRECISION
      FROM QSYS2.SYSCOLUMNS
      WHERE TABLE_SCHEMA = 'DSEDAC' AND TABLE_NAME = 'FACCLI'
      ORDER BY ORDINAL_POSITION
    `;

        const colsFACCLI = await pool.query(queryColsFACCLI);
        console.log(`FACCLI tiene ${colsFACCLI.length} columnas:`);
        colsFACCLI.forEach(c => {
            if (c.COLUMN_NAME.includes('TOTAL') || c.COLUMN_NAME.includes('IVA') ||
                c.COLUMN_NAME.includes('BASE') || c.COLUMN_NAME.includes('IMPORTE') ||
                c.COLUMN_NAME.includes('FECHA') || c.COLUMN_NAME.includes('EJERCICIO') ||
                c.COLUMN_NAME.includes('CLIENTE') || c.COLUMN_NAME.includes('SERIE')) {
                console.log(`  ▸ ${c.COLUMN_NAME} (${c.DATA_TYPE})`);
            }
        });

        // ═══════════════════════════════════════════════════════════════
        // 2. VER PRIMERA FILA DE FACCLI
        // ═══════════════════════════════════════════════════════════════
        console.log('\n═══════════════════════════════════════════════════════════════');
        console.log('2. EJEMPLO DE REGISTRO FACCLI');
        console.log('═══════════════════════════════════════════════════════════════\n');

        try {
            const queryEjemplo = `
        SELECT *
        FROM DSEDAC.FACCLI
        WHERE EJERCICIOFACTURA = 2025
        FETCH FIRST 1 ROW ONLY
      `;
            const ejemplo = await pool.query(queryEjemplo);
            if (ejemplo.length > 0) {
                console.log('Campos del primer registro:');
                const campos = Object.keys(ejemplo[0]);
                campos.forEach(campo => {
                    if (ejemplo[0][campo] !== null && ejemplo[0][campo] !== 0 && ejemplo[0][campo] !== '') {
                        console.log(`  ${campo}: ${ejemplo[0][campo]}`);
                    }
                });
            }
        } catch (e) {
            console.log(`Error: ${e.message}`);
        }

        // ═══════════════════════════════════════════════════════════════
        // 3. PROBAR CONSULTA SIMPLE A FACCLI
        // ═══════════════════════════════════════════════════════════════
        console.log('\n═══════════════════════════════════════════════════════════════');
        console.log('3. CONSULTA SIMPLE A FACCLI');
        console.log('═══════════════════════════════════════════════════════════════\n');

        try {
            const querySimple = `
        SELECT
          COUNT(*) as TOTAL,
          SUM(TOTALFACTURA) as SUMA_TOTAL
        FROM DSEDAC.FACCLI
        WHERE EJERCICIOFACTURA = 2025
      `;
            const simple = (await pool.query(querySimple))[0];
            console.log(`Total facturas en FACCLI 2025: ${simple.TOTAL}`);
            console.log(`Suma TOTALFACTURA: ${parseFloat(simple.SUMA_TOTAL).toFixed(2)}€`);
        } catch (e) {
            console.log(`Error: ${e.message}`);
        }

        // ═══════════════════════════════════════════════════════════════
        // 4. BUSCAR CLIENTE ESPECÍFICO EN FACCLI
        // ═══════════════════════════════════════════════════════════════
        console.log('\n═══════════════════════════════════════════════════════════════');
        console.log('4. CLIENTE ESPECÍFICO EN FACCLI');
        console.log('═══════════════════════════════════════════════════════════════\n');

        try {
            // Primero verificar qué columna tiene el código cliente
            const queryCliente = `
        SELECT
          COUNT(*) as TOTAL,
          SUM(TOTALFACTURA) as SUMA_BASE,
          SUM(IVAFACTURA) as SUMA_IVA
        FROM DSEDAC.FACCLI
        WHERE EJERCICIOFACTURA = 2025
          AND CODIGOCLIENTE = '${CODIGO_CLIENTE}'
      `;
            const cliente = (await pool.query(queryCliente))[0];
            const baseCliente = parseFloat(cliente.SUMA_BASE) || 0;
            const ivaCliente = parseFloat(cliente.SUMA_IVA) || 0;

            console.log(`Cliente ${CODIGO_CLIENTE} en FACCLI:`);
            console.log(`  Facturas: ${cliente.TOTAL}`);
            console.log(`  TOTALFACTURA: ${baseCliente.toFixed(2)}€ (Diff vs Ref: ${(baseCliente - REF_BASE).toFixed(2)}€)`);
            console.log(`  IVAFACTURA: ${ivaCliente.toFixed(2)}€`);
        } catch (e) {
            console.log(`Error: ${e.message}`);

            // Intentar con TRIM
            try {
                const queryClienteTrim = `
          SELECT
            COUNT(*) as TOTAL,
            SUM(TOTALFACTURA) as SUMA_BASE,
            SUM(IVAFACTURA) as SUMA_IVA
          FROM DSEDAC.FACCLI
          WHERE EJERCICIOFACTURA = 2025
            AND TRIM(CODIGOCLIENTE) = '${CODIGO_CLIENTE}'
        `;
                const clienteTrim = (await pool.query(queryClienteTrim))[0];
                console.log(`\nCon TRIM(CODIGOCLIENTE):`);
                console.log(`  Facturas: ${clienteTrim.TOTAL}`);
                console.log(`  TOTALFACTURA: ${parseFloat(clienteTrim.SUMA_BASE).toFixed(2)}€`);
            } catch (e2) {
                console.log(`Error con TRIM: ${e2.message}`);
            }
        }

        // ═══════════════════════════════════════════════════════════════
        // 5. LISTAR PRIMERAS FACTURAS DEL CLIENTE EN FACCLI
        // ═══════════════════════════════════════════════════════════════
        console.log('\n═══════════════════════════════════════════════════════════════');
        console.log('5. PRIMERAS FACTURAS DEL CLIENTE EN FACCLI');
        console.log('═══════════════════════════════════════════════════════════════\n');

        try {
            const queryFacturas = `
        SELECT
          SERIEFACTURA,
          NUMEROFACTURA,
          FECHAFACTURA,
          TOTALFACTURA,
          IVAFACTURA,
          RECARGOFACTURA
        FROM DSEDAC.FACCLI
        WHERE EJERCICIOFACTURA = 2025
          AND CODIGOCLIENTE = '${CODIGO_CLIENTE}'
        ORDER BY FECHAFACTURA, NUMEROFACTURA
        FETCH FIRST 10 ROWS ONLY
      `;
            const facturas = await pool.query(queryFacturas);

            console.log('Serie | Número  | Fecha      | Base      | IVA       | Recargo');
            console.log('------|---------|------------|-----------|-----------|--------');
            facturas.forEach(f => {
                console.log(
                    `${(f.SERIEFACTURA || '').padEnd(5)} | ` +
                    `${String(f.NUMEROFACTURA).padEnd(7)} | ` +
                    `${String(f.FECHAFACTURA).substring(0, 10)} | ` +
                    `${parseFloat(f.TOTALFACTURA).toFixed(2).padStart(9)} | ` +
                    `${parseFloat(f.IVAFACTURA).toFixed(2).padStart(9)} | ` +
                    `${parseFloat(f.RECARGOFACTURA || 0).toFixed(2).padStart(7)}`
                );
            });
        } catch (e) {
            console.log(`Error: ${e.message}`);
        }

        console.log('\n✓ Exploración completada\n');

    } catch (error) {
        console.error('\n❌ ERROR:', error.message);
        console.error(error.stack);
    } finally {
        if (pool) {
            await pool.close();
            console.log('✓ Pool cerrado\n');
        }
    }
}

explorarFACCLI().catch(console.error);
