const odbc = require('odbc');
require('dotenv').config();
const {
  CONSULTA_LINEAS_ALBARAN,
  CONSULTA_CABECERA_ALBARAN,
  CONSULTA_CLIENTE,
  CONSULTA_FORMA_PAGO,
  CONSULTA_TIPO_IVA
} = require('./app/models/facturaModelNuevo');

console.log('\n=== TEST NUEVO MODELO DE FACTURAS ===\n');

const connectionString = process.env.ODBC_CONNECTION_STRING;

async function testNuevoModelo() {
  let connection;

  try {
    connection = await odbc.connect(connectionString);
    console.log('✅ Conectado\n');

    // Parámetros del albarán P-33-3292
    const params = ['GMP', 2025, 'P', 33, 3292];

    console.log('📋 Parámetros:', params.join('-'), '\n');

    // 1. Test líneas de albarán
    console.log('1. CONSULTA_LINEAS_ALBARAN:\n');
    const lineas = await connection.query(CONSULTA_LINEAS_ALBARAN, params);
    console.log(`   ✅ ${lineas.length} líneas encontradas`);
    if (lineas.length > 0) {
      console.log('\n   Primera línea:');
      console.log(`   - Lote: ${lineas[0].CODIGOLOTE}`);
      console.log(`   - Ref: ${lineas[0].CODIGOARTICULO}`);
      console.log(`   - Desc: ${lineas[0].DESCRIPCION.trim()}`);
      console.log(`   - Cajas: ${lineas[0].CANTIDADENVASES}`);
      console.log(`   - Precio: ${lineas[0].PRECIOVENTA}`);
      console.log(`   - Dto: ${lineas[0].PORCENTAJEDESCUENTO}%`);
      console.log(`   - Importe: ${lineas[0].IMPORTEVENTA}`);
      console.log(`   - IVA: ${lineas[0].CODIGOIVA}`);

      console.log('\n   Todas las líneas:');
      lineas.forEach((l, i) => {
        console.log(`   ${i + 1}. [${l.TIPOLINEA}] ${l.CODIGOLOTE.trim()} ${l.CODIGOARTICULO.trim()} - ${l.DESCRIPCION.trim()} - ${l.IMPORTEVENTA}€`);
      });
    }

    // 2. Test cabecera
    console.log('\n\n2. CONSULTA_CABECERA_ALBARAN:\n');
    const cabecera = await connection.query(CONSULTA_CABECERA_ALBARAN, params);
    console.log(`   ✅ Cabecera encontrada: ${cabecera.length > 0 ? 'SÍ' : 'NO'}`);
    if (cabecera.length > 0) {
      const c = cabecera[0];
      console.log(`\n   - Tipo Albarán: ${c.CODIGOTIPOALBARAN}`);
      console.log(`   - Fecha: ${c.DIADOCUMENTO}.${c.MESDOCUMENTO}.${c.ANODOCUMENTO}`);
      console.log(`   - Cliente: ${c.CODIGOCLIENTEFACTURA}`);
      console.log(`   - Pedido: ${c.SUBEMPRESAPEDIDO}-${c.EJERCICIOPEDIDO}-${c.SERIEPEDIDO}-${c.TERMINALPEDIDO}-${c.NUMEROPEDIDO}`);
      console.log(`\n   TOTALES:`);
      console.log(`   - Base Imponible: ${c.IMPORTEBASEIMPONIBLE1}€`);
      console.log(`   - IVA ${c.PORCENTAJEIVA1}%: ${c.IMPORTEIVA1}€`);
      console.log(`   - Total: ${c.IMPORTETOTAL}€`);
      console.log(`\n   FACTURA:`);
      console.log(`   - Factura: ${c.SUBEMPRESAFACTURA}-${c.SERIEFACTURA}-${c.TERMINALFACTURA}-${c.NUMEROFACTURA}`);
      console.log(`   - Fecha Factura: ${c.DIAFACTURA}.${c.MESFACTURA}.${c.ANOFACTURA}`);
    }

    // 3. Test cliente
    console.log('\n\n3. CONSULTA_CLIENTE:\n');
    const codigoCliente = lineas.length > 0 ? lineas[0].CODIGOCLIENTEFACTURA : '4300000281';
    const cliente = await connection.query(CONSULTA_CLIENTE, [codigoCliente]);
    console.log(`   ✅ Cliente encontrado: ${cliente.length > 0 ? 'SÍ' : 'NO'}`);
    if (cliente.length > 0) {
      const cl = cliente[0];
      console.log(`\n   - Código: ${cl.CODIGOCLIENTE}`);
      console.log(`   - Nombre: ${cl.NOMBRECLIENTE.trim()}`);
      console.log(`   - Nombre Alt: ${cl.NOMBREALTERNATIVO.trim()}`);
      console.log(`   - Dirección: ${cl.DIRECCION.trim()}`);
      console.log(`   - CP: ${cl.CODIGOPOSTAL} ${cl.POBLACION.trim()}`);
      console.log(`   - Provincia: ${cl.PROVINCIA.trim()}`);
      console.log(`   - NIF: ${cl.NIF.trim()}`);
      console.log(`   - Teléfono: ${cl.TELEFONO1.trim()}`);
    }

    // 4. Test forma de pago
    console.log('\n\n4. CONSULTA_FORMA_PAGO:\n');
    const codigoFormaPago = lineas.length > 0 ? lineas[0].CODIGOFORMAPAGO : '02';
    const formaPago = await connection.query(CONSULTA_FORMA_PAGO, [codigoFormaPago]);
    console.log(`   ✅ Forma de pago encontrada: ${formaPago.length > 0 ? 'SÍ' : 'NO'}`);
    if (formaPago.length > 0) {
      const fp = formaPago[0];
      console.log(`\n   - Código: ${fp.CODIGOFORMAPAGO}`);
      console.log(`   - Descripción: ${fp.DESCRIPCIONFORMAPAGO.trim()}`);
      console.log(`   - Nº Pagos: ${fp.NUMEROPAGOS}`);
    }

    // 5. Test tipo IVA
    console.log('\n\n5. CONSULTA_TIPO_IVA:\n');
    const codigoIVA = lineas.length > 0 ? lineas[0].CODIGOIVA : '1';
    const tipoIVA = await connection.query(CONSULTA_TIPO_IVA, [codigoIVA]);
    console.log(`   ✅ Tipo IVA encontrado: ${tipoIVA.length > 0 ? 'SÍ' : 'NO'}`);
    if (tipoIVA.length > 0) {
      const iva = tipoIVA[0];
      console.log(`\n   - Código: ${iva.CODIGOIVA}`);
      console.log(`   - % IVA: ${iva.PORCENTAJEIVA}%`);
      console.log(`   - % Recargo: ${iva.PORCENTAJERECARGO}%`);
    }

    console.log('\n\n✅ TODAS LAS CONSULTAS FUNCIONAN CORRECTAMENTE\n');

  } catch (error) {
    console.error('\n❌ ERROR:', error.message);
    if (error.odbcErrors) {
      error.odbcErrors.forEach(e => console.error('   ', e.message));
    }
  } finally {
    if (connection) {
      await connection.close();
      console.log('✅ Conexión cerrada\n');
    }
  }
}

testNuevoModelo();
