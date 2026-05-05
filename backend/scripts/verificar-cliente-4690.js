/**
 * Ver datos completos del cliente 4300004690
 */
const db = require('../app/config/odbcConfig');

(async () => {
  await db.initialize();
  
  const cli = await db.query(`
    SELECT 
      TRIM(CODIGOCLIENTE) AS CODIGO, 
      TRIM(NOMBRECLIENTE) AS NOMBRE, 
      TRIM(NOMBREALTERNATIVO) AS ALT,
      DIRECCION,
      POBLACION
    FROM DSEDAC.CLI WHERE TRIM(CODIGOCLIENTE) = '4300004690'
  `);

  console.log('Cliente 4300004690:');
  console.log('  CODIGO:', cli[0].CODIGO);
  console.log('  NOMBRECLIENTE:', cli[0].NOMBRE);
  console.log('  NOMBREALTERNATIVO:', cli[0].ALT);
  console.log('  DIRECCION:', cli[0].DIRECCION);
  console.log('  POBLACION:', cli[0].POBLACION);

  process.exit(0);
})();