require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const databaseService = require('../app/services/databaseService');
const poolInstance = require('../app/config/odbcConfig');

async function verCabecera() {
  try {
    await poolInstance.initialize();
    
    console.log('=== VERIFICAR CABECERA DE FACTURA ===\n');

    const datosFactura = await databaseService.obtenerDatosFactura({
      subempresa: 'GMP',
      ejercicio: 2025,
      serie: 'P',
      terminal: 93,
      numero_albaran: 1002
    });

    console.log('Cabecera:');
    console.log(JSON.stringify(datosFactura.cabecera, null, 2));

  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await poolInstance.close();
    process.exit(0);
  }
}

verCabecera();
