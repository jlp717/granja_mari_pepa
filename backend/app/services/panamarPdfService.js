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

function drawHeader(doc, yStart = 20) {
  let y = yStart;

  // Franja superior azul corporativa
  doc.rect(0, 0, 595.28, 4).fillAndStroke('#003d7a', '#003d7a');
  y += 5;

  if (HEADER_BUFFER) {
    try {
      // Diseño tradicional: El logo ocupa un espacio rectangular a la izquierda
      // y la información de distribución está al lado.
      // Usamos la imagen disponible pero ajustada para que parezca el diseño tradicional.
      doc.image(HEADER_BUFFER, 40, y, { width: 515, height: 100 });
      return y + 110;
    } catch (error) {
      logger.warn('PANAMAR PDF: Error renderizando header de imagen', { error: error.message });
    }
  }

  // Fallback de texto si falla la imagen
  doc.fontSize(24).font('Helvetica-Bold').fillColor('#003d7a').text('MARI PEPA', 40, y);
  doc.fontSize(10).fillColor('#333').text('Food & Frozen', 40, y + 25);
  return y + 50;
}

function buildDocumentContent(doc, panamarDoc) {
  const lineas = panamarDoc.lineas || [];
  const fecha = `${pad2(panamarDoc.dia)}.${pad2(panamarDoc.mes)}.${panamarDoc.ano || ''}`;

  let y = drawHeader(doc, 20);

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // CUADRO DE INFORMACIÓN (CLIENTE, FACTURA, FECHA) - Imagen 2
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  const gridY = y;
  const col1 = 40, col2 = 210, col3 = 380;
  const rowH = 15;

  // Dibujar tabla de cabecera (Grid)
  doc.lineWidth(0.5).strokeColor('#000');
  doc.rect(col1, gridY, col3 - col1, rowH * 2).stroke();
  doc.moveTo(210, gridY).lineTo(210, gridY + rowH * 2).stroke();
  doc.moveTo(380, gridY).lineTo(380, gridY + rowH * 2).stroke();
  doc.moveTo(col1, gridY + rowH).lineTo(col3, gridY + rowH).stroke();

  // Textos del Grid
  doc.fontSize(9).font('Helvetica-Bold').fillColor('#000');
  doc.text('CLIENTE', col1 + 5, gridY + 3);
  doc.text('FACTURA', col2 + 5, gridY + 3);
  doc.text('FECHA', col3 + 5, gridY + 3);

  doc.font('Helvetica');
  doc.text(panamarDoc.codigoCliente || '', col1 + 5, gridY + rowH + 3);
  const refFactura = panamarDoc.refFactura || '-';
  doc.text(refFactura, col2 + 5, gridY + rowH + 3);
  doc.text(fecha, col3 + 5, gridY + rowH + 3);

  // Cuadro de dirección y nombre a la derecha
  doc.rect(col3, gridY - 20, 175, rowH * 5 + 5).stroke();
  doc.fontSize(9).font('Helvetica-Bold').text((panamarDoc.nombreCliente || '').toUpperCase(), col3 + 5, gridY - 15, { width: 165 });
  
  y = gridY + (rowH * 5) + 15;

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // CABECERA DE TABLA DE PRODUCTOS
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  doc.lineWidth(0.5).moveTo(40, y).lineTo(555, y).stroke();
  y += 2;
  doc.fontSize(7).font('Helvetica-Bold');
  doc.text('Lote', 45, y);
  doc.text('Ref.', 110, y);
  doc.text('Descripción', 160, y);
  doc.text('Cajas', 350, y, { width: 35, align: 'right' });
  doc.text('Uds./Kgs.', 395, y, { width: 45, align: 'right' });
  doc.text('Precio', 450, y, { width: 40, align: 'right' });
  doc.text('% Dto.', 495, y, { width: 30, align: 'right' });
  doc.text('Importe', 530, y, { width: 40, align: 'right' });
  doc.text('IVA', 575, y, { width: 20 }); 
  
  // Reajuste de columnas para que quepan
  y += 10;
  doc.moveTo(40, y).lineTo(555, y).stroke();
  y += 5;

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // LÍNEAS DE PRODUCTOS - Agrupadas por albarán
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
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
  let totalImporteSinIva = 0;

  albaranes.forEach(albKey => {
    const albLines = lineasPorAlbaran[albKey];
    let subtotalAlbSinIva = 0;
    let subtotalAlbConIva = 0;

    albLines.forEach(line => {
      if (y > 750) {
        doc.addPage();
        y = drawHeader(doc, 20) + 10;
      }

      const cajas = Number(line.cajas) || 0;
      const unidades = Number(line.unidades) || 0;
      const precio = Number(line.precioCobro ?? line.precioUnitario ?? 0) || 0;
      const importe = Number(line.importe) || 0;
      const dto = Number(line.descuento) || 0;
      const iva = Number(line.iva) || 4;

      totalCajas += cajas;
      totalImporteSinIva += importe;
      subtotalAlbSinIva += importe;
      subtotalAlbConIva += importe * (1 + iva / 100);

      doc.fontSize(7).font('Helvetica').fillColor('#000');
      doc.text(String(line.lote || '-').substring(0, 15), 45, y);
      doc.text(String(line.codigoArticulo || ''), 110, y);
      doc.text(String(line.descripcion || '').substring(0, 50), 160, y);
      doc.text(cajas ? formatNumber(cajas, 2) : '0,00', 350, y, { width: 35, align: 'right' });
      doc.text(formatNumber(unidades, 3), 395, y, { width: 45, align: 'right' });
      doc.text(formatNumber(precio, 4), 450, y, { width: 40, align: 'right' });
      doc.text(dto > 0 ? formatNumber(dto, 2) : '', 495, y, { width: 30, align: 'right' });
      doc.text(formatNumber(importe, 2), 530, y, { width: 40, align: 'right' });
      doc.text(formatNumber(iva, 0), 575, y, { width: 20 });

      y += 10;
    });

    // Línea de referencia del albarán debajo (Imagen 2)
    const first = albLines[0];
    const fechaAlb = `${pad2(first.dia)}.${pad2(first.mes)}.${first.ano}`;
    doc.fontSize(7).font('Helvetica-Bold').fillColor('#333');
    doc.text('Albarán', 110, y);
    doc.font('Helvetica').text(`${albKey}`, 160, y);
    doc.font('Helvetica-Bold').text('Fecha', 220, y);
    doc.font('Helvetica').text(fechaAlb, 260, y);

    // Total del albarán (con IVA como en Imagen 2)
    doc.fontSize(8).font('Helvetica-Bold').fillColor('#000');
    doc.text('Total Albarán', 440, y);
    doc.text(formatNumber(subtotalAlbConIva, 2), 530, y, { width: 40, align: 'right' });
    
    y += 15;
    doc.moveTo(40, y).lineTo(555, y).lineWidth(0.2).stroke();
    y += 5;
  });

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // BLOQUE DE TOTALES FINALES (Consumo e Importe)
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  y = Math.max(y, 700);
  
  // Cuadro Consumo
  doc.rect(40, y, 250, 40).fillAndStroke('#2E8B57', '#2E8B57');
  doc.fontSize(11).font('Helvetica-Bold').fillColor('#FFF').text('CONSUMO TOTAL (CAJAS)', 50, y + 15);
  doc.fontSize(18).text(formatNumber(totalCajas, 0), 220, y + 12, { width: 60, align: 'right' });

  // Cuadro Importe
  doc.rect(305, y, 250, 40).fillAndStroke('#E67E22', '#E67E22');
  doc.fontSize(11).font('Helvetica-Bold').fillColor('#FFF').text('IMPORTE TOTAL (SIN IVA)', 315, y + 15);
  doc.fontSize(18).text(`${formatNumber(totalImporteSinIva, 2)} €`, 440, y + 12, { width: 105, align: 'right' });

  // Paginación y footer
  const pages = doc.bufferedPageRange();
  for (let i = 0; i < pages.count; i++) {
    doc.switchToPage(i);
    drawFooter(doc, i + 1, pages.count);
  }
}

function drawFooter(doc, pageNum, totalPages) {
  const footerY = 770;
  doc.lineWidth(0.5).moveTo(40, footerY).lineTo(555, footerY).strokeColor('#ccc').stroke();
  doc.fontSize(6).font('Helvetica').fillColor('#666')
    .text(EMPRESA.registro, 40, footerY + 5, { align: 'center', width: 515 });
  doc.fontSize(7)
    .text(`Página ${pageNum} de ${totalPages}`, 40, footerY + 13, { align: 'center', width: 515 });
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

