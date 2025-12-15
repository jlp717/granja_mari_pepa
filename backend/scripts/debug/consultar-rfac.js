require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const poolInstance = require('../app/config/odbcConfig');

async function consultarRFAC() {
  try {
    await poolInstance.initialize();
    
    console.log('=== CONSULTANDO TABLA RFAC (Registro de Facturas) ===\n');

    try {
      const rfac = await poolInstance.query(`
        SELECT *
        FROM DSEDAC.RFAC
        WHERE NUMEROFACTURA = 2098
          AND SUBEMPRESAFACTURA = 'GMP'
        FETCH FIRST 5 ROWS ONLY
      `);

      if (rfac.length > 0) {
        console.log(`Encontrado ${rfac.length} registro(s) en RFAC:\n`);
        rfac.forEach((r, i) => {
          console.log(`Registro ${i + 1}:`);
          console.log(JSON.stringify(r, null, 2));
          console.log();
        });
      } else {
        console.log('No se encontró la factura 2098 en RFAC\n');
      }
    } catch (e) {
      console.log('Error consultando RFAC:', e.message);
    }

    console.log('=== CONSULTANDO TABLA RFACL1 (Líneas de Facturas) ===\n');

    try {
      const rfacl1 = await poolInstance.query(`
        SELECT *
        FROM DSEDAC.RFACL1
        WHERE NUMEROFACTURA = 2098
          AND SUBEMPRESAFACTURA = 'GMP'
        ORDER BY SECUENCIA
      `);

      if (rfacl1.length > 0) {
        console.log(`Encontrado ${rfacl1.length} línea(s) en RFACL1:\n`);
        let total = 0;
        rfacl1.forEach((r, i) => {
          console.log(`Línea ${i + 1} (Secuencia ${r.SECUENCIA}):`);
          console.log(`  Descripción: ${r.DESCRIPCION || r.DESCRIPCIONARTICULO || 'N/A'}`);
          console.log(`  Cantidad: ${r.CANTIDADENVASES || r.CANTIDAD || 0}`);
          console.log(`  Importe: ${r.IMPORTEVENTA || r.IMPORTE || 0}€`);
          
          const importe = parseFloat(r.IMPORTEVENTA || r.IMPORTE || 0);
          total += importe;
        });
        console.log(`\nTotal base desde líneas: ${total.toFixed(2)}€`);
        console.log(`Con IVA 10%: ${(total * 1.10).toFixed(2)}€\n`);
      } else {
        console.log('No se encontraron líneas en RFACL1 para la factura 2098\n');
      }
    } catch (e) {
      console.log('Error consultando RFACL1:', e.message);
    }

    // Si RFAC tiene las líneas reales de la factura, esa debería ser la fuente de verdad
    console.log('=== CONCLUSIÓN ===');
    console.log('Si RFAC/RFACL1 contienen las líneas REALES de la factura,');
    console.log('ese debería ser el origen de datos para mostrar el total correcto.');
    console.log('\nSi no existen o están vacías, entonces el problema es que CAC');
    console.log('tiene múltiples albaranes marcados con la misma factura cuando');
    console.log('la factura real solo debería incluir uno de ellos.');

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await poolInstance.close();
  }
}

consultarRFAC();
