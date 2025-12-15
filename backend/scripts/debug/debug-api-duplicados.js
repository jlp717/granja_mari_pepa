require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const authService = require('../app/services/authService');
const pool = require('../app/config/odbcConfig');

async function test() {
  await pool.initialize();
  
  const facturas = await authService.obtenerFacturasCliente('4300000087');
  
  console.log('=== FACTURAS DUPLICADAS ===\n');
  
  // Buscar duplicados por serieFactura + numeroFactura
  const map = {};
  facturas.forEach(f => {
    const key = `${f.serieFactura}-${f.numeroFactura}`;
    if (!map[key]) {
      map[key] = [];
    }
    map[key].push(f);
  });
  
  // Mostrar solo las que tienen duplicados
  Object.entries(map).forEach(([key, arr]) => {
    if (arr.length > 1) {
      console.log(`DUPLICADO: ${key} (${arr.length} veces)`);
      arr.forEach((f, i) => {
        console.log(`  [${i+1}] subempresa=${f.subempresa}, ejercicio=${f.ejercicio}, terminal=${f.terminal}, numero_albaran=${f.numero_albaran}, lista_albaranes=${f.lista_albaranes}, fecha=${f.fecha}, total=${f.totalFactura}`);
      });
      console.log();
    }
  });
  
  // Contar total
  const duplicados = Object.values(map).filter(arr => arr.length > 1);
  console.log(`Total facturas con duplicados: ${duplicados.length}`);
  console.log(`Total registros extra: ${duplicados.reduce((sum, arr) => sum + arr.length - 1, 0)}`);
  
  process.exit(0);
}
test().catch(e => { console.error(e); process.exit(1); });
