/**
 * SERVICIO DE GENERACIÓN DE PDF PARA LIBRO IVA
 * ==============================================
 * Genera PDFs del Libro de IVA EXACTAMENTE como el diseño oficial de Mari Pepa
 *
 * Basado en el diseño proporcionado en la imagen de referencia
 */

const PDFDocument = require('pdfkit');
const logger = require('../utils/logger');
const path = require('path');
const fs = require('fs');

// Ruta al header de Mari Pepa
const HEADER_PATH = path.join(__dirname, '../../assets/header.webp');
const HEADER_PNG_PATH = path.join(__dirname, '../../assets/header.png');

// Datos de empresa
const EMPRESA = {
  registro: 'Inscrita en el registro mercantil de Murcia. Libro 140, Sección 3ª, Folio 142, Hoja 5657, Inscripción 2ª. CIF: B04008710'
};

/**
 * Dibujar header corporativo
 */
function drawHeader(doc, yStart = 20) {
  let yPos = yStart;

  // Intentar cargar imagen
  if (fs.existsSync(HEADER_PNG_PATH)) {
    try {
      doc.image(HEADER_PNG_PATH, 40, yPos, { width: 515, height: 85 });
      return yPos + 90;
    } catch (e) {
      logger.warn('⚠️ No se pudo cargar header.png');
    }
  }

  if (fs.existsSync(HEADER_PATH)) {
    try {
      doc.image(HEADER_PATH, 40, yPos, { width: 515, height: 85 });
      return yPos + 90;
    } catch (e) {
      logger.warn('⚠️ No se pudo cargar header.webp');
    }
  }

  // Header de texto si no hay imagen
  doc.fontSize(24).font('Helvetica-Bold').fillColor('#003d7a').text('Mari Pepa', 40, yPos);
  yPos += 28;
  doc.fontSize(11).fillColor('#333333').text('Food & Frozen', 40, yPos);
  yPos += 18;
  doc.fontSize(8).font('Helvetica').fillColor('#666666').text('Congelados y refrigerados para hostelería', 40, yPos);
  yPos += 12;
  doc.text('www.mari-pepa.com', 40, yPos);
  return yPos + 30;
}

/**
 * Formatear número estilo español (1234.56 → 1.234,56)
 */
function formatNumber(num, decimals = 2) {
  if (num === null || num === undefined || isNaN(num)) return '0' + ',00'.substring(0, decimals > 0 ? decimals + 1 : 0);
  const fixed = Math.abs(num).toFixed(decimals);
  const parts = fixed.split('.');
  const integerPart = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  const result = parts[1] ? integerPart + ',' + parts[1] : integerPart;
  return num < 0 ? '-' + result : result;
}

/**
 * Generar PDF del Libro de IVA EXACTO al diseño oficial
 */
async function generateLibroIvaPDF(datosLibro) {
  try {
    const { ejercicio, cliente, registros = [], totales } = datosLibro;

    logger.info('📄 Generando PDF Libro IVA', {
      ejercicio,
      cliente: cliente?.NOMBRECLIENTE || 'N/A',
      registros: registros.length
    });

    return new Promise((resolve, reject) => {
      const doc = new PDFDocument({
        size: 'A4',
        margin: 40,
        info: {
          Title: `Libro IVA ${ejercicio}`,
          Author: 'Mari Pepa Food & Frozen'
        }
      });

      const chunks = [];
      doc.on('data', chunk => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      // Header corporativo
      let y = drawHeader(doc, 20);

      // Título principal con fondo azul (como en la imagen)
      doc.rect(40, y, 515, 20).fillAndStroke('#1a5490', '#1a5490');
      doc.fontSize(12).font('Helvetica-Bold').fillColor('#FFFFFF');
      doc.text('LIBRO DE I.V.A. REPERCUTIDO', 45, y + 6);
      y += 26;

      // Fecha de generación (alineado a la derecha)
      const fechaGenerado = new Date().toLocaleDateString('es-ES', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      });
      doc.fontSize(7).font('Helvetica').fillColor('#666666');
      doc.text(`Generado: ${fechaGenerado}`, 400, y, { align: 'right', width: 155 });
      y += 12;

      // PERIODO FISCAL
      doc.fontSize(8).font('Helvetica-Bold').fillColor('#000000');
      doc.text('PERIODO FISCAL:', 40, y);
      doc.font('Helvetica');
      doc.text(`01/01/${ejercicio} hasta 31/12/${ejercicio}`, 130, y);
      y += 14;

      // CLIENTE (información completa como en la imagen)
      doc.font('Helvetica-Bold');
      doc.text('CLIENTE:', 40, y);
      y += 2;

      if (cliente) {
        doc.font('Helvetica');
        // Nombre en mayúsculas
        doc.text((cliente.NOMBRECLIENTE || '').toUpperCase(), 40, y + 10);
        y += 22;

        // Dirección
        if (cliente.DIRECCION) {
          doc.text(cliente.DIRECCION, 40, y);
          y += 10;
        }

        // Código Postal y Población
        if (cliente.CODIGOPOSTAL || cliente.POBLACION) {
          doc.text(`${cliente.CODIGOPOSTAL || ''} ${cliente.POBLACION || ''}`, 40, y);
          y += 10;
        }

        // Teléfono
        if (cliente.TELEFONO) {
          doc.text(`Tel: ${cliente.TELEFONO}`, 40, y);
          y += 10;
        }

        // NIF
        if (cliente.NIF) {
          doc.text(cliente.NIF, 40, y);
          y += 10;
        }
      }

      y += 8;

      // TABLA DE FACTURAS - Layout exacto de la imagen
      // Columnas: Factura | Fecha | Cliente | N.I.F. | Base Imp. | % I.V.A. | Importe I.V.A. | % Rec. | Imp. Rec. | Importe Total

      // Definir posiciones de columnas (ajustadas para A4)
      const col = {
        factura: 42,      // Factura
        fecha: 90,        // Fecha
        cliente: 140,     // Cliente (N.I.F.)
        nif: 230,         // N.I.F.
        base: 290,        // Base Imponible
        porcIva: 350,     // % I.V.A.
        impIva: 390,      // Importe I.V.A.
        porcRec: 450,     // % Rec.
        impRec: 480,      // Imp. Rec.
        total: 515        // Importe Total
      };

      // Cabecera de tabla (fondo gris)
      doc.rect(40, y, 515, 16).fillAndStroke('#E8E8E8', '#000000');

      doc.fontSize(7).font('Helvetica-Bold').fillColor('#000000');
      doc.text('Factura', col.factura, y + 4, { width: 45 });
      doc.text('Fecha', col.fecha, y + 4, { width: 45 });
      doc.text('Cliente', col.cliente, y + 4, { width: 85 });
      doc.text('N.I.F.', col.nif, y + 4, { width: 55 });
      doc.text('Base Imponible', col.base, y + 4, { width: 55, align: 'right' });
      doc.text('% I.V.A.', col.porcIva, y + 4, { width: 35, align: 'center' });
      doc.text('Importe I.V.A.', col.impIva, y + 4, { width: 55, align: 'right' });
      doc.text('% Rec.', col.porcRec, y + 4, { width: 25, align: 'center' });
      doc.text('Imp. Rec.', col.impRec, y + 4, { width: 30, align: 'right' });
      doc.text('Importe Total', col.total, y + 4, { width: 38, align: 'right' });

      y += 18;

      // Líneas de facturas
      doc.fontSize(6).font('Helvetica');

      // Agrupar por serie para totales parciales
      const facturasPorSerie = {};
      registros.forEach(reg => {
        const serie = reg.SERIEFACTURA || 'SIN SERIE';
        if (!facturasPorSerie[serie]) {
          facturasPorSerie[serie] = [];
        }
        facturasPorSerie[serie].push(reg);
      });

      let totalBaseGeneral = 0;
      let totalIvaGeneral = 0;
      let totalRecargoGeneral = 0;
      let totalGeneral = 0;

      // Renderizar facturas agrupadas por serie
      Object.keys(facturasPorSerie).forEach(serie => {
        const facturasSerIe = facturasPorSerie[serie];

        let totalBaseSerie = 0;
        let totalIvaSerie = 0;
        let totalRecargoSerie = 0;
        let totalSerie = 0;

        facturasSerIe.forEach((reg, index) => {
          // Salto de página si es necesario
          if (y > 720) {
            doc.addPage();
            y = drawHeader(doc, 20) + 10;
          }

          const baseImponible = parseFloat(reg.BASE_IMPONIBLE) || 0;
          const iva = parseFloat(reg.IVA) || 0;
          const recargo = parseFloat(reg.RECARGO) || 0;
          const total = parseFloat(reg.TOTAL) || 0;

          // Calcular porcentajes
          const porcIva = baseImponible > 0 ? ((iva / baseImponible) * 100) : 0;
          const porcRec = baseImponible > 0 ? ((recargo / baseImponible) * 100) : 0;

          // Acumular totales
          totalBaseSerie += baseImponible;
          totalIvaSerie += iva;
          totalRecargoSerie += recargo;
          totalSerie += total;

          // Línea horizontal entre filas
          doc.moveTo(40, y).lineTo(555, y).stroke();

          doc.fillColor('#000000');

          // Datos de la factura
          doc.text(`${reg.SERIEFACTURA || ''} ${reg.NUMEROFACTURA || ''}`, col.factura, y + 3, { width: 45 });
          doc.text(reg.FECHAFACTURA || '', col.fecha, y + 3, { width: 45 });

          // Cliente (cortado)
          const nombreCliente = (reg.NOMBRECLIENTE || '').substring(0, 20);
          doc.text(nombreCliente, col.cliente, y + 3, { width: 85 });

          // NIF
          doc.text((reg.CIFCLIENTE || '').substring(0, 12), col.nif, y + 3, { width: 55 });

          // Base Imponible
          doc.text(formatNumber(baseImponible, 2), col.base, y + 3, { width: 55, align: 'right' });

          // % I.V.A.
          doc.text(formatNumber(porcIva, 2), col.porcIva, y + 3, { width: 35, align: 'center' });

          // Importe I.V.A.
          doc.text(formatNumber(iva, 2) + ' €', col.impIva, y + 3, { width: 55, align: 'right' });

          // % Recargo
          doc.text(formatNumber(porcRec, 2), col.porcRec, y + 3, { width: 25, align: 'center' });

          // Imp. Recargo
          doc.text(formatNumber(recargo, 2) + ' €', col.impRec, y + 3, { width: 30, align: 'right' });

          // Total
          doc.text(formatNumber(total, 2) + ' €', col.total, y + 3, { width: 38, align: 'right' });

          y += 10;
        });

        // Acumular a totales generales
        totalBaseGeneral += totalBaseSerie;
        totalIvaGeneral += totalIvaSerie;
        totalRecargoGeneral += totalRecargoSerie;
        totalGeneral += totalSerie;
      });

      y += 5;

      // LÍNEA FINAL DE TOTALES
      doc.moveTo(40, y).lineTo(555, y).stroke();
      y += 2;

      // TOTALES (dos cajas como en la imagen)
      const cajasY = y;

      // Primera caja de totales (BASE)
      doc.rect(40, cajasY, 250, 20).stroke();
      doc.rect(40, cajasY + 20, 250, 20).strokeColor('#28a745').lineWidth(2).stroke();
      doc.strokeColor('#000000').lineWidth(1);

      doc.fontSize(8).font('Helvetica');
      doc.text('Base Imponible:', 45, cajasY + 6);
      doc.text(formatNumber(totalBaseGeneral, 2) + ' €', 160, cajasY + 6, { width: 125, align: 'right' });

      doc.text('Importe I.V.A.:', 45, cajasY + 26);
      doc.text(formatNumber(totalIvaGeneral, 2) + ' €', 160, cajasY + 26, { width: 125, align: 'right' });

      // Segunda caja de totales (TOTAL CON IVA) - verde como en la imagen
      doc.rect(305, cajasY, 250, 40).fillAndStroke('#28a745', '#28a745');

      doc.fontSize(10).font('Helvetica-Bold').fillColor('#FFFFFF');
      doc.text('TOTAL CON IVA', 315, cajasY + 6);
      doc.fontSize(16);
      doc.text(formatNumber(totalGeneral, 2) + ' €', 420, cajasY + 18, { width: 130, align: 'right' });

      y = cajasY + 48;

      // RESUMEN POR SERIE (como en la imagen)
      doc.fillColor('#000000').fontSize(10).font('Helvetica-Bold');
      doc.text('RESUMEN POR SERIE', 40, y);
      y += 16;

      // Cabecera resumen
      doc.rect(40, y, 515, 14).fillAndStroke('#E8E8E8', '#000000');
      doc.fontSize(7).font('Helvetica-Bold');
      doc.text('Serie', 45, y + 4);
      doc.text('Descripción', 120, y + 4);
      doc.text('Base Imponible', 290, y + 4, { width: 55, align: 'right' });
      doc.text('% I.V.A.', 350, y + 4, { width: 55, align: 'right' });
      doc.text('Importe I.V.A.', 410, y + 4, { width: 65, align: 'right' });
      doc.text('% Rec.', 480, y + 4, { width: 30, align: 'center' });
      doc.text('Importe Total', 515, y + 4, { width: 38, align: 'right' });
      y += 16;

      // Agrupar y mostrar resumen por serie
      doc.fontSize(6).font('Helvetica');
      Object.keys(facturasPorSerie).forEach(serie => {
        const facturasS = facturasPorSerie[serie];

        let baseS = 0;
        let ivaS = 0;
        let recargoS = 0;
        let totalS = 0;

        facturasS.forEach(f => {
          baseS += parseFloat(f.BASE_IMPONIBLE) || 0;
          ivaS += parseFloat(f.IVA) || 0;
          recargoS += parseFloat(f.RECARGO) || 0;
          totalS += parseFloat(f.TOTAL) || 0;
        });

        const porcIvaS = baseS > 0 ? ((ivaS / baseS) * 100) : 0;
        const porcRecS = baseS > 0 ? ((recargoS / baseS) * 100) : 0;

        doc.moveTo(40, y).lineTo(555, y).stroke();

        doc.text(serie, 45, y + 3);

        // Descripción según serie
        let descripcion = '';
        if (serie === 'A') descripcion = 'FACTURAS DIRECTAS TERMINALES';
        else if (serie === 'F') descripcion = 'FACTURAS VENTAS';
        else descripcion = 'FACTURAS';

        doc.text(descripcion + ` (${formatNumber(porcIvaS, 2)}%)`, 120, y + 3);
        doc.text(formatNumber(baseS, 2), 290, y + 3, { width: 55, align: 'right' });
        doc.text(formatNumber(porcIvaS, 2), 350, y + 3, { width: 55, align: 'right' });
        doc.text(formatNumber(ivaS, 2) + ' €', 410, y + 3, { width: 65, align: 'right' });
        doc.text(formatNumber(porcRecS, 2), 480, y + 3, { width: 30, align: 'center' });
        doc.text(formatNumber(totalS, 2) + ' €', 515, y + 3, { width: 38, align: 'right' });

        y += 10;
      });

      // Totales del resumen
      doc.moveTo(40, y).lineTo(555, y).stroke();
      y += 2;

      doc.rect(40, y, 515, 14).fillAndStroke('#E8E8E8', '#000000');
      doc.fontSize(7).font('Helvetica-Bold');
      doc.text('TOTALES', 120, y + 4);
      doc.text(formatNumber(totalBaseGeneral, 2) + ' €', 290, y + 4, { width: 55, align: 'right' });
      doc.text('10.00 %', 350, y + 4, { width: 55, align: 'right' });
      doc.text(formatNumber(totalIvaGeneral, 2) + ' €', 410, y + 4, { width: 65, align: 'right' });
      doc.text('1.40 %', 480, y + 4, { width: 30, align: 'center' });
      doc.text(formatNumber(totalGeneral, 2) + ' €', 515, y + 4, { width: 38, align: 'right' });

      y += 20;

      // Pie de página
      doc.fontSize(6).font('Helvetica').fillColor('#666666');
      doc.text(EMPRESA.registro, 40, 780, { align: 'center', width: 515 });

      doc.end();
    });

  } catch (error) {
    logger.error('❌ Error generando PDF Libro IVA', error);
    throw error;
  }
}

module.exports = {
  generateLibroIvaPDF
};
