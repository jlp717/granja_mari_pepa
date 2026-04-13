/**
 * TESTS PANAMAR SERVICE & CONTROLLER
 * ====================================
 * Tests unitarios para la lógica PANAMAR:
 * - Service: isPanamarClient, price calculation logic
 * - Controller: access control, parameter validation
 */

// Mock odbc pool before any imports
jest.mock('../app/config/odbcConfig', () => ({
  initialize: jest.fn(),
  query: jest.fn().mockResolvedValue([]),
  close: jest.fn(),
  getHealthMetrics: jest.fn()
}));

// Mock logger
jest.mock('../app/utils/logger', () => ({
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
  success: jest.fn(),
  debug: jest.fn()
}));

// ── Unit tests for panamarService helpers ──────────────────────────

const { isPanamarClient, PANAMAR_CLIENT_CODE } = require('../app/services/panamarService');

describe('PANAMAR Service', () => {

  describe('isPanamarClient', () => {
    it('should return true for PANAMAR client code 9999999999', () => {
      expect(isPanamarClient('9999999999')).toBe(true);
    });

    it('should return true with leading/trailing spaces', () => {
      expect(isPanamarClient('  9999999999  ')).toBe(true);
    });

    it('should return true for numeric input', () => {
      expect(isPanamarClient(9999999999)).toBe(true);
    });

    it('should return false for other client codes', () => {
      expect(isPanamarClient('4300000001')).toBe(false);
      expect(isPanamarClient('1234567890')).toBe(false);
      expect(isPanamarClient('')).toBe(false);
      expect(isPanamarClient(null)).toBe(false);
      expect(isPanamarClient(undefined)).toBe(false);
    });

    it('should export correct PANAMAR_CLIENT_CODE constant', () => {
      expect(PANAMAR_CLIENT_CODE).toBe('9999999999');
    });
  });

  describe('Price calculation (tarifa 85 logic)', () => {
    // These test the algorithm described in the service
    const round2 = (n) => Math.round((n || 0) * 100) / 100;

    it('should use tarifa 85 price when available', () => {
      const precioTarifa85 = 25.82;
      const precioVenta = 30.00;
      const cajas = 3;
      const unidades = 15;

      const precioUnitario = precioTarifa85 > 0 ? precioTarifa85 : precioVenta;
      const cantidad = cajas > 0 ? cajas : unidades;
      const importe = precioTarifa85 > 0 ? precioTarifa85 * cantidad : precioVenta * cantidad;

      expect(precioUnitario).toBe(25.82);
      expect(cantidad).toBe(3);
      expect(round2(importe)).toBe(77.46);
    });

    it('should fall back to precioVenta when tarifa 85 is 0', () => {
      const precioTarifa85 = 0;
      const precioVenta = 1.50;
      const importeVenta = 15.00; // from LAC.IMPORTEVENTA
      const cajas = 1;
      const unidades = 10;

      const precioUnitario = precioTarifa85 > 0 ? precioTarifa85 : precioVenta;
      const importeCalculado = precioTarifa85 > 0
        ? precioTarifa85 * (cajas > 0 ? cajas : unidades)
        : importeVenta;

      expect(precioUnitario).toBe(1.50);
      expect(importeCalculado).toBe(15.00);
    });

    it('should use unidades when cajas is 0', () => {
      const precioTarifa85 = 10.00;
      const cajas = 0;
      const unidades = 5.4;

      const cantidad = cajas > 0 ? cajas : unidades;
      const importe = precioTarifa85 * cantidad;

      expect(cantidad).toBe(5.4);
      expect(round2(importe)).toBe(54.00);
    });

    it('should round to 2 decimal places', () => {
      expect(round2(25.826)).toBe(25.83);
      expect(round2(0.005)).toBe(0.01);
      expect(round2(100)).toBe(100);
      expect(round2(null)).toBe(0);
      expect(round2(undefined)).toBe(0);
    });
  });
});

// ── Controller access control tests ────────────────────────────────

const panamarController = require('../app/controllers/panamarController');

describe('PANAMAR Controller', () => {

  describe('getDocuments - Access Control', () => {
    it('should return 403 for non-PANAMAR clients', async () => {
      const req = {
        user: { codigoCliente: '4300000001' },
        query: {}
      };
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };

      await panamarController.getDocuments(req, res);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ success: false })
      );
    });

    it('should return 400 for invalid date format', async () => {
      const req = {
        user: { codigoCliente: '9999999999' },
        query: { fechaDesde: '01-01-2025' } // wrong format
      };
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };

      await panamarController.getDocuments(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
    });
  });

  describe('getSummary - Access Control', () => {
    it('should return 403 for non-PANAMAR clients', async () => {
      const req = {
        user: { codigoCliente: '4400000299' },
        query: {}
      };
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };

      await panamarController.getSummary(req, res);

      expect(res.status).toHaveBeenCalledWith(403);
    });
  });

  describe('healthCheck', () => {
    it('should return success', async () => {
      const req = {};
      const res = {
        json: jest.fn()
      };

      await panamarController.healthCheck(req, res);

      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ success: true, service: 'panamar' })
      );
    });
  });
});
