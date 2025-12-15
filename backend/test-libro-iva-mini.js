const libroIvaPdfService = require('./app/services/libroIvaPdfService');
const fs = require('fs');

async function run() {
  const cliente = {
    NOMBRECLIENTE: 'DIEGO',
    NIF: '23224478K'
  };

  const registros = [
    { SERIEFACTURA: 'F', NUMEROFACTURA: 14074, ANOFACTURA: 2025, FECHAFACTURA: '30/11/2025', CODIGOCLIENTE: '4300009990', CIFCLIENTE: '23224478K', BASE_IMPONIBLE: 210.54, IVA: 21.06, RECARGO: 0, TOTAL: 231.6 },
    { SERIEFACTURA: 'F', NUMEROFACTURA: 12886, ANOFACTURA: 2025, FECHAFACTURA: '03/11/2025', CODIGOCLIENTE: '4300009990', CIFCLIENTE: '23224478K', BASE_IMPONIBLE: 137.1, IVA: 13.71, RECARGO: 0, TOTAL: 150.81 },
    { SERIEFACTURA: 'A', NUMEROFACTURA: 8120, ANOFACTURA: 2025, FECHAFACTURA: '28/10/2025', CODIGOCLIENTE: '4300009990', CIFCLIENTE: '23224478K', BASE_IMPONIBLE: -903.59, IVA: -90.36, RECARGO: 0, TOTAL: -993.95 },
    { SERIEFACTURA: 'A', NUMEROFACTURA: 8121, ANOFACTURA: 2025, FECHAFACTURA: '28/10/2025', CODIGOCLIENTE: '4300009990', CIFCLIENTE: '23224478K', BASE_IMPONIBLE: 903.59, IVA: 90.36, RECARGO: 0, TOTAL: 993.95 }
  ];

  const datosPDF = {
    ejercicio: 2025,
    cliente,
    registros
  };

  const buf = await libroIvaPdfService.generateLibroIvaPDF(datosPDF);
  fs.writeFileSync('test-libro-iva-mini-diego.pdf', buf);
  console.log('PDF generado: test-libro-iva-mini-diego.pdf');
}

run().catch(e => { console.error(e); process.exit(1); });
