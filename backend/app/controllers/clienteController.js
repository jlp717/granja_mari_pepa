/**
 * CONTROLADOR DE CLIENTES
 * =========================
 * Operaciones relacionadas con datos del cliente
 */

const logger = require('../utils/logger');

/**
 * GET /api/clientes/perfil
 * Obtener perfil del cliente autenticado
 */
async function getPerfil(req, res) {
  try {
    const cliente = req.user;
    
    return res.json({
      success: true,
      cliente
    });
  } catch (error) {
    logger.error('❌ Error obteniendo perfil', error);
    return res.status(500).json({
      success: false,
      message: 'Error obteniendo perfil'
    });
  }
}

/**
 * PUT /api/clientes/perfil
 * Actualizar perfil del cliente
 */
async function updatePerfil(req, res) {
  try {
    const { telefono, email } = req.body;
    const codigoCliente = req.user.codigoCliente;
    const odbcPool = require('../config/odbcConfig');
    
    const query = `
      UPDATE CLI 
      SET TELEFONO1 = ?
      WHERE TRIM(CODIGOCLIENTE) = ?
    `;
    
    await odbcPool.query(query, [telefono || '', codigoCliente.trim()]);
    
    // Actualizar email en tabla CLIP si existe
    if (email) {
      const emailQuery = `
        UPDATE CLIP 
        SET EMAILCONTACTO = ?
        WHERE TRIM(CODIGOCLIENTE) = ?
      `;
      await odbcPool.query(emailQuery, [email, codigoCliente.trim()]);
    }
    
    return res.json({
      success: true,
      message: 'Perfil actualizado'
    });
  } catch (error) {
    logger.error('❌ Error actualizando perfil', error);
    return res.status(500).json({
      success: false,
      message: 'Error actualizando perfil'
    });
  }
}

/**
 * POST /api/clientes/registrar
 * Registrar nuevo cliente
 */
async function registrarCliente(req, res) {
  try {
    const { codigoCliente, password } = req.body;
    const bcrypt = require('bcryptjs');
    const odbcPool = require('../config/odbcConfig');
    
    logger.info('📝 Registrar cliente', { codigoCliente });
    
    // Verificar que el cliente existe en CLI
    const clienteQuery = `
      SELECT CODIGOCLIENTE FROM CLI WHERE TRIM(CODIGOCLIENTE) = ?
    `;
    const cliente = await odbcPool.query(clienteQuery, [codigoCliente.trim()]);
    
    if (!cliente || cliente.length === 0) {
      return res.status(404).json({ success: false, message: 'Cliente no encontrado en el sistema' });
    }
    
    // Hash de la contraseña
    const passwordHash = await bcrypt.hash(password, 10);
    
    // Insertar en CLI_AUTH
    const insertQuery = `
      INSERT INTO CLI_AUTH (CODIGOCLIENTE, PASSWORD_HASH, CREATED_AT, UPDATED_AT, LOGIN_ATTEMPTS)
      VALUES (?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 0)
    `;
    await odbcPool.query(insertQuery, [codigoCliente.trim(), passwordHash]);
    
    return res.json({ success: true, message: 'Cliente registrado correctamente' });
  } catch (error) {
    logger.error('❌ Error registrando cliente', error);
    return res.status(500).json({ success: false, message: 'Error registrando cliente' });
  }
}

/**
 * GET /api/clientes/:codigoCliente
 * Obtener datos del cliente
 */
async function obtenerCliente(req, res) {
  try {
    const { codigoCliente } = req.params;
    const odbcPool = require('../config/odbcConfig');
    
    const query = `
      SELECT CODIGOCLIENTE, NOMBRECLIENTE, DIRECCIONCLIENTE, 
             POBLACIONCLIENTE, PROVINCIACLIENTE, CPCLIENTE,
             EMAILCLIENTE, TELEFONOCLIENTE
      FROM CLI
      WHERE TRIM(CODIGOCLIENTE) = ?
    `;
    
    const result = await odbcPool.query(query, [codigoCliente]);
    
    if (!result || result.length === 0) {
      return res.status(404).json({ success: false, message: 'Cliente no encontrado' });
    }
    
    return res.json({ success: true, cliente: result[0] });
  } catch (error) {
    logger.error('❌ Error obteniendo cliente', error);
    return res.status(500).json({ success: false, message: 'Error obteniendo cliente' });
  }
}

/**
 * POST /api/clientes/test-insert
 * Test de inserción (solo desarrollo)
 */
async function testInsert(req, res) {
  try {
    if (process.env.NODE_ENV === 'production') {
      return res.status(403).json({ success: false, message: 'No disponible en producción' });
    }
    
    logger.info('🧪 Test insert ejecutado');
    return res.json({ success: true, message: 'Test completado' });
  } catch (error) {
    logger.error('❌ Error en test insert', error);
    return res.status(500).json({ success: false, message: 'Error en test' });
  }
}

/**
 * GET /api/clientes/health
 * Health check
 */
async function healthCheck(req, res) {
  try {
    return res.json({ status: 'ok', service: 'clientes', timestamp: new Date().toISOString() });
  } catch (error) {
    return res.status(500).json({ status: 'error', message: error.message });
  }
}

module.exports = {
  getPerfil,
  updatePerfil,
  registrarCliente,
  obtenerCliente,
  testInsert,
  healthCheck
};
