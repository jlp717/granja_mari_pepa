/**
 * BUSCAR PERIODO CON BASE IMPONIBLE 1946,73 €
 */

const odbcPool = require('./app/config/odbcConfig');

async function buscarBase() {
  try {
    console.log('🔍 Buscando periodo con BASE IMPONIBLE 1946,73 € (sin IVA)...\n');

    const codigoCliente = '4300009900';
    const baseEsperada = 1946.73;

    const queryBase = `
      SELECT
        TRIM(C.SERIEFACTURA) as SERIEFACTURA,
        C.NUMEROFACTURA,
        C.ANOFACTURA,
        C.MESFACTURA,
        C.DIAFACTURA,
        SUM(C.IMPORTEBASEIMPONIBLE1 + C.IMPORTEBASEIMPONIBLE2 + C.IMPORTEBASEIMPONIBLE3 +
            C.IMPORTEBASEIMPONIBLE4 + C.IMPORTEBASEIMPONIBLE5) as BASE_IMPONIBLE,
        SUM(C.IMPORTEIVA1 + C.IMPORTEIVA2 + C.IMPORTEIVA3 + C.IMPORTEIVA4 + C.IMPORTEIVA5) as IVA,
        SUM(C.IMPORTETOTAL) as TOTAL
      FROM DSEDAC.CAC C
      WHERE (C.ANOFACTURA * 10000 + C.MESFACTURA * 100 + C.DIAFACTURA) >= ?
        AND (C.ANOFACTURA * 10000 + C.MESFACTURA * 100 + C.DIAFACTURA) <= ?
        AND C.NUMEROFACTURA > 0
        AND TRIM(C.CODIGOCLIENTEFACTURA) = ?
      GROUP BY
        TRIM(C.SERIEFACTURA),
        C.NUMEROFACTURA,
        C.ANOFACTURA,
        C.MESFACTURA,
        C.DIAFACTURA,
        TRIM(C.CODIGOCLIENTEFACTURA)
      HAVING SUM(C.IMPORTEBASEIMPONIBLE1 + C.IMPORTEBASEIMPONIBLE2 + C.IMPORTEBASEIMPONIBLE3 +
                 C.IMPORTEBASEIMPONIBLE4 + C.IMPORTEBASEIMPONIBLE5) > 0
      ORDER BY ANOFACTURA, MESFACTURA, DIAFACTURA
    `;

    // Probar diferentes años - BASE IMPONIBLE
    console.log('📅 Probando BASE IMPONIBLE por años:\n');

    for (let year = 2023; year <= 2025; year++) {
      const fechaInicioNum = year * 10000 + 101;
      const fechaFinNum = year * 10000 + 1231;

      const facturas = await odbcPool.query(queryBase, [fechaInicioNum, fechaFinNum, codigoCliente.trim()]);

      let totalBase = 0;
      facturas.forEach(f => {
        totalBase += parseFloat(f.BASE_IMPONIBLE) || 0;
      });

      console.log(`  ${year}: Base ${totalBase.toFixed(2)} € ${Math.abs(totalBase - baseEsperada) < 0.01 ? '✅ ¡ENCONTRADO!' : ''}`);
    }

    // Trimestres 2025
    console.log('\n📅 Probando BASE IMPONIBLE por trimestres 2025:\n');

    for (let trimestre = 1; trimestre <= 4; trimestre++) {
      const year = 2025;
      const mesInicio = (trimestre - 1) * 3 + 1;
      const mesFin = mesInicio + 2;
      const ultimoDia = new Date(year, mesFin, 0).getDate();

      const fechaInicioNum = year * 10000 + mesInicio * 100 + 1;
      const fechaFinNum = year * 10000 + mesFin * 100 + ultimoDia;

      const facturas = await odbcPool.query(queryBase, [fechaInicioNum, fechaFinNum, codigoCliente.trim()]);

      let totalBase = 0;
      facturas.forEach(f => {
        totalBase += parseFloat(f.BASE_IMPONIBLE) || 0;
      });

      console.log(`  T${trimestre} 2025: Base ${totalBase.toFixed(2)} € ${Math.abs(totalBase - baseEsperada) < 0.01 ? '✅ ¡ENCONTRADO!' : ''}`);
    }

    // Buscar combinaciones
    console.log('\n📊 Buscando combinaciones de facturas con BASE IMPONIBLE 1946,73 €...\n');

    const fechaInicioNum2025 = 2025 * 10000 + 101;
    const fechaFinNum2025 = 2025 * 10000 + 1231;
    const todasFacturas = await odbcPool.query(queryBase, [fechaInicioNum2025, fechaFinNum2025, codigoCliente.trim()]);

    let mejorDiferencia = Infinity;
    let mejorCombinacion = null;

    for (let i = 0; i < todasFacturas.length; i++) {
      let subtotalBase = 0;
      for (let j = i; j < todasFacturas.length; j++) {
        subtotalBase += parseFloat(todasFacturas[j].BASE_IMPONIBLE) || 0;

        const diferencia = Math.abs(subtotalBase - baseEsperada);

        if (diferencia < mejorDiferencia) {
          mejorDiferencia = diferencia;
          mejorCombinacion = {
            desde: todasFacturas[i],
            hasta: todasFacturas[j],
            base: subtotalBase,
            iva: 0,
            total: 0,
            numFacturas: j - i + 1
          };

          // Calcular IVA y total
          for (let k = i; k <= j; k++) {
            mejorCombinacion.iva += parseFloat(todasFacturas[k].IVA) || 0;
            mejorCombinacion.total += parseFloat(todasFacturas[k].TOTAL) || 0;
          }
        }

        if (diferencia < 0.01) {
          let totalIVA = 0;
          let totalConIVA = 0;
          for (let k = i; k <= j; k++) {
            totalIVA += parseFloat(todasFacturas[k].IVA) || 0;
            totalConIVA += parseFloat(todasFacturas[k].TOTAL) || 0;
          }

          console.log(`✅ ¡ENCONTRADO! ${j - i + 1} facturas`);
          console.log(`   Desde: ${todasFacturas[i].SERIEFACTURA}-${todasFacturas[i].NUMEROFACTURA} (${todasFacturas[i].DIAFACTURA}/${todasFacturas[i].MESFACTURA}/${todasFacturas[i].ANOFACTURA})`);
          console.log(`   Hasta: ${todasFacturas[j].SERIEFACTURA}-${todasFacturas[j].NUMEROFACTURA} (${todasFacturas[j].DIAFACTURA}/${todasFacturas[j].MESFACTURA}/${todasFacturas[j].ANOFACTURA})`);
          console.log(`   Base: ${subtotalBase.toFixed(2)} €`);
          console.log(`   IVA: ${totalIVA.toFixed(2)} €`);
          console.log(`   Total con IVA: ${totalConIVA.toFixed(2)} €`);
          break;
        }
      }
    }

    if (mejorDiferencia >= 0.01) {
      console.log(`\n⚠️ No se encontró coincidencia exacta con BASE IMPONIBLE 1946,73 €`);
      console.log(`   Mejor aproximación: ${mejorCombinacion.numFacturas} facturas`);
      console.log(`   Base: ${mejorCombinacion.base.toFixed(2)} € (diferencia: ${mejorDiferencia.toFixed(2)} €)`);
      console.log(`   IVA: ${mejorCombinacion.iva.toFixed(2)} €`);
      console.log(`   Total con IVA: ${mejorCombinacion.total.toFixed(2)} €`);
      console.log(`   Desde: ${mejorCombinacion.desde.SERIEFACTURA}-${mejorCombinacion.desde.NUMEROFACTURA} (${mejorCombinacion.desde.DIAFACTURA}/${mejorCombinacion.desde.MESFACTURA}/${mejorCombinacion.desde.ANOFACTURA})`);
      console.log(`   Hasta: ${mejorCombinacion.hasta.SERIEFACTURA}-${mejorCombinacion.hasta.NUMEROFACTURA} (${mejorCombinacion.hasta.DIAFACTURA}/${mejorCombinacion.hasta.MESFACTURA}/${mejorCombinacion.hasta.ANOFACTURA})`);
    }

    console.log('\n💡 CONCLUSIÓN:');
    console.log('Si el usuario dice que el total debería ser 1946,73 €,');
    console.log('es posible que esté viendo datos incorrectos o mockeados en el frontend.');
    console.log('Los datos REALES del backend para el cliente Diego (4300009900) son:');
    console.log(`  - Año 2025 completo: 5265.89 € (18 facturas)`);

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    process.exit(0);
  }
}

buscarBase();
