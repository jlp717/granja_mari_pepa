const odbcPool = require('./app/config/odbcConfig');
const databaseService = require('./app/services/databaseService');

async function diagnosticar() {
  try {
    console.log('═══════════════════════════════════════════════════════');
    console.log('🔍 DIAGNÓSTICO FACTURA F-14074');
    console.log('═══════════════════════════════════════════════════════\n');

    const factura = await databaseService.getInvoiceDetail('F', 14074, 2025, '4300009900');

    console.log('HEADER:');
    console.log(`  Serie: ${factura.header.SERIEFACTURA}`);
    console.log(`  Número: ${factura.header.NUMEROFACTURA}`);
    console.log(`  Fecha: ${factura.header.DIAFACTURA}/${factura.header.MESFACTURA}/${factura.header.ANOFACTURA}`);
    console.log(`  Cliente: ${factura.header.NOMBRECLIENTEFACTURA?.trim()}`);
    console.log(`  Base: ${factura.header.BASEFACTURA} €`);
    console.log(`  IVA: ${factura.header.IVAFACTURA} €`);
    console.log(`  Recargo: ${factura.header.RECARGOFACTURA} €`);
    console.log(`  Total: ${factura.header.TOTALFACTURA} €`);
    console.log('');

    console.log(`LÍNEAS (${factura.lines.length} productos):`);
    console.log('');

    let sumaBase = 0;
    let sumaIVA = 0;

    factura.lines.forEach((line, i) => {
      const importe = parseFloat(line.IMPORTENETOARTICULO) || 0;
      const porcIVA = parseFloat(line.PORCENTAJEIVAARTICULO) || 0;
      const importeIVA = importe * (porcIVA / 100);

      sumaBase += importe;
      sumaIVA += importeIVA;

      console.log(`Línea ${i + 1}:`);
      console.log(`  Código: ${line.CODIGOARTICULO || 'N/A'}`);
      console.log(`  Descripción: ${(line.DESCRIPCIONARTICULO || 'N/A').substring(0, 50)}`);
      console.log(`  Cantidad: ${line.CANTIDADARTICULO || 0}`);
      console.log(`  Precio: ${line.PRECIOARTICULO || 0} €`);
      console.log(`  % IVA: ${porcIVA}%`);
      console.log(`  Importe: ${importe.toFixed(2)} €`);
      console.log(`  IVA calculado: ${importeIVA.toFixed(2)} €`);
      console.log('');
    });

    console.log('═══════════════════════════════════════════════════════');
    console.log('TOTALES CALCULADOS DESDE LÍNEAS:');
    console.log(`  Base: ${sumaBase.toFixed(2)} €`);
    console.log(`  IVA: ${sumaIVA.toFixed(2)} €`);
    console.log(`  Total: ${(sumaBase + sumaIVA).toFixed(2)} €`);
    console.log('');
    console.log('TOTALES EN HEADER:');
    console.log(`  Base: ${factura.header.BASEFACTURA} €`);
    console.log(`  IVA: ${factura.header.IVAFACTURA} €`);
    console.log(`  Total: ${factura.header.TOTALFACTURA} €`);
    console.log('');
    console.log('¿COINCIDEN?');
    console.log(`  Base: ${Math.abs(sumaBase - factura.header.BASEFACTURA) < 0.01 ? '✅' : '❌'}`);
    console.log(`  IVA: ${Math.abs(sumaIVA - factura.header.IVAFACTURA) < 0.01 ? '✅' : '❌'}`);
    console.log(`  Total: ${Math.abs((sumaBase + sumaIVA) - factura.header.TOTALFACTURA) < 0.01 ? '✅' : '❌'}`);
    console.log('═══════════════════════════════════════════════════════\n');

    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

diagnosticar();
