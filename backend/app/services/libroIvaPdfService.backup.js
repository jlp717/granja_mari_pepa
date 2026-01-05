/**
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 * 🏢 GRANJA MARI PEPA - SERVICIO DE LIBRO IVA PDF (REF LAYOUT)
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 *
 * Objetivo:
 * - Clonar el diseño de referencia (capturas del usuario)
 * - Totales claros: fila de sumatorio + cajas de totales
 * - RESUMEN POR SERIE como tabla al final
 * - Formato numérico español
 * - Incluir abonos/negativos (Libro IVA real) y excluir solo registros con base/IVA/total = 0
 */

const PDFDocument = require('pdfkit');
const logger = require('../utils/logger');
const path = require('path');
const fs = require('fs');

const HEADER_WEBP = path.join(__dirname, '../../assets/header.webp');
const HEADER_PNG = path.join(__dirname, '../../assets/header.png');

const COLORS = {
  blue: '#1a5490',
  blueLight: '#cfe3f3',
  blueLine: '#2b73b8',
  text: '#000000',
  gray: '#6c757d',
  border: '#b7c7d8',
  zebra: '#f3f8fd',
  totalRow: '#f6efc9',
  totalBar: '#d6e5e1',
  white: '#ffffff'
};

function formatNumber(num, decimals = 2) {
  if (num === null || num === undefined || isNaN(num)) return '0,00';
  const fixed = Math.abs(Number(num)).toFixed(decimals);
  const parts = fixed.split('.');
  const integerPart = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  const result = parts[1] ? integerPart + ',' + parts[1] : integerPart;
  return Number(num) < 0 ? '-' + result : result;
}

function money(num) {
  return `${formatNumber(num, 2)} €`;
}

function safeText(v) {
  return (v ?? '').toString();
}

function formatFacturaId(reg) {
  // Formato tipo: 2025-F-000-000616
  const year = String(reg.ANOFACTURA || reg.ANO || '').padStart(4, '0');
  const serie = (reg.SERIEFACTURA || reg.SERIE || '').trim() || 'X';
  const numero = String(reg.NUMEROFACTURA ?? reg.NUMERO ?? '').padStart(6, '0');
  return `${year}-${serie}-000-${numero}`;
}

function shouldIncludeRegistro(reg) {
  const base = Number.parseFloat(reg.BASE_IMPONIBLE) || 0;
  const iva = Number.parseFloat(reg.IVA) || 0;
  const total = Number.parseFloat(reg.TOTAL) || 0;
  return Math.abs(base) > 0.0001 && Math.abs(iva) > 0.0001 && Math.abs(total) > 0.0001;
}

function drawHeader(doc, { ejercicio, fechaInicio, fechaFin, clienteNombre }) {
  let y = 20;

  // Imagen corporativa
  const imgPath = fs.existsSync(HEADER_PNG) ? HEADER_PNG : (fs.existsSync(HEADER_WEBP) ? HEADER_WEBP : null);
  if (imgPath) {
    try {
      // Hacer el header más alto para mejor presencia
      // Usar una altura consistente y dejar margen inferior extra
      const headerImgHeight = 140;
      const headerBottomGap = 12; // espacio adicional tras la imagen
      doc.image(imgPath, 40, y, { width: 515, height: headerImgHeight });
      y += headerImgHeight + headerBottomGap;
    } catch {
      // fallback texto
    }
  }

  // Título
  doc
    .moveTo(40, y)
    .lineTo(555, y)
    .lineWidth(2)
    .strokeColor(COLORS.blueLine)
    .stroke();

  y += 8;

  doc
    .font('Helvetica-Bold')
    .fontSize(16)
    .fillColor(COLORS.blue)
    .text('LIBRO DE I.V.A. REPERCUTIDO', 40, y, { width: 380 });

  const generado = new Date().toLocaleDateString('es-ES', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });

  doc
    .font('Helvetica')
    .fontSize(9)
    .fillColor(COLORS.gray)
    .text(`Generado: ${generado}`, 420, y + 4, { width: 135, align: 'right' });

  y += 22;

  doc
    .font('Helvetica-Bold')
    .fontSize(9)
    .fillColor(COLORS.text)
    .text('PERIODO FISCAL:', 40, y);

  doc
    .font('Helvetica')
    .fontSize(9)
    .text(`  ${fechaInicio}   hasta   ${fechaFin}`, 140, y);

  doc
    .font('Helvetica-Bold')
    .text('CLIENTE:', 330, y);

  doc
    .font('Helvetica')
    .text(`  ${clienteNombre}`, 390, y, { width: 165, align: 'left' });

  y += 14;

  doc
    .moveTo(40, y)
    .lineTo(555, y)
    .lineWidth(1)
    .strokeColor(COLORS.blueLine)
    .stroke();

  return y + 12;
}

function drawTableHeader(doc, y, cols) {
  doc.rect(40, y, 515, 20).fillAndStroke(COLORS.blueLight, COLORS.border);

  doc.font('Helvetica-Bold').fontSize(7).fillColor(COLORS.text);

  const txtOpt = (w, align = 'left') => ({ width: w, lineBreak: false, ellipsis: true, align });

  doc.text('Factura', cols.factura, y + 7, txtOpt(cols.wFactura));
  doc.text('Fecha', cols.fecha, y + 7, txtOpt(cols.wFecha));
  doc.text('Cliente', cols.cliente, y + 7, txtOpt(cols.wCliente));
  doc.text('N.I.F.', cols.nif, y + 7, txtOpt(cols.wNif));
  doc.text('Base Imp.', cols.base, y + 7, txtOpt(cols.wBase, 'right'));
  doc.text('%IVA', cols.porcIva, y + 7, txtOpt(cols.wPorcIva, 'right'));
  doc.text('IVA', cols.impIva, y + 7, txtOpt(cols.wImpIva, 'right'));
  doc.text('%Rec', cols.porcRec, y + 7, txtOpt(cols.wPorcRec, 'right'));
  doc.text('Rec.', cols.impRec, y + 7, txtOpt(cols.wImpRec, 'right'));
  doc.text('Total', cols.totalFactura, y + 7, txtOpt(cols.wTotalFactura, 'right'));

  return y + 18;
}

function drawTotalsRow(doc, y, cols, totals) {
  doc.rect(40, y, 515, 16).fillAndStroke(COLORS.totalRow, COLORS.border);

  const porcIva = totals.totalBase !== 0 ? (totals.totalIVA / totals.totalBase) * 100 : 0;
  const porcRec = totals.totalBase !== 0 ? (totals.totalRecargo / totals.totalBase) * 100 : 0;

  doc.font('Helvetica-Bold').fontSize(8).fillColor(COLORS.text);

  // Solo rellenamos los campos clave como en la referencia (base, %iva, iva, %rec, total)
  doc.text(formatNumber(totals.totalBase, 2), cols.base, y + 6, { width: cols.wBase, align: 'right', lineBreak: false });
  doc.text(formatNumber(porcIva, 2), cols.porcIva, y + 6, { width: cols.wPorcIva, align: 'right', lineBreak: false });
  doc.text(money(totals.totalIVA), cols.impIva, y + 6, { width: cols.wImpIva, align: 'right', lineBreak: false });
  doc.text(porcRec !== 0 ? formatNumber(porcRec, 2) : '-', cols.porcRec, y + 6, { width: cols.wPorcRec, align: 'right', lineBreak: false });
  doc.text(totals.totalRecargo !== 0 ? money(totals.totalRecargo) : '-', cols.impRec, y + 6, { width: cols.wImpRec, align: 'right' });
  doc.text(money(totals.totalGeneral), cols.totalFactura, y + 6, { width: cols.wTotalFactura, align: 'right' });

  return y + 18;
}

function drawTotalsBar(doc, y, totals) {
  doc.rect(40, y, 515, 22).fillAndStroke(COLORS.totalBar, COLORS.border);

  doc.font('Helvetica-Bold').fontSize(10).fillColor(COLORS.text);

  // 3 bloques: base / iva / total
  const w = 515;
  const x = 40;
  const bW = Math.floor(w / 3);

  doc.text(money(totals.totalBase), x, y + 8, { width: bW, align: 'center' });
  doc.text(money(totals.totalIVA), x + bW, y + 8, { width: bW, align: 'center' });
  doc.text(money(totals.totalGeneral), x + bW * 2, y + 8, { width: w - bW * 2, align: 'center' });

  return y + 30;
}

function drawResumenPorSerie(doc, y, resumen, opts = {}) {
  const pageBottom = doc.page.height - 40;
  doc.font('Helvetica-Bold').fontSize(11).fillColor(COLORS.blue).text('RESUMEN POR SERIE', 40, y);
  y += 12;

  // Tabla resumen (ajustada a ancho 515)
  const rowH = 18;
  const tableW = 515;
  const c = {
    serie: 46,
    desc: 90,
    base: 320,
    porcIva: 400,
    impIva: 450
  };

  // Cabecera
  doc.rect(40, y, tableW, rowH).fillAndStroke(COLORS.blueLight, COLORS.border);
  doc.font('Helvetica-Bold').fontSize(8).fillColor(COLORS.text);
  doc.text('Serie', c.serie, y + 6, { width: 40 });
  doc.text('Descripción', c.desc, y + 6, { width: 230 });
  doc.text('Base Imp.', c.base, y + 6, { width: 80, align: 'right' });
  doc.text('%IVA', c.porcIva, y + 6, { width: 50, align: 'right' });
  doc.text('IVA', c.impIva, y + 6, { width: 60, align: 'right' });
  y += rowH;

  doc.font('Helvetica').fontSize(8).fillColor(COLORS.text);

  const series = Object.keys(resumen).sort();
  series.forEach((serie, idx) => {
    const s = resumen[serie];
    const porcIva = s.base !== 0 ? (s.iva / s.base) * 100 : 0;

    // Si no cabe la siguiente fila, crear nueva página y repetir header
    if (y + rowH > pageBottom) {
      logger.info('🧭 Añadiendo nueva página (resumen) porque y+rowH > pageBottom', { y, rowH, pageBottom, serie });
      doc.addPage();
      y = opts.drawHeader ? opts.drawHeader() : 20;
      // volver a dibujar título y cabecera de la tabla resumen
      doc.font('Helvetica-Bold').fontSize(12).fillColor(COLORS.blue).text('RESUMEN POR SERIE', 40, y);
      y += 14;
      doc.rect(40, y, tableW, rowH).fillAndStroke(COLORS.blueLight, COLORS.border);
      doc.font('Helvetica-Bold').fontSize(8).fillColor(COLORS.text);
      doc.text('Serie', c.serie, y + 6, { width: 40 });
      doc.text('Descripción', c.desc, y + 6, { width: 230 });
      doc.text('Base Imp.', c.base, y + 6, { width: 80, align: 'right' });
      doc.text('%IVA', c.porcIva, y + 6, { width: 50, align: 'right' });
      doc.text('IVA', c.impIva, y + 6, { width: 60, align: 'right' });
      y += rowH;
    }

    // Add subtle border to row
    doc.rect(40, y, tableW, rowH).strokeColor(COLORS.border).lineWidth(0.5).stroke();

    const desc = serie === 'A'
      ? 'FACTURAS DIRECTAS TERMINALES'
      : (serie === 'F'
        ? 'FACTURAS VENTAS'
        : 'OTRAS');

    doc.text(serie, c.serie, y + 6, { width: 40 });
    doc.text(`${desc} (${formatNumber(porcIva, 2)}%)`, c.desc, y + 6, { width: 230 });
    doc.text(money(s.base), c.base, y + 6, { width: 80, align: 'right' });
    doc.text(formatNumber(porcIva, 2) + ' %', c.porcIva, y + 6, { width: 50, align: 'right' });
    doc.text(money(s.iva), c.impIva, y + 6, { width: 60, align: 'right' });

    y += rowH;
  });

  return y + 10;
}

async function generateLibroIvaPDF(datosLibro) {
  try {
    const { ejercicio, cliente, registros = [] } = datosLibro;

    // Periodo anual (según comportamiento actual)
    const fechaInicio = `01/01/${ejercicio}`;
    const fechaFin = `31/12/${ejercicio}`;

    const registrosFiltrados = registros.filter(shouldIncludeRegistro);

    // Totales (sobre filtrados)
    const totals = registrosFiltrados.reduce(
      (acc, r) => {
        acc.totalBase += Number.parseFloat(r.BASE_IMPONIBLE) || 0;
        acc.totalIVA += Number.parseFloat(r.IVA) || 0;
        acc.totalRecargo += Number.parseFloat(r.RECARGO) || 0;
        acc.totalGeneral += Number.parseFloat(r.TOTAL) || 0;
        return acc;
      },
      { totalBase: 0, totalIVA: 0, totalRecargo: 0, totalGeneral: 0 }
    );
    totals.totalBase = Math.round(totals.totalBase * 100) / 100;
    totals.totalIVA = Math.round(totals.totalIVA * 100) / 100;
    totals.totalRecargo = Math.round(totals.totalRecargo * 100) / 100;
    totals.totalGeneral = Math.round(totals.totalGeneral * 100) / 100;

    const clienteNombre = safeText(cliente?.NOMBRECLIENTE || 'CLIENTE').toUpperCase();

    // Resumen por serie
    const resumen = {};
    registrosFiltrados.forEach(r => {
      const serie = safeText(r.SERIEFACTURA).trim() || 'N/A';
      if (!resumen[serie]) {
        resumen[serie] = { serie, base: 0, iva: 0, recargo: 0, total: 0 };
      }
      resumen[serie].base += Number.parseFloat(r.BASE_IMPONIBLE) || 0;
      resumen[serie].iva += Number.parseFloat(r.IVA) || 0;
      resumen[serie].recargo += Number.parseFloat(r.RECARGO) || 0;
      resumen[serie].total += Number.parseFloat(r.TOTAL) || 0;
    });

    logger.info('📄 Generando PDF Libro IVA (layout referencia)', {
      ejercicio,
      cliente: clienteNombre,
      registrosOriginales: registros.length,
      registrosFiltrados: registrosFiltrados.length,
      total: totals.totalGeneral
    });

    return new Promise((resolve, reject) => {
      const doc = new PDFDocument({
        size: 'A4',
        layout: 'portrait',
        margin: 40,
        bufferPages: true,
        info: {
          Title: `Libro IVA ${ejercicio} - ${clienteNombre}`,
          Author: 'MARI PEPA',
          Subject: `Libro IVA Repercutido ${ejercicio}`
        }
      });

      const chunks = [];
      doc.on('data', c => chunks.push(c));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      // Columnas (ajustadas a ancho A4 con margen)
      // Ancho útil: 515 (de x=40 a x=555). Debe CABER TODO.
      // Nueva distribución ajustada para ancho 515
      // Factura 80 | Fecha 45 | Cliente 50 | NIF 60 | Base 70 | %IVA 30 | IVA 60 | %Rec 15 | ImpRec 20 | TotalFact. 85
      let x = 40;
      const cols = {
        factura: x,
        wFactura: 80,
        fecha: (x += 80),
        wFecha: 45,
        cliente: (x += 45),
        wCliente: 50,
        nif: (x += 50),
        wNif: 60,
        base: (x += 60),
        wBase: 70,
        porcIva: (x += 70),
        wPorcIva: 30,
        impIva: (x += 30),
        wImpIva: 60,
        porcRec: (x += 60),
        wPorcRec: 15,
        impRec: (x += 15),
        wImpRec: 20,
        totalFactura: (x += 20),
        wTotalFactura: 85
      };

      let y = drawHeader(doc, {
        ejercicio,
        fechaInicio,
        fechaFin,
        clienteNombre
      });

      y = drawTableHeader(doc, y, cols);

      doc.font('Helvetica').fontSize(8).fillColor(COLORS.text);

      const pageBottom = doc.page.height - 40;
      const rowH = 14;

      registrosFiltrados.forEach((reg, idx) => {
        if (y + rowH > pageBottom) {
          logger.info('🧭 Añadiendo nueva página (registro) porque y+rowH > pageBottom', { y, rowH, pageBottom, idx });
          doc.addPage();
          y = drawHeader(doc, { ejercicio, fechaInicio, fechaFin, clienteNombre });
          y = drawTableHeader(doc, y, cols);
          doc.font('Helvetica').fontSize(8).fillColor(COLORS.text);
        }

        if (idx % 2 === 0) {
          // doc.rect(40, y, 515, rowH).fillAndStroke(COLORS.zebra, COLORS.zebra);
        }

        // Add border to row for better visibility
        doc.rect(40, y, 515, rowH).strokeColor(COLORS.border).lineWidth(0.5).stroke();

        const base = Number.parseFloat(reg.BASE_IMPONIBLE) || 0;
        const iva = Number.parseFloat(reg.IVA) || 0;
        const rec = Number.parseFloat(reg.RECARGO) || 0;
        const total = Number.parseFloat(reg.TOTAL) || 0;

        const porcIva = base !== 0 ? (iva / base) * 100 : 0;
        const porcRec = base !== 0 ? (rec / base) * 100 : 0;

        doc.text(formatFacturaId(reg), cols.factura, y + 4, { width: cols.wFactura, lineBreak: false });
        doc.text(safeText(reg.FECHAFACTURA), cols.fecha, y + 4, { width: cols.wFecha, lineBreak: false });
        doc.text(safeText(reg.CODIGOCLIENTE || reg.CODIGOCLIENTEFACTURA || '').substring(0, 12), cols.cliente, y + 4, { width: cols.wCliente, lineBreak: false });
        doc.text(safeText(reg.CIFCLIENTE || '').substring(0, 20), cols.nif, y + 4, { width: cols.wNif, lineBreak: false });

        doc.text(money(base), cols.base, y + 4, { width: cols.wBase, align: 'right', lineBreak: false });
        doc.text(formatNumber(porcIva, 2), cols.porcIva, y + 4, { width: cols.wPorcIva, align: 'right', lineBreak: false });
        doc.text(money(iva), cols.impIva, y + 4, { width: cols.wImpIva, align: 'right', lineBreak: false });
        doc.text(rec !== 0 ? formatNumber(porcRec, 2) : '-', cols.porcRec, y + 4, { width: cols.wPorcRec, align: 'right', lineBreak: false });
        doc.text(rec !== 0 ? money(rec) : '-', cols.impRec, y + 4, { width: cols.wImpRec, align: 'right', lineBreak: false });
        doc.text(money(total), cols.totalFactura, y + 4, { width: cols.wTotalFactura, align: 'right' });

        y += rowH;
      });

      // Totales y resumen deben ir en la última página; si no caben, saltar.
      // Cálculo más preciso: solo saltar si realmente no cabe el bloque completo
      const resumenHeight = 34 + Object.keys(resumen).length * 20;
      const needed = 18 + 28 + 8 + resumenHeight; // totals row + bar + gap + resumen
      if (y + needed > pageBottom) {
        logger.info('🧭 Añadiendo nueva página (totales/resumen) porque y+needed > pageBottom', { y, needed, pageBottom });
        doc.addPage();
        y = drawHeader(doc, { ejercicio, fechaInicio, fechaFin, clienteNombre });
        y = drawTableHeader(doc, y, cols);
      }

      logger.info('🔢 Antes de dibujar totales', { y, pageBottom });
      y = drawTotalsRow(doc, y, cols, totals);
      logger.info('🔢 Tras drawTotalsRow', { y });
      y = drawTotalsBar(doc, y, totals);
      logger.info('🔢 Tras drawTotalsBar', { y });

      // Dejar un pequeño espacio antes del resumen para evitar solapamientos
      y += 6;
      y = drawResumenPorSerie(doc, y, resumen);

      // Footer paginado
      const range = doc.bufferedPageRange();
      for (let i = 0; i < range.count; i++) {
        doc.switchToPage(i);
        doc.font('Helvetica').fontSize(7).fillColor(COLORS.gray);
        doc.text(`Pág: ${i + 1}`, 40, doc.page.height - 35, { width: 515, align: 'right' });
      }

      logger.info('🧾 Rango de páginas generado', { pages: doc.bufferedPageRange().count });

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
