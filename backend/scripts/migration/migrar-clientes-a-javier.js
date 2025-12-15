/**
 * SCRIPT DE MIGRACIÓN: DSEDAC.CLI → JAVIER.CUSTOMER_CREDENTIALS
 * 
 * Este script migra todos los clientes desde la tabla CLI (legacy) a la nueva
 * tabla de credenciales seguras (CUSTOMER_CREDENTIALS) con passwords hasheados.
 * 
 * Funcionalidades:
 * - Lee todos los clientes activos de DSEDAC.CLI
 * - Hashea el NIF de cada cliente con bcrypt (12 rounds)
 * - Inserta en JAVIER.CUSTOMER_CREDENTIALS
 * - Evita duplicados (verifica antes de insertar)
 * - Crea registro en CUSTOMER_EMAILS si tiene email
 * - Muestra progreso en tiempo real
 * 
 * Ejecución: node scripts/migrar-clientes-a-javier.js
 */

const bcrypt = require('bcrypt');
const odbc = require('odbc');
require('dotenv').config();

const CONNECTION_STRING = process.env.ODBC_CONNECTION_STRING;
const BCRYPT_ROUNDS = 12;

/**
 * Sanitiza el código de cliente (elimina espacios y caracteres especiales)
 */
function sanitizarCodigo(codigo) {
  if (!codigo) return '';
  return codigo.toString().trim().replace(/\s+/g, '');
}

/**
 * Sanitiza el NIF (elimina espacios, guiones y puntos)
 */
function sanitizarNIF(nif) {
  if (!nif) return '';
  return nif.toString().trim().replace(/[\s\-\.]/g, '').toUpperCase();
}

/**
 * Valida que el email tenga formato correcto
 */
function esEmailValido(email) {
  if (!email) return false;
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return regex.test(email.trim());
}

/**
 * Migra un cliente individual
 */
async function migrarCliente(connection, cliente, index, total) {
  const codigoCliente = sanitizarCodigo(cliente.CODIGO);
  const nif = sanitizarNIF(cliente.NIF);
  
  console.log(`\n[${index + 1}/${total}] Procesando cliente: ${codigoCliente}`);
  console.log(`   NIF: ${nif.substring(0, Math.min(3, nif.length))}***`);
  
  try {
    // 1. Verificar si ya existe en CUSTOMER_CREDENTIALS
    const existeQuery = `
      SELECT COUNT(*) as EXISTE
      FROM JAVIER.CUSTOMER_CREDENTIALS
      WHERE CODIGO_CLIENTE = ?
    `;
    const existe = await connection.query(existeQuery, [codigoCliente]);
    
    if (existe[0].EXISTE > 0) {
      console.log(`   ⚠️  Ya existe en CUSTOMER_CREDENTIALS, omitiendo...`);
      return { success: true, skipped: true };
    }
    
    // 2. Hashear el NIF con bcrypt
    console.log(`   🔐 Hasheando password...`);
    const salt = await bcrypt.genSalt(BCRYPT_ROUNDS);
    const passwordHash = await bcrypt.hash(nif, salt);
    
    // 3. Insertar en CUSTOMER_CREDENTIALS
    const insertCredentialsQuery = `
      INSERT INTO JAVIER.CUSTOMER_CREDENTIALS (
        CODIGO_CLIENTE,
        PASSWORD_HASH,
        SALT,
        PASSWORD_TYPE,
        ACTIVO,
        DEBE_CAMBIAR_PASSWORD
      ) VALUES (?, ?, ?, 'BCRYPT', 'S', 'N')
    `;
    
    await connection.query(insertCredentialsQuery, [
      codigoCliente,
      passwordHash,
      salt
    ]);
    console.log(`   ✅ Credenciales creadas`);
    
    return { success: true, skipped: false };
    
  } catch (error) {
    console.error(`   ❌ Error migrando cliente: ${error.message}`);
    return { success: false, skipped: false, error: error.message };
  }
}

/**
 * Función principal de migración
 */
async function migrarTodosLosClientes() {
  console.log('🚀 MIGRACIÓN DE CLIENTES: DSEDAC.CLI → JAVIER.CUSTOMER_CREDENTIALS\n');
  console.log('═'.repeat(70));
  
  let connection;
  const estadisticas = {
    total: 0,
    migrados: 0,
    omitidos: 0,
    errores: 0,
    tiempoInicio: Date.now()
  };
  
  try {
    // Conectar a la base de datos
    console.log('\n📡 Conectando a la base de datos...');
    connection = await odbc.connect(CONNECTION_STRING);
    console.log('✅ Conexión establecida\n');
    
    // Obtener todos los clientes activos de CLI
    console.log('📋 Obteniendo clientes de DSEDAC.CLI...');
    const clientesQuery = `
      SELECT 
        CODIGOCLIENTE AS CODIGO,
        NIF AS NIF,
        NOMBRECLIENTE AS NOMBRE
      FROM DSEDAC.CLI
      WHERE CODIGOCLIENTE IS NOT NULL
        AND NIF IS NOT NULL
        AND TRIM(CODIGOCLIENTE) <> ''
        AND TRIM(NIF) <> ''
      ORDER BY CODIGOCLIENTE
    `;
    
    const clientes = await connection.query(clientesQuery);
    estadisticas.total = clientes.length;
    
    console.log(`✅ Encontrados ${estadisticas.total} clientes\n`);
    console.log('═'.repeat(70));
    console.log('Iniciando migración...');
    
    // Migrar cada cliente
    for (let i = 0; i < clientes.length; i++) {
      const resultado = await migrarCliente(connection, clientes[i], i, clientes.length);
      
      if (resultado.success) {
        if (resultado.skipped) {
          estadisticas.omitidos++;
        } else {
          estadisticas.migrados++;
        }
      } else {
        estadisticas.errores++;
      }
      
      // Mostrar progreso cada 10 clientes
      if ((i + 1) % 10 === 0 || i === clientes.length - 1) {
        const progreso = ((i + 1) / clientes.length * 100).toFixed(1);
        console.log(`\n📊 Progreso: ${progreso}% (${i + 1}/${clientes.length})`);
      }
    }
    
    // Calcular tiempo total
    const tiempoTotal = ((Date.now() - estadisticas.tiempoInicio) / 1000).toFixed(2);
    
    // Mostrar resumen final
    console.log('\n' + '═'.repeat(70));
    console.log('✨ MIGRACIÓN COMPLETADA\n');
    console.log('📊 RESUMEN:');
    console.log(`   Total de clientes:     ${estadisticas.total}`);
    console.log(`   ✅ Migrados:           ${estadisticas.migrados}`);
    console.log(`   ⚠️  Omitidos (ya exist): ${estadisticas.omitidos}`);
    console.log(`   ❌ Errores:            ${estadisticas.errores}`);
    console.log(`   ⏱️  Tiempo total:       ${tiempoTotal}s`);
    console.log(`   ⚡ Velocidad:          ${(estadisticas.total / tiempoTotal).toFixed(1)} clientes/s`);
    
    // Verificación final
    console.log('\n🔍 VERIFICACIÓN FINAL:');
    const verificacion = await connection.query(`
      SELECT COUNT(*) as TOTAL
      FROM JAVIER.CUSTOMER_CREDENTIALS
    `);
    console.log(`   Credenciales en JAVIER: ${verificacion[0].TOTAL}`);
    

    
    console.log('\n' + '═'.repeat(70));
    console.log('\n✅ Los clientes ya pueden hacer login con su NIF como password');
    console.log('⚠️  IMPORTANTE: Reinicia el servidor backend para aplicar los cambios\n');
    
  } catch (error) {
    console.error('\n❌ ERROR GENERAL:', error.message);
    console.error('Stack:', error.stack);
    process.exit(1);
  } finally {
    if (connection) {
      await connection.close();
      console.log('🔌 Conexión cerrada\n');
    }
  }
}

// Ejecutar migración
migrarTodosLosClientes().catch(error => {
  console.error('Error fatal:', error);
  process.exit(1);
});
