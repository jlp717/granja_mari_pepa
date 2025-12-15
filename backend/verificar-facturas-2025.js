require('dotenv').config();
const odbc = require('odbc');

async function verificarFacturas() {
  let connection;
  
  try {
    const codigoCliente = '4300009900';
    const año = 2025;
    
    console.log(`🔍 Verificando facturas para cliente ${codigoCliente} en ${año}...\n`);
    
    connection = await odbc.connect(process.env.ODBC_CONNECTION_STRING);
    
    // Query para facturas con IVA repercutido
    // Nota: CAC es tabla de ALBARANES, necesitamos filtrar por los que tienen factura
    const facturas = await connection.query(`
      SELECT DISTINCT
        TRIM(CAC.SUBEMPRESAFACTURA) AS SUBEMPRESA,
        CAC.EJERCICIOFACTURA AS EJERCICIO,
        TRIM(CAC.SERIEFACTURA) AS SERIE,
        CAC.NUMEROFACTURA AS NUMERO,
        TRIM(CAC.CODIGOCLIENTEFACTURA) AS CODIGOCLIENTE,
        CAC.ANOFACTURA,
        CAC.MESFACTURA,
        CAC.DIAFACTURA,
        DATE(DIGITS(CAC.ANOFACTURA) || '-' || 
             LPAD(TRIM(CHAR(CAC.MESFACTURA)), 2, '0') || '-' || 
             LPAD(TRIM(CHAR(CAC.DIAFACTURA)), 2, '0')) AS FECHA,
        (CAC.IMPORTEBASEIMPONIBLE1 + CAC.IMPORTEBASEIMPONIBLE2 + 
         CAC.IMPORTEBASEIMPONIBLE3 + CAC.IMPORTEBASEIMPONIBLE4 + 
         CAC.IMPORTEBASEIMPONIBLE5) AS BASE_IMPONIBLE,
        (CAC.IMPORTEIVA1 + CAC.IMPORTEIVA2 + CAC.IMPORTEIVA3 + 
         CAC.IMPORTEIVA4 + CAC.IMPORTEIVA5) AS IVA_TOTAL,
        (CAC.IMPORTERECARGO1 + CAC.IMPORTERECARGO2 + CAC.IMPORTERECARGO3 + 
         CAC.IMPORTERECARGO4 + CAC.IMPORTERECARGO5) AS RECARGO,
        CAC.IMPORTETOTAL AS TOTAL,
        CAC.PORCENTAJEIVA1,
        CAC.IMPORTEBASEIMPONIBLE1,
        CAC.IMPORTEIVA1,
        CAC.PORCENTAJEIVA2,
        CAC.IMPORTEBASEIMPONIBLE2,
        CAC.IMPORTEIVA2,
        CAC.PORCENTAJEIVA3,
        CAC.IMPORTEBASEIMPONIBLE3,
        CAC.IMPORTEIVA3,
        CAC.PORCENTAJEIVA4,
        CAC.IMPORTEBASEIMPONIBLE4,
        CAC.IMPORTEIVA4,
        CAC.PORCENTAJEIVA5,
        CAC.IMPORTEBASEIMPONIBLE5,
        CAC.IMPORTEIVA5
      FROM CAC
      WHERE 
        TRIM(CAC.CODIGOCLIENTEFACTURA) = ?
        AND CAC.EJERCICIOFACTURA = ?
        AND CAC.NUMEROFACTURA > 0
      ORDER BY CAC.ANOFACTURA DESC, CAC.MESFACTURA DESC, CAC.DIAFACTURA DESC, CAC.NUMEROFACTURA DESC
    `, [codigoCliente, año]);
    
    if (facturas.length === 0) {
      console.log('❌ No se encontraron facturas para este cliente y año');
      await connection.close();
      return;
    }
    
    console.log(`✅ Encontradas ${facturas.length} facturas\n`);
    
    let totalBase = 0;
    let totalIVA = 0;
    let totalGeneral = 0;
    
    console.log('📋 Detalle de facturas:\n');
    
    facturas.forEach((factura, index) => {
      const numeroFactura = `${factura.SUBEMPRESA}-${factura.SERIE}${factura.NUMERO}`;
      const base = parseFloat(factura.BASE_IMPONIBLE) || 0;
      const total = parseFloat(factura.TOTAL) || 0;
      const iva = parseFloat(factura.IVA_TOTAL) || 0;
      const recargo = parseFloat(factura.RECARGO) || 0;
      
      console.log(`${index + 1}. Factura ${numeroFactura}`);
      console.log(`   Fecha: ${new Date(factura.FECHA).toLocaleDateString('es-ES')}`);
      console.log(`   Base Imponible: ${base.toFixed(2)}€`);
      
      // Mostrar desglose de IVA
      if (factura.PORCENTAJEIVA1 > 0) {
        console.log(`     - IVA ${factura.PORCENTAJEIVA1}%: Base ${factura.IMPORTEBASEIMPONIBLE1.toFixed(2)}€, Cuota ${factura.IMPORTEIVA1.toFixed(2)}€`);
      }
      if (factura.PORCENTAJEIVA2 > 0) {
        console.log(`     - IVA ${factura.PORCENTAJEIVA2}%: Base ${factura.IMPORTEBASEIMPONIBLE2.toFixed(2)}€, Cuota ${factura.IMPORTEIVA2.toFixed(2)}€`);
      }
      if (factura.PORCENTAJEIVA3 > 0) {
        console.log(`     - IVA ${factura.PORCENTAJEIVA3}%: Base ${factura.IMPORTEBASEIMPONIBLE3.toFixed(2)}€, Cuota ${factura.IMPORTEIVA3.toFixed(2)}€`);
      }
      if (factura.PORCENTAJEIVA4 > 0) {
        console.log(`     - IVA ${factura.PORCENTAJEIVA4}%: Base ${factura.IMPORTEBASEIMPONIBLE4.toFixed(2)}€, Cuota ${factura.IMPORTEIVA4.toFixed(2)}€`);
      }
      if (factura.PORCENTAJEIVA5 > 0) {
        console.log(`     - IVA ${factura.PORCENTAJEIVA5}%: Base ${factura.IMPORTEBASEIMPONIBLE5.toFixed(2)}€, Cuota ${factura.IMPORTEIVA5.toFixed(2)}€`);
      }
      
      console.log(`   IVA Total: ${iva.toFixed(2)}€`);
      if (recargo > 0) {
        console.log(`   Recargo: ${recargo.toFixed(2)}€`);
      }
      console.log(`   Total: ${total.toFixed(2)}€\n`);
      
      totalBase += base;
      totalIVA += iva;
      totalGeneral += total;
    });
    
    console.log('═══════════════════════════════════════');
    console.log('📊 RESUMEN TOTALES:');
    console.log('═══════════════════════════════════════');
    console.log(`Total Base Imponible: ${totalBase.toFixed(2)}€`);
    console.log(`Total IVA:            ${totalIVA.toFixed(2)}€`);
    console.log(`Total General:        ${totalGeneral.toFixed(2)}€`);
    console.log('═══════════════════════════════════════');
    
    // Verificar valores esperados
    const expectedBase = 1770.24;
    const expectedIVA = 176.49;
    const expectedTotal = 1946.73;
    
    console.log('\n🎯 VERIFICACIÓN:');
    if (Math.abs(totalBase - expectedBase) < 0.01) {
      console.log(`✅ Base imponible CORRECTA (esperado: ${expectedBase}€)`);
    } else {
      console.log(`❌ Base imponible INCORRECTA (esperado: ${expectedBase}€, obtenido: ${totalBase.toFixed(2)}€)`);
    }
    
    if (Math.abs(totalIVA - expectedIVA) < 0.01) {
      console.log(`✅ IVA CORRECTO (esperado: ${expectedIVA}€)`);
    } else {
      console.log(`❌ IVA INCORRECTO (esperado: ${expectedIVA}€, obtenido: ${totalIVA.toFixed(2)}€)`);
    }
    
    if (Math.abs(totalGeneral - expectedTotal) < 0.01) {
      console.log(`✅ Total CORRECTO (esperado: ${expectedTotal}€)`);
    } else {
      console.log(`❌ Total INCORRECTO (esperado: ${expectedTotal}€, obtenido: ${totalGeneral.toFixed(2)}€)`);
    }
    
    await connection.close();
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error);
    if (connection) await connection.close();
    process.exit(1);
  }
}

verificarFacturas();
