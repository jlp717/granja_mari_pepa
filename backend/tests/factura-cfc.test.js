jest.mock('../app/config/odbcConfig', () => ({
  query: jest.fn()
}));

jest.mock('../app/utils/logger', () => ({
  debug: jest.fn(),
  error: jest.fn(),
  info: jest.fn(),
  success: jest.fn(),
  warn: jest.fn()
}));

const odbcPool = require('../app/config/odbcConfig');
const databaseService = require('../app/services/databaseService');
const pdfService = require('../app/services/pdfService');

describe('facturas con cabecera fiscal CFC', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('getInvoiceDetail usa CFC y conserva los importes oficiales de F-4306', async () => {
    odbcPool.query
      .mockResolvedValueOnce([
        {
          SERIEFACTURA: 'F',
          NUMEROFACTURA: 4306,
          EJERCICIOFACTURA: 2026,
          CODIGOCLIENTEFACTURA: '4300010400',
          CIFCLIENTEFACTURA: '23331620Y',
          BASEFACTURA: 3302.03,
          IVAFACTURA: 316.41,
          RECARGOFACTURA: 0,
          TOTALFACTURA: 3618.44,
          IMPORTEBASEIMPONIBLE1: 2987.13,
          PORCENTAJEIVA1: 10,
          IMPORTEIVA1: 298.71,
          IMPORTEBASEIMPONIBLE3: 229.9,
          PORCENTAJEIVA3: 4,
          IMPORTEIVA3: 9.2,
          IMPORTEBASEIMPONIBLE5: 85,
          PORCENTAJEIVA5: 10,
          IMPORTEIVA5: 8.5
        }
      ])
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([]);

    const factura = await databaseService.getInvoiceDetail('F', 4306, 2026, '4300010400');
    const [headerSql, headerParams] = odbcPool.query.mock.calls[0];

    expect(headerSql).toContain('FROM DSEDAC.CFC CFC');
    expect(headerSql).toContain('CFC.IMPORTEBASEIMPONIBLE5');
    expect(headerSql).not.toContain('SUM(CAC.IMPORTETOTAL)');
    expect(headerParams).toEqual(['F', 4306, 2026, 'F', 4306, 2026]);
    expect(factura.header.BASEFACTURA).toBe(3302.03);
    expect(factura.header.IVAFACTURA).toBe(316.41);
    expect(factura.header.TOTALFACTURA).toBe(3618.44);
  });

  test('el desglose del PDF incluye el tramo fiscal 5 de cabecera', () => {
    const grupos = pdfService.__private.buildHeaderTaxGroups({
      IMPORTEBASEIMPONIBLE1: 2987.13,
      PORCENTAJEIVA1: 10,
      IMPORTEIVA1: 298.71,
      IMPORTEBASEIMPONIBLE3: 229.9,
      PORCENTAJEIVA3: 4,
      IMPORTEIVA3: 9.2,
      IMPORTEBASEIMPONIBLE5: 85,
      PORCENTAJEIVA5: 10,
      IMPORTEIVA5: 8.5
    });

    expect(grupos).toHaveLength(3);
    expect(grupos).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ baseImponible: 85, porcIVA: 10, iva: 8.5 })
      ])
    );

    const totalBase = grupos.reduce((sum, group) => sum + group.baseImponible, 0);
    const totalIva = grupos.reduce((sum, group) => sum + group.iva, 0);

    expect(Number(totalBase.toFixed(2))).toBe(3302.03);
    expect(Number(totalIva.toFixed(2))).toBe(316.41);
  });
});
