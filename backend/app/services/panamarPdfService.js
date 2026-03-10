/**
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 * 📦 PANAMAR - SERVICIO DE GENERACIÓN DE PDF DE ALBARANES v2.1
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 */

const PDFDocument = require('pdfkit');
const logger = require('../utils/logger');
const path = require('path');
const fs = require('fs');

// ── Assets ──────────────────────────────────────────────────────────
const HEADER_PNG_PATH = path.join(__dirname, '../../assets/header.png');
const HEADER_PATH = path.join(__dirname, '../../assets/header.webp');

// ── Paleta corporativa ─────────────────────────────────────────────
const COLORS = {
  primary: '#003d7a',
  secondary: '#1a5490',
  accent: '#28a745',
  success: '#28a745',
  darkGray: '#2c3e50',
  mediumGray: '#6c757d',
  lightGray: '#E8E8E8',
  ultraLight: '#f8f9fa',
  border: '#dee2e6',
  white: '#FFFFFF'
};

const EMPRESA = {
  nombre: 'MARI PEPA',
  slogan: 'Food & Frozen',
  descripcion: 'Congelados y refrigerados para hostelería',
  web: 'www.mari-pepa.com',
  telefono: '639778655',
  registro: 'Inscrita en el registro mercantil de Murcia. Libro 140, Sección 3ª, Folio 142, Hoja 5657, Inscripción 2ª. CIF: B04008710'
};

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// FUNCIONES PRIVADAS DE DIBUJO (Compartidas)
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

function formatNumber(num, decimals = 2) {
  if (num === null || num === undefined || isNaN(num)) return '0,00';
  const fixed = Math.abs(num).toFixed(decimals);
  const parts = fixed.split('.');
  const integerPart = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  const result = parts[1] ? integerPart + ',' + parts[1] : integerPart;
  return num < 0 ? '-' + result : result;
}

function pad2(n) { return String(n || '').padStart(2, '0'); }

function drawHeader(doc, yStart = 10) {
  let yPos = yStart;
  doc.rect(0, 0, 595.28, 5).fillAndStroke(COLORS.secondary, COLORS.secondary);
  yPos += 5;

  let logoLoaded = false;
  if (fs.existsSync(HEADER_PNG_PATH)) {
    try { doc.image(HEADER_PNG_PATH, 40, yPos, { width: 515, height: 140 }); logoLoaded = true; return yPos + 150; }
    catch (e) { logger.warn('⚠️ Error header.png'); }
  }
  if (!logoLoaded && fs.existsSync(HEADER_PATH)) {
    try { doc.image(HEADER_PATH, 40, yPos, { width: 515, height: 140 }); logoLoaded = true; return yPos + 150; }
    catch (e) { logger.warn('⚠️ Error header.webp'); }
  }

  if (!logoLoaded) {
    doc.rect(40, yPos, 515, 120).fillAndStroke(COLORS.ultraLight, COLORS.lightGray);
    yPos += 18;
    doc.fontSize(36).font('Helvetica-Bold').fillColor(COLORS.primary).text(EMPRESA.nombre, 50, yPos);
    yPos += 45;
    doc.fontSize(14).fillColor(COLORS.darkGray).font('Helvetica').text(EMPRESA.slogan.toUpperCase(), 50, yPos);
    yPos += 18;
    doc.fontSize(9).fillColor(COLORS.mediumGray).text(EMPRESA.descripcion, 50, yPos);
    doc.fontSize(9).fillColor(COLORS.secondary).text(EMPRESA.web, 450, yPos, { align: 'right', width: 95 });
    yPos += 10;
  }
  return yPos + 5;
}

function drawFooter(doc, pageNum, totalPages) {
  const footerY = 770;
  doc.moveTo(40, footerY).lineTo(555, footerY).strokeColor(COLORS.lightGray).lineWidth(0.5).stroke();
  doc.fontSize(6).font('Helvetica').fillColor(COLORS.mediumGray).text(EMPRESA.registro, 40, footerY + 5, { align: 'center', width: 515 });
  doc.fontSize(7).fillColor(COLORS.mediumGray).text(`Página ${pageNum} de ${totalPages}`, 40, footerY + 13, { align: 'center', width: 515 });
}

function drawProductHeader(doc, yPos) {
  doc.rect(40, yPos, 515, 16).fillAndStroke(COLORS.secondary, COLORS.secondary);
  doc.fontSize(7).font('Helvetica-Bold').fillColor(COLORS.white);
  doc.text('CÓDIGO', 42, yPos + 5, { width: 50 });
  doc.text('DESCRIPCIÓN', 95, yPos + 5, { width: 210 });
  doc.text('LOTE', 310, yPos + 5, { width: 45 });
  doc.text('CAJAS', 360, yPos + 5, { width: 35, align: 'right' });
  doc.text('CANT.', 405, yPos + 5, { width: 38, align: 'right' });
  doc.text('PRECIO', 450, yPos + 5, { width: 45, align: 'right' });
  doc.text('% DTO', 515, yPos + 5, { width: 35, align: 'right' });
  return yPos + 18;
}

/**
 * Lógica central de construcción del PDF
 */
function buildDocumentContent(doc, panamarDoc) {
  const lineas = panamarDoc.lineas || [];
  const docRef = `P-${panamarDoc.terminal || ''}-${panamarDoc.numeroAlbaran}`;
  const fecha = `${pad2(panamarDoc.dia)}/${pad2(panamarDoc.mes)}/${panamarDoc.ano}`;
  const hora = panamarDoc.hora || '';

  let y = drawHeader(doc, 10);
  y += 10;

  // Banner Albarán
  doc.rect(40, y, 515, 32).fillAndStroke(COLORS.secondary, COLORS.secondary);
  doc.fontSize(18).font('Helvetica-Bold').fillColor(COLORS.white).text('ALBARÁN', 50, y + 10);
  doc.fontSize(16).text(docRef, 400, y + 10, { width: 145, align: 'right' });
  y += 38;

  // Fila Info
  doc.rect(40, y, 160, 20).fillAndStroke(COLORS.lightGray, COLORS.border);
  doc.fontSize(7).font('Helvetica-Bold').fillColor(COLORS.mediumGray).text('CÓDIGO CLIENTE', 45, y + 3);
  doc.fontSize(10).font('Helvetica-Bold').fillColor(COLORS.darkGray).text(panamarDoc.codigoCliente || '', 45, y + 11);

  doc.rect(205, y, 120, 20).fillAndStroke(COLORS.lightGray, COLORS.border);
  doc.fontSize(7).font('Helvetica-Bold').fillColor(COLORS.mediumGray).text('FECHA', 210, y + 3);
  doc.fontSize(10).font('Helvetica-Bold').fillColor(COLORS.darkGray).text(fecha, 210, y + 11);

  doc.rect(330, y, 100, 20).fillAndStroke(COLORS.lightGray, COLORS.border);
  doc.fontSize(7).font('Helvetica-Bold').fillColor(COLORS.mediumGray).text('HORA', 335, y + 3);
  doc.fontSize(10).font('Helvetica-Bold').fillColor(COLORS.darkGray).text(hora || '-', 335, y + 11);

  const pedidoStr = panamarDoc.numeroPedido ? `Ped. ${panamarDoc.numeroPedido}` : (panamarDoc.refPedido || '-');
  doc.rect(435, y, 120, 20).fillAndStroke(COLORS.lightGray, COLORS.border);
  doc.fontSize(7).font('Helvetica-Bold').fillColor(COLORS.mediumGray).text('PEDIDO', 440, y + 3);
  doc.fontSize(10).font('Helvetica-Bold').fillColor(COLORS.darkGray).text(pedidoStr, 440, y + 11);
  y += 26;

  // Datos Cliente
  const clienteBoxY = y;
  doc.rect(40, y, 515, 75).fillAndStroke(COLORS.ultraLight, COLORS.lightGray);
  y += 8;
  doc.fontSize(8).font('Helvetica-Bold').fillColor(COLORS.secondary).text('DATOS DEL CLIENTE', 45, y);
  y += 15;
  doc.fontSize(12).font('Helvetica-Bold').fillColor(COLORS.darkGray).text((panamarDoc.nombreCliente || '').toUpperCase(), 45, y, { width: 500 });
  y += 18;
  doc.fontSize(9).font('Helvetica').fillColor(COLORS.darkGray);
  if (panamarDoc.direccionCliente) { doc.text(panamarDoc.direccionCliente, 45, y); y += 12; }
  let loc = `${panamarDoc.cpCliente || ''} ${panamarDoc.poblacionCliente || ''} (${panamarDoc.provinciaCliente || ''})`.trim();
  if (loc !== '()') { doc.text(loc, 45, y); y += 12; }
  if (panamarDoc.nifCliente) doc.fontSize(9).font('Helvetica-Bold').text(`NIF/CIF: ${panamarDoc.nifCliente}`, 45, y);
  y = clienteBoxY + 82;

  // Tabla
  y = drawProductHeader(doc, y);
  let totalCajas = 0;

  lineas.forEach((line) => {
    const desc = (line.descripcion || '').substring(0, 50);
    const rowH = Math.max(20, doc.heightOfString(desc, { width: 170 }) + 12);
    if (y + rowH > 700) { doc.addPage(); y = drawHeader(doc, 10) + 10; y = drawProductHeader(doc, y); }
    doc.fontSize(7).font('Helvetica').fillColor(COLORS.darkGray);
    doc.text(String(line.codigoArticulo || '').substring(0, 12), 42, y + 3, { width: 50 });
    doc.text(desc, 95, y + 3, { width: 210 });
    doc.text(String(line.lote || '-').substring(0, 10), 310, y + 3, { width: 45 });
    totalCajas += Number(line.cajas) || 0;
    doc.text(line.cajas ? formatNumber(line.cajas, 0) : '-', 360, y + 3, { width: 35, align: 'right' });
    doc.text(formatNumber(line.unidades || 0, 3), 405, y + 3, { width: 38, align: 'right' });
    doc.text(formatNumber(line.precioUnitario || 0, 3) + ' €', 450, y + 3, { width: 45, align: 'right' });
    doc.text(line.descuento > 0 ? formatNumber(line.descuento, 2) : '-', 515, y + 3, { width: 35, align: 'right' });
    y += rowH;
  });

  doc.moveTo(40, y).lineTo(555, y).strokeColor(COLORS.lightGray).lineWidth(1).stroke();
  y += 12;

  // Total
  doc.rect(350, y, 205, 28).fillAndStroke(COLORS.success, COLORS.success).lineWidth(2);
  doc.fontSize(12).font('Helvetica-Bold').fillColor(COLORS.white).text('TOTAL CAJAS', 360, y + 9);
  doc.fontSize(18).font('Helvetica-Bold').fillColor(COLORS.white).text(formatNumber(totalCajas, 0), 450, y + 6, { width: 100, align: 'right' });

  // Footer en cada página
  const range = doc.bufferedPageRange();
  for (let i = 0; i < range.count; i++) {
    doc.switchToPage(i);
    drawFooter(doc, i + 1, range.count);
  }
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// EXPORTED FUNCTIONS
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

/**
 * Genera PDF y devuelve un Buffer (para descargas individuales)
 */
async function generateAlbaranPDF(panamarDoc) {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ size: 'A4', margin: 40, bufferPages: true });
      const chunks = [];
      doc.on('data', c => chunks.push(c));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);
      buildDocumentContent(doc, panamarDoc);
      doc.end();
    } catch (e) { reject(e); }
  });
}

/**
 * Genera PDF y lo devuelve como Stream (para descargas masivas)
 */
function generateAlbaranPDFStream(panamarDoc) {
  const doc = new PDFDocument({ size: 'A4', margin: 40, bufferPages: true });
  buildDocumentContent(doc, panamarDoc);
  doc.end();
  return doc; // doc is a Readable stream
}

module.exports = {
  generateAlbaranPDF,
  generateAlbaranPDFStream
};
