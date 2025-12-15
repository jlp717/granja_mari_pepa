/**
 * CONTROLADOR DE AUTENTICACIÓN
 * ==============================
 * Maneja login, logout y validación de usuarios
 */

const authService = require('../services/authService');
const odbcPool = require('../config/odbcConfig');
const logger = require('../utils/logger');
const { isValidClientCode, isValidEmail } = require('../utils/validators');

/**
 * POST /api/auth/login
 * Login de cliente con código y email
 */
async function login(req, res) {
  try {
    const { codigoCliente, email } = req.body;
    
    // Validar inputs
    if (!codigoCliente || !email) {
      return res.status(400).json({
        success: false,
        message: 'Código de cliente y email son requeridos'
      });
    }
    
    if (!isValidClientCode(codigoCliente)) {
      return res.status(400).json({
        success: false,
        message: 'Código de cliente inválido'
      });
    }
    
    if (!isValidEmail(email)) {
      return res.status(400).json({
        success: false,
        message: 'Email inválido'
      });
    }
    
    // Intentar autenticación
    const result = await authService.authenticateClient(codigoCliente, email);
    
    if (!result.success) {
      return res.status(401).json(result);
    }
    
    // Login exitoso
    logger.success('✅ Login exitoso', { 
      codigoCliente,
      ip: req.ip 
    });
    
    return res.json(result);
  } catch (error) {
    logger.error('❌ Error en login', error);
    return res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
}

/**
 * POST /api/auth/verify
 * Verificar si un token es válido
 */
async function verifyTokenEndpoint(req, res) {
  try {
    const { token } = req.body;
    
    if (!token) {
      return res.status(400).json({
        success: false,
        message: 'Token requerido'
      });
    }
    
    const verification = authService.verifyToken(token);
    
    if (!verification.valid) {
      return res.status(401).json({
        success: false,
        message: 'Token inválido o expirado'
      });
    }
    
    return res.json({
      success: true,
      user: verification.data
    });
  } catch (error) {
    logger.error('❌ Error verificando token', error);
    return res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
}

/**
 * GET /api/auth/me
 * Obtener información del usuario autenticado
 */
async function getCurrentUser(req, res) {
  try {
    // El usuario ya viene de authenticateToken middleware
    return res.json({
      success: true,
      user: req.user
    });
  } catch (error) {
    logger.error('❌ Error obteniendo usuario actual', error);
    return res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
}

/**
 * POST /api/auth/logout
 * Logout (por ahora solo logging, JWT es stateless)
 */
async function logout(req, res) {
  try {
    logger.info('👋 Logout', { 
      codigoCliente: req.user?.codigoCliente,
      ip: req.ip 
    });
    
    return res.json({
      success: true,
      message: 'Logout exitoso'
    });
  } catch (error) {
    logger.error('❌ Error en logout', error);
    return res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
}

/**
 * POST /api/auth/logout
 * Logout (por ahora solo logging, JWT es stateless)
 */
async function logout(req, res) {
  try {
    logger.info('👋 Logout', { 
      codigoCliente: req.user?.codigoCliente,
      ip: req.ip 
    });
    
    return res.json({
      success: true,
      message: 'Logout exitoso'
    });
  } catch (error) {
    logger.error('❌ Error en logout', error);
    return res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
}

/**
 * POST /api/auth/refresh
 * Refrescar token JWT
 */
async function refreshToken(req, res) {
  try {
    const { token } = req.body;
    
    if (!token) {
      return res.status(400).json({ success: false, message: 'Token requerido' });
    }
    
    // Verificar y generar nuevo token
    const verification = authService.verifyToken(token);
    
    if (!verification.valid) {
      return res.status(401).json({ success: false, message: 'Token inválido' });
    }
    
    // Generar nuevo token
    const jwt = require('jsonwebtoken');
    const newToken = jwt.sign(
      verification.data,
      process.env.JWT_SECRET || 'your-secret-key-change-in-production',
      { expiresIn: process.env.JWT_EXPIRY || '24h' }
    );
    
    return res.json({ success: true, token: newToken });
  } catch (error) {
    logger.error('❌ Error refrescando token', error);
    return res.status(500).json({ success: false, message: 'Error refrescando token' });
  }
}

/**
 * GET /api/auth/perfil
 * Obtener perfil del usuario autenticado
 */
async function obtenerPerfil(req, res) {
  try {
    const codigoCliente = req.user.codigoCliente;
    
    // Obtener datos completos del cliente desde CLI
    const queryCliente = `
      SELECT 
        TRIM(CLI.CODIGOCLIENTE) AS CODIGOCLIENTE,
        TRIM(CLI.NOMBRECLIENTE) AS NOMBRECLIENTE,
        TRIM(CLI.NIF) AS NIF,
        TRIM(CLI.DIRECCION) AS DIRECCION,
        TRIM(CLI.POBLACION) AS POBLACION,
        TRIM(CLI.PROVINCIA) AS PROVINCIA,
        TRIM(CLI.CODIGOPOSTAL) AS CODIGOPOSTAL,
        TRIM(CLI.TELEFONO1) AS TELEFONO,
        TRIM(CLIP.EMAILCONTACTO) AS EMAIL
      FROM DSEDAC.CLI CLI
      LEFT JOIN DSEDAC.CLIP CLIP ON CLI.CODIGOCLIENTE = CLIP.CODIGOCLIENTE
      WHERE CLI.CODIGOCLIENTE = ?
    `;
    
    const resultado = await odbcPool.query(queryCliente, [codigoCliente]);
    
    if (!resultado || resultado.length === 0) {
      return res.status(404).json({ 
        success: false, 
        message: 'Datos del cliente no encontrados' 
      });
    }
    
    const cliente = resultado[0];
    
    // Formatear dirección completa
    const direccionCompleta = [
      cliente.DIRECCION,
      cliente.CODIGOPOSTAL,
      cliente.POBLACION,
      cliente.PROVINCIA
    ].filter(Boolean).join(', ');
    
    const perfil = {
      codigoCliente: cliente.CODIGOCLIENTE,
      nombreCliente: cliente.NOMBRECLIENTE,
      nif: cliente.NIF,
      email: cliente.EMAIL || '',
      telefono: cliente.TELEFONO || '',
      direccion: {
        calle: cliente.DIRECCION || '',
        poblacion: cliente.POBLACION || '',
        provincia: cliente.PROVINCIA || '',
        codigoPostal: cliente.CODIGOPOSTAL || '',
        completa: direccionCompleta
      }
    };
    
    logger.info(`✅ Perfil obtenido para cliente ${codigoCliente}`);
    
    return res.json({ success: true, perfil });
  } catch (error) {
    logger.error('❌ Error obteniendo perfil', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Error obteniendo perfil',
      error: error.message 
    });
  }
}

/**
 * GET /api/auth/facturas/:codigoCliente
 * Obtener facturas del cliente con información de productos
 */
async function obtenerFacturas(req, res) {
  try {
    const { codigoCliente } = req.params;

    // Consulta para obtener facturas agrupadas con conteo de productos y albaranes
    const query = `
      WITH FacturasBase AS (
        SELECT DISTINCT
          TRIM(CAC.SERIEFACTURA) AS SERIE,
          CAC.NUMEROFACTURA AS NUMERO,
          CAC.EJERCICIOFACTURA AS EJERCICIO,
          CAC.ANOFACTURA AS ANO,
          CAC.MESFACTURA AS MES,
          CAC.DIAFACTURA AS DIA,
          CAC.IMPORTEBASEIMPONIBLE1 + CAC.IMPORTEBASEIMPONIBLE2 + CAC.IMPORTEBASEIMPONIBLE3 +
          CAC.IMPORTEBASEIMPONIBLE4 + CAC.IMPORTEBASEIMPONIBLE5 AS BASE_IMPONIBLE,
          CAC.IMPORTEIVA1 + CAC.IMPORTEIVA2 + CAC.IMPORTEIVA3 + CAC.IMPORTEIVA4 + CAC.IMPORTEIVA5 AS IVA,
          CAC.IMPORTETOTAL AS TOTAL,
          COALESCE(CAC.IMPORTECOBRADOPENDIENTE, 0) AS PENDIENTE,
          CAST(
            CASE
              WHEN CAC.DIAFACTURA < 10 THEN '0' || TRIM(CAST(CAC.DIAFACTURA AS CHAR(2)))
              ELSE TRIM(CAST(CAC.DIAFACTURA AS CHAR(2)))
            END || '/' ||
            CASE
              WHEN CAC.MESFACTURA < 10 THEN '0' || TRIM(CAST(CAC.MESFACTURA AS CHAR(2)))
              ELSE TRIM(CAST(CAC.MESFACTURA AS CHAR(2)))
            END || '/' ||
            TRIM(CAST(CAC.ANOFACTURA AS CHAR(4)))
          AS VARCHAR(10)) AS FECHA
        FROM DSEDAC.CAC
        WHERE TRIM(CAC.CODIGOCLIENTEFACTURA) = ?
          AND CAC.NUMEROFACTURA > 0
      ),
      AlbaranesFactura AS (
        SELECT
          TRIM(SERIEFACTURA) AS SERIE,
          NUMEROFACTURA AS NUMERO,
          EJERCICIOFACTURA AS EJERCICIO,
          LISTAGG(CAST(NUMEROALBARAN AS VARCHAR(10)), ', ')
            WITHIN GROUP (ORDER BY NUMEROALBARAN) AS ALBARANES,
          COUNT(DISTINCT NUMEROALBARAN) AS NUM_ALBARANES
        FROM DSEDAC.CAC
        WHERE TRIM(CODIGOCLIENTEFACTURA) = ?
          AND NUMEROFACTURA > 0
        GROUP BY TRIM(SERIEFACTURA), NUMEROFACTURA, EJERCICIOFACTURA
      ),
      ProductosFactura AS (
        SELECT
          TRIM(LAC.SERIEFACTURA) AS SERIE,
          LAC.NUMEROFACTURA AS NUMERO,
          LAC.EJERCICIOFACTURA AS EJERCICIO,
          COUNT(DISTINCT LAC.CODIGOARTICULO) AS NUM_PRODUCTOS
        FROM DSEDAC.LAC
        GROUP BY TRIM(LAC.SERIEFACTURA), LAC.NUMEROFACTURA, LAC.EJERCICIOFACTURA
      )
      SELECT
        FB.*,
        COALESCE(ALB.ALBARANES, '') AS ALBARANES,
        COALESCE(ALB.NUM_ALBARANES, 0) AS NUM_ALBARANES,
        COALESCE(P.NUM_PRODUCTOS, 0) AS NUM_PRODUCTOS
      FROM FacturasBase FB
      LEFT JOIN AlbaranesFactura ALB
        ON FB.SERIE = ALB.SERIE
        AND FB.NUMERO = ALB.NUMERO
        AND FB.EJERCICIO = ALB.EJERCICIO
      LEFT JOIN ProductosFactura P
        ON FB.SERIE = P.SERIE
        AND FB.NUMERO = P.NUMERO
        AND FB.EJERCICIO = P.EJERCICIO
      ORDER BY FB.ANO DESC, FB.MES DESC, FB.DIA DESC, FB.NUMERO DESC
    `;

    // Pasar codigoCliente dos veces (para FacturasBase y AlbaranesFactura)
    const facturasRaw = await odbcPool.query(query, [codigoCliente, codigoCliente]);

    // Mapear a formato camelCase que espera el frontend
    const facturas = (facturasRaw || []).map(f => ({
      serieFactura: f.SERIE || '',
      numeroFactura: f.NUMERO || 0,
      ejercicio: f.EJERCICIO || 0,
      ano: f.ANO || 0,
      mes: f.MES || 0,
      dia: f.DIA || 0,
      totalBase: f.BASE_IMPONIBLE || 0,
      totalIVA: f.IVA || 0,
      totalFactura: f.TOTAL || 0,
      fecha: f.FECHA || '',
      estado: f.PENDIENTE === 0 ? 'Pagada' : 'Pendiente',
      numeroProductos: f.NUM_PRODUCTOS || 0,
      albaranes: f.ALBARANES || '',
      numAlbaranes: f.NUM_ALBARANES || 0
    }));

    logger.info(`✅ Facturas obtenidas: ${facturas.length} para cliente ${codigoCliente}`);

    return res.json({ success: true, facturas });
  } catch (error) {
    logger.error('❌ Error obteniendo facturas', error);
    return res.status(500).json({ success: false, message: 'Error obteniendo facturas', error: error.message });
  }
}

/**
 * GET /api/auth/estadisticas/:codigoCliente
 * Obtener estadísticas del cliente
 */
async function obtenerEstadisticas(req, res) {
  try {
    const { codigoCliente } = req.params;
    const databaseService = require('../services/databaseService');
    // Usar la nueva función que devuelve estadísticas por año
    const stats = await databaseService.getClientSummaryByYear(codigoCliente);
    return res.json({ success: true, estadisticas: stats });
  } catch (error) {
    logger.error('❌ Error obteniendo estadísticas', error);
    return res.status(500).json({ success: false, message: 'Error obteniendo estadísticas' });
  }
}

/**
 * GET /api/auth/top-productos/:codigoCliente
 * Obtener productos más comprados
 */
async function obtenerTopProductos(req, res) {
  try {
    const { codigoCliente } = req.params;
    const databaseService = require('../services/databaseService');
    const productosRaw = await databaseService.getClientProducts(codigoCliente, 10);

    // Mapear a formato camelCase que espera el frontend
    const productos = (productosRaw || []).map(p => ({
      codigo: p.CODIGOARTICULO || '',
      nombre: p.DESCRIPCION || '',
      cantidad: p.CANTIDADTOTAL || 0,
      importe: p.IMPORTETOTAL || 0,
      pedidos: p.NUMEROPEDIDOS || 0
    }));

    return res.json({ success: true, productos });
  } catch (error) {
    logger.error('❌ Error obteniendo top productos', error);
    return res.status(500).json({ success: false, message: 'Error obteniendo productos' });
  }
}

/**
 * GET /api/clientes/:codigoCliente/contacto
 * Obtener datos de contacto
 */
async function obtenerDatosContacto(req, res) {
  try {
    const { codigoCliente } = req.params;
    const odbcPool = require('../config/odbcConfig');
    
    const query = `
      SELECT 
        TRIM(CLIP.EMAILCONTACTO) AS EMAIL,
        TRIM(CLI.TELEFONO1) AS TELEFONO
      FROM DSEDAC.CLI CLI
      LEFT JOIN DSEDAC.CLIP CLIP ON TRIM(CLI.CODIGOCLIENTE) = TRIM(CLIP.CODIGOCLIENTE)
      WHERE TRIM(CLI.CODIGOCLIENTE) = ?`;
    const result = await odbcPool.query(query, [codigoCliente]);
    
    if (!result || result.length === 0) {
      return res.status(404).json({ success: false, message: 'Cliente no encontrado' });
    }
    
    return res.json({ 
      success: true, 
      contacto: {
        email: result[0].EMAIL ? result[0].EMAIL.trim() : null,
        telefono: result[0].TELEFONO ? result[0].TELEFONO.trim() : null
      }
    });
  } catch (error) {
    logger.error('❌ Error obteniendo contacto', error);
    return res.status(500).json({ success: false, message: 'Error obteniendo contacto' });
  }
}

/**
 * PUT /api/clientes/:codigoCliente/contacto
 * Actualizar datos de contacto
 */
async function actualizarDatosContacto(req, res) {
  try {
    const { codigoCliente } = req.params;
    const { email, telefono } = req.body;
    const odbcPool = require('../config/odbcConfig');
    
    // Actualizar teléfono en CLI
    const queryTelefono = `UPDATE DSEDAC.CLI SET TELEFONO1 = ? WHERE TRIM(CODIGOCLIENTE) = ?`;
    await odbcPool.query(queryTelefono, [telefono, codigoCliente]);
    
    // Actualizar email en CLIP si existe
    const queryEmail = `UPDATE DSEDAC.CLIP SET EMAILCONTACTO = ? WHERE TRIM(CODIGOCLIENTE) = ?`;
    await odbcPool.query(queryEmail, [email, codigoCliente]);
    
    return res.json({ success: true, message: 'Contacto actualizado' });
  } catch (error) {
    logger.error('❌ Error actualizando contacto', error);
    return res.status(500).json({ success: false, message: 'Error actualizando contacto' });
  }
}

/**
 * GET /api/auth/health
 * Health check
 */
async function healthCheck(req, res) {
  try {
    return res.json({ status: 'ok', service: 'auth', timestamp: new Date().toISOString() });
  } catch (error) {
    return res.status(500).json({ status: 'error', message: error.message });
  }
}

module.exports = {
  login,
  verifyTokenEndpoint,
  getCurrentUser,
  logout,
  refreshToken,
  obtenerPerfil,
  obtenerFacturas,
  obtenerEstadisticas,
  obtenerTopProductos,
  obtenerDatosContacto,
  actualizarDatosContacto,
  healthCheck
};
