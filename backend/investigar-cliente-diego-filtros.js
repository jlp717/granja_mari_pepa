/**
 * SCRIPT DE INVESTIGACIÓN: Filtros para Cliente Diego
 * ====================================================
 * Cliente: 4300009900 (Diego)
 * Objetivo: Encontrar qué filtros dan exactamente 1946.73 € para 2025
 */

const odbcPool = require('./app/config/odbcConfig');

async function investigarFiltros() {
  try {
    console.log('🔍 INVESTIGACIÓN: Filtros para Libro de IVA - Cliente Diego\n');
    console.log('═'.repeat(80));

    const codigoCliente = '4300009900';
    const ejercicio = 2025;
    const totalEsperado = 1946.73;

    // PASO 1: Ver todas las facturas agrupadas por tipo y serie
    console.log('\n📊 PASO 1: Facturas agrupadas por SERIE y TIPO\n');

    const queryTipos = `
      SELECT
        SERIEFACTURA,
        CODIGOTIPOALBARAN,
        COUNT(*) as NUM_FACTURAS,
        SUM(
          IMPORTEBASEIMPONIBLE1 + IMPORTEBASEIMPONIBLE2 + IMPORTEBASEIMPONIBLE3 +
          IMPORTEBASEIMPONIBLE4 + IMPORTEBASEIMPONIBLE5
        ) as BASE_TOTAL,
        SUM(
          IMPORTEIVA1 + IMPORTEIVA2 + IMPORTEIVA3 + IMPORTEIVA4 + IMPORTEIVA5
        ) as IVA_TOTAL,
        SUM(IMPORTETOTAL) as TOTAL
      FROM DSEDAC.CAC
      WHERE TRIM(CODIGOCLIENTEFACTURA) = ?
        AND EJERCICIOFACTURA = ?
        AND NUMEROFACTURA > 0
      GROUP BY SERIEFACTURA, CODIGOTIPOALBARAN
      ORDER BY SERIEFACTURA, CODIGOTIPOALBARAN
    `;

    const tipos = await odbcPool.query(queryTipos, [codigoCliente.trim(), ejercicio]);

    console.log('Serie | Tipo  | Facturas | Base        | IVA        | Total');
    console.log('─'.repeat(75));

    tipos.forEach(t => {
      const serie = (t.SERIEFACTURA || '?').padEnd(5);
      const tipo = (t.CODIGOTIPOALBARAN || 'N/A').toString().padEnd(6);
      const num = t.NUM_FACTURAS.toString().padStart(8);
      const base = t.BASE_TOTAL.toFixed(2).padStart(11);
      const iva = t.IVA_TOTAL.toFixed(2).padStart(10);
      const total = t.TOTAL.toFixed(2).padStart(11);

      console.log(`${serie} | ${tipo} | ${num} | ${base} | ${iva} | ${total}`);
    });

    // PASO 2: Probar diferentes combinaciones de filtros
    console.log('\n\n🔍 PASO 2: Probando combinaciones de filtros\n');

    const combinaciones = [
      { nombre: 'TODO (sin filtros)', filtro: '' },
      { nombre: 'Solo serie F', filtro: "AND SERIEFACTURA = 'F'" },
      { nombre: 'Solo serie A', filtro: "AND SERIEFACTURA = 'A'" },
      { nombre: 'Solo serie N', filtro: "AND SERIEFACTURA = 'N'" },
      { nombre: 'Series F+A+N (facturas válidas)', filtro: "AND SERIEFACTURA IN ('F', 'A', 'N')" },
      { nombre: 'Excluir serie D', filtro: "AND SERIEFACTURA != 'D'" },
      { nombre: 'Solo tipo 347', filtro: "AND CODIGOTIPOALBARAN = '347'" },
      { nombre: 'Solo tipo P', filtro: "AND CODIGOTIPOALBARAN = 'P'" },
      { nombre: 'F+A+N + tipo 347', filtro: "AND SERIEFACTURA IN ('F', 'A', 'N') AND CODIGOTIPOALBARAN = '347'" },
      { nombre: 'F+A+N + tipo P', filtro: "AND SERIEFACTURA IN ('F', 'A', 'N') AND CODIGOTIPOALBARAN = 'P'" },
      { nombre: 'Excluir D + tipo 347', filtro: "AND SERIEFACTURA != 'D' AND CODIGOTIPOALBARAN = '347'" },
      { nombre: 'Solo F + tipo 347', filtro: "AND SERIEFACTURA = 'F' AND CODIGOTIPOALBARAN = '347'" },
    ];

    console.log('Filtro                                  | Base        | IVA        | Total        | Match');
    console.log('─'.repeat(95));

    for (const combo of combinaciones) {
      // Primero, contar con GROUP BY
      const queryCombo = `
        SELECT
          SUM(BASE_IMPONIBLE) as BASE_TOTAL,
          SUM(IVA) as IVA_TOTAL,
          SUM(TOTAL) as TOTAL_GENERAL,
          COUNT(*) as NUM_FACTURAS
        FROM (
          SELECT
            TRIM(C.SERIEFACTURA) as SERIEFACTURA,
            C.NUMEROFACTURA,
            SUM(C.IMPORTEBASEIMPONIBLE1 + C.IMPORTEBASEIMPONIBLE2 + C.IMPORTEBASEIMPONIBLE3 +
                C.IMPORTEBASEIMPONIBLE4 + C.IMPORTEBASEIMPONIBLE5) as BASE_IMPONIBLE,
            SUM(C.IMPORTEIVA1 + C.IMPORTEIVA2 + C.IMPORTEIVA3 + C.IMPORTEIVA4 + C.IMPORTEIVA5) as IVA,
            SUM(C.IMPORTETOTAL) as TOTAL
          FROM DSEDAC.CAC C
          WHERE TRIM(C.CODIGOCLIENTEFACTURA) = ?
            AND C.EJERCICIOFACTURA = ?
            AND C.NUMEROFACTURA > 0
            ${combo.filtro}
          GROUP BY TRIM(C.SERIEFACTURA), C.NUMEROFACTURA, C.ANOFACTURA, C.MESFACTURA, C.DIAFACTURA, TRIM(C.CODIGOCLIENTEFACTURA)
          HAVING SUM(C.IMPORTEBASEIMPONIBLE1 + C.IMPORTEBASEIMPONIBLE2 + C.IMPORTEBASEIMPONIBLE3 +
                     C.IMPORTEBASEIMPONIBLE4 + C.IMPORTEBASEIMPONIBLE5) > 0
        ) AS FACTURAS
      `;

      const resultado = await odbcPool.query(queryCombo, [codigoCliente.trim(), ejercicio]);

      const base = (resultado[0]?.BASE_TOTAL || 0).toFixed(2).padStart(11);
      const iva = (resultado[0]?.IVA_TOTAL || 0).toFixed(2).padStart(10);
      const total = resultado[0]?.TOTAL_GENERAL || 0;
      const totalStr = total.toFixed(2).padStart(12);
      const match = Math.abs(total - totalEsperado) < 0.01 ? '✅ ¡ENCONTRADO!' : '';

      const nombreFiltro = combo.nombre.padEnd(40);
      console.log(`${nombreFiltro} | ${base} | ${iva} | ${totalStr} | ${match}`);
    }

    // PASO 3: Buscar el más cercano si no hay match exacto
    console.log('\n\n📊 PASO 3: Búsqueda del total más cercano a 1946.73 €\n');

    // Obtener todas las facturas con GROUP BY
    const queryTodas = `
      SELECT
        TRIM(C.SERIEFACTURA) as SERIEFACTURA,
        C.NUMEROFACTURA,
        C.ANOFACTURA,
        C.MESFACTURA,
        C.DIAFACTURA,
        C.CODIGOTIPOALBARAN,
        SUM(C.IMPORTEBASEIMPONIBLE1 + C.IMPORTEBASEIMPONIBLE2 + C.IMPORTEBASEIMPONIBLE3 +
            C.IMPORTEBASEIMPONIBLE4 + C.IMPORTEBASEIMPONIBLE5) as BASE_IMPONIBLE,
        SUM(C.IMPORTEIVA1 + C.IMPORTEIVA2 + C.IMPORTEIVA3 + C.IMPORTEIVA4 + C.IMPORTEIVA5) as IVA,
        SUM(C.IMPORTETOTAL) as TOTAL
      FROM DSEDAC.CAC C
      WHERE TRIM(C.CODIGOCLIENTEFACTURA) = ?
        AND C.EJERCICIOFACTURA = ?
        AND C.NUMEROFACTURA > 0
      GROUP BY
        TRIM(C.SERIEFACTURA),
        C.NUMEROFACTURA,
        C.ANOFACTURA,
        C.MESFACTURA,
        C.DIAFACTURA,
        TRIM(C.CODIGOCLIENTEFACTURA),
        C.CODIGOTIPOALBARAN
      HAVING SUM(C.IMPORTEBASEIMPONIBLE1 + C.IMPORTEBASEIMPONIBLE2 + C.IMPORTEBASEIMPONIBLE3 +
                 C.IMPORTEBASEIMPONIBLE4 + C.IMPORTEBASEIMPONIBLE5) > 0
      ORDER BY ANOFACTURA, MESFACTURA, DIAFACTURA, SERIEFACTURA, NUMEROFACTURA
    `;

    const todasFacturas = await odbcPool.query(queryTodas, [codigoCliente.trim(), ejercicio]);

    console.log(`Total de facturas únicas (con GROUP BY): ${todasFacturas.length}`);

    // Buscar combinación que sume exactamente 1946.73
    let mejorDiferencia = Infinity;
    let mejorCombinacion = null;

    for (let i = 0; i < todasFacturas.length; i++) {
      let subtotalBase = 0;
      let subtotalIVA = 0;
      let subtotalTotal = 0;

      for (let j = i; j < todasFacturas.length; j++) {
        subtotalBase += parseFloat(todasFacturas[j].BASE_IMPONIBLE) || 0;
        subtotalIVA += parseFloat(todasFacturas[j].IVA) || 0;
        subtotalTotal += parseFloat(todasFacturas[j].TOTAL) || 0;

        const diferencia = Math.abs(subtotalTotal - totalEsperado);

        if (diferencia < mejorDiferencia) {
          mejorDiferencia = diferencia;
          mejorCombinacion = {
            desde: todasFacturas[i],
            hasta: todasFacturas[j],
            base: subtotalBase,
            iva: subtotalIVA,
            total: subtotalTotal,
            numFacturas: j - i + 1
          };
        }

        if (diferencia < 0.01) {
          console.log('\n✅ ¡COMBINACIÓN ENCONTRADA!');
          console.log(`   ${j - i + 1} facturas desde ${todasFacturas[i].SERIEFACTURA}-${todasFacturas[i].NUMEROFACTURA} hasta ${todasFacturas[j].SERIEFACTURA}-${todasFacturas[j].NUMEROFACTURA}`);
          console.log(`   Base:  ${subtotalBase.toFixed(2)} €`);
          console.log(`   IVA:   ${subtotalIVA.toFixed(2)} €`);
          console.log(`   Total: ${subtotalTotal.toFixed(2)} €`);

          // Mostrar series y tipos involucrados
          const seriesInvolucradas = new Set();
          const tiposInvolucrados = new Set();
          for (let k = i; k <= j; k++) {
            seriesInvolucradas.add(todasFacturas[k].SERIEFACTURA);
            tiposInvolucrados.add(todasFacturas[k].CODIGOTIPOALBARAN);
          }
          console.log(`\n   Series: ${Array.from(seriesInvolucradas).join(', ')}`);
          console.log(`   Tipos:  ${Array.from(tiposInvolucrados).join(', ')}`);

          break;
        }
      }

      if (mejorDiferencia < 0.01) break;
    }

    if (mejorDiferencia >= 0.01) {
      console.log('\n⚠️  No se encontró combinación exacta.');
      console.log(`   Mejor aproximación (diferencia: ${mejorDiferencia.toFixed(2)} €):`);
      console.log(`   ${mejorCombinacion.numFacturas} facturas`);
      console.log(`   Base:  ${mejorCombinacion.base.toFixed(2)} €`);
      console.log(`   IVA:   ${mejorCombinacion.iva.toFixed(2)} €`);
      console.log(`   Total: ${mejorCombinacion.total.toFixed(2)} €`);
    }

    console.log('\n═'.repeat(80));
    console.log('📌 CONCLUSIÓN:');
    console.log('   Revisar los resultados anteriores para determinar qué filtros aplicar');
    console.log('   en el controller libroIvaController.js');
    console.log('═'.repeat(80));

  } catch (error) {
    console.error('❌ ERROR:', error.message);
    console.error(error.stack);
  } finally {
    process.exit(0);
  }
}

// Ejecutar
investigarFiltros();
