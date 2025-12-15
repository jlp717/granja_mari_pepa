/**
 * Script: Listar facturas de un cliente específico
 * Basado en la sintaxis que funciona en analizar-3-clientes.js
 */

require('dotenv').config();

const CODIGO_CLIENTE = '4300013449'; // GARCIA DE ALCARAZ MULERO PEDRO

async function listarFacturas() {
  try {
    console.log('\n╔══════════════════════════════════════════════════════════════╗');
    console.log('║  LISTADO DE FACTURAS DEL CLIENTE                            ║');
    console.log('╚══════════════════════════════════════════════════════════════╝\n');

    const pool = require('./app/config/odbcConfig');
    await pool.initialize();
    console.log('✓ Pool inicializado\n');

    //  INFO DEL CLIENTE
    const sqlCliente = `
      SELECT 
        CODIGOCLIENTE,
        NOMBRECLIENTE,
        NIF,
        DIRECCION,
        CODIGOPOSTAL,
        POBLACION,
        PROVINCIA
      FROM DSEDAC.CLI
      WHERE CODIGOCLIENTE = '${CODIGO_CLIENTE}'
    `;

    const clientes = await pool.query(sqlCliente, []);
    if (!clientes || clientes.length === 0) {
      console.log(`❌ No se encontró el cliente ${CODIGO_CLIENTE}\n`);
      return;
    }

    const cliente = clientes[0];
    console.log('📋 INFORMACIÓN DEL CLIENTE:\n');
    console.log(`   Código: ${cliente.CODIGOCLIENTE}`);
    console.log(`   Nombre: ${cliente.NOMBRECLIENTE}`);
    console.log(`   NIF: ${cliente.NIF || 'N/A'}`);
    console.log(`   Dirección: ${cliente.DIRECCION || 'N/A'}`);
    console.log(`   CP/Población: ${cliente.CODIGOPOSTAL || 'N/A'} ${cliente.POBLACION || 'N/A'}`);
    console.log(`   Provincia: ${cliente.PROVINCIA || 'N/A'}\n`);

    // ÚLTIMAS 30 FACTURAS - usar nombres exactos de columnas
    const sqlFacturas = `
      SELECT 
        SUBEMPRESAALBARAN,
        EJERCICIOALBARAN,
        SERIEALBARAN,
        NUMEROALBARAN,
        NUMEROFACTURA,
        DIADOCUMENTO,
        MESDOCUMENTO,
        ANODOCUMENTO,
        IMPORTETOTAL
      FROM DSEDAC.CAC
      WHERE TRIM(CODIGOCLIENTEFACTURA) = '${CODIGO_CLIENTE}'
        AND NUMEROFACTURA > 0
        AND NUMEROALBARAN > 0
      ORDER BY EJERCICIOALBARAN DESC, NUMEROALBARAN DESC
      FETCH FIRST 30 ROWS ONLY
    `;

    console.log('🔍 ÚLTIMAS 30 FACTURAS (ordenadas por fecha):\n');
    console.log('📊 Fuente: Tabla DSEDAC.CAC (Cabecera de Facturas)\n');

    const facturas = await pool.query(sqlFacturas, []);

    if (!facturas || facturas.length === 0) {
      console.log('❌ No se encontraron facturas para este cliente\n');
      return;
    }

    console.log(`   Total recuperado: ${facturas.length} facturas\n`);

    facturas.forEach((f, i) => {
      const subempresa = f.SUBEMPRESAALBARAN ? f.SUBEMPRESAALBARAN.trim() : '';
      const serie = f.SERIEALBARAN ? f.SERIEALBARAN.trim() : '';
      const albaran = `${subempresa}-${f.EJERCICIOALBARAN}-${serie}-${f.NUMEROALBARAN}`;
      const importe = f.IMPORTETOTAL ? `€${f.IMPORTETOTAL.toFixed(2)}`.padStart(10) : '€0.00'.padStart(10);
      
      // Construir fecha desde los componentes
      const dia = String(f.DIADOCUMENTO || 0).padStart(2, '0');
      const mes = String(f.MESDOCUMENTO || 0).padStart(2, '0');
      const ano = f.ANODOCUMENTO || 0;
      const fecha = `${dia}.${mes}.${ano}`;
      
      console.log(`   ${String(i + 1).padStart(2)}. Factura ${serie} ${String(f.NUMEROFACTURA).padStart(8)}`);
      console.log(`       📄 Albarán: ${albaran}`);
      console.log(`       📅 Fecha: ${fecha}  💰 Total: ${importe}\n`);
    });

    console.log('╔══════════════════════════════════════════════════════════════╗');
    console.log('║  VERIFICACIÓN EN LA WEB                                     ║');
    console.log('╚══════════════════════════════════════════════════════════════╝\n');
    console.log('✅ PASOS A SEGUIR:\n');
    console.log('1️⃣  Abre en el navegador: http://localhost:3000\n');
    console.log('2️⃣  Inicia sesión con:');
    console.log(`     • Usuario: ${CODIGO_CLIENTE}`);
    console.log('     • Contraseña: (la contraseña del cliente)\n');
    console.log('3️⃣  Verifica que el listado web muestre estas mismas facturas\n');
    console.log('4️⃣  Comprueba que:');
    console.log('     • El número de facturas coincide');
    console.log('     • No hay duplicados');
    console.log('     • Las fechas y totales son correctos');
    console.log('     • Los PDFs se descargan correctamente\n');

  } catch (error) {
    console.error('\n❌ ERROR:', error.message);
    console.error('Stack:', error.stack);
  } finally {
    const pool = require('./app/config/odbcConfig');
    await pool.close();
    console.log('✓ Pool cerrado\n');
  }
}

listarFacturas().catch(console.error);
