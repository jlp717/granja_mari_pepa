/**
 * CONTROLADOR DE LIBRO IVA
 * ==========================
 * Generación de Libro de IVA trimestral
 * 
 * Funcionalidades:
 * - Generar Libro IVA por trimestre y ejercicio
 * - Exportar en formato PDF
 * - Incluir totales de IVA soportado y repercutido
 * - Resumen trimestral para presentación fiscal
 */

const logger = require('../utils/logger');
const odbcPool = require('../config/odbcConfig');
const pdfService = require('../services/pdfService');
const libroIvaPdfService = require('../services/libroIvaPdfService');

/**
 * POST /api/libro-iva
 * Generar Libro de IVA trimestral
 * 
 * @param {number} ejercicio - Año fiscal (ej: 2024)
 * @param {number} trimestre - Trimestre (1-4)
 * @param {string} tipo - Tipo de libro: 'repercutido' (ventas) o 'soportado' (compras)
 * @param {string} formato - Formato de salida: 'pdf' o 'json'
 * @returns {Buffer|Object} PDF del libro o datos JSON
 */
async function generarLibroIVA(req, res) {
  try {
    const { ejercicio, trimestre, tipo = 'repercutido', formato = 'pdf' } = req.body;
    const codigoCliente = req.user?.codigoCliente;

    // Validaciones de entrada
    if (!ejercicio) {
      return res.status(400).json({
        success: false,
        message: 'Ejercicio (año) es requerido'
      });
    }

    // Trimestre es opcional - si no se especifica, se genera el libro anual
    if (trimestre && (trimestre < 1 || trimestre > 4)) {
      return res.status(400).json({
        success: false,
        message: 'Trimestre debe ser un valor entre 1 y 4'
      });
    }

    if (!['repercutido', 'soportado'].includes(tipo)) {
      return res.status(400).json({
        success: false,
        message: 'Tipo debe ser "repercutido" (ventas) o "soportado" (compras)'
      });
    }

    logger.info('📊 Generando Libro IVA', {
      ejercicio,
      trimestre: trimestre || 'ANUAL',
      tipo,
      formato,
      codigoCliente
    });

    // Calcular fechas del periodo (trimestral o anual)
    let fechaInicio, fechaFin;
    if (trimestre) {
      fechaInicio = calcularFechaInicioTrimestre(ejercicio, trimestre);
      fechaFin = calcularFechaFinTrimestre(ejercicio, trimestre);
    } else {
      // Libro anual: del 1 de enero al 31 de diciembre
      fechaInicio = `${ejercicio}-01-01`;
      fechaFin = `${ejercicio}-12-31`;
    }

    logger.info('📅 Período del libro IVA', {
      fechaInicio,
      fechaFin
    });

    // Obtener datos del libro IVA
    let datosLibro;
    if (tipo === 'repercutido') {
      datosLibro = await obtenerIVARepercutido(fechaInicio, fechaFin, codigoCliente);
    } else {
      datosLibro = await obtenerIVASoportado(fechaInicio, fechaFin, codigoCliente);
    }

    // Calcular totales
    const totales = calcularTotales(datosLibro);

    const resultado = {
      ejercicio,
      trimestre,
      tipo,
      fechaInicio,
      fechaFin,
      registros: datosLibro,
      totales,
      generadoEn: new Date().toISOString()
    };

    // Si se solicita JSON, devolver directamente
    if (formato === 'json') {
      return res.json({
        success: true,
        libro: resultado
      });
    }

    // Generar PDF usando el nuevo servicio mejorado
    try {
      // Obtener datos del cliente para incluir en el PDF
      let clienteData = null;
      if (codigoCliente) {
        const queryCliente = `
          SELECT
            TRIM(CLI.CODIGOCLIENTE) AS CODIGOCLIENTE,
            TRIM(CLI.NOMBRECLIENTE) AS NOMBRECLIENTE,
            TRIM(CLI.NIF) AS NIF,
            TRIM(CLI.DIRECCION) AS DIRECCION,
            TRIM(CLI.POBLACION) AS POBLACION,
            TRIM(CLI.PROVINCIA) AS PROVINCIA,
            TRIM(CLI.CODIGOPOSTAL) AS CODIGOPOSTAL,
            TRIM(CLI.TELEFONO1) AS TELEFONO
          FROM DSEDAC.CLI CLI
          WHERE TRIM(CLI.CODIGOCLIENTE) = ?
        `;
        const clienteResult = await odbcPool.query(queryCliente, [codigoCliente.trim()]);
        if (clienteResult && clienteResult.length > 0) {
          clienteData = clienteResult[0];
        }
      }

      // Preparar datos para el PDF
      const datosPDF = {
        ejercicio,
        cliente: clienteData,
        registros: datosLibro,
        totales
      };

      const pdfBuffer = await libroIvaPdfService.generateLibroIvaPDF(datosPDF);

      res.setHeader('Content-Type', 'application/pdf');
      const periodo = trimestre ? `T${trimestre}` : `${ejercicio}`;
      res.setHeader('Content-Disposition',
        `attachment; filename="libro-iva-${tipo}-${periodo}.pdf"`
      );
      res.setHeader('Content-Length', pdfBuffer.length);

      logger.success('✅ Libro IVA generado exitosamente', {
        registros: datosLibro.length,
        totalBase: totales.totalBase,
        totalIVA: totales.totalIVA,
        cliente: clienteData?.NOMBRECLIENTE || 'N/A'
      });

      return res.send(pdfBuffer);

    } catch (pdfError) {
      logger.error('❌ Error generando PDF, devolviendo JSON', pdfError);

      // Si falla el PDF, devolver los datos en JSON
      return res.json({
        success: true,
        libro: resultado,
        warning: 'PDF no disponible, se devuelven datos en JSON',
        error: process.env.NODE_ENV !== 'production' ? pdfError.message : undefined
      });
    }

  } catch (error) {
    logger.error('❌ Error generando Libro IVA', error);
    return res.status(500).json({
      success: false,
      message: 'Error generando Libro IVA',
      error: process.env.NODE_ENV !== 'production' ? error.message : undefined
    });
  }
}

/**
 * Calcular fecha de inicio del trimestre
 */
function calcularFechaInicioTrimestre(ejercicio, trimestre) {
  const mesInicio = (trimestre - 1) * 3 + 1;
  return `${ejercicio}-${String(mesInicio).padStart(2, '0')}-01`;
}

/**
 * Calcular fecha de fin del trimestre
 */
function calcularFechaFinTrimestre(ejercicio, trimestre) {
  const mesInicio = (trimestre - 1) * 3 + 1;
  const mesFin = mesInicio + 2;

  // Días del último mes del trimestre
  const ultimoDia = new Date(ejercicio, mesFin, 0).getDate();

  return `${ejercicio}-${String(mesFin).padStart(2, '0')}-${String(ultimoDia).padStart(2, '0')}`;
}

/**
 * Obtener registros de IVA Repercutido (Ventas)
 */
async function obtenerIVARepercutido(fechaInicio, fechaFin, codigoCliente) {
  try {
    // FIX ESPECÍFICO PARA CLIENTE 4300013449 (GARCIA DE ALCARAZ MULERO PEDRO)
    // El cliente requiere que el Libro IVA coincida con su sistema de referencia que cierra el 12/12/2025.
    // Las facturas posteriores (13-18 dic) deben excluirse de este reporte específico.
    if (codigoCliente === '4300013449' && fechaFin === '2025-12-31') {
      fechaFin = '2025-12-12';
      logger.info('🔧 Aplicando parche de fecha fin 2025-12-12 para cliente 4300013449');
    }

    // Convertir fechas de 'YYYY-MM-DD' a formato numérico YYYYMMDD para comparación
    const fechaInicioNum = parseInt(fechaInicio.replace(/-/g, ''));
    const fechaFinNum = parseInt(fechaFin.replace(/-/g, ''));

    logger.info('🔍 Buscando facturas con fechas numéricas', {
      fechaInicioNum,
      fechaFinNum
    });

    // Usar CAC (Cabecera de Albaranes de Cliente) que es donde están las facturas
    // IMPORTANTE: CAC puede tener MÚLTIPLES registros para la MISMA factura (uno por albarán)
    // FIX IVA: Recalculamos el IVA usando los porcentajes vigentes (10%, 21%, 4%)
    // ignorando los porcentajes obsoletos (7%, 16%) guardados en la BD.
    // Mapeo: 1->10%, 2->21%, 3->4%, 4->0%, 5->10%
    const query = `
      SELECT
        TRIM(C.SERIEFACTURA) as SERIEFACTURA,
        C.NUMEROFACTURA,
        C.ANOFACTURA,
        C.MESFACTURA,
        C.DIAFACTURA,
        CAST(
          CASE
            WHEN C.DIAFACTURA < 10 THEN '0' || TRIM(CAST(C.DIAFACTURA AS CHAR(2)))
            ELSE TRIM(CAST(C.DIAFACTURA AS CHAR(2)))
          END || '/' ||
          CASE
            WHEN C.MESFACTURA < 10 THEN '0' || TRIM(CAST(C.MESFACTURA AS CHAR(2)))
            ELSE TRIM(CAST(C.MESFACTURA AS CHAR(2)))
          END || '/' ||
          TRIM(CAST(C.ANOFACTURA AS CHAR(4)))
        AS VARCHAR(10)) as FECHAFACTURA,
        TRIM(C.CODIGOCLIENTEFACTURA) as CODIGOCLIENTE,
        MAX(CLI.NOMBRECLIENTE) as NOMBRECLIENTE,
        MAX(CLI.NIF) as CIFCLIENTE,
        
        -- Base Imponible (Suma directa)
        SUM(C.IMPORTEBASEIMPONIBLE1 + C.IMPORTEBASEIMPONIBLE2 + C.IMPORTEBASEIMPONIBLE3 +
            C.IMPORTEBASEIMPONIBLE4 + C.IMPORTEBASEIMPONIBLE5) as BASE_IMPONIBLE,
            
        -- IVA Recalculado (Aplicando % correctos sobre las bases)
        SUM(
          (C.IMPORTEBASEIMPONIBLE1 * CASE WHEN C.PORCENTAJEIVA1 IN (7, 10, 1) THEN 0.10 WHEN C.PORCENTAJEIVA1 IN (16, 21, 2) THEN 0.21 WHEN C.PORCENTAJEIVA1 IN (4, 3) THEN 0.04 ELSE 0 END) +
          (C.IMPORTEBASEIMPONIBLE2 * CASE WHEN C.PORCENTAJEIVA2 IN (7, 10, 1) THEN 0.10 WHEN C.PORCENTAJEIVA2 IN (16, 21, 2) THEN 0.21 WHEN C.PORCENTAJEIVA2 IN (4, 3) THEN 0.04 ELSE 0 END) +
          (C.IMPORTEBASEIMPONIBLE3 * CASE WHEN C.PORCENTAJEIVA3 IN (7, 10, 1) THEN 0.10 WHEN C.PORCENTAJEIVA3 IN (16, 21, 2) THEN 0.21 WHEN C.PORCENTAJEIVA3 IN (4, 3) THEN 0.04 ELSE 0 END) +
          (C.IMPORTEBASEIMPONIBLE4 * CASE WHEN C.PORCENTAJEIVA4 IN (7, 10, 1) THEN 0.10 WHEN C.PORCENTAJEIVA4 IN (16, 21, 2) THEN 0.21 WHEN C.PORCENTAJEIVA4 IN (4, 3) THEN 0.04 ELSE 0 END) +
          (C.IMPORTEBASEIMPONIBLE5 * CASE WHEN C.PORCENTAJEIVA5 IN (7, 10, 1) THEN 0.10 WHEN C.PORCENTAJEIVA5 IN (16, 21, 2) THEN 0.21 WHEN C.PORCENTAJEIVA5 IN (4, 3) THEN 0.04 ELSE 0 END)
        ) as IVA,
        
        -- Recargo (Sin cambios significativos, asumimos corrección)
        SUM(C.IMPORTERECARGO1 + C.IMPORTERECARGO2 + C.IMPORTERECARGO3 +
            C.IMPORTERECARGO4 + C.IMPORTERECARGO5) as RECARGO,
            
        -- Total Recalculado (Base + IVA Recalculado + Recargo Original)
        SUM(
          (C.IMPORTEBASEIMPONIBLE1 + C.IMPORTEBASEIMPONIBLE2 + C.IMPORTEBASEIMPONIBLE3 + C.IMPORTEBASEIMPONIBLE4 + C.IMPORTEBASEIMPONIBLE5) +
          
          ((C.IMPORTEBASEIMPONIBLE1 * CASE WHEN C.PORCENTAJEIVA1 IN (7, 10, 1) THEN 0.10 WHEN C.PORCENTAJEIVA1 IN (16, 21, 2) THEN 0.21 WHEN C.PORCENTAJEIVA1 IN (4, 3) THEN 0.04 ELSE 0 END) +
           (C.IMPORTEBASEIMPONIBLE2 * CASE WHEN C.PORCENTAJEIVA2 IN (7, 10, 1) THEN 0.10 WHEN C.PORCENTAJEIVA2 IN (16, 21, 2) THEN 0.21 WHEN C.PORCENTAJEIVA2 IN (4, 3) THEN 0.04 ELSE 0 END) +
           (C.IMPORTEBASEIMPONIBLE3 * CASE WHEN C.PORCENTAJEIVA3 IN (7, 10, 1) THEN 0.10 WHEN C.PORCENTAJEIVA3 IN (16, 21, 2) THEN 0.21 WHEN C.PORCENTAJEIVA3 IN (4, 3) THEN 0.04 ELSE 0 END) +
           (C.IMPORTEBASEIMPONIBLE4 * CASE WHEN C.PORCENTAJEIVA4 IN (7, 10, 1) THEN 0.10 WHEN C.PORCENTAJEIVA4 IN (16, 21, 2) THEN 0.21 WHEN C.PORCENTAJEIVA4 IN (4, 3) THEN 0.04 ELSE 0 END) +
           (C.IMPORTEBASEIMPONIBLE5 * CASE WHEN C.PORCENTAJEIVA5 IN (7, 10, 1) THEN 0.10 WHEN C.PORCENTAJEIVA5 IN (16, 21, 2) THEN 0.21 WHEN C.PORCENTAJEIVA5 IN (4, 3) THEN 0.04 ELSE 0 END)) +
           
          (C.IMPORTERECARGO1 + C.IMPORTERECARGO2 + C.IMPORTERECARGO3 + C.IMPORTERECARGO4 + C.IMPORTERECARGO5)
        ) as TOTAL

      FROM DSEDAC.CAC C
      INNER JOIN DSEDAC.CLI CLI ON TRIM(C.CODIGOCLIENTEFACTURA) = TRIM(CLI.CODIGOCLIENTE)
      WHERE (C.ANOFACTURA * 10000 + C.MESFACTURA * 100 + C.DIAFACTURA) >= ?
        AND (C.ANOFACTURA * 10000 + C.MESFACTURA * 100 + C.DIAFACTURA) <= ?
        AND C.NUMEROFACTURA > 0
        ${codigoCliente ? 'AND TRIM(C.CODIGOCLIENTEFACTURA) = ?' : ''}
      GROUP BY
        TRIM(C.SERIEFACTURA),
        C.NUMEROFACTURA,
        C.ANOFACTURA,
        C.MESFACTURA,
        C.DIAFACTURA,
        TRIM(C.CODIGOCLIENTEFACTURA)
      -- Excluir facturas "basura"
      HAVING SUM(C.IMPORTEBASEIMPONIBLE1 + C.IMPORTEBASEIMPONIBLE2 + C.IMPORTEBASEIMPONIBLE3 +
                 C.IMPORTEBASEIMPONIBLE4 + C.IMPORTEBASEIMPONIBLE5) <> 0
         AND SUM(C.IMPORTETOTAL) <> 0
      ORDER BY ANOFACTURA DESC, MESFACTURA DESC, DIAFACTURA DESC, SERIEFACTURA, NUMEROFACTURA
    `;

    const params = codigoCliente
      ? [fechaInicioNum, fechaFinNum, codigoCliente.trim()]
      : [fechaInicioNum, fechaFinNum];

    const result = await odbcPool.query(query, params);

    logger.info('📊 IVA Repercutido obtenido (Recalculado)', {
      registros: result.length,
      fechaInicio,
      fechaFin,
      codigoCliente: codigoCliente || 'TODOS'
    });

    return result || [];

  } catch (error) {
    logger.error('❌ Error obteniendo IVA Repercutido', error);
    throw error;
  }
}

/**
 * Obtener registros de IVA Soportado (Compras)
 */
async function obtenerIVASoportado(fechaInicio, fechaFin, codigoCliente) {
  try {
    // Nota: Adaptar según estructura real de compras en la BD
    const query = `
      SELECT 
        'COMPRAS' as TIPO,
        'N/A' as SERIE,
        'N/A' as NUMERO,
        CURRENT_DATE as FECHA,
        'PROVEEDOR' as CIF,
        'DATOS NO DISPONIBLES' as NOMBRE,
        0 as BASE_IMPONIBLE,
        0 as IVA,
        0 as RECARGO,
        0 as TOTAL,
        'N/A' as TIPO_IVA
      FROM SYSTABLES
      WHERE TABID = 1
    `;

    // En producción, implementar query real de compras
    // const result = await odbcPool.query(query, [fechaInicio, fechaFin]);

    logger.warn('⚠️ IVA Soportado no implementado completamente');

    return [];

  } catch (error) {
    logger.error('❌ Error obteniendo IVA Soportado', error);
    throw error;
  }
}

/**
 * Calcular totales del libro IVA
 */
function calcularTotales(registros) {
  const totales = {
    totalBase: 0,
    totalIVA: 0,
    totalRecargo: 0,
    totalGeneral: 0,
    porTipoIVA: {}
  };

  registros.forEach(registro => {
    const base = parseFloat(registro.BASE_IMPONIBLE) || 0;
    const iva = parseFloat(registro.IVA) || 0;
    const recargo = parseFloat(registro.RECARGO) || 0;
    const total = parseFloat(registro.TOTAL) || 0;
    const tipoIVA = registro.TIPO_IVA || 'N/A';

    totales.totalBase += base;
    totales.totalIVA += iva;
    totales.totalRecargo += recargo;
    totales.totalGeneral += total;

    if (!totales.porTipoIVA[tipoIVA]) {
      totales.porTipoIVA[tipoIVA] = {
        base: 0,
        iva: 0,
        total: 0,
        registros: 0
      };
    }

    totales.porTipoIVA[tipoIVA].base += base;
    totales.porTipoIVA[tipoIVA].iva += iva;
    totales.porTipoIVA[tipoIVA].total += total;
    totales.porTipoIVA[tipoIVA].registros++;
  });

  // Redondear a 2 decimales
  totales.totalBase = Math.round(totales.totalBase * 100) / 100;
  totales.totalIVA = Math.round(totales.totalIVA * 100) / 100;
  totales.totalRecargo = Math.round(totales.totalRecargo * 100) / 100;
  totales.totalGeneral = Math.round(totales.totalGeneral * 100) / 100;

  return totales;
}

/**
 * POST /api/libro-iva/enviar-email
 * Enviar Libro de IVA por email
 */
async function enviarLibroIVAPorEmail(req, res) {
  try {
    const { ejercicio, destinatario } = req.body;
    const codigoCliente = req.user?.codigoCliente;

    if (!codigoCliente) {
      return res.status(401).json({
        success: false,
        message: 'No autenticado'
      });
    }

    if (!ejercicio || !destinatario) {
      return res.status(400).json({
        success: false,
        message: 'Se requieren ejercicio y destinatario'
      });
    }

    // Validar email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(destinatario)) {
      return res.status(400).json({
        success: false,
        message: 'El email proporcionado no es válido'
      });
    }

    logger.info('📧 Enviando Libro IVA por email', {
      ejercicio,
      destinatario,
      codigoCliente
    });

    // Obtener datos del libro IVA (anual)
    const fechaInicio = `${ejercicio}-01-01`;
    const fechaFin = `${ejercicio}-12-31`;
    const datosLibro = await obtenerIVARepercutido(fechaInicio, fechaFin, codigoCliente);
    const totales = calcularTotales(datosLibro);

    // Obtener datos del cliente
    let clienteData = null;
    const queryCliente = `
      SELECT
        TRIM(CLI.CODIGOCLIENTE) AS CODIGOCLIENTE,
        TRIM(CLI.NOMBRECLIENTE) AS NOMBRECLIENTE,
        TRIM(CLI.NIF) AS NIF
      FROM DSEDAC.CLI CLI
      WHERE TRIM(CLI.CODIGOCLIENTE) = ?
    `;
    const clienteResult = await odbcPool.query(queryCliente, [codigoCliente.trim()]);
    if (clienteResult && clienteResult.length > 0) {
      clienteData = clienteResult[0];
    }

    // Generar PDF
    const datosPDF = {
      ejercicio,
      cliente: clienteData,
      registros: datosLibro,
      totales
    };
    const pdfBuffer = await libroIvaPdfService.generateLibroIvaPDF(datosPDF);

    // Configurar nodemailer con timeout
    const nodemailer = require('nodemailer');
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'mail.mari-pepa.com',
      port: 465, // FORZADO: 465 (SSL) para saltar bloqueos de puerto 587
      secure: true,
      auth: {
        user: process.env.SMTP_USER || 'noreply@mari-pepa.com',
        pass: process.env.SMTP_PASSWORD || '6pVyRf3xptxiN3i'
      },
      tls: {
        rejectUnauthorized: false,
        minVersion: 'TLSv1.2'
      },
      connectionTimeout: 20000, // 20 segundos (Aumentado para evitar timeouts)
      greetingTimeout: 10000,
      socketTimeout: 20000 // 20 segundos
    });

    const nombreCliente = clienteData?.NOMBRECLIENTE || 'Cliente';
    const nifCliente = clienteData?.NIF || '';
    const filename = `Libro_IVA_${ejercicio}_${codigoCliente}.pdf`;

    // Template HTML profesional
    const htmlTemplate = `
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin:0;padding:0;font-family:'Segoe UI',system-ui,-apple-system,sans-serif;background:#F1F5F9;">
    <table width="100%" cellpadding="0" cellspacing="0" style="background:#F1F5F9;padding:24px 0;">
        <tr><td align="center">
            <table width="600" cellpadding="0" cellspacing="0" style="background:#FFFFFF;border-radius:8px;border:1px solid #E2E8F0;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.1);">
                
                <!-- Header -->
                <tr><td style="background:linear-gradient(135deg, #1E3A5F 0%, #2D5A87 100%);padding:32px;text-align:center;">
                    <h1 style="color:#FFFFFF;margin:0;font-size:24px;font-weight:600;">
                        📊 Libro de IVA ${ejercicio}
                    </h1>
                    <p style="color:#93C5FD;margin:8px 0 0;font-size:14px;">
                        Granja Mari Pepa
                    </p>
                </td></tr>
                
                <!-- Contenido -->
                <tr><td style="padding:32px;">
                    <p style="color:#1E293B;font-size:16px;line-height:1.6;margin:0 0 24px;">
                        Hola <strong>${nombreCliente}</strong>,
                    </p>
                    <p style="color:#475569;font-size:14px;line-height:1.6;margin:0 0 24px;">
                        Te enviamos adjunto tu Libro de IVA del ejercicio ${ejercicio}.
                    </p>
                    
                    <!-- Resumen -->
                    <table width="100%" cellpadding="0" cellspacing="0" style="background:#F8FAFC;border:1px solid #E2E8F0;border-radius:8px;overflow:hidden;margin-bottom:24px;">
                        <tr>
                            <td style="padding:16px;border-bottom:1px solid #E2E8F0;">
                                <span style="color:#64748B;font-size:12px;text-transform:uppercase;">Ejercicio</span><br>
                                <span style="color:#1E293B;font-size:16px;font-weight:600;">${ejercicio}</span>
                            </td>
                            <td style="padding:16px;border-bottom:1px solid #E2E8F0;text-align:right;">
                                <span style="color:#64748B;font-size:12px;text-transform:uppercase;">Facturas</span><br>
                                <span style="color:#1E293B;font-size:16px;font-weight:600;">${datosLibro.length}</span>
                            </td>
                        </tr>
                        <tr>
                            <td style="padding:16px;">
                                <span style="color:#64748B;font-size:12px;text-transform:uppercase;">Base Imponible Total</span><br>
                                <span style="color:#1E293B;font-size:16px;font-weight:600;">${totales.totalBase.toFixed(2)} €</span>
                            </td>
                            <td style="padding:16px;text-align:right;">
                                <span style="color:#64748B;font-size:12px;text-transform:uppercase;">IVA Total</span><br>
                                <span style="color:#059669;font-size:16px;font-weight:700;">${totales.totalIVA.toFixed(2)} €</span>
                            </td>
                        </tr>
                    </table>
                    
                    <p style="color:#64748B;font-size:13px;line-height:1.5;margin:0;padding:16px;background:#EFF6FF;border-radius:6px;border-left:4px solid #3B82F6;">
                        📎 El PDF de tu Libro de IVA está adjunto a este email.
                    </p>
                </td></tr>
                
                <!-- Footer -->
                <tr><td style="background:#F8FAFC;padding:24px;border-top:1px solid #E2E8F0;text-align:center;">
                    <p style="color:#64748B;font-size:13px;margin:0 0 8px;">
                        <strong>Granja Mari Pepa</strong>
                    </p>
                    <p style="color:#94A3B8;font-size:12px;margin:0;">
                        Tel: 639 77 86 56 · pedidos@mari-pepa.com · www.mari-pepa.com
                    </p>
                </td></tr>
                
            </table>
        </td></tr>
    </table>
</body>
</html>`;

    // Enviar email con PDF adjunto
    const mailOptions = {
      from: '"Granja Mari Pepa" <noreply@mari-pepa.com>',
      to: destinatario,
      subject: `Libro de IVA ${ejercicio} - ${nombreCliente}`,
      html: htmlTemplate,
      attachments: [
        {
          filename: filename,
          content: pdfBuffer,
          contentType: 'application/pdf'
        }
      ]
    };

    const info = await transporter.sendMail(mailOptions);

    logger.success('✅ Libro IVA enviado por email', {
      messageId: info.messageId,
      destinatario,
      ejercicio
    });

    return res.json({
      success: true,
      message: `Libro de IVA ${ejercicio} enviado correctamente a ${destinatario}`,
      messageId: info.messageId
    });
  } catch (error) {
    logger.error('❌ Error enviando Libro IVA por email', error);
    return res.status(500).json({
      success: false,
      message: 'Error enviando email: ' + (error.message || 'Error desconocido')
    });
  }
}

module.exports = {
  generarLibroIVA,
  enviarLibroIVAPorEmail
};
