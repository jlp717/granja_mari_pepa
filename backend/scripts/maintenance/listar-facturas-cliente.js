/**
 * Script simplificado: Verificar facturas de un cliente
 */

require('dotenv').config();

const CODIGO_CLIENTE = '4300013449'; // GARCIA DE ALCARAZ MULERO PEDRO

async function verificar() {
  try {
    console.log('\n╔══════════════════════════════════════════════════════════════╗');
    console.log('║  LISTADO DE FACTURAS DEL CLIENTE                            ║');
    console.log('╚══════════════════════════════════════════════════════════════╝\n');

    const pool = require('./app/config/odbcConfig');
    await pool.initialize();
    console.log('✓ Pool inicializado\n');

    // Información del cliente
    const queryCliente = `
      SELECT CODIGOCLIENTE, NOMBRECLIENTE, NIF, DIRECCION, CODIGOPOSTAL, POBLACION
      FROM DSEDAC.CLI
      WHERE CODIGOCLIENTE = ?
    `;

    const cliente = (await pool.query(queryCliente, [CODIGO_CLIENTE]))[0];

    console.log('📋 CLIENTE:');
    console.log(`   ${cliente.CODIGOCLIENTE} - ${cliente.NOMBRECLIENTE}`);
    console.log(`   NIF: ${cliente.NIF || 'N/A'}`);
    console.log(`   ${cliente.DIRECCION || 'N/A'}, ${cliente.CODIGOPOSTAL || 'N/A'} ${cliente.POBLACION || 'N/A'}\n`);

    // Últimas 30 facturas (directamente, sin COUNT)
    console.log('� FACTURAS DEL CLIENTE (últimas 30):\n');

    const queryFacturas = `
      SELECT 
        SUBEMPRESA, EJERCICIO, SERIE, NUMEROALBARAN, NUMEROFACTURA,
        FECHADDMMYYYY, IMPORTETOTAL
      FROM DSEDAC.CAC
      WHERE TRIM(CODIGOCLIENTEFACTURA) = TRIM('${CODIGO_CLIENTE}')
      ORDER BY EJERCICIO DESC, NUMEROALBARAN DESC
      FETCH FIRST 30 ROWS ONLY
    `;

    const facturas = await pool.query(queryFacturas);
    const total = facturas.length;

    facturas.forEach((f, i) => {
      const albaran = `${f.SUBEMPRESA}-${f.EJERCICIO}-${f.SERIE}-${f.NUMEROALBARAN}`;
      const total = f.IMPORTETOTAL ? `€${f.IMPORTETOTAL.toFixed(2)}` : '€0.00';
      console.log(`   ${i + 1}. Factura ${f.SERIE} ${f.NUMEROFACTURA}`);
      console.log(`      Albarán: ${albaran} | Fecha: ${f.FECHADDMMYYYY} | Total: ${total}\n`);
    });

    console.log('\n╔══════════════════════════════════════════════════════════════╗');
    console.log('║  PRÓXIMOS PASOS:                                            ║');
    console.log('╚══════════════════════════════════════════════════════════════╝\n');
    console.log('1. Iniciar sesión en http://localhost:3000 con:');
    console.log(`   Usuario: ${CODIGO_CLIENTE}`);
    console.log(`   Contraseña: (tu contraseña)\n`);
    console.log(`2. Verificar que aparezcan ${total} facturas en el listado`);
    console.log('3. Comprobar que las últimas facturas coincidan con las mostradas arriba');
    console.log('4. Descargar algunos PDFs y verificar los datos\n');

  } catch (error) {
    console.error('\n❌ ERROR:', error.message);
  } finally {
    const pool = require('./app/config/odbcConfig');
    await pool.close();
    console.log('✓ Pool cerrado\n');
  }
}

verificar().catch(console.error);
