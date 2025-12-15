// Script para generar PDF del Cliente 2 (GARCIA DE ALCARAZ) y verificar
require('dotenv').config();
const databaseService = require('./app/services/databaseService');
const pdfService = require('./app/services/pdfService');
const fs = require('fs');
const path = require('path');

async function testClienteReal() {
  console.log('\n╔════════════════════════════════════════════════════════════╗');
  console.log('║  TEST CON CLIENTE REAL: GARCIA DE ALCARAZ MULERO PEDRO   ║');
  console.log('╚════════════════════════════════════════════════════════════╝\n');
  
  try {
    const pool = require('./app/config/odbcConfig');
    await pool.initialize();
    console.log('✓ Pool inicializado\n');
    
    // Datos del cliente 2 del análisis
    console.log('📋 CLIENTE:');
    console.log('   Código: 4300013449');
    console.log('   Nombre: GARCIA DE ALCARAZ MULERO PEDRO');
    console.log('   NIF: 23224590H\n');
    
    // Factura: A 8446 del 11/11/2025
    // Albarán: P-2025-93-10610
    console.log('📄 GENERANDO PDF DE LA FACTURA:');
    console.log('   Serie: A');
    console.log('   Número: 8446');
    console.log('   Fecha: 11/11/2025');
    console.log('   Albarán: P-2025-93-10610');
    console.log('   Total esperado: €72.49\n');
    
    const params = {
      subempresa: 'GMP',
      ejercicio: 2025,
      serie: 'P',
      terminal: 93,
      numero_albaran: 10610
    };
    
    console.log('Obteniendo datos de la factura...');
    const datosFactura = await databaseService.obtenerDatosFactura(params);
    
    if (!datosFactura) {
      console.log('❌ No se encontró la factura');
      process.exit(1);
    }
    
    console.log('✓ Datos obtenidos:');
    console.log(`  Cliente: ${datosFactura.cliente.nombre}`);
    console.log(`  Líneas: ${datosFactura.lineas.length}`);
    console.log(`  Total: €${datosFactura.totales.totalFactura}\n`);
    
    // Mostrar detalle de las líneas
    console.log('🔍 DETALLE DE LÍNEAS:\n');
    datosFactura.lineas.forEach((linea, idx) => {
      if (linea.tipoLinea !== 'T') {
        console.log(`   ${idx + 1}. ${linea.descripcion.substring(0, 40)}...`);
        console.log(`      Lote: ${linea.lote || 'N/A'}`);
        console.log(`      Ref: ${linea.referencia || 'N/A'}`);
        console.log(`      Cajas: ${linea.cajas}  Uds: ${linea.unidades}`);
        console.log(`      Precio: €${linea.precio}  Dto: ${linea.porcentajeDescuento}%`);
        console.log(`      Importe: €${linea.importe}  IVA: ${linea.porcentajeIVA}%\n`);
      }
    });
    
    // Mostrar totales
    console.log('💰 TOTALES:\n');
    datosFactura.totales.desglosesIVA.forEach((iva, idx) => {
      console.log(`   IVA ${idx + 1}:`);
      console.log(`      Base: €${iva.baseImponible.toFixed(2)}`);
      console.log(`      % IVA: ${iva.porcentajeIVA}%`);
      console.log(`      Importe IVA: €${iva.importeIVA.toFixed(2)}\n`);
    });
    
    console.log(`   🎯 TOTAL FACTURA: €${datosFactura.totales.totalFactura.toFixed(2)}\n`);
    
    console.log('Generando PDF...');
    const pdfBuffer = await pdfService.generarFacturaPDF(datosFactura);
    
    console.log(`✓ PDF generado: ${(pdfBuffer.length / 1024).toFixed(2)} KB\n`);
    
    // Guardar PDF
    const outputPath = path.join(__dirname, 'factura_cliente_real.pdf');
    fs.writeFileSync(outputPath, pdfBuffer);
    
    console.log(`✅ PDF guardado en: ${outputPath}\n`);
    
    console.log('╔═══════════════════════════════════════════════════════════╗');
    console.log('║  VERIFICAR EN EL PDF:                                    ║');
    console.log('╚═══════════════════════════════════════════════════════════╝\n');
    
    console.log('📌 HEADER:');
    console.log('   [ ] Logo Mari Pepa visible');
    console.log('   [ ] Logos de distribuidores (Nestlé, Panamar, Topgel)');
    console.log('   [ ] Información del almacén frigorífico');
    console.log('   [ ] RGSEAA: 40.017154/MU\n');
    
    console.log('📌 CUADRO CLIENTE/FACTURA/FECHA:');
    console.log('   [ ] Líneas gruesas en el borde');
    console.log('   [ ] Columna FACTURA más ancha que las demás');
    console.log('   [ ] Paginación dentro del cuadro');
    console.log('   [ ] Cliente: 4300013449');
    console.log('   [ ] Factura: A 008 446 (o similar)');
    console.log('   [ ] Fecha: 11.11.2025\n');
    
    console.log('📌 DATOS DEL CLIENTE:');
    console.log('   [ ] Nombre: GARCIA DE ALCARAZ MULERO PEDRO');
    console.log('   [ ] Dirección: CN DEL GATO, 5');
    console.log('   [ ] CP: 30800 LORCA');
    console.log('   [ ] Provincia: MURCIA');
    console.log('   [ ] NIF: 23224590H  Tel: 629 512 139\n');
    
    console.log('📌 TABLA DE PRODUCTOS:');
    console.log(`   [ ] ${datosFactura.lineas.length} líneas visibles`);
    console.log('   [ ] Columnas: Lote | Ref. | Descripción | Cajas | Uds./Kgs. | Precio | % Dto. | Importe | IVA');
    console.log('   [ ] Números con formato europeo (1.234,56)');
    console.log('   [ ] Decimales correctos en cada columna\n');
    
    console.log('📌 TOTALES:');
    console.log('   [ ] Tabla de Base Imponible / % I.V.A. / Importe I.V.A.');
    datosFactura.totales.desglosesIVA.forEach((iva, idx) => {
      console.log(`   [ ] Base ${idx + 1}: €${iva.baseImponible.toFixed(2)}  IVA ${iva.porcentajeIVA}%: €${iva.importeIVA.toFixed(2)}`);
    });
    console.log(`   [ ] TOTAL FACTURA: €${datosFactura.totales.totalFactura.toFixed(2)}`);
    console.log('   [ ] Forma de pago: REPOSICION (o similar)');
    console.log('   [ ] Fecha Vcto.:\n');
    
    console.log('📌 PIE DE PÁGINA:');
    console.log('   [ ] Código de barras visible y legible');
    console.log('   [ ] Registro mercantil de Murcia');
    console.log('   [ ] CIF: B04008710\n');
    
    await pool.close();
    console.log('✅ Test completado\n');
    
  } catch (error) {
    console.error('\n❌ ERROR:', error.message);
    console.error('Stack:', error.stack);
  }
  
  process.exit(0);
}

testClienteReal();
