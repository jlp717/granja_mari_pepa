/**
 * Script para obtener el TOP 5 de clientes con más facturación
 */

require('dotenv').config();
const pool = require('../app/config/odbcConfig');

async function getTopClientes() {
  let connection;
  
  try {
    console.log('Conectando a la base de datos...\n');
    
    // Inicializar el pool si no está inicializado
    if (!pool.pool) {
      await pool.initialize();
    }
    
    connection = await pool.acquire();
    
    // Consulta para obtener los clientes con más facturación (suma de totales)
    // Esquema correcto: DSEDAC, campo: CODIGOCLIENTEFACTURA
    const query = `
      SELECT 
        CODIGOCLIENTEFACTURA,
        SUM(IMPORTETOTAL) as TOTAL,
        COUNT(*) as NUM
      FROM DSEDAC.CAC
      WHERE EJERCICIOALBARAN = 2024
        AND NUMEROFACTURA > 0
      GROUP BY CODIGOCLIENTEFACTURA
      ORDER BY 2 DESC
      FETCH FIRST 10 ROWS ONLY
    `;
    
    console.log('Ejecutando consulta...\n');
    const result = await connection.query(query);
    
    // Ahora obtener datos de cada cliente
    console.log('Obteniendo datos de clientes...\n');
    
    const clientesConDatos = [];
    for (const row of result) {
      const clienteQuery = `
        SELECT CODIGOCLIENTE, NIF, TRIM(NOMBRECLIENTE) as NOMBRE
        FROM DSEDAC.CLI
        WHERE TRIM(CODIGOCLIENTE) = '${row.CODIGOCLIENTEFACTURA.toString().trim()}'
      `;
      const clienteResult = await connection.query(clienteQuery);
      
      if (clienteResult.length > 0) {
        clientesConDatos.push({
          CODIGOCLIENTE: row.CODIGOCLIENTEFACTURA,
          TOTAL: row.TOTAL,
          NUM: row.NUM,
          NIF: clienteResult[0].NIF,
          NOMBRE: clienteResult[0].NOMBRE
        });
      }
    }
    
    
    console.log('='.repeat(100));
    console.log('TOP 10 CLIENTES CON MÁS FACTURACIÓN (2024)');
    console.log('='.repeat(100));
    console.log('');
    console.log(
      'Posición'.padEnd(10) +
      'Código Cliente'.padEnd(18) +
      'NIF'.padEnd(15) +
      'Nombre'.padEnd(40) +
      'Albaranes'.padEnd(10) +
      'Total Facturado'
    );
    console.log('-'.repeat(100));
    
    clientesConDatos.forEach((row, index) => {
      const total = parseFloat(row.TOTAL || 0);
      console.log(
        `#${index + 1}`.padEnd(10) +
        (row.CODIGOCLIENTE || '').toString().trim().padEnd(18) +
        (row.NIF || '').toString().trim().padEnd(15) +
        (row.NOMBRE || '').substring(0, 38).padEnd(40) +
        (row.NUM || 0).toString().padEnd(10) +
        total.toLocaleString('es-ES', { style: 'currency', currency: 'EUR' })
      );
    });
    
    console.log('');
    console.log('='.repeat(100));
    console.log('\n📋 DATOS PARA LOGIN (copia y pega):');
    console.log('-'.repeat(50));
    
    clientesConDatos.slice(0, 5).forEach((row, index) => {
      console.log(`\n${index + 1}. ${(row.NOMBRE || '').trim()}`);
      console.log(`   Código: ${(row.CODIGOCLIENTE || '').toString().trim()}`);
      console.log(`   NIF: ${(row.NIF || '').toString().trim()}`);
    });
    
    console.log('\n');
    
  } catch (error) {
    console.error('Error:', error.message);
    console.error('Error completo:', error);
    if (error.odbcErrors) {
      console.error('ODBC Errors:', JSON.stringify(error.odbcErrors, null, 2));
    }
  } finally {
    if (connection) {
      await pool.release(connection);
    }
    process.exit(0);
  }
}

getTopClientes();
