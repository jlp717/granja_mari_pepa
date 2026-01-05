/**
 * VERIFICAR QUE LA LÓGICA DEL CONTROLADOR ES CORRECTA
 * ====================================================
 * Simular exactamente la consulta del controlador con fechas 01/01/2025 - 12/12/2025
 */

require('dotenv').config();

const CODIGO_CLIENTE = '4300013449';

// Fechas del libro de referencia
const FECHA_INICIO = '2025-01-01';
const FECHA_FIN = '2025-12-12';
const fechaInicioNum = 20250101;
const fechaFinNum = 20251212;

async function verificarConsulta() {
    let pool;

    try {
        console.log('\n╔══════════════════════════════════════════════════════════════════╗');
        console.log('║  VERIFICAR LÓGICA DEL CONTROLADOR                               ║');
        console.log('╚══════════════════════════════════════════════════════════════════╝\n');

        console.log(`Fecha Inicio: ${FECHA_INICIO} (${fechaInicioNum})`);
        console.log(`Fecha Fin: ${FECHA_FIN} (${fechaFinNum})`);

        pool = require('../../app/config/odbcConfig');
        await pool.initialize();
        console.log('✓ Pool inicializado\n');

        // Consulta EXACTA del controlador pero solo para nuestro cliente
        const query = `
      SELECT
        TRIM(C.SERIEFACTURA) as SERIEFACTURA,
        C.NUMEROFACTURA,
        SUM(C.IMPORTEBASEIMPONIBLE1 + C.IMPORTEBASEIMPONIBLE2 + C.IMPORTEBASEIMPONIBLE3 +
            C.IMPORTEBASEIMPONIBLE4 + C.IMPORTEBASEIMPONIBLE5) as BASE_IMPONIBLE,
        SUM(C.IMPORTEIVA1 + C.IMPORTEIVA2 + C.IMPORTEIVA3 + C.IMPORTEIVA4 + C.IMPORTEIVA5) as IVA,
        SUM(C.IMPORTETOTAL) as TOTAL
      FROM DSEDAC.CAC C
      WHERE (C.ANOFACTURA * 10000 + C.MESFACTURA * 100 + C.DIAFACTURA) >= ${fechaInicioNum}
        AND (C.ANOFACTURA * 10000 + C.MESFACTURA * 100 + C.DIAFACTURA) <= ${fechaFinNum}
        AND C.NUMEROFACTURA > 0
        AND TRIM(C.CODIGOCLIENTEFACTURA) = '${CODIGO_CLIENTE}'
      GROUP BY
        TRIM(C.SERIEFACTURA),
        C.NUMEROFACTURA
      HAVING SUM(C.IMPORTEBASEIMPONIBLE1 + C.IMPORTEBASEIMPONIBLE2 + C.IMPORTEBASEIMPONIBLE3 +
                 C.IMPORTEBASEIMPONIBLE4 + C.IMPORTEBASEIMPONIBLE5) <> 0
         AND SUM(C.IMPORTEIVA1 + C.IMPORTEIVA2 + C.IMPORTEIVA3 + C.IMPORTEIVA4 + C.IMPORTEIVA5) <> 0
         AND SUM(C.IMPORTETOTAL) <> 0
      ORDER BY SERIEFACTURA, NUMEROFACTURA
    `;

        const result = await pool.query(query);

        console.log(`Total facturas: ${result.length}`);
        console.log(`  Serie A: ${result.filter(r => r.SERIEFACTURA === 'A').length}`);
        console.log(`  Serie F: ${result.filter(r => r.SERIEFACTURA === 'F').length}`);

        let sumaBase = 0, sumaIVA = 0, sumaTotal = 0;
        result.forEach(r => {
            sumaBase += parseFloat(r.BASE_IMPONIBLE) || 0;
            sumaIVA += parseFloat(r.IVA) || 0;
            sumaTotal += parseFloat(r.TOTAL) || 0;
        });

        console.log('\n═══════════════════════════════════════════════════════════════');
        console.log('TOTALES CON FECHA FIN 12/12/2025');
        console.log('═══════════════════════════════════════════════════════════════\n');

        console.log('                NUESTRO       REFERENCIA    DIFERENCIA');
        console.log('Base Imponible: ' + sumaBase.toFixed(2).padStart(10) + '     ' + '29256.80'.padStart(10) + '     ' + (sumaBase - 29256.80).toFixed(2).padStart(8));
        console.log('IVA:            ' + sumaIVA.toFixed(2).padStart(10) + '     ' + '2586.06'.padStart(10) + '     ' + (sumaIVA - 2586.06).toFixed(2).padStart(8));
        console.log('Total:          ' + sumaTotal.toFixed(2).padStart(10) + '     ' + '31842.86'.padStart(10) + '     ' + (sumaTotal - 31842.86).toFixed(2).padStart(8));

        // Verificar que las 4 facturas extra NO están incluidas
        console.log('\n═══════════════════════════════════════════════════════════════');
        console.log('VERIFICAR EXCLUSIÓN DE FACTURAS POSTERIORES AL 12/12');
        console.log('═══════════════════════════════════════════════════════════════\n');

        const facturasExtra = [9223, 9278, 9323, 9324];
        const encontradas = result.filter(r => facturasExtra.includes(r.NUMEROFACTURA) && r.SERIEFACTURA === 'A');

        if (encontradas.length === 0) {
            console.log('✅ Las 4 facturas extra (9223, 9278, 9323, 9324) NO están incluidas');
        } else {
            console.log('❌ Algunas facturas extra SÍ están incluidas:');
            encontradas.forEach(f => console.log('  ' + f.SERIEFACTURA + '-' + f.NUMEROFACTURA));
        }

        console.log('\n✓ Verificación completada\n');

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

verificarConsulta().catch(console.error);
