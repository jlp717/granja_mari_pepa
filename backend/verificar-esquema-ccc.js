const odbcPool = require('./app/config/odbcConfig');

const schemas = ['DSTM02', 'DSTM09', 'DSTF', 'DSTMXX'];

async function verificarEsquemas() {
  console.log('Verificando esquemas CCC...\n');

  for (const schema of schemas) {
    try {
      const result = await odbcPool.query(`SELECT COUNT(*) AS CNT FROM ${schema}.CCC`);
      console.log(`✅ ${schema}: ${result[0].CNT} registros`);
    } catch (error) {
      console.log(`❌ ${schema}: Error - ${error.message}`);
    }
  }

  process.exit(0);
}

verificarEsquemas();
