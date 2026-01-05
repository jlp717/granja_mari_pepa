/**
 * EXPLORAR TABLA LACLAE
 * =====================
 * El usuario indicó que la tabla correcta es LACLAE
 * y que solo se deben incluir Series A, F y N (excluir D)
 */

require('dotenv').config();

const CODIGO_CLIENTE = '4300013449';
const REF_BASE = 29256.80;
const REF_IVA = 2586.06;

async function explorarLACLAE() {
    let pool;

    try {
        console.log('\n╔══════════════════════════════════════════════════════════════════╗');
        console.log('║  EXPLORAR TABLA LACLAE (FUENTE CORRECTA DEL LIBRO IVA)          ║');
        console.log('╚══════════════════════════════════════════════════════════════════╝\n');

        pool = require('../../app/config/odbcConfig');
        await pool.initialize();
        console.log('✓ Pool inicializado\n');

        // ═══════════════════════════════════════════════════════════════
        // 1. VER COLUMNAS DE LACLAE
        // ═══════════════════════════════════════════════════════════════
        console.log('═══════════════════════════════════════════════════════════════');
        console.log('1. COLUMNAS DE TABLA LACLAE');
        console.log('═══════════════════════════════════════════════════════════════\n');

        const queryColumnas = `
      SELECT COLUMN_NAME, DATA_TYPE, NUMERIC_PRECISION, NUMERIC_SCALE
      FROM QSYS2.SYSCOLUMNS
      WHERE TABLE_SCHEMA = 'DSEDAC' AND TABLE_NAME = 'LACLAE'
      ORDER BY ORDINAL_POSITION
    `;

        const columnas = await pool.query(queryColumnas);
        console.log(`LACLAE tiene ${columnas.length} columnas:`);
        columnas.forEach(c => {
            console.log(`  - ${c.COLUMN_NAME} (${c.DATA_TYPE}${c.NUMERIC_PRECISION ? ':' + c.NUMERIC_PRECISION + ',' + c.NUMERIC_SCALE : ''})`);
        });

        // ═══════════════════════════════════════════════════════════════
        // 2. VER PRIMEROS REGISTROS DE LACLAE
        // ═══════════════════════════════════════════════════════════════
        console.log('\n═══════════════════════════════════════════════════════════════');
        console.log('2. EJEMPLO DE REGISTROS LACLAE');
        console.log('═══════════════════════════════════════════════════════════════\n');

        try {
            const queryEjemplo = `
        SELECT *
        FROM DSEDAC.LACLAE
        WHERE ANOFACTURA = 2025
        FETCH FIRST 3 ROWS ONLY
      `;
            const ejemplos = await pool.query(queryEjemplo);
            if (ejemplos.length > 0) {
                console.log('Campos del primer registro:');
                const campos = Object.keys(ejemplos[0]);
                campos.forEach(campo => {
                    const val = ejemplos[0][campo];
                    if (val !== null && val !== 0 && val !== '' && val !== ' ') {
                        console.log(`  ${campo}: ${val}`);
                    }
                });
            }
        } catch (e) {
            console.log(`Error: ${e.message}`);
        }

        // ═══════════════════════════════════════════════════════════════
        // 3. BUSCAR COLUMNAS DE CLIENTE FACTURA
        // ═══════════════════════════════════════════════════════════════
        console.log('\n═══════════════════════════════════════════════════════════════');
        console.log('3. BUSCAR COLUMNA DE CLIENTE FACTURA');
        console.log('═══════════════════════════════════════════════════════════════\n');

        // Buscar columnas que contengan CLIENTE o FACTURA
        const colsCliente = columnas.filter(c =>
            c.COLUMN_NAME.includes('CLIENTE') || c.COLUMN_NAME.includes('FACTURA')
        );
        console.log('Columnas relacionadas con cliente/factura:');
        colsCliente.forEach(c => {
            console.log(`  ▸ ${c.COLUMN_NAME}`);
        });

        // ═══════════════════════════════════════════════════════════════
        // 4. PROBAR CONSULTA PARA EL CLIENTE
        // ═══════════════════════════════════════════════════════════════
        console.log('\n═══════════════════════════════════════════════════════════════');
        console.log('4. TOTALES PARA CLIENTE 4300013449 EN LACLAE');
        console.log('═══════════════════════════════════════════════════════════════\n');

        // Probar con diferentes columnas de cliente
        const columnasClientePosibles = ['CODIGOCLIENTEFACTURA', 'CODIGOCLIENTE', 'CLIENTE'];

        for (const colCliente of columnasClientePosibles) {
            try {
                // Verificar si la columna existe
                const existeCol = columnas.find(c => c.COLUMN_NAME === colCliente);
                if (!existeCol) continue;

                const queryTotal = `
          SELECT
            COUNT(*) as NUM_REGISTROS,
            SUM(BASEIMPONIBLE) as SUMA_BASE,
            SUM(IMPORTEIVA) as SUMA_IVA
          FROM DSEDAC.LACLAE
          WHERE ANOFACTURA = 2025
            AND TRIM(${colCliente}) = '${CODIGO_CLIENTE}'
            AND TRIM(SERIEFACTURA) IN ('A', 'F', 'N')
        `;

                const total = (await pool.query(queryTotal))[0];
                const base = parseFloat(total.SUMA_BASE) || 0;
                const iva = parseFloat(total.SUMA_IVA) || 0;

                console.log(`Con columna ${colCliente}:`);
                console.log(`  Registros: ${total.NUM_REGISTROS}`);
                console.log(`  Base:      ${base.toFixed(2)}€ (Ref: ${REF_BASE.toFixed(2)}€, Diff: ${(base - REF_BASE).toFixed(2)}€)`);
                console.log(`  IVA:       ${iva.toFixed(2)}€ (Ref: ${REF_IVA.toFixed(2)}€, Diff: ${(iva - REF_IVA).toFixed(2)}€)`);

                if (Math.abs(base - REF_BASE) < 1) {
                    console.log(`  ✅ ¡COINCIDE!`);
                }
                console.log();
            } catch (e) {
                console.log(`  Error con ${colCliente}: ${e.message}\n`);
            }
        }

        // ═══════════════════════════════════════════════════════════════
        // 5. DESGLOSE POR SERIE
        // ═══════════════════════════════════════════════════════════════
        console.log('═══════════════════════════════════════════════════════════════');
        console.log('5. DESGLOSE POR SERIE EN LACLAE');
        console.log('═══════════════════════════════════════════════════════════════\n');

        try {
            const colCliente = columnas.find(c => c.COLUMN_NAME.includes('CLIENTE')) ?
                columnas.find(c => c.COLUMN_NAME.includes('CLIENTE')).COLUMN_NAME : 'CODIGOCLIENTEFACTURA';

            const querySeries = `
        SELECT
          TRIM(SERIEFACTURA) as SERIE,
          COUNT(*) as NUM_REGISTROS,
          SUM(BASEIMPONIBLE) as SUMA_BASE,
          SUM(IMPORTEIVA) as SUMA_IVA
        FROM DSEDAC.LACLAE
        WHERE ANOFACTURA = 2025
          AND TRIM(${colCliente}) = '${CODIGO_CLIENTE}'
        GROUP BY TRIM(SERIEFACTURA)
        ORDER BY TRIM(SERIEFACTURA)
      `;

            const series = await pool.query(querySeries);
            console.log('Serie | Registros | Base         | IVA');
            console.log('------|-----------|--------------|--------');
            let totalBase = 0;
            series.forEach(s => {
                const base = parseFloat(s.SUMA_BASE) || 0;
                totalBase += base;
                console.log(`${(s.SERIE || '').padEnd(5)} | ${String(s.NUM_REGISTROS).padEnd(9)} | ${base.toFixed(2).padStart(12)} | ${parseFloat(s.SUMA_IVA).toFixed(2).padStart(8)}`);
            });
            console.log(`\nTotal general: ${totalBase.toFixed(2)}€`);
            console.log(`Referencia:    ${REF_BASE.toFixed(2)}€`);
            console.log(`Diferencia:    ${(totalBase - REF_BASE).toFixed(2)}€`);
        } catch (e) {
            console.log(`Error: ${e.message}`);
        }

        // ═══════════════════════════════════════════════════════════════
        // 6. DESGLOSE POR TIPO DE IVA
        // ═══════════════════════════════════════════════════════════════
        console.log('\n═══════════════════════════════════════════════════════════════');
        console.log('6. DESGLOSE POR TIPO DE IVA EN LACLAE');
        console.log('═══════════════════════════════════════════════════════════════\n');

        try {
            const colCliente = columnas.find(c => c.COLUMN_NAME.includes('CLIENTE')) ?
                columnas.find(c => c.COLUMN_NAME.includes('CLIENTE')).COLUMN_NAME : 'CODIGOCLIENTEFACTURA';

            const queryIva = `
        SELECT
          TRIM(SERIEFACTURA) as SERIE,
          PORCENTAJEIVA as PORCENTAJE,
          SUM(BASEIMPONIBLE) as SUMA_BASE,
          SUM(IMPORTEIVA) as SUMA_IVA
        FROM DSEDAC.LACLAE
        WHERE ANOFACTURA = 2025
          AND TRIM(${colCliente}) = '${CODIGO_CLIENTE}'
          AND TRIM(SERIEFACTURA) IN ('A', 'F', 'N')
        GROUP BY TRIM(SERIEFACTURA), PORCENTAJEIVA
        ORDER BY TRIM(SERIEFACTURA), PORCENTAJEIVA DESC
      `;

            const ivas = await pool.query(queryIva);
            console.log('Serie | % IVA | Base         | IVA');
            console.log('------|-------|--------------|--------');

            // Referencia del sistema objetivo:
            // A 10%: 23.429,03€
            // A 4%: 5.662,76€
            // F 10%: 165,01€

            ivas.forEach(i => {
                const base = parseFloat(i.SUMA_BASE) || 0;
                console.log(`${(i.SERIE || '').padEnd(5)} | ${String(i.PORCENTAJE).padEnd(5)} | ${base.toFixed(2).padStart(12)} | ${parseFloat(i.SUMA_IVA).toFixed(2).padStart(8)}`);
            });

            console.log('\nReferencia del sistema objetivo:');
            console.log('  Serie A 10%: 23.429,03€');
            console.log('  Serie A 4%:  5.662,76€');
            console.log('  Serie F 10%: 165,01€');
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

explorarLACLAE().catch(console.error);
