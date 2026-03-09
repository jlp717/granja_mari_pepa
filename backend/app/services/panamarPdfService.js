/**
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 * 📦 PANAMAR - SERVICIO DE GENERACIÓN DE PDF DE ALBARANES
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 *
 * Genera PDFs de albaranes PANAMAR con diseño tipo albarán físico.
 * Solo muestra: header + líneas + total (sin IVA / totales inferiores)
 *
 * @version 1.0
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 */

const PDFDocument = require('pdfkit');
const logger = require('../utils/logger');
const path = require('path');
const fs = require('fs');

const HEADER_PNG_PATH = path.join(__dirname, '../../assets/header.png');
const HEADER_WEBP_PATH = path.join(__dirname, '../../assets/header.webp');

// ── Colors ──────────────────────────────────────────────────────────
const C = {
  primary: '#003d7a',
  secondary: '#1a5490',
  darkGray: '#2c3e50',
  mediumGray: '#6c757d',
  lightGray: '#E8E8E8',
  border: '#dee2e6',
  ultraLight: '#f8f9fa',
  white: '#FFFFFF',
  orange: '#E67E22',
  black: '#000000'
};

const EMPRESA = {
  nombre: 'Mari Pepa',
  subtitulo: 'Food & Frozen',
  linea1: 'Congelados y refrigerados',
  linea2: 'para hostelería',
  web: 'www.mari-pepa.com',
  direccion: 'Pol. Ind. Saprelorca Parcela D-3',
  localidad: '30817 - LORCA (Murcia)',
  telefono: '639778655',
  registro: 'Inscrita en el registro mercantil de Murcia. Libro 140, Sección 3ª, Folio 142, Hoja 5657, Inscripción 2ª. 02/01/99. CIF: B04008710'
};

// ── Helpers ─────────────────────────────────────────────────────────
function fmtNum(num, dec = 2) {
  if (num === null || num === undefined || isNaN(num)) return '0,00';
  const fixed = Math.abs(num).toFixed(dec);
  const parts = fixed.split('.');
  const intPart = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  const result = parts[1] ? intPart + ',' + parts[1] : intPart;
  return num < 0 ? '-' + result : result;
}

function pad2(n) {
  return String(n || '').padStart(2, '0');
}

// ── Draw the company logo/header area ──────────────────────────────
function drawLogo(doc, x, y, width) {
  let logoLoaded = false;

  if (fs.existsSync(HEADER_PNG_PATH)) {
    try {
      doc.image(HEADER_PNG_PATH, x, y, { width: width, height: 70 });
      logoLoaded = true;
    } catch (e) { /* fallback */ }
  }

  if (!logoLoaded && fs.existsSync(HEADER_WEBP_PATH)) {
    try {
      doc.image(HEADER_WEBP_PATH, x, y, { width: width, height: 70 });
      logoLoaded = true;
    } catch (e) { /* fallback */ }
  }

  if (!logoLoaded) {
    // Text fallback
    doc.fontSize(20).font('Helvetica-Bold').fillColor(C.primary)
      .text(EMPRESA.nombre, x + 5, y + 8);
    doc.fontSize(10).font('Helvetica').fillColor(C.darkGray)
      .text(EMPRESA.subtitulo, x + 5, y + 32);
    doc.fontSize(7).fillColor(C.mediumGray)
      .text(EMPRESA.linea1, x + 5, y + 46)
      .text(EMPRESA.linea2, x + 5, y + 55);
  }

  return y + 75;
}

/**
 * Generate an albarán-style PDF for a PANAMAR document
 *
 * @param {Object} doc - The PANAMAR document (as returned by panamarService.getDocuments)
 * @returns {Promise<Buffer>}
 */
async function generateAlbaranPDF(panamarDoc) {
  const lineas = panamarDoc.lineas || [];
  const isFactura = panamarDoc.tipoDocumento === 'factura';

  const docLabel = isFactura ? 'ALBARÁN / FACTURA' : 'ALBARÁN';
  const docRef = isFactura
    ? `${panamarDoc.serieAlbaran}-${panamarDoc.numeroAlbaran}`
    : `${panamarDoc.serieAlbaran}-${panamarDoc.numeroAlbaran}`;
  const fecha = `${pad2(panamarDoc.dia)}/${pad2(panamarDoc.mes)}/${panamarDoc.ano}`;
  const hora = panamarDoc.hora || '';

  logger.info('📄 PANAMAR PDF: Generando albarán', {
    ref: docRef,
    cliente: panamarDoc.codigoCliente,
    lineas: lineas.length
  });

  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({
      size: 'A4',
      margin: 30,
      bufferPages: true,
      info: {
        Title: `Albarán PANAMAR ${docRef}`,
        Author: 'Granja Mari Pepa - Modo PANAMAR',
        Subject: `Albarán para ${panamarDoc.nombreCliente}`,
        Keywords: 'Albarán, PANAMAR, Mari Pepa, Tarifa 85'
      }
    });

    const chunks = [];
    doc.on('data', chunk => chunks.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    const pageW = 595.28;
    const marginL = 30;
    const marginR = 30;
    const contentW = pageW - marginL - marginR;

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // TOP BAR
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    doc.rect(0, 0, pageW, 4).fillAndStroke(C.secondary, C.secondary);

    let y = 10;

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // HEADER: Logo + Empresa info (left) | ALBARÁN info (right)
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    y = drawLogo(doc, marginL, y, 250);

    // Right side: ALBARÁN box
    const albaranBoxX = pageW / 2 + 20;
    const albaranBoxW = pageW / 2 - 20 - marginR;
    const albaranBoxY = 10;

    // "ALBARÁN" title with border box
    doc.rect(albaranBoxX, albaranBoxY, albaranBoxW, 72)
      .strokeColor(C.border)
      .lineWidth(1.5)
      .stroke();

    // Top label
    doc.rect(albaranBoxX, albaranBoxY, albaranBoxW, 20)
      .fillAndStroke(C.secondary, C.secondary);

    doc.fontSize(11).font('Helvetica-Bold').fillColor(C.white)
      .text(docLabel, albaranBoxX, albaranBoxY + 5, { width: albaranBoxW, align: 'center' });

    // Reference number
    doc.fontSize(16).font('Helvetica-Bold').fillColor(C.primary)
      .text(docRef, albaranBoxX, albaranBoxY + 28, { width: albaranBoxW, align: 'center' });

    // Date & hour row
    doc.fontSize(8).font('Helvetica').fillColor(C.mediumGray)
      .text('Fecha:', albaranBoxX + 10, albaranBoxY + 52);
    doc.fontSize(9).font('Helvetica-Bold').fillColor(C.darkGray)
      .text(fecha, albaranBoxX + 42, albaranBoxY + 52);

    if (hora) {
      doc.fontSize(8).font('Helvetica').fillColor(C.mediumGray)
        .text('Hora:', albaranBoxX + albaranBoxW / 2 + 5, albaranBoxY + 52);
      doc.fontSize(9).font('Helvetica-Bold').fillColor(C.darkGray)
        .text(hora, albaranBoxX + albaranBoxW / 2 + 35, albaranBoxY + 52);
    }

    // Ejercicio
    doc.fontSize(8).font('Helvetica').fillColor(C.mediumGray)
      .text('Ejercicio:', albaranBoxX + 10, albaranBoxY + 62);
    doc.fontSize(9).font('Helvetica-Bold').fillColor(C.darkGray)
      .text(String(panamarDoc.ejercicio), albaranBoxX + 55, albaranBoxY + 62);

    y = Math.max(y, albaranBoxY + 78);
    y += 5;

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // CLIENT INFO BOX
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    const clientBoxH = 55;
    doc.rect(marginL, y, contentW, clientBoxH)
      .strokeColor(C.border).lineWidth(1).stroke();

    // "DATOS DEL CLIENTE" header bar
    doc.rect(marginL, y, contentW, 16)
      .fillAndStroke(C.lightGray, C.border);

    doc.fontSize(7).font('Helvetica-Bold').fillColor(C.darkGray)
      .text('DATOS DEL CLIENTE', marginL + 8, y + 5);

    y += 20;

    // Client data in two columns
    const col1X = marginL + 8;
    const col2X = marginL + contentW / 2 + 10;

    doc.fontSize(8).font('Helvetica').fillColor(C.mediumGray)
      .text('Cliente:', col1X, y);
    doc.fontSize(9).font('Helvetica-Bold').fillColor(C.darkGray)
      .text(`${panamarDoc.codigoCliente}  -  ${(panamarDoc.nombreCliente || '').toUpperCase()}`, col1X + 42, y);

    y += 13;

    doc.fontSize(8).font('Helvetica').fillColor(C.mediumGray)
      .text('NIF:', col1X, y);
    doc.fontSize(9).font('Helvetica-Bold').fillColor(C.darkGray)
      .text(panamarDoc.nifCliente || '-', col1X + 42, y);

    doc.fontSize(8).font('Helvetica').fillColor(C.mediumGray)
      .text('Población:', col2X, y);
    doc.fontSize(9).font('Helvetica-Bold').fillColor(C.darkGray)
      .text(panamarDoc.poblacionCliente || '-', col2X + 55, y);

    y += 13 + 10; // extra spacing before the table

    // Pedido info if exists
    if (panamarDoc.numeroPedido || panamarDoc.refPedido) {
      const pedidoText = [
        panamarDoc.numeroPedido ? `Ped. ${panamarDoc.numeroPedido}` : null,
        panamarDoc.refPedido ? `Ref: ${panamarDoc.refPedido}` : null
      ].filter(Boolean).join('  ·  ');

      doc.fontSize(7).font('Helvetica').fillColor(C.mediumGray)
        .text(pedidoText, marginL + 8, y - 8);
    }

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // PRODUCTS TABLE HEADER
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    const tableStartY = y;
    const rowH = 16;

    // Column definitions (matching the physical albarán)
    const cols = {
      ref:    { x: marginL,        w: 35,  label: 'Ref.' },
      desc:   { x: marginL + 35,   w: 175, label: 'Descripción' },
      lote:   { x: marginL + 210,  w: 48,  label: 'Lote' },
      cajas:  { x: marginL + 258,  w: 38,  label: 'Cajas' },
      uds:    { x: marginL + 296,  w: 42,  label: 'Uds/Kg' },
      precio: { x: marginL + 338,  w: 52,  label: 'Precio' },
      dto:    { x: marginL + 390,  w: 35,  label: '% Dto' },
      imp:    { x: marginL + 425,  w: contentW - 425, label: 'Importe' }
    };

    function drawTableHeader(doc, yPos) {
      // Header background
      doc.rect(marginL, yPos, contentW, rowH)
        .fillAndStroke(C.secondary, C.secondary);

      doc.fontSize(7).font('Helvetica-Bold').fillColor(C.white);

      doc.text(cols.ref.label, cols.ref.x + 2, yPos + 5, { width: cols.ref.w, align: 'left' });
      doc.text(cols.desc.label, cols.desc.x + 2, yPos + 5, { width: cols.desc.w, align: 'left' });
      doc.text(cols.lote.label, cols.lote.x + 2, yPos + 5, { width: cols.lote.w, align: 'left' });
      doc.text(cols.cajas.label, cols.cajas.x, yPos + 5, { width: cols.cajas.w, align: 'right' });
      doc.text(cols.uds.label, cols.uds.x, yPos + 5, { width: cols.uds.w, align: 'right' });
      doc.text(cols.precio.label, cols.precio.x, yPos + 5, { width: cols.precio.w, align: 'right' });
      doc.text(cols.dto.label, cols.dto.x, yPos + 5, { width: cols.dto.w, align: 'right' });
      doc.text(cols.imp.label, cols.imp.x, yPos + 5, { width: cols.imp.w, align: 'right' });

      return yPos + rowH;
    }

    y = drawTableHeader(doc, y);

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // PRODUCT ROWS
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    let alternate = false;

    lineas.forEach((line, idx) => {
      const descripcion = (line.descripcion || '').substring(0, 50);
      const descH = doc.heightOfString(descripcion, { width: cols.desc.w - 4 });
      const lineRowH = Math.max(rowH, descH + 8);

      // Page break if needed
      if (y + lineRowH > 740) {
        // Draw closing line before page break
        doc.moveTo(marginL, y).lineTo(marginL + contentW, y)
          .strokeColor(C.border).lineWidth(0.5).stroke();

        doc.addPage();
        // Top bar on new page
        doc.rect(0, 0, pageW, 4).fillAndStroke(C.secondary, C.secondary);
        y = 15;
        y = drawTableHeader(doc, y);
        alternate = false;
      }

      // Zebra stripe
      if (alternate) {
        doc.rect(marginL, y, contentW, lineRowH)
          .fillAndStroke(C.ultraLight, C.ultraLight);
      }

      doc.fontSize(7).font('Helvetica').fillColor(C.darkGray);

      // Ref (Código Artículo)
      doc.text(String(line.codigoArticulo || '').substring(0, 8), cols.ref.x + 2, y + 4, { width: cols.ref.w });

      // Description
      doc.text(descripcion, cols.desc.x + 2, y + 4, { width: cols.desc.w - 4 });

      // Lote
      doc.text(String(line.lote || '-').substring(0, 10), cols.lote.x + 2, y + 4, { width: cols.lote.w });

      // Cajas
      const cajasVal = line.cajas > 0 ? fmtNum(line.cajas, 0) : '-';
      doc.text(cajasVal, cols.cajas.x, y + 4, { width: cols.cajas.w, align: 'right' });

      // Uds/Kg
      const udsVal = line.unidades > 0 ? fmtNum(line.unidades, 0) : '-';
      doc.text(udsVal, cols.uds.x, y + 4, { width: cols.uds.w, align: 'right' });

      // Precio
      doc.font('Helvetica').fillColor(C.darkGray);
      doc.text(fmtNum(line.precioUnitario, 2), cols.precio.x, y + 4, { width: cols.precio.w, align: 'right' });

      // % Descuento
      const dtoVal = line.descuento > 0 ? fmtNum(line.descuento, 2) + '%' : '-';
      doc.text(dtoVal, cols.dto.x, y + 4, { width: cols.dto.w, align: 'right' });

      // Importe
      doc.font('Helvetica-Bold').fillColor(C.darkGray);
      doc.text(fmtNum(line.importe, 2), cols.imp.x, y + 4, { width: cols.imp.w, align: 'right' });

      // Reset
      doc.font('Helvetica').fillColor(C.darkGray);

      // Row bottom border
      doc.moveTo(marginL, y + lineRowH).lineTo(marginL + contentW, y + lineRowH)
        .strokeColor(C.lightGray).lineWidth(0.3).stroke();

      y += lineRowH;
      alternate = !alternate;
    });

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // TABLE CLOSING BORDER
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    doc.moveTo(marginL, y).lineTo(marginL + contentW, y)
      .strokeColor(C.border).lineWidth(1).stroke();

    y += 8;

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // TOTAL PANAMAR ROW
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    const totalBoxW = 220;
    const totalBoxX = marginL + contentW - totalBoxW;

    doc.rect(totalBoxX, y, totalBoxW, 26)
      .fillAndStroke(C.orange, C.orange);

    doc.fontSize(11).font('Helvetica-Bold').fillColor(C.white)
      .text('Total PANAMAR:', totalBoxX + 10, y + 7);

    doc.fontSize(14).font('Helvetica-Bold').fillColor(C.white)
      .text(fmtNum(panamarDoc.totalImportePanamar, 2) + ' €', totalBoxX + 130, y + 5, {
        width: totalBoxW - 140, align: 'right'
      });

    y += 34;

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // FOOTER on each page
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    const range = doc.bufferedPageRange();
    for (let i = 0; i < range.count; i++) {
      doc.switchToPage(i);

      const footY = 770;

      doc.moveTo(marginL, footY).lineTo(pageW - marginR, footY)
        .strokeColor(C.lightGray).lineWidth(0.5).stroke();

      doc.fontSize(6).font('Helvetica').fillColor(C.mediumGray)
        .text(EMPRESA.registro, marginL, footY + 4, {
          width: contentW, align: 'center'
        });

      doc.fontSize(7).fillColor(C.mediumGray)
        .text(`Página ${i + 1} de ${range.count}`, marginL, footY + 13, {
          width: contentW, align: 'center'
        });
    }

    doc.end();
  });
}

module.exports = {
  generateAlbaranPDF
};
