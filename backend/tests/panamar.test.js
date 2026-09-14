/**
 * TESTS PANAMAR SERVICE & CONTROLLER
 * ====================================
 * Tests unitarios para la lógica PANAMAR:
 * - Service: isPanamarClient
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
