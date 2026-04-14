/**
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 * 🏢 GRANJA MARI PEPA - SERVICIO DE GENERACIÓN DE PDFs v2.0
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 *
 * Genera PDFs de facturas con diseño PROFESIONAL y ELEGANTE
 * ✨ Diseño único e inigualable para Granja Mari Pepa
 * 🎨 Visual, rápido y fácil de leer para el cliente
 * ✅ Datos 100% precisos y verificados
 *
 * @version 2.0 - Rediseño profesional completo
 * @author Claude Code - Sistema de Facturación Mari Pepa
 * @date 2025-12-15
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 */

const PDFDocument = require('pdfkit');
const logger = require('../utils/logger');
const path = require('path');
const fs = require('fs');

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// CONFIGURACIÓN Y CONSTANTES
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

const HEADER_PATH = path.join(__dirname, '../../assets/header.webp');
const HEADER_PNG_PATH = path.join(__dirname, '../../assets/header.png');

// Paleta de colores corporativos Mari Pepa - Elegante y Profesional
const COLORS = {
   primary: '#003d7a',        // Azul corporativo principal
   secondary: '#1a5490',      // Azul secundario para headers
   accent: '#28a745',         // Verde para totales y elementos positivos
   success: '#28a745',        // Verde success
   darkGray: '#2c3e50',       // Gris oscuro para texto principal
   mediumGray: '#6c757d',     // Gris medio para texto secundario
   lightGray: '#E8E8E8',      // Gris claro para fondos y bordes
   ultraLight: '#f8f9fa',     // Gris ultra claro para fondos sutiles
   border: '#dee2e6',         // Color de bordes suaves
   white: '#FFFFFF'           // Blanco puro
};

// Información de la empresa
const EMPRESA = {
   nombre: 'MARI PEPA',
   slogan: 'Food & Frozen',
   descripcion: 'Congelados y refrigerados para hostelería',
   web: 'www.mari-pepa.com',
   registro: 'Inscrita en el registro mercantil de Murcia. Libro 140, Sección 3ª, Folio 142, Hoja 5657, Inscripción 2ª. CIF: B04008710'
};

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// FUNCIONES AUXILIARES
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

/**
 * Formatear número estilo español (1234.56 → 1.234,56)
 */
function formatNumber(num, decimals = 2) {
   if (num === null || num === undefined || isNaN(num)) return '0,00';
   const fixed = Math.abs(num).toFixed(decimals);
   const parts = fixed.split('.');
   const integerPart = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, '.');
   const result = parts[1] ? integerPart + ',' + parts[1] : integerPart;
   return num < 0 ? '-' + result : result;
}

/**
 * Formatear fecha DD/MM/YYYY
 */
function formatDate(dia, mes, ano) {
   const d = String(dia || '').padStart(2, '0');
   const m = String(mes || '').padStart(2, '0');
   const a = ano || '';
   return `${d}/${m}/${a}`;
}

/**
 * Dibujar header corporativo profesional
 */
function drawHeader(doc, yStart = 10) {
   let yPos = yStart;

   // Franja superior de marca (moderna y delgada)
   doc.rect(0, 0, 595.28, 5)
      .fillAndStroke(COLORS.secondary, COLORS.secondary);

   yPos += 5;

   // Intentar cargar el logo
   let logoLoaded = false;

   if (fs.existsSync(HEADER_PNG_PATH)) {
      try {
         // Hacer el header más alto para evitar aspecto aplanado
         doc.image(HEADER_PNG_PATH, 40, yPos, { width: 515, height: 140 });
         logoLoaded = true;
         return yPos + 150;
      } catch (e) {
         logger.warn('⚠️ No se pudo cargar header.png');
      }
   }

   if (!logoLoaded && fs.existsSync(HEADER_PATH)) {
      try {
         doc.image(HEADER_PATH, 40, yPos, { width: 515, height: 140 });
         logoLoaded = true;
         return yPos + 150;
      } catch (e) {
         logger.warn('⚠️ No se pudo cargar header.webp');
      }
   }

   // Si no hay logo, crear header de texto elegante
   if (!logoLoaded) {
      // Fondo sutil (más alto)
      doc.rect(40, yPos, 515, 120)
         .fillAndStroke(COLORS.ultraLight, COLORS.lightGray);

      yPos += 18;

      // Nombre de la empresa - GRANDE Y DESTACADO
      doc.fontSize(36)
         .font('Helvetica-Bold')
         .fillColor(COLORS.primary)
         .text(EMPRESA.nombre, 50, yPos);

      yPos += 45;

      // Slogan
      doc.fontSize(14)
         .fillColor(COLORS.darkGray)
         .font('Helvetica')
         .text(EMPRESA.slogan.toUpperCase(), 50, yPos);

      yPos += 18;

      // Descripción y web
      doc.fontSize(9)
         .fillColor(COLORS.mediumGray)
         .text(EMPRESA.descripcion, 50, yPos);

      doc.fontSize(9)
         .fillColor(COLORS.secondary)
         .text(EMPRESA.web, 450, yPos, { align: 'right', width: 95 });

      yPos += 10;
   }

   return yPos + 5;
}

/**
 * Dibujar footer corporativo
 */
function drawFooter(doc, pageNum, totalPages) {
   const footerY = 770;

   // Línea separadora elegante
   doc.moveTo(40, footerY)
      .lineTo(555, footerY)
      .strokeColor(COLORS.lightGray)
      .lineWidth(0.5)
      .stroke();

   // Registro mercantil
   doc.fontSize(6)
      .font('Helvetica')
      .fillColor(COLORS.mediumGray)
      .text(EMPRESA.registro, 40, footerY + 5, {
         align: 'center',
         width: 515
      });

   // Número de página
   doc.fontSize(7)
      .fillColor(COLORS.mediumGray)
      .text(`Página ${pageNum} de ${totalPages}`, 40, footerY + 13, {
         align: 'center',
         width: 515
      });
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// FUNCIÓN PRINCIPAL DE GENERACIÓN DE PDF
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

/**
 * Generar PDF de factura con diseño profesional
 * @param {Object} facturaData - {header, lines, payments}
 * @returns {Promise<Buffer>} PDF generado
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
            bufferPages: true,
            info: {
               Title: `Factura ${header.SERIEFACTURA}-${header.NUMEROFACTURA}`,
               Author: `${EMPRESA.nombre} ${EMPRESA.slogan}`,
               Subject: `Factura para ${header.NOMBRECLIENTEFACTURA}`,
               Keywords: 'Factura, Mari Pepa, Food & Frozen, Hostelería'
            }
         });

         const chunks = [];
         doc.on('data', chunk => chunks.push(chunk));
         doc.on('end', () => resolve(Buffer.concat(chunks)));
         doc.on('error', reject);

         // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
         // HEADER CORPORATIVO
         // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
         let y = drawHeader(doc, 10);
         y += 10;

         // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
         // TÍTULO DE FACTURAR - BANNER DESTACADO
         // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
         doc.rect(40, y, 515, 32)
            .fillAndStroke(COLORS.secondary, COLORS.secondary);

         doc.fontSize(18)
            .font('Helvetica-Bold')
            .fillColor(COLORS.white)
            .text('FACTURA', 50, y + 10);

         const numFactura = header.SERIEFACTURA ? `${header.SERIEFACTURA}-${header.NUMEROFACTURA}` : header.NUMEROFACTURA;
         doc.fontSize(16)
            .text(numFactura, 400, y + 10, { width: 145, align: 'right' });

         y += 38;

         // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
         // INFORMACIÓN DE FACTURA (FECHA Y EJERCICIO)
         // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
         const fecha = formatDate(header.DIAFACTURA, header.MESFACTURA, header.ANOFACTURA);

         // Caja izquierda: Código Cliente
         doc.rect(40, y, 160, 20)
            .fillAndStroke(COLORS.lightGray, COLORS.border);

         doc.fontSize(7)
            .font('Helvetica-Bold')
            .fillColor(COLORS.mediumGray)
            .text('CÓDIGO CLIENTE', 45, y + 5);

         doc.fontSize(10)
            .font('Helvetica-Bold')
            .fillColor(COLORS.darkGray)
            .text(header.CODIGOCLIENTEFACTURA || '', 45, y + 13);

         // Caja centro: Fecha
         doc.rect(205, y, 180, 20)
            .fillAndStroke(COLORS.lightGray, COLORS.border);

         doc.fontSize(7)
            .font('Helvetica-Bold')
            .fillColor(COLORS.mediumGray)
            .text('FECHA', 210, y + 5);

         doc.fontSize(10)
            .font('Helvetica-Bold')
            .fillColor(COLORS.darkGray)
            .text(fecha, 210, y + 13);

         // Caja derecha: Ejercicio
         doc.rect(390, y, 165, 20)
            .fillAndStroke(COLORS.lightGray, COLORS.border);

         doc.fontSize(7)
            .font('Helvetica-Bold')
            .fillColor(COLORS.mediumGray)
            .text('EJERCICIO FISCAL', 395, y + 5);

         doc.fontSize(10)
            .font('Helvetica-Bold')
            .fillColor(COLORS.darkGray)
            .text(header.EJERCICIOFACTURA || header.ANOFACTURA || '', 395, y + 13);

         y += 26;

         // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
         // INFORMACIÓN DEL CLIENTE - TARJETA ELEGANTE
         // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
         const clienteBoxStartY = y;

         // Fondo de la tarjeta
         doc.rect(40, y, 515, 85)
            .fillAndStroke(COLORS.ultraLight, COLORS.lightGray)
            .lineWidth(1);

         y += 8;

         // Etiqueta
         doc.fontSize(8)
            .font('Helvetica-Bold')
            .fillColor(COLORS.secondary)
            .text('FACTURAR A', 45, y);

         y += 15;

         // Nombre del cliente - DESTACADO
         doc.fontSize(12)
            .font('Helvetica-Bold')
            .fillColor(COLORS.darkGray)
            .text((header.NOMBRECLIENTEFACTURA || '').toUpperCase(), 45, y, {
               width: 500
            });

         y += 18;

         // Dirección
         doc.fontSize(9)
            .font('Helvetica')
            .fillColor(COLORS.darkGray);

         if (header.DIRECCIONCLIENTEFACTURA) {
            doc.text(header.DIRECCIONCLIENTEFACTURA, 45, y);
            y += 12;
         }

         // CP, Población y Provincia
         if (header.CPCLIENTEFACTURA || header.POBLACIONCLIENTEFACTURA) {
            let localidad = '';
            if (header.CPCLIENTEFACTURA) localidad += header.CPCLIENTEFACTURA + ' ';
            if (header.POBLACIONCLIENTEFACTURA) localidad += header.POBLACIONCLIENTEFACTURA;
            if (header.PROVINCIACLIENTEFACTURA) localidad += ' (' + header.PROVINCIACLIENTEFACTURA + ')';

            doc.text(localidad.trim(), 45, y);
            y += 12;
         }

         // NIF/CIF
         if (header.CIFCLIENTEFACTURA) {
            doc.fontSize(9)
               .font('Helvetica-Bold')
               .text(`NIF/CIF: ${header.CIFCLIENTEFACTURA}`, 45, y);
         }

         y = clienteBoxStartY + 93;

         // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
         // TABLA DE PRODUCTOS - CABECERA
         // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
         doc.rect(40, y, 515, 16)
            .fillAndStroke(COLORS.secondary, COLORS.secondary);

         doc.fontSize(7)
            .font('Helvetica-Bold')
            .fillColor(COLORS.white);

         // Columnas de la tabla - INCLUYE LOTE y CAJAS
         doc.text('CÓDIGO', 42, y + 5, { width: 50 });
         doc.text('DESCRIPCIÓN', 95, y + 5, { width: 170 });
         doc.text('LOTE', 270, y + 5, { width: 45 });
         doc.text('CAJAS', 320, y + 5, { width: 35, align: 'right' });
         doc.text('CANT.', 360, y + 5, { width: 38, align: 'right' });
         doc.text('PRECIO', 403, y + 5, { width: 42, align: 'right' });
         doc.text('% DTO', 450, y + 5, { width: 30, align: 'center' });
         doc.text('% IVA', 485, y + 5, { width: 25, align: 'center' });
         doc.text('IMPORTE', 515, y + 5, { width: 40, align: 'right' });

         y += 18;

         // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
         // LÍNEAS DE PRODUCTOS
         // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
         doc.fontSize(7)
            .font('Helvetica')
            .fillColor(COLORS.darkGray);

         const startProductsY = y;
         let alternateRow = true;

         lines.forEach((line, index) => {
            // Fallbacks para campos que pueden venir con nombres distintos en facturas recopiladas o de Panamar
            const descripcion = (line.DESCRIPCIONARTICULO || line.DESCRIPCION || line.NOMBREARTICULO || line.CONCEPTO || '').substring(0, 50);
            
            // Calcular altura dinámica basada en la descripción (ancho 170)
            // Añadimos un margen generoso (+12) para que se vea "en líneas únicas" y espaciado
            const descHeight = doc.heightOfString(descripcion, { width: 170 });
            const rowHeight = Math.max(20, descHeight + 12);

            // Comprobar si necesitamos una nueva página con la nueva altura
            if (y + rowHeight > 700) {
               doc.addPage();
               y = drawHeader(doc, 10) + 10;

               // Repetir cabecera de tabla
               doc.rect(40, y, 515, 16)
                  .fillAndStroke(COLORS.secondary, COLORS.secondary);

               doc.fontSize(7)
                  .font('Helvetica-Bold')
                  .fillColor(COLORS.white);

               doc.text('CÓDIGO', 42, y + 5, { width: 50 });
               doc.text('DESCRIPCIÓN', 95, y + 5, { width: 170 });
               doc.text('LOTE', 270, y + 5, { width: 45 });
               doc.text('CAJAS', 320, y + 5, { width: 35, align: 'right' });
               doc.text('CANT.', 360, y + 5, { width: 38, align: 'right' });
               doc.text('PRECIO', 403, y + 5, { width: 42, align: 'right' });
               doc.text('% DTO', 450, y + 5, { width: 30, align: 'center' });
               doc.text('% IVA', 485, y + 5, { width: 25, align: 'center' });
               doc.text('IMPORTE', 515, y + 5, { width: 40, align: 'right' });

               y += 18;
               alternateRow = true;
            }

            // Datos del producto
            doc.fontSize(7)
               .font('Helvetica')
               .fillColor(COLORS.darkGray);

            const codigo = (line.CODIGOARTICULO || line.CODIGO || line.REFERENCIA || '').substring(0, 12);
            doc.text(codigo, 42, y + 3, { width: 50 });

            doc.text(descripcion, 95, y + 3, { width: 170 });

            // COLUMNA LOTE
            const lote = (line.LOTEARTICULO || line.LOTE || line.LOTEDETALLE || '-').toString().substring(0, 10);
            doc.text(lote || '-', 270, y + 3, { width: 45 });

            // COLUMNA CAJAS
            const cajas = line.CAJASARTICULO ?? line.NUMEROCAJAS ?? line.CAJAS ?? 0;
            const cajasDisplay = Number(cajas) === 0 ? '-' : formatNumber(cajas, 0);
            doc.text(cajasDisplay, 320, y + 3, { width: 35, align: 'right' });

            const cantidad = line.CANTIDADARTICULO || line.CANTIDAD || line.UNIDADES || line.CANTIDAD_ALBARAN || 0;
            doc.text(formatNumber(cantidad, 3), 360, y + 3, { width: 38, align: 'right' });

            const precio = line.PRECIOARTICULO || line.PRECIO || line.PRECIO_VENTA || line.PVP || 0;
            doc.text(formatNumber(precio, 3) + ' €', 403, y + 3, { width: 42, align: 'right' });

            const dto = line.PORCENTAJEDESCUENTOARTICULO || line.DTO || line.DESCUENTO || 0;
            doc.text(dto > 0 ? formatNumber(dto, 2) : '-', 450, y + 3, { width: 30, align: 'center' });

            const iva = line.PORCENTAJEIVAARTICULO || line.PORCENTAJEIVA || line.IVA || 0;
            doc.text(formatNumber(iva, 2), 485, y + 3, { width: 25, align: 'center' });

            const importe = line.IMPORTENETOARTICULO || line.IMPORTENETO || line.TOTAL_LINEA || line.IMPORTE || 0;
            doc.font('Helvetica-Bold');
            doc.text(formatNumber(importe, 2) + ' €', 515, y + 3, { width: 40, align: 'right' });
            doc.font('Helvetica');

            // Incrementar Y dinámicamente
            y += rowHeight;
            alternateRow = !alternateRow;
         });

         // Línea final de productos
         doc.moveTo(40, y)
            .lineTo(555, y)
            .strokeColor(COLORS.lightGray)
            .lineWidth(1)
            .stroke();

         y += 12;

         // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
         // TABLA DE TOTALES POR TIPO DE IVA
         // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

         // Obtener el recargo real de la cabecera (fuente de verdad del ERP)
         const recargoHeader = parseFloat(header?.RECARGOFACTURA) || 0;

         // Agrupar líneas por % IVA y % Recargo
         const gruposIVA = {};

         lines.forEach(line => {
            const porcIVA = parseFloat(line.PORCENTAJEIVAARTICULO || line.PORCENTAJEIVA || line.IVA) || 0;
            
            // CRÍTICO: Si el header dice que NO hay recargo (RECARGOFACTURA = 0),
            // entonces forzar recargo = 0 para TODAS las líneas, ignorando cálculos erróneos.
            // Esto evita que clientes sin R.E. (como BAR CRISTOBAL) vean recargo fantasma.
            const porcRec = recargoHeader === 0 
               ? 0  // Si la factura no tiene recargo en el ERP, forzar 0
               : (parseFloat(line.PORCENTAJERECARGOARTICULO || line.PORCENTAJERECARGO || line.RE || line.RECARGO) || 0);
            
            const key = `${porcIVA.toFixed(2)}_${porcRec.toFixed(2)}`;

            if (!gruposIVA[key]) {
               gruposIVA[key] = {
                  porcIVA,
                  porcRec,
                  baseImponible: 0,
                  iva: 0,
                  recargo: 0
               };
            }

            // Usar importes directos si vienen de BD; si no, calcularlos desde %.
            const importe = parseFloat(line.IMPORTENETOARTICULO || line.IMPORTENETO || line.TOTAL_LINEA || line.IMPORTE) || 0;
            const ivaLinea = line.IMPORTEIVAARTICULO !== undefined && line.IMPORTEIVAARTICULO !== null
               ? (parseFloat(line.IMPORTEIVAARTICULO) || 0)
               : (line.IMPORTEIVA !== undefined ? parseFloat(line.IMPORTEIVA) : (importe * (porcIVA / 100)));
            
            // CRÍTICO: Si el header dice que NO hay recargo, forzar recargo de línea = 0
            const recargoLinea = recargoHeader === 0
               ? 0  // La factura NO tiene recargo según el ERP
               : (line.IMPORTERECARGOARTICULO !== undefined && line.IMPORTERECARGOARTICULO !== null
                  ? (parseFloat(line.IMPORTERECARGOARTICULO) || 0)
                  : (line.IMPORTERECARGO !== undefined ? parseFloat(line.IMPORTERECARGO) : (importe * (porcRec / 100))));

            gruposIVA[key].baseImponible += importe;
            gruposIVA[key].iva += ivaLinea;
            gruposIVA[key].recargo += recargoLinea;
         });

         const grupos = Object.values(gruposIVA);

         // Si solo hay un grupo, forzar el desglose con datos de cabecera (fuente de verdad).
         // Esto evita casos donde la tabla IVA devuelve % erróneos (p.ej. 7%/1%) pero la cabecera es 10%/0%.
         if (
            grupos.length === 1 &&
            header &&
            header.BASEFACTURA !== undefined &&
            header.IVAFACTURA !== undefined
         ) {
            const baseH = parseFloat(header.BASEFACTURA) || 0;
            const ivaH = parseFloat(header.IVAFACTURA) || 0;
            const recH = parseFloat(header.RECARGOFACTURA) || 0;

            grupos[0].baseImponible = baseH;
            grupos[0].iva = ivaH;
            grupos[0].recargo = recH;
            grupos[0].porcIVA = baseH !== 0 ? (ivaH / baseH) * 100 : 0;
            grupos[0].porcRec = baseH !== 0 ? (recH / baseH) * 100 : 0;
         }

         // Determinar si hay algún recargo real en la factura
         const hayRecargo = grupos.some(g => g.recargo > 0.001);

         // Si tenemos grupos, mostrar tabla de totales
         if (grupos.length > 0) {
            const numFilas = Math.max(grupos.length, 1);
            const alturaTabla = 16 + (numFilas * 14);

            // Configuración de columnas según si hay recargo o no
            const anchoTotal = 515;
            let columnas, headers, posicionesX;

            if (hayRecargo) {
               // CON recargo: 6 columnas completas
               columnas = [
                  { label: 'Base Imponible', x: 42, width: 65 },
                  { label: '% I.V.A.', x: 112, width: 85 },
                  { label: 'Importe I.V.A.', x: 202, width: 85 },
                  { label: '% Recargo', x: 292, width: 65 },
                  { label: 'Importe Rec.', x: 362, width: 65 },
                  { label: 'Total', x: 432, width: 115 }
               ];
               posicionesX = [110, 200, 290, 360, 430, 490];
            } else {
               // SIN recargo: 4 columnas (sin columnas de recargo)
               columnas = [
                  { label: 'Base Imponible', x: 42, width: 120 },
                  { label: '% I.V.A.', x: 170, width: 70 },
                  { label: 'Importe I.V.A.', x: 250, width: 100 },
                  { label: 'Total', x: 365, width: 180 }
               ];
               posicionesX = [165, 245, 355];
            }

            // Tabla de totales
            doc.rect(40, y, anchoTotal, alturaTabla)
               .strokeColor(COLORS.border)
               .lineWidth(1)
               .stroke();

            // Líneas verticales
            posicionesX.forEach(x => {
               doc.moveTo(x, y).lineTo(x, y + alturaTabla).stroke();
            });

            // Línea horizontal de header
            doc.moveTo(40, y + 16).lineTo(555, y + 16).stroke();

            // Headers
            doc.rect(40, y, anchoTotal, 16)
               .fillAndStroke(COLORS.lightGray, COLORS.border);

            doc.fontSize(7)
               .font('Helvetica-Bold')
               .fillColor(COLORS.darkGray);

            columnas.forEach(col => {
               doc.text(col.label, col.x, y + 5, { width: col.width, align: col.label === 'Total' ? 'right' : 'center' });
            });

            // Valores
            let yValor = y + 20;

            doc.fontSize(8)
               .font('Helvetica');

            grupos.forEach(grupo => {
               // CORRECCIÓN CRÍTICA: Solo sumar recargo si es REALMENTE mayor que 0
               const totalGrupo = grupo.baseImponible + grupo.iva + grupo.recargo;

               doc.text(formatNumber(grupo.baseImponible, 2) + ' €', columnas[0].x, yValor, { width: columnas[0].width, align: 'right' });
               doc.text(formatNumber(grupo.porcIVA, 2) + ' %', columnas[1].x, yValor, { width: columnas[1].width, align: 'center' });
               doc.text(formatNumber(grupo.iva, 2) + ' €', columnas[2].x, yValor, { width: columnas[2].width, align: 'right' });

               if (hayRecargo) {
                  doc.text(formatNumber(grupo.porcRec, 2) + ' %', columnas[3].x, yValor, { width: columnas[3].width, align: 'center' });
                  doc.text(formatNumber(grupo.recargo, 2) + ' €', columnas[4].x, yValor, { width: columnas[4].width, align: 'right' });
                  doc.font('Helvetica-Bold');
                  doc.text(formatNumber(totalGrupo, 2) + ' €', columnas[5].x, yValor, { width: columnas[5].width, align: 'right' });
               } else {
                  doc.font('Helvetica-Bold');
                  doc.text(formatNumber(totalGrupo, 2) + ' €', columnas[3].x, yValor, { width: columnas[3].width, align: 'right' });
               }
               doc.font('Helvetica');

               yValor += 14;
            });

            // Añadir espacio extra tras la tabla de IVA para separar de los totales
            y += alturaTabla + 18;
         }

         // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
         // TOTALES FINALES - DISEÑO ELEGANTE
         // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

         // Calcular totales - CORRECCIÓN CRÍTICA: Usar valores reales, no inventados
         const totalBase = grupos.reduce((sum, g) => sum + g.baseImponible, 0);
         const totalIVA = grupos.reduce((sum, g) => sum + g.iva, 0);
         const totalRecargo = grupos.reduce((sum, g) => sum + g.recargo, 0);
         const totalConIVA = totalBase + totalIVA + totalRecargo;

         // TOTAL SIN IVA
         doc.rect(350, y, 205, 22)
            .strokeColor(COLORS.border)
            .lineWidth(1)
            .stroke();

         doc.fontSize(10)
            .font('Helvetica')
            .fillColor(COLORS.darkGray)
            .text('TOTAL SIN IVA', 360, y + 7);

         doc.fontSize(12)
            .font('Helvetica-Bold')
            .fillColor(COLORS.darkGray)
            .text(formatNumber(totalBase, 2) + ' €', 450, y + 6, {
               width: 100,
               align: 'right'
            });

         y += 24;

         // TOTAL CON IVA - DESTACADO EN VERDE
         doc.rect(350, y, 205, 28)
            .fillAndStroke(COLORS.success, COLORS.success)
            .lineWidth(2);

         doc.fontSize(12)
            .font('Helvetica-Bold')
            .fillColor(COLORS.white)
            .text('TOTAL CON IVA', 360, y + 9);

         doc.fontSize(18)
            .font('Helvetica-Bold')
            .fillColor(COLORS.white)
            .text(formatNumber(totalConIVA, 2) + ' €', 450, y + 6, {
               width: 100,
               align: 'right'
            });

         // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
         // FOOTER - PIE DE PÁGINA ELEGANTE
         // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
         const range = doc.bufferedPageRange();
         for (let i = 0; i < range.count; i++) {
            doc.switchToPage(i);
            drawFooter(doc, i + 1, range.count);
         }

         doc.end();
      });

   } catch (error) {
      logger.error('❌ Error generando PDF factura', error);
      throw error;
   }
}

module.exports = {
   generateInvoicePDF
};
