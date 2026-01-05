/**
 * PROBAR FACCLI CON LA MISMA LÓGICA DE authService.js
 * ====================================================
 * authService.js usa:
 * - F.TOTALFACTURA as baseImponible
 * - F.IVAFACTURA as iva
 * - F.RECARGOFACTURA as recargo
 * - WHERE F.EJERCICIOFACTURA = ?
 * 
 * Esto debería coincidir exactamente con el sistema de referencia
 */

require('dotenv').config();

const CODIGO_CLIENTE = '4300013449';
const EJERCICIO = 2025;
const REF_BASE = 29256.80;
const REF_IVA = 2586.06;

async function probarFACCLI() {
    let pool;

    try {
        console.log('\n╔══════════════════════════════════════════════════════════════════╗');
        console.log('║  PROBAR FACCLI CON LÓGICA DE authService.js                     ║');
        console.log('╚══════════════════════════════════════════════════════════════════╝\n');
        console.log(`OBJETIVO: Base=${REF_BASE}€, IVA=${REF_IVA}€\n`);

        pool = require('../../app/config/odbcConfig');
        await pool.initialize();
        console.log('✓ Pool inicializado\n');

        // ═══════════════════════════════════════════════════════════════
        // 1. CONSULTA FACCLI CON EJERCICIOFACTURA (mismo que authService)
        // ═══════════════════════════════════════════════════════════════
        console.log('═══════════════════════════════════════════════════════════════');
        console.log('1. FACCLI CON EJERCICIOFACTURA = 2025');
        console.log('═══════════════════════════════════════════════════════════════\n');

        try {
            const queryFACCLI = `
        SELECT
          COUNT(*) as NUM_FACTURAS,
          SUM(F.TOTALFACTURA) as SUMA_BASE,
          SUM(F.IVAFACTURA) as SUMA_IVA,
          SUM(F.RECARGOFACTURA) as SUMA_RECARGO,
          SUM(F.TOTALFACTURA + F.IVAFACTURA + F.RECARGOFACTURA) as SUMA_TOTAL
        FROM DSEDAC.FACCLI F
        WHERE TRIM(F.CODIGOCLIENTE) = '${CODIGO_CLIENTE}'
          AND F.EJERCICIOFACTURA = ${EJERCICIO}
      `;

            const faccli = (await pool.query(queryFACCLI))[0];
            const base = parseFloat(faccli.SUMA_BASE) || 0;
            const iva = parseFloat(faccli.SUMA_IVA) || 0;
            const recargo = parseFloat(faccli.SUMA_RECARGO) || 0;
            const total = parseFloat(faccli.SUMA_TOTAL) || 0;

            console.log(`Resultados de FACCLI (EJERCICIOFACTURA=${EJERCICIO}):`);
            console.log(`  Facturas: ${faccli.NUM_FACTURAS}`);
            console.log(`  TOTALFACTURA (Base):  ${base.toFixed(2)}€`);
            console.log(`  IVAFACTURA:           ${iva.toFixed(2)}€`);
            console.log(`  RECARGOFACTURA:       ${recargo.toFixed(2)}€`);
            console.log(`  Total:                ${total.toFixed(2)}€`);
            console.log(`\nComparación con referencia:`);
            console.log(`  Base: ${base.toFixed(2)}€ vs ${REF_BASE.toFixed(2)}€ → Diff: ${(base - REF_BASE).toFixed(2)}€`);
            console.log(`  IVA: ${iva.toFixed(2)}€ vs ${REF_IVA.toFixed(2)}€ → Diff: ${(iva - REF_IVA).toFixed(2)}€`);

            if (Math.abs(base - REF_BASE) < 1) {
                console.log('\n✅ ¡COINCIDE CON LA REFERENCIA!');
            }
        } catch (e) {
            console.log(`Error: ${e.message}`);
        }

        // ═══════════════════════════════════════════════════════════════
        // 2. COMPARAR FACCLI vs CAC
        // ═══════════════════════════════════════════════════════════════
        console.log('\n═══════════════════════════════════════════════════════════════');
        console.log('2. COMPARAR FACCLI vs CAC');
        console.log('═══════════════════════════════════════════════════════════════\n');

        const queryCAC = `
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
        WHERE C.EJERCICIOFACTURA = ${EJERCICIO}
          AND C.NUMEROFACTURA > 0
          AND TRIM(C.CODIGOCLIENTEFACTURA) = '${CODIGO_CLIENTE}'
        GROUP BY C.SERIEFACTURA, C.NUMEROFACTURA, C.ANOFACTURA, C.MESFACTURA, C.DIAFACTURA
        HAVING SUM(C.IMPORTEBASEIMPONIBLE1 + C.IMPORTEBASEIMPONIBLE2 + C.IMPORTEBASEIMPONIBLE3 +
                   C.IMPORTEBASEIMPONIBLE4 + C.IMPORTEBASEIMPONIBLE5) <> 0
      ) T
    `;

        const cac = (await pool.query(queryCAC))[0];
        const baseCAC = parseFloat(cac.TOTAL_BASE) || 0;
        const ivaCAC = parseFloat(cac.TOTAL_IVA) || 0;

        console.log(`CAC (EJERCICIOFACTURA=${EJERCICIO}):`);
        console.log(`  Facturas: ${cac.NUM_FACTURAS}`);
        console.log(`  Base: ${baseCAC.toFixed(2)}€ → Diff vs Ref: ${(baseCAC - REF_BASE).toFixed(2)}€`);
        console.log(`  IVA: ${ivaCAC.toFixed(2)}€ → Diff vs Ref: ${(ivaCAC - REF_IVA).toFixed(2)}€`);

        // ═══════════════════════════════════════════════════════════════
        // 3. LISTAR PRIMERAS FACTURAS FACCLI PARA VERIFICAR
        // ═══════════════════════════════════════════════════════════════
        console.log('\n═══════════════════════════════════════════════════════════════');
        console.log('3. PRIMERAS 10 FACTURAS EN FACCLI');
        console.log('═══════════════════════════════════════════════════════════════\n');

        try {
            const queryLista = `
        SELECT
          TRIM(F.SERIEFACTURA) as SERIE,
          F.NUMEROFACTURA,
          F.FECHAFACTURA,
          F.TOTALFACTURA as BASE,
          F.IVAFACTURA as IVA,
          F.RECARGOFACTURA as RECARGO
        FROM DSEDAC.FACCLI F
        WHERE TRIM(F.CODIGOCLIENTE) = '${CODIGO_CLIENTE}'
          AND F.EJERCICIOFACTURA = ${EJERCICIO}
        ORDER BY F.FECHAFACTURA, F.NUMEROFACTURA
        FETCH FIRST 10 ROWS ONLY
      `;

            const lista = await pool.query(queryLista);
            console.log('Serie | Número  | Fecha      | Base      | IVA');
            console.log('------|---------|------------|-----------|--------');
            lista.forEach(f => {
                const fecha = f.FECHAFACTURA ? String(f.FECHAFACTURA).substring(0, 10) : 'N/A';
                console.log(
                    `${(f.SERIE || '').padEnd(5)} | ` +
                    `${String(f.NUMEROFACTURA).padEnd(7)} | ` +
                    `${fecha.padEnd(10)} | ` +
                    `${parseFloat(f.BASE).toFixed(2).padStart(9)} | ` +
                    `${parseFloat(f.IVA).toFixed(2).padStart(7)}`
                );
            });
        } catch (e) {
            console.log(`Error: ${e.message}`);
        }

        // ═══════════════════════════════════════════════════════════════
        // 4. VER SI USANDO FACCLI DA LA DIFERENCIA DE 175€
        // ═══════════════════════════════════════════════════════════════
        console.log('\n═══════════════════════════════════════════════════════════════');
        console.log('4. COMPARAR CAC ANOFACTURA=2025 vs FACCLI EJERCICIO=2025');
        console.log('═══════════════════════════════════════════════════════════════\n');

        const queryCACano = `
      SELECT
        SUM(BASE) as TOTAL_BASE,
        COUNT(*) as NUM_FACTURAS
      FROM (
        SELECT
          SUM(C.IMPORTEBASEIMPONIBLE1 + C.IMPORTEBASEIMPONIBLE2 + C.IMPORTEBASEIMPONIBLE3 +
              C.IMPORTEBASEIMPONIBLE4 + C.IMPORTEBASEIMPONIBLE5) as BASE
        FROM DSEDAC.CAC C
        WHERE C.ANOFACTURA = ${EJERCICIO}
          AND C.NUMEROFACTURA > 0
          AND TRIM(C.CODIGOCLIENTEFACTURA) = '${CODIGO_CLIENTE}'
        GROUP BY C.SERIEFACTURA, C.NUMEROFACTURA, C.ANOFACTURA, C.MESFACTURA, C.DIAFACTURA
        HAVING SUM(C.IMPORTEBASEIMPONIBLE1 + C.IMPORTEBASEIMPONIBLE2 + C.IMPORTEBASEIMPONIBLE3 +
                   C.IMPORTEBASEIMPONIBLE4 + C.IMPORTEBASEIMPONIBLE5) <> 0
      ) T
    `;

        const cacAno = (await pool.query(queryCACano))[0];
        const baseCACano = parseFloat(cacAno.TOTAL_BASE) || 0;

        console.log('Resumen de fuentes de datos:\n');
        console.log(`  CAC (ANOFACTURA=2025):         ${baseCACano.toFixed(2)}€ (${cacAno.NUM_FACTURAS} fact) → +${(baseCACano - REF_BASE).toFixed(2)}€`);
        console.log(`  CAC (EJERCICIOFACTURA=2025):   ${baseCAC.toFixed(2)}€ (${cac.NUM_FACTURAS} fact) → ${(baseCAC - REF_BASE).toFixed(2)}€`);
        console.log(`  REFERENCIA:                    ${REF_BASE.toFixed(2)}€`);

        console.log('\n✓ Pruebas completadas\n');

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

probarFACCLI().catch(console.error);
