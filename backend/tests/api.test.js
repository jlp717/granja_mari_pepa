/**
 * TESTS DE INTEGRACIÓN DE LA API
 * Ejemplo básico usando Jest y Supertest
 */

const request = require('supertest');
const app = require('../server');

describe('API de Facturación - Tests de Integración', () => {

  describe('GET /health', () => {
    it('debe retornar status healthy', async () => {
      const response = await request(app)
        .get('/health')
        .expect('Content-Type', /json/)
        .expect(200);

      expect(response.body).toHaveProperty('status');
      expect(response.body.status).toBe('healthy');
      expect(response.body).toHaveProperty('services');
      expect(response.body.services).toHaveProperty('database');
      expect(response.body.services).toHaveProperty('cache');
    });
  });

  describe('GET /api/metrics', () => {
    it('debe retornar métricas del sistema', async () => {
      const response = await request(app)
        .get('/api/metrics')
        .expect('Content-Type', /json/)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('metrics');
      expect(response.body.metrics).toHaveProperty('database');
      expect(response.body.metrics).toHaveProperty('cache');
      expect(response.body.metrics).toHaveProperty('system');
    });
  });

  describe('POST /api/generar-factura', () => {
    it('debe rechazar request sin parámetros requeridos', async () => {
      const response = await request(app)
        .post('/api/generar-factura')
        .send({})
        .expect('Content-Type', /json/)
        .expect(400);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('error');
      expect(response.body).toHaveProperty('details');
    });

    it('debe rechazar request con parámetros inválidos', async () => {
      const response = await request(app)
        .post('/api/generar-factura')
        .send({
          subempresa: 'INVALID_TOO_LONG_SUBEMPRESA',
          ejercicio: 1999, // Muy antiguo
          serie: 'A',
          terminal: -1, // Negativo
          numero_albaran: 0 // No positivo
        })
        .expect('Content-Type', /json/)
        .expect(400);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body.details).toBeInstanceOf(Array);
    });

    it('debe generar PDF con parámetros válidos (mock)', async () => {
      // NOTA: Este test requiere datos reales en la BD
      // Descomentar y ajustar según datos disponibles

      /*
      const response = await request(app)
        .post('/api/generar-factura')
        .send({
          subempresa: 'GMP',
          ejercicio: 2023,
          serie: 'A',
          terminal: 0,
          numero_albaran: 1
        })
        .expect(200);

      expect(response.headers['content-type']).toBe('application/pdf');
      expect(response.headers['content-disposition']).toContain('attachment');
      expect(response.body).toBeInstanceOf(Buffer);
      expect(response.body.length).toBeGreaterThan(0);
      */
    });
  });

  describe('DELETE /api/cache/factura', () => {
    it('debe invalidar cache de factura específica', async () => {
      const response = await request(app)
        .delete('/api/cache/factura')
        .send({
          subempresa: 'GMP',
          ejercicio: 2023,
          serie: 'A',
          terminal: 0,
          numero_albaran: 1
        })
        .expect('Content-Type', /json/)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('message');
    });
  });

  describe('DELETE /api/cache/all', () => {
    it('debe invalidar todo el cache', async () => {
      const response = await request(app)
        .delete('/api/cache/all')
        .expect('Content-Type', /json/)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
    });
  });

  describe('Rutas no existentes', () => {
    it('debe retornar 404 para rutas no encontradas', async () => {
      const response = await request(app)
        .get('/ruta-inexistente')
        .expect('Content-Type', /json/)
        .expect(404);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('error', 'Ruta no encontrada');
    });
  });
});
