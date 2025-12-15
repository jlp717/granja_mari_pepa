/**
 * =============================================================================
 * 🔒 SCRIPT DE EXPORTACIÓN PARA IBM i
 * =============================================================================
 * 
 * Este script se ejecuta SOLO en el IBM i (o un PC con acceso ODBC al IBM i).
 * Exporta los datos necesarios a archivos JSON para sincronización.
 * 
 * FLUJO:
 * 1. Este script se conecta al IBM i (SOLO este script, NO el servidor web)
 * 2. Extrae los datos necesarios
 * 3. Genera archivos JSON
 * 4. Envía los archivos al servidor web via SFTP
 * 
 * SEGURIDAD:
 * - Este script NUNCA debe ejecutarse en el servidor web
 * - Solo debe ejecutarse desde un PC de la red interna
 * - Los archivos se envían por SFTP al servidor
 * 
 * EJECUCIÓN (Desde PC con ODBC a IBM i):
 *   node exportar-datos.js
 * 
 * REQUISITOS:
 *   - Node.js
 *   - odbc instalado (npm install odbc)
 *   - ssh2-sftp-client instalado (npm install ssh2-sftp-client)
 *   - DSN "GMP" configurado con acceso a IBM i
 * 
 * @author Sistema de Sincronización Segura
 * @version 1.0.0
 */

const odbc = require('odbc');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

// ====== CONFIGURACIÓN ======
const CONFIG = {
  // Conexión ODBC al IBM i (SOLO en PC interno)
  DSN: 'GMP',
  
  // Directorio de salida para JSON
  OUTPUT_DIR: './export_json',
  
  // Servidor web destino (SFTP)
  SFTP: {
    host: '192.168.1.118',      // IP del servidor web
    port: 22,
    username: 'sync_user',       // Usuario con permisos mínimos
    password: 'CAMBIAR_EN_PRODUCCION'
  },
  
  // Directorio destino en servidor
  REMOTE_DIR: '/var/www/granja/backend/data/sync',
  
  // Token de sincronización (debe coincidir con server)
  SYNC_TOKEN: process.env.SYNC_TOKEN || 'CAMBIAR_EN_PRODUCCION'
};

// Crear directorio de salida
if (!fs.existsSync(CONFIG.OUTPUT_DIR)) {
  fs.mkdirSync(CONFIG.OUTPUT_DIR, { recursive: true });
}

// ====== FUNCIONES DE EXPORTACIÓN ======

/**
 * Conecta al IBM i y ejecuta una consulta
 */
async function queryIBMi(sql) {
  const connection = await odbc.connect(`DSN=${CONFIG.DSN}`);
  try {
    const result = await connection.query(sql);
    return result;
  } finally {
    await connection.close();
  }
}

/**
 * Exporta clientes
 */
async function exportarClientes() {
  console.log('📦 Exportando clientes...');
  
  const clientes = await queryIBMi(`
    SELECT 
      TRIM(CODIGO) as codigo_cliente,
      TRIM(NOMBRE) as nombre,
      TRIM(NOMBREC) as nombre_comercial,
      TRIM(NIF) as nif,
      TRIM(DIRECCION) as direccion,
      TRIM(CP) as codigo_postal,
      TRIM(POBLACION) as poblacion,
      TRIM(PROVINCIA) as provincia,
      TRIM(TELEFONO) as telefono,
      TRIM(EMAIL) as email,
      1 as activo
    FROM DSEDAC.CLI
    WHERE ACTIVO = 'S'
  `);
  
  const data = {
    tipo: 'clientes',
    fecha_exportacion: new Date().toISOString(),
    registros: clientes
  };
  
  const filePath = path.join(CONFIG.OUTPUT_DIR, 'clientes.json');
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
  
  console.log(`   ✅ ${clientes.length} clientes exportados`);
  return filePath;
}

/**
 * Exporta facturas del año actual y anterior
 */
async function exportarFacturas() {
  console.log('📦 Exportando facturas...');
  
  const currentYear = new Date().getFullYear();
  const years = [currentYear, currentYear - 1];
  
  let todasFacturas = [];
  
  for (const year of years) {
    const facturas = await queryIBMi(`
      SELECT 
        TRIM(CACEMP) as subempresa,
        CACEJE as ejercicio,
        TRIM(CACSER) as serie,
        CACNUM as numero_factura,
        CACTER as terminal,
        CACALB as numero_albaran,
        TRIM(CACCLI) as codigo_cliente,
        DATE(CACFEC) as fecha_factura,
        DATE(CACFEV) as fecha_vencimiento,
        CACBAS as base_imponible,
        CACIVA as iva,
        CACTOT as total,
        CASE WHEN CACPAG = 'S' THEN 'pagada' ELSE 'pendiente' END as estado
      FROM DSEDAC.CAC
      WHERE CACEJE = ${year}
    `);
    
    // Para cada factura, obtener sus líneas
    for (const factura of facturas) {
      const lineas = await queryIBMi(`
        SELECT 
          LACLIN as numero_linea,
          TRIM(LACART) as codigo_articulo,
          TRIM(LACDES) as descripcion,
          LACCAN as cantidad,
          LACPRE as precio_unitario,
          LACDTO as descuento,
          LACIVA as iva_porcentaje,
          LACIMP as importe
        FROM DSEDAC.LAC
        WHERE LACEMP = '${factura.subempresa}'
          AND LACEJE = ${factura.ejercicio}
          AND LACSER = '${factura.serie}'
          AND LACNUM = ${factura.numero_factura}
        ORDER BY LACLIN
      `);
      
      factura.lineas = lineas;
    }
    
    todasFacturas = todasFacturas.concat(facturas);
    console.log(`   📄 Año ${year}: ${facturas.length} facturas`);
  }
  
  const data = {
    tipo: 'facturas',
    fecha_exportacion: new Date().toISOString(),
    registros: todasFacturas
  };
  
  const filePath = path.join(CONFIG.OUTPUT_DIR, 'facturas.json');
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
  
  console.log(`   ✅ ${todasFacturas.length} facturas exportadas`);
  return filePath;
}

/**
 * Exporta productos
 */
async function exportarProductos() {
  console.log('📦 Exportando productos...');
  
  const productos = await queryIBMi(`
    SELECT 
      TRIM(CODIGO) as codigo_articulo,
      TRIM(DESCRIPCION) as descripcion,
      TRIM(FAMILIA) as familia,
      TRIM(SUBFAMILIA) as subfamilia,
      PRECIO as precio_base,
      IVA as iva_porcentaje,
      TRIM(UNIDAD) as unidad_medida,
      1 as activo
    FROM DSEDAC.ART
    WHERE ACTIVO = 'S'
  `);
  
  const data = {
    tipo: 'productos',
    fecha_exportacion: new Date().toISOString(),
    registros: productos
  };
  
  const filePath = path.join(CONFIG.OUTPUT_DIR, 'productos.json');
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
  
  console.log(`   ✅ ${productos.length} productos exportados`);
  return filePath;
}

/**
 * Exporta familias de productos
 */
async function exportarFamilias() {
  console.log('📦 Exportando familias...');
  
  const familias = await queryIBMi(`
    SELECT 
      TRIM(CODIGO) as codigo,
      TRIM(DESCRIPCION) as descripcion
    FROM DSEDAC.FAM
  `);
  
  const data = {
    tipo: 'familias',
    fecha_exportacion: new Date().toISOString(),
    registros: familias
  };
  
  const filePath = path.join(CONFIG.OUTPUT_DIR, 'familias.json');
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
  
  console.log(`   ✅ ${familias.length} familias exportadas`);
  return filePath;
}

/**
 * Exporta precios personalizados por cliente
 */
async function exportarPreciosCliente() {
  console.log('📦 Exportando precios de cliente...');
  
  const precios = await queryIBMi(`
    SELECT 
      TRIM(CODIGO_CLIENTE) as codigo_cliente,
      TRIM(CODIGO_ARTICULO) as codigo_articulo,
      PRECIO as precio,
      DATE(FECHA_DESDE) as fecha_desde,
      DATE(FECHA_HASTA) as fecha_hasta
    FROM JAVIER.PRECIOS_CLIENTE
    WHERE FECHA_HASTA IS NULL OR FECHA_HASTA >= CURRENT_DATE
  `);
  
  const data = {
    tipo: 'precios_cliente',
    fecha_exportacion: new Date().toISOString(),
    registros: precios
  };
  
  const filePath = path.join(CONFIG.OUTPUT_DIR, 'precios_cliente.json');
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
  
  console.log(`   ✅ ${precios.length} precios exportados`);
  return filePath;
}

/**
 * Exporta credenciales (solo hash de contraseña)
 */
async function exportarCredenciales() {
  console.log('📦 Exportando credenciales...');
  
  const credenciales = await queryIBMi(`
    SELECT 
      TRIM(CODIGO_CLIENTE) as codigo_cliente,
      PASSWORD_HASH as password_hash,
      FECHA_CAMBIO as fecha_cambio
    FROM JAVIER.CUSTOMER_CREDENTIALS
  `);
  
  const data = {
    tipo: 'credenciales',
    fecha_exportacion: new Date().toISOString(),
    registros: credenciales
  };
  
  const filePath = path.join(CONFIG.OUTPUT_DIR, 'credenciales.json');
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
  
  console.log(`   ✅ ${credenciales.length} credenciales exportadas`);
  return filePath;
}

/**
 * Calcula checksum de un archivo
 */
function calcularChecksum(filePath) {
  const content = fs.readFileSync(filePath);
  return crypto.createHash('sha256').update(content).digest('hex');
}

/**
 * Envía archivos al servidor via SFTP
 */
async function enviarArchivosSFTP(archivos) {
  console.log('\n📤 Enviando archivos al servidor via SFTP...');
  
  try {
    const Client = require('ssh2-sftp-client');
    const sftp = new Client();
    
    await sftp.connect({
      host: CONFIG.SFTP.host,
      port: CONFIG.SFTP.port,
      username: CONFIG.SFTP.username,
      password: CONFIG.SFTP.password
    });
    
    for (const archivo of archivos) {
      const fileName = path.basename(archivo);
      const remotePath = `${CONFIG.REMOTE_DIR}/${fileName}`;
      
      await sftp.put(archivo, remotePath);
      console.log(`   ✅ Enviado: ${fileName}`);
    }
    
    await sftp.end();
    console.log('   📦 Todos los archivos enviados correctamente');
    
  } catch (error) {
    console.error('   ❌ Error SFTP:', error.message);
    console.log('\n⚠️  Los archivos están en ./export_json');
    console.log('   Puede copiarlos manualmente al servidor');
  }
}

/**
 * Función principal
 */
async function main() {
  console.log('═══════════════════════════════════════════════════════════');
  console.log('   🔄 EXPORTACIÓN DE DATOS IBM i → Servidor Web');
  console.log('═══════════════════════════════════════════════════════════\n');
  
  console.log('Fecha:', new Date().toLocaleString('es-ES'));
  console.log('Servidor destino:', CONFIG.SFTP.host);
  console.log('\n');
  
  const archivos = [];
  
  try {
    // Exportar cada tipo de datos
    archivos.push(await exportarClientes());
    archivos.push(await exportarFacturas());
    archivos.push(await exportarProductos());
    archivos.push(await exportarFamilias());
    archivos.push(await exportarPreciosCliente());
    archivos.push(await exportarCredenciales());
    
    console.log('\n═══════════════════════════════════════════════════════════');
    console.log('   📊 RESUMEN DE EXPORTACIÓN');
    console.log('═══════════════════════════════════════════════════════════');
    
    for (const archivo of archivos) {
      const stats = fs.statSync(archivo);
      const checksum = calcularChecksum(archivo);
      console.log(`\n${path.basename(archivo)}:`);
      console.log(`   Tamaño: ${(stats.size / 1024).toFixed(2)} KB`);
      console.log(`   Checksum: ${checksum.substring(0, 16)}...`);
    }
    
    // Enviar via SFTP
    await enviarArchivosSFTP(archivos);
    
    console.log('\n═══════════════════════════════════════════════════════════');
    console.log('   ✅ EXPORTACIÓN COMPLETADA');
    console.log('═══════════════════════════════════════════════════════════\n');
    
  } catch (error) {
    console.error('\n❌ Error:', error.message);
    process.exit(1);
  }
}

// Ejecutar
main();
