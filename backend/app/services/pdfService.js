/**
 * SERVICIO DE GENERACIÓN DE PDFs
 * ================================
 * Genera PDFs de facturas con formato profesional
 */

const PDFDocument = require('pdfkit');
const logger = require('../utils/logger');

/**
 * Generar PDF de factura
 */
async function generateInvoicePDF(facturaData) {
  try {
    logger.info('📄 Generando PDF de factura', { 
      serie: facturaData.header.SERIEFACTURA,
      numero: facturaData.header.NUMEROFACTURA 
    });
    
    return new Promise((resolve, reject) => {
      const doc = new PDFDocument({ 
        size: 'A4',
        margin: 50,
        info: {
          Title: `Factura ${facturaData.header.SERIEFACTURA}-${facturaData.header.NUMEROFACTURA}`,
          Author: 'Granja Mari Pepa',
          Subject: 'Factura',
          Keywords: 'factura, granja, mari pepa'
        }
      });
      
      const chunks = [];
      
      doc.on('data', chunk => chunks.push(chunk));
      doc.on('end', () => {
        const pdfBuffer = Buffer.concat(chunks);
        logger.success('✅ PDF generado correctamente');
        resolve(pdfBuffer);
      });
      doc.on('error', reject);
      
      // Header - Logo y datos de empresa
      doc.fontSize(20)
         .font('Helvetica-Bold')
         .text('GRANJA MARI PEPA', { align: 'center' })
         .moveDown(0.5);
      
      doc.fontSize(10)
         .font('Helvetica')
         .text('CIF: B12345678', { align: 'center' })
         .text('Calle Principal, 123', { align: 'center' })
         .text('12345 Ciudad, Provincia', { align: 'center' })
         .text('Tel: 123 456 789', { align: 'center' })
         .moveDown(2);
      
      // Número de factura
      doc.fontSize(16)
         .font('Helvetica-Bold')
         .text(`FACTURA ${facturaData.header.SERIEFACTURA}-${facturaData.header.NUMEROFACTURA}`, { align: 'right' })
         .fontSize(10)
         .font('Helvetica')
         .text(`Fecha: ${formatDate(facturaData.header.FECHAFACTURA)}`, { align: 'right' })
         .text(`Ejercicio: ${facturaData.header.EJERCICIOFACTURA}`, { align: 'right' })
         .moveDown(2);
      
      // Datos del cliente
      doc.fontSize(12)
         .font('Helvetica-Bold')
         .text('DATOS DEL CLIENTE')
         .moveDown(0.5);
      
      doc.fontSize(10)
         .font('Helvetica')
         .text(`Cliente: ${facturaData.header.NOMBRECLIENTEFACTURA}`)
         .text(`CIF/NIF: ${facturaData.header.CIFCLIENTEFACTURA || 'N/A'}`)
         .text(`Dirección: ${facturaData.header.DIRECCIONCLIENTEFACTURA || ''}`)
         .text(`${facturaData.header.CPCLIENTEFACTURA || ''} ${facturaData.header.POBLACIONCLIENTEFACTURA || ''} (${facturaData.header.PROVINCIACLIENTEFACTURA || ''})`)
         .moveDown(2);
      
      // Tabla de productos
      doc.fontSize(12)
         .font('Helvetica-Bold')
         .text('DETALLE DE PRODUCTOS')
         .moveDown(0.5);
      
      // Cabecera de tabla
      const tableTop = doc.y;
      const col1 = 50;
      const col2 = 100;
      const col3 = 300;
      const col4 = 380;
      const col5 = 440;
      const col6 = 500;
      
      doc.fontSize(9)
         .font('Helvetica-Bold')
         .text('Código', col1, tableTop)
         .text('Descripción', col2, tableTop)
         .text('Cant.', col3, tableTop)
         .text('Precio', col4, tableTop)
         .text('Dto.%', col5, tableTop)
         .text('Total', col6, tableTop);
      
      doc.moveTo(col1, tableTop + 15)
         .lineTo(550, tableTop + 15)
         .stroke();
      
      // Líneas de productos
      let yPos = tableTop + 25;
      
      facturaData.lines.forEach(line => {
        if (yPos > 700) {
          doc.addPage();
          yPos = 50;
        }
        
        const total = (line.CANTIDADARTICULO * line.PRECIOARTICULO * (1 - line.PORCENTAJEDESCUENTOARTICULO / 100)).toFixed(2);
        
        doc.fontSize(8)
           .font('Helvetica')
           .text(line.CODIGOARTICULO, col1, yPos, { width: 50 })
           .text(line.DESCRIPCIONARTICULO, col2, yPos, { width: 195 })
           .text(line.CANTIDADARTICULO.toString(), col3, yPos)
           .text(line.PRECIOARTICULO.toFixed(2) + '€', col4, yPos)
           .text(line.PORCENTAJEDESCUENTOARTICULO.toFixed(0) + '%', col5, yPos)
           .text(total + '€', col6, yPos);
        
        yPos += 20;
      });
      
      // Línea separadora
      doc.moveTo(col1, yPos + 10)
         .lineTo(550, yPos + 10)
         .stroke();
      
      yPos += 25;
      
      // Totales
      doc.fontSize(10)
         .font('Helvetica')
         .text('Base Imponible:', 400, yPos)
         .text(`${facturaData.header.BASEFACTURA.toFixed(2)} €`, 500, yPos, { align: 'right' });
      
      yPos += 20;
      doc.text('IVA:', 400, yPos)
         .text(`${facturaData.header.IVAFACTURA.toFixed(2)} €`, 500, yPos, { align: 'right' });
      
      if (facturaData.header.RECARGOFACTURA > 0) {
        yPos += 20;
        doc.text('Recargo:', 400, yPos)
           .text(`${facturaData.header.RECARGOFACTURA.toFixed(2)} €`, 500, yPos, { align: 'right' });
      }
      
      yPos += 20;
      doc.fontSize(12)
         .font('Helvetica-Bold')
         .text('TOTAL:', 400, yPos)
         .text(`${facturaData.header.TOTALFACTURA.toFixed(2)} €`, 500, yPos, { align: 'right' });
      
      // Observaciones
      if (facturaData.header.OBSERVACIONESFACTURA) {
        yPos += 40;
        doc.fontSize(10)
           .font('Helvetica-Bold')
           .text('Observaciones:')
           .moveDown(0.3)
           .font('Helvetica')
           .fontSize(9)
           .text(facturaData.header.OBSERVACIONESFACTURA, { width: 500 });
      }
      
      // Footer
      doc.fontSize(8)
         .text('Gracias por su confianza', 50, 750, { align: 'center' });
      
      doc.end();
    });
  } catch (error) {
    logger.error('❌ Error generando PDF', error);
    throw error;
  }
}

/**
 * Formatear fecha
 */
function formatDate(date) {
  if (!date) return 'N/A';
  
  const d = new Date(date);
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  
  return `${day}/${month}/${year}`;
}

module.exports = {
  generateInvoicePDF
};
