/**
 * SERVICIO DE AUTENTICACIÓN - NIVEL SENIOR
 * ==========================================
 * Sistema completo de autenticación con bcrypt, JWT, refresh tokens,
 * rate limiting, bloqueo de cuentas y auditoría
 */

require('dotenv').config();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const odbcPool = require('../config/odbcConfig');
const logger = require('../utils/logger');

const JWT_SECRET = process.env.JWT_SECRET || 'CAMBIAR-EN-PRODUCCION-POR-SECRETO-MUY-LARGO';
const JWT_EXPIRY = process.env.JWT_EXPIRY || '24h';
const JWT_REFRESH_EXPIRY = '7d';
const MAX_LOGIN_ATTEMPTS = 5;
const LOCK_TIME_MINUTES = 30;

/**
 * Autenticar cliente con código y contraseña
 */
async function authenticateClient(codigoCliente, password, nif = null, req = null) {
  try {
    logger.info('🔐 Intento de autenticación', { codigoCliente });
    
    if (!codigoCliente || !password) {
      return { success: false, message: 'Código de cliente y contraseña requeridos' };
    }
    
    const codigo = codigoCliente.toString().trim();
    
    // 1. Buscar cliente en CLI
    const clienteQuery = `
      SELECT 
        CLI.CODIGOCLIENTE,
        CLI.NOMBRECLIENTE,
        CLI.NIF,
        CLI.DIRECCION,
        CLI.POBLACION,
        CLI.PROVINCIA,
        CLI.CODIGOPOSTAL as CP,
        CLI.TELEFONO1 as TELEFONO,
        CLIP.EMAILCONTACTO as EMAIL
      FROM CLI
      LEFT JOIN CLIP ON TRIM(CLI.CODIGOCLIENTE) = TRIM(CLIP.CODIGOCLIENTE)
      WHERE TRIM(CLI.CODIGOCLIENTE) = ?
    `;
    
    const clientes = await odbcPool.query(clienteQuery, [codigo]);
    
    if (!clientes || clientes.length === 0) {
      logger.warn('⚠️ Cliente no encontrado', { codigo });
      if (req) await registrarLoginHistory(codigo, false, req, 'Cliente no existe');
      return { success: false, message: 'Credenciales inválidas' };
    }
    
    const cliente = clientes[0];
    
    // 2. Verificar NIF si se proporcionó
    if (nif && cliente.NIF) {
      if (cliente.NIF.trim() !== nif.trim()) {
        logger.warn('⚠️ NIF incorrecto', { codigo });
        if (req) await registrarLoginHistory(codigo, false, req, 'NIF incorrecto');
        return { success: false, message: 'Credenciales inválidas' };
      }
    }
    
    // 3. Buscar credenciales en JAVIER.CUSTOMER_PASSWORDS
    const authQuery = `
      SELECT 
        PASSWORD_HASH,
        INTENTOS_FALLIDOS as LOGIN_ATTEMPTS,
        BLOQUEADO_HASTA as LOCKED_UNTIL,
        ULTIMO_LOGIN as LAST_LOGIN
      FROM JAVIER.CUSTOMER_PASSWORDS
      WHERE TRIM(CODIGO_CLIENTE) = ?
    `;
    
    const authRecords = await odbcPool.query(authQuery, [codigo]);
    
    if (!authRecords || authRecords.length === 0) {
      logger.warn('⚠️ Cliente sin credenciales', { codigo });
      if (req) await registrarLoginHistory(codigo, false, req, 'Sin credenciales');
      return { success: false, message: 'Cliente no registrado en el sistema' };
    }
    
    const authRecord = authRecords[0];
    
    // 4. Verificar si cuenta está bloqueada
    if (authRecord.LOCKED_UNTIL) {
      const lockedUntil = new Date(authRecord.LOCKED_UNTIL);
      if (lockedUntil > new Date()) {
        logger.warn('🔒 Cuenta bloqueada', { codigo, lockedUntil });
        return { 
          success: false, 
          message: `Cuenta bloqueada hasta ${lockedUntil.toLocaleString('es-ES')}`,
          lockedUntil: lockedUntil.toISOString()
        };
      } else {
        // Desbloquear si ya pasó el tiempo
        await odbcPool.query(
          `UPDATE CLI_AUTH SET LOCKED_UNTIL = NULL, LOGIN_ATTEMPTS = 0 WHERE TRIM(CODIGOCLIENTE) = ?`,
          [codigo]
        );
      }
    }
    
    // 5. Verificar contraseña
    const passwordMatch = await bcrypt.compare(password, authRecord.PASSWORD_HASH);
    
    if (!passwordMatch) {
      const newAttempts = (authRecord.LOGIN_ATTEMPTS || 0) + 1;
      const shouldLock = newAttempts >= MAX_LOGIN_ATTEMPTS;
      
      if (shouldLock) {
        const lockUntil = new Date(Date.now() + LOCK_TIME_MINUTES * 60 * 1000);
        await odbcPool.query(
          `UPDATE CLI_AUTH SET LOGIN_ATTEMPTS = ?, LOCKED_UNTIL = ? WHERE TRIM(CODIGOCLIENTE) = ?`,
          [newAttempts, lockUntil.toISOString(), codigo]
        );
        
        logger.warn('🔒 Cuenta bloqueada por intentos', { codigo, attempts: newAttempts });
        if (req) await registrarLoginHistory(codigo, false, req, 'Demasiados intentos');
        
        return { 
          success: false, 
          message: `Cuenta bloqueada por ${LOCK_TIME_MINUTES} minutos debido a múltiples intentos fallidos`
        };
      } else {
        await odbcPool.query(
          `UPDATE CLI_AUTH SET LOGIN_ATTEMPTS = ? WHERE TRIM(CODIGOCLIENTE) = ?`,
          [newAttempts, codigo]
        );
        
        logger.warn('⚠️ Contraseña incorrecta', { codigo, attempts: newAttempts });
        if (req) await registrarLoginHistory(codigo, false, req, 'Contraseña incorrecta');
        
        return { 
          success: false, 
          message: 'Credenciales inválidas',
          attemptsRemaining: MAX_LOGIN_ATTEMPTS - newAttempts
        };
      }
    }
    
    // 6. Login exitoso - Resetear intentos
    await odbcPool.query(
      `UPDATE CLI_AUTH SET LOGIN_ATTEMPTS = 0, LOCKED_UNTIL = NULL, LAST_LOGIN = CURRENT_TIMESTAMP WHERE TRIM(CODIGOCLIENTE) = ?`,
      [codigo]
    );
    
    // 7. Registrar en historial
    if (req) await registrarLoginHistory(codigo, true, req, null);
    
    // 8. Generar tokens
    const accessToken = jwt.sign(
      { 
        codigoCliente: cliente.CODIGOCLIENTE.trim(),
        nombre: cliente.NOMBRECLIENTE.trim(),
        tipo: 'access'
      },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRY }
    );
    
    const refreshToken = jwt.sign(
      { 
        codigoCliente: cliente.CODIGOCLIENTE.trim(),
        tipo: 'refresh'
      },
      JWT_SECRET,
      { expiresIn: JWT_REFRESH_EXPIRY }
    );
    
    // 9. Guardar refresh token
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    const deviceInfo = req ? req.get('user-agent') || 'Unknown' : 'Unknown';
    const ipAddress = req ? req.ip || '0.0.0.0' : '0.0.0.0';
    
    try {
      await odbcPool.query(
        `INSERT INTO CLI_TOKENS (CODIGOCLIENTE, REFRESH_TOKEN, DEVICE_INFO, IP_ADDRESS, CREATED_AT, EXPIRES_AT, REVOKED) 
         VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP, ?, '0')`,
        [codigo, refreshToken, deviceInfo, ipAddress, expiresAt.toISOString()]
      );
    } catch (err) {
      logger.warn('⚠️ Error guardando refresh token', err.message);
    }
    
    logger.success('✅ Autenticación exitosa', { codigo });
    
    return {
      success: true,
      accessToken,
      refreshToken,
      expiresIn: JWT_EXPIRY,
      cliente: {
        codigoCliente: cliente.CODIGOCLIENTE.trim(),
        nombre: cliente.NOMBRECLIENTE.trim(),
        nif: cliente.NIF ? cliente.NIF.trim() : null,
        direccion: cliente.DIRECCION ? cliente.DIRECCION.trim() : null,
        poblacion: cliente.POBLACION ? cliente.POBLACION.trim() : null,
        provincia: cliente.PROVINCIA ? cliente.PROVINCIA.trim() : null,
        cp: cliente.CP ? cliente.CP.trim() : null,
        telefono: cliente.TELEFONO ? cliente.TELEFONO.trim() : null,
        email: cliente.EMAIL ? cliente.EMAIL.trim() : null
      }
    };
    
  } catch (error) {
    logger.error('❌ Error en autenticación', error);
    throw error;
  }
}

/**
 * Registrar intento de login en historial
 */
async function registrarLoginHistory(codigoCliente, success, req, failureReason) {
  try {
    await odbcPool.query(
      `INSERT INTO CLI_LOGIN_HISTORY (CODIGOCLIENTE, LOGIN_TIME, IP_ADDRESS, USER_AGENT, SUCCESS, FAILURE_REASON)
       VALUES (?, CURRENT_TIMESTAMP, ?, ?, ?, ?)`,
      [
        codigoCliente.trim(),
        req.ip || '0.0.0.0',
        req.get('user-agent') || 'unknown',
        success ? '1' : '0',
        failureReason
      ]
    );
  } catch (error) {
    logger.error('❌ Error registrando historial', error);
  }
}

/**
 * Verificar y refrescar token
 */
async function refreshAccessToken(refreshToken) {
  try {
    // Verificar token
    const decoded = jwt.verify(refreshToken, JWT_SECRET);
    
    if (decoded.tipo !== 'refresh') {
      return { success: false, message: 'Token inválido' };
    }
    
    // Verificar que no esté revocado
    const tokenCheck = await odbcPool.query(
      `SELECT REVOKED, EXPIRES_AT FROM CLI_TOKENS WHERE REFRESH_TOKEN = ?`,
      [refreshToken]
    );
    
    if (!tokenCheck || tokenCheck.length === 0) {
      return { success: false, message: 'Token no encontrado' };
    }
    
    if (tokenCheck[0].REVOKED === '1') {
      return { success: false, message: 'Token revocado' };
    }
    
    if (new Date(tokenCheck[0].EXPIRES_AT) < new Date()) {
      return { success: false, message: 'Token expirado' };
    }
    
    // Generar nuevo access token
    const accessToken = jwt.sign(
      { 
        codigoCliente: decoded.codigoCliente,
        tipo: 'access'
      },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRY }
    );
    
    return {
      success: true,
      accessToken,
      expiresIn: JWT_EXPIRY
    };
    
  } catch (error) {
    logger.error('❌ Error refrescando token', error);
    return { success: false, message: 'Token inválido' };
  }
}

/**
 * Obtener facturas del cliente con cache
 */
async function getClientInvoices(codigoCliente, year = null) {
  try {
    logger.info('📄 Obteniendo facturas', { codigoCliente, year });
    
    const codigo = codigoCliente.toString().trim();
    
    // Query optimizado con CTE para obtener primer albarán (FIX DEL BUG PDF)
    const query = `
      WITH PrimerosAlbaranes AS (
        SELECT 
          SERIEFACTURA,
          NUMEROFACTURA,
          EJERCICIOFACTURA,
          MIN(SERIEALBARAN) as PRIMER_ALBARAN,
          ROW_NUMBER() OVER (
            PARTITION BY SERIEFACTURA, NUMEROFACTURA, EJERCICIOFACTURA 
            ORDER BY NUMEROLINEA
          ) as rn
        FROM LAC
        WHERE TRIM(CODIGOCLIENTEFACTURA) = ?
        ${year ? 'AND EJERCICIOFACTURA = ?' : ''}
        GROUP BY SERIEFACTURA, NUMEROFACTURA, EJERCICIOFACTURA, NUMEROLINEA
      )
      SELECT DISTINCT
        CAC.SERIEFACTURA as serie,
        CAC.NUMEROFACTURA as numero,
        CAC.EJERCICIOFACTURA as ejercicio,
        CAC.FECHAFACTURA as fecha,
        CAC.BASEFACTURA as baseImponible,
        CAC.IVAFACTURA as iva,
        CAC.RECARGOFACTURA as recargo,
        CAC.TOTALFACTURA as total,
        PA.PRIMER_ALBARAN as primerAlbaran,
        CASE 
          WHEN EXISTS (
            SELECT 1 FROM CCC 
            WHERE CCC.SERIEFACTURA = CAC.SERIEFACTURA 
              AND CCC.NUMEROFACTURA = CAC.NUMEROFACTURA 
              AND CCC.EJERCICIOFACTURA = CAC.EJERCICIOFACTURA
              AND CCC.PENDIENTE > 0
          ) THEN '0'
          ELSE '1'
        END as pagado
      FROM CAC
      INNER JOIN PrimerosAlbaranes PA 
        ON CAC.SERIEFACTURA = PA.SERIEFACTURA
        AND CAC.NUMEROFACTURA = PA.NUMEROFACTURA
        AND CAC.EJERCICIOFACTURA = PA.EJERCICIOFACTURA
        AND PA.rn = 1
      WHERE TRIM(CAC.CODIGOCLIENTEFACTURA) = ?
        ${year ? 'AND CAC.EJERCICIOFACTURA = ?' : ''}
      ORDER BY CAC.EJERCICIOFACTURA DESC, CAC.FECHAFACTURA DESC
    `;
    
    const params = year ? [codigo, year, codigo, year] : [codigo, codigo];
    const facturas = await odbcPool.query(query, params);
    
    logger.success(`✅ ${facturas ? facturas.length : 0} facturas obtenidas`, { codigoCliente });
    
    return facturas || [];
    
  } catch (error) {
    logger.error('❌ Error obteniendo facturas', error);
    throw error;
  }
}

module.exports = {
  authenticateClient,
  refreshAccessToken,
  getClientInvoices,
  registrarLoginHistory
};
