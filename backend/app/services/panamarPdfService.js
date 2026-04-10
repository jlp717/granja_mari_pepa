/**
 * PANAMAR PDF SERVICE
 * ===================
 * Genera PDF de factura PANAMAR orientado a:
 * - Nombre de negocio
 * - Consumo (cajas/unidades)
 * - Precio e importe de cobro
 *
 * Sin exponer datos personales del cliente (NIF, direccion, etc.).
 */

const PDFDocument = require('pdfkit');
const logger = require('../utils/logger');
const path = require('path');
const fs = require('fs');

const HEADER_PNG_PATH = path.join(__dirname, '../../assets/header.png');
const HEADER_WEBP_PATH = path.join(__dirname, '../../assets/header.webp');

let HEADER_BUFFER = null;
try {
  if (fs.existsSync(HEADER_PNG_PATH)) {
    HEADER_BUFFER = fs.readFileSync(HEADER_PNG_PATH);
    logger.info(`PANAMAR PDF: Header PNG cargado en memoria (${(HEADER_BUFFER.length / 1024).toFixed(0)}KB)`);
  } else if (fs.existsSync(HEADER_WEBP_PATH)) {
    HEADER_BUFFER = fs.readFileSync(HEADER_WEBP_PATH);
    logger.info(`PANAMAR PDF: Header WEBP cargado en memoria (${(HEADER_BUFFER.length / 1024).toFixed(0)}KB)`);
  } else {
    logger.warn('PANAMAR PDF: No se encontro header de imagen, se usara encabezado de texto');
  }
} catch (error) {
  logger.warn('PANAMAR PDF: Error cargando header de imagen', { error: error.message });
}

const COLORS = {
  primary: '#0F4C81',
  secondary: '#1B6CA8',
  accent: '#E67E22',
  success: '#2E8B57',
  dark: '#1F2937',
  medium: '#6B7280',
  light: '#E5E7EB',
  ultraLight: '#F8FAFC',
  white: '#FFFFFF'
};

const EMPRESA = {
  nombre: 'MARI PEPA',
  web: 'www.mari-pepa.com',
  telefono: '639 77 86 56',
  registro: 'Registro Mercantil de Murcia. Hoja 5657. CIF: B04008710'
};

function formatNumber(num, decimals = 2) {
  if (num === null || num === undefined || Number.isNaN(Number(num))) return decimals > 0 ? '0,00' : '0';
  const fixed = Math.abs(Number(num)).toFixed(decimals);
  const parts = fixed.split('.');
  const intPart = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  const res = decimals > 0 ? `${intPart},${parts[1]}` : intPart;
  return Number(num) < 0 ? `-${res}` : res;
}

function pad2(n) {
  return String(n || '').padStart(2, '0');
}

function drawHeader(doc, yStart = 10) {
  let y = yStart;
  doc.rect(0, 0, 595.28, 5).fillAndStroke(COLORS.secondary, COLORS.secondary);
  y += 5;

  if (HEADER_BUFFER) {
    try {
      doc.image(HEADER_BUFFER, 40, y, { width: 515, height: 138 });
      return y + 148;
    } catch (error) {
      logger.warn('PANAMAR PDF: Error renderizando header de imagen', { error: error.message });
    }
  }

  doc.rect(40, y, 515, 118).fillAndStroke(COLORS.ultraLight, COLORS.light);
  y += 16;
  doc.fontSize(34).font('Helvetica-Bold').fillColor(COLORS.primary).text(EMPRESA.nombre, 50, y);
  y += 42;
  doc.fontSize(11).font('Helvetica').fillColor(COLORS.dark).text('Food & Frozen para Hosteleria', 50, y);
  doc.fontSize(9).fillColor(COLORS.secondary).text(EMPRESA.web, 435, y, { align: 'right', width: 110 });
  y += 18;
  return y + 8;
}

function drawFooter(doc, pageNum, totalPages) {
  const footerY = 770;
  doc.moveTo(40, footerY).lineTo(555, footerY).strokeColor(COLORS.light).lineWidth(0.5).stroke();
  doc.fontSize(6).font('Helvetica').fillColor(COLORS.medium)
    .text(EMPRESA.registro, 40, footerY + 5, { align: 'center', width: 515 });
  doc.fontSize(7).fillColor(COLORS.medium)
    .text(`Pagina ${pageNum} de ${totalPages}`, 40, footerY + 13, { align: 'center', width: 515 });
}

function drawLineHeader(doc, y) {
  doc.rect(40, y, 515, 16).fillAndStroke(COLORS.secondary, COLORS.secondary);
  doc.fontSize(7).font('Helvetica-Bold').fillColor(COLORS.white);

  doc.text('CÓDIGO', 42, y + 5, { width: 45 });
  doc.text('DESCRIPCIÓN', 90, y + 5, { width: 165 });
  doc.text('LOTE', 258, y + 5, { width: 45 });
  doc.text('CAJAS', 305, y + 5, { width: 35, align: 'right' });
  doc.text('UDES.', 345, y + 5, { width: 40, align: 'right' });
  doc.text('P. UNIT.', 390, y + 5, { width: 48, align: 'right' });
  doc.text('% DTO.', 443, y + 5, { width: 35, align: 'right' });
  doc.text('IMPORTE', 483, y + 5, { width: 50, align: 'right' });
  doc.text('IVA', 538, y + 5, { width: 25, align: 'right' });

  return y + 18;
}

function buildDocumentContent(doc, panamarDoc) {
  const lineas = panamarDoc.lineas || [];
  const fecha = `${pad2(panamarDoc.dia)}/${pad2(panamarDoc.mes)}/${panamarDoc.ano || ''}`;
  const hora = panamarDoc.hora || '-';

  let y = drawHeader(doc, 10);
  y += 10;

  // Banner principal - Título profesional del documento
  doc.rect(40, y, 515, 34).fillAndStroke(COLORS.secondary, COLORS.secondary);
  doc.fontSize(16).font('Helvetica-Bold').fillColor(COLORS.white)
    .text('DOCUMENTO DE FACTURACIÓN', 50, y + 10);
  
  const headerRightText = panamarDoc.refFactura ? `FACTURA: ${panamarDoc.refFactura}` : `MES: ${pad2(panamarDoc.mes)}/${panamarDoc.ano || ''}`;
  doc.fontSize(12).font('Helvetica-Bold')
    .text(headerRightText, 390, y + 10, { width: 160, align: 'right' });
  y += 40;

  // Fila de datos de cabecera
  doc.rect(40, y, 165, 20).fillAndStroke(COLORS.ultraLight, COLORS.light);
  doc.fontSize(7).font('Helvetica-Bold').fillColor(COLORS.medium).text('CODIGO CLIENTE', 45, y + 3);
  doc.fontSize(10).font('Helvetica-Bold').fillColor(COLORS.dark).text(panamarDoc.codigoCliente || '', 45, y + 11);

  doc.rect(210, y, 120, 20).fillAndStroke(COLORS.ultraLight, COLORS.light);
  doc.fontSize(7).font('Helvetica-Bold').fillColor(COLORS.medium).text('FECHA INFORME', 215, y + 3);
  doc.fontSize(10).font('Helvetica-Bold').fillColor(COLORS.dark).text(fecha, 215, y + 11);

  doc.rect(335, y, 90, 20).fillAndStroke(COLORS.ultraLight, COLORS.light);
  doc.fontSize(7).font('Helvetica-Bold').fillColor(COLORS.medium).text('HORA', 340, y + 3);
  doc.fontSize(10).font('Helvetica-Bold').fillColor(COLORS.dark).text(hora, 340, y + 11);

  doc.rect(430, y, 125, 20).fillAndStroke(COLORS.ultraLight, COLORS.light);
  doc.fontSize(7).font('Helvetica-Bold').fillColor(COLORS.medium).text('REF', 435, y + 3);
  const refStr = panamarDoc.referencia || panamarDoc.refPedido || panamarDoc.numeroPedido || '-';
  doc.fontSize(9).font('Helvetica-Bold').fillColor(COLORS.dark)
    .text(String(refStr).substring(0, 20), 435, y + 11);
  y += 26;

  // Negocio
  doc.rect(40, y, 515, 52).fillAndStroke(COLORS.ultraLight, COLORS.light);
  y += 8;
  doc.fontSize(8).font('Helvetica-Bold').fillColor(COLORS.secondary).text('CLIENTE', 45, y);
  y += 14;
  doc.fontSize(12).font('Helvetica-Bold').fillColor(COLORS.dark)
    .text(panamarDoc.nombreCliente || panamarDoc.codigoCliente || 'N/A', 45, y, { width: 500 });
  y += 18;
  // ✅ FIX: Eliminar frase "Detalle de consumo y facturación del período"
  y += 18;

  // Tabla de lineas
  y = drawLineHeader(doc, y);

  // Group lines by Albaran
  const albaranes = [];
  const lineasPorAlbaran = {};

  lineas.forEach(l => {
    const key = `${l.serieAlbaran || ''}-${l.numeroAlbaran || ''}`;
    if (!lineasPorAlbaran[key]) {
      lineasPorAlbaran[key] = [];
      albaranes.push(key);
    }
    lineasPorAlbaran[key].push(l);
  });

  let totalCajas = 0;
  let totalImporte = 0;

  albaranes.forEach(albKey => {
    const albLines = lineasPorAlbaran[albKey];
    let subtotalAlb = 0;
    let totalIvaAlb = 0;
    const firstLine = albLines[0];
    const fechaAlb = firstLine.fechaAlbaran || fecha;
    // ✅ FIX: Formato de albarán = SERIE-TERMINAL-NUMERO (ej: P-93-25)
    // SERIE_ALBARAN es 'P' (no TIPO_VENTA que es 'CC' o 'SC')
    const albaranRef = `${firstLine.serieAlbaran || 'P'}-${firstLine.terminalAlbaran || ''}-${firstLine.numeroAlbaran || ''}`;

    albLines.forEach((linea) => {
      const rowHeight = 16;

      if (y + rowHeight > 730) {
        doc.addPage();
        y = drawHeader(doc, 10) + 10;
        y = drawLineHeader(doc, y);
      }

      const cajas = Number(linea.cajas) || 0;
      const unidades = Number(linea.unidades) || 0;
      // ✅ FIX: Usar precioUnitario (PRECIOVENTA original) no tarifa especial
      const precio = Number(linea.precioUnitario ?? 0) || 0;
      // ✅ FIX: Las líneas SC tienen importe 0
      const importe = linea.isSinCargo ? 0 : (Number(linea.importe) || 0);
      const dto = Number(linea.descuento) || 0;
      const iva = Number(linea.iva || 4); // Panamar es mayormente 4%
      // ✅ FIX: Calcular subtotal SIN IVA para acumular
      const importeSinIva = importe / (1 + iva / 100);

      totalCajas += cajas;
      totalImporte += importeSinIva;
      subtotalAlb += importeSinIva;
      totalIvaAlb += importe - importeSinIva;

      // ✅ FIX: Descripción más ancha con truncamiento elegante
      const descripcion = String(linea.descripcion || '');
      const maxDescLength = 38;
      const descripcionTruncada = descripcion.length > maxDescLength
        ? descripcion.substring(0, maxDescLength - 2) + '...'
        : descripcion;

      doc.fontSize(7).font('Helvetica').fillColor(COLORS.dark);
      doc.text(String(linea.codigoArticulo || '').substring(0, 11), 42, y + 3, { width: 45 });
      doc.text(descripcionTruncada, 90, y + 3, { width: 165 });
      doc.text(String(linea.lote || '-').substring(0, 10), 258, y + 3, { width: 45 });
      doc.text(cajas ? formatNumber(cajas, 0) : '-', 305, y + 3, { width: 35, align: 'right' });
      doc.text(unidades ? formatNumber(unidades, 3) : '-', 345, y + 3, { width: 40, align: 'right' });
      doc.text(`${formatNumber(precio, 3)} €`, 390, y + 3, { width: 48, align: 'right' });
      // ✅ FIX: Mostrar descuento como porcentaje entero
      doc.text(dto > 0 ? `${formatNumber(dto, 0)}%` : '-', 443, y + 3, { width: 35, align: 'right' });
      // ✅ FIX: Las líneas SC muestran 0,00 €
      doc.text(linea.isSinCargo ? '0,00 €' : `${formatNumber(importe, 2)} €`, 483, y + 3, { width: 50, align: 'right' });
      doc.text(`${formatNumber(iva, 0)}%`, 538, y + 3, { width: 25, align: 'right' });

      y += rowHeight;
    });

    // Sub-header de Albarán (estilo profesional)
    if (y + 15 > 730) {
      doc.addPage();
      y = drawHeader(doc, 10) + 10;
      y = drawLineHeader(doc, y);
    }

    // ✅ FIX: Mostrar referencia de albarán en formato P-93-25
    doc.fontSize(7).font('Helvetica-Bold').fillColor(COLORS.medium);
    doc.text(`Albarán: ${albaranRef}    Fecha: ${fechaAlb}`, 100, y + 2);
    doc.text(`SUBTOTAL ALBARÁN`, 410, y + 2);
    // ✅ FIX: Subtotal con IVA sumado
    doc.fontSize(8).fillColor(COLORS.dark).text(`${formatNumber(subtotalAlb + totalIvaAlb, 2)} €`, 470, y + 2, { width: 50, align: 'right' });

    y += 15;
    doc.moveTo(40, y).lineTo(555, y).strokeColor(COLORS.light).lineWidth(0.5).stroke();
    y += 5;
  });

  y += 10;

  // Totales - Estilo profesional
  doc.rect(40, y, 250, 34).fillAndStroke(COLORS.success, COLORS.success);
  doc.fontSize(10).font('Helvetica-Bold').fillColor(COLORS.white).text('TOTAL UDS. CONSUMIDAS', 48, y + 8);
  doc.fontSize(17).font('Helvetica-Bold').text(formatNumber(totalCajas, 0), 220, y + 6, { width: 60, align: 'right' });

  doc.rect(305, y, 250, 34).fillAndStroke(COLORS.accent, COLORS.accent);
  doc.fontSize(10).font('Helvetica-Bold').fillColor(COLORS.white).text('BASE IMPONIBLE', 313, y + 8);
  doc.fontSize(17).font('Helvetica-Bold')
    .text(`${formatNumber(totalImporte, 2)} €`, 445, y + 6, { width: 105, align: 'right' });

  // Footer en todas las paginas
  const pages = doc.bufferedPageRange();
  for (let i = 0; i < pages.count; i++) {
    doc.switchToPage(i);
    drawFooter(doc, i + 1, pages.count);
  }
}

async function generateFacturaPDF(panamarDoc) {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ size: 'A4', margin: 40, bufferPages: true });
      const chunks = [];
      doc.on('data', chunk => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);
      buildDocumentContent(doc, panamarDoc);
      doc.end();
    } catch (error) {
      reject(error);
    }
  });
}

function generateFacturaPDFStream(panamarDoc) {
  const doc = new PDFDocument({ size: 'A4', margin: 40, bufferPages: true });
  buildDocumentContent(doc, panamarDoc);
  doc.end();
  return doc;
}

// Alias de compatibilidad para no romper llamadas existentes.
const generateAlbaranPDF = generateFacturaPDF;
const generateAlbaranPDFStream = generateFacturaPDFStream;

module.exports = {
  generateFacturaPDF,
  generateFacturaPDFStream,
  generateAlbaranPDF,
  generateAlbaranPDFStream
};

