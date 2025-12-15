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
const MAX_INTENTOS_FALLIDOS = 5;
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
      FROM DSEDAC.CLI CLI
      LEFT JOIN DSEDAC.CLIP CLIP ON TRIM(CLI.CODIGOCLIENTE) = TRIM(CLIP.CODIGOCLIENTE)
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
        INTENTOS_FALLIDOS as INTENTOS_FALLIDOS,
        BLOQUEADO_HASTA as BLOQUEADO_HASTA,
        ULTIMO_LOGIN as ULTIMO_LOGIN
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
    if (authRecord.BLOQUEADO_HASTA) {
      const lockedUntil = new Date(authRecord.BLOQUEADO_HASTA);
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
          `UPDATE JAVIER.CUSTOMER_PASSWORDS SET BLOQUEADO_HASTA = NULL, INTENTOS_FALLIDOS = 0 WHERE TRIM(CODIGO_CLIENTE) = ?`,
          [codigo]
        );
      }
    }
    
    // 5. Verificar contraseña
    const passwordMatch = await bcrypt.compare(password, authRecord.PASSWORD_HASH);
    
    if (!passwordMatch) {
      const newAttempts = (authRecord.INTENTOS_FALLIDOS || 0) + 1;
      const shouldLock = newAttempts >= MAX_INTENTOS_FALLIDOS;
      
      if (shouldLock) {
        const lockUntil = new Date(Date.now() + LOCK_TIME_MINUTES * 60 * 1000);
        await odbcPool.query(
          `UPDATE JAVIER.CUSTOMER_PASSWORDS SET INTENTOS_FALLIDOS = ?, BLOQUEADO_HASTA = ? WHERE TRIM(CODIGO_CLIENTE) = ?`,
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
          `UPDATE JAVIER.CUSTOMER_PASSWORDS SET INTENTOS_FALLIDOS = ? WHERE TRIM(CODIGO_CLIENTE) = ?`,
          [newAttempts, codigo]
        );
        
        logger.warn('⚠️ Contraseña incorrecta', { codigo, attempts: newAttempts });
        if (req) await registrarLoginHistory(codigo, false, req, 'Contraseña incorrecta');
        
        return { 
          success: false, 
          message: 'Credenciales inválidas',
          attemptsRemaining: MAX_INTENTOS_FALLIDOS - newAttempts
        };
      }
    }
    
    // 6. Login exitoso - Resetear intentos
    await odbcPool.query(
      `UPDATE JAVIER.CUSTOMER_PASSWORDS SET INTENTOS_FALLIDOS = 0, BLOQUEADO_HASTA = NULL, ULTIMO_LOGIN = CURRENT_TIMESTAMP WHERE TRIM(CODIGO_CLIENTE) = ?`,
      [codigo]
    );
    
    // 7. Registrar en historial
    if (req) await registrarLoginHistory(codigo, true, req, null);
    
    // 8. Generar tokens
    const accessToken = jwt.sign(
      { 
        codigoCliente: codigo.trim(),
        nombre: cliente.NOMBRECLIENTE.trim(),
        tipo: 'access'
      },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRY }
    );
    
    const refreshToken = jwt.sign(
      { 
        codigoCliente: codigo.trim(),
        tipo: 'refresh'
      },
      JWT_SECRET,
      { expiresIn: JWT_REFRESH_EXPIRY }
    );
    
    // 9. Guardar refresh token (OPCIONAL - no debe bloquear login)
    try {
      const deviceInfo = (req ? req.get('user-agent') : 'Unknown') || 'Unknown';
      const ipAddress = (req ? req.ip : '0.0.0.0') || '0.0.0.0';
      
      await odbcPool.query(
        `INSERT INTO JAVIER.REFRESH_TOKENS (CODIGO_CLIENTE, REFRESH_TOKEN, DEVICE_INFO, IP_ADDRESS) 
         VALUES (?, ?, ?, ?)`,
        [codigo, refreshToken, deviceInfo.substring(0, 200), ipAddress.substring(0, 45)]
      );
      logger.info('✅ Refresh token guardado');
    } catch (err) {
      logger.warn('⚠️ Error guardando refresh token (no crítico)', err.message);
      // NO FALLAR EL LOGIN - el refresh token es opcional
    }
    
    logger.success('✅ Autenticación exitosa', { codigo });
    
    return {
      success: true,
      accessToken,
      refreshToken,
      expiresIn: JWT_EXPIRY,
      cliente: {
        codigoCliente: codigo.trim(),
        nombre: cliente.NOMBRECLIENTE ? cliente.NOMBRECLIENTE.trim() : '',
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
      `INSERT INTO JAVIER.LOGIN_ATTEMPTS (CODIGO_CLIENTE, FECHA_INTENTO, IP_ADDRESS, USER_AGENT, INTENTO_EXITOSO, RAZON_FALLO)
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
      `SELECT REVOCADO, FECHA_EXPIRACION FROM JAVIER.REFRESH_TOKENS WHERE REFRESH_TOKEN = ?`,
      [refreshToken]
    );
    
    if (!tokenCheck || tokenCheck.length === 0) {
      return { success: false, message: 'Token no encontrado' };
    }
    
    if (tokenCheck[0].REVOCADO === '1') {
      return { success: false, message: 'Token revocado' };
    }
    
    if (new Date(tokenCheck[0].FECHA_EXPIRACION) < new Date()) {
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

    // Query optimizado para obtener facturas con todos sus albaranes
    const query = `
      WITH AlbaranesFactura AS (
        SELECT
          TRIM(SERIEFACTURA) as SERIEFACTURA,
          NUMEROFACTURA,
          EJERCICIOFACTURA,
          LISTAGG(CAST(NUMEROALBARAN AS VARCHAR(10)), ', ')
            WITHIN GROUP (ORDER BY NUMEROALBARAN) as ALBARANES_CONCAT,
          COUNT(DISTINCT NUMEROALBARAN) as NUM_ALBARANES,
          MIN(NUMEROALBARAN) as PRIMER_ALBARAN
        FROM DSEDAC.CAC
        WHERE NUMEROFACTURA > 0
          AND TRIM(CODIGOCLIENTEFACTURA) = ?
          ${year ? 'AND EJERCICIOFACTURA = ?' : ''}
        GROUP BY TRIM(SERIEFACTURA), NUMEROFACTURA, EJERCICIOFACTURA
      )
      SELECT DISTINCT
        TRIM(F.SERIEFACTURA) as serie,
        F.NUMEROFACTURA as numero,
        F.EJERCICIOFACTURA as ejercicio,
        F.FECHAFACTURA as fecha,
        F.TOTALFACTURA as baseImponible,
        F.IVAFACTURA as iva,
        F.RECARGOFACTURA as recargo,
        (F.TOTALFACTURA + F.IVAFACTURA + F.RECARGOFACTURA) as total,
        COALESCE(A.ALBARANES_CONCAT, '') as albaranes,
        COALESCE(A.NUM_ALBARANES, 0) as numAlbaranes,
        COALESCE(A.PRIMER_ALBARAN, 0) as primerAlbaran,
        CASE
          WHEN EXISTS (
            SELECT 1 FROM DSEDAC.CCC
            WHERE TRIM(CCC.SERIEFACTURA) = TRIM(F.SERIEFACTURA)
              AND CCC.NUMEROFACTURA = F.NUMEROFACTURA
              AND CCC.EJERCICIOFACTURA = F.EJERCICIOFACTURA
              AND CCC.PENDIENTE > 0
          ) THEN '0'
          ELSE '1'
        END as pagado
      FROM DSEDAC.FACCLI F
      LEFT JOIN AlbaranesFactura A
        ON TRIM(F.SERIEFACTURA) = A.SERIEFACTURA
        AND F.NUMEROFACTURA = A.NUMEROFACTURA
        AND F.EJERCICIOFACTURA = A.EJERCICIOFACTURA
      WHERE TRIM(F.CODIGOCLIENTE) = ?
        ${year ? 'AND F.EJERCICIOFACTURA = ?' : ''}
      ORDER BY F.EJERCICIOFACTURA DESC, F.FECHAFACTURA DESC
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
