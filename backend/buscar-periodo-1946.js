/**
 * BUSCAR PERIODO CON TOTAL 1946,73 €
 * ====================================
 * El usuario dice que el libro de IVA del cliente Diego debería tener 1946,73 €
 * Vamos a buscar en diferentes periodos para encontrarlo
 */

const odbcPool = require('./app/config/odbcConfig');

async function buscarPeriodo() {
  try {
    console.log('🔍 Buscando periodo con total 1946,73 € para cliente Diego...\n');

    const codigoCliente = '4300009900';
    const totalEsperado = 1946.73;

    // Query base con GROUP BY
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

    // Probar diferentes años
    console.log('📅 Probando diferentes años:\n');

    for (let year = 2023; year <= 2025; year++) {
      const fechaInicioNum = year * 10000 + 101;
      const fechaFinNum = year * 10000 + 1231;

      const facturas = await odbcPool.query(queryBase, [fechaInicioNum, fechaFinNum, codigoCliente.trim()]);

      let total = 0;
      facturas.forEach(f => {
        total += parseFloat(f.TOTAL) || 0;
      });

      console.log(`  ${year}: ${facturas.length} facturas - Total: ${total.toFixed(2)} €${Math.abs(total - totalEsperado) < 0.01 ? ' ✅ ¡ENCONTRADO!' : ''}`);
    }

    // Probar trimestres de 2024 y 2025
    console.log('\n📅 Probando trimestres de 2024:\n');

    for (let trimestre = 1; trimestre <= 4; trimestre++) {
      const year = 2024;
      const mesInicio = (trimestre - 1) * 3 + 1;
      const mesFin = mesInicio + 2;
      const ultimoDia = new Date(year, mesFin, 0).getDate();

      const fechaInicioNum = year * 10000 + mesInicio * 100 + 1;
      const fechaFinNum = year * 10000 + mesFin * 100 + ultimoDia;

      const facturas = await odbcPool.query(queryBase, [fechaInicioNum, fechaFinNum, codigoCliente.trim()]);

      let total = 0;
      facturas.forEach(f => {
        total += parseFloat(f.TOTAL) || 0;
      });

      console.log(`  T${trimestre} 2024: ${facturas.length} facturas - Total: ${total.toFixed(2)} €${Math.abs(total - totalEsperado) < 0.01 ? ' ✅ ¡ENCONTRADO!' : ''}`);
    }

    console.log('\n📅 Probando trimestres de 2025:\n');

    for (let trimestre = 1; trimestre <= 4; trimestre++) {
      const year = 2025;
      const mesInicio = (trimestre - 1) * 3 + 1;
      const mesFin = mesInicio + 2;
      const ultimoDia = new Date(year, mesFin, 0).getDate();

      const fechaInicioNum = year * 10000 + mesInicio * 100 + 1;
      const fechaFinNum = year * 10000 + mesFin * 100 + ultimoDia;

      const facturas = await odbcPool.query(queryBase, [fechaInicioNum, fechaFinNum, codigoCliente.trim()]);

      let total = 0;
      facturas.forEach(f => {
        total += parseFloat(f.TOTAL) || 0;
      });

      console.log(`  T${trimestre} 2025: ${facturas.length} facturas - Total: ${total.toFixed(2)} €${Math.abs(total - totalEsperado) < 0.01 ? ' ✅ ¡ENCONTRADO!' : ''}`);
    }

    // Probar meses de 2025
    console.log('\n📅 Probando meses de 2025:\n');

    const meses = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];

    for (let mes = 1; mes <= 12; mes++) {
      const year = 2025;
      const ultimoDia = new Date(year, mes, 0).getDate();

      const fechaInicioNum = year * 10000 + mes * 100 + 1;
      const fechaFinNum = year * 10000 + mes * 100 + ultimoDia;

      const facturas = await odbcPool.query(queryBase, [fechaInicioNum, fechaFinNum, codigoCliente.trim()]);

      let total = 0;
      facturas.forEach(f => {
        total += parseFloat(f.TOTAL) || 0;
      });

      if (facturas.length > 0) {
        console.log(`  ${meses[mes-1]} 2025: ${facturas.length} facturas - Total: ${total.toFixed(2)} €${Math.abs(total - totalEsperado) < 0.01 ? ' ✅ ¡ENCONTRADO!' : ''}`);
      }
    }

    console.log('\n📊 Buscando combinaciones de facturas que sumen 1946,73 €...\n');

    // Obtener todas las facturas de 2025
    const fechaInicioNum2025 = 2025 * 10000 + 101;
    const fechaFinNum2025 = 2025 * 10000 + 1231;
    const todasFacturas = await odbcPool.query(queryBase, [fechaInicioNum2025, fechaFinNum2025, codigoCliente.trim()]);

    // Buscar combinaciones que sumen cerca de 1946.73
    let mejorDiferencia = Infinity;
    let mejorCombinacion = null;

    for (let i = 0; i < todasFacturas.length; i++) {
      let subtotal = 0;
      for (let j = i; j < todasFacturas.length; j++) {
        subtotal += parseFloat(todasFacturas[j].TOTAL) || 0;

        const diferencia = Math.abs(subtotal - totalEsperado);

        if (diferencia < mejorDiferencia) {
          mejorDiferencia = diferencia;
          mejorCombinacion = {
            desde: todasFacturas[i],
            hasta: todasFacturas[j],
            total: subtotal,
            numFacturas: j - i + 1
          };
        }

        // Si encontramos una coincidencia exacta (diferencia < 0.01)
        if (diferencia < 0.01) {
          console.log(`✅ ¡ENCONTRADO! Facturas desde ${todasFacturas[i].SERIEFACTURA}-${todasFacturas[i].NUMEROFACTURA} hasta ${todasFacturas[j].SERIEFACTURA}-${todasFacturas[j].NUMEROFACTURA}`);
          console.log(`   Total: ${subtotal.toFixed(2)} € (${j - i + 1} facturas)`);
          break;
        }
      }
    }

    if (mejorDiferencia >= 0.01) {
      console.log(`\n⚠️ No se encontró coincidencia exacta.`);
      console.log(`   Mejor aproximación: ${mejorCombinacion.numFacturas} facturas - Total: ${mejorCombinacion.total.toFixed(2)} € (diferencia: ${mejorDiferencia.toFixed(2)} €)`);
      console.log(`   Desde: ${mejorCombinacion.desde.SERIEFACTURA}-${mejorCombinacion.desde.NUMEROFACTURA} (${mejorCombinacion.desde.DIAFACTURA}/${mejorCombinacion.desde.MESFACTURA}/${mejorCombinacion.desde.ANOFACTURA})`);
      console.log(`   Hasta: ${mejorCombinacion.hasta.SERIEFACTURA}-${mejorCombinacion.hasta.NUMEROFACTURA} (${mejorCombinacion.hasta.DIAFACTURA}/${mejorCombinacion.hasta.MESFACTURA}/${mejorCombinacion.hasta.ANOFACTURA})`);
    }

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    process.exit(0);
  }
}

buscarPeriodo();
