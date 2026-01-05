/**
 * SCRIPT: Exportar todas las facturas para comparar con referencia
 * =================================================================
 * Extrae exactamente las mismas columnas que el sistema de referencia
 * para poder comparar línea por línea y encontrar la diferencia de 175€
 */

require('dotenv').config();

const CODIGO_CLIENTE = '4300013449';
const EJERCICIO = 2025;

async function exportarParaComparacion() {
    let pool;

    try {
        console.log('\n╔══════════════════════════════════════════════════════════════════╗');
        console.log('║  EXPORTAR FACTURAS PARA COMPARACIÓN CON SISTEMA DE REFERENCIA   ║');
        console.log('╚══════════════════════════════════════════════════════════════════╝\n');

        pool = require('../../app/config/odbcConfig');
        await pool.initialize();
        console.log('✓ Pool inicializado\n');

        // ═══════════════════════════════════════════════════════════════
        // 1. OBTENER TODAS LAS FACTURAS (mismo query que el controlador)
        // ═══════════════════════════════════════════════════════════════
        console.log('═══════════════════════════════════════════════════════════════');
        console.log('1. FACTURAS DEL SISTEMA (query del controlador)');
        console.log('═══════════════════════════════════════════════════════════════\n');

        const fechaInicioNum = 20250101;
        const fechaFinNum = 20251231;

        const query = `
      SELECT
        TRIM(C.SERIEFACTURA) as SERIEFACTURA,
        C.NUMEROFACTURA,
        C.ANOFACTURA,
        C.MESFACTURA,
        C.DIAFACTURA,
        TRIM(C.CODIGOCLIENTEFACTURA) as CODIGOCLIENTE,
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
        C.NUMEROFACTURA,
        C.ANOFACTURA,
        C.MESFACTURA,
        C.DIAFACTURA,
        TRIM(C.CODIGOCLIENTEFACTURA)
      HAVING SUM(C.IMPORTEBASEIMPONIBLE1 + C.IMPORTEBASEIMPONIBLE2 + C.IMPORTEBASEIMPONIBLE3 +
                 C.IMPORTEBASEIMPONIBLE4 + C.IMPORTEBASEIMPONIBLE5) <> 0
         AND SUM(C.IMPORTEIVA1 + C.IMPORTEIVA2 + C.IMPORTEIVA3 + C.IMPORTEIVA4 + C.IMPORTEIVA5) <> 0
         AND SUM(C.IMPORTETOTAL) <> 0
      ORDER BY ANOFACTURA, MESFACTURA, DIAFACTURA, SERIEFACTURA, NUMEROFACTURA
    `;

        const facturas = await pool.query(query);
        console.log(`Total facturas obtenidas: ${facturas.length}`);

        // Calcular totales
        let totalBase = 0, totalIva = 0, totalGeneral = 0;
        facturas.forEach(f => {
            totalBase += parseFloat(f.BASE_IMPONIBLE) || 0;
            totalIva += parseFloat(f.IVA) || 0;
            totalGeneral += parseFloat(f.TOTAL) || 0;
        });

        console.log(`\nTotales del sistema:`);
        console.log(`  Base Imponible: ${totalBase.toFixed(2)}€`);
        console.log(`  IVA: ${totalIva.toFixed(2)}€`);
        console.log(`  Total: ${totalGeneral.toFixed(2)}€`);
        console.log(`\nReferencia (de la captura del usuario):`);
        console.log(`  Base Imponible: 29.256,80€`);
        console.log(`  IVA: 2.586,06€`);
        console.log(`  Total: 31.842,86€`);
        console.log(`\nDiferencia:`);
        console.log(`  Base: ${(totalBase - 29256.80).toFixed(2)}€`);
        console.log(`  IVA: ${(totalIva - 2586.06).toFixed(2)}€`);

        // ═══════════════════════════════════════════════════════════════
        // 2. VERIFICAR USANDO OR EN HAVING (en lugar de AND)
        //    Quizá el sistema de referencia excluye diferente
        // ═══════════════════════════════════════════════════════════════
        console.log('\n\n═══════════════════════════════════════════════════════════════');
        console.log('2. PROBAR DIFERENTES CONDICIONES DE HAVING');
        console.log('═══════════════════════════════════════════════════════════════\n');

        // Opción A: Solo base <> 0 (ignorar IVA y Total)
        const queryA = `
      SELECT
        COUNT(DISTINCT C.NUMEROFACTURA || '-' || C.SERIEFACTURA) as NUM_FACTURAS,
        SUM(CASE WHEN rn = 1 THEN BASE END) as TOTAL_BASE,
        SUM(CASE WHEN rn = 1 THEN IVA END) as TOTAL_IVA
      FROM (
        SELECT
          C.NUMEROFACTURA,
          C.SERIEFACTURA,
          SUM(C.IMPORTEBASEIMPONIBLE1 + C.IMPORTEBASEIMPONIBLE2 + C.IMPORTEBASEIMPONIBLE3 +
              C.IMPORTEBASEIMPONIBLE4 + C.IMPORTEBASEIMPONIBLE5) as BASE,
          SUM(C.IMPORTEIVA1 + C.IMPORTEIVA2 + C.IMPORTEIVA3 + C.IMPORTEIVA4 + C.IMPORTEIVA5) as IVA,
          ROW_NUMBER() OVER (PARTITION BY C.NUMEROFACTURA, C.SERIEFACTURA ORDER BY C.NUMEROFACTURA) as rn
        FROM DSEDAC.CAC C
        WHERE (C.ANOFACTURA * 10000 + C.MESFACTURA * 100 + C.DIAFACTURA) >= ${fechaInicioNum}
          AND (C.ANOFACTURA * 10000 + C.MESFACTURA * 100 + C.DIAFACTURA) <= ${fechaFinNum}
          AND C.NUMEROFACTURA > 0
          AND TRIM(C.CODIGOCLIENTEFACTURA) = '${CODIGO_CLIENTE}'
        GROUP BY C.NUMEROFACTURA, C.SERIEFACTURA
        HAVING SUM(C.IMPORTEBASEIMPONIBLE1 + C.IMPORTEBASEIMPONIBLE2 + C.IMPORTEBASEIMPONIBLE3 +
                   C.IMPORTEBASEIMPONIBLE4 + C.IMPORTEBASEIMPONIBLE5) <> 0
      ) T
    `;

        // Simplificar - solo contar con diferentes condiciones
        const condiciones = [
            {
                nombre: 'BASE <> 0 AND IVA <> 0 AND TOTAL <> 0 (actual)',
                having: `HAVING SUM(C.IMPORTEBASEIMPONIBLE1 + C.IMPORTEBASEIMPONIBLE2 + C.IMPORTEBASEIMPONIBLE3 +
                   C.IMPORTEBASEIMPONIBLE4 + C.IMPORTEBASEIMPONIBLE5) <> 0
         AND SUM(C.IMPORTEIVA1 + C.IMPORTEIVA2 + C.IMPORTEIVA3 + C.IMPORTEIVA4 + C.IMPORTEIVA5) <> 0
         AND SUM(C.IMPORTETOTAL) <> 0` },
            {
                nombre: 'BASE <> 0 (solo base)',
                having: `HAVING SUM(C.IMPORTEBASEIMPONIBLE1 + C.IMPORTEBASEIMPONIBLE2 + C.IMPORTEBASEIMPONIBLE3 +
                   C.IMPORTEBASEIMPONIBLE4 + C.IMPORTEBASEIMPONIBLE5) <> 0` },
            {
                nombre: 'TOTAL <> 0 (solo total)',
                having: `HAVING SUM(C.IMPORTETOTAL) <> 0`
            },
            {
                nombre: 'Sin HAVING (todas)',
                having: ``
            }
        ];

        for (const cond of condiciones) {
            const q = `
        SELECT
          SUM(BASE) as TOTAL_BASE,
          SUM(IVA) as TOTAL_IVA,
          COUNT(*) as NUM_FACTURAS
        FROM (
          SELECT
            SUM(C.IMPORTEBASEIMPONIBLE1 + C.IMPORTEBASEIMPONIBLE2 + C.IMPORTEBASEIMPONIBLE3 +
                C.IMPORTEBASEIMPONIBLE4 + C.IMPORTEBASEIMPONIBLE5) as BASE,
            SUM(C.IMPORTEIVA1 + C.IMPORTEIVA2 + C.IMPORTEIVA3 + C.IMPORTEIVA4 + C.IMPORTEIVA5) as IVA
          FROM DSEDAC.CAC C
          WHERE (C.ANOFACTURA * 10000 + C.MESFACTURA * 100 + C.DIAFACTURA) >= ${fechaInicioNum}
            AND (C.ANOFACTURA * 10000 + C.MESFACTURA * 100 + C.DIAFACTURA) <= ${fechaFinNum}
            AND C.NUMEROFACTURA > 0
            AND TRIM(C.CODIGOCLIENTEFACTURA) = '${CODIGO_CLIENTE}'
          GROUP BY
            TRIM(C.SERIEFACTURA),
            C.NUMEROFACTURA,
            C.ANOFACTURA,
            C.MESFACTURA,
            C.DIAFACTURA,
            TRIM(C.CODIGOCLIENTEFACTURA)
          ${cond.having}
        ) T
      `;

            try {
                const result = (await pool.query(q))[0];
                const base = parseFloat(result.TOTAL_BASE) || 0;
                const iva = parseFloat(result.TOTAL_IVA) || 0;
                const diffBase = base - 29256.80;
                console.log(`${cond.nombre}:`);
                console.log(`  Facturas: ${result.NUM_FACTURAS}, Base: ${base.toFixed(2)}€, Diff: ${diffBase.toFixed(2)}€`);
            } catch (e) {
                console.log(`${cond.nombre}: ERROR - ${e.message}`);
            }
        }

        // ═══════════════════════════════════════════════════════════════
        // 3. LISTAR PRIMERAS 50 FACTURAS PARA COMPARACIÓN MANUAL
        // ═══════════════════════════════════════════════════════════════
        console.log('\n\n═══════════════════════════════════════════════════════════════');
        console.log('3. PRIMERAS 30 FACTURAS (para comparar con captura)');
        console.log('═══════════════════════════════════════════════════════════════\n');

        console.log('Factura           | Fecha      | Base Imp.    | IVA          | Total');
        console.log('------------------|------------|--------------|--------------|------------');

        facturas.slice(0, 30).forEach(f => {
            const base = parseFloat(f.BASE_IMPONIBLE) || 0;
            const iva = parseFloat(f.IVA) || 0;
            const total = parseFloat(f.TOTAL) || 0;
            const fecha = `${String(f.DIAFACTURA).padStart(2, '0')}/${String(f.MESFACTURA).padStart(2, '0')}/${f.ANOFACTURA}`;
            const numFact = `${f.SERIEFACTURA}-${f.NUMEROFACTURA}`;

            console.log(
                `${numFact.padEnd(17)} | ` +
                `${fecha.padEnd(10)} | ` +
                `${base.toFixed(2).padStart(12)} | ` +
                `${iva.toFixed(2).padStart(12)} | ` +
                `${total.toFixed(2).padStart(11)}`
            );
        });

        // ═══════════════════════════════════════════════════════════════
        // 4. BUSCAR FACTURAS QUE PODRÍAN FALTAR O SOBRAR
        //    (las que tienen base negativa o muy pequeña)
        // ═══════════════════════════════════════════════════════════════
        console.log('\n\n═══════════════════════════════════════════════════════════════');
        console.log('4. FACTURAS SOSPECHOSAS (base pequeña o negativa)');
        console.log('═══════════════════════════════════════════════════════════════\n');

        const sospechosas = facturas.filter(f => {
            const base = parseFloat(f.BASE_IMPONIBLE) || 0;
            return Math.abs(base) < 50 || base < 0;
        });

        console.log(`Total facturas sospechosas: ${sospechosas.length}`);
        console.log('\nFactura           | Fecha      | Base Imp.    | IVA          | Total');
        console.log('------------------|------------|--------------|--------------|------------');

        sospechosas.forEach(f => {
            const base = parseFloat(f.BASE_IMPONIBLE) || 0;
            const iva = parseFloat(f.IVA) || 0;
            const total = parseFloat(f.TOTAL) || 0;
            const fecha = `${String(f.DIAFACTURA).padStart(2, '0')}/${String(f.MESFACTURA).padStart(2, '0')}/${f.ANOFACTURA}`;
            const numFact = `${f.SERIEFACTURA}-${f.NUMEROFACTURA}`;

            console.log(
                `${numFact.padEnd(17)} | ` +
                `${fecha.padEnd(10)} | ` +
                `${base.toFixed(2).padStart(12)} | ` +
                `${iva.toFixed(2).padStart(12)} | ` +
                `${total.toFixed(2).padStart(11)}`
            );
        });

        // Suma de facturas sospechosas
        let sumaSospechosas = 0;
        sospechosas.forEach(f => {
            sumaSospechosas += parseFloat(f.BASE_IMPONIBLE) || 0;
        });
        console.log(`\nSuma de base de facturas sospechosas: ${sumaSospechosas.toFixed(2)}€`);

        console.log('\n✓ Exportación completada\n');

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

exportarParaComparacion().catch(console.error);
