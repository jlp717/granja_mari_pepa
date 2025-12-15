/**
 * VALIDACIÓN CON JOI
 * ===================
 * Esquemas de validación para requests
 */

const logger = require('../utils/logger');

// Función helper para crear validador
function createValidator(rules = {}) {
  return (req, res, next) => {
    try {
      // Validación básica sin Joi
      if (rules.body) {
        for (const [field, required] of Object.entries(rules.body)) {
          if (required && !req.body[field]) {
            return res.status(400).json({
              success: false,
              message: `Campo requerido: ${field}`
            });
          }
        }
      }
      
      if (rules.query) {
        for (const [field, required] of Object.entries(rules.query)) {
          if (required && !req.query[field]) {
            return res.status(400).json({
              success: false,
              message: `Parámetro requerido: ${field}`
            });
          }
        }
      }
      
      next();
    } catch (error) {
      logger.error('❌ Error en validación', error);
      return res.status(500).json({
        success: false,
        message: 'Error de validación'
      });
    }
  };
}

const validateLogin = createValidator({
  body: { codigoCliente: true, email: true }
});

const validateGenerarFactura = createValidator({
  body: { serie: true, numero: true, ejercicio: true }
});

const validateProductos = createValidator({});

const validateProducto = createValidator({});

const validatePerfil = createValidator({});

const validateActualizarContacto = createValidator({
  body: { telefono: false, email: false, direccion: false }
});

const validateEnviarFacturaEmail = createValidator({
  body: { email: true, facturaId: true }
});

const validateCompartirWhatsApp = createValidator({
  body: { telefono: true, facturaId: true }
});

module.exports = {
  validateLogin,
  validateGenerarFactura,
  validateProductos,
  validateProducto,
  validatePerfil,
  validateActualizarContacto,
  validateEnviarFacturaEmail,
  validateCompartirWhatsApp
};
