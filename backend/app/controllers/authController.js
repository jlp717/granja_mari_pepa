/**
 * CONTROLADOR DE AUTENTICACIÓN
 * ==============================
 * Maneja login, logout y validación de usuarios
 */

const authService = require('../services/authService');
const odbcPool = require('../config/odbcConfig');
const databaseService = require('../services/databaseService'); // Importante para actualizarDatosContacto
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
    logger.info('📋 obtenerPerfil CALLED', { codigoCliente });

    // First try to get from legacy CLI table (with try-catch for new security system users)
    let resultado = null;
    try {
      const queryCliente = `
        SELECT 
          TRIM(CLI.CODIGOCLIENTE) AS CODIGOCLIENTE,
          COALESCE(
            CASE WHEN LENGTH(TRIM(CLI.NOMBRECLIENTE)) > 1 THEN TRIM(CLI.NOMBRECLIENTE) END,
            CASE WHEN LENGTH(TRIM(CLI.NOMBREALTERNATIVO)) > 1 THEN TRIM(CLI.NOMBREALTERNATIVO) END,
            TRIM(CLI.NOMBRECLIENTE)
          ) AS NOMBRECLIENTE,
          TRIM(CLI.NIF) AS NIF,
          TRIM(CLI.DIRECCION) AS DIRECCION,
          TRIM(CLI.POBLACION) AS POBLACION,
          TRIM(CLI.PROVINCIA) AS PROVINCIA,
          TRIM(CLI.CODIGOPOSTAL) AS CODIGOPOSTAL,
          TRIM(CLI.TELEFONO1) AS TELEFONO,
          COALESCE(CEM.EMAIL, CLIP.EMAILCONTACTO) AS EMAIL
        FROM DSEDAC.CLI CLI
        LEFT JOIN DSEDAC.CLIP CLIP ON CLI.CODIGOCLIENTE = CLIP.CODIGOCLIENTE
        LEFT JOIN JAVIER.CUSTOMER_CREDENTIALS CEM ON TRIM(CLI.CODIGOCLIENTE) = TRIM(CEM.CUSTOMER_CODE)
        WHERE CLI.CODIGOCLIENTE = ?
      `;
      resultado = await odbcPool.query(queryCliente, [codigoCliente]);
    } catch (legacyError) {
      // Legacy query failed (e.g., customer code too long for legacy table)
      // This is expected for new security system users - continue to fallback
      logger.info('📋 Legacy query failed, trying CUSTOMER_CREDENTIALS', { reason: legacyError.message });
    }

    // If not in legacy system or query failed, try new security system (CUSTOMER_CREDENTIALS)
    if (!resultado || resultado.length === 0) {
      const querySecure = `
        SELECT 
          cc.CUSTOMER_CODE AS CODIGOCLIENTE,
          cc.FULL_NAME AS NOMBRECLIENTE,
          cc.EMAIL AS EMAIL,
          cc.PHONE AS TELEFONO
        FROM JAVIER.CUSTOMER_CREDENTIALS cc
        WHERE TRIM(cc.CUSTOMER_CODE) = ?
      `;
      resultado = await odbcPool.query(querySecure, [codigoCliente.trim()]);
      logger.info('📋 Query CUSTOMER_CREDENTIALS result', { found: resultado?.length > 0, email: resultado?.[0]?.EMAIL, telefono: resultado?.[0]?.TELEFONO });
    }

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

    const emailValue = cliente.EMAIL ? cliente.EMAIL.trim() : '';
    const telefonoValue = cliente.TELEFONO ? cliente.TELEFONO.trim() : '';

    const perfil = {
      codigoCliente: cliente.CODIGOCLIENTE ? cliente.CODIGOCLIENTE.trim() : codigoCliente,
      nombreCliente: cliente.NOMBRECLIENTE ? cliente.NOMBRECLIENTE.trim() : cliente.FULL_NAME || '',
      nif: cliente.NIF ? cliente.NIF.trim() : '',
      email: emailValue,
      telefono: telefonoValue,
      // Add contacto wrapper for frontend compatibility
      contacto: {
        email: emailValue,
        telefono: telefonoValue
      },
      direccion: {
        calle: cliente.DIRECCION || '',
        poblacion: cliente.POBLACION || '',
        provincia: cliente.PROVINCIA || '',
        codigoPostal: cliente.CODIGOPOSTAL || '',
        completa: direccionCompleta
      }
    };

    // Get security status from CUSTOMER_CREDENTIALS
    try {
      const securityQuery = `
        SELECT 
          IS_LEGACY_PASSWORD,
          PASSWORD_WARNING_DISMISSALS,
          EMAIL,
          PHONE
        FROM JAVIER.CUSTOMER_CREDENTIALS
        WHERE TRIM(CUSTOMER_CODE) = ?
      `;
      const securityResult = await odbcPool.query(securityQuery, [codigoCliente.trim()]);

      if (securityResult && securityResult.length > 0) {
        const security = securityResult[0];
        perfil.seguridad = {
          isLegacyPassword: security.IS_LEGACY_PASSWORD === 1 || security.IS_LEGACY_PASSWORD === '1',
          passwordWarningDismissals: Number(security.PASSWORD_WARNING_DISMISSALS) || 0
        };
        // Update contact info from CUSTOMER_CREDENTIALS if better
        if (security.EMAIL && security.EMAIL.trim() && !perfil.contacto.email) {
          perfil.contacto.email = security.EMAIL.trim();
        }
        if (security.PHONE && security.PHONE.trim() && !perfil.contacto.telefono) {
          perfil.contacto.telefono = security.PHONE.trim();
        }
      }
    } catch (securityError) {
      // Don't fail if security query fails
      logger.warn('Could not get security status', { error: securityError.message });
    }

    logger.info(`✅ Perfil obtenido para cliente ${codigoCliente}`, { email: emailValue, telefono: telefonoValue });

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
 * SOPORTA: Unificación por NIF (Muestra facturas de todos los códigos vinculados al mismo NIF)
 */
async function obtenerFacturas(req, res) {
  try {
    const { codigoCliente } = req.params;
    const { search, busqueda } = req.query;
    const searchParam = search || busqueda;

    // 1. OBTENER CÓDIGOS VINCULADOS (POR NIF)
    let codigosVinculados = [`'${codigoCliente}'`]; // Por defecto, solo el propio código

    try {
      // Consultar NIF del cliente
      const queryNif = `SELECT NIF FROM DSEDAC.CLI WHERE CODIGOCLIENTE = ?`;
      const resultNif = await odbcPool.query(queryNif, [codigoCliente]);

      if (resultNif.length > 0 && resultNif[0].NIF) {
        const nif = resultNif[0].NIF.trim();
        if (nif) {
          // Buscamos TODOS los clientes con ese NIF
          const queryVinculados = `SELECT CODIGOCLIENTE FROM DSEDAC.CLI WHERE NIF = ?`;
          const resultVinculados = await odbcPool.query(queryVinculados, [nif]);

          if (resultVinculados.length > 0) {
            codigosVinculados = resultVinculados.map(r => `'${r.CODIGOCLIENTE.trim()}'`);
          }
        }
      }
    } catch (errNif) {
      logger.warn(`⚠️ Error buscando vinculaciones NIF para ${codigoCliente}`, errNif);
      // Continuamos con el código original si falla la vinculación
    }

    const codigosInClause = codigosVinculados.join(', ');

    // 2. APLICAR FILTROS ESPECÍFICOS
    // Búsqueda dinámica (opcional si se pasa por query)
    let searchFilter = "";
    if (searchParam && searchParam.trim()) {
      const s = searchParam.trim().toUpperCase();
      searchFilter = `AND (
        UPPER(CFC.SERIEFACTURA) LIKE '%${s}%'
        OR CAST(CFC.NUMEROFACTURA AS CHAR(20)) LIKE '%${s}%'
        OR EXISTS (
          SELECT 1
          FROM DSEDAC.CAC CAC_SEARCH
          WHERE TRIM(CAC_SEARCH.SERIEFACTURA) = TRIM(CFC.SERIEFACTURA)
            AND CAC_SEARCH.NUMEROFACTURA = CFC.NUMEROFACTURA
            AND CAC_SEARCH.EJERCICIOFACTURA = CFC.EJERCICIOFACTURA
            AND (
              CAST(CAC_SEARCH.NUMEROALBARAN AS CHAR(20)) LIKE '%${s}%'
              OR TRIM(CAC_SEARCH.PEDIDOREFERENCIA) LIKE '%${s}%'
            )
        )
      )`;
    }

    // FIX ESPECÍFICO PARA CLIENTE 4300013449: Alinear con Libro IVA (Cierre 12/12/2025)
    let dateFilter = "";
    if (codigosInClause.includes("'4300013449'")) {
      dateFilter = "AND (CFC.ANODOCUMENTO < 2025 OR (CFC.ANODOCUMENTO = 2025 AND (CFC.MESDOCUMENTO < 12 OR (CFC.MESDOCUMENTO = 12 AND CFC.DIADOCUMENTO <= 12))))";
    }

    // 3. CONSULTA PRINCIPAL (Unificada)
    // Usamos IN (${codigosInClause}) para traer facturas de todas las cuentas
    const query = `
      WITH PendientesFactura AS (
        SELECT
          TRIM(SERIEDOCUMENTO) AS SERIE,
          NUMERODOCUMENTO AS NUMERO,
          EJERCICIODOCUMENTO AS EJERCICIO,
          SUM(COALESCE(IMPORTEPENDIENTE, 0)) AS PENDIENTE
        FROM DSEDAC.CVC
        GROUP BY TRIM(SERIEDOCUMENTO), NUMERODOCUMENTO, EJERCICIODOCUMENTO
      ),
      FacturasBase AS (
        SELECT
          TRIM(CFC.SERIEFACTURA) AS SERIE,
          CFC.NUMEROFACTURA AS NUMERO,
          CFC.EJERCICIOFACTURA AS EJERCICIO,
          CFC.ANODOCUMENTO AS ANO,
          CFC.MESDOCUMENTO AS MES,
          CFC.DIADOCUMENTO AS DIA,
          CFC.CODIGOCLIENTE AS CODIGO_CLIENTE,
          TRIM(CLI.NOMBRECLIENTE) AS NOMBRE_COMERCIAL,
          TRIM(CLI.NOMBREALTERNATIVO) AS NOMBRE_FISCAL,
          CFC.IMPORTEBASEIMPONIBLE AS BASE_IMPONIBLE,
          CFC.IMPORTEIVA AS IVA,
          CFC.IMPORTETOTAL AS TOTAL,
          COALESCE(PF.PENDIENTE, 0) AS PENDIENTE,
          CAST(
            CASE
              WHEN CFC.DIADOCUMENTO < 10 THEN '0' || TRIM(CAST(CFC.DIADOCUMENTO AS CHAR(2)))
              ELSE TRIM(CAST(CFC.DIADOCUMENTO AS CHAR(2)))
            END || '/' ||
            CASE
              WHEN CFC.MESDOCUMENTO < 10 THEN '0' || TRIM(CAST(CFC.MESDOCUMENTO AS CHAR(2)))
              ELSE TRIM(CAST(CFC.MESDOCUMENTO AS CHAR(2)))
            END || '/' ||
            TRIM(CAST(CFC.ANODOCUMENTO AS CHAR(4)))
          AS VARCHAR(10)) AS FECHA
        FROM DSEDAC.CFC CFC
        LEFT JOIN DSEDAC.CLI CLI ON TRIM(CFC.CODIGOCLIENTE) = TRIM(CLI.CODIGOCLIENTE)
        LEFT JOIN PendientesFactura PF
          ON TRIM(CFC.SERIEFACTURA) = PF.SERIE
          AND CFC.NUMEROFACTURA = PF.NUMERO
          AND CFC.EJERCICIOFACTURA = PF.EJERCICIO
        WHERE TRIM(CFC.CODIGOCLIENTE) IN (${codigosInClause})
          AND CFC.NUMEROFACTURA > 0
          AND CFC.NUMEROFACTURA < 900000
          ${dateFilter}
          ${searchFilter}
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
        WHERE TRIM(CODIGOCLIENTEFACTURA) IN (${codigosInClause})
          AND NUMEROFACTURA > 0
        GROUP BY TRIM(SERIEFACTURA), NUMEROFACTURA, EJERCICIOFACTURA
      ),
      ProductosFactura AS (
        SELECT
          TRIM(LAC.SERIEFACTURA) AS SERIE,
          LAC.NUMEROFACTURA AS NUMERO,
          LAC.EJERCICIOFACTURA AS EJERCICIO,
          COUNT(DISTINCT LAC.CODIGOARTICULO) AS NUM_PRODUCTOS
        FROM DSEDAC.LAC LAC
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

    // Ejecutamos la query
    // NOTA: Como usamos IN (${str}), no pasamos parámetros en el array para esa parte
    const facturasRaw = await odbcPool.query(query);

    // Mapear a formato camelCase
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
      numAlbaranes: f.NUM_ALBARANES || 0,
      codigoCliente: (f.CODIGO_CLIENTE || '').trim(),
      nombreComercial: f.NOMBRE_COMERCIAL || '',
      nombreFiscal: f.NOMBRE_FISCAL || ''
    }));

    // 4. OBTENER LISTA DE CLIENTES ÚNICOS PARA EL SELECTOR
    const queryClientes = `
      SELECT 
        TRIM(CODIGOCLIENTE) AS CODIGO,
        TRIM(NOMBRECLIENTE) AS COMERCIAL,
        TRIM(NOMBREALTERNATIVO) AS FISCAL
      FROM DSEDAC.CLI
      WHERE TRIM(CODIGOCLIENTE) IN (${codigosInClause})
      ORDER BY NOMBRECLIENTE
    `;
    const clientesRaw = await odbcPool.query(queryClientes);
    const clientes = (clientesRaw || []).map(c => ({
      codigoCliente: c.CODIGO,
      nombreComercial: c.COMERCIAL || c.CODIGO,
      nombreFiscal: c.FISCAL || ''
    }));

    logger.info(`✅ Facturas obtenidas (Unificación NIF): ${facturas.length} docs. Clientes vinculados: ${clientes.length}`);

    return res.json({ success: true, facturas, clientes });
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
/**
 * GET /api/clientes/:codigoCliente/contacto
 * Obtener datos de contacto (Email y Teléfono)
 * PRIORIDAD EMAIL: JAVIER.CUSTOMER_EMAILS > DSEDAC.CLIP
 */
async function getContactData(req, res) {
  try {
    const { codigoCliente } = req.params;

    if (!codigoCliente) {
      return res.status(400).json({ success: false, message: 'Código de cliente es requerido' });
    }

    // First try legacy system (with try-catch for new security system users)
    let result = null;
    try {
      const query = `
      SELECT 
        COALESCE(CEM.PHONE, CLI.TELEFONO1) AS TELEFONO,
        COALESCE(CEM.EMAIL, CLIP.EMAILCONTACTO) AS EMAIL
      FROM DSEDAC.CLI CLI
      LEFT JOIN DSEDAC.CLIP CLIP ON TRIM(CLI.CODIGOCLIENTE) = TRIM(CLIP.CODIGOCLIENTE)
      LEFT JOIN JAVIER.CUSTOMER_CREDENTIALS CEM ON TRIM(CLI.CODIGOCLIENTE) = TRIM(CEM.CUSTOMER_CODE)
      WHERE TRIM(CLI.CODIGOCLIENTE) = ?`;
      result = await odbcPool.query(query, [codigoCliente.trim()]);
    } catch (legacyError) {
      // Legacy query failed - continue to CUSTOMER_CREDENTIALS fallback
      logger.info('📋 Legacy contacto query failed, trying CUSTOMER_CREDENTIALS');
    }

    // If not in legacy system, try CUSTOMER_CREDENTIALS (NEW SECURITY SYSTEM)
    if (!result || result.length === 0) {
      const queryCredentials = `
      SELECT 
        cc.EMAIL AS EMAIL,
        cc.PHONE AS TELEFONO
      FROM JAVIER.CUSTOMER_CREDENTIALS cc
      WHERE TRIM(cc.CUSTOMER_CODE) = ?`;
      result = await odbcPool.query(queryCredentials, [codigoCliente.trim()]);

      // If still not found, return empty data (not 404) to allow user to fill it
      if (!result || result.length === 0) {
        return res.json({
          success: true,
          email: null,
          telefono: null,
          contacto: {
            email: null,
            telefono: null
          }
        });
      }
    }

    return res.json({
      success: true,
      // Top-level fields for frontend compatibility
      email: result[0].EMAIL ? result[0].EMAIL.trim() : null,
      telefono: result[0].TELEFONO ? result[0].TELEFONO.trim() : null,
      // Also include nested structure for other uses
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
/**
 * PUT /api/clientes/:codigoCliente/contacto
 * Actualizar datos de contacto
 * STRICT: ONLY UPDATES JAVIER SCHEMA (Legacy tables are Read-Only)
 */
async function actualizarDatosContacto(req, res) {
  try {
    const { codigoCliente } = req.params;
    const { email, telefono } = req.body;

    if (!codigoCliente) {
      return res.status(400).json({
        success: false,
        error: 'Código de cliente es requerido'
      });
    }

    logger.info('📝 Actualizando datos de contacto (JAVIER Schema Only)', { codigoCliente, email, telefono });

    // Check if user exists in CUSTOMER_CREDENTIALS (new security system)
    const checkCredentialsQuery = `
    SELECT CUSTOMER_ID FROM JAVIER.CUSTOMER_CREDENTIALS 
    WHERE TRIM(CUSTOMER_CODE) = ?`;
    const credentialsUser = await odbcPool.query(checkCredentialsQuery, [codigoCliente.trim()]);
    const isNewSecurityUser = credentialsUser && credentialsUser.length > 0;

    // 1. Update email
    if (email !== undefined && email !== null && email.trim() !== '') {
      if (isNewSecurityUser) {
        // Update in CUSTOMER_CREDENTIALS for new security system users
        const updateCredentialsQuery = `
        UPDATE JAVIER.CUSTOMER_CREDENTIALS 
        SET EMAIL = ?, EMAIL_VERIFIED = 1, UPDATED_AT = CURRENT_TIMESTAMP
        WHERE TRIM(CUSTOMER_CODE) = ?`;
        await odbcPool.query(updateCredentialsQuery, [email.trim(), codigoCliente.trim()]);
        logger.info('✅ Email actualizado en CUSTOMER_CREDENTIALS', { codigoCliente, email });
      } else {
        // Legacy: Update in CUSTOMER_EMAILS
        const checkQuery = `
        SELECT CODIGO_CLIENTE 
        FROM JAVIER.CUSTOMER_EMAILS 
        WHERE TRIM(CODIGO_CLIENTE) = ?`;
        const existing = await odbcPool.query(checkQuery, [codigoCliente.trim()]);

        if (existing && existing.length > 0) {
          const updateQuery = `
          UPDATE JAVIER.CUSTOMER_EMAILS 
          SET EMAIL = ?
          WHERE TRIM(CODIGO_CLIENTE) = ?`;
          await odbcPool.query(updateQuery, [email.trim(), codigoCliente.trim()]);
          logger.info('✅ Email actualizado en CUSTOMER_EMAILS', { codigoCliente, email });
        } else {
          const insertQuery = `
          INSERT INTO JAVIER.CUSTOMER_EMAILS (CODIGO_CLIENTE, EMAIL, VERIFICADO)
          VALUES (?, ?, 'N')`;
          await odbcPool.query(insertQuery, [codigoCliente.trim(), email.trim()]);
          logger.info('✅ Email insertado en CUSTOMER_EMAILS', { codigoCliente, email });
        }
      }
    }

    // 2. Update phone (only for new security system users)
    if (telefono !== undefined && telefono !== null) {
      if (isNewSecurityUser) {
        const updatePhoneQuery = `
        UPDATE JAVIER.CUSTOMER_CREDENTIALS 
        SET PHONE = ?, PHONE_VERIFIED = 1, UPDATED_AT = CURRENT_TIMESTAMP
        WHERE TRIM(CUSTOMER_CODE) = ?`;
        await odbcPool.query(updatePhoneQuery, [telefono.trim(), codigoCliente.trim()]);
        logger.info('✅ Teléfono actualizado en CUSTOMER_CREDENTIALS', { codigoCliente, telefono });
      } else {
        logger.info('ℹ️ Phone update requested for legacy user. Skipping as per strict isolation policy.');
      }
    }

    logger.success('✅ Datos de contacto actualizados exitosamente', { codigoCliente });

    return res.json({
      success: true,
      message: 'Contacto actualizado correctamente'
    });

  } catch (error) {
    logger.error('❌ Error actualizando contacto', {
      error: error.message,
      stack: error.stack,
      codigoCliente: req.params.codigoCliente
    });
    return res.status(500).json({
      success: false,
      error: 'Error al guardar los datos: ' + error.message
    });
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

/**
 * POST /api/auth/dismiss-password-warning
 * Marcar aviso de contraseña como visto
 */
async function dismissPasswordWarning(req, res) {
  try {
    const codigoCliente = req.user.codigoCliente;

    logger.info('⏸️ Dismissing password warning', { codigoCliente });

    // Increment PASSWORD_WARNING_DISMISSALS in CUSTOMER_CREDENTIALS
    const updateQuery = `
    UPDATE JAVIER.CUSTOMER_CREDENTIALS
    SET PASSWORD_WARNING_DISMISSALS = PASSWORD_WARNING_DISMISSALS + 1,
        UPDATED_AT = CURRENT_TIMESTAMP
    WHERE TRIM(CUSTOMER_CODE) = ?
  `;

    await odbcPool.query(updateQuery, [codigoCliente.trim()]);
    logger.success('✅ Password warning dismissed', { codigoCliente });

    return res.json({ success: true });
  } catch (error) {
    logger.error('❌ Error dismissPasswordWarning', error);
    return res.status(500).json({ success: false });
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
  // Export the correctly named function
  getContactData, // Was obtenerDatosContacto
  actualizarDatosContacto,
  healthCheck,
  dismissPasswordWarning,
  obtenerDatosContacto: getContactData // Alias for backward compatibility if needed
};
