/**
 * RUTAS DE FACTURAS
 * ==================
 * Endpoints para operaciones con facturas
 */

const express = require('express');
const router = express.Router();
const facturaController = require('../controllers/facturaController');
const { authenticateToken } = require('../middleware/authMiddleware');

/**
 * Todas las rutas de facturas requieren autenticación
 */
router.use(authenticateToken);

/**
 * GET /api/facturas
 * Listar facturas del cliente con filtros opcionales
 */
router.get('/', facturaController.getInvoices);

/**
 * GET /api/facturas/resumen
 * Obtener resumen de facturación
 */
router.get('/resumen', facturaController.getInvoiceSummary);

/**
 * GET /api/facturas/ejercicios
 * Obtener años disponibles
 */
router.get('/ejercicios', facturaController.getAvailableYears);

/**
 * GET /api/facturas/productos
 * Obtener productos comprados
 */
router.get('/productos', facturaController.getClientProducts);

/**
 * GET /api/facturas/:serie/:numero/:ejercicio
 * Obtener detalle de una factura específica
 */
router.get('/:serie/:numero/:ejercicio', facturaController.getInvoiceDetail);

/**
 * GET /api/facturas/:serie/:numero/:ejercicio/pdf
 * Descargar PDF de una factura
 */
router.get('/:serie/:numero/:ejercicio/pdf', facturaController.downloadInvoicePDF);

module.exports = router;
