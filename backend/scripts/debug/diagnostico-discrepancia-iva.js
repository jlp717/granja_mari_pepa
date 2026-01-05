/**
 * SCRIPT DE DIAGNÓSTICO: Comparar cifras IVA entre tablas CAC y FACCLI
 * =====================================================================
 * Este script compara los datos de la tabla CAC (albaranes) con FACCLI (facturas)
 * para identificar discrepancias en los totales de IVA.
 * 
 * Datos esperados (según captura):
 * - Base Imponible: 29.256,80 €
 * - IVA: 2.586,06 €
 * - Total: 31.842,86 €
 * 
 * Datos actuales del sistema:
 * - Base Imponible: 29.431,91 €
 * - IVA: 2.598,30 €
 * - Total: 32.030,21 €
 */

require('dotenv').config();

const CODIGO_CLIENTE = '4300013449'; // GARCIA DE ALCARAZ MULERO PEDRO
const EJERCICIO = 2025;

async function diagnosticar() {
  let pool;
  
  try {
    console.log('\n╔══════════════════════════════════════════════════════════════════╗');
    console.log('║  DIAGNÓSTICO DE DISCREPANCIA EN CIFRAS DE IVA                   ║');
    console.log('╚══════════════════════════════════════════════════════════════════╝\n');

    pool = require('../../app/config/odbcConfig');
    await pool.initialize();
    console.log('✓ Pool inicializado\n');

    // Datos esperados según la captura del usuario
    const ESPERADO = {
      baseImponible: 29256.80,
      iva: 2586.06,
      total: 31842.86
    };

    console.log('📋 DATOS ESPERADOS (según captura):');
    console.log(`   Base Imponible: ${ESPERADO.baseImponible.toFixed(2)} €`);
    console.log(`   IVA: ${ESPERADO.iva.toFixed(2)} €`);
    console.log(`   Total: ${ESPERADO.total.toFixed(2)} €\n`);

    // ═══════════════════════════════════════════════════════════════
    // 1. CONSULTA ACTUAL: Desde tabla CAC (como hace obtenerIVARepercutido)
    // ═══════════════════════════════════════════════════════════════
    console.log('═══════════════════════════════════════════════════════════════');
    console.log('1. MÉTODO ACTUAL: Usando tabla CAC (albaranes)');
    console.log('   (Método usado por obtenerIVARepercutido en libroIvaController.js)');
    console.log('═══════════════════════════════════════════════════════════════\n');

    const queryCAC = `
      SELECT
        TRIM(C.SERIEFACTURA) as SERIEFACTURA,
        C.NUMEROFACTURA,
        SUM(C.IMPORTEBASEIMPONIBLE1 + C.IMPORTEBASEIMPONIBLE2 + C.IMPORTEBASEIMPONIBLE3 +
            C.IMPORTEBASEIMPONIBLE4 + C.IMPORTEBASEIMPONIBLE5) as BASE_IMPONIBLE,
        SUM(C.IMPORTEIVA1 + C.IMPORTEIVA2 + C.IMPORTEIVA3 + C.IMPORTEIVA4 + C.IMPORTEIVA5) as IVA,
        SUM(C.IMPORTERECARGO1 + C.IMPORTERECARGO2 + C.IMPORTERECARGO3 +
            C.IMPORTERECARGO4 + C.IMPORTERECARGO5) as RECARGO,
        SUM(C.IMPORTETOTAL) as TOTAL,
        COUNT(*) as NUM_LINEAS
      FROM DSEDAC.CAC C
      WHERE TRIM(C.CODIGOCLIENTEFACTURA) = '${CODIGO_CLIENTE}'
        AND C.ANOFACTURA = ${EJERCICIO}
        AND C.NUMEROFACTURA > 0
      GROUP BY
        TRIM(C.SERIEFACTURA),
        C.NUMEROFACTURA
      ORDER BY SERIEFACTURA, NUMEROFACTURA
    `;

    const facturasCAC = await pool.query(queryCAC);
    
    let totalBaseCAC = 0;
    let totalIvaCAC = 0;
    let totalRecargoCAC = 0;
    let totalCAC = 0;

    console.log('Facturas encontradas en CAC:');
    console.log('Serie   | Número  | Base Imp.    | IVA          | Recargo   | Total        | Líneas');
    console.log('--------|---------|--------------|--------------|-----------|--------------|-------');
    
    facturasCAC.forEach(f => {
      const base = parseFloat(f.BASE_IMPONIBLE) || 0;
      const iva = parseFloat(f.IVA) || 0;
      const rec = parseFloat(f.RECARGO) || 0;
      const tot = parseFloat(f.TOTAL) || 0;
      
      totalBaseCAC += base;
      totalIvaCAC += iva;
      totalRecargoCAC += rec;
      totalCAC += tot;
      
      console.log(
        `${(f.SERIEFACTURA || '').padEnd(7)} | ` +
        `${String(f.NUMEROFACTURA).padEnd(7)} | ` +
        `${base.toFixed(2).padStart(12)} | ` +
        `${iva.toFixed(2).padStart(12)} | ` +
        `${rec.toFixed(2).padStart(9)} | ` +
        `${tot.toFixed(2).padStart(12)} | ` +
        `${f.NUM_LINEAS}`
      );
    });
    
    console.log('--------|---------|--------------|--------------|-----------|--------------|-------');
    console.log(
      `TOTAL   |         | ${totalBaseCAC.toFixed(2).padStart(12)} | ` +
      `${totalIvaCAC.toFixed(2).padStart(12)} | ` +
      `${totalRecargoCAC.toFixed(2).padStart(9)} | ` +
      `${totalCAC.toFixed(2).padStart(12)} |`
    );

    console.log(`\n📊 Resumen CAC: ${facturasCAC.length} facturas`);
    console.log(`   Base: ${totalBaseCAC.toFixed(2)} € (Esperado: ${ESPERADO.baseImponible.toFixed(2)} € | Diff: ${(totalBaseCAC - ESPERADO.baseImponible).toFixed(2)} €)`);
    console.log(`   IVA:  ${totalIvaCAC.toFixed(2)} € (Esperado: ${ESPERADO.iva.toFixed(2)} € | Diff: ${(totalIvaCAC - ESPERADO.iva).toFixed(2)} €)`);
    console.log(`   Total: ${totalCAC.toFixed(2)} € (Esperado: ${ESPERADO.total.toFixed(2)} € | Diff: ${(totalCAC - ESPERADO.total).toFixed(2)} €)`);

    // ═══════════════════════════════════════════════════════════════
    // 2. CONSULTA ALTERNATIVA: Desde tabla FACCLI (facturas directas)
    // ═══════════════════════════════════════════════════════════════
    console.log('\n\n═══════════════════════════════════════════════════════════════');
    console.log('2. MÉTODO ALTERNATIVO: Usando tabla FACCLI (facturas)');
    console.log('   (Tabla maestra de facturas con totales precalculados)');
    console.log('═══════════════════════════════════════════════════════════════\n');

    const queryFACCLI = `
      SELECT
        TRIM(SERIEFACTURA) as SERIEFACTURA,
        NUMEROFACTURA,
        EJERCICIOFACTURA,
        FECHAFACTURA,
        TOTALFACTURA as BASE_IMPONIBLE,
        IVAFACTURA as IVA,
        RECARGOFACTURA as RECARGO,
        (TOTALFACTURA + IVAFACTURA + RECARGOFACTURA) as TOTAL
      FROM DSEDAC.FACCLI
      WHERE TRIM(CODIGOCLIENTE) = '${CODIGO_CLIENTE}'
        AND EJERCICIOFACTURA = ${EJERCICIO}
      ORDER BY SERIEFACTURA, NUMEROFACTURA
    `;

    const facturasFACCLI = await pool.query(queryFACCLI);
    
    let totalBaseFACCLI = 0;
    let totalIvaFACCLI = 0;
    let totalRecargoFACCLI = 0;
    let totalFACCLI = 0;

    console.log('Facturas encontradas en FACCLI:');
    console.log('Serie   | Número  | Base Imp.    | IVA          | Recargo   | Total');
    console.log('--------|---------|--------------|--------------|-----------|-------------');
    
    facturasFACCLI.forEach(f => {
      const base = parseFloat(f.BASE_IMPONIBLE) || 0;
      const iva = parseFloat(f.IVA) || 0;
      const rec = parseFloat(f.RECARGO) || 0;
      const tot = parseFloat(f.TOTAL) || 0;
      
      totalBaseFACCLI += base;
      totalIvaFACCLI += iva;
      totalRecargoFACCLI += rec;
      totalFACCLI += tot;
      
      console.log(
        `${(f.SERIEFACTURA || '').padEnd(7)} | ` +
        `${String(f.NUMEROFACTURA).padEnd(7)} | ` +
        `${base.toFixed(2).padStart(12)} | ` +
        `${iva.toFixed(2).padStart(12)} | ` +
        `${rec.toFixed(2).padStart(9)} | ` +
        `${tot.toFixed(2).padStart(12)}`
      );
    });
    
    console.log('--------|---------|--------------|--------------|-----------|-------------');
    console.log(
      `TOTAL   |         | ${totalBaseFACCLI.toFixed(2).padStart(12)} | ` +
      `${totalIvaFACCLI.toFixed(2).padStart(12)} | ` +
      `${totalRecargoFACCLI.toFixed(2).padStart(9)} | ` +
      `${totalFACCLI.toFixed(2).padStart(12)}`
    );

    console.log(`\n📊 Resumen FACCLI: ${facturasFACCLI.length} facturas`);
    console.log(`   Base: ${totalBaseFACCLI.toFixed(2)} € (Esperado: ${ESPERADO.baseImponible.toFixed(2)} € | Diff: ${(totalBaseFACCLI - ESPERADO.baseImponible).toFixed(2)} €)`);
    console.log(`   IVA:  ${totalIvaFACCLI.toFixed(2)} € (Esperado: ${ESPERADO.iva.toFixed(2)} € | Diff: ${(totalIvaFACCLI - ESPERADO.iva).toFixed(2)} €)`);
    console.log(`   Total: ${totalFACCLI.toFixed(2)} € (Esperado: ${ESPERADO.total.toFixed(2)} € | Diff: ${(totalFACCLI - ESPERADO.total).toFixed(2)} €)`);

    // ═══════════════════════════════════════════════════════════════
    // 3. COMPARACIÓN FACTURA POR FACTURA
    // ═══════════════════════════════════════════════════════════════
    console.log('\n\n═══════════════════════════════════════════════════════════════');
    console.log('3. DIFERENCIAS ENTRE CAC Y FACCLI (por factura)');
    console.log('═══════════════════════════════════════════════════════════════\n');

    // Crear mapa de facturas CAC
    const mapCAC = {};
    facturasCAC.forEach(f => {
      const key = `${f.SERIEFACTURA}-${f.NUMEROFACTURA}`;
      mapCAC[key] = f;
    });

    // Crear mapa de facturas FACCLI
    const mapFACCLI = {};
    facturasFACCLI.forEach(f => {
      const key = `${f.SERIEFACTURA}-${f.NUMEROFACTURA}`;
      mapFACCLI[key] = f;
    });

    // Buscar diferencias
    const todasLasKeys = new Set([...Object.keys(mapCAC), ...Object.keys(mapFACCLI)]);
    let hayDiferencias = false;

    console.log('Verificando cada factura...\n');

    todasLasKeys.forEach(key => {
      const cac = mapCAC[key];
      const faccli = mapFACCLI[key];

      if (!cac) {
        console.log(`❌ ${key}: Existe en FACCLI pero NO en CAC`);
        hayDiferencias = true;
        return;
      }

      if (!faccli) {
        console.log(`⚠️  ${key}: Existe en CAC pero NO en FACCLI (posible albarán sin facturar)`);
        hayDiferencias = true;
        return;
      }

      const diffBase = Math.abs((parseFloat(cac.BASE_IMPONIBLE) || 0) - (parseFloat(faccli.BASE_IMPONIBLE) || 0));
      const diffIva = Math.abs((parseFloat(cac.IVA) || 0) - (parseFloat(faccli.IVA) || 0));
      const diffTotal = Math.abs((parseFloat(cac.TOTAL) || 0) - (parseFloat(faccli.TOTAL) || 0));

      if (diffBase > 0.01 || diffIva > 0.01 || diffTotal > 0.01) {
        console.log(`⚠️  ${key}: DIFERENCIAS DETECTADAS`);
        console.log(`     CAC:    Base=${(parseFloat(cac.BASE_IMPONIBLE) || 0).toFixed(2)}, IVA=${(parseFloat(cac.IVA) || 0).toFixed(2)}, Total=${(parseFloat(cac.TOTAL) || 0).toFixed(2)}`);
        console.log(`     FACCLI: Base=${(parseFloat(faccli.BASE_IMPONIBLE) || 0).toFixed(2)}, IVA=${(parseFloat(faccli.IVA) || 0).toFixed(2)}, Total=${(parseFloat(faccli.TOTAL) || 0).toFixed(2)}`);
        console.log(`     Diff:   Base=${diffBase.toFixed(2)}, IVA=${diffIva.toFixed(2)}, Total=${diffTotal.toFixed(2)}`);
        hayDiferencias = true;
      }
    });

    if (!hayDiferencias) {
      console.log('✅ No hay diferencias significativas entre CAC y FACCLI para las facturas individuales.');
    }

    // ═══════════════════════════════════════════════════════════════
    // 4. VERIFICAR SI HAY FACTURAS DUPLICADAS EN CAC
    // ═══════════════════════════════════════════════════════════════
    console.log('\n\n═══════════════════════════════════════════════════════════════');
    console.log('4. FACTURAS CON MÚLTIPLES LÍNEAS EN CAC (posibles duplicados)');
    console.log('═══════════════════════════════════════════════════════════════\n');

    const queryDuplicados = `
      SELECT
        TRIM(C.SERIEFACTURA) as SERIEFACTURA,
        C.NUMEROFACTURA,
        COUNT(*) as NUM_LINEAS,
        COUNT(DISTINCT C.NUMEROALBARAN) as NUM_ALBARANES,
        SUM(C.IMPORTETOTAL) as TOTAL_SUMADO
      FROM DSEDAC.CAC C
      WHERE TRIM(C.CODIGOCLIENTEFACTURA) = '${CODIGO_CLIENTE}'
        AND C.ANOFACTURA = ${EJERCICIO}
        AND C.NUMEROFACTURA > 0
      GROUP BY
        TRIM(C.SERIEFACTURA),
        C.NUMEROFACTURA
      HAVING COUNT(*) > 1
      ORDER BY NUM_LINEAS DESC
    `;

    const duplicados = await pool.query(queryDuplicados);

    if (duplicados.length > 0) {
      console.log('Facturas con múltiples registros en CAC:');
      console.log('Serie   | Número  | Líneas | Albaranes | Total Sumado');
      console.log('--------|---------|--------|-----------|-------------');
      duplicados.forEach(d => {
        console.log(
          `${(d.SERIEFACTURA || '').padEnd(7)} | ` +
          `${String(d.NUMEROFACTURA).padEnd(7)} | ` +
          `${String(d.NUM_LINEAS).padEnd(6)} | ` +
          `${String(d.NUM_ALBARANES).padEnd(9)} | ` +
          `${(parseFloat(d.TOTAL_SUMADO) || 0).toFixed(2)}`
        );
      });
      console.log('\n⚠️  Estas facturas tienen múltiples líneas - si la query no agrupa correctamente, puede causar duplicados.');
    } else {
      console.log('✅ No hay facturas con múltiples líneas en CAC.');
    }

    // ═══════════════════════════════════════════════════════════════
    // 5. RESUMEN FINAL Y RECOMENDACIÓN
    // ═══════════════════════════════════════════════════════════════
    console.log('\n\n╔══════════════════════════════════════════════════════════════════╗');
    console.log('║  RESUMEN FINAL                                                   ║');
    console.log('╚══════════════════════════════════════════════════════════════════╝\n');

    console.log('                    | CAC (actual) | FACCLI       | Esperado     | Mejor Match');
    console.log('--------------------|--------------|--------------|--------------|------------');
    
    const diffCACBase = Math.abs(totalBaseCAC - ESPERADO.baseImponible);
    const diffFACCLIBase = Math.abs(totalBaseFACCLI - ESPERADO.baseImponible);
    const mejorBase = diffCACBase < diffFACCLIBase ? 'CAC' : 'FACCLI';
    
    const diffCACIva = Math.abs(totalIvaCAC - ESPERADO.iva);
    const diffFACCLIIva = Math.abs(totalIvaFACCLI - ESPERADO.iva);
    const mejorIva = diffCACIva < diffFACCLIIva ? 'CAC' : 'FACCLI';
    
    const diffCACTotal = Math.abs(totalCAC - ESPERADO.total);
    const diffFACCLITotal = Math.abs(totalFACCLI - ESPERADO.total);
    const mejorTotal = diffCACTotal < diffFACCLITotal ? 'CAC' : 'FACCLI';

    console.log(`Base Imponible      | ${totalBaseCAC.toFixed(2).padStart(12)} | ${totalBaseFACCLI.toFixed(2).padStart(12)} | ${ESPERADO.baseImponible.toFixed(2).padStart(12)} | ${mejorBase}`);
    console.log(`IVA                 | ${totalIvaCAC.toFixed(2).padStart(12)} | ${totalIvaFACCLI.toFixed(2).padStart(12)} | ${ESPERADO.iva.toFixed(2).padStart(12)} | ${mejorIva}`);
    console.log(`Total               | ${totalCAC.toFixed(2).padStart(12)} | ${totalFACCLI.toFixed(2).padStart(12)} | ${ESPERADO.total.toFixed(2).padStart(12)} | ${mejorTotal}`);
    
    console.log('\n📋 RECOMENDACIÓN:');
    if (mejorBase === 'FACCLI' && mejorIva === 'FACCLI' && mejorTotal === 'FACCLI') {
      console.log('   → Usar tabla FACCLI en lugar de CAC para obtener los datos del libro de IVA.');
    } else if (mejorBase === 'CAC' && mejorIva === 'CAC' && mejorTotal === 'CAC') {
      console.log('   → La tabla CAC es más precisa. Revisar si hay algún problema de agrupación.');
    } else {
      console.log('   → Las diferencias son mixtas. Investigar más a fondo cada tabla.');
    }

    console.log('\n✓ Diagnóstico completado\n');

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

diagnosticar().catch(console.error);
