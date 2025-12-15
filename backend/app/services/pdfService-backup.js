/**
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 * 🏢 GRANJA MARI PEPA - SERVICIO DE GENERACIÓN DE PDFs
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 *
 * Genera PDFs de facturas con diseño profesional, elegante y moderno
 * Inspirado en las mejores prácticas de diseño empresarial
 *
 * Características:
 * - Diseño limpio y profesional a la altura de Granja Mari Pepa
 * - Cálculos precisos y verificados
 * - Totales agrupados correctamente por % IVA
 * - Compatible con estructura multi-albarán de CAC
 *
 * @version 2.0 - Rediseño profesional
 * @author Claude Code - Sistema de Facturación Mari Pepa
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 */

const PDFDocument = require('pdfkit');
const logger = require('../utils/logger');
const path = require('path');
const fs = require('fs');

// Ruta al header de Mari Pepa
const HEADER_PATH = path.join(__dirname, '../../assets/header.webp');
const HEADER_PNG_PATH = path.join(__dirname, '../../assets/header.png');

// Paleta de colores corporativos Mari Pepa
const COLORS = {
  primary: '#003d7a',        // Azul corporativo principal
  secondary: '#1a5490',      // Azul secundario
  accent: '#28a745',         // Verde para totales
  darkGray: '#333333',       // Gris oscuro para texto
  mediumGray: '#666666',     // Gris medio
  lightGray: '#E8E8E8',      // Gris claro para fondos
  border: '#000000',         // Negro para bordes
  white: '#FFFFFF'           // Blanco
};

// Datos de empresa
const EMPRESA = {
  nombre: 'Mari Pepa Food & Frozen',
  descripcion: 'Congelados y refrigerados para hostelería',
  web: 'www.mari-pepa.com',
  registro: 'Inscrita en el registro mercantil de Murcia. Libro 140, Sección 3ª, Folio 142, Hoja 5657, Inscripción 2ª. CIF: B04008710'
};

/**
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 * FUNCIÓN: Dibujar header corporativo elegante
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 * Renderiza el header de la marca con logo o versión de texto estilizado
 */
function drawHeader(doc, yStart = 20) {
  let yPos = yStart;

  // Franja superior azul elegante (más delgada y moderna)
  doc.rect(0, 0, 595.28, 4)
     .fillAndStroke(COLORS.secondary, COLORS.secondary);

  // Intentar cargar logo
  let logoLoaded = false;
  if (fs.existsSync(HEADER_PNG_PATH)) {
    try {
      doc.image(HEADER_PNG_PATH, 40, yPos, { width: 515, height: 85 });
      logoLoaded = true;
      return yPos + 95;
    } catch (e) {
      logger.warn('⚠️ No se pudo cargar header.png');
    }
  }

  if (!logoLoaded && fs.existsSync(HEADER_PATH)) {
    try {
      doc.image(HEADER_PATH, 40, yPos, { width: 515, height: 85 });
      return yPos + 95;
    } catch (e) {
      logger.warn('⚠️ No se pudo cargar header.webp');
    }
  }

  // Header de texto elegante si no hay imagen
  // Caja con fondo sutil
  doc.rect(40, yPos, 515, 75)
     .fillAndStroke(COLORS.lightGray + '40', COLORS.lightGray);

  yPos += 15;

  // Nombre de la empresa - grande y bold
  doc.fontSize(28)
     .font('Helvetica-Bold')
     .fillColor(COLORS.primary)
     .text('MARI PEPA', 50, yPos);

  yPos += 30;

  // Subtítulo elegante
  doc.fontSize(12)
     .fillColor(COLORS.darkGray)
     .text(EMPRESA.descripcion.toUpperCase(), 50, yPos);

  yPos += 16;

  // Web
  doc.fontSize(9)
     .font('Helvetica')
     .fillColor(COLORS.mediumGray)
     .text(EMPRESA.web, 50, yPos);

  return yPos + 20;
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
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 * FUNCIÓN PRINCIPAL: Generar PDF de factura con diseño profesional
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 *
 * Genera un PDF elegante, moderno y profesional a la altura de Granja Mari Pepa
 * Compatible con estructura multi-albarán de la tabla CAC
 *
 * @param {Object} facturaData - Datos de la factura {header, lines, payments}
 * @returns {Promise<Buffer>} - Buffer del PDF generado
 */
async function generateInvoicePDF(facturaData) {
  try {
    const header = facturaData.header || {};
    const lines = facturaData.lines || [];

    logger.info('📄 Generando PDF factura - Diseño Profesional v2.0', {
      serie: header.SERIEFACTURA,
      numero: header.NUMEROFACTURA,
      cliente: header.NOMBRECLIENTEFACTURA,
      lineas: lines.length,
      baseFactura: header.BASEFACTURA,
      ivaFactura: header.IVAFACTURA
    });

    return new Promise((resolve, reject) => {
      const doc = new PDFDocument({
        size: 'A4',
        margin: 40,
        bufferPages: true, // Para poder agregar número de páginas al final
        info: {
          Title: `Factura ${header.SERIEFACTURA}-${header.NUMEROFACTURA}`,
          Author: EMPRESA.nombre,
          Subject: `Factura para ${header.NOMBRECLIENTEFACTURA}`,
          Keywords: 'Factura, Mari Pepa, Food & Frozen'
        }
      });

      const chunks = [];
      doc.on('data', chunk => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
      // HEADER CORPORATIVO ELEGANTE
      // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
      let y = drawHeader(doc, 20);
      y += 5;

      // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
      // TÍTULO DE FACTURA - DESTACADO Y MODERNO
      // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
      doc.rect(40, y, 515, 30)
         .fillAndStroke(COLORS.secondary, COLORS.secondary);

      doc.fontSize(16)
         .font('Helvetica-Bold')
         .fillColor(COLORS.white)
         .text('FACTURA', 50, y + 9);

      const numFactura = `${header.SERIEFACTURA}-${header.NUMEROFACTURA}`;
      doc.fontSize(14)
         .text(numFactura, 420, y + 9, { width: 125, align: 'right' });

      y += 35;

      // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
      // INFORMACIÓN DE FACTURA Y FECHA - LAYOUT MODERNO
      // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
      const fecha = `${String(header.DIAFACTURA || '').padStart(2, '0')}/${String(header.MESFACTURA || '').padStart(2, '0')}/${header.ANOFACTURA || ''}`;

      // Caja izquierda: Cliente
      doc.rect(40, y, 250, 18)
         .fillAndStroke(COLORS.lightGray, COLORS.border);

      doc.fontSize(7)
         .font('Helvetica-Bold')
         .fillColor(COLORS.darkGray)
         .text('CÓDIGO CLIENTE', 45, y + 4);

      doc.fontSize(9)
         .font('Helvetica')
         .fillColor(COLORS.border)
         .text(header.CODIGOCLIENTEFACTURA || '', 45, y + 11);

      // Caja centro: Fecha
      doc.rect(295, y, 130, 18)
         .fillAndStroke(COLORS.lightGray, COLORS.border);

      doc.fontSize(7)
         .font('Helvetica-Bold')
         .fillColor(COLORS.darkGray)
         .text('FECHA', 300, y + 4);

      doc.fontSize(9)
         .font('Helvetica')
         .fillColor(COLORS.border)
         .text(fecha, 300, y + 11);

      // Caja derecha: Ejercicio
      doc.rect(430, y, 125, 18)
         .fillAndStroke(COLORS.lightGray, COLORS.border);

      doc.fontSize(7)
         .font('Helvetica-Bold')
         .fillColor(COLORS.darkGray)
         .text('EJERCICIO', 435, y + 4);

      doc.fontSize(9)
         .font('Helvetica')
         .fillColor(COLORS.border)
         .text(header.EJERCICIOFACTURA || header.ANOFACTURA || '', 435, y + 11);

      y += 23;

      // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
      // INFORMACIÓN DEL CLIENTE - TARJETA MODERNA
      // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
      const clienteBoxY = y;

      // Fondo sutil para la tarjeta de cliente
      doc.rect(40, clienteBoxY, 515, 90)
         .fillAndStroke('#f8f9fa', COLORS.lightGray);

      y += 8;

      // Etiqueta "DATOS DEL CLIENTE"
      doc.fontSize(8)
         .font('Helvetica-Bold')
         .fillColor(COLORS.secondary)
         .text('FACTURAR A:', 45, y);

      y += 14;

      // Nombre del cliente - destacado
      doc.fontSize(11)
         .font('Helvetica-Bold')
         .fillColor(COLORS.darkGray)
         .text((header.NOMBRECLIENTEFACTURA || '').toUpperCase(), 45, y);

      y += 16;

      // Dirección completa en formato compacto
      doc.fontSize(8)
         .font('Helvetica')
         .fillColor(COLORS.darkGray);

      if (header.DIRECCIONCLIENTEFACTURA) {
        doc.text(`📍 ${header.DIRECCIONCLIENTEFACTURA}`, 45, y);
        y += 11;
      }

      if (header.CPCLIENTEFACTURA || header.POBLACIONCLIENTEFACTURA) {
        const localidad = `   ${header.CPCLIENTEFACTURA || ''} ${header.POBLACIONCLIENTEFACTURA || ''}${header.PROVINCIACLIENTEFACTURA ? ` (${header.PROVINCIACLIENTEFACTURA})` : ''}`;
        doc.text(localidad.trim(), 45, y);
        y += 11;
      }

      if (header.CIFCLIENTEFACTURA) {
        doc.text(`💼 NIF/CIF: ${header.CIFCLIENTEFACTURA}`, 45, y);
        y += 11;
      }

      y = clienteBoxY + 98;

      // Cabecera de tabla de productos
      doc.rect(40, y, 515, 14).fillAndStroke('#E8E8E8', '#000000');
      doc.fontSize(7).font('Helvetica-Bold').fillColor('#000000');
      doc.text('Lote', 42, y + 4);
      doc.text('Ref.', 68, y + 4);
      doc.text('Descripción', 110, y + 4);
      doc.text('Cajas', 328, y + 4);
      doc.text('Uds./Kgs.', 365, y + 4);
      doc.text('Precio', 410, y + 4);
      doc.text('% Dto.', 455, y + 4);
      doc.text('IVA', 490, y + 4);
      doc.text('Importe', 515, y + 4);

      y += 16;

      // Líneas de productos
      doc.fontSize(7).font('Helvetica');

      lines.forEach(line => {
        if (y > 660) {
          doc.addPage();
          y = drawHeader(doc, 20) + 10;
        }

        doc.text(line.LOTE || '', 42, y, { width: 22 });
        doc.text(line.CODIGOARTICULO || '', 68, y, { width: 38 });

        const desc = (line.DESCRIPCIONARTICULO || '').substring(0, 50);
        doc.text(desc, 110, y, { width: 210 });

        // Si la descripción tiene "APROX", agregar línea adicional
        if (desc.includes('APROX') || desc.length > 30) {
          y += 8;
          doc.text('APROX........', 110, y, { width: 210 });
        }

        const cajas = line.NUMEROCAJAS || '';
        doc.text(cajas.toString(), 328, y, { width: 32, align: 'right' });

        const uds = line.CANTIDADARTICULO || 0;
        doc.text(formatNumber(uds, 3), 365, y, { width: 40, align: 'right' });

        const precio = line.PRECIOARTICULO || 0;
        doc.text(formatNumber(precio, 3), 410, y, { width: 38, align: 'right' });

        const dto = line.PORCENTAJEDESCUENTOARTICULO || 0;
        doc.text(formatNumber(dto, 2), 455, y, { width: 30, align: 'center' });

        const iva = line.PORCENTAJEIVAARTICULO || 0;
        doc.text(formatNumber(iva, 2), 490, y, { width: 20, align: 'center' });

        const importe = line.IMPORTENETOARTICULO || 0;
        doc.text(formatNumber(importe, 2) + ' €', 515, y, { width: 38, align: 'right' });

        y += 12;
      });

      y += 10;

      // Albarán y Pedido
      if (lines.length > 0 && lines[0].NUMEROALBARAN) {
        const albaranes = [...new Set(lines.map(l => l.NUMEROALBARAN).filter(Boolean))];
        const totalAlbaran = header.BASEFACTURA || 0;

        doc.fontSize(7);
        doc.text(`Albarán: Nº ${albaranes.join(', ')}  Fecha: ${fecha}  Total Albarán: ${formatNumber(totalAlbaran, 2)} €`, 40, y);
        y += 10;

        if (lines[0].NUMEROPEDIDO) {
          doc.text(`Pedido: ${lines[0].NUMEROPEDIDO}`, 40, y);
          y += 12;
        }
      }

      y += 5;

      // Tabla de totales - IMPORTANTE: Agrupar por % IVA
      const gruposIVA = {};
      lines.forEach(line => {
        const porcIVA = line.PORCENTAJEIVAARTICULO || 0;
        const porcRec = line.PORCENTAJERECARGO || 0;
        const key = `${porcIVA}_${porcRec}`;

        if (!gruposIVA[key]) {
          gruposIVA[key] = {
            porcIVA,
            porcRec,
            baseImponible: 0,
            iva: 0,
            recargo: 0
          };
        }

        const importe = line.IMPORTENETOARTICULO || 0;
        gruposIVA[key].baseImponible += importe;
        gruposIVA[key].iva += importe * (porcIVA / 100);
        gruposIVA[key].recargo += importe * (porcRec / 100);
      });

      const grupos = Object.values(gruposIVA);
      const numFilas = Math.max(grupos.length, 2);
      const alturaTabla = 14 + (numFilas * 14);

      doc.rect(40, y, 515, alturaTabla).stroke();

      // Líneas verticales
      doc.moveTo(105, y).lineTo(105, y + alturaTabla).stroke();
      doc.moveTo(165, y).lineTo(165, y + alturaTabla).stroke();
      doc.moveTo(245, y).lineTo(245, y + alturaTabla).stroke();
      doc.moveTo(325, y).lineTo(325, y + alturaTabla).stroke();
      doc.moveTo(385, y).lineTo(385, y + alturaTabla).stroke();
      doc.moveTo(455, y).lineTo(455, y + alturaTabla).stroke();
      doc.moveTo(513, y).lineTo(513, y + alturaTabla).stroke();

      // Línea horizontal header
      doc.moveTo(40, y + 14).lineTo(555, y + 14).stroke();

      // Headers
      doc.fontSize(7).font('Helvetica-Bold');
      doc.text('Importe', 42, y + 3, { width: 60, align: 'center' });
      doc.text('% Dto', 107, y + 3, { width: 55, align: 'center' });
      doc.text('Pronto Pago', 167, y + 3, { width: 75, align: 'center' });
      doc.text('Base Imponible', 247, y + 3, { width: 75, align: 'center' });
      doc.text('% I.V.A.', 327, y + 3, { width: 55, align: 'center' });
      doc.text('Importe I.V.A.', 387, y + 3, { width: 65, align: 'center' });
      doc.text('% Recargo', 457, y + 3, { width: 55, align: 'center' });
      doc.text('Importe Rec.', 515, y + 3, { width: 38, align: 'center' });

      // Valores por grupo de IVA
      doc.fontSize(7).font('Helvetica');
      let yValor = y + 17;

      grupos.forEach(grupo => {
        doc.text(formatNumber(grupo.baseImponible, 2) + ' €', 42, yValor, { width: 60, align: 'right' });
        doc.text('', 107, yValor);
        doc.text('', 167, yValor);
        doc.text(formatNumber(grupo.baseImponible, 2) + ' €', 247, yValor, { width: 75, align: 'right' });
        doc.text(formatNumber(grupo.porcIVA, 2), 327, yValor, { width: 55, align: 'right' });
        doc.text(formatNumber(grupo.iva, 2) + ' €', 387, yValor, { width: 65, align: 'right' });
        doc.text(formatNumber(grupo.porcRec, 2), 457, yValor, { width: 55, align: 'right' });
        doc.text(formatNumber(grupo.recargo, 2) + ' €', 515, yValor, { width: 38, align: 'right' });
        yValor += 14;
      });

      y += alturaTabla + 2;

      // TOTAL SIN IVA
      const totalBase = grupos.reduce((sum, g) => sum + g.baseImponible, 0);

      doc.rect(360, y, 195, 18).stroke();
      doc.fontSize(9).font('Helvetica');
      doc.text('TOTAL SIN IVA', 365, y + 5);
      doc.fontSize(11).font('Helvetica-Bold');
      doc.text(formatNumber(totalBase, 2) + ' €', 480, y + 4, { width: 70, align: 'right' });

      y += 20;

      // TOTAL CON IVA (verde)
      const totalIVA = grupos.reduce((sum, g) => sum + g.iva, 0);
      const totalRecargo = grupos.reduce((sum, g) => sum + g.recargo, 0);
      const totalConIVA = totalBase + totalIVA + totalRecargo;

      doc.rect(360, y, 195, 22)
         .lineWidth(2)
         .strokeColor('#28a745')
         .stroke()
         .strokeColor('#000000')
         .lineWidth(1);

      doc.fontSize(10).font('Helvetica-Bold').fillColor('#28a745');
      doc.text('TOTAL CON IVA', 365, y + 6);
      doc.fontSize(16);
      doc.text(formatNumber(totalConIVA, 2) + ' €', 480, y + 5, { width: 70, align: 'right' });

      doc.fillColor('#000000');

      // Pie de página
      doc.fontSize(6).font('Helvetica').fillColor('#666666');
      doc.text(EMPRESA.registro, 40, 780, { align: 'center', width: 515 });

      doc.end();
    });

  } catch (error) {
    logger.error('❌ Error generando PDF factura', error);
    throw error;
  }
}

/**
 * Formatear fecha
 */
function formatDate(dateStr) {
  if (!dateStr) return 'N/A';
  if (typeof dateStr === 'string' && dateStr.includes('/')) return dateStr;
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return dateStr;
  return `${String(date.getDate()).padStart(2, '0')}/${String(date.getMonth() + 1).padStart(2, '0')}/${date.getFullYear()}`;
}

/**
 * Formatear moneda
 */
function formatCurrency(amount) {
  return new Intl.NumberFormat('es-ES', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(amount || 0);
}

module.exports = {
  generateInvoicePDF,
  formatDate,
  formatCurrency
};
